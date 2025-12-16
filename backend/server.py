from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, EmailStr, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt
import asyncio
import resend

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Resend setup
resend.api_key = os.environ.get('RESEND_API_KEY', '')
SENDER_EMAIL = os.environ.get('SENDER_EMAIL', 'onboarding@resend.dev')

# JWT settings
JWT_SECRET = os.environ.get('JWT_SECRET', 'your-secret-key-change-in-production')
JWT_ALGORITHM = 'HS256'
JWT_EXPIRATION_HOURS = 24 * 7  # 7 days

security = HTTPBearer()

app = FastAPI()
api_router = APIRouter(prefix="/api")

logger = logging.getLogger(__name__)

# ============ MODELS ============

class UserBase(BaseModel):
    email: EmailStr
    name: str
    role: str = "mentorada"  # mentorada or admin

class UserCreate(UserBase):
    password: str

class User(UserBase):
    user_id: str
    created_at: datetime

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class LoginResponse(BaseModel):
    token: str
    user: User

class MentoriaBase(BaseModel):
    name: str
    description: Optional[str] = None

class MentoriaCreate(MentoriaBase):
    pass

class Mentoria(MentoriaBase):
    mentoria_id: str
    created_at: datetime

class MentoradaMentoriaBase(BaseModel):
    user_id: str
    mentoria_id: str
    start_date: datetime
    status: str = "ativa"  # ativa, concluida, pausada
    diagnostico_pdf_url: Optional[str] = None
    diagnostico_pontos_chave: Optional[str] = None
    diagnostico_foco_atual: Optional[str] = None

class MentoradaMentoriaCreate(MentoradaMentoriaBase):
    pass

class MentoradaMentoria(MentoradaMentoriaBase):
    mentorada_mentoria_id: str
    created_at: datetime

class SessaoBase(BaseModel):
    mentorada_mentoria_id: str
    session_number: int
    tema: str
    session_date: datetime
    video_url: Optional[str] = None
    audio_url: Optional[str] = None
    resumo: Optional[str] = None

class SessaoCreate(SessaoBase):
    pass

class Sessao(SessaoBase):
    sessao_id: str
    created_at: datetime

class TarefaBase(BaseModel):
    mentorada_mentoria_id: str
    descricao: str
    status: str = "pendente"  # pendente, concluida
    reflexao: Optional[str] = None
    due_date: Optional[datetime] = None

class TarefaCreate(TarefaBase):
    pass

class Tarefa(TarefaBase):
    tarefa_id: str
    created_at: datetime

class MensagemBase(BaseModel):
    mentorada_user_id: str
    sender_user_id: str
    message: str

class MensagemCreate(MensagemBase):
    pass

class Mensagem(MensagemBase):
    mensagem_id: str
    created_at: datetime
    read: bool = False

class FinanceiroBase(BaseModel):
    mentorada_mentoria_id: str
    valor_total: float
    forma_pagamento: str
    numero_parcelas: int
    observacoes: Optional[str] = None

class FinanceiroCreate(FinanceiroBase):
    pass

class Financeiro(FinanceiroBase):
    financeiro_id: str
    created_at: datetime

class ParcelaBase(BaseModel):
    financeiro_id: str
    numero_parcela: int
    valor: float
    data_vencimento: datetime
    status: str = "pendente"  # pendente, paga
    data_pagamento: Optional[datetime] = None

class ParcelaCreate(ParcelaBase):
    pass

class Parcela(ParcelaBase):
    parcela_id: str
    created_at: datetime

class ProdutoBase(BaseModel):
    name: str
    description: Optional[str] = None
    content_url: Optional[str] = None

class ProdutoCreate(ProdutoBase):
    pass

class Produto(ProdutoBase):
    produto_id: str
    created_at: datetime

class UserProdutoBase(BaseModel):
    user_id: str
    produto_id: str

class UserProdutoCreate(UserProdutoBase):
    pass

class UserProduto(UserProdutoBase):
    user_produto_id: str
    created_at: datetime

class EmailRequest(BaseModel):
    recipient_email: EmailStr
    subject: str
    html_content: str

# ============ AUTH HELPERS ============

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_token(user_id: str) -> str:
    expiration = datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    payload = {
        'user_id': user_id,
        'exp': expiration
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expirado")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Token inválido")

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    token = credentials.credentials
    payload = decode_token(token)
    user_id = payload.get('user_id')
    user = await db.users.find_one({'user_id': user_id}, {'_id': 0})
    if not user:
        raise HTTPException(status_code=404, detail="Usuária não encontrada")
    return user

async def get_admin_user(current_user: dict = Depends(get_current_user)) -> dict:
    if current_user.get('role') != 'admin':
        raise HTTPException(status_code=403, detail="Acesso negado. Apenas administradoras.")
    return current_user

# ============ EMAIL HELPER ============

async def send_email_async(recipient: str, subject: str, html: str):
    """Send email asynchronously"""
    if not resend.api_key:
        logger.warning("RESEND_API_KEY not configured, skipping email")
        return
    
    params = {
        "from": SENDER_EMAIL,
        "to": [recipient],
        "subject": subject,
        "html": html
    }
    try:
        await asyncio.to_thread(resend.Emails.send, params)
        logger.info(f"Email sent to {recipient}")
    except Exception as e:
        logger.error(f"Failed to send email: {str(e)}")

# ============ AUTH ROUTES ============

@api_router.post("/auth/register", response_model=User)
async def register(user_data: UserCreate):
    # Check if user exists
    existing = await db.users.find_one({'email': user_data.email}, {'_id': 0})
    if existing:
        raise HTTPException(status_code=400, detail="Email já cadastrado")
    
    user_id = str(uuid.uuid4())
    hashed_pw = hash_password(user_data.password)
    
    user_doc = {
        'user_id': user_id,
        'email': user_data.email,
        'name': user_data.name,
        'role': user_data.role,
        'password': hashed_pw,
        'created_at': datetime.now(timezone.utc).isoformat()
    }
    
    await db.users.insert_one(user_doc)
    
    # Send welcome email
    html = f"""
    <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2 style="color: #DAA520;">Bem-vinda ao Instituto Jussara Kaisel!</h2>
        <p>Olá {user_data.name},</p>
        <p>Seu cadastro foi realizado com sucesso.</p>
        <p>Agora você pode acessar o portal e começar sua jornada de transformação.</p>
        <br>
        <p>Com carinho,<br>Equipe Instituto Jussara Kaisel</p>
    </div>
    """
    await send_email_async(user_data.email, "Bem-vinda ao Instituto Jussara Kaisel", html)
    
    return User(**{k: v for k, v in user_doc.items() if k != 'password'})

@api_router.post("/auth/login", response_model=LoginResponse)
async def login(login_data: LoginRequest):
    user = await db.users.find_one({'email': login_data.email}, {'_id': 0})
    if not user or not verify_password(login_data.password, user['password']):
        raise HTTPException(status_code=401, detail="Email ou senha incorretos")
    
    token = create_token(user['user_id'])
    user_data = {k: v for k, v in user.items() if k != 'password'}
    
    return LoginResponse(token=token, user=User(**user_data))

@api_router.get("/auth/me", response_model=User)
async def get_me(current_user: dict = Depends(get_current_user)):
    return User(**current_user)

# ============ MENTORIAS ROUTES ============

@api_router.post("/mentorias", response_model=Mentoria)
async def create_mentoria(mentoria: MentoriaCreate, admin: dict = Depends(get_admin_user)):
    mentoria_id = str(uuid.uuid4())
    doc = {
        'mentoria_id': mentoria_id,
        **mentoria.model_dump(),
        'created_at': datetime.now(timezone.utc).isoformat()
    }
    await db.mentorias.insert_one(doc)
    return Mentoria(**doc)

@api_router.get("/mentorias", response_model=List[Mentoria])
async def list_mentorias(current_user: dict = Depends(get_current_user)):
    mentorias = await db.mentorias.find({}, {'_id': 0}).to_list(1000)
    return [Mentoria(**m) for m in mentorias]

@api_router.get("/mentorias/{mentoria_id}", response_model=Mentoria)
async def get_mentoria(mentoria_id: str, current_user: dict = Depends(get_current_user)):
    mentoria = await db.mentorias.find_one({'mentoria_id': mentoria_id}, {'_id': 0})
    if not mentoria:
        raise HTTPException(status_code=404, detail="Mentoria não encontrada")
    return Mentoria(**mentoria)

# ============ MENTORADA MENTORIA ROUTES ============

@api_router.post("/mentorada-mentorias", response_model=MentoradaMentoria)
async def create_mentorada_mentoria(data: MentoradaMentoriaCreate, admin: dict = Depends(get_admin_user)):
    mentorada_mentoria_id = str(uuid.uuid4())
    doc = {
        'mentorada_mentoria_id': mentorada_mentoria_id,
        **data.model_dump(),
        'start_date': data.start_date.isoformat(),
        'created_at': datetime.now(timezone.utc).isoformat()
    }
    await db.mentorada_mentorias.insert_one(doc)
    
    # Send notification email
    user = await db.users.find_one({'user_id': data.user_id}, {'_id': 0})
    mentoria = await db.mentorias.find_one({'mentoria_id': data.mentoria_id}, {'_id': 0})
    if user and mentoria:
        html = f"""
        <div style="font-family: Arial, sans-serif; padding: 20px;">
            <h2 style="color: #DAA520;">Nova Mentoria Atribuída!</h2>
            <p>Olá {user['name']},</p>
            <p>Você foi inscrita na mentoria: <strong>{mentoria['name']}</strong></p>
            <p>Data de início: {data.start_date.strftime('%d/%m/%Y')}</p>
            <p>Acesse o portal para ver mais detalhes.</p>
            <br>
            <p>Com carinho,<br>Equipe Instituto Jussara Kaisel</p>
        </div>
        """
        await send_email_async(user['email'], "Nova Mentoria Atribuída", html)
    
    return MentoradaMentoria(**doc)

@api_router.get("/mentorada-mentorias/my", response_model=List[MentoradaMentoria])
async def get_my_mentorias(current_user: dict = Depends(get_current_user)):
    mentorias = await db.mentorada_mentorias.find({'user_id': current_user['user_id']}, {'_id': 0}).to_list(1000)
    return [MentoradaMentoria(**m) for m in mentorias]

@api_router.get("/mentorada-mentorias/{mentorada_mentoria_id}", response_model=MentoradaMentoria)
async def get_mentorada_mentoria(mentorada_mentoria_id: str, current_user: dict = Depends(get_current_user)):
    mentoria = await db.mentorada_mentorias.find_one({'mentorada_mentoria_id': mentorada_mentoria_id}, {'_id': 0})
    if not mentoria:
        raise HTTPException(status_code=404, detail="Mentoria não encontrada")
    
    # Check permission
    if current_user['role'] != 'admin' and mentoria['user_id'] != current_user['user_id']:
        raise HTTPException(status_code=403, detail="Acesso negado")
    
    return MentoradaMentoria(**mentoria)

@api_router.put("/mentorada-mentorias/{mentorada_mentoria_id}", response_model=MentoradaMentoria)
async def update_mentorada_mentoria(mentorada_mentoria_id: str, data: MentoradaMentoriaCreate, current_user: dict = Depends(get_current_user)):
    existing = await db.mentorada_mentorias.find_one({'mentorada_mentoria_id': mentorada_mentoria_id}, {'_id': 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Mentoria não encontrada")
    
    # Check permission
    if current_user['role'] != 'admin' and existing['user_id'] != current_user['user_id']:
        raise HTTPException(status_code=403, detail="Acesso negado")
    
    update_data = data.model_dump()
    update_data['start_date'] = data.start_date.isoformat()
    
    await db.mentorada_mentorias.update_one(
        {'mentorada_mentoria_id': mentorada_mentoria_id},
        {'$set': update_data}
    )
    
    updated = await db.mentorada_mentorias.find_one({'mentorada_mentoria_id': mentorada_mentoria_id}, {'_id': 0})
    return MentoradaMentoria(**updated)

# ============ SESSOES ROUTES ============

@api_router.post("/sessoes", response_model=Sessao)
async def create_sessao(sessao: SessaoCreate, admin: dict = Depends(get_admin_user)):
    sessao_id = str(uuid.uuid4())
    doc = {
        'sessao_id': sessao_id,
        **sessao.model_dump(),
        'session_date': sessao.session_date.isoformat(),
        'created_at': datetime.now(timezone.utc).isoformat()
    }
    await db.sessoes.insert_one(doc)
    return Sessao(**doc)

@api_router.get("/sessoes/mentoria/{mentorada_mentoria_id}", response_model=List[Sessao])
async def get_sessoes_by_mentoria(mentorada_mentoria_id: str, current_user: dict = Depends(get_current_user)):
    # Verify access
    mentoria = await db.mentorada_mentorias.find_one({'mentorada_mentoria_id': mentorada_mentoria_id}, {'_id': 0})
    if not mentoria:
        raise HTTPException(status_code=404, detail="Mentoria não encontrada")
    
    if current_user['role'] != 'admin' and mentoria['user_id'] != current_user['user_id']:
        raise HTTPException(status_code=403, detail="Acesso negado")
    
    sessoes = await db.sessoes.find({'mentorada_mentoria_id': mentorada_mentoria_id}, {'_id': 0}).sort('session_number', 1).to_list(1000)
    return [Sessao(**s) for s in sessoes]

# ============ TAREFAS ROUTES ============

@api_router.post("/tarefas", response_model=Tarefa)
async def create_tarefa(tarefa: TarefaCreate, admin: dict = Depends(get_admin_user)):
    tarefa_id = str(uuid.uuid4())
    doc = {
        'tarefa_id': tarefa_id,
        **tarefa.model_dump(),
        'due_date': tarefa.due_date.isoformat() if tarefa.due_date else None,
        'created_at': datetime.now(timezone.utc).isoformat()
    }
    await db.tarefas.insert_one(doc)
    return Tarefa(**doc)

@api_router.get("/tarefas/mentoria/{mentorada_mentoria_id}", response_model=List[Tarefa])
async def get_tarefas_by_mentoria(mentorada_mentoria_id: str, current_user: dict = Depends(get_current_user)):
    # Verify access
    mentoria = await db.mentorada_mentorias.find_one({'mentorada_mentoria_id': mentorada_mentoria_id}, {'_id': 0})
    if not mentoria:
        raise HTTPException(status_code=404, detail="Mentoria não encontrada")
    
    if current_user['role'] != 'admin' and mentoria['user_id'] != current_user['user_id']:
        raise HTTPException(status_code=403, detail="Acesso negado")
    
    tarefas = await db.tarefas.find({'mentorada_mentoria_id': mentorada_mentoria_id}, {'_id': 0}).to_list(1000)
    return [Tarefa(**t) for t in tarefas]

@api_router.put("/tarefas/{tarefa_id}", response_model=Tarefa)
async def update_tarefa(tarefa_id: str, tarefa: TarefaCreate, current_user: dict = Depends(get_current_user)):
    existing = await db.tarefas.find_one({'tarefa_id': tarefa_id}, {'_id': 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Tarefa não encontrada")
    
    # Verify access
    mentoria = await db.mentorada_mentorias.find_one({'mentorada_mentoria_id': existing['mentorada_mentoria_id']}, {'_id': 0})
    if not mentoria:
        raise HTTPException(status_code=404, detail="Mentoria não encontrada")
    
    if current_user['role'] != 'admin' and mentoria['user_id'] != current_user['user_id']:
        raise HTTPException(status_code=403, detail="Acesso negado")
    
    update_data = tarefa.model_dump()
    update_data['due_date'] = tarefa.due_date.isoformat() if tarefa.due_date else None
    
    await db.tarefas.update_one(
        {'tarefa_id': tarefa_id},
        {'$set': update_data}
    )
    
    updated = await db.tarefas.find_one({'tarefa_id': tarefa_id}, {'_id': 0})
    return Tarefa(**updated)

# ============ MENSAGENS ROUTES ============

@api_router.post("/mensagens", response_model=Mensagem)
async def create_mensagem(mensagem: MensagemCreate, current_user: dict = Depends(get_current_user)):
    # Verify sender is current user
    if mensagem.sender_user_id != current_user['user_id']:
        raise HTTPException(status_code=403, detail="Você só pode enviar mensagens em seu próprio nome")
    
    mensagem_id = str(uuid.uuid4())
    doc = {
        'mensagem_id': mensagem_id,
        **mensagem.model_dump(),
        'created_at': datetime.now(timezone.utc).isoformat(),
        'read': False
    }
    await db.mensagens.insert_one(doc)
    return Mensagem(**doc)

@api_router.get("/mensagens/conversation/{other_user_id}", response_model=List[Mensagem])
async def get_conversation(other_user_id: str, current_user: dict = Depends(get_current_user)):
    user_id = current_user['user_id']
    
    # Get all messages between these two users
    mensagens = await db.mensagens.find({
        '$or': [
            {'mentorada_user_id': user_id, 'sender_user_id': other_user_id},
            {'mentorada_user_id': other_user_id, 'sender_user_id': user_id}
        ]
    }, {'_id': 0}).sort('created_at', 1).to_list(1000)
    
    # Mark as read if recipient is current user
    for msg in mensagens:
        if msg['mentorada_user_id'] == user_id and msg['sender_user_id'] == other_user_id and not msg['read']:
            await db.mensagens.update_one(
                {'mensagem_id': msg['mensagem_id']},
                {'$set': {'read': True}}
            )
            msg['read'] = True
    
    return [Mensagem(**m) for m in mensagens]

@api_router.get("/mensagens/unread-count")
async def get_unread_count(current_user: dict = Depends(get_current_user)):
    count = await db.mensagens.count_documents({
        'mentorada_user_id': current_user['user_id'],
        'read': False
    })
    return {'unread_count': count}

@api_router.get("/mensagens/unread-count-from/{sender_user_id}")
async def get_unread_count_from_sender(sender_user_id: str, current_user: dict = Depends(get_current_user)):
    """Get unread messages count from a specific sender (for admin)"""
    count = await db.mensagens.count_documents({
        'sender_user_id': sender_user_id,
        'mentorada_user_id': sender_user_id,
        'read': False
    })
    return {'unread_count': count}

# ============ FINANCEIRO ROUTES ============

@api_router.post("/financeiro", response_model=Financeiro)
async def create_financeiro(financeiro: FinanceiroCreate, admin: dict = Depends(get_admin_user)):
    financeiro_id = str(uuid.uuid4())
    doc = {
        'financeiro_id': financeiro_id,
        **financeiro.model_dump(),
        'created_at': datetime.now(timezone.utc).isoformat()
    }
    await db.financeiro.insert_one(doc)
    return Financeiro(**doc)

@api_router.get("/financeiro/mentoria/{mentorada_mentoria_id}", response_model=Financeiro)
async def get_financeiro_by_mentoria(mentorada_mentoria_id: str, current_user: dict = Depends(get_current_user)):
    # Verify access
    mentoria = await db.mentorada_mentorias.find_one({'mentorada_mentoria_id': mentorada_mentoria_id}, {'_id': 0})
    if not mentoria:
        raise HTTPException(status_code=404, detail="Mentoria não encontrada")
    
    if current_user['role'] != 'admin' and mentoria['user_id'] != current_user['user_id']:
        raise HTTPException(status_code=403, detail="Acesso negado")
    
    financeiro = await db.financeiro.find_one({'mentorada_mentoria_id': mentorada_mentoria_id}, {'_id': 0})
    if not financeiro:
        raise HTTPException(status_code=404, detail="Informações financeiras não encontradas")
    
    return Financeiro(**financeiro)

# ============ PARCELAS ROUTES ============

@api_router.post("/parcelas", response_model=Parcela)
async def create_parcela(parcela: ParcelaCreate, admin: dict = Depends(get_admin_user)):
    parcela_id = str(uuid.uuid4())
    doc = {
        'parcela_id': parcela_id,
        **parcela.model_dump(),
        'data_vencimento': parcela.data_vencimento.isoformat(),
        'data_pagamento': parcela.data_pagamento.isoformat() if parcela.data_pagamento else None,
        'created_at': datetime.now(timezone.utc).isoformat()
    }
    await db.parcelas.insert_one(doc)
    return Parcela(**doc)

@api_router.get("/parcelas/financeiro/{financeiro_id}", response_model=List[Parcela])
async def get_parcelas_by_financeiro(financeiro_id: str, current_user: dict = Depends(get_current_user)):
    parcelas = await db.parcelas.find({'financeiro_id': financeiro_id}, {'_id': 0}).sort('numero_parcela', 1).to_list(1000)
    return [Parcela(**p) for p in parcelas]

@api_router.put("/parcelas/{parcela_id}", response_model=Parcela)
async def update_parcela(parcela_id: str, parcela: ParcelaCreate, admin: dict = Depends(get_admin_user)):
    update_data = parcela.model_dump()
    update_data['data_vencimento'] = parcela.data_vencimento.isoformat()
    update_data['data_pagamento'] = parcela.data_pagamento.isoformat() if parcela.data_pagamento else None
    
    await db.parcelas.update_one(
        {'parcela_id': parcela_id},
        {'$set': update_data}
    )
    
    updated = await db.parcelas.find_one({'parcela_id': parcela_id}, {'_id': 0})
    if not updated:
        raise HTTPException(status_code=404, detail="Parcela não encontrada")
    
    return Parcela(**updated)

# ============ PRODUTOS ROUTES ============

@api_router.post("/produtos", response_model=Produto)
async def create_produto(produto: ProdutoCreate, admin: dict = Depends(get_admin_user)):
    produto_id = str(uuid.uuid4())
    doc = {
        'produto_id': produto_id,
        **produto.model_dump(),
        'created_at': datetime.now(timezone.utc).isoformat()
    }
    await db.produtos.insert_one(doc)
    return Produto(**doc)

@api_router.get("/produtos", response_model=List[Produto])
async def list_produtos(current_user: dict = Depends(get_current_user)):
    produtos = await db.produtos.find({}, {'_id': 0}).to_list(1000)
    return [Produto(**p) for p in produtos]

@api_router.get("/produtos/my", response_model=List[Produto])
async def get_my_produtos(current_user: dict = Depends(get_current_user)):
    # Get user's products
    user_produtos = await db.user_produtos.find({'user_id': current_user['user_id']}, {'_id': 0}).to_list(1000)
    produto_ids = [up['produto_id'] for up in user_produtos]
    
    if not produto_ids:
        return []
    
    produtos = await db.produtos.find({'produto_id': {'$in': produto_ids}}, {'_id': 0}).to_list(1000)
    return [Produto(**p) for p in produtos]

@api_router.post("/user-produtos", response_model=UserProduto)
async def assign_produto_to_user(user_produto: UserProdutoCreate, admin: dict = Depends(get_admin_user)):
    user_produto_id = str(uuid.uuid4())
    doc = {
        'user_produto_id': user_produto_id,
        **user_produto.model_dump(),
        'created_at': datetime.now(timezone.utc).isoformat()
    }
    await db.user_produtos.insert_one(doc)
    return UserProduto(**doc)

# ============ USERS ADMIN ROUTES ============

@api_router.get("/users", response_model=List[User])
async def list_users(admin: dict = Depends(get_admin_user)):
    users = await db.users.find({}, {'_id': 0, 'password': 0}).to_list(1000)
    return [User(**u) for u in users]

@api_router.get("/users/{user_id}", response_model=User)
async def get_user(user_id: str, admin: dict = Depends(get_admin_user)):
    user = await db.users.find_one({'user_id': user_id}, {'_id': 0, 'password': 0})
    if not user:
        raise HTTPException(status_code=404, detail="Usuária não encontrada")
    return User(**user)

@api_router.get("/mentora", response_model=User)
async def get_mentora(current_user: dict = Depends(get_current_user)):
    """Get the first admin user (mentora) - available to all authenticated users"""
    mentora = await db.users.find_one({'role': 'admin'}, {'_id': 0, 'password': 0})
    if not mentora:
        raise HTTPException(status_code=404, detail="Mentora não encontrada")
    return User(**mentora)

# ============ DASHBOARD ROUTES ============

@api_router.get("/dashboard")
async def get_dashboard(current_user: dict = Depends(get_current_user)):
    # Get active mentoria
    mentoradas_mentorias = await db.mentorada_mentorias.find({
        'user_id': current_user['user_id'],
        'status': 'ativa'
    }, {'_id': 0}).to_list(1)
    
    if not mentoradas_mentorias:
        return {
            'has_active_mentoria': False,
            'message': 'Nenhuma mentoria ativa no momento'
        }
    
    mentorada_mentoria = mentoradas_mentorias[0]
    mentorada_mentoria_id = mentorada_mentoria['mentorada_mentoria_id']
    
    # Get mentoria details
    mentoria = await db.mentorias.find_one({'mentoria_id': mentorada_mentoria['mentoria_id']}, {'_id': 0})
    
    # Get latest session
    sessoes = await db.sessoes.find({'mentorada_mentoria_id': mentorada_mentoria_id}, {'_id': 0}).sort('session_number', -1).to_list(1)
    latest_sessao = sessoes[0] if sessoes else None
    
    # Get pending tasks
    tarefas_pendentes = await db.tarefas.find({
        'mentorada_mentoria_id': mentorada_mentoria_id,
        'status': 'pendente'
    }, {'_id': 0}).to_list(1)
    proxima_tarefa = tarefas_pendentes[0] if tarefas_pendentes else None
    
    # Get financial status
    financeiro = await db.financeiro.find_one({'mentorada_mentoria_id': mentorada_mentoria_id}, {'_id': 0})
    if financeiro:
        parcelas = await db.parcelas.find({'financeiro_id': financeiro['financeiro_id']}, {'_id': 0}).to_list(1000)
        pagas = sum(1 for p in parcelas if p['status'] == 'paga')
        total_parcelas = len(parcelas)
        status_financeiro = f"{pagas}/{total_parcelas} parcelas pagas"
    else:
        status_financeiro = "Não configurado"
    
    # Get unread messages
    unread_count = await db.mensagens.count_documents({
        'mentorada_user_id': current_user['user_id'],
        'read': False
    })
    
    return {
        'has_active_mentoria': True,
        'mentoria_name': mentoria['name'] if mentoria else 'N/A',
        'mentorada_mentoria_id': mentorada_mentoria_id,
        'current_session': latest_sessao['session_number'] if latest_sessao else 0,
        'next_task': proxima_tarefa['descricao'] if proxima_tarefa else 'Nenhuma tarefa pendente',
        'financial_status': status_financeiro,
        'unread_messages': unread_count
    }

# ============ EMAIL ROUTE ============

@api_router.post("/send-email")
async def send_email(request: EmailRequest, admin: dict = Depends(get_admin_user)):
    await send_email_async(request.recipient_email, request.subject, request.html_content)
    return {"status": "success", "message": f"Email enviado para {request.recipient_email}"}

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, UploadFile, File
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.staticfiles import StaticFiles
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
import shutil

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Uploads directory
UPLOADS_DIR = ROOT_DIR / 'uploads'
UPLOADS_DIR.mkdir(exist_ok=True)

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
    cover_image_url: Optional[str] = None
    sales_link: Optional[str] = None

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
    cover_image_url: Optional[str] = None
    price: Optional[str] = None

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

class AgendamentoBase(BaseModel):
    mentorada_mentoria_id: str
    session_number: int
    tema: str
    session_date: datetime
    video_url: Optional[str] = None
    audio_url: Optional[str] = None
    resumo: Optional[str] = None
    status: str = "agendada"  # agendada, realizada, cancelada

class AgendamentoCreate(AgendamentoBase):
    pass

class Agendamento(AgendamentoBase):
    agendamento_id: str
    created_at: datetime

class EmailRequest(BaseModel):
    recipient_email: EmailStr
    subject: str
    html_content: str

class UpdateEmailRequest(BaseModel):
    new_email: EmailStr

class UpdatePasswordRequest(BaseModel):
    current_password: str
    new_password: str

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

@api_router.put("/auth/update-email")
async def update_email(request: UpdateEmailRequest, current_user: dict = Depends(get_current_user)):
    # Check if email already exists
    existing = await db.users.find_one({'email': request.new_email}, {'_id': 0})
    if existing and existing['user_id'] != current_user['user_id']:
        raise HTTPException(status_code=400, detail="Email já está em uso")
    
    await db.users.update_one(
        {'user_id': current_user['user_id']},
        {'$set': {'email': request.new_email}}
    )
    
    return {"message": "Email atualizado com sucesso"}

@api_router.put("/auth/update-password")
async def update_password(request: UpdatePasswordRequest, current_user: dict = Depends(get_current_user)):
    # Verify current password
    user = await db.users.find_one({'user_id': current_user['user_id']}, {'_id': 0})
    if not verify_password(request.current_password, user['password']):
        raise HTTPException(status_code=401, detail="Senha atual incorreta")
    
    # Update password
    new_hashed = hash_password(request.new_password)
    await db.users.update_one(
        {'user_id': current_user['user_id']},
        {'$set': {'password': new_hashed}}
    )
    
    return {"message": "Senha atualizada com sucesso"}

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

@api_router.put("/mentorias/{mentoria_id}", response_model=Mentoria)
async def update_mentoria(mentoria_id: str, mentoria_update: MentoriaCreate, admin: dict = Depends(get_admin_user)):
    """Update a mentoria (admin only)"""
    mentoria = await db.mentorias.find_one({'mentoria_id': mentoria_id}, {'_id': 0})
    if not mentoria:
        raise HTTPException(status_code=404, detail="Mentoria não encontrada")
    
    await db.mentorias.update_one(
        {'mentoria_id': mentoria_id},
        {'$set': mentoria_update.model_dump()}
    )
    updated = await db.mentorias.find_one({'mentoria_id': mentoria_id}, {'_id': 0})
    return Mentoria(**updated)

@api_router.delete("/mentorias/{mentoria_id}")
async def delete_mentoria(mentoria_id: str, admin: dict = Depends(get_admin_user)):
    """Delete a mentoria and all related data (admin only)"""
    mentoria = await db.mentorias.find_one({'mentoria_id': mentoria_id}, {'_id': 0})
    if not mentoria:
        raise HTTPException(status_code=404, detail="Mentoria não encontrada")
    
    # Delete related mentorada_mentorias and cascade
    mentorada_mentorias = await db.mentorada_mentorias.find({'mentoria_id': mentoria_id}, {'_id': 0}).to_list(1000)
    for mm in mentorada_mentorias:
        mm_id = mm['mentorada_mentoria_id']
        # Delete financeiro and parcelas
        financeiro = await db.financeiro.find_one({'mentorada_mentoria_id': mm_id}, {'_id': 0})
        if financeiro:
            await db.parcelas.delete_many({'financeiro_id': financeiro['financeiro_id']})
            await db.financeiro.delete_one({'mentorada_mentoria_id': mm_id})
        # Delete sessions and tasks
        await db.sessoes.delete_many({'mentorada_mentoria_id': mm_id})
        await db.tarefas.delete_many({'mentorada_mentoria_id': mm_id})
        await db.agendamentos.delete_many({'mentorada_mentoria_id': mm_id})
    
    # Delete mentorada_mentorias
    await db.mentorada_mentorias.delete_many({'mentoria_id': mentoria_id})
    
    # Delete the mentoria
    await db.mentorias.delete_one({'mentoria_id': mentoria_id})
    
    return {"message": f"Mentoria '{mentoria['name']}' excluída com sucesso"}

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

@api_router.get("/mentorada-mentorias/all", response_model=List[MentoradaMentoria])
async def list_all_mentorada_mentorias(admin: dict = Depends(get_admin_user)):
    """Lista todos os vínculos mentorada-mentoria (admin only)"""
    mentorias = await db.mentorada_mentorias.find({}, {'_id': 0}).to_list(1000)
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

class FinanceiroUpdate(BaseModel):
    valor_total: Optional[float] = None
    forma_pagamento: Optional[str] = None
    numero_parcelas: Optional[int] = None
    observacoes: Optional[str] = None

@api_router.put("/financeiro/{financeiro_id}", response_model=Financeiro)
async def update_financeiro(financeiro_id: str, financeiro_update: FinanceiroUpdate, admin: dict = Depends(get_admin_user)):
    """Update financial record (admin only)"""
    financeiro = await db.financeiro.find_one({'financeiro_id': financeiro_id}, {'_id': 0})
    if not financeiro:
        raise HTTPException(status_code=404, detail="Registro financeiro não encontrado")
    
    update_data = {k: v for k, v in financeiro_update.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="Nenhum dado para atualizar")
    
    await db.financeiro.update_one({'financeiro_id': financeiro_id}, {'$set': update_data})
    updated = await db.financeiro.find_one({'financeiro_id': financeiro_id}, {'_id': 0})
    return Financeiro(**updated)

@api_router.delete("/financeiro/{financeiro_id}")
async def delete_financeiro(financeiro_id: str, admin: dict = Depends(get_admin_user)):
    """Delete financial record and its parcelas (admin only)"""
    financeiro = await db.financeiro.find_one({'financeiro_id': financeiro_id}, {'_id': 0})
    if not financeiro:
        raise HTTPException(status_code=404, detail="Registro financeiro não encontrado")
    
    # Delete parcelas
    await db.parcelas.delete_many({'financeiro_id': financeiro_id})
    
    # Delete financeiro
    await db.financeiro.delete_one({'financeiro_id': financeiro_id})
    
    return {"message": "Registro financeiro excluído com sucesso"}

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

# ============ AGENDAMENTOS ROUTES ============

@api_router.post("/agendamentos", response_model=Agendamento)
async def create_agendamento(agendamento: AgendamentoCreate, admin: dict = Depends(get_admin_user)):
    agendamento_id = str(uuid.uuid4())
    doc = {
        'agendamento_id': agendamento_id,
        **agendamento.model_dump(),
        'session_date': agendamento.session_date.isoformat(),
        'created_at': datetime.now(timezone.utc).isoformat()
    }
    await db.agendamentos.insert_one(doc)
    return Agendamento(**doc)

@api_router.get("/agendamentos", response_model=List[Agendamento])
async def list_agendamentos(current_user: dict = Depends(get_current_user)):
    if current_user['role'] == 'admin':
        agendamentos = await db.agendamentos.find({}, {'_id': 0}).sort('session_date', 1).to_list(1000)
    else:
        # Get user's mentorias
        mentorias = await db.mentorada_mentorias.find({'user_id': current_user['user_id']}, {'_id': 0}).to_list(1000)
        mentoria_ids = [m['mentorada_mentoria_id'] for m in mentorias]
        agendamentos = await db.agendamentos.find(
            {'mentorada_mentoria_id': {'$in': mentoria_ids}},
            {'_id': 0}
        ).sort('session_date', 1).to_list(1000)
    
    return [Agendamento(**a) for a in agendamentos]

@api_router.put("/agendamentos/{agendamento_id}", response_model=Agendamento)
async def update_agendamento(agendamento_id: str, agendamento: AgendamentoCreate, admin: dict = Depends(get_admin_user)):
    update_data = agendamento.model_dump()
    update_data['session_date'] = agendamento.session_date.isoformat()
    
    await db.agendamentos.update_one(
        {'agendamento_id': agendamento_id},
        {'$set': update_data}
    )
    
    updated = await db.agendamentos.find_one({'agendamento_id': agendamento_id}, {'_id': 0})
    if not updated:
        raise HTTPException(status_code=404, detail="Agendamento não encontrado")
    
    return Agendamento(**updated)

# ============ GOOGLE CALENDAR ROUTES ============

@api_router.get("/google-calendar/auth-url")
async def get_google_calendar_auth_url(current_user: dict = Depends(get_current_user)):
    """Get Google Calendar OAuth URL"""
    # For now, return a placeholder. In production, you'd integrate with Google OAuth
    return {
        "auth_url": "https://accounts.google.com/o/oauth2/v2/auth?client_id=YOUR_CLIENT_ID&redirect_uri=YOUR_REDIRECT_URI&response_type=code&scope=https://www.googleapis.com/auth/calendar",
        "message": "Para conectar o Google Calendar, você precisará configurar as credenciais OAuth 2.0 no Google Cloud Console"
    }

@api_router.post("/google-calendar/disconnect")
async def disconnect_google_calendar(current_user: dict = Depends(get_current_user)):
    """Disconnect Google Calendar"""
    # Remove calendar tokens from user
    await db.users.update_one(
        {'user_id': current_user['user_id']},
        {'$unset': {'google_calendar_token': '', 'google_refresh_token': ''}}
    )
    return {"message": "Google Calendar desconectado com sucesso"}

@api_router.post("/google-calendar/sync-event")
async def sync_event_to_google_calendar(agendamento_id: str, admin: dict = Depends(get_admin_user)):
    """Sync an agendamento to Google Calendar (placeholder for future implementation)"""
    agendamento = await db.agendamentos.find_one({'agendamento_id': agendamento_id}, {'_id': 0})
    if not agendamento:
        raise HTTPException(status_code=404, detail="Agendamento não encontrado")
    
    # In production, this would create the event in Google Calendar
    return {
        "message": "Para habilitar sincronização automática, configure Google Calendar OAuth",
        "agendamento": agendamento
    }

# ============ ADMIN FINANCEIRO OVERVIEW ============

@api_router.get("/admin/financeiro-overview")
async def get_financeiro_overview(admin: dict = Depends(get_admin_user)):
    """Get financial overview of all mentoradas"""
    result = []
    
    # Get all financeiro records
    financeiros = await db.financeiro.find({}, {'_id': 0}).to_list(1000)
    
    for fin in financeiros:
        # Get mentoria details
        mentoria_info = await db.mentorada_mentorias.find_one(
            {'mentorada_mentoria_id': fin['mentorada_mentoria_id']}, 
            {'_id': 0}
        )
        
        if not mentoria_info:
            continue
        
        # Get user details
        user_info = await db.users.find_one(
            {'user_id': mentoria_info['user_id']}, 
            {'_id': 0, 'password': 0}
        )
        
        # Get mentoria name
        mentoria_details = await db.mentorias.find_one(
            {'mentoria_id': mentoria_info['mentoria_id']}, 
            {'_id': 0}
        )
        
        # Get parcelas
        parcelas = await db.parcelas.find(
            {'financeiro_id': fin['financeiro_id']}, 
            {'_id': 0}
        ).sort('numero_parcela', 1).to_list(1000)
        
        parcelas_pagas = [p for p in parcelas if p['status'] == 'paga']
        parcelas_pendentes = [p for p in parcelas if p['status'] == 'pendente']
        
        valor_recebido = sum(p['valor'] for p in parcelas_pagas)
        
        result.append({
            'financeiro_id': fin['financeiro_id'],
            'mentorada_name': user_info['name'] if user_info else 'N/A',
            'mentoria_name': mentoria_details['name'] if mentoria_details else 'N/A',
            'valor_total': fin['valor_total'],
            'forma_pagamento': fin['forma_pagamento'],
            'total_parcelas': len(parcelas),
            'parcelas_pagas_count': len(parcelas_pagas),
            'parcelas_pendentes_count': len(parcelas_pendentes),
            'valor_recebido': valor_recebido,
            'parcelas': parcelas
        })
    
    return result

@api_router.get("/admin/tarefas-overview")
async def get_tarefas_overview(admin: dict = Depends(get_admin_user)):
    """Get all tarefas with mentorada and mentoria info"""
    result = []
    
    # Get all tarefas
    tarefas = await db.tarefas.find({}, {'_id': 0}).to_list(10000)
    
    for tarefa in tarefas:
        # Get mentoria info
        mentoria_info = await db.mentorada_mentorias.find_one(
            {'mentorada_mentoria_id': tarefa['mentorada_mentoria_id']}, 
            {'_id': 0}
        )
        
        if not mentoria_info:
            continue
        
        # Get user
        user_info = await db.users.find_one(
            {'user_id': mentoria_info['user_id']}, 
            {'_id': 0, 'password': 0}
        )
        
        # Get mentoria name
        mentoria_details = await db.mentorias.find_one(
            {'mentoria_id': mentoria_info['mentoria_id']}, 
            {'_id': 0}
        )
        
        result.append({
            **tarefa,
            'mentorada_name': user_info['name'] if user_info else 'N/A',
            'mentoria_name': mentoria_details['name'] if mentoria_details else 'N/A'
        })
    
    # Sort by created_at desc
    result.sort(key=lambda x: x.get('created_at', ''), reverse=True)
    
    return result

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

class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None

@api_router.put("/users/{user_id}", response_model=User)
async def update_user(user_id: str, user_update: UserUpdate, admin: dict = Depends(get_admin_user)):
    """Update a user (admin only)"""
    user = await db.users.find_one({'user_id': user_id}, {'_id': 0})
    if not user:
        raise HTTPException(status_code=404, detail="Usuária não encontrada")
    
    update_data = {k: v for k, v in user_update.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="Nenhum dado para atualizar")
    
    # Check if email already exists
    if 'email' in update_data:
        existing = await db.users.find_one({'email': update_data['email'], 'user_id': {'$ne': user_id}}, {'_id': 0})
        if existing:
            raise HTTPException(status_code=400, detail="Email já está em uso")
    
    await db.users.update_one({'user_id': user_id}, {'$set': update_data})
    updated_user = await db.users.find_one({'user_id': user_id}, {'_id': 0, 'password': 0})
    return User(**updated_user)

@api_router.delete("/users/{user_id}")
async def delete_user(user_id: str, admin: dict = Depends(get_admin_user)):
    """Delete a user and all related data (admin only)"""
    user = await db.users.find_one({'user_id': user_id}, {'_id': 0})
    if not user:
        raise HTTPException(status_code=404, detail="Usuária não encontrada")
    
    if user['role'] == 'admin':
        raise HTTPException(status_code=400, detail="Não é possível excluir uma administradora")
    
    # Delete related data
    mentoradas_mentorias = await db.mentorada_mentorias.find({'user_id': user_id}, {'_id': 0}).to_list(1000)
    for mm in mentoradas_mentorias:
        mm_id = mm['mentorada_mentoria_id']
        # Delete financeiro and parcelas
        financeiro = await db.financeiro.find_one({'mentorada_mentoria_id': mm_id}, {'_id': 0})
        if financeiro:
            await db.parcelas.delete_many({'financeiro_id': financeiro['financeiro_id']})
            await db.financeiro.delete_one({'mentorada_mentoria_id': mm_id})
        # Delete sessions and tasks
        await db.sessoes.delete_many({'mentorada_mentoria_id': mm_id})
        await db.tarefas.delete_many({'mentorada_mentoria_id': mm_id})
        await db.agendamentos.delete_many({'mentorada_mentoria_id': mm_id})
    
    # Delete mentorada_mentorias
    await db.mentorada_mentorias.delete_many({'user_id': user_id})
    
    # Delete messages
    await db.mensagens.delete_many({'$or': [{'mentorada_user_id': user_id}, {'sender_user_id': user_id}]})
    
    # Delete user products
    await db.user_produtos.delete_many({'user_id': user_id})
    
    # Delete user
    await db.users.delete_one({'user_id': user_id})
    
    return {"message": f"Usuária {user['name']} excluída com sucesso"}

@api_router.get("/mentora", response_model=User)
async def get_mentora(current_user: dict = Depends(get_current_user)):
    """Get the first admin user (mentora) - available to all authenticated users"""
    mentora = await db.users.find_one({'role': 'admin'}, {'_id': 0, 'password': 0})
    if not mentora:
        raise HTTPException(status_code=404, detail="Mentora não encontrada")
    return User(**mentora)

# ============ DASHBOARD ROUTES ============

@api_router.get("/admin/dashboard")
async def get_admin_dashboard(admin: dict = Depends(get_admin_user)):
    # Total mentoradas
    total_mentoradas = await db.users.count_documents({'role': 'mentorada'})
    
    # Total mentorias
    total_mentorias = await db.mentorias.count_documents({})
    
    # Tarefas pendentes
    tarefas_pendentes = await db.tarefas.count_documents({'status': 'pendente'})
    
    # Parcelas
    now = datetime.now(timezone.utc)
    first_day_month = datetime(now.year, now.month, 1, tzinfo=timezone.utc)
    
    parcelas_pagas_mes = await db.parcelas.count_documents({
        'status': 'paga',
        'data_pagamento': {'$gte': first_day_month.isoformat()}
    })
    
    parcelas_pendentes = await db.parcelas.count_documents({'status': 'pendente'})
    
    # Receita
    parcelas_pagas_mes_list = await db.parcelas.find({
        'status': 'paga',
        'data_pagamento': {'$gte': first_day_month.isoformat()}
    }, {'_id': 0}).to_list(1000)
    receita_mes = sum(p.get('valor', 0) for p in parcelas_pagas_mes_list)
    
    all_parcelas_pagas = await db.parcelas.find({'status': 'paga'}, {'_id': 0}).to_list(10000)
    receita_total = sum(p.get('valor', 0) for p in all_parcelas_pagas)
    
    # Recent activities
    recent_messages = await db.mensagens.find({}, {'_id': 0}).sort('created_at', -1).limit(5).to_list(5)
    activities = []
    for msg in recent_messages:
        user = await db.users.find_one({'user_id': msg['sender_user_id']}, {'_id': 0})
        if user:
            time_str = datetime.fromisoformat(msg['created_at']).strftime('%d/%m/%Y %H:%M')
            activities.append({
                'description': f"{user['name']} enviou uma mensagem",
                'time': time_str
            })
    
    return {
        'stats': {
            'total_mentoradas': total_mentoradas,
            'total_mentorias': total_mentorias,
            'tarefas_pendentes': tarefas_pendentes,
            'receita_mes': receita_mes,
            'parcelas_pagas_mes': parcelas_pagas_mes,
            'parcelas_pendentes': parcelas_pendentes,
            'receita_total': receita_total
        },
        'recent_activities': activities
    }

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
# Configuração do Google Calendar

## Como conectar sua agenda do Google Calendar ao portal

### Passo 1: Criar projeto no Google Cloud Console

1. Acesse: https://console.cloud.google.com/
2. Crie um novo projeto ou selecione um existente
3. Vá em "APIs & Services" > "Enable APIs and Services"
4. Procure por "Google Calendar API" e ative

### Passo 2: Configurar OAuth 2.0

1. No menu lateral, vá em "Credentials"
2. Clique em "Create Credentials" > "OAuth client ID"
3. Escolha "Web application"
4. Configure:
   - **Name**: Instituto Jussara Kaisel Portal
   - **Authorized redirect URIs**: 
     - http://localhost:8001/api/google-calendar/callback (desenvolvimento)
     - https://SEU_DOMINIO.com/api/google-calendar/callback (produção)
5. Copie o **Client ID** e **Client Secret**

### Passo 3: Adicionar credenciais no backend

Adicione no arquivo `/app/backend/.env`:

```bash
GOOGLE_CLIENT_ID=seu_client_id_aqui
GOOGLE_CLIENT_SECRET=seu_client_secret_aqui
GOOGLE_REDIRECT_URI=https://SEU_DOMINIO.com/api/google-calendar/callback
```

### Passo 4: Instalar biblioteca

```bash
cd /app/backend
pip install google-auth google-auth-oauthlib google-auth-httplib2 google-api-python-client
pip freeze > requirements.txt
```

### Funcionalidades da Integração

Quando conectado, o sistema irá automaticamente:

✅ Criar eventos no Google Calendar para cada sessão agendada
✅ Incluir o link do vídeo YouTube na descrição do evento
✅ Adicionar link do áudio Spotify (se disponível)
✅ Notificar 1 hora antes da sessão
✅ Sincronizar alterações (cancelamento, confirmação)

### Exemplo de Evento Criado

```
Título: Sessão 1 - Despertar da Consciência
Data/Hora: 15/01/2025 10:00
Descrição:
  Mentoria: Travessia
  Mentorada: Maria Silva
  
  Links:
  - Vídeo: [link YouTube]
  - Áudio: [link Spotify]
  
  Resumo: Primeira sessão focada em reconhecer padrões...
```

### Status Atual

🔶 **Sistema preparado** - Os endpoints estão criados e prontos para integração
🔶 **Aguardando configuração** - Você precisa adicionar suas credenciais do Google

### Suporte

Para qualquer dúvida sobre a configuração, consulte a documentação oficial:
https://developers.google.com/calendar/api/quickstart/python

# 🔧 Como Configurar CORS no Cloudflare R2

## Problema
Vídeos hospedados no R2 não tocam em autoplay porque o navegador bloqueia requisições cross-origin sem headers CORS corretos.

## Solução: Configurar CORS no Bucket R2

### Passo 1: Acessar o Dashboard da Cloudflare
1. Entre em: https://dash.cloudflare.com/
2. Vá em **R2** no menu lateral
3. Clique no bucket usado pelo projeto (provavelmente `veby-videos`)

### Passo 2: Configurar CORS
1. Dentro do bucket, clique na aba **Settings**
2. Role até a seção **CORS Policy**
3. Clique em **Add CORS Policy** ou **Edit**
4. Cole esta configuração JSON:

```json
[
  {
    "AllowedOrigins": ["*"],
    "AllowedMethods": ["GET", "HEAD"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag", "Content-Type", "Content-Length"],
    "MaxAgeSeconds": 3600
  }
]
```

### Passo 3: Salvar e Testar
1. Clique em **Save**
2. Aguarde 1-2 minutos para propagar
3. Acesse `/debug-r2-video` no app e teste se o autoplay funciona

## Explicação dos Headers

- **AllowedOrigins: ["*"]** - Permite qualquer domínio acessar os vídeos (necessário para autoplay)
- **AllowedMethods: ["GET", "HEAD"]** - Permite apenas leitura dos vídeos
- **AllowedHeaders: ["*"]** - Aceita qualquer header na requisição
- **ExposeHeaders** - Headers que o navegador pode ler na resposta
- **MaxAgeSeconds: 3600** - Cache da policy CORS por 1 hora

## Verificar se Funcionou

Após configurar, abra o console do navegador (F12) e veja se:
- ❌ **ANTES**: `CORS policy: No 'Access-Control-Allow-Origin' header is present`
- ✅ **DEPOIS**: Vídeo toca em autoplay sem erros CORS

## Segurança

Para produção, você pode restringir os domínios:
```json
"AllowedOrigins": ["https://seu-dominio.com", "https://www.seu-dominio.com"]
```

---

**Nota**: Sem CORS configurado, o navegador bloqueia autoplay de vídeos cross-origin por segurança.

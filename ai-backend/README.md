# Backend de IA para Imagiologia (TorchXRayVision)

Backend em **Python/FastAPI** que analisa radiografias de tórax usando o modelo
pré-treinado **TorchXRayVision** (DenseNet-121). O Next.js (frontend) comunica
com este serviço através do endpoint proxy `/api/ia/analisar`.

> ⚠️ **Aviso clínico**: ferramenta experimental de **apoio à decisão**.
> Os resultados têm falsos positivos/negativos e **não substituem** a avaliação
> de um médico especialista. O diagnóstico definitivo é sempre do radiologista.

---

## Motivação

O Vercel (serverless) **não pode** correr PyTorch/Modelos de ML pesados. Por isso,
este backend Python corre separadamente (num VPS, Render, Railway, Heroku, etc.)
e é chamado pelo Next.js via variável de ambiente `AI_BACKEND_URL`.

---

## Endpoints

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/api/health` | Healthcheck (modelo carregado?) |
| `POST` | `/api/analisar` | Envia imagem (multipart) e devolve achados |
| `GET` | `/` | Info do serviço |

### Exemplo de pedido (`/api/analisar`)

```
POST /api/analisar
Content-Type: multipart/form-data

file:  (ficheiro de imagem JPG/PNG)
modalidade: "Raio-X"
idade: 45
```

### Resposta (formato compatível com `MLDiagnostico`)

```json
{
  "imagemId": 0,
  "modalidade": "Raio-X",
  "resumo": "Pneumonia (confiança: 72%)",
  "achados": [
    {
      "tipo": "Pneumonia",
      "descricao": "Opacidade pulmonar com broncogramas aéreos...",
      "gravidade": "moderado",
      "confianca": 72,
      "categoria": "opacidade",
      "localizacao": "Difuso / Geral"
    }
  ],
  "diagnosticoPrincipal": "Pneumonia",
  "confiancaDiagnostico": 72,
  "recomendacoes": ["Reavaliação clínica urgente se severo", "Análise assistida por IA..."],
  "metadados": { "dimensoes": {...}, "brilhoMedio": 45, "contraste": 33, "nitidez": 0, "histograma": [], "razaoAspecto": 1.2 },
  "regioesInteresse": [],
  "processadoEm": "2026-...",
  "modelo": "torchxrayvision/DenseNet121",
  "tempoProcessamentoMs": 820,
  "aviso": "⚠️ Ferramenta experimental..."
}
```

---

## Instalação local

### 1. Criar ambiente virtual

```bash
cd ai-backend
python -m venv .venv
# Windows
.venv\Scripts\activate
# Linux/macOS
source .venv/bin/activate
```

### 2. Instalar dependências

```bash
pip install -r requirements.txt
```

> Requer **Python 3.9+** e, de preferência, GPU NVIDIA (CUDA). Em CPU funciona,
> mas mais lento.

### 3. Correr o servidor

```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

O serviço fica em `http://localhost:8000`. Docs interativas em
`http://localhost:8000/docs`.

---

## Deploy

### Opção A — Docker (Recomendado)

```bash
docker build -t imagiologia-ai .
docker run -p 8000:8000 imagiologia-ai
```

### Opção B — Render/Railway/Heroku (via Procfile)

- **Render**: criar "Web Service" apontando para a pasta `ai-backend`.
  Build command: `pip install -r requirements.txt`.
- **Railway**: apontar para `ai-backend`.
- **Heroku**: usar o `Procfile` incluído.

Após o deploy, defina a variável `AI_BACKEND_URL` no Vercel apontando para o
URL público do backend, ex.: `https://imagiologia-ai.onrender.com`.

---

## Ligação com o Next.js/Vercel

1. Faça o deploy deste backend num serviço com GPU/CPU.
2. No painel do Vercel, adicione a variável de ambiente:
   ```
   AI_BACKEND_URL=https://seu-backend-ia.example.com
   ```
3. O Next.js redireciona os pedidos de `/api/ia/analisar` para esse backend.
4. Se o backend não estiver disponível, o frontend usa automaticamente uma
   análise local heurística de demonstração (não é diagnóstico médico).

---

## Precauções de segurança

- **Autenticação**: este README assume uso interno/confidencial. Em produção,
  adicione um token de API (ex.: `Authorization: Bearer`) e valide no backend.
- **PII/Privacidade**: as imagens de pacientes são dados sensíveis. Garanta
  HTTPS, restrição de acesso e conformidade com a legislação local (ex.: RGPD).
- **Não é dispositivo médico**: nenhum resultado deve ser usado como diagnóstico
  definitivo sem revisão médica especializada e validação clínica.

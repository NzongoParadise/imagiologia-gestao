"""
Backend de IA para Imagiologia - Diagnóstico assistido por TorchXRayVision

Este serviço expõe uma API REST para análise de imagens médicas (radiografias de tórax)
usando o modelo pré-treinado TorchXRayVision (MIT).

⚠️ IMPORTANTE (segurança clínica):
Este sistema é uma ferramenta de APOIO à decisão médica. Os resultados possuem
falsos positivos/negativos e NÃO substituem a avaliação de um médico especialista.
O diagnóstico definitivo deve ser sempre realizado por um radiologista/clínico.
"""

from __future__ import annotations

import io
import os
import time
import warnings
from typing import Any, Optional

import numpy as np
from fastapi import Depends, FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from PIL import Image
from pydantic import BaseModel

warnings.filterwarnings("ignore")

app = FastAPI(
    title="Imagiologia AI Backend",
    description="Análise de radiografias de tórax com TorchXRayVision (apoio ao diagnóstico).",
    version="1.0.0",
)

# ---------------------------------------------------------------------------
# Autenticação por token Bearer
# ---------------------------------------------------------------------------
# Se a variável de ambiente AI_BACKEND_TOKEN estiver definida, todos os
# endpoints de análise exigem o header `Authorization: Bearer <token>`.
# Se não estiver definida (ex.: desenvolvimento local), a autenticação é
# desativada para facilitar o teste. Em produção, defina sempre o token.
# ---------------------------------------------------------------------------
AI_BACKEND_TOKEN = os.getenv("AI_BACKEND_TOKEN", "").strip()
_seguranca_bearer = HTTPBearer(auto_error=False)


def verificar_token(
    credenciais: Optional[HTTPAuthorizationCredentials] = Depends(_seguranca_bearer),
) -> None:
    if not AI_BACKEND_TOKEN:
        return  # autenticação desativada (apenas desenvolvimento)
    if credenciais is None or credenciais.credentials != AI_BACKEND_TOKEN:
        raise HTTPException(
            status_code=401,
            detail="Não autorizado. Forneça o header 'Authorization: Bearer <token>'.",
            headers={"WWW-Authenticate": "Bearer"},
        )


# ---------------------------------------------------------------------------
# CORS restrito (em produção defina AI_BACKEND_ORIGINS com orígens autorizadas)
# ---------------------------------------------------------------------------
_origens = os.getenv("AI_BACKEND_ORIGINS", "*")
_origens_permitidas = [o.strip() for o in _origens.split(",") if o.strip()] or ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_origens_permitidas,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Modelo (carregado de forma preguiçosa para arranque rápido do servidor)
# ---------------------------------------------------------------------------
_modelo: Any = None
_modelo_carregado_em: float = 0.0


def carregar_modelo() -> Any:
    """Carrega o modelo TorchXRayVision (DenseNet-121) uma única vez."""
    global _modelo, _modelo_carregado_em
    if _modelo is not None:
        return _modelo

    try:
        import torchxrayvision as xrv
    except ImportError as exc:  # pragma: no cover
        raise HTTPException(
            status_code=503,
            detail="torchxrayvision não instalado. Execute: pip install -r requirements.txt",
        ) from exc

    modelo = xrv.models.DenseNet(weights="densenet121-res224-all")
    modelo.eval()
    _modelo = modelo
    _modelo_carregado_em = time.time()
    return modelo


# ---------------------------------------------------------------------------
# Mapeamento dos achados do TorchXRayVision -> categorias do sistema
# ---------------------------------------------------------------------------
CATEGORIA_POR_ACHADO: dict[str, str] = {
    "Atelectasis": "atelectasia",
    "Consolidation": "consolidacao",
    "Infiltration": "opacidade",
    "Pneumothorax": "pneumotorax",
    "Edema": "edema",
    "Emphysema": "anomalia_textura",
    "Fibrosis": "fibrose",
    "Effusion": "derrame",
    "Pneumonia": "opacidade",
    "Pleural_Thickening": "anomalia_textura",
    "Cardiomegaly": "cardiomegalia",
    "Nodule": "nodulo",
    "Mass": "massa",
    "Hernia": "lesao",
    "Lung_Lesion": "lesao",
    "Fracture": "fratura",
}

DESCRICAO_POR_ACHADO: dict[str, str] = {
    "Atelectasis": "Opacidade com perda de volume, frequentemente com desvio de estruturas adjacentes.",
    "Consolidation": "Consolidação alveolar com broncogramas aéreos sugestiva de processo infeccioso.",
    "Infiltration": "Opacidades intersticiais/alveolares difusas (infiltrado).",
    "Pneumothorax": "Presença de ar no espaço pleural com colapso pulmonar parcial.",
    "Edema": "Opacidade intersticial bilateral sugestiva de edema pulmonar.",
    "Emphysema": "Hiperinsuflação com áreas de baixa atenuação sugestivas de enfisema.",
    "Fibrosis": "Opacidades reticulares/lineares com perda de volume sugestivas de fibrose.",
    "Effusion": "Opacidade homogénea no recesso costofrénico sugestiva de derrame pleural.",
    "Pneumonia": "Opacidade pulmonar com broncogramas aéreos sugestiva de pneumonia.",
    "Pleural_Thickening": "Espessamento pleural visível, geralmente sequelar.",
    "Cardiomegaly": "Aumento da silhueta cardíaca (índice cardiotorácico > 0.5).",
    "Nodule": "Nódulo pulmonar solitário com bordos bem definidos.",
    "Mass": "Massa pulmonar com densidade de partes moles a necessitar caracterização.",
    "Hernia": "Eventração/hérnia diafragmática com conteúdo abdominal intratorácico.",
    "Lung_Lesion": "Lesão pulmonar a necessitar correlação clínica e imagiológica.",
    "Fracture": "Solução de continuidade óssea com alteração do alinhamento.",
}

GRAVIDADE_ESPECIAL: dict[str, str] = {
    "Pneumothorax": "severo",
    "Mass": "severo",
    "Hernia": "moderado",
    "Consolidation": "moderado",
    "Effusion": "moderado",
    "Fracture": "moderado",
}


def idade_para_pediatria(idade: Optional[int]) -> bool:
    """Idade < 18 sugere contexto pediátrico (altera alguns limiares)."""
    if idade is None:
        return False
    return idade < 18


def processar_img_rx(img: Image.Image) -> np.ndarray:
    """Converte PIL Image para o tensor esperado (C, H, W)."""
    try:
        import torchxrayvision as xrv
    except ImportError as exc:  # pragma: no cover
        raise HTTPException(status_code=503, detail="torchxrayvision não instalado") from exc

    img = img.convert("RGB")
    arr = np.array(img, dtype=np.uint8)
    arr = xrv.datasets.normalize(arr, 255)
    if arr.ndim == 2:
        arr = arr[..., None]
    arr = arr.transpose(2, 0, 1)
    return arr


def analisar_imagem(
    imagem_bytes: bytes,
    modalidade: str,
    idade: Optional[int] = None,
) -> dict[str, Any]:
    """Executa o modelo e devolve um dict no formato esperado pelo frontend."""
    inicio = time.time()

    try:
        img = Image.open(io.BytesIO(imagem_bytes))
        img = img.convert("RGB")
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Imagem inválida: {exc}") from exc

    modelo = carregar_modelo()

    dados = processar_img_rx(img)

    import torch

    with torch.no_grad():
        tensores = torch.from_numpy(dados).unsqueeze(0).float()
        saida = modelo(tensores)
        probs = torch.sigmoid(saida).squeeze(0).cpu().numpy()

    labels = list(modelo.pathologies)
    probs_por_label: dict[str, float] = dict(zip(labels, np.round(probs, 4).tolist()))

    achados: list[dict[str, Any]] = []
    regioes: list[dict[str, Any]] = []
    recomendacoes: list[str] = []
    diagnostico_principal: Optional[str] = None
    confianca_principal = 0.0

    limiar_achado = 0.35 if idade_para_pediatria(idade) else 0.45

    for label in labels:
        prob = float(probs_por_label.get(label, 0.0))
        if prob >= limiar_achado:
            categoria = CATEGORIA_POR_ACHADO.get(label, "anomalia_textura")
            gravidade = GRAVIDADE_ESPECIAL.get(label, "moderado")
            if prob < 0.55:
                gravidade = "leve"
            elif prob >= 0.8:
                gravidade = "severo"

            confianca = int(round(prob * 100))
            achados.append({
                "tipo": label,
                "descricao": DESCRICAO_POR_ACHADO.get(label, label),
                "gravidade": gravidade,
                "confianca": confianca,
                "categoria": categoria,
                "localizacao": "Difuso / Geral",
            })

            regioes.append({
                "x": 0.5,
                "y": 0.5,
                "largura": 0.3,
                "altura": 0.3,
                "tipo": label,
                "confianca": confianca,
            })

            if confianca > confianca_principal:
                confianca_principal = confianca
                diagnostico_principal = label

            if gravidade == "severo":
                recomendacoes.append(
                    f"{label} com probabilidade elevada - reavaliação clínica urgente recomendada."
                )

    if not achados:
        achados.append({
            "tipo": "Exame Normal",
            "descricao": "Sem alterações significativas detectadas automaticamente.",
            "gravidade": "leve",
            "confianca": 85,
            "categoria": "normal",
            "localizacao": "Difuso / Geral",
        })
        recomendacoes.append("Exame dentro dos parâmetros de normalidade.")

    recomendacoes.append(
        "Análise assistida por IA (TorchXRayVision). O diagnóstico definitivo deve ser feito por médico especialista."
    )

    arr = np.array(img.convert("L"))
    brilho_medio = float(arr.mean() / 255.0 * 100)
    desvio = float(arr.std())
    contraste = float(min(desvio / 128.0 * 100, 100))

    return {
        "imagemId": 0,
        "modalidade": modalidade,
        "resumo": (
            f"{diagnostico_principal} (confiança: {int(confianca_principal)}%)"
            if diagnostico_principal
            else "Nenhuma alteração significativa detectada automaticamente."
        ),
        "achados": achados,
        "diagnosticoPrincipal": diagnostico_principal,
        "confiancaDiagnostico": int(confianca_principal),
        "recomendacoes": recomendacoes,
        "metadados": {
            "dimensoes": {"largura": img.width, "altura": img.height},
            "brilhoMedio": round(brilho_medio, 1),
            "nitidez": 0,
            "contraste": round(contraste, 1),
            "histograma": [],
            "razaoAspecto": round(img.width / img.height, 2) if img.height else 0,
        },
        "regioesInteresse": regioes,
        "processadoEm": time.strftime("%Y-%m-%dT%H:%M:%S"),
        "modelo": "torchxrayvision/DenseNet121",
        "tempoProcessamentoMs": int((time.time() - inicio) * 1000),
        "aviso": (
            "⚠️ Ferramenta experimental de apoio à decisão. Resultados baseados em "
            "modelo pré-treinado genérico; NÃO substitui avaliação médica especializada."
        ),
    }


# ---------------------------------------------------------------------------
# Schemas de resposta
# ---------------------------------------------------------------------------
class HealthResponse(BaseModel):
    status: str
    modelo_carregado: bool
    tempo_uptime: float


class AnaliseResponse(BaseModel):
    imagemId: int
    modalidade: str
    resumo: str
    achados: list[dict[str, Any]]
    diagnosticoPrincipal: Optional[str]
    confiancaDiagnostico: int
    recomendacoes: list[str]
    metadados: dict[str, Any]
    regioesInteresse: list[dict[str, Any]]
    processadoEm: str
    modelo: str
    tempoProcessamentoMs: int
    aviso: str


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------
@app.get("/api/health", response_model=HealthResponse)
def health() -> HealthResponse:
    """Healthcheck para o serviço (usado no arranque/deploys)."""
    return HealthResponse(
        status="ok" if _modelo is not None else "pronto",
        modelo_carregado=_modelo is not None,
        tempo_uptime=round(time.time() - _modelo_carregado_em, 1) if _modelo else 0.0,
    )


@app.post(
    "/api/analisar",
    response_model=AnaliseResponse,
    summary="Analisa radiografia de tórax",
    description="Envia uma imagem e opcionalmente a modalidade/idade; devolve achados com probabilidades.",
)
async def analisar(
    file: UploadFile = File(..., description="Imagem (JPG/PNG)"),
    modalidade: str = Form("Raio-X", description="Modalidade do exame"),
    idade: Optional[int] = Form(None, description="Idade do paciente (anos)"),
    _: None = Depends(verificar_token),
) -> AnaliseResponse:
    try:
        imagem_bytes = await file.read()
    except Exception as exc:
        raise HTTPException(status_code=400, detail="Falha ao ler ficheiro.") from exc

    resultado = analisar_imagem(imagem_bytes, modalidade, idade)
    return AnaliseResponse(**resultado)


@app.get("/")
def root() -> dict[str, str]:
    return {
        "servico": "Imagiologia AI Backend (TorchXRayVision)",
        "uso": "POST /api/analisar (multipart: file, modalidade, idade)",
        "health": "/api/health",
        "aviso": "Ferramenta experimental de apoio ao diagnóstico. Revisão médica obrigatória.",
    }


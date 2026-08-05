# Imagem com PyTorch + TorchXRayVision para o backend de IA
FROM pytorch/pytorch:2.4.1-cuda12.1-cudnn9-runtime

WORKDIR /app

# Copia requirements e instala dependências
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copia o código
COPY main.py .

# Porta do FastAPI
EXPOSE 8000

# Uvicorn com workers
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]

from fastapi.testclient import TestClient
import pytest
from main import app

client = TestClient(app)

def test_read_root():
    """Testa a rota de verificação de integridade do servidor (Health Check)."""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "online"
    assert data["project"] == "CondoAccess"
    assert "Condomínio Residencial Jardins do Tatuapé" in data["target_community"]

def test_get_packages_invalid_apartment_format():
    """Valida se o backend rejeita UUIDs inválidos na consulta de encomendas."""
    response = client.get("/apartments/invalid-uuid-123/packages")
    assert response.status_code == 422  # Unprocessable Entity (Erro de validação Pydantic)

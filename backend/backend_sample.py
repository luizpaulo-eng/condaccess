import os
import uuid
from uuid import UUID
from datetime import datetime
from typing import List, Optional
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from supabase import create_client, Client

app = FastAPI(
    title="CondAccess API",
    description="API de Gestão e Controle de Visitas e Encomendas para o Condomínio Residencial Jardins do Tatuapé",
    version="1.0.0"
)

# Habilita suporte a CORS para o Frontend React (Vercel / Localhost)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_ANON_KEY")

# Banco de dados em memória (Fallback local quando o Supabase não estiver configurado)
MOCK_PACKAGES = [
    {
        "id": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
        "apartment_id": "123e4567-e89b-12d3-a456-426614174000",
        "description": "Pacote e-Commerce (Caixa Grande - Mercado Livre)",
        "tracking_code": "BR987654321",
        "status": "received",
        "received_by": "98765432-e89b-12d3-a456-426614174000",
        "received_at": datetime.utcnow().isoformat(),
        "delivered_to": None,
        "delivered_at": None,
        "notes": "Deixado na portaria social"
    }
]

supabase: Optional[Client] = None
if SUPABASE_URL and SUPABASE_KEY and "your-supabase-url" not in SUPABASE_URL:
    try:
        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    except Exception as e:
        print(f"Aviso Supabase: {e}. Utilizando modo Fallback local.")

class LoginRequest(BaseModel):
    email: str
    password: str
    role: Optional[str] = "portaria"

class PackageCreate(BaseModel):
    apartment_id: UUID
    description: str
    tracking_code: Optional[str] = None
    notes: Optional[str] = None

class PackageResponse(BaseModel):
    id: UUID
    apartment_id: UUID
    description: str
    tracking_code: Optional[str] = None
    status: str
    received_by: UUID
    received_at: datetime
    delivered_to: Optional[UUID] = None
    delivered_at: Optional[datetime] = None
    notes: Optional[str] = None

@app.get("/", tags=["Health Check"])
def read_root():
    return {
        "status": "online",
        "project": "CondAccess",
        "target_community": "Condomínio Residencial Jardins do Tatuapé",
        "timestamp": datetime.utcnow().isoformat()
    }

@app.post("/login", tags=["Autenticação"])
def login(data: LoginRequest):
    mock_users = {
        "porteiro@jardinstatuape.com.br": {
            "id": "98765432-e89b-12d3-a456-426614174000",
            "nome": "Carlos Silva (Portaria Social)",
            "email": "porteiro@jardinstatuape.com.br",
            "role": "portaria",
            "apartmentId": None
        },
        "morador101@jardinstatuape.com.br": {
            "id": "11223344-e89b-12d3-a456-426614174000",
            "nome": "Ana Oliveira (Bloco 1 - Apto 101)",
            "email": "morador101@jardinstatuape.com.br",
            "role": "morador",
            "apartmentId": "123e4567-e89b-12d3-a456-426614174000"
        }
    }
    user = mock_users.get(data.email)
    if user:
        return {"access_token": f"mock-jwt-token-{uuid.uuid4()}", "token_type": "bearer", "user": user}
    return {
        "access_token": f"mock-jwt-token-{uuid.uuid4()}",
        "token_type": "bearer",
        "user": {
            "id": str(uuid.uuid4()),
            "nome": data.email.split("@")[0].capitalize(),
            "email": data.email,
            "role": data.role or "portaria",
            "apartmentId": "123e4567-e89b-12d3-a456-426614174000" if data.role == "morador" else None
        }
    }

@app.post("/packages", response_model=PackageResponse, status_code=status.HTTP_201_CREATED, tags=["Encomendas"])
def register_package(package_data: PackageCreate, current_user_id: UUID):
    if supabase:
        try:
            new_package = {
                "apartment_id": str(package_data.apartment_id),
                "description": package_data.description,
                "tracking_code": package_data.tracking_code,
                "received_by": str(current_user_id),
                "status": "received",
                "notes": package_data.notes
            }
            res = supabase.table("delivery_packages").insert(new_package).execute()
            if res.data and len(res.data) > 0:
                return res.data[0] if isinstance(res.data, list) else res.data
        except Exception as e:
            print(f"Erro ao inserir no Supabase ({e}). Usando fallback local.")

    mock_pkg = {
        "id": str(uuid.uuid4()),
        "apartment_id": str(package_data.apartment_id),
        "description": package_data.description,
        "tracking_code": package_data.tracking_code,
        "status": "received",
        "received_by": str(current_user_id),
        "received_at": datetime.utcnow().isoformat(),
        "delivered_to": None,
        "delivered_at": None,
        "notes": package_data.notes
    }
    MOCK_PACKAGES.append(mock_pkg)
    return mock_pkg

@app.get("/apartments/{apartment_id}/packages", response_model=List[PackageResponse], tags=["Encomendas"])
def get_apartment_packages(apartment_id: UUID, status_filter: Optional[str] = "received"):
    if supabase:
        try:
            query = supabase.table("delivery_packages").select("*").eq("apartment_id", str(apartment_id))
            if status_filter:
                query = query.eq("status", status_filter)
            res = query.execute()
            if res.data is not None and len(res.data) > 0:
                return res.data
        except Exception as e:
            print(f"Erro ao consultar Supabase ({e}). Usando fallback local.")

    filtered = [
        pkg for pkg in MOCK_PACKAGES 
        if pkg["apartment_id"] == str(apartment_id) and (not status_filter or pkg["status"] == status_filter)
    ]
    return filtered

@app.put("/packages/{package_id}/deliver", response_model=PackageResponse, tags=["Encomendas"])
def deliver_package_to_resident(package_id: UUID, resident_id: UUID):
    if supabase:
        try:
            update_data = {
                "status": "delivered",
                "delivered_to": str(resident_id),
                "delivered_at": datetime.utcnow().isoformat()
            }
            res = supabase.table("delivery_packages").update(update_data).eq("id", str(package_id)).execute()
            if res.data and len(res.data) > 0:
                return res.data[0] if isinstance(res.data, list) else res.data
        except Exception as e:
            print(f"Erro ao atualizar no Supabase ({e}). Usando fallback local.")

    for pkg in MOCK_PACKAGES:
        if pkg["id"] == str(package_id):
            pkg["status"] = "delivered"
            pkg["delivered_to"] = str(resident_id)
            pkg["delivered_at"] = datetime.utcnow().isoformat()
            return pkg
            
    raise HTTPException(status_code=404, detail="Encomenda não localizada.")

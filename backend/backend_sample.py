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

# Habilita suporte a CORS para o Frontend React (Vite / Localhost)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_ANON_KEY")

# Banco de dados em memória (Mock local para testes offline/sem credenciais Supabase)
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

supabase = None
if SUPABASE_URL and SUPABASE_KEY and "your-supabase-url" not in SUPABASE_URL:
    try:
        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    except Exception as e:
        print(f"Aviso Supabase: {e}. Utilizando modo Fallback local.")

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
                return res.data
        except Exception as e:
            print(f"Erro ao inserir no Supabase ({e}). Usando fallback local.")

    # Fallback local em memória
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
            if res.data is not None:
                return res.data
        except Exception as e:
            print(f"Erro ao consultar Supabase ({e}). Usando fallback local.")

    # Fallback local em memória
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
                return res.data
        except Exception as e:
            print(f"Erro ao atualizar no Supabase ({e}). Usando fallback local.")

    # Fallback local em memória
    for pkg in MOCK_PACKAGES:
        if pkg["id"] == str(package_id):
            pkg["status"] = "delivered"
            pkg["delivered_to"] = str(resident_id)
            pkg["delivered_at"] = datetime.utcnow().isoformat()
            return pkg
            
    raise HTTPException(status_code=404, detail="Encomenda não localizada.")

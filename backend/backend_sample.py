import os
from uuid import UUID
from datetime import datetime
from typing import List, Optional
from fastapi import FastAPI, HTTPException, status
from pydantic import BaseModel
from supabase import create_client, Client

app = FastAPI(
    title="CondoAccess API",
    description="API de Gestão e Controle de Visitas e Encomendas para o Condomínio Residencial Jardins do Tatuapé",
    version="1.0.0"
)

# -------------------------------------------------------------------------
# VARIABLES & INITS (Secure Configs for Luiz Paulo's Pipeline)
# -------------------------------------------------------------------------
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_ANON_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    # Local development fallbacks
    SUPABASE_URL = "https://your-supabase-url.supabase.co"
    SUPABASE_KEY = "your-anon-key"

# Initialize Supabase client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# -------------------------------------------------------------------------
# PYDANTIC SCHEMAS (Data Validation and Safety)
# -------------------------------------------------------------------------
class PackageCreate(BaseModel):
    apartment_id: UUID
    description: str
    tracking_code: Optional[str] = None
    notes: Optional[str] = None

class PackageResponse(BaseModel):
    id: UUID
    apartment_id: UUID
    description: str
    tracking_code: Optional[str]
    status: str
    received_by: UUID
    received_at: datetime
    delivered_to: Optional[UUID]
    delivered_at: Optional[datetime]
    notes: Optional[str]

# -------------------------------------------------------------------------
# API ROUTES (Endpoints of CondoAccess)
# -------------------------------------------------------------------------

@app.get("/", tags=["Health Check"])
def read_root():
    return {
        "status": "online",
        "project": "CondoAccess",
        "target_community": "Condomínio Residencial Jardins do Tatuapé",
        "timestamp": datetime.utcnow().isoformat()
    }

# --- ENCOMENDAS (Delivery Packages Endpoints) ---

@app.post("/packages", response_model=PackageResponse, status_code=status.HTTP_201_CREATED, tags=["Encomendas"])
def register_package(package_data: PackageCreate, current_user_id: UUID):
    """
    Registra o recebimento de uma nova encomenda na portaria.
    Este endpoint será consumido pela interface do Porteiro ao receber um pacote.
    """
    try:
        new_package = {
            "apartment_id": str(package_data.apartment_id),
            "description": package_data.description,
            "tracking_code": package_data.tracking_code,
            "received_by": str(current_user_id),
            "status": "received",
            "notes": package_data.notes
        }
        
        # Insert into Supabase Table
        response = supabase.table("delivery_packages").insert(new_package).execute()
        
        if not response.data:
            raise HTTPException(status_code=400, detail="Erro ao inserir registro de encomenda no banco.")
            
        return response.data
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro interno do servidor: {str(e)}")

@app.get("/apartments/{apartment_id}/packages", response_model=List[PackageResponse], tags=["Encomendas"])
def get_apartment_packages(apartment_id: UUID, status_filter: Optional[str] = "received"):
    """
    Busca todas as encomendas de um apartamento específico.
    Utilizado na interface acessível do Morador (React/WCAG) para verificar se há entregas pendentes.
    """
    try:
        query = supabase.table("delivery_packages").select("*").eq("apartment_id", str(apartment_id))
        
        if status_filter:
            query = query.eq("status", status_filter)
            
        response = query.execute()
        return response.data
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro de conexão com o banco de dados: {str(e)}")

@app.put("/packages/{package_id}/deliver", response_model=PackageResponse, tags=["Encomendas"])
def deliver_package_to_resident(package_id: UUID, resident_id: UUID):
    """
    Registra a entrega/retirada de uma encomenda pelo morador.
    Atualiza o status para 'delivered' e grava a data/hora e o morador que retirou.
    """
    try:
        update_data = {
            "status": "delivered",
            "delivered_to": str(resident_id),
            "delivered_at": datetime.utcnow().isoformat()
        }
        
        response = supabase.table("delivery_packages").update(update_data).eq("id", str(package_id)).execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail="Encomenda não localizada ou erro ao atualizar.")
            
        return response.data
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao atualizar status de entrega: {str(e)}")

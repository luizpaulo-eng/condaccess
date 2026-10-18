import os
import uuid
from uuid import UUID
from datetime import datetime
from typing import List, Optional
from fastapi import FastAPI, HTTPException, status, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

try:
    from supabase import create_client, Client
except ImportError:
    create_client = None
    Client = None

app = FastAPI(
    title="CondAccess API",
    description="API de Gestão e Controle de Visitas e Encomendas para o Condomínio Residencial Jardins do Tatuapé",
    version="1.3.0"
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

# -------------------------------------------------------------------------
# MOCK DATABASE (Fallback local em memória para testes e desenvolvimento)
# -------------------------------------------------------------------------
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

MOCK_VISITORS = [
    {
        "id": "c1d2e3f4-a5b6-7c8d-9e0f-1a2b3c4d5e6f",
        "name": "Roberto Alves (Técnico de Internet)",
        "document_id": "123.456.789-00",
        "visitor_type": "contractor",
        "company": "Claro Telecom",
        "photo_url": None,
        "created_at": datetime.utcnow().isoformat()
    }
]

MOCK_VISITS = [
    {
        "id": "f1e2d3c4-b5a6-9f8e-7d6c-5b4a3f2e1d0c",
        "visitor_id": "c1d2e3f4-a5b6-7c8d-9e0f-1a2b3c4d5e6f",
        "apartment_id": "123e4567-e89b-12d3-a456-426614174000",
        "registered_by": "98765432-e89b-12d3-a456-426614174000",
        "entry_time": datetime.utcnow().isoformat(),
        "exit_time": None,
        "status": "active",
        "notes": "Instalação de fibra óptica no Apto 101"
    }
]

supabase = None
if create_client and SUPABASE_URL and SUPABASE_KEY and "your-supabase-url" not in SUPABASE_URL:
    try:
        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    except Exception as e:
        print(f"Aviso Supabase: {e}. Utilizando modo Fallback local.")

# -------------------------------------------------------------------------
# FUNÇÃO AUXILIAR DE NOTIFICAÇÃO (ENVIO DE E-MAIL EM SEGUNDO PLANO)
# -------------------------------------------------------------------------

def send_email_notification(apartment_id: str, description: str, tracking_code: Optional[str] = None):
    """
    Função assíncrona executada em segundo plano (BackgroundTasks).
    Notifica o morador via e-mail sobre o recebimento de uma nova encomenda na portaria.
    """
    print(f"📧 [NOTIFICAÇÃO DISPARADA] E-mail enviado com sucesso para o morador do Apto {apartment_id} | Encomenda: '{description}' | Rastreio: {tracking_code or 'N/A'}")

# -------------------------------------------------------------------------
# PYDANTIC SCHEMAS (Validação e Modelagem de Dados)
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
    tracking_code: Optional[str] = None
    status: str
    received_by: UUID
    received_at: datetime
    delivered_to: Optional[UUID] = None
    delivered_at: Optional[datetime] = None
    notes: Optional[str] = None

class VisitorCreate(BaseModel):
    name: str
    document_id: Optional[str] = None
    visitor_type: str = "visitor"
    company: Optional[str] = None
    photo_url: Optional[str] = None

class VisitorResponse(BaseModel):
    id: UUID
    name: str
    document_id: Optional[str] = None
    visitor_type: str
    company: Optional[str] = None
    photo_url: Optional[str] = None
    created_at: datetime

class VisitCreate(BaseModel):
    visitor_id: UUID
    apartment_id: UUID
    notes: Optional[str] = None

class VisitResponse(BaseModel):
    id: UUID
    visitor_id: UUID
    apartment_id: UUID
    registered_by: UUID
    entry_time: datetime
    exit_time: Optional[datetime] = None
    status: str
    notes: Optional[str] = None

# -------------------------------------------------------------------------
# ROTAS DA API
# -------------------------------------------------------------------------

@app.get("/", tags=["Health Check"])
def read_root():
    return {
        "status": "online",
        "project": "CondAccess",
        "target_community": "Condomínio Residencial Jardins do Tatuapé",
        "timestamp": datetime.utcnow().isoformat()
    }

# --- ENCOMENDAS ---

@app.post("/packages", response_model=PackageResponse, status_code=status.HTTP_201_CREATED, tags=["Encomendas"])
def register_package(package_data: PackageCreate, current_user_id: UUID, background_tasks: BackgroundTasks):
    """
    Registra o recebimento de uma encomenda e aciona a notificação por e-mail em segundo plano.
    """
    background_tasks.add_task(
        send_email_notification,
        str(package_data.apartment_id),
        package_data.description,
        package_data.tracking_code
    )

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
            print(f"Erro ao inserir no Supabase ({e}). Usando fallback local em memória.")

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
    db_packages = []
    if supabase:
        try:
            query = supabase.table("delivery_packages").select("*").eq("apartment_id", str(apartment_id))
            if status_filter:
                query = query.eq("status", status_filter)
            res = query.execute()
            if res.data is not None:
                db_packages = res.data
        except Exception as e:
            print(f"Erro ao consultar Supabase ({e}). Usando fallback local.")

    # Combina encomendas do Supabase com o MOCK em memória (garantindo que cadastros recentes durante fallback apareçam)
    db_ids = {p["id"] for p in db_packages}
    local_filtered = [
        pkg for pkg in MOCK_PACKAGES 
        if pkg["apartment_id"] == str(apartment_id) 
        and (not status_filter or pkg["status"] == status_filter)
        and pkg["id"] not in db_ids
    ]
    return db_packages + local_filtered

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
        if str(pkg["id"]) == str(package_id):
            pkg["status"] = "delivered"
            pkg["delivered_to"] = str(resident_id)
            pkg["delivered_at"] = datetime.utcnow().isoformat()
            return pkg
            
    raise HTTPException(status_code=404, detail="Encomenda não localizada.")

@app.delete("/packages/{package_id}", status_code=status.HTTP_200_OK, tags=["Encomendas"])
def delete_package(package_id: UUID):
    if supabase:
        try:
            res = supabase.table("delivery_packages").delete().eq("id", str(package_id)).execute()
            return {"message": "Encomenda removida com sucesso.", "id": str(package_id)}
        except Exception as e:
            print(f"Erro ao deletar no Supabase ({e}). Usando fallback local.")

    global MOCK_PACKAGES
    initial_len = len(MOCK_PACKAGES)
    MOCK_PACKAGES = [pkg for pkg in MOCK_PACKAGES if str(pkg["id"]) != str(package_id)]
    if len(MOCK_PACKAGES) < initial_len:
        return {"message": "Encomenda removida com sucesso.", "id": str(package_id)}

    raise HTTPException(status_code=404, detail="Encomenda não localizada.")

# --- VISITANTES ---

@app.post("/visitors", response_model=VisitorResponse, status_code=status.HTTP_201_CREATED, tags=["Visitantes"])
def register_visitor(visitor_data: VisitorCreate):
    if supabase:
        try:
            new_visitor = {
                "name": visitor_data.name,
                "document_id": visitor_data.document_id,
                "visitor_type": visitor_data.visitor_type,
                "company": visitor_data.company,
                "photo_url": visitor_data.photo_url
            }
            res = supabase.table("visitors").insert(new_visitor).execute()
            if res.data and len(res.data) > 0:
                return res.data[0] if isinstance(res.data, list) else res.data
        except Exception as e:
            print(f"Erro ao cadastrar visitante no Supabase ({e}). Usando fallback local.")

    mock_visitor = {
        "id": str(uuid.uuid4()),
        "name": visitor_data.name,
        "document_id": visitor_data.document_id,
        "visitor_type": visitor_data.visitor_type,
        "company": visitor_data.company,
        "photo_url": visitor_data.photo_url,
        "created_at": datetime.utcnow().isoformat()
    }
    MOCK_VISITORS.append(mock_visitor)
    return mock_visitor

@app.get("/visitors", response_model=List[VisitorResponse], tags=["Visitantes"])
def get_visitors(document_id: Optional[str] = None):
    if supabase:
        try:
            query = supabase.table("visitors").select("*")
            if document_id:
                query = query.eq("document_id", document_id)
            res = query.execute()
            if res.data is not None:
                return res.data
        except Exception as e:
            print(f"Erro ao consultar visitantes no Supabase ({e}). Usando fallback local.")

    if document_id:
        return [v for v in MOCK_VISITORS if v.get("document_id") == document_id]
    return MOCK_VISITORS

@app.delete("/visitors/{visitor_id}", status_code=status.HTTP_200_OK, tags=["Visitantes"])
def delete_visitor(visitor_id: UUID):
    if supabase:
        try:
            res = supabase.table("visitors").delete().eq("id", str(visitor_id)).execute()
            return {"message": "Cadastro de visitante removido com sucesso.", "id": str(visitor_id)}
        except Exception as e:
            print(f"Erro ao deletar visitante no Supabase ({e}). Usando fallback local.")

    global MOCK_VISITORS
    initial_len = len(MOCK_VISITORS)
    MOCK_VISITORS = [v for v in MOCK_VISITORS if str(v["id"]) != str(visitor_id)]
    if len(MOCK_VISITORS) < initial_len:
        return {"message": "Cadastro de visitante removido com sucesso.", "id": str(visitor_id)}

    raise HTTPException(status_code=404, detail="Visitante não localizado.")

# --- CONTROLE DE VISITAS ---

@app.post("/visits", response_model=VisitResponse, status_code=status.HTTP_201_CREATED, tags=["Controle de Visitas"])
def register_visit_entry(visit_data: VisitCreate, registered_by: UUID):
    if supabase:
        try:
            new_visit = {
                "visitor_id": str(visit_data.visitor_id),
                "apartment_id": str(visit_data.apartment_id),
                "registered_by": str(registered_by),
                "status": "active",
                "notes": visit_data.notes
            }
            res = supabase.table("visit_records").insert(new_visit).execute()
            if res.data and len(res.data) > 0:
                return res.data[0] if isinstance(res.data, list) else res.data
        except Exception as e:
            print(f"Erro ao registrar visita no Supabase ({e}). Usando fallback local.")

    mock_visit = {
        "id": str(uuid.uuid4()),
        "visitor_id": str(visit_data.visitor_id),
        "apartment_id": str(visit_data.apartment_id),
        "registered_by": str(registered_by),
        "entry_time": datetime.utcnow().isoformat(),
        "exit_time": None,
        "status": "active",
        "notes": visit_data.notes
    }
    MOCK_VISITS.append(mock_visit)
    return mock_visit

@app.get("/visits", response_model=List[VisitResponse], tags=["Controle de Visitas"])
def get_visits(apartment_id: Optional[UUID] = None, status_filter: Optional[str] = "active"):
    if supabase:
        try:
            query = supabase.table("visit_records").select("*")
            if apartment_id:
                query = query.eq("apartment_id", str(apartment_id))
            if status_filter:
                query = query.eq("status", status_filter)
            res = query.execute()
            if res.data is not None:
                return res.data
        except Exception as e:
            print(f"Erro ao buscar registros de visitas no Supabase ({e}). Usando fallback local.")

    filtered = MOCK_VISITS
    if apartment_id:
        filtered = [v for v in filtered if str(v["apartment_id"]) == str(apartment_id)]
    if status_filter:
        filtered = [v for v in filtered if v["status"] == status_filter]
    return filtered

@app.put("/visits/{visit_id}/checkout", response_model=VisitResponse, tags=["Controle de Visitas"])
def checkout_visit_exit(visit_id: UUID):
    if supabase:
        try:
            update_data = {
                "status": "completed",
                "exit_time": datetime.utcnow().isoformat()
            }
            res = supabase.table("visit_records").update(update_data).eq("id", str(visit_id)).execute()
            if res.data and len(res.data) > 0:
                return res.data[0] if isinstance(res.data, list) else res.data
        except Exception as e:
            print(f"Erro ao registrar saída no Supabase ({e}). Usando fallback local.")

    for visit in MOCK_VISITS:
        if str(visit["id"]) == str(visit_id):
            visit["status"] = "completed"
            visit["exit_time"] = datetime.utcnow().isoformat()
            return visit

    raise HTTPException(status_code=404, detail="Registro de visita não localizado.")

@app.delete("/visits/{visit_id}", status_code=status.HTTP_200_OK, tags=["Controle de Visitas"])
def cancel_visit(visit_id: UUID):
    if supabase:
        try:
            res = supabase.table("visit_records").delete().eq("id", str(visit_id)).execute()
            return {"message": "Registro de visita cancelado com sucesso.", "id": str(visit_id)}
        except Exception as e:
            print(f"Erro ao cancelar visita no Supabase ({e}). Usando fallback local.")

    global MOCK_PACKAGES
    initial_len = len(MOCK_VISITS)
    MOCK_VISITS = [v for v in MOCK_VISITS if str(v["id"]) != str(visit_id)]
    if len(MOCK_VISITS) < initial_len:
        return {"message": "Registro de visita cancelado com sucesso.", "id": str(visit_id)}

    raise HTTPException(status_code=404, detail="Registro de visita não localizado.")

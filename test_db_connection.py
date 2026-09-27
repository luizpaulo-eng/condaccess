import os
import sys
from dotenv import load_dotenv

# Carrega as variáveis de ambiente do arquivo .env no mesmo diretório
load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_ANON_KEY")
DATABASE_URL = os.getenv("DATABASE_URL")

def test_supabase_client():
    print("--------------------------------------------------")
    print("1. Testando Conexão via Cliente Supabase Python...")
    print("--------------------------------------------------")
    if not SUPABASE_URL or not SUPABASE_KEY or "sua-ref" in SUPABASE_URL:
        print("❌ [ERRO] SUPABASE_URL ou SUPABASE_KEY não configuradas no arquivo .env!")
        return False

    try:
        from supabase import create_client, Client
        supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
        
        # Teste de consulta simples na tabela 'apartments'
        response = supabase.table("apartments").select("*").limit(1).execute()
        print("✅ Conexão via Supabase Client estabelecida com SUCESSO!")
        print(f"📊 Registros retornados na consulta de teste ('apartments'): {len(response.data)}")
        if response.data:
            print(f"   Exemplo de registro encontrado: {response.data[0]}")
        return True
    except Exception as e:
        print(f"❌ [ERRO] Falha ao conectar via Supabase Client: {e}")
        return False

def test_sqlalchemy_connection():
    print("\n--------------------------------------------------")
    print("2. Testando Conexão Direta PostgreSQL (SQLAlchemy)...")
    print("--------------------------------------------------")
    if not DATABASE_URL or "[SUA_SENHA_DO_BANCO]" in DATABASE_URL:
        print("⚠️ [AVISO] DATABASE_URL não preenchida ou contém o texto padrão no arquivo .env!")
        return False

    try:
        from sqlalchemy import create_engine, text
        engine = create_engine(DATABASE_URL)
        with engine.connect() as connection:
            result = connection.execute(text("SELECT current_database(), version();"))
            db_info = result.fetchone()
            print("✅ Conexão direta PostgreSQL/SQLAlchemy estabelecida com SUCESSO!")
            print(f"📌 Banco de dados ativo: {db_info[0]}")
            print(f"🐘 Versão do PostgreSQL: {db_info[1]}")
        return True
    except Exception as e:
        print(f"❌ [ERRO] Falha na conexão direta PostgreSQL: {e}")
        return False

if __name__ == "__main__":
    print("🚀 Iniciando Teste de Validação de Conexão com o Supabase (CondAccess)\n")
    client_ok = test_supabase_client()
    db_ok = test_sqlalchemy_connection()
    
    print("\n==================================================")
    if client_ok or db_ok:
        print("🎉 TESTE CONCLUÍDO: O Backend está pronto para se comunicar com o Supabase!")
    else:
        print("⚠️ TESTE COM FALHA: Verifique se o arquivo .env foi criado e preenchido com as chaves reais.")
    print("==================================================")

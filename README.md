<div align="center">
  <img src="assets/logo_condaccess228x160px1509260138.png" alt="Logo CondAccess" width="228" height="160" />

  ## CondAccess — Gestão e Controle de Visitas e Encomendas

  [![CI/CD Pipeline](https://github.com/luizpaulo-eng/condaccess/actions/workflows/ci.yml/badge.svg)](https://github.com/luizpaulo-eng/condaccess/actions/workflows/ci.yml)
  ![UNIVESP](https://img.shields.io/badge/UNIVESP-PJI240-red.svg)
  ![License](https://img.shields.io/badge/License-MIT-blue.svg)
  ![Python](https://img.shields.io/badge/Backend-FastAPI%20%7C%20Python%203.12-009688.svg)
  ![React](https://img.shields.io/badge/Frontend-React.js-61DAFB.svg)
  ![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL%20%7C%20Supabase-4169E1.svg)

  > **Universidade Virtual do Estado de São Paulo - UNIVESP**</br>
> **Projeto Integrador em Computação II - PJI240 - DRP14**  
> 2º Semestre de 2026

</div>

---

## 📌 Sobre o Projeto

O **CondAccess** é uma plataforma web responsiva, acessível e hospedada em nuvem, desenvolvida para solucionar os gargalos logísticos, de segurança e de acessibilidade enfrentados pelas portarias de condomínios residenciais.

### 🛑 O Problema
O controle manual feito em papel no **Condomínio Residencial Jardins do Tatuapé** (composto por 5 blocos e 340 apartamentos) gera:
- Extravio e atrasos na notificação de encomendas entregues aos moradores;
- Filas e conflitos no cadastro manual de prestadores de serviço e visitantes;
- Barreiras severas de acessibilidade digital para moradores idosos ou com deficiência visual/motora (desconformidade com as normas WCAG).

### 🎯 O Objetivo
Desenvolver e aplicar um sistema web acessível e moderno que automatize o registro de visitas e o recebimento de encomendas, enviando alertas em tempo real e garantindo navegabilidade universal via leitores de tela e comandos de teclado.

---
<p align="center">
  <img src="assets/teams_avatar_univesp_computacao.png" alt="Avatar do Grupo Univesp e Logo UNIVESP" width="527"/>
</p>

## 👥 Integrantes do Grupo

* **Orientador do PI:** Prof. Marco Tulio Vilela Bueno Jardim

| Integrante | Função Principal |
| :--- | :--- |
| **Ana Carolina de Lima Pacheco** ([@LPCarolinaAna](https://github.com/LPCarolinaAna)) | Banco de Dados (PostgreSQL / Supabase) |
| **Jennifer Dantas de Oliveira** ([@jennifer-d-oliveira](https://github.com/jennifer-d-oliveira)) | Backend (FastAPI / Autenticação) |
| **Lucas Santos Baptista** ([@lucabapt](https://github.com/lucabapt)) | Frontend (Acessibilidade WCAG / ARIA) |
| **Luiz Paulo Santos de Aboim Ingles** ([@luizpaulo-eng](https://github.com/luizpaulo-eng)) | DevOps & CI/CD (GitHub Actions / Cloud) |
| **Marcelo Pereira da Silva** | Backend (Rotas REST API / Lógica de Negócios) |
| **Paulo Eduardo Augusto Ronqui** | Frontend (Interfaces React.js) |
| **Pricila da Silva Veiga** | Gerenciamento de Projeto & Documentação ABNT |
| **Rodrigo Inocencio da Silva** ([@RodrigoInoc](https://github.com/RodrigoInoc)) | Relacionamento com a Comunidade Externa |

---

## 🏗️ Arquitetura e Tecnologias

A aplicação atende rigorosamente aos requisitos do tema norteador da UNIVESP para o PI II:

```text
                  +-----------------------------------+
                  |         Frontend (Vercel)         |
                  | React.js + ARIA + Acessibilidade  |
                  +-----------------+-----------------+
                                    |
                                    v (HTTP / REST API / Supabase Realtime)
                  +-----------------+-----------------+
                  |         Backend (Render)          |
                  |  FastAPI + Python + Pytest + JWT  |
                  +-----------------+-----------------+
                                    |
                                    v (SQL / ORM / Connection Pooling)
                  +-----------------+-----------------+
                  |   Banco de Dados (Supabase Cloud) |
                  |       PostgreSQL Relacional       |
                  +-----------------------------------+
```

* **Frontend:** React.js, Tailwind CSS, suporte a leitor de telas (`aria-live`, `role="status"`), alto contraste, atalhos de teclado e escuta de eventos em tempo real via Supabase Realtime. Hospedado na **Vercel**.
* **Backend:** Python 3.12 com FastAPI, Uvicorn, Supabase Python Client e suporte a testes unitários e de integração automatizados com Pytest. Hospedado no **Render**.
* **Banco de Dados:** PostgreSQL hospedado no **Supabase**, com modelo relacional contendo restrições únicas (`UNIQUE`), validação de papéis (`CHECK`), chaves estrangeiras e índices otimizados para `apartments`, `users`, `visitors`, `visit_records` e `delivery_packages`.
* **DevOps / CI/CD:** Esteira de Integração Contínua automatizada via **GitHub Actions** (`.github/workflows/ci.yml`), validando sintaxe SQL, estilo de código e testes de API a cada *commit*.

---

## 📂 Estrutura do Repositório

```text
condaccess/
├── .github/
│   └── workflows/
│       └── ci.yml             # Pipeline do GitHub Actions (Testes de Backend e Validação SQL)
├── backend/
│   ├── main.py                # Aplicação FastAPI com rotas REST e inicialização do Supabase
│   ├── requirements.txt       # Dependências Python (FastAPI, Supabase, SQLAlchemy, Pytest)
│   ├── .env.example           # Modelo de variáveis de ambiente do projeto
│   ├── test_db_connection.py  # Script de diagnóstico e validação de conexão com Supabase/PostgreSQL
│   └── test_main.py           # Suíte de testes unitários e de integração com Pytest
├── database/
│   └── condaccess_schema.sql  # DDL das tabelas, índices e restrições do PostgreSQL
├── frontend/
│   └── DeliveryAlert.jsx      # Componente React acessível com alertas em tempo real e WCAG/ARIA
└── README.md                  # Documentação oficial do repositório
```

---

## ⚙️ Guia de Inicialização em Desenvolvimento Local

Siga as instruções abaixo para configurar e executar a aplicação no seu computador local.

### 📋 Pré-requisitos
* **Python 3.12+** instalado ([python.org](https://www.python.org/))
* **Git** instalado e configurado ([git-scm.com](https://git-scm.com/))
* **Node.js 18+** (para o desenvolvimento do frontend React)
* Conta de desenvolvedor ativa na organização **CondAccess-UNIVESP** no Supabase.

---

### 1. Clonar o Repositório
Abra o terminal no seu computador e execute:
```bash
git clone https://github.com/luizpaulo-eng/condaccess.git
cd condaccess
```

---

### 2. Configurar o Ambiente de Banco de Dados (Supabase)
1. No painel do **Supabase**, acesse a organização `CondAccess-UNIVESP` e abra o projeto.
2. Certifique-se de que o script `database/condaccess_schema.sql` foi executado no **SQL Editor**.
3. Verifique se o **Realtime** está ativado para a tabela `delivery_packages` (`ALTER PUBLICATION supabase_realtime ADD TABLE delivery_packages;`).

---

### 3. Configurar e Executar o Backend (FastAPI)

Navegue até a pasta do backend:
```bash
cd backend
```

#### a) Criar e Ativar o Ambiente Virtual (`venv`)
* **Linux / macOS:**
  ```bash
  python3 -m venv venv
  source venv/bin/activate
  ```
* **Windows (PowerShell / CMD):**
  ```bash
  python -m venv venv
  venv\Scripts\activate
  ```

#### b) Instalar as Dependências
Com o ambiente virtual ativado, instale todas as bibliotecas listadas no `requirements.txt`:
```bash
pip install -r requirements.txt
```

#### c) Configurar as Variáveis de Ambiente (`.env`)
Copie o arquivo de exemplo para criar o seu arquivo `.env` local:
```bash
# Linux/macOS
cp .env.example .env

# Windows
copy .env.example .env
```
Abra o arquivo **`.env`** no seu editor de código (VS Code) e preencha com as chaves reais extraídas do painel do Supabase (*Project Settings -> API* e *Project Settings -> Database*):
```bash
DATABASE_URL=postgresql://postgres.ref:[SUA_SENHA]@aws-0-sa-east-1.pooler.supabase.com:6543/postgres
SUPABASE_URL=https://sua-ref.supabase.co
SUPABASE_ANON_KEY=sua_chave_anonima
SUPABASE_SERVICE_ROLE_KEY=sua_chave_service_role
```

#### d) Validar a Conexão com o Supabase
Execute o script de diagnóstico para testar se o Python está se comunicando com o Supabase:
```bash
python test_db_connection.py
```
*Se a configuração estiver correta, você verá a mensagem: `✅ Conexão estabelecida com SUCESSO!`.*

#### e) Executar os Testes Automatizados
```bash
pytest test_main.py -v
```

#### f) Iniciar o Servidor Local da API
```bash
uvicorn main:app --reload
```
A API estará acessível em `http://127.0.0.1:8000`.
Acesse a documentação interativa Swagger UI em: **`http://127.0.0.1:8000/docs`**.

---

### 4. Configurar e Executar o Frontend (React)

Navegue até a pasta do frontend e instale as dependências:
```bash
cd ../frontend
npm install
npm run dev
```
O aplicativo React estará disponível em `http://localhost:5173`.

---

## 🧪 Esteira de Integração Contínua (CI/CD)

Todas as alterações enviadas para as branches principais passam pela esteira do **GitHub Actions** (`.github/workflows/ci.yml`), validando:
1. Execução da suíte de testes unitários e de integração no backend Python;
2. Verificação de sintaxe dos scripts de schema SQL do PostgreSQL;
3. Formatação e integridade dos componentes do frontend.

---

## 📄 Licença

Este projeto é parte integrante das atividades acadêmicas do **Projeto Integrador em Computação II (PJI240)** da **UNIVESP** sob licença **MIT**.

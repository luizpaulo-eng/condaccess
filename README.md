<!-- ========================================================== -->
<!-- ATENÇÃO: INÍCIO DA ÁREA PROTEGIDA DO CONDACCESS, NÃO ALTERAR OU REMOVER AS TAGS ABAIXO -->
<!-- ========================================================== -->
<div align="center">
  <img src="assets/logo_condaccess228x160px1509260138.png" alt="Logo CondAccess" width="228" height="160" />

  ## Gestão e Controle de Visitas e Encomendas
<!-- ========================================================== -->
<!-- ATENÇÃO: FIM DA ÁREA PROTEGIDA DO CONDACCESS, NÃO ALTERAR OU REMOVER AS TAGS ACIMA -->
<!-- ========================================================== -->
  [![CI/CD Pipeline](https://github.com/luizpaulo-eng/condaccess/actions/workflows/ci.yml/badge.svg)](https://github.com/luizpaulo-eng/condaccess/actions/workflows/ci.yml)
  ![UNIVESP](https://img.shields.io/badge/UNIVESP-PJI240-red.svg)
  ![License](https://img.shields.io/badge/License-MIT-blue.svg)
  ![Python](https://img.shields.io/badge/Backend-FastAPI%20%7C%20Python%203.12-009688.svg)
  ![React](https://img.shields.io/badge/Frontend-React.js%20%7C%20Vite-61DAFB.svg)
  ![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL%20%7C%20Supabase-4169E1.svg)
<!-- ========================================================== -->
<!-- ATENÇÃO: INÍCIO DA ÁREA PROTEGIDA DO CONDACCESS, NÃO ALTERAR OU REMOVER AS TAGS ABAIXO -->
<!-- ========================================================== -->
  > **Universidade Virtual do Estado de São Paulo - UNIVESP**</br>
> **Projeto Integrador em Computação II - PJI240 - DRP14**  
> 2º Semestre de 2026
<!-- ========================================================== -->
<!-- ATENÇÃO: FIM DA ÁREA PROTEGIDA DO CONDACCESS, NÃO ALTERAR OU REMOVER AS TAGS ACIMA -->
<!-- ========================================================== -->
</div>

---

## 📌 Sobre o Projeto

O **CondAccess** é uma plataforma web responsiva, acessível e hospedada em nuvem, desenvolvida para solucionar os gargalos logísticos, de segurança e de acessibilidade enfrentados pelas portarias de condomínios residenciais.

### 🛑 O Problema
O controle manual feito em papel no **Condomínio Residencial Jardins do Tatuapé** (composto por 5 blocos e 340 apartamentos) gera:
- Extravio e atrasos na notificação de encomendas entregues aos moradores;
- Filas e conflitos no cadastro manual de prestadores de serviço e visitantes;
- Barreiras severas de acessibilidade digital para moradores idosos ou com deficiência visual/motora (desconformidade com as normas WCAG 2.1 AA).

### 🎯 O Objetivo
Desenvolver e aplicar um sistema web acessível e moderno que automatize o registro de visitas e o recebimento de encomendas, enviando alertas em tempo real e garantindo navegabilidade universal via leitores de tela, alto contraste e comandos de teclado.

---
<!-- ========================================================== -->
<!-- ATENÇÃO: INÍCIO DA ÁREA PROTEGIDA DO CONDACCESS, NÃO ALTERAR OU REMOVER AS TAGS ABAIXO -->
<!-- ========================================================== -->
<p align="center">
  <img src="assets/teams_avatar_univesp_computacao.png" alt="Avatar do Grupo Univesp e Logo UNIVESP" width="527"/>
</p>

## 👥 Integrantes do Grupo

* **Orientador do PI:** Prof. Marco Tulio Vilela Bueno Jardim

| Integrante | Função Principal |
| :--- | :--- |
| **Ana Carolina de Lima Pacheco** | Banco de Dados (PostgreSQL / Supabase) |
| **Jennifer Dantas de Oliveira** ([@jennifer-d-oliveira](https://github.com/jennifer-d-oliveira))| Backend (FastAPI / Autenticação) |
| **Lucas Santos Baptista** ([@lucabapt](https://github.com/lucabapt)) | Frontend (Acessibilidade WCAG / ARIA) |
| **Luiz Paulo Santos de Aboim Ingles** ([@luizpaulo-eng](https://github.com/luizpaulo-eng))| DevOps & CI/CD (GitHub Actions / Cloud) |
| **Marcelo Pereira da Silva** ([@univesp-marcelo](https://github.com/univesp-marcelo))| Backend (Rotas REST API / Lógica de Negócios) |
| **Paulo Eduardo Augusto Ronqui** ([@pauloearonchi](https://github.com/pauloearonchi)| Frontend (Interfaces React.js) |
| **Pricila da Silva Veiga** | Gerenciamento de Projeto & Documentação ABNT |
| **Rodrigo Inocencio da Silva** | Relacionamento com a Comunidade Externa |
<!-- ========================================================== -->
<!-- ATENÇÃO: FIM DA ÁREA PROTEGIDA DO CONDACCESS, NÃO ALTERAR OU REMOVER AS TAGS ACIMA -->
<!-- ========================================================== -->
---

#### ⚠️ Nota de Contribuição e Proteção de Código

> **Aviso aos Desenvolvedores e Integrantes:** As seções contidas entre os comentários `<!-- INÍCIO DA ÁREA PROTEGIDA DO CONDACCESS -->` e `<!-- FIM DA ÁREA PROTEGIDA DO CONDACCESS -->` são **fixas e protegidas**. Em atualizações e novas versões deste arquivo, **mantenha intactos todos os blocos, badges, logos e tabelas dentro dessas marcações**. O restante da documentação (arquitetura, guias de execução, testes e rotas) pode ser editado livremente conforme a evolução do sistema.

---

## 🏗️ Arquitetura e Tecnologias

A aplicação atende rigorosamente aos requisitos do tema norteador da UNIVESP para o PI II:

```text
                  +-----------------------------------+
                  |         Frontend (Vite/React)     |
                  | React.js + WCAG 2.1 AA + ARIA     |
                  +-----------------+-----------------+
                                    |
                                    v (HTTP / REST API / CORS Enabled)
                  +-----------------+-----------------+
                  |         Backend (FastAPI)         |
                  |  FastAPI + Uvicorn + Pytest + CORS|
                  +-----------------+-----------------+
                                    |
                                    v (SQL / Supabase Client / Fallback Local)
                  +-----------------+-----------------+
                  |   Banco de Dados (Supabase Cloud) |
                  |       PostgreSQL Relacional       |
                  +-----------------------------------+
```

* **Frontend:** React.js construído com **Vite**, suporte a leitor de telas (`aria-live`, `role="status"`), modo de alto contraste para idosos e leitores de tela, áreas de toque de 48px (WCAG 2.1 AA) e integração dinâmica com a API backend.
* **Backend:** Python 3.12 com FastAPI, Uvicorn, suporte a CORS Middleware, integração com Supabase e modo de *fallback* com banco em memória para desenvolvimento e testes locais offline.
* **Banco de Dados:** PostgreSQL hospedado no **Supabase**, com modelo relacional contendo restrições únicas (`UNIQUE`), validação de papéis (`CHECK`), chaves estrangeiras e índices otimizados para `apartments`, `users`, `visitors`, `visit_records` e `delivery_packages`.
* **DevOps / CI/CD:** Esteira de Integração Contínua automatizada via **GitHub Actions** (`.github/workflows/ci.yml`), validando sintaxe SQL e testes de API a cada *Pull Request*.

---

## 📂 Estrutura Atualizada do Repositório

```text
condaccess/
├── .github/
│   └── workflows/
│       └── ci.yml             # Pipeline do GitHub Actions (Testes do Backend e Validação SQL)
├── backend/
│   ├── backend_sample.py      # API FastAPI com rotas REST, CORS e suporte a Fallback local / Supabase
│   ├── requirements.txt       # Dependências Python (FastAPI, Supabase, Uvicorn, Pytest)
│   ├── .env.example           # Modelo de variáveis de ambiente do projeto
│   ├── test_db_connection.py  # Script de diagnóstico e validação de conexão com Supabase
│   └── test_main.py           # Suíte de testes unitários e de integração com Pytest
├── database/
│   └── condaccess_schema.sql  # DDL das tabelas, índices e restrições do PostgreSQL
├── frontend/
│   ├── index.html             # Ponto de entrada HTML do Vite ("CondAccess - Painel de Encomendas")
│   ├── main.jsx               # Ponto de montagem React com ReactDOM.createRoot
│   ├── DeliveryAlert.jsx      # Componente React acessível (WCAG 2.1 AA) para gestão de encomendas
│   ├── package.json           # Scripts (dev, build, preview) e dependências (React, Vite)
│   └── package-lock.json      # Trava de versões das dependências do npm
└── README.md                  # Documentação oficial do repositório
```

---

## ⚙️ Guia Completo de Inicialização para a Equipe

Siga os passos abaixo para colocar o ambiente **Full Stack (Backend + Frontend)** rodando na sua máquina local.

---

### 1. Clonar o Repositório e Criar sua Branch
No terminal (PowerShell ou Bash):
```bash
git clone https://github.com/luizpaulo-eng/condaccess.git
cd condaccess
```

---

### 2. Executar o Backend (FastAPI em Python)

Abra um terminal no VS Code e acesse a pasta `backend`:

```powershell
cd backend
```

#### a) Criar e Ativar o Ambiente Virtual (`venv`)
* **Windows (PowerShell):**
  ```powershell
  python -m venv venv
  .\venv\Scripts\activate
  ```
* **Linux / macOS:**
  ```bash
  python3 -m venv venv
  source venv/bin/activate
  ```

#### b) Instalar as Dependências
```powershell
pip install -r requirements.txt
```

#### c) Configurar Variáveis de Ambiente (Opcional para testes locais)
Copie o arquivo `.env.example` para `.env`:
```powershell
copy .env.example .env
```
*(Nota: Se as chaves do Supabase não forem preenchidas, a API utilizará automaticamente o modo de **fallback local em memória**, permitindo testar todas as rotas `GET`, `POST` e `PUT` sem erros).*

#### d) Iniciar o Servidor FastAPI
```powershell
python -m uvicorn backend_sample:app --reload --port 8000
```

* **API Online:** `http://localhost:8000`
* **Documentação Interativa (Swagger UI):** `http://localhost:8000/docs`

---

### 3. Executar o Frontend (React + Vite)

Abra um **segundo terminal** no VS Code e acesse a pasta `frontend`:

```powershell
cd frontend
```

#### a) Instalar as Dependências do npm
```powershell
npm install
```

#### b) Iniciar o Servidor de Desenvolvimento Vite
```powershell
npm run dev
```

* **Aplicação Frontend:** `http://localhost:5173`

---

### 🧪 4. Como Testar a Aplicação Full Stack no Navegador

1. Abra o navegador (Opera, Chrome ou Edge) em `http://localhost:5173/`.
2. **Visualização Inicial (`GET`)**: A página exibirá o cabeçalho **"CondAccess - Painel de Encomendas"** e carregará as encomendas pendentes vindas do backend.
3. **Recebimento na Portaria (`POST`)**: Clique no botão verde **`+ Receber Nova Encomenda (Portaria)`**, preencha a descrição do pacote e clique em salvar. O pacote será registrado na API e surgirá na lista.
4. **Confirmação de Retirada (`PUT`)**: Clique em **`Confirmar Retirada`** em um dos pacotes para dar baixa e atualizar a lista em tempo real.
5. **Inspeção de Rede**: Pressione **`F12`** (ou botão direito $\rightarrow$ **Inspecionar**) no navegador, vá na aba **Network / Rede** $\rightarrow$ filtro **Fetch/XHR** e observe as requisições HTTP (`200 OK` e `201 Created`).

---

## 🔀 Fluxo de Contribuição no Git e GitHub

Devido às **regras de proteção da branch `main`** (`GH013`), nenhum envio de código pode ser feito diretamente na `main`. Todo o desenvolvimento deve seguir o fluxo abaixo:

1. **Criar uma nova branch de funcionalidade:**
   ```powershell
   git checkout -b feat/nome-da-sua-feature
   ```
2. **Desenvolver, salvar os arquivos (`Ctrl + S`) e fazer o commit:**
   ```powershell
   git add .
   git commit -m "feat: descricao clara da alteracao"
   ```
3. **Enviar a branch para o GitHub:**
   ```powershell
   git push -u origin feat/nome-da-sua-feature
   ```
4. **Abrir um Pull Request (PR):**
   Acesse [github.com/luizpaulo-eng/condaccess](https://github.com/luizpaulo-eng/condaccess), clique em **"Compare & pull request"**, aguarde a validação dos testes do GitHub Actions (`test-backend`) e clique em **"Confirm merge"**.

---

## 📄 Licença

Este projeto é parte integrante das atividades acadêmicas do **Projeto Integrador em Computação II (PJI240)** da **UNIVESP** sob licença **MIT**.

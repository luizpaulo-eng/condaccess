# 🏢 CondAccess — Sistema Web Acessível para Gestão e Controle de Visitas e Encomendas

[![CI/CD Pipeline](https://github.com/luizpaulo-eng/condaccess/actions/workflows/ci.yml/badge.svg)](https://github.com/luizpaulo-eng/condaccess/actions/workflows/ci.yml)
![Univesp](https://img.shields.io/badge/UNIVESP-PJI240-red.svg)
![License](https://img.shields.io/badge/License-MIT-blue.svg)
![Python](https://img.shields.io/badge/Backend-FastAPI%20%7C%20Python%203.12-009688.svg)
![React](https://img.shields.io/badge/Frontend-React.js-61DAFB.svg)
![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL%20%7C%20Supabase-4169E1.svg)

> **Projeto Integrador em Computação II (PJI240 / DRP14 - Turma 004)**  
> **Universidade Virtual do Estado de São Paulo (UNIVESP)** — 2º Semestre de 2026.

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
<dl><dd><dl><dd><dl><dd><dl><dd><dl><dd><dl><dd>
  <img src="assets/teams_avatar_univesp_computacao.png" alt="Avatar do Grupo Univesp" width="160"/>
</dd></dl></dd></dl></dd><dl><dd><dl><dd><dl><dd><dl>

## 👥 Integrantes do Grupo e Papéis

* **Orientador do PI:** Prof. Marco Tulio Vilela Bueno Jardim

| Integrante | Função Principal |
| :--- | :--- |
| **Ana Carolina de Lima Pacheco** | Banco de Dados (PostgreSQL / Supabase) |
| **Jennifer Dantas de Oliveira** | Backend (FastAPI / Autenticação) |
| **Lucas Santos Baptista** | Frontend (Acessibilidade WCAG / ARIA) |
| **Luiz Paulo Santos de Aboim Ingles** ([@luizpaulo-eng](https://github.com/luizpaulo-eng)) | DevOps & CI/CD (GitHub Actions / Cloud) |
| **Marcelo Pereira da Silva** | Backend (Rotas REST API / Lógica de Negócios) |
| **Paulo Eduardo Augusto Ronqui** | Frontend (Interfaces React.js) |
| **Pricila da Silva Veiga** | Gerenciamento de Projeto & Documentação ABNT |
| **Rodrigo Inocencio da Silva** | Relacionamento com a Comunidade Externa |

---

## 🏗️ Arquitetura e Tecnologias

A aplicação atende rigorosamente aos requisitos do tema norteador da UNIVESP para o PI II:

```text
                  +-----------------------------------+
                  |         Frontend (Vercel)         |
                  | React.js + ARIA + Acessibilidade  |
                  +-----------------+-----------------+
                                    |
                                    v (HTTP / REST API)
                  +-----------------+-----------------+
                  |         Backend (Render)          |
                  |  FastAPI + Python + Pytest + JWT  |
                  +-----------------+-----------------+
                                    |
                                    v (SQL / ORM)
                  +-----------------+-----------------+
                  |   Banco de Dados (Supabase Cloud) |
                  |       PostgreSQL Relacional       |
                  +-----------------------------------+
```

* **Frontend:** React.js, Tailwind CSS, suporte a leitor de telas (`aria-live`, `role="status"`), alto contraste e atalhos de teclado. Hospedado na **Vercel**.
* **Backend:** Python 3.12 com FastAPI, Uvicorn e suporte a testes unitários automatizados com Pytest. Hospedado no **Render**.
* **Banco de Dados:** PostgreSQL hospedado no **Supabase**, com modelo relacional para `apartamentos`, `usuarios`, `visitantes`, `registros_visitas` e `encomendas`.
* **DevOps / CI/CD:** Esteira de Integração Contínua automatizada via **GitHub Actions** (`.github/workflows/ci.yml`), validando sintaxe SQL, estilo de código e testes de API a cada *commit*.

---

## 📂 Estrutura do Repositório

```text
condaccess/
├── .github/
│   └── workflows/
│       └── ci.yml             # Pipeline do GitHub Actions (Testes de Backend e Validação SQL)
├── backend/
│   ├── backend_sample.py      # Aplicação FastAPI com rotas de login e notificações de encomendas
│   └── test_main.py           # Suíte de testes unitários automatizados com Pytest
├── database/
│   └── condaccess_schema.sql  # DDL das tabelas, índices e FKs do PostgreSQL
├── frontend/
│   └── DeliveryAlert.jsx      # Componente React acessível com alertas sonoros e ARIA
└── README.md                  # Documentação oficial do repositório
```

---

## ⚙️ Como Executar o Projeto Localmente

### Pré-requisitos
* Python 3.12+ instalados
* Git configurado
* Node.js 18+ (para o frontend)

### 1. Clonar o repositório
```bash
git clone https://github.com/luizpaulo-eng/condaccess.git
cd condaccess
```

### 2. Executar e Testar o Backend (FastAPI)
```bash
cd backend

# Criar e ativar ambiente virtual
python -m venv venv
source venv/bin/activate  # No Windows: venv\Scripts\activate

# Instalar dependências
pip install fastapi uvicorn pytest httpx

# Executar a suíte de testes automatizados
pytest test_main.py -v

# Iniciar o servidor local
uvicorn backend_sample:app --reload
```
Acesse a documentação interativa da API no navegador: `http://127.0.0.1:8000/docs`.

---

## 🧪 Integração Contínua (CI/CD)

Todas as alterações enviadas para a branch `main` passam automaticamente pela esteira de validação no **GitHub Actions**, garantindo:
1. Execução de testes unitários e de integração no backend Python;
2. Verificação de sintaxe do arquivo de schema SQL;
3. Relatórios automáticos de aprovação dos testes.

---

## 📄 Licença

Este projeto é parte integrante das atividades acadêmicas da UNIVESP sob licença **MIT**.

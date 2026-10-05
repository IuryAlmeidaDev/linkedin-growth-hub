# 🚀 LinkedIn Growth Hub & AutoPost

Automação inteligente de conteúdo e networking no LinkedIn focada em autoridade técnica em Engenharia de Software e Inteligência Artificial.

## 🌟 Funcionalidades
1. **Publicador Inteligente a cada 2 dias (LLM Local - `agy`):**
   - Dispara a cada **2 dias** às **08:30**.
   - Analisa novidades reais de IA e papers científicos (arXiv, MCP, LLMs, DeepSeek, RAG, MoE, inferência, context caching).
   - Foco 100% em autoridade técnica, lições práticas de engenharia e debate de qualidade (sem chamadas comerciais de autopromoção).
   - Filtro automático pós-geração para garantir que nenhuma menção de freela/consultoria/DM seja publicada.
   - Trava de intervalo mínimo de segurança (mínimo de 36h entre posts automáticos).

2. **Radar de Freelas & Conexões (Web Dashboard):**
   - Filtros em tempo real de pessoas pedindo devs/freelas no LinkedIn.
   - Listas de Tech Recruiters PJ, Donos de Software Houses e Founders.
   - Notas de conexão calibradas com `< 200 caracteres` e cópia em 1 clique.

## 🛠️ Tecnologias
- Node.js (API REST oficial do LinkedIn v202609)
- Windows Task Scheduler (Intervalo de 2 em 2 dias às 08:30)
- LLM Local (`agy`)
- Vercel (Dashboard Web Responsivo)

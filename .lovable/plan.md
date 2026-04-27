
# Simulador de Prova B1 Sob Pressão — MVP

Plataforma web bilíngue (PT/DE) que simula a prova oral B1 do Goethe com gravação de vídeo+áudio, cronômetros reais, feedback automático por IA e geração de PDF do resultado. Login funciona como **captura de lead** (nome, email, WhatsApp) com captcha e consentimento LGPD.

---

## 1. Fluxo do usuário

```text
Landing (/)
  → Cadastro (nome, email, WhatsApp, captcha, checkbox LGPD)
  → Dashboard (/dashboard)
       ├─ Iniciar Nova Prova
       ├─ Histórico (últimos simulados + gráfico)
       └─ Baixar PDF do último resultado
  → Simulador (/exam)
       1. Instruções
       2. Sorteio do tema + cronômetro 15 min de preparação + bloco de notas
       3. Parte 1 — Apresentação (gravação webcam 3-4 min)
       4. Parte 2 — Discussão (pergunta + 30s prep + gravação 3-4 min)
       5. Parte 3 — Spontansprache (3 imagens, escolhe 1, 1 min prep + gravação 3-4 min)
       6. Processando feedback (IA analisa transcrições)
       7. Resultado final (/exam/:id/result) com pontuação, gráficos, PDF
```

---

## 2. Captura de lead (auth)

- Tela de cadastro única (sem senha tradicional — magic link via Lovable Cloud email auth, ou senha simples).
- Campos: **Nome completo**, **Email**, **WhatsApp** (com máscara BR), **Captcha** (challenge matemático simples client-side, ex: "Quanto é 7 + 4?"), **Checkbox obrigatório**: *"Autorizo o uso dos meus dados (nome, email, WhatsApp) exclusivamente para fins de divulgação e marketing do programa."*
- Validação com **zod**: nome 2-100 chars, email válido, WhatsApp regex BR, checkbox=true, captcha correto.
- Dados salvos em `profiles` (vinculada a `auth.users`) — utilizável para campanhas.
- Login posterior só com email (magic link).

---

## 3. Banco de dados (Lovable Cloud / Supabase)

```text
profiles            id (=auth.users.id), full_name, email, whatsapp,
                    consent_marketing bool, consent_at timestamp, created_at

exam_themes         id, title_pt, title_de, description_pt, description_de,
                    difficulty, tips, redemittel[], discussion_questions[]

exam_images         id, url, description_pt, description_de, difficulty

exam_sessions       id, user_id, mode, theme_id, image_id,
                    started_at, completed_at, total_score,
                    scores jsonb (pronuncia, fluencia, estrutura, vocab, gramatica),
                    feedback jsonb (por parte 1/2/3), status

exam_recordings     id, session_id, part (1|2|3), video_url,
                    transcript text, duration_sec
```

RLS: usuário só vê suas próprias linhas. `exam_themes`/`exam_images` públicos para leitura.

Seed inicial: **15 temas**, **15 imagens**, **5-7 perguntas por tema** (bilíngue).

---

## 4. Gravação webcam + áudio

- API `navigator.mediaDevices.getUserMedia({ video: true, audio: true })`.
- `MediaRecorder` em formato `webm` (codec vp9/opus).
- Preview ao vivo + indicador de áudio (waveform via Web Audio API).
- Cronômetro grande em vermelho, parada automática ao zerar.
- Upload do blob para **Supabase Storage** (bucket `recordings`, privado, RLS por user_id).

---

## 5. Feedback automático por IA (Lovable AI Gateway)

Para cada parte gravada:
1. Server function transcreve o áudio (extraído do webm) via modelo de speech-to-text suportado, OU envia o áudio ao Gemini multimodal que aceita áudio diretamente.
2. Server function chama `google/gemini-2.5-flash` com schema estruturado pedindo:
   - Notas 1-10 em: pronúncia, fluência, estrutura, vocabulário, gramática
   - Pontos fortes (lista)
   - Pontos a melhorar (lista)
   - Erros gramaticais detectados com correção
   - Sugestões de Redemittel B1 que caberiam
3. Resultado salvo em `exam_sessions.scores` e `feedback`.

Tela "Processando..." com skeleton enquanto IA roda (~10-20s por parte).

---

## 6. Resultado + PDF

Tela de resultado:
- Pontuação grande (0-100) = média ponderada das 3 partes.
- Cards por categoria (verde/amarelo/vermelho).
- Gráfico de evolução (recharts) das últimas 5 sessões.
- Player para reassistir cada gravação.
- Botão **"Baixar PDF do resultado"** → gera PDF client-side com `jspdf` + `html2canvas` contendo: dados do lead, tema, pontuações, feedback completo, data. Usado pelo time de marketing como prova social/follow-up.

---

## 7. Bilíngue PT/DE

- Toggle no header (persistido em localStorage).
- Strings em `src/i18n/pt.ts` e `src/i18n/de.ts` + hook `useT()`.
- Conteúdo dos temas/imagens/perguntas armazenado em ambos idiomas no banco.

---

## 8. Design

- Paleta: dourado `#d4af37`, preto `#1a1a1a`, branco, azul `#3498db`, verde sucesso, vermelho alerta — registrada como tokens semânticos em `src/styles.css` (oklch).
- Tipografia: **Montserrat** (títulos) + **Open Sans** (corpo) via Google Fonts.
- Layout responsivo: sidebar no desktop, hamburger no mobile.
- Ícones: lucide-react (Timer, Camera, Mic, BarChart, Award, Star).

---

## 9. Estrutura de rotas (TanStack Start)

```text
src/routes/
  index.tsx                  → landing + CTA cadastro
  signup.tsx                 → captura de lead
  login.tsx                  → magic link
  _authenticated.tsx         → guard (redirect se não logado)
  _authenticated/
    dashboard.tsx
    exam/index.tsx           → seleção de modo + instruções
    exam/run.tsx             → state machine das 3 partes
    exam/$sessionId/result.tsx
    themes.tsx               → banco de temas (consulta)
```

Server functions (`createServerFn`) para: criar sessão, upload de gravação, chamar IA, calcular score final, listar histórico.

---

## 10. Detalhes técnicos

- **Lovable Cloud** ativado: auth (email magic link), Postgres com RLS, Storage para vídeos.
- **Lovable AI Gateway** para feedback (sem chave externa necessária).
- **Validação** com `zod` em todos os formulários e server functions.
- **Captcha** matemático client-side (suficiente para MVP de captura de lead; pode evoluir para hCaptcha depois).
- **PDF** com `jspdf` + `jspdf-autotable`.
- **Gráficos** com `recharts`.
- **Máscara WhatsApp** com input controlado simples.
- LGPD: registro de `consent_at` e `consent_marketing` em `profiles`; rodapé com link para política de privacidade (placeholder).

---

## 11. Fora de escopo deste MVP (fica para depois)

- Integração com Nutror SSO.
- Banco completo com 50+ temas (começa com 15, expansível).
- Comparação com vídeos de alunos aprovados.
- Modo offline.
- App mobile nativo.
- hCaptcha/reCAPTCHA real (placeholder matemático no MVP).

---

## 12. Ordem de implementação

1. Lovable Cloud + tabelas + seed de temas/imagens/perguntas.
2. Design system (cores, fontes, tokens).
3. i18n PT/DE.
4. Landing + cadastro com captcha/LGPD + login.
5. Dashboard com histórico e gráfico.
6. Motor do exame: cronômetros, sorteio, bloco de notas.
7. Componente de gravação webcam + upload.
8. Server functions de IA (transcrição + feedback estruturado).
9. Tela de resultado + geração de PDF.
10. Polimento responsivo e revisão de RLS/segurança.

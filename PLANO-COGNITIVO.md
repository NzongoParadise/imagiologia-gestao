# Portal Médico Cognitivo — Plano de Implementação

## Objetivo
Transformar o Portal Médico em um ambiente de **Inteligência Clínica** (Copiloto Clínico),
sem quebrar nenhuma funcionalidade existente (incluindo o `/medico` atual).

## Stack
Next.js 16 (App Router), React 19, TypeScript, Prisma, PostgreSQL (Neon), Tailwind, Shadcn-style UI, React Query, Zustand, NextAuth v5, Recharts. Backend Python/FastAPI + MONAI/OpenCV para IA explicável.

## Módulos (menu "Portal Médico Cognitivo" em `/cognitivo/*`)
1. `Dashboard Cognitivo` — `/cognitivo`
2. `Linha Temporal Clínica` — `/cognitivo/linha-temporal`
3. `Digital Twin Radiológico` — `/cognitivo/digital-twin`
4. `Evolução Radiológica` — `/cognitivo/evolucao`
5. `Detector Inteligente de Mudanças` — `/cognitivo/detector-mudancas`
6. `Assistente Clínico Explicável` — `/cognitivo/assistente`
7. `Memória Clínica Hospitalar` — `/cognitivo/memoria-clinica`
8. `Detector de Contradições` — `/cognitivo/contradicoes`
9. `Radar Epidemiológico` — `/cognitivo/radar-epidemiologico`
10. `Previsão Inteligente` — `/cognitivo/previsao`
11. `Segunda Opinião` — `/cognitivo/segunda-opiniao`
12. `Reunião Clínica` — `/cognitivo/reunioes`
13. `Pesquisa Científica` — `/cognitivo/pesquisa`
14. `IA Generativa` — `/cognitivo/ia-generativa`

> `Chat Clínico` reutiliza o chat existente (`/chat`) com reforço cognitivo.

## Estado de Implementação (Frontend)
- [x] 1. Dashboard Cognitivo — `/cognitivo` (`page.tsx` + `cognitivo-dashboard-client.tsx`)
- [x] 2. Linha Temporal Clínica — `/cognitivo/linha-temporal` (`page.tsx` + `linha-temporal-client.tsx`)
- [x] 3. Digital Twin Radiológico — `/cognitivo/digital-twin` (`page.tsx` + `digital-twin-client.tsx`)
- [x] 4. Evolução Radiológica — `/cognitivo/evolucao` (`page.tsx` + `evolucao-client.tsx`)
- [x] 5. Detector Inteligente de Mudanças — `/cognitivo/detector-mudancas` (`page.tsx` + `detector-mudancas-client.tsx`)
- [ ] 6. Assistente Clínico Explicável — `/cognitivo/assistente`
- [ ] 7. Memória Clínica Hospitalar — `/cognitivo/memoria-clinica`
- [ ] 8. Detector de Contradições — `/cognitivo/contradicoes`
- [ ] 9. Radar Epidemiológico — `/cognitivo/radar-epidemiologico`
- [ ] 10. Previsão Inteligente — `/cognitivo/previsao`
- [ ] 11. Segunda Opinião — `/cognitivo/segunda-opiniao`
- [ ] 12. Reunião Clínica — `/cognitivo/reunioes`
- [ ] 13. Pesquisa Científica — `/cognitivo/pesquisa`
- [ ] 14. IA Generativa — `/cognitivo/ia-generativa`


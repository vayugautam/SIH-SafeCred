# Project Board (Phase 0) — SafeCred (SIH25150)

## Owners
- Vayu (Lead, AI/ML)
- Ayush (AI/ML Support)
- Sudhanshu (Backend/MERN)
- Arvind (Frontend/MERN)

## Phase 0 Checklist (complete by Oct 2)
- [x] Repo baseline (README + .gitignore + license) — Owner: Sudhanshu
- [x] Onboard all members to repo + set branch rules — Owner: Vayu
- [x] Orchestration pseudocode — Owner: Vayu (file: /docs/orchestration.md)
- [x] System diagram (Mermaid) — Owner: Vayu (file: /docs/system-diagram.mmd)
- [x] infra/config.json (thresholds) — Owner: Vayu (file: /infra/config.json)
- [x] Project board file + owners — Owner: Vayu (file: /docs/project-board.md)
- [x] Wireframes / basic UI mockups (applicant + officer + admin) — Owner: Arvind
- [x] Mock datasets (synthetic bank statements, proxies) — Owner: Ayush
- [x] Basic repo structure (folders for frontend/backend/ml/docs) — Owner: Sudhanshu

## Repo structure (recommended)
- /frontend (React + Tailwind)
- /backend (Express + Node)
- /ml_service (FastAPI + Python)
- /infra
  - config.json
- /docs
  - orchestration.md
  - system-diagram.mmd
  - project-board.md
- /data/mocks
  - bank_statements/
  - proxies/
- /scripts
- README.md

## Branch & PR rules (see below for full rules)
- main (protected): only PRs, require 2 reviews (1 from Lead + 1 from other team)
- develop: integration branch
- feature/<member>-<short-desc> for features
- hotfix/<issue>

## Communication
- Slack / Discord channel: #safecred
- Weekly standups: 1 per day during hackathon (quick 10–15 min)

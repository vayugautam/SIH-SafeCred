# Git Workflow & Branch Rules

## Branches
- `main`: protected. Merges allowed only via Pull Request (PR).
- `develop`: integration branch where completed features are merged for testing.
- `feature/<member>-<shortdesc>`: personal feature branches (e.g., feature/vayu-orchestrator).
- `hotfix/<shortdesc>`: for urgent fixes.

## PR rules
- Target branch: `develop` (for features) or `main` (only for hotfixes / release).
- Require:
  - 1 approval from the Lead (Vayu).
  - 1 approval from at least one other team member.
- Must pass CI checks (lint + unit tests).
- Squash & merge.

## Onboarding checklist for team members (perform once)
1. Add member to repo with write access.
2. Create GitHub issues for assigned tasks and tag owner.
3. Add SSH keys / set up PAT if needed.
4. Clone repo and create initial `feature/<name>-setup` branch.
5. Run `npm install` (frontend/backend) and create `.env.local.example`.
6. Introduce yourself in project channel and state assigned tickets.

## Naming conventions
- Files: `kebab-case`
- Components: `PascalCase`
- API endpoints: `/api/v1/<resource>`

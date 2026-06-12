# Claude project instructions

- At the end of each conversation/session, generate a **"Project Memory Update"** section containing new facts, decisions, constraints, preferences, and next steps from that session, formatted so it can be appended directly to `PROJECT_MEMORY.md` — and append it to that file (committed) before finishing.
- Read `PROJECT_MEMORY.md` at the start of a session for accumulated context.
- Deployment flow: push branch → PR → merge to `master` → GitHub Actions deploys to https://riprivalovberk.github.io/macro-mate/. Always run `npm test` and `npm run build` before pushing.
- The user runs this as a PWA on iPhone; keep UI mobile-first and changes token-efficient.

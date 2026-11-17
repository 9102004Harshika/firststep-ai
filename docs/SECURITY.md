# Security

## Secrets

- Never commit `.env` files.
- Root `.gitignore` ignores all `.env*` except `.env.example`.
- Production rejects weak default `ADMIN_API_KEY` values.
- API error responses sanitize connection strings and key-like substrings.
- Frontend must only use `VITE_API_BASE_URL` — never LLM or Mongo credentials.

## Credential rotation (if a ZIP or chat exposed real keys)

Treat ZIP-shipped `.env` values as compromised when the archive was shared. Rotate **before** live Actions runs or Loom.

1. MongoDB Atlas — change the FirstStep cluster database user password; confirm old password cannot connect.
2. LLM providers — revoke/rotate `OPENAI_API_KEY`, `GEMINI_API_KEY`, `GROQ_API_KEY` as used in production; confirm old keys return 401.
3. `ADMIN_API_KEY` — generate a long random value; confirm old key returns 401 on `/api/admin/*`.
4. Propagate new values to **Render** (backend), **GitHub Actions** secrets (`FIRSTSTEP_ADMIN_API_KEY`, `FIRSTSTEP_API_BASE_URL`), and local gitignored `.env` only.
5. Vercel — `VITE_API_BASE_URL` only; never put Mongo/LLM/admin secrets in the frontend.
6. Never display secret values in Loom, screenshots, or docs.

Checklist with sign-off: `docs/OPERATIONAL_VERIFICATION.md` §1.

This document intentionally does **not** reprint any secret values.

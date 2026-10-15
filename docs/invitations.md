# Invitations backend

This directory adds a minimal PHP backend for handling invitations.

Files added:
- api/invitations.php — single-file API that supports sending, accepting, revoking, and listing invitations.
- db/create_invitations_table.sql — SQL migration to create the invitations table.

Environment variables
- DB_HOST (default 127.0.0.1)
- DB_NAME (default campusone)
- DB_USER (default root)
- DB_PASS (default empty)

Example curl
- Send invite:
  curl -X POST https://your-domain/api/invitations.php -H "Content-Type: application/json" -d '{"action":"send","email":"test@example.com","sender_id":1}'

- Accept invite:
  curl -X POST https://your-domain/api/invitations.php -H "Content-Type: application/json" -d '{"action":"accept","token":"<token>"}'

- List invitations:
  curl https://your-domain/api/invitations.php

Notes
- The API currently does not send email; integrate your mailer where noted in the code.
- Adjust file placement to match your deployment routing (for example, serve api/ as /api/* or move into your PHP app structure).

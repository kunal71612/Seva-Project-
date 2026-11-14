# 06 — Security Design

## Threat Model

The prototype addresses obvious threats around unauthorized access, tampering, duplicate processing, and cloud disruption. The design is intentionally limited and transparent about what is simulated.

## Authentication and Authorization

- Admin accounts are separate from candidate accounts.
- Candidate routes are not intended for admin use.
- Passwords are hashed before storage.

## API Security

- Validate required data before processing.
- Use environment variables for secrets.
- Keep backend and browser interactions separate.

## Security Limitations

- This is not certified or field-hardened.
- Hash linking alone does not prevent deliberate compromise of the entire storage system.
- Additional controls are required for robust production security.

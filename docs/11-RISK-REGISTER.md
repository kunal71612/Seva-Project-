# 11 — Risk Register

| Risk | Impact | Likelihood | Mitigation |
|---|---|---|---|
| Internet outage | Candidate answers cannot sync | Medium | Local response queue and explicit pending state |
| Node B failure | New acknowledgements may be unsafe | Medium | Pause access until standby is validated |
| Node C missing | Quorum cannot be validated | Medium | Warning and no claim of safe failover |
| Security compromise | Privilege misuse | Low | Role separation and hashed passwords |

## Operational Risks

- Misconfigured environment
- Local-only DB without replicated failover
- Visual demo not representative of production-grade HA

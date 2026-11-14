# 09 — User Guide

## Administrator flow

1. Open the admin dashboard.
2. Create an examination.
3. Add questions and register candidates.
4. Monitor candidate activity and system health.

## Candidate flow

1. Log in using a registration ID.
2. Review exam instructions.
3. Answer questions and save them.
4. Submit the examination.

## Offline continuity

- When internet is lost, the local system continues with local response storage.
- The UI should clearly indicate pending synchronization.
- Reset to normal after internet returns and sync is triggered.

## Node failure handling

- If Node B fails, the system pauses new acknowledgements.
- Recovery only resumes when redundancy is restored and validated.
- Node C failure displays a warning about quorum and coordination limits.

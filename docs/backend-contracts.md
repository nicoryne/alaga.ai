# Backend & Dashboard Contracts

## REST Endpoints (FastAPI placeholder)

| Endpoint | Method | Payload | Notes |
| --- | --- | --- | --- |
| `/sync/upload` | `POST` | `SyncEnvelope` | Mobile pushes pending patients + assessments. Server validates, writes to Firestore/PG, returns updated sync timestamps. |
| `/assessments/{id}` | `GET` | – | Dashboard fetches a specific assessment summary. |
| `/patients/{id}` | `GET` | – | Returns patient demographics + list of assessments. |
| `/analytics/summary` | `GET` | Query params: `facilityId`, `from`, `to` | Powers dashboard charts (triage counts, trending symptoms). |

Payload contracts reuse the shared TypeScript types in `contracts/firestore.ts`. This keeps mobile, backend, and web in lockstep.

## Firestore Collections

- `patients/{patientId}`  
  - Required fields: `fullName`, `age`, `gender`, `region`, `province`, `barangay`, `createdBy`, `latestAssessmentId`, `latestTriage`, `syncStatus`.
- `assessments/{assessmentId}`  
  - Required fields: `patientId`, `createdBy`, `triageLevel`, `vitals`, `symptoms`, `probableConditions`, `recommendedActions`, `summary`, `simplifiedSummary`, `syncStatus`.

## Dashboard Expectations

The Next.js dashboard can read Firestore directly (via Web SDK/Admin SDK) and render:

- **Case feed**: list of assessments ordered by `createdAt`.
- **Triage chart**: count by `triageLevel` filtered by `createdAt`.
- **Pending review queue**: assessments where `syncStatus = 'pending'` or `status != 'complete'`.
- **Geolocation filter**: use `region` / `province` fields from the patient document to scope analytics.

## Security Rules (see `firestore.rules`)

- Authenticated users (`request.auth.uid`) can read/write only documents where `createdBy` matches their UID.
- Doctors/admin roles (custom claims) can read all documents but cannot overwrite `createdBy`.
- Data validation ensures `triageLevel` and `syncStatus` are whitelisted values, and that patient demographics exclude prohibited PII.



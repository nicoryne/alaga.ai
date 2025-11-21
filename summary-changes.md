# Summary Changes

## Role-Based Access Control (RBAC)

- Introduced `users/{uid}` metadata documents with `role`, `displayName`, `email`, optional `region`.
- Roles:
  - `superadmin`: can provision accounts and manage doctor ↔ health worker assignments, but **never** read patient data.
  - `doctor`: sees only patients/assessments created by assigned health workers.
  - `healthworker`: sees only their own submissions (this is the only role mobile targets).
- Bootstrap helper seeds known UIDs (e.g., `DZHQJJ62vZOZ0vqnqX3uCTNzLlG3 / porternicolo@gmail.com`) as super admins if their profile doc doesn’t exist yet.

## Doctor ↔ Health Worker Linking

- `AssignmentManager` UI lets super admins map health workers to doctors.
- Firestore writes:
  - Doctor doc gets `assignedHealthWorkerIds` array via `arrayUnion/arrayRemove`.
  - Health worker doc stores the selected `doctorId`.
- Patient and assessment documents carry both `healthWorkerId` (required) and optional `doctorId` for query efficiency.
- Export/API routes accept a `healthWorkerIds` query param to ensure CSVs contain only scoped data.

## Platform Scope

- **Mobile app** remains health-worker-only: sign-in should require `role === "healthworker"` and gate everything else.
- **Web app** surfaces:
  - `(public)/login`
  - `(dashboard)` grouped routes for doctors + health workers with patient/assessment views scoped by RBAC.
  - `/super-admin` workspace for provisioning and assignments (no patient data rendered there).

Ensure Firestore Security Rules mirror this logic so only permitted roles can read/write their respective documents.


# Offline-First AI Health Diagnostic & Triage App

---

# **App Workflow**

## User Authentication and Setup

**User:**  
 Barangay Health Worker (BHW) or authorized community health volunteer

**Input:**

* Login credentials (username, password, or offline profile)

* Device authentication (optional biometric verification)

**Process:**

* The system verifies user identity through secure local or cloud-based authentication.

* Local AI models and patient databases are initialized or updated from the cloud (if online).

**Output:**

* Access to the application dashboard

* Ready-to-use offline diagnostic environment

**Destination:**  
 Local mobile device (Flutter app environment)

## Patient Registration

**User:**  
 Health worker or volunteer

**Input:**

* Patient demographic information (name, age, sex, address)

* Health ID (if available)

* Symptom description (typed, selected, or spoken)

* Vital signs (e.g., blood pressure, temperature, heart rate)

* Optional photo upload of visible symptoms

**Process:**

* Data validation and secure local storage (SQLite / Realm).

* Audio inputs transcribed into text using built-in speech recognition (offline-capable).

**Output:**

* Structured patient record ready for analysis

**Destination:**  
 Local encrypted database

## AI Symptom Analysis (Offline Diagnostic Processing)

**User:**  
 System-initiated (automated after patient registration)

**Input:**

* Symptom descriptions

* Image data (if available)

* Vital sign measurements

**Process:**

1. Decision Tree Model: Analyzes structured symptoms and vital data to identify affected body systems (e.g., cardiovascular, respiratory, dermatological).

2. CNN Model (TensorFlow Lite): Processes image inputs to detect visible patterns (e.g., skin lesions, inflammation).

3. Transformer Model (DistilBERT or TLUnified): Interprets textual or transcribed symptom descriptions.

4. The ensemble engine integrates all model outputs to compute condition probabilities.

**Output:**

* Ranked list of potential medical conditions with confidence levels

* Flagged conditions requiring urgent attention

**Destination:**  
 App interface for triage analysis

## Triage Decision

**User:**  
 Health worker

**Input:**

* AI diagnostic results (probabilities and symptom classification)

**Process:**

* Decision engine categorizes case urgency using threshold values:

  * 🟢 *Mild* – Self-care or observation

  * 🟡 *Moderate* – Requires local clinic check-up

  * 🔴 *Critical* – Immediate referral recommended

**Output:**

* Color-coded triage card with recommended next steps

**Destination:**  
 Patient summary screen (mobile interface)

## AI Health Translation and Simplification Layer

**User:**  
 System-initiated (post-diagnosis)

**Input:**

* AI-generated diagnosis and medical notes

**Process:**

* Utilizes fine-tuned DistilBERT / TLUnified model to simplify and translate medical jargon into understandable Filipino or local dialect.

* Optional text-to-speech component generates spoken explanations.

**Output:**

* Layman-friendly text version of the medical summary (e.g., “*Mataas ang presyon mo…*”)

* Optional audio playback of translated explanation

**Destination:**  
 Displayed to health worker and patient on the device

## Health Summary and Report Generation

**User:**  
 Health worker

**Input:**

* AI outputs (diagnosis, triage, translation)

**Process:**

* Compiles all diagnostic, translation, and image data into a unified summary.

* Generates printable or shareable reports in standardized format (PDF or text).

**Output:**

* Comprehensive patient summary report

* Saved copy within local encrypted database

**Destination:**  
 Local device storage; shareable via print or SMS

## Cloud Synchronization and Doctor Review (when online)

**User:**  
 System-initiated (automated on connectivity)

**Input:**

* Locally stored patient records and reports

**Process:**

* Encrypted data transmitted through secure REST API to central cloud database (PostgreSQL via Supabase).

* Health professionals access and review via an online dashboard.

* Feedback and corrections logged for AI retraining (federated learning ready).

**Output:**

* Updated cloud database

* Optional review comments from doctors or municipal health officers

**Destination:**  
 Centralized cloud server and web dashboard

## Dashboard and Analytics Visualization

**User:**  
 Municipal Health Officer (MHO), LGU Administrator, or DOH Analyst

**Input:**

* Aggregated patient and triage data from cloud storage

**Process:**

* Dashboard visualizes analytics such as:

  * Number of triaged cases by severity

  * Common symptoms and probable conditions

  * Emerging health patterns or potential outbreaks

**Output:**

* Real-time visual analytics and reports

* Exportable data for policy or medical action

**Destination:**  
 Web-based administrative dashboard (Next.js interface)

## Privacy and Security Assurance

**User:**  
 System-level (applies to all operations)

**Input:**

* Patient records and AI outputs

**Process:**

* All data encrypted using **AES-256** locally and during transmission.

* Access control enforced via **JWT tokens** and role-based permissions.

* Full compliance with the **Philippine Data Privacy Act (RA 10173\)**.

**Output:**

* Secure, anonymized, and privacy-compliant data handling

**Destination:**  
 Device storage, transmission endpoints, and cloud systems

## Continuous Learning and Model Improvement

**User:**  
 System developers / AI training pipeline

**Input:**

* Anonymized health data and verified doctor feedback

**Process:**

* Periodic retraining of AI models through **federated learning**, ensuring privacy-preserving updates.

* Models redistributed via lightweight updates to devices.

**Output:**

* Improved model accuracy and localized adaptation

**Destination:**  
 Model repository → Synced to mobile devices during app updates


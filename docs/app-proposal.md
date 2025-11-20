# Offline-First AI Health Diagnostic & Triage App

---

# **Problem Statement**

In many parts of the Philippines, particularly in GIDA (Geographically Isolated and Disadvantaged Areas), access to healthcare is limited due to:

* Long travel distances to hospitals and clinics,  
* Geographical location and sea conditions,  
* Shortage of doctors and medical staff,  
* Unstable or no internet connection, limiting access to telemedicine or online health services,  
* Prevalence of albularyo-based treatment and other old beliefs and practices,  
* Lack of real-time data reporting for local health offices

Apparent deficiencies in public health facilities and services led to poor health outcomes and health-related practices among the population (Collado, 2019; Toquero, 2021). Because of these barriers, patients often seek medical help too late, leading to preventable complications or deaths. According to an observational cohort study of 10 315 cases transported with a potentially life-threatening condition by the Medical Care Research Unit of the University of Sheffield, increased distance between the point of emergency and the nearest medical facility was associated with increased risk of death. The study suggested that a 10-km increase in straight-line distance is associated with around a 1% absolute increase in mortality (Nicholl, J., West, J., Goodacre, S., & Turner, J., 2007).  

Another study by the International Journal of Epidemiology, showed that compared to children who live within 1 km of a medical facility, children living within 2 km, 3 km, and 5 km of a facility have a 7.7%, 16.3%, and 25% higher odds of neonatal mortality, respectively; children living farther than 10 km have a 26.6% higher odds of neonatal mortality. Women living farther than 10 km from a facility have a 55.3% lower odds of in-facility delivery compared with women who live within 1 km (Karra, M.,Fink, G., Canning, D., 2016). This means that even a relatively small increase in distance to the nearest medical facilities are associated with high mortality penalties for people, particularly with children and pregnant women. 

In many parts of the Philippines, people lack access to consistent, quality healthcare. *Alaga.AI* ensures that compassionate care — *alaga* — reaches even the most remote communities through accessible, intelligent tools that work **with or without internet access**. 

*A barangay health worker in Samar may only visit a doctor once every two weeks. During emergencies, they rely on guesswork or anecdotal advice to decide whether a patient should be transferred to the hospital.*

# 

# **Proposed Solution**

Alaga.AI is an AI-assisted, offline-first mobile application designed to empower barangay health workers and community volunteers to assess, triage, and refer patients even in areas with little or no internet access.

The app operates using lightweight, on-device AI models built with TensorFlow Lite and ONNX Runtime Mobile, enabling it to analyze symptoms, images, and sensor data directly from a smartphone or tablet. Its diagnostic engine uses a hybrid ensemble model that combines:

* Decision Tree algorithms to evaluate symptom inputs and vital signs,  
* Convolutional Neural Networks (CNNs) to analyze visible conditions (e.g., rashes, wounds, eye redness, swelling), and  
* Transformer-based NLP models to interpret text or voice-based symptom descriptions.

Through these models, the system identifies probable medical conditions and categorizes cases into triage levels — *Mild (Self-care)*, *Moderate (Needs check-up)*, or *Critical (Emergency)* — allowing frontliners to make timely and informed decisions.

When connectivity becomes available, all encrypted data automatically syncs to a centralized dashboard for validation and review by doctors, local health officers, or LGU administrators. This dashboard also provides aggregated analytics for monitoring trends, outbreaks, and resource allocation.

A key feature of Alaga.AI is its AI language simplification and translation layer, powered by a fine-tuned DistilBERT / TLUnified model optimized for Filipino and regional dialects (e.g., Tagalog, Bisaya, Ilocano, Waray). This natural language processing (NLP) component translates complex medical terminology into simple, culturally appropriate explanations for both health workers and patients.

For instance, instead of saying:

“Hypertension due to elevated systolic pressure,”

the app would display and speak:

“*Mataas ang presyon mo, pwedeng dahil sa sobrang alat o pagod. Magpahinga at uminom ng gamot ayon sa payo ng doktor.*”

This ensures clear communication, builds trust, and improves health literacy, especially in communities where medical jargon often creates confusion or fear.

Ultimately, Alaga.AI bridges the gap between medical expertise and accessibility — bringing compassionate, understandable, and AI-driven care to every barangay in the Philippines.

# **Core Features**

| AI Symptom Checker | A hybrid machine learning engine (Decision Tree \+ CNN \+ Transformer ensemble) trained on medical datasets to assess patient symptoms through text, images, or device inputs. Runs on-device (offline) and produces likelihood-based results (e.g., “High probability: dehydration”). |
| :---- | :---- |
| **AI Health Translator** | Translates complex medical terms and doctor notes into simple, layman-friendly Filipino or local dialects (Tagalog, Bisaya, Ilocano, Waray, etc.) using fine-tuned NLP models. Helps health workers explain diagnoses clearly and accurately. |
| **Offline-First Design** | Core AI models (symptom checker \+ translator) work fully offline. Syncs automatically when the internet is available. |
| **Triage Recommendation** | Categorizes cases by urgency (Mild, Moderate, Critical) using decision-tree logic optimized by patient history and vital signs. |
| **Health Record Management** | Maintains local records encrypted on device and synced to a central database when connected. |
| **Sync & Referral System** | Links to remote doctors or LGUs for case review and follow-up. |
| **Analytics Dashboard** | Visualizes local disease trends and triage summaries for LGU/DOH dashboards. |
| **Localization & Multilingual Support** | Translated prompts for Tagalog, Bisaya, Ilocano, Waray, etc. for inclusivity. |
| **Privacy & Security** | AES-256 encryption on device, anonymized data when syncing, full compliance with Philippine Data Privacy Act (RA 10173). |

# **System Architecture**

**1\. Client (Mobile App):**

* Built with React Native for cross-platform support.  
* Local data storage using SQLite.  
* Embedded AI modules:  
  * **Symptom Checker AI** (ensemble model):  
    * CNN → image recognition (skin lesions, visible symptoms).  
    * Decision Tree → rule-based symptom triage (vitals, user input).  
    * Transformer → text-based symptom reasoning.  
  * **Health Translator AI** (language model):  
    * Fine-tuned **DistilBERT / TLUnified** model for Tagalog and Visayan dialects.  
    * Runs offline with quantized weights (\<100MB).  
* Uses SQLite for offline records, and auto-syncs via API queue once online.

**2\. Server Backend:**

* FastAPI REST  backend for sync, analytics, and referral.  
* PostgreSQL  for data storage.  
* Secure API for verified users (health workers, doctors).  
* Centralized **translation API** for model updates and quality feedback.  
* Continuous model refinement via anonymized user corrections and health worker feedback.

**3\. Dashboard (Web):**

* Next.js admin panel for LGUs/DOH officers.  
* Data visualization using Recharts.  
* Role-based access for doctors, health workers, and admins.

# 

# **AI Framework & Data Sources**

| Component | Framework | Data Source |
| :---- | :---- | :---- |
| Symptom Checker | TensorFlow \+ Scikit-learn | WHO open health datasets, MedMNIST (image-based diseases), open symptom databases, anonymized PH rural clinic data (via partnership) |
| Triage Model | Decision Tree \+ Random Forest | Health record metadata (vitals, patient demographics) |
| Health Translator | HuggingFace Transformers (DistilBERT / TLUnified / LLaMA-2 fine-tuned) | Philippine multilingual corpus, medical terminology from DOH / WHO translated glossaries |
| Voice Module (Future) | Tacotron2 \+ Whisper | Locally recorded Tagalog and Bisaya medical dialogue dataset |
| Privacy Layer | AES-256 encryption, PH Data Privacy Act compliance | On-device only; synced via encrypted REST endpoints |

## **AI Data Flow (Simplified)**

1. User Inputs Symptoms or Images →  
2. AI Symptom Checker processes locally using hybrid ensemble model →  
3. Triage level \+ medical explanation generated →  
4. AI Translator converts output into layman Filipino / dialect →  
5. Display readable output for health worker \+ patient →  
6. *(When online)* Syncs anonymized data to backend for doctor validation and model improvement.

# **Target Users**

| Tier | Description |
| :---- | :---- |
| Primary | Barangay Health Workers (BHWs), Municipal Health Officers, Rural Health Units Empowers health workers to communicate diagnoses clearly to patients in their native dialects, reducing misinformation and improving compliance. |
| Secondary | Volunteer groups, NGOs, LGUs involved in public health |
| Tertiary | Patients indirectly benefiting from better, faster diagnosis |

# 

# **Business & Sustainability Model**

| Stream | Description |
| :---- | :---- |
| Government Adoption | Partner with DOH, DICT, and LGUs for rollouts as part of *Digital Health Transformation*. |
| Subscription / Licensing | Annual subscription for municipalities or hospitals for access to analytics \+ updates. |
| NGO Partnerships | Collaborate with humanitarian orgs (Red Cross, WHO, UNICEF) for sponsored deployments. NGOs promoting health literacy (like UNICEF or WHO PH) can sponsor language and education modules to ensure translations meet health communication standards. |
| Freemium Model | Core features free for BHWs; premium for expanded disease coverage or analytics. |

## **Funding & Partnership Opportunities**

* **DICT’s Innovation Fund** – supports digital transformation projects.

* **DOH / PhilHealth collaboration** – integration with e-Konsulta or UHC projects.

* **StartupPH Mentoring Network** – for scaling and grants.

* **Local LGUs** for pilot testing and rollout.

* **Global health NGOs** like PATH, WHO, or USAID for field testing.

# 

# **Impact Metrics**

| KPI | Target |
| :---- | :---- |
| Reduction in referral delay | 40% faster triage decisions |
| Health worker coverage | 80% of barangays in pilot province |
| Diagnosis accuracy | 85–90% alignment with physician review |
| Patient satisfaction | \>90% “very satisfied” in pilot feedback |
| Deployment cost | \< ₱3,000 per device (using existing Android phones) |

# **Risks and Mitigation**

| Risk | Mitigation |
| :---- | :---- |
| AI misdiagnosis | Use “AI assist” (suggestive, not prescriptive) and always confirm via doctor |
| Data privacy | Encrypt all data, anonymize sync, only store what is necessary |
| Model bias | Localize training data and validate with Filipino demographics |
| User training | Partner with BHW training programs (through DOH / LGU) |

# **Future Expansions**

* Integrate with IoT devices (BP monitor, thermometer, oximeter).

* Enable voice interaction for low-literacy users.

* Add AI chatbot for patient self-assessment.

* Build disease outbreak prediction using aggregated anonymized data.

* Connect with PhilHealth / EHR systems for continuity of care.

* Expand the AI translation system to support voice-based explanation for users with low literacy, using speech synthesis (e.g., Whisper \+ Tacotron2 for Tagalog speech).

**References**  
Nicholl, J., West, J., Goodacre, S., & Turner, J. (2007). The relationship between distance to hospital and patient mortality in emergencies: an observational study. Emergency medicine journal : EMJ, 24(9), 665–668. [https://doi.org/10.1136/emj.2007.047654](https://doi.org/10.1136/emj.2007.047654) 

Karra M, Fink G, Canning D. Facility distance and child mortality: A multi-country study of health facility access, service utilization, and child health outcomes. International Journal of Epidemiology. 2017; 46(3), 817–826. doi: 10.1093/ije/dyw062

Collado, Z. (2019). Challenges in public health facilities and services: evidence from a geographically isolated and disadvantaged area in the Philippines. Journal of Global Health Reports, 3(3). [https://doi.org/10.29392/joghr.3.e2019059](https://doi.org/10.29392/joghr.3.e2019059)

Department of Health. (n.d.). *eHealth strategy framework*. Republic of the Philippines. [https://doh.gov.ph/eHealth](https://doh.gov.ph/eHealth)

Department of Information and Communications Technology. (n.d.). *Philippine Startup Challenge (PSC) opens its applications*. StartupPH. [https://startup.gov.ph/philippine-startup-challenge-psc-opens-its-applications/](https://startup.gov.ph/philippine-startup-challenge-psc-opens-its-applications/)

GovInsider. (2024, March 15). *Philippines ramps up digital health initiatives*. [https://govinsider.asia/intl-en/article/philippines-ramps-up-digital-health-initiatives](https://govinsider.asia/intl-en/article/philippines-ramps-up-digital-health-initiatives)

National Center for Biotechnology Information. (2024). *Artificial intelligence and health in the Philippines*. *PubMed Central (PMC)*. [https://pmc.ncbi.nlm.nih.gov/articles/PMC12141634/](https://pmc.ncbi.nlm.nih.gov/articles/PMC12141634/)

World Bank Group. (2023). *Digital health in Asia-Pacific: Opportunities and challenges for developing countries*. World Bank Publications. [https://documents.worldbank.org/en/publication/documents-reports/documentdetail/895741603940283510](https://documents.worldbank.org/en/publication/documents-reports/documentdetail/895741603940283510)
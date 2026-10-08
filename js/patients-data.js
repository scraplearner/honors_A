/**
 * AegisHealth AI - Clinical Patient Cohort Data & Storage
 * High-fidelity clinical datasets representing diverse acuity tiers
 */

const DEFAULT_PATIENTS = [
  {
    id: "PT-1049",
    name: "Eleanor Vance",
    age: 68,
    gender: "Female",
    mrn: "MRN-88204",
    ward: "Cardiology",
    bed: "ICU-03",
    admissionDiagnosis: "Acute Coronary Syndrome Rule-Out & Hypertensive Urgency",
    history: ["Essential Hypertension (Grade 3)", "Dyslipidemia", "Post-Menopausal Osteopenia"],
    medications: ["Amlodipine 10mg QD", "Atorvastatin 40mg QHS", "Aspirin 81mg QD"],
    smoking: "Former",
    vitals: {
      sysBP: 178,
      diaBP: 104,
      heartRate: 104,
      respRate: 22,
      spO2: 93,
      temp: 37.1
    },
    biomarkers: {
      glucose: 184,       // mg/dL
      creatinine: 1.45,    // mg/dL
      egfr: 42,           // mL/min/1.73m2
      troponin: 0.14,     // ng/mL (elevated!)
      wbc: 9.8,           // x10^3 / uL
      lactate: 1.8,       // mmol/L
      crp: 14.2           // mg/L (elevated inflammation)
    },
    notes: "Patient reports substernal chest pressure radiating to left jaw during exertion, associated with mild diaphoresis."
  },
  {
    id: "PT-1050",
    name: "David K. Okafor",
    age: 42,
    gender: "Male",
    mrn: "MRN-67431",
    ward: "Emergency",
    bed: "Triage-Resus-1",
    admissionDiagnosis: "Suspected Septic Shock Secondary to Community-Acquired Pneumonia",
    history: ["No documented chronic illness", "Occasional Asthma"],
    medications: ["Albuterol HFA PRN"],
    smoking: "Current",
    vitals: {
      sysBP: 88,
      diaBP: 54,
      heartRate: 126,
      respRate: 30,
      spO2: 89,
      temp: 39.4
    },
    biomarkers: {
      glucose: 142,
      creatinine: 1.85,
      egfr: 46,
      troponin: 0.04,
      wbc: 21.4,          // severe leukocytosis
      lactate: 4.1,       // critical lactic acidosis
      crp: 86.5           // massive systemic inflammation
    },
    notes: "Hypotensive, tachypneic, febrile with mottled extremities. qSOFA score indicates high acute decompensation risk."
  },
  {
    id: "PT-1051",
    name: "Marcus Sterling",
    age: 54,
    gender: "Male",
    mrn: "MRN-91022",
    ward: "Nephrology",
    bed: "StepDown-08",
    admissionDiagnosis: "Diabetic Nephropathy Stage 3b with Volume Overload",
    history: ["Type 2 Diabetes Mellitus (15 yrs)", "Chronic Kidney Disease Stage 3b", "Diabetic Retinopathy", "Hypertension"],
    medications: ["Metformin 500mg BID", "Insulin Glargine 24u QHS", "Lisinopril 20mg QD", "Furosemide 40mg QD"],
    smoking: "No",
    vitals: {
      sysBP: 156,
      diaBP: 92,
      heartRate: 78,
      respRate: 18,
      spO2: 96,
      temp: 36.8
    },
    biomarkers: {
      glucose: 242,       // unmanaged hyperglycemia
      creatinine: 2.35,   // elevated
      egfr: 32,           // severe renal impairment
      troponin: 0.02,
      wbc: 8.1,
      lactate: 1.4,
      crp: 8.4
    },
    notes: "Bilateral 2+ pitting lower extremity edema. Serum potassium 5.2 mEq/L (borderline hyperkalemia)."
  },
  {
    id: "PT-1052",
    name: "Clara Moreau",
    age: 73,
    gender: "Female",
    mrn: "MRN-44819",
    ward: "Pulmonology",
    bed: "Unit-204",
    admissionDiagnosis: "Acute COPD Exacerbation with Hypercapnic Respiratory Failure Risk",
    history: ["COPD (GOLD Stage III)", "Cor Pulmonale", "Tobacco Use Disorder (45 pack-years)"],
    medications: ["Tiotropium 18mcg QD", "Fluticasone/Salmeterol 250/50", "Home O2 2L/min nasal cannula"],
    smoking: "Former",
    vitals: {
      sysBP: 138,
      diaBP: 82,
      heartRate: 110,
      respRate: 28,
      spO2: 86,
      temp: 37.6
    },
    biomarkers: {
      glucose: 130,
      creatinine: 1.05,
      egfr: 68,
      troponin: 0.03,
      wbc: 13.8,
      lactate: 2.1,
      crp: 32.0
    },
    notes: "Marked expiratory wheezing and accessory muscle recruitment. PaCO2 56 mmHg on venous blood gas."
  },
  {
    id: "PT-1053",
    name: "Robert M. Jenkins",
    age: 61,
    gender: "Male",
    mrn: "MRN-33512",
    ward: "Cardiology",
    bed: "StepDown-02",
    admissionDiagnosis: "Decompensated Heart Failure with Reduced Ejection Fraction (HFrEF 30%)",
    history: ["Ischemic Cardiomyopathy", "Prior NSTEMI (2022)", "Atrial Fibrillation", "Type 2 Diabetes"],
    medications: ["Sacubitril/Valsartan 49/51mg BID", "Metoprolol Succinate 50mg QD", "Apixaban 5mg BID", "Empagliflozin 10mg QD"],
    smoking: "Former",
    vitals: {
      sysBP: 112,
      diaBP: 74,
      heartRate: 92,
      respRate: 20,
      spO2: 94,
      temp: 36.9
    },
    biomarkers: {
      glucose: 152,
      creatinine: 1.6,
      egfr: 51,
      troponin: 0.06,     // chronic mild elevation
      wbc: 7.2,
      lactate: 1.5,
      crp: 5.6
    },
    notes: "Jugular venous distension 8 cm. High 30-day readmission risk based on baseline cardiovascular frailty."
  },
  {
    id: "PT-1054",
    name: "Sofia Rodriguez",
    age: 29,
    gender: "Female",
    mrn: "MRN-77301",
    ward: "General",
    bed: "Ward-112",
    admissionDiagnosis: "Routine Inpatient Metabolic & Hemodynamic Baseline Assessment",
    history: ["Mild Migraine", "No major chronic illnesses"],
    medications: ["Sumatriptan 50mg PRN", "Daily Multivitamin"],
    smoking: "No",
    vitals: {
      sysBP: 118,
      diaBP: 76,
      heartRate: 68,
      respRate: 15,
      spO2: 99,
      temp: 36.7
    },
    biomarkers: {
      glucose: 92,
      creatinine: 0.75,
      egfr: 110,
      troponin: 0.01,
      wbc: 6.2,
      lactate: 0.8,
      crp: 1.1
    },
    notes: "Normotensive, eupneic, laboratory indices well within physiological reference intervals. Low acuity."
  }
];

class PatientDataManager {
  constructor() {
    this.storageKey = "aegis_health_patients_v1";
    this.activePatientIdKey = "aegis_health_active_patient_id";
    this.patients = this.loadPatients();
    this.activePatientId = this.loadActivePatientId();
  }

  loadPatients() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn("Error loading stored patients, falling back to defaults", e);
    }
    // Default clone
    const defaults = JSON.parse(JSON.stringify(DEFAULT_PATIENTS));
    this.savePatients(defaults);
    return defaults;
  }

  savePatients(patientsList) {
    this.patients = patientsList;
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(patientsList));
    } catch (e) {
      console.error("Failed to save patients to localStorage", e);
    }
  }

  loadActivePatientId() {
    const storedId = localStorage.getItem(this.activePatientIdKey);
    if (storedId && this.patients.some(p => p.id === storedId)) {
      return storedId;
    }
    return this.patients[0] ? this.patients[0].id : null;
  }

  setActivePatientId(id) {
    this.activePatientId = id;
    try {
      localStorage.setItem(this.activePatientIdKey, id);
    } catch (e) {}
  }

  getAllPatients() {
    return this.patients;
  }

  getPatientById(id) {
    return this.patients.find(p => p.id === id) || null;
  }

  getActivePatient() {
    return this.getPatientById(this.activePatientId) || this.patients[0] || null;
  }

  addPatient(patientData) {
    const newId = "PT-" + Math.floor(1000 + Math.random() * 9000);
    const newPatient = {
      id: newId,
      ...patientData
    };
    this.patients.unshift(newPatient);
    this.savePatients(this.patients);
    this.setActivePatientId(newId);
    return newPatient;
  }

  updatePatient(id, updatedFields) {
    const idx = this.patients.findIndex(p => p.id === id);
    if (idx !== -1) {
      this.patients[idx] = { ...this.patients[idx], ...updatedFields };
      this.savePatients(this.patients);
      return this.patients[idx];
    }
    return null;
  }

  deletePatient(id) {
    this.patients = this.patients.filter(p => p.id !== id);
    if (this.activePatientId === id) {
      this.activePatientId = this.patients[0] ? this.patients[0].id : null;
      localStorage.setItem(this.activePatientIdKey, this.activePatientId);
    }
    this.savePatients(this.patients);
  }

  resetToDefaultCohort() {
    const defaults = JSON.parse(JSON.stringify(DEFAULT_PATIENTS));
    this.savePatients(defaults);
    this.setActivePatientId(defaults[0].id);
    return defaults;
  }

  // --- Audit History Management ---
  loadAuditLogs() {
    try {
      const stored = localStorage.getItem("patient_edit_audit_logs");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.warn("Failed to parse audit history:", e);
    }
    return [];
  }

  saveAuditLogs(logs) {
    try {
      localStorage.setItem("patient_edit_audit_logs", JSON.stringify(logs));
    } catch (e) {
      console.error("Failed to save audit logs to localStorage:", e);
    }
  }

  recordEditAudit(patientId, patientName, changes) {
    const logs = this.loadAuditLogs();
    const patientLogs = logs.filter(l => l.patientId === patientId);
    const editNumber = patientLogs.length + 1;
    
    const now = new Date();
    const formattedDate = now.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    }) + " " + now.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit"
    });

    const entry = {
      id: "audit_" + Date.now() + "_" + Math.floor(Math.random() * 1000),
      editNumber,
      patientId,
      patientName,
      date: formattedDate,
      timestamp: now.toISOString(),
      changes: changes || []
    };

    logs.unshift(entry);
    this.saveAuditLogs(logs);
    return entry;
  }

  getAuditLogsForPatient(patientId) {
    const logs = this.loadAuditLogs();
    return logs.filter(l => l.patientId === patientId);
  }

  getAuditCountForPatient(patientId) {
    return this.getAuditLogsForPatient(patientId).length;
  }
}

// Global singleton instance
window.PatientStore = new PatientDataManager();

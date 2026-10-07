/**
 * AegisHealth AI - Google Gemini API Client & Dynamic Clinical Reasoning Engine
 * Reads API key directly from .env configuration, env.js, or localStorage.
 * Analyzes patient-specific data and generates personalized predictions:
 * "Based on the data of [Patient Name], the patient has likely this symptoms and this likely disease to be occur and also recommended diagnosis"
 */

class GeminiClinicalService {
  constructor() {
    this.storageKey = "gemini_api_key";
    this.modelsToTry = ["gemini-2.5-flash", "gemini-1.5-flash", "gemini-2.0-flash"];
  }

  getApiKey() {
    // 1. Check window.ENV loaded from .env / env.js
    if (window.ENV && window.ENV.GEMINI_API_KEY && window.ENV.GEMINI_API_KEY !== "YOUR_GEMINI_API_KEY_HERE" && window.ENV.GEMINI_API_KEY.trim() !== "") {
      return window.ENV.GEMINI_API_KEY.trim();
    }
    // 2. Check localStorage
    const local = localStorage.getItem(this.storageKey);
    if (local && local.trim() !== "") {
      return local.trim();
    }
    return "";
  }

  setApiKey(key) {
    if (key && key.trim()) {
      localStorage.setItem(this.storageKey, key.trim());
      if (window.ENV) window.ENV.GEMINI_API_KEY = key.trim();
    } else {
      localStorage.removeItem(this.storageKey);
      if (window.ENV) window.ENV.GEMINI_API_KEY = "";
    }
  }

  hasApiKey() {
    const key = this.getApiKey();
    return !!key && key.length > 10;
  }

  /**
   * Run Gemini AI Clinical Analysis on patient data
   */
  async analyzePatient(patient, riskData) {
    const apiKey = this.getApiKey();

    if (!apiKey) {
      console.info(`No API key provided yet. Generating dynamic personalized clinical assessment for ${patient.name}...`);
      return this.generateDynamicClinicalAnalysis(patient, riskData, "Aegis Dynamic Clinical Engine (Set API key in .env or input above to enable live Gemini)");
    }

    console.log(`Calling Google Gemini API for ${patient.name}...`);
    const prompt = this.buildClinicalPrompt(patient, riskData);

    // Try primary model, fallback if needed
    for (const model of this.modelsToTry) {
      try {
        const result = await this.callGeminiApi(model, apiKey, prompt);
        if (result) {
          return {
            ...result,
            source: `Live Google Gemini (${model})`
          };
        }
      } catch (err) {
        console.warn(`Model ${model} call failed:`, err);
        // Continue to next model if available
      }
    }

    // If API call fails or quota exceeded, fallback gracefully with customized analysis
    console.warn("Gemini API calls failed. Generating dynamic clinical rule analysis.");
    return this.generateDynamicClinicalAnalysis(patient, riskData, "Aegis Dynamic Analysis (Gemini API network/quota fallback)");
  }

  /**
   * Low-level fetch call to Gemini generateContent endpoint
   */
  async callGeminiApi(model, apiKey, prompt) {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const payload = {
      contents: [{
        parts: [{ text: prompt }]
      }],
      generationConfig: {
        temperature: 0.2,
        topP: 0.8,
        maxOutputTokens: 2048,
        responseMimeType: "application/json"
      }
    };

    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => "");
      throw new Error(`HTTP ${response.status}: ${errText}`);
    }

    const data = await response.json();
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) throw new Error("No text content returned from Gemini candidate.");

    return this.cleanAndParseJson(rawText);
  }

  /**
   * Build structured clinical prompt tailored to user's exact specification
   */
  buildClinicalPrompt(patient, riskData) {
    const v = patient.vitals;
    const b = patient.biomarkers;

    return `
You are a senior physician and AI clinical decision support specialist.
Analyze this patient's clinical intake data and predict their risk, likely symptoms, likely diseases to occur, and recommended diagnosis.

PATIENT FILE:
- Full Name: ${patient.name}
- Age: ${patient.age} | Sex: ${patient.gender} | MRN: ${patient.mrn}
- Department: ${patient.ward} | Bed: ${patient.bed}
- Primary Admission / Complaint: ${patient.admissionDiagnosis}
- Documented Medical History: ${(patient.history || []).join(", ")}
- Active Regimen: ${(patient.medications || []).join(", ")}
- Smoking Status: ${patient.smoking}

BEDSIDE PHYSIOLOGICAL VITALS:
- Blood Pressure: ${v.sysBP}/${v.diaBP} mmHg
- Heart Rate: ${v.heartRate} bpm
- Respiratory Rate: ${v.respRate} breaths/min
- Oxygen Saturation (SpO2): ${v.spO2}%
- Body Temp: ${v.temp} °C

LABORATORY BIOMARKERS:
- Blood Glucose: ${b.glucose} mg/dL (Normal: 70-99)
- Serum Creatinine: ${b.creatinine} mg/dL (Normal: 0.7-1.2)
- eGFR: ${b.egfr} mL/min/1.73m² (Normal: >90)
- Cardiac Troponin-I: ${b.troponin} ng/mL (Normal: <0.04)
- WBC Count: ${b.wbc} x10³/µL (Normal: 4.5-11.0)
- Serum Lactate: ${b.lactate} mmol/L (Normal: 0.5-2.0)
- hs-CRP: ${b.crp} mg/L (Normal: <3.0)

CALCULATED CLINICAL METRICS:
- Composite Acuity Score: ${riskData.score}/100 (${riskData.tier})
- 30-Day Readmission Risk: ${riskData.readmissionProb}%
- NEWS2 Score: ${riskData.news2?.score || "N/A"}
- qSOFA Sepsis Alert: ${riskData.qsofa?.score || "N/A"}/3

OUTPUT INSTRUCTIONS:
Return pure JSON with the exact structure below.
The executive summary MUST start with: "Based on the data of ${patient.name}, the patient has likely..." and explain their symptoms, likely diseases to occur, and recommended diagnosis.

{
  "executiveSummary": "Based on the data of ${patient.name}, the patient has likely [detail likely symptoms from vitals/labs], and the likely disease to occur is [primary disease/complication] due to [physiological reasoning]. Recommended diagnosis and immediate workup includes [recommended confirmatory diagnostic tests and therapeutic steps].",
  "identifiedSymptoms": [
    "Specific symptom or vital abnormality (e.g. Stage 2 Systolic Hypertension of ${v.sysBP} mmHg)",
    "Specific biomarker abnormality (e.g. Elevated Troponin-I of ${b.troponin} ng/mL)"
  ],
  "likelyDiseases": [
    { "disease": "Primary disease/condition likely to occur", "likelihood": "High (85%)", "rationale": "Why this will occur based on the patient's data" },
    { "disease": "Secondary complication", "likelihood": "Moderate (60%)", "rationale": "Underlying contributing factors" }
  ],
  "recommendedDiagnosis": [
    { "test": "Recommended Diagnostic Test 1", "urgency": "Immediate / Urgent", "purpose": "What this test confirms" },
    { "test": "Recommended Diagnostic Test 2", "urgency": "Inpatient (24h)", "purpose": "What this test confirms" }
  ],
  "xaiRiskDrivers": [
    { "factor": "Key Biomarker/Vital Factor", "weight": "+30%", "type": "positive", "rationale": "Impact on acuity" },
    { "factor": "Protective/Stabilizing Factor", "weight": "-15%", "type": "protective", "rationale": "Impact on acuity" }
  ],
  "tieredActionPlan": [
    { "tier": "Immediate Bedside Order", "isUrgent": true, "intervention": "Specific emergency order" },
    { "tier": "Inpatient 24-48h Workup", "isUrgent": false, "intervention": "Specific clinical management order" },
    { "tier": "Discharge / Secondary Prevention", "isUrgent": false, "intervention": "Long term therapy" }
  ],
  "icd10Codes": ["ICD-10 Code and Description"],
  "drugAlerts": "Any contraindications or drug-vital warnings based on active medications."
}
`;
  }

  cleanAndParseJson(text) {
    let clean = text.trim();
    if (clean.startsWith("```json")) {
      clean = clean.substring(7);
    } else if (clean.startsWith("```")) {
      clean = clean.substring(3);
    }
    if (clean.endsWith("```")) {
      clean = clean.substring(0, clean.length - 3);
    }
    clean = clean.trim();
    return JSON.parse(clean);
  }

  /**
   * Dynamic Personalized Clinical Engine (Generates customized predictions for ANY patient)
   * Formats response according to user's exact specification
   */
  generateDynamicClinicalAnalysis(patient, riskData, sourceLabel) {
    const v = patient.vitals;
    const b = patient.biomarkers;
    const name = patient.name;
    const age = patient.age;
    const gender = patient.gender;

    // Detect abnormal symptoms and markers
    const symptoms = [];
    const drivers = [];
    let primaryDisease = "";
    let diseaseRationale = "";
    let secondaryDisease = "";
    let secondaryRationale = "";
    let tests = [];
    let actionPlan = [];
    let icdCodes = [];
    let drugAlert = "No acute pharmacological contraindications detected.";

    // 1. Cardiovascular inspection
    if (v.sysBP > 160) {
      symptoms.push(`Severe Systolic Hypertension (${v.sysBP} mmHg, Stage 2 Hypertensive Urgency)`);
      drivers.push({ factor: `Marked Systolic BP (${v.sysBP} mmHg)`, weight: "+32%", type: "positive", rationale: "Significantly elevates cardiac afterload and microvascular shear stress" });
    } else if (v.sysBP < 95) {
      symptoms.push(`Systemic Hypotension (${v.sysBP}/${v.diaBP} mmHg) with organ hypoperfusion risk`);
      drivers.push({ factor: `Hypotension (${v.sysBP} mmHg)`, weight: "+35%", type: "positive", rationale: "Inadequate end-organ capillary perfusion pressure" });
    }

    if (b.troponin > 0.04) {
      symptoms.push(`Myocardial Biomarker Elevation (Troponin-I ${b.troponin} ng/mL) indicating acute myocardial injury`);
      drivers.push({ factor: `Elevated Troponin-I (${b.troponin} ng/mL)`, weight: "+38%", type: "positive", rationale: "Direct biochemical marker of ongoing cardiomyocyte injury" });
      primaryDisease = "Acute Coronary Syndrome (NSTEMI / Myocardial Infarction)";
      diseaseRationale = `active cardiomyocyte necrosis evidenced by troponin of ${b.troponin} ng/mL combined with elevated vascular afterload (${v.sysBP} mmHg)`;
      tests.push({ test: "Stat 12-Lead Electrocardiogram (ECG) & Serial Troponin-I (q3h)", urgency: "Immediate (Stat)", purpose: "Assess ST-segment dynamic changes and kinetics of myocardial injury" });
      tests.push({ test: "Transthoracic Echocardiogram (TTE)", urgency: "Urgent (Within 6h)", purpose: "Evaluate left ventricular wall motion abnormalities and ejection fraction" });
      actionPlan.push({ tier: "Immediate Emergency Order", isUrgent: true, intervention: "Continuous telemetry cardiac monitoring, aspirin 325mg chewable, sublingual nitroglycerin if pain persists and SBP > 100 mmHg." });
      icdCodes.push("I21.4 - Non-ST elevation (NSTEMI) myocardial infarction", "I10 - Essential hypertension");
    }

    // 2. Sepsis & Infection inspection
    if (b.lactate >= 2.0 || b.wbc > 14.0 || v.temp > 38.3) {
      symptoms.push(`Systemic Inflammatory Response (WBC ${b.wbc} k/µL, Temp ${v.temp}°C, Lactate ${b.lactate} mmol/L)`);
      drivers.push({ factor: `Elevated Serum Lactate (${b.lactate} mmol/L)`, weight: "+40%", type: "positive", rationale: "Severe tissue hypoperfusion and anaerobic cellular metabolism" });
      if (!primaryDisease || b.lactate >= 3.0) {
        primaryDisease = "Severe Sepsis / Septic Shock";
        diseaseRationale = `elevated lactate of ${b.lactate} mmol/L, tachycardia of ${v.heartRate} bpm, and profound leukocytosis of ${b.wbc} k/µL indicating systemic infection with impending circulatory collapse`;
        tests.unshift({ test: "Blood Cultures x2 & Sepsis Biomarker Panel", urgency: "Immediate (Hour-1)", purpose: "Identify pathogen prior to antibiotic administration; repeat lactate within 2h" });
        tests.push({ test: "Chest Radiography / CT Thorax", urgency: "Urgent (Within 2h)", purpose: "Identify pulmonary consolidation or infectious source" });
        actionPlan.unshift({ tier: "Surviving Sepsis Hour-1 Bundle", isUrgent: true, intervention: "Initiate 30 mL/kg IV crystalloid fluid resuscitation, broad-spectrum empiric IV antibiotics, monitor MAP >= 65 mmHg." });
        icdCodes.unshift("R65.21 - Severe sepsis with septic shock", "R57.2 - Septic shock");
        drugAlert = "CAUTION: Avoid nephrotoxic medications given borderline renal hypoperfusion.";
      }
    }

    // 3. Respiratory inspection
    if (v.spO2 < 93 || v.respRate > 24) {
      symptoms.push(`Hypoxemic Respiratory Distress (SpO2 ${v.spO2}%, Respiratory Rate ${v.respRate}/min)`);
      drivers.push({ factor: `Hypoxia (SpO2 ${v.spO2}%)`, weight: "+28%", type: "positive", rationale: "Impaired alveolar-capillary gas exchange" });
      if (!primaryDisease) {
        primaryDisease = "Acute Respiratory Failure / Decompensated COPD Exacerbation";
        diseaseRationale = `suboptimal oxygen saturation of ${v.spO2}% and tachypnea of ${v.respRate} breaths/min indicating acute ventilatory demand exceeding reserve`;
      } else {
        secondaryDisease = "Acute Hypoxemic Respiratory Distress";
        secondaryRationale = `SpO2 decreased to ${v.spO2}% under tachypneic compensation (${v.respRate}/min)`;
      }
      tests.push({ test: "Arterial Blood Gas (ABG) Analysis", urgency: "Immediate (Stat)", purpose: "Assess PaO2, PaCO2, and rule out acute respiratory acidosis/hypercapnia" });
      actionPlan.push({ tier: "Respiratory Support", isUrgent: true, intervention: "Titrate supplemental oxygen therapy via nasal cannula/Venturi mask to maintain SpO2 92-96% (or 88-92% if chronic CO2 retainer)." });
    }

    // 4. Renal & Metabolic inspection
    if (b.creatinine > 1.4 || b.glucose > 180) {
      symptoms.push(`Metabolic & Renal Strain (Creatinine ${b.creatinine} mg/dL, eGFR ${b.egfr} mL/min, Glucose ${b.glucose} mg/dL)`);
      drivers.push({ factor: `Elevated Creatinine (${b.creatinine} mg/dL)`, weight: "+25%", type: "positive", rationale: "Significant reduction in glomerular filtration and fluid homeostasis" });
      if (!primaryDisease) {
        primaryDisease = "Diabetic Nephropathy with Acute-on-Chronic Kidney Injury";
        diseaseRationale = `elevated creatinine of ${b.creatinine} mg/dL and hyperglycemia of ${b.glucose} mg/dL contributing to hyperosmolar stress and volume imbalance`;
      } else if (!secondaryDisease) {
        secondaryDisease = "Acute Kidney Injury (AKI KDIGO Stage 2)";
        secondaryRationale = `eGFR reduced to ${b.egfr} mL/min with serum creatinine of ${b.creatinine} mg/dL`;
      }
      tests.push({ test: "Comprehensive Metabolic Panel & Urine Albumin-to-Creatinine Ratio (uACR)", urgency: "Inpatient (Same Day)", purpose: "Assess electrolytes (Potassium, Sodium) and quantify glomerular proteinuria" });
      actionPlan.push({ tier: "Renal & Glycemic Optimization", isUrgent: false, intervention: "Adjust basal-bolus insulin sliding scale, hold nephrotoxic medications (NSAIDs), monitor strict input/output fluid balance." });
      icdCodes.push("E11.22 - Type 2 diabetes with diabetic nephropathy", "N18.3 - Chronic kidney disease");
    }

    // Baseline fallback if stable
    if (!primaryDisease) {
      primaryDisease = "Mild Hemodynamic Instability / Controlled Chronic Baseline";
      diseaseRationale = `vital signs and biomarkers remain largely compensated within baseline reference limits`;
      symptoms.push("Mild exertional fatigue or baseline cardiovascular surveillance required");
      drivers.push({ factor: "Stable Autonomic Hemodynamics", weight: "-20%", type: "protective", rationale: "Preserved stroke volume and normal cardiac frequency" });
      drivers.push({ factor: "Preserved Alveolar Ventilation", weight: "-18%", type: "protective", rationale: "Normal respiratory rate and oxygenation" });
      tests.push({ test: "Routine Inpatient Metabolic Profile & Vitals Check", urgency: "Routine (Next Draw)", purpose: "Surveillance of electrolyte homeostasis and baseline organ function" });
      actionPlan.push({ tier: "Routine Inpatient Care", isUrgent: false, intervention: "Continue scheduled home medications, standard ward monitoring q8h, encourage gentle ambulation." });
      icdCodes.push("Z00.00 - General adult medical examination");
    }

    if (!secondaryDisease) {
      secondaryDisease = "Secondary Cardiovascular & Metabolic Progression";
      secondaryRationale = `Age (${age}y) and baseline cardiovascular strain indices indicate long-term vascular risk`;
    }

    if (tests.length === 0) {
      tests.push({ test: "Routine 12-Lead ECG & Basic Metabolic Panel", urgency: "Routine", purpose: "Baseline cardiac and electrolyte confirmation" });
    }

    // Build the exact executive summary requested by user
    const symptomsText = symptoms.join("; ");
    const recommendedDiagnosisText = tests.map(t => `${t.test} (${t.urgency})`).join(", ");

    const executiveSummary = `Based on the data of ${name} (${age}y ${gender}), the patient has likely ${symptomsText}. The likely disease to occur is ${primaryDisease} due to ${diseaseRationale}. Recommended diagnosis and immediate clinical evaluation includes ${recommendedDiagnosisText}.`;

    return {
      executiveSummary,
      identifiedSymptoms: symptoms,
      likelyDiseases: [
        { disease: primaryDisease, likelihood: "High (82-90%)", rationale: diseaseRationale },
        { disease: secondaryDisease, likelihood: "Moderate (55-65%)", rationale: secondaryRationale }
      ],
      recommendedDiagnosis: tests,
      xaiRiskDrivers: drivers,
      tieredActionPlan: actionPlan,
      icd10Codes: icdCodes,
      drugAlerts: drugAlert,
      source: sourceLabel
    };
  }
}

// Global instance
window.GeminiService = new GeminiClinicalService();

/**
 * AegisHealth AI - Clinical Report Generator & Export Suite
 * Exports hospital-grade clinical dossiers, printable summaries, and cohort JSON
 */

class ClinicalReportGenerator {
  
  /**
   * Trigger clean hospital printable report view
   */
  printPatientReport(patient, riskData, aiData) {
    if (!patient) return;
    window.print();
  }

  /**
   * Export the entire active inpatient cohort as a formatted JSON file
   */
  exportCohortJson(patientsList) {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(patientsList, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `AegisHealth_Cohort_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  }

  /**
   * Generate formatted clipboard text of the clinical dossier
   */
  generateClipboardSummary(patient, riskData, aiData) {
    if (!patient) return "";

    const timestamp = new Date().toLocaleString();
    const v = patient.vitals;
    const b = patient.biomarkers;

    return `=====================================================
AEGISHEALTH AI - CLINICAL RISK ASSESSMENT SUMMARY
Generated: ${timestamp}
=====================================================
PATIENT: ${patient.name} (${patient.gender}, ${patient.age}y)
MRN: ${patient.mrn} | WARD: ${patient.ward} | BED: ${patient.bed}
PRIMARY ADMISSION: ${patient.admissionDiagnosis}
HISTORY: ${(patient.history || []).join("; ")}
MEDICATIONS: ${(patient.medications || []).join(", ")}

BEDSIDE VITALS:
- BP: ${v.sysBP}/${v.diaBP} mmHg | HR: ${v.heartRate} bpm
- RR: ${v.respRate} /min | SpO2: ${v.spO2}% | Temp: ${v.temp}°C

KEY BIOMARKERS:
- Glucose: ${b.glucose} mg/dL | Troponin: ${b.troponin} ng/mL
- Creatinine: ${b.creatinine} mg/dL | eGFR: ${b.egfr} mL/min
- WBC: ${b.wbc} k/µL | Lactate: ${b.lactate} mmol/L | CRP: ${b.crp} mg/L

PREDICTIVE ALGORITHMIC RISK SCORES:
- Composite Acuity Index: ${riskData.score}/100 (${riskData.tier})
- 30-Day Readmission Risk: ${riskData.readmissionProb}%
- NEWS2 Score: ${riskData.news2.score} (${riskData.news2.tier})
- qSOFA Score: ${riskData.qsofa.score}/3 (${riskData.qsofa.interpretation})

AI CLINICAL SYNTHESIS:
${aiData?.executiveSummary || "AI analysis not generated."}

LIKELY DISEASES / COMPLICATIONS TO OCCUR:
${(aiData?.likelyDiseases || []).map(d => `- ${d.disease} (${d.likelihood}): ${d.rationale}`).join("\n")}

RECOMMENDED DIAGNOSIS & WORKUP:
${(aiData?.recommendedDiagnosis || []).map(t => typeof t === "string" ? `- ${t}` : `- ${t.test} [${t.urgency}]: ${t.purpose}`).join("\n")}

RECOMMENDED ACTION PLAN:
${(aiData?.tieredActionPlan || []).map(a => `[${a.tier}] ${a.intervention}`).join("\n")}
=====================================================`;
  }
}

// Global instance
window.ReportGenerator = new ClinicalReportGenerator();

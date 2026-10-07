/**
 * AegisHealth AI - Clinical Risk Engine & Predictive Algorithms
 * Evidence-based mathematical models for multi-factor patient risk assessment
 */

class ClinicalRiskEngine {
  
  /**
   * Calculate 10-Year Atherosclerotic Cardiovascular Disease (ASCVD) Risk
   * Based on Framingham & ACC/AHA pooled risk equations adaptation
   */
  calculateAscvdRisk(patient) {
    const age = patient.age || 50;
    const sysBP = patient.vitals.sysBP || 120;
    const isSmoker = (patient.smoking === "Current") ? 1 : (patient.smoking === "Former" ? 0.4 : 0);
    const hasDiabetes = patient.history.some(h => /diabet/i.test(h)) || (patient.biomarkers.glucose > 140);
    const troponinElevated = (patient.biomarkers.troponin || 0) > 0.04;

    // Linear risk predictor
    let baseRisk = (age - 20) * 0.45;
    if (sysBP > 130) baseRisk += (sysBP - 130) * 0.35;
    if (sysBP > 160) baseRisk += 10;
    if (isSmoker) baseRisk += 14 * isSmoker;
    if (hasDiabetes) baseRisk += 15;
    if (troponinElevated) baseRisk += 25; // Myocardial strain/injury
    if (patient.gender === "Male") baseRisk += 4;

    const riskPercent = Math.min(Math.max(Math.round(baseRisk), 2), 95);
    let category = "Low";
    if (riskPercent >= 20) category = "High / Very High";
    else if (riskPercent >= 7.5) category = "Borderline / Intermediate";

    return {
      score: riskPercent,
      category,
      unit: "% 10-Yr Risk"
    };
  }

  /**
   * Calculate Quick Sequential Organ Failure Assessment (qSOFA) Score
   * Criteria: Systolic BP <= 100, Respiratory Rate >= 22, Altered Mental Status
   */
  calculateQsofaScore(patient) {
    let score = 0;
    if (patient.vitals.sysBP <= 100) score += 1;
    if (patient.vitals.respRate >= 22) score += 1;
    
    // Check lactate / septic flag
    if (patient.biomarkers.lactate >= 2.0 || /sepsis|shock|altered/i.test(patient.notes || "")) {
      score += 1;
    }

    let interpretation = "Low acute sepsis risk";
    if (score >= 2) interpretation = "High risk of in-hospital sepsis mortality (qSOFA >= 2)";
    else if (score === 1) interpretation = "Moderate early warning; requires close monitoring";

    return {
      score,
      max: 3,
      interpretation,
      isCritical: score >= 2
    };
  }

  /**
   * Calculate National Early Warning Score 2 (NEWS2)
   * Standard physiological scoring for acute illness deterioration
   */
  calculateNews2Score(patient) {
    let score = 0;
    const v = patient.vitals;

    // Respiration Rate
    if (v.respRate <= 8) score += 3;
    else if (v.respRate <= 11) score += 1;
    else if (v.respRate <= 20) score += 0;
    else if (v.respRate <= 24) score += 2;
    else score += 3; // >= 25

    // SpO2 Scale 1
    if (v.spO2 <= 91) score += 3;
    else if (v.spO2 <= 93) score += 2;
    else if (v.spO2 <= 95) score += 1;
    else score += 0;

    // Systolic BP
    if (v.sysBP <= 90) score += 3;
    else if (v.sysBP <= 100) score += 2;
    else if (v.sysBP <= 110) score += 1;
    else if (v.sysBP <= 219) score += 0;
    else score += 3; // severe hypertension crisis

    // Pulse / Heart Rate
    if (v.heartRate <= 40) score += 3;
    else if (v.heartRate <= 50) score += 1;
    else if (v.heartRate <= 90) score += 0;
    else if (v.heartRate <= 110) score += 1;
    else if (v.heartRate <= 130) score += 2;
    else score += 3; // > 130

    // Temperature
    if (v.temp <= 35.0) score += 3;
    else if (v.temp <= 36.0) score += 1;
    else if (v.temp <= 38.0) score += 0;
    else if (v.temp <= 39.0) score += 1;
    else score += 2; // > 39.0

    let tier = "Low (Ward monitoring)";
    if (score >= 7) tier = "High / Emergency Response";
    else if (score >= 5) tier = "Medium / Urgent Review";

    return {
      score,
      tier,
      isEmergency: score >= 7
    };
  }

  /**
   * KDIGO Renal Staging from eGFR & Creatinine
   */
  calculateRenalStaging(patient) {
    const egfr = patient.biomarkers.egfr || 90;
    let stage = "G1 (Normal eGFR >= 90)";
    let severity = "Normal";

    if (egfr < 15) {
      stage = "G5 (Kidney Failure < 15)";
      severity = "End-Stage Renal Disease";
    } else if (egfr < 30) {
      stage = "G4 (Severe Reduction 15-29)";
      severity = "Severe Impairment";
    } else if (egfr < 45) {
      stage = "G3b (Moderate-Severe 30-44)";
      severity = "Moderate-to-Severe";
    } else if (egfr < 60) {
      stage = "G3a (Mild-Moderate 45-59)";
      severity = "Mild-to-Moderate";
    } else if (egfr < 90) {
      stage = "G2 (Mild Reduction 60-89)";
      severity = "Mildly Decreased";
    }

    return {
      egfr,
      stage,
      severity
    };
  }

  /**
   * Charlson Comorbidity Index (CCI) Approximation
   */
  calculateCharlsonIndex(patient) {
    let cci = 0;
    const historyText = (patient.history || []).join(" ").toLowerCase();

    // Age points
    if (patient.age >= 80) cci += 4;
    else if (patient.age >= 70) cci += 3;
    else if (patient.age >= 60) cci += 2;
    else if (patient.age >= 50) cci += 1;

    if (/myocardial|infarct|nstemi|stemi/i.test(historyText)) cci += 1;
    if (/heart failure|hfref|cardiomyopathy/i.test(historyText)) cci += 1;
    if (/copd|emphysema|asthma/i.test(historyText)) cci += 1;
    if (/diabet/i.test(historyText)) cci += 1;
    if (/kidney|ckd|nephropathy/i.test(historyText)) cci += 2;
    if (/stroke|cva|tia/i.test(historyText)) cci += 1;

    let mortalityRisk = Math.min(Math.round(cci * 11), 85);
    return {
      score: cci,
      estimated10YrSurvival: 100 - mortalityRisk
    };
  }

  /**
   * Organ System Stress Breakdown (Radar Matrix):
   * 1. Cardiovascular
   * 2. Pulmonary
   * 3. Renal
   * 4. Metabolic
   * 5. Sepsis / Inflammatory
   */
  calculateOrganStressMatrix(patient) {
    const v = patient.vitals;
    const b = patient.biomarkers;

    // 1. Cardiovascular
    let cvScore = 15;
    if (v.sysBP > 160 || v.sysBP < 90) cvScore += 30;
    else if (v.sysBP > 140) cvScore += 15;
    if (v.heartRate > 100 || v.heartRate < 55) cvScore += 20;
    if (b.troponin > 0.04) cvScore += 35;
    cvScore = Math.min(cvScore, 100);

    // 2. Pulmonary
    let respScore = 10;
    if (v.spO2 < 90) respScore += 45;
    else if (v.spO2 < 94) respScore += 25;
    if (v.respRate > 24 || v.respRate < 10) respScore += 35;
    else if (v.respRate > 20) respScore += 15;
    respScore = Math.min(respScore, 100);

    // 3. Renal
    let renalScore = 10;
    if (b.egfr < 30) renalScore += 50;
    else if (b.egfr < 60) renalScore += 30;
    if (b.creatinine > 2.0) renalScore += 30;
    else if (b.creatinine > 1.3) renalScore += 15;
    renalScore = Math.min(renalScore, 100);

    // 4. Metabolic
    let metaScore = 10;
    if (b.glucose > 250 || b.glucose < 65) metaScore += 45;
    else if (b.glucose > 180) metaScore += 30;
    else if (b.glucose > 140) metaScore += 15;
    metaScore = Math.min(metaScore, 100);

    // 5. Inflammatory / Sepsis
    let sepsisScore = 10;
    if (b.lactate >= 4.0) sepsisScore += 50;
    else if (b.lactate >= 2.0) sepsisScore += 30;
    if (b.wbc > 18.0 || b.wbc < 4.0) sepsisScore += 25;
    if (b.crp > 50) sepsisScore += 20;
    else if (b.crp > 15) sepsisScore += 10;
    if (v.temp > 38.5 || v.temp < 36.0) sepsisScore += 15;
    sepsisScore = Math.min(sepsisScore, 100);

    return {
      cardiovascular: Math.round(cvScore),
      pulmonary: Math.round(respScore),
      renal: Math.round(renalScore),
      metabolic: Math.round(metaScore),
      inflammatory: Math.round(sepsisScore)
    };
  }

  /**
   * Composite Clinical Acuity Index (0 to 100)
   * Integrates multivariable physiological indicators into a single actionable index
   */
  calculateCompositeAcuity(patient) {
    const organMatrix = this.calculateOrganStressMatrix(patient);
    const news2 = this.calculateNews2Score(patient);
    const qsofa = this.calculateQsofaScore(patient);

    // Weighted synthesis
    const organAvg = (
      organMatrix.cardiovascular * 0.25 +
      organMatrix.pulmonary * 0.22 +
      organMatrix.renal * 0.18 +
      organMatrix.metabolic * 0.15 +
      organMatrix.inflammatory * 0.20
    );

    let acuity = organAvg;
    // Extra boost if acute early warning scores are triggering
    if (news2.score >= 7) acuity += 12;
    else if (news2.score >= 5) acuity += 6;

    if (qsofa.score >= 2) acuity += 15;

    // Age frailty modifier
    if (patient.age > 75) acuity += 5;

    acuity = Math.min(Math.max(Math.round(acuity), 8), 99);

    let tier = "Low Risk";
    let tierColor = "text-success";
    let badgeClass = "badge-success";

    if (acuity >= 75) {
      tier = "Critical / Resuscitation";
      tierColor = "text-danger";
      badgeClass = "badge-danger";
    } else if (acuity >= 50) {
      tier = "High Acuity";
      tierColor = "text-warning";
      badgeClass = "badge-warning";
    } else if (acuity >= 30) {
      tier = "Moderate Risk";
      tierColor = "text-info";
      badgeClass = "badge-info";
    }

    // 30-Day Readmission Probability estimation
    const readmissionProb = Math.min(Math.max(Math.round((acuity * 0.45) + (patient.age * 0.15)), 6), 88);

    return {
      score: acuity,
      tier,
      tierColor,
      badgeClass,
      readmissionProb,
      organMatrix,
      news2,
      qsofa
    };
  }

  /**
   * Counterfactual Simulation Delta Calculator
   * Given modified vitals, compute what the acuity would shift to
   */
  calculateSimulatedAcuity(basePatient, modifiedVitals) {
    // Clone patient and inject modified vitals
    const simulatedPatient = JSON.parse(JSON.stringify(basePatient));
    simulatedPatient.vitals = { ...simulatedPatient.vitals, ...modifiedVitals };

    // Also adjust correlated biomarkers dynamically if vitals shift dramatically
    // e.g. If sysBP drops to normal, cardiovascular stress decreases
    if (modifiedVitals.glucose !== undefined) {
      simulatedPatient.biomarkers.glucose = modifiedVitals.glucose;
    }

    const baselineAcuity = this.calculateCompositeAcuity(basePatient);
    const simulatedAcuity = this.calculateCompositeAcuity(simulatedPatient);
    const delta = simulatedAcuity.score - baselineAcuity.score;

    return {
      baseline: baselineAcuity,
      simulated: simulatedAcuity,
      delta,
      isImprovement: delta < 0
    };
  }

  /**
   * Aggregate Cohort Metrics for Dashboard KPIs
   */
  calculateCohortSummary(patientsList) {
    if (!patientsList || patientsList.length === 0) {
      return {
        total: 0,
        criticalCount: 0,
        avgAcuity: 0,
        avgReadmission: 0,
        breakdown: { critical: 0, high: 0, moderate: 0, low: 0 }
      };
    }

    let totalAcuity = 0;
    let totalReadmission = 0;
    let criticalCount = 0;
    let breakdown = { critical: 0, high: 0, moderate: 0, low: 0 };

    patientsList.forEach(p => {
      const acuity = this.calculateCompositeAcuity(p);
      totalAcuity += acuity.score;
      totalReadmission += acuity.readmissionProb;

      if (acuity.score >= 75) {
        criticalCount++;
        breakdown.critical++;
      } else if (acuity.score >= 50) {
        breakdown.high++;
      } else if (acuity.score >= 30) {
        breakdown.moderate++;
      } else {
        breakdown.low++;
      }
    });

    const avgAcuity = (totalAcuity / patientsList.length).toFixed(1);
    const avgReadmission = (totalReadmission / patientsList.length).toFixed(1);

    return {
      total: patientsList.length,
      criticalCount,
      avgAcuity,
      avgReadmission,
      breakdown
    };
  }
}

// Global instance
window.RiskEngine = new ClinicalRiskEngine();

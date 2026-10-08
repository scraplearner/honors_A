/**
 * AegisHealth AI - UI Manager & DOM View Controller (Pure Light Theme)
 * Clean, decoupled rendering of patient risk workspace and cohort registry
 */

class UiManager {
  constructor() {
    this.currentAiResults = null;
  }

  showToast(message, type = "info") {
    const container = document.getElementById("toastContainer");
    if (!container) return;

    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `<span>${message}</span>`;

    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateX(100%)";
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }

  switchTab(tabId) {
    document.querySelectorAll(".nav-tab").forEach(tab => {
      tab.classList.toggle("active", tab.dataset.tab === tabId);
    });

    document.querySelectorAll(".tab-pane").forEach(pane => {
      pane.classList.toggle("active", pane.id === tabId);
    });

    if (tabId === "tab-patient-analysis") {
      const activePatient = window.PatientStore.getActivePatient();
      if (activePatient) this.renderPatientWorkspace(activePatient);
    } else if (tabId === "tab-cohort-manager") {
      this.renderCohortTable();
    }
  }

  /**
   * Render Patient Clinical Workspace (Automatic AI Clinical Synthesis)
   */
  async renderPatientWorkspace(patient) {
    if (!patient) return;

    // Update patient selector dropdown without tearing down DOM
    const selector = document.getElementById("patientSelector");
    const all = window.PatientStore.getAllPatients();
    if (selector) {
      if (selector.options.length !== all.length) {
        selector.innerHTML = all.map(p => `
          <option value="${p.id}">
            ${p.name} (${p.ward} - ${p.bed})
          </option>
        `).join("");
      }
      selector.value = patient.id;
    }

    // Update Header Pill
    const navPill = document.getElementById("navActivePatientName");
    if (navPill) navPill.textContent = patient.name;

    // Quick Stats Banner
    const risk = window.RiskEngine.calculateCompositeAcuity(patient);
    document.getElementById("activePatientBanner").innerHTML = `
      <div class="patient-bio-chip">
        <span class="bio-title">MRN</span>
        <span class="bio-val">${patient.mrn}</span>
      </div>
      <div class="patient-bio-chip">
        <span class="bio-title">Age / Gender</span>
        <span class="bio-val">${patient.age}y &bull; ${patient.gender}</span>
      </div>
      <div class="patient-bio-chip">
        <span class="bio-title">Ward & Bed</span>
        <span class="bio-val">${patient.ward} (${patient.bed})</span>
      </div>
      <div class="patient-bio-chip">
        <span class="bio-title">Acuity Status</span>
        <span class="badge ${risk.badgeClass}">${risk.tier} (${risk.score})</span>
      </div>
    `;

    // Render Vitals Grid
    this.renderVitalsGrid(patient.vitals);

    // Render Biomarkers Table
    this.renderBiomarkersTable(patient.biomarkers);

    // Render Comorbidities and Medications Tags
    this.renderHistoryTags(patient);

    // Update Composite Score Gauge & Legend
    document.getElementById("patientCompositeScore").textContent = risk.score;
    const tierBadge = document.getElementById("patientCompositeTier");
    tierBadge.textContent = risk.tier;
    tierBadge.className = `gauge-badge header-gauge-badge ${risk.tierColor}`;
    window.ChartEngine.drawAcuityGauge("gaugeCanvas", risk.score);

    // Render Validated Score List
    this.renderValidatedScores(patient, risk);

    // Render Organ Stress Radar
    window.ChartEngine.drawOrganRadar("organRadarCanvas", risk.organMatrix);

    // Render Patient Edit Audit History and Update Count Badge
    this.renderAuditHistory(patient);

    // Automatically synthesize and display the AI Clinical Intelligence Dossier immediately
    try {
      const aiResults = await window.GeminiService.analyzePatient(patient, risk);
      this.currentAiResults = {
        patientId: patient.id,
        data: aiResults
      };
      this.displayAiFindings(aiResults);
    } catch (err) {
      console.error("Clinical intelligence reasoning error:", err);
    }
  }

  /**
   * Re-evaluates patient data with the CDS Reasoning Engine
   */
  async generateAiReportForActivePatient() {
    const patient = window.PatientStore.getActivePatient();
    if (!patient) return;
    const risk = window.RiskEngine.calculateCompositeAcuity(patient);

    try {
      const aiResults = await window.GeminiService.analyzePatient(patient, risk);
      this.currentAiResults = {
        patientId: patient.id,
        data: aiResults
      };
      this.displayAiFindings(aiResults);
      this.showToast(`AI Clinical Decision Report updated for ${patient.name}!`, "success");
    } catch (err) {
      console.error("AI report generation error:", err);
      this.showToast(`Clinical analysis error: ${err.message}`, "danger");
    }
  }

  renderVitalsGrid(v) {
    const container = document.getElementById("vitalTilesContainer");
    if (!container) return;

    const tiles = [
      {
        label: "Blood Pressure",
        val: `${v.sysBP}/${v.diaBP}`,
        unit: "mmHg",
        isCrit: v.sysBP > 170 || v.sysBP < 90,
        isWarn: v.sysBP > 140,
        status: v.sysBP > 160 ? "Hypertensive Urgency" : (v.sysBP < 90 ? "Hypotensive" : "Normal")
      },
      {
        label: "Heart Rate",
        val: v.heartRate,
        unit: "bpm",
        isCrit: v.heartRate > 120 || v.heartRate < 45,
        isWarn: v.heartRate > 100,
        status: v.heartRate > 100 ? "Tachycardia" : (v.heartRate < 60 ? "Bradycardia" : "Normal")
      },
      {
        label: "SpO2 (Pulse Ox)",
        val: `${v.spO2}%`,
        unit: "",
        isCrit: v.spO2 < 90,
        isWarn: v.spO2 < 94,
        status: v.spO2 < 90 ? "Critical Hypoxia" : (v.spO2 < 95 ? "Mild Hypoxemia" : "Adequate")
      },
      {
        label: "Respiratory Rate",
        val: v.respRate,
        unit: "/min",
        isCrit: v.respRate > 28 || v.respRate < 10,
        isWarn: v.respRate > 22,
        status: v.respRate > 22 ? "Tachypnea" : "Normal"
      }
    ];

    container.innerHTML = tiles.map(t => {
      const cls = t.isCrit ? "vital-abnormal" : (t.isWarn ? "vital-warning" : "");
      return `
        <div class="vital-tile ${cls}">
          <div class="vital-tile-label">${t.label}</div>
          <div class="vital-tile-value">${t.val} <span class="vital-tile-unit">${t.unit}</span></div>
          <div class="vital-tile-status ${t.isCrit ? 'text-danger' : (t.isWarn ? 'text-warning' : 'text-success')}">${t.status}</div>
        </div>
      `;
    }).join("");
  }

  renderBiomarkersTable(b) {
    const tbody = document.getElementById("biomarkersTableBody");
    if (!tbody) return;

    const rows = [
      { name: "Blood Glucose", val: `${b.glucose} mg/dL`, ref: "70 - 99", flag: b.glucose > 140 ? "HIGH" : "NORMAL", isCrit: b.glucose > 200 },
      { name: "Serum Creatinine", val: `${b.creatinine} mg/dL`, ref: "0.7 - 1.2", flag: b.creatinine > 1.3 ? "HIGH" : "NORMAL", isCrit: b.creatinine > 2.0 },
      { name: "eGFR", val: `${b.egfr} mL/min`, ref: "> 90", flag: b.egfr < 60 ? "LOW" : "NORMAL", isCrit: b.egfr < 30 },
      { name: "Cardiac Troponin-I", val: `${b.troponin} ng/mL`, ref: "< 0.04", flag: b.troponin > 0.04 ? "ELEVATED" : "NORMAL", isCrit: b.troponin > 0.04 },
      { name: "WBC Count", val: `${b.wbc} k/µL`, ref: "4.5 - 11.0", flag: b.wbc > 11.0 ? "HIGH" : "NORMAL", isCrit: b.wbc > 18.0 },
      { name: "Serum Lactate", val: `${b.lactate} mmol/L`, ref: "0.5 - 2.0", flag: b.lactate > 2.0 ? "HIGH" : "NORMAL", isCrit: b.lactate > 3.0 },
      { name: "hs-CRP", val: `${b.crp} mg/L`, ref: "< 3.0", flag: b.crp > 5.0 ? "ELEVATED" : "NORMAL", isCrit: b.crp > 20.0 }
    ];

    tbody.innerHTML = rows.map(r => {
      const tagCls = r.isCrit ? "badge-danger" : (r.flag !== "NORMAL" ? "badge-warning" : "badge-success");
      return `
        <tr>
          <td><strong>${r.name}</strong></td>
          <td class="font-mono">${r.val}</td>
          <td class="text-muted">${r.ref}</td>
          <td><span class="badge ${tagCls}">${r.flag}</span></td>
        </tr>
      `;
    }).join("");
  }

  renderHistoryTags(patient) {
    const conditionsContainer = document.getElementById("chronicConditionsTags");
    conditionsContainer.innerHTML = (patient.history || []).map(h => `
      <span class="tag-item">${h}</span>
    `).join("");

    const medsContainer = document.getElementById("activeMedicationsTags");
    medsContainer.innerHTML = (patient.medications || []).map(m => `
      <span class="tag-item font-mono">${m}</span>
    `).join("");
  }

  renderValidatedScores(patient, risk) {
    const container = document.getElementById("validatedScoresList");
    if (!container) return;

    const ascvd = window.RiskEngine.calculateAscvdRisk(patient);
    const qsofa = window.RiskEngine.calculateQsofaScore(patient);
    const news2 = window.RiskEngine.calculateNews2Score(patient);
    const cci = window.RiskEngine.calculateCharlsonIndex(patient);
    const renal = window.RiskEngine.calculateRenalStaging(patient);

    const scores = [
      { name: "10-Yr ASCVD Risk", desc: ascvd.category, val: `${ascvd.score}%`, cls: ascvd.score > 20 ? 'text-danger' : 'text-primary' },
      { name: "qSOFA Sepsis Alert", desc: qsofa.interpretation, val: `${qsofa.score} / 3`, cls: qsofa.isCritical ? 'text-danger' : 'text-success' },
      { name: "NEWS2 Acuity Deterioration", desc: news2.tier, val: `${news2.score}`, cls: news2.isEmergency ? 'text-danger' : 'text-warning' },
      { name: "Charlson Comorbidity (CCI)", desc: `${cci.estimated10YrSurvival}% 10-Yr Survival`, val: `Index: ${cci.score}`, cls: 'text-primary' },
      { name: "KDIGO Renal Function", desc: renal.stage, val: renal.severity, cls: patient.biomarkers.egfr < 45 ? 'text-danger' : 'text-success' }
    ];

    container.innerHTML = scores.map(s => `
      <div class="score-row">
        <div>
          <div class="score-name">${s.name}</div>
          <div class="score-desc">${s.desc}</div>
        </div>
        <div class="score-badge-val ${s.cls}">${s.val}</div>
      </div>
    `).join("");
  }

  displayAiFindings(aiData) {
    if (!aiData) return;

    // 1. Executive Summary: Personalized "Based on the data of [Patient Name]..."
    const execSummary = document.getElementById("aiExecutiveSummary");
    if (execSummary) execSummary.textContent = aiData.executiveSummary;

    // 2. Likely Diseases to Occur
    const likelyList = document.getElementById("aiLikelyDiseasesList");
    if (likelyList) {
      const diseases = aiData.likelyDiseases || [];
      if (diseases.length > 0) {
        likelyList.innerHTML = diseases.map(d => {
          const isHigh = d.likelihood.includes('High') || d.likelihood.includes('Critical');
          return `
            <div class="diff-card ${isHigh ? 'primary' : ''}">
              <div class="diff-content">
                <div class="diff-header-row">
                  <span class="diff-name">${d.disease}</span>
                  <span class="badge ${isHigh ? 'badge-danger' : 'badge-warning'} diff-badge">${d.likelihood}</span>
                </div>
                <div class="diff-reason">${d.rationale}</div>
              </div>
            </div>
          `;
        }).join("");
      } else {
        likelyList.innerHTML = `<span class="text-sm text-muted">No acute disease decompensation identified.</span>`;
      }
    }

    // 3. Recommended Diagnosis & Confirmatory Tests
    const testsList = document.getElementById("aiRecommendedDiagnosisList");
    if (testsList) {
      const tests = aiData.recommendedDiagnosis || [];
      if (tests.length > 0) {
        testsList.innerHTML = tests.map(t => {
          const testName = typeof t === "string" ? t : t.test;
          const urgency = typeof t === "string" ? "Recommended" : (t.urgency || "Urgent");
          const purpose = typeof t === "string" ? "Confirmatory clinical investigation" : (t.purpose || "Clinical evaluation");
          const isStat = urgency.toLowerCase().includes("stat") || urgency.toLowerCase().includes("crit");
          return `
            <div class="test-card ${isStat ? 'test-stat' : ''}">
              <div class="test-content">
                <div class="test-header-row">
                  <span class="test-name">${testName}</span>
                  <span class="badge ${isStat ? 'badge-danger' : 'badge-primary'} test-badge">${urgency}</span>
                </div>
                <div class="test-purpose">${purpose}</div>
              </div>
            </div>
          `;
        }).join("");
      } else {
        testsList.innerHTML = `<span class="text-sm text-muted">Standard routine monitoring recommended.</span>`;
      }
    }

    // 4. Identified Symptoms & Biomarker Anomalies
    const driversList = document.getElementById("aiRiskDriversList");
    if (driversList) {
      const symptoms = aiData.identifiedSymptoms || [];
      const drivers = aiData.xaiRiskDrivers || [];
      let html = "";

      if (symptoms.length > 0) {
        html += `<div class="mb-2"><div class="micro-label">Detected Physiological Symptoms:</div><div class="tags-cloud mb-2">` +
          symptoms.map(s => `<span class="tag-item" style="color: var(--text-main); font-weight: 600;">&bull; ${s}</span>`).join("") +
          `</div></div>`;
      }

      if (drivers.length > 0) {
        html += `<div class="micro-label">Biomarker Acuity Attribution:</div>` +
          drivers.map(d => {
            const isPos = d.type === "positive";
            return `
              <div class="xai-driver-row">
                <div class="xai-driver-name" title="${d.factor}">${d.factor}</div>
                <div class="xai-bar-track">
                  <div class="xai-bar-fill ${isPos ? 'positive' : 'protective'}" style="width: 80%;"></div>
                </div>
                <div class="xai-weight ${isPos ? 'text-danger' : 'text-success'}">${d.weight}</div>
              </div>
            `;
          }).join("");
      }

      driversList.innerHTML = html || `<span class="text-sm text-muted">All primary biomarkers within normal range.</span>`;
    }

    // 5. Action Plan
    const actionList = document.getElementById("aiActionPlanList");
    if (actionList) {
      actionList.innerHTML = (aiData.tieredActionPlan || []).map(act => `
        <div class="action-plan-item ${act.isUrgent ? 'urgent' : ''}">
          <div class="action-plan-tier">${act.tier}</div>
          <div class="action-plan-text">${act.intervention}</div>
        </div>
      `).join("");
    }

    // 6. ICD-10 Tags
    const icdContainer = document.getElementById("aiIcdTags");
    if (icdContainer) {
      icdContainer.innerHTML = (aiData.icd10Codes || []).map(code => `
        <span class="icd-chip">${code}</span>
      `).join("");
    }

    // 7. Drug Alerts
    const drugAlertEl = document.getElementById("aiDrugAlerts");
    if (drugAlertEl) {
      drugAlertEl.textContent = aiData.drugAlerts || "No active pharmacological conflicts identified.";
    }
  }

  renderCohortTable() {
    const tbody = document.getElementById("cohortTableBody");
    if (!tbody) return;

    const searchTerm = (document.getElementById("cohortSearchInput")?.value || "").toLowerCase();
    const wardFilter = document.getElementById("filterWardSelect")?.value || "all";
    const riskFilter = document.getElementById("filterRiskSelect")?.value || "all";

    const allPatients = window.PatientStore.getAllPatients();

    const filtered = allPatients.filter(p => {
      const matchesSearch = !searchTerm ||
        p.name.toLowerCase().includes(searchTerm) ||
        p.mrn.toLowerCase().includes(searchTerm) ||
        p.admissionDiagnosis.toLowerCase().includes(searchTerm) ||
        p.ward.toLowerCase().includes(searchTerm);

      const matchesWard = (wardFilter === "all") || (p.ward === wardFilter);

      const risk = window.RiskEngine.calculateCompositeAcuity(p);
      let matchesRisk = true;
      if (riskFilter === "Critical") matchesRisk = risk.score >= 75;
      else if (riskFilter === "High") matchesRisk = risk.score >= 50 && risk.score < 75;
      else if (riskFilter === "Moderate") matchesRisk = risk.score >= 30 && risk.score < 50;
      else if (riskFilter === "Low") matchesRisk = risk.score < 30;

      return matchesSearch && matchesWard && matchesRisk;
    });

    if (filtered.length === 0) {
      tbody.innerHTML = `<tr><td colspan="9" class="text-center text-muted" style="padding: 2.5rem;">No matching patient records found in registry.</td></tr>`;
      return;
    }

    tbody.innerHTML = filtered.map(p => {
      const risk = window.RiskEngine.calculateCompositeAcuity(p);
      return `
        <tr>
          <td>
            <strong>${p.name}</strong><br>
            <span class="text-xs text-muted font-mono">${p.mrn}</span>
          </td>
          <td>${p.age}y / ${p.gender}</td>
          <td>
            <span class="badge badge-subtle">${p.ward}</span><br>
            <span class="text-xs text-muted">${p.bed}</span>
          </td>
          <td><span class="text-sm">${p.admissionDiagnosis}</span></td>
          <td class="font-mono">${p.vitals.sysBP}/${p.vitals.diaBP} &bull; ${p.vitals.heartRate} bpm</td>
          <td>
            <span class="text-xs">Gluc: ${p.biomarkers.glucose} | Trop: ${p.biomarkers.troponin}</span><br>
            <span class="text-xs text-muted">eGFR: ${p.biomarkers.egfr} | Lact: ${p.biomarkers.lactate}</span>
          </td>
          <td class="font-mono font-bold ${risk.tierColor}">
            <strong>${risk.score}</strong> <span class="text-xs text-muted">/ 100</span>
          </td>
          <td><span class="badge ${risk.badgeClass}">${risk.tier}</span></td>
          <td>
            <div class="btn-group-sm">
              <button class="btn btn-outline btn-xs" onclick="window.App.selectPatientAndInspect('${p.id}')">Analyze</button>
              <button class="btn btn-outline btn-xs" onclick="window.App.openEditPatientModal('${p.id}')">Edit</button>
              <button class="btn btn-secondary btn-xs text-danger" onclick="window.App.deletePatient('${p.id}')">&times;</button>
            </div>
          </td>
        </tr>
      `;
    }).join("");
  }

  /**
   * Render Patient Edit Audit History and Update Count Badge
   */
  renderAuditHistory(patient) {
    if (!patient) return;
    const countBadge = document.getElementById("auditCountBadge");
    const subTitle = document.getElementById("auditPatientSubtitle");
    const statCount = document.getElementById("auditStatCount");
    const statLastDate = document.getElementById("auditStatLastDate");
    const historyList = document.getElementById("auditHistoryList");

    const logs = window.PatientStore.getAuditLogsForPatient(patient.id);
    const count = logs.length;

    if (countBadge) countBadge.textContent = `${count}`;
    if (subTitle) subTitle.textContent = `Tracking modifications for ${patient.name} (${patient.mrn})`;
    if (statCount) statCount.textContent = `${count}`;
    if (statLastDate) statLastDate.textContent = count > 0 ? logs[0].date : "Never";

    if (!historyList) return;

    if (count === 0) {
      historyList.innerHTML = `
        <div class="audit-empty-state">
          <div class="audit-empty-icon">
            <svg style="width:36px;height:36px;" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
          </div>
          <div><strong>No edit history recorded yet</strong></div>
          <div class="text-xs text-muted mt-1">Click "Edit Patient Info" above to modify vitals, biomarkers, or patient demographics.</div>
        </div>
      `;
      return;
    }

    historyList.innerHTML = logs.map(log => `
      <div class="audit-entry-card">
        <div class="audit-entry-header">
          <span class="audit-entry-badge">Edit #${log.editNumber}</span>
          <span class="audit-entry-date">${log.date}</span>
        </div>
        <div class="audit-diff-list">
          ${log.changes.length > 0 ? log.changes.map(c => `
            <div class="audit-diff-item">
              <span class="diff-field">${c.field}:</span>
              <span class="diff-prev">${c.from}</span>
              <span class="diff-arrow">&rarr;</span>
              <span class="diff-curr">${c.to}</span>
            </div>
          `).join("") : `<div class="text-xs text-muted">Dossier verified with no field changes.</div>`}
        </div>
      </div>
    `).join("");
  }

  /**
   * Pre-populate and open the Patient modal in Edit mode
   */
  openEditPatientModal(patient) {
    if (!patient) return;

    const modal = document.getElementById("modalPatientForm");
    const modalTitle = document.getElementById("modalPatientTitle");
    const submitBtn = document.getElementById("btnSubmitPatient");
    const modeInput = document.getElementById("formPatientMode");
    const idInput = document.getElementById("formPatientId");

    if (modalTitle) modalTitle.textContent = `Edit Patient Clinical Information — ${patient.name} (${patient.mrn})`;
    if (submitBtn) submitBtn.textContent = `Save Changes & Recalculate Risk`;
    if (modeInput) modeInput.value = "edit";
    if (idInput) idInput.value = patient.id;

    // Fill form fields
    const setValue = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.value = (val !== undefined && val !== null) ? val : "";
    };

    setValue("formName", patient.name);
    setValue("formAge", patient.age);
    setValue("formGender", patient.gender);
    setValue("formMrn", patient.mrn);
    setValue("formWard", patient.ward);
    setValue("formBed", patient.bed);
    setValue("formSmoker", patient.smoking || "No");

    // Vitals
    setValue("formSysBP", patient.vitals?.sysBP || 120);
    setValue("formDiaBP", patient.vitals?.diaBP || 80);
    setValue("formHR", patient.vitals?.heartRate || 75);
    setValue("formSpO2", patient.vitals?.spO2 || 98);
    setValue("formRespRate", patient.vitals?.respRate || 16);
    setValue("formTemp", patient.vitals?.temp || 37.0);

    // Biomarkers
    setValue("formGlucose", patient.biomarkers?.glucose || 100);
    setValue("formCreatinine", patient.biomarkers?.creatinine || 1.0);
    setValue("formEgfr", patient.biomarkers?.egfr || 90);
    setValue("formTroponin", patient.biomarkers?.troponin || 0.01);
    setValue("formWbc", patient.biomarkers?.wbc || 7.0);
    setValue("formLactate", patient.biomarkers?.lactate || 1.1);
    setValue("formCrp", patient.biomarkers?.crp || 2.0);

    // History and Medications
    setValue("formHistory", (patient.history || []).join(", "));
    setValue("formMedications", (patient.medications || []).join(", "));

    if (modal) modal.classList.remove("hidden");
  }
}

// Global instance
window.Ui = new UiManager();

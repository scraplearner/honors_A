/**
 * AegisHealth AI - Main Application Controller
 * Clean, decoupled event orchestrator for patient risk prediction and cohort management
 */

class AegisApp {
  constructor() {
    this.init();
  }

  init() {
    console.log("Initializing AegisHealth AI Clinical System...");

    // 1. Setup Tab Navigation
    this.setupTabNavigation();

    // 2. Setup Patient Registration Modal
    this.setupPatientModal();

    // 3. Setup Patient Workspace Controls
    this.setupPatientWorkspaceEvents();

    // 4. Setup Cohort Search & Filter Controls
    this.setupCohortFilters();

    // 5. Initial Render
    const activePatient = window.PatientStore.getActivePatient();
    if (activePatient) {
      window.Ui.renderPatientWorkspace(activePatient);
    }
    window.Ui.renderCohortTable();
  }

  setupTabNavigation() {
    document.querySelectorAll(".nav-tab").forEach(tab => {
      tab.addEventListener("click", () => {
        const targetTab = tab.dataset.tab;
        if (tab.classList.contains("active")) return; // Already on this tab, avoid re-rendering
        window.Ui.switchTab(targetTab);
      });
    });
  }

  setupPatientModal() {
    const modal = document.getElementById("modalPatientForm");
    const modalTitle = document.getElementById("modalPatientTitle");
    const submitBtn = document.getElementById("btnSubmitPatient");
    const btnOpen = document.getElementById("btnNewPatient");
    const btnOpenFromCohort = document.getElementById("btnAddNewPatientFromCohort");
    const btnClose = document.getElementById("btnClosePatientModal");
    const btnCancel = document.getElementById("btnCancelPatientModal");
    const form = document.getElementById("newPatientForm");
    const modeInput = document.getElementById("formPatientMode");
    const idInput = document.getElementById("formPatientId");

    const openNewModal = () => {
      if (form) form.reset();
      if (modeInput) modeInput.value = "create";
      if (idInput) idInput.value = "";
      if (modalTitle) modalTitle.textContent = "Register New Clinical Inpatient";
      if (submitBtn) submitBtn.textContent = "Save & Calculate Risk Profile";
      if (modal) modal.classList.remove("hidden");
    };

    const closeModal = () => {
      if (modal) modal.classList.add("hidden");
    };

    if (btnOpen) btnOpen.addEventListener("click", openNewModal);
    if (btnOpenFromCohort) btnOpenFromCohort.addEventListener("click", openNewModal);
    if (btnClose) btnClose.addEventListener("click", closeModal);
    if (btnCancel) btnCancel.addEventListener("click", closeModal);

    if (form) {
      form.addEventListener("submit", (e) => {
        e.preventDefault();

        const isEditMode = (modeInput?.value === "edit");
        const targetPatientId = idInput?.value;

        const historyVal = document.getElementById("formHistory").value.trim();
        const medsVal = document.getElementById("formMedications").value.trim();

        const patientData = {
          name: document.getElementById("formName").value.trim(),
          age: parseInt(document.getElementById("formAge").value, 10),
          gender: document.getElementById("formGender").value,
          mrn: document.getElementById("formMrn").value.trim(),
          ward: document.getElementById("formWard").value,
          bed: document.getElementById("formBed").value.trim() || "Unassigned",
          admissionDiagnosis: historyVal || "Clinical Inpatient Monitoring",
          history: historyVal ? historyVal.split(",").map(s => s.trim()) : ["None documented"],
          medications: medsVal ? medsVal.split(",").map(s => s.trim()) : ["None active"],
          smoking: document.getElementById("formSmoker").value,
          vitals: {
            sysBP: parseInt(document.getElementById("formSysBP").value, 10),
            diaBP: parseInt(document.getElementById("formDiaBP").value, 10),
            heartRate: parseInt(document.getElementById("formHR").value, 10),
            respRate: parseInt(document.getElementById("formRespRate").value, 10),
            spO2: parseInt(document.getElementById("formSpO2").value, 10),
            temp: parseFloat(document.getElementById("formTemp").value)
          },
          biomarkers: {
            glucose: parseInt(document.getElementById("formGlucose").value, 10),
            creatinine: parseFloat(document.getElementById("formCreatinine").value),
            egfr: parseInt(document.getElementById("formEgfr").value, 10),
            troponin: parseFloat(document.getElementById("formTroponin").value),
            wbc: parseFloat(document.getElementById("formWbc").value),
            lactate: parseFloat(document.getElementById("formLactate").value),
            crp: parseFloat(document.getElementById("formCrp").value)
          },
          notes: "Bedside intake records active."
        };

        if (isEditMode && targetPatientId) {
          const original = window.PatientStore.getPatientById(targetPatientId);
          if (original) {
            // Compute detailed field-level diffs
            const diffs = [];
            const checkDiff = (field, oldVal, newVal, unit = "") => {
              const oStr = `${oldVal !== undefined ? oldVal : ''}${unit ? ' ' + unit : ''}`.trim();
              const nStr = `${newVal !== undefined ? newVal : ''}${unit ? ' ' + unit : ''}`.trim();
              if (oStr !== nStr) {
                diffs.push({ field, from: oStr, to: nStr });
              }
            };

            checkDiff("Full Name", original.name, patientData.name);
            checkDiff("Age", original.age, patientData.age, "years");
            checkDiff("Gender", original.gender, patientData.gender);
            checkDiff("MRN", original.mrn, patientData.mrn);
            checkDiff("Ward", original.ward, patientData.ward);
            checkDiff("Bed", original.bed, patientData.bed);
            checkDiff("Smoking Status", original.smoking, patientData.smoking);
            checkDiff("Systolic BP", original.vitals?.sysBP, patientData.vitals.sysBP, "mmHg");
            checkDiff("Diastolic BP", original.vitals?.diaBP, patientData.vitals.diaBP, "mmHg");
            checkDiff("Heart Rate", original.vitals?.heartRate, patientData.vitals.heartRate, "bpm");
            checkDiff("SpO2", original.vitals?.spO2, patientData.vitals.spO2, "%");
            checkDiff("Resp Rate", original.vitals?.respRate, patientData.vitals.respRate, "/min");
            checkDiff("Temperature", original.vitals?.temp, patientData.vitals.temp, "°C");
            checkDiff("Blood Glucose", original.biomarkers?.glucose, patientData.biomarkers.glucose, "mg/dL");
            checkDiff("Serum Creatinine", original.biomarkers?.creatinine, patientData.biomarkers.creatinine, "mg/dL");
            checkDiff("eGFR", original.biomarkers?.egfr, patientData.biomarkers.egfr, "mL/min");
            checkDiff("Troponin-I", original.biomarkers?.troponin, patientData.biomarkers.troponin, "ng/mL");
            checkDiff("WBC Count", original.biomarkers?.wbc, patientData.biomarkers.wbc, "k/µL");
            checkDiff("Serum Lactate", original.biomarkers?.lactate, patientData.biomarkers.lactate, "mmol/L");
            checkDiff("hs-CRP", original.biomarkers?.crp, patientData.biomarkers.crp, "mg/L");
            checkDiff("Medical History", (original.history || []).join(", "), (patientData.history || []).join(", "));
            checkDiff("Medications", (original.medications || []).join(", "), (patientData.medications || []).join(", "));

            // Record audit trail
            window.PatientStore.recordEditAudit(
              original.id,
              patientData.name,
              diffs.length > 0 ? diffs : [{ field: "Clinical Dossier", from: "Baseline confirmed", to: "Re-certified with no changes" }]
            );

            // Update patient in store
            const updated = window.PatientStore.updatePatient(original.id, patientData);
            closeModal();

            // Re-render views
            window.Ui.renderPatientWorkspace(updated);
            window.Ui.renderCohortTable();
            window.Ui.showToast(`Patient ${updated.name} updated successfully! (${diffs.length} change${diffs.length === 1 ? '' : 's'} logged)`, "success");
            return;
          }
        }

        // Create new patient flow
        const created = window.PatientStore.addPatient(patientData);
        closeModal();
        window.Ui.showToast(`Patient ${created.name} registered successfully!`, "success");

        // Open in workspace and run AI diagnosis
        window.Ui.renderPatientWorkspace(created);
        window.Ui.renderCohortTable();
        window.Ui.switchTab("tab-patient-analysis");
      });
    }
  }

  setupPatientWorkspaceEvents() {
    // Dropdown change
    const selector = document.getElementById("patientSelector");
    if (selector) {
      selector.addEventListener("change", (e) => {
        const id = e.target.value;
        this.selectPatientAndInspect(id);
      });
    }

    // Edit Patient button in the tab bar
    const btnEdit = document.getElementById("btnEditPatient");
    if (btnEdit) {
      btnEdit.addEventListener("click", () => {
        const active = window.PatientStore.getActivePatient();
        if (active) window.Ui.openEditPatientModal(active);
      });
    }

    // Audit History click opening box & popover toggle
    const btnAudit = document.getElementById("btnAuditToggle");
    const auditPopover = document.getElementById("auditHistoryPopover");
    const btnCloseAudit = document.getElementById("btnCloseAuditPopover");
    const auditBox = document.getElementById("auditHistoryBox");

    if (btnAudit && auditPopover) {
      btnAudit.addEventListener("click", (e) => {
        e.stopPropagation();
        const willShow = auditPopover.classList.contains("hidden");
        if (willShow) {
          const active = window.PatientStore.getActivePatient();
          if (active) window.Ui.renderAuditHistory(active);
          auditPopover.classList.remove("hidden");
        } else {
          auditPopover.classList.add("hidden");
        }
      });
    }

    if (btnCloseAudit && auditPopover) {
      btnCloseAudit.addEventListener("click", (e) => {
        e.stopPropagation();
        auditPopover.classList.add("hidden");
      });
    }

    // Dismiss audit popover when clicking anywhere outside
    document.addEventListener("click", (e) => {
      if (auditBox && !auditBox.contains(e.target) && auditPopover && !auditPopover.classList.contains("hidden")) {
        auditPopover.classList.add("hidden");
      }
    });

    // Export Clinical Report print button
    const btnPrint = document.getElementById("btnPrintReport");
    if (btnPrint) {
      btnPrint.addEventListener("click", async () => {
        const patient = window.PatientStore.getActivePatient();
        if (!patient) return;

        // If the AI clinical intelligence report hasn't been generated yet for this patient, generate it first
        if (!window.Ui.currentAiResults || window.Ui.currentAiResults.patientId !== patient.id) {
          window.Ui.showToast("Synthesizing full AI Clinical Intelligence for report export...", "info");
          await window.Ui.generateAiReportForActivePatient();
        }

        const risk = window.RiskEngine.calculateCompositeAcuity(patient);
        const ai = window.Ui.currentAiResults?.patientId === patient.id ? window.Ui.currentAiResults.data : null;
        window.ReportGenerator.printPatientReport(patient, risk, ai);
      });
    }

    // Re-evaluate CDS Analysis button
    const btnAiReport = document.getElementById("btnGenerateAiReport");
    if (btnAiReport) {
      btnAiReport.addEventListener("click", async () => {
        await window.Ui.generateAiReportForActivePatient();
      });
    }
  }

  setupCohortFilters() {
    const searchInput = document.getElementById("cohortSearchInput");
    const wardFilter = document.getElementById("filterWardSelect");
    const riskFilter = document.getElementById("filterRiskSelect");

    if (searchInput) searchInput.addEventListener("input", () => window.Ui.renderCohortTable());
    if (wardFilter) wardFilter.addEventListener("change", () => window.Ui.renderCohortTable());
    if (riskFilter) riskFilter.addEventListener("change", () => window.Ui.renderCohortTable());
  }

  selectPatientAndInspect(patientId) {
    window.PatientStore.setActivePatientId(patientId);
    const patient = window.PatientStore.getPatientById(patientId);
    if (patient) {
      window.Ui.renderPatientWorkspace(patient);
      window.Ui.switchTab("tab-patient-analysis");
    }
  }

  openEditPatientModal(patientId) {
    const patient = patientId ? window.PatientStore.getPatientById(patientId) : window.PatientStore.getActivePatient();
    if (patient) {
      window.Ui.openEditPatientModal(patient);
    }
  }

  deletePatient(patientId) {
    const p = window.PatientStore.getPatientById(patientId);
    if (!p) return;
    if (confirm(`Remove patient ${p.name} (${p.mrn}) from monitored cohort?`)) {
      window.PatientStore.deletePatient(patientId);
      window.Ui.renderCohortTable();
      const active = window.PatientStore.getActivePatient();
      if (active) window.Ui.renderPatientWorkspace(active);
      window.Ui.showToast(`Removed record for ${p.name}.`, "info");
    }
  }
}

// Global initialization on DOM ready
document.addEventListener("DOMContentLoaded", () => {
  window.App = new AegisApp();
});

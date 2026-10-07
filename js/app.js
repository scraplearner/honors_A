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
    const btnOpen = document.getElementById("btnNewPatient");
    const btnOpenFromCohort = document.getElementById("btnAddNewPatientFromCohort");
    const btnClose = document.getElementById("btnClosePatientModal");
    const btnCancel = document.getElementById("btnCancelPatientModal");
    const form = document.getElementById("newPatientForm");

    const openModal = () => {
      if (form) form.reset();
      if (modal) modal.classList.remove("hidden");
    };

    const closeModal = () => {
      if (modal) modal.classList.add("hidden");
    };

    if (btnOpen) btnOpen.addEventListener("click", openModal);
    if (btnOpenFromCohort) btnOpenFromCohort.addEventListener("click", openModal);
    if (btnClose) btnClose.addEventListener("click", closeModal);
    if (btnCancel) btnCancel.addEventListener("click", closeModal);

    if (form) {
      form.addEventListener("submit", (e) => {
        e.preventDefault();

        const historyVal = document.getElementById("formHistory").value.trim();
        const medsVal = document.getElementById("formMedications").value.trim();

        const newPatient = {
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
          notes: "Bedside initial intake documentation completed."
        };

        const created = window.PatientStore.addPatient(newPatient);
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

    // Export Clinical Report print button
    const btnPrint = document.getElementById("btnPrintReport");
    if (btnPrint) {
      btnPrint.addEventListener("click", () => {
        const patient = window.PatientStore.getActivePatient();
        const risk = window.RiskEngine.calculateCompositeAcuity(patient);
        const ai = window.Ui.currentAiResults?.patientId === patient.id ? window.Ui.currentAiResults.data : null;
        window.ReportGenerator.printPatientReport(patient, risk, ai);
      });
    }

    // Generate AI Prediction Report button (Sends patient data to API key and generates prediction)
    const btnAiReport = document.getElementById("btnGenerateAiReport");
    const btnAiReportCenter = document.getElementById("btnGenerateReportCenter");

    const handleGenerateReport = async () => {
      await window.Ui.generateAiReportForActivePatient();
    };

    if (btnAiReport) {
      btnAiReport.addEventListener("click", handleGenerateReport);
    }
    if (btnAiReportCenter) {
      btnAiReportCenter.addEventListener("click", handleGenerateReport);
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

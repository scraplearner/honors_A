/**
 * AegisHealth AI - Clinical Canvas Chart Renderers
 * Ultra-performant, zero-dependency charts with fixed responsive layout
 * Prevents recursive canvas expansion
 */

class ClinicalCharts {

  /**
   * Draw Semicircular Acuity Gauge (0 - 100)
   * Strictly fixed 280x160 logical dimensions to prevent layout growth
   */
  drawAcuityGauge(canvasId, score) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;

    // Read dimensions from canvas attribute or default
    const width = parseInt(canvas.getAttribute("width"), 10) || 240;
    const height = parseInt(canvas.getAttribute("height"), 10) || 130;

    // Set internal resolution scaled by dpr
    canvas.width = width * dpr;
    canvas.height = height * dpr;

    // Set fixed CSS style size to prevent layout growth
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";

    // Reset transform matrix before scaling
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, width, height);

    const centerX = width / 2;
    const centerY = height - 16;
    const radius = Math.min(width / 2 - 14, height - 24);
    const startAngle = Math.PI;
    const endAngle = 2 * Math.PI;
    const arcWidth = Math.max(9, Math.round(radius * 0.14));

    // Background Arc Track
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, startAngle, endAngle);
    ctx.lineWidth = arcWidth;
    ctx.strokeStyle = "#e2e8f0";
    ctx.lineCap = "round";
    ctx.stroke();

    // Colored Gradient Progress Arc based on score
    const clampedScore = Math.min(Math.max(score, 0), 100);
    const currentAngle = startAngle + (clampedScore / 100) * Math.PI;

    if (clampedScore > 0) {
      const gradient = ctx.createLinearGradient(centerX - radius, centerY, centerX + radius, centerY);
      gradient.addColorStop(0, "#059669");   // Emerald
      gradient.addColorStop(0.35, "#0d9488"); // Teal
      gradient.addColorStop(0.7, "#d97706");  // Amber
      gradient.addColorStop(1, "#e11d48");    // Rose / Critical

      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, startAngle, currentAngle);
      ctx.lineWidth = arcWidth;
      ctx.strokeStyle = gradient;
      ctx.lineCap = "round";
      ctx.stroke();
    }

    // Needle indicator
    const needleAngle = startAngle + (clampedScore / 100) * Math.PI;
    const needleLen = radius - 14;
    const needleX = centerX + Math.cos(needleAngle) * needleLen;
    const needleY = centerY + Math.sin(needleAngle) * needleLen;

    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(needleX, needleY);
    ctx.lineWidth = 3;
    ctx.strokeStyle = "#0f172a";
    ctx.stroke();

    // Center pivot knob
    ctx.beginPath();
    ctx.arc(centerX, centerY, 6, 0, 2 * Math.PI);
    ctx.fillStyle = "#0f172a";
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#fff";
    ctx.stroke();
  }

  /**
   * Draw 5-Axis Spider / Radar Chart for Organ System Stress Matrix
   * Strictly fixed 300x260 logical dimensions
   */
  drawOrganRadar(canvasId, organData) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;

    // Fixed logical dimensions
    const width = 300;
    const height = 260;

    canvas.width = width * dpr;
    canvas.height = height * dpr;

    canvas.style.width = width + "px";
    canvas.style.height = height + "px";

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, width, height);

    const centerX = width / 2;
    const centerY = height / 2 + 10;
    const radius = 80;

    const axes = [
      { name: "Cardiovascular", val: organData.cardiovascular || 20 },
      { name: "Pulmonary", val: organData.pulmonary || 20 },
      { name: "Renal", val: organData.renal || 20 },
      { name: "Metabolic", val: organData.metabolic || 20 },
      { name: "Inflammation", val: organData.inflammatory || 20 }
    ];

    const totalAxes = axes.length;
    const angleStep = (2 * Math.PI) / totalAxes;

    // Concentric web polygons
    const levels = [0.25, 0.5, 0.75, 1.0];
    levels.forEach(lvl => {
      ctx.beginPath();
      for (let i = 0; i < totalAxes; i++) {
        const angle = i * angleStep - Math.PI / 2;
        const x = centerX + Math.cos(angle) * (radius * lvl);
        const y = centerY + Math.sin(angle) * (radius * lvl);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.strokeStyle = "#e2e8f0";
      ctx.lineWidth = 1;
      ctx.stroke();
    });

    // Radial axis lines & labels
    ctx.font = "600 11px 'Plus Jakarta Sans', sans-serif";
    ctx.fillStyle = "#475569";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    for (let i = 0; i < totalAxes; i++) {
      const angle = i * angleStep - Math.PI / 2;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;

      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(x, y);
      ctx.strokeStyle = "#cbd5e1";
      ctx.stroke();

      const labelDist = radius + 22;
      const lx = centerX + Math.cos(angle) * labelDist;
      const ly = centerY + Math.sin(angle) * labelDist;
      ctx.fillText(axes[i].name, lx, ly);
    }

    // Stress Data Polygon
    ctx.beginPath();
    for (let i = 0; i < totalAxes; i++) {
      const angle = i * angleStep - Math.PI / 2;
      const ratio = Math.min(Math.max(axes[i].val / 100, 0.05), 1);
      const px = centerX + Math.cos(angle) * (radius * ratio);
      const py = centerY + Math.sin(angle) * (radius * ratio);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();

    // Fill polygon with soft glowing teal/emerald gradient
    const polyFill = ctx.createRadialGradient(centerX, centerY, 5, centerX, centerY, radius);
    polyFill.addColorStop(0, "rgba(13, 148, 136, 0.35)");
    polyFill.addColorStop(1, "rgba(5, 150, 105, 0.15)");
    ctx.fillStyle = polyFill;
    ctx.fill();

    ctx.strokeStyle = "#0d9488";
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Vertex point nodes
    for (let i = 0; i < totalAxes; i++) {
      const angle = i * angleStep - Math.PI / 2;
      const ratio = Math.min(Math.max(axes[i].val / 100, 0.05), 1);
      const px = centerX + Math.cos(angle) * (radius * ratio);
      const py = centerY + Math.sin(angle) * (radius * ratio);

      ctx.beginPath();
      ctx.arc(px, py, 4.5, 0, 2 * Math.PI);
      ctx.fillStyle = "#fff";
      ctx.fill();
      ctx.strokeStyle = "#0f766e";
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }
}

// Global instance
window.ChartEngine = new ClinicalCharts();

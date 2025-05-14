let weightChart;
let exerciseChart;

// — Bodyweight updater for charts page —
function updateBodyweight() {
  const raw = document.getElementById('bodyweightInput').value.trim();
  const w   = Number(raw);
  if (!w) return;

  // 1) Persist current bodyweight
  localStorage.setItem('bodyweight', w);

  // 2) Update the display on this page
  const disp = document.getElementById('bodyweightDisplay');
  if (disp) disp.textContent = `Current bodyweight: ${w} kg`;

  // 3) Append to the overall bodyweight log
  const log = JSON.parse(localStorage.getItem('weightLog') || '[]');
  log.push({ date: new Date().toLocaleDateString(), weight: w });
  localStorage.setItem('weightLog', JSON.stringify(log));

  // 4) Re-draw the bodyweight chart if there is one
  if (typeof renderWeightChart === 'function') renderWeightChart();
}

// 🌟 Renders the bodyweight over time chart
function renderWeightChart() {
  const log = JSON.parse(localStorage.getItem('weightLog') || '[]')
                .filter(e => e.weight > 0);
  const labels = log.map(e => e.date);
  const data   = log.map(e => e.weight);
  const ctx    = document.getElementById('weightChart')?.getContext('2d');
  if (!ctx) return;
  if (weightChart) weightChart.destroy();
  weightChart = new Chart(ctx, {
    type: 'line',
    data: { labels, datasets:[{
      label: 'Bodyweight (kg)',
      data, borderColor:'#00ffcc', backgroundColor:'#00ffcc22',
      tension:0.3, fill:true, pointRadius:4
    }]},
    options:{
      responsive:true,
      scales:{ y:{ ticks:{ color:'#f1f1f1'}, grid:{ color:'#333'} }, x:{ display:false } },
      plugins:{ legend:{ labels:{ color:'#f1f1f1'} } }
    }
  });
}

// — Populate exercise dropdown —
function populateExerciseDropdown() {
  const sel = document.getElementById('exerciseSelect');
  const seen = new Set();
  for (let i = 0; i < 100; i++) {
    const name = localStorage.getItem(`exname-${i}`);
    if (name && !seen.has(name)) {
      seen.add(name);
      sel.add(new Option(name, i));
    }
  }
}

// — Render a specific exercise’s history —
function renderExerciseChart(idx) {
  const key = `exercise-${idx}-history`;
  let log = JSON.parse(localStorage.getItem(key) || '[]')
              .filter(e => e.weight > 0);

  if (!log.length) {
    return alert('No weight recorded yet for this exercise.');
  }

  const labels = log.map(e => e.date);
  const data   = log.map(e => e.weight);
  const ctx    = document.getElementById('exerciseChart').getContext('2d');
  if (exerciseChart) exerciseChart.destroy();
  exerciseChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets:[{
        label: 'Weight (kg)',
        data, borderColor:'#ffcc00', backgroundColor:'#ffcc0022',
        tension:0.3, fill:true, pointRadius:4
      }]
    },
    options:{
      responsive:true,
      scales:{ y:{ ticks:{ color:'#f1f1f1'}, grid:{ color:'#333'} }, x:{ display:false } },
      plugins:{ legend:{ labels:{ color:'#f1f1f1'} } }
    }
  });
}

// — Sidebar toggle & clear button —
function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
}
document.getElementById('clearDataBtn').onclick = () => {
  if (confirm('⚠️ Are you sure you want to clear ALL data?')) {
    localStorage.clear();
    location.reload();
  }
};

// — Initialize on load —
window.onload = () => {
  // 1) Restore bodyweight input & display
  const bw = localStorage.getItem('bodyweight');
  if (bw) {
    document.getElementById('bodyweightInput').value = bw;
    document.getElementById('bodyweightDisplay').textContent = `Current bodyweight: ${bw} kg`;
  }

  // 2) Draw bodyweight chart
  renderWeightChart();

  // 3) Populate exercise dropdown & hook change
  populateExerciseDropdown();
  document.getElementById('exerciseSelect').onchange = e => {
    const idx = e.target.value;
    if (idx !== '') renderExerciseChart(idx);
  };
};
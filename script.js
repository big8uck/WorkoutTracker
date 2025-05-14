// Debounce utility (for any live inputs, if you had them)
function debounce(fn, delay = 400) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), delay);
  };
}

let weightChart, exerciseChart;

// — Bodyweight History Chart —
function renderWeightChart() {
  const log = (JSON.parse(localStorage.getItem('weightLog') || '[]'))
                .filter(e => e.weight > 0);
  const labels = log.map(e => e.date);
  const data   = log.map(e => e.weight);
  const ctx    = document.getElementById('weightChart')?.getContext('2d');
  if (!ctx) return;
  if (weightChart) weightChart.destroy();
  weightChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Bodyweight (kg)',
        data,
        borderColor: '#00ffcc',
        backgroundColor: '#00ffcc22',
        tension: 0.3,
        fill: true,
        pointRadius: 4
      }]
    },
    options: {
      responsive: true,
      scales: {
        y: { ticks: { color: '#f1f1f1' }, grid: { color: '#333' } },
        x: { display: false }
      },
      plugins: {
        legend: { labels: { color: '#f1f1f1' } }
      }
    }
  });
}

// — Populate exercise dropdown from stored names —
function populateExerciseDropdown() {
  const select = document.getElementById('exerciseSelect');
  const seen   = new Set();

  for (let i = 0; i < 100; i++) {
    const name = localStorage.getItem(`exname-${i}`);
    if (name && !seen.has(name)) {
      seen.add(name);
      const opt = document.createElement('option');
      opt.value   = i;
      opt.text    = name;
      select.appendChild(opt);
    }
  }
}

// — Render a specific exercise’s weight history —
function renderExerciseChart(index) {
  const key = `exercise-${index}-history`;
  let log   = JSON.parse(localStorage.getItem(key) || '[]')
                .filter(e => e && !isNaN(e.weight) && e.weight > 0);

  // Fall back to “current” if no history
  if (!log.length) {
    const cur = parseFloat(localStorage.getItem(`weight-${index}`));
    if (!isNaN(cur) && cur > 0) {
      log = [{ date: 'Today', weight: cur }];
    }
  }

  if (!log.length) {
    return alert('No weight recorded yet for this exercise.');
  }

  // Clean stored history
  localStorage.setItem(key, JSON.stringify(log));

  const labels = log.map(e => e.date);
  const data   = log.map(e => e.weight);
  const ctx    = document.getElementById('exerciseChart').getContext('2d');
  if (exerciseChart) exerciseChart.destroy();
  exerciseChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Weight (kg)',
        data,
        borderColor: '#ffcc00',
        backgroundColor: '#ffcc0022',
        tension: 0.3,
        fill: true,
        pointRadius: 4
      }]
    },
    options: {
      responsive: true,
      scales: {
        y: { ticks: { color: '#f1f1f1' }, grid: { color: '#333' } },
        x: { display: false }
      },
      plugins: {
        legend: { labels: { color: '#f1f1f1' } }
      }
    }
  });
}

// — Clear all data button —
document.getElementById('clearDataBtn').onclick = () => {
  if (confirm('⚠️ Are you sure you want to clear ALL data? This cannot be undone.')) {
    localStorage.clear();
    location.reload();
  }
};

// — Sidebar toggle —
function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
}

// — Initialize on load —
window.addEventListener('DOMContentLoaded', () => {
  // Restore bodyweight display
  const bw = localStorage.getItem('bodyweight');
  if (bw) {
    document.getElementById('bodyweightInput').value      = bw;
    document.getElementById('bodyweightDisplay').textContent = `Current bodyweight: ${bw} kg`;
  }

  // Render charts & dropdown
  renderWeightChart();
  populateExerciseDropdown();

  // Select → exercise chart
  document.getElementById('exerciseSelect').onchange = e => {
    if (e.target.value !== '') renderExerciseChart(e.target.value);
  };
});

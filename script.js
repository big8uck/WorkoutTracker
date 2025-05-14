// Debounce utility (for name inputs, still no history writes on typing)
function debounce(fn, delay = 400) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn.apply(this, args), delay);
  };
}

let editing = false;

// — UI Helpers —
function toggleDay(el) {
  el.classList.toggle('active');
  updateProgress();
}
function updateProgress() {
  const all = [...document.querySelectorAll('.workout-day input[type="checkbox"]')];
  const done = all.filter(cb => cb.checked).length;
  const bar  = document.getElementById('dayProgress');
  bar.max   = all.length;
  bar.value = done;
}
function toggleTheme() {
  document.body.classList.toggle('light-mode');
}
document.getElementById('scrollTopBtn').onclick = () =>
  window.scrollTo({ top: 0, behavior: 'smooth' });

// Live display of the “xx kg” text next to each input
function updateWeightDisplay(input) {
  const disp = input.nextElementSibling.querySelector('.weight-value');
  disp.textContent = input.value ? `${input.value.trim()} kg` : '—';
}

// Save overall bodyweight immediately
function updateBodyweight() {
  const raw = document.getElementById('bodyweightInput').value.trim();
  const w   = Number(raw);
  if (!w) return;
  localStorage.setItem('bodyweight', w);
  document.getElementById('bodyweightDisplay').textContent    = `Current bodyweight: ${w} kg`;
  document.getElementById('bodyweightDisplayTop').textContent = `Bodyweight: ${w} kg`;

  // Append to bodyweight history
  const log = JSON.parse(localStorage.getItem('weightLog') || '[]');
  log.push({ date: new Date().toLocaleDateString(), weight: w });
  localStorage.setItem('weightLog', JSON.stringify(log));

  if (typeof renderWeightChart === 'function') renderWeightChart();
}

// Enter/exit edit mode. **Only on exit** do we write history.
function toggleEdit() {
  editing = !editing;
  document.getElementById('editToggleBtn').textContent =
    editing ? '✅ Done' : '✏️ Edit';

  // Show/hide the weight inputs
  document.querySelectorAll('.weight-input')
    .forEach(i => i.classList.toggle('hidden', !editing));

  // Enable/disable name editing
  document.querySelectorAll('.exercise-name').forEach(span => {
    span.contentEditable   = editing;
    span.style.borderBottom = editing ? '1px dashed #00ffcc' : 'none';
  });

  // **When exiting** edit mode, save current weights & push to history
  if (!editing) {
    document.querySelectorAll('.weight-input').forEach((input, i) => {
      const raw = input.value.trim();
      const w   = parseFloat(raw);

      // Persist the “current” weight value
      localStorage.setItem(`weight-${i}`, raw);

      // Update its displayed “xx kg”
      updateWeightDisplay(input);

      // Only append to history if valid >0 and not duplicate
      if (!isNaN(w) && w > 0) {
        const key = `exercise-${i}-history`;
        const hist = JSON.parse(localStorage.getItem(key) || '[]');
        if (!hist.length || hist[hist.length - 1].weight !== w) {
          hist.push({ date: new Date().toLocaleDateString(), weight: w });
          localStorage.setItem(key, JSON.stringify(hist));
        }
      }
    });
  }
}

// Sidebar
function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
}

// Bodyweight chart (if present)
let weightChart;
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
      scales: { y: { ticks: { color: '#f1f1f1' }, grid: { color: '#333' } }, x: { display: false } },
      plugins:{ legend:{ labels:{ color:'#f1f1f1' } } }
    }
  });
}

// On page load: restore everything
window.onload = () => {
  // 1) Checkboxes
  document.querySelectorAll('.workout-day input[type="checkbox"]')
    .forEach((cb,i) => {
      cb.checked = localStorage.getItem(`cb-${i}`) === 'true';
      cb.addEventListener('change', () => {
        localStorage.setItem(`cb-${i}`, cb.checked);
        updateProgress();
        if (typeof renderWeightChart==='function') renderWeightChart();
      });
    });

  // 2) Weights: only load valid >0
  document.querySelectorAll('.weight-input').forEach((input,i) => {
    const saved = localStorage.getItem(`weight-${i}`);
    input.value = (saved && !isNaN(saved) && Number(saved)>0) ? saved : '';
    updateWeightDisplay(input);
    // live display (debounced)
    input.addEventListener('input', debounce(()=>updateWeightDisplay(input)));
  });

  // 3) Names: live‐edit saved debounced
  document.querySelectorAll('.exercise-name').forEach((span,i) => {
    const saved = localStorage.getItem(`exname-${i}`);
    if (saved) span.textContent = saved;
    span.addEventListener('input', debounce(() => {
      localStorage.setItem(`exname-${i}`, span.textContent.trim());
    }, 400));
  });

  // 4) Bodyweight restore
  const bw = localStorage.getItem('bodyweight');
  if (bw) {
    document.getElementById('bodyweightInput').value         = bw;
    document.getElementById('bodyweightDisplay').textContent    = `Current bodyweight: ${bw} kg`;
    document.getElementById('bodyweightDisplayTop').textContent = `Bodyweight: ${bw} kg`;
  }

  // 5) Progress bar + chart
  updateProgress();
  if (typeof renderWeightChart === 'function') renderWeightChart();
};

// Sync bodyweight into the top‐bar whenever index.html loads
window.addEventListener('DOMContentLoaded', () => {
  const bw = localStorage.getItem('bodyweight');
  if (bw) {
    const top = document.getElementById('bodyweightDisplayTop');
    if (top) top.textContent = `Bodyweight: ${bw} kg`;
  }
});

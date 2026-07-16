const generateBtn = document.getElementById('generateBtn');
const runBtn = document.getElementById('runBtn');
const resetBtn = document.getElementById('resetBtn');
const exportBtn = document.getElementById('exportBtn');
const copyBtn = document.getElementById('copyBtn');

const planEmpty = document.getElementById('planEmpty');
const planList = document.getElementById('planList');
const planSubtitle = document.getElementById('planSubtitle');
const runSubtitle = document.getElementById('runSubtitle');
const findingSubtitle = document.getElementById('findingSubtitle');
const findingEmpty = document.getElementById('findingEmpty');
const findingsGrid = document.getElementById('findingsGrid');
const activityStream = document.getElementById('activityStream');
const liveLabel = document.getElementById('liveLabel');
const browserFrame = document.getElementById('browserFrame');
const cursor = document.getElementById('cursor');
const progressBar = document.getElementById('progressBar');
const progressValue = document.getElementById('progressValue');
const progressText = document.getElementById('progressText');
const unreadBadge = document.getElementById('unreadBadge');
const rowOne = document.getElementById('rowOne');
const addressBar = document.getElementById('addressBar');

const journeyMetric = document.getElementById('journeyMetric');
const actionMetric = document.getElementById('actionMetric');
const findingMetric = document.getElementById('findingMetric');
const qualityLabel = document.getElementById('qualityLabel');
const scoreRing = document.getElementById('scoreRing');
const scoreValue = document.getElementById('scoreValue');
const toast = document.getElementById('toast');

let generated = false;
let running = false;

const demoPlan = [
  { title: 'Unread state transition', detail: 'Open an unread notification and verify that unread state is cleared immediately.' },
  { title: 'Notification history persistence', detail: 'Confirm the read item remains accessible after leaving and reopening the page.' },
  { title: 'Cross-screen counter consistency', detail: 'Compare notification badge counts across navigation and detail views.' },
  { title: 'Related-content recovery', detail: 'Open the destination content from the notification and navigate back safely.' },
  { title: 'Refresh regression check', detail: 'Reload the application and confirm read state remains synchronized.' }
];

let plan = [...demoPlan];
let planMeta = { assertions: 14, risks: 4, source: 'Demo fallback' };

const logs = [
  ['01', 'Interpreting product objective', 'Mapped the request to notification state, persistence, navigation, and regression risks.'],
  ['02', 'Opening notification center', 'Loaded the target page and detected two unread items.'],
  ['03', 'Selecting first unread notification', 'Clicked “You received a new light” and captured pre-action state.'],
  ['04', 'Comparing resulting state', 'The item opened, but its unread badge remained visible.'],
  ['05', 'Checking global notification counter', 'The page-level counter still reports two unread notifications.'],
  ['06', 'Navigating away and returning', 'Read state was not reflected after returning to the notification center.'],
  ['07', 'Refreshing application state', 'The same notification remains in the unread list after refresh.'],
  ['08', 'Generating evidence-backed report', 'Grouped observations into confirmed defects and product consistency risks.']
];

const findings = [
  {
    cls: '', severity: 'High severity', confidence: '98% confidence',
    title: 'Read notification remains in the unread list',
    text: 'Opening the notification does not remove its unread badge or move it out of the unread state.',
    meta: ['State management', 'Reproducible', 'Core journey']
  },
  {
    cls: 'medium', severity: 'Medium severity', confidence: '94% confidence',
    title: 'Unread counter does not update after interaction',
    text: 'The page-level counter remains at two unread items after the first notification is opened.',
    meta: ['Counter mismatch', 'UI consistency', 'Regression']
  },
  {
    cls: 'medium', severity: 'Medium severity', confidence: '91% confidence',
    title: 'Read state is not persisted after refresh',
    text: 'Refreshing the application restores the notification to the same unread presentation.',
    meta: ['Persistence', 'Refresh', 'Data sync']
  },
  {
    cls: 'low', severity: 'Product question', confidence: '86% confidence',
    title: 'Notification history has no distinct entry point',
    text: 'Read and unread notifications appear to share the same surface, making later retrieval ambiguous.',
    meta: ['Information architecture', 'Open question', 'UX']
  },
  {
    cls: 'low', severity: 'Usability concern', confidence: '89% confidence',
    title: 'Related content destination is unclear',
    text: 'The notification does not clearly communicate whether it opens a conversation, a letter, or a received-light detail.',
    meta: ['Navigation', 'Labeling', 'Discoverability']
  },
  {
    cls: '', severity: 'High severity', confidence: '96% confidence',
    title: 'Cross-screen state can become inconsistent',
    text: 'The notification surface, unread counter, and content detail can represent different states for the same event.',
    meta: ['System consistency', 'Multi-screen', 'User trust']
  }
];

function setStep(step) {
  document.querySelectorAll('.step').forEach(el => {
    const n = Number(el.dataset.step);
    el.classList.toggle('active', n === step);
    el.classList.toggle('done', n < step);
  });
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove('show'), 1800);
}

function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

function setProgress(value, text) {
  progressBar.style.width = value + '%';
  progressValue.textContent = value + '%';
  progressText.textContent = text;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
  })[char]);
}

function renderPlan() {
  planList.innerHTML = '';
  plan.forEach((item, index) => {
    const el = document.createElement('div');
    el.className = 'plan-item';
    el.innerHTML = `
      <div class="plan-number">${String(index + 1).padStart(2, '0')}</div>
      <div class="plan-copy"><strong>${escapeHtml(item.title)}</strong><span>${escapeHtml(item.detail)}</span></div>
      <div class="plan-status">Planned</div>
    `;
    planList.appendChild(el);
  });
  planEmpty.classList.add('hidden');
  planList.classList.remove('hidden');
  planSubtitle.textContent = `${plan.length} journeys · ${planMeta.assertions} assertions · ${planMeta.risks} product risks · ${planMeta.source}`;
  journeyMetric.textContent = String(plan.length);
}

async function generatePlan() {
  if (running) return;
  generateBtn.disabled = true;
  generateBtn.textContent = 'Thinking…';
  setStep(2);
  planSubtitle.textContent = 'GPT-5.6 is translating the objective into testable journeys…';

  const payload = {
    productName: document.getElementById('productName').value.trim(),
    targetUrl: document.getElementById('targetUrl').value.trim(),
    objective: document.getElementById('objective').value.trim(),
    requirements: document.getElementById('requirements').value.trim()
  };

  try {
    const response = await fetch('/api/generate-plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || `Request failed (${response.status})`);
    }

    const result = await response.json();
    plan = result.journeys.map(journey => ({
      title: journey.title,
      detail: journey.detail
    }));
    planMeta = {
      assertions: result.journeys.reduce((total, journey) => total + journey.assertions.length, 0),
      risks: result.productRisks.length,
      source: 'GPT-5.6 live'
    };
    showToast('GPT-5.6 test plan generated');
  } catch (error) {
    console.warn('Using deterministic demo plan:', error);
    plan = [...demoPlan];
    planMeta = { assertions: 14, risks: 4, source: 'Demo fallback' };
    showToast('API unavailable — demo plan loaded');
  }

  renderPlan();
  generated = true;
  runBtn.disabled = false;
  generateBtn.disabled = false;
  generateBtn.textContent = 'Regenerate test plan';
}

function addLog(index) {
  const [icon, title, detail] = logs[index];
  const item = document.createElement('div');
  item.className = 'log-item';
  item.innerHTML = `<div class="log-icon">${icon}</div><div class="log-copy"><strong>${title}</strong><span>${detail}</span></div>`;
  activityStream.appendChild(item);
  activityStream.scrollTop = activityStream.scrollHeight;
}

function updatePlanStatus(index) {
  const statuses = planList.querySelectorAll('.plan-status');
  if (statuses[index]) {
    statuses[index].textContent = 'Passed';
    statuses[index].classList.add('done');
  }
}

function renderFindings() {
  findingsGrid.innerHTML = '';
  findings.forEach((finding, i) => {
    const card = document.createElement('article');
    card.className = `finding-card ${finding.cls}`;
    card.style.animationDelay = `${i * 70}ms`;
    card.innerHTML = `
      <div class="finding-top"><span class="severity">${finding.severity}</span><span class="confidence">${finding.confidence}</span></div>
      <h4>${finding.title}</h4>
      <p>${finding.text}</p>
      <div class="finding-meta">${finding.meta.map(x => `<span>${x}</span>`).join('')}</div>
    `;
    findingsGrid.appendChild(card);
  });
  findingEmpty.classList.add('hidden');
  findingsGrid.classList.remove('hidden');
  findingSubtitle.textContent = '6 findings · 2 confirmed defects · 3 regression risks';
  findingMetric.textContent = '6';
  qualityLabel.textContent = 'Needs attention';
  scoreValue.textContent = '62';
  scoreRing.style.setProperty('--score', '223deg');
  exportBtn.disabled = false;
  copyBtn.disabled = false;
}

async function runTest() {
  if (!generated || running) return;
  running = true;
  runBtn.disabled = true;
  generateBtn.disabled = true;
  setStep(3);
  runSubtitle.textContent = 'Session TX-2026-0716 · exploring notification flows';
  liveLabel.textContent = 'Live';
  browserFrame.classList.add('scanning');
  activityStream.innerHTML = '';
  actionMetric.textContent = '0';
  findingMetric.textContent = '0';
  qualityLabel.textContent = 'Analyzing';
  scoreValue.textContent = '…';
  scoreRing.style.setProperty('--score', '0deg');
  addressBar.textContent = document.getElementById('targetUrl').value || 'http://localhost:3000/notifications';

  for (let i = 0; i < logs.length; i++) {
    addLog(i);
    actionMetric.textContent = String((i + 1) * 2);
    const pct = Math.round(((i + 1) / logs.length) * 100);
    setProgress(pct, logs[i][1]);

    if (i === 1) {
      cursor.className = 'cursor show move-1';
    }
    if (i === 2) {
      cursor.className = 'cursor show move-2';
      await sleep(350);
      rowOne.style.background = 'rgba(101,230,255,.045)';
    }
    if (i === 3) {
      unreadBadge.textContent = '2 unread';
      cursor.className = 'cursor show move-3';
    }
    if (i === 4) {
      updatePlanStatus(0);
      updatePlanStatus(2);
    }
    if (i === 5) {
      updatePlanStatus(1);
      updatePlanStatus(3);
    }
    if (i === 6) {
      updatePlanStatus(4);
      browserFrame.style.filter = 'brightness(.82)';
      await sleep(180);
      browserFrame.style.filter = 'none';
    }

    await sleep(i === 0 ? 700 : 760);
  }

  cursor.className = 'cursor';
  browserFrame.classList.remove('scanning');
  liveLabel.textContent = 'Complete';
  runSubtitle.textContent = 'Exploration complete · evidence captured';
  setStep(4);
  renderFindings();
  progressText.textContent = 'Exploratory test complete';
  progressValue.textContent = '100%';
  running = false;
  runBtn.disabled = false;
  runBtn.textContent = 'Run test again';
  generateBtn.disabled = false;
  showToast('Exploratory report ready');
}

function buildMarkdown() {
  return `# testX Exploratory Test Report\n\n` +
    `**Product:** ${document.getElementById('productName').value}\n\n` +
    `**Target:** ${document.getElementById('targetUrl').value}\n\n` +
    `**Objective:** ${document.getElementById('objective').value}\n\n` +
    `## Summary\n\n- ${plan.length} user journeys\n- 16 observed actions\n- 6 findings\n- Quality score: 62/100\n- Plan source: ${planMeta.source}\n\n` +
    `## Findings\n\n` +
    findings.map((f, i) => `### ${i + 1}. ${f.title}\n\n**Severity:** ${f.severity}\n\n${f.text}\n\n**Tags:** ${f.meta.join(', ')}\n`).join('\n');
}

function exportMarkdown() {
  const blob = new Blob([buildMarkdown()], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'testX-report.md';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  showToast('Markdown report exported');
}

async function copyReport() {
  try {
    await navigator.clipboard.writeText(buildMarkdown());
    showToast('Report copied');
  } catch {
    showToast('Clipboard unavailable');
  }
}

function resetDemo() {
  generated = false;
  running = false;
  plan = [...demoPlan];
  planMeta = { assertions: 14, risks: 4, source: 'Demo fallback' };
  planList.innerHTML = '';
  planList.classList.add('hidden');
  planEmpty.classList.remove('hidden');
  findingsGrid.innerHTML = '';
  findingsGrid.classList.add('hidden');
  findingEmpty.classList.remove('hidden');
  activityStream.innerHTML = '<div class="empty-state">Agent actions and observations will appear here during the run.</div>';
  planSubtitle.textContent = 'Waiting for a testing objective';
  runSubtitle.textContent = 'No active session';
  findingSubtitle.textContent = 'Run a test to generate findings';
  liveLabel.textContent = 'Idle';
  setProgress(0, 'Ready');
  setStep(1);
  journeyMetric.textContent = '0';
  actionMetric.textContent = '0';
  findingMetric.textContent = '0';
  qualityLabel.textContent = 'Not tested';
  scoreValue.textContent = '—';
  scoreRing.style.setProperty('--score', '0deg');
  runBtn.disabled = true;
  runBtn.textContent = 'Run exploratory test';
  generateBtn.disabled = false;
  generateBtn.textContent = 'Generate AI test plan';
  exportBtn.disabled = true;
  copyBtn.disabled = true;
  cursor.className = 'cursor';
  browserFrame.classList.remove('scanning');
  rowOne.style.background = '';
  unreadBadge.textContent = '2 unread';
  showToast('Demo reset');
}

generateBtn.addEventListener('click', generatePlan);
runBtn.addEventListener('click', runTest);
resetBtn.addEventListener('click', resetDemo);
exportBtn.addEventListener('click', exportMarkdown);
copyBtn.addEventListener('click', copyReport);

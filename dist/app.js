const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

const promptInput = $('#prompt');
const promptCount = $('#promptCount');
const toast = $('#toast');
let timer;

function showToast(message, type = '') {
  toast.textContent = message;
  toast.className = `toast show ${type}`;
  clearTimeout(timer);
  timer = setTimeout(() => toast.className = 'toast', 2400);
}

promptInput.addEventListener('input', () => {
  promptCount.textContent = `${promptInput.value.length} / 500`;
});
promptCount.textContent = `${promptInput.value.length} / 500`;

$$('.style-card').forEach((button) => button.addEventListener('click', () => {
  $$('.style-card').forEach((item) => {
    item.classList.remove('active');
    item.setAttribute('aria-checked', 'false');
  });
  button.classList.add('active');
  button.setAttribute('aria-checked', 'true');
  showToast(`已選擇「${button.dataset.style}」風格`);
}));

$$('.segmented').forEach((group) => {
  group.querySelectorAll('button').forEach((button) => button.addEventListener('click', () => {
    group.querySelectorAll('button').forEach((item) => item.classList.remove('active'));
    button.classList.add('active');
  }));
});

$('#motion').addEventListener('input', (event) => {
  const value = Number(event.target.value);
  $('#motionValue').textContent = value < 34 ? '平穩' : value < 72 ? '自然' : '強烈';
});

$$('.shot-card[data-shot]').forEach((card) => card.addEventListener('click', () => {
  $$('.shot-card').forEach((item) => item.classList.remove('active'));
  card.classList.add('active');
  $('#shotTitle').textContent = card.dataset.shot;
}));

let playing = false;
let playbackTimer;
let elapsed = 0;
function togglePlayback() {
  playing = !playing;
  $('#stage').classList.toggle('playing', playing);
  $('#playButton').innerHTML = playing ? '<span>❚❚</span>' : '<span>▶</span>';
  $('#miniPlay').textContent = playing ? '❚❚' : '▶';
  clearInterval(playbackTimer);
  if (!playing) return;
  playbackTimer = setInterval(() => {
    elapsed = (elapsed + .1) % 10;
    $('#currentTime').textContent = `00:${String(Math.floor(elapsed)).padStart(2, '0')}`;
    $('#scrubProgress').style.width = `${elapsed * 10}%`;
    $('.scrubber button').style.left = `${elapsed * 10}%`;
  }, 100);
}
$('#playButton').addEventListener('click', togglePlayback);
$('#miniPlay').addEventListener('click', togglePlayback);

$('#generateButton').addEventListener('click', () => {
  if (!promptInput.value.trim()) return showToast('請先輸入動畫描述', 'error');
  const button = $('#generateButton');
  button.classList.add('loading');
  button.innerHTML = '<span>◌</span><b>正在建立分鏡…</b><small>約 8 秒</small>';
  $('#statusText').textContent = '生成中';
  setTimeout(() => {
    button.classList.remove('loading');
    button.innerHTML = '<span>✦</span><b>重新生成</b><small>約 120 點數</small>';
    $('#statusText').textContent = '預覽已更新';
    $('#stage').classList.add('playing');
    setTimeout(() => $('#stage').classList.remove('playing'), 4800);
    showToast('動畫預覽已生成，可逐鏡調整');
  }, 1700);
});

$('.spark-button').addEventListener('click', () => {
  if (!promptInput.value.includes('電影感運鏡')) promptInput.value += ' 加入電影感運鏡、雨水反光與細緻環境動態。';
  promptCount.textContent = `${promptInput.value.length} / 500`;
  showToast('已補充鏡頭與光影細節');
});

$('#exportButton').addEventListener('click', () => showToast('已加入匯出佇列：1080p MP4'));
$('.add-shot').addEventListener('click', () => showToast('新鏡頭已加入序列'));
$('.add-card').addEventListener('click', () => showToast('新鏡頭已加入序列'));

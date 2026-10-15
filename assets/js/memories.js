// Memories Scrapbook Grid Logic

const rot = ['r1', 'r2', 'r3', 'r4', 'r5', 'r6', 'r7'];
const dims = {
  'size-lg': [700, 560],
  'size-wide': [700, 340],
  'size-md': [520, 600],
  'size-sm': [420, 420],
  'size-tall': [420, 680]
};

let memoriesData = [];

async function initMemories() {
  const dbMemories = await fetchData('/data/memories.json') || [];
  const customMemories = JSON.parse(localStorage.getItem('uploaded_memories') || '[]');
  
  // Combine native data with custom uploaded memories
  memoriesData = [...customMemories, ...dbMemories];

  renderMemories('all');
  setupChips();
}

function renderMemories(filter) {
  const el = document.getElementById('scrapbook');
  if (!el) return;
  el.innerHTML = '';

  const filtered = memoriesData.filter(m => filter === 'all' || m.cat === filter);
  
  if (filtered.length === 0) {
    el.innerHTML = '<div style="grid-column: span 6; text-align: center; padding: 60px 20px; color: var(--ink-soft); font-family: \'Caveat\', cursive; font-size: 24px;">No memories in this scrapbook category yet.</div>';
    return;
  }

  filtered.forEach((m, i) => {
    const sizeClass = m.size || 'size-md';
    const [w, h] = dims[sizeClass] || [520, 600];
    const div = document.createElement('div');
    div.className = 'memcard ' + sizeClass + ' ' + rot[i % rot.length] + (m.stack ? ' stack' : '');
    div.onclick = () => {
      window.location.href = `/memory-details.html?id=${m.id}`;
    };

    const fastener = m.fastener === 'pin'
      ? '<div class="pin"></div>'
      : '<div class="tape ' + (m.tape ? m.tape[0] : 'c-plain') + ' ' + (m.tape ? m.tape[1] : 'pos-c') + '"></div>';
    
    const badge = m.featured ? '<div class="featured-tag">Featured</div>' : '';
    
    const isExternal = m.cover.startsWith('http') || m.cover.startsWith('data:');
    const imgSrc = isExternal ? m.cover : `https://picsum.photos/seed/${m.cover}/${w}/${h}`;

    div.innerHTML = badge + fastener +
      `<div class="frame">
        <img src="${imgSrc}" alt="${m.cap}">
        <div class="viewHint">View gallery →</div>
       </div>
       <div class="cap">${m.cap}<span class="date">${m.date}</span></div>`;
    el.appendChild(div);
  });
}

function setupChips() {
  const chipsEl = document.getElementById('chips');
  if (!chipsEl) return;

  chipsEl.addEventListener('click', e => {
    if (e.target.classList.contains('chip')) {
      document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
      e.target.classList.add('active');
      renderMemories(e.target.dataset.cat);
    }
  });
}

document.addEventListener('DOMContentLoaded', initMemories);
window.initMemories = initMemories;
window.renderMemories = renderMemories;

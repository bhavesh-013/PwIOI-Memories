// Achievements Hall of Fame Logic

let achievementGroups = [];
let allAchievements = [];
let currentAchievement = null;

async function initAchievements() {
  achievementGroups = await fetchData('/data/achievements.json') || [];
  
  // Load additional dynamic achievements from localStorage if any
  const customAch = JSON.parse(localStorage.getItem('uploaded_achievements') || '[]');
  if (customAch.length > 0) {
    let customGroup = achievementGroups.find(g => g.name === 'Recent Achievements');
    if (!customGroup) {
      customGroup = { name: 'Recent Achievements', relatedMemoryId: null, items: [] };
      achievementGroups.unshift(customGroup);
    }
    customGroup.items.unshift(...customAch);
  }

  allAchievements = achievementGroups.flatMap(g => g.items.map(it => ({ ...it, eventName: g.name, relatedMemoryId: g.relatedMemoryId })));
  
  renderEvents();
}

function renderEvents() {
  const el = document.getElementById('events');
  if (!el) return;
  el.innerHTML = '';

  achievementGroups.forEach(ev => {
    if (ev.items.length === 0) return;
    
    const group = document.createElement('div');
    group.className = 'eventgroup';
    
    const cards = ev.items.map(it => {
      const isExternalSeed = it.seed.startsWith('http') || it.seed.startsWith('data:');
      const photoSrc = isExternalSeed ? it.seed : `https://picsum.photos/seed/${it.seed}/160/160`;
      
      return `<div class="achcard" onclick="window.location.href='/achievement-details.html?id=${it.id}'">
        <img class="photo" src="${photoSrc}" alt="${it.name}">
        <div class="badge">🏅</div>
        <h4>${it.name}</h4>
        <div class="role">${it.role} · ${it.year}</div>
        <div class="award">${it.award}</div>
        <div class="meta">${it.college}</div>
        <div class="viewStory">Read the story →</div>
      </div>`;
    }).join('');
    
    group.innerHTML = `<h3>${ev.name}</h3><div class="achgrid">${cards}</div>`;
    el.appendChild(group);
  });
}

async function initAchievementDetails() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  if (!id) {
    window.location.href = '/achievements.html';
    return;
  }

  const groups = await fetchData('/data/achievements.json') || [];
  const customAch = JSON.parse(localStorage.getItem('uploaded_achievements') || '[]');
  
  const allAch = [
    ...groups.flatMap(g => g.items.map(it => ({ ...it, eventName: g.name, relatedMemoryId: g.relatedMemoryId }))),
    ...customAch.map(it => ({ ...it, eventName: 'Recent Achievements', relatedMemoryId: null }))
  ];

  const it = allAch.find(x => x.id === id);
  currentAchievement = it;
  if (!it) {
    const adBody = document.querySelector('.adBody');
    if (adBody) {
      adBody.innerHTML = '<h2>Achievement not found</h2><a href="/achievements.html">← Back to achievements</a>';
    }
    return;
  }

  const adPhoto = document.getElementById('adPhoto');
  if (adPhoto) {
    const isExternalSeed = it.seed.startsWith('http') || it.seed.startsWith('data:');
    adPhoto.src = isExternalSeed ? it.seed : `https://picsum.photos/seed/${it.seed}/240/240`;
  }

  const adName = document.getElementById('adName');
  if (adName) adName.textContent = it.name;

  const adRole = document.getElementById('adRole');
  if (adRole) adRole.textContent = `${it.role} · ${it.year}`;

  const adAward = document.getElementById('adAward');
  if (adAward) adAward.textContent = it.award;

  const adMeta = document.getElementById('adMeta');
  if (adMeta) adMeta.textContent = `${it.eventName}  ·  ${it.college}`;

  const adStory = document.getElementById('adStory');
  if (adStory) adStory.textContent = it.story;

  const adQuote = document.getElementById('adQuote');
  if (adQuote) adQuote.textContent = `"${it.quote}"`;

  const adQuoteBy = document.getElementById('adQuoteBy');
  if (adQuoteBy) adQuoteBy.textContent = `— ${it.name}`;

  const adGallery = document.getElementById('adGallery');
  if (adGallery && it.gallery) {
    adGallery.innerHTML = it.gallery.map((seed, idx) => {
      const isExternalGallerySeed = seed.startsWith('http') || seed.startsWith('data:');
      const src = isExternalGallerySeed ? seed : `https://picsum.photos/seed/${seed}/400/300`;
      return `<img src="${src}" alt="${it.name}" onclick="triggerAchievementLightbox(${idx})" style="cursor: pointer;">`;
    }).join('');
  }

  const ctaText = document.getElementById('adCTAtext');
  const ctaBtn = document.getElementById('adCTAbtn');
  if (ctaText && ctaBtn) {
    if (it.relatedMemoryId) {
      ctaText.textContent = `This achievement started at ${it.eventName}. See the event that made it happen.`;
      ctaBtn.textContent = `Explore ${it.eventName}`;
      ctaBtn.onclick = () => {
        window.location.href = `/memory-details.html?id=${it.relatedMemoryId}`;
      };
    } else {
      ctaText.textContent = 'Inspired to build your own story?';
      ctaBtn.textContent = 'See more achievements';
      ctaBtn.onclick = () => {
        window.location.href = '/achievements.html';
      };
    }
  }
}

function triggerAchievementLightbox(idx) {
  const it = currentAchievement;
  if (!it || !it.gallery) return;
  const imagesList = it.gallery.map((seed, i) => {
    const isExternalGallerySeed = seed.startsWith('http') || seed.startsWith('data:');
    const src = isExternalGallerySeed ? seed : `https://picsum.photos/seed/${seed}/1200/900`;
    return {
      src: src,
      caption: `${it.name} — ${it.award} (${i + 1}/${it.gallery.length})`
    };
  });
  openLightbox(imagesList, idx);
}

window.triggerAchievementLightbox = triggerAchievementLightbox;

// Check page context
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('events')) {
    initAchievements();
  } else if (document.getElementById('adName')) {
    initAchievementDetails();
  }
});

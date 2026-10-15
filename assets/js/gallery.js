// Memory Gallery Details Rendering

let currentMemory = null;

async function initMemoryDetails() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');

  if (!id) {
    window.location.href = '/memories.html';
    return;
  }

  const dbMemories = await fetchData('/data/memories.json') || [];
  const customMemories = JSON.parse(localStorage.getItem('uploaded_memories') || '[]');
  const allMemories = [...customMemories, ...dbMemories];

  currentMemory = allMemories.find(x => x.id === id);

  if (!currentMemory) {
    const detailBody = document.querySelector('.detailBody');
    if (detailBody) {
      detailBody.innerHTML = '<h2>Memory not found</h2><a href="/memories.html">← Back to scrapbook</a>';
    }
    return;
  }

  // Register in Recently Viewed memories list
  if (window.addRecentMemory) {
    window.addRecentMemory(currentMemory);
  }

  renderMemoryDetails();
}

function renderMemoryDetails() {
  const m = currentMemory;
  const isExternalCover = m.cover.startsWith('http') || m.cover.startsWith('data:');
  const coverSrc = isExternalCover ? m.cover : `https://picsum.photos/seed/${m.cover}/1400/900`;

  const heroBg = document.getElementById('detailHeroBg');
  if (heroBg) {
    heroBg.style.backgroundImage = `url('${coverSrc}')`;
  }

  const detailCat = document.getElementById('detailCat');
  if (detailCat) detailCat.textContent = m.cat;

  const detailTitle = document.getElementById('detailTitle');
  if (detailTitle) detailTitle.textContent = m.cap;

  const detailMeta = document.getElementById('detailMeta');
  if (detailMeta) detailMeta.textContent = `${m.date}  ·  ${m.location || 'PWIOI Campus'}`;

  const detailStory = document.getElementById('detailStory');
  if (detailStory) detailStory.textContent = m.story;

  // Editorial Gallery
  const gdims = { 'g-lg': [760, 600], 'g-wide': [760, 360], 'g-sm': [480, 420], 'g-tall': [480, 700] };
  const editorialGallery = document.getElementById('editorialGallery');
  
  if (editorialGallery && m.gallery) {
    editorialGallery.innerHTML = m.gallery.map((g, idx) => {
      const sizeClass = g.size || 'g-sm';
      const [w, h] = gdims[sizeClass] || [480, 420];
      const isExternalSeed = g.seed.startsWith('http') || g.seed.startsWith('data:');
      const src = isExternalSeed ? g.seed : `https://picsum.photos/seed/${g.seed}/${w}/${h}`;
      const isFav = isPhotoSpecial(g.seed);
      return `<div class="galleryTile ${sizeClass}" onclick="triggerMemoryLightbox(${idx})">
        <img src="${src}" alt="${m.cap}" style="cursor: pointer;">
        <button class="tileSpecialBtn ${isFav ? 'active' : ''}" onclick="togglePhotoSpecial(event, '${g.seed}', '${m.id}', \`${m.cap.replace(/'/g, "\\'")}\`, \`${(g.caption || m.cap).replace(/'/g, "\\'")}\`)" title="Add to Special">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
          </svg>
        </button>
        <button class="tileDownload" onclick="event.stopPropagation(); downloadUrl('${src}','${m.cap}')" title="Download">⬇</button>
      </div>`;
    }).join('');
  }

  // Videos
  const videoGrid = document.getElementById('videoGrid');
  if (videoGrid) {
    if (m.videos && m.videos.length > 0) {
      videoGrid.innerHTML = m.videos.map((v, i) => {
        const isExternalV = v.startsWith('http');
        const thumb = isExternalV ? 'https://picsum.photos/seed/video/640/360' : `https://picsum.photos/seed/${v}/640/360`;
        const isFav = isVideoSpecial(v);
        const clipLabel = `${m.cap} — Clip ${i + 1}`;
        return `<div class="videoCard" style="background-image:url('${thumb}')" onclick="triggerVideoLightbox(${i})">
          <button class="videoSpecialBtn ${isFav ? 'active' : ''}" onclick="toggleVideoSpecial(event, '${v}', '${m.id}', \`${m.cap.replace(/'/g, "\\'")}\`, \`${clipLabel.replace(/'/g, "\\'")}\`)" title="Add to Special">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
            </svg>
          </button>
          <div class="playBtn">▶</div>
          <div class="videoLabel">${clipLabel}</div>
        </div>`;
      }).join('');
    } else {
      const videoSection = document.querySelector('.videoSection');
      if (videoSection) videoSection.style.display = 'none';
    }
  }
}

function isPhotoSpecial(seed) {
  const specials = JSON.parse(localStorage.getItem('special_photos') || '[]');
  return specials.some(x => x.seed === seed);
}

function isVideoSpecial(videoSrc) {
  const specials = JSON.parse(localStorage.getItem('special_videos') || '[]');
  return specials.some(x => x.src === videoSrc);
}

function togglePhotoSpecial(event, seed, memoryId, memoryTitle, caption) {
  event.stopPropagation();
  let specials = JSON.parse(localStorage.getItem('special_photos') || '[]');
  const idx = specials.findIndex(x => x.seed === seed);
  
  if (idx > -1) {
    specials.splice(idx, 1);
    showToast("Removed photo from Special moments!");
  } else {
    specials.push({ seed, memoryId, memoryTitle, caption });
    showToast("Added photo to Special moments!");
  }
  
  localStorage.setItem('special_photos', JSON.stringify(specials));
  
  const btn = event.currentTarget;
  if (btn) {
    btn.classList.toggle('active');
  }
}

function toggleVideoSpecial(event, videoSrc, memoryId, memoryTitle, caption) {
  event.stopPropagation();
  let specials = JSON.parse(localStorage.getItem('special_videos') || '[]');
  const idx = specials.findIndex(x => x.src === videoSrc);
  
  if (idx > -1) {
    specials.splice(idx, 1);
    showToast("Removed video from Special moments!");
  } else {
    specials.push({ src: videoSrc, memoryId, memoryTitle, caption });
    showToast("Added video to Special moments!");
  }
  
  localStorage.setItem('special_videos', JSON.stringify(specials));
  
  const btn = event.currentTarget;
  if (btn) {
    btn.classList.toggle('active');
  }
}

function triggerVideoLightbox(idx) {
  const m = currentMemory;
  if (!m || !m.videos) return;
  const videosList = m.videos.map((v, i) => {
    const isExternalV = v.startsWith('http');
    const thumb = isExternalV ? 'https://picsum.photos/seed/video/1200/675' : `https://picsum.photos/seed/${v}/1200/675`;
    return {
      type: 'video',
      src: v,
      isReal: isExternalV && (v.endsWith('.mp4') || v.endsWith('.webm') || v.endsWith('.ogg') || v.includes('.mp4') || v.includes('.webm')),
      thumb: thumb,
      memoryId: m.id,
      memoryTitle: m.cap,
      caption: `${m.cap} — Clip ${i + 1} of ${m.videos.length}`
    };
  });
  openLightbox(videosList, idx);
}

function downloadHero() {
  if (currentMemory) {
    const isExternalCover = currentMemory.cover.startsWith('http') || currentMemory.cover.startsWith('data:');
    const coverSrc = isExternalCover ? currentMemory.cover : `https://picsum.photos/seed/${currentMemory.cover}/1400/900`;
    downloadUrl(coverSrc, currentMemory.cap);
  }
}

function shareMemory() {
  if (!currentMemory) return;
  const shareData = {
    title: 'PWIOI Memories — ' + currentMemory.cap,
    text: currentMemory.story,
    url: window.location.href,
  };
  if (navigator.share) {
    navigator.share(shareData).catch(() => {});
  } else {
    navigator.clipboard.writeText(shareData.url).then(() => showToast('Link copied to clipboard'));
  }
}

function triggerMemoryLightbox(idx) {
  const m = currentMemory;
  if (!m || !m.gallery) return;
  const imagesList = m.gallery.map((g, i) => {
    const isExternalSeed = g.seed.startsWith('http') || g.seed.startsWith('data:');
    // For lightbox, use a large, beautiful 1400x900 image size
    const src = isExternalSeed ? g.seed : `https://picsum.photos/seed/${g.seed}/1400/900`;
    return {
      src: src,
      seed: g.seed,
      memoryId: m.id,
      memoryTitle: m.cap,
      caption: `${m.cap} — Photo ${i + 1} of ${m.gallery.length}`
    };
  });
  openLightbox(imagesList, idx);
}

window.downloadHero = downloadHero;
window.shareMemory = shareMemory;
window.triggerVideoLightbox = triggerVideoLightbox;
window.triggerMemoryLightbox = triggerMemoryLightbox;
window.isPhotoSpecial = isPhotoSpecial;
window.isVideoSpecial = isVideoSpecial;
window.togglePhotoSpecial = togglePhotoSpecial;
window.toggleVideoSpecial = toggleVideoSpecial;

document.addEventListener('DOMContentLoaded', initMemoryDetails);

// Reusable Utility Functions

function showToast(msg) {
  let t = document.getElementById('toast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'toast';
    t.className = 'toast';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(window.__toastTimer);
  window.__toastTimer = setTimeout(() => t.classList.remove('show'), 2200);
}

function downloadUrl(url, name) {
  const a = document.createElement('a');
  a.href = url;
  a.download = name.replace(/\s+/g, '_') + '.jpg';
  a.target = '_blank';
  document.body.appendChild(a);
  a.click();
  a.remove();
}

async function fetchData(url) {
  try {
    const res = await fetch(url);
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.error("Fetch error for " + url, e);
  }
  return null;
}

// Global Lightbox Carousel
let lightboxImages = [];
let currentLightboxIndex = 0;
let lightboxVideoInterval = null;

function openLightbox(imagesList, startIndex = 0) {
  lightboxImages = imagesList;
  currentLightboxIndex = startIndex;
  
  let overlay = document.getElementById('lightbox-carousel');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'lightbox-carousel';
    overlay.className = 'lightbox-carousel';
    overlay.innerHTML = `
      <button class="lightbox-close" id="lightbox-close" title="Close">×</button>
      <button class="lightbox-special" id="lightbox-special" title="Add to Special">
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
        </svg>
      </button>
      <button class="lightbox-prev" id="lightbox-prev" title="Previous">‹</button>
      <div class="lightbox-content">
        <div id="lightbox-media-box" style="position:relative; width:100%; display:flex; justify-content:center; align-items:center;">
          <img id="lightbox-img" src="" alt="Lightbox image">
          <div id="lightbox-video-wrap" style="display:none; width:100%; max-width:800px; aspect-ratio:16/9; background:#0a0804; border-radius:6px; overflow:hidden; box-shadow:0 10px 35px rgba(0,0,0,0.9); position:relative;"></div>
        </div>
        <div class="lightbox-caption" id="lightbox-caption"></div>
        <div class="lightbox-counter" id="lightbox-counter"></div>
      </div>
      <button class="lightbox-next" id="lightbox-next" title="Next">›</button>
      <div class="lightbox-dots" id="lightbox-dots"></div>
    `;
    document.body.appendChild(overlay);
    
    document.getElementById('lightbox-close').addEventListener('click', closeLightbox);
    document.getElementById('lightbox-prev').addEventListener('click', prevLightbox);
    document.getElementById('lightbox-next').addEventListener('click', nextLightbox);
    
    // Toggle Special Action
    const specialBtn = document.getElementById('lightbox-special');
    if (specialBtn) {
      specialBtn.addEventListener('click', () => {
        const media = lightboxImages[currentLightboxIndex];
        if (!media) return;
        
        if (media.type === 'video') {
          let specials = JSON.parse(localStorage.getItem('special_videos') || '[]');
          const idx = specials.findIndex(x => x.src === media.src);
          if (idx > -1) {
            specials.splice(idx, 1);
            showToast("Removed video from Special moments!");
          } else {
            specials.push({
              src: media.src,
              memoryId: media.memoryId || '',
              memoryTitle: media.memoryTitle || '',
              caption: media.caption || ''
            });
            showToast("Added video to Special moments!");
          }
          localStorage.setItem('special_videos', JSON.stringify(specials));
        } else {
          const idVal = media.seed || media.src;
          let specials = JSON.parse(localStorage.getItem('special_photos') || '[]');
          const idx = specials.findIndex(x => (x.seed === idVal || x.src === idVal));
          if (idx > -1) {
            specials.splice(idx, 1);
            showToast("Removed photo from Special moments!");
          } else {
            specials.push({
              seed: media.seed || '',
              src: media.src,
              memoryId: media.memoryId || '',
              memoryTitle: media.memoryTitle || '',
              caption: media.caption || ''
            });
            showToast("Added photo to Special moments!");
          }
          localStorage.setItem('special_photos', JSON.stringify(specials));
        }
        
        if (window.renderMemoryDetails) {
          window.renderMemoryDetails();
        }
        updateLightboxSpecialState();
      });
    }

    // Close on clicking outside of content
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay || e.target.classList.contains('lightbox-content') || e.target.id === 'lightbox-media-box') {
        closeLightbox();
      }
    });

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
      if (!overlay.classList.contains('show')) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') prevLightbox();
      if (e.key === 'ArrowRight') nextLightbox();
    });
  }
  
  overlay.classList.add('show');
  updateLightbox();
}

function updateLightbox() {
  if (lightboxImages.length === 0) return;
  
  // Clear any existing video timelines and intervals
  if (lightboxVideoInterval) {
    clearInterval(lightboxVideoInterval);
    lightboxVideoInterval = null;
  }
  
  // Wrap index
  if (currentLightboxIndex < 0) {
    currentLightboxIndex = lightboxImages.length - 1;
  } else if (currentLightboxIndex >= lightboxImages.length) {
    currentLightboxIndex = 0;
  }
  
  const currentMedia = lightboxImages[currentLightboxIndex];
  const type = currentMedia.type || 'image'; // default to image

  const imgEl = document.getElementById('lightbox-img');
  const videoWrap = document.getElementById('lightbox-video-wrap');
  const captionEl = document.getElementById('lightbox-caption');
  const counterEl = document.getElementById('lightbox-counter');
  const dotsContainer = document.getElementById('lightbox-dots');
  
  if (captionEl) {
    captionEl.textContent = currentMedia.caption || '';
  }
  
  if (counterEl) {
    counterEl.textContent = `${currentLightboxIndex + 1} / ${lightboxImages.length}`;
  }

  // Render dots
  if (dotsContainer) {
    dotsContainer.innerHTML = lightboxImages.map((_, idx) => {
      return `<span class="lightbox-dot ${idx === currentLightboxIndex ? 'active' : ''}" onclick="setLightboxIndex(${idx})"></span>`;
    }).join('');
  }

  if (type === 'image') {
    if (videoWrap) videoWrap.style.display = 'none';
    if (imgEl) {
      imgEl.style.display = 'block';
      imgEl.style.opacity = '0';
      setTimeout(() => {
        imgEl.src = currentMedia.src;
        imgEl.alt = currentMedia.caption || 'Memory Photo';
        imgEl.style.opacity = '1';
      }, 100);
    }
  } else if (type === 'video') {
    if (imgEl) imgEl.style.display = 'none';
    if (videoWrap) {
      videoWrap.style.display = 'block';
      videoWrap.innerHTML = ''; // Clear prior content
      
      if (currentMedia.isReal) {
        // Render real HTML5 video
        videoWrap.innerHTML = `
          <video src="${currentMedia.src}" controls autoplay loop style="width:100%; height:100%; object-fit:contain;"></video>
        `;
      } else {
        // Render beautiful simulated interactive player
        videoWrap.innerHTML = `
          <div class="simulated-player">
            <div class="simulated-bg-animation" style="background-image:url('${currentMedia.thumb}')"></div>
            <div class="simulated-badge">⚡ SIMULATED CLIP</div>
            
            <button class="simulated-center-play" id="sim-center-play" title="Play/Pause">▶</button>
            
            <div class="soundwave-container" id="sim-soundwave">
              <div class="sound-bar"></div>
              <div class="sound-bar"></div>
              <div class="sound-bar"></div>
              <div class="sound-bar"></div>
              <div class="sound-bar"></div>
              <div class="sound-bar"></div>
              <div class="sound-bar"></div>
              <div class="sound-bar"></div>
              <div class="sound-bar"></div>
              <div class="sound-bar"></div>
              <div class="sound-bar"></div>
              <div class="sound-bar"></div>
            </div>

            <div class="simulated-controls">
              <button class="control-btn" id="sim-play-pause" title="Pause">⏸</button>
              <span class="control-time" id="sim-time">0:00 / 0:15</span>
              
              <div class="control-timeline-track" id="sim-timeline-track">
                <div class="control-timeline-fill" id="sim-timeline-fill" style="width: 0%;"></div>
              </div>
              
              <button class="control-btn" id="sim-mute" title="Mute/Unmute">🔊</button>
              <div class="control-volume-bar" id="sim-volume-bar" style="width: 50px; height: 4px; background: rgba(255,255,255,0.3); border-radius: 2px; position: relative; margin-right: 15px; cursor: pointer;">
                <div class="control-volume-fill" id="sim-volume-fill" style="width: 80%; height: 100%; background: var(--gold, #DFC07C); border-radius: 2px;"></div>
              </div>

              <span class="speed-badge" id="sim-speed" title="Change playback speed">1.0x</span>
            </div>
          </div>
        `;
        
        // Interactivity states for the simulation
        let isPlaying = true;
        let isMuted = false;
        let currentTime = 0;
        let playbackSpeed = 1.0;
        const totalDuration = 15; // 15 seconds clip simulation
        
        const centerPlayBtn = document.getElementById('sim-center-play');
        const playPauseBtn = document.getElementById('sim-play-pause');
        const soundwave = document.getElementById('sim-soundwave');
        const timeText = document.getElementById('sim-time');
        const timelineFill = document.getElementById('sim-timeline-fill');
        const timelineTrack = document.getElementById('sim-timeline-track');
        const muteBtn = document.getElementById('sim-mute');
        const volumeFill = document.getElementById('sim-volume-fill');
        const volumeBar = document.getElementById('sim-volume-bar');
        const speedBadge = document.getElementById('sim-speed');
        
        // Hide central button initially since it starts playing
        if (centerPlayBtn) centerPlayBtn.style.opacity = '0';
        
        function togglePlay() {
          isPlaying = !isPlaying;
          if (isPlaying) {
            if (centerPlayBtn) centerPlayBtn.style.opacity = '0';
            if (playPauseBtn) playPauseBtn.textContent = '⏸';
            if (soundwave) soundwave.classList.remove('paused');
          } else {
            if (centerPlayBtn) centerPlayBtn.style.opacity = '1';
            if (playPauseBtn) playPauseBtn.textContent = '▶';
            if (soundwave) soundwave.classList.add('paused');
          }
        }
        
        if (centerPlayBtn) centerPlayBtn.addEventListener('click', togglePlay);
        if (playPauseBtn) playPauseBtn.addEventListener('click', togglePlay);
        
        if (muteBtn) {
          muteBtn.addEventListener('click', () => {
            isMuted = !isMuted;
            if (isMuted) {
              muteBtn.textContent = '🔇';
              if (volumeFill) volumeFill.style.width = '0%';
            } else {
              muteBtn.textContent = '🔊';
              if (volumeFill) volumeFill.style.width = '80%';
            }
          });
        }
        
        if (volumeBar) {
          volumeBar.addEventListener('click', (e) => {
            const rect = volumeBar.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const pct = Math.max(0, Math.min(100, (clickX / rect.width) * 100));
            if (volumeFill) volumeFill.style.width = `${pct}%`;
            isMuted = pct === 0;
            if (muteBtn) {
              muteBtn.textContent = isMuted ? '🔇' : '🔊';
            }
          });
        }
        
        if (timelineTrack) {
          timelineTrack.addEventListener('click', (e) => {
            const rect = timelineTrack.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const pct = Math.max(0, Math.min(1, clickX / rect.width));
            currentTime = pct * totalDuration;
            if (timelineFill) timelineFill.style.width = `${pct * 100}%`;
            if (timeText) {
              const sec = Math.floor(currentTime).toString().padStart(2, '0');
              timeText.textContent = `0:${sec} / 0:15`;
            }
          });
        }
        
        if (speedBadge) {
          const speeds = [1.0, 1.5, 2.0, 0.5];
          let speedIdx = 0;
          speedBadge.addEventListener('click', () => {
            speedIdx = (speedIdx + 1) % speeds.length;
            playbackSpeed = speeds[speedIdx];
            speedBadge.textContent = `${playbackSpeed.toFixed(1)}x`;
          });
        }
        
        // Timer Loop
        lightboxVideoInterval = setInterval(() => {
          if (isPlaying) {
            currentTime += 0.1 * playbackSpeed;
            if (currentTime >= totalDuration) {
              currentTime = 0; // loop
            }
            
            const fillPercent = (currentTime / totalDuration) * 100;
            if (timelineFill) timelineFill.style.width = `${fillPercent}%`;
            
            if (timeText) {
              const sec = Math.floor(currentTime).toString().padStart(2, '0');
              timeText.textContent = `0:${sec} / 0:15`;
            }
          }
        }, 100);
      }
    }
  }
  updateLightboxSpecialState();
}

function updateLightboxSpecialState() {
  const specialBtn = document.getElementById('lightbox-special');
  if (!specialBtn) return;
  const currentMedia = lightboxImages[currentLightboxIndex];
  if (!currentMedia) return;

  let isFav = false;
  if (currentMedia.type === 'video') {
    const specials = JSON.parse(localStorage.getItem('special_videos') || '[]');
    isFav = specials.some(x => x.src === currentMedia.src);
  } else {
    const idVal = currentMedia.seed || currentMedia.src;
    const specials = JSON.parse(localStorage.getItem('special_photos') || '[]');
    isFav = specials.some(x => (x.seed === idVal || x.src === idVal));
  }

  if (isFav) {
    specialBtn.classList.add('active');
  } else {
    specialBtn.classList.remove('active');
  }
}

function setLightboxIndex(index) {
  currentLightboxIndex = index;
  updateLightbox();
}

function prevLightbox() {
  currentLightboxIndex--;
  updateLightbox();
}

function nextLightbox() {
  currentLightboxIndex++;
  updateLightbox();
}

function closeLightbox() {
  const overlay = document.getElementById('lightbox-carousel');
  if (overlay) {
    overlay.classList.remove('show');
  }
  if (lightboxVideoInterval) {
    clearInterval(lightboxVideoInterval);
    lightboxVideoInterval = null;
  }
}

// Global functions exposed to inline calls
window.showToast = showToast;
window.downloadUrl = downloadUrl;
window.fetchData = fetchData;
window.openLightbox = openLightbox;
window.closeLightbox = closeLightbox;
window.prevLightbox = prevLightbox;
window.nextLightbox = nextLightbox;
window.setLightboxIndex = setLightboxIndex;

// User profile and upload stats controller

document.addEventListener('DOMContentLoaded', () => {
  const userStr = localStorage.getItem('user');
  if (!userStr) {
    showToast("Please login to view profile.");
    setTimeout(() => {
      window.location.href = '/login.html';
    }, 1500);
    return;
  }

  const user = JSON.parse(userStr);

  // Set Profile Information
  const profName = document.getElementById('prof-name');
  const profRole = document.getElementById('prof-role');
  const profEmail = document.getElementById('prof-email');
  const profAvatar = document.getElementById('prof-avatar');
  
  if (profName) profName.textContent = user.name || "Alex Student";
  if (profRole) profRole.textContent = user.role || "PWIOI Innovator";
  if (profEmail) profEmail.textContent = user.email || "student@pwioi.com";
  if (profAvatar && user.avatar) {
    profAvatar.src = user.avatar;
  }

  // Load stats
  const uploadedMemories = JSON.parse(localStorage.getItem('uploaded_memories') || '[]');
  const uploadedAchievements = JSON.parse(localStorage.getItem('uploaded_achievements') || '[]');

  const statMemoriesCount = document.getElementById('stat-memories-count');
  const statAchievementsCount = document.getElementById('stat-achievements-count');

  if (statMemoriesCount) statMemoriesCount.textContent = uploadedMemories.length;
  if (statAchievementsCount) statAchievementsCount.textContent = uploadedAchievements.length;

  // Render User's own uploads
  renderUserUploads(uploadedMemories, uploadedAchievements);
  renderSpecialMoments();
});

function renderUserUploads(memories, achievements) {
  const memContainer = document.getElementById('user-uploaded-memories');
  if (memContainer) {
    if (memories.length === 0) {
      memContainer.innerHTML = '<div style="padding: 20px; color: var(--ink-soft); font-family: \'Caveat\', cursive; font-size: 20px;">No custom memories posted yet.</div>';
    } else {
      memContainer.innerHTML = memories.map(m => {
        const isExternal = m.cover.startsWith('http') || m.cover.startsWith('data:');
        const imgSrc = isExternal ? m.cover : `https://picsum.photos/seed/${m.cover}/200/150`;
        return `<div class="user-upload-row" style="display: flex; gap: 15px; margin-bottom: 15px; background: var(--bg-alt); padding: 12px; border-radius: 6px; align-items: center; justify-content: space-between;">
          <div style="display: flex; gap: 15px; align-items: center;">
            <img src="${imgSrc}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 4px;" alt="">
            <div>
              <h5 style="margin: 0; font-size: 16px; font-weight: 600;">${m.cap}</h5>
              <span style="font-size: 12px; color: var(--ink-soft);">${m.date} · ${m.cat}</span>
            </div>
          </div>
          <button onclick="deleteMemory('${m.id}')" style="background:none; border:none; color: var(--kraft); cursor:pointer; font-size: 13px;">Delete</button>
        </div>`;
      }).join('');
    }
  }

  const achContainer = document.getElementById('user-uploaded-achievements');
  if (achContainer) {
    if (achievements.length === 0) {
      achContainer.innerHTML = '<div style="padding: 20px; color: var(--ink-soft); font-family: \'Caveat\', cursive; font-size: 20px;">No custom achievements recorded yet.</div>';
    } else {
      achContainer.innerHTML = achievements.map(a => {
        const isExternal = a.seed.startsWith('http') || a.seed.startsWith('data:');
        const photoSrc = isExternal ? a.seed : `https://picsum.photos/seed/${a.seed}/60/60`;
        return `<div class="user-upload-row" style="display: flex; gap: 15px; margin-bottom: 15px; background: var(--bg-alt); padding: 12px; border-radius: 6px; align-items: center; justify-content: space-between;">
          <div style="display: flex; gap: 15px; align-items: center;">
            <img src="${photoSrc}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 50%; border: 1px solid var(--gold);" alt="">
            <div>
              <h5 style="margin: 0; font-size: 16px; font-weight: 600;">${a.name}</h5>
              <span style="font-size: 12px; color: var(--gold); font-style: italic;">${a.award}</span>
            </div>
          </div>
          <button onclick="deleteAchievement('${a.id}')" style="background:none; border:none; color: var(--kraft); cursor:pointer; font-size: 13px;">Delete</button>
        </div>`;
      }).join('');
    }
  }
}

function deleteMemory(id) {
  if (confirm("Are you sure you want to delete this memory?")) {
    let memories = JSON.parse(localStorage.getItem('uploaded_memories') || '[]');
    memories = memories.filter(m => m.id !== id);
    localStorage.setItem('uploaded_memories', JSON.stringify(memories));
    showToast("Memory deleted.");
    location.reload();
  }
}

function deleteAchievement(id) {
  if (confirm("Are you sure you want to delete this achievement?")) {
    let achievements = JSON.parse(localStorage.getItem('uploaded_achievements') || '[]');
    achievements = achievements.filter(a => a.id !== id);
    localStorage.setItem('uploaded_achievements', JSON.stringify(achievements));
    showToast("Achievement deleted.");
    location.reload();
  }
}

function triggerProfileImageUpload() {
  const fileInput = document.getElementById('profile-image-input');
  if (fileInput) fileInput.click();
}

function handleProfileImageSelect(event) {
  const file = event.target.files[0];
  if (!file) return;
  if (!file.type.startsWith('image/')) {
    showToast("Please select an image file.");
    return;
  }
  const reader = new FileReader();
  reader.onload = (e) => {
    const base64 = e.target.result;
    
    // Update local storage
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      user.avatar = base64;
      localStorage.setItem('user', JSON.stringify(user));
    }
    
    // Update avatar elements on page
    const profAvatar = document.getElementById('prof-avatar');
    if (profAvatar) profAvatar.src = base64;
    
    const headerAvatar = document.getElementById('headerAvatarImg');
    if (headerAvatar) headerAvatar.src = base64;
    
    showToast("Profile picture updated!");
  };
  reader.readAsDataURL(file);
}

function renderSpecialMoments() {
  const photos = JSON.parse(localStorage.getItem('special_photos') || '[]');
  const videos = JSON.parse(localStorage.getItem('special_videos') || '[]');

  // Update tabs labels with counts
  const tabPhotos = document.getElementById('tab-special-photos');
  const tabVideos = document.getElementById('tab-special-videos');
  if (tabPhotos) tabPhotos.textContent = `Photos (${photos.length})`;
  if (tabVideos) tabVideos.textContent = `Videos (${videos.length})`;

  // Render Photos Grid
  const photosGrid = document.getElementById('special-photos-grid');
  if (photosGrid) {
    if (photos.length === 0) {
      photosGrid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 40px 20px; border: 1px dashed var(--line); border-radius: 8px; color: var(--ink-soft); background: var(--bg-alt);">
          <span style="font-family: 'Caveat', cursive; font-size: 24px;">No special photos bookmarked yet.</span>
          <p style="font-size: 13px; margin: 5px 0 0; font-family: 'Work Sans', sans-serif;">Go to <a href="/memories.html" style="color: var(--gold); text-decoration: underline;">Memories Scrapbook</a>, select an event, and click the star icon on photos!</p>
        </div>
      `;
    } else {
      photosGrid.innerHTML = photos.map((p, idx) => {
        const isExternalSeed = p.seed && (p.seed.startsWith('http') || p.seed.startsWith('data:'));
        const src = isExternalSeed ? p.seed : `https://picsum.photos/seed/${p.seed || p.src}/500/400`;
        return `
          <div class="special-polaroid" onclick="viewSpecialPhoto(${idx})" style="background: var(--bg-alt); padding: 12px 12px 24px; border-radius: 4px; box-shadow: 0 8px 16px var(--shadow); border: 1px solid rgba(255,255,255,0.05); position: relative; cursor: pointer; transform: rotate(${(idx % 3 === 0 ? -1.5 : idx % 3 === 1 ? 1.5 : 0)}deg); transition: transform 0.3s ease;">
            <div style="position: absolute; top: -10px; left: 50%; transform: translateX(-50%); width: 70px; height: 18px; background: rgba(223,192,124,0.15); border-left: 1px dashed rgba(223,192,124,0.3); border-right: 1px dashed rgba(223,192,124,0.3); pointer-events: none;"></div>
            <img src="${src}" style="width: 100%; aspect-ratio: 4/3; object-fit: cover; border-radius: 2px; border: 1px solid rgba(0,0,0,0.15);" alt="">
            <div style="margin-top: 10px; font-family: 'Caveat', cursive; font-size: 16px; color: var(--ink); text-align: center; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${p.caption}">
              ${p.caption || 'Special Photo'}
            </div>
            <div style="font-size: 10px; color: var(--gold); text-align: center; font-family: 'Work Sans', sans-serif; font-weight: 500; margin-top: 2px;">
              ${p.memoryTitle || 'Scrapbook'}
            </div>
            <button onclick="removeSpecialPhoto(event, ${idx})" style="position: absolute; top: 16px; right: 16px; width: 26px; height: 26px; border-radius: 50%; background: rgba(20,16,10,0.85); border: 1px solid rgba(255,255,255,0.2); color: #FFF; font-size: 14px; cursor: pointer; display: flex; align-items: center; justify-content: center; z-index: 10; transition: transform 0.2s;" title="Remove from Special">×</button>
          </div>
        `;
      }).join('');
    }
  }

  // Render Videos Grid
  const videosGrid = document.getElementById('special-videos-grid');
  if (videosGrid) {
    if (videos.length === 0) {
      videosGrid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 40px 20px; border: 1px dashed var(--line); border-radius: 8px; color: var(--ink-soft); background: var(--bg-alt);">
          <span style="font-family: 'Caveat', cursive; font-size: 24px;">No special video clips bookmarked yet.</span>
          <p style="font-size: 13px; margin: 5px 0 0; font-family: 'Work Sans', sans-serif;">Go to <a href="/memories.html" style="color: var(--gold); text-decoration: underline;">Memories Scrapbook</a>, select an event, and click the star icon on videos!</p>
        </div>
      `;
    } else {
      videosGrid.innerHTML = videos.map((v, idx) => {
        const isExternalV = v.src.startsWith('http');
        const thumb = isExternalV ? 'https://picsum.photos/seed/video/640/360' : `https://picsum.photos/seed/${v.src}/640/360`;
        return `
          <div class="videoCard" onclick="viewSpecialVideo(${idx})" style="background-image:url('${thumb}'); position: relative; aspect-ratio: 16/9; border-radius: 8px; background-size: cover; background-position: center; display: flex; align-items: center; justify-content: center; cursor: pointer; box-shadow: 0 8px 16px var(--shadow);">
            <div class="playBtn" style="position: relative; z-index: 2; width: 44px; height: 44px; border-radius: 50%; background: rgba(255,255,255,0.9); color: var(--ink); display: flex; align-items: center; justify-content: center; font-size: 14px; padding-left: 2px;">▶</div>
            <div class="videoLabel" style="position: absolute; bottom: 10px; left: 12px; color: #FFF; font-size: 12px; font-family: 'Work Sans', sans-serif; z-index: 2; text-shadow: 0 1px 3px rgba(0,0,0,0.8); font-weight: 500;">
              ${v.caption || 'Special Video Clip'}
            </div>
            <button onclick="removeSpecialVideo(event, ${idx})" style="position: absolute; top: 10px; right: 10px; width: 26px; height: 26px; border-radius: 50%; background: rgba(20,16,10,0.85); border: 1px solid rgba(255,255,255,0.2); color: #FFF; font-size: 14px; cursor: pointer; display: flex; align-items: center; justify-content: center; z-index: 10;" title="Remove from Special">×</button>
          </div>
        `;
      }).join('');
    }
  }
}

function removeSpecialPhoto(event, idx) {
  event.stopPropagation();
  let specials = JSON.parse(localStorage.getItem('special_photos') || '[]');
  specials.splice(idx, 1);
  localStorage.setItem('special_photos', JSON.stringify(specials));
  showToast("Photo removed from Special moments!");
  renderSpecialMoments();
}

function removeSpecialVideo(event, idx) {
  event.stopPropagation();
  let specials = JSON.parse(localStorage.getItem('special_videos') || '[]');
  specials.splice(idx, 1);
  localStorage.setItem('special_videos', JSON.stringify(specials));
  showToast("Video removed from Special moments!");
  renderSpecialMoments();
}

function switchSpecialTab(tabType) {
  const pGrid = document.getElementById('special-photos-grid');
  const vGrid = document.getElementById('special-videos-grid');
  const tabPhotos = document.getElementById('tab-special-photos');
  const tabVideos = document.getElementById('tab-special-videos');

  if (tabType === 'photos') {
    if (pGrid) pGrid.style.display = 'grid';
    if (vGrid) vGrid.style.display = 'none';
    if (tabPhotos) {
      tabPhotos.style.background = 'var(--kraft)';
      tabPhotos.style.color = 'var(--bg)';
    }
    if (tabVideos) {
      tabVideos.style.background = 'transparent';
      tabVideos.style.color = 'var(--ink-soft)';
    }
  } else {
    if (pGrid) pGrid.style.display = 'none';
    if (vGrid) vGrid.style.display = 'grid';
    if (tabPhotos) {
      tabPhotos.style.background = 'transparent';
      tabPhotos.style.color = 'var(--ink-soft)';
    }
    if (tabVideos) {
      tabVideos.style.background = 'var(--kraft)';
      tabVideos.style.color = 'var(--bg)';
    }
  }
}

function viewSpecialPhoto(idx) {
  const specials = JSON.parse(localStorage.getItem('special_photos') || '[]');
  const list = specials.map((p, i) => {
    const isExternalSeed = p.seed && (p.seed.startsWith('http') || p.seed.startsWith('data:'));
    const src = isExternalSeed ? p.seed : `https://picsum.photos/seed/${p.seed || p.src}/1400/900`;
    return {
      src: src,
      seed: p.seed,
      memoryId: p.memoryId,
      memoryTitle: p.memoryTitle,
      caption: p.caption
    };
  });
  openLightbox(list, idx);
}

function viewSpecialVideo(idx) {
  const specials = JSON.parse(localStorage.getItem('special_videos') || '[]');
  const list = specials.map((v, i) => {
    return {
      type: 'video',
      src: v.src,
      memoryId: v.memoryId,
      memoryTitle: v.memoryTitle,
      caption: v.caption
    };
  });
  openLightbox(list, idx);
}

window.deleteMemory = deleteMemory;
window.deleteAchievement = deleteAchievement;
window.triggerProfileImageUpload = triggerProfileImageUpload;
window.handleProfileImageSelect = handleProfileImageSelect;
window.removeSpecialPhoto = removeSpecialPhoto;
window.removeSpecialVideo = removeSpecialVideo;
window.switchSpecialTab = switchSpecialTab;
window.viewSpecialPhoto = viewSpecialPhoto;
window.viewSpecialVideo = viewSpecialVideo;
window.renderSpecialMoments = renderSpecialMoments;

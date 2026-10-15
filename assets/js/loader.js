// Dynamic template loader for navbar and footer components

// Auto-initialize mock user as "BHAVESH KUMAWAT" on first load if none exists
function checkAndInitDefaultUser() {
  const userStr = localStorage.getItem('user');
  if (!userStr) {
    const defaultUser = {
      name: "BHAVESH KUMAWAT",
      email: "bhavesh_kmwt@pwioi.com",
      handle: "@bhavesh_kmwt",
      role: "PWIOI Innovator Student",
      avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150"
    };
    localStorage.setItem('user', JSON.stringify(defaultUser));
  }
}

async function loadComponents() {
  // Check and setup default user before loading components
  checkAndInitDefaultUser();

  // Load navbar
  const navPlaceholder = document.getElementById('navbar-placeholder');
  if (navPlaceholder) {
    try {
      const response = await fetch('/components/navbar.html');
      if (response.ok) {
        navPlaceholder.innerHTML = await response.text();
        highlightActiveNav();
        updateNavAuthState();
        
        // Sync up the theme toggler icon outline SVG on dynamic navbar
        const savedTheme = localStorage.getItem('theme') || 'light';
        if (window.updateThemeIcon) {
          window.updateThemeIcon(savedTheme);
        }
      }
    } catch (e) {
      console.error("Error loading navbar:", e);
    }
  }

  // Load footer
  const footerPlaceholder = document.getElementById('footer-placeholder');
  if (footerPlaceholder) {
    try {
      const response = await fetch('/components/footer.html');
      if (response.ok) {
        footerPlaceholder.innerHTML = await response.text();
      }
    } catch (e) {
      console.error("Error loading footer:", e);
    }
  }
}

function highlightActiveNav() {
  const path = window.location.pathname;
  let activeId = 'nav-home';
  if (path.includes('memories.html') || path.includes('memory-details.html')) {
    activeId = 'nav-memories';
  } else if (path.includes('achievements.html') || path.includes('achievement-details.html')) {
    activeId = 'nav-achievements';
  } else if (path.includes('upload.html')) {
    activeId = 'nav-upload';
  } else if (path.includes('profile.html')) {
    activeId = 'nav-profile';
  } else if (path.includes('login.html')) {
    activeId = 'nav-login-btn';
  } else if (path === '/' || path === '/index.html' || path === '') {
    activeId = 'nav-home';
  }

  const el = document.getElementById(activeId);
  if (el) {
    el.classList.add('active');
  }
}

function updateNavAuthState() {
  const userStr = localStorage.getItem('user');
  const uploadNav = document.getElementById('nav-upload');
  const profileNav = document.getElementById('nav-profile');
  
  const avatarContainer = document.querySelector('.profile-dropdown-container');
  const navRight = document.querySelector('.navright');

  if (userStr) {
    const user = JSON.parse(userStr);
    
    // Update profile names inside dropdown
    const nameEl = document.getElementById('dropdownProfileName');
    const handleEl = document.getElementById('dropdownProfileHandle');
    if (nameEl) nameEl.textContent = user.name || "BHAVESH KUMAWAT";
    if (handleEl) handleEl.textContent = user.handle || (user.email ? '@' + user.email.split('@')[0] : "@bhavesh_kmwt");

    if (uploadNav) uploadNav.style.display = 'inline-block';
    if (profileNav) profileNav.style.display = 'inline-block';
    if (avatarContainer) avatarContainer.style.display = 'inline-block';
    
    // Update header avatar image
    const headerAvatarImg = document.getElementById('headerAvatarImg');
    const dropdownProfileAvatar = document.getElementById('dropdownProfileAvatar');
    if (user.avatar) {
      if (headerAvatarImg) headerAvatarImg.src = user.avatar;
      if (dropdownProfileAvatar) dropdownProfileAvatar.src = user.avatar;
    }
    
    // Remove dynamic login button if it was added before
    const existingLogin = document.getElementById('dynamic-login-btn');
    if (existingLogin) existingLogin.remove();

    // Bind Logout inside dropdown
    const logoutBtn = document.getElementById('dropdownLogoutBtn');
    if (logoutBtn) {
      logoutBtn.onclick = (e) => {
        e.preventDefault();
        localStorage.removeItem('user');
        window.location.href = '/login.html';
      };
    }
  } else {
    // Hidden profile states
    if (uploadNav) uploadNav.style.display = 'none';
    if (profileNav) profileNav.style.display = 'none';
    if (avatarContainer) avatarContainer.style.display = 'none';

    // Append dynamic login button if not existing
    if (navRight && !document.getElementById('dynamic-login-btn')) {
      const loginBtn = document.createElement('a');
      loginBtn.id = 'dynamic-login-btn';
      loginBtn.className = 'recent-btn';
      loginBtn.href = '/login.html';
      loginBtn.style.textDecoration = 'none';
      loginBtn.innerHTML = '<span>Login</span>';
      navRight.appendChild(loginBtn);
    }
  }
}

// Dropdown interactions
function toggleProfileDropdown(event) {
  if (event) event.stopPropagation();
  const profileCard = document.getElementById('profileDropdownCard');
  const recentCard = document.getElementById('recentDropdownCard');
  const avatarBtn = document.getElementById('headerAvatarBtn');
  
  if (recentCard) recentCard.classList.remove('show');
  
  if (profileCard) {
    const isShowing = profileCard.classList.contains('show');
    if (isShowing) {
      profileCard.classList.remove('show');
      if (avatarBtn) avatarBtn.classList.remove('active');
    } else {
      profileCard.classList.add('show');
      if (avatarBtn) avatarBtn.classList.add('active');
    }
  }
}

function toggleRecentDropdown(event) {
  if (event) event.stopPropagation();
  const profileCard = document.getElementById('profileDropdownCard');
  const recentCard = document.getElementById('recentDropdownCard');
  const avatarBtn = document.getElementById('headerAvatarBtn');
  
  if (profileCard) {
    profileCard.classList.remove('show');
    if (avatarBtn) avatarBtn.classList.remove('active');
  }
  
  if (recentCard) {
    const isShowing = recentCard.classList.contains('show');
    if (isShowing) {
      recentCard.classList.remove('show');
    } else {
      recentCard.classList.add('show');
      renderRecentDropdownList();
    }
  }
}

function renderRecentDropdownList() {
  const listEl = document.getElementById('recentDropdownList');
  if (!listEl) return;
  
  const recents = JSON.parse(localStorage.getItem('recent_memories') || '[]');
  if (recents.length === 0) {
    listEl.innerHTML = '<div class="recent-empty">No recently viewed memories.</div>';
    return;
  }
  
  listEl.innerHTML = recents.map(m => {
    const isExternalCover = m.cover.startsWith('http') || m.cover.startsWith('data:');
    const imgSrc = isExternalCover ? m.cover : `https://picsum.photos/seed/${m.cover}/100/100`;
    return `
      <a href="/memory-details.html?id=${m.id}" class="recent-item">
        <img class="recent-thumb" src="${imgSrc}" alt="${m.cap}">
        <div class="recent-info">
          <div class="recent-title">${m.cap}</div>
          <div class="recent-date">${m.date}</div>
        </div>
      </a>
    `;
  }).join('');
}

function clearRecentMemories(event) {
  if (event) event.stopPropagation();
  localStorage.setItem('recent_memories', '[]');
  renderRecentDropdownList();
}

function addRecentMemory(m) {
  if (!m || !m.id) return;
  let recents = JSON.parse(localStorage.getItem('recent_memories') || '[]');
  // Filter duplicates
  recents = recents.filter(x => x.id !== m.id);
  // Unshift new item
  recents.unshift({
    id: m.id,
    cap: m.cap,
    cover: m.cover,
    date: m.date
  });
  // Cap at 5
  recents = recents.slice(0, 5);
  localStorage.setItem('recent_memories', JSON.stringify(recents));
}

// Global click handler to close dropdowns when clicking outside
document.addEventListener('click', (e) => {
  const profileCard = document.getElementById('profileDropdownCard');
  const recentCard = document.getElementById('recentDropdownCard');
  const avatarBtn = document.getElementById('headerAvatarBtn');
  const recentBtn = document.getElementById('headerRecentBtn');
  
  if (profileCard && !profileCard.contains(e.target) && e.target !== avatarBtn && !avatarBtn?.contains(e.target)) {
    profileCard.classList.remove('show');
    if (avatarBtn) avatarBtn.classList.remove('active');
  }
  
  if (recentCard && !recentCard.contains(e.target) && e.target !== recentBtn && !recentBtn?.contains(e.target)) {
    recentCard.classList.remove('show');
  }
});

// Expose functions globally
window.toggleProfileDropdown = toggleProfileDropdown;
window.toggleRecentDropdown = toggleRecentDropdown;
window.clearRecentMemories = clearRecentMemories;
window.addRecentMemory = addRecentMemory;
window.updateNavAuthState = updateNavAuthState;

document.addEventListener('DOMContentLoaded', loadComponents);

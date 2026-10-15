// Upload Memory & Achievement controller

document.addEventListener('DOMContentLoaded', () => {
  // Guard access: must be logged in to upload
  const currentUserStr = localStorage.getItem('user');
  if (!currentUserStr) {
    showToast("Please login first to upload memories.");
    setTimeout(() => {
      window.location.href = '/login.html';
    }, 1500);
    return;
  }

  const currentUser = JSON.parse(currentUserStr);
  const isAdmin = currentUser.email && (currentUser.email.toLowerCase().includes('admin') || currentUser.role === 'Administrator');

  const uploadForm = document.getElementById('uploadForm');
  const typeSelector = document.getElementById('upload_type');
  const achievementSpecific = document.getElementById('achievement-specific-fields');
  const adminOnlyNotice = document.getElementById('adminOnlyNotice');
  const achievementOption = document.getElementById('achievementOption');
  const advancedToggleWrapper = document.getElementById('advanced-toggle-wrapper');

  // Admin access restrictions for Achievements
  if (!isAdmin) {
    if (adminOnlyNotice) adminOnlyNotice.style.display = 'block';
    if (achievementOption) {
      achievementOption.disabled = true;
      achievementOption.text = "Hall of Fame Achievement (Admin Only) 🔒";
    }
  }

  // Type change listener
  if (typeSelector) {
    typeSelector.addEventListener('change', (e) => {
      const type = e.target.value;
      if (type === 'memory') {
        if (achievementSpecific) achievementSpecific.style.display = 'none';
        if (advancedToggleWrapper) advancedToggleWrapper.style.display = 'block';
      } else {
        // Double check admin guard
        if (!isAdmin) {
          showToast("🔒 Hall of Fame Achievements are restricted to administrators.");
          typeSelector.value = 'memory';
          return;
        }
        if (achievementSpecific) achievementSpecific.style.display = 'block';
        if (advancedToggleWrapper) advancedToggleWrapper.style.display = 'none';
      }
    });
  }

  // Collapsible Advanced Settings logic
  const toggleAdvancedBtn = document.getElementById('toggleAdvancedBtn');
  const advancedFieldsContainer = document.getElementById('advanced-fields-container');
  const advancedChevron = document.getElementById('advancedChevron');

  if (toggleAdvancedBtn && advancedFieldsContainer) {
    toggleAdvancedBtn.addEventListener('click', () => {
      const isHidden = advancedFieldsContainer.style.display === 'none';
      if (isHidden) {
        advancedFieldsContainer.style.display = 'block';
        if (advancedChevron) advancedChevron.style.transform = 'rotate(90deg)';
      } else {
        advancedFieldsContainer.style.display = 'none';
        if (advancedChevron) advancedChevron.style.transform = 'rotate(0deg)';
      }
    });
  }

  // Interactive Image Drag & Drop / File Selector
  const dropZone = document.getElementById('drop-zone');
  const fileInput = document.getElementById('file-input');
  const uploadStatusText = document.getElementById('upload-status-text');
  const imagePreviewContainer = document.getElementById('image-preview-container');
  const imagePreview = document.getElementById('image-preview');
  const removePreviewBtn = document.getElementById('remove-preview-btn');
  const coverUrlInput = document.getElementById('cover_url');

  let uploadedFileBase64 = null;

  // Click on drop zone to trigger file select
  if (dropZone) {
    dropZone.addEventListener('click', (e) => {
      // Don't trigger if clicked on the preview remove button
      if (e.target === removePreviewBtn || removePreviewBtn?.contains(e.target)) return;
      fileInput.click();
    });

    // Drag-over styling
    dropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropZone.style.borderColor = 'var(--gold)';
      dropZone.style.background = 'rgba(223, 192, 124, 0.05)';
    });

    ['dragleave', 'dragend'].forEach(type => {
      dropZone.addEventListener(type, () => {
        dropZone.style.borderColor = 'var(--line)';
        dropZone.style.background = 'var(--bg)';
      });
    });

    // Drop file
    dropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropZone.style.borderColor = 'var(--line)';
      dropZone.style.background = 'var(--bg)';
      
      const files = e.dataTransfer.files;
      if (files.length > 0) {
        handleImageFile(files[0]);
      }
    });
  }

  if (fileInput) {
    fileInput.addEventListener('change', (e) => {
      if (e.target.files.length > 0) {
        handleImageFile(e.target.files[0]);
      }
    });
  }

  if (removePreviewBtn) {
    removePreviewBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      clearImagePreview();
    });
  }

  // Clear file preview when user pastes a URL
  if (coverUrlInput) {
    coverUrlInput.addEventListener('input', () => {
      if (coverUrlInput.value.trim().length > 0 && uploadedFileBase64) {
        clearImagePreview();
      }
    });
  }

  function handleImageFile(file) {
    if (!file.type.startsWith('image/')) {
      showToast("Only image files are supported!");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      uploadedFileBase64 = event.target.result;
      
      if (imagePreview) imagePreview.src = uploadedFileBase64;
      if (imagePreviewContainer) imagePreviewContainer.style.display = 'block';
      if (uploadStatusText) uploadStatusText.style.display = 'none';
      if (coverUrlInput) coverUrlInput.value = ''; // clear URL input to avoid conflict
      
      showToast("Photo uploaded successfully!");
    };
    reader.readAsDataURL(file);
  }

  function clearImagePreview() {
    uploadedFileBase64 = null;
    if (fileInput) fileInput.value = '';
    if (imagePreview) imagePreview.src = '';
    if (imagePreviewContainer) imagePreviewContainer.style.display = 'none';
    if (uploadStatusText) uploadStatusText.style.display = 'block';
  }

  // Submit Handler
  if (uploadForm) {
    uploadForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const type = typeSelector ? typeSelector.value : 'memory';
      const title = document.getElementById('title').value;
      const date = document.getElementById('date').value;
      const story = document.getElementById('story').value;

      // Final cover photo resolution
      let coverUrl = 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=600&h=400'; // good default
      if (uploadedFileBase64) {
        coverUrl = uploadedFileBase64;
      } else if (coverUrlInput && coverUrlInput.value.trim().length > 0) {
        coverUrl = coverUrlInput.value.trim();
      } else {
        // Fallback to random seed URL if empty
        coverUrl = `https://picsum.photos/seed/${Date.now()}/600/400`;
      }

      if (type === 'memory') {
        const cat = document.getElementById('category').value;
        const location = document.getElementById('location').value || 'PWIOI Campus';
        const size = document.getElementById('size').value;
        const fastener = document.getElementById('fastener').value;

        const newMemory = {
          id: 'mem_' + Date.now(),
          cat: cat,
          size: size,
          featured: false,
          stack: false,
          fastener: fastener,
          tape: fastener === 'tape' ? ['c-plain', 'pos-c'] : null,
          cover: coverUrl,
          cap: title,
          date: formatDate(date),
          location: location,
          story: story,
          gallery: [
            { seed: coverUrl, size: 'g-lg' }
          ],
          videos: []
        };

        const existing = JSON.parse(localStorage.getItem('uploaded_memories') || '[]');
        existing.unshift(newMemory);
        localStorage.setItem('uploaded_memories', JSON.stringify(existing));

        showToast("Memory scrapbook card added successfully!");
        setTimeout(() => {
          window.location.href = '/memories.html';
        }, 1500);

      } else {
        // Achievement upload (Admin Guarded)
        if (!isAdmin) {
          showToast("🔒 Access Denied: Administrators only.");
          return;
        }

        const award = document.getElementById('award').value;
        const name = document.getElementById('student_name').value;
        const role = document.getElementById('student_role').value;
        const year = document.getElementById('student_year').value;
        const quote = document.getElementById('quote').value || "Thrilled to share this milestone!";

        const newAchievement = {
          id: 'ach_' + Date.now(),
          name: name,
          award: award,
          college: "PW Institute of Innovation",
          seed: coverUrl, // reuse cover URL as profile/photo
          year: year,
          role: role,
          story: story,
          quote: quote,
          gallery: [coverUrl]
        };

        const existing = JSON.parse(localStorage.getItem('uploaded_achievements') || '[]');
        existing.unshift(newAchievement);
        localStorage.setItem('uploaded_achievements', JSON.stringify(existing));

        showToast("Achievement badge added to Hall of Fame!");
        setTimeout(() => {
          window.location.href = '/achievements.html';
        }, 1500);
      }
    });
  }
});

function formatDate(dateStr) {
  if (!dateStr) return 'Today';
  const options = { day: 'numeric', month: 'short', year: 'numeric' };
  return new Date(dateStr).toLocaleDateString('en-GB', options);
}

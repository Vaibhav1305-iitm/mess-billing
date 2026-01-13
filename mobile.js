// Mobile App Logic - Gmail Style (Advanced Features)

// --- State ---
const state = {
    view: 'home',
    theme: 'light',
    entries: [],
    pricingRules: [],
    fabAction: 'entry' // 'entry' or 'pricing'
};
// --- LOCAL CACHE FOR INSTANT LOADING ---
const CACHE_KEYS = { ENTRIES: 'mess_entries_v2', PRICING: 'mess_pricing_v2' };

// Save to localStorage cache
function saveCacheNow() {
    try {
        localStorage.setItem(CACHE_KEYS.ENTRIES, JSON.stringify(state.entries));
        localStorage.setItem(CACHE_KEYS.PRICING, JSON.stringify(state.pricingRules));
    } catch (e) { console.warn('Cache save failed'); }
}

// Load from cache instantly
function loadFromCache() {
    try {
        const e = localStorage.getItem(CACHE_KEYS.ENTRIES);
        const p = localStorage.getItem(CACHE_KEYS.PRICING);
        if (e) state.entries = JSON.parse(e);
        if (p) state.pricingRules = JSON.parse(p);
        return state.entries.length > 0;
    } catch (e) { return false; }
}
console.log(' INSTANT CACHE enabled!');

// --- iOS Stepper Controls ---
window.stepValue = function (inputId, delta) {
    const input = document.getElementById(inputId);
    if (!input) return;

    let value = parseInt(input.value) || 0;
    value = Math.max(0, value + delta); // Prevent negative values
    input.value = value;

    // Update total preview
    updateEntryTotalPreview();

    // Haptic feedback simulation (visual feedback)
    input.style.transform = 'scale(1.1)';
    setTimeout(() => input.style.transform = 'scale(1)', 100);
};

// Update entry total preview
window.updateEntryTotalPreview = function () {
    const morning = parseInt(document.getElementById('new-morning')?.value) || 0;
    const evening = parseInt(document.getElementById('new-evening')?.value) || 0;
    const total = morning + evening;

    const preview = document.getElementById('entry-total-preview');
    if (preview) {
        preview.textContent = `${total} Tiffin${total !== 1 ? 's' : ''}`;
    }
};

// --- Profile Management & Onboarding ---
const PROFILE_CACHE_KEY = 'mess_user_profile';
const ONBOARDED_KEY = 'mess_user_onboarded';

// Check first-time user on load
window.checkFirstTimeUser = function () {
    const isOnboarded = localStorage.getItem(ONBOARDED_KEY);
    if (!isOnboarded) {
        // Show welcome modal for first-time users
        document.getElementById('welcome-modal').classList.add('open');
    }
};

// Complete onboarding (save from welcome modal)
window.completeOnboarding = async function () {
    const name = document.getElementById('welcome-name').value.trim();
    const phone = document.getElementById('welcome-phone').value.trim();
    const city = document.getElementById('welcome-city').value.trim();
    const pincode = document.getElementById('welcome-pincode').value.trim();
    const email = document.getElementById('welcome-email').value.trim();

    if (!name) {
        alert('Please enter your name');
        return;
    }
    if (!phone) {
        alert('Please enter your phone number');
        return;
    }

    const profile = { name, phone, city, pincode, email, deviceId: getDeviceId() };

    // Save locally
    localStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(profile));
    localStorage.setItem(ONBOARDED_KEY, 'true');
    updateProfileDisplay(profile);

    // Close welcome modal
    document.getElementById('welcome-modal').classList.remove('open');
    showToast('🎉 Welcome to MessFlow!', 'success');

    // Sync to Google Sheets (Users sheet)
    try {
        await fetch(`${GOOGLE_APPS_SCRIPT_URL}?path=users&action=save`, {
            method: 'POST',
            body: JSON.stringify(profile)
        });
        console.log('User registered in Google Sheets');
    } catch (err) {
        console.warn('User registration failed (saved locally):', err);
    }
};

// Generate unique device ID
function getDeviceId() {
    let deviceId = localStorage.getItem('mess_device_id');
    if (!deviceId) {
        deviceId = 'DEV-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('mess_device_id', deviceId);
    }
    return deviceId;
}

// Open profile modal (edit mode)
window.openProfileModal = function () {
    const profile = JSON.parse(localStorage.getItem(PROFILE_CACHE_KEY)) || {};

    document.getElementById('edit-profile-name').value = profile.name || '';
    document.getElementById('edit-profile-phone').value = profile.phone || '';
    document.getElementById('edit-profile-city').value = profile.city || '';
    document.getElementById('edit-profile-pincode').value = profile.pincode || '';
    document.getElementById('edit-profile-email').value = profile.email || '';

    document.getElementById('profile-modal').classList.add('open');
    closeDrawer();
};

// Save profile (update mode)
window.saveProfile = async function () {
    const name = document.getElementById('edit-profile-name').value.trim();
    const phone = document.getElementById('edit-profile-phone').value.trim();
    const city = document.getElementById('edit-profile-city').value.trim();
    const pincode = document.getElementById('edit-profile-pincode').value.trim();
    const email = document.getElementById('edit-profile-email').value.trim();

    if (!name) {
        alert('Please enter your name');
        return;
    }

    const profile = { name, phone, city, pincode, email, deviceId: getDeviceId() };

    // Save locally immediately
    localStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(profile));
    updateProfileDisplay(profile);

    closeModal();
    showToast('✅ Profile updated!', 'success');

    // Sync to Google Sheets (Users sheet)
    try {
        await fetch(`${GOOGLE_APPS_SCRIPT_URL}?path=users&action=save`, {
            method: 'POST',
            body: JSON.stringify(profile)
        });
        console.log('Profile synced to cloud');
    } catch (err) {
        console.warn('Profile cloud sync failed (saved locally):', err);
    }
};

// Load profile from localStorage
window.loadProfile = function () {
    const cached = localStorage.getItem(PROFILE_CACHE_KEY);
    if (cached) {
        updateProfileDisplay(JSON.parse(cached));
    }

    // Check first-time user after a small delay (let UI load first)
    setTimeout(checkFirstTimeUser, 500);
};

// Update profile display in drawer and top avatar
window.updateProfileDisplay = function (profile) {
    const avatarEl = document.getElementById('profile-avatar');
    const nameEl = document.getElementById('profile-name');
    const phoneEl = document.getElementById('profile-phone');
    const topAvatarEl = document.getElementById('user-avatar');

    if (profile && profile.name) {
        // Create initials from name (max 2 chars)
        const nameParts = profile.name.split(' ').filter(p => p.length > 0);
        const initials = nameParts.length >= 2
            ? (nameParts[0][0] + nameParts[1][0]).toUpperCase()
            : profile.name.substring(0, 2).toUpperCase();

        if (avatarEl) avatarEl.textContent = initials;
        if (topAvatarEl) topAvatarEl.textContent = initials;
        if (nameEl) nameEl.textContent = profile.name;
        if (phoneEl) phoneEl.textContent = profile.phone || 'Tap to edit';
    } else {
        if (avatarEl) avatarEl.textContent = 'AD';
        if (topAvatarEl) topAvatarEl.textContent = 'AD';
        if (nameEl) nameEl.textContent = 'Tap to set up';
        if (phoneEl) phoneEl.textContent = 'Add your details';
    }
};

// --- Modal Close Functions ---
window.closeModal = function () {
    // Close all open modals
    document.querySelectorAll('.modal.open').forEach(modal => {
        modal.classList.remove('open');
    });
};

// Initialize modal backdrop click and swipe gestures
function initModalGestures() {
    const modals = document.querySelectorAll('.modal');

    modals.forEach(modal => {
        // Click on backdrop (outside modal-content) closes modal
        modal.addEventListener('click', function (e) {
            if (e.target === modal) {
                closeModal();
            }
        });

        // Swipe down to close
        let startY = 0;
        let currentY = 0;
        let isDragging = false;
        const modalContent = modal.querySelector('.modal-content, .ios-bottom-sheet');

        if (modalContent) {
            modalContent.addEventListener('touchstart', function (e) {
                startY = e.touches[0].clientY;
                isDragging = true;
            }, { passive: true });

            modalContent.addEventListener('touchmove', function (e) {
                if (!isDragging) return;
                currentY = e.touches[0].clientY;
                const diff = currentY - startY;

                // Only allow dragging down
                if (diff > 0 && diff < 200) {
                    modalContent.style.transform = `translateY(${diff}px)`;
                    modalContent.style.opacity = 1 - (diff / 300);
                }
            }, { passive: true });

            modalContent.addEventListener('touchend', function (e) {
                if (!isDragging) return;
                isDragging = false;

                const diff = currentY - startY;

                // If dragged more than 100px, close the modal
                if (diff > 100) {
                    closeModal();
                }

                // Reset transform
                modalContent.style.transform = '';
                modalContent.style.opacity = '';
                startY = 0;
                currentY = 0;
            });
        }
    });
}

// Initialize gestures after DOM load
document.addEventListener('DOMContentLoaded', function () {
    setTimeout(initModalGestures, 500);
});



// --- Toast Notification System ---
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <span class="material-symbols-outlined" style="margin-right: 8px;">
            ${type === 'success' ? 'check_circle' : type === 'error' ? 'error' : 'info'}
        </span>
        <span>${message}</span>
    `;

    document.body.appendChild(toast);

    // Trigger animation
    setTimeout(() => toast.classList.add('show'), 10);

    // Remove after 3 seconds
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// --- DOM Elements ---
const drawerOverlay = document.getElementById('drawer-overlay');
const navDrawer = document.getElementById('nav-drawer');
const menuBtn = document.getElementById('menu-btn');
const entryModal = document.getElementById('entry-modal');
const pricingModal = document.getElementById('pricing-modal');
const fabAdd = document.getElementById('fab-add');

// --- Google Apps Script API Config ---
// Using Google Sheets as backend database (works anywhere with internet!)
const GOOGLE_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzy_wCcOs8OWP6WatebpNevewzLC9f80PEdOiTLt6VfHSkS98KlQQydItBRJey-6wjfgQ/exec';

console.log('✅ Using Google Sheets backend:', GOOGLE_APPS_SCRIPT_URL);

// --- Loader Management ---
window.showLoader = function (message = 'Loading...') {
    let loader = document.getElementById('global-loader');
    if (!loader) {
        loader = document.createElement('div');
        loader.id = 'global-loader';
        loader.innerHTML = `
            <div style="position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.5);
                        display:flex;align-items:center;justify-content:center;z-index:9999;">
                <div style="background:var(--md-sys-color-surface);padding:24px;border-radius:12px;
                            text-align:center;min-width:200px;box-shadow:0 8px 32px rgba(0,0,0,0.3);">
                    <div class="spinner" style="margin:0 auto 12px;width:40px;height:40px;
                                border:4px solid var(--md-sys-color-primary);border-top-color:transparent;
                                border-radius:50%;animation:spin 1s linear infinite;"></div>
                    <div id="loader-message" style="color:var(--md-sys-color-on-surface);font-size:14px;">${message}</div>
                </div>
            </div>
        `;
        document.body.appendChild(loader);
    } else {
        loader.style.display = 'block';
        const msg = loader.querySelector('#loader-message');
        if (msg) msg.textContent = message;
    }
};

window.hideLoader = function () {
    const loader = document.getElementById('global-loader');
    if (loader) loader.style.display = 'none';
};

// --- Fetch with Timeout ---
window.fetchWithTimeout = async function (url, options = {}, timeout = 15000) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);

    try {
        const response = await fetch(url, {
            ...options,
            signal: controller.signal
        });
        clearTimeout(id);
        return response;
    } catch (error) {
        clearTimeout(id);
        if (error.name === 'AbortError') {
            throw new Error('Request timeout - Check your internet connection');
        }
        throw error;
    }
};

// --- Global Error Handlers ---
window.addEventListener('error', function (e) {
    console.error('Global error:', e.error);
});

window.addEventListener('unhandledrejection', function (e) {
    console.error('Unhandled promise rejection:', e.reason);
    if (e.reason && e.reason.message && e.reason.message.includes('timeout')) {
        alert('⚠️ Network timeout. Please check your internet connection.');
        hideLoader();
    }
});

// --- Navigation & UI Interaction ---

window.toggleDrawer = function () {
    const navDrawer = document.getElementById('nav-drawer');
    const drawerOverlay = document.getElementById('drawer-overlay');
    if (navDrawer && drawerOverlay) {
        navDrawer.classList.toggle('open');
        drawerOverlay.classList.toggle('open');
    }
};

window.closeDrawer = function () {
    const navDrawer = document.getElementById('nav-drawer');
    const drawerOverlay = document.getElementById('drawer-overlay');
    if (navDrawer) navDrawer.classList.remove('open');
    if (drawerOverlay) drawerOverlay.classList.remove('open');
};

// Overlay click to close
if (drawerOverlay) {
    drawerOverlay.addEventListener('click', window.closeDrawer);
}

// --- Swipe Gesture to Open/Close Drawer ---
(function initSwipeGesture() {
    let touchStartX = 0;
    let touchStartY = 0;
    let touchEndX = 0;
    let touchEndY = 0;
    const SWIPE_THRESHOLD = 50; // Minimum swipe distance
    const EDGE_WIDTH = window.innerWidth / 2; // Half screen width for easy swipe

    document.addEventListener('touchstart', function (e) {
        touchStartX = e.changedTouches[0].screenX;
        touchStartY = e.changedTouches[0].screenY;
    }, { passive: true });

    document.addEventListener('touchend', function (e) {
        touchEndX = e.changedTouches[0].screenX;
        touchEndY = e.changedTouches[0].screenY;
        handleSwipe();
    }, { passive: true });

    function handleSwipe() {
        const diffX = touchEndX - touchStartX;
        const diffY = Math.abs(touchEndY - touchStartY);
        const navDrawer = document.getElementById('nav-drawer');
        const isDrawerOpen = navDrawer && navDrawer.classList.contains('open');

        // Only process horizontal swipes (diffX > diffY)
        if (Math.abs(diffX) > diffY && Math.abs(diffX) > SWIPE_THRESHOLD) {
            // Swipe RIGHT from left edge → Open drawer
            if (diffX > 0 && touchStartX < EDGE_WIDTH && !isDrawerOpen) {
                window.toggleDrawer();
            }
            // Swipe LEFT anywhere when drawer is open → Close drawer
            else if (diffX < 0 && isDrawerOpen) {
                window.closeDrawer();
            }
        }
    }
})();

// Initial navigation logic removed in favor of consolidated logic at bottom of file

// FAB Handler
window.handleFabClick = function () {
    if (state.fabAction === 'entry') {
        openAddEntryModal();
    } else if (state.fabAction === 'pricing') {
        openPricingModal();
    }
};

// --- Navigation Function ---
window.navigate = function (viewId) {
    // 1. Switch View Content
    document.querySelectorAll('.view-section').forEach(el => el.classList.remove('active'));
    const target = document.getElementById(`view-${viewId}`);
    if (target) target.classList.add('active');

    // 2. Update Bottom Navigation Active State
    document.querySelectorAll('.bottom-nav .nav-item').forEach(el => el.classList.remove('active'));
    const activeNav = document.querySelector(`.bottom-nav .nav-item[onclick*="navigate('${viewId}')"]`);
    if (activeNav) activeNav.classList.add('active');

    // 3. Update Drawer Active State (Secondary)
    document.querySelectorAll('.nav-drawer .drawer-item').forEach(el => el.classList.remove('active'));
    const activeDrawer = document.querySelector(`.nav-drawer .drawer-item[onclick*="navigate('${viewId}')"]`);
    if (activeDrawer) activeDrawer.classList.add('active');

    // 4. Close drawer if open
    closeDrawer();

    // 5. Update FAB action based on view
    const fab = document.getElementById('fab-add');
    if (viewId === 'home') {
        state.fabAction = 'entry';
        if (fab) fab.style.display = 'flex';
    } else if (viewId === 'pricing') {
        state.fabAction = 'pricing';
        if (fab) fab.style.display = 'flex';
    } else {
        // Hide FAB on other pages
        if (fab) fab.style.display = 'none';
    }

    // 6. Update Top Bar (Search vs Page Header)
    const searchBar = document.getElementById('top-search-bar');
    const pageHeader = document.getElementById('top-page-header');
    const pageTitle = document.getElementById('page-title-text');

    if (viewId === 'home') {
        if (searchBar) searchBar.style.display = 'flex';
        if (pageHeader) pageHeader.style.display = 'none';
    } else {
        if (searchBar) searchBar.style.display = 'none';
        if (pageHeader) pageHeader.style.display = 'flex';

        // Set page title
        const titles = {
            'bill': 'Generate Bill',
            'pricing': 'Pricing Rules',
            'presenty': 'Mess Presenty',
            'reports': 'Reports & Analytics',
            'activity': 'Activity Log',
            'settings': 'Data & Settings'
        };
        if (pageTitle) pageTitle.textContent = titles[viewId] || 'Section';
    }

    // 7. Load view-specific data
    if (viewId === 'pricing') {
        fetchPricingRules();
    } else if (viewId === 'reports') {
        renderCharts();
    } else if (viewId === 'activity') {
        // fetchActivityLog(); // If implemented
    } else if (viewId === 'bill') {
        // Populate bill month selector if needed
        populateBillMonths();
    } else if (viewId === 'presenty') {
        // Reset date to TODAY (local timezone)
        const presentyDate = document.getElementById('presenty-date');
        if (presentyDate) {
            const now = new Date();
            const localDate = now.getFullYear() + '-' +
                String(now.getMonth() + 1).padStart(2, '0') + '-' +
                String(now.getDate()).padStart(2, '0');
            presentyDate.value = localDate;
        }

        // Reset checkbox to unchecked
        const checkbox = document.getElementById('presenty-verified-checkbox');
        if (checkbox) checkbox.checked = false;

        // Reset verified categories state
        if (typeof messPresenty !== 'undefined') {
            messPresenty.verifiedCategories = {};
        }

        // Load Mess Presenty students
        loadMessAttendance();
    }

    // 8. Hide/Show Bottom Nav based on view
    const bottomNav = document.querySelector('.bottom-nav');
    if (bottomNav) {
        if (viewId === 'presenty') {
            bottomNav.style.display = 'none'; // Hide for Mess Presenty
        } else {
            bottomNav.style.display = 'flex'; // Show for other views
        }
    }

    // 9. Update state
    state.view = viewId;
};

// Modal Handling
window.openAddEntryModal = function () {
    const dateInput = document.getElementById('new-date');
    if (dateInput) {
        dateInput.valueAsDate = new Date();
        dateInput.disabled = false; // Enable for new entry
    }
    document.getElementById('new-morning').value = 0;
    document.getElementById('new-evening').value = 0;

    // Update total preview to show 0 Tiffins
    updateEntryTotalPreview();

    document.querySelector('#entry-modal h3').textContent = 'New Entry';
    // Hide delete button for new entries
    const deleteBtn = document.getElementById('delete-entry-btn');
    if (deleteBtn) deleteBtn.style.display = 'none';
    document.getElementById('entry-modal').classList.add('open');
};

window.openModal = window.openAddEntryModal; // Alias for FAB

// openPricingModal defined later with more complete logic

window.closeModal = function () {
    document.querySelectorAll('.modal').forEach(el => el.classList.remove('open'));
    // Also close bottom sheets if any
    document.querySelectorAll('.bottom-sheet').forEach(el => el.classList.remove('open'));
    if (document.getElementById('filter-sheet-overlay')) document.getElementById('filter-sheet-overlay').classList.remove('open');
};
window.closeAddEntryModal = window.closeModal; // Alias

// Toggle Theme Logic (Dark/Light Only)
// Check for saved theme preference
const savedTheme = localStorage.getItem('mess_theme_mode');
if (savedTheme === 'dark') {
    document.documentElement.style.setProperty('--md-sys-color-background', '#111111');
    document.documentElement.style.setProperty('--md-sys-color-on-background', '#e3e3e3');
    document.documentElement.style.setProperty('--md-sys-color-surface', '#111111');
    document.documentElement.style.setProperty('--md-sys-color-surface-container', '#1e1f20');
    document.documentElement.style.setProperty('--md-sys-color-on-surface', '#e3e3e3');
    document.documentElement.style.setProperty('--gmail-search-bg', '#2e3135');
    document.documentElement.style.setProperty('--gmail-search-text', '#e3e3e3');
    state.theme = 'dark';
}

window.toggleTheme = function () {
    if (state.theme === 'light') {
        applyDarkTheme();
    } else {
        applyLightTheme();
    }
    closeDrawer();
};

function applyDarkTheme() {
    const root = document.documentElement;
    // Dark Mode - iOS Design System
    root.style.setProperty('--ios-bg', '#000000');
    root.style.setProperty('--ios-card', '#1C1C1E');
    root.style.setProperty('--ios-card-alt', '#2C2C2E');
    root.style.setProperty('--ios-elevated', '#2C2C2E');
    root.style.setProperty('--ios-text-primary', '#FFFFFF');
    root.style.setProperty('--ios-text-secondary', '#EBEBF5');
    root.style.setProperty('--ios-text-tertiary', '#8E8E93');
    root.style.setProperty('--ios-separator', 'rgba(84, 84, 88, 0.65)');
    root.style.setProperty('--ios-fill', 'rgba(120, 120, 128, 0.36)');

    root.style.setProperty('--color-bg', '#000000');
    root.style.setProperty('--color-card', '#1C1C1E');
    root.style.setProperty('--color-text', '#FFFFFF');
    root.style.setProperty('--color-text-secondary', '#EBEBF5');
    root.style.setProperty('--color-text-tertiary', '#8E8E93');
    root.style.setProperty('--color-separator', 'rgba(84, 84, 88, 0.65)');

    state.theme = 'dark';
    localStorage.setItem('mess_theme_mode', 'dark');
}

function applyLightTheme() {
    const root = document.documentElement;
    // Light Mode - iOS Design System
    root.style.setProperty('--ios-bg', '#F2F2F7');
    root.style.setProperty('--ios-card', '#FFFFFF');
    root.style.setProperty('--ios-card-alt', '#FFFFFF');
    root.style.setProperty('--ios-elevated', '#FFFFFF');
    root.style.setProperty('--ios-text-primary', '#000000');
    root.style.setProperty('--ios-text-secondary', '#3C3C43');
    root.style.setProperty('--ios-text-tertiary', '#8E8E93');
    root.style.setProperty('--ios-separator', 'rgba(60, 60, 67, 0.12)');
    root.style.setProperty('--ios-fill', 'rgba(120, 120, 128, 0.12)');

    root.style.setProperty('--color-bg', '#F2F2F7');
    root.style.setProperty('--color-card', '#FFFFFF');
    root.style.setProperty('--color-text', '#000000');
    root.style.setProperty('--color-text-secondary', '#3C3C43');
    root.style.setProperty('--color-text-tertiary', '#8E8E93');
    root.style.setProperty('--color-separator', 'rgba(60, 60, 67, 0.12)');

    state.theme = 'light';
    localStorage.setItem('mess_theme_mode', 'light');
}

// Restore theme from localStorage on page load
// If no saved theme, defaults to system preference (handled by CSS @media)
(function restoreTheme() {
    const savedTheme = localStorage.getItem('mess_theme_mode');
    if (savedTheme === 'dark') {
        applyDarkTheme();
    } else if (savedTheme === 'light') {
        applyLightTheme();
    }
    // If no saved theme, CSS @media (prefers-color-scheme) handles it
})();



// ...

function updateFilterChips() {
    const container = document.getElementById('filter-chips-row');
    if (!container) return;

    let html = '';

    // Date Chip
    if (filterState.type === 'date' && filterState.date) {
        html += `<div class="search-chip active" onclick="openSearchFilterModal()">
                    Date: ${filterState.date} <span class="material-symbols-outlined" onclick="event.stopPropagation(); removeFilterChip('date')">close</span>
                 </div>`;
    }
    // Month Chip
    if (filterState.type === 'month' && filterState.month) {
        html += `<div class="search-chip active" onclick="openSearchFilterModal()">
                    Month: ${filterState.month} <span class="material-symbols-outlined" onclick="event.stopPropagation(); removeFilterChip('month')">close</span>
                 </div>`;
    }
    // Year Chip
    if (filterState.type === 'year' && filterState.year) {
        html += `<div class="search-chip active" onclick="openSearchFilterModal()">
                    Year: ${filterState.year} <span class="material-symbols-outlined" onclick="event.stopPropagation(); removeFilterChip('year')">close</span>
                 </div>`;
    }

    // Helper functionality chips (Reset if active)
    if (filterState.type !== 'all') {
        html += `<div class="search-chip" onclick="clearAllFilters()" style="background:var(--md-sys-color-error-container); color:var(--md-sys-color-on-error-container);">
                    Reset Filters
                 </div>`;
    }

    container.innerHTML = html;
}

// --- Logic ---

// --- Logic ---

// Helper for Local Date String (YYYY-MM-DD)
function getLocalDateString() {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

async function getPricingRate(dateStr) {
    // In Local API mode, the Server calculates amount on Save.
    // However, for immediate UI display (Bill Preview), we might need it.

    if (state.pricingRules.length === 0) {
        await fetchPricingRules(true);
    }

    const date = new Date(dateStr);
    // Sort copy to prevent in-place mutation of state
    const sortedRules = [...state.pricingRules].sort((a, b) => new Date(b.start_date) - new Date(a.start_date));

    const applicableRule = sortedRules.find(rule => {
        const start = new Date(rule.start_date);
        const end = rule.end_date ? new Date(rule.end_date) : null;
        // Check date range (Inclusive)
        // Note: Date comparison works fine with standard YYYY-MM-DD strings in JS
        return date >= start && (!end || date <= end);
    });

    if (applicableRule) {
        return {
            morning: parseFloat(applicableRule.morning_rate) || 0,
            evening: parseFloat(applicableRule.evening_rate) || 0
        };
    }

    return { morning: 46, evening: 46 };
}

// ... fetchEntries ...

// ... saveEntry ...

// --- Data Functions (Google Sheets Backend) ---

window.fetchEntries = async function () {
    try {
        const response = await fetchWithTimeout(`${GOOGLE_APPS_SCRIPT_URL}?path=entries&action=get`);
        if (!response.ok) throw new Error('Failed to fetch entries');

        const data = await response.json();
        state.entries = Array.isArray(data) ? data.map(e => {
            // Normalize property names to lowercase (Google Sheets returns with Capital letters)
            const normalized = {};
            for (const key in e) {
                normalized[key.toLowerCase()] = e[key];
            }
            return normalized;
        }) : [];

        // Sort entries by date (newest first)
        state.entries.sort((a, b) => {
            const dateA = a.date ? new Date(a.date) : new Date(0);
            const dateB = b.date ? new Date(b.date) : new Date(0);
            return dateB - dateA; // Descending order (newest first)
        });

        renderEntries(state.entries);
        populateReportMonths();
        populateBillMonths();
    } catch (err) {
        console.error('Fetch entries error:', err);

        // User-friendly error message
        if (err.message.includes('timeout')) {
            alert('⚠️ Connection timeout. Please check your internet and try again.');
        } else if (err.message.includes('Failed to fetch')) {
            alert('⚠️ Cannot connect to Google Sheets. Please check your internet connection.');
        } else {
            alert('Failed to load data: ' + err.message);
        }

        // Use empty state
        state.entries = [];
        renderEntries([]);
    }
};

// --- SEARCH & FILTER FUNCTIONS ---

// Current filter state
let currentFilterType = 'all';
let currentFilterValue = null;

// Handle real-time search with smart date matching
window.handleSearch = function (query) {
    query = query.trim().toLowerCase();

    if (!query) {
        // Reset to show all entries
        const sorted = [...state.entries].sort((a, b) => b.date.localeCompare(a.date));
        renderEntries(sorted);
        return;
    }

    // Helper: Format date to multiple searchable formats
    const formatDateForSearch = (dateStr) => {
        if (!dateStr) return [];
        try {
            const d = new Date(dateStr);
            if (isNaN(d.getTime())) return [dateStr];

            const day = d.getDate();
            const dayPad = String(day).padStart(2, '0');
            const monthShort = d.toLocaleDateString('en-US', { month: 'short' }).toLowerCase(); // jan, feb
            const monthLong = d.toLocaleDateString('en-US', { month: 'long' }).toLowerCase(); // january
            const monthNum = String(d.getMonth() + 1).padStart(2, '0');
            const year = d.getFullYear();

            // Return multiple formats for matching
            return [
                dateStr,                           // 2026-01-09
                `${dayPad}-${monthShort}`,         // 09-jan
                `${day}-${monthShort}`,            // 9-jan
                `${dayPad} ${monthShort}`,         // 09 jan
                `${day} ${monthShort}`,            // 9 jan
                `${monthShort} ${day}`,            // jan 9
                `${monthShort} ${dayPad}`,         // jan 09
                `${dayPad}/${monthNum}`,           // 09/01
                `${day}/${monthNum}`,              // 9/01
                `${monthNum}-${dayPad}`,           // 01-09
                monthShort,                        // jan
                monthLong,                         // january
                String(year),                      // 2026
                `${monthShort} ${year}`,           // jan 2026
                `${monthLong} ${year}`,            // january 2026
            ];
        } catch (e) {
            return [dateStr];
        }
    };

    // Search in multiple fields with smart date matching
    const filtered = state.entries.filter(e => {
        if (!e) return false;

        // Get all searchable date formats
        const dateFormats = formatDateForSearch(e.date);
        const dateMatch = dateFormats.some(fmt => fmt.toLowerCase().includes(query));

        const dayStr = String(e.day || '').toLowerCase();
        const morningStr = String(e.morning || '');
        const eveningStr = String(e.evening || '');
        const amountStr = String(e.amount || '');

        return dateMatch ||
            dayStr.includes(query) ||
            morningStr.includes(query) ||
            eveningStr.includes(query) ||
            amountStr.includes(query);
    });

    // Sort and render results
    const sorted = filtered.sort((a, b) => b.date.localeCompare(a.date));
    renderEntries(sorted, true); // true = isSearch mode
};

// Open search filter modal
window.openSearchFilterModal = function () {
    document.getElementById('search-filter-modal').classList.add('open');

    // Populate year chips
    const yearContainer = document.getElementById('year-chips-container');
    if (yearContainer) {
        const years = new Set();
        state.entries.forEach(e => {
            if (e.date) years.add(e.date.substring(0, 4));
        });
        // Add current year if no entries
        years.add(new Date().getFullYear().toString());

        const sortedYears = Array.from(years).sort().reverse();
        yearContainer.innerHTML = sortedYears.map(y =>
            `<button class="filter-chip-option ${currentFilterValue === y ? 'active' : ''}" 
                    onclick="selectYear('${y}')">${y}</button>`
        ).join('');
    }
};

// Set filter type (all, date, month, year)
window.setFilterType = function (type) {
    currentFilterType = type;

    // Update chip UI
    document.querySelectorAll('.chip-group-select .filter-chip-option').forEach(chip => {
        chip.classList.toggle('active', chip.dataset.type === type);
    });

    // Show/hide appropriate input
    document.getElementById('filter-input-date').style.display = type === 'date' ? 'block' : 'none';
    document.getElementById('filter-input-month').style.display = type === 'month' ? 'block' : 'none';
    document.getElementById('filter-input-year').style.display = type === 'year' ? 'block' : 'none';
};

// Select year from chips
window.selectYear = function (year) {
    currentFilterValue = year;

    // Update year chip UI
    document.querySelectorAll('#year-chips-container .filter-chip-option').forEach(chip => {
        chip.classList.toggle('active', chip.textContent === year);
    });
};

// Apply advanced filters
window.applyAdvancedFilters = function () {
    let filtered = [...state.entries];

    if (currentFilterType === 'all') {
        // No filter, show all
    } else if (currentFilterType === 'date') {
        const date = document.getElementById('adv-filter-date').value;
        if (date) {
            filtered = filtered.filter(e => e.date === date);
        }
    } else if (currentFilterType === 'month') {
        const month = document.getElementById('adv-filter-month').value;
        if (month) {
            filtered = filtered.filter(e => e.date && e.date.startsWith(month));
        }
    } else if (currentFilterType === 'year') {
        if (currentFilterValue) {
            filtered = filtered.filter(e => e.date && e.date.startsWith(currentFilterValue));
        }
    }

    // Sort and render
    const sorted = filtered.sort((a, b) => b.date.localeCompare(a.date));
    renderEntries(sorted, true);

    // Close modal
    closeModal();

    // Update search input placeholder to show filter is active
    const searchInput = document.getElementById('search-input');
    if (searchInput && currentFilterType !== 'all') {
        searchInput.placeholder = `Filtered by ${currentFilterType}...`;
    }

    showToast(`🔍 Showing ${filtered.length} entries`, 'info');
};

// Clear all filters
window.clearAllFilters = function () {
    currentFilterType = 'all';
    currentFilterValue = null;

    // Reset UI
    document.querySelectorAll('.chip-group-select .filter-chip-option').forEach(chip => {
        chip.classList.toggle('active', chip.dataset.type === 'all');
    });
    document.getElementById('filter-input-date').style.display = 'none';
    document.getElementById('filter-input-month').style.display = 'none';
    document.getElementById('filter-input-year').style.display = 'none';

    document.getElementById('adv-filter-date').value = '';
    document.getElementById('adv-filter-month').value = '';

    // Reset search input
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.value = '';
        searchInput.placeholder = 'Search entries...';
    }

    // Render all entries
    const sorted = [...state.entries].sort((a, b) => b.date.localeCompare(a.date));
    renderEntries(sorted);

    closeModal();
    showToast('🔄 Filters cleared', 'info');
};

window.saveEntry = async function () {
    const dateInput = document.getElementById('new-date');
    const morning = parseInt(document.getElementById('new-morning').value) || 0;
    const evening = parseInt(document.getElementById('new-evening').value) || 0;

    if (!dateInput || !dateInput.value) {
        return alert('Please select a date');
    }

    const dateStr = dateInput.value;
    const dateObj = new Date(dateStr);
    const day = dateObj.toLocaleDateString('en-US', { weekday: 'long' });
    const month = dateStr.substring(0, 7);
    const year = parseInt(dateStr.substring(0, 4));
    const total = morning + evening;

    // Calculate amount using pricing rules
    const rates = await getPricingRate(dateStr);
    const amount = (morning * rates.morning) + (evening * rates.evening);

    const entry = {
        date: dateStr,
        day: day,
        morning: morning,
        evening: evening,
        total: total,
        month: month,
        year: year,
        amount: amount
    };

    // Check if updating existing or adding new
    const existingIndex = state.entries.findIndex(e => e.date === dateStr);
    const isUpdate = existingIndex !== -1;
    const oldEntry = isUpdate ? { ...state.entries[existingIndex] } : null;

    // OPTIMISTIC UPDATE: Update state immediately
    if (isUpdate) {
        state.entries[existingIndex] = entry;
    } else {
        state.entries.push(entry);
    }

    // Re-render UI instantly (sort by date desc)
    const sorted = [...state.entries].sort((a, b) => b.date.localeCompare(a.date));
    renderEntries(sorted);

    // Close modal and show success immediately
    closeModal();
    showToast('✅ Entry saved!', 'success');

    // Update cache immediately
    if (window.saveToCache) saveToCache(state.entries, null);

    // API call in background
    try {
        const response = await fetch(`${GOOGLE_APPS_SCRIPT_URL}?path=entries&action=add`, {
            method: 'POST',
            body: JSON.stringify(entry)
        });

        if (!response.ok) {
            throw new Error('Failed to save on server');
        }
    } catch (err) {
        console.error('Save entry error:', err);
        // ROLLBACK: Restore old state
        if (isUpdate) {
            state.entries[existingIndex] = oldEntry;
        } else {
            const idx = state.entries.findIndex(e => e.date === dateStr);
            if (idx !== -1) state.entries.splice(idx, 1);
        }
        const sorted = [...state.entries].sort((a, b) => b.date.localeCompare(a.date));
        renderEntries(sorted);
        if (window.saveToCache) saveToCache(state.entries, null);
        showToast('❌ Save failed, changes reverted', 'error');
    }
};




// --- Delete Entry Function with OPTIMISTIC UI UPDATE ---
window.deleteEntry = async function () {
    let date = document.getElementById('detail-id')?.value || document.getElementById('new-date')?.value;
    if (!date) return alert('No entry selected');
    const entryIndex = state.entries.findIndex(e => e.date === date);
    if (entryIndex === -1 || !confirm('Delete this entry permanently?')) return;

    // Store backup for rollback
    const deletedEntry = state.entries[entryIndex];

    // OPTIMISTIC UPDATE: Remove from state immediately
    state.entries.splice(entryIndex, 1);

    // Re-render UI instantly (sort by date desc)
    const sorted = [...state.entries].sort((a, b) => b.date.localeCompare(a.date));
    renderEntries(sorted);

    // Close modal and show success immediately
    closeModal();
    showToast('🗑️ Entry deleted!', 'success');

    // Update cache immediately
    if (window.saveToCache) saveToCache(state.entries, null);

    // API call in background
    try {
        const payload = { date: deletedEntry.date };
        if (deletedEntry.id) payload.id = deletedEntry.id;
        const response = await fetch(`${GOOGLE_APPS_SCRIPT_URL}?path=entries&action=delete`, {
            method: 'POST',
            body: JSON.stringify(payload)
        });
        if (!response.ok) {
            throw new Error('Delete failed on server');
        }
    } catch (e) {
        console.error('Delete entry error:', e);
        // ROLLBACK: Restore the entry
        state.entries.push(deletedEntry);
        const sorted = [...state.entries].sort((a, b) => b.date.localeCompare(a.date));
        renderEntries(sorted);
        if (window.saveToCache) saveToCache(state.entries, null);
        showToast('❌ Delete failed, entry restored', 'error');
    }
};
// --- Bill Generation ---

window.populateBillMonths = function () {
    const select = document.getElementById('bill-month-select');
    if (!select) return;

    // Get unique months from entries
    const months = new Set();
    state.entries.forEach(e => {
        if (e.date) months.add(e.date.substring(0, 7));
    });

    // Convert to array and sort desc
    const sorted = Array.from(months).sort().reverse();

    select.innerHTML = sorted.map(m => {
        const [y, mo] = m.split('-');
        const name = new Date(y, mo - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        return `<option value="${m}">${name}</option>`;
    }).join('');

    if (sorted.length === 0) {
        select.innerHTML = '<option>No Data Available</option>';
    }
};



// --- Toggle Bill Date Inputs (Month vs Custom Range) ---
window.toggleBillDateInputs = function () {
    const filterType = document.getElementById('bill-filter-type').value;
    const monthContainer = document.getElementById('bill-month-container');
    const customContainer = document.getElementById('bill-custom-container');

    if (filterType === 'month') {
        monthContainer.style.display = 'block';
        customContainer.style.display = 'none';
    } else {
        monthContainer.style.display = 'none';
        customContainer.style.display = 'block';
        // Set default dates (current month)
        const today = new Date();
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        document.getElementById('bill-start-date').valueAsDate = startOfMonth;
        document.getElementById('bill-end-date').valueAsDate = today;
    }
};

window.generateBillPreview = async function () {
    const filterType = document.getElementById('bill-filter-type')?.value || 'month';
    let filteredEntries = [];
    let periodLabel = '';

    if (filterType === 'month') {
        const month = document.getElementById('bill-month-select').value;
        if (!month || month.includes('No Data')) return alert('Select a month with data');

        filteredEntries = state.entries
            .filter(e => e.date && e.date.startsWith(month))
            .map(e => ({ ...e }));

        const [y, mo] = month.split('-');
        periodLabel = new Date(y, mo - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        // Keep month for getBillHTML compatibility
        window._currentBillMonth = month;
    } else {
        // Custom date range
        const startDate = document.getElementById('bill-start-date').value;
        const endDate = document.getElementById('bill-end-date').value;

        if (!startDate || !endDate) return alert('Please select both start and end dates');
        if (startDate > endDate) return alert('Start date must be before end date');

        filteredEntries = state.entries
            .filter(e => e.date && e.date >= startDate && e.date <= endDate)
            .map(e => ({ ...e }));

        const startD = new Date(startDate);
        const endD = new Date(endDate);
        periodLabel = startD.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) +
            ' to ' + endD.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    }

    if (filteredEntries.length === 0) {
        return alert('No entries found for selected period');
    }

    showLoader('Calculating Bill...');

    try {
        // Use map to create a shallow copy so we don't mutate state.entries amounts permanently
        const monthEntries = filteredEntries;

        let mTotal = 0, eTotal = 0, gTotal = 0;

        // Sort by date asc
        monthEntries.sort((a, b) => a.date.localeCompare(b.date));

        for (const e of monthEntries) {
            mTotal += (e.morning || 0);
            eTotal += (e.evening || 0);

            // Logic: If amount is 0 (imported) OR strict recalculation is desired?
            // Usually, if amount > 0 it's "Saved". But for Preview, we might want dynamic.
            // Let's trust saved amount if it exists, BUT for imported data (0), definitely calc.
            // Actually, to fix "Micro error", if the user updated Pricing Rule, they expect the bill to change.
            // So we should PREFER calculated amount based on Current Rules for the PREVIEW.
            // Limitation: If historical rates were different, this might override them visually. 
            // But this is a "Generation" action.

            const rates = await getPricingRate(e.date);
            const calculated = (e.morning * rates.morning) + (e.evening * rates.evening);

            // Use calculated amount for consistency with current rules
            e.amount = calculated;

            gTotal += (e.amount || 0);
        }

        // Update Mobile Card UI
        document.getElementById('bill-morning-count').textContent = mTotal;
        document.getElementById('bill-evening-count').textContent = eTotal;
        document.getElementById('bill-total-tiffins').textContent = mTotal + eTotal;
        document.getElementById('bill-total-amount').textContent = `₹${gTotal}`;

        document.getElementById('bill-period-display').textContent = periodLabel;

        document.getElementById('bill-card').style.display = 'block';

        // Populate Printable Container
        const billHTML = getBillHTML(periodLabel, monthEntries, mTotal, eTotal, gTotal);
        document.getElementById('printable-bill-container').innerHTML = billHTML;

    } catch (e) {
        console.error(e);
        alert('Error generating bill');
    } finally {
        hideLoader();
    }
};


// ... getBillHTML ...
window.getBillHTML = function (periodLabel, entries, mTotal, eTotal, gTotal) {
    // Use periodLabel directly as the title (works for both month and custom range)
    const monthName = periodLabel;

    return `
        <div style="padding:20px;font-family:sans-serif;">
            <h2 style="text-align:center;margin-bottom:24px;color:#333;">Mess Bill - ${monthName}</h2>
            <table style="width:100%;border-collapse:collapse;">
                <thead>
                    <tr style="background:#f5f5f5;">
                        <th style="padding:8px;text-align:left;border-bottom:2px solid #ddd;">Date</th>
                        <th style="padding:8px;text-align:center;border-bottom:2px solid #ddd;">Morning</th>
                        <th style="padding:8px;text-align:center;border-bottom:2px solid #ddd;">Evening</th>
                        <th style="padding:8px;text-align:center;border-bottom:2px solid #ddd;">Total</th>
                        <th style="padding:8px;text-align:right;border-bottom:2px solid #ddd;">Amount</th>
                    </tr>
                </thead>
                <tbody>
                    ${entries.map(e => `
                        <tr>
                            <td style="padding:8px;border-bottom:1px solid #eee;">${new Date(e.date).toLocaleDateString('en-IN')}</td>
                            <td style="padding:8px;text-align:center;border-bottom:1px solid #eee;">${e.morning}</td>
                            <td style="padding:8px;text-align:center;border-bottom:1px solid #eee;">${e.evening}</td>
                            <td style="padding:8px;text-align:center;border-bottom:1px solid #eee;">${e.total}</td>
                            <td style="padding:8px;text-align:right;border-bottom:1px solid #eee;">₹${e.amount || 0}</td>
                        </tr>
                    `).join('')}
                </tbody>
                <tfoot>
                    <tr style="background:#f5f5f5;font-weight:bold;">
                        <td style="padding:12px;border-top:2px solid #ddd;">TOTAL</td>
                        <td style="padding:12px;text-align:center;border-top:2px solid #ddd;">${mTotal}</td>
                        <td style="padding:12px;text-align:center;border-top:2px solid #ddd;">${eTotal}</td>
                        <td style="padding:12px;text-align:center;border-top:2px solid #ddd;">${mTotal + eTotal}</td>
                        <td style="padding:12px;text-align:right;border-top:2px solid #ddd;">₹${gTotal}</td>
                    </tr>
                </tfoot>
            </table>
            <div style="margin-top:30px;font-size:12px;color:#777;text-align:center;">
                Generated on ${new Date().toLocaleString('en-IN')}
            </div>
        </div>
    `;
};

// ... printBill ...
// ... exportBillExcel ...

// --- Pricing Rules ---

// Pricing Rules Cache
let pricingRulesCache = null;
let pricingRulesLastFetch = 0;
const CACHE_DURATION = 60000; // 1 minute

window.fetchPricingRules = async function (silent = false) {
    const now = Date.now();

    // Use cache if available and fresh
    if (pricingRulesCache && (now - pricingRulesLastFetch) < CACHE_DURATION && !silent) {
        state.pricingRules = pricingRulesCache;
        if (!silent) renderPricingRules();
        return;
    }

    try {
        const response = await fetchWithTimeout(`${GOOGLE_APPS_SCRIPT_URL}?path=pricing&action=get`);
        if (!response.ok) throw new Error('Failed to fetch pricing');

        const data = await response.json();
        // Apps Script returns array - normalize property names to lowercase
        state.pricingRules = Array.isArray(data) ? data.map(rule => {
            const normalized = {};
            for (const key in rule) {
                normalized[key.toLowerCase()] = rule[key];
            }
            return normalized;
        }) : [];

        // Update cache
        pricingRulesCache = state.pricingRules;
        pricingRulesLastFetch = now;

        if (!silent) renderPricingRules();
    } catch (err) {
        console.error('Fetch pricing error:', err);
        // Ensure we render existing state (or empty state) even on error so page isn't blank
        if (!silent) renderPricingRules();
    }
};

window.renderPricingRules = function () {
    const container = document.getElementById('pricing-list');
    if (!container) {
        console.error('pricing-list container not found in HTML!');
        return;
    }

    // Sort for display (Latest First)
    const sorted = [...state.pricingRules].sort((a, b) => new Date(b.start_date) - new Date(a.start_date));

    if (sorted.length === 0) {
        container.innerHTML = `
            <div class="card" style="text-align:center; padding:32px 16px;">
                <span class="material-symbols-outlined" style="font-size:48px; color:var(--md-sys-color-on-surface-variant); opacity:0.3;">price_change</span>
                <div style="margin-top:12px; font-size:14px; color:var(--md-sys-color-on-surface-variant);">
                    No custom pricing rules defined
                </div>
                <div style="margin-top:4px; font-size:12px; color:var(--md-sys-color-on-surface-variant); opacity:0.7;">
                    Default rate: ₹46 per tiffin
                </div>
                <div style="margin-top:16px;">
                    <button class="btn-filled" onclick="openPricingModal()" style="width:auto; padding: 12px 24px;">
                        <span class="material-symbols-outlined" style="font-size:18px; margin-right:4px;">add</span>
                        Add First Rule
                    </button>
                </div>
            </div>
        `;
        return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize today

    // Add New Rule button at top
    let html = `
        <div style="margin-bottom:16px; text-align:right;">
            <button class="btn-filled" onclick="openPricingModal()" style="width:auto; padding: 10px 20px;">
                <span class="material-symbols-outlined" style="font-size:18px; margin-right:6px;">add</span>
                Add New Rule
            </button>
        </div>
    `;

    html += sorted.map(rule => {
        const start = new Date(rule.start_date);
        const end = rule.end_date ? new Date(rule.end_date) : null;

        let status = '';
        let statusClass = '';

        if (end && end < today) {
            status = 'Expired';
            statusClass = 'status-expired';
        } else if (start > today) {
            status = 'Upcoming';
            statusClass = 'status-upcoming';
        } else {
            status = 'Active';
            statusClass = 'status-active';
        }

        const startStr = start.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
        const endStr = end ? end.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Ongoing';

        const m = parseFloat(rule.morning_rate) || 0;
        const e = parseFloat(rule.evening_rate) || 0;

        return `
        <div class="card" style="padding: 12px; margin-bottom: 12px; border-left: 4px solid var(--md-sys-color-primary);">
            <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:8px;">
                <div style="font-weight:600; font-size:14px; color:var(--md-sys-color-on-surface);">
                    ${startStr} - ${endStr}
                </div>
                <span class="status-badge ${statusClass}">${status}</span>
            </div>
            
            <div style="display:flex; gap:16px; margin-bottom:12px; color:var(--md-sys-color-on-surface-variant); font-size:13px;">
                <div>Morning: <strong style="color:var(--md-sys-color-on-surface);">₹${m}</strong></div>
                <div>Evening: <strong style="color:var(--md-sys-color-on-surface);">₹${e}</strong></div>
            </div>

            <div style="display:flex; justify-content:flex-end; gap:8px;">
                 <button class="btn-filled" style="width:auto; padding: 6px 12px; height:32px; font-size:12px; background:var(--md-sys-color-secondary-container); color:var(--md-sys-color-on-secondary-container); box-shadow:none;" 
                    onclick="editPricingRule('${rule.id}')">
                    Edit
                 </button>
                 <button class="btn-filled" style="width:auto; padding: 6px 12px; height:32px; font-size:12px; background:var(--md-sys-color-error-container); color:var(--md-sys-color-on-error-container); box-shadow:none;" 
                    onclick="deletePricingRule('${rule.id}')">
                    Delete
                 </button>
            </div>
        </div>`;
    }).join('');

    container.innerHTML = html;
};

window.openPricingModal = function () {
    // Reset pricing form
    const idEl = document.getElementById('price-id');
    if (idEl) idEl.value = ''; // Clear ID for new rule
    document.querySelector('#pricing-modal .modal-title').textContent = 'New Pricing Rule';

    document.getElementById('price-start').value = new Date().toISOString().split('T')[0];
    document.getElementById('price-end').value = '';
    document.getElementById('price-morning').value = '46';
    document.getElementById('price-evening').value = '46';

    document.getElementById('pricing-modal').classList.add('open');
};

window.editPricingRule = function (id) {
    const rule = state.pricingRules.find(r => r.id == id); // Loose equality
    if (!rule) return;

    // Helper to format date to YYYY-MM-DD (HTML date input format)
    const formatDate = (dateValue) => {
        if (!dateValue) return '';
        // If already in YYYY-MM-DD format
        if (typeof dateValue === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
            return dateValue;
        }
        // Convert from ISO or any format to YYYY-MM-DD
        try {
            const d = new Date(dateValue);
            if (isNaN(d.getTime())) return '';
            return d.toISOString().split('T')[0];
        } catch (e) {
            return '';
        }
    };

    // Open Modal
    document.getElementById('pricing-modal').classList.add('open');
    document.querySelector('#pricing-modal .modal-title').textContent = 'Edit Pricing Rule';

    // Fill values with properly formatted dates
    const idEl = document.getElementById('price-id');
    if (idEl) idEl.value = rule.id;
    document.getElementById('price-start').value = formatDate(rule.start_date);
    document.getElementById('price-end').value = formatDate(rule.end_date);
    document.getElementById('price-morning').value = rule.morning_rate;
    document.getElementById('price-evening').value = rule.evening_rate;
};

window.savePricingRule = async function () {
    const idEl = document.getElementById('price-id');
    const id = idEl ? idEl.value : null;
    const start = document.getElementById('price-start').value;
    const end = document.getElementById('price-end').value || null;
    let mRate = document.getElementById('price-morning').value;
    let eRate = document.getElementById('price-evening').value;

    if (!start) return alert('Start Date required');

    // Parse Float to ensure numbers
    mRate = parseFloat(mRate);
    eRate = parseFloat(eRate);

    const isEdit = !!id;

    const ruleData = {
        id: isEdit ? id : Date.now(), // Temp ID for new rules
        start_date: start,
        end_date: end,
        morning_rate: mRate,
        evening_rate: eRate
    };

    // Store backup for rollback
    const existingIndex = state.pricingRules.findIndex(r => r.id == id);
    const oldRule = isEdit && existingIndex !== -1 ? { ...state.pricingRules[existingIndex] } : null;

    // OPTIMISTIC UPDATE: Update state immediately
    if (isEdit && existingIndex !== -1) {
        state.pricingRules[existingIndex] = ruleData;
    } else {
        state.pricingRules.push(ruleData);
    }

    // Re-render UI instantly
    renderPricingRules();

    // Close modal and show success immediately
    closeModal();
    showToast(`💰 Pricing rule ${isEdit ? 'updated' : 'added'}!`, 'success');

    // Invalidate cache
    pricingRulesCache = null;
    if (window.saveToCache) saveToCache(null, state.pricingRules);

    // API call in background
    try {
        const action = isEdit ? 'update' : 'add';
        const url = `${GOOGLE_APPS_SCRIPT_URL}?path=pricing&action=${action}`;

        const response = await fetch(url, {
            method: 'POST',
            body: JSON.stringify(ruleData)
        });

        if (!response.ok) {
            throw new Error('Server rejected the request');
        }

        // Get actual ID from server for new rules
        if (!isEdit) {
            const result = await response.json();
            if (result.id) {
                const tempIndex = state.pricingRules.findIndex(r => r.id === ruleData.id);
                if (tempIndex !== -1) {
                    state.pricingRules[tempIndex].id = result.id;
                }
            }
        }

    } catch (e) {
        console.error(e);
        // ROLLBACK: Restore old state
        if (isEdit && oldRule) {
            const idx = state.pricingRules.findIndex(r => r.id == id);
            if (idx !== -1) state.pricingRules[idx] = oldRule;
        } else {
            const idx = state.pricingRules.findIndex(r => r.id === ruleData.id);
            if (idx !== -1) state.pricingRules.splice(idx, 1);
        }
        renderPricingRules();
        if (window.saveToCache) saveToCache(null, state.pricingRules);
        showToast('❌ Failed to save pricing rule', 'error');
    }
};

// --- Data Management ---

window.exportData = function () {
    if (state.entries.length === 0) return alert('No data to backup');

    // Create JSON Blob
    const dataStr = JSON.stringify(state.entries, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `mess_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};

window.triggerImport = function () {
    document.getElementById('import-file').click();
};

window.importData = function (input) {
    const file = input.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async function (e) {
        try {
            let importedData = JSON.parse(e.target.result);
            let entriesToRestore = [];

            // Helper: Recursively search for an array that looks like entries (has 'date')
            function findEntries(obj) {
                if (!obj) return null;
                if (Array.isArray(obj)) {
                    if (obj.length > 0 && obj[0].date) return obj;
                    if (obj.length === 0) return obj;
                    return null;
                }
                if (typeof obj === 'object') {
                    for (const key in obj) {
                        const found = findEntries(obj[key]);
                        if (found) return found;
                    }
                }
                return null;
            }

            // 1. Try direct search logic first
            if (Array.isArray(importedData)) entriesToRestore = importedData;
            else if (importedData.entries && Array.isArray(importedData.entries)) entriesToRestore = importedData.entries;
            else if (importedData.data && Array.isArray(importedData.data)) entriesToRestore = importedData.data;
            else {
                const found = findEntries(importedData);
                if (found) entriesToRestore = found;
                else if (typeof importedData === 'object' && importedData.date) entriesToRestore = [importedData];
                else throw new Error('Could not find any entry data in the file.');
            }

            // Validate content
            if (entriesToRestore.length === 0) throw new Error('File contains no entries.');
            if (!entriesToRestore[0].date) throw new Error('Entries missing "date" field.');

            if (!confirm(`Found ${entriesToRestore.length} entries. Import to Google Sheets?`)) {
                input.value = '';
                return;
            }

            showLoader(`Importing ${entriesToRestore.length} entries...`);

            // Batch import to Google Sheets
            let successCount = 0;
            let failedCount = 0;
            let firstError = null;

            for (const entry of entriesToRestore) {
                try {
                    const response = await fetch(`${GOOGLE_APPS_SCRIPT_URL}?path=entries&action=add`, {
                        method: 'POST',
                        body: JSON.stringify(entry)
                    });

                    if (response.ok) {
                        successCount++;
                    } else {
                        failedCount++;
                        if (!firstError) {
                            const errorData = await response.json();
                            firstError = errorData.error || 'Unknown error';
                        }
                    }
                } catch (err) {
                    failedCount++;
                    if (!firstError) firstError = err.message;
                }
            }

            hideLoader();

            await fetchEntries();

            alert(`Import Complete!\nSuccess: ${successCount}\nFailed: ${failedCount}${firstError ? `\n\nFirst occurred error: ${firstError}` : ''}`);

        } catch (err) {
            hideLoader();
            console.error(err);
            alert('Import failed: ' + err.message);
        } finally {
            input.value = '';
        }
    };
    reader.readAsText(file);
};

window.clearAllData = async function () {
    if (!confirm('⚠️ WARNING: This will delete ALL entries from Google Sheets permanently.\nAre you sure?')) return;

    // Note: Google Sheets backend doesn't have a bulk delete endpoint yet
    // For now, we'll just clear the local state and let user know to manually clear sheet
    alert('To clear all data from Google Sheets, please:\n1. Open your Google Sheet\n2. Delete all rows except the header\n\nLocal data has been cleared.');

    state.entries = [];
    renderEntries([]);
};

// --- Mock Data ---
function getMockData() {
    // Only used if no Supabase
    return [
        { date: '2026-01-07', day: 'Wednesday', morning: 1, evening: 1, total: 2, amount: 92 },
        { date: '2026-01-06', day: 'Tuesday', morning: 1, evening: 0, total: 1, amount: 46 }
    ];
}

// --- Charts & Reports ---
let trendChart = null;
let comparisonChart = null;

window.exportReportCSV = function () {
    const select = document.getElementById('report-month-select');
    if (!select || !select.value) return alert('Please select a month');

    const month = select.value;
    const entries = state.entries.filter(e => e.date.startsWith(month));

    if (entries.length === 0) return alert('No data for this month');

    // CSV Header
    let csv = 'Date,Day,Morning,Evening,Total,Amount\n';

    // CSV Rows
    entries.sort((a, b) => a.date.localeCompare(b.date)).forEach(e => {
        csv += `${e.date},${e.day},${e.morning},${e.evening},${e.total},${e.amount}\n`;
    });

    // Download
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Mess_Report_${month}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

// Populate Report Month Dropdown
function populateReportMonths() {
    const select = document.getElementById('report-month-select');
    if (!select) return;

    const months = new Set();
    state.entries.forEach(e => {
        if (e.date) months.add(e.date.substring(0, 7));
    });

    // Always add current month if missing
    const current = new Date().toISOString().substring(0, 7);
    months.add(current);

    const sorted = Array.from(months).sort().reverse();

    const existingVal = select.value;
    select.innerHTML = sorted.map(m => {
        const [y, mo] = m.split('-');
        const name = new Date(y, mo - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        return `<option value="${m}">${name}</option>`;
    }).join('');

    // Restore selection or default to first (current/latest)
    if (existingVal && sorted.includes(existingVal)) select.value = existingVal;
    else if (sorted.length > 0) select.value = sorted[0];
}

window.renderCharts = function () {
    if (state.entries.length === 0) return;

    // Ensure Month Select is Populated
    const select = document.getElementById('report-month-select');
    if (!select || select.options.length === 0) populateReportMonths();

    const selectedMonth = select.value || new Date().toISOString().substring(0, 7);

    // Filter Data by Month
    // Sort logic: Entry dates are ISO strings ("YYYY-MM-DD"). Filter by substring.
    // Important: We want CHRONOLOGICAL order for charts (1 -> 31)
    const monthEntries = state.entries
        .filter(e => e.date.startsWith(selectedMonth))
        .sort((a, b) => a.date.localeCompare(b.date)); // Ascending

    // --- Analytics Cards Calculation ---
    let mTotal = 0, eTotal = 0, gTotal = 0, gCount = 0;
    monthEntries.forEach(e => {
        mTotal += (e.morning || 0);
        eTotal += (e.evening || 0);
        gCount += (e.total || 0);
        gTotal += (e.amount || 0);
    });

    // Update Cards
    const safeSet = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    safeSet('report-morning', mTotal);
    safeSet('report-evening', eTotal);
    safeSet('report-total', gCount);
    safeSet('report-amount', `₹${gTotal}`);

    // --- AI Forecast (Smart Insight) ---
    // Simple Algorithm: (Current Total / Days Passed) * Total Days in Month
    const aiCard = document.getElementById('ai-insight-card');
    const aiText = document.getElementById('ai-insight-text');

    if (aiCard && aiText) {
        const now = new Date();
        const [selY, selM] = selectedMonth.split('-').map(Number);

        // Only forecast for current month
        if (now.getFullYear() === selY && (now.getMonth() + 1) === selM) {
            const dayOfMonth = now.getDate();
            const daysInMonth = new Date(selY, selM, 0).getDate();

            if (dayOfMonth > 1 && gTotal > 0) {
                const avgDaily = gTotal / dayOfMonth;
                const predicted = Math.round(avgDaily * daysInMonth);
                const savings = predicted - gTotal; // Remaining

                aiText.innerHTML = `Based on current usage, your estimated bill for this month is <strong>₹${predicted}</strong>.`;
                aiCard.style.display = 'block';
            } else {
                aiCard.style.display = 'none'; // Not enough data
            }
        } else {
            aiCard.style.display = 'none'; // Past months don't need forecast
        }
    }


    // --- Chart Data Prep ---
    const labels = monthEntries.map(e => new Date(e.date).toLocaleDateString('en-US', { day: 'numeric' }));
    const dataTotal = monthEntries.map(e => e.total);
    // const dataMorning = monthEntries.map(e => e.morning);
    // const dataEvening = monthEntries.map(e => e.evening); // Unused in trend, used in pie? No, user screenshot shows Bar chart for comparison.

    // 1. Trend Chart (Line)
    const ctxTrend = document.getElementById('chart-trend');
    if (ctxTrend) {
        if (trendChart) trendChart.destroy();
        trendChart = new Chart(ctxTrend, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Total Tiffins',
                    data: dataTotal,
                    borderColor: '#0b57d0',
                    backgroundColor: 'rgba(11, 87, 208, 0.1)',
                    tension: 0.3,
                    fill: true,
                    pointRadius: 4,
                    pointBackgroundColor: '#0b57d0' // Solid dots
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' } },
                    x: { grid: { display: false } }
                }
            }
        });
    }

    // 2. Morning vs Evening (Bar Chart now, effectively matches Screenshot's "comparative" feel)
    // Actually screenshot shows "Bar Chart" for comparison? Or just counts?
    // User image: "Morning vs Evening" -> Shows a single RED BAR? Wait, let me check the image mentally.
    // Usually it's a comparison. I'll make it a Bar Chart: Sum of Morn vs Sum of Eve.

    // Aggregate for the whole month
    const totalM = mTotal;
    const totalE = eTotal;

    const ctxComp = document.getElementById('chart-comparison');
    if (ctxComp) {
        if (comparisonChart) comparisonChart.destroy();
        comparisonChart = new Chart(ctxComp, {
            type: 'bar',
            data: {
                labels: ['Morning', 'Evening'],
                datasets: [{
                    label: 'Count',
                    data: [totalM, totalE],
                    backgroundColor: [
                        '#30004a', // Morning Purple (Matches Card)
                        '#3e2723'  // Evening Brown (Matches Card)
                    ],
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                plugins: { legend: { display: false } }, // Hide legend, colors are self explanatory
                scales: {
                    y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' } },
                    x: { grid: { display: false } }
                }
            }
        });
    }

    // 3. Monthly History Chart (New Comparison)
    renderHistoryChart();
};

let historyChart = null;
function renderHistoryChart() {
    const ctxHist = document.getElementById('chart-history');
    if (!ctxHist) return;

    // Aggregate by Month
    const monthlyData = {};
    state.entries.forEach(e => {
        const key = e.date.substring(0, 7); // YYYY-MM
        if (!monthlyData[key]) monthlyData[key] = 0;
        monthlyData[key] += (e.total || 0);
    });

    // Get last 6 months labels
    const sortedMonths = Object.keys(monthlyData).sort(); // Ascending
    const recentMonths = sortedMonths.slice(-6); // Last 6

    const labels = recentMonths.map(m => {
        const [y, mo] = m.split('-');
        return new Date(y, mo - 1).toLocaleDateString('en-US', { month: 'short' });
    });
    const data = recentMonths.map(m => monthlyData[m]);

    // Colors matching the user's desktop screenshot (Teal, Orange, Red, BlueGrey, Purple, etc.)
    const backgroundColors = [
        '#26c6da', // Cyan
        '#ffb74d', // Orange
        '#ef5350', // Red
        '#78909c', // Blue Grey
        '#ab47bc', // Purple
        '#ffa726'  // Orange Dark
    ];

    if (historyChart) historyChart.destroy();
    historyChart = new Chart(ctxHist, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Total Tiffins',
                data: data,
                backgroundColor: backgroundColors.slice(0, data.length), // Assign colors cyclically or mapped
                borderRadius: 4,
                barPercentage: 0.6
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: 'rgba(255, 255, 255, 0.05)' },
                    ticks: { color: '#9ca3af' }
                },
                x: {
                    grid: { display: false },
                    ticks: { color: '#9ca3af' }
                }
            }
        }
    });
}

// Hook renderCharts into fetchEntries/renderEntries flow
// Note: We'll call this inside renderEntries if view is reports, 
// or simpler: just call it whenever navigation switches to reports.

// --- Activity Log ---

async function logActivity(action, details, type) {
    // The server logs automatically for DB actions.
    // This function can be kept for client-specific logs if needed, or mapped to server.
    // Server doesn't have a direct 'log' endpoint exposed as POST /api/audit-log in the file read, 
    // but the server logs internally on POST/PUT/DELETE.
    // So we can make this a no-op or console.log to avoid errors.
    console.log(`[Activity] ${type}: ${action} - ${details}`);
}

window.fetchActivityLog = async function () {
    const list = document.getElementById('activity-list');
    if (!list) return;

    // Simplified activity log - shows info message since Google Sheets backend doesn't support activity logging
    list.innerHTML = `
        <div class="card" style="text-align:center; padding:32px 16px;">
            <span class="material-symbols-outlined" style="font-size:48px; color:var(--md-sys-color-on-surface-variant); opacity:0.3;">info</span>
            <div style="margin-top:12px; font-size:14px; color:var(--md-sys-color-on-surface-variant);">
                Activity logging is not available with Google Sheets backend
            </div>
            <div style="margin-top:4px; font-size:12px; color:var(--md-sys-color-on-surface-variant); opacity:0.7;">
                Your data is safely stored in Google Sheets
            </div>
        </div>
    `;
};

// --- FAB Logic ---
window.handleFabClick = function () {
    if (state.fabAction === 'pricing') {
        openPricingModal();
    } else {
        openModal(); // Compose Entry
    }
};

// --- Rendering ---
window.renderEntries = function (entries, isSearch = false) {
    const todayList = document.getElementById('entries-list-today');
    const weekList = document.getElementById('entries-list-week');
    if (!todayList || !weekList) return;

    todayList.innerHTML = '';
    weekList.innerHTML = '';

    const todayStr = getLocalDateString();
    const currentMonth = todayStr.substring(0, 7);

    // Stats Calculation for Dashboard (Only if not searching to avoid jitter)
    let monthAmount = 0;
    let monthCount = 0;
    let todayTotal = 0;
    let todayDateDisplay = new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short' });

    // Calculate stats over ALL entries, not just rendered ones, unless searching
    const statsSource = isSearch ? entries : state.entries;

    statsSource.forEach(e => {
        // Safety check for invalid entries
        if (!e || !e.date) return;

        const dateStr = String(e.date).split('T')[0]; // Handle ISO dates

        if (dateStr.startsWith(currentMonth)) {
            monthAmount += (e.amount || 0);
            if (e.total > 0) monthCount += e.total;
        }
        if (dateStr === todayStr) {
            todayTotal = e.total;
        }
    });

    // Update Dashboard Stats Card
    if (!isSearch) {
        const statsAmt = document.getElementById('stats-month-amount');
        const statsCnt = document.getElementById('stats-month-count');
        const statsToday = document.getElementById('stats-today-total');
        const statsDate = document.getElementById('stats-today-date');

        if (statsAmt) statsAmt.textContent = `₹${monthAmount}`;
        if (statsCnt) statsCnt.textContent = `${monthCount} Tiffins`;
        if (statsToday) statsToday.textContent = todayTotal;
        if (statsDate) statsDate.textContent = todayDateDisplay;
    }

    // Render Lists
    entries.forEach(entry => {
        // Skip invalid entries
        if (!entry || !entry.date) return;

        const html = createEntryCard(entry);
        const entryDateStr = String(entry.date).split('T')[0]; // Handle ISO dates

        if (isSearch) {
            todayList.innerHTML += html;
            // Show Search Header
            const t1 = document.querySelector('#view-home .section-title');
            if (t1) t1.textContent = 'SEARCH RESULTS';
            // Hide Second Header
            const t2 = document.querySelectorAll('#view-home .section-title')[1];
            if (t2) t2.style.display = 'none';
        } else {
            // Restore Headers
            const t1 = document.querySelector('#view-home .section-title');
            if (t1) t1.textContent = 'TODAY';
            const t2 = document.querySelectorAll('#view-home .section-title')[1];
            if (t2) t2.style.display = 'block';

            if (entryDateStr === todayStr) {
                todayList.innerHTML += html;
            } else {
                weekList.innerHTML += html;
            }
        }
    });

    if (todayList.innerHTML === '') {
        todayList.innerHTML = '<div class="mail-item" style="justify-content:center; opacity:0.6; padding:20px;"><span>No entries found</span></div>';
    }
};

// --- Navigation Logic (Consolidated) ---
// (Single definition at top of file - duplicate removed)



// --- Loader functions already defined at top of file ---




// --- Toggle Bill Date Inputs (Month vs Custom Range) ---
window.toggleBillDateInputs = function () {
    const filterType = document.getElementById('bill-filter-type').value;
    const monthContainer = document.getElementById('bill-month-container');
    const customContainer = document.getElementById('bill-custom-container');

    if (filterType === 'month') {
        monthContainer.style.display = 'block';
        customContainer.style.display = 'none';
    } else {
        monthContainer.style.display = 'none';
        customContainer.style.display = 'block';
        // Set default dates (current month)
        const today = new Date();
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        document.getElementById('bill-start-date').valueAsDate = startOfMonth;
        document.getElementById('bill-end-date').valueAsDate = today;
    }
};

// REMOVED DUPLICATE generateBillPreview - using the correct version above

// --- Rewritten Import Data for Mobile (Fixed) ---
window.importData = function (input) {
    const file = input.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async function (e) {
        try {
            const jsonText = e.target.result;
            let entriesToRestore = [];

            try {
                const parsed = JSON.parse(jsonText);
                // Simple Array check
                if (Array.isArray(parsed)) entriesToRestore = parsed;
                else if (parsed.entries && Array.isArray(parsed.entries)) entriesToRestore = parsed.entries;
                else if (parsed.data && Array.isArray(parsed.data)) entriesToRestore = parsed.data;
                else {
                    // Try to find array deep
                    const findArr = (obj) => {
                        for (let k in obj) {
                            if (Array.isArray(obj[k]) && obj[k].length > 0 && obj[k][0].date) return obj[k];
                            if (typeof obj[k] === 'object') {
                                const res = findArr(obj[k]);
                                if (res) return res;
                            }
                        }
                        return null;
                    };
                    entriesToRestore = findArr(parsed) || [];
                }
            } catch (e) {
                throw new Error('Invalid JSON File');
            }

            if (entriesToRestore.length === 0) throw new Error('No valid entries found in file.');
            if (!confirm(`Found ${entriesToRestore.length} entries. Restore now?`)) {
                input.value = '';
                return;
            }

            showLoader(`Importing 0/${entriesToRestore.length}...`);

            // batch upload one by one to ensure server validation logic runs (or bulk if server supported)
            // Server API is /entries/:date (PUT) or POST. 
            // To be safe we'll use loop.

            let success = 0;
            let fail = 0;

            let firstError = null;

            for (let i = 0; i < entriesToRestore.length; i++) {
                const entry = entriesToRestore[i];
                if (!entry.date) continue;

                showLoader(`Importing ${i + 1}/${entriesToRestore.length}...`);

                try {
                    // Normalize Entry
                    const total = (parseInt(entry.morning) || 0) + (parseInt(entry.evening) || 0);
                    const payload = {
                        date: entry.date,
                        day: entry.day || new Date(entry.date).toLocaleDateString('en-US', { weekday: 'long' }),
                        morning: parseInt(entry.morning) || 0,
                        evening: parseInt(entry.evening) || 0,
                        total: total,
                        month: entry.date.substring(0, 7),
                        year: parseInt(entry.date.substring(0, 4))
                    };

                    // We use PUT to upsert logic on server if it exists, or just POST.
                    // Let's assume PUT /entries/:date works as upsert or update. 
                    // To be safe, try PUT, if 404, POST? 
                    // Actually, if we use POST to /entries, most REST APIs create.
                    // If we use PUT /entries/date, it updates.
                    // Let's try PUT first.

                    const res = await fetch(`${GOOGLE_APPS_SCRIPT_URL}/entries/${entry.date}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload)
                    });

                    if (res.ok) success++;
                    else {
                        // If PUT failed (maybe not exists?), try POST ?
                        // Or maybe server error.
                        const res2 = await fetch(`${GOOGLE_APPS_SCRIPT_URL}/entries`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(payload)
                        });
                        if (res2.ok) success++;
                        else {
                            fail++;
                            if (!firstError) firstError = `Server Error: ${res.status}`;
                        }
                    }
                } catch (err) {
                    console.error(err);
                    fail++;
                    if (!firstError) firstError = err.message;
                }
            }

            let msg = `Import Complete!\nSuccess: ${success}\nFailed: ${fail}`;
            if (fail > 0 && firstError) msg += `\n\nFirst occurred error: ${firstError}\n(If 'Failed to fetch', check if Server is running on Port 3000)`;

            alert(msg);
            await fetchEntries();

        } catch (err) {
            console.error(err);
            alert('Import failed: ' + err.message);
        } finally {
            hideLoader();
            input.value = ''; // Reset
        }
    };
    reader.readAsText(file);
};

// --- Missing UI Components & Helpers ---

window.createEntryCard = function (entry) {
    const isToday = entry.date === getLocalDateString();
    const dateObj = new Date(entry.date);
    const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
    const dateNum = dateObj.getDate();
    const monthName = dateObj.toLocaleDateString('en-US', { month: 'short' });
    const year = dateObj.getFullYear();

    // Full date format: Sat, 10-Jan-2026
    const fullDateDisplay = `${dayName}, ${dateNum}-${monthName}-${year}`;

    // Amount is either pre-calculated or estimated
    // If amount is 0/null but total > 0, it might be an imported one or needing calc.
    // We display what we have.
    const amt = entry.amount || 0;

    return `
    <div class="mail-item" onclick="openEditEntryModal('${entry.date}')">
        <div class="mail-avatar ${entry.total > 0 ? '' : 'placeholder'}">
            ${entry.total > 0 ? entry.total : '0'}
        </div>
        <div class="mail-content">
            <div class="mail-header">
                <span class="mail-sender ${isToday ? 'highlight' : ''}">
                    ${fullDateDisplay}
                </span>
                <span class="mail-time">₹${amt}</span>
            </div>
            <div class="mail-snippet">
                Morning: ${entry.morning} • Evening: ${entry.evening}
            </div>
        </div>
    </div>`;
};

window.openEditEntryModal = function (date) {
    const entry = state.entries.find(e => e.date === date);
    if (!entry) return;

    document.getElementById('new-date').value = entry.date;
    document.getElementById('new-date').disabled = true; // Cannot change date of existing key
    document.getElementById('new-morning').value = entry.morning;
    document.getElementById('new-evening').value = entry.evening;

    // Update total preview immediately after setting values
    updateEntryTotalPreview();

    document.querySelector('#entry-modal h3').textContent = 'Edit Entry';
    // Show delete button for existing entries
    const deleteBtn = document.getElementById('delete-entry-btn');
    if (deleteBtn) deleteBtn.style.display = 'inline-flex';
    document.getElementById('entry-modal').classList.add('open');
};

// --- Bill Printing & HTML ---

window.getBillHTML = function (periodLabel, entries, mTotal, eTotal, gTotal) {
    // periodLabel can be "December 2025" or "1 Jan 2026 to 9 Jan 2026"
    // Use it directly as the period display
    const monthName = periodLabel;

    // 1. Sort Ascending
    entries.sort((a, b) => new Date(a.date) - new Date(b.date));

    // Custom Date Formatter: dd/MMM/yyyy
    const fmt = (dStr) => {
        const d = new Date(dStr);
        const dd = String(d.getDate()).padStart(2, '0');
        const mmm = d.toLocaleDateString('en-US', { month: 'short' });
        const yyyy = d.getFullYear();
        return `${dd}/${mmm}/${yyyy}`;
    };

    let tiffinTotal = 0; // Grand Total of Tiffins

    let rows = '';
    entries.forEach(e => {
        const dateDisplay = fmt(e.date);
        const dayDisplay = new Date(e.date).toLocaleDateString('en-US', { weekday: 'short' });

        tiffinTotal += (e.total || 0);

        rows += `
            <tr>
                <td>${dateDisplay} <small style="color:#666">(${dayDisplay})</small></td>
                <td>${e.morning}</td>
                <td>${e.evening}</td>
                <td>${e.total}</td>
                <td style="text-align:right;">₹${e.amount}</td>
            </tr>
        `;
    });

    // Recalculate totals just in case (optional, but requested "correct hone chahiye") - relying on passed mTotal/eTotal for now unless user said otherwise. User said "Total Add Tiffin hona chahiye".
    // "Total" column in footer previously had "-". Now we put tiffinTotal.

    return `
        <div class="bill-header" style="text-align:center; margin-bottom:20px; padding-bottom:10px; border-bottom:2px solid #ddd;">
            <h2>MESS BILL</h2>
            <p style="font-size:14px; color:#555;">Period: <strong>${monthName}</strong></p>
        </div>
        
        <table style="width:100%; border-collapse:collapse; font-size:13px;">
            <thead>
                <tr style="background:#f5f5f5; text-align:left;">
                    <th style="padding:8px; border-bottom:1px solid #ccc;">Date</th>
                    <th style="padding:8px; border-bottom:1px solid #ccc;">M</th>
                    <th style="padding:8px; border-bottom:1px solid #ccc;">E</th>
                    <th style="padding:8px; border-bottom:1px solid #ccc;">Total</th>
                    <th style="padding:8px; border-bottom:1px solid #ccc; text-align:right;">Amount</th>
                </tr>
            </thead>
            <tbody>
                ${rows}
            </tbody>
            <tfoot>
                <tr style="font-weight:bold; background:#fafafa;">
                    <td style="padding:10px; border-top:2px solid #000;">TOTAL</td>
                    <td style="padding:10px; border-top:2px solid #000;">${mTotal}</td>
                    <td style="padding:10px; border-top:2px solid #000;">${eTotal}</td>
                    <td style="padding:10px; border-top:2px solid #000;">${tiffinTotal}</td>
                    <td style="padding:10px; border-top:2px solid #000; text-align:right; font-size:16px;">₹${gTotal}</td>
                </tr>
            </tfoot>
        </table>
        
        <div style="margin-top:30px; font-size:12px; color:#777; text-align:center;">
            Generated on ${new Date().toLocaleString()}
        </div>
    `;
};

window.printBill = function () {
    const content = document.getElementById('printable-bill-container').innerHTML;
    const win = window.open('', '', 'height=700,width=500');
    win.document.write('<html><head><title>Print Bill</title>');
    // Minimal CSS for print
    win.document.write('<style>body{font-family:sans-serif;} table{width:100%;border-collapse:collapse;} td,th{padding:6px;border-bottom:1px solid #eee;} @media print { .no-print { display:none; } }</style>');
    win.document.write('</head><body>');
    win.document.write(content);
    win.document.write('</body></html>');
    win.document.close();
    win.print();
};

window.exportBillExcel = async function () {
    const filterType = document.getElementById('bill-filter-type')?.value || 'month';
    let entries = [];
    let periodLabel = '';

    if (filterType === 'month') {
        const month = document.getElementById('bill-month-select').value;
        if (!month || month.includes('No Data')) return alert('Select a month with data');

        entries = state.entries
            .filter(e => e.date && e.date.startsWith(month))
            .map(e => ({ ...e }));

        const [y, mo] = month.split('-');
        periodLabel = new Date(y, mo - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    } else {
        // Custom date range
        const startDate = document.getElementById('bill-start-date').value;
        const endDate = document.getElementById('bill-end-date').value;

        if (!startDate || !endDate) return alert('Please select both start and end dates');

        entries = state.entries
            .filter(e => e.date && e.date >= startDate && e.date <= endDate)
            .map(e => ({ ...e }));

        periodLabel = `${startDate} to ${endDate}`;
    }

    if (entries.length === 0) return alert('No data to export');

    // Sort by date ascending
    entries.sort((a, b) => new Date(a.date) - new Date(b.date));

    // Date Formatter: dd/MMM/yyyy
    const fmt = (dStr) => {
        const d = new Date(dStr);
        const dd = String(d.getDate()).padStart(2, '0');
        const mmm = d.toLocaleDateString('en-US', { month: 'short' });
        const yyyy = d.getFullYear();
        return `${dd}/${mmm}/${yyyy}`;
    };

    showLoader('Calculating amounts...');

    try {
        // Calculate amounts using pricing rules
        let mSum = 0, eSum = 0, tSum = 0, amtSum = 0;

        for (const e of entries) {
            // Get correct pricing for this date
            const rates = await getPricingRate(e.date);
            const calculatedAmount = (e.morning * rates.morning) + (e.evening * rates.evening);
            e.amount = calculatedAmount;

            mSum += (e.morning || 0);
            eSum += (e.evening || 0);
            tSum += (e.total || 0);
            amtSum += calculatedAmount;
        }

        // Build CSV
        let csv = 'Date,Day,Morning,Evening,Total,Amount\n';

        entries.forEach(e => {
            const dDisplay = fmt(e.date);
            const dayName = new Date(e.date).toLocaleDateString('en-US', { weekday: 'short' });
            csv += `${dDisplay},${dayName},${e.morning},${e.evening},${e.total},${e.amount}\n`;
        });

        // Footer Row
        csv += `TOTAL,,${mSum},${eSum},${tSum},${amtSum}\n`;

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `Bill_${periodLabel.replace(/\s/g, '_')}.csv`;
        link.click();

        hideLoader();
        showToast('📊 Excel exported!', 'success');
    } catch (err) {
        hideLoader();
        console.error(err);
        alert('Export failed: ' + err.message);
    }
};


// --- Pricing Rule Actions ---

window.deletePricingRule = async function (id) {
    if (!confirm('Delete this pricing rule?')) return;

    // Find and store backup for rollback
    const ruleIndex = state.pricingRules.findIndex(r => r.id == id);
    if (ruleIndex === -1) return;
    const deletedRule = { ...state.pricingRules[ruleIndex] };

    // OPTIMISTIC UPDATE: Remove from state immediately
    state.pricingRules.splice(ruleIndex, 1);

    // Re-render UI instantly
    renderPricingRules();

    // Show success immediately
    showToast('🗑️ Pricing rule deleted!', 'success');

    // Invalidate cache
    pricingRulesCache = null;
    if (window.saveToCache) saveToCache(null, state.pricingRules);

    // API call in background
    try {
        const res = await fetch(`${GOOGLE_APPS_SCRIPT_URL}?path=pricing&action=delete`, {
            method: 'POST',
            body: JSON.stringify({ id: id })
        });
        if (!res.ok) throw new Error('Delete failed');

    } catch (e) {
        console.error(e);
        // ROLLBACK: Restore the rule
        state.pricingRules.push(deletedRule);
        renderPricingRules();
        if (window.saveToCache) saveToCache(null, state.pricingRules);
        showToast('❌ Delete failed, rule restored', 'error');
    }
};


window.addEventListener('DOMContentLoaded', () => {
    // ⚡ INSTANT CACHE LOADING - Load from localStorage first (< 1ms)
    const CACHE_ENTRIES = 'mess_entries_v2';
    const CACHE_PRICING = 'mess_pricing_v2';

    try {
        const cachedE = localStorage.getItem(CACHE_ENTRIES);
        const cachedP = localStorage.getItem(CACHE_PRICING);
        if (cachedE) {
            state.entries = JSON.parse(cachedE);
            renderEntries(state.entries);
            populateReportMonths();
            populateBillMonths();
            console.log('⚡ INSTANT:', state.entries.length, 'entries from cache!');
        }
        if (cachedP) {
            state.pricingRules = JSON.parse(cachedP);
        }
    } catch (e) { console.warn('Cache error:', e); }

    // Load user profile
    loadProfile();

    // Background sync with Google Sheets (non-blocking)
    setTimeout(() => {
        fetchEntries().then(() => {
            localStorage.setItem(CACHE_ENTRIES, JSON.stringify(state.entries));
            console.log('✅ Synced with Google Sheets');
        }).catch(() => { });
        fetchPricingRules(true).then(() => {
            localStorage.setItem(CACHE_PRICING, JSON.stringify(state.pricingRules));
        }).catch(() => { });
    }, 50);

    // Initialize Mess Presenty date with LOCAL timezone (not UTC!)
    const presentyDate = document.getElementById('presenty-date');
    if (presentyDate) {
        const now = new Date();
        const localDate = now.getFullYear() + '-' +
            String(now.getMonth() + 1).padStart(2, '0') + '-' +
            String(now.getDate()).padStart(2, '0');
        presentyDate.value = localDate;
    }

    // Warn before page refresh if there are unsaved Mess Presenty changes
    window.addEventListener('beforeunload', function (e) {
        if (typeof messPresenty !== 'undefined' && messPresenty.hasUnsyncedChanges) {
            e.preventDefault();
            e.returnValue = 'You have unsaved attendance changes! Are you sure you want to leave?';
            return e.returnValue;
        }
    });
});

// ========================================
//  MESS PRESENTY - Exact Copy of Hostel Attendance Logic
// ========================================

// Hostel Attendance App's Google Script URL (SHARED DATABASE)
const HOSTEL_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyLrD98LEE_PQtqySBKqrZLyKvqzM3nXCAEMyYmejkLqwexp6cUTmDlIljQEazc7_8i/exec';

// Constants
const MESS_CATEGORIES = ['Mess Day', 'Mess Night'];
const MESS_STORAGE_KEY = 'mess_presenty_store_v1';

// Mess Presenty State (EXACT copy of Hostel structure)
const messPresenty = {
    category: 'Mess Day',
    students: [],
    attendanceByCategory: {},      // {category: {studentName: status}}
    loadedFromSheets: {},          // {date: {category: true}}
    verifiedCategories: {},        // Verification state per category
    syncedCategories: {},          // Sync state per date/category
    searchQuery: '',
    hasUnsyncedChanges: false      // Track if there are unsynced attendance changes
};

// Initialize attendance for all categories (EXACT copy from Hostel)
function initializeMPAllCategoriesAttendance() {
    messPresenty.attendanceByCategory = {};
    messPresenty.loadedFromSheets = {};
    MESS_CATEGORIES.forEach(c => {
        messPresenty.attendanceByCategory[c] = {};
        messPresenty.students.forEach(s => {
            const name = s.name || s['Student Name'] || 'Unknown';
            messPresenty.attendanceByCategory[c][name] = 'Present';
        });
    });
}

// Ensure category has attendance for all students
function ensureMPCategoryAttendance(category) {
    if (!messPresenty.attendanceByCategory[category]) {
        messPresenty.attendanceByCategory[category] = {};
    }
    messPresenty.students.forEach(s => {
        const name = s.name || s['Student Name'] || 'Unknown';
        if (!messPresenty.attendanceByCategory[category][name]) {
            messPresenty.attendanceByCategory[category][name] = 'Present';
        }
    });
}

// Set Mess Category (EXACT copy from Hostel switchCategory)
window.setMessCategory = function (category) {
    messPresenty.category = category;

    // Update toggle buttons
    document.querySelectorAll('.presenty-toggle').forEach(btn => {
        btn.classList.remove('active');
    });

    if (category === 'Mess Day') {
        document.getElementById('btn-mess-day').classList.add('active');
    } else {
        document.getElementById('btn-mess-night').classList.add('active');
    }

    // Update labels
    updateMPCategoryLabels();

    // Ensure this category has attendance
    ensureMPCategoryAttendance(category);

    const date = document.getElementById('presenty-date').value;
    if (date && messPresenty.students.length > 0) {
        if (!messPresenty.loadedFromSheets[date]) {
            messPresenty.loadedFromSheets[date] = {};
        }
    }

    renderMPStudentList();
    updateMPVerificationUI();
    updateMPFetchButtonVisibility();
};

// Load Students from Hostel Database
window.loadMessAttendance = async function () {
    const date = document.getElementById('presenty-date').value;
    if (!date) {
        showToast('Please select a date', 'error');
        return;
    }

    // Immediately update Fetch button visibility based on date
    updateMPFetchButtonVisibility();


    const list = document.getElementById('presenty-student-list');
    list.innerHTML = '<div style="text-align:center; padding:40px;"><div class="spinner"></div><div style="margin-top:12px;">Loading students...</div></div>';

    try {
        // Fetch students from Hostel database
        const res = await fetch(HOSTEL_SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify({ action: 'get_students' })
        });

        const json = await res.json();

        if (json.result === 'success' && json.students) {
            messPresenty.students = (json.students || []).map(s => ({
                name: s.name || s['Student Name'],
                appNumber: s.appNumber || s['Application: Application Number'] || '',
                appId: s.appId || s['Application: ID'] || 'N/A',
                hostelId: s.hostelId || s['Hostel Id'] || '',
                allocation: s.allocation || s['Hostel Allocation'] || ''
            }));

            if (messPresenty.students.length > 0) {
                initializeMPAllCategoriesAttendance();
                loadMPVerificationState(date);
                ensureMPCategoryAttendance(messPresenty.category);
                renderMPStudentList();
                updateMPVerificationUI();
                updateMPFetchButtonVisibility();
                showToast(`✓ ${messPresenty.students.length} students ready`, 'success');
            } else {
                renderMPStudentList();
            }
        } else {
            list.innerHTML = '<div style="text-align:center; padding:40px; color:#FF3B30;">Failed to load students</div>';
        }
    } catch (e) {
        console.error(e);
        list.innerHTML = `<div style="text-align:center; padding:40px; color:#FF3B30;">Error: ${e.message}</div>`;
    }
};

// Render Student List (EXACT copy from Hostel with Material Icons)
function renderMPStudentList() {
    const listDiv = document.getElementById('presenty-student-list');
    listDiv.innerHTML = '';

    const countEl = document.getElementById('presenty-total-count');
    if (countEl) countEl.textContent = `${messPresenty.students.length} total`;

    if (messPresenty.students.length === 0) {
        listDiv.innerHTML = `<div style="text-align:center; padding: 40px; color: var(--md-sys-color-outline);">
            <span class="material-symbols-outlined" style="font-size: 48px; display:block; margin-bottom:16px;">group</span>
            No students found.
        </div>`;
        updateMPStats();
        return;
    }

    ensureMPCategoryAttendance(messPresenty.category);
    const attendance = messPresenty.attendanceByCategory[messPresenty.category];

    const q = (messPresenty.searchQuery || '').trim().toLowerCase();
    const filteredStudents = !q ? messPresenty.students : messPresenty.students.filter(s => {
        return (s.name || '').toLowerCase().includes(q) || (s.appId || '').toLowerCase().includes(q);
    });

    filteredStudents.forEach(student => {
        const status = attendance[student.name] || 'Present';
        const item = document.createElement('div');
        item.className = 'presenty-student-card';

        // Avatar Color (same as Hostel)
        const firstChar = (student.name || 'U').charAt(0).toUpperCase();
        const colors = ['#007AFF', '#5856D6', '#AF52DE', '#FF2D55', '#FF9500', '#FFCC00', '#34C759', '#00C7BE', '#30B0C7', '#5AC8FA'];
        let colorIndex = 0;
        if (student.name && student.name.length > 0) {
            colorIndex = (student.name.charCodeAt(0) + student.name.charCodeAt(Math.min(1, student.name.length - 1))) % colors.length;
        }
        const avatarColor = colors[colorIndex];

        // Single status icon based on current status (EXACT from Hostel)
        let statusIcon, statusColor, statusBg;
        if (status === 'Present') {
            statusIcon = 'check_circle';
            statusColor = '#34C759';
            statusBg = '#E3F9E8';
        } else if (status === 'Absent') {
            statusIcon = 'cancel';
            statusColor = '#FF3B30';
            statusBg = '#FFE5E3';
        } else {
            statusIcon = 'schedule';
            statusColor = '#FF9500';
            statusBg = '#FFF4E5';
        }

        item.innerHTML = `
            <div class="presenty-student-avatar" style="background-color: ${avatarColor}; color: white;">${firstChar}</div>
            <div class="presenty-student-info">
                <div class="presenty-student-name">${student.name}</div>
                <div class="presenty-student-id">${student.appId || student.appNumber || ''}</div>
            </div>
            <button class="status-icon-btn" onclick="cycleMPStatus('${student.name.replace(/'/g, "\\'")}')" 
                style="width: 44px; height: 44px; border-radius: 22px; border: none; 
                background: ${statusBg}; display: flex; align-items: center; justify-content: center; 
                cursor: pointer; transition: transform 0.15s ease;">
                <span class="material-symbols-outlined" style="font-size: 28px; color: ${statusColor}; font-variation-settings: 'FILL' 1;">${statusIcon}</span>
            </button>
        `;
        listDiv.appendChild(item);
    });

    updateMPStats();
}

// Cycle through Present → Absent → Leave → Present (EXACT from Hostel)
window.cycleMPStatus = function (studentName) {
    const date = document.getElementById('presenty-date').value;
    const category = messPresenty.category;

    // RESTRICTION: Only allow changes for TODAY's date
    const now = new Date();
    const today = now.getFullYear() + '-' +
        String(now.getMonth() + 1).padStart(2, '0') + '-' +
        String(now.getDate()).padStart(2, '0');

    if (date !== today) {
        showToast('❌ Past dates are read-only!', 'warning');
        return;
    }

    // Don't allow changes if this category is already synced
    if (isMPSynced(date, category)) {
        showToast(`${category} is synced. Cannot modify.`, 'warning');
        return;
    }

    ensureMPCategoryAttendance(category);
    const currentStatus = messPresenty.attendanceByCategory[category][studentName] || 'Present';
    let newStatus;
    if (currentStatus === 'Present') newStatus = 'Absent';
    else if (currentStatus === 'Absent') newStatus = 'Leave';
    else newStatus = 'Present';

    messPresenty.attendanceByCategory[category][studentName] = newStatus;
    messPresenty.hasUnsyncedChanges = true; // Mark that we have unsaved changes
    renderMPStudentList();

    // Auto-save after status change
    autoSaveMPAttendance();
};

// Update Stats (EXACT from Hostel updateStats)
function updateMPStats() {
    const attendance = messPresenty.attendanceByCategory[messPresenty.category] || {};
    let present = 0, absent = 0, leave = 0;

    messPresenty.students.forEach(s => {
        const status = attendance[s.name] || 'Present';
        if (status === 'Present') present++;
        else if (status === 'Absent') absent++;
        else if (status === 'Leave') leave++;
    });

    const presentEl = document.getElementById('presenty-present');
    const absentEl = document.getElementById('presenty-absent');
    const leaveEl = document.getElementById('presenty-leave');

    if (presentEl) presentEl.textContent = present;
    if (absentEl) absentEl.textContent = absent;
    if (leaveEl) leaveEl.textContent = leave;
}

// Fetch current section from database (EXACT from Hostel)
window.fetchMessFromDatabase = async function () {
    const date = document.getElementById('presenty-date').value;
    const category = messPresenty.category;

    if (!date) {
        showToast('Please select a date', 'error');
        return;
    }

    showLoader(`Fetching ${category} data...`);

    try {
        const res = await fetch(HOSTEL_SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify({
                action: 'fetch_category_data',
                date: date,
                category: category
            })
        });
        const json = await res.json();
        hideLoader();

        if (json.result === 'success' && json.data && json.data.length > 1) {
            const rows = json.data;
            const headers = rows[0];
            const nameIdx = headers.indexOf('Full Name') !== -1 ? headers.indexOf('Full Name') : headers.indexOf('Student Name');
            const statusIdx = headers.indexOf('Status');

            if (nameIdx !== -1 && statusIdx !== -1) {
                ensureMPCategoryAttendance(category);
                let count = 0;
                for (let i = 1; i < rows.length; i++) {
                    const name = rows[i][nameIdx];
                    const status = rows[i][statusIdx];
                    if (name && ['Present', 'Absent', 'Leave'].includes(status)) {
                        messPresenty.attendanceByCategory[category][name] = status;
                        count++;
                    }
                }

                if (!messPresenty.loadedFromSheets[date]) messPresenty.loadedFromSheets[date] = {};
                messPresenty.loadedFromSheets[date][category] = true;
                markMPAsSynced(date, category);

                renderMPStudentList();
                updateMPFetchButtonVisibility();
                showToast(`Fetched ${count} records for ${category}!`, 'success');
            } else {
                showToast('Invalid data format from database', 'error');
            }
        } else if (json.result === 'success') {
            showToast(`No ${category} data found for ${date}`, 'warning');
        } else {
            showToast(`Fetch Failed: ${json.error || 'Unknown error'}`, 'error');
        }
    } catch (e) {
        hideLoader();
        showToast(`Network Error: ${e.message}`, 'error');
    }
};

// Update Fetch Button Visibility - Only show for PAST dates (not today)
function updateMPFetchButtonVisibility() {
    const date = document.getElementById('presenty-date').value;
    const category = messPresenty.category;
    const fetchContainer = document.getElementById('presenty-fetch-container');
    const statusEl = document.getElementById('presenty-fetch-status');

    // Get today's date in LOCAL timezone (YYYY-MM-DD format)
    // IMPORTANT: Don't use toISOString() as it returns UTC, not local time!
    const now = new Date();
    const today = now.getFullYear() + '-' +
        String(now.getMonth() + 1).padStart(2, '0') + '-' +
        String(now.getDate()).padStart(2, '0');
    const isPastDate = date && date < today;

    // Show Fetch button only for past dates
    if (fetchContainer) {
        fetchContainer.style.display = isPastDate ? 'block' : 'none';
    }

    // Show status message if already loaded
    if (statusEl) {
        if (messPresenty.loadedFromSheets[date] && messPresenty.loadedFromSheets[date][category]) {
            statusEl.style.display = 'block';
            statusEl.innerHTML = '✓ Data already loaded from database';
        } else {
            statusEl.style.display = 'none';
        }
    }
}

// Verification Functions (EXACT from Hostel)
window.toggleMPVerification = function () {
    if (!messPresenty.verifiedCategories) messPresenty.verifiedCategories = {};
    messPresenty.verifiedCategories[messPresenty.category] = !messPresenty.verifiedCategories[messPresenty.category];
    updateMPVerificationUI();
    saveMPVerificationState();

    // Checkbox only enables Sync button - user must click Sync manually
    // (Removed auto-sync behavior)
};

function updateMPVerificationUI() {
    const checkbox = document.getElementById('presenty-verified-checkbox');
    const categoryLabel = document.getElementById('presenty-category-label');
    const syncBtn = document.getElementById('presenty-sync-btn');
    const syncBar = document.getElementById('presenty-sync-bar');

    if (!checkbox) return;

    const isVerified = messPresenty.verifiedCategories[messPresenty.category];
    checkbox.checked = isVerified || false;

    if (categoryLabel) {
        categoryLabel.textContent = messPresenty.category;
    }

    // Show Sync bar only when students are loaded, enable only when verified
    if (syncBar && messPresenty.students.length > 0) {
        syncBar.style.display = 'block';
    }

    if (syncBtn) {
        if (isVerified) {
            syncBtn.disabled = false;
            syncBtn.style.opacity = '1';
        } else {
            syncBtn.disabled = true;
            syncBtn.style.opacity = '0.5';
        }
    }
}

function saveMPVerificationState() {
    const date = document.getElementById('presenty-date').value;
    if (!date) return;
    const store = getMPSavedStore();
    store[date] = store[date] || {};
    store[date].verified = messPresenty.verifiedCategories;
    setMPSavedStore(store);
}

function loadMPVerificationState(date) {
    // Always start with all categories UNCHECKED
    // (Don't load from localStorage - user must verify fresh each time)
    messPresenty.verifiedCategories = {};
    MESS_CATEGORIES.forEach(c => {
        messPresenty.verifiedCategories[c] = false;
    });
    updateMPVerificationUI();
}

// Sync State Functions
function isMPSynced(date, category) {
    return messPresenty.syncedCategories[`${date}_${category}`] === true;
}

function markMPAsSynced(date, category) {
    messPresenty.syncedCategories[`${date}_${category}`] = true;
}

// Persistence
function getMPSavedStore() {
    try {
        const raw = localStorage.getItem(MESS_STORAGE_KEY);
        const parsed = JSON.parse(raw);
        return parsed && typeof parsed === 'object' ? parsed : {};
    } catch (e) { return {}; }
}

function setMPSavedStore(s) {
    localStorage.setItem(MESS_STORAGE_KEY, JSON.stringify(s));
}

// Auto-save attendance locally
function autoSaveMPAttendance() {
    const date = document.getElementById('presenty-date').value;
    if (!date) return;

    const store = getMPSavedStore();
    store[date] = store[date] || {};
    store[date][messPresenty.category] = messPresenty.attendanceByCategory[messPresenty.category];
    setMPSavedStore(store);
}

// Sync Attendance to Hostel Database
window.syncMessAttendance = async function () {
    const date = document.getElementById('presenty-date').value;
    const category = messPresenty.category;

    // RESTRICTION: Only allow sync for TODAY's date
    const now = new Date();
    const today = now.getFullYear() + '-' +
        String(now.getMonth() + 1).padStart(2, '0') + '-' +
        String(now.getDate()).padStart(2, '0');

    if (date !== today) {
        showToast('❌ Cannot update past dates! Only today allowed.', 'error');
        return;
    }

    const attendance = messPresenty.attendanceByCategory[category] || {};
    const entries = Object.entries(attendance);

    if (entries.length === 0) {
        showToast('No attendance to sync!', 'error');
        return;
    }

    // Build rows in EXACT format Hostel App expects:
    // [Full Name, App Number, App ID, Hostel Id, Hostel Allocation, Time, Status, Reason, Date]
    // Time is "Morning" or "Night" based on category (EXACT like Hostel App)
    const timeValueByCategory = {
        'Mess Day': 'Morning',
        'Mess Night': 'Night'
    };
    const timeValue = timeValueByCategory[category] || 'Morning';
    const rows = entries.map(([name, status]) => {
        const student = messPresenty.students.find(s => s.name === name);
        return [
            name,                                    // Full Name
            student?.appNumber || '',                // Application: Application Number
            student?.appId || '',                    // Application: ID
            student?.hostelId || '',                 // Hostel Id
            student?.allocation || '',               // Hostel Allocation
            timeValue,                               // Time
            status,                                  // Status
            '',                                      // Reason
            date                                     // Date
        ];
    });

    showLoader('Syncing to Hostel Database...');

    try {
        const res = await fetch(HOSTEL_SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify({
                action: 'sync_batched_multi_sheet',
                batches: { [category]: rows }  // CORRECT format: { "Mess Day": [[...], [...]] }
            })
        });


        const json = await res.json();
        hideLoader();

        if (json.result === 'success') {
            markMPAsSynced(date, category);
            messPresenty.hasUnsyncedChanges = false; // Clear warning flag after successful sync
            if (!messPresenty.loadedFromSheets[date]) messPresenty.loadedFromSheets[date] = {};
            messPresenty.loadedFromSheets[date][category] = true;
            updateMPFetchButtonVisibility();

            // Show detailed stats from backend
            const stats = json.stats || {};
            const statsMsg = [];
            if (stats.updated > 0) statsMsg.push(`${stats.updated} updated`);
            if (stats.inserted > 0) statsMsg.push(`${stats.inserted} inserted`);
            if (stats.skipped > 0) statsMsg.push(`${stats.skipped} unchanged`);

            const detailMsg = statsMsg.length > 0 ? ` (${statsMsg.join(', ')})` : '';
            showToast(`✅ Synced to ${category}!${detailMsg}`, 'success');
        } else {
            showToast(`Sync failed: ${json.error || 'Unknown error'}`, 'error');
        }
    } catch (e) {
        hideLoader();
        showToast(`Network error: ${e.message}`, 'error');
    }
};

// Search/Filter Students
window.filterMPStudents = function (query) {
    messPresenty.searchQuery = query;
    renderMPStudentList();
};

// Mark All Present
window.markAllMPPresent = function () {
    const category = messPresenty.category;
    ensureMPCategoryAttendance(category);

    messPresenty.students.forEach(student => {
        messPresenty.attendanceByCategory[category][student.name] = 'Present';
    });

    renderMPStudentList();
    autoSaveMPAttendance();
    showToast('✅ All marked Present!', 'success');
};

// Update category labels
function updateMPCategoryLabels() {
    const category = messPresenty.category;
    const categoryLabel = document.getElementById('presenty-category-label');
    const fetchLabel = document.getElementById('presenty-fetch-label');

    if (categoryLabel) categoryLabel.textContent = category;
    if (fetchLabel) fetchLabel.textContent = category;
}

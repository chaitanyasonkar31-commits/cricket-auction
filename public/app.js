// Client-Side Application Logic

// Generate or retrieve Client ID
let clientId = sessionStorage.getItem('auction_client_id');
if (!clientId) {
    clientId = 'client_' + Math.random().toString(36).substring(2, 15);
    sessionStorage.setItem('auction_client_id', clientId);
}

// Global App State
let role = localStorage.getItem('auction_role') || ''; // 'host' or 'manager'
let roomCode = localStorage.getItem('auction_room_code') || '';
let hostId = localStorage.getItem('auction_host_id') || '';
let teamName = localStorage.getItem('auction_team_name') || '';
let managerName = localStorage.getItem('auction_manager_name') || '';
let roomState = null;
let lastRendered = {
    currentPlayerIndex: -2,
    roomStatus: '',
    queueFilter: '',
    roleFilter: '',
    logsCount: 0,
    teamsHash: '',
    currentBid: -1,
    currentBidder: ''
};
let eventSource = null;
let currentTimerVal = 0;
let localTimerInterval = null;
let allPresetsData = window.ALL_PLAYERS_DATA || {};
let presetsLoaded = false;

let currentChecklistFilter = 'All';
let isAudioMuted = localStorage.getItem('auction_audio_muted') === 'true';
let audioCtx = null;
let lastWarningSec = -1;

// Browser Native Audio Synthesizer
function playAuctionSound(type) {
    if (isAudioMuted) return;
    try {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
        
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        
        const now = audioCtx.currentTime;
        
        if (type === 'bid') {
            // High chime/pop sound
            osc.type = 'sine';
            osc.frequency.setValueAtTime(800, now);
            osc.frequency.exponentialRampToValueAtTime(1400, now + 0.08);
            gain.gain.setValueAtTime(0.15, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
            osc.start(now);
            osc.stop(now + 0.08);
        } else if (type === 'sold') {
            // Victory major chord arpeggio
            const playTone = (freq, startTime, duration, vol) => {
                const o = audioCtx.createOscillator();
                const g = audioCtx.createGain();
                o.connect(g);
                g.connect(audioCtx.destination);
                o.type = 'triangle';
                o.frequency.setValueAtTime(freq, startTime);
                g.gain.setValueAtTime(vol, startTime);
                g.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
                o.start(startTime);
                o.stop(startTime + duration);
            };
            playTone(523.25, now, 0.15, 0.12);        // C5
            playTone(659.25, now + 0.08, 0.15, 0.12);  // E5
            playTone(783.99, now + 0.16, 0.15, 0.12);  // G5
            playTone(1046.50, now + 0.24, 0.35, 0.15); // C6
        } else if (type === 'unsold') {
            // Downward double thud
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(180, now);
            osc.frequency.linearRampToValueAtTime(60, now + 0.3);
            gain.gain.setValueAtTime(0.18, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
            osc.start(now);
            osc.stop(now + 0.3);
        } else if (type === 'warning') {
            // Short wooden tick
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(160, now);
            gain.gain.setValueAtTime(0.2, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
            osc.start(now);
            osc.stop(now + 0.04);
        }
    } catch (e) {
        console.warn("Audio Context failed to play sound: ", e);
    }
}

function toggleAudio() {
    isAudioMuted = !isAudioMuted;
    localStorage.setItem('auction_audio_muted', isAudioMuted);
    updateAudioToggleUI();
}

function updateAudioToggleUI() {
    const btn = document.getElementById('btn-toggle-audio');
    if (!btn) return;
    
    if (isAudioMuted) {
        btn.style.color = 'var(--text-secondary)';
        btn.style.borderColor = 'rgba(255,255,255,0.15)';
        btn.style.background = 'rgba(255,255,255,0.02)';
        btn.innerHTML = '<i class="fa-solid fa-volume-xmark"></i> <span id="audio-toggle-text">Sound: Off</span>';
    } else {
        btn.style.color = 'var(--accent-gold)';
        btn.style.borderColor = 'rgba(255, 215, 0, 0.3)';
        btn.style.background = 'rgba(255, 215, 0, 0.08)';
        btn.innerHTML = '<i class="fa-solid fa-volume-high"></i> <span id="audio-toggle-text">Sound: On</span>';
    }
}

// Checklist Filtering Actions
function setChecklistFilter(category) {
    currentChecklistFilter = category;
    
    // Update active class on filter tags using robust data-filter attributes
    const container = document.querySelector('.checklist-filters-container');
    if (container) {
        container.querySelectorAll('.filter-tag').forEach(btn => {
            const filterVal = btn.getAttribute('data-filter') || btn.innerText.trim();
            if (filterVal === category) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }
    
    // Dynamically toggle class names to preserve checked/unchecked inputs and input ratings
    try {
        if (allPresetPlayers && Array.isArray(allPresetPlayers)) {
            allPresetPlayers.forEach(p => {
                if (!p || p.id === undefined) return;
                const cb = document.getElementById(`check-p-${p.id}`);
                const item = cb ? cb.closest('.checklist-item') : null;
                if (item) {
                    const isFilterHidden = category !== 'All' && (
                        category === 'Overseas' ? !p.overseas :
                        category === 'Indian' ? p.overseas :
                        p.role !== category
                    );
                    if (isFilterHidden) {
                        item.classList.add('hidden-filter');
                    } else {
                        item.classList.remove('hidden-filter');
                    }
                }
            });
        }
    } catch (err) {
        console.error("Error filtering checklist items:", err);
    }
}

let allPresetPlayers = [
    {"id": 1, "name": "Virat Kohli", "role": "Batsman", "rating": 96, "base_price": 20000000, "stats": "Runs: 7624, Avg: 38.7, SR: 130.7", "img": "https://img1.hscicdn.com/image/upload/f_auto,t_ds_square_w_320,q_50/lsci/db/PICTURES/CMS/316600/316605.png", "overseas": false, "country": "India"},
    {"id": 2, "name": "MS Dhoni", "role": "Wicket-Keeper", "rating": 95, "base_price": 20000000, "stats": "Runs: 5243, Avg: 39.1, SR: 137.5, Catch/Stump: 192", "img": "https://img1.hscicdn.com/image/upload/f_auto,t_ds_square_w_320,q_50/lsci/db/PICTURES/CMS/319900/319946.png", "overseas": false, "country": "India"},
    {"id": 3, "name": "Jasprit Bumrah", "role": "Bowler", "rating": 98, "base_price": 20000000, "stats": "Wickets: 165, Econ: 7.30, Avg: 22.5", "img": "https://img1.hscicdn.com/image/upload/f_auto,t_ds_square_w_320,q_50/lsci/db/PICTURES/CMS/316500/316584.png", "overseas": false, "country": "India"},
    {"id": 4, "name": "Rohit Sharma", "role": "Batsman", "rating": 94, "base_price": 20000000, "stats": "Runs: 6628, Avg: 29.7, SR: 131.2", "img": "https://img1.hscicdn.com/image/upload/f_auto,t_ds_square_w_320,q_50/lsci/db/PICTURES/CMS/316500/316581.png", "overseas": false, "country": "India"},
    {"id": 5, "name": "Ravindra Jadeja", "role": "All-Rounder", "rating": 93, "base_price": 15000000, "stats": "Runs: 2958, SR: 129.5, Wickets: 160, Econ: 7.62", "img": "https://img1.hscicdn.com/image/upload/f_auto,t_ds_square_w_320,q_50/lsci/db/PICTURES/CMS/316500/316534.png", "overseas": false, "country": "India"},
    {"id": 6, "name": "Hardik Pandya", "role": "All-Rounder", "rating": 92, "base_price": 15000000, "stats": "Runs: 2525, SR: 145.8, Wickets: 64, Econ: 8.75", "img": "https://img1.hscicdn.com/image/upload/f_auto,t_ds_square_w_320,q_50/lsci/db/PICTURES/CMS/316500/316587.png", "overseas": false, "country": "India"},
    {"id": 7, "name": "Heinrich Klaasen", "role": "Wicket-Keeper", "rating": 94, "base_price": 15000000, "stats": "Runs: 980, Avg: 41.2, SR: 168.3", "img": "https://img1.hscicdn.com/image/upload/f_auto,t_ds_square_w_320,q_50/lsci/db/PICTURES/CMS/319000/319056.png", "overseas": true, "country": "South Africa"},
    {"id": 8, "name": "Rashid Khan", "role": "Bowler", "rating": 95, "base_price": 15000000, "stats": "Wickets: 148, Econ: 6.78, Avg: 20.8", "img": "https://img1.hscicdn.com/image/upload/f_auto,t_ds_square_w_320,q_50/lsci/db/PICTURES/CMS/313300/313398.png", "overseas": true, "country": "Afghanistan"},
    {"id": 9, "name": "Suryakumar Yadav", "role": "Batsman", "rating": 95, "base_price": 15000000, "stats": "Runs: 3594, Avg: 32.4, SR: 143.6", "img": "https://img1.hscicdn.com/image/upload/f_auto,t_ds_square_w_320,q_50/lsci/db/PICTURES/CMS/316600/316620.png", "overseas": false, "country": "India"},
    {"id": 10, "name": "Travis Head", "role": "Batsman", "rating": 93, "base_price": 15000000, "stats": "Runs: 960, Avg: 36.8, SR: 172.5", "img": "https://img1.hscicdn.com/image/upload/f_auto,t_ds_square_w_320,q_50/lsci/db/PICTURES/CMS/319000/319001.png", "overseas": true, "country": "Australia"},
    {"id": 11, "name": "Rishabh Pant", "role": "Wicket-Keeper", "rating": 91, "base_price": 15000000, "stats": "Runs: 3284, Avg: 35.3, SR: 148.9", "img": "https://img1.hscicdn.com/image/upload/f_auto,t_ds_square_w_320,q_50/lsci/db/PICTURES/CMS/316600/316612.png", "overseas": false, "country": "India"},
    {"id": 12, "name": "Sunil Narine", "role": "All-Rounder", "rating": 94, "base_price": 15000000, "stats": "Runs: 1540, SR: 162.4, Wickets: 180, Econ: 6.64", "img": "https://img1.hscicdn.com/image/upload/f_auto,t_ds_square_w_320,q_50/lsci/db/PICTURES/CMS/319000/319030.png", "overseas": true, "country": "West Indies"},
    {"id": 13, "name": "Mitchell Starc", "role": "Bowler", "rating": 92, "base_price": 20000000, "stats": "Wickets: 95, Econ: 8.12, Avg: 24.6", "img": "https://img1.hscicdn.com/image/upload/f_auto,t_ds_square_w_320,q_50/lsci/db/PICTURES/CMS/319000/319052.png", "overseas": true, "country": "Australia"},
    {"id": 14, "name": "Yuzvendra Chahal", "role": "Bowler", "rating": 90, "base_price": 10000000, "stats": "Wickets: 205, Econ: 7.84, Avg: 22.4", "img": "https://img1.hscicdn.com/image/upload/f_auto,t_ds_square_w_320,q_50/lsci/db/PICTURES/CMS/316600/316618.png", "overseas": false, "country": "India"},
    {"id": 15, "name": "Andre Russell", "role": "All-Rounder", "rating": 93, "base_price": 15000000, "stats": "Runs: 2484, SR: 174.0, Wickets: 115, Econ: 9.18", "img": "https://img1.hscicdn.com/image/upload/f_auto,t_ds_square_w_320,q_50/lsci/db/PICTURES/CMS/319000/319028.png", "overseas": true, "country": "West Indies"},
    {"id": 101, "name": "Sachin Tendulkar", "role": "Batsman", "rating": 99, "base_price": 20000000, "stats": "Runs: 18426, Avg: 44.8, SR: 86.2 (ODI)", "img": "https://img1.hscicdn.com/image/upload/f_auto,t_ds_square_w_320,q_50/lsci/db/PICTURES/CMS/316500/316599.png", "overseas": false, "country": "India"},
    {"id": 102, "name": "Viv Richards", "role": "Batsman", "rating": 98, "base_price": 20000000, "stats": "Runs: 6721, Avg: 47.0, SR: 90.2 (ODI)", "img": "https://img1.hscicdn.com/image/upload/f_auto,t_ds_square_w_320,q_50/lsci/db/PICTURES/CMS/319000/319043.png", "overseas": true, "country": "West Indies"},
    {"id": 103, "name": "Shane Warne", "role": "Bowler", "rating": 99, "base_price": 20000000, "stats": "Wickets: 708 (Test), Wickets: 293 (ODI)", "img": "https://img1.hscicdn.com/image/upload/f_auto,t_ds_square_w_320,q_50/lsci/db/PICTURES/CMS/319000/319045.png", "overseas": true, "country": "Australia"},
    {"id": 104, "name": "Wasim Akram", "role": "Bowler", "rating": 98, "base_price": 20000000, "stats": "Wickets: 502 (ODI), Econ: 3.90, Wickets: 414 (Test)", "img": "https://img1.hscicdn.com/image/upload/f_auto,t_ds_square_w_320,q_50/lsci/db/PICTURES/CMS/319000/319048.png", "overseas": true, "country": "Pakistan"},
    {"id": 105, "name": "Jacques Kallis", "role": "All-Rounder", "rating": 98, "base_price": 20000000, "stats": "Runs: 11579 (ODI), Wickets: 273 (ODI)", "img": "https://img1.hscicdn.com/image/upload/f_auto,t_ds_square_w_320,q_50/lsci/db/PICTURES/CMS/319000/319050.png", "overseas": true, "country": "South Africa"},
    {"id": 106, "name": "Adam Gilchrist", "role": "Wicket-Keeper", "rating": 97, "base_price": 20000000, "stats": "Runs: 9619, Avg: 35.8, SR: 96.9, Dismissals: 472", "img": "https://img1.hscicdn.com/image/upload/f_auto,t_ds_square_w_320,q_50/lsci/db/PICTURES/CMS/319000/319054.png", "overseas": true, "country": "Australia"},
    {"id": 107, "name": "AB de Villiers", "role": "Batsman", "rating": 98, "base_price": 20000000, "stats": "Runs: 9577, Avg: 53.5, SR: 101.2, Fast ODI 100 (31b)", "img": "https://img1.hscicdn.com/image/upload/f_auto,t_ds_square_w_320,q_50/lsci/db/PICTURES/CMS/319000/319055.png", "overseas": true, "country": "South Africa"},
    {"id": 108, "name": "Glenn McGrath", "role": "Bowler", "rating": 97, "base_price": 15000000, "stats": "Wickets: 563 (Test), Econ: 2.49, Wickets: 381 (ODI)", "img": "https://img1.hscicdn.com/image/upload/f_auto,t_ds_square_w_320,q_50/lsci/db/PICTURES/CMS/319000/319058.png", "overseas": true, "country": "Australia"}
];

// Tab switching for Authentication overlay
function switchAuthTab(tab) {
    const tabLogin = document.getElementById('tab-login');
    const tabRegister = document.getElementById('tab-register');
    const formLogin = document.getElementById('login-form');
    const formRegister = document.getElementById('register-form');
    
    if (!tabLogin || !tabRegister || !formLogin || !formRegister) return;
    
    if (tab === 'login') {
        tabLogin.classList.add('active');
        tabRegister.classList.remove('active');
        formLogin.classList.remove('hidden');
        formRegister.classList.add('hidden');
    } else {
        tabLogin.classList.remove('active');
        tabRegister.classList.add('active');
        formLogin.classList.add('hidden');
        formRegister.classList.remove('hidden');
    }
}

async function handleLoginSubmit(event) {
    event.preventDefault();
    const usernameInput = document.getElementById('login-username');
    const passwordInput = document.getElementById('login-password');
    if (!usernameInput || !passwordInput) return;
    
    const username = usernameInput.value.trim();
    const password = passwordInput.value;
    
    try {
        const res = await apiPost('/api/auth/login', { username, password });
        localStorage.setItem('auth_token', res.auth_token);
        localStorage.setItem('auth_username', res.username);
        
        renderUserProfile(res.username);
        showNotification(`Welcome back, ${res.username}!`, "success");
        
        document.getElementById('login-overlay').classList.add('hidden');
        
        // Clear inputs
        usernameInput.value = '';
        passwordInput.value = '';
        
        if (roomCode) {
            connectEvents(roomCode);
        } else {
            showSection('home-view');
            loadPresets();
            renderScheduledAuctions();
        }
    } catch (err) {
        console.error("Login failed:", err);
    }
}

async function handleRegisterSubmit(event) {
    event.preventDefault();
    const usernameInput = document.getElementById('register-username');
    const passwordInput = document.getElementById('register-password');
    if (!usernameInput || !passwordInput) return;
    
    const username = usernameInput.value.trim();
    const password = passwordInput.value;
    
    try {
        const res = await apiPost('/api/auth/register', { username, password });
        localStorage.setItem('auth_token', res.auth_token);
        localStorage.setItem('auth_username', res.username);
        
        renderUserProfile(res.username);
        showNotification(`Account registered successfully! Welcome, ${res.username}!`, "success");
        
        document.getElementById('login-overlay').classList.add('hidden');
        
        // Clear inputs
        usernameInput.value = '';
        passwordInput.value = '';
        
        if (roomCode) {
            connectEvents(roomCode);
        } else {
            showSection('home-view');
            loadPresets();
            renderScheduledAuctions();
        }
    } catch (err) {
        console.error("Registration failed:", err);
    }
}

function continueAsGuest() {
    let guestToken = localStorage.getItem('persistent_guest_token');
    let guestName = localStorage.getItem('persistent_guest_username');
    
    if (!guestToken || !guestName) {
        const randomStr = Math.random().toString(36).substring(2, 8);
        guestToken = "guest_" + randomStr;
        guestName = "Guest_" + randomStr;
        localStorage.setItem('persistent_guest_token', guestToken);
        localStorage.setItem('persistent_guest_username', guestName);
    }
    
    localStorage.setItem('auth_token', guestToken);
    localStorage.setItem('auth_username', guestName);
    
    renderUserProfile(guestName);
    showNotification("Logged in as Guest User!", "success");
    
    document.getElementById('login-overlay').classList.add('hidden');
    
    if (roomCode) {
        connectEvents(roomCode);
    } else {
        showSection('home-view');
        loadPresets();
        renderScheduledAuctions();
    }
}

function renderUserProfile(username) {
    const badge = document.getElementById('user-profile-badge');
    const nameEl = document.getElementById('user-profile-name');
    const avatarEl = document.getElementById('user-profile-avatar');
    
    if (badge && nameEl) {
        nameEl.innerText = username;
        if (avatarEl) {
            avatarEl.innerText = username.charAt(0).toUpperCase();
        }
        badge.classList.remove('hidden');
    }
}

function signOut() {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_username');
    
    localStorage.removeItem('auction_role');
    localStorage.removeItem('auction_room_code');
    localStorage.removeItem('auction_team_name');
    localStorage.removeItem('auction_manager_name');
    localStorage.removeItem('auction_host_id');
    
    role = '';
    roomCode = '';
    teamName = '';
    managerName = '';
    hostId = '';
    roomState = null;
    
    document.getElementById('user-profile-badge').classList.add('hidden');
    location.reload();
}

function leaveRoom() {
    localStorage.removeItem('auction_role');
    localStorage.removeItem('auction_room_code');
    localStorage.removeItem('auction_team_name');
    localStorage.removeItem('auction_manager_name');
    localStorage.removeItem('auction_host_id');
    
    role = '';
    roomCode = '';
    teamName = '';
    managerName = '';
    hostId = '';
    roomState = null;
    
    if (eventSource) {
        eventSource.close();
        eventSource = null;
    }
    
    showSection('home-view');
    renderScheduledAuctions();
}

async function kickTeam(tName) {
    if (role !== 'host') return;
    if (!confirm(`Are you sure you want to kick team '${tName}'?`)) return;
    
    try {
        await apiPost('/api/control', {
            room_code: roomCode,
            host_id: hostId,
            action: 'kick',
            team_name: tName
        });
        showNotification(`Franchise '${tName}' has been kicked.`, "success");
    } catch (err) {
        console.error(err);
        showNotification("Failed to kick team: " + err.message, "danger");
    }
}

// On page load, try to restore session if roomCode exists
window.addEventListener('DOMContentLoaded', async () => {
    // Intercept room code input
    const roomInput = document.getElementById('join-room-code');
    if (roomInput) {
        roomInput.addEventListener('input', (e) => {
            e.target.value = e.target.value.toUpperCase();
        });
    }

    // Initialize audio toggle button state
    updateAudioToggleUI();

    // Initialize background music system (BGM) player
    initBgmPlayer();

    // Initialize active template theme
    const activeTheme = localStorage.getItem('auction_theme') || 'cyberpunk';
    const themeSelector = document.getElementById('theme-selector');
    if (themeSelector) {
        themeSelector.value = activeTheme;
    }
    changeTheme(activeTheme);

    const authToken = localStorage.getItem('auth_token');
    const authUsername = localStorage.getItem('auth_username');

    if (roomCode) {
        if (!authToken) {
            document.getElementById('login-overlay').classList.remove('hidden');
        } else {
            renderUserProfile(authUsername);
            showNotification("Restoring active session...", "success");
            connectEvents(roomCode);
        }
    } else {
        if (!authToken) {
            document.getElementById('login-overlay').classList.remove('hidden');
        } else {
            renderUserProfile(authUsername);
            showSection('home-view');
            loadPresets();
            renderScheduledAuctions();
        }
    }
});

// Navigation Helper
function showSection(id) {
    document.querySelectorAll('.view-panel').forEach(panel => {
        panel.classList.add('hidden');
        panel.classList.remove('active');
    });
    const activePanel = document.getElementById(id);
    if (activePanel) {
        activePanel.classList.remove('hidden');
        activePanel.classList.add('active');
    }
    
    // Custom Hooks
    if (id === 'host-config') {
        checkSavedDraft();
        if (!presetsLoaded) {
            loadPresets();
        }
    }
}

// CSV/Preset Selector and Filter Helper
function selectPreset(presetName) {
    const labels = document.querySelectorAll('.preset-label');
    labels.forEach(label => {
        const radio = label.querySelector('input[type="radio"]');
        if (radio && radio.value === presetName) {
            label.classList.add('active');
        } else {
            label.classList.remove('active');
        }
    });

    const customDiv = document.getElementById('custom-players-input');
    const tableContainer = document.getElementById('custom-players-table-container');
    
    if (customDiv) {
        customDiv.classList.remove('hidden'); // Always show the checklist input block
    }
    
    if (presetName === 'custom') {
        if (tableContainer) tableContainer.classList.remove('hidden');
        // Pre-populate custom players table if empty
        const rowsContainer = document.getElementById('custom-players-rows');
        if (rowsContainer && rowsContainer.children.length === 0) {
            for (let i = 0; i < 5; i++) {
                addCustomPlayerRow();
            }
        }
    } else {
        if (tableContainer) tableContainer.classList.add('hidden');
    }

    // Load players of the selected preset dynamically
    const targetKey = presetName === 'custom' ? 'full_pool' : presetName;
    const rawList = allPresetsData[targetKey] || [];
    
    allPresetPlayers = rawList.map(p => {
        const playerCopy = JSON.parse(JSON.stringify(p));
        playerCopy.source = presetName === 'ipl_legends' ? 'IPL' : (presetName === 'all_time_legends' ? 'Legend' : (presetName === 'h_liga' ? 'H-LIGA' : 'Full Pool'));
        playerCopy.country = p.country || (p.overseas ? 'Overseas' : 'India');
        return playerCopy;
    });

    // Re-generate remaining backup players if less than 500 (only for full_pool and custom)
    if ((presetName === 'full_pool' || presetName === 'custom') && allPresetPlayers.length < 500) {
        generateRemainingPlayers();
    }

    // Render players list checklist in DOM
    renderPlayersChecklist();
    
    // Auto check/uncheck based on preset
    const checkedBoxes = document.querySelectorAll('.checklist-item input[type="checkbox"]');
    checkedBoxes.forEach(cb => {
        cb.checked = true; // Auto-check by default
    });
    
    // Trigger filters if active
    const excludeRetired = document.getElementById('exclude-retired')?.checked || false;
    if (excludeRetired) {
        filterRetiredPlayers(true);
    }
    
    const searchQuery = document.getElementById('checklist-search')?.value || '';
    if (searchQuery.trim() !== '') {
        searchChecklistPlayers(searchQuery);
    }
}

// Interactive Custom Player Table Helpers
function addCustomPlayerRow() {
    const rowsContainer = document.getElementById('custom-players-rows');
    if (!rowsContainer) return;
    
    const nextSNo = rowsContainer.children.length + 1;
    const tr = document.createElement('tr');
    tr.innerHTML = `
        <td class="s-no" style="font-weight: bold; text-align: center; color: var(--text-secondary);">${nextSNo}</td>
        <td style="text-align: center; vertical-align: middle; position: relative;">
            <div class="cp-img-wrapper" style="width: 40px; height: 40px; border-radius: 50%; overflow: hidden; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.15); display: inline-block; cursor: pointer; position: relative;" onclick="triggerRowImgInput(this)" title="Click to upload player photo">
                <img class="cp-img-preview" src="data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'><circle cx='50' cy='40' r='25' fill='%23555'/><path d='M15 85 C15 65 30 55 50 55 C70 55 85 65 85 85' fill='%23555'/></svg>" style="width: 100%; height: 100%; object-fit: cover; object-position: center 15%;">
                <div style="position: absolute; bottom: 0; left: 0; right: 0; background: rgba(0,0,0,0.6); font-size: 8px; color: white; text-align: center; padding: 2px 0; opacity: 0; transition: opacity 0.2s;" class="upload-hover">UP</div>
            </div>
            <input type="file" class="cp-img-file-input" accept="image/*" style="display: none;" onchange="handleRowImgUpload(this)">
            <input type="hidden" class="cp-img-base64" value="">
        </td>
        <td><input type="text" class="cp-name" placeholder="e.g. Shreyas Iyer" style="text-align: left;" oninput="updateCustomPlayerAvatarPreview(this)"></td>
        <td>
            <select class="cp-role">
                <option value="Batsman">Batsman</option>
                <option value="Bowler">Bowler</option>
                <option value="All-Rounder">All-Rounder</option>
                <option value="Wicket-Keeper">Wicket-Keeper</option>
            </select>
        </td>
        <td><input type="text" class="cp-style" placeholder="e.g. Right-hand bat / Right-arm fast"></td>
        <td><input type="number" class="cp-rating" placeholder="85" min="50" max="99"></td>
        <td>
            <select class="cp-price">
                <option value="20000000">₹2 Crore (₹2 Cr)</option>
                <option value="15000000">₹1.5 Crore (₹1.5 Cr)</option>
                <option value="10000000" selected>₹1 Crore (₹1 Cr)</option>
                <option value="8000000">₹80 Lakhs (₹80 L)</option>
                <option value="5000000">₹50 Lakhs (₹50 L)</option>
                <option value="3000000">₹30 Lakhs (₹30 L)</option>
                <option value="2000000">₹20 Lakhs (₹20 L)</option>
            </select>
        </td>
        <td><input type="checkbox" class="cp-overseas"></td>
        <td style="text-align: center;">
            <button type="button" class="btn-remove-row" onclick="removeCustomPlayerRow(this)" title="Remove Player">
                <i class="fa-solid fa-trash-can"></i>
            </button>
        </td>
    `;
    rowsContainer.appendChild(tr);
}

function removeCustomPlayerRow(button) {
    const tr = button.closest('tr');
    if (tr) {
        tr.remove();
        updateCustomSerialNumbers();
    }
}

function updateCustomSerialNumbers() {
    const rowsContainer = document.getElementById('custom-players-rows');
    if (!rowsContainer) return;
    const rows = rowsContainer.querySelectorAll('tr');
    rows.forEach((row, index) => {
        row.querySelector('.s-no').innerText = index + 1;
    });
}

function importCSVToTable() {
    const csvTextarea = document.getElementById('custom-csv');
    if (!csvTextarea) return;
    const text = csvTextarea.value.trim();
    if (!text) {
        showNotification("Please paste some CSV data first", "warning");
        return;
    }
    
    // Parse the CSV
    const parsedPlayers = parseCSV(text);
    if (parsedPlayers.length === 0) {
        showNotification("No players could be parsed from the CSV. Check format.", "warning");
        return;
    }
    
    const rowsContainer = document.getElementById('custom-players-rows');
    if (!rowsContainer) return;
    
    // Check if the existing rows are all empty (i.e. name is empty).
    const existingRows = rowsContainer.querySelectorAll('tr');
    let allEmpty = true;
    existingRows.forEach(row => {
        const nameVal = row.querySelector('.cp-name').value.trim();
        if (nameVal !== '') {
            allEmpty = false;
        }
    });
    
    if (allEmpty) {
        rowsContainer.innerHTML = '';
    }
    
    parsedPlayers.forEach(player => {
        const nextSNo = rowsContainer.children.length + 1;
        const tr = document.createElement('tr');
        
        // Match role options: Batsman, Bowler, All-Rounder, Wicket-Keeper
        let roleVal = "Batsman";
        const roleLower = player.role.toLowerCase();
        if (roleLower.includes('keeper') || roleLower.includes('wk')) {
            roleVal = "Wicket-Keeper";
        } else if (roleLower.includes('all-rounder') || roleLower.includes('allrounder') || roleLower.includes('ar')) {
            roleVal = "All-Rounder";
        } else if (roleLower.includes('bowler') || roleLower.includes('bowl')) {
            roleVal = "Bowler";
        }
        
        // Base Price match: 20000000, 15000000, 10000000, 8000000, 5000000, 3000000, 2000000
        let basePriceVal = "10000000"; // default 1Cr
        const validPrices = ["20000000", "15000000", "10000000", "8000000", "5000000", "3000000", "2000000"];
        const playerPriceStr = String(player.base_price);
        if (validPrices.includes(playerPriceStr)) {
            basePriceVal = playerPriceStr;
        } else {
            // Find closest price
            let closest = validPrices[0];
            let minDiff = Math.abs(parseInt(closest) - player.base_price);
            for (let i = 1; i < validPrices.length; i++) {
                const diff = Math.abs(parseInt(validPrices[i]) - player.base_price);
                if (diff < minDiff) {
                    minDiff = diff;
                    closest = validPrices[i];
                }
            }
            basePriceVal = closest;
        }
        
        tr.innerHTML = `
            <td class="s-no" style="font-weight: bold; text-align: center; color: var(--text-secondary);">${nextSNo}</td>
            <td><input type="text" class="cp-name" value="${escapeHtml(player.name)}" placeholder="e.g. Shreyas Iyer" style="text-align: left;"></td>
            <td>
                <select class="cp-role">
                    <option value="Batsman" ${roleVal === "Batsman" ? "selected" : ""}>Batsman</option>
                    <option value="Bowler" ${roleVal === "Bowler" ? "selected" : ""}>Bowler</option>
                    <option value="All-Rounder" ${roleVal === "All-Rounder" ? "selected" : ""}>All-Rounder</option>
                    <option value="Wicket-Keeper" ${roleVal === "Wicket-Keeper" ? "selected" : ""}>Wicket-Keeper</option>
                </select>
            </td>
            <td><input type="text" class="cp-style" value="${escapeHtml(player.stats)}" placeholder="e.g. Right-hand bat / Right-arm fast"></td>
            <td><input type="number" class="cp-rating" value="${player.rating}" placeholder="85" min="50" max="99"></td>
            <td>
                <select class="cp-price">
                    <option value="20000000" ${basePriceVal === "20000000" ? "selected" : ""}>₹2 Crore (₹2 Cr)</option>
                    <option value="15000000" ${basePriceVal === "15000000" ? "selected" : ""}>₹1.5 Crore (₹1.5 Cr)</option>
                    <option value="10000000" ${basePriceVal === "10000000" ? "selected" : ""}>₹1 Crore (₹1 Cr)</option>
                    <option value="8000000" ${basePriceVal === "8000000" ? "selected" : ""}>₹80 Lakhs (₹80 L)</option>
                    <option value="5000000" ${basePriceVal === "5000000" ? "selected" : ""}>₹50 Lakhs (₹50 L)</option>
                    <option value="3000000" ${basePriceVal === "3000000" ? "selected" : ""}>₹30 Lakhs (₹30 L)</option>
                    <option value="2000000" ${basePriceVal === "2000000" ? "selected" : ""}>₹20 Lakhs (₹20 L)</option>
                </select>
            </td>
            <td><input type="checkbox" class="cp-overseas" ${player.overseas ? "checked" : ""}></td>
            <td style="text-align: center;">
                <button type="button" class="btn-remove-row" onclick="removeCustomPlayerRow(this)" title="Remove Player">
                    <i class="fa-solid fa-trash-can"></i>
                </button>
            </td>
        `;
        rowsContainer.appendChild(tr);
    });
    
    updateCustomSerialNumbers();
    csvTextarea.value = ''; // clear the textarea
    showNotification(`Successfully imported ${parsedPlayers.length} players into the table!`, "success");
}

function escapeHtml(text) {
    if (!text) return '';
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Format Currency to Lakhs / Crores
function formatCurrency(val) {
    if (val >= 10000000) {
        return "₹" + (val / 10000000).toFixed(2).replace(/\.00$/, '') + " Cr";
    } else if (val >= 100000) {
        return "₹" + (val / 100000).toFixed(2).replace(/\.00$/, '') + " L";
    }
    return "₹" + val.toLocaleString('en-IN');
}

// Parse custom CSV player lists
function parseCSV(text) {
    const lines = text.split('\n');
    const players = [];
    let id = 1000;
    
    for (let line of lines) {
        line = line.trim();
        if (!line) continue;
        const parts = line.split(',');
        if (parts.length >= 4) {
            const name = parts[0].trim();
            const role = parts[1].trim();
            const rating = parseInt(parts[2].trim()) || 85;
            
            // Clean base price from any string tags like 'Cr' or 'L'
            let basePriceRaw = parts[3].trim().toLowerCase();
            let basePrice = 2000000; // default 20 L
            if (basePriceRaw.includes('cr')) {
                basePrice = parseFloat(basePriceRaw.replace('cr', '')) * 10000000;
            } else if (basePriceRaw.includes('l')) {
                basePrice = parseFloat(basePriceRaw.replace('l', '')) * 100000;
            } else {
                basePrice = parseInt(basePriceRaw.replace(/[^0-9]/g, '')) || 2000000;
            }
            
            const stats = parts[4] ? parts[4].trim() : "Batsman/Bowler";
            const img = parts[5] ? parts[5].trim() : "";
            
            // Check for 7th column for nationality (overseas)
            let overseas = false;
            if (parts[6]) {
                const natVal = parts[6].trim().toLowerCase();
                if (natVal === 'true' || natVal === 'overseas' || (natVal && natVal !== 'india' && natVal !== 'indian')) {
                    overseas = true;
                }
            }
            
            players.push({
                id: id++,
                name: name,
                role: role,
                rating: rating,
                base_price: basePrice,
                stats: stats,
                img: img,
                overseas: overseas
            });
        }
    }
    return players;
}

// Load all presets from server
async function loadPresets() {
    try {
        let presetsData = null;
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 seconds timeout
            const response = await fetch('/api/presets', { signal: controller.signal });
            clearTimeout(timeoutId);
            if (response.ok) {
                presetsData = await response.json();
            } else {
                throw new Error("HTTP error " + response.status);
            }
        } catch (err) {
            console.warn("Failed to fetch dynamic presets from server, using local fallback presets:", err);
            if (window.ALL_PLAYERS_DATA) {
                presetsData = window.ALL_PLAYERS_DATA;
            }
        }
        
        if (presetsData) {
            allPresetsData = presetsData;
        }
        
        // Initialize default preset filter
        const activePreset = document.querySelector('input[name="preset-choice"]:checked')?.value || 'ipl_legends';
        selectPreset(activePreset);
        presetsLoaded = true;
    } catch (globalErr) {
        console.error("Critical error in loadPresets:", globalErr);
        showNotification("Critical error loading presets: " + globalErr.message, "danger");
    }
}

// Generate remaining players to reach 500+
function generateRemainingPlayers() {
    const countries = [
        { name: "India", overseas: false, firstNames: ["Rohit", "Virat", "Jasprit", "Rishabh", "Ravindra", "Shubman", "Hardik", "Suryakumar", "Shreyas", "KL", "Ishan", "Yashasvi", "Sanju", "Mohammed", "Ravichandran", "Axar", "Kuldeep", "Yuzvendra", "Ruturaj", "Rinku", "Shivam", "Tilak", "Washington", "Ravi", "Arshdeep", "Shardul", "Deepak", "Bhuvneshwar", "Shikhar", "Dinesh", "Cheteshwar", "Ajinkya", "Umesh", "Ishant", "Wriddhiman", "Mayank"], lastNames: ["Sharma", "Kohli", "Bumrah", "Pant", "Jadeja", "Gill", "Pandya", "Yadav", "Iyer", "Rahul", "Kishan", "Jaiswal", "Samson", "Siraj", "Ashwin", "Patel", "Yadav", "Chahal", "Gaikwad", "Singh", "Dube", "Varma", "Sundar", "Bishnoi", "Singh", "Kumar", "Thakur", "Chahar", "Kumar", "Dhawan", "Karthik", "Pujara", "Rahane", "Yadav", "Saha", "Agarwal"] },
        { name: "Australia", overseas: true, firstNames: ["Steven", "Travis", "Mitchell", "Pat", "David", "Marcus", "Glenn", "Adam", "Josh", "Alex", "Cameron", "Usman", "Marnus", "Matthew", "Nathan", "Sean", "Kane", "Aaron", "Shaun", "Jason", "Ashton", "Tim", "Chris"], lastNames: ["Smith", "Head", "Marsh", "Cummins", "Warner", "Stoinis", "Maxwell", "Zampa", "Hazlewood", "Carey", "Green", "Khawaja", "Labuschagne", "Wade", "Starc", "Lyon", "Abbott", "Richardson", "Finch", "Behrendorff", "Agar", "David", "Lynn"] },
        { name: "England", overseas: true, firstNames: ["Jos", "Joe", "Ben", "Jonny", "Harry", "Liam", "Sam", "Adil", "Mark", "Chris", "Jofra", "Ollie", "Zak", "Ben", "Rehan", "Gus", "Tom", "Moeen", "Dawid", "Alex", "Jason"], lastNames: ["Buttler", "Root", "Stokes", "Bairstow", "Brook", "Livingstone", "Curran", "Rashid", "Wood", "Woakes", "Archer", "Pope", "Crawley", "Duckett", "Ahmed", "Ali", "Malan", "Hales", "Roy", "Anderson", "Broad"] },
        { name: "South Africa", overseas: true, firstNames: ["Quinton", "Temba", "Aiden", "Reeza", "Heinrich", "David", "Marco", "Kagiso", "Anrich", "Keshav", "Lungi", "Gerald", "Tabraiz", "Dewald", "Tristan", "Rassie", "Faf", "Hashim", "Dale"], lastNames: ["de Kock", "Bavuma", "Markram", "Hendricks", "Klaasen", "Miller", "Jansen", "Rabada", "Nortje", "Maharaj", "Ngidi", "Coetzee", "Shamsi", "Brevis", "Stubbs", "van der Dussen", "du Plessis", "Amla", "Steyn"] },
        { name: "Pakistan", overseas: true, firstNames: ["Babar", "Shaheen", "Mohammad", "Haris", "Naseem", "Shadab", "Fakhar", "Imam", "Iftikhar", "Azam", "Usama", "Imad", "Abrar", "Zaman", "Saud", "Abdullah", "Sarfaraz", "Shoaib"], lastNames: ["Azam", "Afridi", "Rizwan", "Rauf", "Shah", "Khan", "Zaman", "ul-Haq", "Ahmed", "Khan", "Wasim", "Mir", "Ali", "Ashraf", "Masood", "Shafique", "Ahmed", "Malik"] },
        { name: "New Zealand", overseas: true, firstNames: ["Kane", "Devon", "Daryl", "Rachin", "Glenn", "Mitchell", "Tom", "Matt", "Trent", "Tim", "Lockie", "Ish", "Adam", "Finn", "Michael", "Henry", "Mark", "Colin"], lastNames: ["Williamson", "Conway", "Mitchell", "Ravindra", "Phillips", "Santner", "Latham", "Henry", "Boult", "Southee", "Ferguson", "Sodhi", "Milne", "Allen", "Bracewell", "Nicholls", "Chapman", "Guptill"] },
        { name: "West Indies", overseas: true, firstNames: ["Nicholas", "Shai", "Rovman", "Brandon", "Kyle", "Alzarri", "Jason", "Andre", "Sunil", "Shimron", "Sherfane", "Romario", "Akeal", "Gudakesh", "Shamar", "Roston"], lastNames: ["Pooran", "Hope", "Powell", "King", "Mayers", "Joseph", "Holder", "Russell", "Narine", "Hetmyer", "Rutherford", "Shepherd", "Hosein", "Motie", "Joseph", "Chase"] }
    ];

    const roles = ["Batsman", "Bowler", "All-Rounder", "Wicket-Keeper"];
    const existingNames = new Set(allPresetPlayers.map(p => p.name));
    let nextId = 500;
    
    while (allPresetPlayers.length < 505) {
        const country = countries[Math.floor(Math.random() * countries.length)];
        const fName = country.firstNames[Math.floor(Math.random() * country.firstNames.length)];
        const lName = country.lastNames[Math.floor(Math.random() * country.lastNames.length)];
        const name = `${fName} ${lName}`;
        
        if (existingNames.has(name)) {
            continue;
        }
        
        existingNames.add(name);
        const role = roles[Math.floor(Math.random() * roles.length)];
        
        let rating = 75;
        const roll = Math.random();
        if (roll > 0.95) {
            rating = Math.floor(Math.random() * 6) + 90; // 90-95
        } else if (roll > 0.80) {
            rating = Math.floor(Math.random() * 5) + 85; // 85-89
        } else if (roll > 0.30) {
            rating = Math.floor(Math.random() * 5) + 80; // 80-84
        } else {
            rating = Math.floor(Math.random() * 5) + 75; // 75-79
        }
        
        let basePrice = 2000000;
        if (rating >= 90) {
            basePrice = Math.random() > 0.5 ? 20000000 : 15000000; // 2 Cr or 1.5 Cr
        } else if (rating >= 85) {
            basePrice = Math.random() > 0.5 ? 10000000 : 7500000; // 1 Cr or 75 L
        } else if (rating >= 80) {
            basePrice = Math.random() > 0.5 ? 5000000 : 3000000; // 50 L or 30 L
        }
        
        let stats = "";
        if (role === "Batsman") {
            const runs = Math.floor(Math.random() * 5000) + 1500;
            const avg = (Math.random() * 15 + 28).toFixed(1);
            const sr = (Math.random() * 20 + 122).toFixed(1);
            stats = `Runs: ${runs}, Avg: ${avg}, SR: ${sr}`;
        } else if (role === "Bowler") {
            const wkts = Math.floor(Math.random() * 120) + 40;
            const econ = (Math.random() * 1.5 + 6.8).toFixed(2);
            const avg = (Math.random() * 7 + 21).toFixed(1);
            stats = `Wickets: ${wkts}, Econ: ${econ}, Avg: ${avg}`;
        } else if (role === "All-Rounder") {
            const runs = Math.floor(Math.random() * 2500) + 800;
            const wkts = Math.floor(Math.random() * 80) + 25;
            const sr = (Math.random() * 25 + 125).toFixed(1);
            const econ = (Math.random() * 1.8 + 7.2).toFixed(2);
            stats = `Runs: ${runs} (SR: ${sr}), Wkts: ${wkts} (Econ: ${econ})`;
        } else if (role === "Wicket-Keeper") {
            const runs = Math.floor(Math.random() * 3500) + 1000;
            const sr = (Math.random() * 15 + 120).toFixed(1);
            const dis = Math.floor(Math.random() * 60) + 20;
            stats = `Runs: ${runs} (SR: ${sr}), Dismissals: ${dis}`;
        }
        
        allPresetPlayers.push({
            id: nextId++,
            name: name,
            role: role,
            rating: rating,
            base_price: basePrice,
            stats: stats,
            img: "",
            overseas: country.overseas,
            country: country.name
        });
    }
}

// Render player checklist in host configuration
function renderPlayersChecklist() {
    const grid = document.getElementById('players-checklist');
    if (!grid) return;
    grid.innerHTML = '';
    
    if (allPresetPlayers.length === 0) {
        grid.innerHTML = '<span class="help-text">No players available.</span>';
        return;
    }
    
    const excludeRetired = document.getElementById('exclude-retired')?.checked || false;
    const query = document.getElementById('checklist-search')?.value.trim().toLowerCase() || '';
    
    allPresetPlayers.forEach(p => {
        const label = document.createElement('div');
        const isRetiredHidden = p.retired && excludeRetired;
        const isSearchHidden = query !== '' && !p.name.toLowerCase().includes(query);
        const isFilterHidden = currentChecklistFilter !== 'All' && (
            currentChecklistFilter === 'Overseas' ? !p.overseas :
            currentChecklistFilter === 'Indian' ? p.overseas :
            p.role !== currentChecklistFilter
        );
        
        let classes = ['checklist-item'];
        if (isRetiredHidden) classes.push('hidden-retired');
        if (isSearchHidden) classes.push('hidden-search');
        if (isFilterHidden) classes.push('hidden-filter');
        
        label.className = classes.join(' ');
        
        const countryLabel = p.country ? p.country : (p.overseas ? 'Overseas' : 'India');
        const isChecked = (isRetiredHidden || isFilterHidden) ? false : true;
        
        const ratingVal = p.rating || 0;
        let tierClass = 'tier-bronze';
        if (ratingVal >= 90) tierClass = 'tier-gold';
        else if (ratingVal >= 80) tierClass = 'tier-silver';
        
        const avatarUrl = p.img || getPlayerAvatar(p.name);
        label.innerHTML = `
            <input type="checkbox" id="check-p-${p.id}" value="${p.id}" ${isChecked ? 'checked' : ''}>
            <img src="${avatarUrl}" style="width: 32px; height: 32px; border-radius: 50%; object-fit: cover; object-position: center 15%; border: 1px solid rgba(255,255,255,0.12); margin-left: 0.5rem; margin-right: 0.25rem; flex-shrink: 0;">
            <div class="checklist-item-meta" style="flex-grow: 1;">
                <span class="checklist-item-name">${p.name} <span class="flag-icon" style="font-size: 0.75rem; color: var(--text-secondary);">(${countryLabel})</span></span>
                <div class="checklist-item-sub">
                    <span>${p.role}</span>
                    <span>•</span>
                    <span>Base: ${formatCurrency(p.base_price)}</span>
                </div>
            </div>
            <div class="checklist-rating-input" style="display: flex; flex-direction: column; align-items: flex-end; gap: 0.15rem;">
                <span class="${tierClass}" style="font-size: 0.8rem; font-weight: 700;"><i class="fa-solid fa-award"></i> ${ratingVal}</span>
                <input type="number" id="rating-p-${p.id}" placeholder="${p.rating}" min="1" max="99" style="width: 50px; height: 26px; padding: 0.2rem; background: rgba(0,0,0,0.3); border: 1px solid var(--border-color); color: white; border-radius: 4px; text-align: center; font-size: 0.8rem;">
            </div>
        `;
        grid.appendChild(label);
    });
}

// Helper to select/deselect all checklist checkboxes
function toggleAllChecklist(checked) {
    const checkboxes = document.querySelectorAll('.checklist-item:not(.hidden-retired):not(.hidden-search):not(.hidden-filter) input[type="checkbox"]');
    checkboxes.forEach(cb => cb.checked = checked);
}

// Helper to filter/hide retired players in the checklist
function filterRetiredPlayers(exclude) {
    allPresetPlayers.forEach(p => {
        if (p.retired) {
            const cb = document.getElementById(`check-p-${p.id}`);
            const item = cb ? cb.closest('.checklist-item') : null;
            if (item) {
                if (exclude) {
                    item.classList.add('hidden-retired');
                    cb.checked = false; // automatically deselect
                } else {
                    item.classList.remove('hidden-retired');
                }
            }
        }
    });
}

// Helper to filter/hide players by search query
function searchChecklistPlayers(query) {
    const q = query.trim().toLowerCase();
    allPresetPlayers.forEach(p => {
        const cb = document.getElementById(`check-p-${p.id}`);
        const item = cb ? cb.closest('.checklist-item') : null;
        if (item) {
            const matches = p.name.toLowerCase().includes(q);
            if (matches) {
                item.classList.remove('hidden-search');
            } else {
                item.classList.add('hidden-search');
            }
        }
    });
}

// API Post Helper
async function apiPost(endpoint, body) {
    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        
        if (response.status === 401) {
            localStorage.removeItem('auth_token');
            localStorage.removeItem('auth_username');
            document.getElementById('user-profile-badge')?.classList.add('hidden');
            document.getElementById('login-overlay')?.classList.remove('hidden');
            showNotification("Session expired. Please log in again.", "warning");
            throw new Error("Session expired. Please log in again.");
        }
        
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || "Request failed");
        }
        return data;
    } catch (err) {
        showNotification(err.message, "warning");
        throw err;
    }
}

// Host Creates Room
async function createRoom() {
    const auctionNameVal = document.getElementById('auction-name').value.trim() || "Cricket Premier League";
    const hostNameVal = document.getElementById('host-name').value.trim();
    const budgetVal = parseInt(document.getElementById('starting-budget').value);
    const incrementVal = parseInt(document.getElementById('bid-increment').value);
    const timerVal = parseInt(document.getElementById('bid-timer').value);
    const presetChoice = document.querySelector('input[name="preset-choice"]:checked').value;
    
    if (!hostNameVal) {
        showNotification("Please enter a host name", "warning");
        return;
    }
    
    let playersList = [];
    // 1. Add checked preset players (always read checked boxes from the checklist)
    const checkedBoxes = document.querySelectorAll('.checklist-item input[type="checkbox"]:checked');
    checkedBoxes.forEach(input => {
        const pId = parseInt(input.value);
        const playerObj = allPresetPlayers.find(p => p.id === pId);
        if (playerObj) {
            const playerCopy = JSON.parse(JSON.stringify(playerObj));
            // Read custom rating input value
            const ratingInput = document.getElementById(`rating-p-${pId}`);
            if (ratingInput && ratingInput.value.trim() !== '') {
                playerCopy.rating = parseInt(ratingInput.value.trim()) || playerObj.rating;
            }
            playersList.push(playerCopy);
        }
    });
    
    // 2. Read custom players from the interactive table (only if preset choice is custom)
    if (presetChoice === 'custom') {
        const customRows = document.querySelectorAll('#custom-players-rows tr');
        let customIndex = 1;
        customRows.forEach(row => {
            const nameEl = row.querySelector('.cp-name');
            const roleEl = row.querySelector('.cp-role');
            const styleEl = row.querySelector('.cp-style');
            const ratingEl = row.querySelector('.cp-rating');
            const priceEl = row.querySelector('.cp-price');
            const overseasEl = row.querySelector('.cp-overseas');
            const imgEl = row.querySelector('.cp-img-base64');
            
            const name = nameEl ? nameEl.value.trim() : '';
            const role = roleEl ? roleEl.value : 'Batsman';
            const style = styleEl && styleEl.value.trim() !== '' ? styleEl.value.trim() : (role === 'Bowler' ? 'Right-arm fast' : 'Right-hand bat');
            const rating = ratingEl && ratingEl.value.trim() !== '' ? parseInt(ratingEl.value.trim()) : 85;
            const basePrice = priceEl ? parseInt(priceEl.value) : 10000000;
            const overseas = overseasEl ? overseasEl.checked : false;
            const img = imgEl ? imgEl.value.trim() : '';
            
            if (name) {
                playersList.push({
                    id: 2000 + customIndex,
                    name: name,
                    role: role,
                    rating: rating,
                    base_price: basePrice,
                    stats: style,
                    img: img,
                    overseas: overseas,
                    country: overseas ? "Overseas" : "India"
                });
                customIndex++;
            }
        });
    }
    
    if (playersList.length === 0) {
        showNotification("No players selected or entered! Select at least one player.", "warning");
        return;
    }
    
    const settings = {
        budget: budgetVal,
        min_increment: incrementVal,
        timer_duration: timerVal,
        overseas_limit: 999,
        bot_auctioneer: document.getElementById('auctioneer-mode').value === 'bot',
        squad_limit: parseInt(document.getElementById('squad-limit').value) || 16
    };
    
    try {
        const res = await apiPost('/api/create', {
            auth_token: localStorage.getItem('auth_token'),
            host_name: hostNameVal,
            auction_name: auctionNameVal,
            settings: settings,
            preset: presetChoice,
            players: playersList
        });
        
        // Save state variables
        
        role = 'host';
        roomCode = res.room_code;
        hostId = res.host_id;
        roomState = res.room_state;

        // Save to scheduled auctions in localStorage so host can host/rejoin later
        try {
            let scheduled = JSON.parse(localStorage.getItem('scheduled_auctions') || '[]');
            if (!scheduled.some(item => item.roomCode === roomCode)) {
                scheduled.push({
                    roomCode: roomCode,
                    hostId: hostId,
                    auctionName: roomState.auction_name || auctionNameVal || 'Cricket Auction',
                    createdAt: new Date().toLocaleDateString()
                });
                localStorage.setItem('scheduled_auctions', JSON.stringify(scheduled));
            }
        } catch (e) {
            console.error("Failed to save scheduled auction:", e);
        }

        
        localStorage.setItem('auction_role', 'host');
        localStorage.setItem('auction_room_code', roomCode);
        localStorage.setItem('auction_host_id', hostId);
        
        showNotification("Lobby successfully created!", "success");
        connectEvents(roomCode);
    } catch (err) {
        console.error(err);
    }
}

// Manager Joins Room
async function joinRoom() {
    const codeVal = document.getElementById('join-room-code').value.trim().toUpperCase();
    const teamVal = document.getElementById('join-team-name').value.trim();
    const managerVal = document.getElementById('join-manager-name').value.trim();
    
    if (!codeVal || !teamVal || !managerVal) {
        showNotification("Please fill in all joining parameters", "warning");
        return;
    }
    
    try {
        const res = await apiPost('/api/join', {
            auth_token: localStorage.getItem('auth_token'),
            room_code: codeVal,
            team_name: teamVal,
            manager_name: managerVal
        });
        
        // Save state variables
        role = 'manager';
        roomCode = res.room_code;
        teamName = res.team_name;
        managerName = res.manager_name;
        roomState = res.room_state;
        
        localStorage.setItem('auction_role', 'manager');
        localStorage.setItem('auction_room_code', roomCode);
        localStorage.setItem('auction_team_name', teamName);
        localStorage.setItem('auction_manager_name', managerName);
        
        showNotification("Joined franchise lobby!", "success");
        connectEvents(roomCode);
    } catch (err) {
        console.error(err);
    }
}

// Connect SSE stream
function connectEvents(code) {
    if (eventSource) {
        eventSource.close();
    }
    
    // Reset render cache on new connection/reconnection to force full initial paint
    lastRendered = {
        currentPlayerIndex: -2,
        roomStatus: '',
        queueFilter: '',
        roleFilter: '',
        logsCount: 0,
        teamsHash: '',
        currentBid: -1,
        currentBidder: ''
    };
    
    const url = `/events?room=${code}&clientId=${clientId}`;
    eventSource = new EventSource(url);
    
    const connectionStatusText = document.getElementById('connection-status-text');
    const indicator = document.querySelector('.status-indicator');
    
    eventSource.onopen = () => {
        if (connectionStatusText) connectionStatusText.innerText = "Connected";
        if (indicator) {
            indicator.classList.remove('offline');
            indicator.classList.add('online');
        }
    };
    
    eventSource.onerror = (e) => {
        if (connectionStatusText) connectionStatusText.innerText = "Reconnecting...";
        if (indicator) {
            indicator.classList.remove('online');
            indicator.classList.add('offline');
        }
        // Browsers handle automatic reconnect for EventSource
    };
    
    // Core state event listener
    eventSource.addEventListener('init', (e) => {
        roomState = JSON.parse(e.data);
        renderState();
    });
    
    eventSource.addEventListener('state_update', (e) => {
        roomState = JSON.parse(e.data);
        renderState();
    });
    
    // Bidding event listener
    eventSource.addEventListener('bid_placed', (e) => {
        const payload = JSON.parse(e.data);
        roomState = payload.room;
        
        // Play sound pop
        playAuctionSound('bid');
        
        // Highlight active card
        const card = document.getElementById('active-player-card');
        if (card) {
            card.classList.add('active-bidding');
            setTimeout(() => card.classList.remove('active-bidding'), 600);
        }
        
        // Brief bid alert banner
        showNotification(`${payload.bidder} bid ${formatCurrency(payload.amount)}!`, "success");
        renderState();
        
        // Handle timer update
        currentTimerVal = payload.timer;
        updateTimerProgressBar(currentTimerVal);
    });
    
    // Timer ticker
    eventSource.addEventListener('timer', (e) => {
        const data = JSON.parse(e.data);
        currentTimerVal = data.timer;
        updateTimerProgressBar(currentTimerVal);
    });
    
    // Sold celebration
    eventSource.addEventListener('player_sold', (e) => {
        const payload = JSON.parse(e.data);
        roomState = payload.room;
        
        // Play sold fanfare chord
        playAuctionSound('sold');
        
        // Trigger visual confetti
        triggerConfetti();
        
        // Trigger sold stamp layout
        const stamp = document.getElementById('player-sale-stamp');
        if (stamp) {
            stamp.innerText = "SOLD";
            stamp.className = "sale-stamp";
            stamp.classList.remove('hidden');
        }
        const card = document.getElementById('active-player-card');
        if (card) {
            card.className = "player-card glass-panel sold-card";
        }
        
        showNotification(`${payload.player.name} sold to ${payload.bidder}!`, "success");
        renderState();
    });
    
    // Unsold notification
    eventSource.addEventListener('player_unsold', (e) => {
        const payload = JSON.parse(e.data);
        roomState = payload.room;
        
        // Play unsold thud
        playAuctionSound('unsold');
        
        const stamp = document.getElementById('player-sale-stamp');
        if (stamp) {
            stamp.innerText = "UNSOLD";
            stamp.className = "sale-stamp unsold";
            stamp.classList.remove('hidden');
        }
        const card = document.getElementById('active-player-card');
        if (card) {
            card.className = "player-card glass-panel unsold-card";
        }
        
        showNotification(`${payload.player.name} went unsold!`, "warning");
        renderState();
    });
}

// Trigger browser confetti burst
function triggerConfetti() {
    if (typeof confetti === 'function') {
        // Left splash
        confetti({
            particleCount: 80,
            angle: 60,
            spread: 55,
            origin: { x: 0, y: 0.8 }
        });
        // Right splash
        confetti({
            particleCount: 80,
            angle: 120,
            spread: 55,
            origin: { x: 1, y: 0.8 }
        });
    }
}

// Smoothly adjust progress bar count
function updateTimerProgressBar(val) {
    const text = document.getElementById('timer-text');
    const bar = document.getElementById('timer-progress-bar');
    
    if (roomState && roomState.settings && roomState.settings.timer_duration === 0) {
        if (text) text.innerText = "Unlimited";
        if (bar) {
            bar.style.width = "100%";
            bar.classList.remove('warning');
        }
        const timerContainer = document.querySelector('.timer-section');
        if (timerContainer) timerContainer.classList.remove('timer-pulse-critical');
        return;
    }
    
    if (text) text.innerText = val;
    
    if (bar && roomState && roomState.settings) {
        const duration = roomState.settings.timer_duration;
        const percentage = (val / duration) * 100;
        bar.style.width = percentage + "%";
        
        if (val <= 5) {
            bar.classList.add('warning');
            const timerContainer = document.querySelector('.timer-section');
            if (timerContainer) timerContainer.classList.add('timer-pulse-critical');
            
            // Play countdown ticking sound warning
            if (val > 0 && roomState.status === 'active' && roomState.timer_active && lastWarningSec !== val) {
                lastWarningSec = val;
                playAuctionSound('warning');
            }
        } else {
            bar.classList.remove('warning');
            const timerContainer = document.querySelector('.timer-section');
            if (timerContainer) timerContainer.classList.remove('timer-pulse-critical');
        }
        
        if (val > 5) {
            lastWarningSec = -1; // Reset when above 5
        }
    }
}

// Render dynamic state updates to UI
function renderState() {
    if (!roomState) return;
    
    // Check if we are a manager and have been kicked by the host
    if (role === 'manager' && roomState.teams && !roomState.teams[teamName]) {
        showNotification("You have been kicked by the host.", "danger");
        leaveRoom();
        return;
    }
    
    // 1. Manage visible section transitions
    if (roomState.status === 'lobby') {
        showSection('lobby-view');
        renderLobby();
    } else {
        showSection('auction-view');
        renderAuctionDashboard();
    }
}

// Render Lobby Section
function renderLobby() {
    document.getElementById('lobby-room-code').innerText = roomCode;
    
    if (roomState && roomState.auction_name) {
        document.getElementById('lobby-auction-name').innerText = roomState.auction_name;
    } else {
        document.getElementById('lobby-auction-name').innerText = "Franchise Waiting Room";
    }
    
    const statusText = document.getElementById('lobby-status-text');
    if (role === 'host') {
        statusText.innerText = "You are the Host. Wait for managers to join, then start.";
        document.getElementById('host-start-panel').classList.remove('hidden');
    } else {
        statusText.innerText = `Connected as ${teamName} (${managerName}). Waiting for host to start...`;
        document.getElementById('host-start-panel').classList.add('hidden');
    }
    
    // Connected count
    const teams = Object.keys(roomState.teams);
    document.getElementById('connected-count').innerText = teams.length;
    
    // Load joined teams list
    const grid = document.getElementById('lobby-teams-grid');
    grid.innerHTML = '';
    
    if (teams.length === 0) {
        grid.innerHTML = '<div class="help-text">No franchises connected yet.</div>';
    } else {
        teams.forEach(tName => {
            const team = roomState.teams[tName];
            const div = document.createElement('div');
            div.className = "lobby-team-card";
            
            let kickBtnHtml = '';
            if (role === 'host') {
                kickBtnHtml = `
                    <button class="btn-kick" onclick="kickTeam('${tName}')" title="Kick Team" style="margin-left: auto;">
                        <i class="fa-solid fa-user-slash"></i>
                    </button>
                `;
            }
            
            div.innerHTML = `
                <div class="lobby-team-row">
                    <div style="display: flex; align-items: center; gap: 0.75rem;">
                        <div class="lobby-team-icon"><i class="fa-solid fa-shield-halved"></i></div>
                        <div class="lobby-team-info">
                            <h4>${tName}</h4>
                            <span>Mgr: ${team.manager}</span>
                        </div>
                    </div>
                    ${kickBtnHtml}
                </div>
            `;
            grid.appendChild(div);
        });
    }
    
    // Populate lobby-specific-player dropdown with unsold players for the host
    const lobbyPlayerSelect = document.getElementById('lobby-specific-player');
    if (lobbyPlayerSelect && roomState && roomState.players) {
        const currentSelected = lobbyPlayerSelect.value;
        lobbyPlayerSelect.innerHTML = '<option value="">-- Sequential / Next Up --</option>';
        const unsoldPlayers = roomState.players.filter(p => p.status !== 'sold' && !p.bought_by);
        unsoldPlayers.sort((a, b) => a.name.localeCompare(b.name));
        unsoldPlayers.forEach(p => {
            const opt = document.createElement('option');
            opt.value = p.id;
            opt.textContent = `${p.name} (${p.role} - ${formatCurrency(p.base_price)})`;
            if (p.id.toString() === currentSelected) {
                opt.selected = true;
            }
            lobbyPlayerSelect.appendChild(opt);
        });
    }
}

// Start the drafting
async function startAuction() {
    if (role !== 'host') return;
    
    const filterEl = document.getElementById('lobby-role-filter');
    const roleFilter = filterEl ? filterEl.value : 'All';
    const playerSelect = document.getElementById('lobby-specific-player');
    const playerId = playerSelect ? playerSelect.value : '';
    
    const params = {
        room_code: roomCode,
        host_id: hostId,
        action: 'start',
        role_filter: roleFilter
    };
    
    if (playerId) {
        params.player_id = playerId;
    }
    
    try {
        await apiPost('/api/control', params);
    } catch (err) {
        console.error(err);
    }
}

// Enter the draft room from lobby (moves everyone to dashboard without starting auction)
async function enterDraftRoom() {
    if (role !== 'host') return;
    try {
        await apiPost('/api/control', {
            room_code: roomCode,
            host_id: hostId,
            action: 'open_dashboard'
        });
    } catch (err) {
        console.error(err);
    }
}

// Start player auction from the dashboard host administration card
async function dashboardStartAuction() {
    if (role !== 'host') return;
    
    const filterEl = document.getElementById('dashboard-role-filter');
    const roleFilter = filterEl ? filterEl.value : 'All';
    const playerSelect = document.getElementById('dashboard-specific-player');
    const playerId = playerSelect ? playerSelect.value : '';
    
    const params = {
        room_code: roomCode,
        host_id: hostId,
        action: 'start',
        role_filter: roleFilter
    };
    
    if (playerId) {
        params.player_id = playerId;
    }
    
    try {
        await apiPost('/api/control', params);
    } catch (err) {
        console.error(err);
    }
}

// Function to generate unique hash of current teams budget and squads
function getTeamsStateHash() {
    if (!roomState || !roomState.teams) return '';
    return Object.keys(roomState.teams).map(tName => {
        const team = roomState.teams[tName];
        return `${tName}:${team.budget}:${team.players.length}`;
    }).join('|');
}

// Full rebuild of Leaderboard DOM
function renderLeaderboard() {
    const leaderboardGrid = document.getElementById('leaderboard-container');
    if (!leaderboardGrid || !roomState || !roomState.teams) return;
    leaderboardGrid.innerHTML = '';
    
    const teamKeys = Object.keys(roomState.teams);
    // Sort teams by budget descending
    teamKeys.sort((a, b) => roomState.teams[b].budget - roomState.teams[a].budget);
    
    teamKeys.forEach(tName => {
        const team = roomState.teams[tName];
        const row = document.createElement('div');
        
        // Highlight active bidder
        const isHighBidder = roomState.current_bidder === tName && roomState.current_bid > 0;
        row.className = "leaderboard-row" + (isHighBidder ? " high-bidder-highlight" : "");
        row.onclick = () => openRosterModal(tName);
        
        let kickBtnHtml = '';
        if (role === 'host') {
            kickBtnHtml = `
                <button class="btn-kick" onclick="event.stopPropagation(); kickTeam('${tName}')" title="Kick Team">
                    <i class="fa-solid fa-user-slash"></i>
                </button>
            `;
        }
        
        const startingBudget = roomState.settings.budget || 1000000000;
        const percentage = Math.max(0, Math.min(100, (team.budget / startingBudget) * 100));
        let progressClass = 'budget-fill-safe';
        if (percentage < 25) progressClass = 'budget-fill-danger';
        else if (percentage < 55) progressClass = 'budget-fill-warning';
        
        row.innerHTML = `
            <div style="display: flex; flex-direction: column; width: 100%; gap: 0.35rem;">
                <div style="display: flex; align-items: center; justify-content: space-between; width: 100%;">
                    <div class="leader-team-info">
                        <div class="leader-team-icon"><i class="fa-solid fa-shield-halved"></i></div>
                        <div>
                            <span class="leader-team-name">${tName}</span>
                            <span class="leader-manager-name">Mgr: ${team.manager}</span>
                        </div>
                    </div>
                    <div class="leader-team-stats">
                        <span class="leader-team-count">${team.players.length} Players</span>
                        <span class="leader-team-budget" style="font-weight: 700; color: ${isHighBidder ? 'var(--accent-cyan)' : 'var(--text-primary)'}">${formatCurrency(team.budget)}</span>
                        <i class="fa-solid fa-eye" title="View Squad Roster" style="margin-left: 0.5rem; color: var(--text-secondary); opacity: 0.7;"></i>
                        ${kickBtnHtml}
                    </div>
                </div>
                <div class="budget-progress-bar">
                    <div class="budget-progress-fill ${progressClass}" style="width: ${percentage}%;"></div>
                </div>
            </div>
        `;
        leaderboardGrid.appendChild(row);
    });
}

// In-place update of Leaderboard active bidder highlights
function updateLeaderboardHighlights() {
    if (!roomState || !roomState.teams) return;
    const rows = document.querySelectorAll('.leaderboard-row');
    rows.forEach(row => {
        const teamNameSpan = row.querySelector('.leader-team-name');
        if (teamNameSpan) {
            const tName = teamNameSpan.textContent.trim();
            const isHighBidder = roomState.current_bidder === tName && roomState.current_bid > 0;
            const budgetSpan = row.querySelector('.leader-team-budget');
            if (isHighBidder) {
                row.classList.add('high-bidder-highlight');
                if (budgetSpan) budgetSpan.style.color = 'var(--accent-cyan)';
            } else {
                row.classList.remove('high-bidder-highlight');
                if (budgetSpan) budgetSpan.style.color = 'var(--text-primary)';
            }
        }
    });
}

// Render Auction Section
function renderAuctionDashboard() {
    const isRetention = roomState.status === 'retention';
    const retentionPanel = document.getElementById('retention-panel');
    const hostRetentionDesk = document.getElementById('host-retention-desk');
    const playerInfoContainer = document.getElementById('active-player-info-container');
    const hostSetupContainer = document.getElementById('host-setup-container');
    const bidPanel = document.getElementById('bidding-controls-panel');
    const hostConsole = document.getElementById('host-admin-panel');

    if (isRetention) {
        if (playerInfoContainer) playerInfoContainer.classList.add('hidden');
        if (hostSetupContainer) hostSetupContainer.classList.add('hidden');
        if (bidPanel) bidPanel.classList.add('hidden');
        if (hostConsole) hostConsole.classList.add('hidden');
        
        if (role === 'host') {
            if (retentionPanel) retentionPanel.classList.add('hidden');
            if (hostRetentionDesk) {
                hostRetentionDesk.classList.remove('hidden');
                renderHostRetentionDesk();
            }
        } else {
            if (hostRetentionDesk) hostRetentionDesk.classList.add('hidden');
            if (retentionPanel) {
                retentionPanel.classList.remove('hidden');
                renderRetentionPanel();
            }
        }
    } else {
        if (retentionPanel) retentionPanel.classList.add('hidden');
        if (hostRetentionDesk) hostRetentionDesk.classList.add('hidden');
        if (bidPanel) bidPanel.classList.remove('hidden');
    }

    document.getElementById('dash-room-info').innerText = "ROOM: " + roomCode + " (Season " + (roomState.season || 1) + ")";
    
    if (roomState && roomState.auction_name) {
        document.getElementById('dash-auction-name').innerText = roomState.auction_name;
    } else {
        document.getElementById('dash-auction-name').innerText = "Cricket Premier League";
    }
    
    // Header panel managers statistics
    const idBanner = document.getElementById('manager-identity-banner');
    if (role === 'manager') {
        idBanner.classList.remove('hidden');
        document.getElementById('my-team-name-val').innerText = teamName;
        const myBudget = roomState.teams[teamName] ? roomState.teams[teamName].budget : 0;
        document.getElementById('my-budget-val').innerText = formatCurrency(myBudget);
    } else {
        idBanner.classList.add('hidden');
    }
    
    if (isRetention) {
        return; // Stop further rendering since we are in retention phase
    }
    
    // Active player mapping
    const idx = roomState.current_player_index;
    const stamp = document.getElementById('player-sale-stamp');
    const card = document.getElementById('active-player-card');
    const playerInfoContainer = document.getElementById('active-player-info-container');
    const hostSetupContainer = document.getElementById('host-setup-container');
    
    if (idx >= 0 && idx < roomState.players.length) {
        if (playerInfoContainer) playerInfoContainer.classList.remove('hidden');
        if (hostSetupContainer) hostSetupContainer.classList.add('hidden');
        const player = roomState.players[idx];
        
        document.getElementById('player-card-role').innerText = player.role;
        document.getElementById('player-card-rating').innerText = player.rating;
        document.getElementById('player-card-name').innerText = player.name;
        document.getElementById('player-card-stats').innerText = player.stats;
        document.getElementById('player-card-base').innerText = formatCurrency(player.base_price);
        
        // Show/hide overseas badge
        const natEl = document.getElementById('player-card-nationality');
        if (natEl) {
            if (player.overseas) {
                natEl.classList.remove('hidden');
            } else {
                natEl.classList.add('hidden');
            }
        }
        
        // Image source fallback
        const imgEl = document.getElementById('player-card-img');
        if (player.img && player.img.trim() !== '') {
            imgEl.src = player.img;
        } else {
            imgEl.src = getPlayerAvatar(player.name);
        }
        
        // Active bidding price formats
        if (roomState.current_bid === 0) {
            document.getElementById('current-bid-label').innerText = "OPENING BID";
            document.getElementById('player-card-current').innerText = formatCurrency(player.base_price);
            document.getElementById('player-card-bidder').innerText = "None";
            document.getElementById('player-card-bidder').classList.remove('bidder-name');
        } else {
            document.getElementById('current-bid-label').innerText = "CURRENT BID";
            document.getElementById('player-card-current').innerText = formatCurrency(roomState.current_bid);
            document.getElementById('player-card-bidder').innerText = roomState.current_bidder;
            document.getElementById('player-card-bidder').classList.add('bidder-name');
        }
        
        // Manage sold/unsold pause stamp displays
        if (roomState.status === 'sold_pause') {
            if (stamp) {
                stamp.innerText = "SOLD";
                stamp.className = "sale-stamp";
                stamp.classList.remove('hidden');
            }
            if (card) card.className = "player-card glass-panel sold-card";
        } else if (roomState.status === 'unsold_pause') {
            if (stamp) {
                stamp.innerText = "UNSOLD";
                stamp.className = "sale-stamp unsold";
                stamp.classList.remove('hidden');
            }
            if (card) card.className = "player-card glass-panel unsold-card";
        } else {
            // Active bidding card
            if (stamp) stamp.classList.add('hidden');
            if (card) card.className = "player-card glass-panel";
        }
    } else {
        if (roomState.status === 'finished' || roomState.status === 'tournament_ended') {
            if (playerInfoContainer) playerInfoContainer.classList.remove('hidden');
            if (hostSetupContainer) hostSetupContainer.classList.add('hidden');
            document.getElementById('player-card-role').innerText = "SEASON COMPLETE";
            document.getElementById('player-card-rating').innerText = roomState.season || 1;
            
            const nameEl = document.getElementById('player-card-name');
            const statsEl = document.getElementById('player-card-stats');
            
            if (roomState.status === 'finished') {
                nameEl.innerText = "Draft Finished!";
                if (role === 'host') {
                    statsEl.innerHTML = `
                        <p style="margin-bottom: 1rem; color: var(--text-secondary);">All players have been auctioned. You can input standings/points in the Standings tab, and click below to advance to the next season or close the draft.</p>
                        <div style="display: flex; gap: 0.5rem; justify-content: center; width: 100%; margin-top: 0.5rem;">
                            <button class="btn btn-accent btn-sm" onclick="hostAction('end_season')" style="height: 34px; padding: 0 0.75rem; border-radius: 6px; font-size: 0.8rem;"><i class="fa-solid fa-forward-step"></i> Next Season</button>
                            <button class="btn btn-secondary btn-sm" onclick="hostAction('end_tournament')" style="height: 34px; padding: 0 0.75rem; border-radius: 6px; font-size: 0.8rem; background: rgba(255,255,255,0.05);"><i class="fa-solid fa-trophy"></i> End Tournament</button>
                        </div>
                    `;
                } else {
                    statsEl.innerHTML = `<p style="color: var(--text-secondary);">All players have been auctioned. Please wait for the Host to initiate the next season or end the tournament.</p>`;
                }
            } else {
                nameEl.innerText = "Tournament Ended!";
                statsEl.innerHTML = `<p style="color: var(--text-secondary);">The host has ended the tournament. View the final Standings Table and team rosters.</p>`;
            }
            
            document.getElementById('player-card-base').innerText = "--";
            document.getElementById('player-card-current').innerText = "--";
            document.getElementById('player-card-bidder').innerText = "--";
            const natEl = document.getElementById('player-card-nationality');
            if (natEl) natEl.classList.add('hidden');
            if (stamp) stamp.classList.add('hidden');
            if (card) card.className = "player-card glass-panel";
        } else {
            // idx is -1 and room is not finished -> Setup/waiting phase
            if (role === 'host') {
                if (playerInfoContainer) playerInfoContainer.classList.add('hidden');
                if (hostSetupContainer) hostSetupContainer.classList.remove('hidden');
                
                // Populate the specific player select dropdown inside the dashboard card
                const dashboardSpecificSelect = document.getElementById('dashboard-specific-player');
                if (dashboardSpecificSelect) {
                    const currentSelected = dashboardSpecificSelect.value;
                    dashboardSpecificSelect.innerHTML = '<option value="">-- Sequential / Next Up --</option>';
                    const unsoldPlayers = roomState.players.filter(p => p.status !== 'sold' && !p.bought_by);
                    unsoldPlayers.sort((a, b) => a.name.localeCompare(b.name));
                    unsoldPlayers.forEach(p => {
                        const opt = document.createElement('option');
                        opt.value = p.id;
                        opt.textContent = `${p.name} (${p.role} - ${formatCurrency(p.base_price)})`;
                        if (p.id.toString() === currentSelected) {
                            opt.selected = true;
                        }
                        dashboardSpecificSelect.appendChild(opt);
                    });
                }
            } else {
                if (playerInfoContainer) playerInfoContainer.classList.remove('hidden');
                if (hostSetupContainer) hostSetupContainer.classList.add('hidden');
                document.getElementById('player-card-role').innerText = "ROLE";
                document.getElementById('player-card-rating').innerText = "--";
                document.getElementById('player-card-name').innerText = "Waiting to Begin";
                document.getElementById('player-card-stats').innerText = "Wait for host to introduce player.";
                document.getElementById('player-card-base').innerText = "--";
                document.getElementById('player-card-current').innerText = "--";
                document.getElementById('player-card-bidder').innerText = "--";
                const natEl = document.getElementById('player-card-nationality');
                if (natEl) natEl.classList.add('hidden');
                if (stamp) stamp.classList.add('hidden');
                if (card) card.className = "player-card glass-panel";
            }
        }
    }
    
    // 2. Bidding Buttons Controls Display
    const bidPanel = document.getElementById('bidding-controls-panel');
    const bidButtonsSection = document.getElementById('bid-buttons-section');
    if (role === 'host') {
        if (bidButtonsSection) bidButtonsSection.classList.add('hidden');
        bidPanel.classList.remove('hidden');
    } else {
        if (bidButtonsSection) bidButtonsSection.classList.remove('hidden');
        bidPanel.classList.remove('hidden');
        
        // Compute min required bid
        let activePlayer = roomState.players[idx];
        let minRequired = 0;
        let isEligible = true;
        
        if (!activePlayer || roomState.status !== 'active' || !roomState.timer_active) {
            isEligible = false;
        } else {
            if (roomState.current_bid === 0) {
                minRequired = activePlayer.base_price;
            } else {
                minRequired = roomState.current_bid + roomState.settings.min_increment;
            }
        }
        
        // Check if we are already high bidder
        const isHighBidder = roomState.current_bidder === teamName;
        
        // Get budget
        const budget = roomState.teams[teamName] ? roomState.teams[teamName].budget : 0;
        
        // Check overseas limits (disabled)
        const exceedsOS = false;
        
        // Check squad capacity limit
        const teamPlayers = roomState.teams[teamName] ? roomState.teams[teamName].players : [];
        const squadLimit = (roomState.settings && roomState.settings.squad_limit) ? roomState.settings.squad_limit : 16;
        const isSquadFull = teamPlayers.length >= squadLimit;
        
        // Apply enable/disable criteria
        const minBtn = document.getElementById('btn-bid-min');
        const add20L = document.getElementById('btn-bid-20l');
        const add50L = document.getElementById('btn-bid-50l');
        const add1Cr = document.getElementById('btn-bid-1cr');
        
        document.getElementById('label-bid-min').innerText = minRequired > 0 ? formatCurrency(minRequired) : "₹0";
        
        const disableBidding = !isEligible || isHighBidder || budget < minRequired || exceedsOS || isSquadFull;
        
        const baseForAdd = roomState.current_bid === 0 ? activePlayer.base_price : roomState.current_bid;
        minBtn.disabled = disableBidding;
        add20L.disabled = disableBidding || budget < (baseForAdd + 2000000);
        add50L.disabled = disableBidding || budget < (baseForAdd + 5000000);
        add1Cr.disabled = disableBidding || budget < (baseForAdd + 10000000);
        
        // Apply helper tips for managers
        if (isHighBidder && isEligible) {
            minBtn.disabled = true;
            document.getElementById('label-bid-min').innerText = "HIGH BIDDER";
        } else if (isSquadFull && isEligible) {
            minBtn.disabled = true;
            document.getElementById('label-bid-min').innerText = "SQUAD FULL";
        }
    }
    
    // 3. Render Host Controls Console
    const hostConsole = document.getElementById('host-admin-panel');
    if (role === 'host') {
        hostConsole.classList.remove('hidden');
        
        // Sync the host filter select value with the active room filter
        const hostRoleFilter = document.getElementById('host-role-filter');
        if (hostRoleFilter && roomState.current_role_filter) {
            hostRoleFilter.value = roomState.current_role_filter;
        }
        
        let modeIndicator = document.getElementById('host-mode-indicator');
        if (!modeIndicator) {
            modeIndicator = document.createElement('div');
            modeIndicator.id = 'host-mode-indicator';
            modeIndicator.style.fontSize = '0.85rem';
            modeIndicator.style.marginBottom = '1rem';
            modeIndicator.style.padding = '0.5rem';
            modeIndicator.style.borderRadius = '6px';
            modeIndicator.style.textAlign = 'center';
            modeIndicator.style.fontWeight = 'bold';
            hostConsole.insertBefore(modeIndicator, hostConsole.querySelector('.form-group') || hostConsole.querySelector('.console-buttons'));
        }
        
        const isBot = roomState.settings && roomState.settings.bot_auctioneer;
        if (isBot) {
            modeIndicator.innerHTML = `<i class="fa-solid fa-robot text-cyan"></i> Mode: Automatic Bot Auctioneer`;
            modeIndicator.style.background = 'rgba(0, 242, 254, 0.1)';
            modeIndicator.style.border = '1px solid rgba(0, 242, 254, 0.2)';
            modeIndicator.style.color = 'var(--accent-cyan)';
        } else {
            modeIndicator.innerHTML = `<i class="fa-solid fa-user text-purple"></i> Mode: Manual Host Controls`;
            modeIndicator.style.background = 'rgba(187, 134, 252, 0.1)';
            modeIndicator.style.border = '1px solid rgba(187, 134, 252, 0.2)';
            modeIndicator.style.color = 'var(--accent-purple)';
        }
        
        // Toggle buttons depending on state
        const startBtn = document.getElementById('host-btn-start');
        const nextBtn = document.getElementById('host-btn-next');
        const pauseBtn = document.getElementById('host-btn-pause');
        const resumeBtn = document.getElementById('host-btn-resume');
        
        if (idx === -1) {
            // Lobby not started yet
            startBtn.classList.remove('hidden');
            nextBtn.classList.add('hidden');
            pauseBtn.classList.add('hidden');
            resumeBtn.classList.add('hidden');
            document.getElementById('host-btn-sell').disabled = true;
            document.getElementById('host-btn-unsold').disabled = true;
            document.getElementById('host-btn-reset').disabled = true;
        } else if (roomState.status === 'sold_pause' || roomState.status === 'unsold_pause') {
            // Brief pause state after sold/unsold
            startBtn.classList.add('hidden');
            nextBtn.classList.remove('hidden');
            pauseBtn.classList.add('hidden');
            resumeBtn.classList.add('hidden');
            document.getElementById('host-btn-sell').disabled = true;
            document.getElementById('host-btn-unsold').disabled = true;
            document.getElementById('host-btn-reset').disabled = false; // Allow reopening the bid if needed
        } else if (roomState.status === 'finished') {
            // Completed drafting
            startBtn.classList.add('hidden');
            nextBtn.classList.add('hidden');
            pauseBtn.classList.add('hidden');
            resumeBtn.classList.add('hidden');
            document.getElementById('host-btn-sell').disabled = true;
            document.getElementById('host-btn-unsold').disabled = true;
            document.getElementById('host-btn-reset').disabled = true;
        } else {
            // Active bidding in progress
            startBtn.classList.add('hidden');
            nextBtn.classList.add('hidden');
            
            if (roomState.settings && roomState.settings.timer_duration === 0) {
                pauseBtn.classList.add('hidden');
                resumeBtn.classList.add('hidden');
            } else {
                if (roomState.timer_active) {
                    pauseBtn.classList.remove('hidden');
                    resumeBtn.classList.add('hidden');
                } else {
                    pauseBtn.classList.add('hidden');
                    resumeBtn.classList.remove('hidden');
                }
            }
            
            // Disable force-sell button if no one bid yet
            document.getElementById('host-btn-sell').disabled = roomState.current_bid === 0;
            document.getElementById('host-btn-unsold').disabled = false;
            document.getElementById('host-btn-reset').disabled = false;
            
            // Populate the team select dropdown for budget adjustments
            const budgetTeamSelect = document.getElementById('host-budget-team');
            if (budgetTeamSelect) {
                const currentSelected = budgetTeamSelect.value;
                budgetTeamSelect.innerHTML = '<option value="">-- Select Team --</option>';
                const sortedTeams = Object.keys(roomState.teams).sort();
                sortedTeams.forEach(tName => {
                    const opt = document.createElement('option');
                    opt.value = tName;
                    opt.textContent = tName;
                    if (tName === currentSelected) {
                        opt.selected = true;
                    }
                    budgetTeamSelect.appendChild(opt);
                });
            }

            // Populate the specific player select dropdown for host controls
            const specificPlayerSelect = document.getElementById('host-specific-player');
            if (specificPlayerSelect) {
                const currentSelected = specificPlayerSelect.value;
                specificPlayerSelect.innerHTML = '<option value="">-- Sequential / Next Up --</option>';
                const unsoldPlayers = roomState.players.filter(p => p.status !== 'sold' && !p.bought_by);
                unsoldPlayers.sort((a, b) => a.name.localeCompare(b.name));
                unsoldPlayers.forEach(p => {
                    const opt = document.createElement('option');
                    opt.value = p.id;
                    opt.textContent = `${p.name} (${p.role} - ${formatCurrency(p.base_price)})`;
                    if (p.id.toString() === currentSelected) {
                        opt.selected = true;
                    }
                    specificPlayerSelect.appendChild(opt);
                });
            }
            
            // Toggle Undo button disabled status based on whether there's a last completed player
            const undoBtn = document.getElementById('host-btn-undo');
            if (undoBtn) {
                undoBtn.disabled = roomState.last_completed_player_index === undefined || roomState.last_completed_player_index === null;
            }
        }
    } else {
        hostConsole.classList.add('hidden');
    }
    
    const hostImgOverlay = document.getElementById('host-img-upload-overlay');
    if (hostImgOverlay) {
        if (role === 'host' && roomState.current_player_index >= 0 && roomState.status !== 'finished') {
            hostImgOverlay.classList.remove('hidden');
        } else {
            hostImgOverlay.classList.add('hidden');
        }
    }
    
    // 4. Render or Update Leaderboard List using change detection
    const currentTeamsHash = getTeamsStateHash();
    if (lastRendered.teamsHash !== currentTeamsHash) {
        renderLeaderboard();
        lastRendered.teamsHash = currentTeamsHash;
    } else {
        updateLeaderboardHighlights();
    }

    // Render the player queue list using change detection
    const currentQueueFilter = activeQueueFilter;
    const currentRoleFilter = roomState.current_role_filter || 'All';
    const currentIdx = roomState.current_player_index;
    const currentStatus = roomState.status;

    if (lastRendered.currentPlayerIndex !== currentIdx ||
        lastRendered.roomStatus !== currentStatus ||
        lastRendered.queueFilter !== currentQueueFilter ||
        lastRendered.roleFilter !== currentRoleFilter) {
        
        renderQueueList();
        
        lastRendered.currentPlayerIndex = currentIdx;
        lastRendered.roomStatus = currentStatus;
        lastRendered.queueFilter = currentQueueFilter;
        lastRendered.roleFilter = currentRoleFilter;
    }
    
    // 5. Append Live Log Feed using change detection
    const logBox = document.getElementById('log-feed');
    if (logBox) {
        const currentCount = roomState.logs.length;
        if (lastRendered.logsCount !== currentCount) {
            // If cache was reset or logs cleared, build from scratch
            if (lastRendered.logsCount === 0 || logBox.children.length === 0) {
                logBox.innerHTML = '';
                roomState.logs.forEach(msg => {
                    const item = document.createElement('div');
                    item.className = "feed-item";
                    item.innerHTML = msg;
                    logBox.appendChild(item);
                });
            } else {
                // Append only the new log entries
                for (let i = lastRendered.logsCount; i < currentCount; i++) {
                    const item = document.createElement('div');
                    item.className = "feed-item";
                    item.innerHTML = roomState.logs[i];
                    logBox.appendChild(item);
                }
            }
            // Auto Scroll Logs to Bottom
            logBox.scrollTop = logBox.scrollHeight;
            lastRendered.logsCount = currentCount;
        }
    }
    
    // Toggle Save Room button for host only
    const saveBtn = document.getElementById('btn-save-auction');
    if (saveBtn) {
        if (role === 'host') {
            saveBtn.style.display = 'inline-flex';
        } else {
            saveBtn.style.display = 'none';
        }
    }
    
    // Update audio toggle state button
    updateAudioToggleUI();
    
    // Rebuild bid timeline from server logs only if bid amount or bidder changed
    if (lastRendered.currentBid !== roomState.current_bid || lastRendered.currentBidder !== roomState.current_bidder) {
        rebuildBidTimeline();
        lastRendered.currentBid = roomState.current_bid;
        lastRendered.currentBidder = roomState.current_bidder;
    }
    
    // Update Standings and Trade views if active
    if (document.getElementById('tab-standings').classList.contains('active')) {
        renderStandings();
    }
    if (document.getElementById('tab-trade').classList.contains('active')) {
        renderTradeCenter();
    }
}

// Rebuild Bids Timeline on Card
function rebuildBidTimeline() {
    const timeline = document.getElementById('bid-history-timeline');
    const wrapper = document.getElementById('bid-timeline-wrapper');
    if (!timeline || !wrapper || !roomState || !roomState.logs) return;
    
    timeline.innerHTML = '';
    
    const idx = roomState.current_player_index;
    if (idx < 0 || idx >= roomState.players.length || roomState.status === 'finished') {
        wrapper.classList.add('hidden');
        return;
    }
    
    const activePlayer = roomState.players[idx];
    const activePlayerName = activePlayer.name;
    let bidsFound = [];
    
    // Find where the active player went up for bidding in logs
    let activePlayerStartIndex = -1;
    for (let i = roomState.logs.length - 1; i >= 0; i--) {
        const log = roomState.logs[i];
        if (log.includes("up for bidding") && log.includes(activePlayerName)) {
            activePlayerStartIndex = i;
            break;
        }
    }
    
    // Fallback if index not found
    if (activePlayerStartIndex === -1) {
        for (let i = roomState.logs.length - 1; i >= 0; i--) {
            if (roomState.logs[i].includes("up for bidding")) {
                activePlayerStartIndex = i;
                break;
            }
        }
    }
    
    const startIdx = activePlayerStartIndex !== -1 ? activePlayerStartIndex : 0;
    
    // Extract all bids after the start index
    for (let i = startIdx; i < roomState.logs.length; i++) {
        const log = roomState.logs[i];
        if (log.includes("placed a bid of")) {
            const match = log.match(/<b>(.*?)<\/b>\s+placed a bid of\s+<b>(.*?)<\/b>/);
            if (match) {
                bidsFound.push({
                    bidder: match[1],
                    amount: match[2]
                });
            }
        }
    }
    
    if (bidsFound.length > 0) {
        wrapper.classList.remove('hidden');
        bidsFound.reverse(); // newest first
        bidsFound.forEach((b, index) => {
            const item = document.createElement('div');
            item.className = 'bid-timeline-item' + (index === 0 ? ' active' : '');
            item.innerHTML = `
                <span class="bid-team">${b.bidder}</span>
                <span class="bid-amount">${b.amount}</span>
            `;
            timeline.appendChild(item);
        });
    } else {
        wrapper.classList.add('hidden');
    }
}

// Bidding Trigger POST
async function placeBid(type, value) {
    if (role !== 'manager') return;
    
    const idx = roomState.current_player_index;
    const activePlayer = roomState.players[idx];
    if (!activePlayer) return;
    
    let currentBid = Number(roomState.current_bid || 0);
    let basePrice = Number(activePlayer.base_price || 0);
    let minIncrement = Number(roomState.settings.min_increment || 0);
    let bidAmount = 0;
    
    if (type === 'min') {
        if (currentBid === 0) {
            bidAmount = basePrice;
        } else {
            bidAmount = currentBid + minIncrement;
        }
    } else if (type === 'add') {
        let base = currentBid === 0 ? basePrice : currentBid;
        bidAmount = base + Number(value);
    }
    
    try {
        await apiPost('/api/bid', {
            room_code: roomCode,
            team_name: teamName,
            amount: bidAmount
        });
    } catch (err) {
        console.error(err);
    }
}

// Send Room Chat Message
async function sendChatMessage() {
    const input = document.getElementById('chat-message-input');
    if (!input) return;
    
    const msg = input.value.trim();
    if (msg === '') return;
    
    // Clear input instantly
    input.value = '';
    
    try {
        await apiPost('/api/chat', {
            room_code: roomCode,
            role: role,
            sender_name: role === 'host' ? roomState.host_name : teamName,
            message: msg
        });
    } catch (err) {
        console.error("Failed to send chat message:", err);
    }
}

// Host Action Trigger POST
async function hostAction(action, extraParams = {}) {
    if (role !== 'host') return;
    const filterEl = document.getElementById('host-role-filter');
    const roleFilter = filterEl ? filterEl.value : 'All';
    
    // Read specific player ID if introducing a player
    if (action === 'start' || action === 'next') {
        const playerSelect = document.getElementById('host-specific-player');
        if (playerSelect && playerSelect.value) {
            extraParams.player_id = playerSelect.value;
            // Reset select dropdown to sequential for the next round
            playerSelect.value = "";
        }
    }
    
    try {
        await apiPost('/api/control', {
            room_code: roomCode,
            host_id: hostId,
            action: action,
            role_filter: roleFilter,
            ...extraParams
        });
    } catch (err) {
        console.error(err);
    }
}

// Adjust Team Budget by Host
function adjustTeamBudget() {
    const teamSelect = document.getElementById('host-budget-team');
    const amountInput = document.getElementById('host-budget-amount');
    const unitSelect = document.getElementById('host-budget-unit');
    
    if (!teamSelect || !amountInput || !unitSelect) return;
    
    const teamName = teamSelect.value;
    const amountVal = parseFloat(amountInput.value);
    const unit = unitSelect.value;
    
    if (!teamName) {
        showNotification("Please select a team first.", "error");
        return;
    }
    if (isNaN(amountVal) || amountVal === 0) {
        showNotification("Please enter a non-zero amount.", "error");
        return;
    }
    
    // Convert amount according to unit
    let rawAmount = 0;
    if (unit === 'Lakh') {
        rawAmount = amountVal * 100000;
    } else if (unit === 'Crore') {
        rawAmount = amountVal * 10000000;
    } else {
        rawAmount = amountVal;
    }
    
    // Round to nearest integer
    rawAmount = Math.round(rawAmount);
    
    // Send action to server
    hostAction('adjust_budget', {
        team_name: teamName,
        amount: rawAmount
    });
    
    // Clear input
    amountInput.value = '';
    showNotification(`Request sent to update ${teamName}'s budget.`, "success");
}

// ROSTERS MODAL MANAGER
function openRosterModal(tName) {
    if (!roomState || !roomState.teams[tName]) return;
    
    const team = roomState.teams[tName];
    document.getElementById('modal-team-name').innerText = tName;
    document.getElementById('modal-team-budget').innerText = formatCurrency(team.budget);
    const countEl = document.getElementById('modal-player-count');
    const pCount = team.players.length;
    countEl.innerText = pCount;
    const squadLimit = (roomState.settings && roomState.settings.squad_limit) ? roomState.settings.squad_limit : 16;
    if (pCount < squadLimit) {
        countEl.style.color = 'var(--accent-gold)';
        countEl.title = `Under squad limit of ${squadLimit} players`;
    } else if (pCount > squadLimit) {
        countEl.style.color = 'var(--accent-red)';
        countEl.title = `Over maximum squad limit of ${squadLimit} players`;
    } else {
        countEl.style.color = 'var(--accent-green)';
        countEl.title = `Squad is complete (Exactly ${squadLimit} players)`;
    }
    
    // Reset category slot text numbers
    document.getElementById('slot-bat').innerText = team.slots.Batsman || 0;
    document.getElementById('slot-bowl').innerText = team.slots.Bowler || 0;
    document.getElementById('slot-ar').innerText = team.slots["All-Rounder"] || 0;
    document.getElementById('slot-wk').innerText = team.slots["Wicket-Keeper"] || 0;
    
    // Update Overseas limit counters
    const osCount = team.players.filter(p => p.overseas).length;
    document.getElementById('slot-os').innerText = osCount;
    
    const tableBody = document.getElementById('modal-roster-rows');
    tableBody.innerHTML = '';
    
    if (team.players.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: var(--text-secondary);">No players purchased yet.</td></tr>`;
    } else {
        team.players.forEach(p => {
            const tr = document.createElement('tr');
            const avatarUrl = p.img || getPlayerAvatar(p.name);
            tr.innerHTML = `
                <td>
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                        <img src="${avatarUrl}" style="width: 28px; height: 28px; border-radius: 50%; object-fit: cover; object-position: center 15%; border: 1px solid rgba(255,255,255,0.15); flex-shrink: 0;">
                        <strong>${p.name} ${p.overseas ? '✈️' : ''}</strong>
                    </div>
                </td>
                <td><span class="badge ${p.role}">${p.role}</span></td>
                <td>${p.rating}</td>
                <td style="text-align: right; font-weight: 700; color: var(--accent-gold);">${formatCurrency(p.price)}</td>
            `;
            tableBody.appendChild(tr);
        });
    }
    
    document.getElementById('roster-modal').classList.remove('hidden');
}

function closeRosterModal() {
    document.getElementById('roster-modal').classList.add('hidden');
}

// Helper to copy Room Code
function copyRoomCode() {
    const textToCopy = document.getElementById('lobby-room-code').innerText;
    navigator.clipboard.writeText(textToCopy).then(() => {
        showNotification("Room Code copied to clipboard!", "success");
    }).catch(err => {
        console.error("Failed to copy", err);
    });
}

// Notification Banner Manager
function showNotification(message, type = 'success') {
    const banner = document.getElementById('notification-banner');
    const bannerText = document.getElementById('notification-text');
    
    if (banner && bannerText) {
        bannerText.innerText = message;
        banner.className = `notification-banner ${type}`;
        banner.classList.remove('hidden');
        
        // Auto-dismiss after 3.5 seconds
        setTimeout(() => {
            banner.classList.add('hidden');
        }, 3500);
    }
}

// Tabbed Panel and Player Queue Controller Logic
let activeQueueFilter = 'sold';

function switchDashboardTab(tabName) {
    document.getElementById('tab-leaderboard').classList.toggle('active', tabName === 'leaderboard');
    document.getElementById('tab-players').classList.toggle('active', tabName === 'players');
    document.getElementById('tab-standings').classList.toggle('active', tabName === 'standings');
    document.getElementById('tab-trade').classList.toggle('active', tabName === 'trade');
    
    document.getElementById('tab-content-leaderboard').classList.toggle('hidden', tabName !== 'leaderboard');
    document.getElementById('tab-content-players').classList.toggle('hidden', tabName !== 'players');
    document.getElementById('tab-content-standings').classList.toggle('hidden', tabName !== 'standings');
    document.getElementById('tab-content-trade').classList.toggle('hidden', tabName !== 'trade');
    
    if (tabName === 'players') {
        renderQueueList();
    } else if (tabName === 'standings') {
        renderStandings();
    } else if (tabName === 'trade') {
        renderTradeCenter();
    }
}

function filterQueue(filterName) {
    activeQueueFilter = filterName;
    document.getElementById('filter-btn-upcoming').classList.toggle('active', filterName === 'upcoming');
    document.getElementById('filter-btn-sold').classList.toggle('active', filterName === 'sold');
    document.getElementById('filter-btn-unsold').classList.toggle('active', filterName === 'unsold');
    renderQueueList();
}

function renderQueueList() {
    const upcomingBtn = document.getElementById('filter-btn-upcoming');
    if (upcomingBtn) {
        upcomingBtn.style.display = 'none';
        if (activeQueueFilter === 'upcoming') {
            activeQueueFilter = 'sold';
            document.getElementById('filter-btn-sold').classList.add('active');
            upcomingBtn.classList.remove('active');
        }
    }

    const container = document.getElementById('queue-container');
    if (!container || !roomState) return;
    container.innerHTML = '';
    
    const idx = roomState.current_player_index;
    const players = roomState.players;
    
    let filtered = [];
    if (activeQueueFilter === 'upcoming') {
        // Upcoming: players at index > current_player_index that are not sold/passed
        filtered = players.filter((p, i) => i > idx && p.status !== 'sold' && p.status !== 'passed' && !p.bought_by);
    } else if (activeQueueFilter === 'sold') {
        // Sold: players who have been purchased
        filtered = players.filter(p => p.status === 'sold' || p.bought_by);
    } else if (activeQueueFilter === 'unsold') {
        // Unsold: players that actually went unsold (passed) during drafting
        filtered = players.filter(p => p.status === 'passed');
    }

    // Apply host draft category filter if set
    const activeRoleFilter = roomState.current_role_filter || 'All';
    if (activeRoleFilter !== 'All') {
        filtered = filtered.filter(p => p.role === activeRoleFilter);
    }
    
    if (filtered.length === 0) {
        container.innerHTML = `<div class="help-text" style="text-align: center; padding: 1rem;">No players in this category.</div>`;
        return;
    }
    
    filtered.forEach(p => {
        const row = document.createElement('div');
        row.className = "queue-row";
        const avatarUrl = p.img || getPlayerAvatar(p.name);
        let detailsHtml = p.status === 'sold' || p.bought_by
            ? `<span class="queue-sold-info">${p.bought_by} (${formatCurrency(p.price || p.base_price)})</span>`
            : `<span class="queue-price">Base: ${formatCurrency(p.base_price)}</span>`;
        row.innerHTML = `
            <div class="queue-player-info" style="flex-direction: row; align-items: center; gap: 0.65rem;">
                <img src="${avatarUrl}" style="width: 30px; height: 30px; border-radius: 50%; object-fit: cover; object-position: center 15%; border: 1px solid rgba(255,255,255,0.12); flex-shrink: 0;">
                <div style="display: flex; flex-direction: column; gap: 0.15rem;">
                    <strong>${p.name} ${p.overseas ? '✈️' : ''}</strong>
                    <span>${p.role} • Rating: ${p.rating}</span>
                </div>
            </div>
            <div class="queue-player-meta">
                ${detailsHtml}
            </div>
        `;
        container.appendChild(row);
    });
}


// --- Scheduled/Active Auction Handlers ---
async function renderScheduledAuctions() {
    const container = document.getElementById('scheduled-auctions-section');
    const list = document.getElementById('scheduled-auctions-list');
    if (!container || !list) return;
    
    const token = localStorage.getItem('auth_token');
    if (!token) {
        container.classList.add('hidden');
        return;
    }
    
    // 1. Load local storage backups (to guarantee no past history is ever deleted)
    const localAuctions = JSON.parse(localStorage.getItem('scheduled_auctions') || '[]');
    
    let serverAuctions = [];
    try {
        const res = await apiPost('/api/history', { auth_token: token });
        if (res && res.success) {
            serverAuctions = res.auctions || [];
        }
    } catch (e) {
        console.error("Failed to fetch server history, using local backups:", e);
    }
    
    // 2. Merge local storage and server history
    const mergedMap = new Map();
    
    // Insert local items first
    localAuctions.forEach(item => {
        const code = (item.roomCode || "").toUpperCase();
        if (code) {
            mergedMap.set(code, {
                room_code: code,
                auction_name: item.auctionName,
                host_name: "Local Shortcut",
                host_id: item.hostId,
                status: "local_only",
                created_at: item.createdAt || "Previous Draft",
                team_count: 0,
                player_count: 0,
                sold_count: 0,
                unsold_count: 0,
                is_local: true
            });
        }
    });
    
    // Overwrite/update with server items
    serverAuctions.forEach(item => {
        const code = (item.room_code || "").toUpperCase();
        if (code) {
            mergedMap.set(code, {
                room_code: code,
                auction_name: item.auction_name,
                host_name: item.host_name,
                host_id: item.host_id || "",
                status: item.status,
                created_at: item.created_at || "N/A",
                team_count: item.team_count,
                player_count: item.player_count,
                sold_count: item.sold_count || 0,
                unsold_count: item.unsold_count || 0,
                is_local: false,
                user_role: item.user_role || "host",
                team_name: item.team_name || "",
                manager_name: item.manager_name || ""
            });
        }
    });
    
    const mergedList = Array.from(mergedMap.values());
    
    if (mergedList.length === 0) {
        container.classList.add('hidden');
        return;
    }
    
    container.classList.remove('hidden');
    list.innerHTML = '';
    
    mergedList.forEach(item => {
        const row = document.createElement('div');
        row.className = 'scheduled-auction-item';
        row.style.display = 'flex';
        row.style.justifyContent = 'space-between';
        row.style.alignItems = 'center';
        row.style.flexWrap = 'wrap';
        row.style.gap = '1rem';
        row.style.padding = '1rem';
        
        let statusLabel = (item.status || "lobby").toUpperCase();
        let statusClass = "badge-lobby";
        if (item.status === 'finished') {
            statusLabel = "COMPLETED";
            statusClass = "badge-sold";
        } else if (item.status === 'active' || item.status === 'sold_pause' || item.status === 'unsold_pause') {
            statusLabel = "LIVE";
            statusClass = "badge-active";
        } else if (item.status === 'local_only') {
            statusLabel = "UNTRACKED";
            statusClass = "badge-offline";
        }
        
        let statusHtml = `<span class="badge ${statusClass}" style="margin-left: 0.5rem; font-size: 0.75rem; padding: 0.15rem 0.5rem; border-radius: 4px;">${statusLabel}</span>`;
        
        let metaDetails = `Room: <strong style="color: var(--accent-purple); font-size: 0.95rem;">${item.room_code}</strong> &bull; Created: ${item.created_at}`;
        if (item.status !== 'local_only') {
            metaDetails += ` &bull; Teams: ${item.team_count} &bull; Players: ${item.player_count} (Sold: ${item.sold_count}, Unsold: ${item.unsold_count})`;
        }
        
        row.innerHTML = `
            <div style="display: flex; flex-direction: column; gap: 0.25rem;">
                <div style="display: flex; align-items: center; flex-wrap: wrap;">
                    <strong style="color: white; font-size: 1.05rem;">${item.auction_name}</strong>
                    ${statusHtml}
                </div>
                <span style="font-size: 0.8rem; color: var(--text-secondary);">${metaDetails}</span>
            </div>
            <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                ${item.status !== 'local_only' ? (
                    item.status === 'finished' ? `
                        <button class="btn btn-primary" onclick="${(item.user_role || 'host') === 'host' ? `hostScheduledAuction('${item.room_code}', '${item.host_id}')` : `joinScheduledAuction('${item.room_code}', '${item.team_name}', '${item.manager_name}')`}" style="padding: 0.45rem 1rem; font-size: 0.8rem; height: auto; background: rgba(161, 0, 255, 0.15); border-color: rgba(161, 0, 255, 0.4); color: var(--accent-purple);">
                            <i class="fa-solid fa-eye"></i> View Squads
                        </button>
                    ` : (
                        (item.user_role || 'host') === 'host' ? `
                            <button class="btn btn-primary" onclick="hostScheduledAuction('${item.room_code}', '${item.host_id}')" style="padding: 0.45rem 1rem; font-size: 0.8rem; height: auto;">
                                <i class="fa-solid fa-play"></i> Host / Resume
                            </button>
                        ` : `
                            <button class="btn btn-primary" onclick="joinScheduledAuction('${item.room_code}', '${item.team_name}', '${item.manager_name}')" style="padding: 0.45rem 1rem; font-size: 0.8rem; height: auto;">
                                <i class="fa-solid fa-play"></i> Join / Resume
                            </button>
                        `
                    )
                ) : ''}
                ${item.status !== 'local_only' ? `
                    <button class="btn btn-secondary" onclick="downloadServerRoomSummary('${item.room_code}')" title="Download CSV summary" style="padding: 0.45rem 0.75rem; font-size: 0.8rem; height: auto; background: rgba(0, 242, 254, 0.08); border-color: rgba(0, 242, 254, 0.3); color: var(--accent-cyan);">
                        <i class="fa-solid fa-download"></i> CSV
                    </button>
                ` : ''}
                ${(item.user_role || 'host') === 'host' ? `
                    <button class="btn btn-secondary" onclick="deleteServerRoom('${item.room_code}', ${item.is_local})" title="Delete Room" style="padding: 0.45rem 0.65rem; font-size: 0.8rem; height: auto; background: rgba(255, 51, 102, 0.15); border-color: rgba(255, 51, 102, 0.3); color: var(--accent-red);">
                        <i class="fa-solid fa-trash-can"></i>
                    </button>
                ` : ''}
            </div>
        `;
        list.appendChild(row);
    });
}

function hostScheduledAuction(rCode, hId) {
    role = 'host';
    roomCode = rCode;
    hostId = hId;
    
    localStorage.setItem('auction_role', 'host');
    localStorage.setItem('auction_room_code', rCode);
    localStorage.setItem('auction_host_id', hId);
    
    showNotification("Loading scheduled auction lobby...", "success");
    connectEvents(rCode);
}

function joinScheduledAuction(rCode, tName, mName) {
    role = 'manager';
    roomCode = rCode;
    teamName = tName;
    managerName = mName;
    
    localStorage.setItem('auction_role', 'manager');
    localStorage.setItem('auction_room_code', rCode);
    localStorage.setItem('auction_team_name', tName);
    localStorage.setItem('auction_manager_name', mName);
    
    showNotification("Loading scheduled auction lobby...", "success");
    connectEvents(rCode);
}

// --- History, Persisted Rooms & CSV Download ---

function downloadAuctionSummary(customPlayers = null, customRoomCode = null, customAuctionName = null) {
    const players = customPlayers || (roomState ? roomState.players : null);
    const code = customRoomCode || roomCode;
    const name = customAuctionName || (roomState ? roomState.auction_name : "Cricket_Auction");
    
    if (!players) {
        showNotification("No auction data available to download.", "error");
        return;
    }
    
    // Create CSV content
    let csv = "\uFEFF"; // UTF-8 BOM for Excel/Sheets compatibility
    csv += "ID,Player Name,Role,Rating,Base Price (₹),Status,Bought By,Price Paid (₹),Overseas?\n";
    players.forEach(p => {
        let status = p.status || "unsold";
        if (status === 'passed') {
            status = 'unsold';
        }
        const boughtBy = p.bought_by || "";
        const priceVal = p.price || (status === 'sold' ? p.base_price : 0);
        const price = status === 'sold' ? priceVal : "";
        const overseas = p.overseas ? "Yes" : "No";
        csv += `"${p.id}","${p.name.replace(/"/g, '""')}","${p.role}","${p.rating}","${p.base_price}","${status}","${boughtBy.replace(/"/g, '""')}","${price}","${overseas}"\n`;
    });
    
    // Create Blob and trigger download
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${name.replace(/[^a-z0-9]/gi, '_')}_summary_${code}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showNotification("Draft summary CSV downloaded successfully!", "success");
}

async function manualSaveAuction() {
    if (role !== 'host') return;
    try {
        const res = await apiPost('/api/control', {
            room_code: roomCode,
            host_id: hostId,
            action: 'save'
        });
        if (res && res.success) {
            showNotification("Auction state saved to server disk successfully!", "success");
        } else {
            showNotification(res.error || "Failed to save auction state.", "danger");
        }
    } catch (e) {
        console.error("Save auction error:", e);
        showNotification("Error connecting to server to save auction.", "danger");
    }
}

function exitToLobby() {
    if (confirm("Are you sure you want to exit to the home lobby? You can rejoin later using the room code.")) {
        leaveRoom();
    }
}

async function downloadServerRoomSummary(code) {
    try {
        const res = await apiPost('/api/room', { room_code: code });
        if (res && res.success && res.room_state) {
            downloadAuctionSummary(res.room_state.players, res.room_state.room_code || code, res.room_state.auction_name);
        } else {
            showNotification("Failed to fetch room details from server.", "danger");
        }
    } catch (e) {
        console.error("Fetch room details error:", e);
        showNotification("Error connecting to server.", "danger");
    }
}

async function deleteServerRoom(code, isLocalOnly = false) {
    if (!confirm(`Are you sure you want to delete room '${code}'? This will delete the draft state permanently.`)) return;
    
    if (isLocalOnly) {
        let localAuctions = JSON.parse(localStorage.getItem('scheduled_auctions') || '[]');
        localAuctions = localAuctions.filter(item => (item.roomCode || "").toUpperCase() !== code);
        localStorage.setItem('scheduled_auctions', JSON.stringify(localAuctions));
        showNotification("Local draft removed.", "success");
        renderScheduledAuctions();
        return;
    }
    
    try {
        const token = localStorage.getItem('auth_token');
        const res = await apiPost('/api/delete_room', { auth_token: token, room_code: code });
        if (res && res.success) {
            showNotification(`Room '${code}' deleted successfully.`, "success");
            
            let localAuctions = JSON.parse(localStorage.getItem('scheduled_auctions') || '[]');
            localAuctions = localAuctions.filter(item => (item.roomCode || "").toUpperCase() !== code);
            localStorage.setItem('scheduled_auctions', JSON.stringify(localAuctions));
            
            renderScheduledAuctions();
        } else {
            showNotification(res.error || "Failed to delete room from server.", "danger");
        }
    } catch (e) {
        console.error("Delete room error:", e);
        showNotification("Error connecting to server.", "danger");
    }
}

// --- Player List / Roster Draft Saving & Loading ---
function savePlayerDraft() {
    const presetChoice = document.querySelector('input[name="preset-choice"]:checked').value;
    const draft = {
        presetChoice: presetChoice,
        excludeRetired: document.getElementById('exclude-retired')?.checked || false,
        checkedIds: [],
        customRatings: {},
        customRows: [],
        csvText: document.getElementById('custom-csv')?.value || ''
    };
    
    // Save checklist selections & ratings for ALL presets
    const checkedBoxes = document.querySelectorAll('.checklist-item input[type="checkbox"]:checked');
    checkedBoxes.forEach(input => {
        draft.checkedIds.push(parseInt(input.value));
    });
    
    const ratingInputs = document.querySelectorAll('.checklist-rating-input input');
    ratingInputs.forEach(input => {
        const pId = input.id.replace('rating-p-', '');
        if (input.value.trim() !== '') {
            draft.customRatings[pId] = input.value.trim();
        }
    });
    
    // Save interactive custom player table rows only if presetChoice is 'custom'
    if (presetChoice === 'custom') {
        const customRows = document.querySelectorAll('#custom-players-rows tr');
        customRows.forEach(row => {
            const nameEl = row.querySelector('.cp-name');
            const roleEl = row.querySelector('.cp-role');
            const styleEl = row.querySelector('.cp-style');
            const ratingEl = row.querySelector('.cp-rating');
            const priceEl = row.querySelector('.cp-price');
            const overseasEl = row.querySelector('.cp-overseas');
            const imgEl = row.querySelector('.cp-img-base64');
            
            const name = nameEl ? nameEl.value.trim() : '';
            const img = imgEl ? imgEl.value.trim() : '';
            if (name) {
                draft.customRows.push({
                    name: name,
                    role: roleEl ? roleEl.value : 'Batsman',
                    style: styleEl ? styleEl.value.trim() : '',
                    rating: ratingEl ? ratingEl.value.trim() : '',
                    price: priceEl ? priceEl.value : '10000000',
                    overseas: overseasEl ? overseasEl.checked : false,
                    img: img
                });
            }
        });
    }
    
    localStorage.setItem('saved_player_draft', JSON.stringify(draft));
    showNotification("Roster draft saved successfully!", "success");
    checkSavedDraft();
}

function loadPlayerDraft() {
    const raw = localStorage.getItem('saved_player_draft');
    if (!raw) {
        showNotification("No saved roster draft found", "warning");
        return;
    }
    
    try {
        const draft = JSON.parse(raw);
        
        // 1. Restore preset Choice radio
        const radio = document.querySelector(`input[name="preset-choice"][value="${draft.presetChoice}"]`);
        if (radio) {
            radio.checked = true;
            selectPreset(draft.presetChoice);
        }
        
        // Restore Exclude Retired checkbox
        const excludeRetiredCb = document.getElementById('exclude-retired');
        if (excludeRetiredCb) {
            excludeRetiredCb.checked = draft.excludeRetired;
            filterRetiredPlayers(draft.excludeRetired);
        }
        
        // Restore checklist checkboxes
        const checklistItems = document.querySelectorAll('.checklist-item input[type="checkbox"]');
        checklistItems.forEach(cb => {
            const id = parseInt(cb.value);
            cb.checked = draft.checkedIds.includes(id);
        });
        
        // Restore custom ratings inputs
        const ratingInputs = document.querySelectorAll('.checklist-rating-input input');
        ratingInputs.forEach(input => {
            const pId = input.id.replace('rating-p-', '');
            if (draft.customRatings[pId] !== undefined) {
                input.value = draft.customRatings[pId];
            } else {
                input.value = '';
            }
        });
        
        if (draft.presetChoice === 'custom') {
            // Restore CSV text area
            const csvArea = document.getElementById('custom-csv');
            if (csvArea) {
                csvArea.value = draft.csvText || '';
            }
            
            // Restore interactive custom table rows
            const rowsContainer = document.getElementById('custom-players-rows');
            if (rowsContainer) {
                rowsContainer.innerHTML = ''; // clear all rows
                if (draft.customRows && draft.customRows.length > 0) {
                    draft.customRows.forEach(r => {
                        addCustomPlayerRowWithData(r.name, r.role, r.style, r.rating, r.price, r.overseas, r.img);
                    });
                } else {
                    // pre-populate 5 empty rows
                    for (let i = 0; i < 5; i++) {
                        addCustomPlayerRow();
                    }
                }
            }
        }
        
        showNotification("Roster draft loaded successfully!", "success");
    } catch (e) {
        console.error("Failed to load roster draft:", e);
        showNotification("Error loading roster draft: " + e.message, "danger");
    }
}

function checkSavedDraft() {
    const btn = document.getElementById('btn-load-draft');
    if (!btn) return;
    
    if (localStorage.getItem('saved_player_draft')) {
        btn.style.display = 'inline-flex';
    } else {
        btn.style.display = 'none';
    }
}

function addCustomPlayerRowWithData(name, role, style, rating, price, overseas, img = "") {
    const rowsContainer = document.getElementById('custom-players-rows');
    if (!rowsContainer) return;
    
    const nextSNo = rowsContainer.children.length + 1;
    const tr = document.createElement('tr');
    tr.innerHTML = `
        <td class="s-no" style="font-weight: bold; text-align: center; color: var(--text-secondary);">${nextSNo}</td>
        <td style="text-align: center; vertical-align: middle; position: relative;">
            <div class="cp-img-wrapper" style="width: 40px; height: 40px; border-radius: 50%; overflow: hidden; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.15); display: inline-block; cursor: pointer; position: relative;" onclick="triggerRowImgInput(this)" title="Click to upload player photo">
                <img class="cp-img-preview" src="${img || (name ? getPlayerAvatar(name) : "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'><circle cx='50' cy='40' r='25' fill='%23555'/><path d='M15 85 C15 65 30 55 50 55 C70 55 85 65 85 85' fill='%23555'/></svg>")}" style="width: 100%; height: 100%; object-fit: cover; object-position: center 15%;">
                <div style="position: absolute; bottom: 0; left: 0; right: 0; background: rgba(0,0,0,0.6); font-size: 8px; color: white; text-align: center; padding: 2px 0; opacity: 0; transition: opacity 0.2s;" class="upload-hover">UP</div>
            </div>
            <input type="file" class="cp-img-file-input" accept="image/*" style="display: none;" onchange="handleRowImgUpload(this)">
            <input type="hidden" class="cp-img-base64" value="${img || ""}">
        </td>
        <td><input type="text" class="cp-name" value="${name || ''}" placeholder="e.g. Shreyas Iyer" style="text-align: left;" oninput="updateCustomPlayerAvatarPreview(this)"></td>
        <td>
            <select class="cp-role">
                <option value="Batsman" ${role === 'Batsman' ? 'selected' : ''}>Batsman</option>
                <option value="Bowler" ${role === 'Bowler' ? 'selected' : ''}>Bowler</option>
                <option value="All-Rounder" ${role === 'All-Rounder' ? 'selected' : ''}>All-Rounder</option>
                <option value="Wicket-Keeper" ${role === 'Wicket-Keeper' ? 'selected' : ''}>Wicket-Keeper</option>
            </select>
        </td>
        <td><input type="text" class="cp-style" value="${style || ''}" placeholder="e.g. Right-hand bat / Right-arm fast"></td>
        <td><input type="number" class="cp-rating" value="${rating || ''}" placeholder="85" min="50" max="99"></td>
        <td>
            <select class="cp-price">
                <option value="20000000" ${price == 20000000 ? 'selected' : ''}>₹2 Crore (₹2 Cr)</option>
                <option value="15000000" ${price == 15000000 ? 'selected' : ''}>₹1.5 Crore (₹1.5 Cr)</option>
                <option value="10000000" ${price == 10000000 || !price ? 'selected' : ''}>₹1 Crore (₹1 Cr)</option>
                <option value="8000000" ${price == 8000000 ? 'selected' : ''}>₹80 Lakhs (₹80 L)</option>
                <option value="5000000" ${price == 5000000 ? 'selected' : ''}>₹50 Lakhs (₹50 L)</option>
                <option value="3000000" ${price == 3000000 ? 'selected' : ''}>₹30 Lakhs (₹30 L)</option>
                <option value="2000000" ${price == 2000000 ? 'selected' : ''}>₹20 Lakhs (₹20 L)</option>
            </select>
        </td>
        <td><input type="checkbox" class="cp-overseas" ${overseas ? 'checked' : ''}></td>
        <td style="text-align: center;">
            <button type="button" class="btn-remove-row" onclick="removeCustomPlayerRow(this)" title="Remove Player">
                <i class="fa-solid fa-trash-can"></i>
            </button>
        </td>
    `;
    rowsContainer.appendChild(tr);
}

// --- Dynamic OCR Roster Upload ---
function loadScript(src) {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

async function handleOCRImage(input) {
    const file = input.files[0];
    if (!file) return;
    
    const statusText = document.getElementById('ocr-status');
    if (!statusText) return;
    
    statusText.innerText = "Initializing OCR Engine...";
    statusText.style.color = "var(--accent-cyan)";
    
    // Lazy load Tesseract.js only when the user selects a file
    if (typeof Tesseract === 'undefined') {
        statusText.innerText = "Loading OCR library (Tesseract.js)...";
        try {
            await loadScript("https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js");
        } catch (e) {
            statusText.innerText = "Failed to load OCR library. Check internet connection.";
            statusText.style.color = "var(--accent-red)";
            return;
        }
    }
    
    statusText.innerText = "Reading text from image (this may take a few seconds)...";
    
    try {
        const result = await Tesseract.recognize(
            file,
            'eng',
            { logger: m => {
                if (m.status === 'recognizing') {
                    statusText.innerText = `OCR Progress: ${Math.round(m.progress * 100)}%`;
                }
            } }
        );
        
        const text = result.data.text;
        console.log("OCR Extracted Text:\n", text);
        
        const players = parseOCRText(text);
        
        if (players.length === 0) {
            statusText.innerText = "OCR finished, but no players could be parsed. Make sure names are clear.";
            statusText.style.color = "var(--accent-yellow)";
            return;
        }
        
        const rowsContainer = document.getElementById('custom-players-rows');
        if (rowsContainer) {
            // Remove empty template rows first
            const rows = rowsContainer.querySelectorAll('tr');
            rows.forEach(r => {
                const nameInput = r.querySelector('.cp-name');
                if (nameInput && nameInput.value.trim() === '') {
                    r.remove();
                }
            });
            
            // Insert parsed players to table
            players.forEach(p => {
                addCustomPlayerRowWithData(p.name, p.role, "", p.rating, p.basePrice, p.overseas);
            });
            
            updateCustomSerialNumbers();
        }
        
        statusText.innerText = `Successfully parsed and loaded ${players.length} players!`;
        statusText.style.color = "#00ff88";
        showNotification(`Successfully loaded ${players.length} players from image!`, "success");
        
    } catch (err) {
        console.error("OCR Parse Error:", err);
        statusText.innerText = "Error parsing image: " + err.message;
        statusText.style.color = "var(--accent-red)";
        showNotification("OCR Processing failed: " + err.message, "danger");
    }
}

function parseOCRText(text) {
    const lines = text.split('\n');
    const players = [];
    const roles = ['Batsman', 'Bowler', 'All-Rounder', 'Wicket-Keeper'];
    
    lines.forEach(line => {
        line = line.trim();
        if (!line) return;
        
        let name = '';
        let role = 'Batsman';
        let rating = 85;
        let basePrice = 10000000; // 1 Crore default
        let overseas = false;
        
        // 1. Match rating (number between 50 and 99, or 100)
        const ratingMatch = line.match(/\b(100|[5-9][0-9])\b/);
        if (ratingMatch) {
            rating = parseInt(ratingMatch[1]);
            line = line.replace(ratingMatch[0], ' ');
        }
        
        // 2. Match role
        let foundRole = false;
        for (const r of roles) {
            const rRegex = new RegExp('\\b' + r.replace('-', '\\-?') + '\\b', 'i');
            if (rRegex.test(line)) {
                role = r;
                foundRole = true;
                line = line.replace(rRegex, ' ');
                break;
            }
        }
        
        if (!foundRole) {
            if (/\b(bat|batsman|lhb|rhb)\b/i.test(line)) {
                role = 'Batsman';
            } else if (/\b(bowl|bowler|fast|spin)\b/i.test(line)) {
                role = 'Bowler';
            } else if (/\b(ar|allround|all-rounder|allrounder)\b/i.test(line)) {
                role = 'All-Rounder';
            } else if (/\b(wk|keeper|wicket-keeper|wicketkeeper|w-keeper)\b/i.test(line)) {
                role = 'Wicket-Keeper';
            }
        }
        
        // 3. Match base price in Cr / L / lakhs or raw number
        const priceMatch = line.match(/\b(\d+(?:\.\d+)?)\s*(cr|crore|l|lakh|lakhs)\b/i);
        if (priceMatch) {
            const val = parseFloat(priceMatch[1]);
            const unit = priceMatch[2].toLowerCase();
            if (unit.startsWith('cr')) {
                basePrice = val * 10000000;
            } else {
                basePrice = val * 100000;
            }
            line = line.replace(priceMatch[0], ' ');
        } else {
            const rawNumMatch = line.match(/\b(\d{6,8})\b/);
            if (rawNumMatch) {
                basePrice = parseInt(rawNumMatch[1]);
                line = line.replace(rawNumMatch[0], ' ');
            }
        }
        
        // 4. Match overseas
        if (/\b(overseas|intl|international|yes|true)\b/i.test(line)) {
            overseas = true;
        }
        
        // Clean remaining string for name (strip table borders, special chars)
        name = line.replace(/[|,\-_+[\]():;/\\]+/g, ' ')
                   .replace(/\s+/g, ' ')
                   .trim();
                   
        // Convert name to title case
        name = name.split(' ')
                   .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
                   .join(' ');
                   
        if (name && name.length > 2) {
            players.push({
                name: name,
                role: role,
                rating: rating,
                basePrice: basePrice,
                overseas: overseas
            });
        }
    });
    
    return players;
}

// --- Player Image Upload Helpers ---
function triggerRowImgInput(div) {
    const parent = div.parentElement;
    const fileInput = parent.querySelector('.cp-img-file-input');
    if (fileInput) {
        fileInput.click();
    }
}

function handleRowImgUpload(input) {
    const file = input.files[0];
    if (!file) return;
    
    if (file.size > 500 * 1024) {
        showNotification("Player photo must be less than 500KB", "warning");
        input.value = "";
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const base64 = e.target.result;
        const parent = input.parentElement;
        const preview = parent.querySelector('.cp-img-preview');
        const hidden = parent.querySelector('.cp-img-base64');
        if (preview) preview.src = base64;
        if (hidden) hidden.value = base64;
    };
    reader.readAsDataURL(file);
}

function triggerHostPlayerImgUpload() {
    const input = document.getElementById('host-player-img-input');
    if (input) {
        input.click();
    }
}

async function handleHostPlayerImgUpload(input) {
    const file = input.files[0];
    if (!file) return;
    
    if (file.size > 500 * 1024) {
        showNotification("Player photo must be less than 500KB", "warning");
        input.value = "";
        return;
    }
    
    const reader = new FileReader();
    reader.onload = async function(e) {
        const base64 = e.target.result;
        
        try {
            const res = await apiPost('/api/control', {
                auth_token: localStorage.getItem('auth_token'),
                room_code: roomCode,
                host_id: hostId,
                action: 'update_player_image',
                image_data: base64
            });
            if (res && res.success) {
                showNotification("Player image updated successfully!", "success");
            }
        } catch (err) {
            console.error("Failed to update player image:", err);
            showNotification("Failed to update player image", "error");
        }
    };
    reader.readAsDataURL(file);
}

// --- Inbuilt Background Music (BGM) Player System ---
let currentBgmIndex = parseInt(localStorage.getItem('bgm_track_index')) || 0;
let bgmVolume = parseInt(localStorage.getItem('bgm_volume')) || 70;
let isBgmMuted = localStorage.getItem('bgm_muted') === 'true';
let isBgmPlayerExpanded = localStorage.getItem('bgm_expanded') === 'true';

const bgmPlaylist = [
    { title: "SoundHelix Song 1", artist: "Energetic Electronica", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" },
    { title: "SoundHelix Song 4", artist: "Synthwave Chill", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3" },
    { title: "SoundHelix Song 8", artist: "Arena Rock Beats", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3" }
];

function initBgmPlayer() {
    const audio = document.getElementById('bgm-audio');
    const container = document.getElementById('bgm-player-container');
    const timeline = document.getElementById('bgm-timeline');
    const volSlider = document.getElementById('bgm-volume-slider');
    
    if (!audio || !container) return;
    
    // Load persisted expansion state
    if (isBgmPlayerExpanded) {
        container.classList.remove('collapsed');
        container.classList.add('expanded');
    } else {
        container.classList.add('collapsed');
        container.classList.remove('expanded');
    }
    
    // Load persisted volume & mute
    audio.volume = isBgmMuted ? 0 : (bgmVolume / 100);
    if (volSlider) {
        volSlider.value = bgmVolume;
        document.getElementById('bgm-volume-percent').innerText = bgmVolume + "%";
    }
    updateBgmVolumeUI();
    
    // Load track
    loadBgmTrack(currentBgmIndex, false);
    
    // Event listeners
    audio.addEventListener('timeupdate', () => {
        if (!audio.duration) return;
        const pct = (audio.currentTime / audio.duration) * 100;
        if (timeline) timeline.value = pct;
        document.getElementById('bgm-time-current').innerText = formatBgmTime(audio.currentTime);
    });
    
    audio.addEventListener('loadedmetadata', () => {
        document.getElementById('bgm-time-duration').innerText = formatBgmTime(audio.duration);
    });
    
    audio.addEventListener('ended', () => {
        nextBgmTrack();
    });
    
    audio.addEventListener('play', () => {
        container.classList.add('bgm-playing');
        updateBgmPlayBtnUI(true);
    });
    
    audio.addEventListener('pause', () => {
        container.classList.remove('bgm-playing');
        updateBgmPlayBtnUI(false);
    });
}

function toggleBgmPlayer() {
    const container = document.getElementById('bgm-player-container');
    if (!container) return;
    
    isBgmPlayerExpanded = !isBgmPlayerExpanded;
    localStorage.setItem('bgm_expanded', isBgmPlayerExpanded);
    
    if (isBgmPlayerExpanded) {
        container.classList.remove('collapsed');
        container.classList.add('expanded');
    } else {
        container.classList.add('collapsed');
        container.classList.remove('expanded');
    }
}

function loadBgmTrack(index, autoPlay = true) {
    const audio = document.getElementById('bgm-audio');
    if (!audio || index < 0 || index >= bgmPlaylist.length) return;
    
    currentBgmIndex = index;
    localStorage.setItem('bgm_track_index', currentBgmIndex);
    
    const track = bgmPlaylist[currentBgmIndex];
    audio.src = track.url;
    audio.load();
    
    document.getElementById('bgm-track-title').innerText = track.title;
    document.getElementById('bgm-track-artist').innerText = track.artist;
    
    if (autoPlay) {
        audio.play().catch(err => console.log("BGM Autoplay blocked: ", err));
    }
}

function toggleBgmPlay() {
    const audio = document.getElementById('bgm-audio');
    if (!audio) return;
    
    if (audio.paused) {
        audio.play().catch(err => {
            console.warn("BGM playback gesture requirement failed:", err);
            showNotification("Click anywhere on page first, then play music", "warning");
        });
    } else {
        audio.pause();
    }
}

function stopBgm() {
    const audio = document.getElementById('bgm-audio');
    if (!audio) return;
    audio.pause();
    audio.currentTime = 0;
}

function nextBgmTrack() {
    let nextIndex = currentBgmIndex + 1;
    if (nextIndex >= bgmPlaylist.length) nextIndex = 0;
    loadBgmTrack(nextIndex, true);
}

function prevBgmTrack() {
    let prevIndex = currentBgmIndex - 1;
    if (prevIndex < 0) prevIndex = bgmPlaylist.length - 1;
    loadBgmTrack(prevIndex, true);
}

function changeBgmVolume(val) {
    const audio = document.getElementById('bgm-audio');
    if (!audio) return;
    
    bgmVolume = parseInt(val);
    localStorage.setItem('bgm_volume', bgmVolume);
    document.getElementById('bgm-volume-percent').innerText = bgmVolume + "%";
    
    if (!isBgmMuted) {
        audio.volume = bgmVolume / 100;
    }
    updateBgmVolumeUI();
}

function toggleBgmMute() {
    const audio = document.getElementById('bgm-audio');
    if (!audio) return;
    
    isBgmMuted = !isBgmMuted;
    localStorage.setItem('bgm_muted', isBgmMuted);
    
    audio.volume = isBgmMuted ? 0 : (bgmVolume / 100);
    updateBgmVolumeUI();
}

function updateBgmVolumeUI() {
    const btn = document.getElementById('bgm-volume-btn');
    if (!btn) return;
    
    if (isBgmMuted || bgmVolume === 0) {
        btn.innerHTML = '<i class="fa-solid fa-volume-xmark"></i>';
        btn.title = "Unmute";
    } else if (bgmVolume < 40) {
        btn.innerHTML = '<i class="fa-solid fa-volume-low"></i>';
        btn.title = "Mute";
    } else {
        btn.innerHTML = '<i class="fa-solid fa-volume-high"></i>';
        btn.title = "Mute";
    }
}

function updateBgmPlayBtnUI(playing) {
    const btn = document.getElementById('bgm-play-pause-btn');
    if (!btn) return;
    
    if (playing) {
        btn.innerHTML = '<i class="fa-solid fa-pause"></i>';
        btn.title = "Pause";
    } else {
        btn.innerHTML = '<i class="fa-solid fa-play"></i>';
        btn.title = "Play";
    }
}

function seekBgm(pct) {
    const audio = document.getElementById('bgm-audio');
    if (!audio || !audio.duration) return;
    audio.currentTime = (parseFloat(pct) / 100) * audio.duration;
}

function loadCustomBgmUrl() {
    const input = document.getElementById('bgm-custom-url');
    if (!input || !input.value.trim()) return;
    
    const url = input.value.trim();
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        showNotification("Invalid URL. Must start with http:// or https://", "warning");
        return;
    }
    
    // Add custom track to playlist
    const customTrack = {
        title: "User Custom Stream",
        artist: "Web MP3 Link",
        url: url
    };
    
    bgmPlaylist.push(customTrack);
    const newIdx = bgmPlaylist.length - 1;
    loadBgmTrack(newIdx, true);
    
    // Clear input
    input.value = "";
    showNotification("Custom track loaded successfully!", "success");
}

function formatBgmTime(secs) {
    if (isNaN(secs)) return "0:00";
    const minutes = Math.floor(secs / 60);
    const seconds = Math.floor(secs % 60);
    return minutes + ":" + (seconds < 10 ? "0" : "") + seconds;
}

// --- Live Theme Switcher Logic ---
function changeTheme(theme) {
    const body = document.body;
    body.classList.remove('theme-gold', 'theme-midnight');
    
    if (theme === 'gold') {
        body.classList.add('theme-gold');
    } else if (theme === 'midnight') {
        body.classList.add('theme-midnight');
    }
    
    localStorage.setItem('auction_theme', theme);
}

// --- Dynamic SVG Initials-Based Avatar Generator ---
function getPlayerAvatar(name) {
    if (!name) {
        return "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'><circle cx='50' cy='40' r='25' fill='%23555'/><path d='M15 85 C15 65 30 55 50 55 C70 55 85 65 85 85' fill='%23555'/></svg>";
    }
    
    // Extract initials
    const initials = name.split(' ')
                         .filter(n => n.length > 0)
                         .map(n => n.charAt(0))
                         .slice(0, 2)
                         .join('')
                         .toUpperCase();
                         
    // Calculate deterministic hash code from name string
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    // Select base color hue from themes
    const hues = [280, 205, 45, 145, 335, 18, 220, 165]; // Purple, Cyan, Gold, Green, Pink, Orange, Blue, Emerald
    const hue = hues[Math.abs(hash) % hues.length];
    
    // Generate clean modern vector initials avatar matching the theme colors
    const svg = `
        <svg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 200 200'>
            <defs>
                <linearGradient id='avatar-grad-${Math.abs(hash)}' x1='0%' y1='0%' x2='100%' y2='100%'>
                    <stop offset='0%' stop-color='hsl(${hue}, 80%, 55%)' />
                    <stop offset='100%' stop-color='hsl(${(hue + 45) % 360}, 85%, 40%)' />
                </linearGradient>
            </defs>
            <rect width='200' height='200' rx='100' fill='url(#avatar-grad-${Math.abs(hash)})' />
            <text x='50%' y='53%' dominant-baseline='middle' text-anchor='middle' fill='#ffffff' font-family='Outfit, Arial, sans-serif' font-weight='800' font-size='72' letter-spacing='-1px'>
                ${initials}
            </text>
        </svg>
    `.trim();
    
    return "data:image/svg+xml;utf8," + encodeURIComponent(svg);
}

function updateCustomPlayerAvatarPreview(input) {
    const parent = input.closest('tr');
    if (!parent) return;
    const preview = parent.querySelector('.cp-img-preview');
    const hiddenBase64 = parent.querySelector('.cp-img-base64');
    
    // If the user has already uploaded a custom file, do not override it
    if (hiddenBase64 && hiddenBase64.value && hiddenBase64.value.startsWith('data:image')) {
        return;
    }
    
    if (preview) {
        const nameVal = input.value.trim();
        if (nameVal) {
            preview.src = getPlayerAvatar(nameVal);
        } else {
            preview.src = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'><circle cx='50' cy='40' r='25' fill='%23555'/><path d='M15 85 C15 65 30 55 50 55 C70 55 85 65 85 85' fill='%23555'/></svg>";
        }
    }
function updateCustomPlayerAvatarPreview(input) {
    const parent = input.closest('tr');
    if (!parent) return;
    const preview = parent.querySelector('.cp-img-preview');
    const hiddenBase64 = parent.querySelector('.cp-img-base64');
    
    // If the user has already uploaded a custom file, do not override it
    if (hiddenBase64 && hiddenBase64.value && hiddenBase64.value.startsWith('data:image')) {
        return;
    }
    
    if (preview) {
        const nameVal = input.value.trim();
        if (nameVal) {
            preview.src = getPlayerAvatar(nameVal);
        } else {
            preview.src = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'><circle cx='50' cy='40' r='25' fill='%23555'/><path d='M15 85 C15 65 30 55 50 55 C70 55 85 65 85 85' fill='%23555'/></svg>";
        }
    }
}

// ==========================================
// MULTI-SEASON STANDINGS, TRADES, & RETENTIONS
// ==========================================

function renderStandings() {
    const container = document.getElementById('standings-table-container');
    if (!container || !roomState) return;
    
    // Sort teams by points (descending), then won, then NRR (descending)
    const teamsList = Object.keys(roomState.teams).map(tName => {
        const std = roomState.standings && roomState.standings[tName] ? roomState.standings[tName] : {played: 0, won: 0, lost: 0, points: 0, nrr: 0.0};
        return {
            name: tName,
            manager: roomState.teams[tName].manager,
            ...std
        };
    });
    
    teamsList.sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        if (b.won !== a.won) return b.won - a.won;
        return b.nrr - a.nrr;
    });
    
    let html = `
        <table class="roster-table" style="width: 100%; border-collapse: collapse;">
            <thead>
                <tr>
                    <th style="padding: 0.5rem; text-align: left;">Rank</th>
                    <th style="padding: 0.5rem; text-align: left;">Franchise</th>
                    <th style="padding: 0.5rem; text-align: center;">P</th>
                    <th style="padding: 0.5rem; text-align: center;">W</th>
                    <th style="padding: 0.5rem; text-align: center;">L</th>
                    <th style="padding: 0.5rem; text-align: center; color: var(--accent-cyan);">Pts</th>
                    <th style="padding: 0.5rem; text-align: right;">NRR</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    if (teamsList.length === 0) {
        html += `<tr><td colspan="7" style="text-align: center; padding: 1.5rem; color: var(--text-secondary);">No franchises in this room yet.</td></tr>`;
    } else {
        teamsList.forEach((t, i) => {
            html += `
                <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
                    <td style="padding: 0.65rem 0.5rem; font-weight: bold;">${i + 1}</td>
                    <td style="padding: 0.65rem 0.5rem; font-weight: 600; color: #fff;">${t.name} <span style="font-size: 0.75rem; color: var(--text-secondary); font-weight: normal;">(Mgr: ${t.manager})</span></td>
                    <td style="padding: 0.65rem 0.5rem; text-align: center;">${t.played}</td>
                    <td style="padding: 0.65rem 0.5rem; text-align: center;">${t.won}</td>
                    <td style="padding: 0.65rem 0.5rem; text-align: center;">${t.lost}</td>
                    <td style="padding: 0.65rem 0.5rem; text-align: center; font-weight: bold; color: var(--accent-cyan);">${t.points}</td>
                    <td style="padding: 0.65rem 0.5rem; text-align: right; font-family: monospace;">${t.nrr >= 0 ? '+' : ''}${t.nrr.toFixed(3)}</td>
                </tr>
            `;
        });
    }
    
    html += `
            </tbody>
        </table>
    `;
    container.innerHTML = html;
    
    // Handle host inputs
    const hostControls = document.getElementById('host-standings-controls');
    if (role === 'host') {
        hostControls.classList.remove('hidden');
        const inputsContainer = document.getElementById('host-standings-inputs');
        inputsContainer.innerHTML = '';
        
        Object.keys(roomState.teams).forEach(tName => {
            const std = roomState.standings && roomState.standings[tName] ? roomState.standings[tName] : {played: 0, won: 0, lost: 0, points: 0, nrr: 0.0};
            const div = document.createElement('div');
            div.style.display = 'flex';
            div.style.alignItems = 'center';
            div.style.gap = '0.5rem';
            div.style.borderBottom = '1px solid rgba(255,255,255,0.05)';
            div.style.paddingBottom = '0.5rem';
            div.style.flexWrap = 'wrap';
            
            div.innerHTML = `
                <span style="font-weight: 600; width: 120px; text-overflow: ellipsis; overflow: hidden; white-space: nowrap; color: white;">${tName}</span>
                <div style="display: flex; gap: 0.35rem; align-items: center;">
                    <span style="font-size: 0.75rem; color: var(--text-secondary);">W:</span>
                    <input type="number" id="std-w-${tName}" value="${std.won}" min="0" style="width: 45px; height: 28px; background: rgba(0,0,0,0.3); border: 1px solid var(--border-color); border-radius: 4px; color: white; text-align: center; font-size: 0.8rem;">
                    <span style="font-size: 0.75rem; color: var(--text-secondary);">L:</span>
                    <input type="number" id="std-l-${tName}" value="${std.lost}" min="0" style="width: 45px; height: 28px; background: rgba(0,0,0,0.3); border: 1px solid var(--border-color); border-radius: 4px; color: white; text-align: center; font-size: 0.8rem;">
                    <span style="font-size: 0.75rem; color: var(--text-secondary);">Pts:</span>
                    <input type="number" id="std-pts-${tName}" value="${std.points}" min="0" style="width: 45px; height: 28px; background: rgba(0,0,0,0.3); border: 1px solid var(--border-color); border-radius: 4px; color: white; text-align: center; font-size: 0.8rem;">
                    <span style="font-size: 0.75rem; color: var(--text-secondary);">NRR:</span>
                    <input type="number" id="std-nrr-${tName}" value="${std.nrr}" step="0.001" style="width: 70px; height: 28px; background: rgba(0,0,0,0.3); border: 1px solid var(--border-color); border-radius: 4px; color: white; text-align: center; font-size: 0.8rem;">
                </div>
            `;
            inputsContainer.appendChild(div);
        });
    } else {
        hostControls.classList.add('hidden');
    }
}

function submitStandingsUpdate() {
    const standingsData = {};
    Object.keys(roomState.teams).forEach(tName => {
        const won = parseInt(document.getElementById(`std-w-${tName}`).value) || 0;
        const lost = parseInt(document.getElementById(`std-l-${tName}`).value) || 0;
        const points = parseInt(document.getElementById(`std-pts-${tName}`).value) || 0;
        const nrr = parseFloat(document.getElementById(`std-nrr-${tName}`).value) || 0.0;
        standingsData[tName] = {
            played: won + lost,
            won: won,
            lost: lost,
            points: points,
            nrr: nrr
        };
    });
    
    fetch('/api/control', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            room_code: roomCode,
            host_id: hostId,
            action: 'update_standings',
            standings: standingsData
        })
    })
    .then(res => res.json())
    .then(data => {
        if (data.error) showNotification(data.error, "danger");
        else showNotification("Points Table updated!", "success");
    })
    .catch(err => showNotification("Failed to update standings.", "danger"));
}

function renderTradeCenter() {
    // 1. Update Trade Window Status & Controls
    const windowOpen = roomState.trade_window_open || false;
    const badge = document.getElementById('trade-window-status-badge');
    if (badge) {
        if (windowOpen) {
            badge.innerText = "OPEN";
            badge.style.background = "rgba(0, 230, 118, 0.15)";
            badge.style.color = "var(--accent-green)";
            badge.style.borderColor = "rgba(0, 230, 118, 0.3)";
        } else {
            badge.innerText = "CLOSED";
            badge.style.background = "rgba(255, 51, 102, 0.15)";
            badge.style.color = "var(--accent-red)";
            badge.style.borderColor = "rgba(255, 51, 102, 0.3)";
        }
    }
    
    const hostControls = document.getElementById('host-trade-window-controls');
    if (hostControls) {
        hostControls.classList.toggle('hidden', role !== 'host');
    }
    
    const proposeBtn = document.getElementById('btn-propose-trade-modal');
    if (proposeBtn) {
        proposeBtn.disabled = !windowOpen || role !== 'manager';
    }

    const container = document.getElementById('trades-list-container');
    if (!container || !roomState) return;
    container.innerHTML = '';
    
    const trades = roomState.trades || [];
    
    if (trades.length === 0) {
        container.innerHTML = '<div class="help-text" style="text-align: center; padding: 1.5rem; color: var(--text-secondary);"><i class="fa-solid fa-circle-info"></i> No trade proposals yet. Click "Propose Trade" to begin.</div>';
        return;
    }
    
    trades.slice().reverse().forEach(trade => {
        const card = document.createElement('div');
        card.className = `trade-proposal-card status-${trade.status}`;
        card.style.background = 'rgba(255,255,255,0.02)';
        card.style.border = '1px solid var(--border-color)';
        card.style.borderRadius = '8px';
        card.style.padding = '0.75rem';
        card.style.display = 'flex';
        card.style.flexDirection = 'column';
        card.style.gap = '0.5rem';
        card.style.marginBottom = '0.5rem';
        
        let pName = "Unknown Player";
        for (let p of roomState.players) {
            if (p.id === trade.player_id) {
                pName = p.name;
                break;
            }
        }
        
        let detailsHtml = '';
        if (trade.type === 'cash') {
            detailsHtml = `Receive budget: <span style="color: var(--accent-cyan); font-weight: 600;">${formatCurrency(parseInt(trade.value))}</span>`;
        } else {
            let swapPName = "Unknown Player";
            for (let p of roomState.players) {
                if (p.id === parseInt(trade.value)) {
                    swapPName = p.name;
                    break;
                }
            }
            detailsHtml = `Swap for Player: <span style="color: var(--accent-purple); font-weight: 600;">${swapPName}</span>`;
        }
        
        let statusBadge = '';
        let btnHtml = '';
        
        if (trade.status === 'pending') {
            statusBadge = `<span class="badge" style="background: rgba(255, 193, 7, 0.15); color: #ffc107; border: 1px solid rgba(255, 193, 7, 0.3);">Pending counterparty</span>`;
            if (role === 'manager' && teamName === trade.to_team) {
                btnHtml = `
                    <div style="display: flex; gap: 0.5rem; margin-top: 0.25rem;">
                        <button class="btn btn-accent btn-sm" onclick="respondToTrade('${trade.id}', 'accept')" style="height: 28px; padding: 0 0.5rem; border-radius: 4px; font-size: 0.75rem;">Accept</button>
                        <button class="btn btn-secondary btn-sm" onclick="respondToTrade('${trade.id}', 'decline')" style="height: 28px; padding: 0 0.5rem; border-radius: 4px; font-size: 0.75rem; background: rgba(255,255,255,0.05);">Decline</button>
                    </div>
                `;
            }
        } else if (trade.status === 'accepted') {
            statusBadge = `<span class="badge" style="background: rgba(0, 242, 254, 0.15); color: var(--accent-cyan); border: 1px solid rgba(0, 242, 254, 0.3);">Awaiting Host Approval</span>`;
            if (role === 'host') {
                btnHtml = `
                    <div style="display: flex; gap: 0.5rem; margin-top: 0.25rem;">
                        <button class="btn btn-accent btn-sm" onclick="hostApproveTrade('${trade.id}')" style="height: 28px; padding: 0 0.5rem; border-radius: 4px; font-size: 0.75rem;"><i class="fa-solid fa-check"></i> Approve</button>
                        <button class="btn btn-secondary btn-sm" onclick="hostRejectTrade('${trade.id}')" style="height: 28px; padding: 0 0.5rem; border-radius: 4px; font-size: 0.75rem; background: rgba(255,255,255,0.05);"><i class="fa-solid fa-xmark"></i> Veto</button>
                    </div>
                `;
            }
        } else if (trade.status === 'approved') {
            statusBadge = `<span class="badge" style="background: rgba(40, 167, 69, 0.15); color: #28a745; border: 1px solid rgba(40, 167, 69, 0.3);">Trade Completed</span>`;
        } else if (trade.status === 'declined') {
            statusBadge = `<span class="badge" style="background: rgba(220, 53, 69, 0.15); color: #dc3545; border: 1px solid rgba(220, 53, 69, 0.3);">Declined</span>`;
        } else if (trade.status === 'rejected') {
            statusBadge = `<span class="badge" style="background: rgba(220, 53, 69, 0.15); color: #dc3545; border: 1px solid rgba(220, 53, 69, 0.3);">Vetoed by Host</span>`;
        }
        
        card.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                <div>
                    <div style="font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 0.15rem;">Offer from: <strong style="color: white;">${trade.from_team}</strong> to <strong style="color: white;">${trade.to_team}</strong></div>
                    <div style="font-size: 0.95rem; font-weight: bold; color: white; margin-bottom: 0.25rem;">Trade away: <span style="color: var(--accent-cyan);">${pName}</span></div>
                    <div style="font-size: 0.85rem; color: var(--text-secondary);">${detailsHtml}</div>
                </div>
                ${statusBadge}
            </div>
            ${btnHtml}
        `;
        container.appendChild(card);
    });
}

function renderRetentionPanel() {
    const listContainer = document.getElementById('retention-players-list');
    if (!listContainer || !roomState) return;
    listContainer.innerHTML = '';
    
    const myTeam = roomState.teams[teamName];
    if (!myTeam) return;
    
    const selectedRetentions = roomState.retentions && roomState.retentions[teamName] ? roomState.retentions[teamName] : [];
    const isLocked = roomState.retention_locked && roomState.retention_locked[teamName];
    
    // Calculate cost
    let cost = 0;
    selectedRetentions.forEach(pid => {
        const p = roomState.players.find(x => x.id === pid);
        if (p) cost += p.price || 0;
    });
    
    const basePurse = roomState.settings.budget;
    const projectedPurse = basePurse - cost;
    document.getElementById('retention-starting-purse').innerText = `Projected starting budget: ${formatCurrency(projectedPurse)}`;
    
    if (myTeam.players.length === 0) {
        listContainer.innerHTML = '<div style="color: var(--text-secondary); font-size: 0.85rem;">Your squad has no players to retain.</div>';
    } else {
        myTeam.players.forEach(p => {
            const div = document.createElement('div');
            div.style.display = 'flex';
            div.style.alignItems = 'center';
            div.style.justifyContent = 'space-between';
            div.style.padding = '0.5rem';
            div.style.borderBottom = '1px solid rgba(255,255,255,0.05)';
            
            const isChecked = selectedRetentions.includes(p.id);
            const disableCheckbox = isLocked || (!isChecked && selectedRetentions.length >= 3);
            
            div.innerHTML = `
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <input type="checkbox" id="retain-chk-${p.id}" ${isChecked ? 'checked' : ''} ${disableCheckbox ? 'disabled' : ''} onchange="togglePlayerRetention(${p.id})" style="width: 16px; height: 16px; cursor: pointer;">
                    <span style="font-weight: 600; color: white;">${p.name} <span style="font-size: 0.75rem; color: var(--text-secondary); font-weight: normal;">(${p.role})</span></span>
                </div>
                <span style="font-family: monospace; color: var(--accent-cyan); font-weight: bold;">${formatCurrency(p.price || 0)}</span>
            `;
            listContainer.appendChild(div);
        });
    }
    
    const lockBtn = document.getElementById('btn-lock-retentions');
    if (lockBtn) {
        lockBtn.innerText = isLocked ? "Unlock Retentions" : "Lock Retentions";
        lockBtn.className = isLocked ? "btn btn-secondary" : "btn btn-primary";
    }
}

function renderHostRetentionDesk() {
    const statusContainer = document.getElementById('host-retention-status-list');
    if (!statusContainer || !roomState) return;
    statusContainer.innerHTML = '';
    
    Object.keys(roomState.teams).forEach(tName => {
        const team = roomState.teams[tName];
        const isLocked = roomState.retention_locked && roomState.retention_locked[tName];
        const retList = roomState.retentions && roomState.retentions[tName] ? roomState.retentions[tName] : [];
        
        const div = document.createElement('div');
        div.style.display = 'flex';
        div.style.alignItems = 'center';
        div.style.justifyContent = 'space-between';
        div.style.padding = '0.5rem';
        div.style.borderBottom = '1px solid rgba(255,255,255,0.05)';
        
        const lockIcon = isLocked ? `<i class="fa-solid fa-lock text-green" title="Locked" style="color: #28a745;"></i>` : `<i class="fa-solid fa-lock-open text-gray" title="Unlocked" style="color: #6c757d;"></i>`;
        div.innerHTML = `
            <div style="display: flex; align-items: center; gap: 0.5rem;">
                ${lockIcon}
                <span style="font-weight: 600; color: white;">${tName}</span>
            </div>
            <span style="font-size: 0.85rem; color: var(--text-secondary);">${retList.length} players retained</span>
        `;
        statusContainer.appendChild(div);
    });
}

function togglePlayerRetention(pid) {
    fetch('/api/trade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            room_code: roomCode,
            team_name: teamName,
            action: 'toggle_retain',
            player_id: pid
        })
    })
    .then(res => res.json())
    .then(data => {
        if (data.error) {
            showNotification(data.error, "danger");
            renderRetentionPanel();
        }
    })
    .catch(err => showNotification("Failed to update retention.", "danger"));
}

function toggleRetentionLock() {
    const isLocked = roomState.retention_locked && roomState.retention_locked[teamName];
    fetch('/api/trade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            room_code: roomCode,
            team_name: teamName,
            action: 'lock_retentions',
            lock: !isLocked
        })
    })
    .then(res => res.json())
    .then(data => {
        if (data.error) showNotification(data.error, "danger");
    })
    .catch(err => showNotification("Failed to toggle lock.", "danger"));
}

function openProposeTradeModal() {
    const myTeam = roomState.teams[teamName];
    if (!myTeam) return;
    
    const myPlayerSelect = document.getElementById('trade-my-player');
    myPlayerSelect.innerHTML = '';
    myTeam.players.forEach(p => {
        const opt = document.createElement('option');
        opt.value = p.id;
        opt.textContent = `${p.name} (${p.role})`;
        myPlayerSelect.appendChild(opt);
    });
    
    const targetTeamSelect = document.getElementById('trade-target-team');
    targetTeamSelect.innerHTML = '<option value="">-- Select Team --</option>';
    Object.keys(roomState.teams).forEach(tName => {
        if (tName !== teamName) {
            const opt = document.createElement('option');
            opt.value = tName;
            opt.textContent = tName;
            targetTeamSelect.appendChild(opt);
        }
    });
    
    document.getElementById('trade-offer-type').value = 'player';
    toggleTradeTypeInputs();
    
    document.getElementById('trade-modal').classList.remove('hidden');
}

function closeTradeModal() {
    document.getElementById('trade-modal').classList.add('hidden');
}

function toggleTradeTypeInputs() {
    const tradeType = document.getElementById('trade-offer-type').value;
    document.getElementById('trade-input-cash-container').classList.toggle('hidden', tradeType !== 'cash');
    document.getElementById('trade-input-player-container').classList.toggle('hidden', tradeType !== 'player');
}

function updateTradeTargetPlayers() {
    const targetTeamName = document.getElementById('trade-target-team').value;
    const targetPlayerSelect = document.getElementById('trade-target-player');
    targetPlayerSelect.innerHTML = '';
    
    if (targetTeamName && roomState.teams[targetTeamName]) {
        roomState.teams[targetTeamName].players.forEach(p => {
            const opt = document.createElement('option');
            opt.value = p.id;
            opt.textContent = `${p.name} (${p.role})`;
            targetPlayerSelect.appendChild(opt);
        });
    }
}

function submitTradeProposal() {
    const targetTeam = document.getElementById('trade-target-team').value;
    const playerId = document.getElementById('trade-my-player').value;
    const tradeType = document.getElementById('trade-offer-type').value;
    
    if (!targetTeam) {
        showNotification("Please select a target team.", "warning");
        return;
    }
    if (!playerId) {
        showNotification("Please select a player to trade.", "warning");
        return;
    }
    
    let tradeValue = null;
    if (tradeType === 'cash') {
        tradeValue = parseInt(document.getElementById('trade-cash-value').value) || 0;
        if (tradeValue <= 0) {
            showNotification("Please enter a valid transfer price.", "warning");
            return;
        }
    } else {
        tradeValue = document.getElementById('trade-target-player').value;
        if (!tradeValue) {
            showNotification("Please select a player to swap.", "warning");
            return;
        }
    }
    
    fetch('/api/trade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            room_code: roomCode,
            team_name: teamName,
            action: 'propose',
            to_team: targetTeam,
            player_id: parseInt(playerId),
            type: tradeType,
            value: tradeValue
        })
    })
    .then(res => res.json())
    .then(data => {
        if (data.error) {
            showNotification(data.error, "danger");
        } else {
            showNotification("Trade proposal sent successfully!", "success");
            closeTradeModal();
        }
    })
    .catch(err => showNotification("Failed to send trade proposal.", "danger"));
}

function respondToTrade(tradeId, response) {
    if (!roomState || !roomState.trade_window_open) {
        showNotification("The Trade Window is currently closed by the Host.", "danger");
        return;
    }
    fetch('/api/trade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            room_code: roomCode,
            team_name: teamName,
            action: 'respond',
            trade_id: tradeId,
            response: response
        })
    })
    .then(res => res.json())
    .then(data => {
        if (data.error) showNotification(data.error, "danger");
        else showNotification(response === 'accept' ? "Trade proposal accepted!" : "Trade proposal declined.", "success");
    })
    .catch(err => showNotification("Failed to respond to trade.", "danger"));
}

function hostApproveTrade(tradeId) {
    fetch('/api/control', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            room_code: roomCode,
            host_id: hostId,
            action: 'approve_trade',
            trade_id: tradeId
        })
    })
    .then(res => res.json())
    .then(data => {
        if (data.error) showNotification(data.error, "danger");
        else showNotification("Trade proposal approved!", "success");
    })
    .catch(err => showNotification("Failed to approve trade.", "danger"));
}

function hostRejectTrade(tradeId) {
    fetch('/api/control', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            room_code: roomCode,
            host_id: hostId,
            action: 'reject_trade',
            trade_id: tradeId
        })
    })
    .then(res => res.json())
    .then(data => {
        if (data.error) showNotification(data.error, "danger");
        else showNotification("Trade proposal vetoed.", "success");
    })
    .catch(err => showNotification("Failed to veto trade.", "danger"));
}

// ==========================================
// STADIUM VIDEO BACKGROUND CONTROLLER
// ==========================================

function toggleVideoBackground(enabled) {
    let container = document.getElementById('video-bg-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'video-bg-container';
        container.className = 'video-bg-container';
        container.innerHTML = `
            <video id="video-bg" autoplay loop muted playsinline>
                <source src="https://assets.mixkit.co/videos/preview/mixkit-cricket-player-hitting-a-ball-40439-large.mp4" type="video/mp4">
            </video>
            <div class="video-bg-overlay"></div>
        `;
        document.body.appendChild(container);
    }
    
    const video = container.querySelector('video');
    if (enabled) {
        container.classList.add('active');
        if (video) {
            video.play().catch(err => console.log("Video autoplay blocked:", err));
        }
        localStorage.setItem('stadium_video_bg', 'true');
    } else {
        container.classList.remove('active');
        if (video) {
            video.pause();
        }
        localStorage.setItem('stadium_video_bg', 'false');
    }
}

// Init Video BG preference on DOMContentLoaded
window.addEventListener('DOMContentLoaded', () => {
    const savedVideoBg = localStorage.getItem('stadium_video_bg');
    const videoBgCheckbox = document.getElementById('video-bg-checkbox');
    if (savedVideoBg === 'true') {
        if (videoBgCheckbox) videoBgCheckbox.checked = true;
        toggleVideoBackground(true);
    }
});


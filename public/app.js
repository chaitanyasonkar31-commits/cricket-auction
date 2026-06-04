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
let eventSource = null;
let currentTimerVal = 0;
let localTimerInterval = null;
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
    const randomStr = Math.random().toString(36).substring(2, 8);
    const guestToken = "guest_" + randomStr;
    const guestName = "Guest_" + randomStr;
    
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
    }
}

// CSV/Preset Toggle Helper
function toggleCustomPlayers(show) {
    const customDiv = document.getElementById('custom-players-input');
    if (customDiv) {
        if (show) {
            customDiv.classList.remove('hidden');
            // Pre-populate custom players table if empty
            const rowsContainer = document.getElementById('custom-players-rows');
            if (rowsContainer && rowsContainer.children.length === 0) {
                for (let i = 0; i < 5; i++) {
                    addCustomPlayerRow();
                }
            }
        } else {
            customDiv.classList.add('hidden');
        }
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
        <td><input type="text" class="cp-name" placeholder="e.g. Shreyas Iyer" style="text-align: left;"></td>
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
    let presetsData = null;
    try {
        const response = await fetch('/api/presets');
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
        allPresetPlayers = [];
        Object.keys(presetsData).forEach(key => {
            const list = presetsData[key];
            list.forEach(p => {
                const source = key === 'ipl_legends' ? 'IPL' : (key === 'all_time_legends' ? 'Legend' : 'Full Pool');
                let country = p.country || (p.overseas ? 'Overseas' : 'India');
                if (!allPresetPlayers.some(item => item.name === p.name)) {
                    const playerCopy = JSON.parse(JSON.stringify(p));
                    playerCopy.source = source;
                    playerCopy.country = country;
                    allPresetPlayers.push(playerCopy);
                }
            });
        });
    }
    
    if (allPresetPlayers.length < 500) {
        generateRemainingPlayers();
    }
    
    // Always render players list checklist
    renderPlayersChecklist();
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
        
        let classes = ['checklist-item'];
        if (isRetiredHidden) classes.push('hidden-retired');
        if (isSearchHidden) classes.push('hidden-search');
        
        label.className = classes.join(' ');
        
        const countryLabel = p.country ? p.country : (p.overseas ? 'Overseas' : 'India');
        const isChecked = isRetiredHidden ? false : true;
        
        label.innerHTML = `
            <input type="checkbox" id="check-p-${p.id}" value="${p.id}" ${isChecked ? 'checked' : ''}>
            <div class="checklist-item-meta" style="flex-grow: 1;">
                <span class="checklist-item-name">${p.name} <span class="flag-icon" style="font-size: 0.75rem; color: var(--text-secondary);">(${countryLabel})</span></span>
                <div class="checklist-item-sub">
                    <span>${p.role}</span>
                    <span>•</span>
                    <span>Base: ${formatCurrency(p.base_price)}</span>
                </div>
            </div>
            <div class="checklist-rating-input" style="display: flex; flex-direction: column; align-items: flex-end; gap: 0.15rem;">
                <span style="font-size: 0.6rem; color: var(--text-secondary); text-transform: uppercase;">Rating</span>
                <input type="number" id="rating-p-${p.id}" placeholder="${p.rating}" min="1" max="99" style="width: 50px; height: 26px; padding: 0.2rem; background: rgba(0,0,0,0.3); border: 1px solid var(--border-color); color: white; border-radius: 4px; text-align: center; font-size: 0.8rem;">
            </div>
        `;
        grid.appendChild(label);
    });
}

// Helper to select/deselect all checklist checkboxes
function toggleAllChecklist(checked) {
    const checkboxes = document.querySelectorAll('.checklist-item:not(.hidden-retired):not(.hidden-search) input[type="checkbox"]');
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
    if (presetChoice === 'custom') {
        // 1. Add checked preset players
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
        
        // 2. Read custom players from the interactive table
        const customRows = document.querySelectorAll('#custom-players-rows tr');
        let customIndex = 1;
        customRows.forEach(row => {
            const nameEl = row.querySelector('.cp-name');
            const roleEl = row.querySelector('.cp-role');
            const styleEl = row.querySelector('.cp-style');
            const ratingEl = row.querySelector('.cp-rating');
            const priceEl = row.querySelector('.cp-price');
            const overseasEl = row.querySelector('.cp-overseas');
            
            const name = nameEl ? nameEl.value.trim() : '';
            const role = roleEl ? roleEl.value : 'Batsman';
            const style = styleEl && styleEl.value.trim() !== '' ? styleEl.value.trim() : (role === 'Bowler' ? 'Right-arm fast' : 'Right-hand bat');
            const rating = ratingEl && ratingEl.value.trim() !== '' ? parseInt(ratingEl.value.trim()) : 85;
            const basePrice = priceEl ? parseInt(priceEl.value) : 10000000;
            const overseas = overseasEl ? overseasEl.checked : false;
            
            if (name) {
                playersList.push({
                    id: 2000 + customIndex,
                    name: name,
                    role: role,
                    rating: rating,
                    base_price: basePrice,
                    stats: style,
                    img: "",
                    overseas: overseas,
                    country: overseas ? "Overseas" : "India"
                });
                customIndex++;
            }
        });
        
        if (playersList.length === 0) {
            showNotification("No players selected or entered! Select at least one player.", "warning");
            return;
        }
    }
    
    const settings = {
        budget: budgetVal,
        min_increment: incrementVal,
        timer_duration: timerVal,
        overseas_limit: 999
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
    if (text) text.innerText = val;
    
    if (bar && roomState && roomState.settings) {
        const duration = roomState.settings.timer_duration;
        const percentage = (val / duration) * 100;
        bar.style.width = percentage + "%";
        
        if (val <= 5) {
            bar.classList.add('warning');
        } else {
            bar.classList.remove('warning');
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
}

// Start the drafting
async function startAuction() {
    if (role !== 'host') return;
    try {
        await apiPost('/api/control', {
            room_code: roomCode,
            host_id: hostId,
            action: 'start'
        });
    } catch (err) {
        console.error(err);
    }
}

// Render Auction Section
function renderAuctionDashboard() {
    document.getElementById('dash-room-info').innerText = "ROOM: " + roomCode;
    
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
    
    // Active player mapping
    const idx = roomState.current_player_index;
    const stamp = document.getElementById('player-sale-stamp');
    const card = document.getElementById('active-player-card');
    
    if (idx >= 0 && idx < roomState.players.length) {
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
        if (player.img) {
            imgEl.src = player.img;
        } else {
            imgEl.src = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'><circle cx='50' cy='40' r='25' fill='%23555'/><path d='M15 85 C15 65 30 55 50 55 C70 55 85 65 85 85' fill='%23555'/></svg>";
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
        // Finished or waiting
        document.getElementById('player-card-role').innerText = "ROLE";
        document.getElementById('player-card-rating').innerText = "--";
        document.getElementById('player-card-name').innerText = roomState.status === 'finished' ? "Draft Finished!" : "Waiting to Begin";
        document.getElementById('player-card-stats').innerText = roomState.status === 'finished' ? "All players have been auctioned." : "Wait for host to introduce player.";
        document.getElementById('player-card-base').innerText = "--";
        document.getElementById('player-card-current').innerText = "--";
        document.getElementById('player-card-bidder').innerText = "--";
        const natEl = document.getElementById('player-card-nationality');
        if (natEl) natEl.classList.add('hidden');
        if (stamp) stamp.classList.add('hidden');
        if (card) card.className = "player-card glass-panel";
    }
    
    // 2. Bidding Buttons Controls Display
    const bidPanel = document.getElementById('bidding-controls-panel');
    if (role === 'host') {
        bidPanel.classList.add('hidden');
    } else {
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
        
        // Check squad capacity limit (max 16 players)
        const teamPlayers = roomState.teams[teamName] ? roomState.teams[teamName].players : [];
        const isSquadFull = teamPlayers.length >= 16;
        
        // Apply enable/disable criteria
        const minBtn = document.getElementById('btn-bid-min');
        const add20L = document.getElementById('btn-bid-20l');
        const add50L = document.getElementById('btn-bid-50l');
        const add1Cr = document.getElementById('btn-bid-1cr');
        const customBtn = document.getElementById('btn-bid-custom');
        
        document.getElementById('label-bid-min').innerText = minRequired > 0 ? formatCurrency(minRequired) : "₹0";
        
        const disableBidding = !isEligible || isHighBidder || budget < minRequired || exceedsOS || isSquadFull;
        
        minBtn.disabled = disableBidding;
        add20L.disabled = disableBidding || (roomState.current_bid === 0 && budget < (activePlayer.base_price + 2000000));
        add50L.disabled = disableBidding || (roomState.current_bid === 0 && budget < (activePlayer.base_price + 5000000));
        add1Cr.disabled = disableBidding || (roomState.current_bid === 0 && budget < (activePlayer.base_price + 10000000));
        customBtn.disabled = disableBidding;
        
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
            
            if (roomState.timer_active) {
                pauseBtn.classList.remove('hidden');
                resumeBtn.classList.add('hidden');
            } else {
                pauseBtn.classList.add('hidden');
                resumeBtn.classList.remove('hidden');
            }
            
            // Disable force-sell button if no one bid yet
            document.getElementById('host-btn-sell').disabled = roomState.current_bid === 0;
            document.getElementById('host-btn-unsold').disabled = false;
            document.getElementById('host-btn-reset').disabled = false;
        }
    } else {
        hostConsole.classList.add('hidden');
    }
    
    // 4. Render Leaderboard List
    const leaderboardGrid = document.getElementById('leaderboard-container');
    leaderboardGrid.innerHTML = '';
    
    const teamKeys = Object.keys(roomState.teams);
    
    // Sort teams by budget descending
    teamKeys.sort((a, b) => roomState.teams[b].budget - roomState.teams[a].budget);
    
    teamKeys.forEach(tName => {
        const team = roomState.teams[tName];
        const row = document.createElement('div');
        row.className = "leaderboard-row";
        row.onclick = () => openRosterModal(tName);
        
        let kickBtnHtml = '';
        if (role === 'host') {
            kickBtnHtml = `
                <button class="btn-kick" onclick="event.stopPropagation(); kickTeam('${tName}')" title="Kick Team">
                    <i class="fa-solid fa-user-slash"></i>
                </button>
            `;
        }
        
        row.innerHTML = `
            <div class="leader-team-info">
                <div class="leader-team-icon"><i class="fa-solid fa-shield-halved"></i></div>
                <div>
                    <span class="leader-team-name">${tName}</span>
                    <span class="leader-manager-name">Mgr: ${team.manager}</span>
                </div>
            </div>
            <div class="leader-team-stats">
                <span class="leader-team-count">${team.players.length} Players</span>
                <span class="leader-team-budget">${formatCurrency(team.budget)}</span>
                <i class="fa-solid fa-eye" title="View Squad Roster" style="margin-left: 0.5rem; color: var(--text-secondary); opacity: 0.7;"></i>
                ${kickBtnHtml}
            </div>
        `;
        leaderboardGrid.appendChild(row);
    });

    // Render the player queue list
    renderQueueList();
    
    // 5. Append Live Log Feed
    const logBox = document.getElementById('log-feed');
    logBox.innerHTML = '';
    roomState.logs.forEach(msg => {
        const item = document.createElement('div');
        item.className = "feed-item";
        item.innerHTML = msg;
        logBox.appendChild(item);
    });
    // Auto Scroll Logs to Bottom
    logBox.scrollTop = logBox.scrollHeight;
}

// Bidding Trigger POST
async function placeBid(type, value) {
    if (role !== 'manager') return;
    
    const idx = roomState.current_player_index;
    const activePlayer = roomState.players[idx];
    if (!activePlayer) return;
    
    let bidAmount = 0;
    
    if (type === 'min') {
        if (roomState.current_bid === 0) {
            bidAmount = activePlayer.base_price;
        } else {
            bidAmount = roomState.current_bid + roomState.settings.min_increment;
        }
    } else if (type === 'add') {
        let base = roomState.current_bid === 0 ? activePlayer.base_price : roomState.current_bid;
        bidAmount = base + value;
    } else if (type === 'custom') {
        const customInput = document.getElementById('custom-bid-amount');
        bidAmount = parseInt(customInput.value);
        if (isNaN(bidAmount) || bidAmount <= 0) {
            showNotification("Please enter a valid bid number", "warning");
            return;
        }
        customInput.value = ''; // clear input
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

// Host Action Trigger POST
async function hostAction(action) {
    if (role !== 'host') return;
    try {
        await apiPost('/api/control', {
            room_code: roomCode,
            host_id: hostId,
            action: action
        });
    } catch (err) {
        console.error(err);
    }
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
    if (pCount < 16) {
        countEl.style.color = 'var(--accent-gold)';
        countEl.title = "Under squad limit of 16 players";
    } else if (pCount > 16) {
        countEl.style.color = 'var(--accent-red)';
        countEl.title = "Over maximum squad limit of 16 players";
    } else {
        countEl.style.color = 'var(--accent-green)';
        countEl.title = "Squad is complete (Exactly 16 players)";
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
            tr.innerHTML = `
                <td><strong>${p.name} ${p.overseas ? '✈️' : ''}</strong></td>
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
let activeQueueFilter = 'upcoming';

function switchDashboardTab(tabName) {
    document.getElementById('tab-leaderboard').classList.toggle('active', tabName === 'leaderboard');
    document.getElementById('tab-players').classList.toggle('active', tabName === 'players');
    document.getElementById('tab-content-leaderboard').classList.toggle('hidden', tabName !== 'leaderboard');
    document.getElementById('tab-content-players').classList.toggle('hidden', tabName === 'leaderboard');
    if (tabName === 'players') {
        renderQueueList();
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
    const container = document.getElementById('queue-container');
    if (!container || !roomState) return;
    container.innerHTML = '';
    
    const idx = roomState.current_player_index;
    const players = roomState.players;
    
    let filtered = [];
    if (activeQueueFilter === 'upcoming') {
        // Upcoming: players at index > current_player_index that are not sold/unsold
        filtered = players.filter((p, i) => i > idx && p.status !== 'sold' && !p.bought_by);
    } else if (activeQueueFilter === 'sold') {
        // Sold: players who have been purchased
        filtered = players.filter(p => p.status === 'sold' || p.bought_by);
    } else if (activeQueueFilter === 'unsold') {
        // Unsold: players that are marked unsold and have no buyer
        filtered = players.filter(p => p.status === 'unsold' && !p.bought_by);
    }
    
    if (filtered.length === 0) {
        container.innerHTML = `<div class="help-text" style="text-align: center; padding: 1rem;">No players in this category.</div>`;
        return;
    }
    
    filtered.forEach(p => {
        const row = document.createElement('div');
        row.className = "queue-row";
        let detailsHtml = p.status === 'sold' || p.bought_by
            ? `<span class="queue-sold-info">${p.bought_by} (${formatCurrency(p.price || p.base_price)})</span>`
            : `<span class="queue-price">Base: ${formatCurrency(p.base_price)}</span>`;
        row.innerHTML = `
            <div class="queue-player-info">
                <strong>${p.name} ${p.overseas ? '✈️' : ''}</strong>
                <span>${p.role} • Rating: ${p.rating}</span>
            </div>
            <div class="queue-player-meta">
                ${detailsHtml}
            </div>
        `;
        container.appendChild(row);
    });
}


// --- Scheduled/Active Auction Handlers ---
function renderScheduledAuctions() {
    const scheduled = JSON.parse(localStorage.getItem('scheduled_auctions') || '[]');
    const container = document.getElementById('scheduled-auctions-section');
    const list = document.getElementById('scheduled-auctions-list');
    
    if (!container || !list) return;
    
    if (scheduled.length === 0) {
        container.classList.add('hidden');
        return;
    }
    
    container.classList.remove('hidden');
    list.innerHTML = '';
    
    scheduled.forEach(item => {
        const row = document.createElement('div');
        row.className = 'scheduled-auction-item';
        
        row.innerHTML = `
            <div style="display: flex; flex-direction: column;">
                <strong style="color: white; font-size: 1rem;">${item.auctionName}</strong>
                <span style="font-size: 0.8rem; color: var(--text-secondary);">Room Code: <strong style="color: var(--accent-purple); font-size: 0.9rem;">${item.roomCode}</strong> &bull; Created: ${item.createdAt || 'N/A'}</span>
            </div>
            <div style="display: flex; gap: 0.5rem;">
                <button class="btn btn-primary" onclick="hostScheduledAuction('${item.roomCode}', '${item.hostId}')" style="padding: 0.45rem 1rem; font-size: 0.8rem; height: auto;">
                    <i class="fa-solid fa-play"></i> Host / Go Live
                </button>
                <button class="btn btn-secondary" onclick="deleteScheduledAuction('${item.roomCode}')" style="padding: 0.45rem 0.6rem; font-size: 0.8rem; height: auto; background: rgba(255, 51, 102, 0.15); border-color: rgba(255, 51, 102, 0.3); color: var(--accent-red);">
                    <i class="fa-solid fa-trash-can"></i>
                </button>
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

function deleteScheduledAuction(rCode) {
    if (!confirm("Are you sure you want to remove this scheduled auction? This will remove it from your shortcuts list, but the room itself will remain on the server.")) return;
    
    let scheduled = JSON.parse(localStorage.getItem('scheduled_auctions') || '[]');
    scheduled = scheduled.filter(item => item.roomCode !== rCode);
    localStorage.setItem('scheduled_auctions', JSON.stringify(scheduled));
    
    renderScheduledAuctions();
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
    
    // Save Custom Roster checklist selections & ratings
    if (presetChoice === 'custom') {
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
        
        const customRows = document.querySelectorAll('#custom-players-rows tr');
        customRows.forEach(row => {
            const nameEl = row.querySelector('.cp-name');
            const roleEl = row.querySelector('.cp-role');
            const styleEl = row.querySelector('.cp-style');
            const ratingEl = row.querySelector('.cp-rating');
            const priceEl = row.querySelector('.cp-price');
            const overseasEl = row.querySelector('.cp-overseas');
            
            const name = nameEl ? nameEl.value.trim() : '';
            if (name) {
                draft.customRows.push({
                    name: name,
                    role: roleEl ? roleEl.value : 'Batsman',
                    style: styleEl ? styleEl.value.trim() : '',
                    rating: ratingEl ? ratingEl.value.trim() : '',
                    price: priceEl ? priceEl.value : '10000000',
                    overseas: overseasEl ? overseasEl.checked : false
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
            toggleCustomPlayers(draft.presetChoice === 'custom');
        }
        
        if (draft.presetChoice === 'custom') {
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
                        addCustomPlayerRowWithData(r.name, r.role, r.style, r.rating, r.price, r.overseas);
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

function addCustomPlayerRowWithData(name, role, style, rating, price, overseas) {
    const rowsContainer = document.getElementById('custom-players-rows');
    if (!rowsContainer) return;
    
    const nextSNo = rowsContainer.children.length + 1;
    const tr = document.createElement('tr');
    tr.innerHTML = `
        <td class="s-no" style="font-weight: bold; text-align: center; color: var(--text-secondary);">${nextSNo}</td>
        <td><input type="text" class="cp-name" value="${name || ''}" placeholder="e.g. Shreyas Iyer" style="text-align: left;"></td>
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

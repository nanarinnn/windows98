// Check session storage on load to see if user has already verified
document.addEventListener("DOMContentLoaded", () => {
    const isVerified = sessionStorage.getItem("captcha-verified");
    const overlay = document.getElementById("captcha-overlay");
    const desktop = document.getElementById("desktop-content");

    if (isVerified === "true") {
        overlay.style.display = "none";
        desktop.style.display = "block";
    } else {
        overlay.style.display = "flex";
        desktop.style.display = "none";
    }

    // Set up CAPTCHA grid cell event listeners
    const cells = document.querySelectorAll(".captcha-cell");
    cells.forEach(cell => {
        cell.addEventListener("click", () => {
            cell.classList.toggle("selected");
        });
    });

    // Set up CAPTCHA verify button
    const verifyBtn = document.getElementById("captcha-verify-btn");
    if (verifyBtn) {
        verifyBtn.addEventListener("click", submitCaptcha);
    }

    // Set up Media Player event listeners
    const video = document.getElementById("player-video");
    const timeline = document.getElementById("player-timeline");
    const playBtn = document.getElementById("btn-play");
    const pauseBtn = document.getElementById("btn-pause");
    const stopBtn = document.getElementById("btn-stop");
    const playlist = document.getElementById("player-playlist");

    if (video && timeline && playBtn && pauseBtn && stopBtn && playlist) {
        playBtn.addEventListener("click", () => {
            video.play();
        });

        pauseBtn.addEventListener("click", () => {
            video.pause();
        });

        stopBtn.addEventListener("click", () => {
            video.pause();
            video.currentTime = 0;
            timeline.value = 0;
        });

        playlist.addEventListener("change", () => {
            video.src = playlist.value;
            video.play();
        });

        video.addEventListener("timeupdate", () => {
            if (video.duration) {
                const percentage = (video.currentTime / video.duration) * 100;
                timeline.value = percentage;
            }
        });

        timeline.addEventListener("input", () => {
            if (video.duration) {
                const seekTime = (timeline.value / 100) * video.duration;
                video.currentTime = seekTime;
            }
        });
    }

    // Make all windows draggable
    const windowsEl = document.querySelectorAll(".window:not(#captcha-window):not(#retro-alert):not(#recycle-bin-alert)");
    windowsEl.forEach(win => {
        makeDraggable(win);
    });

    // Initialize taskbar clock
    function updateClock() {
        const clockEl = document.getElementById("clock-time");
        const darkClockEl = document.getElementById("darkweb-clock-time");
        const now = new Date();
        let hours = now.getHours();
        const minutes = now.getMinutes();
        const ampm = hours >= 12 ? '오후' : '오전';
        hours = hours % 12;
        hours = hours ? hours : 12; // Hour '0' becomes '12'
        const minutesStr = minutes < 10 ? '0' + minutes : minutes;
        const timeStr = `${ampm} ${hours}:${minutesStr}`;
        if (clockEl) clockEl.textContent = timeStr;
        if (darkClockEl) darkClockEl.textContent = timeStr;
    }
    updateClock();
    setInterval(updateClock, 1000);

    // Update taskbar elements initially
    updateTaskbar();
});

// CAPTCHA Submission Logic
function submitCaptcha() {
    const selectedCells = document.querySelectorAll(".captcha-cell.selected");
    
    // If no images are selected, show a retro Windows 98 warning alert
    if (selectedCells.length === 0) {
        showAlert("인증을 진행하려면 이미지를 최소 하나 이상 선택해야 합니다.");
        return;
    }

    // Show retro loading effect
    const verifyBtn = document.getElementById("captcha-verify-btn");
    const originalText = verifyBtn.textContent;
    verifyBtn.textContent = "인증 중...";
    verifyBtn.disabled = true;

    // Simulate verification delay (1 second)
    setTimeout(() => {
        sessionStorage.setItem("captcha-verified", "true");
        
        // Hide overlay and show desktop
        document.getElementById("captcha-overlay").style.display = "none";
        document.getElementById("desktop-content").style.display = "block";
        
        // Automatically open "readme.txt" to welcome the user
        openWindow("readmeWindow");
    }, 1000);
}

// Reset CAPTCHA verification state (for testing)
function resetCaptcha() {
    sessionStorage.removeItem("captcha-verified");
    window.location.reload();
}

// Alert Handlers
function showAlert(message) {
    document.getElementById("retro-alert-message").textContent = message;
    document.getElementById("retro-alert").style.display = "block";
}

function closeAlert() {
    document.getElementById("retro-alert").style.display = "none";
}

// Window Configuration & Focus tracking
let highestZIndex = 20;
const windowsList = [
    { id: 'myDocWindow', title: '📁 내 문서' },
    { id: 'sysWindow', title: '💻 시스템 정보' },
    { id: 'mediaPlayerWindow', title: '🎬 미디어 플레이어' },
    { id: 'profileTxtWindow', title: '📄 프로필.txt' },
    { id: 'calendarWindow', title: '📅 방송일정' },
    { id: 'readmeWindow', title: '📄 readme.txt' },
    { id: 'imageViewerWindow', title: '🖼️ 이미지 뷰어' }
];

// Desktop Window Management
function openWindow(windowId) {
    const el = document.getElementById(windowId);
    if (el) {
        el.style.display = "flex";
        highestZIndex++;
        el.style.zIndex = highestZIndex;
        if (windowId === 'calendarWindow') {
            renderCalendar();
        }
        updateTaskbar();
    }
    closeStartMenu();
}

function closeWindow(windowId) {
    const el = document.getElementById(windowId);
    if (el) {
        el.style.display = "none";
        if (windowId === 'mediaPlayerWindow') {
            const video = document.getElementById("player-video");
            if (video) video.pause();
        }
        updateTaskbar();
    }
}

// Window Dragging Logic (MouseDown on header)
function makeDraggable(windowEl) {
    const header = windowEl.querySelector('.window-header');
    if (!header) return;

    header.style.cursor = 'move';

    header.addEventListener('mousedown', (e) => {
        // Bring to front
        highestZIndex++;
        windowEl.style.zIndex = highestZIndex;
        updateTaskbar();
        if (windowEl.id.startsWith('darkweb')) {
            updateDarkWebTaskbar();
        }

        let pos1 = 0, pos2 = 0, pos3 = e.clientX, pos4 = e.clientY;

        function elementDrag(e) {
            e.preventDefault();
            pos1 = pos3 - e.clientX;
            pos2 = pos4 - e.clientY;
            pos3 = e.clientX;
            pos4 = e.clientY;
            windowEl.style.top = (windowEl.offsetTop - pos2) + "px";
            windowEl.style.left = (windowEl.offsetLeft - pos1) + "px";
        }

        function closeDragElement() {
            document.removeEventListener('mouseup', closeDragElement);
            document.removeEventListener('mousemove', elementDrag);
        }

        document.addEventListener('mouseup', closeDragElement);
        document.addEventListener('mousemove', elementDrag);
    });

    // Make window focused on click anywhere on it
    windowEl.addEventListener('mousedown', () => {
        if (parseInt(windowEl.style.zIndex || 0) < highestZIndex) {
            highestZIndex++;
            windowEl.style.zIndex = highestZIndex;
            updateTaskbar();
            if (windowEl.id.startsWith('darkweb')) {
                updateDarkWebTaskbar();
            }
        }
    });
}

// Taskbar Dynamic Rendering Logic
function updateTaskbar() {
    const container = document.getElementById('taskbar-items');
    if (!container) return;

    container.innerHTML = '';

    windowsList.forEach(win => {
        const el = document.getElementById(win.id);
        if (el && el.style.display === 'flex') {
            const btn = document.createElement('div');
            btn.className = 'taskbar-item';
            btn.textContent = win.title;

            // Check if this window is currently focused (has highest z-index among visible windows)
            const isFocused = parseInt(el.style.zIndex || 0) === highestZIndex;
            if (isFocused) {
                btn.classList.add('active');
            }

            btn.addEventListener('click', () => {
                if (isFocused) {
                    // Minimize if already active
                    el.style.display = 'none';
                    updateTaskbar();
                } else {
                    // Bring to front and focus
                    highestZIndex++;
                    el.style.zIndex = highestZIndex;
                    updateTaskbar();
                }
            });

            container.appendChild(btn);
        }
    });
}

// Start Menu Handlers
function toggleStartMenu() {
    const menu = document.getElementById('start-menu');
    const btn = document.getElementById('start-button');
    if (menu.style.display === 'flex') {
        closeStartMenu();
    } else {
        menu.style.display = 'flex';
        btn.classList.add('active');
    }
}

// Global click handler to close start menu when clicking outside of it
window.onclick = function(event) {
    if (!event.target.closest('#start-menu') && !event.target.closest('#start-button')) {
        closeStartMenu();
    }
}

function closeStartMenu() {
    document.getElementById('start-menu').style.display = 'none';
    document.getElementById('start-button').classList.remove('active');
}

// Recycle Bin Easter Egg Alert Handlers
function openRecycleBin() {
    document.getElementById("recycle-bin-alert").style.display = "block";
    closeStartMenu();
}

function closeRecycleBinAlert() {
    document.getElementById("recycle-bin-alert").style.display = "none";
}

// Calendar Dynamic Generation Script (Easter egg / scheduler)
let currentCalendarDate = new Date();

function renderCalendar() {
    const container = document.getElementById("calendar-days");
    const monthYearLabel = document.getElementById("calendar-month-year");
    if (!container || !monthYearLabel) return;

    container.innerHTML = "";

    const year = currentCalendarDate.getFullYear();
    const month = currentCalendarDate.getMonth(); // 0-indexed

    // Set label text
    monthYearLabel.textContent = `${year}년 ${month + 1}월`;

    // First day of the month and number of days
    const firstDay = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();

    // Empty cells for the offset
    for (let i = 0; i < firstDay; i++) {
        const emptyCell = document.createElement("div");
        emptyCell.className = "calendar-cell-day empty";
        container.appendChild(emptyCell);
    }

    // Days cells
    for (let day = 1; day <= totalDays; day++) {
        const cell = document.createElement("div");
        cell.className = "calendar-cell-day";
        
        const dateNum = document.createElement("div");
        dateNum.className = "date-number";
        dateNum.textContent = day;

        const dateObj = new Date(year, month, day);
        const dayOfWeek = dateObj.getDay();
        
        if (dayOfWeek === 0) dateNum.style.color = "#ff0000";
        if (dayOfWeek === 6) dateNum.style.color = "#0000ff";

        cell.appendChild(dateNum);

        const sched = document.createElement("div");
        sched.className = "schedule-text";

        // Check scheduling rules:
        // 치지직 방송: 매주 화, 수, 금, 토 (22:00)
        // 유연ASMR 방송: 매주 일 (23:00)
        // 유튜브 업로드: 매주 월, 목
        if (dayOfWeek === 2 || dayOfWeek === 3 || dayOfWeek === 5 || dayOfWeek === 6) {
            sched.innerHTML = `<span style="color: #1084d0; font-weight:bold; font-size:9px;">📺 치지직</span><br><span style="color:#555; font-size:9px;">22:00</span>`;
        } else if (dayOfWeek === 0) {
            sched.innerHTML = `<span style="color: #800080; font-weight:bold; font-size:9px;">🎧 ASMR</span><br><span style="color:#555; font-size:9px;">23:00</span>`;
        } else if (dayOfWeek === 1 || dayOfWeek === 4) {
            sched.innerHTML = `<span style="color: #008000; font-weight:bold; font-size:9px;">▶️ 유튜브</span><br><span style="font-size:9px; visibility: hidden;">&nbsp;</span>`;
        }

        // (Vacation logic moved to bottom of grid for spanning columns)
        cell.appendChild(sched);
        container.appendChild(cell);
    }

    // Pad remaining grid cells to complete standard 42 cell structure (6 rows)
    const totalCells = firstDay + totalDays;
    const remaining = 42 - totalCells;
    for (let i = 0; i < remaining; i++) {
        const emptyCell = document.createElement("div");
        emptyCell.className = "calendar-cell-day empty";
        container.appendChild(emptyCell);
    }

    // Spanning vacation banner overlay: August 26-28, 2026
    if (year === 2026 && month === 7) {
        const overlay = document.createElement("div");
        overlay.style.position = "absolute";
        overlay.style.left = "42.857%"; // Column 4 start (Wednesday)
        overlay.style.width = "42.857%"; // Spans 3 columns (Wednesday, Thursday, Friday)
        overlay.style.top = "66.666%"; // Row 5 start
        overlay.style.height = "16.666%"; // 1 row tall
        overlay.style.pointerEvents = "none";
        overlay.style.zIndex = "10";
        overlay.style.boxSizing = "border-box";
        
        overlay.innerHTML = `
            <!-- Vacation text positioned above the arrow line -->
            <div style="position: absolute; top: 10.5px; left: 0; right: 0; text-align: center; color: #ff0000; font-weight: bold; font-size: 6.5px; line-height: 1;">
                유연이는 휴가 중
            </div>
            <!-- Arrow line positioned below the vacation text and date numbers -->
            <div style="position: absolute; top: 15px; left: 0; right: 0; display: flex; align-items: center; color: #ff0000; font-weight: bold; font-size: 11px; line-height: 1; padding: 0 4px; box-sizing: border-box;">
                <span style="margin-right: -1px; margin-top: -1px;">&lt;</span>
                <div style="flex-grow: 1; border-top: 2px solid #ff0000; height: 0;"></div>
                <span style="margin-left: -1px; margin-top: -1px;">&gt;</span>
            </div>
        `;
        container.appendChild(overlay);
    }
}

function prevMonth() {
    currentCalendarDate.setMonth(currentCalendarDate.getMonth() - 1);
    renderCalendar();
}

function nextMonth() {
    currentCalendarDate.setMonth(currentCalendarDate.getMonth() + 1);
    renderCalendar();
}

function openImageViewer(imageSrc, imageName) {
    const img = document.getElementById("viewer-img");
    const titleSpan = document.querySelector("#imageViewerWindow .window-header span");
    if (img && titleSpan) {
        img.src = imageSrc;
        titleSpan.textContent = `🖼️ ${imageName} - 이미지 뷰어`;
        
        // Dynamically update the taskbar title for this window
        const winObj = windowsList.find(w => w.id === 'imageViewerWindow');
        if (winObj) {
            winObj.title = `🖼️ ${imageName}`;
        }
        
        openWindow('imageViewerWindow');
    }
}

// Dark Web Simulation Control Flow
let darkWebTerminalTimeout = null;

function startDarkWeb() {
    closeStartMenu();
    const overlay = document.getElementById("darkweb-overlay");
    const terminal = document.getElementById("darkweb-terminal");
    const warning = document.getElementById("darkweb-warning-screen");
    const desktop = document.getElementById("darkweb-desktop");
    const linesContainer = document.getElementById("darkweb-terminal-lines");
    
    // Reset state
    overlay.style.display = "block";
    terminal.style.display = "flex";
    warning.style.display = "none";
    desktop.style.display = "none";
    linesContainer.innerHTML = "";
    
    // Clear previous timeouts if any
    if (darkWebTerminalTimeout) {
        clearTimeout(darkWebTerminalTimeout);
    }
    
    const lines = [
        "Connecting to secure network... [OK]",
        "Decrypting protocol: SPECIAL DISASTER MANAGEMENT HEADQUARTERS...",
        "Accessing database... [GRANTED]",
        "Redirecting to core server..."
    ];
    
    let lineIdx = 0;
    let charIdx = 0;
    
    function typeNextChar() {
        if (lineIdx < lines.length) {
            const currentLineText = lines[lineIdx];
            if (charIdx === 0) {
                const lineDiv = document.createElement("div");
                lineDiv.id = `terminal-line-${lineIdx}`;
                lineDiv.style.marginBottom = "8px";
                linesContainer.appendChild(lineDiv);
            }
            const lineDiv = document.getElementById(`terminal-line-${lineIdx}`);
            lineDiv.textContent += currentLineText[charIdx];
            charIdx++;
            
            if (charIdx >= currentLineText.length) {
                lineIdx++;
                charIdx = 0;
                darkWebTerminalTimeout = setTimeout(typeNextChar, 400);
            } else {
                darkWebTerminalTimeout = setTimeout(typeNextChar, 25);
            }
        } else {
            // Typing complete, switch to warning screen
            darkWebTerminalTimeout = setTimeout(() => {
                terminal.style.display = "none";
                warning.style.display = "flex";
            }, 1000);
        }
    }
    
    typeNextChar();
}

function confirmDarkWebWarning() {
    const warning = document.getElementById("darkweb-warning-screen");
    const desktop = document.getElementById("darkweb-desktop");
    warning.style.display = "none";
    desktop.style.display = "block";
}

function disconnectDarkWeb() {
    const overlay = document.getElementById("darkweb-overlay");
    overlay.style.display = "none";
    
    // Close any open dark web windows
    closeDarkWebFolder();
    closeDarkWebReport();
    closeDarkWebCCTV();
    closeDarkWebReadme();
    closeDarkWebAlert();
}

function openDarkWebFolder() {
    const win = document.getElementById("darkwebFolderWindow");
    win.style.display = "flex";
    highestZIndex++;
    win.style.zIndex = highestZIndex;
    updateDarkWebTaskbar();
}

function closeDarkWebFolder() {
    const win = document.getElementById("darkwebFolderWindow");
    win.style.display = "none";
    updateDarkWebTaskbar();
}

// Notepad Report Open/Close
function openDarkWebReport() {
    const win = document.getElementById("darkwebReportWindow");
    win.style.display = "flex";
    highestZIndex++;
    win.style.zIndex = highestZIndex;
    updateDarkWebTaskbar();
}

function closeDarkWebReport() {
    const win = document.getElementById("darkwebReportWindow");
    win.style.display = "none";
    updateDarkWebTaskbar();
}

// Dark Web Readme Open/Close
function openDarkWebReadme() {
    const win = document.getElementById("darkwebReadmeWindow");
    if (win) {
        win.style.display = "flex";
        highestZIndex++;
        win.style.zIndex = highestZIndex;
        updateDarkWebTaskbar();
    }
}

function closeDarkWebReadme() {
    const win = document.getElementById("darkwebReadmeWindow");
    if (win) {
        win.style.display = "none";
        updateDarkWebTaskbar();
    }
}

// CCTV Open/Close
function openDarkWebCCTV() {
    const win = document.getElementById("darkwebCCTVWindow");
    win.style.display = "flex";
    highestZIndex++;
    win.style.zIndex = highestZIndex;
    updateDarkWebTaskbar();
    startCCTVGame();
}

function closeDarkWebCCTV() {
    const win = document.getElementById("darkwebCCTVWindow");
    win.style.display = "none";
    updateDarkWebTaskbar();
    stopCCTVGame();
}

// CCTV Gaming Engine
let cctvHour = 22;
let cctvMinute = 0;
let cctvTimer = null;
let cctvGameState = 'idle'; // 'idle' | 'event_A' | 'event_B' | 'event_D' | 'event_F' | 'death' | 'win'
let hasBait = false;
let cctvNoiseAnimId = null;
let cctvTVNoiseAnimId = null;

function initCCTVNoise() {
    const canvas = document.getElementById('cctv-noise-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = 160;
    canvas.height = 120;
    
    function drawNoise() {
        const cctvWin = document.getElementById('darkwebCCTVWindow');
        if (!cctvWin || cctvWin.style.display === 'none') return;
        
        const imgData = ctx.createImageData(canvas.width, canvas.height);
        const data = imgData.data;
        for (let i = 0; i < data.length; i += 4) {
            const val = Math.floor(Math.random() * 255);
            data[i] = val;
            data[i+1] = val;
            data[i+2] = val;
            data[i+3] = 255;
        }
        ctx.putImageData(imgData, 0, 0);
        cctvNoiseAnimId = requestAnimationFrame(drawNoise);
    }
    
    if (cctvNoiseAnimId) cancelAnimationFrame(cctvNoiseAnimId);
    drawNoise();
}

function initTVNoise() {
    const canvas = document.getElementById('cctv-tv-noise-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = 160;
    canvas.height = 120;
    
    function drawTVNoise() {
        const tvNoisePanel = document.getElementById('cctv-tv-noise');
        if (!tvNoisePanel || tvNoisePanel.style.display === 'none') return;
        
        const imgData = ctx.createImageData(canvas.width, canvas.height);
        const data = imgData.data;
        for (let i = 0; i < data.length; i += 4) {
            const val = Math.floor(Math.random() * 255);
            data[i] = val;
            data[i+1] = val;
            data[i+2] = val;
            data[i+3] = 255;
        }
        ctx.putImageData(imgData, 0, 0);
        cctvTVNoiseAnimId = requestAnimationFrame(drawTVNoise);
    }
    
    if (cctvTVNoiseAnimId) cancelAnimationFrame(cctvTVNoiseAnimId);
    drawTVNoise();
}

function startCCTVGame() {
    stopCCTVGame();
    cctvHour = 22;
    cctvMinute = 0;
    cctvGameState = 'idle';
    hasBait = false;
    
    document.getElementById('cctv-blackout').style.display = 'none';
    document.getElementById('cctv-tv-noise').style.display = 'none';
    
    updateCCTVHUD();
    const logsContainer = document.getElementById('cctv-logs');
    logsContainer.innerHTML = '<div style="color: #888;">[SYSTEM] 해안 순찰 CCTV v1.02 로드 완료...</div>';
    addCCTVLog("근무 시작. 감시 시스템 정상 작동.");
    
    playCCTVVideo('idle_sea.mp4', '[FEED: SUNSHINE_BEACH_IDLE]');
    clearCCTVChoices();
    
    cctvTimer = setInterval(tickCCTVGame, 500);
    initCCTVNoise();
}

function stopCCTVGame() {
    if (cctvTimer) {
        clearInterval(cctvTimer);
        cctvTimer = null;
    }
    const video = document.getElementById('cctv-video');
    if (video) video.pause();
    if (cctvNoiseAnimId) cancelAnimationFrame(cctvNoiseAnimId);
    if (cctvTVNoiseAnimId) cancelAnimationFrame(cctvTVNoiseAnimId);
}

function playCCTVVideo(src, fallbackText) {
    const video = document.getElementById('cctv-video');
    const centerStatus = document.getElementById('cctv-center-status');
    const offlineBg = document.getElementById('cctv-offline-bg');
    
    if (video) {
        video.src = src;
        video.style.display = 'block';
        if (offlineBg) offlineBg.style.display = 'none';
        if (centerStatus) centerStatus.style.display = 'none';
        
        video.play().then(() => {
            if (offlineBg) offlineBg.style.display = 'none';
            if (centerStatus) centerStatus.style.display = 'none';
        }).catch(err => {
            video.style.display = 'none';
            if (offlineBg) offlineBg.style.display = 'block';
            if (centerStatus) {
                centerStatus.style.display = 'block';
                centerStatus.textContent = fallbackText;
            }
        });
    }
}

function tickCCTVGame() {
    cctvMinute += 5;
    if (cctvMinute >= 60) {
        cctvMinute = 0;
        cctvHour++;
        if (cctvHour >= 24) {
            cctvHour = 0;
        }
    }
    
    updateCCTVHUD();
    
    const timeStr = formatGameTime(cctvHour, cctvMinute);
    if (timeStr === '00:15') {
        triggerEventA();
    } else if (timeStr === '01:40') {
        triggerEventB();
    } else if (timeStr === '03:10') {
        triggerEventD();
    } else if (timeStr === '04:55') {
        triggerEventF();
    } else if (timeStr === '06:00') {
        triggerGameClear();
    }
}

function formatGameTime(h, m) {
    const hh = h < 10 ? '0' + h : h;
    const mm = m < 10 ? '0' + m : m;
    return `${hh}:${mm}`;
}

function updateCCTVHUD() {
    const timeDisplay = document.getElementById('cctv-time-display');
    const stateDisplay = document.getElementById('cctv-state-display');
    if (timeDisplay) {
        timeDisplay.textContent = `GAME TIME: ${formatGameTime(cctvHour, cctvMinute)}`;
    }
    if (stateDisplay) {
        if (cctvGameState === 'idle') {
            stateDisplay.textContent = 'STATUS: NORMAL';
            stateDisplay.style.color = '#00ff00';
        } else if (cctvGameState === 'death') {
            stateDisplay.textContent = 'STATUS: ERROR - FATAL';
            stateDisplay.style.color = '#ff0000';
        } else {
            stateDisplay.textContent = 'STATUS: WARNING - ANOMALY';
            stateDisplay.style.color = '#ffff00';
        }
    }
}

function addCCTVLog(message, isWarning = false) {
    const logsContainer = document.getElementById('cctv-logs');
    if (!logsContainer) return;
    const timeStr = formatGameTime(cctvHour, cctvMinute);
    const color = isWarning ? '#ff0000' : '#00ff00';
    const logDiv = document.createElement('div');
    logDiv.style.color = color;
    logDiv.textContent = `[${timeStr}] ${message}`;
    logsContainer.appendChild(logDiv);
    logsContainer.scrollTop = logsContainer.scrollHeight;
}

function clearCCTVChoices() {
    const container = document.getElementById('cctv-choices-container');
    if (container) {
        container.innerHTML = '';
    }
}

function setCCTVChoices(choices) {
    const container = document.getElementById('cctv-choices-container');
    if (!container) return;
    container.innerHTML = '';
    
    choices.forEach(ch => {
        const btn = document.createElement('button');
        btn.textContent = ch.text;
        
        btn.style.backgroundColor = '#111';
        btn.style.color = '#ff0000';
        btn.style.border = '1px solid #ff0000';
        btn.style.fontFamily = 'monospace';
        btn.style.fontSize = '11px';
        btn.style.padding = '4px 12px';
        btn.style.cursor = 'pointer';
        
        btn.addEventListener('click', ch.action);
        container.appendChild(btn);
    });
}

function triggerEventA() {
    clearInterval(cctvTimer);
    cctvGameState = 'event_A';
    updateCCTVHUD();
    
    playCCTVVideo('event_A_intro.mp4', '[FEED: BARBARI_COAT_MAN]');
    addCCTVLog("[경고] 베이지색 바바리코트 개체 목격.", true);
    
    setCCTVChoices([
        {
            text: "[1] 특별재난관리본부 보고",
            action: () => {
                addCCTVLog("특별재난관리본부 보고 시도... 통화 연결 불가 및 신체 훼손 사고 발생.", true);
                triggerDeath();
            }
        },
        {
            text: "[2] 조명 소등 및 눈 감기",
            action: () => {
                clearCCTVChoices();
                const blackout = document.getElementById('cctv-blackout');
                blackout.style.display = 'flex';
                addCCTVLog("조명 소등 및 안구 폐쇄 실시. 대기 중...", false);
                
                setTimeout(() => {
                    blackout.style.display = 'none';
                    addCCTVLog("썩은 악취 소멸 확인. 안전 복구되었습니다.", false);
                    cctvGameState = 'idle';
                    playCCTVVideo('idle_sea.mp4', '[FEED: SUNSHINE_BEACH_IDLE]');
                    cctvTimer = setInterval(tickCCTVGame, 500);
                }, 3000);
            }
        }
    ]);
}

function triggerEventB() {
    clearInterval(cctvTimer);
    cctvGameState = 'event_B';
    updateCCTVHUD();
    
    playCCTVVideo('event_B_intro.mp4', '[FEED: HAENYEO_OLD_WOMAN]');
    addCCTVLog("[경고] 해녀 차림의 노파 조우.", true);
    
    setCCTVChoices([
        {
            text: "[1] 지갑에서 돈 지불",
            action: () => {
                addCCTVLog("지갑에서 지불 시도... 비정상적 습격에 의한 사망.", true);
                triggerDeath();
            }
        },
        {
            text: "[2] 우측 가슴 만원권 3장 지불",
            action: () => {
                clearCCTVChoices();
                addCCTVLog("[아이템 획득] '훌륭한 미끼'를 성공적으로 입수했습니다.", false);
                hasBait = true;
                
                cctvGameState = 'idle';
                playCCTVVideo('idle_sea.mp4', '[FEED: SUNSHINE_BEACH_IDLE]');
                cctvTimer = setInterval(tickCCTVGame, 500);
            }
        }
    ]);
}

function triggerEventD() {
    clearInterval(cctvTimer);
    cctvGameState = 'event_D';
    updateCCTVHUD();
    
    playCCTVVideo('event_D_intro.mp4', '[FEED: ROCKY_SHORE_FISHERMAN]');
    addCCTVLog("[경고] 갯바위 낚시꾼이 미끼를 요구함.", true);
    
    setCCTVChoices([
        {
            text: "[1] 대기소로 도주",
            action: () => {
                addCCTVLog("도주 중 뒤돌아섬으로써 사망 확인.", true);
                triggerDeath();
            }
        },
        {
            text: "[2] 훌륭한 미끼 건네기",
            action: () => {
                clearCCTVChoices();
                if (hasBait) {
                    addCCTVLog("훌륭한 미끼 건네기 완료. 만족하여 퇴장합니다.", false);
                    cctvGameState = 'idle';
                    playCCTVVideo('idle_sea.mp4', '[FEED: SUNSHINE_BEACH_IDLE]');
                    cctvTimer = setInterval(tickCCTVGame, 500);
                } else {
                    addCCTVLog("미끼 미지급으로 분노한 개체에 의한 사망.", true);
                    triggerDeath();
                }
            }
        }
    ]);
}

function triggerEventF() {
    clearInterval(cctvTimer);
    cctvGameState = 'event_F';
    updateCCTVHUD();
    
    playCCTVVideo('event_F_intro.mp4', '[FEED: WEEPING_LONG_HAIR_WOMAN]');
    addCCTVLog("[경고] 흐느끼는 여성 목격 및 TV 파손음.", true);
    
    setCCTVChoices([
        {
            text: "[1] TV 뒤에 웅크려 대기",
            action: () => {
                addCCTVLog("대기 중 화면으로부터 침식되어 생명 징후 정지.", true);
                triggerDeath();
            }
        },
        {
            text: "[2] 순찰봉으로 화면 파괴",
            action: () => {
                clearCCTVChoices();
                const tvNoise = document.getElementById('cctv-tv-noise');
                tvNoise.style.display = 'block';
                initTVNoise();
                addCCTVLog("순찰봉으로 모니터 브라운관 파괴 완료.", false);
                
                setTimeout(() => {
                    tvNoise.style.display = 'none';
                    if (cctvTVNoiseAnimId) cancelAnimationFrame(cctvTVNoiseAnimId);
                    cctvGameState = 'idle';
                    playCCTVVideo('idle_sea.mp4', '[FEED: SUNSHINE_BEACH_IDLE]');
                    cctvTimer = setInterval(tickCCTVGame, 500);
                }, 2500);
            }
        }
    ]);
}

function triggerDeath() {
    cctvGameState = 'death';
    updateCCTVHUD();
    
    // Instead of playing a video: stop video, hide it, and show red warning text overlay
    const video = document.getElementById('cctv-video');
    const fallbackLabel = document.getElementById('cctv-video-state');
    const centerStatus = document.getElementById('cctv-center-status');
    
    if (video) {
        video.pause();
        video.src = '';
        video.style.display = 'none';
    }
    if (fallbackLabel) {
        fallbackLabel.textContent = `[FEED: ERROR_FATAL_EXCEPTION]`;
    }
    if (centerStatus) {
        centerStatus.style.display = 'block';
        centerStatus.style.borderColor = '#ff0000';
        centerStatus.style.color = '#ff0000';
        centerStatus.innerHTML = `
            <div style="font-size: 16px; font-weight: bold; margin-bottom: 8px; color: #ff0000; animation: blink 0.5s infinite;">☠️ SYSTEM FAILURE ☠️</div>
            <div style="font-size: 11px; line-height: 1.5; color: #ff3333; font-family: monospace; text-align: left; word-break: keep-all;">
                [경고] 요원의 생체 신호가 중단되었습니다.<br>
                [원인] 수칙 미숙지로 인한 개체 접촉.<br>
                [조치] 신속한 시신 회수를 위해 회수조 파견 예정.
            </div>
        `;
    }
    
    addCCTVLog("[사망] 근무 수칙 위반. 요원 신체 훼손 확인.", true);
    
    setCCTVChoices([
        {
            text: "재시도 (Retry)",
            action: () => {
                if (centerStatus) {
                    centerStatus.style.borderColor = '#00ff00';
                    centerStatus.style.color = '#00ff00';
                }
                startCCTVGame();
            }
        }
    ]);
}

function triggerGameClear() {
    clearInterval(cctvTimer);
    cctvGameState = 'win';
    updateCCTVHUD();
    
    addCCTVLog("일출 확인. 무사 귀환을 환영합니다. (게임 클리어)", false);
    playCCTVVideo('idle_sea.mp4', '[SYSTEM: MISSION SUCCESSFUL]');
    clearCCTVChoices();
    
    openDarkWebAlert("[무사 퇴근 성공]<br>축하합니다! 무사히 아침 06:00 일출을 맞이하여 귀환에 성공하셨습니다.");
}

function openDarkWebAlert(msg) {
    const alertBox = document.getElementById('darkweb-alert');
    const alertMsg = document.getElementById('darkweb-alert-message');
    if (alertBox && alertMsg) {
        alertMsg.innerHTML = msg;
        alertBox.style.display = 'block';
    }
}

function closeDarkWebAlert() {
    const alertBox = document.getElementById('darkweb-alert');
    if (alertBox) {
        alertBox.style.display = 'none';
    }
}

// Dark Web Taskbar Rendering
const darkWebWindowsList = [
    { id: 'darkwebFolderWindow', title: '📁 탐색기' },
    { id: 'darkwebReportWindow', title: '📄 야간근무수칙.txt' },
    { id: 'darkwebCCTVWindow', title: '🖥️ 해안_CCTV' },
    { id: 'darkwebReadmeWindow', title: '📄 readme.txt' }
];

function updateDarkWebTaskbar() {
    const container = document.getElementById('darkweb-taskbar-items');
    if (!container) return;
    
    container.innerHTML = '';
    
    darkWebWindowsList.forEach(win => {
        const el = document.getElementById(win.id);
        if (el && (el.style.display === 'block' || el.style.display === 'flex')) {
            const btn = document.createElement('div');
            btn.className = 'taskbar-item';
            btn.textContent = win.title;
            
            // Retro Dark styles
            btn.style.backgroundColor = '#222';
            btn.style.color = '#ff0000';
            btn.style.borderColor = '#555 #000 #000 #555';
            btn.style.borderWidth = '1px 2px 2px 1px';
            btn.style.borderStyle = 'solid';
            btn.style.fontFamily = 'monospace';
            btn.style.fontSize = '10px';
            btn.style.height = '20px';
            btn.style.display = 'flex';
            btn.style.alignItems = 'center';
            btn.style.justifyContent = 'center';
            btn.style.padding = '0 8px';
            btn.style.cursor = 'pointer';
            btn.style.minWidth = '80px';
            btn.style.boxShadow = 'inset 1px 1px 0 #555';
            
            const isFocused = parseInt(el.style.zIndex || 0) === highestZIndex;
            if (isFocused) {
                btn.style.backgroundColor = '#111';
                btn.style.color = '#ff0000';
                btn.style.borderColor = '#000 #555 #555 #000';
                btn.style.boxShadow = 'none';
            }
            
            btn.addEventListener('click', () => {
                if (isFocused) {
                    el.style.display = 'none';
                    updateDarkWebTaskbar();
                } else {
                    highestZIndex++;
                    el.style.zIndex = highestZIndex;
                    updateDarkWebTaskbar();
                }
            });
            
            container.appendChild(btn);
        }
    });
}

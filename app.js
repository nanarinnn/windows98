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
    const el = document.getElementById("recycle-bin-alert");
    if (el) el.style.display = "none";
}
function closeRecycleBin() {
    closeRecycleBinAlert();
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
            let lineDiv = document.getElementById(`terminal-line-${lineIdx}`);
            if (!lineDiv) {
                lineDiv = document.createElement("div");
                lineDiv.id = `terminal-line-${lineIdx}`;
                lineDiv.style.marginBottom = "8px";
                linesContainer.appendChild(lineDiv);
            }
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
    openDarkWebReadme();
}

function disconnectDarkWeb() {
    const overlay = document.getElementById("darkweb-overlay");
    overlay.style.display = "none";
    
    // Close any open dark web windows
    closeDarkWebFolder();
    closeDarkWebReport();
    closeDarkWebCCTV();
    closeDarkWebFolderEP2();
    closeDarkWebReportEP2();
    closeDarkWebCCTVEP2();
    closeDarkWebFolderEP3();
    closeDarkWebReportEP3();
    closeDarkWebCCTVEP3();
    closeDarkWebFolderEP4();
    closeDarkWebReportEP4();
    closeDarkWebCCTVEP4();
    closeDarkWebFolderEP5();
    closeDarkWebReportEP5();
    closeDarkWebCCTVEP5();
    closeDarkWebFolderEP6();
    closeDarkWebReportEP6();
    closeDarkWebCCTVEP6();
    closeDarkWebFolderEP7();
    closeDarkWebReportEP7();
    closeDarkWebCCTVEP7();
    closeDarkWebFolderEP8();
    closeDarkWebReportEP8();
    closeDarkWebCCTVEP8();
    closeDarkWebFolderEP9();
    closeDarkWebReportEP9();
    closeDarkWebCCTVEP9();
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

// EP.02 Folder Open/Close
function openDarkWebFolderEP2() {
    const win = document.getElementById("darkwebFolderWindowEP2");
    if (win) {
        win.style.display = "flex";
        highestZIndex++;
        win.style.zIndex = highestZIndex;
        updateDarkWebTaskbar();
    }
}

function closeDarkWebFolderEP2() {
    const win = document.getElementById("darkwebFolderWindowEP2");
    if (win) {
        win.style.display = "none";
        updateDarkWebTaskbar();
    }
}

// EP.03 Folder Open/Close
function openDarkWebFolderEP3() {
    const win = document.getElementById("darkwebFolderWindowEP3");
    if (win) {
        win.style.display = "flex";
        highestZIndex++;
        win.style.zIndex = highestZIndex;
        updateDarkWebTaskbar();
    }
}

function closeDarkWebFolderEP3() {
    const win = document.getElementById("darkwebFolderWindowEP3");
    if (win) {
        win.style.display = "none";
        updateDarkWebTaskbar();
    }
}

// EP.04 Folder Open/Close
function openDarkWebFolderEP4() {
    const win = document.getElementById("darkwebFolderWindowEP4");
    if (win) {
        win.style.display = "flex";
        highestZIndex++;
        win.style.zIndex = highestZIndex;
        updateDarkWebTaskbar();
    }
}

function closeDarkWebFolderEP4() {
    const win = document.getElementById("darkwebFolderWindowEP4");
    if (win) {
        win.style.display = "none";
        updateDarkWebTaskbar();
    }
}

// EP.05 Folder Open/Close
function openDarkWebFolderEP5() {
    const win = document.getElementById("darkwebFolderWindowEP5");
    if (win) {
        win.style.display = "flex";
        highestZIndex++;
        win.style.zIndex = highestZIndex;
        updateDarkWebTaskbar();
    }
}

function closeDarkWebFolderEP5() {
    const win = document.getElementById("darkwebFolderWindowEP5");
    if (win) {
        win.style.display = "none";
        updateDarkWebTaskbar();
    }
}

// EP.06 Folder Open/Close
function openDarkWebFolderEP6() {
    const win = document.getElementById("darkwebFolderWindowEP6");
    if (win) {
        win.style.display = "flex";
        highestZIndex++;
        win.style.zIndex = highestZIndex;
        updateDarkWebTaskbar();
    }
}

function closeDarkWebFolderEP6() {
    const win = document.getElementById("darkwebFolderWindowEP6");
    if (win) {
        win.style.display = "none";
        updateDarkWebTaskbar();
    }
}

// EP.07 Folder Open/Close
function openDarkWebFolderEP7() {
    const win = document.getElementById("darkwebFolderWindowEP7");
    if (win) {
        win.style.display = "flex";
        highestZIndex++;
        win.style.zIndex = highestZIndex;
        updateDarkWebTaskbar();
    }
}

function closeDarkWebFolderEP7() {
    const win = document.getElementById("darkwebFolderWindowEP7");
    if (win) {
        win.style.display = "none";
        updateDarkWebTaskbar();
    }
}

// EP.08 Folder Open/Close
function openDarkWebFolderEP8() {
    const win = document.getElementById("darkwebFolderWindowEP8");
    if (win) {
        win.style.display = "flex";
        highestZIndex++;
        win.style.zIndex = highestZIndex;
        updateDarkWebTaskbar();
    }
}

function closeDarkWebFolderEP8() {
    const win = document.getElementById("darkwebFolderWindowEP8");
    if (win) {
        win.style.display = "none";
        updateDarkWebTaskbar();
    }
}

// EP.09 Folder Open/Close
function openDarkWebFolderEP9() {
    const win = document.getElementById("darkwebFolderWindowEP9");
    if (win) {
        win.style.display = "flex";
        highestZIndex++;
        win.style.zIndex = highestZIndex;
        updateDarkWebTaskbar();
    }
}

function closeDarkWebFolderEP9() {
    const win = document.getElementById("darkwebFolderWindowEP9");
    if (win) {
        win.style.display = "none";
        updateDarkWebTaskbar();
    }
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

// EP.02 Notepad Report Open/Close
function openDarkWebReportEP2() {
    const win = document.getElementById("darkwebReportWindowEP2");
    if (win) {
        win.style.display = "flex";
        highestZIndex++;
        win.style.zIndex = highestZIndex;
        updateDarkWebTaskbar();
    }
}

function closeDarkWebReportEP2() {
    const win = document.getElementById("darkwebReportWindowEP2");
    if (win) {
        win.style.display = "none";
        updateDarkWebTaskbar();
    }
}

// EP.03 Notepad Report Open/Close
function openDarkWebReportEP3() {
    const win = document.getElementById("darkwebReportWindowEP3");
    if (win) {
        win.style.display = "flex";
        highestZIndex++;
        win.style.zIndex = highestZIndex;
        updateDarkWebTaskbar();
    }
}

function closeDarkWebReportEP3() {
    const win = document.getElementById("darkwebReportWindowEP3");
    if (win) {
        win.style.display = "none";
        updateDarkWebTaskbar();
    }
}

// EP.04 Notepad Report Open/Close
function openDarkWebReportEP4() {
    const win = document.getElementById("darkwebReportWindowEP4");
    if (win) {
        win.style.display = "flex";
        highestZIndex++;
        win.style.zIndex = highestZIndex;
        updateDarkWebTaskbar();
    }
}

function closeDarkWebReportEP4() {
    const win = document.getElementById("darkwebReportWindowEP4");
    if (win) {
        win.style.display = "none";
        updateDarkWebTaskbar();
    }
}

// EP.05 Notepad Report Open/Close
function openDarkWebReportEP5() {
    const win = document.getElementById("darkwebReportWindowEP5");
    if (win) {
        win.style.display = "flex";
        highestZIndex++;
        win.style.zIndex = highestZIndex;
        updateDarkWebTaskbar();
    }
}

function closeDarkWebReportEP5() {
    const win = document.getElementById("darkwebReportWindowEP5");
    if (win) {
        win.style.display = "none";
        updateDarkWebTaskbar();
    }
}

// EP.06 Notepad Report Open/Close
function openDarkWebReportEP6() {
    const win = document.getElementById("darkwebReportWindowEP6");
    if (win) {
        win.style.display = "flex";
        highestZIndex++;
        win.style.zIndex = highestZIndex;
        updateDarkWebTaskbar();
    }
}

function closeDarkWebReportEP6() {
    const win = document.getElementById("darkwebReportWindowEP6");
    if (win) {
        win.style.display = "none";
        updateDarkWebTaskbar();
    }
}

// EP.07 Notepad Report Open/Close
function openDarkWebReportEP7() {
    const win = document.getElementById("darkwebReportWindowEP7");
    if (win) {
        win.style.display = "flex";
        highestZIndex++;
        win.style.zIndex = highestZIndex;
        updateDarkWebTaskbar();
    }
}

function closeDarkWebReportEP7() {
    const win = document.getElementById("darkwebReportWindowEP7");
    if (win) {
        win.style.display = "none";
        updateDarkWebTaskbar();
    }
}

// EP.08 Notepad Report Open/Close
function openDarkWebReportEP8() {
    const win = document.getElementById("darkwebReportWindowEP8");
    if (win) {
        win.style.display = "flex";
        highestZIndex++;
        win.style.zIndex = highestZIndex;
        updateDarkWebTaskbar();
    }
}

function closeDarkWebReportEP8() {
    const win = document.getElementById("darkwebReportWindowEP8");
    if (win) {
        win.style.display = "none";
        updateDarkWebTaskbar();
    }
}

// EP.09 Notepad Report Open/Close
function openDarkWebReportEP9() {
    const win = document.getElementById("darkwebReportWindowEP9");
    if (win) {
        win.style.display = "flex";
        highestZIndex++;
        win.style.zIndex = highestZIndex;
        updateDarkWebTaskbar();
    }
}

function closeDarkWebReportEP9() {
    const win = document.getElementById("darkwebReportWindowEP9");
    if (win) {
        win.style.display = "none";
        updateDarkWebTaskbar();
    }
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

// EP.02 CCTV Open/Close
function openDarkWebCCTVEP2() {
    const win = document.getElementById("darkwebCCTVWindowEP2");
    if (win) {
        win.style.display = "flex";
        highestZIndex++;
        win.style.zIndex = highestZIndex;
        updateDarkWebTaskbar();
        startCCTVGameEP2();
    }
}

function closeDarkWebCCTVEP2() {
    const win = document.getElementById("darkwebCCTVWindowEP2");
    if (win) {
        win.style.display = "none";
        updateDarkWebTaskbar();
        stopCCTVGameEP2();
    }
}

// EP.03 CCTV Open/Close
function openDarkWebCCTVEP3() {
    const win = document.getElementById("darkwebCCTVWindowEP3");
    if (win) {
        win.style.display = "flex";
        highestZIndex++;
        win.style.zIndex = highestZIndex;
        updateDarkWebTaskbar();
        startCCTVGameEP3();
    }
}

function closeDarkWebCCTVEP3() {
    const win = document.getElementById("darkwebCCTVWindowEP3");
    if (win) {
        win.style.display = "none";
        updateDarkWebTaskbar();
        stopCCTVGameEP3();
    }
}

// EP.04 CCTV Open/Close
function openDarkWebCCTVEP4() {
    const win = document.getElementById("darkwebCCTVWindowEP4");
    if (win) {
        win.style.display = "flex";
        highestZIndex++;
        win.style.zIndex = highestZIndex;
        updateDarkWebTaskbar();
        startCCTVGameEP4();
    }
}

function closeDarkWebCCTVEP4() {
    const win = document.getElementById("darkwebCCTVWindowEP4");
    if (win) {
        win.style.display = "none";
        updateDarkWebTaskbar();
        stopCCTVGameEP4();
    }
}

// EP.05 CCTV Open/Close
function openDarkWebCCTVEP5() {
    const win = document.getElementById("darkwebCCTVWindowEP5");
    if (win) {
        win.style.display = "flex";
        highestZIndex++;
        win.style.zIndex = highestZIndex;
        updateDarkWebTaskbar();
        startCCTVGameEP5();
    }
}

function closeDarkWebCCTVEP5() {
    const win = document.getElementById("darkwebCCTVWindowEP5");
    if (win) {
        win.style.display = "none";
        updateDarkWebTaskbar();
        stopCCTVGameEP5();
    }
}

// EP.06 CCTV Open/Close
function openDarkWebCCTVEP6() {
    const win = document.getElementById("darkwebCCTVWindowEP6");
    if (win) {
        win.style.display = "flex";
        highestZIndex++;
        win.style.zIndex = highestZIndex;
        updateDarkWebTaskbar();
        startCCTVGameEP6();
    }
}

function closeDarkWebCCTVEP6() {
    const win = document.getElementById("darkwebCCTVWindowEP6");
    if (win) {
        win.style.display = "none";
        updateDarkWebTaskbar();
        stopCCTVGameEP6();
    }
}

// EP.07 CCTV Open/Close
function openDarkWebCCTVEP7() {
    const win = document.getElementById("darkwebCCTVWindowEP7");
    if (win) {
        win.style.display = "flex";
        highestZIndex++;
        win.style.zIndex = highestZIndex;
        updateDarkWebTaskbar();
        startCCTVGameEP7();
    }
}

function closeDarkWebCCTVEP7() {
    const win = document.getElementById("darkwebCCTVWindowEP7");
    if (win) {
        win.style.display = "none";
        updateDarkWebTaskbar();
        stopCCTVGameEP7();
    }
}

// EP.08 CCTV Open/Close
function openDarkWebCCTVEP8() {
    const win = document.getElementById("darkwebCCTVWindowEP8");
    if (win) {
        win.style.display = "flex";
        highestZIndex++;
        win.style.zIndex = highestZIndex;
        updateDarkWebTaskbar();
        startCCTVGameEP8();
    }
}

function closeDarkWebCCTVEP8() {
    const win = document.getElementById("darkwebCCTVWindowEP8");
    if (win) {
        win.style.display = "none";
        updateDarkWebTaskbar();
        stopCCTVGameEP8();
    }
}

// EP.09 CCTV Open/Close
function openDarkWebCCTVEP9() {
    const win = document.getElementById("darkwebCCTVWindowEP9");
    if (win) {
        win.style.display = "flex";
        highestZIndex++;
        win.style.zIndex = highestZIndex;
        updateDarkWebTaskbar();
        startCCTVGameEP9();
    }
}

function closeDarkWebCCTVEP9() {
    const win = document.getElementById("darkwebCCTVWindowEP9");
    if (win) {
        win.style.display = "none";
        updateDarkWebTaskbar();
        stopCCTVGameEP9();
    }
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
    
    const bo = document.getElementById('cctv-blackout'); if (bo) bo.style.display = 'none';
    const tn = document.getElementById('cctv-tv-noise'); if (tn) tn.style.display = 'none';
    
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
        video.muted = true;
        video.defaultMuted = true;
        video.playsInline = true;
        video.loop = true;
        video.style.zIndex = '2';
        video.style.display = 'block';
        if (video.setAttribute) {
            video.setAttribute('muted', '');
            video.setAttribute('playsinline', '');
            video.setAttribute('autoplay', '');
        }
        
        if (offlineBg) offlineBg.style.display = 'none';
        if (centerStatus) centerStatus.style.display = 'none';
        
        video.onloadeddata = () => {
            video.style.display = 'block';
            if (offlineBg) offlineBg.style.display = 'none';
            if (centerStatus) centerStatus.style.display = 'none';
        };
        video.onerror = () => {
            console.warn('playCCTVVideo video load error:', src);
            video.style.display = 'none';
            if (offlineBg) offlineBg.style.display = 'block';
            if (centerStatus) {
                centerStatus.style.display = 'block';
                centerStatus.textContent = fallbackText || 'FEED SIGNAL LOST';
            }
        };

        const currentSrc = video.getAttribute('src') || video.src || '';
        if (!currentSrc.endsWith(src)) {
            video.src = src;
        }
        
        const playPromise = video.play();
        if (playPromise !== undefined) {
            playPromise.then(() => {
                video.style.display = 'block';
                if (offlineBg) offlineBg.style.display = 'none';
                if (centerStatus) centerStatus.style.display = 'none';
            }).catch(err => {
                console.warn('playCCTVVideo autoplay note:', err);
                video.muted = true;
                video.play().catch(retryErr => {
                    console.warn('playCCTVVideo retry note:', retryErr);
                    if (fallbackText) {
                        video.style.display = 'none';
                        if (offlineBg) offlineBg.style.display = 'block';
                        if (centerStatus) {
                            centerStatus.style.display = 'block';
                            centerStatus.textContent = fallbackText;
                        }
                    }
                });
            });
        }
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

// ==========================================
// CCTV Gaming Engine (EP.02 서울 지하철 심야 2호선)
// ==========================================
let cctvHourEP2 = 23;
let cctvMinuteEP2 = 55;
let cctvTimerEP2 = null;
let cctvGameStateEP2 = 'idle'; // 'idle' | 'event_A' | 'event_B' | 'event_C' | 'event_D' | 'death' | 'win'
let hasSubwayKeycard = false;
let cctvNoiseAnimIdEP2 = null;

function initCCTVNoiseEP2() {
    const canvas = document.getElementById('cctv-noise-canvas-ep2');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = 160;
    canvas.height = 120;
    
    function drawNoiseEP2() {
        const cctvWin = document.getElementById('darkwebCCTVWindowEP2');
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
        cctvNoiseAnimIdEP2 = requestAnimationFrame(drawNoiseEP2);
    }
    
    if (cctvNoiseAnimIdEP2) cancelAnimationFrame(cctvNoiseAnimIdEP2);
    drawNoiseEP2();
}

function setCAMTitleEP2(title) {
    const el = document.getElementById('cctv-cam-title-ep2');
    if (el) el.textContent = title;
}

function startCCTVGameEP2() {
    stopCCTVGameEP2();
    cctvHourEP2 = 23;
    cctvMinuteEP2 = 55;
    cctvGameStateEP2 = 'idle';
    hasSubwayKeycard = false;
    
    setCAMTitleEP2("CAM-06 [후미 6호차] - 편입 및 진입");
    
    const blackout = document.getElementById('cctv-blackout-ep2');
    if (blackout) blackout.style.display = 'none';
    
    const centerStatus = document.getElementById('cctv-center-status-ep2');
    if (centerStatus) {
        centerStatus.style.borderColor = '#00ff00';
        centerStatus.style.color = '#00ff00';
    }
    
    updateCCTVHUDEP2();
    const logsContainer = document.getElementById('cctv-logs-ep2');
    if (logsContainer) {
        logsContainer.innerHTML = '<div style="color: #888;">[SYSTEM] 심야 2호선 감시 CCTV v2.04 로드 완료...</div>';
    }
    addCCTVLogEP2("[23:55:00] 신설동행 열차 편입 승객 감지. 후미 객차에서 선두 객차 방향으로 이동을 시작합니다.");
    
    playCCTVVideoEP2('movies/ep2_idle.mp4', '[FEED: SUBWAY_LINE2_IDLE]');
    clearCCTVChoicesEP2();
    
    cctvTimerEP2 = setInterval(tickCCTVGameEP2, 500);
    initCCTVNoiseEP2();
}

function stopCCTVGameEP2() {
    if (cctvTimerEP2) {
        clearInterval(cctvTimerEP2);
        cctvTimerEP2 = null;
    }
    const video = document.getElementById('cctv-video-ep2');
    if (video) video.pause();
    if (cctvNoiseAnimIdEP2) cancelAnimationFrame(cctvNoiseAnimIdEP2);
}

function playCCTVVideoEP2(src, fallbackText) {
    const video = document.getElementById('cctv-video-ep2');
    const centerStatus = document.getElementById('cctv-center-status-ep2');
    const offlineBg = document.getElementById('cctv-offline-bg-ep2');
    
    if (video) {
        video.muted = true;
        video.defaultMuted = true;
        video.playsInline = true;
        video.loop = true;
        video.style.zIndex = '2';
        video.style.display = 'block';
        if (video.setAttribute) {
            video.setAttribute('muted', '');
            video.setAttribute('playsinline', '');
            video.setAttribute('autoplay', '');
        }
        
        if (offlineBg) offlineBg.style.display = 'none';
        if (centerStatus) centerStatus.style.display = 'none';
        
        video.onloadeddata = () => {
            video.style.display = 'block';
            if (offlineBg) offlineBg.style.display = 'none';
            if (centerStatus) centerStatus.style.display = 'none';
        };
        video.onerror = () => {
            console.warn('playCCTVVideoEP2 video load error:', src);
            video.style.display = 'none';
            if (offlineBg) offlineBg.style.display = 'block';
            if (centerStatus) {
                centerStatus.style.display = 'block';
                centerStatus.textContent = fallbackText || 'FEED SIGNAL LOST';
            }
        };

        const currentSrc = video.getAttribute('src') || video.src || '';
        if (!currentSrc.endsWith(src)) {
            video.src = src;
        }
        
        const playPromise = video.play();
        if (playPromise !== undefined) {
            playPromise.then(() => {
                video.style.display = 'block';
                if (offlineBg) offlineBg.style.display = 'none';
                if (centerStatus) centerStatus.style.display = 'none';
            }).catch(err => {
                console.warn('playCCTVVideoEP2 autoplay note:', err);
                video.muted = true;
                video.play().catch(retryErr => {
                    console.warn('playCCTVVideoEP2 retry note:', retryErr);
                    if (fallbackText) {
                        video.style.display = 'none';
                        if (offlineBg) offlineBg.style.display = 'block';
                        if (centerStatus) {
                            centerStatus.style.display = 'block';
                            centerStatus.textContent = fallbackText;
                        }
                    }
                });
            });
        }
    }
}

function tickCCTVGameEP2() {
    cctvMinuteEP2 += 5;
    if (cctvMinuteEP2 >= 60) {
        cctvMinuteEP2 = 0;
        cctvHourEP2++;
        if (cctvHourEP2 >= 24) {
            cctvHourEP2 = 0;
        }
    }
    
    updateCCTVHUDEP2();
    
    const timeStr = formatGameTime(cctvHourEP2, cctvMinuteEP2);
    if (timeStr === '00:30') {
        triggerEventA_EP2();
    } else if (timeStr === '01:15') {
        triggerEventB_EP2();
    } else if (timeStr === '02:40') {
        triggerEventC_EP2();
    } else if (timeStr === '03:50') {
        triggerEventD_EP2();
    } else if (timeStr === '04:20') {
        triggerEventE_EP2();
    }
}

function updateCCTVHUDEP2() {
    const timeDisplay = document.getElementById('cctv-time-display-ep2');
    const stateDisplay = document.getElementById('cctv-state-display-ep2');
    if (timeDisplay) {
        timeDisplay.textContent = `GAME TIME: ${formatGameTime(cctvHourEP2, cctvMinuteEP2)}`;
    }
    if (stateDisplay) {
        if (cctvGameStateEP2 === 'idle') {
            stateDisplay.textContent = 'STATUS: NORMAL';
            stateDisplay.style.color = '#00ff00';
        } else if (cctvGameStateEP2 === 'death') {
            stateDisplay.textContent = 'STATUS: ERROR - FATAL';
            stateDisplay.style.color = '#ff0000';
        } else {
            stateDisplay.textContent = 'STATUS: WARNING - ANOMALY';
            stateDisplay.style.color = '#ffff00';
        }
    }
}

function addCCTVLogEP2(message, isWarning = false) {
    const logsContainer = document.getElementById('cctv-logs-ep2');
    if (!logsContainer) return;
    const timeStr = formatGameTime(cctvHourEP2, cctvMinuteEP2);
    const color = isWarning ? '#ff0000' : '#00ff00';
    const logDiv = document.createElement('div');
    logDiv.style.color = color;
    logDiv.textContent = `[${timeStr}] ${message}`;
    logsContainer.appendChild(logDiv);
    logsContainer.scrollTop = logsContainer.scrollHeight;
}

function clearCCTVChoicesEP2() {
    const container = document.getElementById('cctv-choices-container-ep2');
    if (container) {
        container.innerHTML = '<div style="color: #888; font-size: 11px;">[비정상 상황 발생 시 대응 선택지가 활성화됩니다]</div>';
    }
}

function setCCTVChoicesEP2(choices) {
    const container = document.getElementById('cctv-choices-container-ep2');
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

function triggerEventA_EP2() {
    clearInterval(cctvTimerEP2);
    cctvGameStateEP2 = 'event_A';
    updateCCTVHUDEP2();
    setCAMTitleEP2("CAM-05 [5호차] - 상황 A (통로 취객)");
    
    playCCTVVideoEP2('movies/ep2_event_A.mp4', '[FEED: CAM-05 DRUNKEN_PASSENGER]');
    addCCTVLogEP2("[00:30:12] 통로 바닥에 만취한 승객이 누워 경로를 차단하고 있습니다.", true);
    
    setCCTVChoicesEP2([
        {
            text: "[1] 발로 차거나 소리쳐서 비키라고 깨운다.",
            action: () => {
                addCCTVLogEP2("[사망] 취객이 깨어나 끈질기게 추적, 술을 강제 섭취당해 피를 토하며 사망했습니다.", true);
                triggerDeathEP2("취객 강제 음주", "취객이 깨어나 끈질기게 추적, 술을 강제 섭취당해 피를 토하며 사망.");
            }
        },
        {
            text: "[2] 신발을 벗고 양말만 신은 채 소리 없이 조용히 우회한다.",
            action: () => {
                clearCCTVChoicesEP2();
                addCCTVLogEP2("[생존] 취객을 자극하지 않고 4호차 진입 성공.", false);
                setCAMTitleEP2("CAM-04 [4호차] - 선두 방향 이동 중");
                cctvGameStateEP2 = 'idle';
                playCCTVVideoEP2('movies/ep2_idle.mp4', '[FEED: SUBWAY_LINE2_IDLE]');
                cctvTimerEP2 = setInterval(tickCCTVGameEP2, 500);
            }
        }
    ]);
}

function triggerEventB_EP2() {
    clearInterval(cctvTimerEP2);
    cctvGameStateEP2 = 'event_B';
    updateCCTVHUDEP2();
    setCAMTitleEP2("CAM-04 [4호차] - 상황 B (노란 원복 여아)");
    
    playCCTVVideoEP2('movies/ep2_event_B.mp4', '[FEED: CAM-04 YELLOW_KINDERGARTEN_GIRL]');
    addCCTVLogEP2("[01:15:40] 좌석에 앉은 노란 원복의 단발머리 여아가 허공에 가위바위보를 하며 말을 겁니다.", true);
    
    setCCTVChoicesEP2([
        {
            text: "[1] \"신설동행이야\"라고 직접 행선지를 대답한다.",
            action: () => {
                addCCTVLogEP2("[사망] 잘못된 대답으로 간주되어 승객의 혀를 뽑아 삼켜 사망했습니다.", true);
                triggerDeathEP2("금기 대답 발설", "승객의 혀를 뽑아 삼켜 사망.");
            }
        },
        {
            text: "[2] 말없이 노선도를 가리킨 후, [보자기-보자기-바위-보자기]를 낸다.",
            action: () => {
                clearCCTVChoicesEP2();
                addCCTVLogEP2("[생존] 여아가 흥미를 잃고 고개를 숙임. 3호차로 이동.", false);
                setCAMTitleEP2("CAM-03 [3호차] - 선두 방향 이동 중");
                cctvGameStateEP2 = 'idle';
                playCCTVVideoEP2('movies/ep2_idle.mp4', '[FEED: SUBWAY_LINE2_IDLE]');
                cctvTimerEP2 = setInterval(tickCCTVGameEP2, 500);
            }
        }
    ]);
}

function triggerEventC_EP2() {
    clearInterval(cctvTimerEP2);
    cctvGameStateEP2 = 'event_C';
    updateCCTVHUDEP2();
    setCAMTitleEP2("CAM-03 [3호차] - 상황 C (소등 객차 & 출입 카드 수색)");
    
    playCCTVVideoEP2('movies/ep2_event_C.mp4', '[FEED: CAM-03 BLACKOUT_CAR_FEED]');
    addCCTVLogEP2("[02:40:05] 실내 조명 완전 소등. 입술이 봉합된 '먹이' 인원들이 널브러져 있습니다. 기관실 출입 카드를 수색해야 합니다.", true);
    
    setCCTVChoicesEP2([
        {
            text: "[1] 휴대폰 플래시를 켜서 좌석을 빠르게 비추며 수색한다.",
            action: () => {
                addCCTVLogEP2("[사망] 차량 상부의 '얇은 것'들이 틈새로 침입하여 사망했습니다.", true);
                triggerDeathEP2("인공 광원 노출", "차량 상부의 '얇은 것'들이 틈새로 침입하여 사망.");
            }
        },
        {
            text: "[2] 인공 조명을 끄고, 터널 조명이 스칠 때만 파란 체크 남성의 왼손을 수색한다.",
            action: () => {
                clearCCTVChoicesEP2();
                hasSubwayKeycard = true;
                const blackout = document.getElementById('cctv-blackout-ep2');
                if (blackout) blackout.style.display = 'flex';
                addCCTVLogEP2("인공 조명 차단. 터널 조명 타이밍에 맞춰 신중히 수색 중...", false);
                
                setTimeout(() => {
                    if (blackout) blackout.style.display = 'none';
                    addCCTVLogEP2("[생존] [기관실 출입 카드] 획득 완료. 2호차를 거쳐 선두 객차로 전진.", false);
                    setCAMTitleEP2("CAM-01 [선두 1호차] - 접근 중");
                    cctvGameStateEP2 = 'idle';
                    playCCTVVideoEP2('movies/ep2_idle.mp4', '[FEED: SUBWAY_LINE2_IDLE]');
                    cctvTimerEP2 = setInterval(tickCCTVGameEP2, 500);
                }, 2500);
            }
        }
    ]);
}

function triggerEventD_EP2() {
    clearInterval(cctvTimerEP2);
    cctvGameStateEP2 = 'event_D';
    updateCCTVHUDEP2();
    setCAMTitleEP2("CAM-01 [선두 1호차] - 상황 D (승객 밀집 돌파)");
    
    playCCTVVideoEP2('movies/ep2_event_D.mp4', '[FEED: CAM-01 PASSENGER_CROWD]');
    addCCTVLogEP2("[03:50:22] 1번 선두 객차 도달. 수많은 탈출 실패자들이 출근길 밀도로 통로를 가로막고 있습니다.", true);
    
    setCCTVChoicesEP2([
        {
            text: "[1] 옷을 입은 채 무작정 힘으로 밀치며 들어간다.",
            action: () => {
                addCCTVLogEP2("[사망] 실패자들의 손에 붙잡혀 그들과 하나가 되어 사망했습니다.", true);
                triggerDeathEP2("실패자 무리 억류", "실패자들의 손에 붙잡혀 그들과 하나가 되어 사망.");
            }
        },
        {
            text: "[2] 전신 탈의 후 비치된 기름을 몸에 바르고 미끄러지듯 통과한다.",
            action: () => {
                clearCCTVChoicesEP2();
                addCCTVLogEP2("[생존] 실패자들의 손아귀를 빠져나와 기관실 문에 카드 태그 성공.", false);
                setCAMTitleEP2("CAM-00 [기관실] - 진입");
                cctvGameStateEP2 = 'idle';
                playCCTVVideoEP2('movies/ep2_idle.mp4', '[FEED: SUBWAY_LINE2_IDLE]');
                cctvTimerEP2 = setInterval(tickCCTVGameEP2, 500);
            }
        }
    ]);
}

function triggerEventE_EP2() {
    clearInterval(cctvTimerEP2);
    cctvGameStateEP2 = 'event_E';
    updateCCTVHUDEP2();
    setCAMTitleEP2("CAM-00 [기관실] - 최종 이탈 (용두역 투신)");
    
    playCCTVVideoEP2('movies/ep2_idle.mp4', '[FEED: CAM-00 DRIVER_CABIN_YONGDU]');
    addCCTVLogEP2("[04:20:00] 기관실 진입 확인. 열차가 신설동역 직전인 '용두역'에 진입 중입니다.", true);
    
    setCCTVChoicesEP2([
        {
            text: "[1] 일반 출입문이 열리기를 기다린다.",
            action: () => {
                addCCTVLogEP2("[사망] 정규 노선 이탈 공간 영구 격리 실종되었습니다.", true);
                triggerDeathEP2("비정규 노선 방치", "정규 노선 이탈 공간 영구 격리 실종.");
            }
        },
        {
            text: "[2] 기관실 내 [현실 재인식 버튼]을 누르고 창밖으로 투신한다.",
            action: () => {
                clearCCTVChoicesEP2();
                addCCTVLogEP2("[GOOD ENDING] 새벽 순환선 승강장으로 귀환 성공. 생환을 확인했습니다.", false);
                triggerGameClearEP2();
            }
        }
    ]);
}

function triggerDeathEP2(reason, actionDesc, deathVideoSrc) {
    clearInterval(cctvTimerEP2);
    cctvGameStateEP2 = 'death';
    updateCCTVHUDEP2();
    
    const video = document.getElementById('cctv-video-ep2');
    const centerStatus = document.getElementById('cctv-center-status-ep2');
    
    const showDeathScreen = () => {
        if (video) video.style.display = 'none';
        if (centerStatus) {
            centerStatus.style.display = 'block';
            centerStatus.style.borderColor = '#ff0000';
            centerStatus.style.color = '#ff0000';
            centerStatus.innerHTML = `
                <div style="font-size: 16px; font-weight: bold; margin-bottom: 8px; color: #ff0000; animation: blink 0.5s infinite;">☠️ SYSTEM FAILURE ☠️</div>
                <div style="font-size: 11px; line-height: 1.5; color: #ff3333; font-family: monospace; text-align: left; word-break: keep-all;">
                    [ERROR] 심야 2호선 편입 승객 생체 신호 소멸.<br>
                    [원인] ${reason || '수칙 미숙지로 인한 개체 접촉'}.<br>
                    [결과] ${actionDesc || '순환선 선로 일대 유해 수거 예정'}.
                </div>
            `;
        }
    };

    showDeathScreen();
    
    setCCTVChoicesEP2([
        {
            text: "재시도 (Retry)",
            action: () => {
                if (centerStatus) {
                    centerStatus.style.borderColor = '#00ff00';
                    centerStatus.style.color = '#00ff00';
                }
                startCCTVGameEP2();
            }
        }
    ]);
}

function triggerGameClearEP2() {
    clearInterval(cctvTimerEP2);
    cctvGameStateEP2 = 'win';
    updateCCTVHUDEP2();
    
    playCCTVVideoEP2('movies/ep2_idle.mp4', '[SYSTEM: REALITY RESTORED]');
    clearCCTVChoicesEP2();
    
    openDarkWebAlert("🏆 [무사 귀환 성공]<br>축하합니다! 심야 2호선(신설동행)에서 현실 새벽 순환선 승강장으로 무사히 탈출하셨습니다.");
}

// ==========================================
// CCTV Gaming Engine (EP.03 베리 해피 종합병원)
// ==========================================
let cctvDayEP3 = 1;
let cctvHourEP3 = 14;
let cctvMinuteEP3 = 0;
let cctvTimerEP3 = null;
let cctvGameStateEP3 = 'idle'; // 'idle' | 'event_A' | 'event_B' | 'event_C' | 'event_D' | 'death' | 'win'
let cctvNoiseAnimIdEP3 = null;

function setCAMTitleEP3(title) {
    const el = document.getElementById('cctv-cam-title-ep3');
    if (el) el.textContent = title;
}

function initCCTVNoiseEP3() {
    const canvas = document.getElementById('cctv-noise-canvas-ep3');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = 160;
    canvas.height = 120;
    
    function drawNoiseEP3() {
        const cctvWin = document.getElementById('darkwebCCTVWindowEP3');
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
        cctvNoiseAnimIdEP3 = requestAnimationFrame(drawNoiseEP3);
    }
    
    if (cctvNoiseAnimIdEP3) cancelAnimationFrame(cctvNoiseAnimIdEP3);
    drawNoiseEP3();
}

let ep3Stage = 0; // 0: Wait Day 2, 1: Wait Day 4, 2: Wait Day 5, 3: Wait Day 7, 4: Finished

function startCCTVGameEP3() {
    stopCCTVGameEP3();
    ep3Stage = 0;
    cctvDayEP3 = 1;
    cctvHourEP3 = 14;
    cctvMinuteEP3 = 0;
    cctvGameStateEP3 = 'idle';
    
    setCAMTitleEP3("CAM-301 [301호 병실] - DAY 1 : 편입 및 병실 대기");
    
    const blackout = document.getElementById('cctv-blackout-ep3');
    if (blackout) blackout.style.display = 'none';
    
    const centerStatus = document.getElementById('cctv-center-status-ep3');
    if (centerStatus) {
        centerStatus.style.borderColor = '#00ff00';
        centerStatus.style.color = '#00ff00';
    }
    
    updateCCTVHUDEP3();
    const logsContainer = document.getElementById('cctv-logs-ep3');
    if (logsContainer) {
        logsContainer.innerHTML = '<div style="color: #888;">[SYSTEM] 베리 해피 종합병원 환자 감시 시스템 v3.12 로드 완료...</div>';
    }
    addCCTVLogEP3("[DAY 1 / 14:00] 입원 환자 편입 확인. 콘크리트로 밀폐된 3인실 병실에 배치되었습니다. 구조대 도착까지 7일간 생존하십시오.");
    
    playCCTVVideoEP3('movies/ep3_idle.mp4', '[FEED: CAM-301 WARD_INTERIOR_IDLE]');
    clearCCTVChoicesEP3();
    
    cctvTimerEP3 = setInterval(tickCCTVGameEP3, 500);
    initCCTVNoiseEP3();
}

function stopCCTVGameEP3() {
    if (cctvTimerEP3) {
        clearInterval(cctvTimerEP3);
        cctvTimerEP3 = null;
    }
    const video = document.getElementById('cctv-video-ep3');
    if (video) video.pause();
    if (cctvNoiseAnimIdEP3) cancelAnimationFrame(cctvNoiseAnimIdEP3);
}

function playCCTVVideoEP3(src, fallbackText) {
    const video = document.getElementById('cctv-video-ep3');
    const centerStatus = document.getElementById('cctv-center-status-ep3');
    const offlineBg = document.getElementById('cctv-offline-bg-ep3');
    
    if (video) {
        video.muted = true;
        video.defaultMuted = true;
        video.playsInline = true;
        video.loop = true;
        video.style.zIndex = '2';
        video.style.display = 'block';
        if (video.setAttribute) {
            video.setAttribute('muted', '');
            video.setAttribute('playsinline', '');
            video.setAttribute('autoplay', '');
        }
        
        if (offlineBg) offlineBg.style.display = 'none';
        if (centerStatus) centerStatus.style.display = 'none';
        
        video.onloadeddata = () => {
            video.style.display = 'block';
            if (offlineBg) offlineBg.style.display = 'none';
            if (centerStatus) centerStatus.style.display = 'none';
        };
        video.onerror = () => {
            console.warn('playCCTVVideoEP3 video load error:', src);
            video.style.display = 'none';
            if (offlineBg) offlineBg.style.display = 'block';
            if (centerStatus) {
                centerStatus.style.display = 'block';
                centerStatus.textContent = fallbackText || 'FEED SIGNAL LOST';
            }
        };

        const currentSrc = video.getAttribute('src') || video.src || '';
        if (!currentSrc.endsWith(src)) {
            video.src = src;
        }
        
        const playPromise = video.play();
        if (playPromise !== undefined) {
            playPromise.then(() => {
                video.style.display = 'block';
                if (offlineBg) offlineBg.style.display = 'none';
                if (centerStatus) centerStatus.style.display = 'none';
            }).catch(err => {
                console.warn('playCCTVVideoEP3 autoplay note:', err);
                video.muted = true;
                video.play().catch(retryErr => {
                    console.warn('playCCTVVideoEP3 retry note:', retryErr);
                    if (fallbackText) {
                        video.style.display = 'none';
                        if (offlineBg) offlineBg.style.display = 'block';
                        if (centerStatus) {
                            centerStatus.style.display = 'block';
                            centerStatus.textContent = fallbackText;
                        }
                    }
                });
            });
        }
    }
}

function tickCCTVGameEP3() {
    cctvHourEP3 += 3;
    if (cctvHourEP3 >= 24) {
        cctvHourEP3 = 0;
        cctvDayEP3++;
    }
    
    updateCCTVHUDEP3();
    
    if (ep3Stage === 0 && (cctvDayEP3 > 2 || (cctvDayEP3 === 2 && cctvHourEP3 >= 8)) && cctvGameStateEP3 === 'idle') {
        ep3Stage = 1;
        cctvDayEP3 = 2; cctvHourEP3 = 8; cctvMinuteEP3 = 30;
        triggerEventA_EP3();
    } else if (ep3Stage === 1 && (cctvDayEP3 > 4 || (cctvDayEP3 === 4 && cctvHourEP3 >= 10)) && cctvGameStateEP3 === 'idle') {
        ep3Stage = 2;
        cctvDayEP3 = 4; cctvHourEP3 = 10; cctvMinuteEP3 = 15;
        triggerEventB_EP3();
    } else if (ep3Stage === 2 && (cctvDayEP3 > 5 || (cctvDayEP3 === 5 && cctvHourEP3 >= 21)) && cctvGameStateEP3 === 'idle') {
        ep3Stage = 3;
        cctvDayEP3 = 5; cctvHourEP3 = 21; cctvMinuteEP3 = 40;
        triggerEventC_EP3();
    } else if (ep3Stage === 3 && (cctvDayEP3 >= 7 && cctvHourEP3 >= 13) && cctvGameStateEP3 === 'idle') {
        ep3Stage = 4;
        cctvDayEP3 = 7; cctvHourEP3 = 13; cctvMinuteEP3 = 0;
        triggerEventD_EP3();
    }
}

function updateCCTVHUDEP3() {
    const timeDisplay = document.getElementById('cctv-time-display-ep3');
    const stateDisplay = document.getElementById('cctv-state-display-ep3');
    if (timeDisplay) {
        const hh = cctvHourEP3 < 10 ? '0' + cctvHourEP3 : cctvHourEP3;
        const mm = cctvMinuteEP3 < 10 ? '0' + cctvMinuteEP3 : cctvMinuteEP3;
        timeDisplay.textContent = `SURVIVAL: DAY ${cctvDayEP3} (${hh}:${mm})`;
    }
    if (stateDisplay) {
        if (cctvGameStateEP3 === 'idle') {
            stateDisplay.textContent = 'STATUS: NORMAL';
            stateDisplay.style.color = '#00ff00';
        } else if (cctvGameStateEP3 === 'death') {
            stateDisplay.textContent = 'STATUS: ERROR - FATAL';
            stateDisplay.style.color = '#ff0000';
        } else {
            stateDisplay.textContent = 'STATUS: WARNING - ANOMALY';
            stateDisplay.style.color = '#ffff00';
        }
    }
}

function addCCTVLogEP3(message, isWarning = false) {
    const logsContainer = document.getElementById('cctv-logs-ep3');
    if (!logsContainer) return;
    const color = isWarning ? '#ff0000' : '#00ff00';
    const logDiv = document.createElement('div');
    logDiv.style.color = color;
    logDiv.textContent = message;
    logsContainer.appendChild(logDiv);
    logsContainer.scrollTop = logsContainer.scrollHeight;
}

function clearCCTVChoicesEP3() {
    const container = document.getElementById('cctv-choices-container-ep3');
    if (container) {
        container.innerHTML = '<div style="color: #888; font-size: 11px;">[비정상 상황 발생 시 대응 선택지가 활성화됩니다]</div>';
    }
}

function setCCTVChoicesEP3(choices) {
    const container = document.getElementById('cctv-choices-container-ep3');
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

function triggerEventA_EP3() {
    clearInterval(cctvTimerEP3);
    cctvGameStateEP3 = 'event_A';
    updateCCTVHUDEP3();
    setCAMTitleEP3("CAM-301 [301호 병실] - DAY 2 : 상황 A (빨간 인식표 & 특제 치료식 배달)");
    
    playCCTVVideoEP3('movies/ep3_event_meal.mp4', '[FEED: CAM-301 NURSE_SPECIAL_DIET]');
    addCCTVLogEP3("[DAY 2 / 08:30] 간호 개체가 카트를 밀고 들어와 보라색 덩어리의 특제 치료식을 배식합니다. 손목에 빨간색 인식표가 채워져 있습니다.", true);
    
    setCCTVChoicesEP3([
        {
            text: "[1] \"냄새가 역해서 도저히 못 먹겠다\"며 식판을 밀쳐낸다.",
            action: () => {
                addCCTVLogEP3("[사망] 불응 환자로 분류되어 특별 관리실로 강제 이송 후 개복 사망.", true);
                triggerDeathEP3("치료식 거부 및 불응", "특별 관리실로 강제 이송 후 개복 사망.");
            }
        },
        {
            text: "[2] 사전에 서랍 속 설사약을 복용하여 심각한 소화불량 상태임을 입증한다.",
            action: () => {
                clearCCTVChoicesEP3();
                addCCTVLogEP3("[생존] 간호 개체가 배탈 증상을 확인하고 식판을 회수하여 물러납니다.", false);
                addCCTVLogEP3("다음 생존 단계로 이동 중... (DAY 4 의사 회진 대기)", false);
                setCAMTitleEP3("CAM-301 [301호 병실] - 생존 대기 중");
                cctvGameStateEP3 = 'idle';
                cctvDayEP3 = 2; cctvHourEP3 = 12; cctvMinuteEP3 = 0;
                playCCTVVideoEP3('movies/ep3_idle.mp4', '[FEED: CAM-301 WARD_INTERIOR_IDLE]');
                cctvTimerEP3 = setInterval(tickCCTVGameEP3, 500);
            }
        }
    ]);
}

function triggerEventB_EP3() {
    clearInterval(cctvTimerEP3);
    cctvGameStateEP3 = 'event_B';
    updateCCTVHUDEP3();
    setCAMTitleEP3("CAM-301 [301호 병실] - DAY 4 : 상황 B (개체 의사의 오전 회진)");
    
    playCCTVVideoEP3('movies/ep3_event_doctor.mp4', '[FEED: CAM-301 DOCTOR_ROUNDS]');
    addCCTVLogEP3("[DAY 4 / 10:15] 담당 의사 개체가 차트를 들고 침상 앞을 막아섭니다. \"환자분, 오늘 몸 상태는 어떠십니까?\"", true);
    
    setCCTVChoicesEP3([
        {
            text: "[1] \"온몸이 너무 아파서 미칠 것 같습니다. 진통제 좀 주세요.\"",
            action: () => {
                addCCTVLogEP3("[사망] 상태 악화 환자로 판정되어 당일 응급 수술실로 끌려가 사망.", true);
                triggerDeathEP3("통증 호소 및 상태 악화 판정", "당일 응급 수술실로 끌려가 사망.");
            }
        },
        {
            text: "[2] \"이제 완전히 다 나았습니다! 당장 퇴원시켜 주세요.\"",
            action: () => {
                addCCTVLogEP3("[사망] 정신 오염 환자로 분류되어 '메리 정신병원'으로 영구 격리 전원.", true);
                triggerDeathEP3("완치 주장 및 퇴원 요구", "정신 오염 환자로 분류되어 '메리 정신병원'으로 영구 격리 전원.");
            }
        },
        {
            text: "[3] \"조금씩 나아지고 있습니다.\"라고 정중하고 침착하게 답한다.",
            action: () => {
                clearCCTVChoicesEP3();
                addCCTVLogEP3("[생존] 의사가 차트에 서명 후 조용히 다음 침상으로 이동합니다.", false);
                addCCTVLogEP3("다음 생존 단계로 이동 중... (DAY 5 야간 소등 대기)", false);
                setCAMTitleEP3("CAM-301 [301호 병실] - 생존 대기 중");
                cctvGameStateEP3 = 'idle';
                cctvDayEP3 = 4; cctvHourEP3 = 14; cctvMinuteEP3 = 0;
                playCCTVVideoEP3('movies/ep3_idle.mp4', '[FEED: CAM-301 WARD_INTERIOR_IDLE]');
                cctvTimerEP3 = setInterval(tickCCTVGameEP3, 500);
            }
        }
    ]);
}

function triggerEventC_EP3() {
    clearInterval(cctvTimerEP3);
    cctvGameStateEP3 = 'event_C';
    updateCCTVHUDEP3();
    setCAMTitleEP3("CAM-03F [3층 중앙 복도] - DAY 5 : 상황 C (21시 야간 소등 후 간호사 조우)");
    
    playCCTVVideoEP3('movies/ep3_event_night.mp4', '[FEED: CAM-03F NIGHT_NURSE]');
    addCCTVLogEP3("[DAY 5 / 21:40] 야간 소등 후 복도에서 덜컹거리던 이동침대 바퀴 소리가 침상 바로 앞에서 멈췄습니다. 간호 개체와 눈이 마주쳤습니다.", true);
    
    setCCTVChoicesEP3([
        {
            text: "[1] 이불을 뒤집어쓰고 아무런 반응도 하지 않는다.",
            action: () => {
                addCCTVLogEP3("[사망] 낙상 테스트 대상자로 판정되어 망치로 두개골이 함몰되어 사망.", true);
                triggerDeathEP3("무반응 및 낙상 테스트 판정", "망치로 두개골이 함몰되어 사망.");
            }
        },
        {
            text: "[2] 서랍 속에서 미리 꺼내둔 [10만 원권 지폐 1장]을 조용히 건넨다.",
            action: () => {
                clearCCTVChoicesEP3();
                addCCTVLogEP3("[생존] 간호 개체가 지폐를 품에 넣고 조용히 복도 반대편으로 멀어집니다.", false);
                addCCTVLogEP3("다음 생존 단계로 이동 중... (DAY 7 구조대 도달 대기)", false);
                setCAMTitleEP3("CAM-301 [301호 병실] - 구조 대기 중");
                cctvGameStateEP3 = 'idle';
                cctvDayEP3 = 5; cctvHourEP3 = 23; cctvMinuteEP3 = 0;
                playCCTVVideoEP3('movies/ep3_idle.mp4', '[FEED: CAM-301 WARD_INTERIOR_IDLE]');
                cctvTimerEP3 = setInterval(tickCCTVGameEP3, 500);
            }
        }
    ]);
}

function triggerEventD_EP3() {
    clearInterval(cctvTimerEP3);
    cctvGameStateEP3 = 'event_D';
    updateCCTVHUDEP3();
    setCAMTitleEP3("CAM-01F [1층 면회실] - DAY 7 : 상황 D (보호자 면회 및 최종 탈출)");
    
    playCCTVVideoEP3('movies/ep3_event_rescue.mp4', '[FEED: CAM-01F RESCUE_AGENT]');
    addCCTVLogEP3("[DAY 7 / 13:00] 편입 7일 차. 1층 면회실 호출 방송이 울렸습니다. 면회실 탁자에 정장을 입은 본부 구조 요원이 대기 중입니다.", true);
    
    setCCTVChoicesEP3([
        {
            text: "[1] 면회실 탁자 아래의 [녹색 비상 버튼]을 확인하고 요원의 지시에 따른다.",
            action: () => {
                clearCCTVChoicesEP3();
                addCCTVLogEP3("[GOOD ENDING] 본부 신속대응팀 인솔 하에 병원 정문을 통과하여 생환 성공!", false);
                triggerGameClearEP3();
            }
        },
        {
            text: "[2] 요원을 의심하여 혼자 병원 비상구 계단으로 질주한다.",
            action: () => {
                addCCTVLogEP3("[사망] 병원 외벽 방호 격벽에 갇혀 영구 실종.", true);
                triggerDeathEP3("비상구 무단 이탈", "병원 외벽 방호 격벽에 갇혀 영구 실종.");
            }
        }
    ]);
}

function triggerDeathEP3(reason, actionDesc) {
    clearInterval(cctvTimerEP3);
    cctvGameStateEP3 = 'death';
    updateCCTVHUDEP3();
    
    const video = document.getElementById('cctv-video-ep3');
    const centerStatus = document.getElementById('cctv-center-status-ep3');
    const offlineBg = document.getElementById('cctv-offline-bg-ep3');
    
    if (video) {
        video.pause();
        video.style.display = 'none';
    }
    if (offlineBg) offlineBg.style.display = 'block';
    if (centerStatus) {
        centerStatus.style.display = 'block';
        centerStatus.style.borderColor = '#ff0000';
        centerStatus.style.color = '#ff0000';
        centerStatus.innerHTML = `
            <div style="font-size: 16px; font-weight: bold; margin-bottom: 8px; color: #ff0000; animation: blink 0.5s infinite;">☠️ SYSTEM FAILURE ☠️</div>
            <div style="font-size: 11px; line-height: 1.6; color: #ff3333; font-family: monospace; text-align: left; word-break: keep-all;">
                [ERROR] 입원 환자 생체 신호 소멸.<br>
                [원인] ${reason || '병원 수칙 위반으로 인한 신체 변이/수술'}.<br>
                [결과] ${actionDesc || '사망자 처리반 출동'}.
            </div>
        `;
    }
    
    setCCTVChoicesEP3([
        {
            text: "재시도 (Retry)",
            action: () => {
                if (centerStatus) {
                    centerStatus.style.borderColor = '#00ff00';
                    centerStatus.style.color = '#00ff00';
                }
                startCCTVGameEP3();
            }
        }
    ]);
}

function triggerGameClearEP3() {
    clearInterval(cctvTimerEP3);
    cctvGameStateEP3 = 'win';
    updateCCTVHUDEP3();
    
    playCCTVVideoEP3('movies/ep3_idle.mp4', '[SYSTEM: RESCUE COMPLETE]');
    clearCCTVChoicesEP3();
    
    openDarkWebAlert("🏆 [GOOD ENDING / 생환 성공]<br>축하합니다! 본부 신속대응팀 인솔 하에 베리 해피 종합병원 정문을 통과하여 7일간의 격리에서 무사히 탈출하였습니다.<br><br><b>[SURVIVAL CONFIRMED]</b>");
}

// ==========================================
// CCTV Gaming Engine (EP.04 불꺼진 13층 엘리베이터)
// ==========================================
let cctvFloorEP4 = 13;
let cctvOpsEP4 = 20;
let cctvTimerEP4 = null;
let cctvGameStateEP4 = 'idle'; // 'idle' | 'event_A' | 'event_B' | 'event_C' | 'event_D' | 'death' | 'win'
let cctvNoiseAnimIdEP4 = null;

function setCAMTitleEP4(title) {
    const el = document.getElementById('cctv-cam-title-ep4');
    if (el) el.textContent = title;
}

function initCCTVNoiseEP4() {
    const canvas = document.getElementById('cctv-noise-canvas-ep4');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = 160;
    canvas.height = 120;
    
    function drawNoiseEP4() {
        const cctvWin = document.getElementById('darkwebCCTVWindowEP4');
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
        cctvNoiseAnimIdEP4 = requestAnimationFrame(drawNoiseEP4);
    }
    
    if (cctvNoiseAnimIdEP4) cancelAnimationFrame(cctvNoiseAnimIdEP4);
    drawNoiseEP4();
}

function startCCTVGameEP4() {
    stopCCTVGameEP4();
    cctvFloorEP4 = 13;
    cctvOpsEP4 = 20;
    cctvGameStateEP4 = 'idle';
    
    setCAMTitleEP4("CAM-REAR [후면 거울 뷰] - 진입 및 층수 확인");
    
    const blackout = document.getElementById('cctv-blackout-ep4');
    if (blackout) blackout.style.display = 'none';
    
    const centerStatus = document.getElementById('cctv-center-status-ep4');
    if (centerStatus) {
        centerStatus.style.borderColor = '#00ff00';
        centerStatus.style.color = '#00ff00';
    }
    
    updateCCTVHUDEP4();
    const logsContainer = document.getElementById('cctv-logs-ep4');
    if (logsContainer) {
        logsContainer.innerHTML = '<div style="color: #888;">[SYSTEM] 신도림 만수 오피스텔 승강기 감시 시스템 v4.01 로드 완료...</div>';
    }
    addCCTVLogEP4("[00:13:00] 불꺼진 13층 엘리베이터 편입 감지. 사방 거울 통로 형성. 남은 조작 횟수: 20회.");
    
    playCCTVVideoEP4('movies/ep4_idle.mp4', '[FEED: CAM-REAR ELEVATOR_MIRROR_IDLE]');
    clearCCTVChoicesEP4();
    
    cctvTimerEP4 = setTimeout(() => {
        if (cctvGameStateEP4 === 'idle') {
            triggerEventA_EP4();
        }
    }, 2500);
    
    initCCTVNoiseEP4();
}

function stopCCTVGameEP4() {
    if (cctvTimerEP4) {
        clearTimeout(cctvTimerEP4);
        cctvTimerEP4 = null;
    }
    const video = document.getElementById('cctv-video-ep4');
    if (video) video.pause();
    if (cctvNoiseAnimIdEP4) cancelAnimationFrame(cctvNoiseAnimIdEP4);
}

function playCCTVVideoEP4(src, fallbackText) {
    const video = document.getElementById('cctv-video-ep4');
    const centerStatus = document.getElementById('cctv-center-status-ep4');
    const offlineBg = document.getElementById('cctv-offline-bg-ep4');
    
    if (video) {
        video.muted = true;
        video.defaultMuted = true;
        video.playsInline = true;
        video.loop = true;
        video.style.zIndex = '2';
        video.style.display = 'block';
        if (video.setAttribute) {
            video.setAttribute('muted', '');
            video.setAttribute('playsinline', '');
            video.setAttribute('autoplay', '');
        }
        
        if (offlineBg) offlineBg.style.display = 'none';
        if (centerStatus) centerStatus.style.display = 'none';
        
        video.onloadeddata = () => {
            video.style.display = 'block';
            if (offlineBg) offlineBg.style.display = 'none';
            if (centerStatus) centerStatus.style.display = 'none';
        };
        video.onerror = () => {
            console.warn('playCCTVVideoEP4 video load error:', src);
            video.style.display = 'none';
            if (offlineBg) offlineBg.style.display = 'block';
            if (centerStatus) {
                centerStatus.style.display = 'block';
                centerStatus.textContent = fallbackText || 'FEED SIGNAL LOST';
            }
        };

        const currentSrc = video.getAttribute('src') || video.src || '';
        if (!currentSrc.endsWith(src)) {
            video.src = src;
        }
        
        const playPromise = video.play();
        if (playPromise !== undefined) {
            playPromise.then(() => {
                video.style.display = 'block';
                if (offlineBg) offlineBg.style.display = 'none';
                if (centerStatus) centerStatus.style.display = 'none';
            }).catch(err => {
                console.warn('playCCTVVideoEP4 autoplay note:', err);
                video.muted = true;
                video.play().catch(retryErr => {
                    console.warn('playCCTVVideoEP4 retry note:', retryErr);
                    if (fallbackText) {
                        video.style.display = 'none';
                        if (offlineBg) offlineBg.style.display = 'block';
                        if (centerStatus) {
                            centerStatus.style.display = 'block';
                            centerStatus.textContent = fallbackText;
                        }
                    }
                });
            });
        }
    }
}

function updateCCTVHUDEP4() {
    const timeDisplay = document.getElementById('cctv-time-display-ep4');
    const stateDisplay = document.getElementById('cctv-state-display-ep4');
    if (timeDisplay) {
        timeDisplay.textContent = `LOCATION: ${cctvFloorEP4}F (REAR MIRROR: ${cctvFloorEP4}F) | OPS: ${cctvOpsEP4}/20`;
    }
    if (stateDisplay) {
        if (cctvGameStateEP4 === 'idle') {
            stateDisplay.textContent = 'STATUS: NORMAL';
            stateDisplay.style.color = '#00ff00';
        } else if (cctvGameStateEP4 === 'death') {
            stateDisplay.textContent = 'STATUS: ERROR - FATAL';
            stateDisplay.style.color = '#ff0000';
        } else {
            stateDisplay.textContent = 'STATUS: WARNING - ANOMALY';
            stateDisplay.style.color = '#ffff00';
        }
    }
}

function addCCTVLogEP4(message, isWarning = false) {
    const logsContainer = document.getElementById('cctv-logs-ep4');
    if (!logsContainer) return;
    const color = isWarning ? '#ff0000' : '#00ff00';
    const logDiv = document.createElement('div');
    logDiv.style.color = color;
    logDiv.textContent = message;
    logsContainer.appendChild(logDiv);
    logsContainer.scrollTop = logsContainer.scrollHeight;
}

function clearCCTVChoicesEP4() {
    const container = document.getElementById('cctv-choices-container-ep4');
    if (container) {
        container.innerHTML = '<div style="color: #888; font-size: 11px;">[비정상 상황 발생 시 대응 선택지가 활성화됩니다]</div>';
    }
}

function setCCTVChoicesEP4(choices) {
    const container = document.getElementById('cctv-choices-container-ep4');
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

function triggerEventA_EP4() {
    cctvFloorEP4 = 10;
    cctvOpsEP4 = 19;
    cctvGameStateEP4 = 'event_A';
    updateCCTVHUDEP4();
    setCAMTitleEP4("CAM-LEFT [좌측 측면 뷰] - 상황 A (좌측 거울 개체 접근)");
    
    playCCTVVideoEP4('movies/ep4_event_left.mp4', '[FEED: CAM-LEFT LEFT_MIRROR_ENTITY]');
    addCCTVLogEP4("[진행 01] 후면 거울 확인 결과 현재 층수는 [10층]입니다. 좌측 측면 거울에서 여성형 개체가 기어오고 있습니다.", true);
    
    setCCTVChoicesEP4([
        {
            text: "[1] 아래층으로 내려가기 위해 [8층] 버튼을 누른다.",
            action: () => {
                addCCTVLogEP4("[사망] 승강기가 급상승하여 상판에 충돌 압착되었습니다.", true);
                triggerDeathEP4("조작 방향 오류", "승강기가 급상승하여 상판에 충돌 압착되었습니다.");
            }
        },
        {
            text: "[2] 규칙에 따라 현재보다 위층인 [12층] 버튼을 누른다.",
            action: () => {
                clearCCTVChoicesEP4();
                addCCTVLogEP4("[생존] 조작반이 반전 작동하며 승강기가 정상 하강합니다.", false);
                setCAMTitleEP4("CAM-REAR [후면 거울 뷰] - 하강 중");
                cctvGameStateEP4 = 'idle';
                playCCTVVideoEP4('movies/ep4_idle.mp4', '[FEED: CAM-REAR ELEVATOR_MIRROR_IDLE]');
                cctvTimerEP4 = setTimeout(() => {
                    if (cctvGameStateEP4 === 'idle') {
                        triggerEventB_EP4();
                    }
                }, 2500);
            }
        }
    ]);
}

function triggerEventB_EP4() {
    cctvFloorEP4 = 6;
    cctvOpsEP4 = 18;
    cctvGameStateEP4 = 'event_B';
    updateCCTVHUDEP4();
    setCAMTitleEP4("CAM-RIGHT [우측 측면 뷰] - 상황 B (우측 거울 개체 접근)");
    
    playCCTVVideoEP4('movies/ep4_event_right.mp4', '[FEED: CAM-RIGHT RIGHT_MIRROR_ENTITY]');
    addCCTVLogEP4("[진행 02] 하강 후 후면 거울상 [6층] 도달. 개체가 우측 측면 거울로 이동하여 1걸음 더 다가왔습니다.", true);
    
    setCCTVChoicesEP4([
        {
            text: "[1] 우측에 있으므로 위층인 [8층] 버튼을 누른다.",
            action: () => {
                addCCTVLogEP4("[사망] 1층을 지나쳐 영구 결손 구역으로 진입했습니다.", true);
                triggerDeathEP4("조작 방향 오류", "1층을 지나쳐 영구 결손 구역으로 진입했습니다.");
            }
        },
        {
            text: "[2] 규칙에 따라 현재보다 아래층인 [4층] 버튼을 누른다.",
            action: () => {
                clearCCTVChoicesEP4();
                addCCTVLogEP4("[생존] 승강기가 덜컹거리며 1층을 향해 순조롭게 하강합니다.", false);
                setCAMTitleEP4("CAM-REAR [후면 거울 뷰] - 하강 중");
                cctvGameStateEP4 = 'idle';
                playCCTVVideoEP4('movies/ep4_idle.mp4', '[FEED: CAM-REAR ELEVATOR_MIRROR_IDLE]');
                cctvTimerEP4 = setTimeout(() => {
                    if (cctvGameStateEP4 === 'idle') {
                        triggerEventC_EP4();
                    }
                }, 2500);
            }
        }
    ]);
}

function triggerEventC_EP4() {
    cctvFloorEP4 = 4;
    cctvOpsEP4 = 17;
    cctvGameStateEP4 = 'event_C';
    updateCCTVHUDEP4();
    setCAMTitleEP4("CAM-PANEL [조작반 집중 뷰] - 상황 C (스피커 음성 오염)");
    
    playCCTVVideoEP4('movies/ep4_event_speaker.mp4', '[FEED: CAM-PANEL SPEAKER_ANOMALY]');
    addCCTVLogEP4("[진행 03] 조작반 버튼들이 무작위로 점멸하며 스피커에서 가족이 애타게 이름을 부르는 목소리가 흘러나옵니다.", true);
    
    setCCTVChoicesEP4([
        {
            text: "[1] 스피커를 향해 \"저 여기 타고 있어요!\"라고 대답한다.",
            action: () => {
                addCCTVLogEP4("[사망] 천장 환풍구에서 쏟아져 나온 개체에게 신체가 훼손되었습니다.", true);
                triggerDeathEP4("환청 반응", "천장 환풍구에서 쏟아져 나온 개체에게 신체가 훼손되었습니다.");
            }
        },
        {
            text: "[2] 스피커를 무시하고 마지막 확인 층수였던 [4층] 버튼을 3초간 꾹 누른다.",
            action: () => {
                clearCCTVChoicesEP4();
                const blackout = document.getElementById('cctv-blackout-ep4');
                if (blackout) blackout.style.display = 'flex';
                addCCTVLogEP4("4층 버튼 3초간 입력 중...", false);
                
                setTimeout(() => {
                    if (blackout) blackout.style.display = 'none';
                    addCCTVLogEP4("[생존] 잡음이멎고 정상 하강 신호음이 복구됩니다.", false);
                    setCAMTitleEP4("CAM-DOOR [승강기 정면 도어] - 1층 도달 중");
                    cctvGameStateEP4 = 'idle';
                    playCCTVVideoEP4('movies/ep4_idle.mp4', '[FEED: CAM-DOOR ELEVATOR_MIRROR_IDLE]');
                    cctvTimerEP4 = setTimeout(() => {
                        if (cctvGameStateEP4 === 'idle') {
                            triggerEventD_EP4();
                        }
                    }, 2500);
                }, 2500);
            }
        }
    ]);
}

function triggerEventD_EP4() {
    cctvFloorEP4 = 1;
    cctvOpsEP4 = 16;
    cctvGameStateEP4 = 'event_D';
    updateCCTVHUDEP4();
    setCAMTitleEP4("CAM-DOOR [승강기 정면 도어] - 상황 D (1층 도착 및 최종 하차)");
    
    playCCTVVideoEP4('movies/ep4_event_exit.mp4', '[FEED: CAM-DOOR FLOOR_1_ARRIVAL]');
    addCCTVLogEP4("[진행 04] 둔탁한 정차음과 함께 조작반이 소등되고 1층 문이 열립니다.", true);
    
    setCCTVChoicesEP4([
        {
            text: "[1] 거울 속 개체가 아직 남아있는지 뒤돌아 확인한다.",
            action: () => {
                addCCTVLogEP4("[사망] 문이 닫히며 내부로 끌려들어 가 실종되었습니다.", true);
                triggerDeathEP4("거울 뒤돌아봄", "문이 닫히며 내부로 끌려들어 가 실종되었습니다.");
            }
        },
        {
            text: "[2] 뒤돌아보지 않고 앞만 보며 신속히 문밖으로 걸어 나간다.",
            action: () => {
                clearCCTVChoicesEP4();
                addCCTVLogEP4("[GOOD ENDING] 오피스텔 1층 로비로 정상 귀환 완료!", false);
                triggerGameClearEP4();
            }
        }
    ]);
}

function triggerDeathEP4(reason, actionDesc, deathVideoSrc) {
    if (cctvTimerEP4) clearTimeout(cctvTimerEP4);
    cctvGameStateEP4 = 'death';
    updateCCTVHUDEP4();
    
    const video = document.getElementById('cctv-video-ep4');
    const centerStatus = document.getElementById('cctv-center-status-ep4');
    
    const showDeathScreen = () => {
        if (video) video.style.display = 'none';
        if (centerStatus) {
            centerStatus.style.display = 'block';
            centerStatus.style.borderColor = '#ff0000';
            centerStatus.style.color = '#ff0000';
            centerStatus.innerHTML = `
                <div style="font-size: 16px; font-weight: bold; margin-bottom: 8px; color: #ff0000; animation: blink 0.5s infinite;">☠️ SYSTEM FAILURE ☠️</div>
                <div style="font-size: 11px; line-height: 1.5; color: #ff3333; font-family: monospace; text-align: left; word-break: keep-all;">
                    [ERROR] 승강기 탑승객 생체 신호 소멸.<br>
                    [원인] ${reason || '승강기 수칙 위반으로 인한 개체 접촉'}.<br>
                    [결과] ${actionDesc || '전국 승강기 유해 수색'}.
                </div>
            `;
        }
    };
    
    showDeathScreen();
    
    setCCTVChoicesEP4([
        {
            text: "재시도 (Retry)",
            action: () => {
                if (centerStatus) {
                    centerStatus.style.borderColor = '#00ff00';
                    centerStatus.style.color = '#00ff00';
                }
                startCCTVGameEP4();
            }
        }
    ]);
}

function triggerGameClearEP4() {
    if (cctvTimerEP4) clearTimeout(cctvTimerEP4);
    cctvGameStateEP4 = 'win';
    updateCCTVHUDEP4();
    
    playCCTVVideoEP4('movies/ep4_idle.mp4', '[SYSTEM: REALITY RESTORED]');
    clearCCTVChoicesEP4();
    
    openDarkWebAlert("🏆 [무사 탈출 성공]<br>축하합니다! 신도림 만수 오피스텔 승강기에서 1층 로비로 정상 탈출하셨습니다.");
}

// CCTV Gaming Engine (EP.05 강원도 홍천군 살둔 계곡 아기소 반경 500m 원격 관제 콘솔)
// ==========================================
let ep5Stage = 0;
let cctvTimerEP5 = null;
let cctvGameStateEP5 = 'idle';
let cctvNoiseAnimIdEP5 = null;
let cctvTimeStrEP5 = "LIMIT: 00:00:00 / 10:00:00";

function setCAMTitleEP5(title) {
    const el = document.getElementById('cctv-cam-title-ep5');
    if (el) el.textContent = title;
}

function initCCTVNoiseEP5() {
    const canvas = document.getElementById('cctv-noise-canvas-ep5');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = 160;
    canvas.height = 120;
    
    function drawNoiseEP5() {
        const cctvWin = document.getElementById('darkwebCCTVWindowEP5');
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
        cctvNoiseAnimIdEP5 = requestAnimationFrame(drawNoiseEP5);
    }
    
    if (cctvNoiseAnimIdEP5) cancelAnimationFrame(cctvNoiseAnimIdEP5);
    drawNoiseEP5();
}

function startCCTVGameEP5() {
    stopCCTVGameEP5();
    ep5Stage = 0;
    cctvGameStateEP5 = 'idle';
    cctvTimeStrEP5 = "LIMIT: 00:00:00 / 10:00:00";
    
    const blackout = document.getElementById('cctv-blackout-ep5');
    if (blackout) blackout.style.display = 'none';
    
    const centerStatus = document.getElementById('cctv-center-status-ep5');
    if (centerStatus) {
        centerStatus.style.display = 'none';
        centerStatus.style.borderColor = '#00ff00';
        centerStatus.style.color = '#00ff00';
    }
    
    setCAMTitleEP5("CH 01: CAM-POST [진입 초소 전경] - 진입 및 각성제 주입");
    updateCCTVHUDEP5();
    
    const logsContainer = document.getElementById('cctv-logs-ep5');
    if (logsContainer) {
        logsContainer.innerHTML = '<div style="color: #888;">[SYSTEM] 살둔 계곡 아기소 반경 500m 원격 관제 콘솔 로드 완료...</div>';
    }
    addCCTVLogEP5("[00:00:00] 통제 구역 500m 라인 진입 확인. 각성제 투여 완료. 제한 시간 10분 카운트다운 시작.");
    
    playCCTVVideoEP5('movies/ep5_idle.mp4', '[FEED: CAM-POST POST_IDLE]');
    clearCCTVChoicesEP5();
    initCCTVNoiseEP5();
    
    // Automatically transition to Stage 1 after initial briefing
    cctvTimerEP5 = setTimeout(() => {
        if (cctvGameStateEP5 === 'idle') {
            triggerEventA_EP5();
        }
    }, 2800);
}

function stopCCTVGameEP5() {
    if (cctvTimerEP5) {
        clearTimeout(cctvTimerEP5);
        clearInterval(cctvTimerEP5);
        cctvTimerEP5 = null;
    }
    const video = document.getElementById('cctv-video-ep5');
    if (video) video.pause();
    if (cctvNoiseAnimIdEP5) cancelAnimationFrame(cctvNoiseAnimIdEP5);
}

function playCCTVVideoEP5(src, fallbackText) {
    const video = document.getElementById('cctv-video-ep5');
    const centerStatus = document.getElementById('cctv-center-status-ep5');
    const offlineBg = document.getElementById('cctv-offline-bg-ep5');
    
    if (video) {
        video.muted = true;
        video.defaultMuted = true;
        video.playsInline = true;
        video.loop = true;
        video.style.zIndex = '2';
        video.style.display = 'block';
        if (video.setAttribute) {
            video.setAttribute('muted', '');
            video.setAttribute('playsinline', '');
            video.setAttribute('autoplay', '');
        }
        
        if (offlineBg) offlineBg.style.display = 'none';
        if (centerStatus) centerStatus.style.display = 'none';
        
        video.onloadeddata = () => {
            video.style.display = 'block';
            if (offlineBg) offlineBg.style.display = 'none';
            if (centerStatus) centerStatus.style.display = 'none';
        };
        video.onerror = () => {
            console.warn('playCCTVVideoEP5 video load error:', src);
            video.style.display = 'none';
            if (offlineBg) offlineBg.style.display = 'block';
            if (centerStatus) {
                centerStatus.style.display = 'block';
                centerStatus.textContent = fallbackText || 'FEED SIGNAL LOST';
            }
        };

        const currentSrc = video.getAttribute('src') || video.src || '';
        if (!currentSrc.endsWith(src)) {
            video.src = src;
        }
        
        const playPromise = video.play();
        if (playPromise !== undefined) {
            playPromise.then(() => {
                video.style.display = 'block';
                if (offlineBg) offlineBg.style.display = 'none';
                if (centerStatus) centerStatus.style.display = 'none';
            }).catch(err => {
                console.warn('playCCTVVideoEP5 autoplay note:', err);
                video.muted = true;
                video.play().catch(retryErr => {
                    console.warn('playCCTVVideoEP5 retry note:', retryErr);
                    if (fallbackText) {
                        video.style.display = 'none';
                        if (offlineBg) offlineBg.style.display = 'block';
                        if (centerStatus) {
                            centerStatus.style.display = 'block';
                            centerStatus.textContent = fallbackText;
                        }
                    }
                });
            });
        }
    }
}

function updateCCTVHUDEP5() {
    const timeDisplay = document.getElementById('cctv-time-display-ep5');
    const stateDisplay = document.getElementById('cctv-state-display-ep5');
    if (timeDisplay) {
        timeDisplay.textContent = cctvTimeStrEP5;
    }
    if (stateDisplay) {
        if (cctvGameStateEP5 === 'idle') {
            stateDisplay.textContent = 'STATUS: NORMAL';
            stateDisplay.style.color = '#00ff00';
        } else if (cctvGameStateEP5 === 'death') {
            stateDisplay.textContent = 'STATUS: ERROR - FATAL';
            stateDisplay.style.color = '#ff0000';
        } else if (cctvGameStateEP5 === 'win') {
            stateDisplay.textContent = 'STATUS: SURVIVED (EVACUATED)';
            stateDisplay.style.color = '#00ff00';
        } else {
            stateDisplay.textContent = 'STATUS: WARNING - ANOMALY DETECTED';
            stateDisplay.style.color = '#ffaa00';
        }
    }
}

function addCCTVLogEP5(text, isWarning = false) {
    const container = document.getElementById('cctv-logs-ep5');
    if (!container) return;
    const entry = document.createElement('div');
    entry.style.marginBottom = '4px';
    entry.style.color = isWarning ? '#ff3333' : '#00ff00';
    if (isWarning) {
        entry.style.fontWeight = 'bold';
    }
    entry.textContent = text;
    container.appendChild(entry);
    container.scrollTop = container.scrollHeight;
}

function clearCCTVChoicesEP5() {
    const container = document.getElementById('cctv-choices-container-ep5');
    if (container) {
        container.innerHTML = '<div style="color: #888; font-size: 11px;">[비정상 상황 발생 시 대응 선택지가 활성화됩니다]</div>';
    }
}

function setCCTVChoicesEP5(choices) {
    const container = document.getElementById('cctv-choices-container-ep5');
    if (!container) return;
    container.innerHTML = '';
    choices.forEach(c => {
        const btn = document.createElement('button');
        btn.textContent = c.text;
        btn.style.backgroundColor = '#111';
        btn.style.color = '#ff0000';
        btn.style.border = '1px solid #ff0000';
        btn.style.fontFamily = 'monospace';
        btn.style.fontSize = '11px';
        btn.style.padding = '4px 12px';
        btn.style.cursor = 'pointer';
        btn.style.margin = '2px';
        btn.style.wordBreak = 'keep-all';
        btn.addEventListener('click', c.action);
        container.appendChild(btn);
    });
}

function triggerEventA_EP5() {
    if (cctvTimerEP5) clearTimeout(cctvTimerEP5);
    ep5Stage = 1;
    cctvGameStateEP5 = 'event_A';
    cctvTimeStrEP5 = "LIMIT: 03:20:15 / 10:00:00";
    updateCCTVHUDEP5();
    setCAMTitleEP5("CH 02: CAM-POND [아기소 수면 전경] - 상황 A (최면성 침수 충동)");
    
    playCCTVVideoEP5('movies/ep5_event_water.mp4', '[FEED: CAM-POND WATER_HYPNOSIS]');
    addCCTVLogEP5("[03:20:15] 수면에서 맑은 물소리가 울리며 급격한 갈증과 함께 물에 뛰어들고 싶다는 충동이 발생합니다.", true);
    
    setCCTVChoicesEP5([
        {
            text: "[선택지 1] 갈증을 해소하기 위해 손으로 물을 살짝 떠 마신다.",
            action: () => {
                addCCTVLogEP5("[사망] 고체 덩어리가 피부로 스며들어 전신이 급격히 팽창 후 파열 사망.", true);
                triggerDeathEP5("변칙 고체 덩어리 침투", "고체 덩어리가 피부로 스며들어 전신이 급격히 팽창 후 파열 사망.");
            }
        },
        {
            text: "[선택지 2] 시선을 바닥으로 떨구고 수면에서 5m 이상 물러나 전진한다.",
            action: () => {
                clearCCTVChoicesEP5();
                addCCTVLogEP5("[생존] 최면 충동을 억누르고 현장 통제 작업을 이어갑니다.", false);
                cctvGameStateEP5 = 'idle';
                setCAMTitleEP5("CH 01: CAM-POST [진입 초소 전경] - 통제 라인 전진 중");
                cctvTimeStrEP5 = "LIMIT: 05:00:00 / 10:00:00";
                updateCCTVHUDEP5();
                playCCTVVideoEP5('movies/ep5_idle.mp4', '[FEED: CAM-POST ADVANCING]');
                cctvTimerEP5 = setTimeout(() => {
                    if (cctvGameStateEP5 === 'idle') {
                        triggerEventB_EP5();
                    }
                }, 2500);
            }
        }
    ]);
}

function triggerEventB_EP5() {
    if (cctvTimerEP5) clearTimeout(cctvTimerEP5);
    ep5Stage = 2;
    cctvGameStateEP5 = 'event_B';
    cctvTimeStrEP5 = "LIMIT: 06:40:40 / 10:00:00";
    updateCCTVHUDEP5();
    setCAMTitleEP5("CH 03: CAM-TREE [계곡 숲 통로] - 상황 B (청각 오염 및 울음소리)");
    
    playCCTVVideoEP5('movies/ep5_event_cry.mp4', '[FEED: CAM-TREE AUDITORY_CRY]');
    addCCTVLogEP5("[06:40:40] 무전기 스피커와 수풀 사이에서 날카로운 아이의 웃음소리와 흐느낌이 섞여 들려옵니다.", true);
    
    setCCTVChoicesEP5([
        {
            text: "[선택지 1] 조난당한 아이가 있는지 확인하기 위해 숲 쪽으로 이동한다.",
            action: () => {
                addCCTVLogEP5("[사망] 청각 오염으로 고막이 파열되며 최면에 잠식되어 실종.", true);
                triggerDeathEP5("청각 오염 최면 잠식", "청각 오염으로 고막이 파열되며 최면에 잠식되어 실종.");
            }
        },
        {
            text: "[선택지 2] 구비된 [빨간 알약]을 복용하고 소형 EMP를 터뜨려 통신기를 차단한다.",
            action: () => {
                clearCCTVChoicesEP5();
                addCCTVLogEP5("[생존] 음파 동기화를 차단하여 뇌 오염을 회피했습니다.", false);
                cctvGameStateEP5 = 'idle';
                setCAMTitleEP5("CH 01: CAM-POST [진입 초소 전경] - 웅덩이 심층부 접근 중");
                cctvTimeStrEP5 = "LIMIT: 07:45:00 / 10:00:00";
                updateCCTVHUDEP5();
                playCCTVVideoEP5('movies/ep5_idle.mp4', '[FEED: CAM-POST ADVANCING]');
                cctvTimerEP5 = setTimeout(() => {
                    if (cctvGameStateEP5 === 'idle') {
                        triggerEventC_EP5();
                    }
                }, 2500);
            }
        }
    ]);
}

function triggerEventC_EP5() {
    if (cctvTimerEP5) clearTimeout(cctvTimerEP5);
    ep5Stage = 3;
    cctvGameStateEP5 = 'event_C';
    cctvTimeStrEP5 = "LIMIT: 08:30:10 / 10:00:00";
    updateCCTVHUDEP5();
    setCAMTitleEP5("CH 04: CAM-SHORE [웅덩이 표면 근접] - 상황 C (수면 반사 이상)");
    
    playCCTVVideoEP5('movies/ep5_event_mirror.mp4', '[FEED: CAM-SHORE MIRROR_ANOMALY]');
    addCCTVLogEP5("[08:30:10] 수면에 비친 내 모습이 동작과 무관하게 기괴한 미소를 지으며 올려다보고 있습니다.", true);
    
    setCCTVChoicesEP5([
        {
            text: "[선택지 1] 수면에 비친 얼굴을 지우기 위해 돌을 던져 파도를 일으킨다.",
            action: () => {
                addCCTVLogEP5("[사망] 수면 진동으로 고체 개체가 활성화되어 통째로 집어삼켜졌습니다.", true);
                triggerDeathEP5("수면 진동 개체 활성화", "수면 진동으로 고체 개체가 활성화되어 통째로 집어삼켜졌습니다.");
            }
        },
        {
            text: "[선택지 2] 배낭에서 '확보 개체 91번(검은 것)'을 꺼내 수면 위에 덮어 칠한다.",
            action: () => {
                clearCCTVChoicesEP5();
                const blackout = document.getElementById('cctv-blackout-ep5');
                if (blackout) blackout.style.display = 'flex';
                addCCTVLogEP5("[작업] 배낭에서 '확보 개체 91번(검은 것)'을 꺼내 수면에 도포 중...", false);
                
                setTimeout(() => {
                    if (blackout) blackout.style.display = 'none';
                    addCCTVLogEP5("[생존] 수면 반사상이 검게 지워지며 변칙 동기화가 끊어졌습니다.", false);
                    cctvGameStateEP5 = 'idle';
                    setCAMTitleEP5("CH 01: CAM-POST [진입 초소 전경] - 최종 철책선 이동 중");
                    cctvTimeStrEP5 = "LIMIT: 09:15:00 / 10:00:00";
                    updateCCTVHUDEP5();
                    playCCTVVideoEP5('movies/ep5_idle.mp4', '[FEED: CAM-POST ADVANCING]');
                    cctvTimerEP5 = setTimeout(() => {
                        if (cctvGameStateEP5 === 'idle') {
                            triggerEventD_EP5();
                        }
                    }, 2500);
                }, 2000);
            }
        }
    ]);
}

function triggerEventD_EP5() {
    if (cctvTimerEP5) clearTimeout(cctvTimerEP5);
    ep5Stage = 4;
    cctvGameStateEP5 = 'event_D';
    cctvTimeStrEP5 = "LIMIT: 09:50:00 / 10:00:00";
    updateCCTVHUDEP5();
    setCAMTitleEP5("CH 05: CAM-FENCE [500m 경계 철책] - 상황 D (제한 시간 만료 및 최종 탈출)");
    
    playCCTVVideoEP5('movies/ep5_event_escape.mp4', '[FEED: CAM-FENCE ESCAPE_BOUNDARY]');
    addCCTVLogEP5("[09:50:00] 각성제 효과 종료 10초 전 경고. 500m 경계 철책이 눈앞에 보입니다.", true);
    
    setCCTVChoicesEP5([
        {
            text: "[선택지 1] 장비 유실물을 확인하기 위해 잠시 멈춰 서서 가방을 뒤진다.",
            action: () => {
                addCCTVLogEP5("[사망] 10분 제한 시간 초과. 각성제 효과가 풀려 스스로 웅덩이로 걸어 들어갔습니다.", true);
                triggerDeathEP5("제한 시간 10분 초과", "10분 제한 시간 초과. 각성제 효과가 풀려 스스로 웅덩이로 걸어 들어갔습니다.");
            }
        },
        {
            text: "[선택지 2] 뒤돌아보지 않고 전력 질주하여 500m 철책 밖으로 몸을 던진다.",
            action: () => {
                clearCCTVChoicesEP5();
                triggerGameClearEP5();
            }
        }
    ]);
}

function triggerDeathEP5(reason, actionDesc) {
    if (cctvTimerEP5) clearTimeout(cctvTimerEP5);
    cctvGameStateEP5 = 'death';
    updateCCTVHUDEP5();
    
    const video = document.getElementById('cctv-video-ep5');
    const centerStatus = document.getElementById('cctv-center-status-ep5');
    
    if (video) {
        video.pause();
        video.style.display = 'none';
    }
    
    if (centerStatus) {
        centerStatus.style.display = 'block';
        centerStatus.style.borderColor = '#ff0000';
        centerStatus.style.color = '#ff0000';
        centerStatus.innerHTML = `
            <div style="font-size: 16px; font-weight: bold; margin-bottom: 8px; color: #ff0000; animation: blink 0.5s infinite;">☠️ SYSTEM FAILURE ☠️</div>
            <div style="font-size: 11px; line-height: 1.5; color: #ff3333; font-family: monospace; text-align: left; word-break: keep-all;">
                [ERROR] 통제 요원 생체 신호 소멸 / 웅덩이 침수.<br>
                [원인] ${reason || '통제 수칙 위반으로 인한 변칙 접촉'}.<br>
                [결과] ${actionDesc || '현장 수색 및 유해 인양 불가'}.
            </div>
        `;
    }
    
    setCCTVChoicesEP5([
        {
            text: "재시도 (Retry)",
            action: () => {
                if (centerStatus) {
                    centerStatus.style.borderColor = '#00ff00';
                    centerStatus.style.color = '#00ff00';
                }
                startCCTVGameEP5();
            }
        }
    ]);
}

function triggerGameClearEP5() {
    if (cctvTimerEP5) clearTimeout(cctvTimerEP5);
    ep5Stage = 5;
    cctvGameStateEP5 = 'win';
    cctvTimeStrEP5 = "LIMIT: 10:00:00 / 10:00:00";
    updateCCTVHUDEP5();
    
    setCAMTitleEP5("CH 05: CAM-FENCE [500m 경계 철책] - 탈출 성공");
    addCCTVLogEP5("[GOOD ENDING] 통제 구역 이탈 성공. 살둔 계곡에서 무사히 생환했습니다!", false);
    playCCTVVideoEP5('movies/ep5_idle.mp4', '[SYSTEM: EVACUATION COMPLETE]');
    clearCCTVChoicesEP5();
    
    const centerStatus = document.getElementById('cctv-center-status-ep5');
    if (centerStatus) {
        centerStatus.style.display = 'block';
        centerStatus.style.borderColor = '#00ff00';
        centerStatus.style.color = '#00ff00';
        centerStatus.innerHTML = `
            <div style="font-size: 16px; font-weight: bold; margin-bottom: 8px; color: #00ff00;">🏆 MISSION COMPLETE 🏆</div>
            <div style="font-size: 11px; line-height: 1.5; color: #00ff88; font-family: monospace; text-align: left; word-break: keep-all;">
                [SUCCESS] 살둔 계곡 500m 통제 구역 이탈 성공.<br>
                [상태] 각성제 효과 종료 전 무사 생환 완료.<br>
                [조치] 본부 긴급 격리 해제 및 귀환 프로토콜 가동.
            </div>
        `;
    }
    
    openDarkWebAlert("🏆 [살둔 계곡 무사 생환]<br>축하합니다! 500m 경계 철책을 10분 내에 돌파하여 살둔 계곡 아기소 통제 구역에서 무사히 생환하셨습니다!");
}

// ==========================================
// CCTV Gaming Engine (EP.06 청림고등학교 2학년 3반 17번)
// ==========================================
let cctvHourEP6 = 8;
let cctvMinuteEP6 = 30;
let cctvTimerEP6 = null;
let cctvGameStateEP6 = 'idle';
let cctvNoiseAnimIdEP6 = null;

function initCCTVNoiseEP6() {
    const canvas = document.getElementById('cctv-noise-canvas-ep6');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = 160;
    canvas.height = 120;
    
    function drawNoiseEP6() {
        const cctvWin = document.getElementById('darkwebCCTVWindowEP6');
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
        cctvNoiseAnimIdEP6 = requestAnimationFrame(drawNoiseEP6);
    }
    
    if (cctvNoiseAnimIdEP6) cancelAnimationFrame(cctvNoiseAnimIdEP6);
    drawNoiseEP6();
}

function startCCTVGameEP6() {
    stopCCTVGameEP6();
    cctvHourEP6 = 8;
    cctvMinuteEP6 = 30;
    cctvGameStateEP6 = 'idle';
    
    const blackout = document.getElementById('cctv-blackout-ep6');
    if (blackout) blackout.style.display = 'none';
    
    const centerStatus = document.getElementById('cctv-center-status-ep6');
    if (centerStatus) {
        centerStatus.style.borderColor = '#00ff00';
        centerStatus.style.color = '#00ff00';
    }
    
    updateCCTVHUDEP6();
    const logsContainer = document.getElementById('cctv-logs-ep6');
    if (logsContainer) {
        logsContainer.innerHTML = '<div style="color: #888;">[SYSTEM] 청림고 2-3반 실시간 교실 감시 시스템 v6.17 로드 완료...</div>';
    }
    addCCTVLogEP6("[진입] 2학년 3반 아침 조회가 시작되었습니다. 출석부를 열고 아침 출석을 호명합니다.");
    
    playCCTVVideoEP6('school_idle.mp4', '[FEED: CLASS_2_3_IDLE]');
    clearCCTVChoicesEP6();
    
    cctvTimerEP6 = setInterval(tickCCTVGameEP6, 500);
    initCCTVNoiseEP6();
}

function stopCCTVGameEP6() {
    if (cctvTimerEP6) {
        clearInterval(cctvTimerEP6);
        cctvTimerEP6 = null;
    }
    const video = document.getElementById('cctv-video-ep6');
    if (video) video.pause();
    if (cctvNoiseAnimIdEP6) cancelAnimationFrame(cctvNoiseAnimIdEP6);
}

function playCCTVVideoEP6(src, fallbackText) {
    const video = document.getElementById('cctv-video-ep6');
    const centerStatus = document.getElementById('cctv-center-status-ep6');
    const offlineBg = document.getElementById('cctv-offline-bg-ep6');
    
    if (video) {
        video.muted = true;
        video.defaultMuted = true;
        video.playsInline = true;
        video.loop = true;
        video.style.zIndex = '2';
        video.style.display = 'block';
        if (video.setAttribute) {
            video.setAttribute('muted', '');
            video.setAttribute('playsinline', '');
            video.setAttribute('autoplay', '');
        }
        
        if (offlineBg) offlineBg.style.display = 'none';
        if (centerStatus) centerStatus.style.display = 'none';
        
        video.onloadeddata = () => {
            video.style.display = 'block';
            if (offlineBg) offlineBg.style.display = 'none';
            if (centerStatus) centerStatus.style.display = 'none';
        };
        video.onerror = () => {
            console.warn('playCCTVVideoEP6 video load error:', src);
            video.style.display = 'none';
            if (offlineBg) offlineBg.style.display = 'block';
            if (centerStatus) {
                centerStatus.style.display = 'block';
                centerStatus.textContent = fallbackText || 'FEED SIGNAL LOST';
            }
        };

        const currentSrc = video.getAttribute('src') || video.src || '';
        if (!currentSrc.endsWith(src)) {
            video.src = src;
        }
        
        const playPromise = video.play();
        if (playPromise !== undefined) {
            playPromise.then(() => {
                video.style.display = 'block';
                if (offlineBg) offlineBg.style.display = 'none';
                if (centerStatus) centerStatus.style.display = 'none';
            }).catch(err => {
                console.warn('playCCTVVideoEP6 autoplay note:', err);
                video.muted = true;
                video.play().catch(retryErr => {
                    console.warn('playCCTVVideoEP6 retry note:', retryErr);
                    if (fallbackText) {
                        video.style.display = 'none';
                        if (offlineBg) offlineBg.style.display = 'block';
                        if (centerStatus) {
                            centerStatus.style.display = 'block';
                            centerStatus.textContent = fallbackText;
                        }
                    }
                });
            });
        }
    }
}

function tickCCTVGameEP6() {
    cctvMinuteEP6 += 5;
    if (cctvMinuteEP6 >= 60) {
        cctvMinuteEP6 = 0;
        cctvHourEP6++;
    }
    
    updateCCTVHUDEP6();
    const timeStr = formatGameTime(cctvHourEP6, cctvMinuteEP6);
    
    if (timeStr === '08:35') {
        triggerEventA_EP6();
    } else if (timeStr === '10:15') {
        triggerEventB_EP6();
    } else if (timeStr === '13:40') {
        triggerEventC_EP6();
    } else if (timeStr === '16:30') {
        triggerEventD_EP6();
    }
}

function updateCCTVHUDEP6() {
    const timeDisplay = document.getElementById('cctv-time-display-ep6');
    const stateDisplay = document.getElementById('cctv-state-display-ep6');
    if (timeDisplay) {
        timeDisplay.textContent = `SCHOOL TIME: ${formatGameTime(cctvHourEP6, cctvMinuteEP6)}`;
    }
    if (stateDisplay) {
        if (cctvGameStateEP6 === 'idle') {
            stateDisplay.textContent = 'STATUS: NORMAL';
            stateDisplay.style.color = '#00ff00';
        } else if (cctvGameStateEP6 === 'death') {
            stateDisplay.textContent = 'STATUS: ERROR - FATAL';
            stateDisplay.style.color = '#ff0000';
        } else {
            stateDisplay.textContent = 'STATUS: WARNING - ANOMALY';
            stateDisplay.style.color = '#ffff00';
        }
    }
}

function addCCTVLogEP6(message, isWarning = false) {
    const logsContainer = document.getElementById('cctv-logs-ep6');
    if (!logsContainer) return;
    const timeStr = formatGameTime(cctvHourEP6, cctvMinuteEP6);
    const color = isWarning ? '#ff0000' : '#00ff00';
    const logDiv = document.createElement('div');
    logDiv.style.color = color;
    logDiv.textContent = `[${timeStr}] ${message}`;
    logsContainer.appendChild(logDiv);
    logsContainer.scrollTop = logsContainer.scrollHeight;
}

function clearCCTVChoicesEP6() {
    const container = document.getElementById('cctv-choices-container-ep6');
    if (container) {
        container.innerHTML = '<div style="color: #888; font-size: 11px;">[비정상 상황 발생 시 대응 선택지가 활성화됩니다]</div>';
    }
}

function setCCTVChoicesEP6(choices) {
    const container = document.getElementById('cctv-choices-container-ep6');
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

function triggerEventA_EP6() {
    clearInterval(cctvTimerEP6);
    cctvGameStateEP6 = 'event_A';
    updateCCTVHUDEP6();
    
    playCCTVVideoEP6('school_event_A.mp4', '[FEED: CALL_ATTENDANCE_17]');
    addCCTVLogEP6("[이벤트 A: 17번 호명] 17번 '박예림'을 부르는 순간 빈 뒷자리에서 \"네...\"라는 대답이 들립니다.", true);
    
    setCCTVChoicesEP6([
        {
            text: "[1] 소리가 난 17번 자리를 쳐다보며 출석 체크",
            action: () => {
                addCCTVLogEP6("[사망] 젖은 머리의 개체와 눈이 마주쳤고, 교무실 PC 모니터 앞에서 실종되었습니다.", true);
                triggerDeathEP6("17번 개체와 시선 접촉", "교무실 PC 모니터 앞 실종");
            }
        },
        {
            text: "[2] 고개를 들지 않고 출석부 보며 \"17번 박예림 결석\" 복창",
            action: () => {
                clearCCTVChoicesEP6();
                addCCTVLogEP6("[생존] 차가운 공기가 가라앉으며 18번 학생으로 정상 진행됩니다.", false);
                cctvGameStateEP6 = 'idle';
                playCCTVVideoEP6('school_idle.mp4', '[FEED: CLASS_2_3_IDLE]');
                cctvTimerEP6 = setInterval(tickCCTVGameEP6, 500);
            }
        }
    ]);
}

function triggerEventB_EP6() {
    clearInterval(cctvTimerEP6);
    cctvGameStateEP6 = 'event_B';
    updateCCTVHUDEP6();
    
    playCCTVVideoEP6('school_event_B.mp4', '[FEED: DOOR_KNOCK_ANOMALY]');
    addCCTVLogEP6("[이벤트 B: 문 두드림] 복도 쪽 문을 두드리며 \"선생님, 저 예림인데요... 문 좀 열어주세요...\" 목소리가 들립니다.", true);
    
    setCCTVChoicesEP6([
        {
            text: "[1] 불쌍한 마음에 다가가서 문을 열어준다",
            action: () => {
                addCCTVLogEP6("[사망] 교실 전체가 짠 바닷물에 잠기며 학급 인원 전체가 실종되었습니다.", true);
                triggerDeathEP6("교실 문 개방", "교실 전체 바닷물 침수 및 전원 실종");
            }
        },
        {
            text: "[2] 목소리를 무시하고 판서를 이어가며 수업 집중 지시",
            action: () => {
                clearCCTVChoicesEP6();
                addCCTVLogEP6("[생존] 문 밖의 흐느끼는 소리가 서서히 사라졌습니다.", false);
                cctvGameStateEP6 = 'idle';
                playCCTVVideoEP6('school_idle.mp4', '[FEED: CLASS_2_3_IDLE]');
                cctvTimerEP6 = setInterval(tickCCTVGameEP6, 500);
            }
        }
    ]);
}

function triggerEventC_EP6() {
    clearInterval(cctvTimerEP6);
    cctvGameStateEP6 = 'event_C';
    updateCCTVHUDEP6();
    
    playCCTVVideoEP6('school_event_C.mp4', '[FEED: GROUP_SYNCHRONIZATION]');
    addCCTVLogEP6("[이벤트 C: 학급 전체 비정상 동기화] 반 학생 전원이 고개를 90도 꺾어 교탁을 기괴하게 응시하기 시작합니다.", true);
    
    setCCTVChoicesEP6([
        {
            text: "[1] 겁에 질려 교실 앞문을 열고 복도로 뛰쳐나간다",
            action: () => {
                addCCTVLogEP6("[사망] 복도 끝에서 대기 중이던 개체에게 붙잡혀 사망했습니다.", true);
                triggerDeathEP6("복도 도주", "복도 끝 대기 개체에게 포획 사망");
            }
        },
        {
            text: "[2] 움직이지 않고 17번 빈 책상을 보며 한쪽 눈씩 깜빡임",
            action: () => {
                clearCCTVChoicesEP6();
                const blackout = document.getElementById('cctv-blackout-ep6');
                if (blackout) blackout.style.display = 'flex';
                addCCTVLogEP6("시선 고정 및 한쪽 눈 깜빡임 유지 중...", false);
                
                setTimeout(() => {
                    if (blackout) blackout.style.display = 'none';
                    addCCTVLogEP6("[생존] 3분 뒤 특별재난 관리본부 현장 대응팀이 진입하여 구출되었습니다.", false);
                    cctvGameStateEP6 = 'idle';
                    playCCTVVideoEP6('school_idle.mp4', '[FEED: CLASS_2_3_IDLE]');
                    cctvTimerEP6 = setInterval(tickCCTVGameEP6, 500);
                }, 2500);
            }
        }
    ]);
}

function triggerEventD_EP6() {
    clearInterval(cctvTimerEP6);
    cctvGameStateEP6 = 'event_D';
    updateCCTVHUDEP6();
    
    playCCTVVideoEP6('school_event_D.mp4', '[FEED: CLASS_DISMISSAL]');
    addCCTVLogEP6("[종례 및 종소리] 종례가 끝났습니다. 교실에 홀로 남아 교탁을 정리합니다.", true);
    
    setCCTVChoicesEP6([
        {
            text: "[1] 빈 책상에 묻은 소금기를 맨손으로 닦아낸다",
            action: () => {
                addCCTVLogEP6("[사망] 손에 바다 해조류가 자라나며 신체 변이가 일어났습니다.", true);
                triggerDeathEP6("미확인 염분 직접 접촉", "손에 바다 해조류 번식 및 신체 변이");
            }
        },
        {
            text: "[2] 교탁 서랍 속 전용 방향제 [SNS-0017]을 분사하고 퇴근",
            action: () => {
                clearCCTVChoicesEP6();
                triggerGameClearEP6();
            }
        }
    ]);
}

function triggerDeathEP6(reason, actionDesc) {
    cctvGameStateEP6 = 'death';
    updateCCTVHUDEP6();
    
    const video = document.getElementById('cctv-video-ep6');
    const centerStatus = document.getElementById('cctv-center-status-ep6');
    
    if (video) video.style.display = 'none';
    if (centerStatus) {
        centerStatus.style.display = 'block';
        centerStatus.style.borderColor = '#ff0000';
        centerStatus.style.color = '#ff0000';
        centerStatus.innerHTML = `
            <div style="font-size: 16px; font-weight: bold; margin-bottom: 8px; color: #ff0000; animation: blink 0.5s infinite;">☠️ SYSTEM FAILURE ☠️</div>
            <div style="font-size: 11px; line-height: 1.5; color: #ff3333; font-family: monospace; text-align: left; word-break: keep-all;">
                [ERROR] 2학년 3반 담임교사 생체 신호 소멸.<br>
                [원인] ${reason || '청림고 수칙 위반으로 인한 실종'}.<br>
                [조치] ${actionDesc || '교무실 잔존 소지품 수거'}.
            </div>
        `;
    }
    
    setCCTVChoicesEP6([
        {
            text: "재시도 (Retry)",
            action: () => {
                if (centerStatus) {
                    centerStatus.style.borderColor = '#00ff00';
                    centerStatus.style.color = '#00ff00';
                }
                startCCTVGameEP6();
            }
        }
    ]);
}

function triggerGameClearEP6() {
    cctvGameStateEP6 = 'win';
    updateCCTVHUDEP6();
    
    addCCTVLogEP6("[GOOD ENDING] 비린 냄새가 사라지고 무사히 하루를 마쳤습니다. 학기 생존 성공!", false);
    playCCTVVideoEP6('school_idle.mp4', '[SYSTEM: DAILY SHIFT END]');
    clearCCTVChoicesEP6();
    
    openDarkWebAlert("🏆 [무사 퇴근 성공]<br>축하합니다! 청림고등학교 2학년 3반 담임교사 수칙을 준수하여 무사히 하루를 마쳤습니다.");
}

// ==========================================
// CCTV Gaming Engine (EP.07 나눔 12 편의점 야간 근무)
// ==========================================
let cctvHourEP7 = 22;
let cctvMinuteEP7 = 0;
let cctvTimerEP7 = null;
let cctvGameStateEP7 = 'idle';
let cctvNoiseAnimIdEP7 = null;

function initCCTVNoiseEP7() {
    const canvas = document.getElementById('cctv-noise-canvas-ep7');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = 160;
    canvas.height = 120;
    
    function drawNoiseEP7() {
        const cctvWin = document.getElementById('darkwebCCTVWindowEP7');
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
        cctvNoiseAnimIdEP7 = requestAnimationFrame(drawNoiseEP7);
    }
    
    if (cctvNoiseAnimIdEP7) cancelAnimationFrame(cctvNoiseAnimIdEP7);
    drawNoiseEP7();
}

function startCCTVGameEP7() {
    stopCCTVGameEP7();
    cctvHourEP7 = 22;
    cctvMinuteEP7 = 0;
    cctvGameStateEP7 = 'idle';
    
    const blackout = document.getElementById('cctv-blackout-ep7');
    if (blackout) blackout.style.display = 'none';
    
    const centerStatus = document.getElementById('cctv-center-status-ep7');
    if (centerStatus) {
        centerStatus.style.borderColor = '#00ff00';
        centerStatus.style.color = '#00ff00';
    }
    
    updateCCTVHUDEP7();
    const logsContainer = document.getElementById('cctv-logs-ep7');
    if (logsContainer) {
        logsContainer.innerHTML = '<div style="color: #888;">[SYSTEM] 나눔 12 편의점 내부 보안 감시 시스템 v7.00 로드 완료...</div>';
    }
    addCCTVLogEP7("[근무 시작] 나눔 12시 편의점 야간 근무에 투입되었습니다. 카운터 포스기를 사수하십시오.");
    
    playCCTVVideoEP7('mart_idle.mp4', '[FEED: MART_COUNTER_IDLE]');
    clearCCTVChoicesEP7();
    
    cctvTimerEP7 = setInterval(tickCCTVGameEP7, 500);
    initCCTVNoiseEP7();
}

function stopCCTVGameEP7() {
    if (cctvTimerEP7) {
        clearInterval(cctvTimerEP7);
        cctvTimerEP7 = null;
    }
    const video = document.getElementById('cctv-video-ep7');
    if (video) video.pause();
    if (cctvNoiseAnimIdEP7) cancelAnimationFrame(cctvNoiseAnimIdEP7);
}

function playCCTVVideoEP7(src, fallbackText) {
    const video = document.getElementById('cctv-video-ep7');
    const centerStatus = document.getElementById('cctv-center-status-ep7');
    const offlineBg = document.getElementById('cctv-offline-bg-ep7');
    
    if (video) {
        video.muted = true;
        video.defaultMuted = true;
        video.playsInline = true;
        video.loop = true;
        video.style.zIndex = '2';
        video.style.display = 'block';
        if (video.setAttribute) {
            video.setAttribute('muted', '');
            video.setAttribute('playsinline', '');
            video.setAttribute('autoplay', '');
        }
        
        if (offlineBg) offlineBg.style.display = 'none';
        if (centerStatus) centerStatus.style.display = 'none';
        
        video.onloadeddata = () => {
            video.style.display = 'block';
            if (offlineBg) offlineBg.style.display = 'none';
            if (centerStatus) centerStatus.style.display = 'none';
        };
        video.onerror = () => {
            console.warn('playCCTVVideoEP7 video load error:', src);
            video.style.display = 'none';
            if (offlineBg) offlineBg.style.display = 'block';
            if (centerStatus) {
                centerStatus.style.display = 'block';
                centerStatus.textContent = fallbackText || 'FEED SIGNAL LOST';
            }
        };

        const currentSrc = video.getAttribute('src') || video.src || '';
        if (!currentSrc.endsWith(src)) {
            video.src = src;
        }
        
        const playPromise = video.play();
        if (playPromise !== undefined) {
            playPromise.then(() => {
                video.style.display = 'block';
                if (offlineBg) offlineBg.style.display = 'none';
                if (centerStatus) centerStatus.style.display = 'none';
            }).catch(err => {
                console.warn('playCCTVVideoEP7 autoplay note:', err);
                video.muted = true;
                video.play().catch(retryErr => {
                    console.warn('playCCTVVideoEP7 retry note:', retryErr);
                    if (fallbackText) {
                        video.style.display = 'none';
                        if (offlineBg) offlineBg.style.display = 'block';
                        if (centerStatus) {
                            centerStatus.style.display = 'block';
                            centerStatus.textContent = fallbackText;
                        }
                    }
                });
            });
        }
    }
}

function tickCCTVGameEP7() {
    cctvMinuteEP7 += 5;
    if (cctvMinuteEP7 >= 60) {
        cctvMinuteEP7 = 0;
        cctvHourEP7 = (cctvHourEP7 + 1) % 24;
    }
    
    updateCCTVHUDEP7();
    const timeStr = formatGameTime(cctvHourEP7, cctvMinuteEP7);
    
    if (timeStr === '00:30') {
        triggerEventA_EP7();
    } else if (timeStr === '02:15') {
        triggerEventB_EP7();
    } else if (timeStr === '04:00') {
        triggerEventC_EP7();
    } else if (timeStr === '06:00') {
        triggerEventD_EP7();
    }
}

function updateCCTVHUDEP7() {
    const timeDisplay = document.getElementById('cctv-time-display-ep7');
    const stateDisplay = document.getElementById('cctv-state-display-ep7');
    if (timeDisplay) {
        timeDisplay.textContent = `SHIFT TIME: ${formatGameTime(cctvHourEP7, cctvMinuteEP7)}`;
    }
    if (stateDisplay) {
        if (cctvGameStateEP7 === 'idle') {
            stateDisplay.textContent = 'STATUS: NORMAL';
            stateDisplay.style.color = '#00ff00';
        } else if (cctvGameStateEP7 === 'death') {
            stateDisplay.textContent = 'STATUS: ERROR - FATAL';
            stateDisplay.style.color = '#ff0000';
        } else {
            stateDisplay.textContent = 'STATUS: WARNING - ANOMALY';
            stateDisplay.style.color = '#ffff00';
        }
    }
}

function addCCTVLogEP7(message, isWarning = false) {
    const logsContainer = document.getElementById('cctv-logs-ep7');
    if (!logsContainer) return;
    const timeStr = formatGameTime(cctvHourEP7, cctvMinuteEP7);
    const color = isWarning ? '#ff0000' : '#00ff00';
    const logDiv = document.createElement('div');
    logDiv.style.color = color;
    logDiv.textContent = `[${timeStr}] ${message}`;
    logsContainer.appendChild(logDiv);
    logsContainer.scrollTop = logsContainer.scrollHeight;
}

function clearCCTVChoicesEP7() {
    const container = document.getElementById('cctv-choices-container-ep7');
    if (container) {
        container.innerHTML = '<div style="color: #888; font-size: 11px;">[비정상 상황 발생 시 대응 선택지가 활성화됩니다]</div>';
    }
}

function setCCTVChoicesEP7(choices) {
    const container = document.getElementById('cctv-choices-container-ep7');
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

function triggerEventA_EP7() {
    clearInterval(cctvTimerEP7);
    cctvGameStateEP7 = 'event_A';
    updateCCTVHUDEP7();
    
    playCCTVVideoEP7('mart_event_A.mp4', '[FEED: CONV_MIRROR_DISTORTION]');
    addCCTVLogEP7("[이벤트 A: 방범 거울 왜곡] 방범 거울에 끝없이 반복되는 통로가 비치며 손님이 다가옵니다.", true);
    
    setCCTVChoicesEP7([
        {
            text: "[1] 거울 속에 무엇이 있는지 눈을 크게 뜨고 자세히 관찰한다",
            action: () => {
                addCCTVLogEP7("[사망] 거울 속 통로로 빨려 들어가 상품 포장 안에서 신체 조각으로 발견되었습니다.", true);
                triggerDeathEP7("방범 거울 지속 응시", "거울 속 이계 흡수 및 분해");
            }
        },
        {
            text: "[2] 카드 결제기를 보는 척하며 슬쩍 시선만 옮겨 확인한다",
            action: () => {
                clearCCTVChoicesEP7();
                addCCTVLogEP7("[생존] 손님에게 들키지 않고 계산을 마친 뒤 조용히 퇴점했습니다.", false);
                cctvGameStateEP7 = 'idle';
                playCCTVVideoEP7('mart_idle.mp4', '[FEED: MART_COUNTER_IDLE]');
                cctvTimerEP7 = setInterval(tickCCTVGameEP7, 500);
            }
        }
    ]);
}

function triggerEventB_EP7() {
    clearInterval(cctvTimerEP7);
    cctvGameStateEP7 = 'event_B';
    updateCCTVHUDEP7();
    
    playCCTVVideoEP7('mart_event_B.mp4', '[FEED: ID_CARD_BLINK]');
    addCCTVLogEP7("[이벤트 B: 움직이는 신분증] 제시받은 신분증 사진 속 인물이 눈을 깜빡입니다.", true);
    
    setCCTVChoicesEP7([
        {
            text: "[1] 경악하며 신분증을 카운터 바닥으로 집어던진다",
            action: () => {
                addCCTVLogEP7("[사망] 개체의 적대 반응을 유발하여 즉사했습니다.", true);
                triggerDeathEP7("개체에 대한 돌발 행동", "적대 반응 유발 즉사");
            }
        },
        {
            text: "[2] 놀라지 않고 신분증을 받았을 때와 동일한 손짓과 속도로 공손히 반납",
            action: () => {
                clearCCTVChoicesEP7();
                addCCTVLogEP7("[생존] 개체가 만족하며 조용히 상품을 들고 문 밖으로 나갔습니다.", false);
                cctvGameStateEP7 = 'idle';
                playCCTVVideoEP7('mart_idle.mp4', '[FEED: MART_COUNTER_IDLE]');
                cctvTimerEP7 = setInterval(tickCCTVGameEP7, 500);
            }
        }
    ]);
}

function triggerEventC_EP7() {
    clearInterval(cctvTimerEP7);
    cctvGameStateEP7 = 'event_C';
    updateCCTVHUDEP7();
    
    playCCTVVideoEP7('mart_event_C.mp4', '[FEED: VOICE_OVERLAP]');
    addCCTVLogEP7("[이벤트 C: 음성 중첩] 손님의 목소리가 내 목소리와 완벽히 겹쳐 기괴하게 울립니다.", true);
    
    setCCTVChoicesEP7([
        {
            text: "[1] \"손님, 어떤 상품 찾으시나요?\"라며 입으로 대답한다",
            action: () => {
                addCCTVLogEP7("[사망] 목소리를 개체에게 영구 수탈당하고 진열대 틈새로 압사당했습니다.", true);
                triggerDeathEP7("음성 중첩 상태 발성", "목소리 수탈 및 진열대 압사");
            }
        },
        {
            text: "[2] 입을 열지 않고 손으로 포스 화면과 가격표를 가리켜 무언 응대",
            action: () => {
                clearCCTVChoicesEP7();
                addCCTVLogEP7("[생존] 손님이 결제 후 나갔습니다. 문 알림음과 손님 수가 일치합니다.", false);
                cctvGameStateEP7 = 'idle';
                playCCTVVideoEP7('mart_idle.mp4', '[FEED: MART_COUNTER_IDLE]');
                cctvTimerEP7 = setInterval(tickCCTVGameEP7, 500);
            }
        }
    ]);
}

function triggerEventD_EP7() {
    clearInterval(cctvTimerEP7);
    cctvGameStateEP7 = 'event_D';
    updateCCTVHUDEP7();
    
    playCCTVVideoEP7('mart_event_D.mp4', '[FEED: SUNRISE_DELAYED]');
    addCCTVLogEP7("[새벽 6시 지연] 오전 6시가 지났음에도 밖이 칠흑같이 어둡고 교대자가 오지 않습니다.", true);
    
    setCCTVChoicesEP7([
        {
            text: "[1] 퇴근 시간이 지났으므로 매장 자동문을 열고 밖으로 걸어 나간다",
            action: () => {
                addCCTVLogEP7("[사망] 어둠 속 다른 지역 개체에게 끌려가 영구 실종되었습니다.", true);
                triggerDeathEP7("비정상 일출 시간 무단 이탈", "어둠 속 이계 실종");
            }
        },
        {
            text: "[2] 밖으로 나가지 않고 카운터 안쪽에서 앱 '근무 종료' 버튼을 연타한다",
            action: () => {
                clearCCTVChoicesEP7();
                const blackout = document.getElementById('cctv-blackout-ep7');
                if (blackout) blackout.style.display = 'flex';
                addCCTVLogEP7("구인 앱 서버 통신 및 근무 종료 신호 전송 중...", false);
                
                setTimeout(() => {
                    if (blackout) blackout.style.display = 'none';
                    triggerGameClearEP7();
                }, 2000);
            }
        }
    ]);
}

function triggerDeathEP7(reason, actionDesc) {
    cctvGameStateEP7 = 'death';
    updateCCTVHUDEP7();
    
    const video = document.getElementById('cctv-video-ep7');
    const centerStatus = document.getElementById('cctv-center-status-ep7');
    
    if (video) video.style.display = 'none';
    if (centerStatus) {
        centerStatus.style.display = 'block';
        centerStatus.style.borderColor = '#ff0000';
        centerStatus.style.color = '#ff0000';
        centerStatus.innerHTML = `
            <div style="font-size: 16px; font-weight: bold; margin-bottom: 8px; color: #ff0000; animation: blink 0.5s infinite;">☠️ SYSTEM FAILURE ☠️</div>
            <div style="font-size: 11px; line-height: 1.5; color: #ff3333; font-family: monospace; text-align: left; word-break: keep-all;">
                [ERROR] 편의점 근무자 생체 신호 소멸.<br>
                [원인] ${reason || '편의점 야간 근무 수칙 위반'}.<br>
                [조치] ${actionDesc || '매장 내부 잔류물 수거 및 결손 처리'}.
            </div>
        `;
    }
    
    setCCTVChoicesEP7([
        {
            text: "재시도 (Retry)",
            action: () => {
                if (centerStatus) {
                    centerStatus.style.borderColor = '#00ff00';
                    centerStatus.style.color = '#00ff00';
                }
                startCCTVGameEP7();
            }
        }
    ]);
}

function triggerGameClearEP7() {
    cctvGameStateEP7 = 'win';
    updateCCTVHUDEP7();
    
    addCCTVLogEP7("[GOOD ENDING] 알림음과 함께 밖이 환해지며 정상 퇴근 처리되었습니다. 야간 근무 생환 성공!", false);
    playCCTVVideoEP7('mart_idle.mp4', '[SYSTEM: SHIFT COMPLETE]');
    clearCCTVChoicesEP7();
    
    openDarkWebAlert("🏆 [무사 퇴근 성공]<br>축하합니다! 나눔 12 편의점 야간 근무 수칙을 준수하여 무사히 아침 퇴근에 성공하셨습니다.");
}

// ==========================================
// CCTV Gaming Engine (EP.08 유성 워터파크)
// ==========================================
let cctvHourEP8 = 10;
let cctvMinuteEP8 = 0;
let cctvTimerEP8 = null;
let cctvGameStateEP8 = 'idle';
let cctvNoiseAnimIdEP8 = null;

function initCCTVNoiseEP8() {
    const canvas = document.getElementById('cctv-noise-canvas-ep8');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = 160;
    canvas.height = 120;
    
    function drawNoiseEP8() {
        const cctvWin = document.getElementById('darkwebCCTVWindowEP8');
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
        cctvNoiseAnimIdEP8 = requestAnimationFrame(drawNoiseEP8);
    }
    
    if (cctvNoiseAnimIdEP8) cancelAnimationFrame(cctvNoiseAnimIdEP8);
    drawNoiseEP8();
}

function startCCTVGameEP8() {
    stopCCTVGameEP8();
    cctvHourEP8 = 10;
    cctvMinuteEP8 = 0;
    cctvGameStateEP8 = 'idle';
    
    const blackout = document.getElementById('cctv-blackout-ep8');
    if (blackout) blackout.style.display = 'none';
    
    const centerStatus = document.getElementById('cctv-center-status-ep8');
    if (centerStatus) {
        centerStatus.style.borderColor = '#00ff00';
        centerStatus.style.color = '#00ff00';
    }
    
    updateCCTVHUDEP8();
    const logsContainer = document.getElementById('cctv-logs-ep8');
    if (logsContainer) {
        logsContainer.innerHTML = '<div style="color: #888;">[SYSTEM] 유성 워터파크 중앙 관제 시스템 v8.00 로드 완료...</div>';
    }
    addCCTVLogEP8("[입장] 전자 손목 밴드를 착용하고 워터파크에 입장했습니다.");
    
    playCCTVVideoEP8('waterpark_idle.mp4', '[FEED: WATERPARK_POOL_IDLE]');
    clearCCTVChoicesEP8();
    
    cctvTimerEP8 = setInterval(tickCCTVGameEP8, 500);
    initCCTVNoiseEP8();
}

function stopCCTVGameEP8() {
    if (cctvTimerEP8) {
        clearInterval(cctvTimerEP8);
        cctvTimerEP8 = null;
    }
    const video = document.getElementById('cctv-video-ep8');
    if (video) video.pause();
    if (cctvNoiseAnimIdEP8) cancelAnimationFrame(cctvNoiseAnimIdEP8);
}

function playCCTVVideoEP8(src, fallbackText) {
    const video = document.getElementById('cctv-video-ep8');
    const centerStatus = document.getElementById('cctv-center-status-ep8');
    const offlineBg = document.getElementById('cctv-offline-bg-ep8');
    
    if (video) {
        video.muted = true;
        video.defaultMuted = true;
        video.playsInline = true;
        video.loop = true;
        video.style.zIndex = '2';
        video.style.display = 'block';
        if (video.setAttribute) {
            video.setAttribute('muted', '');
            video.setAttribute('playsinline', '');
            video.setAttribute('autoplay', '');
        }
        
        if (offlineBg) offlineBg.style.display = 'none';
        if (centerStatus) centerStatus.style.display = 'none';
        
        video.onloadeddata = () => {
            video.style.display = 'block';
            if (offlineBg) offlineBg.style.display = 'none';
            if (centerStatus) centerStatus.style.display = 'none';
        };
        video.onerror = () => {
            console.warn('playCCTVVideoEP8 video load error:', src);
            video.style.display = 'none';
            if (offlineBg) offlineBg.style.display = 'block';
            if (centerStatus) {
                centerStatus.style.display = 'block';
                centerStatus.textContent = fallbackText || 'FEED SIGNAL LOST';
            }
        };

        const currentSrc = video.getAttribute('src') || video.src || '';
        if (!currentSrc.endsWith(src)) {
            video.src = src;
        }
        
        const playPromise = video.play();
        if (playPromise !== undefined) {
            playPromise.then(() => {
                video.style.display = 'block';
                if (offlineBg) offlineBg.style.display = 'none';
                if (centerStatus) centerStatus.style.display = 'none';
            }).catch(err => {
                console.warn('playCCTVVideoEP8 autoplay note:', err);
                video.muted = true;
                video.play().catch(retryErr => {
                    console.warn('playCCTVVideoEP8 retry note:', retryErr);
                    if (fallbackText) {
                        video.style.display = 'none';
                        if (offlineBg) offlineBg.style.display = 'block';
                        if (centerStatus) {
                            centerStatus.style.display = 'block';
                            centerStatus.textContent = fallbackText;
                        }
                    }
                });
            });
        }
    }
}

function tickCCTVGameEP8() {
    cctvMinuteEP8 += 5;
    if (cctvMinuteEP8 >= 60) {
        cctvMinuteEP8 = 0;
        cctvHourEP8++;
    }
    
    updateCCTVHUDEP8();
    const timeStr = formatGameTime(cctvHourEP8, cctvMinuteEP8);
    
    if (timeStr === '11:30') {
        triggerEventA_EP8();
    } else if (timeStr === '13:40') {
        triggerEventB_EP8();
    } else if (timeStr === '15:20') {
        triggerEventC_EP8();
    } else if (timeStr === '18:00') {
        triggerEventD_EP8();
    }
}

function updateCCTVHUDEP8() {
    const timeDisplay = document.getElementById('cctv-time-display-ep8');
    const stateDisplay = document.getElementById('cctv-state-display-ep8');
    if (timeDisplay) {
        timeDisplay.textContent = `PARK TIME: ${formatGameTime(cctvHourEP8, cctvMinuteEP8)}`;
    }
    if (stateDisplay) {
        if (cctvGameStateEP8 === 'idle') {
            stateDisplay.textContent = 'STATUS: NORMAL';
            stateDisplay.style.color = '#00ff00';
        } else if (cctvGameStateEP8 === 'death') {
            stateDisplay.textContent = 'STATUS: ERROR - FATAL';
            stateDisplay.style.color = '#ff0000';
        } else {
            stateDisplay.textContent = 'STATUS: WARNING - ANOMALY';
            stateDisplay.style.color = '#ffff00';
        }
    }
}

function addCCTVLogEP8(message, isWarning = false) {
    const logsContainer = document.getElementById('cctv-logs-ep8');
    if (!logsContainer) return;
    const timeStr = formatGameTime(cctvHourEP8, cctvMinuteEP8);
    const color = isWarning ? '#ff0000' : '#00ff00';
    const logDiv = document.createElement('div');
    logDiv.style.color = color;
    logDiv.textContent = `[${timeStr}] ${message}`;
    logsContainer.appendChild(logDiv);
    logsContainer.scrollTop = logsContainer.scrollHeight;
}

function clearCCTVChoicesEP8() {
    const container = document.getElementById('cctv-choices-container-ep8');
    if (container) {
        container.innerHTML = '<div style="color: #888; font-size: 11px;">[비정상 상황 발생 시 대응 선택지가 활성화됩니다]</div>';
    }
}

function setCCTVChoicesEP8(choices) {
    const container = document.getElementById('cctv-choices-container-ep8');
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

function triggerEventA_EP8() {
    clearInterval(cctvTimerEP8);
    cctvGameStateEP8 = 'event_A';
    updateCCTVHUDEP8();
    
    playCCTVVideoEP8('waterpark_event_A.mp4', '[FEED: MEGA_SLIDE_4TH_CURVE]');
    addCCTVLogEP8("[이벤트 A: 메가 슬라이드] 3번째 곡선을 지났으나 끝나지 않고 '네 번째 곡선'이 나타납니다.", true);
    
    setCCTVChoicesEP8([
        {
            text: "[1] 스피드를 즐기며 끝까지 미끄러져 내려간다",
            action: () => {
                addCCTVLogEP8("[사망] 도착 지점이 아닌 지하 수술실로 직행하여 마취 없이 개복되었습니다.", true);
                triggerDeathEP8("슬라이드 이탈 실패", "지하 수술실 직행 및 무마취 개복");
            }
        },
        {
            text: "[2] 팔다리를 벌려 벽에 몸을 마찰시켜 멈춘 뒤 비상 버튼 누름",
            action: () => {
                clearCCTVChoicesEP8();
                const blackout = document.getElementById('cctv-blackout-ep8');
                if (blackout) blackout.style.display = 'flex';
                addCCTVLogEP8("비상 정지 후 특수 구조 요원 견인 중...", false);
                
                setTimeout(() => {
                    if (blackout) blackout.style.display = 'none';
                    addCCTVLogEP8("[생존] 슬라이드 점검구를 통해 안전 구역으로 견인되었습니다.", false);
                    cctvGameStateEP8 = 'idle';
                    playCCTVVideoEP8('waterpark_idle.mp4', '[FEED: WATERPARK_POOL_IDLE]');
                    cctvTimerEP8 = setInterval(tickCCTVGameEP8, 500);
                }, 2000);
            }
        }
    ]);
}

function triggerEventB_EP8() {
    clearInterval(cctvTimerEP8);
    cctvGameStateEP8 = 'event_B';
    updateCCTVHUDEP8();
    
    playCCTVVideoEP8('waterpark_event_B.mp4', '[FEED: FOOD_COURT_QUESTION]');
    addCCTVLogEP8("[이벤트 B: 푸드코트 점심] 보라색 음식이 나오고 직원이 묻습니다. \"손님, 언제 수술이십니까?\"", true);
    
    setCCTVChoicesEP8([
        {
            text: "[1] \"저 수술 환자 아닌데요? 취소해 주세요.\" 따진다",
            action: () => {
                addCCTVLogEP8("[사망] 불응 환자로 분류되어 특별 관리실로 끌려갔습니다.", true);
                triggerDeathEP8("지시 불응 및 항의", "특별 관리실 강제 이송");
            }
        },
        {
            text: "[2] \"오늘은 아닙니다.\" 단호하고 침착하게 답한다",
            action: () => {
                clearCCTVChoicesEP8();
                addCCTVLogEP8("[생존] 직원이 고개를 끄덕이고 조용히 물러났습니다.", false);
                cctvGameStateEP8 = 'idle';
                playCCTVVideoEP8('waterpark_idle.mp4', '[FEED: WATERPARK_POOL_IDLE]');
                cctvTimerEP8 = setInterval(tickCCTVGameEP8, 500);
            }
        }
    ]);
}

function triggerEventC_EP8() {
    clearInterval(cctvTimerEP8);
    cctvGameStateEP8 = 'event_C';
    updateCCTVHUDEP8();
    
    playCCTVVideoEP8('waterpark_event_C.mp4', '[FEED: KIDS_ZONE_MASCOT]');
    addCCTVLogEP8("[이벤트 C: 키즈존 단독 캐릭터] 인솔 요원 없이 혼자 휘청거리며 걸어오는 거대한 캐릭터 인형을 발견했습니다.", true);
    
    setCCTVChoicesEP8([
        {
            text: "[1] 사진을 찍기 위해 다가가서 손을 흔든다",
            action: () => {
                addCCTVLogEP8("[사망] 캐릭터 내부로 끌려들어가 폐장 후 으깨진 채 발견되었습니다.", true);
                triggerDeathEP8("인형 개체 접근", "캐릭터 내부 압사");
            }
        },
        {
            text: "[2] 등을 보이지 않고 시선 유지하며 인파 쪽으로 뒷걸음질",
            action: () => {
                clearCCTVChoicesEP8();
                addCCTVLogEP8("[생존] 인파 속으로 섞여 들어가며 캐릭터의 추적을 따돌렸습니다.", false);
                cctvGameStateEP8 = 'idle';
                playCCTVVideoEP8('waterpark_idle.mp4', '[FEED: WATERPARK_POOL_IDLE]');
                cctvTimerEP8 = setInterval(tickCCTVGameEP8, 500);
            }
        }
    ]);
}

function triggerEventD_EP8() {
    clearInterval(cctvTimerEP8);
    cctvGameStateEP8 = 'event_D';
    updateCCTVHUDEP8();
    
    playCCTVVideoEP8('waterpark_event_D.mp4', '[FEED: SETTLEMENT_COUNTER]');
    addCCTVLogEP8("[폐장 및 정산] 오후 6시 폐장. 밴드 정산소에 쓰지도 않은 80만 원이 청구되어 있습니다.", true);
    
    setCCTVChoicesEP8([
        {
            text: "[1] \"이거 잘못 찍힌 거다!\" 환불 및 재정산 요구",
            action: () => {
                addCCTVLogEP8("[사망] 게이트가 닫히고 분실물 센터로 강제 이송되었습니다.", true);
                triggerDeathEP8("정산 이의 제기", "분실물 센터 강제 이송");
            }
        },
        {
            text: "[2] 이의 없이 카드로 전액 결제 후 밴드 반납",
            action: () => {
                clearCCTVChoicesEP8();
                triggerGameClearEP8();
            }
        }
    ]);
}

function triggerDeathEP8(reason, actionDesc) {
    cctvGameStateEP8 = 'death';
    updateCCTVHUDEP8();
    
    const video = document.getElementById('cctv-video-ep8');
    const centerStatus = document.getElementById('cctv-center-status-ep8');
    
    if (video) video.style.display = 'none';
    if (centerStatus) {
        centerStatus.style.display = 'block';
        centerStatus.style.borderColor = '#ff0000';
        centerStatus.style.color = '#ff0000';
        centerStatus.innerHTML = `
            <div style="font-size: 16px; font-weight: bold; margin-bottom: 8px; color: #ff0000; animation: blink 0.5s infinite;">☠️ SYSTEM FAILURE ☠️</div>
            <div style="font-size: 11px; line-height: 1.5; color: #ff3333; font-family: monospace; text-align: left; word-break: keep-all;">
                [ERROR] 워터파크 입장객 생체 신호 소멸.<br>
                [원인] ${reason || '워터파크 안전 수칙 위반'}.<br>
                [조치] ${actionDesc || '지하 폐기물실 유해 수거'}.
            </div>
        `;
    }
    
    setCCTVChoicesEP8([
        {
            text: "재시도 (Retry)",
            action: () => {
                if (centerStatus) {
                    centerStatus.style.borderColor = '#00ff00';
                    centerStatus.style.color = '#00ff00';
                }
                startCCTVGameEP8();
            }
        }
    ]);
}

function triggerGameClearEP8() {
    cctvGameStateEP8 = 'win';
    updateCCTVHUDEP8();
    
    addCCTVLogEP8("[GOOD ENDING] 회전문이 열리며 워터파크 정문 밖으로 무사히 빠져나왔습니다. 생환 성공!", false);
    playCCTVVideoEP8('waterpark_idle.mp4', '[SYSTEM: ESCAPE COMPLETE]');
    clearCCTVChoicesEP8();
    
    openDarkWebAlert("🏆 [무사 퇴장 성공]<br>축하합니다! 유성 워터파크에서 무사히 정문을 빠져나와 생환에 성공하셨습니다.");
}

// ==========================================
// CCTV Gaming Engine (EP.09 안전 안내 문자 - FINAL)
// ==========================================
let cctvHourEP9 = 0;
let cctvMinuteEP9 = 0;
let cctvTimerEP9 = null;
let cctvGameStateEP9 = 'idle';
let cctvNoiseAnimIdEP9 = null;

function initCCTVNoiseEP9() {
    const canvas = document.getElementById('cctv-noise-canvas-ep9');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = 160;
    canvas.height = 120;
    
    function drawNoiseEP9() {
        const cctvWin = document.getElementById('darkwebCCTVWindowEP9');
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
        cctvNoiseAnimIdEP9 = requestAnimationFrame(drawNoiseEP9);
    }
    
    if (cctvNoiseAnimIdEP9) cancelAnimationFrame(cctvNoiseAnimIdEP9);
    drawNoiseEP9();
}

function startCCTVGameEP9() {
    stopCCTVGameEP9();
    cctvHourEP9 = 0;
    cctvMinuteEP9 = 0;
    cctvGameStateEP9 = 'idle';
    
    const blackout = document.getElementById('cctv-blackout-ep9');
    if (blackout) blackout.style.display = 'none';
    
    const centerStatus = document.getElementById('cctv-center-status-ep9');
    if (centerStatus) {
        centerStatus.style.borderColor = '#00ff00';
        centerStatus.style.color = '#00ff00';
    }
    
    updateCCTVHUDEP9();
    const logsContainer = document.getElementById('cctv-logs-ep9');
    if (logsContainer) {
        logsContainer.innerHTML = '<div style="color: #888;">[SYSTEM] 스마트폰 통신망 해킹 감시 콘솔 v9.99 로드 완료...</div>';
    }
    addCCTVLogEP9("[오염 감지] 단말기가 특별재난 관리본부 관리 대상 번호로 자동 지정되었습니다.");
    
    playCCTVVideoEP9('sms_idle.mp4', '[FEED: CELLULAR_LINK_IDLE]');
    clearCCTVChoicesEP9();
    
    cctvTimerEP9 = setInterval(tickCCTVGameEP9, 400);
    initCCTVNoiseEP9();
}

function stopCCTVGameEP9() {
    if (cctvTimerEP9) {
        clearInterval(cctvTimerEP9);
        cctvTimerEP9 = null;
    }
    const video = document.getElementById('cctv-video-ep9');
    if (video) video.pause();
    if (cctvNoiseAnimIdEP9) cancelAnimationFrame(cctvNoiseAnimIdEP9);
}

function playCCTVVideoEP9(src, fallbackText) {
    const video = document.getElementById('cctv-video-ep9');
    const centerStatus = document.getElementById('cctv-center-status-ep9');
    const offlineBg = document.getElementById('cctv-offline-bg-ep9');
    
    if (video) {
        video.muted = true;
        video.defaultMuted = true;
        video.playsInline = true;
        video.loop = true;
        video.style.zIndex = '2';
        video.style.display = 'block';
        if (video.setAttribute) {
            video.setAttribute('muted', '');
            video.setAttribute('playsinline', '');
            video.setAttribute('autoplay', '');
        }
        
        if (offlineBg) offlineBg.style.display = 'none';
        if (centerStatus) centerStatus.style.display = 'none';
        
        video.onloadeddata = () => {
            video.style.display = 'block';
            if (offlineBg) offlineBg.style.display = 'none';
            if (centerStatus) centerStatus.style.display = 'none';
        };
        video.onerror = () => {
            console.warn('playCCTVVideoEP9 video load error:', src);
            video.style.display = 'none';
            if (offlineBg) offlineBg.style.display = 'block';
            if (centerStatus) {
                centerStatus.style.display = 'block';
                centerStatus.textContent = fallbackText || 'FEED SIGNAL LOST';
            }
        };

        const currentSrc = video.getAttribute('src') || video.src || '';
        if (!currentSrc.endsWith(src)) {
            video.src = src;
        }
        
        const playPromise = video.play();
        if (playPromise !== undefined) {
            playPromise.then(() => {
                video.style.display = 'block';
                if (offlineBg) offlineBg.style.display = 'none';
                if (centerStatus) centerStatus.style.display = 'none';
            }).catch(err => {
                console.warn('playCCTVVideoEP9 autoplay note:', err);
                video.muted = true;
                video.play().catch(retryErr => {
                    console.warn('playCCTVVideoEP9 retry note:', retryErr);
                    if (fallbackText) {
                        video.style.display = 'none';
                        if (offlineBg) offlineBg.style.display = 'block';
                        if (centerStatus) {
                            centerStatus.style.display = 'block';
                            centerStatus.textContent = fallbackText;
                        }
                    }
                });
            });
        }
    }
}

function tickCCTVGameEP9() {
    cctvMinuteEP9 += 2;
    if (cctvMinuteEP9 >= 60) {
        cctvMinuteEP9 = 0;
        cctvHourEP9++;
    }
    
    updateCCTVHUDEP9();
    const timeStr = formatGameTime(cctvHourEP9, cctvMinuteEP9);
    
    if (timeStr === '00:14') {
        triggerEventA_EP9();
    } else if (timeStr === '01:40') {
        triggerEventB_EP9();
    } else if (timeStr === '02:50') {
        triggerEventC_EP9();
    } else if (timeStr === '04:10') {
        triggerEventD_EP9();
    } else if (timeStr === '05:30') {
        triggerEventE_EP9();
    }
}

function updateCCTVHUDEP9() {
    const timeDisplay = document.getElementById('cctv-time-display-ep9');
    const stateDisplay = document.getElementById('cctv-state-display-ep9');
    if (timeDisplay) {
        timeDisplay.textContent = `TIME: ${formatGameTime(cctvHourEP9, cctvMinuteEP9)}`;
    }
    if (stateDisplay) {
        if (cctvGameStateEP9 === 'idle') {
            stateDisplay.textContent = 'STATUS: NORMAL';
            stateDisplay.style.color = '#00ff00';
        } else if (cctvGameStateEP9 === 'death') {
            stateDisplay.textContent = 'STATUS: ERROR - FATAL';
            stateDisplay.style.color = '#ff0000';
        } else {
            stateDisplay.textContent = 'STATUS: WARNING - ANOMALY';
            stateDisplay.style.color = '#ffff00';
        }
    }
}

function addCCTVLogEP9(message, isWarning = false) {
    const logsContainer = document.getElementById('cctv-logs-ep9');
    if (!logsContainer) return;
    const timeStr = formatGameTime(cctvHourEP9, cctvMinuteEP9);
    const color = isWarning ? '#ff0000' : '#00ff00';
    const logDiv = document.createElement('div');
    logDiv.style.color = color;
    logDiv.textContent = `[${timeStr}] ${message}`;
    logsContainer.appendChild(logDiv);
    logsContainer.scrollTop = logsContainer.scrollHeight;
}

function clearCCTVChoicesEP9() {
    const container = document.getElementById('cctv-choices-container-ep9');
    if (container) {
        container.innerHTML = '<div style="color: #888; font-size: 11px;">[비정상 상황 발생 시 대응 선택지가 활성화됩니다]</div>';
    }
}

function setCCTVChoicesEP9(choices) {
    const container = document.getElementById('cctv-choices-container-ep9');
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

function triggerEventA_EP9() {
    clearInterval(cctvTimerEP9);
    cctvGameStateEP9 = 'event_A';
    updateCCTVHUDEP9();
    
    playCCTVVideoEP9('sms_event_A.mp4', '[FEED: MISSED_CALL_SMS]');
    addCCTVLogEP9("[이벤트 A: 부재중 전화] [010-XXXX-XXXX 부재중 1건] 문자가 수신되었습니다.", true);
    
    setCCTVChoicesEP9([
        {
            text: "[1] 모르는 번호이므로 문자를 삭제하고 무시",
            action: () => {
                addCCTVLogEP9("[사망] 발신 기록 미생성으로 익일 원인 불명의 심장마비로 사망했습니다.", true);
                triggerDeathEP9("발신 로그 미생성", "익일 원인 불명의 심장마비 사망");
            }
        },
        {
            text: "[2] 즉시 전화를 걸고 연결음 넘어가자마자 바로 통화 종료",
            action: () => {
                clearCCTVChoicesEP9();
                addCCTVLogEP9("[생존] 발신 로그가 정상 등록되어 사망 플래그를 회피했습니다.", false);
                cctvGameStateEP9 = 'idle';
                playCCTVVideoEP9('sms_idle.mp4', '[FEED: CELLULAR_LINK_IDLE]');
                cctvTimerEP9 = setInterval(tickCCTVGameEP9, 400);
            }
        }
    ]);
}

function triggerEventB_EP9() {
    clearInterval(cctvTimerEP9);
    cctvGameStateEP9 = 'event_B';
    updateCCTVHUDEP9();
    
    playCCTVVideoEP9('sms_event_B.mp4', '[FEED: VIDEO_CALL_GIANT_EYES]');
    addCCTVLogEP9("[이벤트 B: 영상 통화] 화면 속에 얼굴을 바짝 들이민 눈이 거대한 남성이 노려보고 있습니다.", true);
    
    setCCTVChoicesEP9([
        {
            text: "[1] 무서워서 통화 거절 버튼을 누르고 화면을 엎어둠",
            action: () => {
                addCCTVLogEP9("[사망] 시선을 돌린 대가로 온 사방에서 남자의 얼굴이 보이다 쇼크사했습니다.", true);
                triggerDeathEP9("시선 회피 및 통화 거절", "온 사방 환시 및 쇼크사");
            }
        },
        {
            text: "[2] 받지도 끊지도 않은 채 남자의 눈을 끝까지 노려본다",
            action: () => {
                clearCCTVChoicesEP9();
                addCCTVLogEP9("[생존] 남자가 기괴한 미소를 지으며 스스로 통화 신호를 끊었습니다.", false);
                cctvGameStateEP9 = 'idle';
                playCCTVVideoEP9('sms_idle.mp4', '[FEED: CELLULAR_LINK_IDLE]');
                cctvTimerEP9 = setInterval(tickCCTVGameEP9, 400);
            }
        }
    ]);
}

function triggerEventC_EP9() {
    clearInterval(cctvTimerEP9);
    cctvGameStateEP9 = 'event_C';
    updateCCTVHUDEP9();
    
    playCCTVVideoEP9('sms_event_C.mp4', '[FEED: SCREAMING_RINGTONE]');
    addCCTVLogEP9("[이벤트 C: 비명 벨소리] 스마트폰 스피커에서 처절한 비명 소리가 벨소리로 울려 퍼집니다.", true);
    
    setCCTVChoicesEP9([
        {
            text: "[1] 소리가 끔찍해 첫 번째 비명이 울리자마자 거절 누름",
            action: () => {
                addCCTVLogEP9("[사망] 고막이 완전히 파열되고 개체의 표적이 되어 사망했습니다.", true);
                triggerDeathEP9("타이밍 불일치 거절", "고막 파열 및 개체 표적화 사망");
            }
        },
        {
            text: "[2] 비명 수를 세어, 다섯 번째 비명이 끊기는 순간 거절",
            action: () => {
                clearCCTVChoicesEP9();
                const blackout = document.getElementById('cctv-blackout-ep9');
                if (blackout) blackout.style.display = 'flex';
                addCCTVLogEP9("비명 5회 카운트 및 수신 거절 성공...", false);
                
                setTimeout(() => {
                    if (blackout) blackout.style.display = 'none';
                    addCCTVLogEP9("[생존] 정확한 타이밍 제어로 통신 오염을 물리쳤습니다.", false);
                    cctvGameStateEP9 = 'idle';
                    playCCTVVideoEP9('sms_idle.mp4', '[FEED: CELLULAR_LINK_IDLE]');
                    cctvTimerEP9 = setInterval(tickCCTVGameEP9, 400);
                }, 2000);
            }
        }
    ]);
}

function triggerEventD_EP9() {
    clearInterval(cctvTimerEP9);
    cctvGameStateEP9 = 'event_D';
    updateCCTVHUDEP9();
    
    playCCTVVideoEP9('sms_event_D.mp4', '[FEED: HEADQUARTERS_IMPERSONATION]');
    addCCTVLogEP9("[이벤트 D: 본부 사칭 전화] [0050-0] \"본부 요원입니다. 구출을 위해 현재 계신 위치를 말씀해 주십시오\"", true);
    
    setCCTVChoicesEP9([
        {
            text: "[1] 안도하며 현재 방 안 상세 주소를 불러준다",
            action: () => {
                addCCTVLogEP9("[사망] 본부를 사칭한 테러리스트 개체들이 진입하여 몰살당했습니다.", true);
                triggerDeathEP9("사칭 세력에 위치 누설", "테러리스트 개체 난입 및 몰살");
            }
        },
        {
            text: "[2] 위치를 묻자마자 가짜임을 인지하고 즉시 끊어 차단",
            action: () => {
                clearCCTVChoicesEP9();
                addCCTVLogEP9("[생존] 사칭 세력의 역추적을 차단했습니다.", false);
                cctvGameStateEP9 = 'idle';
                playCCTVVideoEP9('sms_idle.mp4', '[FEED: CELLULAR_LINK_IDLE]');
                cctvTimerEP9 = setInterval(tickCCTVGameEP9, 400);
            }
        }
    ]);
}

function triggerEventE_EP9() {
    clearInterval(cctvTimerEP9);
    cctvGameStateEP9 = 'event_E';
    updateCCTVHUDEP9();
    
    playCCTVVideoEP9('sms_event_E.mp4', '[FEED: 4X_AUTH_CODE_FLOOD]');
    addCCTVLogEP9("[FINAL: 인증 번호 전송] 6자리 본인 인증 문자가 1초 간격으로 연속 4번 쏟아집니다.", true);
    
    setCCTVChoicesEP9([
        {
            text: "[1] 가장 최근에 온 네 번째 인증 번호를 입력",
            action: () => {
                addCCTVLogEP9("[사망] 오인증으로 긴급 구조 프로토콜이 파기되었습니다.", true);
                triggerDeathEP9("오인증 번호 입력", "긴급 구조 프로토콜 파기 및 오염");
            }
        },
        {
            text: "[2] '세 번째로 수신된 인증 번호'를 정확히 입력",
            action: () => {
                clearCCTVChoicesEP9();
                triggerGameClearEP9();
            }
        }
    ]);
}

function triggerDeathEP9(reason, actionDesc) {
    cctvGameStateEP9 = 'death';
    updateCCTVHUDEP9();
    
    const video = document.getElementById('cctv-video-ep9');
    const centerStatus = document.getElementById('cctv-center-status-ep9');
    
    if (video) video.style.display = 'none';
    if (centerStatus) {
        centerStatus.style.display = 'block';
        centerStatus.style.borderColor = '#ff0000';
        centerStatus.style.color = '#ff0000';
        centerStatus.innerHTML = `
            <div style="font-size: 16px; font-weight: bold; margin-bottom: 8px; color: #ff0000; animation: blink 0.5s infinite;">☠️ SYSTEM FAILURE ☠️</div>
            <div style="font-size: 11px; line-height: 1.5; color: #ff3333; font-family: monospace; text-align: left; word-break: keep-all;">
                [ERROR] 단말기 사용자 통신 신호 소멸.<br>
                [원인] ${reason || '재난문자 수칙 위반으로 인한 통신 오염'}.<br>
                [조치] ${actionDesc || '전자기기 강제 포맷 및 기기 격리'}.
            </div>
        `;
    }
    
    setCCTVChoicesEP9([
        {
            text: "재시도 (Retry)",
            action: () => {
                if (centerStatus) {
                    centerStatus.style.borderColor = '#00ff00';
                    centerStatus.style.color = '#00ff00';
                }
                startCCTVGameEP9();
            }
        }
    ]);
}

function triggerGameClearEP9() {
    cctvGameStateEP9 = 'win';
    updateCCTVHUDEP9();
    
    addCCTVLogEP9("[ALL CLEAR / TRUE ENDING] 인증 성공. 특별재난 관리본부 신속대응팀이 현장에 돌입하여 모든 통신 오염을 정화했습니다. 모든 에피소드 생환 완료!", false);
    playCCTVVideoEP9('sms_idle.mp4', '[SYSTEM: ALL PROTOCOLS CLEARED]');
    clearCCTVChoicesEP9();
    
    openDarkWebAlert("🏆 [ALL CLEAR / TRUE ENDING]<br>인증 성공! 특별재난 관리본부 신속대응팀이 현장에 돌입하여 모든 통신 오염을 정화했습니다.<br><br><b>축하합니다! 전 에피소드 생환 완료!</b>");
}

// Dark Web Taskbar Rendering
const darkWebWindowsList = [
    { id: 'darkwebFolderWindow', title: '📁 [EP.01] 탐색기' },
    { id: 'darkwebReportWindow', title: '📄 야간근무수칙.txt' },
    { id: 'darkwebCCTVWindow', title: '🖥️ 해안_CCTV' },
    { id: 'darkwebFolderWindowEP2', title: '📁 [EP.02] 탐색기' },
    { id: 'darkwebReportWindowEP2', title: '📄 심야2호선_수칙.txt' },
    { id: 'darkwebCCTVWindowEP2', title: '🖥️ 열차_CCTV' },
    { id: 'darkwebFolderWindowEP3', title: '📁 [EP.03] 탐색기' },
    { id: 'darkwebReportWindowEP3', title: '📄 병원_수칙.txt' },
    { id: 'darkwebCCTVWindowEP3', title: '🖥️ 병원_CCTV' },
    { id: 'darkwebFolderWindowEP4', title: '📁 [EP.04] 탐색기' },
    { id: 'darkwebReportWindowEP4', title: '📄 엘리베이터_수칙.txt' },
    { id: 'darkwebCCTVWindowEP4', title: '🖥️ 승강기_CCTV' },
    { id: 'darkwebFolderWindowEP5', title: '📁 [EP.05] 탐색기' },
    { id: 'darkwebReportWindowEP5', title: '📄 아기소_수칙.txt' },
    { id: 'darkwebCCTVWindowEP5', title: '🖥️ 살둔초소_CCTV' },
    { id: 'darkwebFolderWindowEP6', title: '📁 [EP.06] 탐색기' },
    { id: 'darkwebReportWindowEP6', title: '📄 청림고_수칙.txt' },
    { id: 'darkwebCCTVWindowEP6', title: '🖥️ 청림고_CCTV' },
    { id: 'darkwebFolderWindowEP7', title: '📁 [EP.07] 탐색기' },
    { id: 'darkwebReportWindowEP7', title: '📄 편의점_수칙.txt' },
    { id: 'darkwebCCTVWindowEP7', title: '🖥️ 편의점_CCTV' },
    { id: 'darkwebFolderWindowEP8', title: '📁 [EP.08] 탐색기' },
    { id: 'darkwebReportWindowEP8', title: '📄 워터파크_수칙.txt' },
    { id: 'darkwebCCTVWindowEP8', title: '🖥️ 워터파크_CCTV' },
    { id: 'darkwebFolderWindowEP9', title: '📁 [EP.09] 탐색기' },
    { id: 'darkwebReportWindowEP9', title: '📄 재난문자_지침.txt' },
    { id: 'darkwebCCTVWindowEP9', title: '🖥️ 통신망_CCTV' },
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

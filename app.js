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
    { id: 'readmeWindow', title: '📄 readme.txt' }
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

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
        
        // Automatically open "My Documents" to welcome the user
        openWindow("myDocWindow");
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

// Desktop Window Management
function openWindow(windowId) {
    document.getElementById(windowId).style.display = "block";
    closeStartMenu();
}

function closeWindow(windowId) {
    document.getElementById(windowId).style.display = "none";
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

function closeStartMenu() {
    document.getElementById('start-menu').style.display = 'none';
    document.getElementById('start-button').classList.remove('active');
}

// Global click handler to close start menu when clicking outside of it
window.onclick = function(event) {
    if (!event.target.closest('#start-menu') && !event.target.closest('#start-button')) {
        closeStartMenu();
    }
}

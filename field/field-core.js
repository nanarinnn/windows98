// Reusable mission lifecycle, real-time clock, inventory and record channel.
window.FieldCore = (() => {
    // Shift pacing only. Mission dt/elapsed and response deadlines stay in real seconds.
    const config = { realSecondsPerGameMinute: 1.5 };
    const missions = new Map();
    const listeners = new Set();
    let run = null;
    let timer = null;
    let last = 0;
    const notify = () => listeners.forEach(fn => fn(run));
    function log(message) {
        if (!run) return;
        run.logs.push({ minute: run.minute, message });
        if (run.logs.length > 80) run.logs.shift();
    }
    function stop() { clearInterval(timer); timer = null; }
    function die(reason) {
        if (!run || run.status !== 'active') return;
        run.status = 'dead'; run.reason = reason;
        log(`생체 신호 소실 — ${reason}`);
        stop(); FieldSave.death(run.id);
    }
    function clear() {
        if (!run || run.status !== 'active') return;
        run.status = 'cleared'; log('06:00 — 일출 확인. 생환 기록 전송.');
        stop(); FieldSave.clear(run.id, { patrols: run.patrols, elapsed: run.elapsed, injuries: run.data.injuries || [] });
    }
    // Same entry point for wall-clock pulses and deterministic integration tests.
    function step(seconds) {
        if (!Number.isFinite(seconds) || seconds <= 0 || !run || run.status !== 'active') return;
        // Substeps preserve deadlines when a background tab wakes up.
        let remaining = seconds;
        while (remaining > 0 && run.status === 'active') {
            const dt = Math.min(remaining, 0.25);
            run.elapsed += dt;
            run.minute = Math.min(480, run.elapsed * 480 / run.duration);
            missions.get(run.id).tick(run, dt, api);
            if (run.minute >= 480 && run.status === 'active') clear();
            remaining -= dt;
        }
        notify();
    }
    function pulse() { const now = performance.now(); step((now - last) / 1000); last = now; }
    function dispatch(id) {
        if (!missions.has(id) || !FieldSave.unlocked(id)) return false;
        stop();
        const mission = missions.get(id);
        run = { id, status: 'active', duration: 480 * config.realSecondsPerGameMinute, elapsed: 0, minute: 0,
            inventory: {}, selected: '', logs: [], patrols: {}, controls: {}, data: {} };
        mission.init(run, api); log('22:00 — 현장 연결. 장비와 근무 수칙을 확인하십시오.');
        last = performance.now(); timer = setInterval(pulse, 250); notify(); return true;
    }
    function action(name, value) {
        if (!run || run.status !== 'active') return;
        pulse();
        if (run.status !== 'active') return;
        missions.get(run.id).action(run, name, value, api); notify();
    }
    const api = {
        config,
        register(mission) { missions.set(mission.id, mission); },
        available: id => missions.has(id), mission: id => missions.get(id), dispatch, action, step, log, die,
        get: () => run,
        onChange(fn) { listeners.add(fn); return () => listeners.delete(fn); },
        disconnect() { stop(); run = null; notify(); },
        release() {
            if (run && run.status === 'active') { action('eyes', false); action('back', false); }
        },
        time(minute) {
            const total = (22 * 60 + Math.floor(minute)) % (24 * 60);
            return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
        }
    };
    window.addEventListener('blur', () => api.release());
    document.addEventListener('visibilitychange', () => { if (document.hidden) api.release(); });
    return api;
})();

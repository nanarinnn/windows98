// Reusable mission lifecycle, real-time clock, inventory and record channel.
window.FieldCore = (() => {
    // Shift pacing only. Mission dt/elapsed and response deadlines stay in real seconds.
    const config = { realSecondsPerGameMinute: 1.5 };
    const missions = new Map();
    const listeners = new Set();
    // Presentation-only extension points (e.g. future AUTHOR traces). Listener errors are swallowed and
    // listeners receive ids only, so hooks can never change gameplay, clear conditions or saves.
    const hooks = { onEpisodeStart: new Set(), onMajorEvent: new Set(), onEpisodeClear: new Set() };
    const emit = (name, ...args) => { for (const fn of hooks[name]) { try { fn(...args); } catch (error) { /* ignored by design */ } } };
    let run = null;
    let timer = null;
    let last = 0;
    const notify = () => listeners.forEach(fn => fn(run));
    function log(message) {
        if (!run) return;
        run.logs.push({ minute: run.minute, t: run.elapsed, tag: missions.get(run.id)?.logTag?.(run), message });
        if (run.logs.length > 80) run.logs.shift();
    }
    function stop() { clearInterval(timer); timer = null; }
    // Missions that opt in (persist) keep a bounded in-progress snapshot in FieldSave (resume after reload).
    let lastPersist = 0;
    function persistNow() {
        if (!run || run.status !== 'active') return;
        const mission = missions.get(run.id);
        if (mission.persist) { FieldSave.saveProgress(run.id, mission.snapshot(run)); lastPersist = performance.now(); }
    }
    function die(reason, code) {
        if (!run || run.status !== 'active') return;
        run.status = 'dead'; run.reason = reason; run.code = code || '';
        log(`생체 신호 소실 — ${reason}`);
        stop(); FieldSave.death(run.id);
    }
    function clear() {
        if (!run || run.status !== 'active') return;
        run.status = 'cleared'; log('06:00 — 일출 확인. 생환 기록 전송.');
        stop(); FieldSave.clear(run.id, { patrols: run.patrols, elapsed: run.elapsed, injuries: run.data.injuries || [] });
        emit('onEpisodeClear', run.id);
    }
    // Missions with their own end condition (manualClock) finish through this instead of the 06:00 clock.
    function win(message, record) {
        if (!run || run.status !== 'active') return;
        run.status = 'cleared'; log(message);
        stop(); FieldSave.clear(run.id, record || { patrols: {}, elapsed: run.elapsed, injuries: [] });
        emit('onEpisodeClear', run.id);
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
        if (performance.now() - lastPersist > 1500) persistNow();
        notify();
    }
    function pulse() { const now = performance.now(); step((now - last) / 1000); last = now; }
    function dispatch(id) {
        if (!missions.has(id) || !FieldSave.unlocked(id)) return false;
        stop();
        const mission = missions.get(id);
        // manualClock missions are not bound to the 22:00-06:00 shift; they end via win()/die().
        run = { id, status: 'active', duration: mission.manualClock ? Infinity : 480 * config.realSecondsPerGameMinute, elapsed: 0, minute: 0,
            inventory: {}, selected: '', logs: [], patrols: {}, controls: {}, data: {} };
        mission.init(run, api);
        const saved = mission.persist ? FieldSave.progress(id) : null;
        if (saved && mission.restore && mission.restore(run, saved, api)) log(mission.restoredLog || '[복원] 진행 중이던 기록을 복원했습니다.');
        else log(mission.startLog || '22:00 — 현장 연결. 장비와 근무 수칙을 확인하십시오.');
        emit('onEpisodeStart', id);
        last = performance.now(); timer = setInterval(pulse, 250); notify(); return true;
    }
    function action(name, value) {
        if (!run || run.status !== 'active') return;
        pulse();
        if (run.status !== 'active') return;
        missions.get(run.id).action(run, name, value, api); persistNow(); notify();
    }
    const api = {
        config,
        register(mission) { missions.set(mission.id, mission); },
        available: id => missions.has(id), mission: id => missions.get(id), dispatch, action, step, log, die, win,
        majorEvent(eventId) { if (run) emit('onMajorEvent', run.id, eventId); },
        hooks: { add(name, fn) { if (!hooks[name] || typeof fn !== 'function') return () => {}; hooks[name].add(fn); return () => hooks[name].delete(fn); } },
        get: () => run,
        refresh() { notify(); },   // re-render only (e.g. a post-clear inspection line); never advances the clock
        onChange(fn) { listeners.add(fn); return () => listeners.delete(fn); },
        disconnect() { persistNow(); stop(); run = null; notify(); },
        release() {
            if (!run || run.status !== 'active') return;
            const mission = missions.get(run.id);
            if (mission.release) mission.release(run, api); // toggle-based missions keep their state
            else { action('eyes', false); action('back', false); }
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

// Independent browser record. Save Code transport uses these validated snapshots; Story stays separate.
window.FieldSave = (() => {
    const key = 'yuyeon98.field.v1';
    const blank = () => ({ v: 1, cleared: [], unlocked: ['EP01'], deaths: {}, records: {} });
    // Dev convenience: on localhost every episode can be dispatched without clearing the previous one.
    // View-only override: nothing is written to progress/Save Code, and production hosts never enable it.
    // Add ?devunlock=0 to the URL to test the real locks (the smoke tests do).
    const devUnlock = ['localhost', '127.0.0.1'].includes(location.hostname) && new URLSearchParams(location.search).get('devunlock') !== '0';
    let state = blank();
    let storageError = false;
    function sanitize(saved) {
        if (!saved || typeof saved !== 'object' || Array.isArray(saved) || saved.v !== 1) return null;
        const result = blank();
        const validId = id => typeof id === 'string' && /^EP(0[1-9]|10)$/.test(id);
        const ids = list => Array.isArray(list) ? list.filter(validId) : [];
        result.cleared = [...new Set(ids(saved.cleared))];
        result.unlocked = [...new Set(['EP01', ...ids(saved.unlocked), ...result.cleared])];
        for (const id of result.cleared) {
            const n = Number(id.slice(2));
            if (n < 10) result.unlocked.push(`EP${String(n + 1).padStart(2, '0')}`);
        }
        result.unlocked = [...new Set(result.unlocked)];
        for (let n = 1; n <= 10; n++) {
            const id = `EP${String(n).padStart(2, '0')}`;
            const count = saved.deaths?.[id];
            if (Number.isSafeInteger(count) && count >= 0) result.deaths[id] = count;
            const record = saved.records?.[id];
            if (!result.cleared.includes(id) || !record || typeof record !== 'object' || Array.isArray(record)) continue;
            // Completed duty summaries only. Never copy a live run, controls or inventory.
            const clean = { patrols: {}, injuries: [] };
            for (let hour = 0; hour < 8; hour++) {
                if (record.patrols?.[hour] === true) clean.patrols[hour] = true;
            }
            if (Number.isFinite(record.elapsed) && record.elapsed >= 0) clean.elapsed = record.elapsed;
            if (Number.isSafeInteger(record.at) && record.at >= 0) clean.at = record.at;
            if (Array.isArray(record.injuries)) clean.injuries = record.injuries
                .filter(value => typeof value === 'string').slice(0, 10).map(value => value.slice(0, 100));
            result.records[id] = clean;
        }
        return result;
    }
    try {
        state = sanitize(JSON.parse(localStorage.getItem(key))) || blank();
    } catch (error) { storageError = true; }
    function persist() {
        try { localStorage.setItem(key, JSON.stringify(state)); storageError = false; }
        catch (error) { storageError = true; }
    }
    return {
        get: () => JSON.parse(JSON.stringify(state)),
        exportProgress: () => sanitize(state),
        importProgress(saved) {
            const clean = sanitize(saved);
            if (!clean) return false;
            state = clean; persist(); return true;
        },
        reset() {
            // Stop timers before clearing progress so the old run cannot write it back.
            window.FieldCore?.disconnect();
            state = blank(); persist();
        },
        storageError: () => storageError,
        devUnlock,
        unlocked: id => devUnlock || state.unlocked.includes(id),
        death(id) { state.deaths[id] = (state.deaths[id] || 0) + 1; persist(); },
        clear(id, record) {
            if (!state.cleared.includes(id)) state.cleared.push(id);
            const n = Number(id.slice(2));
            const next = `EP${String(n + 1).padStart(2, '0')}`;
            if (n < 10 && !state.unlocked.includes(next)) state.unlocked.push(next);
            state.records[id] = { ...record, at: Date.now() };
            persist();
        }
    };
})();

// Independent browser record. Never read/write GameSave or its v4 transport.
window.FieldSave = (() => {
    const key = 'yuyeon98.field.v1';
    const blank = () => ({ v: 1, cleared: [], unlocked: ['EP01'], deaths: {}, records: {} });
    let state = blank();
    let storageError = false;
    try {
        const saved = JSON.parse(localStorage.getItem(key));
        if (saved && saved.v === 1) {
            const ids = list => Array.isArray(list) ? list.filter(id => /^EP(0[1-9]|10)$/.test(id)) : [];
            state.cleared = [...new Set(ids(saved.cleared))];
            state.unlocked = [...new Set(['EP01', ...ids(saved.unlocked)])];
            for (const id of state.cleared) {
                const n = Number(id.slice(2));
                if (n < 10) state.unlocked.push(`EP${String(n + 1).padStart(2, '0')}`);
            }
            state.unlocked = [...new Set(state.unlocked)];
            for (const id of state.unlocked) {
                const count = saved.deaths && saved.deaths[id];
                if (Number.isSafeInteger(count) && count >= 0) state.deaths[id] = count;
            }
            if (saved.records && typeof saved.records === 'object' && !Array.isArray(saved.records)) state.records = saved.records;
        }
    } catch (error) { storageError = true; }
    function persist() {
        try { localStorage.setItem(key, JSON.stringify(state)); storageError = false; }
        catch (error) { storageError = true; }
    }
    return {
        get: () => JSON.parse(JSON.stringify(state)),
        storageError: () => storageError,
        unlocked: id => state.unlocked.includes(id),
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

// Dev-server shortcut (inert outside localhost / private LAN and with ?devunlock=0): ?devclear=6 skips the Darkweb boot and plays a quiet EP06 day to its CLEAR screen
// so the post-clear inspection (CLASSIFIED 01) can be tried by hand. It uses the real Field actions, so the clear is recorded like a normal clear
// (EP06 cleared, EP07 unlocked) in this browser; use the notebook's 기록 초기화 to undo. Nothing else changes.
window.addEventListener('load', () => {
    if (!FieldSave.devUnlock || new URLSearchParams(location.search).get('devclear') !== '6') return;   // dev hosts (localhost / private LAN) only
    setTimeout(() => {
        document.getElementById('darkweb-terminal').style.display = 'none';
        document.getElementById('darkweb-overlay').style.display = 'block';
        confirmDarkWebWarning(); closeDarkWebReadme();
        const real = FieldEP06Data.random;
        FieldEP06Data.random = name => ({ deskDirty: 0.99, b: 0.99, cOn: 0.99, eOn: 0.99, dOn: 0.99, call17: 'quiet', seat: 'clean' })[name] ?? real(name);
        FieldSave.clearProgress('EP06');   // never resume an old half-played day: a leftover snapshot would make the scripted day fail
        FieldUI.open(); document.getElementById('field-dispatch-EP06').click();
        const A = (n, v) => FieldCore.action(n, v), D = () => FieldCore.get().data;
        const S = n => { let left = n; while (left > 0 && FieldCore.get().status === 'active') { FieldCore.step(Math.min(.5, left)); left -= .5; } };
        A('startHomeroom'); for (let i = 0; i < 3; i++) A('call'); A('absent'); while (D().att !== 'done') A('call'); A('endHomeroom');
        for (const phase of ['class1', 'class2']) while (D().phase === phase) { A('obj', 'board'); S(5.2); if (D().phase === 'break') S(41); if (D().phase === 'listening') S(66); }
        A('endClosing');
        FieldEP06Data.random = real;
        if (FieldCore.get().status !== 'cleared') console.warn('[devclear] the scripted day did not clear:', FieldCore.get().reason);
    }, 300);
});

// Dev-server only, URL-driven (no UI). ?devseed=all writes real Field return records for EP01-EP10 into this browser and clears
// PUBLIC CLASSIFIED / 11 / 10, so all three CLASSIFIED records can be discovered by playing them. ?devseed=clues grants every
// Story clue (no toasts; flags such as jayUnlocked are not set). Both can be combined: ?devseed=all,clues. Story flags, J, LOOP
// and AUTHOR are otherwise untouched. Inert with ?devunlock=0 or on the production domain; removed from the address bar after use.
window.addEventListener('load', () => {
    const q = new URLSearchParams(location.search);
    const seeds = (q.get('devseed') || '').split(',');
    if (!FieldSave.devUnlock || !q.has('devseed')) return;
    if (seeds.includes('all')) {
        const ALL = Array.from({ length: 10 }, (_, i) => `EP${String(i + 1).padStart(2, '0')}`);
        FieldSave.importProgress({ v: 1, cleared: ALL, unlocked: ALL, deaths: FieldSave.get().deaths, records: Object.fromEntries(ALL.map(id => [id, { patrols: {}, elapsed: 0, injuries: [] }])) });
        window.Classified?.reset();
    }
    if (seeds.includes('clues')) CLUES.forEach(c => GameSave.addClue(c.id));
    q.delete('devseed'); history.replaceState(null, '', location.pathname + (q.toString() ? '?' + q : '') + location.hash);
    console.info('[devseed]', seeds.join(', '));
});

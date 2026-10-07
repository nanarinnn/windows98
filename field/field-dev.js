// Local-only shortcut (inert anywhere except localhost/127.0.0.1): ?devclear=6 skips the Darkweb boot and plays a quiet EP06 day to its CLEAR screen
// so the post-clear inspection (CLASSIFIED 01) can be tried by hand. It uses the real Field actions, so the clear is recorded like a normal clear
// (EP06 cleared, EP07 unlocked) in this browser; use the notebook's 기록 초기화 to undo. Nothing else changes.
window.addEventListener('load', () => {
    if (!['localhost', '127.0.0.1'].includes(location.hostname) || new URLSearchParams(location.search).get('devclear') !== '6') return;
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

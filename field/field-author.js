// Frontend easter egg, not authentication or a permission boundary.
window.AuthorRoute = (() => {
    // Author-supplied SHA-256 hex digest. This is a frontend easter egg only.
    // Never put the original code here. The local override accepts a hash, not a secret.
    const AUTHOR_SAVE_HASH = 'f7dda4fd1a2aaaae283a1382d8e0f5f39abe70d410d9cf1a438e58c0aaa220ae';
    const KEY = 'yuyeon98.author.v1';
    const TRACE_IDS = ['creator-note', 'ep01-observation'];
    const listeners = new Set();
    const blank = () => ({ v: 1, unlocked: false, authorAccessLevel: 0, authorTraces: [] });
    let state = blank(), hashOverride = '', storageError = false;
    function sanitize(saved) {
        if (!saved || typeof saved !== 'object' || Array.isArray(saved) || saved.v !== 1 || typeof saved.unlocked !== 'boolean') return null;
        const result = blank();
        if (saved.unlocked) {
            result.unlocked = true;
            // Only access level 1 exists today, matching the existing local load policy.
            result.authorAccessLevel = 1;
            result.authorTraces = Array.isArray(saved.authorTraces)
                ? [...new Set(saved.authorTraces.filter(id => TRACE_IDS.includes(id)))] : [];
        }
        return result;
    }
    try {
        state = sanitize(JSON.parse(localStorage.getItem(KEY))) || blank();
    } catch (error) { storageError = true; }
    function persist() {
        try { localStorage.setItem(KEY, JSON.stringify(state)); storageError = false; }
        catch (error) { storageError = true; }
        listeners.forEach(fn => fn());
    }
    function normalize(input) {
        // Case-sensitive; preserve internal spaces. Exact order: trim → NFKC → UTF-8 → SHA-256.
        return typeof input === 'string' ? input.trim().normalize('NFKC') : '';
    }
    async function matches(input) {
        const expected = hashOverride || AUTHOR_SAVE_HASH;
        const normalized = normalize(input);
        if (!/^[a-f0-9]{64}$/i.test(expected) || !normalized || !window.crypto?.subtle) return false;
        try {
            const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(normalized));
            const actual = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
            return actual === expected.toLowerCase();
        } catch (error) { return false; } // Normal Save import still works on unsupported origins.
    }
    return {
        normalize, matches,
        // Session-only local override for author configuration/playtesting. Never stores input.
        setHashOverride(hash) {
            if (hash !== '' && (typeof hash !== 'string' || !/^[a-f0-9]{64}$/i.test(hash))) return false;
            hashOverride = hash; return true;
        },
        async tryImport(input) {
            if (!await matches(input)) return false;
            if (!state.unlocked) { state.unlocked = true; state.authorAccessLevel = 1; persist(); }
            return true;
        },
        get: () => JSON.parse(JSON.stringify(state)),
        // Whitelist progress only: the configured/override hashes and input never travel.
        exportProgress: () => sanitize(state),
        importProgress(saved) {
            const clean = sanitize(saved);
            if (!clean) return false;
            state = clean; persist(); return true;
        },
        reset() {
            state = blank(); persist(); // Notify UI; retain configured/override hashes.
        },
        storageError: () => storageError,
        onChange(fn) { listeners.add(fn); return () => listeners.delete(fn); },
        addTrace(id) {
            if (!state.unlocked || !TRACE_IDS.includes(id) || state.authorTraces.includes(id)) return false;
            state.authorTraces.push(id); persist(); return true;
        }
    };
})();

// Two alternate presentation traces. No Story, J, LOOP or Field completion hooks.
window.addEventListener('load', () => {
    const desktop = document.getElementById('darkweb-desktop');
    const icon = document.createElement('div'); icon.className = 'icon'; icon.id = 'author-note-icon';
    icon.style.display = 'none'; // Hide before insertion; only restored unlock may reveal it.
    icon.tabIndex = 0; icon.setAttribute('role', 'button'); icon.setAttribute('aria-label', '제작자에게.txt');
    icon.innerHTML = '<div style="width: 32px; height: 32px; font-size: 26px; margin: 0 auto; text-align: center; line-height: 32px; filter: grayscale(1) sepia(1) hue-rotate(-50deg) saturate(3);">📄</div><span style="font-size: 11px; color: #ff0000; text-shadow: 0 0 2px #000; font-family: monospace; font-weight: bold; word-break: break-all;">[제작자에게.txt]</span>';
    desktop.querySelector('.darkweb-icons-container').append(icon);
    // Reuse the existing Darkweb text-window DOM/styles, including mobile rules.
    const win = document.getElementById('darkwebReadmeWindow').cloneNode(true);
    win.id = 'authorNoteWindow'; win.style.display = 'none';
    win.style.top = '90px'; win.style.left = '100px'; win.style.width = 'min(380px,90%)';
    win.style.maxHeight = '70%';
    win.querySelector('.window-header > span').textContent = '📄 [제작자에게.txt] - 메모장';
    const closeControl = win.querySelector('.win-btn');
    closeControl.id = 'author-note-close'; closeControl.removeAttribute('onclick');
    closeControl.setAttribute('role', 'button'); closeControl.setAttribute('aria-label', '닫기'); closeControl.tabIndex = 0;
    const text = win.querySelector('textarea'); text.id = 'author-note-text';
    // AUTHOR-only meta reactions to PUBLIC CLASSIFIED discoveries. Every CLASSIFIED is open to everyone and AUTHOR must discover
    // it in the game like anyone else; this table only appends one line to this file when AUTHOR is unlocked AND the entry is
    // discovered (either order, appended once). Extendable per id: a reaction for classified-02 or -03 may be added here
    // later — none is defined now, and no sentence is written for them in advance.
    const AUTHOR_CLASSIFIED_REACTIONS = {
        'classified-01': { authorTextAppend: '연결한 건 내가 아니야.' }
    };
    const BASE_NOTE = '누군가 이 창을 다시 열어 주었다.\n남겨 둔 문장 하나는, 여기까지 읽어 준 사람에게.\n\n영원을 약속하지는 못하겠지만, 지금 이 순간을 너와 함께';
    const noteText = () => {
        const extra = Object.entries(AUTHOR_CLASSIFIED_REACTIONS)
            .filter(([id]) => window.Classified?.has(id)).map(([, reaction]) => reaction.authorTextAppend);
        return extra.length ? `${BASE_NOTE}\n\n${extra.join('\n')}` : BASE_NOTE;
    };
    text.textContent = BASE_NOTE;
    desktop.append(win); makeDraggable(win);
    darkWebWindowsList.push({ id: win.id, title: '📄 제작자에게.txt' });
    const close = () => { if (win.style.display === 'none') return; win.style.display = 'none'; updateDarkWebTaskbar(); };
    const update = () => {
        const unlocked = AuthorRoute.get().unlocked;
        icon.style.display = unlocked ? 'flex' : 'none';
        if (!unlocked) close();
    };
    const open = () => {
        if (!AuthorRoute.get().unlocked) return;
        AuthorRoute.addTrace('creator-note'); text.value = noteText();   // evaluated only when the file is (re)opened: no popup on discovery
        win.style.display = 'flex';
        win.style.zIndex = ++highestZIndex; updateDarkWebTaskbar();
    };
    icon.onclick = open;
    icon.onkeydown = event => { if (['Enter', ' '].includes(event.key)) { event.preventDefault(); open(); } };
    closeControl.onclick = close;
    closeControl.onkeydown = event => { if (['Enter', ' '].includes(event.key)) { event.preventDefault(); close(); } };
    AuthorRoute.onChange(update); update();
    new MutationObserver(() => {
        if (document.getElementById('darkweb-overlay').style.display === 'none' || desktop.style.display === 'none') close();
    }).observe(document.getElementById('darkweb-overlay'), { attributes: true, subtree: true, attributeFilter: ['style'] });
    FieldCore.onChange(s => {
        if (s?.id === 'EP01' && s.status === 'active' && s.elapsed === 0 && AuthorRoute.addTrace('ep01-observation')) {
            FieldCore.log('[수신 여백] 이 화면을 다시 열어 준 사람에게.');
        }
    });
});

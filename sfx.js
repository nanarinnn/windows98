// Shared sound: every effect is synthesized with Web Audio (no audio files; the videos carry no audio track).
// One AudioContext, one master gain (volume / mute, saved per browser), a UI effect bus and an ambience bus.
// Gameplay is never changed by this file: it only listens (clicks, toasts, alerts, save counters, FieldCore status) and plays.
// Older sound code (blue screen beep, Field crackle, EP09, 11 / 10) routes through SFX.context() / SFX.out() so mute covers it.
window.SFX = (() => {
    const KEY = 'yuyeon98.sound.v1';
    let prefs = { volume: 0.6, muted: false };
    try {
        const s = JSON.parse(localStorage.getItem(KEY));
        if (s && typeof s === 'object') prefs = { volume: Number.isFinite(s.volume) ? Math.min(1, Math.max(0, s.volume)) : 0.6, muted: !!s.muted };
    } catch (e) { /* defaults */ }
    let ctx = null, master = null, fx = null, amb = null, noiseBuf = null;
    const save = () => { try { localStorage.setItem(KEY, JSON.stringify(prefs)); } catch (e) { /* not saved */ } };
    const level = () => (prefs.muted ? 0 : prefs.volume);

    function context() {
        if (ctx) return ctx;
        try {
            const A = window.AudioContext || window.webkitAudioContext; if (!A) return null;
            ctx = new A();
            master = ctx.createGain(); master.gain.value = level(); master.connect(ctx.destination);
            fx = ctx.createGain(); fx.gain.value = 1; fx.connect(master);
            amb = ctx.createGain(); amb.gain.value = 0.9; amb.connect(master);
            noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
            const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
        } catch (e) { ctx = null; }
        return ctx;
    }
    // the node older code should connect to: the master bus for the shared context, else that context's own output
    const out = c => (ctx && (!c || c === ctx) ? fx : c ? c.destination : null);
    const ready = () => { const c = context(); if (c && c.state === 'suspended') c.resume().catch(() => {}); return c && c.state === 'running' ? c : null; };
    function arm() { const c = context(); if (c && c.state === 'suspended') c.resume().catch(() => {}); }
    function setVolume(v) { prefs.volume = Math.min(1, Math.max(0, v)); if (prefs.volume > 0) prefs.muted = false; apply(); }
    function setMuted(m) { prefs.muted = !!m; apply(); }
    function apply() { save(); if (master) master.gain.setTargetAtTime(level(), ctx.currentTime, 0.05); syncUi(); }

    // ---------- synth helpers ----------
    function blip(c, t, f, len, { type = 'square', vol = 0.05, to = 0, bus = fx } = {}) {
        const o = c.createOscillator(), g = c.createGain();
        o.type = type; o.frequency.setValueAtTime(f, t); if (to) o.frequency.exponentialRampToValueAtTime(to, t + len);
        g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, t + len);
        o.connect(g); g.connect(bus); o.start(t); o.stop(t + len + 0.03);
    }
    function hiss(c, t, len, { vol = 0.08, freq = 2000, type = 'lowpass', bus = fx } = {}) {
        const s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
        s.buffer = noiseBuf; f.type = type; f.frequency.value = freq;
        g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + len);
        s.connect(f); f.connect(g); g.connect(bus); s.start(t, Math.random()); s.stop(t + len + 0.03);
    }
    const SOUNDS = {
        click: (c, t) => blip(c, t, 1700, 0.025, { vol: 0.03 }),
        close: (c, t) => blip(c, t, 900, 0.06, { vol: 0.035, to: 480 }),
        type: (c, t) => blip(c, t, 2300, 0.012, { vol: 0.012 }),
        notify: (c, t) => { blip(c, t, 880, 0.1, { type: 'sine', vol: 0.06 }); blip(c, t + 0.09, 1320, 0.14, { type: 'sine', vol: 0.05 }); },
        clue: (c, t) => [660, 990, 1320].forEach((f, i) => blip(c, t + i * 0.07, f, 0.12, { type: 'triangle', vol: 0.06 })),
        classified: (c, t) => { hiss(c, t, 0.35, { vol: 0.05, freq: 900 }); [330, 277, 220].forEach((f, i) => blip(c, t + 0.1 + i * 0.16, f, 0.3, { type: 'sawtooth', vol: 0.035 })); },
        error: (c, t) => { blip(c, t, 415, 0.22, { vol: 0.04 }); blip(c, t, 311, 0.22, { vol: 0.04 }); blip(c, t + 0.18, 277, 0.3, { vol: 0.035 }); },
        message: (c, t) => { blip(c, t, 1046, 0.06, { type: 'sine', vol: 0.05 }); blip(c, t + 0.08, 1568, 0.08, { type: 'sine', vol: 0.04 }); },
        death: (c, t) => { hiss(c, t, 0.9, { vol: 0.16, freq: 3000 }); blip(c, t, 220, 0.8, { type: 'sawtooth', vol: 0.06, to: 35 }); },
        clear: (c, t) => [523, 659, 784, 1046].forEach((f, i) => blip(c, t + i * 0.09, f, 0.22, { type: 'triangle', vol: 0.06 })),
        static: (c, t) => hiss(c, t, 0.25, { vol: 0.07, freq: 4000 })
    };
    let lastAt = {};
    function play(name) {
        const c = ready(), fn = SOUNDS[name]; if (!c || !fn || level() === 0) return;
        const now = performance.now(); if (now - (lastAt[name] || 0) < 45) return; lastAt[name] = now;   // no machine-gun stacking
        try { fn(c, c.currentTime + 0.005); } catch (e) { /* optional */ }
    }

    // ---------- ambience: a noise bed (filter + slow swell) and an optional hum, cross-faded ----------
    // keyed by place: EP number for CCTV / Field, 'hq' for the darkweb desktop
    const AMBIENT = {
        hq: { noise: 260, nType: 'lowpass', nVol: 0.035, hum: 60, hVol: 0.012 },
        1: { noise: 520, nType: 'lowpass', nVol: 0.16, swell: 0.11, depth: 0.12 },                 // sea at night
        2: { noise: 170, nType: 'lowpass', nVol: 0.2, swell: 0.35, depth: 0.05, hum: 48, hVol: 0.02 },   // subway rumble
        3: { noise: 1800, nType: 'lowpass', nVol: 0.025, hum: 120, hVol: 0.012 },                  // ward fluorescent
        4: { noise: 300, nType: 'lowpass', nVol: 0.06, hum: 62, hVol: 0.02 },                      // elevator shaft
        5: { noise: 1400, nType: 'bandpass', nVol: 0.11, swell: 0.5, depth: 0.03 },                // valley stream
        6: { noise: 700, nType: 'lowpass', nVol: 0.03, hum: 120, hVol: 0.006 },                    // empty classroom
        7: { noise: 600, nType: 'lowpass', nVol: 0.04, hum: 100, hVol: 0.016 },                    // store fridges
        8: { noise: 1100, nType: 'bandpass', nVol: 0.1, swell: 0.18, depth: 0.05 },                // water park
        9: { noise: 400, nType: 'lowpass', nVol: 0.02 },                                           // phone in the dark
        10: { noise: 240, nType: 'lowpass', nVol: 0.09, swell: 1.1, depth: 0.05, hum: 55, hVol: 0.02 }   // factory machines
    };
    let ambKey = null, ambNodes = null;
    function ambient(key) {
        key = key == null ? null : String(key);
        if (key === ambKey) return;
        const c = ready(); if (!c) return;                  // retried by the poll once audio is allowed
        ambKey = key;
        const t = c.currentTime;
        if (ambNodes) { const old = ambNodes; old.out.gain.setTargetAtTime(0.0001, t, 0.35); setTimeout(() => old.stop.forEach(n => { try { n.stop(); } catch (e) { /* done */ } }), 1800); ambNodes = null; }
        const p = key && AMBIENT[key]; if (!p) return;
        const o = c.createGain(); o.gain.setValueAtTime(0.0001, t); o.gain.setTargetAtTime(1, t, 0.6); o.connect(amb);
        const stop = [];
        const src = c.createBufferSource(); src.buffer = noiseBuf; src.loop = true;
        const f = c.createBiquadFilter(); f.type = p.nType; f.frequency.value = p.noise; if (p.nType === 'bandpass') f.Q.value = 0.6;
        const g = c.createGain(); g.gain.value = p.nVol;
        src.connect(f); f.connect(g); g.connect(o); src.start(t, Math.random() * 2); stop.push(src);
        if (p.swell) { const l = c.createOscillator(), lg = c.createGain(); l.frequency.value = p.swell; lg.gain.value = p.depth; l.connect(lg); lg.connect(g.gain); l.start(t); stop.push(l); }
        if (p.hum) for (const [mul, v] of [[1, 1], [2, 0.4]]) { const h = c.createOscillator(), hg = c.createGain(); h.frequency.value = p.hum * mul; hg.gain.value = p.hVol * v; h.connect(hg); hg.connect(o); h.start(t); stop.push(h); }
        ambNodes = { out: o, stop };
    }
    const shown = id => { const e = document.getElementById(id); return !!e && e.style.display !== 'none' && getComputedStyle(e).display !== 'none'; };
    function place() {
        if (!shown('darkweb-overlay')) return null;
        const field = window.FieldCore?.get?.();
        if (shown('fieldWindow')) {
            if (document.getElementById('e11')) return null;            // 11 / 10 keeps its own silence
            if (field && field.status === 'active') return Number(String(field.id || '').replace(/\D/g, '')) || 'hq';
        }
        const top = [...document.querySelectorAll('[id^="darkwebCCTVWindow"]')].filter(w => shown(w.id)).sort((a, b) => (Number(b.style.zIndex) || 0) - (Number(a.style.zIndex) || 0))[0];
        if (top) return Number(top.id.replace('darkwebCCTVWindow', '').replace('EP', '')) || 1;
        return 'hq';
    }

    // ---------- listeners (never change gameplay) ----------
    function wrap(name, after) {
        const fn = window[name]; if (typeof fn !== 'function' || fn.__sfx) return;
        const w = function (...args) { const r = fn.apply(this, args); try { after(args, r); } catch (e) { /* ignore */ } return r; };
        w.__sfx = true; window[name] = w;
    }
    let storyCount = null, fieldStatus = '';
    function storyTotals() {
        if (typeof GameSave === 'undefined' || typeof EP_NUMBERS === 'undefined') return null;
        let c = 0, d = 0; for (const n of EP_NUMBERS) { const r = GameSave.ep(n); c += r.clears || 0; d += r.deaths || 0; }
        return { c, d };
    }
    function hook() {
        document.addEventListener('pointerdown', arm, true);
        document.addEventListener('keydown', arm, true);
        document.addEventListener('click', e => {
            const t = e.target.closest?.('button, [onclick], .desktop-icon, .dw-icon, .taskbar-item, [role="button"], a');
            if (!t || t.disabled || t.closest('#sfx-panel')) return;
            const label = (t.textContent || '').trim(), on = t.getAttribute('onclick') || '';
            play(label === '✕' || label === '×' || label === 'X' || /close|Close/.test(on) || t.id === 'e11-hangup' ? 'close' : 'click');
        }, true);
        wrap('showToast', ([title]) => play(String(title).includes('단서') ? 'clue' : 'notify'));
        wrap('showAlert', () => play('error'));
        wrap('openDarkWebAlert', () => play('error'));
        wrap('messengerAdd', ([kind]) => { if (kind !== 'me') play('message'); });
        wrap('terminalPrint', () => play('type'));
        if (window.Classified && !Classified.discover.__sfx) {
            const d = Classified.discover; Classified.discover = function (...a) { const r = d.apply(this, a); if (r) play('classified'); return r; }; Classified.discover.__sfx = true;
        }
        window.FieldCore?.onChange?.(run => {
            const s = run ? run.status : '';
            if (s !== fieldStatus) { if (s === 'dead') play('death'); else if (s === 'cleared') play('clear'); fieldStatus = s; }
        });
        setInterval(() => {
            const n = storyTotals();
            if (n && storyCount) { if (n.d > storyCount.d) play('death'); else if (n.c > storyCount.c) play('clear'); }
            if (n) storyCount = n;
            if (ctx && ctx.state === 'running') ambient(place());
        }, 600);
    }

    // ---------- taskbar control: 🔊 opens a small volume panel ----------
    function syncUi() {
        document.querySelectorAll('.sfx-toggle').forEach(b => { b.textContent = level() === 0 ? '🔇' : '🔊'; b.title = level() === 0 ? '소리 꺼짐' : `소리 ${Math.round(prefs.volume * 100)}%`; b.setAttribute('aria-label', b.title); });
        const p = document.getElementById('sfx-panel'); if (!p) return;
        p.querySelector('#sfx-volume').value = String(Math.round(prefs.volume * 100));
        p.querySelector('#sfx-mute').checked = prefs.muted;
        p.querySelector('#sfx-value').textContent = `${Math.round(prefs.volume * 100)}%`;
    }
    function panel(anchor) {
        let p = document.getElementById('sfx-panel');
        if (p && p.dataset.for === anchor.id && !p.hidden) { p.hidden = true; return; }
        if (!p) {
            p = document.createElement('div'); p.id = 'sfx-panel'; p.className = 'sfx-panel';
            p.innerHTML = '<div class="sfx-head">볼륨</div><input id="sfx-volume" type="range" min="0" max="100" step="5" aria-label="볼륨"><span id="sfx-value"></span><label><input id="sfx-mute" type="checkbox"> 음소거</label>';
            document.body.append(p);
            p.querySelector('#sfx-volume').addEventListener('input', e => setVolume(Number(e.target.value) / 100));
            p.querySelector('#sfx-volume').addEventListener('change', () => play('click'));
            p.querySelector('#sfx-mute').addEventListener('change', e => setMuted(e.target.checked));
            document.addEventListener('pointerdown', e => { if (!p.hidden && !p.contains(e.target) && !e.target.closest('.sfx-toggle')) p.hidden = true; }, true);
        }
        p.dataset.for = anchor.id; p.classList.toggle('sfx-dark', anchor.id === 'sfx-toggle-dw');
        const r = anchor.getBoundingClientRect();
        p.style.right = `${Math.max(4, innerWidth - r.right)}px`; p.style.bottom = `${Math.max(4, innerHeight - r.top + 4)}px`;
        p.hidden = false; syncUi();
    }
    function mountUi() {
        const desk = document.querySelector('#taskbar-clock > span:first-child');
        if (desk && desk.textContent.trim() === '🔊') { const b = document.createElement('button'); b.type = 'button'; b.id = 'sfx-toggle'; b.className = 'sfx-toggle'; desk.replaceWith(b); }
        const dw = document.getElementById('darkweb-taskbar-clock');
        if (dw && !document.getElementById('sfx-toggle-dw')) { const b = document.createElement('button'); b.type = 'button'; b.id = 'sfx-toggle-dw'; b.className = 'sfx-toggle sfx-toggle-dark'; dw.prepend(b); }
        document.querySelectorAll('.sfx-toggle').forEach(b => b.addEventListener('click', e => { e.stopPropagation(); arm(); panel(b); }));
        syncUi();
    }
    window.addEventListener('load', () => { mountUi(); hook(); });

    return { context, out, arm, play, ambient, setVolume, setMuted, volume: () => prefs.volume, muted: () => prefs.muted, sounds: Object.keys(SOUNDS), places: Object.keys(AMBIENT) };
})();

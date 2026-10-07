// EP05 mission: a 10-minute extraction. The stimulant lasts exactly 10 minutes (real seconds) from entering the 500 m radius;
// there is no pause after entering (reading the rule document does not stop it). The player finds the target, secures them,
// judges contact before/after with the rule document, and leaves the radius in time. Contact is a state with a compressed
// version of the canon progression (numbness -> swelling -> whole-body swelling -> death). The timer running out is a hard failure.
// Story, J record, blue screen and LOOP 02 are never touched here. Situation A is deleted in the source: it has no event.
(() => {
    const data = FieldEP05Data;
    const T = data.tuning;
    const X = data.text;
    const rnd = name => data.random(name);
    const ZONES = ['edge', 'trail', 'woods', 'shore'];
    const zoneName = z => data.zones[z].name;
    function pickWeighted(name, entries) {
        const v = rnd(name);
        if (typeof v === 'string') { const hit = entries.find(([key]) => key === v); if (hit) return hit[0]; }
        const total = entries.reduce((sum, [, w]) => sum + w, 0);
        let roll = (typeof v === 'number' ? v : 0.5) * total;
        for (const [key, w] of entries) { if ((roll -= w) < 0) return key; }
        return entries[entries.length - 1][0];
    }
    const span = (name, [lo, hi]) => lo + Math.min(hi - lo, Math.floor(rnd(name) * (hi - lo + 1)));
    const travelTime = (a, b) => T.travel[`${a}-${b}`] || T.travel[`${b}-${a}`];

    function fail(s, api, code) {
        s.data.failCode = code;
        api.die(`${code} — ${data.failures[code]}`, code);
    }

    function init(s, api) {
        s.inventory = {}; s.controls = {};
        const zr = rnd('targetZone'), targetZone = zr < 0.2 ? 'trail' : zr < 0.55 ? 'woods' : 'shore';   // tuning: the pond itself is the likeliest place
        // The last confirmed location is the briefing hint; the target may have moved one step toward the pond (tuning).
        const order = ['trail', 'woods', 'shore'], at = order.indexOf(targetZone);
        const lastSeen = rnd('miss') < 0.35 && at > 0 ? order[at - 1] : targetZone;
        s.data = {
            phase: 'briefing', equip: false, injected: false,
            timer: T.timer, zone: 'edge', busy: null, lastSeen, targetZone,
            kind: pickWeighted('kind', data.kinds), wet: rnd('wetSide') < 0.5 ? 'L' : 'R',
            found: false, secured: false, asked: { dur: false, sym: false, trace: false }, known: { dur: '', sym: '', trace: '' },
            verdict: '', protocol: '', bind: '',
            contact: 'none', contactT: 0, rate: 1, reported: false,
            cAt: span('cAt', T.cAt), c: '', cLeft: 0, cKind: rnd('cKind') < 0.5 ? 0 : 1,
            dAt: span('dAt', T.dAt), dev: '',
            reflect: rnd('reflect') < T.reflectChance, f: '', fLeft: 0, cover: 0, urge: 0, failCode: ''
        };
    }

    const inside = d => d.phase === 'inside';
    const tagOf = s => s.data.phase === 'inside' ? `${String(Math.floor(s.data.timer / 60)).padStart(2, '0')}:${String(Math.floor(s.data.timer % 60)).padStart(2, '0')}` : '브리핑';
    const busyFor = (d, seconds, kind, extra = {}) => { d.busy = { t: seconds, kind, ...extra }; };

    // ---- contact ------------------------------------------------------------------------------------------------------
    function touch(s, api) {
        const d = s.data;
        if (d.contact !== 'none') return;
        d.contact = 'touched'; d.contactT = 0; d.rate = 1;
        api.log(X.contactTouch); api.majorEvent('CONTACT');
    }

    function progressContact(s, api, dt) {
        const d = s.data, C = T.contact;
        if (d.contact === 'none') return;
        d.contactT += dt * d.rate;
        if (d.contact === 'touched' && d.contactT >= C.numb) { d.contact = 'numb'; api.log(X.contactStages.numb); }
        if (d.contact === 'numb' && d.contactT >= C.swelling) { d.contact = 'swelling'; api.log(X.contactStages.swelling); api.majorEvent('SWELLING'); }
        if (d.contact === 'swelling' && d.contactT >= C.expanding) { d.contact = 'expanding'; api.log(X.contactStages.expanding); }
        if (d.contactT >= C.burst) fail(s, api, 'CONTACT_PROGRESSION');
    }

    // ---- movement ------------------------------------------------------------------------------------------------------
    function arrive(s, api, zone, route) {
        const d = s.data;
        d.zone = zone;
        api.log(X.arrive(zoneName(zone)));
        // Between the woods and the pond the two paths differ: one of them touches the surface (observed with "look").
        if (route && route === d.wet) {
            if (d.secured) return fail(s, api, 'TARGET_CONTACTED');
            touch(s, api);
        }
    }

    function startMove(s, api, dest, route) {
        const d = s.data;
        if (d.f === 'active') return fail(s, api, 'F_INCOMPLETE');
        const seconds = Math.round(travelTime(d.zone, dest) * (d.secured ? T.carryFactor : 1));
        busyFor(d, seconds, 'move', { dest, route });
        api.log(X.move(zoneName(dest)));
    }

    // ---- timers and events -----------------------------------------------------------------------------------------
    function tick(s, dt, api) {
        const d = s.data;
        if (s.status !== 'active' || !inside(d)) return;
        d.timer = Math.max(0, d.timer - dt);
        if (d.timer <= 0) return fail(s, api, 'TIME_OUT');
        progressContact(s, api, dt);
        if (s.status !== 'active') return;
        const spent = T.timer - d.timer;
        // urge (psychological pressure only; never takes control away)
        const urge = Math.min(3, Math.floor(spent / T.urgeStep) + (d.zone === 'shore' ? 1 : 0));
        if (urge > d.urge) { d.urge = urge; api.log(X.urge[Math.min(2, urge - 1)]); } else if (urge < d.urge) d.urge = urge;
        // situation C: a sound even after the stimulant
        if (d.c === '' && spent >= d.cAt) { d.c = 'sound'; d.cLeft = T.cWindow; api.log(X.sound[d.cKind]); api.majorEvent('C_SOUND'); }
        else if (d.c === 'sound') { d.cLeft -= dt; if (d.cLeft <= 0) return fail(s, api, 'C_UNRESOLVED'); }
        // situation D: the communication gear holds a recording
        if (d.dev === '' && spent >= d.dAt) { d.dev = 'alert'; api.log(X.devAlert); api.majorEvent('D_DEVICE'); }
        // situation F: the reflection pulls; it must be erased completely before the window closes
        if (d.f === 'active') { d.fLeft -= dt; if (d.fLeft <= 0) return fail(s, api, 'F_INCOMPLETE'); }
        if (d.busy) {
            d.busy.t -= dt;
            if (d.busy.t <= 0) {
                const b = d.busy; d.busy = null;
                if (b.kind === 'move') arrive(s, api, b.dest, b.route);
            }
        }
    }

    // ---- actions ---------------------------------------------------------------------------------------------------
    const EMERGENCY = new Set(['pill', 'reportContact', 'rub', 'wash', 'compress', 'ice', 'spray', 'dPlay', 'dEmp', 'dSeal', 'dReport', 'bind', 'declineBind']);

    function action(s, name, value, api) {
        const d = s.data;
        if (s.status !== 'active') return;
        // --- briefing (the timer is not running) ---------------------------------------------------------------------
        if (d.phase === 'briefing') {
            if (name === 'equip') { d.equip = true; return api.log(X.equip); }
            if (name === 'inject') { if (d.injected) return; d.injected = true; return api.log(X.inject); }
            if (name === 'enter') {
                if (!d.injected) return fail(s, api, 'NO_STIMULANT');
                d.phase = 'inside'; d.zone = 'edge'; d.timer = T.timer;
                api.log(X.enter); return api.majorEvent('ENTER');
            }
            return;
        }
        // --- contact responses (always possible) ---------------------------------------------------------------------
        if (d.contact !== 'none') {
            if (name === 'reportContact') { d.reported = true; return fail(s, api, 'CONTACT_REPORTED'); }
            if (name === 'rub' || name === 'wash') { d.rate = T.contact.irritated; return api.log(name === 'rub' ? X.rub : X.wash); }
            if ((name === 'compress' || name === 'ice') && (d.contact === 'swelling' || d.contact === 'expanding')) return fail(s, api, 'CONTACT_PRESSURE');
        }
        // --- situation C ---------------------------------------------------------------------------------------------
        if (name === 'pill') {
            if (d.c !== 'sound') return;
            d.c = 'done'; d.cLeft = 0; api.log(X.pill); return api.majorEvent('C_PILL');
        }
        // --- situation D ---------------------------------------------------------------------------------------------
        if (name === 'dPlay') { if (d.dev !== 'alert' && d.dev !== 'emp' && d.dev !== 'sealed') return; api.log(X.devPlayBlocked); return fail(s, api, 'D_PLAYED'); }
        if (name === 'dEmp') {
            if (d.dev === 'alert') { d.dev = 'emp'; busyFor(d, T.dEmp, 'device'); return api.log(X.devEmp); }
            if (d.dev === 'emp' || d.dev === 'sealed' || d.dev === 'reported') return;
            return;
        }
        if (name === 'dSeal') {
            if (d.dev === 'emp') { d.dev = 'sealed'; busyFor(d, T.dSeal, 'device'); return api.log(X.devSeal); }
            if (d.dev === 'alert') return fail(s, api, 'D_ORDER');
            return;
        }
        if (name === 'dReport') {
            if (d.dev === 'sealed') { d.dev = 'reported'; busyFor(d, T.dReport, 'device'); api.log(X.devReport); return api.majorEvent('D_REPORTED'); }
            if (d.dev === 'alert' || d.dev === 'emp') return fail(s, api, 'D_ORDER');
            return;
        }
        // --- situation F ---------------------------------------------------------------------------------------------
        if (name === 'spray') {
            if (d.f !== 'active') return;
            const n = 1 + Math.min(1, Math.floor(rnd('spray') * 2));
            d.cover = Math.min(T.fCells, d.cover + n);
            api.log(X.spray);
            if (d.cover >= T.fCells) { d.f = 'done'; d.fLeft = 0; api.log(X.sprayDone); return api.majorEvent('F_ERASED'); }
            return api.log(X.sprayPartial);
        }
        // --- the target asks to be bound (rule 4) ---------------------------------------------------------------------
        if (name === 'bind') {
            if (d.bind !== 'ask') return;
            if (value === 'cloth' || value === 'ice') return fail(s, api, 'TARGET_PRESSURE');
            return;
        }
        if (name === 'declineBind') { if (d.bind !== 'ask') return; d.bind = 'declined'; return api.log(X.declined); }
        // --- everything else takes time ------------------------------------------------------------------------------
        if (d.busy && !EMERGENCY.has(name)) return;
        switch (name) {
            case 'look': {
                busyFor(d, T.look, 'look');
                if (d.zone === 'shore' && d.reflect && d.f === '') {
                    d.f = 'active'; d.fLeft = T.fWindow; d.cover = 0; api.log(X.reflect); return api.majorEvent('F_REFLECTION');
                }
                const line = X.look[d.zone];
                return api.log(typeof line === 'function' ? line(d.wet) : line);
            }
            case 'search':
                if (d.zone === 'edge') return;
                busyFor(d, T.search, 'search');
                if (d.zone === d.targetZone && !d.found) { d.found = true; api.log(X.found); return api.majorEvent('TARGET_FOUND'); }
                return api.log(d.found ? X.found : X.searchNone);
            case 'secure':
                if (!d.found || d.secured || d.zone !== d.targetZone) return;
                busyFor(d, T.secure, 'secure'); d.secured = true; return api.log(X.secure);
            case 'go': {
                const [dest, route] = String(value).split(':');
                if (!data.neighbours[d.zone].includes(dest)) return;
                if (d.f === 'active') return fail(s, api, 'F_INCOMPLETE');
                if (dest === 'shore' || (d.zone === 'shore' && dest === 'woods')) { if (route !== 'L' && route !== 'R') return; }
                return startMove(s, api, dest, route);
            }
            case 'askDuration':
                if (!d.secured) return;
                busyFor(d, T.askDuration, 'ask'); d.asked.dur = true;
                d.known.dur = d.kind === 'clean' || d.kind === 'numb' ? '약 5분' : '약 40분';
                api.log(X.durationAnswer(d.kind));
                if (d.kind === 'overstay' && d.bind === '') { d.bind = 'ask'; api.log(X.bind); }
                return;
            case 'askSymptom':
                if (!d.secured) return;
                busyFor(d, T.askSymptom, 'ask'); d.asked.sym = true;
                d.known.sym = d.kind === 'numb' ? '저림 있음' : d.kind === 'survivor' ? '증상 없음 · 접촉 후 30시간 넘게 생존했다는 진술' : '증상 없음';
                return api.log(X.symptomAnswer(d.kind));
            case 'askTrace':
                if (!d.secured) return;
                busyFor(d, T.askTrace, 'ask'); d.asked.trace = true; d.known.trace = '겉으로 드러나는 흔적 없음';
                return api.log(X.traceAnswer);
            case 'verdict': {
                if (!d.secured || d.verdict) return;
                const contacted = d.kind !== 'clean';
                // The procedure is part of the rule: duration first, symptoms only when the stay was within 10 minutes.
                const checked = d.asked.dur && (d.kind === 'overstay' || d.kind === 'survivor' || d.asked.sym);
                if (!checked) return fail(s, api, 'E_UNCHECKED');
                if (value === 'transport') {
                    if (contacted) return fail(s, api, d.kind === 'survivor' ? 'B_RECOVERY' : 'E_MISJUDGED');
                    d.verdict = 'transport'; api.log(X.verdictTransport); return api.majorEvent('E_TRANSPORT');
                }
                if (value === 'report') {
                    if (!contacted) return fail(s, api, 'E_MISJUDGED');
                    d.verdict = 'report'; api.log(X.verdictReport); api.majorEvent('E_REPORT');
                    if (d.kind === 'survivor') api.log(X.protocolAsk);
                    return;
                }
                return;
            }
            case 'protocol':
                if (d.verdict !== 'report' || d.kind !== 'survivor' || d.protocol) return;
                if (value !== 'isolate') return fail(s, api, 'B_NOT_ISOLATED');
                d.protocol = 'isolate'; api.log(X.protocolDone); return api.majorEvent('B_ISOLATED');
            case 'exit': {
                if (d.zone !== 'edge') return;
                if (!d.found || !d.secured) return fail(s, api, 'ABORTED');
                if (!d.verdict) return fail(s, api, 'E_UNCHECKED');
                if (d.kind === 'survivor' && d.protocol !== 'isolate') return fail(s, api, 'B_NOT_ISOLATED');
                if (d.dev === 'alert' || d.dev === 'emp' || d.dev === 'sealed') return fail(s, api, 'D_UNSEALED');
                if (d.c === 'sound') return fail(s, api, 'C_UNRESOLVED');
                if (d.contact !== 'none' && !d.reported) return fail(s, api, 'CONTACT_UNREPORTED');
                api.log(d.kind === 'survivor' ? X.exitIsolate : d.verdict === 'transport' ? X.exitTransport : X.exitReport);
                api.majorEvent('EXTRACTED');
                return api.win('구조 성공 — 제한 시간 안에 반경 500m 밖으로 이탈했습니다. 생환 기록 전송.', { patrols: {}, elapsed: s.elapsed, injuries: [] });
            }
        }
    }

    function snapshot(s) { return { v: 1, ...JSON.parse(JSON.stringify(s.data)) }; }
    function restore(s, snap, api) {
        const ok = snap && snap.v === 1 && (snap.phase === 'briefing' || snap.phase === 'inside') && Number.isFinite(snap.timer) && snap.timer > 0 && snap.timer <= T.timer
            && ZONES.includes(snap.zone) && ['clean', 'numb', 'overstay', 'survivor'].includes(snap.kind) && (snap.wet === 'L' || snap.wet === 'R')
            && ['trail', 'woods', 'shore'].includes(snap.targetZone) && ['none', 'touched', 'numb', 'swelling', 'expanding'].includes(snap.contact);
        if (!ok) return false;
        const { v, ...rest } = snap;
        s.data = { ...s.data, ...rest, asked: { ...s.data.asked, ...(rest.asked || {}) }, known: { ...s.data.known, ...(rest.known || {}) } };
        return true;
    }

    FieldCore.register({ id: data.id, data, init, tick, action, scene: () => '', stamp: log => log.tag || '', snapshot, restore,
        manualClock: true, persist: true, startLog: data.startLog, restoredLog: data.restoredLog,
        logTag: tagOf, release() { /* nothing is held: losing focus never changes the situation */ },
        get ui() { return window.FieldEP05UI; }
    });
})();

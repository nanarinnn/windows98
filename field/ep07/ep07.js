// EP07 mission: one night shift at the counter (22:00 -> 06:00). The core loop is ordinary work — door chime, a
// customer walks in, a covert mirror glance, scanning, ID for tobacco/alcohol, payment, bag, exit — and A-G arrive
// as interrupts inside that loop (FieldEP07Data.schedule), never labeled. The player keeps their own chime/exit tally;
// the game never shows the real counts. Story, J record, blue screen, LOOP 02, AUTHOR and CLASSIFIED are never touched;
// clear unlocks Field EP08 only. Only outcomes the reviewed transcript states are described (canonFailures).
(() => {
    const data = FieldEP07Data;
    const T = data.tuning, X = data.text;

    function pick(name, n, fallback) {
        const v = data.random(name);
        if (typeof v === 'number' && Number.isInteger(v) && v >= 0 && v < n) return v;
        if (typeof v === 'number' && v >= 0 && v < 1) return Math.floor(v * n);
        return fallback;
    }

    function fail(s, api, code) {
        const d = s.data;
        let text = data.failures[code];
        if (code === 'D_UNREPORTED' && d.cust) {
            const g = d.cust.items.find(i => i.ghost);
            text += ` 신고하지 못한 채 손님이 매장을 벗어난 경우 결제 금액에 따라 피해가 발생한 사례가 확인되었습니다. 결제 금액 ${g.price.toLocaleString()}원 — ${g.part}.`;
        }
        const kind = data.failureKind[code] || '근무 기록';
        d.failCode = code; d.glance = null;
        api.die(`${code} — [${kind}] ${text} [근무 기록 중단]`, code, `[${kind}] ${FieldCore.time(d.clock)} 나눔 12시 편의점 계산대 — 근무 기록 중단`);
    }

    function newCustomer(spec) {
        const items = spec.items.map(key => {
            if (key === 'ghost') {
                const tier = data.ghostTiers[pick('dTier', data.ghostTiers.length, 2)];
                return { key, name: '', code: pick('ghostCode', 2, 1) ? data.ghostCode : '', price: tier.price, part: tier.part, ghost: true };
            }
            return { key, name: data.products[key].name, price: data.products[key].price };
        });
        return {
            items, pay: spec.pay, id: spec.id || null, bag: !!spec.bag, ask: !!spec.ask, voice: !!spec.voice, mirror: spec.mirror || 'normal',
            phase: 'browse', t: T.browse, gaze: 'away', gazeT: 0, mirrored: false, scanned: [], q: spec.ask ? 'wait' : 'none',
            idStage: spec.id ? 'none' : null, blink: spec.id === 'blink', blinked: false, blinkT: 0, holdT: 0, takeMs: 0,
            reported: false, ghostScanned: false, bagged: false, paid: false
        };
    }

    function init(s, api) {
        const [lo, hi] = T.endPressesRange;
        const v = data.random('endPresses');
        s.data = {
            clock: 0, sched: 0, cust: null, phantom: '', chimes: 0, exits: 0, doorLocked: false,
            urge: false, urgeWarned: false, glance: null, shelfOpen: false, f: '', wasteAlert: false, wasteDone: [],
            dawn: false, appOpen: false, presses: 0,
            need: (typeof v === 'number' && Number.isInteger(v) && v >= 1) ? v : lo + Math.floor((typeof v === 'number' ? v : 0.5) * (hi - lo + 1)),
            tally: { chime: 0, exit: 0 }, failCode: ''
        };
        api.log(`[POS] 전 근무 폐기 내역: ${data.prevWaste.item} ${data.prevWaste.at}`);
    }

    function customerLeaves(s, api, paid) {
        const d = s.data, c = d.cust;
        if (c.items.some(i => i.ghost) && !c.reported) return fail(s, api, 'D_UNREPORTED');
        d.exits += 1; d.cust = null; d.clock = Math.min(480, d.clock + T.txMinutes);
        api.log(paid === false ? X.idRefusedNormal : X.exit);
    }

    function fireNext(s, api) {
        const d = s.data, ev = data.schedule[d.sched];
        if (!ev || ev.at > d.clock) return;
        if (ev.customer) {
            if (d.doorLocked) return;   // nobody comes in while the door is locked
            d.chimes += 1; d.shelfOpen = false; d.cust = newCustomer(ev.customer);
            api.log(X.chime); api.log(X.enter);
        } else if (ev.phantom === 'enter') {
            if (d.doorLocked) return;
            d.chimes += 1; d.phantom = 'inside'; api.log(X.chime); api.log(X.nobody); api.majorEvent('E_CHIME');
        } else if (ev.phantom === 'pay') {
            if (d.phantom === 'inside') { d.exits += 1; d.phantom = 'gone'; api.log(X.phantomPay); api.log(X.phantomExit); }
        } else if (ev.urge) { d.urge = true; api.log(X.urge); }
        else if (ev.waste) { d.wasteAlert = true; api.log(X.wasteAlert); }
        else if (ev.dawn) { d.clock = 480; d.dawn = true; api.log(X.dawn); api.majorEvent('G_DAWN_DELAY'); }
        d.sched += 1;
    }

    function tick(s, dt, api) {
        const d = s.data;
        if (s.status !== 'active') return;
        const c = d.cust;
        if (d.glance) {
            d.glance.t += dt;
            if (c && c.phase === 'counter' && c.gaze === 'watch') return fail(s, api, 'MIRROR_LOCKED');   // caught looking
            if (d.glance.corridor && d.glance.t > T.corridorMax) return fail(s, api, 'MIRROR_LOCKED');
            if (c && d.glance.t > T.glanceMax) return fail(s, api, 'MIRROR_LOCKED');
        }
        if (c) {
            if (c.phase === 'browse') {
                c.t -= dt;
                if (c.t <= 0) {
                    c.phase = 'counter'; c.gaze = 'watch'; c.gazeT = T.gazeWatch;
                    api.log(X.atCounter(c.items.map(i => i.name || '포장된 상품').join(', ')));
                    if (c.q === 'wait') { c.q = 'pending'; api.log(c.voice ? X.askOverlap : X.ask); if (c.voice) api.majorEvent('C_VOICE'); }
                    if (c.bag) api.log(X.bagRequest);
                }
            } else if (c.phase === 'counter') {
                c.gazeT -= dt;
                if (c.gazeT <= 0) { c.gaze = c.gaze === 'watch' ? 'away' : 'watch'; c.gazeT = c.gaze === 'watch' ? T.gazeWatch : T.gazeAway; }
                if (c.id && c.mirrored && c.idStage === 'none') { c.idStage = 'handed'; api.log(X.idHanded); }
                if (c.idStage === 'taken' && c.blink) {
                    c.blinkT += dt;
                    if (!c.blinked && c.blinkT >= T.blinkAfter) { c.blinked = true; api.log(X.idBlink); api.majorEvent('B_ID'); }
                    if (c.blinked) { c.holdT += dt; if (c.holdT > T.idHold) return fail(s, api, 'ID_FAIL'); }
                }
            } else if (c.phase === 'paid') {
                if (c.bag && !c.bagged) return;
                c.t -= dt; if (c.t <= 0) return customerLeaves(s, api, true);
            }
            return;
        }
        if (d.dawn) return;
        d.clock = Math.min(480, d.clock + dt / T.idleSecondsPerMinute);
        if (d.urge) {
            if (!d.urgeWarned && d.clock >= T.urgeUntil - 60) { d.urgeWarned = true; api.log(X.urgeWorse); }
            if (d.clock >= T.urgeUntil) return fail(s, api, 'URGE');
        }
        fireNext(s, api);
    }

    const ready = c => c.scanned.length === c.items.length && c.q !== 'pending' && (!c.id || c.idStage === 'returned');

    function action(s, name, value, api) {
        const d = s.data, c = d.cust;
        if (s.status !== 'active') return;
        switch (name) {
            case 'tally': {   // the player's own memo; never checked against the real counts
                const row = value && value.row === 'exit' ? 'exit' : 'chime';
                d.tally[row] = Math.max(0, d.tally[row] + (value && value.delta < 0 ? -1 : 1));
                return;
            }
            case 'glance':
                if (value) {
                    if (d.glance) return;
                    if (!c) { api.log(X.glanceEmpty); d.glance = null; return; }
                    if (c.phase === 'counter' && c.gaze === 'watch') return fail(s, api, 'MIRROR_LOCKED');
                    d.glance = { t: 0, corridor: c.mirror === 'corridor' };
                    if (d.glance.corridor) { api.log(X.mirrorCorridor); api.majorEvent('A_MIRROR'); }
                } else if (d.glance) {
                    const g = d.glance; d.glance = null;
                    if (!c) return;
                    if (g.t >= T.glanceMin) { c.mirrored = true; api.log(g.corridor ? X.mirrorAway : X.mirrorNormal); }
                    else api.log('[방범거울] 제대로 보지 못했다.');
                }
                return;
            case 'greet': if (c) return fail(s, api, 'SPOKE_FIRST'); return api.log(X.spoke);
            case 'scan': {
                if (!c || c.phase !== 'counter') return;
                if (!c.mirrored) return fail(s, api, 'MIRROR_SKIPPED');
                const i = Number(value); const item = c.items[i];
                if (!item || c.scanned.includes(i)) return;
                c.scanned.push(i);
                if (item.ghost) { c.ghostScanned = true; api.log(X.scannedGhost(item.price)); api.majorEvent('D_GHOST_ITEM'); }
                else api.log(X.scanned(item.name, item.price));
                return;
            }
            case 'answer': case 'pointPrice': case 'pointScreen':
                if (!c || c.q !== 'pending') return;
                if (name === 'answer') { if (c.voice) return fail(s, api, 'VOICE_LOST'); api.log(X.answeredAloud(c.items[0].price)); }
                else api.log(X.pointed(name === 'pointPrice' ? '가격표' : 'POS 화면'));
                c.q = 'done'; return;
            case 'idTake':
                if (!c || c.idStage !== 'handed') return;
                c.idStage = 'taken'; c.takeMs = Math.max(1, Number(value) || 1); c.blinkT = 0; c.holdT = 0; api.log(X.idTaken); return;
            case 'idLook':
                if (!c || c.idStage !== 'taken') return;
                if (c.blinked) return fail(s, api, 'ID_FAIL');
                return api.log(X.idLooked);
            case 'idReturn': {
                if (!c || c.idStage !== 'taken') return;
                const ms = Math.max(1, Number(value) || 1);
                if (c.blinked && Math.abs(ms - c.takeMs) / c.takeMs > T.idTolerance) return fail(s, api, 'ID_FAIL');
                c.idStage = 'returned'; return api.log(X.idReturned);
            }
            case 'refuse':
                if (!c || !c.id || c.idStage === 'returned') return;
                if (c.blink) return fail(s, api, 'ID_FAIL');
                return customerLeaves(s, api, false);
            case 'pay':
                if (!c || c.phase !== 'counter') return;
                if (!c.mirrored) return fail(s, api, 'MIRROR_SKIPPED');
                if (!ready(c)) return api.log(X.notReady);
                if (value !== c.pay) return api.log(X.wrongMethod(c.pay));
                c.phase = 'paid'; c.paid = true; c.t = T.leave;
                return api.log(X.paid(c.pay === 'card' ? '카드' : '현금', c.items.reduce((a, i) => a + i.price, 0)));
            case 'bag':
                if (c && c.bag && !c.bagged && c.phase !== 'browse') { c.bagged = true; api.log(X.bagged); }
                return;
            case 'hq':
                if (c && c.ghostScanned && !c.reported) { c.reported = true; return api.log(X.hqGhost); }
                if (d.f === 'contained') { d.f = 'done'; return api.log(X.hqWaste); }
                return api.log(X.hqDummy);
            case 'lockDoor':
                if (d.doorLocked) return;
                if (c) return api.log(X.lockRefused);
                d.doorLocked = true; return api.log(X.lock);   // an unseen customer is not detected here: counting is the player's job
            case 'unlockDoor':
                if (d.doorLocked) { d.doorLocked = false; api.log(X.unlock); }
                return;
            case 'leave':
                if (c) return fail(s, api, 'LEAVE_WITH_CUSTOMER');
                if (d.chimes !== d.exits) return fail(s, api, 'E_LEFT_DURING_MISMATCH');
                if (!d.doorLocked) return fail(s, api, 'DOOR_UNLOCKED');
                d.urge = false; d.doorLocked = false; d.clock = Math.min(480, d.clock + T.restMinutes); return api.log(X.rest);
            case 'goOutside':
                if (d.dawn) return fail(s, api, 'G_OUTSIDE');
                if (c) return fail(s, api, 'LEAVE_WITH_CUSTOMER');
                if (d.chimes !== d.exits) return fail(s, api, 'E_LEFT_DURING_MISMATCH');
                return fail(s, api, 'DOOR_UNLOCKED');
            case 'shelf':
                if (value === false) { d.shelfOpen = false; return; }
                if (c) return api.log(X.notNow);
                d.shelfOpen = true; return api.log(X.shelfOpen);
            case 'registerWaste': case 'barehand': case 'tongs': {
                if (!d.shelfOpen || c) return;
                const item = data.shelf.find(i => i.id === value); if (!item) return;
                if (item.returned) {
                    if (name === 'registerWaste') return fail(s, api, 'F_REREGISTER');
                    if (name === 'barehand') return fail(s, api, 'F_BAREHAND');
                    if (d.f === '') { d.f = 'tongs'; api.log(X.tongs); api.majorEvent('F_RETURNED'); }
                    return;
                }
                if (name === 'tongs') return api.log(X.tongsNormal);
                if (name === 'barehand') return api.log(X.tidy(item.name));
                if (!item.expired || !d.wasteAlert) return api.log('[POS] 아직 폐기 대상이 아니다.');
                if (!d.wasteDone.includes(item.id)) { d.wasteDone.push(item.id); api.log(X.wasteRegistered(item.name)); }
                return;
            }
            case 'contain':
                if (d.f === 'tongs') { d.f = 'contained'; api.log(X.contained); }
                return;
            case 'openApp': d.appOpen = true; return api.log(X.appOpen);
            case 'endShift':
                if (!d.appOpen) return;
                if (!d.dawn) return api.log(X.endEarly);
                d.presses += 1;
                if (d.presses < d.need) return api.log(X.endFail);
                d.exterior = 'light'; api.log(X.endDone);
                return api.win(data.clearText, { patrols: {}, elapsed: s.elapsed, injuries: [] });
        }
    }

    FieldCore.register({
        id: data.id, data, init, tick, action, scene: () => '',
        logTag: run => FieldCore.time(run.data.clock),
        stamp: log => log.tag || '',
        manualClock: true, startLog: data.startLog,
        release() { if (FieldCore.get()?.data?.glance) FieldCore.action('glance', false); },   // losing focus ends a glance
        get ui() { return window.FieldEP07UI; }
    });
})();

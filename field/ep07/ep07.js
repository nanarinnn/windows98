// EP07 mission: night-shift convenience-store counter duty. A fixed queue of customers (normal visits interleaved
// with the seven reviewed situations A-G) plays out. Every customer is first checked in the security mirror (A shows
// the endless corridor); the register is never left while a customer is inside, while the door-chime / exit count
// is off, or without locking the auto door. Story, J record, blue screen and LOOP 02 are never touched here.
// Only outcomes the reviewed transcript states are described as consequences; SPOKE_FIRST/LEAVE_WITH_CUSTOMER/
// F_BAREHAND get a minimal "record interrupted" result since the transcript gives no specific consequence for them.
(() => {
    const data = FieldEP07Data;
    const T = data.tuning;
    const X = data.text;
    const rnd = name => data.random(name);

    function pickIndex(name, list) {
        const v = rnd(name);
        if (typeof v === 'number' && Number.isInteger(v) && v >= 0 && v < list.length) return v;
        if (typeof v === 'string' && /^\d+$/.test(v) && Number(v) < list.length) return Number(v);
        const roll = typeof v === 'number' ? v : 0.5;
        return Math.min(list.length - 1, Math.floor(roll * list.length));
    }

    function fail(s, api, code) {
        s.data.failCode = code;
        const raw = data.failures[code];
        const message = typeof raw === 'function' ? raw(s) : raw;
        api.die(`${code} — ${message}`, code);
    }

    function enterVisit(s, api, code) {
        const d = s.data;
        d.visit = code; d.customerPresent = false;
        d.mirrorState = ''; d.mirrorTimer = 0;   // every customer is checked in the mirror first: '' -> clear | corridor -> away
        d.idRevealed = false; d.idTimer = 0;
        d.dTier = null; d.dTimer = 0; d.dReported = false;
        d.ePhase = ''; d.eElapsed = 0;
        d.fStage = '';
        d.gPresses = 0; d.gNeeded = 0; d.appOpen = false;
        if (code === 'N') {
            d.nItem = data.items.normal[pickIndex('nItem', data.items.normal)];
            d.customerPresent = true; d.chimes += 1; api.log(X.arriveNormal(d.nItem));
        } else if (code === 'A') {
            // looks exactly like a normal visit until the mirror is checked
            d.nItem = data.items.normal[pickIndex('nItem', data.items.normal)];
            d.customerPresent = true; d.chimes += 1; api.log(X.arriveNormal(d.nItem)); api.majorEvent('A_MIRROR');
        } else if (code === 'B') {
            d.customerPresent = true; d.chimes += 1; api.log(X.arriveB); api.majorEvent('B_ID');
        } else if (code === 'C') {
            d.customerPresent = true; d.chimes += 1; api.log(X.arriveC); api.majorEvent('C_VOICE');
        } else if (code === 'D') {
            const tier = data.items.ghostTiers[pickIndex('dTier', data.items.ghostTiers)];
            d.dTier = tier; d.dTimer = T.dReportDeadline; d.customerPresent = true; d.chimes += 1;
            api.log(X.arriveD); api.majorEvent('D_GHOST_ITEM');   // the barcode is scanned (and the timer runs) after the mirror check
        } else if (code === 'E') {
            d.ePhase = 'waiting'; d.eElapsed = 0; d.chimes += 1; api.log(X.arriveE); api.majorEvent('E_CHIME');
        } else if (code === 'F') {
            d.fStage = ''; api.log(X.arriveF(T.prevDiscardItem)); api.majorEvent('F_RETURNED');
        } else if (code === 'G') {
            const [lo, hi] = T.gPressesRange;
            const v = rnd('endPresses');
            d.gNeeded = (typeof v === 'number' && Number.isInteger(v) && v >= 1) ? v : lo + Math.floor((typeof v === 'number' ? v : 0.5) * (hi - lo + 1));
            d.gPresses = 0; d.appOpen = false;
            api.log(X.gArrive); api.majorEvent('G_DAWN_DELAY');
        }
    }

    function advance(s, api) {
        const d = s.data;
        d.queueIdx += 1;
        if (d.queueIdx < data.queue.length) enterVisit(s, api, data.queue[d.queueIdx]);
        else enterVisit(s, api, 'G');
    }

    function init(s, api) {
        s.data = {
            queueIdx: -1, visit: '', chimes: 0, exits: 0,
            customerPresent: false, nItem: '', doorLocked: false,
            mirrorState: '', mirrorTimer: 0,
            idRevealed: false, idTimer: 0,
            dTier: null, dTimer: 0, dReported: false,
            ePhase: '', eElapsed: 0,
            fStage: '',
            gPresses: 0, gNeeded: 0, appOpen: false,
            failCode: ''
        };
        api.log(X.prevDiscard(T.prevDiscardItem));
        advance(s, api);
    }

    function tick(s, dt, api) {
        const d = s.data;
        if (s.status !== 'active') return;
        if (d.visit === 'A' && d.mirrorState === 'corridor') {
            d.mirrorTimer -= dt; if (d.mirrorTimer <= 0) return fail(s, api, 'MIRROR_LOCKED');
        } else if (d.visit === 'B' && d.idRevealed) {
            d.idTimer -= dt; if (d.idTimer <= 0) { d.idReason = '신분증 반환이 지연되었습니다'; return fail(s, api, 'ID_FAIL'); }
        } else if (d.visit === 'D' && d.dTier && mirrorDone(d)) {
            d.dTimer -= dt;
            if (d.dTimer <= 0) {
                if (d.dReported) { d.exits += 1; api.log(X.dDone); return advance(s, api); }
                return fail(s, api, 'D_UNREPORTED');
            }
        } else if (d.visit === 'E') {
            d.eElapsed += dt;
            if (d.ePhase === 'waiting' && d.eElapsed >= T.eChimeAt) { d.ePhase = 'phantom'; api.log(X.ePhantom); }
            else if (d.ePhase === 'phantom' && d.eElapsed >= T.eExitAt) {
                d.exits += 1; d.ePhase = 'resolved'; api.log(X.eResolved); return advance(s, api);
            }
        }
    }

    const mirrorDone = d => d.mirrorState === 'clear' || d.mirrorState === 'away';

    function action(s, name, value, api) {
        const d = s.data;
        if (s.status !== 'active') return;
        if (name === 'speakFirst') { if (d.customerPresent) return fail(s, api, 'SPOKE_FIRST'); return; }
        if (name === 'lockDoor') {
            if (d.doorLocked) return;
            if (d.customerPresent) return api.log(X.lockRefused);
            d.doorLocked = true; return api.log(X.lockOk);   // an unseen customer (E mismatch) is not detected here: counting is the player's job
        }
        if (name === 'leaveCounter') {
            if (d.customerPresent) return fail(s, api, 'LEAVE_WITH_CUSTOMER');
            if (d.chimes !== d.exits) return fail(s, api, 'E_LEFT_DURING_MISMATCH');
            if (!d.doorLocked) return fail(s, api, 'DOOR_UNLOCKED');
            d.doorLocked = false; return api.log(X.leaveOk);
        }
        if (d.customerPresent && name === 'mirrorCheck' && d.mirrorState === '') {
            api.log(X.mirrorCheck);
            if (d.visit === 'A') { d.mirrorState = 'corridor'; d.mirrorTimer = T.mirrorWindow; return api.log(X.mirrorCorridor); }
            d.mirrorState = 'clear'; api.log(X.mirrorNormal);
            if (d.visit === 'D') api.log(X.dScan);
            return;
        }
        if (d.visit === 'A' && name === 'mirrorAway' && d.mirrorState === 'corridor') { d.mirrorState = 'away'; return api.log(X.mirrorAway); }
        if (d.customerPresent && !mirrorDone(d)) return;   // nothing else happens at the counter before the mirror check
        switch (d.visit) {
            case 'N':
                if (name === 'payNormal') { d.exits += 1; api.log(X.payNormal); return advance(s, api); }
                return;
            case 'A':
                if (name === 'payA') { d.exits += 1; api.log(X.payA); return advance(s, api); }
                return;
            case 'B':
                if (name === 'idCheck' && !d.idRevealed) { d.idRevealed = true; d.idTimer = T.idDeadline; return api.log(X.idCheck); }
                if (name === 'idRefuse') { d.idReason = '사진과 실물이 다르다는 이유로 판매를 거절했습니다'; return fail(s, api, 'ID_FAIL'); }
                if (!d.idRevealed) return;
                if (name === 'idReturnSame') { d.exits += 1; api.log(X.idReturned); return advance(s, api); }
                if (name === 'idReturnStartled') { d.idReason = '신분증 사진이 눈을 깜빡이는 것을 보고 놀란 기색을 보였습니다'; return fail(s, api, 'ID_FAIL'); }
                if (name === 'idReturnWrongSpeed') { d.idReason = '건네받았을 때와 다른 손짓과 속도로 돌려주었습니다'; return fail(s, api, 'ID_FAIL'); }
                return;
            case 'C':
                if (name === 'cPointPrice' || name === 'cPointScreen') { d.exits += 1; api.log(X.cPoint); return advance(s, api); }
                if (name === 'cAnswerAloud') return fail(s, api, 'VOICE_LOST');
                return;
            case 'D':
                if (name === 'hqCall' && d.dTier && !d.dReported) { d.dReported = true; return api.log(X.dReported(d.dTier.price)); }
                return;
            case 'F':
                if (name === 'fBarehand') return fail(s, api, 'F_BAREHAND');
                if (name === 'fReregister') return fail(s, api, 'F_REREGISTER');
                if (name === 'fTongs' && d.fStage === '') { d.fStage = 'tongs'; return api.log(X.fTongs); }
                if (name === 'fContained' && d.fStage === 'tongs') { d.fStage = 'contained'; return api.log(X.fContained); }
                if (name === 'hqCall' && d.fStage === 'contained') { d.fStage = 'done'; api.log(X.fReported); return advance(s, api); }
                return;
            case 'G':
                if (name === 'goOutside') return fail(s, api, 'G_OUTSIDE');
                if (name === 'openApp') { d.appOpen = true; return api.log(X.gAppOpen); }
                if (name === 'pressEnd' && d.appOpen) {
                    d.gPresses += 1;
                    if (d.gPresses < d.gNeeded) return api.log(X.gPressFail);
                    api.log(X.gPressDone);
                    return api.win(data.clearText, { patrols: {}, elapsed: s.elapsed, injuries: [] });
                }
                return;
        }
    }

    FieldCore.register({
        id: data.id, data, init, tick, action, scene: () => '',
        logTag: run => {
            const total = data.queue.length + 1; // +1 for the final G phase
            const idx = Math.min(total, Math.max(0, run.data.queueIdx + 1));
            return FieldCore.time(Math.round((idx / total) * 480));
        },
        stamp: log => log.tag || '',
        manualClock: true, startLog: data.startLog,
        release() { /* nothing is held: losing focus never changes the situation */ },
        get ui() { return window.FieldEP07UI; }
    });
})();

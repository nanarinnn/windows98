// EP04 mission: a closed-elevator mirror observation puzzle. The front indicator always says 13. The only truth about the real
// floor is the REAR mirror; the only truth about where she is comes from the SIDE mirrors. Looking at the rear mirror gives
// information AND moves her to the opposite side one step closer. No shift clock: the run ends through FieldCore.win()/die().
// Story, J record, blue screen and LOOP 02 are never touched here. Anything the reviewed document does not state ends in a
// minimal non-canon "record lost" failure (see FieldEP04Data.failures / canonFailures).
(() => {
    const data = FieldEP04Data;
    const T = data.tuning;
    const X = data.text;
    const rnd = name => data.random(name);
    const rint = (name, lo, hi) => lo + Math.min(hi - lo, Math.floor(rnd(name) * (hi - lo + 1)));
    const other = side => (side === 'L' ? 'R' : 'L');
    const sideName = side => (side === 'L' ? '왼쪽' : '오른쪽');
    // Accepts a forced string pick from a test-injected rng; otherwise a weighted roll.
    function pickWeighted(name, entries) {
        const v = rnd(name);
        if (typeof v === 'string') { const hit = entries.find(([key]) => key === v); if (hit) return hit[0]; }
        const total = entries.reduce((sum, [, w]) => sum + w, 0);
        let roll = (typeof v === 'number' ? v : 0.5) * total;
        for (const [key, w] of entries) { if ((roll -= w) < 0) return key; }
        return entries[entries.length - 1][0];
    }

    function fail(s, api, code) {
        s.data.failCode = code;
        api.die(`${code} — ${data.failures[code]}`, code);
    }

    function init(s, api) {
        s.inventory = {}; s.controls = {};
        s.data = {
            floor: rint('start', T.startFloor[0], T.startFloor[1]),   // real floor (never shown outside the rear mirror)
            lastFloor: 0,                                           // last floor actually confirmed in the rear mirror
            side: rnd('side') < 0.5 ? 'L' : 'R',                    // where she really is
            seenSide: '',                                           // last side where the player actually saw her
            dist: 0, remaining: T.count, arrivals: 0,
            doors: 'closed', doorLeft: 0, doorHold: false, moving: 0, target: 0,
            rear: null, sideView: { L: '', R: '' }, facing: 'front',
            ev: null, dual: false, aboard: false, male: false, c2: false, lastEvent: '', mem: 0,
            crouched: false, covered: false, knocks: 0,
            phone: '', photoOffer: false, holdFloor: 0, holdT: 0, failCode: ''
        };
    }

    const tagOf = s => `#${String(s.data.arrivals).padStart(2, '0')}`;

    // She comes one step (or more) closer; lighting/noise cues are observations, not numbers.
    function approach(s, api, steps) {
        const d = s.data, before = d.dist;
        d.dist += steps;
        const marks = [Math.ceil(T.critical * 0.3), Math.ceil(T.critical * 0.6), Math.ceil(T.critical * 0.85)];
        marks.forEach((mark, i) => { if (before < mark && d.dist >= mark && d.dist < T.critical) api.log(X.dim[i]); });
        if (d.dist >= T.critical) fail(s, api, 'RECORD_LOST');
    }

    // ---- movement -----------------------------------------------------------------------------------------------------
    function beginMove(s, api, target, message) {
        const d = s.data;
        d.target = target; d.moving = T.travel;
        d.rear = null; d.sideView = { L: '', R: '' }; d.facing = 'front'; d.dual = false; d.photoOffer = false;
        d.holdFloor = 0; d.holdT = 0;
        api.log(message || X.move);
    }

    function arrive(s, api) {
        const d = s.data;
        d.floor = d.target; d.moving = 0; d.arrivals += 1;
        d.facing = 'front'; d.crouched = false; d.covered = false; d.knocks = 0;
        d.rear = null; d.sideView = { L: '', R: '' }; d.dual = false; d.photoOffer = false;
        d.doors = 'open'; d.doorLeft = T.doorOpen; d.doorHold = false; d.ev = null;
        api.log(X.arrive);
        const hadPassengers = d.aboard;
        d.aboard = false;
        if (d.floor === 1) {                       // canon: floor 1 always stops; nothing else happens there
            d.male = false; d.c2 = false;
            if (hadPassengers) api.log(X.BLeave);
            return;
        }
        if (d.c2) return startC2(s, api);
        if (hadPassengers) {
            api.log(X.BLeave);
            if (d.male) return startC1(s, api);
        }
        rollEvent(s, api);
    }

    function rollEvent(s, api) {
        const d = s.data;
        // Pacing (tuning): every run should meet at least one memory event (D or E) once it is well under way.
        const memoryDue = d.arrivals >= T.memoryBy && d.mem === 0 && d.lastFloor > 0;
        if (!memoryDue && (d.arrivals <= T.freeArrivals || rnd('event') >= T.eventChance)) { d.lastEvent = ''; return; }
        const stage = d.arrivals <= 4 ? 'early' : d.arrivals <= 7 ? 'mid' : 'late';
        let entries = memoryDue ? [['D', 1], ['E', 1]] : data.weights[stage].filter(([key]) => key !== 'E' || d.lastFloor > 0);
        const fresh = entries.filter(([key]) => key !== d.lastEvent);
        if (fresh.length) entries = fresh;
        const kind = pickWeighted('eventKind', entries);
        d.lastEvent = kind;
        if (kind === 'D' || kind === 'E') d.mem += 1;
        if (kind === 'A') { d.ev = { t: 'A' }; api.log(X.A); api.majorEvent('A_EMPTY_CORRIDOR'); }
        else if (kind === 'B') {
            d.ev = { t: 'B', talk: rnd('talk') < T.talkChance ? 'wait' : 'none', delay: T.talkDelay, window: T.talkWindow };
            d.aboard = true; d.male = rnd('male') < T.maleChance;
            api.log(X.B); api.majorEvent('B_PASSENGERS');
        } else if (kind === 'D') { d.dual = true; }          // only becomes visible when a side mirror is looked at
        else if (kind === 'E') { d.ev = { t: 'E', stage: 'wait', voice: rnd('voice') < 0.5 ? 'name' : 'family' }; }
    }

    function startC1(s, api) {
        const d = s.data;
        d.male = false; d.c2 = true; d.lastEvent = 'C';
        api.log(X.C1); api.majorEvent('C_MALE_EXIT');
    }

    function startC2(s, api) {
        const d = s.data;
        d.c2 = false; d.lastEvent = 'C';
        d.ev = { t: 'C2', start: T.c2Start, holdT: 0, stairT: 0, n: 0, cueAt: rint('cue', T.c2Cue[0], T.c2Cue[1]), cued: false, holding: false };
        api.log(X.C2); api.majorEvent('C_WAITING');
    }

    function closeDoors(s, api) {
        const d = s.data;
        d.doors = 'closed'; d.doorLeft = 0; d.doorHold = false;
        api.log(X.close);
        if (d.ev?.t === 'A') {                      // canon: whether it rises or descends is not fixed
            d.ev = null;
            const dir = rnd('autoDir') < 0.5 ? 1 : -1, delta = T.deltas[Math.floor(rnd('autoDelta') * T.deltas.length) % T.deltas.length];
            const target = dir < 0 ? Math.max(1, d.floor - delta) : Math.min(T.topFloor, d.floor + delta);
            return beginMove(s, api, target, X.AClose);
        }
        if (d.ev?.t === 'E' && d.ev.stage === 'wait') {
            d.ev.stage = 'voice'; d.ev.holdT = 0;
            api.log(d.ev.voice === 'name' ? X.voiceName : X.voiceFamily); api.log(X.flicker); api.majorEvent('E_VOICE');
        }
    }

    const blocked = d => (d.ev?.t === 'B' && d.ev.talk === 'talking') || (d.ev?.t === 'D');

    function tick(s, dt, api) {
        const d = s.data, ev = d.ev;
        if (s.status !== 'active') return;
        if (d.moving > 0) {
            d.moving -= dt;
            if (d.moving <= 0) arrive(s, api);
            return;
        }
        // --- situation C: the male entity waits one floor below; hold the door-open button until the broadcast sobs --------
        if (ev?.t === 'C2') {
            ev.stairT += dt;
            if (ev.stairT >= T.c2StairEvery) { ev.stairT = 0; api.log(X.stair[ev.n % 2]); ev.n += 1; }
            if (ev.holding) {
                ev.holdT += dt;
                if (!ev.cued && ev.holdT >= ev.cueAt) { ev.cued = true; api.log(X.cue); api.majorEvent('C_BROADCAST_SOB'); }
            } else if (ev.holdT === 0) {
                ev.start -= dt;
                if (ev.start <= 0) return fail(s, api, 'C_NO_HOLD');
            }
            return;                                 // doors stay open for the whole situation
        }
        // --- doors ---------------------------------------------------------------------------------------------------------
        if (d.doors === 'open') {
            if (d.doorHold) d.doorLeft = T.doorOpen;
            else { d.doorLeft -= dt; if (d.doorLeft <= 0) closeDoors(s, api); }
            return;
        }
        // --- situation B: a passenger speaks; the procedure must be finished in time -------------------------------------
        if (ev?.t === 'B') {
            if (ev.talk === 'wait') {
                ev.delay -= dt;
                if (ev.delay <= 0) { ev.talk = 'talking'; api.log(X.BTalk); api.majorEvent('B_TALK'); }
            } else if (ev.talk === 'talking') {
                ev.window -= dt;
                if (ev.window <= 0) return fail(s, api, 'B_UNRESOLVED');
            }
        }
        // --- situation E: hold the matching floor button for 3 seconds ----------------------------------------------------
        if (ev?.t === 'E' && ev.stage === 'voice' && d.holdFloor) {
            d.holdT += dt;
            if (d.holdT >= T.eHold) {
                d.ev = null; d.holdFloor = 0; d.holdT = 0;
                api.log(X.scream); api.majorEvent('E_CUT');
            }
        }
    }

    function press(s, api, n) {
        const d = s.data, ev = d.ev;
        if (!Number.isInteger(n) || n < 1 || n > data.floors || d.moving > 0) return;
        if (d.doors === 'open') return api.log(X.blockedDoor);
        if (ev?.t === 'E' && ev.stage === 'voice') {
            if (n !== d.lastFloor) return fail(s, api, 'E_WRONG_BUTTON');
            if (!d.holdFloor) { d.holdFloor = n; d.holdT = 0; api.log(X.press(n)); }
            return;
        }
        if (blocked(d)) return api.log(X.blockedTalk);
        if (d.floor === 1) { api.log(X.move); return fail(s, api, 'MISSING'); }     // left floor 1 without getting off
        // Canon: she on the left -> a floor above the real floor descends; on the right -> a floor below. Otherwise it rises.
        const correct = (d.side === 'L' && n > d.floor) || (d.side === 'R' && n < d.floor);
        const delta = T.deltas[Math.floor(rnd('delta') * T.deltas.length) % T.deltas.length];
        beginMove(s, api, correct ? Math.max(1, d.floor - delta) : Math.min(T.topFloor, d.floor + delta));
    }

    function action(s, name, value, api) {
        const d = s.data, ev = d.ev;
        if (s.status !== 'active') return;
        switch (name) {
            // --- the mirrors ---------------------------------------------------------------------------------------------
            case 'rear': {
                if (d.moving > 0) return;
                if (d.remaining <= 0) return fail(s, api, 'NO_COUNT');
                const shown = d.remaining; d.remaining -= 1; d.facing = 'rear';
                if (ev?.t === 'A') { d.rear = { face: true }; api.log(X.rearFace); }       // canon: face fills the mirror, floor unreadable
                else { d.rear = { floor: d.floor, count: shown }; d.lastFloor = d.floor; api.log(X.rear(d.rear)); }
                d.side = other(d.side); d.sideView = { L: '', R: '' };                      // she moves to the opposite side...
                approach(s, api, 1);                                                          // ...and one step closer
                return;
            }
            case 'side': {
                if (d.moving > 0 || (value !== 'L' && value !== 'R')) return;
                d.facing = value === 'L' ? 'left' : 'right';
                if (d.dual) {                         // situation D: she is seen in both mirrors at once
                    if (!ev) { d.ev = { t: 'D' }; api.majorEvent('D_DUAL'); }
                    d.sideView = { L: 'her', R: 'her' }; return api.log(X.dual);
                }
                const here = d.side === value;
                d.sideView = { ...d.sideView, [value]: here ? 'her' : 'none' };
                if (here) { d.seenSide = d.side; api.log(X.herAt(sideName(value), d.dist)); }
                else api.log(X.empty(sideName(value)));
                return;
            }
            // --- controls ------------------------------------------------------------------------------------------------
            case 'press': return press(s, api, Math.floor(Number(value)));
            case 'releaseFloor':
                if (ev?.t === 'E' && d.holdFloor === Math.floor(Number(value))) { d.holdFloor = 0; d.holdT = 0; }
                return;
            case 'door': {
                if (d.moving > 0) return;
                const down = value !== false;
                if (down) {
                    if (d.doors !== 'open') { d.doors = 'open'; d.doorLeft = T.doorOpen; api.log(X.open); }
                    d.doorHold = true;
                    if (ev?.t === 'C2' && !ev.holding) { ev.holding = true; api.log(X.hold); }
                } else {
                    d.doorHold = false;
                    if (ev?.t === 'C2' && ev.holding) {
                        ev.holding = false;
                        if (!ev.cued) return fail(s, api, 'C_EARLY_RELEASE');
                        d.ev = null; d.doorLeft = T.doorRelease; api.log(X.unhold); api.majorEvent('C_RELEASED');
                    } else if (d.doors === 'open') d.doorLeft = Math.min(d.doorLeft, T.doorRelease);
                }
                return;
            }
            case 'exit':
                if (d.doors !== 'open' || d.moving > 0) return;
                if (d.floor !== 1) return fail(s, api, 'EXIT_WRONG_FLOOR');
                api.log(X.exit);
                if (d.phone === 'taken') api.log(X.report);
                api.majorEvent('FLOOR_ONE_EXIT');
                return api.win(X.clear, { patrols: {}, elapsed: s.elapsed, injuries: [] });
            // --- situation B ---------------------------------------------------------------------------------------------
            case 'knock': {
                if (ev?.t !== 'B' || ev.talk !== 'talking' || (value !== 'L' && value !== 'R')) return;
                if (value !== d.side) return fail(s, api, 'B_WRONG_MIRROR');
                if (d.knocks >= 3) return;
                d.knocks += 1; return api.log(X.knock(sideName(value), d.knocks));
            }
            case 'cover':
                if (ev?.t !== 'B' || ev.talk !== 'talking' || d.covered) return;
                d.covered = true; return api.log(X.cover);
            case 'crouch':
                if (ev?.t !== 'B' || ev.talk !== 'talking') return;
                if (d.knocks < 3 || !d.covered) return fail(s, api, 'B_BAD_ORDER');
                ev.talk = 'done'; d.crouched = true; api.log(X.crouch); return api.majorEvent('B_ENDURED');
            case 'answer':
                if (ev?.t === 'B' && ev.talk === 'talking') return fail(s, api, 'B_ANSWERED');
                if (ev?.t === 'E' && ev.stage === 'voice') return fail(s, api, 'E_ANSWERED');
                return;
            // --- situation D ---------------------------------------------------------------------------------------------
            case 'photo': {
                if (ev?.t !== 'D' || (value !== 'L' && value !== 'R')) return;
                if (value === d.side) return fail(s, api, 'D_WRONG_MIRROR');             // she was supposed to be here: canon failure
                d.ev = null; d.dual = false; d.phone = 'taken'; d.photoOffer = true;
                d.sideView = { L: '', R: '', [value]: 'none', [d.side]: 'her' };
                d.seenSide = d.side;
                api.log(X.photo(sideName(value))); return api.majorEvent('D_PHOTO');
            }
            case 'still':
                if (ev?.t !== 'D') return;
                d.ev = null; d.dual = false; d.sideView = { L: '', R: '' };
                api.log(X.still); return approach(s, api, 2);                             // canon: two steps closer
            case 'viewPhoto':
                if (!d.photoOffer) return;
                return fail(s, api, 'D_PHOTO_VIEWED');
            // --- situation E ---------------------------------------------------------------------------------------------
            case 'turn':
                if (ev?.t === 'E' && ev.stage === 'voice') return fail(s, api, 'E_SPEAKER');
                return;
        }
    }

    function snapshot(s) { return { v: 1, ...JSON.parse(JSON.stringify(s.data)) }; }
    function restore(s, snap, api) {
        const ok = snap && snap.v === 1 && Number.isInteger(snap.floor) && snap.floor >= 1 && snap.floor <= T.topFloor
            && (snap.side === 'L' || snap.side === 'R') && Number.isFinite(snap.dist) && snap.dist >= 0 && snap.dist < T.critical
            && Number.isInteger(snap.remaining) && snap.remaining >= 0 && snap.remaining <= T.count && Number.isInteger(snap.arrivals) && snap.arrivals >= 0;
        if (!ok) return false;
        const { v, ...rest } = snap;
        s.data = { ...s.data, ...rest, sideView: { ...s.data.sideView, ...(rest.sideView || {}) } };
        s.data.doorHold = false; s.data.holdFloor = 0; s.data.holdT = 0;     // a held button never survives a reload
        if (s.data.ev?.holding) s.data.ev.holding = false;
        if (s.data.floor === 1 && s.data.doors !== 'open') s.data.doors = 'closed';
        return true;
    }

    // Losing focus lets go of any held button but is never itself a failure.
    function release(s) {
        const d = s?.data; if (!d) return;
        d.doorHold = false; d.holdFloor = 0; d.holdT = 0;
        if (d.ev?.t === 'C2' && d.ev.holding) d.ev.holding = false;
    }

    FieldCore.register({ id: data.id, data, init, tick, action, scene: () => '', stamp: log => log.tag || '', snapshot, restore,
        manualClock: true, persist: true, startLog: data.startLog, restoredLog: data.restoredLog,
        logTag: tagOf, release,
        get ui() { return window.FieldEP04UI; }
    });
})();

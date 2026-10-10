// EP08 mission: one continuous run through 유성 워터파크 from the changing room (17:02) to the 18:00 closing, the exit
// and the wristband settlement. The player walks a connected map while a compressed clock runs; CORE setpieces
// (locker, wave pool, slide, closing/settlement) always happen, a drawn deck adds the rest (FieldEP08Data.OPTIONAL_EVENTS).
// At most two hazards are active at once: one main scene (d.scene) and one overlay (d.overlay), and an overlay only
// attaches to a scene listed in OVERLAP_RULES, so every combination has an action that keeps both rules.
// Story, J record, blue screen, LOOP 02, AUTHOR and CLASSIFIED are never touched; clear unlocks Field EP09 only.
// Only outcomes the reviewed transcript states are described (canonFailures); the rest get "기록 중단"-style results.
(() => {
    const data = FieldEP08Data;
    const T = data.tuning, C = data.clock, X = data.text, COST = data.cost;
    const QTE = ['arms', 'wall', 'slow', 'stop'];
    const pad = n => String(Math.floor(n)).padStart(2, '0');
    const hhmm = m => `${pad(m / 60)}:${pad(m % 60)}`;
    const inWater = d => data.water.includes(d.zone);
    const canOverlap = (scene, overlay) => (data.OVERLAP_RULES[scene] || []).includes(overlay);

    function pick(name, list) {
        const v = data.random(name);
        if (typeof v === 'number' && Number.isInteger(v) && v >= 0 && v < list.length) return v;
        return Math.min(list.length - 1, Math.floor((typeof v === 'number' && v >= 0 ? v : 0.5) * list.length));
    }
    const total = d => d.charges.reduce((sum, c) => sum + c.price, 0);

    // ---- clock -------------------------------------------------------------------------------------------------
    function capped(d, m) {
        if (!d.core.closingStarted) m = Math.min(m, C.closing);
        if (!d.core.wave) m = Math.min(m, C.waveCap);
        else if (!d.core.slide) m = Math.min(m, C.slideCap);
        return m;
    }
    function addClock(d, minutes) { d.clock = Math.max(d.clock, capped(d, d.clock + minutes)); }
    const phaseOf = d => data.TIME_PHASES.reduce((cur, p) => (d.clock >= p.from ? p : cur), data.TIME_PHASES[0]);

    function fail(s, api, code, line) {
        const d = s.data;
        d.failCode = code; d.scene = null; d.overlay = null; d.breath = false;
        if (line) api.log(line);
        api.die(`${code} — [CASE TERMINATED] ${data.failures[code]} [퇴장 기록 없음]`, code,
            `[CASE TERMINATED] ${hhmm(d.clock)} ${data.zones[d.zone]} — 퇴장 기록 없음`);
    }

    // ---- overlays (secondary hazard on top of a scene) ---------------------------------------------------------
    function startWhistle(d, api, empty, asScene) {
        const w = { kind: 'whistle', empty, phase: 'blow', t: T.whistleFreeze };
        api.log(X.whistle);
        if (d.scene && d.scene.kind === 'wave' && d.scene.phase === 'still') { w.phase = 'frozen'; w.t = T.whistleCheck; api.log(X.alreadyStill); }
        if (asScene) d.scene = w; else d.overlay = w;
        d.fired.push(empty ? 'whistleEmpty' : 'whistleManned');
    }
    function attachOverlay(s, api, kind) {
        const d = s.data;
        if (!kind || d.overlay || !d.scene || !canOverlap(d.scene.kind, kind)) return false;
        if (kind === 'nameBroadcast') {
            d.overlay = { kind, t: T.broadcastLength }; d.fired.push(kind);
            api.log(X.nameBroadcast); api.majorEvent('NAME_BROADCAST');
        } else startWhistle(d, api, kind === 'whistleEmpty', false);
        return true;
    }
    const whistle = d => (d.overlay && d.overlay.kind === 'whistle') ? d.overlay : (d.scene && d.scene.kind === 'whistle') ? d.scene : null;
    function endWhistle(d) {
        if (d.overlay && d.overlay.kind === 'whistle') d.overlay = null;
        else if (d.scene && d.scene.kind === 'whistle') { d.scene = null; addClock(d, COST.whistle); }
    }
    // A broadcast overlay is only offered while the player's own name has not been called yet.
    const broadcastFree = d => !d.fired.includes('nameBroadcast');

    // ---- scenes -------------------------------------------------------------------------------------------------
    function startWave(d, api) {
        const dry = pick('dry', [0, 1, 2, 3, 4, 5]);
        d.scene = { kind: 'wave', phase: 'ride', t: T.waveRide, from: d.clock, dry, ov: d.deck.waveOverlay, ovT: T.overlayDelay };
        api.log(X.waveRide);
    }
    function startCharacter(s, api) {
        const d = s.data;
        let ov = null;
        if (inWater(d)) ov = d.deck.lateTower === 'empty' ? 'whistleEmpty' : 'whistleManned';
        else if (broadcastFree(d)) ov = 'nameBroadcast';
        d.scene = { kind: 'character', t: T.characterWait, ov, ovT: T.overlayDelay };
        d.fired.push('character'); api.log(X.character); api.majorEvent('MASCOT_ALONE');
    }
    function firePortable(s, api, id) {
        const d = s.data;
        if (id === 'aloneChild') { d.scene = { kind: 'aloneChild', t: T.childWait }; d.fired.push(id); api.log(X.aloneChild); api.majorEvent('ALONE_CHILD'); return true; }
        if (id === 'bandFloat') {
            d.band.loose = true; d.band.floatPending = true; d.band.floatT = T.bandFloatDelay; d.fired.push(id);
            api.log(X.loose); return true;
        }
        if (id === 'whistleEmpty') {
            if (!inWater(d)) return false;
            startWhistle(d, api, true, true); return true;
        }
        return false;
    }
    function statement(d) {
        const lines = d.charges.map(c => ({ label: c.label, price: c.price }));
        if (!d.used.spa) lines.push({ label: data.phantom.spa, price: data.prices.spa, phantom: true });
        if (!d.used.food) lines.push({ label: data.phantom.food, price: 12000, phantom: true });
        const i = pick('phantom', data.phantom.unknown);
        lines.push({ label: data.phantom.unknown[i], price: data.phantom.unknownPrice[i], phantom: true });
        d.charges = lines;
    }

    function init(s, api) {
        const lockerIdx = pick('locker', data.lockers), bedIdx = pick('sunbed', data.sunbeds);
        const portable = data.PORTABLE_PAIRS[pick('portable', data.PORTABLE_PAIRS)];
        s.data = {
            clock: C.start, zone: 'locker', failCode: '', breath: false,
            band: { attached: true, issued: 1, locker: data.lockers[lockerIdx], sunbed: data.sunbeds[bedIdx], loose: false, floatPending: false, floatT: 0 },
            otherLockers: data.lockers.filter((_, i) => i !== lockerIdx),
            core: { locker: false, wave: false, slide: false, closingStarted: false, closing: false },
            used: { spa: false, food: false, slide: false }, charges: [],
            deck: {
                waveOverlay: data.WAVE_OVERLAYS[pick('waveOverlay', data.WAVE_OVERLAYS)],
                portable: portable.slice(), lures: data.LURE_PAIRS[pick('lure', data.LURE_PAIRS)].slice(),
                lateTower: ['empty', 'manned'][pick('tower', [0, 1])]
            },
            slots: data.portableSlots.map((at, i) => ({ id: portable[i], at, done: false })), lateDone: false,
            fired: [], scene: { kind: 'locker', phase: 'band' }, overlay: null, ambient: 0, pathT: 0
        };
    }

    // ---- tick ---------------------------------------------------------------------------------------------------
    function tickWhistle(s, api, w, dt) {
        if (!('t' in w)) return;
        w.t -= dt;
        if (w.t > 0) return;
        if (w.phase === 'blow') return fail(s, api, 'WHISTLE_MOVE');
        if (w.phase === 'frozen') return fail(s, api, 'WHISTLE_IGNORED');
        if (w.phase === 'empty') return fail(s, api, 'WHISTLE_STAY');
    }

    function tickScene(s, api, dt) {
        const d = s.data, e = d.scene;
        if (e.ov && e.ovT !== undefined && !d.overlay) {
            const ready = e.kind !== 'wave' || e.phase === 'still';
            if (ready) { e.ovT -= dt; if (e.ovT <= 0) { attachOverlay(s, api, e.ov); e.ov = null; } }
        }
        switch (e.kind) {
            case 'locker':
                if (e.phase === 'calm') {
                    e.t -= dt;
                    if (e.t <= 0) { e.phase = 'open'; e.t = T.breathDeadline; e.held = 0; e.n = d.otherLockers[0]; api.log(X.lockerOpens(e.n)); api.majorEvent('LOCKER_OPEN'); }
                } else if (e.phase === 'open') {
                    if (d.breath) { e.held += dt; if (e.held >= T.breathMax) fail(s, api, 'LOCKER_BREATH', X.breathOut); }
                    else { e.t -= dt; if (e.t <= 0) fail(s, api, 'LOCKER_BREATH'); }
                }
                return;
            case 'wave':
                e.t -= dt;
                if (e.phase === 'ride') {
                    d.clock = e.from + (C.waveRecede - e.from) * Math.min(1, 1 - e.t / T.waveRide);
                    if (e.t <= 0) { d.clock = C.waveRecede; e.phase = 'receded'; e.t = T.unwetNotice; api.log(X.waveRecede); api.majorEvent('UNWET'); }
                } else if (e.phase === 'receded') {
                    if (!e.turned && e.t <= T.unwetNotice / 2) { e.turned = true; api.log(X.dryTurn); }
                    if (e.t <= 0) fail(s, api, 'UNWET');
                } else if (e.phase === 'still') {
                    d.clock = C.waveRecede + (C.nextWave - C.waveRecede) * Math.min(1, 1 - e.t / T.unwetWait);
                    if (e.t <= 0) { d.clock = C.nextWave; d.core.wave = true; d.scene = null; api.log(X.nextWave); }
                }
                return;
            case 'slide':
                if (e.phase === 'queue' || e.phase === 'stopped') return;
                e.t -= dt;
                if (e.t > 0) return;
                if (e.phase === 'ride') {
                    if (e.curve < 3) { e.curve += 1; api.log(X.curve[e.curve - 1]); e.t = T.curveGap; }
                    else { e.phase = 'blackout'; e.t = T.blackout; api.log(X.blackout); }
                } else if (e.phase === 'blackout') {
                    e.curve = 4; e.phase = 'fourth'; e.t = T.slideStop; api.log(X.curve[3]); api.majorEvent('FOURTH_CURVE');
                } else if (e.phase === 'fourth') fail(s, api, 'SLIDE_END');
                return;
            case 'whistle': return tickWhistle(s, api, e, dt);
            case 'aloneChild': e.t -= dt; if (e.t <= 0) fail(s, api, 'CHILD_HAND', '[주변] 아이가 먼저 손을 붙잡았다.'); return;
            case 'bandFloat': e.t -= dt; if (e.t <= 0) fail(s, api, 'BAND_FLOAT'); return;
            case 'character': {
                const w = whistle(d);
                if (w || e.ov) return;   // the character waits while the whistle is being handled
                e.t -= dt; if (e.t <= 0) fail(s, api, 'CHARACTER_STAY', '[주변] 캐릭터가 한 걸음 다가온다.');
                return;
            }
            case 'bath':
                e.el += dt;
                d.clock = Math.min(C.closing, e.from + 15 * Math.min(1, e.el / T.bathLength));
                if (e.thirsty && !e.thirst && e.el >= T.thirstAt) { e.thirst = true; api.log(X.thirst); }
                if (e.phase === 'soak' && e.el >= T.bathLength) { e.phase = 'bell'; e.t = T.bellExit; api.log(X.bell); }
                else if (e.phase === 'bell') { e.t -= dt; if (e.t <= 0) fail(s, api, 'SPA_LATE'); }
                return;
            case 'closing':
                e.t -= dt;
                if (e.t > 0) return;
                if (e.phase === 'broadcast') { e.phase = 'stay'; e.t = T.stayWait; api.log(X.musicStop); api.log(X.stayAsk); }
                else if (e.phase === 'stay') { e.phase = 'blocked'; e.t = T.blockWait; api.log(X.blocked); }
                else if (e.phase === 'blocked') fail(s, api, 'CLOSING_STAY');
                return;
        }
    }

    function tickFree(s, api, dt) {
        const d = s.data;
        if (d.core.closing) {
            if (d.zone !== 'exit') { d.pathT -= dt; if (d.pathT <= 0) { d.scene = { kind: 'closing', phase: 'blocked', t: T.blockWait }; api.log(X.reblocked); } }
            return;
        }
        if (d.clock >= C.closing && !d.core.closingStarted) {
            d.core.closingStarted = true; d.overlay = null;
            d.scene = { kind: 'closing', phase: 'broadcast', t: 2.5 };
            api.log(X.closing(data.address(d.clock))); api.majorEvent('CLOSING');
            return;
        }
        const drift = phaseOf(d).drift;
        if (drift > 0 && d.core.locker) addClock(d, dt / drift);
        while (d.ambient < data.ambient.length && data.ambient[d.ambient].at <= d.clock) api.log(data.ambient[d.ambient++].text);
        if (d.overlay) return;   // never start a new hazard while one is still running
        if (d.band.floatPending && inWater(d)) {
            d.band.floatT -= dt;
            if (d.band.floatT <= 0) {
                d.band.floatPending = false; d.band.loose = false;
                d.scene = { kind: 'bandFloat', t: T.bandCall }; api.log(X.bandFloats); api.majorEvent('BAND_FLOAT');
                return;
            }
        }
        if (d.clock >= C.lastFree + 1) return;
        for (const slot of d.slots) {
            if (slot.done || d.clock < slot.at) continue;
            if (firePortable(s, api, slot.id)) { slot.done = true; return; }
            // a water-only event the player keeps avoiding falls back to the child, so every run keeps its count
            if (d.clock >= slot.at + 6) {
                slot.done = true;
                if (!d.fired.includes('aloneChild') && firePortable(s, api, 'aloneChild')) return;
            }
        }
        if (!d.lateDone && d.clock >= data.lateSlot && d.core.slide) { d.lateDone = true; startCharacter(s, api); }
    }

    function tick(s, dt, api) {
        const d = s.data;
        if (s.status !== 'active') return;
        if (d.overlay) {
            const o = d.overlay;
            if (o.kind === 'nameBroadcast') { o.t -= dt; if (o.t <= 0) { d.overlay = null; api.log(X.broadcastOver); } }
            else tickWhistle(s, api, o, dt);
            if (s.status !== 'active') return;
        }
        if (d.scene) tickScene(s, api, dt);
        else tickFree(s, api, dt);
    }

    // ---- movement -------------------------------------------------------------------------------------------------
    function enterZone(s, api) {
        const d = s.data, z = d.zone;
        if (z === 'wave' && !d.core.wave) return startWave(d, api);
        if (z === 'slide') { if (!d.core.slide) { d.scene = { kind: 'slide', phase: 'queue' }; api.log(X.slideQueue); } else api.log(X.slideDone); return; }
        if (z === 'exit') {
            if (d.core.closing) { statement(d); d.scene = { kind: 'settle', phase: 'statement' }; api.log(X.statement); api.majorEvent('SETTLEMENT'); }
            else api.log(X.notClosed);
            return;
        }
        if (z === 'spa') api.log(X.spaZone);
        if (z === 'food') api.log(X.foodZone);
        if (z === 'sunbed') api.log(X.sunbedZone(d.band.sunbed));
    }

    function move(s, zone, api) {
        const d = s.data, e = d.scene, o = d.overlay;
        if (!data.zones[zone] || zone === d.zone || !data.adjacent[d.zone].includes(zone)) return;
        if (o && o.kind === 'nameBroadcast' && zone === 'desk') return fail(s, api, 'BROADCAST');
        const w = whistle(d);
        if (w) {
            if (w.phase !== 'empty') return fail(s, api, 'WHISTLE_MOVE');
            if (e && e.kind === 'character') return fail(s, api, 'CHARACTER');   // turning to walk off shows your back
            if (data.water.includes(zone)) return fail(s, api, 'WHISTLE_STAY');
            api.log(X.outOfWater); endWhistle(d);
        }
        if (e) switch (e.kind) {
            case 'locker':
                if (e.phase !== 'open') return api.log(X.cannotWalk);
                if (!d.breath) return fail(s, api, 'LOCKER_BREATH');
                d.breath = false; d.zone = zone; api.log(X.leftLocker); addClock(d, COST.move);
                d.scene = { kind: 'report' }; return api.log(X.deskReport);
            case 'report': return fail(s, api, 'LOCKER_UNREPORTED');
            case 'wave': if (e.phase === 'ride') return api.log(X.cannotWalk); return fail(s, api, 'UNWET');
            case 'slide': if (e.phase !== 'queue') return api.log(X.cannotWalk); d.scene = null; break;
            case 'aloneChild': return fail(s, api, 'CHILD_HAND', '[주변] 아이가 따라와 손을 붙잡았다.');
            case 'bandFloat': return fail(s, api, 'BAND_FLOAT');
            case 'character': return fail(s, api, 'CHARACTER');
            case 'bath': api.log(X.spaOut); d.scene = null; break;
            case 'food':
                if (e.phase === 'served' && e.extra) return fail(s, api, 'FOOD_LEFT');
                if (e.phase === 'ask') return fail(s, api, 'SURGERY_OTHER');
                d.scene = null; break;
            case 'sunbed': d.scene = null; break;
            case 'closing':
                if (e.phase === 'blocked') return api.log(X.cannotWalk);
                if (e.phase === 'stay') { e.phase = 'blocked'; e.t = T.blockWait; return api.log(X.blocked); }
                return api.log(X.cannotWalk);
            case 'settle': return api.log(X.cannotWalk);
        }
        d.zone = zone; addClock(d, COST.move); api.log(X.moved(data.zones[zone]));
        enterZone(s, api);
    }

    // ---- actions --------------------------------------------------------------------------------------------------
    // Body movements. While the whistle is sounding (or before the tower is checked) any of these is "not stopping".
    const MOVES = ['keepSwimming', 'backAway','leaveWater', 'runAway', 'approach', 'photoMascot', 'leavePool', 'waveHand', 'giveHand', 'leadDesk', 'grabBand', 'stayWater', 'askBlack'];
    function whistleAction(s, api, w, name) {
        const d = s.data, e = d.scene;
        if (w.phase === 'blow') {
            if (name === 'freeze') { w.phase = 'frozen'; w.t = T.whistleCheck; api.log(X.freeze); return true; }
            if (MOVES.includes(name)) { fail(s, api, 'WHISTLE_MOVE'); return true; }
            return false;
        }
        if (w.phase === 'frozen') {
            if (name === 'freeze') return true;
            if (name !== 'checkTower') { if (MOVES.includes(name)) { fail(s, api, 'WHISTLE_MOVE'); return true; } return false; }
            if (!w.empty) { api.log(X.towerManned); endWhistle(d); return true; }
            w.phase = 'empty'; w.t = T.leaveWater; api.log(X.towerEmpty); api.majorEvent('EMPTY_TOWER'); return true;
        }
        // empty tower: out of the water now
        if (name === 'stayWater' || name === 'askBlack') { fail(s, api, 'WHISTLE_STAY'); return true; }
        if (name === 'leaveWater') {
            if (e && e.kind === 'character') { fail(s, api, 'CHARACTER'); return true; }
            api.log(X.outOfWater); endWhistle(d); return true;
        }
        if (name === 'backAway' && e && e.kind === 'character') {
            api.log(X.backAwayWater); d.overlay = null; d.scene = null; addClock(d, COST.character); return true;
        }
        return false;
    }

    function emergency(s, api) {
        const d = s.data, e = d.scene;
        if (!d.band.attached) return;
        if (e && e.kind === 'slide' && e.phase === 'stopped') {
            api.log(X.rescued); d.core.slide = true; d.used.slide = true; d.scene = null;
            d.charges.push({ label: '메가 슬라이드', price: data.prices.slide }); addClock(d, COST.slide); return;
        }
        if (e && e.kind === 'closing' && e.phase === 'blocked') {
            api.log(X.pathOpen); d.core.closing = true; d.scene = null; d.pathT = T.pathOpen;
            if (d.zone === 'exit') enterZone(s, api);
            return;
        }
        api.log(X.emergencyIdle);
    }

    function action(s, name, value, api) {
        const d = s.data;
        if (s.status !== 'active') return;
        if (name === 'move') return move(s, value, api);
        if (name === 'breath') {
            const e = d.scene, on = !!value;
            if (e && e.kind === 'locker' && e.phase === 'open') {
                if (on && !d.breath) { d.breath = true; api.log(X.holdBreath); }
                else if (!on && d.breath) { d.breath = false; fail(s, api, 'LOCKER_BREATH', X.breathOut); }
                return;
            }
            d.breath = false; return;
        }
        if (name === 'emergency') return emergency(s, api);
        if (name === 'removeBand') {
            if (!d.band.attached) return;
            if (d.scene && d.scene.kind === 'settle' && d.scene.phase === 'paid') return action(s, 'returnBand', null, api);
            return fail(s, api, 'BAND_REMOVED');
        }
        if (name === 'tighten') { if (d.band.attached) fail(s, api, 'BAND_TIGHTENED'); return; }
        if (name === 'wristIn') { if (d.band.loose) { d.band.loose = false; api.log(X.wristIn); } return; }
        const o = d.overlay;
        if (o && o.kind === 'nameBroadcast' && name === 'answer') return fail(s, api, 'BROADCAST');
        const w = whistle(d);
        if (w && whistleAction(s, api, w, name)) return;
        const e = d.scene;
        if (!e) {
            // facility actions while roaming
            if (name === 'enterBath' && d.zone === 'spa') {
                if (d.clock > C.spaLast || d.used.spa) return api.log(X.spaClosed);
                d.used.spa = true; d.charges.push({ label: '힐링존 이용', price: data.prices.spa });
                d.scene = { kind: 'bath', phase: 'soak', el: 0, from: d.clock, thirsty: d.deck.lures.includes('spaThirst'), ov: broadcastFree(d) && d.deck.waveOverlay !== 'nameBroadcast' ? 'nameBroadcast' : null, ovT: T.overlayDelay + 1 };
                if (d.scene.thirsty) d.fired.push('spaThirst');
                return api.log(X.spaIn);
            }
            if (name === 'order' && d.zone === 'food') {
                if (d.clock > C.foodLast || d.used.food) return api.log(X.foodClosed);
                const item = data.menu[Number(value)] || data.menu[0];
                d.used.food = true; d.charges.push({ label: `푸드코트 ${item.name}`, price: item.price });
                const extra = d.deck.lures.includes('foodUnordered');
                d.scene = { kind: 'food', phase: 'served', extra, ov: broadcastFree(d) && d.deck.waveOverlay !== 'nameBroadcast' ? 'nameBroadcast' : null, ovT: T.overlayDelay };
                if (extra) d.fired.push('foodUnordered');
                api.log(X.ordered(item.name, item.price)); return api.log(extra ? X.servedExtra(data.unordered) : X.served);
            }
            if (name === 'rest' && d.zone === 'sunbed') {
                const lure = d.deck.lures.includes('sunbedLure') && !d.fired.includes('sunbedLure');
                d.scene = { kind: 'sunbed', lure, ov: broadcastFree(d) && d.deck.waveOverlay !== 'nameBroadcast' ? 'nameBroadcast' : null, ovT: T.overlayDelay };
                if (lure) { d.fired.push('sunbedLure'); api.log(X.sunbedLure); }
                return;
            }
            return;
        }
        switch (e.kind) {
            case 'locker':
                if (e.phase === 'band') {
                    if (name !== 'wearBand') return;
                    e.phase = 'store'; return api.log(X.bandOn(d.band.locker));
                }
                if (name !== 'openLocker' || e.phase !== 'store') return;
                if (Number(value) !== d.band.locker) return api.log(X.wrongLocker(value));
                api.log(X.ownLocker(d.band.locker)); addClock(d, COST.lockerStore);
                e.phase = 'calm'; e.t = T.lockerOpenDelay; return;
            case 'report':
                if (name === 'report') { api.log(X.reported); d.core.locker = true; d.scene = null; addClock(d, COST.report); return; }
                if (name === 'pass') return fail(s, api, 'LOCKER_UNREPORTED');
                return;
            case 'wave':
                if (e.phase === 'receded') {
                    if (name === 'avert') { e.phase = 'still'; e.t = T.unwetWait; return api.log(X.avert); }
                    if (['meetEyes', 'leavePool', 'waveHand'].includes(name)) return fail(s, api, 'UNWET');
                } else if (e.phase === 'still') {
                    if (['meetEyes', 'leavePool', 'waveHand'].includes(name)) return fail(s, api, 'UNWET');
                }
                return;
            case 'slide':
                if (e.phase === 'queue') {
                    if (name === 'ride') { Object.assign(e, { phase: 'ride', t: T.curveGap, curve: 0, count: 0, qte: 0 }); api.log(X.rideStart); }
                    return;
                }
                if (name === 'count') { e.count += 1; return api.log(X.counted(e.count)); }
                if (name === 'tuck') { if (e.phase === 'fourth') return fail(s, api, 'SLIDE_END', X.tuck); return api.log(X.tuck); }
                if (name === 'eyesShut') return api.log(X.eyesShut);
                if (QTE.includes(name)) {
                    if (e.phase === 'stopped') return;
                    if (e.phase !== 'fourth' || e.count < 4) return api.log(X.notYet);   // not perceived as the 4th curve
                    if (QTE[e.qte] !== name) return api.log(X.qteOrder);
                    e.qte += 1; api.log(X.qte[name]);
                    if (name === 'stop') { e.phase = 'stopped'; delete e.t; }
                }
                return;
            case 'aloneChild':
                if (name === 'sayLine') { api.log(X.childRuns); d.scene = null; addClock(d, COST.child); return; }
                if (name === 'giveHand' || name === 'leadDesk') return fail(s, api, 'CHILD_HAND');
                if (name === 'askParent') return fail(s, api, 'CHILD_WORDS');
                return;
            case 'bandFloat':
                if (name === 'callLifeguard') { d.band.issued += 1; api.log(X.callLifeguard); api.log(X.newBand); d.scene = null; addClock(d, COST.band); return; }
                if (name === 'grabBand') return fail(s, api, 'BAND_FLOAT');
                return;
            case 'character':
                if (name === 'backAway') { api.log(X.backAway); d.scene = null; addClock(d, COST.character); return; }
                if (['approach', 'photoMascot', 'runAway', 'leaveWater'].includes(name)) return fail(s, api, 'CHARACTER');
                return;
            case 'bath':
                if (name === 'drink') return fail(s, api, 'SPA_DRINK');
                if (name === 'exitBath') { api.log(X.spaOut); d.scene = null; return; }
                return;
            case 'food':
                if (e.phase === 'served') {
                    if (!e.extra && name === 'eat') { api.log(X.ate); d.scene = null; addClock(d, COST.food); return; }
                    if (e.extra && name === 'eatAll') { api.log(X.ateAll); api.log(X.staffAsk); e.phase = 'ask'; return api.majorEvent('SURGERY_ASK'); }
                    if (e.extra && (name === 'notOrdered' || name === 'leaveFood')) return fail(s, api, 'FOOD_LEFT');
                } else if (e.phase === 'ask') {
                    if (name === 'notToday') { api.log(X.notToday); d.scene = null; addClock(d, COST.food); return; }
                    if (name === 'answerDate') return fail(s, api, 'SURGERY_DATE');
                    if (name === 'answerOther' || name === 'answerUnsure') return fail(s, api, 'SURGERY_OTHER');
                }
                return;
            case 'sunbed':
                if (name === 'ownBed') { api.log(X.sunbedOwn(d.band.sunbed)); d.scene = null; addClock(d, COST.sunbed); return; }
                if (name === 'nearBed') return fail(s, api, 'SUNBED');
                if (name === 'standUp') { d.scene = null; return; }
                return;
            case 'closing':
                if (e.phase === 'stay') {
                    if (name === 'refuse') { api.log(X.refused); e.phase = 'blocked'; e.t = T.blockWait; return api.log(X.blocked); }
                    if (name === 'playMore') return fail(s, api, 'CLOSING_STAY');
                } else if (e.phase === 'blocked') {
                    if (name === 'shove') return fail(s, api, 'CLOSING_FORCE');
                }
                return;
            case 'settle':
                if (e.phase === 'statement') {
                    if (name === 'pay') { e.phase = 'paid'; return api.log(X.paid(total(d))); }
                    if (name === 'dispute' || name === 'refund') return fail(s, api, 'SETTLE_DISPUTE');
                    if (name === 'callStaff') { e.phase = 'staff'; return api.log(X.staff); }
                } else if (e.phase === 'staff') {
                    if (name === 'staffDispute') return fail(s, api, 'SETTLE_DISPUTE');
                    if (name === 'staffPay') { e.phase = 'statement'; return api.log(X.staffBack); }
                } else if (e.phase === 'paid' && name === 'returnBand') {
                    d.band.attached = false; e.phase = 'door'; return api.log(X.returned);
                } else if (e.phase === 'door' && name === 'goOut') {
                    api.log(X.exitBack); api.log(X.leave);
                    return api.win(data.clearText, { patrols: {}, elapsed: s.elapsed, injuries: [] });
                }
                return;
        }
    }

    FieldCore.register({
        id: data.id, data, init, tick, action, scene: () => '',
        total, hhmm, canOverlap,
        logTag: run => hhmm(run.data.clock),
        stamp: log => log.tag || '',
        manualClock: true, startLog: data.startLog,
        release() { /* losing focus never changes the situation */ },
        get ui() { return window.FieldEP08UI; }
    });
})();

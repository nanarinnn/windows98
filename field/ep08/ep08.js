// EP08 mission: a day at 유성 워터파크 from entry to settlement. The electronic wristband is the central state (assigned
// locker/sunbed, emergency-call button, purchases, settlement). A fixed itinerary of facility stages is played by moving
// between zones on the park map; each stage starts when the player reaches its zone. Story, J record, blue screen and
// LOOP 02 are never touched here; clear unlocks Field EP09 only (FieldSave.clear).
// Only outcomes the reviewed transcript states are described as consequences (FieldEP08Data.canonFailures); the rest
// get a minimal "record interrupted" result. Nothing explains what 'they' are or what the 'surgery' is.
(() => {
    const data = FieldEP08Data;
    const T = data.tuning;
    const X = data.text;
    const QTE = ['arms', 'wall', 'slow', 'stop'];

    function pickIndex(name, list) {
        const v = data.random(name);
        if (typeof v === 'number' && Number.isInteger(v) && v >= 0 && v < list.length) return v;
        return Math.min(list.length - 1, Math.floor((typeof v === 'number' ? v : 0.5) * list.length));
    }
    const stage = d => data.stages[d.stage];
    const total = d => d.band.purchases.reduce((sum, p) => sum + p.price, 0);

    function fail(s, api, code) {
        s.data.failCode = code; s.data.ev = null;
        api.die(`${code} — ${data.failures[code]}`, code);
    }

    function advance(s, api) {
        const d = s.data;
        d.ev = null; d.stage += 1; d.started = false;
        if (d.stage < data.stages.length && d.zone === stage(d).zone) begin(s, api);
    }

    function begin(s, api) {
        const d = s.data, id = stage(d).id;
        d.started = true;
        if (id === 'entry') { d.ev = { kind: 'entry' }; api.log(X.ad); }
        else if (id === 'locker' || id === 'retrieve') d.ev = { kind: 'lockerUse' };
        else if (id === 'lockerReport' || id === 'lostChildReport' || id === 'injuryReport') d.ev = { kind: 'report' };
        else if (id === 'lostChild') { d.ev = { kind: 'lostChild' }; api.log(X.lostChild); }
        else if (id === 'aloneChild') { d.ev = { kind: 'aloneChild' }; api.log(X.aloneChild); api.majorEvent('ALONE_CHILD'); }
        else if (id === 'wave1') { d.ev = { kind: 'wave', round: 1, phase: 'wave', t: T.waveLength }; api.log(X.waveStart('11:00')); }
        else if (id === 'wave2') { d.ev = { kind: 'wave', round: 2, phase: 'wave', t: T.waveLength }; api.log(X.waveStartHalf('11:30')); }
        else if (id === 'whistle') { d.ev = { kind: 'whistle', round: 1, phase: 'blow', t: T.whistleFreeze }; api.log(X.whistleNormal); }
        else if (id === 'bandFloat') { d.ev = { kind: 'float', t: T.bandCall }; api.log(X.bandFloats); api.majorEvent('BAND_FLOAT'); }
        else if (id === 'sunbed') { d.ev = { kind: 'sunbed' }; api.log(X.sunbedArrive); }
        else if (id === 'spa') d.ev = { kind: 'spaWait' };
        else if (id === 'slide1' || id === 'slide2') d.ev = { kind: 'slideWait' };
        else if (id === 'injury') { d.ev = { kind: 'injury' }; api.log(X.scrape); }
        else if (id === 'food') d.ev = { kind: 'order' };
        else if (id === 'photo') { d.ev = { kind: 'photoNormal' }; api.log(X.photoNormal); }
        else if (id === 'closing') { d.ev = { kind: 'stay' }; api.log(X.closing(data.address(d.stage))); api.log(X.stayAsk); api.majorEvent('CLOSING'); }
        else if (id === 'settle') {
            for (const c of data.phantomCharges) d.band.purchases.push({ label: c.label, price: c.price, phantom: true });
            d.ev = { kind: 'statement', paid: false }; api.log(X.statement); api.majorEvent('SETTLEMENT');
        }
    }

    function init(s, api) {
        const lockerIdx = pickIndex('locker', data.lockers), bedIdx = pickIndex('sunbed', data.sunbeds);
        s.data = {
            stage: 0, started: false, zone: 'entrance', ev: null, failCode: '', thirst: false,
            band: {
                attached: false, issued: 0, locker: data.lockers[lockerIdx], sunbed: data.sunbeds[bedIdx],
                emergencyButton: true, purchases: []
            },
            otherLockers: data.lockers.filter((_, i) => i !== lockerIdx),
            otherBeds: data.sunbeds.filter((_, i) => i !== bedIdx)
        };
        begin(s, api);
    }

    function tick(s, dt, api) {
        const d = s.data, e = d.ev;
        if (s.status !== 'active' || !e || !('t' in e) && e.kind !== 'bath') return;
        if (e.kind === 'bath') {
            e.elapsed += dt;
            if (!d.thirst && e.elapsed >= T.thirstAt) { d.thirst = true; api.log(X.thirst); }
            if (e.phase === 'soak' && e.elapsed >= T.bathLength) { e.phase = 'bell'; e.t = T.bellExit; api.log(X.bell); }
            if (e.phase === 'bell') { e.t -= dt; if (e.t <= 0) fail(s, api, 'SPA_LATE'); }
            return;
        }
        e.t -= dt;
        if (e.t > 0) return;
        if (e.kind === 'lockerOpen') return fail(s, api, 'LOCKER_BREATH');   // breathed: too slow to stop, or ran out of breath inside
        if (e.kind === 'wave' && e.phase === 'wave') { e.phase = 'after'; delete e.t; return api.log(X.waveEnd); }
        if (e.kind === 'unwet') {
            if (e.phase === 'seen') return fail(s, api, 'UNWET');   // kept looking at it
            api.log(X.unwetGone); return advance(s, api);
        }
        if (e.kind === 'whistle') return fail(s, api, e.phase === 'empty' ? 'WHISTLE_STAY' : 'WHISTLE_MOVE');
        if (e.kind === 'float') return fail(s, api, 'BAND_FLOAT');
        if (e.kind === 'broadcast') {
            api.log(X.broadcastOver);
            if (e.round === 1) { d.ev = { kind: 'broadcast', round: 2, t: T.broadcastLength }; api.log(X.broadcastName); api.majorEvent('NAME_BROADCAST'); return; }
            return advance(s, api);
        }
        if (e.kind === 'ride') {
            if (e.curveIdx < e.curves) {
                e.curveIdx += 1; api.log(X.curve);
                e.t = e.curveIdx === 4 ? T.slideStop : T.curveGap;
                if (e.curveIdx === 4) api.majorEvent('FOURTH_CURVE');
                return;
            }
            if (e.curves === 4) return fail(s, api, 'SLIDE_END');
            api.log(X.arrive); return advance(s, api);
        }
    }

    function move(s, zone, api) {
        const d = s.data, e = d.ev;
        if (!data.zones[zone] || zone === d.zone) return;
        if (e) {
            if (e.kind === 'ride' || e.kind === 'stay' || e.kind === 'blocked' || e.kind === 'statement') return;   // cannot walk off
            if (e.kind === 'lockerOpen') {
                if (e.phase === 'open') return fail(s, api, 'LOCKER_BREATH');   // walked out still breathing
                d.zone = zone; api.log(X.moved(data.zones[zone])); api.log(X.leftLocker); return advance(s, api);
            }
            if (e.kind === 'unwet') return fail(s, api, 'UNWET');
            if (e.kind === 'whistle') {
                if (e.phase === 'empty') { d.zone = zone; api.log(X.outOfWater); api.log(X.moved(data.zones[zone])); return advance(s, api); }
                return fail(s, api, 'WHISTLE_MOVE');
            }
            if (e.kind === 'float') return fail(s, api, 'BAND_FLOAT');
            if (e.kind === 'mascot') return fail(s, api, 'CHARACTER');   // turning away to walk off = showing your back
            if (e.kind === 'broadcast' && e.round === 2 && zone === 'desk') return fail(s, api, 'BROADCAST');
            if (e.kind === 'bath') { api.log(X.spaOut); d.zone = zone; api.log(X.moved(data.zones[zone])); return advance(s, api); }
        }
        d.zone = zone; api.log(X.moved(data.zones[zone]));
        if (zone === 'exit' && stage(d).id !== 'settle') api.log(X.notYet);
        if (stage(d).id === 'lostChild' && d.started && zone === 'desk') return advance(s, api);
        // waves etc. restart if the player wandered off before finishing (nothing persistent was in progress)
        if (d.started && stage(d).zone !== zone && e && ['wave', 'spaWait', 'slideWait', 'lockerUse', 'sunbed', 'order', 'photoNormal'].includes(e.kind)) { d.started = false; d.ev = null; }
        if (!d.started && zone === stage(d).zone) begin(s, api);
    }

    function emergency(s, api) {
        const d = s.data, e = d.ev;
        if (!d.band.attached) return;
        if (e && e.kind === 'ride' && e.stopped) { api.log(X.rescued); return advance(s, api); }
        if (e && e.kind === 'blocked') { api.log(X.emergencyBlock); return advance(s, api); }
        api.log(X.emergencyIdle);
    }

    function action(s, name, value, api) {
        const d = s.data, e = d.ev;
        if (s.status !== 'active') return;
        if (name === 'move') return move(s, value, api);
        if (name === 'emergency') return emergency(s, api);
        if (name === 'removeBand') {
            if (!d.band.attached) return;
            if (e && e.kind === 'statement' && e.paid) return action(s, 'returnBand', null, api);
            return fail(s, api, 'BAND_REMOVED');
        }
        if (!e) return;
        // While the whistle is still sounding, anything but stopping is still moving.
        if (e.kind === 'whistle' && e.phase === 'blow' && name !== 'freeze') return fail(s, api, 'WHISTLE_MOVE');
        if (e.kind === 'unwet' && name !== 'avert') return fail(s, api, 'UNWET');
        switch (e.kind) {
            case 'entry':
                if (name === 'wearBand') {
                    d.band.attached = true; d.band.issued = 1; api.log(X.bandOn(d.band.locker, d.band.sunbed));
                    return advance(s, api);
                }
                return;
            case 'lockerUse':
                if (name !== 'openLocker') return;
                if (Number(value) !== d.band.locker) return api.log(X.wrongLocker(value));
                if (stage(d).id === 'retrieve') { api.log(X.retrieved(d.band.locker)); return advance(s, api); }
                api.log(X.ownLocker(d.band.locker));
                d.ev = { kind: 'lockerOpen', phase: 'open', t: T.breathDeadline, n: d.otherLockers[0] };
                api.log(X.lockerOpens(d.ev.n)); api.majorEvent('LOCKER_OPEN');
                return;
            case 'lockerOpen':
                if (name === 'holdBreath' && e.phase === 'open') { e.phase = 'held'; e.t = T.breathHold; return api.log(X.holdBreath); }
                if (name === 'lookLocker') return fail(s, api, 'LOCKER_LOOK');
                return;
            case 'report':
                if (name !== 'reportDesk') return;
                api.log(stage(d).id === 'lockerReport' ? X.reported : stage(d).id === 'lostChildReport' ? X.lostChildHandover : X.injuryReported);
                return advance(s, api);
            case 'lostChild':
                if (name === 'holdHand') return fail(s, api, 'CHILD_HAND');
                return;
            case 'aloneChild':
                if (name === 'sayLine') { api.log(X.childRuns); return advance(s, api); }
                if (name === 'giveHand' || name === 'leadToDesk') return fail(s, api, 'CHILD_HAND');
                if (name === 'askParent') return fail(s, api, 'CHILD_WORDS');
                return;
            case 'wave':
                if (name !== 'lookAround' || e.phase !== 'after') return;
                if (e.round === 1) { api.log(X.lookAround); d.ev = { kind: 'loose' }; return api.log(X.loose); }
                api.log(X.lookUnwet); api.majorEvent('UNWET');
                d.ev = { kind: 'unwet', phase: 'seen', t: T.whistleFreeze + 1 };
                return;
            case 'loose':
                if (name === 'wristIn') { api.log(X.wristIn); return advance(s, api); }
                if (name === 'tighten') return fail(s, api, 'BAND_TIGHTENED');
                return;
            case 'unwet':
                if (name === 'avert' && e.phase === 'seen') { e.phase = 'wait'; e.t = T.unwetWait; return api.log(X.avert); }
                return;
            case 'whistle':
                if (name === 'freeze' && e.phase === 'blow') { e.phase = 'frozen'; delete e.t; return api.log(X.freeze); }
                if (name === 'checkTower' && e.phase === 'frozen') {
                    if (e.round === 1) { api.log(X.towerManned); d.ev = { kind: 'whistle', round: 2, phase: 'blow', t: T.whistleFreeze }; return api.log(X.whistleNormal); }
                    e.phase = 'empty'; e.t = T.leaveWater; api.log(X.towerEmpty); return api.majorEvent('EMPTY_TOWER');
                }
                if (e.phase === 'empty') {
                    if (name === 'leaveWater') { api.log(X.outOfWater); return advance(s, api); }
                    if (name === 'askBlack' || name === 'stayWater') return fail(s, api, 'WHISTLE_STAY');
                }
                return;
            case 'float':
                if (name === 'callLifeguard') {
                    d.band.issued += 1; api.log(X.callLifeguard); api.log(X.newBand(d.band.locker, d.band.sunbed));
                    return advance(s, api);
                }
                if (name === 'grabBand') return fail(s, api, 'BAND_FLOAT');
                return;
            case 'sunbed':
                if (name !== 'useBed') return;
                if (value !== d.band.sunbed) return fail(s, api, 'SUNBED');
                api.log(X.sunbedOwn(d.band.sunbed));
                d.ev = { kind: 'broadcast', round: 1, t: T.broadcastLength }; api.log(X.broadcastNormal(data.address(d.stage)));
                return;
            case 'broadcast':
                if (name === 'answer') { if (e.round === 2) return fail(s, api, 'BROADCAST'); return api.log(X.answeredNormal); }
                return;
            case 'spaWait':
                if (name === 'enterBath') { d.ev = { kind: 'bath', phase: 'soak', elapsed: 0 }; return api.log(X.spaIn); }
                return;
            case 'bath':
                if (name === 'drink') return fail(s, api, 'SPA_DRINK');
                if (name === 'endure' && d.thirst) return api.log(X.endure);
                if (name === 'exitBath') { api.log(X.spaOut); return advance(s, api); }
                return;
            case 'slideWait':
                if (name === 'ride') {
                    d.ev = { kind: 'ride', curves: stage(d).id === 'slide1' ? 3 : 4, curveIdx: 0, t: T.curveGap, count: 0, qte: 0, stopped: false };
                    return api.log(X.rideStart);
                }
                return;
            case 'ride':
                if (name === 'count') { e.count += 1; return api.log(X.counted(e.count)); }
                if (QTE.includes(name)) {
                    if (e.stopped) return;
                    if (!(e.curveIdx === 4 && e.count >= 4)) return api.log(X.notNow);   // not perceived as the 4th curve
                    if (QTE[e.qte] !== name) return api.log(X.qteOrder);
                    e.qte += 1; api.log(X.qte[name]);
                    if (name === 'stop') { e.stopped = true; delete e.t; }
                }
                return;
            case 'injury':
                if (name === 'decline') { api.log(X.declined); return advance(s, api); }
                if (name === 'follow') return fail(s, api, 'INJURY_FOLLOW');
                return;
            case 'order': {
                if (name !== 'order') return;
                const item = data.menu[Number(value)] || data.menu[0];
                d.band.purchases.push({ label: `푸드코트 ${item.name}`, price: item.price });
                api.log(X.ordered(item.name, item.price)); api.log(X.served(data.unordered));
                d.ev = { kind: 'unordered' }; return;
            }
            case 'unordered':
                if (name === 'eatAll') { api.log(X.ateAll); api.log(X.staffAsk); d.ev = { kind: 'ask' }; return api.majorEvent('SURGERY_ASK'); }
                if (name === 'leaveFood' || name === 'returnFood') return fail(s, api, 'FOOD_LEFT');
                return;
            case 'ask':
                if (name === 'notToday') { api.log(X.notToday); return advance(s, api); }
                if (name === 'answerDate') return fail(s, api, 'SURGERY_DATE');
                if (name === 'answerOther') return fail(s, api, 'SURGERY_OTHER');
                return;
            case 'photoNormal':
                if (name === 'takePhoto') { d.band.purchases.push({ label: '캐릭터 포토존 촬영', price: data.photoPrice }); api.log(X.photoTaken(data.photoPrice)); }
                else if (name === 'skipPhoto') api.log(X.photoSkip);
                else return;
                d.ev = { kind: 'mascot' }; api.log(X.mascotAlone); return api.majorEvent('MASCOT_ALONE');
            case 'mascot':
                if (name === 'backAway') { api.log(X.backAway); return advance(s, api); }
                if (name === 'approach' || name === 'runAway' || name === 'photoMascot') return fail(s, api, 'CHARACTER');
                return;
            case 'stay':
                if (name === 'refuse') { api.log(X.refused); api.log(X.blocked); d.ev = { kind: 'blocked' }; return; }
                if (name === 'playMore') return fail(s, api, 'CLOSING_STAY');
                return;
            case 'blocked':
                if (name === 'shove') return fail(s, api, 'CLOSING_FORCE');
                return;
            case 'statement':
                if (name === 'dispute' || name === 'refund') return fail(s, api, 'SETTLE_DISPUTE');
                if (name === 'pay' && !e.paid) { e.paid = true; return api.log(X.paid(total(d))); }
                if (name === 'returnBand' && e.paid) {
                    d.band.attached = false; api.log(X.returned);
                    return api.win(data.clearText, { patrols: {}, elapsed: s.elapsed, injuries: [] });
                }
                return;
        }
    }

    FieldCore.register({
        id: data.id, data, init, tick, action, scene: () => '',
        total,
        logTag: run => {
            const at = data.stages[Math.min(run.data.stage, data.stages.length - 1)].at;
            const m = 10 * 60 + at;
            return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
        },
        stamp: log => log.tag || '',
        manualClock: true, startLog: data.startLog,
        release() { /* losing focus never changes the situation */ },
        get ui() { return window.FieldEP08UI; }
    });
})();

// EP09 mission: MANAGE. A generic smartphone (home, phone, messages, settings, camera, photos, video, flashlight) that the
// situations of the reviewed safety text interrupt asynchronously while the player is using it. Up to two critical
// situations run at once (d.evs), only in COMPAT pairs; screen-taking ones (B/D/J/K) only start when nothing else runs.
// E is deleted and only shown as deleted. L's three unrequested codes arrive spread over the run; typing the third into the
// safety text starts the rescue, whose duration is never shown, and one or two more situations still come before the
// agent arrives. Battery drains by what the phone is doing; lower battery = shorter gaps; 0% = SIGNAL LOST / NO DATA.
// This phone never reads or writes the Story PDA (app.js phone*). Story, J record, blue screen and LOOP 02 are never
// touched; clear unlocks Field EP10 only (FieldSave.clear). Only outcomes the reviewed transcript states are described as
// consequences (FieldEP09Data.canonFailures); the rest get a minimal "record interrupted" result.
(() => {
    const data = FieldEP09Data;
    const T = data.tuning;
    const X = data.text;
    const MAJOR = { A: 'A_MISSED_CALL', B: 'B_VIDEO_CALL', C: 'C_BILL', D: 'D_SCREAM', F: 'F_UNKNOWN_APP', G: 'G_CRAWL', H: 'H_PHOTO', I: 'I_SHUTTER', J: 'J_AUTOPLAY', K: 'K_FAKE_AGENT', L: 'L_AUTH_CODE' };

    function roll(name) { const v = data.random(name); return typeof v === 'number' && Number.isFinite(v) ? v : Math.random(); }
    // Integer rolls in range are taken as an index (tests); fractions are scaled.
    function pick(name, list) {
        const v = roll(name);
        if (Number.isInteger(v) && v >= 0 && v < list.length) return list[v];
        return list[Math.min(list.length - 1, Math.max(0, Math.floor(v * list.length)))];
    }
    const digits = v => String(v || '').replace(/\D/g, '');
    const interval = battery => Math.max(T.gapFloor, T.gapMax * (T.gapMinRatio + (1 - T.gapMinRatio) * Math.max(0, Math.min(100, battery)) / 100));
    const clockText = s => { const m = (data.clockStart + Math.floor(s.elapsed / data.secondsPerMinute)) % 1440; return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`; };
    const strange = d => d.apps.find(a => a.strange);
    const lit = d => !!(d.entity && d.light.on && d.facing === d.entity.dir && T.reach[d.light.level] >= d.entity.dist);

    const OVERLAY = data.OVERLAY;
    const ev = (d, kind) => d.evs.find(e => e.kind === kind) || null;
    const pairOk = (a, b) => data.COMPAT.some(([x, y]) => (x === a && y === b) || (x === b && y === a));
    function canStart(d, kind) {
        if (OVERLAY.includes(kind)) return d.evs.length === 0;
        if (d.evs.length >= data.maxActive || d.evs.some(e => OVERLAY.includes(e.kind))) return false;
        return d.evs.every(e => pairOk(e.kind, kind));
    }

    function fail(s, api, code, extra) {
        s.data.failCode = code; s.data.evs = []; s.data.overlay = '';
        const text = typeof data.failures[code] === 'function' ? data.failures[code](extra) : data.failures[code];
        if (code === 'NO_DATA') return api.die(text, code, 'SIGNAL LOST / NO DATA');
        api.die(`${code} — ${text}`, code);
    }

    function msg(d, tid, name, text, extra) {
        if (!d.threads[tid]) d.threads[tid] = { id: tid, name, msgs: [], unread: 0 };
        const t = d.threads[tid];
        t.msgs.push(Object.assign({ text, at: d.clock }, extra || {}));
        if (!(d.app === 'thread' && d.arg === tid)) t.unread += 1;
        d.threadOrder = [tid, ...d.threadOrder.filter(id => id !== tid)];
    }
    function item(d, kind, label, extra) { d.items.push(Object.assign({ id: 'i' + (++d.seq), kind, label, at: d.clock }, extra || {})); }

    function resolve(s, api, e) {
        const d = s.data;
        if (!e || !d.evs.includes(e)) return;
        d.evs = d.evs.filter(x => x !== e); d.resolved.push(e.kind);
        if (OVERLAY.includes(e.kind) || (e.kind === 'A' && d.overlay === 'call')) d.overlay = '';
        if (d.rescue === 'inProgress') d.rescueResolved += 1;
        d.nextIn = Math.max(d.nextIn, T.afterResolve);
    }

    function start(s, key, api) {
        const d = s.data, repeat = d.rescue === 'inProgress';
        const push = e => { d.evs.push(e); return e; };
        d.stageNo += 1;
        sendCodes(s, api);
        if (MAJOR[key]) api.majorEvent(MAJOR[key] + (repeat ? '_REPEAT' : ''));
        switch (key) {
            case 'A': {
                const number = data.missedNumbers[repeat ? 1 : 0];
                push({ kind: 'A', phase: 'wait', t: T.callbackLimit, number });
                d.calls.unshift({ dir: 'missed', number, at: d.clock });
                msg(d, 'missed' + (repeat ? '2' : ''), '부재중 통화 안내', X.missedSms(number, d.clock));
                return api.log(X.missedSms(number, d.clock));
            }
            case 'B':
                push({ kind: 'B', startT: T.stareStart, held: 0, away: 0, holding: false, started: false });
                d.overlay = 'videoCall'; return api.log(X.videoCall);
            case 'C': {
                const amount = pick('bill', data.bills);
                push({ kind: 'C', t: T.billLimit, amount, paid: false });
                msg(d, 'carrier', '통신사', X.billSms(amount), { pay: true });
                return api.log(X.billSms(amount));
            }
            case 'D':
                push({ kind: 'D', n: 1, phase: 'scream', t: T.screamLen });
                d.overlay = 'screamCall'; api.log(X.screamCall); return api.log(X.scream);
            case 'E':
                d.resolved.push('E'); d.stageNo -= 1; return api.log(X.eDeleted);
            case 'F': {
                const name = pick('fApp', data.strangeNames), icon = pick('fIcon', data.strangeIcons);
                const at = 1 + Math.floor(roll('fSlot') * (d.apps.length - 1));
                d.apps.splice(Math.min(d.apps.length, at), 0, { id: 'strange', name, icon, strange: true, perms: Object.fromEntries(data.perms.map(p => [p, true])) });
                push({ kind: 'F', t: T.permLimit });
                return api.log(X.appSeen);
            }
            case 'G': {
                const dir = pick('gDir', Object.keys(data.dirs));
                d.dark = true; d.entity = { dir, dist: T.startDistance, crawl: T.crawlStep };
                push({ kind: 'G', wasLit: false });
                api.log(X.dark); return api.log(X.crawl(data.dirs[dir]));
            }
            case 'H':
                return sendPhoto(s, api, push({ kind: 'H', n: 0 }));
            case 'I':
                push({ kind: 'I', t: T.iStartLimit, shutterT: T.shutterGap });
                return api.log(X.shutter);
            case 'J': {
                const who = pick('jWho', data.jWho);
                push({ kind: 'J', t: T.jLen, who, req: 0, reqT: 0, open: true, closes: 0, reopenT: 0 });
                d.jThread = who; d.app = 'video'; d.arg = ''; d.overlay = 'autoVideo';
                api.log(X.jStart); return api.log(data.jRequests[0].text(who));
            }
            case 'K':
                push({ kind: 'K', phase: 'ringing', t: T.kRing });
                d.overlay = 'call'; return api.log(X.kCall(data.hqNumber));
        }
    }

    // L: unrequested codes arrive after the 3rd / 6th / 9th situation has started (not a situation of its own).
    function sendCodes(s, api) {
        const d = s.data;
        while (d.codesSent < 3 && d.stageNo >= data.codeAfter[d.codesSent]) {
            const n = ++d.codesSent, sender = data.codeSenders[n - 1], code = d.codes[n - 1];
            msg(d, 'code' + n, sender, X.code(sender, code).replace(/^\[[^\]]+\] /, ''));
            if (n === 1) api.majorEvent(MAJOR.L);
            api.log(X.code(sender, code));
        }
    }

    function sendPhoto(s, api, e) {
        const d = s.data;
        e.n += 1; e.t = T.photoGap;
        if (e.n === 4) return fail(s, api, 'H_MISSING');
        e.angle = pick('h' + e.n, data.angles);
        const text = X.hPhoto(e.n, data.dirs[e.angle], [10, 5, 2][e.n - 1]);
        msg(d, 'unknown', '미상의 번호', text, { photo: e.angle, n: e.n });
        api.log(text);
    }

    // Offer the next situation; it starts only if it can run beside what is already running, otherwise it waits.
    function offerNext(s, api) {
        const d = s.data;
        const fromDeck = d.idx + 1 < data.order.length && d.rescue !== 'inProgress';
        let key;
        if (fromDeck) key = data.order[d.idx + 1];
        else {
            if (!d.nextRepeat) {
                let r = pick('repeat', data.repeatPool);
                if (r === d.lastRepeat) r = data.repeatPool[(data.repeatPool.indexOf(r) + 1) % data.repeatPool.length];
                d.nextRepeat = r;
            }
            key = d.nextRepeat;
        }
        if (key !== 'E' && !canStart(d, key)) return false;
        if (fromDeck) d.idx += 1;
        else { d.lastRepeat = key; d.nextRepeat = ''; d.repeats += 1; }
        start(s, key, api);
        d.nextIn = key === 'E' ? T.afterResolve : (data.chainNext[key] || interval(d.battery));
        return true;
    }

    function init(s, api) {
        const codes = [];
        for (let i = 1; i <= 3; i++) {
            let c = String(100000 + Math.floor(roll('code' + i) * 900000)).slice(0, 6);
            while (codes.includes(c)) c = String(100000 + ((Number(c) - 100000 + 7919) % 900000));
            codes.push(c);
        }
        s.data = {
            idx: -1, evs: [], nextIn: T.firstGap, codes, codesSent: 0, nextRepeat: '', rescueResolved: 0, rescueNeed: 1, ending: 0, failCode: '', resolved: [], stageNo: 0, repeats: 0, lastRepeat: '',
            battery: T.startBattery, warned: [], clock: '', rescue: 'none', rescueLeft: 0,
            app: 'home', arg: '', overlay: '', dial: '',
            threads: {}, threadOrder: [], calls: [], items: [], seq: 0, jThread: '',
            apps: data.apps.map(a => ({ ...a, perms: Object.fromEntries(data.perms.map(p => [p, true])) })),
            light: { on: false, level: 2 }, facing: 'front', dark: false, entity: null,
            cam: { mode: 'photo', lens: 'rear', zoom: 1, rec: null }
        };
        s.data.clock = clockText(s);
        msg(s.data, 'safety', '안전 안내 문자', '', { doc: true });
    }

    function tick(s, dt, api) {
        const d = s.data;
        if (s.status !== 'active') return;
        d.clock = clockText(s);
        if (d.ending > 0) {   // signal cut -> blackout -> observation complete
            d.ending -= dt;
            if (d.ending <= 0) return api.win(data.clearText, { patrols: {}, elapsed: s.elapsed, injuries: [] });
            return;
        }
        const rate = T.drainIdle + (d.app !== 'home' ? T.drainApp : 0) + (d.app === 'camera' ? T.drainCamera : 0)
            + (d.light.on ? T.drainLight[d.light.level] : 0) + (d.cam.rec ? T.drainRecord : 0);
        d.battery = Math.max(0, d.battery - rate * dt);
        for (const mark of [30, 15, 5]) if (d.battery <= mark && !d.warned.includes(mark)) { d.warned.push(mark); api.log(X.lowBattery(mark)); }
        if (d.battery <= 0) return fail(s, api, 'NO_DATA');
        if (d.cam.rec) {
            d.cam.rec.t += dt;
            const ei = ev(d, 'I');
            if (ei && d.cam.rec.lens === 'front' && d.cam.rec.t >= T.selfieLen) {
                d.cam.rec = null; item(d, 'video', '동영상', { iFile: true });
                api.log(X.recDone); resolve(s, api, ei);
            }
        }
        if (d.rescue === 'inProgress') {
            d.rescueLeft -= dt;
            if (d.rescueLeft <= 0 && d.rescueResolved >= d.rescueNeed && !d.evs.length) {
                d.rescue = 'arrived'; msg(d, 'safety', '안전 안내 문자', X.rescued.replace('[안전 안내 문자] ', '')); api.log(X.rescued);
                api.log(X.signalCut); d.ending = T.blackout; api.majorEvent('RESCUE_DONE');
                return;
            }
        }
        d.nextIn -= dt; if (d.nextIn <= 0) offerNext(s, api);
        for (const e of d.evs.slice()) { if (s.status !== 'active') return; if (d.evs.includes(e)) tickEvent(s, e, dt, api); }
    }

    function tickEvent(s, e, dt, api) {
        const d = s.data;
        switch (e.kind) {
            case 'A':
                e.t -= dt; if (e.t > 0) return;
                if (e.phase === 'wait') return fail(s, api, 'A_NO_CALL');
                if (e.phase === 'ringing') {
                    if (e.answered) { e.phase = 'answered'; e.t = T.hangupLimit; return api.log(X.picked); }
                    api.log(X.noAnswer); return resolve(s, api, e);
                }
                return fail(s, api, 'A_LINGER');
            case 'B':
                if (e.holding) {
                    e.held += dt; e.away = 0;
                    if (e.held >= T.stareHold) { api.log(X.videoCallEnd); resolve(s, api, e); }
                    return;
                }
                if (!e.started) { e.startT -= dt; if (e.startT <= 0) fail(s, api, 'B_LOOKAWAY'); return; }
                e.away += dt; if (e.away > T.lookAwayGrace) fail(s, api, 'B_LOOKAWAY');
                return;
            case 'C':
                e.t -= dt; if (e.t <= 0) fail(s, api, 'C_UNPAID', data.billParts[data.tierOf(e.amount)]);
                return;
            case 'D':
                e.t -= dt; if (e.t > 0) return;
                if (e.phase === 'scream') { e.phase = 'cut'; e.t = T.screamGap; return api.log(X.screamCut); }
                e.n += 1;
                if (e.n >= 6) return fail(s, api, 'D_SIXTH');
                e.phase = 'scream'; e.t = T.screamLen;
                return api.log(e.n === 5 ? X.screamFamiliar : X.scream);
            case 'F':
                e.t -= dt; if (e.t <= 0) fail(s, api, 'F_KEPT');
                return;
            case 'G': {
                const on = lit(d);
                if (on && !e.wasLit) api.log(X.lit);
                if (!on && e.wasLit) api.log(X.lightOff);
                e.wasLit = on;
                if (on) return;
                d.entity.crawl -= dt;
                if (d.entity.crawl > 0) return;
                d.entity.crawl = T.crawlStep; d.entity.dist -= 1;
                if (d.entity.dist <= 0) return fail(s, api, 'G_REACHED');
                return api.log(X.closer(data.dirs[d.entity.dir]));
            }
            case 'H':
                e.t -= dt; if (e.t <= 0) sendPhoto(s, api, e);
                return;
            case 'I':
                e.shutterT -= dt;
                if (e.shutterT <= 0) {
                    e.shutterT = T.shutterGap; api.log(X.shutter);
                    if (d.items.filter(i => i.auto).length < 6) item(d, 'photo', '사진', { iFile: true, auto: true });
                }
                if (!(d.cam.rec && d.cam.rec.lens === 'front')) { e.t -= dt; if (e.t <= 0) fail(s, api, 'I_NO_VIDEO'); }
                return;
            case 'J':
                if (!e.open) {
                    e.reopenT -= dt;
                    if (e.reopenT <= 0) { e.open = true; d.app = 'video'; d.overlay = 'autoVideo'; e.req = 0; e.reqT = 0; api.log(X.jRerun); api.log(data.jRequests[0].text(e.who)); }
                    return;
                }
                e.reqT += dt; e.t -= dt;
                if (e.reqT >= T.jLen / 4 && e.req < data.jRequests.length - 1) {
                    e.reqT = 0; e.req += 1; api.log(data.jRequests[e.req].text(e.who));
                    if (data.jRequests[e.req].id === 'reply') msg(d, 'j', e.who, '이거 보면 답장해 줘.');
                }
                if (e.t <= 0) { api.log(X.jEnd); resolve(s, api, e); }
                return;
            case 'K':
                if (e.phase === 'talk') return;
                e.t -= dt; if (e.t > 0) return;
                if (e.phase === 'ringing') return toKSms(s, api, e);
                api.log(X.kQuiet); return resolve(s, api, e);
        }
    }

    function toKSms(s, api, e) {
        const d = s.data;
        Object.assign(e, { phase: 'sms', t: T.kSmsWait }); d.overlay = '';
        msg(d, 'hq', data.hqNumber, X.kSms(data.hqNumber).replace(/^\[[^\]]+\] /, ''), { location: true });
        api.log(X.kSms(data.hqNumber));
    }

    function dial(s, raw, api) {
        const d = s.data, number = digits(raw), e = ev(d, 'A');
        if (!number) return;
        const contact = data.contacts.find(c => digits(c.number) === number);
        const shown = contact ? contact.name : raw;
        d.calls.unshift({ dir: 'out', number: contact ? contact.number : raw, at: d.clock });
        if (ev(d, 'J') && contact) return fail(s, api, 'J_CONTACT');
        if (d.resolved.includes('J') && contact && contact.name === d.jThread) return fail(s, api, 'J_CONTACT');
        if (e && e.kind === 'A' && e.phase === 'wait' && number === digits(e.number)) {
            e.answered = roll('aAnswer') < 0.5;
            e.phase = 'ringing'; e.t = e.answered ? T.ringBeforeAnswer : T.noAnswerRing; d.overlay = 'call';
            return api.log(X.dialing(e.number));
        }
        api.log(X.otherCall(shown));
    }

    function shutter(s, api) {
        const d = s.data, g = ev(d, 'G'), h = ev(d, 'H');
        if (d.app !== 'camera' || d.cam.mode !== 'photo') return;
        if (g && d.cam.lens === 'rear' && lit(d)) {
            item(d, 'photo', '사진'); api.log(X.gShot);
            d.dark = false; d.entity = null; return resolve(s, api, g);
        }
        if (h && h.n >= 1 && d.cam.lens === 'rear' && d.cam.zoom >= T.zoomNeeded && d.facing === data.opposite[h.angle]) {
            item(d, 'photo', '사진', { fixed: true }); api.log(X.hFixed); return resolve(s, api, h);
        }
        if (g) { item(d, 'photo', '사진'); return api.log(X.darkShot); }
        if (h) { item(d, 'photo', '사진'); return api.log(X.hMiss); }
        item(d, 'photo', '사진', ev(d, 'I') ? { iFile: true } : null); api.log(X.shutter);
    }

    function record(s, api) {
        const d = s.data, e = ev(d, 'I');
        if (d.app !== 'camera' || d.cam.mode !== 'video') return;
        if (!d.cam.rec) {
            d.cam.rec = { t: 0, lens: d.cam.lens };
            api.log(X.recStart(d.cam.lens));
            if (e && d.cam.lens !== 'front') api.log(X.recNoFace);
            return;
        }
        const t = d.cam.rec.t; d.cam.rec = null;
        item(d, 'video', '동영상', e ? { iFile: true } : null);
        api.log(X.recStop(fmtRec(t)));
        if (e) api.log(X.recShort);
    }
    // The recording clock shows the canon 5 minutes compressed into tuning.selfieLen real seconds.
    function fmtRec(t) { const v = Math.floor(t * 300 / T.selfieLen); return `${String(Math.floor(v / 60)).padStart(2, '0')}:${String(v % 60).padStart(2, '0')}`; }

    function reply(s, value, api) {
        const d = s.data, tid = value && value.thread, text = String((value && value.text) || '').trim();
        if (!tid || !text || !d.threads[tid]) return;
        d.threads[tid].msgs.push({ text, at: d.clock, mine: true });
        if (tid === 'safety') {
            if (d.rescue === 'none' && d.codesSent >= 3 && digits(text) === d.codes[2]) {
                d.rescue = 'inProgress'; d.rescueLeft = T.rescueMin + roll('rescue') * (T.rescueMax - T.rescueMin);
                d.rescueResolved = 0; d.rescueNeed = roll('rescue') < 0.5 ? 1 : 2; d.nextIn = Math.min(d.nextIn, T.afterResolve * 2);
                msg(d, 'safety', '안전 안내 문자', '[구조 작업 진행 중]'); msg(d, 'safety', '안전 안내 문자', '[위치 확인 완료]');
                api.majorEvent('RESCUE');
                api.log(X.rescueStart); return api.log(X.rescueKeep);
            }
            msg(d, 'safety', '안전 안내 문자', X.codeBad.replace('[안전 안내 문자] ', '')); return api.log(X.codeBad);
        }
        if (tid === 'j') return fail(s, api, 'J_CONTACT');
        if (tid === 'hq') return fail(s, api, 'K_LOCATION');
        api.log(X.replySent);
    }

    function closeJ(s, api) {
        const d = s.data, e = ev(d, 'J');
        if (!e || !e.open) return;
        e.closes += 1; e.open = false; d.overlay = '';
        if (e.closes >= 2) { api.log(X.jClosed); return resolve(s, api, e); }
        api.log(X.jClosed); e.reopenT = 2;
    }

    const BACK = { thread: 'messages', appInfo: 'settingsApps', settingsApps: 'settings', viewer: 'photos', pay: 'thread' };

    function action(s, name, value, api) {
        const d = s.data;
        if (s.status !== 'active' || d.ending > 0) return;
        const eA = ev(d, 'A'), eB = ev(d, 'B'), eC = ev(d, 'C'), eD = ev(d, 'D'), eF = ev(d, 'F'), eJ = ev(d, 'J'), eK = ev(d, 'K');
        const inB = !!eB;
        const callUp = d.overlay === 'call' || d.overlay === 'screamCall';
        // Leaving the video-call screen is looking away.
        if (inB && ['home', 'back', 'open', 'thread', 'face'].includes(name)) return fail(s, api, 'B_LOOKAWAY');
        switch (name) {
            case 'home':
                if (callUp) return;
                if (d.overlay === 'autoVideo') return closeJ(s, api);
                d.app = 'home'; d.arg = ''; return;
            case 'back':
                if (callUp) return;
                if (d.overlay === 'autoVideo') return closeJ(s, api);
                d.app = BACK[d.app] || 'home';
                if (d.app === 'thread') d.arg = 'carrier';
                else if (d.app === 'settingsApps' || d.app === 'photos' || d.app === 'messages' || d.app === 'home') d.arg = '';
                return;
            case 'open': {
                if (callUp || d.overlay === 'autoVideo') return;
                const app = d.apps.find(a => a.id === value);
                if (!app) return;
                if (app.strange) return api.log(X.appCannotOpen);
                d.app = app.id; d.arg = ''; return;
            }
            case 'thread':
                if (callUp || d.overlay === 'autoVideo' || !d.threads[value]) return;
                d.app = 'thread'; d.arg = value; d.threads[value].unread = 0; return;
            case 'dialInput': d.dial = String(value || '').slice(0, 20); return;
            case 'call': return dial(s, value != null ? value : d.dial, api);
            case 'hangup':
                if (eA && (eA.phase === 'ringing' || eA.phase === 'answered')) { api.log(X.hungUp); return resolve(s, api, eA); }
                if (eK && eK.phase === 'talk') { api.log(X.kHangUp); return resolve(s, api, eK); }
                return;
            case 'speak':
                if (eA && eA.phase === 'answered') return fail(s, api, 'A_SPOKE');
                if (eK && eK.phase === 'talk') return fail(s, api, 'K_LOCATION');
                return;
            case 'answer':
                if (inB) return fail(s, api, 'B_ANSWER');
                if (eD) return fail(s, api, 'D_ANSWER');
                if (eK && eK.phase === 'ringing') { eK.phase = 'talk'; delete eK.t; return api.log(X.kVoice); }
                return;
            case 'reject':
                if (inB) return fail(s, api, 'B_REJECT');
                if (eD) {
                    if (eD.n === 5 && eD.phase === 'cut') { api.log(X.rejected); return resolve(s, api, eD); }
                    return fail(s, api, 'D_EARLY');
                }
                if (eK && eK.phase === 'ringing') return toKSms(s, api, eK);
                return;
            case 'stare':
                if (!inB) return;
                eB.holding = !!value;
                if (eB.holding && !eB.started) { eB.started = true; api.log(X.staring); }
                return;
            case 'tellLocation': case 'shareLocation':
                if (eK && eK.phase === 'talk') return fail(s, api, 'K_LOCATION');
                return;
            case 'payOpen': d.app = 'pay'; d.arg = 'carrier'; return;
            case 'pay':
                if (eC && !eC.paid) {
                    eC.paid = true; msg(d, 'carrier', '통신사', X.billPaid(eC.amount).replace('[통신사] ', ''));
                    api.log(X.billPaid(eC.amount)); d.app = 'thread'; d.arg = 'carrier'; return resolve(s, api, eC);
                }
                return;
            case 'go': if (value === 'settingsApps' && d.app === 'settings') { d.app = 'settingsApps'; d.arg = ''; } return;
            case 'appInfo': if (d.apps.find(a => a.id === value)) { d.app = 'appInfo'; d.arg = value; } return;
            case 'perm': {
                const app = d.apps.find(a => a.id === (value && value.app));
                if (!app || !(value.perm in app.perms)) return;
                if (app.strange && !app.perms[value.perm]) return;   // once revoked it stays revoked
                app.perms[value.perm] = !app.perms[value.perm];
                api.log((app.perms[value.perm] ? X.appPermOn : X.appPermOff)(app.name, value.perm));
                if (app.strange && eF && Object.values(app.perms).every(v => !v)) { api.log(X.appAllOff(app.name)); resolve(s, api, eF); }
                return;
            }
            case 'uninstall': {
                const app = d.apps.find(a => a.id === value);
                if (!app) return;
                if (app.strange) return fail(s, api, 'F_DELETE');
                return api.log(X.appSystem);
            }
            case 'light': d.light.on = !d.light.on; return;
            case 'lightLevel': if ([1, 2, 3].includes(Number(value))) d.light.level = Number(value); return;
            case 'face': if (data.dirs[value]) d.facing = value; return;
            case 'camMode': if (['photo', 'video'].includes(value) && !d.cam.rec) d.cam.mode = value; return;
            case 'lens': if (['rear', 'front'].includes(value) && !d.cam.rec) d.cam.lens = value; return;
            case 'zoom': if ([1, 2, 4].includes(Number(value))) d.cam.zoom = Number(value); return;
            case 'shutter': return shutter(s, api);
            case 'record': return record(s, api);
            case 'openItem': {
                const it = d.items.find(i => i.id === value);
                if (!it) return;
                if (it.iFile) return fail(s, api, 'I_VIEWED');
                d.app = 'viewer'; d.arg = it.id; return;
            }
            case 'deleteItem': {
                const it = d.items.find(i => i.id === value);
                if (!it) return;
                if (it.fixed) return fail(s, api, 'H_DELETED');
                d.items = d.items.filter(i => i !== it); if (d.app === 'viewer') { d.app = 'photos'; d.arg = ''; }
                return;
            }
            case 'reply': return reply(s, value, api);
            case 'sendLocation':
                if (value === 'hq') return fail(s, api, 'K_LOCATION');
                if (value === 'j') return fail(s, api, 'J_SEND_LOC');
                return;
            case 'jCall': case 'jReply': if (eJ) return fail(s, api, 'J_CONTACT'); return;
            case 'jMove': if (eJ) return fail(s, api, 'J_MOVE'); return;
            case 'jLocation': if (eJ) return fail(s, api, 'J_SEND_LOC'); return;
            case 'jClose': return closeJ(s, api);
        }
    }

    FieldCore.register({
        id: data.id, data, init, tick, action, scene: () => '',
        interval, fmtRec, canStart, ev,
        logTag: run => run.data.clock,
        stamp: log => log.tag || '',
        manualClock: true, startLog: data.startLog,
        // Losing focus releases the stare (the hold button cannot stay pressed in a hidden tab).
        release(run) { const b = ev(run.data, 'B'); if (b) b.holding = false; },
        get ui() { return window.FieldEP09UI; }
    });
})();

// EP06 mission: the homeroom teacher's ordinary day, compressed (prep -> homeroom -> lesson -> break -> listening test -> lesson ->
// closing). The point is NORMALITY: the procedures in the rule document are performed as part of the routine, and panicking out of the
// routine is what goes wrong. The classroom objects are the interface (roll book, desk 17, podium, door, speaker, board, clock).
// Story, J record, blue screen and LOOP 02 are never touched here. Only outcomes the reviewed document states are described as
// consequences (marking 17 present; calling a student 17 and not leaving); everything else ends in a minimal "record interrupted".
(() => {
    const data = FieldEP06Data;
    const T = data.tuning;
    const X = data.text;
    const rnd = name => data.random(name);
    const span = (name, [lo, hi]) => lo + Math.min(hi - lo, Math.floor(rnd(name) * (hi - lo + 1)));
    function pickStr(name, entries) {
        const v = rnd(name);
        if (typeof v === 'string') { const hit = entries.find(([key]) => key === v); if (hit) return hit[0]; }
        const total = entries.reduce((sum, [, w]) => sum + w, 0);
        let roll = (typeof v === 'number' ? v : 0.5) * total;
        for (const [key, w] of entries) { if ((roll -= w) < 0) return key; }
        return entries[entries.length - 1][0];
    }
    const PHASES = ['prep', 'homeroom', 'class1', 'break', 'listening', 'class2', 'closing', 'done'];
    const SEATS = [15, 16, 17, 18, 19];

    function fail(s, api, code) {
        s.data.failCode = code;
        api.die(`${code} — ${data.failures[code]}`, code);
    }

    function init(s, api) {
        s.inventory = {}; s.controls = {};
        const cOn = rnd('cOn') < T.cChance;
        s.data = {
            phase: 'prep',
            deskDirty: rnd('deskDirty') < T.deskDirtyChance, deskSeen: false, deskClean: false,
            b: rnd('b') < T.bChance, reported: false, calledWrong: false,
            att: 'ready', next: T.rollFrom, absent: false,
            a: '', aT: 0, aFocused: false, aFocusLeft: 0, eye: '', strainIn: 0, strainLeft: 0, talkShown: 0, urgeShown: 0, talkUntil: 0, urgeUntil: 0,
            iso: '', isoWin: 0, isoLeft: 0, isoLine: 0,
            lesson: 0, need: 0, chalkCd: 0, stall: 0, cls: 0,
            eOn: rnd('eOn') < T.eChance, eIn: rnd('eIn') < 0.5 ? 1 : 2, eAtT: span('eAt', T.eAt), e: '', eLeft: 0, eLine: 0, eEvery: 0,
            brk: 0, cOn, cSeat: [16, 18, 19][Math.min(2, Math.floor(rnd('cSeat') * 3))], c: '', cSeen: false,
            dOn: rnd('dOn') < T.dChance, dAtT: span('dAt', T.dAt), ltT: 0, d: '', dAnom: false, dLeft: 0, said: false, sprays: 0, ltEnd: false, endLeft: 0,
            seat: pickStr('seat', T.seat), seatSeen: false, closeSprays: 0, out: false, called: false,
            failCode: ''
        };
    }

    const tagOf = s => data.schedule[s.data.phase] || '';

    function enterPhase(s, api, phase) {
        const d = s.data;
        d.phase = phase; d.stall = 0; d.cls = 0;
        if (phase === 'homeroom') { d.att = 'ready'; d.next = T.rollFrom; api.log(X.homeroom); if (d.b) api.majorEvent('B_ROSTER'); api.majorEvent('HOMEROOM'); }
        if (phase === 'class1' || phase === 'class2') { d.lesson = 0; d.need = T.lessonNeed[phase === 'class1' ? 0 : 1]; d.chalkCd = 0; api.majorEvent('LESSON'); }
        if (phase === 'break') { d.brk = T.breakTime; api.log(X.breakStart); }
        if (phase === 'listening') { d.ltT = 0; d.d = ''; d.dAnom = false; d.sprays = 0; d.ltEnd = false; api.log(X.examStart); api.majorEvent('LISTENING_TEST'); }
        if (phase === 'closing') { api.log(X.closingStart); api.majorEvent('CLOSING'); }
    }

    function startA(s, api) {
        const d = s.data;
        d.a = 'active'; d.aT = T.aTime; d.aFocused = false; d.aFocusLeft = T.aFocus; d.eye = ''; d.strainIn = T.aStrainEvery; d.strainLeft = 0;
        d.talkShown = 0; d.urgeShown = 0; d.talkUntil = 0; d.urgeUntil = 0;
        api.log(X.aStart); api.log(X.aNote); api.majorEvent('A_FREEZE');
    }

    // ---- timers --------------------------------------------------------------------------------------------------------
    function tick(s, dt, api) {
        const d = s.data;
        if (s.status !== 'active') return;
        // situation A: keep the eyes on desk 17, blink one eye at a time, never answer, never move
        if (d.a === 'active') {
            if (!d.aFocused) { d.aFocusLeft -= dt; if (d.aFocusLeft <= 0) return fail(s, api, 'A_LOOKAWAY'); }
            else {
                if (d.strainLeft > 0) { d.strainLeft -= dt; if (d.strainLeft <= 0) return fail(s, api, 'A_LOOKAWAY'); }
                else { d.strainIn -= dt; if (d.strainIn <= 0) { d.strainLeft = T.aStrainWindow; api.log(X.aStrain); } }
            }
            d.aT -= dt;
            const elapsed = T.aTime - d.aT;
            if (d.talkShown < T.aTalk.length && elapsed >= T.aTalk[d.talkShown]) { d.talkShown += 1; d.talkUntil = elapsed + T.aPromptShow; api.log(X.aTalk); }
            if (d.urgeShown < T.aUrge.length && elapsed >= T.aUrge[d.urgeShown]) { d.urgeShown += 1; d.urgeUntil = elapsed + T.aPromptShow; api.log(X.aUrge); }
            if (d.aT <= 0) { d.a = 'done'; d.aFocused = false; d.strainLeft = 0; api.log(X.aTeam); api.majorEvent('A_RESCUED'); }
            return;
        }
        // situation B: after calling 17 for another student the teacher and the student must go to the isolation room at once
        if (d.iso === 'pending') { d.isoWin -= dt; if (d.isoWin <= 0) return fail(s, api, 'B_VANISHED'); }
        if (d.iso === 'inside') {
            d.isoLeft -= dt;
            const step = Math.floor((T.isoStay - d.isoLeft) / (T.isoStay / (X.isoLines.length + 1)));
            if (d.isoLine < X.isoLines.length && step > d.isoLine) { api.log(X.isoLines[d.isoLine]); d.isoLine += 1; }
            if (d.isoLeft <= 0) { d.iso = 'done'; d.reported = true; api.log(X.isoDone); api.majorEvent('B_ISOLATION_DONE'); }
            return;
        }
        // lessons: the board keeps being written on; situation E (a voice outside the door)
        if (d.phase === 'class1' || d.phase === 'class2') {
            d.cls += dt; if (d.chalkCd > 0) d.chalkCd -= dt;
            const num = d.phase === 'class1' ? 1 : 2;
            if (d.eOn && d.e === '' && d.eIn === num && d.cls >= d.eAtT) { d.e = 'active'; d.eLeft = T.eDur; d.eLine = 0; d.eEvery = T.eEvery; d.stall = 0; api.log(X.eVoice); api.majorEvent('E_VOICE'); }
            if (d.e === 'active') {
                if (d.lesson < d.need) { d.stall += dt; if (d.stall >= T.stall) return fail(s, api, 'ROUTINE_BROKEN'); }   // the routine is the lesson itself; once it is complete nothing is left to stall
                d.eEvery -= dt; if (d.eEvery <= 0) { d.eEvery = T.eEvery; api.log(X.eMore[d.eLine % X.eMore.length]); d.eLine += 1; }
                d.eLeft -= dt;
                if (d.eLeft <= 0) {
                    d.e = 'done'; api.log(X.eEnd);
                    if (rnd('selfOpen') < T.selfOpenChance) { api.log(X.eSelf); api.majorEvent('E_SELF_OPEN'); }   // she may open it herself: not a failure
                }
            }
            if (d.lesson >= d.need && d.e !== 'active') { api.log(X.lessonEnd); enterPhase(s, api, d.phase === 'class1' ? 'break' : 'closing'); }
            return;
        }
        // break: a student may be followed
        if (d.phase === 'break') {
            d.brk -= dt;
            if (d.brk <= 0) {
                if (d.cOn && d.c !== 'done') return fail(s, api, 'C_INCOMPLETE');
                enterPhase(s, api, 'listening');
            }
            return;
        }
        // listening test
        if (d.phase === 'listening') {
            if (!d.ltEnd) {
                d.ltT += dt;
                if (d.dOn && d.d === '' && d.ltT >= d.dAtT) { d.d = 'noise'; d.dAnom = true; d.dLeft = T.sayWindow; api.log(X.noise); api.majorEvent('D_NOISE'); }
                if (d.d === 'noise') { d.dLeft -= dt; if (d.dLeft <= 0) return fail(s, api, 'D_NO_WARNING'); }
                if (d.ltT >= T.exam) {
                    d.ltEnd = true; api.log(X.examEnd);
                    if (d.dAnom) d.endLeft = T.sprayWindow; else d.endLeft = T.calmAfter;
                }
            } else {
                if (d.dAnom) {
                    if (d.sprays >= 2) { api.majorEvent('D_SPRAYED'); return enterPhase(s, api, 'class2'); }
                    d.endLeft -= dt; if (d.endLeft <= 0) return fail(s, api, 'D_UNSPRAYED');
                } else { d.endLeft -= dt; if (d.endLeft <= 0) enterPhase(s, api, 'class2'); }
            }
        }
    }

    // ---- actions -----------------------------------------------------------------------------------------------------
    function interact(s, api, target) {
        const d = s.data;
        // A: the only legal object is desk 17
        if (d.a === 'active') {
            if (target !== 'seat17') return fail(s, api, 'A_LOOKAWAY');
            if (!d.aFocused) { d.aFocused = true; d.strainIn = T.aStrainEvery; api.log(X.aFocus); }
            return;
        }
        // a roll answer may be heard: eyes stay on the roll book
        if (d.att === 'await' && target !== 'roll') return fail(s, api, 'ATTEND_LOOKED_UP');
        if (d.iso === 'inside') { if (target === 'door') return fail(s, api, 'ISO_OPENED'); return; }
        if (target === 'door') {
            if (d.e === 'active') return fail(s, api, 'E_DOOR_OPENED');
            return api.log(X.doorQuiet);
        }
        if (target === 'speaker') {
            if (d.phase === 'listening' && d.d === 'noise') return fail(s, api, 'D_STOPPED');
            return api.log(X.speaker);
        }
        if (target === 'clock') return api.log(X.clock(data.schedule[d.phase]));
        if (target === 'board') {
            if ((d.phase === 'class1' || d.phase === 'class2') && d.lesson < d.need) {
                if (d.chalkCd > 0) return;
                d.lesson += 1; d.chalkCd = T.chalkCd; d.stall = 0; return api.log(X.chalk(d.lesson));
            }
            return;
        }
        if (target === 'podium') return api.log(X.podium);
        if (target === 'seat17') {
            d.deskSeen = true;
            if (d.phase === 'closing') {
                d.seatSeen = true;
                api.log(d.seat === 'water' ? X.seatWater : d.seat === 'smell' ? X.seatSmell : X.seatClean);
                if (d.seat === 'water') api.majorEvent('DESK_WATER');
                if (d.deskDirty && !d.deskClean) api.log(X.prepDeskDirty);
                return;
            }
            if (d.b && d.phase === 'homeroom') api.log(X.bNote);
            return api.log(d.deskDirty && !d.deskClean ? X.prepDeskDirty : X.prepDeskClean);
        }
        const n = Number(String(target).replace('seat', ''));
        if (SEATS.includes(n)) {
            const name = data.students[n];
            if (d.phase === 'break' && d.cOn && n === d.cSeat) { d.cSeen = true; return api.log(X.seatFollowed(n, name)); }
            return api.log(X.seatNormal(n, name));
        }
    }

    function action(s, name, value, api) {
        const d = s.data;
        if (s.status !== 'active') return;
        switch (name) {
            case 'obj': return interact(s, api, String(value));
            // --- preparation / phase changes -------------------------------------------------------------------------
            case 'clean':
                if (!d.deskSeen || !d.deskDirty || d.deskClean) return;
                d.deskClean = true; return api.log(X.deskCleaned);
            case 'startHomeroom': if (d.phase === 'prep') enterPhase(s, api, 'homeroom'); return;
            case 'endHomeroom': if (d.phase === 'homeroom' && d.att === 'done') { enterPhase(s, api, 'class1'); } return;
            // --- the roll ritual -----------------------------------------------------------------------------------------
            case 'call': {
                if (d.phase !== 'homeroom' || d.a === 'active' || d.iso === 'pending' || d.iso === 'inside') return;
                if (d.att === 'await') return fail(s, api, 'ATTEND_SKIPPED');
                if (d.att === 'done') return;
                const n = d.next;
                if (n === 17) {
                    if (d.b && !d.reported) {                        // called 17 for another student before reporting
                        d.calledWrong = true; d.iso = 'pending'; d.isoWin = T.isoWindow;
                        api.log(X.bCalled(data.students.other)); api.log(X.bAware); return api.majorEvent('B_CALLED');
                    }
                    if (d.b) { api.log(X.callTemp); d.next = 18; return; }
                    api.log(X.call17); d.att = 'await';
                    const kind = pickStr('call17', T.call17);
                    if (kind === 'A') return startA(s, api);
                    return api.log(kind === 'reply' ? X.reply : X.quiet);
                }
                api.log(X.callOther(n)); d.next += 1;
                if (d.next > T.rollTo) d.att = 'done';
                return;
            }
            case 'absent':
                if (d.att !== 'await' || d.a === 'active') return;
                d.absent = true; d.att = 'calling'; d.next = 18; api.log(X.absent); api.majorEvent('ATTEND_ABSENT'); return;
            case 'present':
                if (d.att !== 'await' || d.a === 'active') return;
                return fail(s, api, 'ATTEND_PRESENT');
            // --- situation A -----------------------------------------------------------------------------------------------
            case 'eye':
                if (d.a !== 'active' || d.strainLeft <= 0 || (value !== 'L' && value !== 'R')) return;
                if (d.eye === value) return fail(s, api, 'A_EYES');
                d.eye = value; d.strainLeft = 0; d.strainIn = T.aStrainEvery; return;
            case 'answer': if (d.a === 'active') return fail(s, api, 'A_ANSWERED'); return;
            case 'move': if (d.a === 'active') return fail(s, api, 'A_MOVED'); return;
            // --- situation B -----------------------------------------------------------------------------------------------
            case 'goIso':
                if (d.iso !== 'pending') return;
                d.iso = 'inside'; d.isoLeft = T.isoStay; d.isoLine = 0; api.log(X.isoIn); return api.majorEvent('B_ISOLATION');
            // --- podium items ----------------------------------------------------------------------------------------------
            case 'sns': {
                if (d.phase === 'listening' && d.ltEnd && d.dAnom) { d.sprays += 1; return api.log(X.spray(d.sprays)); }
                if (d.phase === 'closing') { d.closeSprays += 1; return api.log(X.sprayOther); }
                return api.log(X.sprayOther);
            }
            case 'button': {
                if (d.phase === 'break' && d.cOn && d.c === '') { d.c = 'pressed'; api.log(X.button); return api.majorEvent('C_BUTTON'); }
                return api.log(X.buttonNone);
            }
            case 'phone':
                if (value === 'team') {
                    if (d.phase === 'homeroom' && d.b && !d.reported) { d.reported = true; api.log(X.bReport); return api.majorEvent('B_REPORTED'); }
                    return api.log(X.phoneTeamNone);
                }
                if (value === 'hq') {
                    if (d.phase === 'closing' && d.seat === 'water' && d.seatSeen) {
                        if (!d.out) return fail(s, api, 'CLOSING_ORDER');
                        d.called = true; api.log(X.phoneHq); return api.majorEvent('HQ_CALLED');
                    }
                    return api.log(X.phoneHqNone);
                }
                return;
            // --- situation C ------------------------------------------------------------------------------------------------
            case 'escort': {
                if (d.phase !== 'break' || d.c !== 'pressed') return;
                const n = Number(value);
                if (n !== d.cSeat) return fail(s, api, 'C_WRONG_STUDENT');
                d.c = 'done'; api.log(X.escort(n, data.students[n])); return api.majorEvent('C_ESCORTED');
            }
            // --- situation D ------------------------------------------------------------------------------------------------
            case 'say':
                if (d.phase !== 'listening' || d.d !== 'noise') return;
                d.d = 'said'; d.said = true; api.log(X.say); return api.majorEvent('D_SAID');
            case 'stopExam':
                if (d.phase === 'listening' && !d.ltEnd && d.d === 'noise') return fail(s, api, 'D_STOPPED');
                return;
            // --- closing ----------------------------------------------------------------------------------------------------
            case 'dismiss':
                if (d.phase !== 'closing' || d.seat !== 'water' || !d.seatSeen || d.out) return;
                d.out = true; return api.log(X.dismiss);
            case 'endClosing': {
                if (d.phase !== 'closing') return;
                if (d.seat !== 'clean' && !d.seatSeen) return fail(s, api, 'CLOSING_UNCHECKED');
                if (d.seat === 'smell' && d.closeSprays < 1) return fail(s, api, 'CLOSING_UNRESOLVED');
                if (d.seat === 'water' && !(d.out && d.called)) return fail(s, api, 'CLOSING_UNRESOLVED');
                if (d.deskDirty && !d.deskClean) return fail(s, api, 'DESK_NEGLECTED');
                d.phase = 'done'; api.majorEvent('DAY_END');
                return api.win(X.clear, { patrols: {}, elapsed: s.elapsed, injuries: [] });
            }
        }
    }

    function snapshot(s) { return { v: 1, ...JSON.parse(JSON.stringify(s.data)) }; }
    function restore(s, snap, api) {
        const ok = snap && snap.v === 1 && PHASES.includes(snap.phase) && snap.phase !== 'done' && ['ready', 'calling', 'await', 'done'].includes(snap.att)
            && Number.isInteger(snap.next) && snap.next >= T.rollFrom && snap.next <= T.rollTo + 1 && ['clean', 'smell', 'water'].includes(snap.seat)
            && [15, 16, 17, 18, 19].includes(snap.cSeat);
        if (!ok) return false;
        const { v, ...rest } = snap;
        s.data = { ...s.data, ...rest };
        return true;
    }

    FieldCore.register({ id: data.id, data, init, tick, action, scene: () => '', stamp: log => log.tag || '', snapshot, restore,
        manualClock: true, persist: true, startLog: data.startLog, restoredLog: data.restoredLog,
        logTag: tagOf, release() { /* nothing is held: losing focus never changes the situation */ },
        get ui() { return window.FieldEP06UI; }
    });
})();

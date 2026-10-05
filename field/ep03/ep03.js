// EP03 mission: a managed-survival hospital stay (Day 1-7, compressed). No escape and no shift clock: the player reads the
// rule document, observes the ward, and survives until a real guardian visits. Ends through FieldCore.win()/die().
// Story, J record, blue screen and LOOP 02 are never touched here. Failures prefer state changes over instant death;
// only outcomes the reviewed document makes lethal (or unavoidable) end the run.
(() => {
    const data = FieldEP03Data;
    const T = data.tuning;
    const rnd = name => data.random(name);
    const pick = (list, name) => list[Math.floor(rnd(name) * list.length) % list.length];
    const fmt = m => `${String(Math.floor(m / 60) % 24).padStart(2, '0')}:${String(Math.floor(m % 60)).padStart(2, '0')}`;

    function fail(s, api, code) {
        s.data.failCode = code;
        api.die(`${code} — ${data.failures[code]}`, code);
    }

    function init(s, api) {
        s.inventory = {}; s.controls = {};
        const band = data.bands[Math.min(2, Math.floor(rnd('band') * 3))];
        const profile = pick(data.profiles, 'profile');
        const realDay = 5 + Math.min(2, Math.floor(rnd('realDay') * 3));
        const candidates = [3, 4, 5, 6].filter(day => day !== realDay);
        const fakeA = candidates.splice(Math.floor(rnd('fake1') * candidates.length) % candidates.length, 1)[0];
        const fakeB = candidates.splice(Math.floor(rnd('fake2') * candidates.length) % candidates.length, 1)[0];
        const kind = name => (rnd(name) < 0.5 ? 'ask' : 'wrong');
        s.data = {
            day: 1, clock: T.dayStart, loc: 'room',
            band, part: band === 'yellow' ? pick(data.parts, 'part') : '',
            surgeryDay: 2 + Math.min(5, Math.floor(rnd('surgeryDay') * 6)), surgeryTime: pick(T.surgeryTimes, 'surgeryTime'),
            money: 6,
            // What the player has actually looked at (last seen values, may become stale).
            seenBand: false, seenPart: false, seenSurgeryDay: 0, seenSurgeryTime: 0, seenAt: '', seenMoney: -1,
            roomLooked: false, tookLaxative: false, tookRedPill: false, injected: '',
            mutated: false, painShown: false,
            juice: 'none', drinkOk: false, stomach: false, emergencyAt: 0,
            surgeries: 0, injuries: [],
            eyesClosed: false, breathing: false, leak: false, failCode: '',
            profile,
            sys: {
                visits: [{ day: fakeA, kind: kind('fakeKind1') }, { day: fakeB, kind: kind('fakeKind2') }, { day: realDay, kind: 'real' }],
                visitNow: null, waitSurgery: false, wrongField: Math.min(3, Math.floor(rnd('wrongField') * 4)),
                nurse: '', nurseLeft: 0, fallAt: 0, mattress: false,
                rounds: '', roundsLeft: 0,
                night: '', nightLeft: 0, nightHold: 0, nightDay: 0,
                vend: '', inserted: 0, selected: false,
                firstDone: false, bellLogged: false
            }
        };
    }

    const where = d => ({ room: '병실', corridor: '복도', lounge: '병동 휴게실', visit: '1층 면회실' })[d.loc];
    const tagOf = s => `D${s.data.day} ${fmt(s.data.clock)}`;

    function secPerMin(d) {
        if (d.day === 1 && d.clock < T.firstEvent) return T.introSeconds / (T.firstEvent - T.dayStart);
        if (d.day === d.surgeryDay && d.clock >= d.surgeryTime - T.slowBefore && d.clock < d.surgeryTime) return T.slowSecPerMin;
        if (d.emergencyAt && d.clock < d.emergencyAt) return T.slowSecPerMin;
        return T.secPerMin;
    }

    function surgeryPrepared(d) { return d.juice === 'drunk' && d.drinkOk && d.stomach; }

    function clearRescue(s, api) {
        const d = s.data;
        api.log(`[퇴원] 남은 10만원권 ${d.money}장을 두고 병원을 나왔다.`);
        api.majorEvent('RESCUE');
        api.win('구조 성공 — 보호자와 함께 병원을 나왔습니다. 생환 기록 전송.', { patrols: {}, elapsed: s.elapsed, injuries: d.injuries.slice() });
    }

    function operate(s, api) {
        const d = s.data, x = d.sys;
        if (!surgeryPrepared(d)) return fail(s, api, 'SURGERY_WITHOUT_PREP');
        api.log('[수술] 복통을 호소하자 예정되어 있던 수술이 무작위 장기 적출술로 변경되었다. 마취와 봉합이 규정대로 이루어졌다.');
        d.surgeries += 1; d.injuries.push('무작위 장기 적출술');
        d.surgeryDay = d.day + T.surgeryInterval; d.surgeryTime = pick(T.surgeryTimes, 'surgeryTime');
        d.juice = 'none'; d.drinkOk = false; d.stomach = false; d.emergencyAt = 0;
        api.majorEvent('ORGAN_REMOVAL');
        if (x.waitSurgery) { x.waitSurgery = false; api.log('[수술 후] 예정된 수술을 마쳤다. 이제 병원을 나갈 수 있다.'); clearRescue(s, api); }
    }

    function nurseSpeaks(s, api) {
        const d = s.data, x = d.sys;
        x.night = 'spoke'; x.nightLeft = T.nurseSpeakWindow;
        api.log('[간호사 개체] 간호사가 말을 건다. 잠들지 않았음을 알고 있다.');
        api.majorEvent('NIGHT_NURSE');
    }

    function startWheels(s, api) {
        const d = s.data, x = d.sys;
        x.nightDay = d.day;
        if (d.loc !== 'room') return nurseSpeaks(s, api);
        x.night = 'sound'; x.nightLeft = T.wheelsGrace;
        api.log('[복도] 이동 침대의 바퀴 소리가 병실 앞에서 멈춘다.');
        api.majorEvent('NIGHT_WHEELS');
    }

    function newDay(s, api) {
        const d = s.data, x = d.sys;
        d.day += 1;
        if (d.day > data.lastDay) return fail(s, api, 'RESCUE_MISSED');
        d.clock = T.dayStart; d.loc = 'room'; d.eyesClosed = false; d.breathing = false;
        x.night = ''; x.rounds = ''; x.nurse = x.nurse === 'meal' ? '' : x.nurse; x.vend = ''; x.inserted = 0; x.selected = false; x.visitNow = null;
        api.log(`[아침] DAY ${d.day}. 병실 문 옆 차트가 갱신되었다.`);
        if (d.juice === 'bed' && d.loc === 'room') api.log('[병실] 침대 위에 음료가 놓여 있다.');
    }

    function startVisit(s, api) {
        const d = s.data, x = d.sys;
        const v = x.visits.find(item => item.day === d.day);
        if (!v || x.visitNow) return;
        x.visitNow = { kind: v.kind, stage: 'notice', heard: false, under: false };
        api.log('[면회] 면회가 왔다. 면회는 각 병동 1층 면회실에서 진행된다.');
    }

    function endVisit(s, api, reason) {
        const d = s.data, x = d.sys, vn = x.visitNow;
        if (!vn) return;
        x.visits = x.visits.filter(v => !(v.day === d.day));
        // A real guardian who was sent away comes back the next day (the document guarantees arrival by day 7).
        if (vn.kind === 'real' && d.day < data.lastDay && !reason.startsWith('rescued')) x.visits.push({ day: d.day + 1, kind: 'real' });
        x.visitNow = null; if (d.loc === 'visit') d.loc = 'corridor';
    }

    function tick(s, dt, api) {
        const d = s.data, x = d.sys;
        if (s.status !== 'active') return;
        // --- real-second windows ---------------------------------------------------------------------------------------
        if (x.nurse === 'meal') {
            x.nurseLeft -= dt;
            if (x.nurseLeft <= 0) { x.nurse = ''; forcedMeal(s, api); }
        }
        if (x.rounds === 'ask') {
            x.roundsLeft -= dt;
            if (x.roundsLeft <= 0) { x.rounds = ''; api.log('[회진] 개체 의사가 병실을 나간다.'); }
        }
        if (x.night === 'sound') {
            x.nightLeft -= dt;
            if (d.eyesClosed && d.breathing) { x.night = 'asleep'; x.nightHold = T.wheelsHold; api.log('[숨소리] 눈을 감고 규칙적인 숨소리를 유지한다.'); }
            else if (x.nightLeft <= 0) nurseSpeaks(s, api);
        } else if (x.night === 'asleep') {
            if (!d.eyesClosed || !d.breathing) nurseSpeaks(s, api);
            else { x.nightHold -= dt; if (x.nightHold <= 0) { x.night = 'done'; api.log('[복도] 바퀴 소리가 멀어진다.'); } }
        } else if (x.night === 'spoke') {
            x.nightLeft -= dt;
            if (x.nightLeft <= 0) return fail(s, api, 'NIGHT_NURSE');
        }
        if (s.status !== 'active') return;
        // --- game clock ------------------------------------------------------------------------------------------------
        const prev = d.clock;
        // The hospital clock waits while a night-nurse encounter is being played out (its windows are real seconds).
        if (!['sound', 'asleep', 'spoke'].includes(x.night)) d.clock += dt / secPerMin(d);
        const crossed = th => th > 0 && prev < th && d.clock >= th;
        if (d.day === 1 && !x.firstDone && crossed(T.firstEvent)) { x.firstDone = true; firstEvent(s, api); }
        if (s.status !== 'active') return;
        if (x.fallAt && crossed(x.fallAt)) return fail(s, api, 'FALL_TEST');
        if (d.band === 'blue' && x.mattress && !d.tookRedPill && crossed(T.joints)) return fail(s, api, 'BLUE_JOINTS');
        if (crossed(T.rounds)) { x.rounds = 'ask'; x.roundsLeft = T.roundsWindow; api.log('[회진] 개체 의사가 병실에 들어와 상태를 묻는다.'); api.majorEvent('ROUNDS'); }
        if (crossed(T.visitNotice)) startVisit(s, api);
        if (crossed(T.visitEnd) && x.visitNow) { api.log('[면회] 면회자가 돌아갔다.'); endVisit(s, api, 'left'); }
        if (d.day === d.surgeryDay && crossed(d.surgeryTime)) operate(s, api);
        if (s.status !== 'active') return;
        if (d.emergencyAt && crossed(d.emergencyAt)) operate(s, api);
        if (s.status !== 'active') return;
        if (crossed(T.lightsOut)) api.log('[소등] 21시. 병동의 불이 꺼진다.');
        if (crossed(T.wheels)) startWheels(s, api);
        if (s.status !== 'active') return;
        if (crossed(T.dayEnd)) newDay(s, api);
    }

    function forcedMeal(s, api) {
        const d = s.data;
        d.mutated = true; d.surgeryDay = Math.min(d.surgeryDay, d.day + 1); d.injuries.push('특제 치료식 섭취 — 신체 변이');
        api.log('[특제 치료식] 완식했다. 피부가 보라색으로 변색되며 극심한 통증이 밀려온다. 수술 예정일이 다음 날로 앞당겨졌다.');
        api.majorEvent('MUTATION');
    }

    function firstEvent(s, api) {
        const d = s.data, x = d.sys;
        if (d.band === 'red') {
            x.nurse = 'meal'; x.nurseLeft = T.redNurseWindow;
            api.log('[간호사 개체] 간호사가 특제 치료식을 가지고 병실에 들어온다.'); api.majorEvent('RED_NURSE');
        } else if (d.band === 'yellow') {
            api.log('[간호사 개체] 망치를 든 간호사가 수술 예정 부위를 두드린다.');
            if (d.injected === d.part) api.log('아프지 않다.');
            else { d.painShown = true; x.fallAt = 480; api.log('통증이 번진다. 아픈 기색이 드러났다.'); }
            api.majorEvent('YELLOW_HAMMER');
        } else {
            x.mattress = true; api.log('[간호사 개체] 간호사가 특수 매트리스를 가지고 온다.'); api.majorEvent('BLUE_MATTRESS');
        }
    }

    function leaveBed(s, api) {
        const d = s.data, x = d.sys;
        if (d.clock >= T.lightsOut && d.clock < T.dayEnd && x.night !== 'spoke' && rnd('nightWalk') < T.nightWalkChance) {
            api.log('[소등 이후] 침상을 벗어나 복도로 나왔다.');
            nurseSpeaks(s, api);
        }
    }

    function visitScene(s, api) {
        const d = s.data, vn = d.sys.visitNow;
        if (vn.kind === 'real') return data.visitorLines.recite(d.profile);
        if (vn.kind === 'ask') return data.visitorLines.ask;
        const keys = ['age', 'job', 'home', 'family'], wrong = keys[d.sys.wrongField];
        const other = data.profiles.find(p => p[wrong] !== d.profile[wrong]);
        return data.visitorLines.recite({ ...d.profile, [wrong]: other[wrong] });
    }

    function action(s, name, value, api) {
        const d = s.data, x = d.sys, vn = x.visitNow;
        if (s.status !== 'active') return;
        const target = current => value === undefined ? !current : !!value;
        switch (name) {
            // --- ward --------------------------------------------------------------------------------------------------
            case 'look':
                if (d.loc === 'room') {
                    d.roomLooked = true;
                    api.log('[병실] 침상 옆에 호출벨이 있다. 입원실에 구비된 설사약, 마취제, 빨간 알약이 있다.');
                    if (d.juice === 'bed') api.log('침대 위에 음료가 놓여 있다.');
                } else api.log(`[${where(d)}] ${data.places[d.loc].view}`);
                return;
            case 'wrist':
                d.seenBand = true; d.seenPart = d.band === 'yellow';
                return api.log(`[오른손 팔목] ${data.bandNames[d.band]} 인식표${d.band === 'yellow' ? ` — 표기된 부위: ${d.part}` : ''}`);
            case 'chart':
                d.seenSurgeryDay = d.surgeryDay; d.seenSurgeryTime = d.surgeryTime; d.seenAt = tagOf(s);
                return api.log(`[차트] 수술 예정일: DAY ${d.surgeryDay} ${fmt(d.surgeryTime)}`);
            case 'drawer':
                d.seenMoney = d.money;
                return api.log(d.money > 0 ? `[서랍] 10만원권 지폐 ${d.money}장이 들어 있다.` : '[서랍] 비어 있다.');
            case 'laxative':
                if (!d.roomLooked) return;
                if (d.tookLaxative) return api.log('이미 설사약을 복용했다.');
                d.tookLaxative = true; return api.log('[설사약] 복용했다. 복통이 시작된다.');
            case 'inject':
                if (!d.roomLooked || !data.parts.includes(value)) return;
                d.injected = value; return api.log(`[마취제] ${value}에 주입했다.`);
            case 'redpill':
                if (!d.roomLooked) return;
                if (d.band !== 'blue') return fail(s, api, 'PILL_MISUSE');
                d.tookRedPill = true; return api.log('[빨간 알약] 수칙대로 복용했다.');
            case 'bell':
                if (!d.roomLooked || d.emergencyAt) return;
                d.emergencyAt = Math.min(T.dayEnd - 1, Math.max(d.clock + T.emergencyDelay, d.clock + 1));
                api.log('[호출벨] 침상 옆 호출벨을 눌렀다. 응급 수술 대상 환자로 분류되었다.'); api.majorEvent('CALL_BELL');
                return;
            case 'report':
                if (!d.leak) return;
                d.leak = false; return api.log('[본부 보고] 말한 정보를 본부에 보고했다.');
            // --- movement ----------------------------------------------------------------------------------------------
            case 'out':
                if (d.loc !== 'room') return;
                d.loc = 'corridor'; api.log('[복도] 병실을 나왔다.'); return leaveBed(s, api);
            case 'goLounge':
                if (d.loc !== 'corridor') return;
                d.loc = 'lounge'; x.vend = ''; x.inserted = 0; x.selected = false; return api.log('[병동 휴게실] 자판기가 있다.');
            case 'goVisit':
                if (d.loc !== 'corridor' || !vn || vn.stage !== 'notice') return;
                d.loc = 'visit'; vn.stage = 'seated'; return api.log('[1층 면회실] 면회자가 탁자 맞은편에 앉아 있다.');
            case 'back':
                if (d.loc === 'room') return;
                if (d.loc === 'visit' && vn) { api.log('[면회] 면회실을 나왔다. 면회가 끝났다.'); endVisit(s, api, 'left'); }
                d.loc = 'room'; api.log('[병실] 병실로 돌아왔다.');
                if (d.juice === 'bed') api.log('[병실] 침대 위에 음료가 놓여 있다.');
                return;
            // --- vending machine (비상 상황 A) ---------------------------------------------------------------------------
            case 'machine':
                if (d.loc !== 'lounge') return;
                x.vend = 'looked'; return api.log('[자판기] 줄과 칸마다 음료가 들어 있다. 상품 반출구가 있다.');
            case 'insert':
                if (d.loc !== 'lounge' || !x.vend || x.inserted >= 2) return;
                if (d.money < 1) return api.log('투입할 10만원권이 없다.');
                d.money -= 1; x.inserted += 1; return api.log(`[자판기] 10만원권을 투입했다. (${x.inserted}장째)`);
            case 'cell': {
                if (d.loc !== 'lounge' || !x.vend || x.selected) return;
                if (x.inserted < 2) return api.log('(투입한 금액이 부족하다)');
                const [row, col] = String(value).split('-').map(Number);
                x.selected = true; x.inserted = 0;
                if (row === data.vending.targetRow && col === data.vending.targetCol) {
                    d.juice = 'bed'; api.log(`[자판기] ${data.vending.targetName}를 선택했다.`); api.majorEvent('JUICE_BOUGHT');
                } else api.log('[자판기] 선택한 음료가 나온 듯하다. 투입한 지폐는 돌려받지 못했다.');
                return;
            }
            case 'outlet':
                if (d.loc !== 'lounge' || !x.selected) return;
                return fail(s, api, 'VENDING_OUTLET');
            case 'takeDrink':
                if (d.loc !== 'room' || d.juice !== 'bed') return;
                d.juice = 'held'; return api.log(`[${data.vending.targetName}] 침대 위의 음료를 집었다.`);
            case 'drink': {
                if (d.juice !== 'held') return;
                const minutes = d.surgeryTime - d.clock;
                d.drinkOk = d.day === d.surgeryDay && minutes <= T.drinkEarly && minutes >= T.drinkLate;
                d.juice = 'drunk'; api.log(`[${data.vending.targetName}] 복용했다.`); api.majorEvent('JUICE_DRUNK');
                return;
            }
            case 'stomach':
                if (d.juice !== 'drunk' || d.stomach) return;
                d.stomach = true; return api.log('[복통] 복통을 호소했다.');
            // --- red-band nurse / rounds --------------------------------------------------------------------------------
            case 'complain':
                if (x.nurse !== 'meal') return;
                if (!d.tookLaxative) return fail(s, api, 'SPECIAL_ROOM');
                x.nurse = ''; return api.log('[간호사 개체] 배탈이 났음을 확인하고 특제 치료식을 강요하지 않은 채 나간다.');
            case 'eat':
                if (x.nurse !== 'meal') return;
                x.nurse = ''; return forcedMeal(s, api);
            case 'answer':
                if (x.rounds !== 'ask') return;
                x.rounds = '';
                if (value === 'cured') return fail(s, api, 'BERRY_PSYCH');
                if (value === 'pain') {
                    d.surgeryDay = Math.max(d.day + 1, d.surgeryDay - 1); api.log('[회진] 통증을 호소했다. 수술 예정일이 앞당겨졌다.'); api.majorEvent('PAIN_REPORTED');
                } else api.log('[회진] 개체 의사가 고개를 끄덕이고 병실을 나간다.');
                return;
            // --- lights-out ---------------------------------------------------------------------------------------------
            case 'eyes': d.eyesClosed = target(d.eyesClosed); if (!d.eyesClosed) d.breathing = false; return api.log(d.eyesClosed ? '눈을 감았다.' : '눈을 떴다.');
            case 'breathe':
                if (!d.eyesClosed) return api.log('(눈을 뜬 채로는 숨소리만으로 잠든 척할 수 없다)');
                d.breathing = target(d.breathing); return api.log(d.breathing ? '규칙적인 숨소리를 낸다.' : '숨소리를 멈췄다.');
            case 'payNurse':
                if (x.night !== 'spoke') return;
                if (d.money < 1) return fail(s, api, 'NIGHT_NURSE');
                d.money -= 1; x.night = 'done'; return api.log('[10만원권] 한 장을 건넸다. 간호사가 물러난다.');
            // --- visit (비상 상황 B) ------------------------------------------------------------------------------------
            case 'listen':
                if (!vn || vn.stage !== 'seated') return;
                vn.heard = true; return api.log(visitScene(s, api));
            case 'under':
                if (!vn || vn.stage !== 'seated') return;
                vn.under = true; return api.log('[탁자 아래] 녹색의 면회 종료 버튼이 설치되어 있다.');
            case 'endVisit':
                if (!vn || !vn.under) return;
                api.log('[면회 종료] 버튼을 눌러 면회를 마쳤다.'); endVisit(s, api, 'button'); d.loc = 'corridor'; return;
            case 'tell':
                if (!vn || !vn.heard) return;
                d.leak = true; api.log('[면회] 요구받은 정보를 말했다. 반드시 본부에 말씀해 주십시오.'); endVisit(s, api, 'told'); d.loc = 'corridor'; return;
            case 'follow': {
                if (!vn || !vn.heard) return;
                if (vn.kind !== 'real') return fail(s, api, 'FAKE_VISITOR');
                if (d.leak) return api.log('[면회] 말한 정보를 먼저 본부에 보고해야 한다.');
                api.log(data.followLine);
                const blocked = d.surgeryDay === d.day || d.surgeryDay === d.day + 1;
                if (blocked) {
                    x.waitSurgery = true; endVisit(s, api, 'rescued'); d.loc = 'room';
                    return api.log('[보호자] 수술 예정일 당일과 그 전날에는 퇴원할 수 없다. 예정된 수술을 마친 후에야 병원을 나갈 수 있다.');
                }
                endVisit(s, api, 'rescued'); return clearRescue(s, api);
            }
        }
    }

    function snapshot(s) { return { v: 1, ...JSON.parse(JSON.stringify(s.data)) }; }
    function restore(s, snap, api) {
        if (!snap || snap.v !== 1 || !Number.isFinite(snap.day) || snap.day < 1 || snap.day > data.lastDay || !snap.sys) return false;
        const { v, ...rest } = snap;
        s.data = { ...s.data, ...rest, sys: { ...s.data.sys, ...rest.sys } };
        return true;
    }

    function scene(s) { return data.places[s.data.loc].view; }
    const stamp = log => log.tag || '';

    FieldCore.register({ id: data.id, data, init, tick, action, scene, stamp, snapshot, restore,
        manualClock: true, persist: true, startLog: data.startLog, restoredLog: data.restoredLog,
        logTag: tagOf,
        release() { /* toggle-based controls (eyes/breathing) must survive losing focus */ },
        get ui() { return window.FieldEP03UI; }
    });
})();

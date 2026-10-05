// EP02 mission: movement / stopping / hiding / searching on a train. Unlike EP01 it has no shift clock:
// a train schedule (run / stop / void-station segments) decides what the player may do, and the mission
// ends through FieldCore.win()/die(). Story, J record, blue screen and LOOP 02 are never touched here.
(() => {
    const data = FieldEP02Data;
    const T = data.tuning;
    const rnd = () => data.random();
    // Actions that count as "moving" for the dark-car stop rule and the void-station wait.
    const PHYSICAL = new Set(['forward', 'shoes', 'crouch', 'search', 'undress', 'oil', 'push', 'card', 'lookaway', 'stepback', 'point', 'rps']);
    const flashDelay = () => T.flashMin + rnd() * (T.flashMax - T.flashMin);

    function fail(s, api, code) {
        s.data.failCode = code;
        api.die(`${code} — ${data.failures[code]}`, code);
    }

    function init(s, api) {
        s.inventory = {}; s.controls = {};
        s.data = {
            carIndex: data.cars, trainMoving: true,
            shoesOff: false, crouching: false, eyesClosed: false, artificialLight: false,
            drunkAwake: false, drunkTracking: false,
            girlAsked: false, girlCrying: false, parentRisk: 0,
            voidStationActive: false,
            darkCarEntered: false, engineCardFound: false,
            undressed: false, oiled: false,
            engineRoomEntered: false, realityButtonPressed: false,
            currentStation: '', nextStation: '', escaped: false, failCode: '',
            // Implementation state (not canon).
            sys: {
                seg: 0, segAge: 0, drunkGap: 0, chaseAcc: 0, drunkResolved: false,
                girl: 'idle', girlWatch: 0, lookedAway: false, rps: 0,
                flash: false, flashT: flashDelay(), flashLeft: 0,
                cardAt: data.searchTargets[Math.floor(rnd() * data.searchTargets.length) % data.searchTargets.length].id, searched: [],
                pushes: 0, crowdDone: false,
                voidAge: 0, voidHolding: false, holdAge: 0, holdMarks: 0,
                recogLeft: 0, windowReady: false, remaining: null
            }
        };
        enterSegment(s, api, 0);
    }

    function enterSegment(s, api, i) {
        const d = s.data, x = d.sys, seg = data.schedule[i];
        x.seg = i; x.segAge = 0; x.flash = false;
        d.trainMoving = seg.type === 'run';
        d.voidStationActive = seg.type === 'void';
        d.currentStation = seg.type === 'stop' ? seg.at : seg.type === 'void' ? '■■■' : '';
        d.nextStation = seg.type === 'run' ? seg.to : (data.schedule[i + 1]?.to || '');
        if (seg.type === 'run') {
            if (i > 0) api.log(`[주행] 열차가 다시 움직인다. 다음 역은 ${seg.to}입니다.`);
            if (seg.arrival) api.log('[안내방송] 다음 역은 신설동입니다.');
        } else if (seg.type === 'stop') {
            api.log(`[정차] 이번 역은 ${seg.at}입니다. 열차가 멈췄다. 객차 간 문은 열 수 없다.`);
            if (seg.at === '성수') {
                x.remaining = data.remainingAfterSeongsu.slice();
                api.log('[성수 안내] 신설동까지 남은 역은 4개입니다.');
            } else if (x.remaining) x.remaining = x.remaining.filter(name => name !== seg.at);
            if (d.carIndex === 3) api.log('[정차] 구동음이 멎었다. 움직이지 마십시오.');
        } else {
            api.log('[안내방송] 이번 역은 ■■■, ■■■ 역입니다.');
            api.log('[정차] 노선도에 없는 역명이 방송되었다.');
            x.voidAge = 0; x.voidHolding = false; x.holdAge = 0; x.holdMarks = 0;
            api.majorEvent('VOID_STATION');
        }
    }

    function advance(s, api) {
        const x = s.data.sys, seg = data.schedule[x.seg];
        if (seg.arrival) return fail(s, api, 'FINAL_TOO_LATE');
        enterSegment(s, api, x.seg + 1);
    }

    function wake(s, api) {
        const d = s.data, x = d.sys;
        d.drunkAwake = true; d.drunkTracking = true; x.drunkGap = T.chaseStart; x.chaseAcc = 0;
        api.log('[경고] 취객이 눈을 뜬다. 느리지만 꾸준히 따라오기 시작한다.');
        api.majorEvent('A_DRUNK_WAKE');
    }

    function askGirl(s, api) {
        const d = s.data, x = d.sys;
        x.girl = 'asked'; d.girlAsked = true;
        api.log('[여자아이] "어디로 가는 열차예요?" — 아이가 올려다보며 대답을 기다린다.');
        api.majorEvent('B_GIRL_ASKED');
    }

    function enterCar(s, api, n) {
        const d = s.data, x = d.sys;
        d.carIndex = n; api.log(data.carText[n].enter);
        if (d.drunkAwake && d.drunkTracking) x.drunkGap = Math.min(T.chaseMax, x.drunkGap + T.chaseMoveGain);
        if (n === 5) { x.girlWatch = 0; x.lookedAway = false; }
        if (n === 3) {
            d.darkCarEntered = true; x.flashT = flashDelay(); api.majorEvent('C_DARK_CAR');
            if (d.artificialLight) return fail(s, api, 'C_ARTIFICIAL_LIGHT');
        }
        if (n === 1) { x.pushes = 0; x.crowdDone = false; api.majorEvent('D_CROWD'); }
        // "Angry parent" encounter: only more likely after the girl cried (reviewed document).
        if (d.parentRisk > 0 && n < 5 && rnd() < Math.min(T.parentChanceMax, T.parentChancePerRisk * d.parentRisk)) fail(s, api, 'B_PARENT_ENCOUNTER');
    }

    function forward(s, api) {
        const d = s.data, x = d.sys;
        if (d.carIndex === 0) return;
        if (d.eyesClosed) return api.log('[눈을 감고 있다] 눈을 뜨기 전에는 이동할 수 없다.');
        if (!d.trainMoving) {
            if (d.carIndex === 3) return fail(s, api, 'C_MOVE_WHILE_STOPPED');
            return api.log('[정차 중] 연결문 잠금 유지');
        }
        if (d.carIndex === 1) return api.log('[1번 객차] 앞쪽은 승객들로 가로막혀 있다. 밀치고 나아가야 한다.');
        if (d.carIndex === 3 && !d.engineCardFound) return api.log('[3번 객차] 기관실 출입 카드를 찾기 전에는 통과할 수 없다. 수색을 요한다.');
        if (d.carIndex === 5 && x.girl !== 'done') {
            if (x.girl === 'idle' && x.lookedAway) { x.girl = 'done'; api.log('시선을 거둔 채 아이 곁을 지나쳤다.'); }
            else if (x.girl === 'idle') return askGirl(s, api);
            else return api.log('[아이가 올려다보고 있다] 아직 앞칸으로 나아갈 수 없다.');
        }
        if (d.carIndex === 2) {
            if (!d.undressed) return fail(s, api, 'D_NO_UNDRESS');
            if (!d.oiled) return fail(s, api, 'D_NO_OIL');
        }
        if (d.crouching) { d.crouching = false; api.log('일어선다.'); }
        if (d.carIndex === 6 && !x.drunkResolved) {
            x.drunkResolved = true;
            if (!d.shoesOff && rnd() < T.wakeChanceWithShoes) wake(s, api);
            else api.log(d.shoesOff ? '양말 발로 조용히 취객 곁을 지나쳤다.' : '신발을 신은 채 취객 곁을 지나쳤지만 깨어나지 않았다.');
        }
        enterCar(s, api, d.carIndex - 1);
    }

    function search(s, api, id) {
        const d = s.data, x = d.sys;
        const target = data.searchTargets.find(t => t.id === id);
        if (d.carIndex !== 3 || !target) return api.log('(수색할 대상이 없다)');
        if (!x.flash) return fail(s, api, 'C_WRONG_SEARCH');
        if (d.engineCardFound) return api.log('이미 기관실 출입 카드를 확보했다.');
        if (x.searched.includes(id)) return api.log(`${target.label}: 이미 확인했다.`);
        x.searched.push(id);
        if (id === x.cardAt) {
            d.engineCardFound = true; api.log(`[수색] ${target.found}`); api.majorEvent('C_CARD_FOUND');
        } else api.log(`[수색] ${target.label}: 카드는 없다.`);
    }

    function rps(s, api, hand) {
        const d = s.data, x = d.sys;
        if (x.girl !== 'rps' || !data.rps.names[hand]) return;
        const girlHand = data.rps.order[x.rps];
        const names = data.rps.names;
        if (hand === girlHand) {
            x.rps += 1; api.log(`[가위바위보] ${names[hand]} — 비겼다.`);
            if (x.rps >= data.rps.order.length) { x.girl = 'done'; api.log('아이는 만족한 듯 다시 허공을 향해 손을 내민다.'); }
            else api.log(data.rps.hints[x.rps]);
        } else if (data.rps.beats[hand] === girlHand) {
            x.girl = 'done'; d.girlCrying = true; d.parentRisk += 1;
            api.log(`[가위바위보] ${names[hand]} — 이겼다. 아이가 울음을 터뜨린다.`);
            api.log('[경고] 분노한 부모 개체를 마주칠 확률이 높아졌다.');
            api.majorEvent('B_GIRL_CRYING');
        } else fail(s, api, 'B_WRONG_RPS');
    }

    function action(s, name, value, api) {
        const d = s.data, x = d.sys;
        if (s.status !== 'active') return;
        const target = current => value === undefined ? !current : !!value;
        // Void-station rules come first: nothing but crouching + closing eyes is allowed.
        if (d.voidStationActive) {
            if (name === 'eyes' && d.eyesClosed && !target(d.eyesClosed) && x.voidHolding) return fail(s, api, 'VOID_STATION_OPEN_EYES');
            if (name === 'crouch' && !target(d.crouching)) return fail(s, api, 'VOID_STATION_MOVE');
            if (PHYSICAL.has(name) && name !== 'crouch') return fail(s, api, 'VOID_STATION_MOVE');
        } else if (d.carIndex === 3 && !d.trainMoving && PHYSICAL.has(name)) {
            return fail(s, api, 'C_MOVE_WHILE_STOPPED');
        }
        switch (name) {
            case 'forward': return forward(s, api);
            case 'shoes':
                if (d.shoesOff) return api.log('이미 신발을 벗었다.');
                d.shoesOff = true; return api.log('[신발 벗기] 신발을 벗고 양말 차림이 되었다.');
            case 'crouch':
                d.crouching = target(d.crouching);
                return api.log(d.crouching ? '좌석 사이로 들어가 웅크렸다.' : '자리에서 일어섰다.');
            case 'eyes':
                d.eyesClosed = target(d.eyesClosed);
                return api.log(d.eyesClosed ? '눈을 감았다.' : '눈을 떴다.');
            case 'phone': {
                d.artificialLight = target(d.artificialLight);
                api.log(d.artificialLight ? '[휴대폰] 라이트를 켰다.' : '[휴대폰] 라이트를 껐다.');
                if (d.artificialLight && d.carIndex === 3) fail(s, api, 'C_ARTIFICIAL_LIGHT');
                return;
            }
            case 'map': return api.log(`[노선도] ${data.routeMap.split('\n').filter(Boolean)[1]}`);
            case 'lookaway':
                if (d.carIndex === 5 && x.girl === 'idle') { x.lookedAway = true; return api.log('자연스럽게 시선을 거두었다.'); }
                return api.log('(시선을 거둘 대상이 없다)');
            case 'point':
                if (x.girl !== 'asked') return;
                x.girl = 'rps'; x.rps = 0;
                api.log('아무 말 없이 손으로 노선도를 가리켰다.');
                api.log('[여자아이] "가위바위보 해요." — 아이가 손을 내민다.');
                return api.log(data.rps.hints[0]);
            case 'speak':
                if (x.girl === 'asked') return fail(s, api, 'B_DESTINATION_ANSWER');
                return;
            case 'stepback':
                if (x.girl === 'asked') return api.log('뒤로 물러났다. 아이는 여전히 대답을 기다린다.');
                return;
            case 'rps': return rps(s, api, value);
            case 'search': return search(s, api, value);
            case 'undress':
                if (d.undressed) return api.log('이미 탈의했다.');
                d.undressed = true; return api.log('[탈의] 전신을 탈의했다.');
            case 'oil':
                if (d.carIndex !== 2) return api.log('(기름은 1번 객차 진입 통로에 구비되어 있다)');
                if (!d.undressed) return api.log('[기름] 전신을 탈의한 뒤 바르십시오.');
                if (d.oiled) return api.log('이미 기름을 발랐다.');
                d.oiled = true; return api.log('[기름] 진입 통로의 기름을 전신에 꼼꼼히 발랐다.');
            case 'push':
                if (d.carIndex !== 1 || x.crowdDone) return;
                x.pushes += 1; api.log(data.crowdLines[Math.min(x.pushes, data.crowdLines.length) - 1]);
                if (x.pushes >= T.pushCount) x.crowdDone = true;
                return;
            case 'card':
                if (d.carIndex !== 1) return;
                if (!x.crowdDone) return api.log('(승객들에게 가로막혀 문에 닿지 못했다)');
                if (!d.engineCardFound) return api.log('기관실 출입 카드가 없다.');
                d.carIndex = 0; d.engineRoomEntered = true; api.log(data.carText[0].enter); api.majorEvent('ENGINE_ROOM');
                return;
            case 'recognize':
                if (d.carIndex !== 0 || d.realityButtonPressed) return;
                if (d.trainMoving || d.currentStation !== '용두') return fail(s, api, 'FINAL_WRONG_STATION');
                d.realityButtonPressed = true; x.recogLeft = T.recognitionWindow;
                api.log('[현실 재인식] 객차가 평범한 지하철 객실처럼 보인다. 잠시뿐이다.');
                return api.majorEvent('REALITY_BUTTON');
            case 'window':
                if (d.carIndex !== 0) return;
                x.windowReady = true; return api.log('창문 앞으로 다가갔다.');
            case 'jump':
                if (d.carIndex !== 0) return;
                if (!x.windowReady) return api.log('(창문 앞으로 다가가야 한다)');
                if (d.trainMoving || d.currentStation !== '용두') return fail(s, api, 'FINAL_WRONG_STATION');
                if (!d.realityButtonPressed) return fail(s, api, 'FINAL_NO_RECOGNITION');
                if (x.recogLeft <= 0) return fail(s, api, 'FINAL_TOO_LATE');
                d.escaped = true;
                api.log('[백색 섬광] 창문을 향해 몸을 던졌다.');
                api.log('멀어지는 열차 소리. 뒤에서 신설동 안내 방송이 들린다. 열차는 사라졌다.');
                return api.win('탈출 성공 — 용두역 창문 탈출. 생환 기록 전송.', { patrols: {}, elapsed: s.elapsed, injuries: [] });
        }
    }

    function tick(s, dt, api) {
        const d = s.data, x = d.sys;
        if (s.status !== 'active') return;
        x.segAge += dt;
        if (d.carIndex === 3 && d.artificialLight) return fail(s, api, 'C_ARTIFICIAL_LIGHT');

        // Tunnel lights only reach the dark car while the train is running between stations.
        if (d.carIndex === 3 && d.trainMoving && !d.voidStationActive) {
            if (x.flash) {
                x.flashLeft -= dt;
                if (x.flashLeft <= 0) { x.flash = false; x.flashT = flashDelay(); }
            } else {
                x.flashT -= dt;
                if (x.flashT <= 0) {
                    x.flash = true; x.flashLeft = T.flashVisible;
                    if (rnd() < T.thinChance) api.log(data.thinLines[Math.floor(rnd() * data.thinLines.length) % data.thinLines.length]);
                }
            }
        } else x.flash = false;

        // The drunk is slow but never stops; frozen in the engine room and during the void-station wait.
        if (d.drunkAwake && d.drunkTracking && d.carIndex !== 0 && !d.voidStationActive) {
            x.chaseAcc += dt;
            while (x.chaseAcc >= T.chaseSeconds) {
                x.chaseAcc -= T.chaseSeconds; x.drunkGap -= 1;
                if (x.drunkGap <= 0) return fail(s, api, 'A_DRUNK_CAUGHT');
                if (x.drunkGap <= 2) api.log('[경고] 취객이 바로 뒤까지 따라붙었다.');
            }
        }

        if (d.carIndex === 5 && x.girl === 'idle' && !x.lookedAway) {
            x.girlWatch += dt;
            if (x.girlWatch >= T.girlNotice) askGirl(s, api);
        }

        if (d.voidStationActive) {
            x.voidAge += dt;
            if (!x.voidHolding) {
                if (d.crouching && d.eyesClosed) { x.voidHolding = true; x.holdAge = 0; api.log('[대기] 움직이지 않고 3분간 버틴다.'); }
                else if (x.voidAge > T.voidGrace) return fail(s, api, 'VOID_STATION_NO_RESPONSE');
            } else {
                x.holdAge += dt;
                const marks = Math.min(2, Math.floor(x.holdAge / (T.voidHold / 3)));
                while (x.holdMarks < marks) { x.holdMarks += 1; api.log(`[대기] ${x.holdMarks}분 경과.`); }
                if (x.holdAge >= T.voidHold) {
                    api.log('[대기] 3분 경과. 안내방송이 끊기고 열차가 다시 움직이기 시작한다.');
                    return advance(s, api);
                }
            }
        }

        if (d.realityButtonPressed && x.recogLeft > 0) {
            x.recogLeft -= dt;
            if (x.recogLeft <= 0) { api.log('[재인식 종료] 객차가 다시 일그러지기 시작한다.'); return fail(s, api, 'FINAL_TOO_LATE'); }
        }

        if (x.segAge >= data.schedule[x.seg].dur && s.status === 'active') advance(s, api);
    }

    function scene(s) { return data.carText[s.data.carIndex].scene; }
    const stamp = log => `${String(Math.floor(log.t / 60)).padStart(2, '0')}:${String(Math.floor(log.t % 60)).padStart(2, '0')}`;

    FieldCore.register({ id: data.id, data, init, tick, action, scene, stamp,
        manualClock: true, startLog: data.startLog,
        release() { /* toggle-based controls: losing focus must not open eyes or stand up */ },
        get ui() { return window.FieldEP02UI; }
    });
})();

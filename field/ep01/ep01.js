(() => {
    const data = FieldEP01Data;
    const resolve = (s, api, text) => {
        api.log(text); s.data.event = null; s.controls.back = false;
        s.controls.eyes = false; s.controls.crouch = false; s.data.video = 'idle_sea.mp4';
    };
    function init(s) {
        s.inventory = { wallet: 1, money: 3 };
        s.controls = { light: true, eyes: false, back: false, gaze: true, crouch: false };
        s.data = { location: 'shelter', event: null, fired: [], video: 'idle_sea.mp4',
            wave: 0.7, weatherChecked: false, equipmentChecked: false, nextHour: 0,
            injuries: [], phone: null, phoneRetryAt: 0, extensionOneUnavailable: false };
    }
    function begin(s, definition, api) {
        const e = s.data.event = { type: definition.type, age: 0, stage: 'approach' };
        s.data.location = definition.location; s.data.video = definition.video;
        s.controls.back = false;
        if (e.type === 'A') {
            e.protected = 0;
            api.log('해안선: 베이지색 바바리코트, 장발의 중년 남성. 썩은 어패류와 암모니아 악취.');
        } else if (e.type === 'B') {
            e.bag = { ...data.bags[Math.floor(Math.random() * data.bags.length)] };
            api.log('해녀 차림의 노파가 다가와 인사합니다.');
        } else if (e.type === 'D') {
            e.demand = data.demands[Math.floor(Math.random() * data.demands.length)];
            api.log(`낚시꾼: ${e.demand[0]} 미끼로 ${e.demand[1]} 요구. 뒤돌아서지 마십시오.`);
        } else {
            e.steps = 0; e.lastBlink = s.elapsed; e.lastEye = ''; e.strikes = 0;
            api.log('경로 C: 지저분한 긴 머리의 여성이 흐느끼고 있습니다. 바라보는 동안 움직이지 않습니다.');
        }
    }
    function tick(s, dt, api) {
        const d = s.data;
        while (d.nextHour <= s.minute && d.nextHour < 480) {
            const hour = FieldCore.time(d.nextHour);
            api.log(`${hour} 정각 순찰 — 항구/해안선 관측 후 내선 1번으로 선박 출현 여부 보고.`);
            d.nextHour += 60;
        }
        // Environmental windows are runtime tuning, not canonical additions.
        d.wave = s.minute >= 60 && s.minute < 85 || s.minute >= 265 && s.minute < 285 ? 1.7 : 0.7;
        d.extensionOneUnavailable = d.wave >= 1.5;
        if (!d.event) {
            const definition = data.events.find(e => s.minute >= e.minute && !d.fired.includes(e.type));
            if (definition) { d.fired.push(definition.type); begin(s, definition, api); }
        }
        const e = d.event;
        if (!e) return;
        e.age += dt;
        if (e.type === 'A') {
            if (!s.controls.light && s.controls.eyes && !s.controls.back) e.protected += dt;
            else if (e.protected > 0 || e.age > 8) return api.die('A — 소등·행동 중지·눈 감기 유지 실패.');
            if (e.protected >= data.aProtectionSeconds) resolve(s, api, '썩은 어패류와 암모니아 악취가 확실히 사라졌습니다. 눈을 떠도 됩니다.');
        } else if (e.type === 'F') {
            if (['approach', 'tv'].includes(e.stage)) {
                if (!s.controls.gaze || s.controls.eyes) return api.die('F — 여성에게서 시선이 끊겼습니다.');
                if (s.elapsed - e.lastBlink > 25) return api.die('F — 양쪽 눈을 동시에 깜빡였습니다.');
                if (s.controls.back && e.stage === 'approach') e.steps += dt * 2;
                if (e.steps >= 12 && e.stage === 'approach') {
                    e.stage = 'tv'; s.controls.back = false; api.log('시야에 아날로그 TV가 들어왔습니다.');
                }
            }
            if (e.stage === 'hidden' && e.age - e.hiddenAt >= 4) {
                e.stage = 'sound'; e.soundAt = e.age;
                api.log('▥ TV 앞쪽에서 무언가 부서지는 소리.');
            }
            if (e.stage === 'sound' && e.age - e.soundAt > 12 || e.stage === 'front' && e.age - e.soundAt > 18) {
                return api.die('F — 화면 파괴 실패. 해변 TV 속에서 토막난 채로 흐느끼는 모습으로 발견.');
            }
        }
        if (e.age > (e.type === 'B' ? 120 : 90)) api.die(`${e.type} — 현장 대응 지연. 연결 소실.`);
    }
    function action(s, name, value, api) {
        const d = s.data; const c = s.controls; const e = d.event;
        if (name === 'select') { if (value === '' || s.inventory[value]) s.selected = value; return; }
        if (name === 'eyes') {
            c.eyes = value;
            if (e && e.type === 'A' && !value && e.protected > 0) api.die('A — 악취가 사라지기 전에 눈을 떴습니다.');
            if (e && e.type === 'F' && value && ['approach', 'tv'].includes(e.stage)) api.die('F — 두 눈을 동시에 감았습니다.');
            return;
        }
        if (name === 'light') {
            c.light = !c.light;
            if (e && e.type === 'A' && c.light && e.protected > 0) api.die('A — 조명을 다시 켰습니다.');
            return;
        }
        if (name === 'back') { c.back = value; return; }
        if (name === 'look') {
            c.gaze = !c.gaze;
            if (e && e.type === 'D' && !c.gaze) api.die('D — 낚시꾼을 두고 뒤돌아섰습니다.');
            if (e && e.type === 'F' && ['approach', 'tv'].includes(e.stage)) api.die('F — 시선 이탈.');
            return;
        }
        if (name === 'blink' && e && e.type === 'F' && ['approach', 'tv'].includes(e.stage)) {
            if (e.lastEye === value) { api.log('같은 눈입니다. 반대쪽 눈을 번갈아 감으십시오.'); return; }
            e.lastEye = value; e.lastBlink = s.elapsed; return;
        }
        if (e && e.type === 'A' && ['move', 'inspect', 'phone', 'take', 'patrol'].includes(name)) return api.die('A — 행동을 멈추지 않았습니다.');
        if (name === 'move') {
            if (e && e.type === 'D') return api.die('D — 뒤돌아 도주. 낚시꾼의 어망에서 목 위로만 발견.');
            if (e && e.type === 'F') return api.die('F — 시야를 유지하지 않고 이동했습니다.');
            if (e) { api.log('현장 접촉 중입니다.'); return; }
            if (!data.locations[value]) return;
            if (d.wave >= 1.5 && ['coast', 'rocks', 'sand'].includes(value)) { api.log('파고 1.5m 이상. 해안선 20m 이내 접근 금지. 대기소로 복귀하십시오.'); return; }
            d.location = value; api.log(`${data.locations[value]} 이동.`); return;
        }
        if (name === 'weather') { d.weatherChecked = true; api.log(`파고 ${d.wave}m / ${d.wave >= 1.5 ? '접근 제한, 대기소 대기' : '약풍 / 해안 관측 가능'}`); return; }
        if (name === 'equipment') { d.equipmentChecked = true; api.log('안전 장비 및 조명 시설 점검. 정상 작동 확인.'); return; }
        if (name === 'take') {
            if (d.location !== 'shelter' || !['baton', 'radio'].includes(value)) return;
            s.inventory[value] = 1; api.log(`${data.items[value]} 수령.`); return;
        }
        if (name === 'patrol') {
            if (!['harbor', 'coast'].includes(d.location) || e) { api.log('항구 또는 해안선에서 선박을 관측하십시오.'); return; }
            d.observation = { hour: Math.floor(s.minute / 60), location: d.location };
            api.log('선박 출현 여부 관측: 미확인 선박 없음. 관리소 보고 대기.'); return;
        }
        if (name === 'phone') {
            if (d.phone) { api.log('현재 통화를 먼저 종료하십시오.'); return; }
            if (value === '1' && d.extensionOneUnavailable) { api.log('내선 1번 연결되지 않음.'); return; }
            if (value === '0' && s.elapsed < d.phoneRetryAt) { api.log('내선 0번 재연결 전 1분 이상 대기하십시오.'); return; }
            d.phone = value;
            if (value === '0' && !d.zeroTried) { d.zeroTried = true; d.phoneNamesYou = true; api.log('내선 0번: 상대방이 곧장 귀하의 성명을 말합니다.'); }
            else { d.phoneNamesYou = false; api.log(`내선 ${value}: ${value === '0' ? '비상 대응 팀' : '관리소'} 연결.`); }
            return;
        }
        if (name === 'hangup') {
            if (d.phoneNamesYou) d.phoneRetryAt = s.elapsed + s.duration / 480;
            d.phone = null; d.phoneNamesYou = false; api.log('통화 종료.'); return;
        }
        if (name === 'report') {
            if (d.phoneNamesYou) { api.log('성명을 말한 상대입니다. 통화를 끊으십시오.'); return; }
            if (d.phone !== '1' || !d.observation) { api.log('관측 후 관리소 내선 1번에 연결하십시오.'); return; }
            if (d.observation.hour !== Math.floor(s.minute / 60)) { api.log('이전 시간 관측입니다. 현재 선박 출현 여부를 다시 확인하십시오.'); return; }
            s.patrols[d.observation.hour] = true; api.log('관리소: 이번 시간 선박 출현 여부 보고 접수.'); return;
        }
        if (!e) return;
        if (e.type === 'B') {
            if (name === 'greet' && e.stage === 'approach') { e.stage = 'bag'; api.log('정중한 인사. 노파가 망사리를 열었습니다.'); }
            if (name === 'inspect' && e.stage === 'bag') { e.stage = 'seen'; api.log(`망사리 안: ${e.bag.observation}.`); }
            if (name === 'compliment' && e.stage === 'seen') { e.stage = e.bag.notify ? 'notify' : 'offer'; api.log('내용물을 성심성의껏 칭찬했습니다.'); }
            if (name === 'notify' && e.stage === 'notify') { e.stage = 'offer'; api.log('노파에게 “오귀발이 들어 있다”고 알려 주었습니다.'); }
            if (name === 'buy' && e.stage === 'offer' && !e.bag.actualOgwibal) { e.stage = 'payment'; api.log('구매 제안. 노파가 손을 내밉니다.'); }
            if (name === 'leave' && e.stage === 'offer' && e.bag.actualOgwibal) resolve(s, api, '“다음에 다시 오겠습니다.” 공손히 인사하고 떠났습니다.');
            if (name === 'use' && e.stage === 'payment') {
                if (s.selected === 'wallet') return api.die('B — 개인 지갑의 위조지폐. 격분한 노파가 머리를 뜯었습니다.');
                if (s.selected !== 'money' || s.inventory.money !== 3) { api.log('근무복 주머니의 준비된 지폐가 필요합니다.'); return; }
                delete s.inventory.money; s.inventory.bait = 1; s.selected = 'bait';
                resolve(s, api, '10,000원권 세 장 지급. 내용물이 약 1m 길이의 얇고 긴 갯지렁이 “훌륭한 미끼”로 변했습니다.');
            }
        } else if (e.type === 'D') {
            if (name === 'use' && s.selected === 'bait' && s.inventory.bait) {
                delete s.inventory.bait; s.inventory.catch = 1; s.selected = 'catch';
                resolve(s, api, '훌륭한 미끼를 건네자 낚시꾼이 기뻐하며 자신의 조과 중 하나를 줍니다.');
            }
            if (name === 'body') {
                d.injuries.push(e.demand[1]);
                resolve(s, api, `${e.demand[0]} 미끼: ${e.demand[1]} 제공. 제공할 수 없는 상태라면 낚시꾼이 직접 채취합니다.`);
            }
        } else if (e.type === 'F') {
            if (name === 'behind' && e.stage === 'tv') { e.stage = 'behind'; c.back = false; api.log('TV 뒤로 이동.'); }
            if (name === 'crouch' && e.stage === 'behind') { c.crouch = true; e.stage = 'hidden'; e.hiddenAt = e.age; api.log('TV 뒤에 웅크려 숨었습니다.'); }
            if (name === 'front' && e.stage === 'sound') { c.crouch = false; e.stage = 'front'; api.log('파손음을 듣고 즉시 TV 앞으로 이동.'); }
            if (name === 'use' && e.stage === 'front') {
                if (s.selected !== 'baton' || !s.inventory.baton) { api.log('순찰봉을 손에 들어야 합니다.'); return; }
                e.strikes++; api.log(`순찰봉 타격 ${e.strikes}/3 — 유리 균열.`);
                if (e.strikes >= 3) resolve(s, api, 'TV 화면 완전 파괴. 해안선이 다시 이어집니다.');
            }
        }
    }
    function contacts(s) {
        const e = s.data.event;
        if (!e) return [];
        if (e.type === 'B') {
            const actions = { approach: ['정중히 인사', 'greet'], bag: ['망사리 안을 들여다보기', 'inspect'], seen: ['내용물 칭찬', 'compliment'], notify: ['“오귀발이 들어 있다”고 알림', 'notify'],
                offer: e.bag.actualOgwibal ? ['“다음에 다시 오겠습니다” · 인사 후 떠나기', 'leave'] : ['망사리 내용물 구매 제안', 'buy'] };
            return actions[e.stage] ? [actions[e.stage]] : [];
        }
        if (e.type === 'D') return [[`신체 제공: ${e.demand[1]}`, 'body']];
        if (e.type === 'F') {
            const actions = { tv: ['TV 뒤로 이동', 'behind'], behind: ['웅크려 숨기', 'crouch'], sound: ['TV 앞으로 이동', 'front'] };
            return actions[e.stage] ? [actions[e.stage]] : [];
        }
        return [];
    }
    function scene(s) {
        const e = s.data.event;
        if (!e) return s.controls.light ? '해안 관측 / 미확인 선박 없음' : '해안 관측 / 조명 소등';
        if (e.type === 'A') return '베이지색 코트의 남성 / 악취 감지';
        if (e.type === 'B') return e.stage === 'approach' ? '해녀 차림의 노파' : `망사리 / ${e.stage === 'bag' ? '관측 대기' : e.bag.observation}`;
        if (e.type === 'D') return `갯바위 낚시꾼 / ${e.demand[0]} → ${e.demand[1]}`;
        return `태양 모래사장 / ${['approach', 'tv'].includes(e.stage) ? `여성 응시 · ${Math.floor(e.steps)}보 · 눈 피로 ${Math.floor(s.elapsed - e.lastBlink)}/25` : e.stage === 'hidden' ? 'TV 뒤 / 웅크림' : e.stage === 'sound' ? 'TV 앞쪽 파손음' : e.stage === 'front' ? `TV 앞 / 화면 균열 ${e.strikes}/3` : 'TV 뒤'}`;
    }
    FieldCore.register({ id: data.id, data, init, tick, action, contacts, scene,
        breaksGaze(s) { return s.status === 'active' && s.data.event?.type === 'F' && ['approach', 'tv'].includes(s.data.event.stage); }
    });
})();

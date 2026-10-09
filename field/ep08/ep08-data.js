// EP08 Field data. Canon order: reviewed transcript (docs/transcripts/reviewed/EP08_유성_워터파크.txt; the source states
// no document number) -> 8화.txt (rule document, shown in the Story window) -> this data. The rule document is NOT
// duplicated here: the Field reads the same text from #darkwebReportWindowEP8 (reportSelector).
// Canon facts used as rules: wave every hour on the hour and at :30 lasting 15 minutes, spa bath 15 minutes, three
// slide curves, closing broadcast at 18:00, lifeguards in red with the only whistles, HQ 0050-0200.
// NOT canon (tuning/presentation): the run's start time (17:02), the compressed clock, the map layout/adjacency,
// lockers/sunbeds/menu/prices/statement lines, every `tuning` value, the event deck and its schedule, the late-day
// ambience lines and every failure text outside `canonFailures` (those get a minimal "기록 중단" result).
// Nothing here explains what the park, 'they' or the 'surgery' are.
window.FieldEP08Data = {
    id: 'EP08', title: '유성 워터파크',
    reportSelector: '#darkwebReportWindowEP8 textarea',
    // Named rolls so tests can force branches. Return an index (integer) or a fraction in [0, 1). Default Math.random().
    // locker, sunbed, dry (crowd slot), waveOverlay, portable, lure, phantom, tower (late whistle manned/empty).
    random: name => Math.random(),
    startLog: '17:02 — 유성 워터파크 입장. 입장 게이트에서 전자 손목 밴드를 받았다. 안내문을 끝까지 확인하십시오.',
    clearText: '[FIELD OBSERVATION COMPLETE] EP08 유성 워터파크 — 퇴장 기록 확인. EP.09 연결 권한 갱신.',

    // Map: one connected park. The wave pool is the hub; the desk sits between the changing room, the pool and the exit.
    zones: {
        locker: '탈의실', desk: '안내 데스크', exit: '출구', wave: '파도풀', kids: '키즈존', photo: '캐릭터 포토존',
        tower: '안전요원대', slide: '메가 슬라이드존', food: '푸드코트', sunbed: '선베드', spa: '힐링존 / 온천 스파'
    },
    // grid [row, col] for the map view (presentation only)
    layout: {
        spa: [1, 1], sunbed: [1, 2], food: [1, 3], slide: [1, 4],
        wave: [2, 2], tower: [2, 3], photo: [2, 4],
        locker: [3, 1], desk: [3, 2], kids: [3, 3],
        exit: [4, 2]
    },
    adjacent: {
        locker: ['desk'], desk: ['locker', 'wave', 'exit'], exit: ['desk'],
        wave: ['desk', 'kids', 'tower', 'sunbed', 'spa', 'food'], kids: ['wave', 'photo'], photo: ['kids', 'slide'],
        tower: ['wave', 'slide'], slide: ['tower', 'photo', 'food'], food: ['wave', 'slide', 'sunbed'],
        sunbed: ['wave', 'food', 'spa'], spa: ['wave', 'sunbed']
    },
    water: ['wave', 'kids'],   // lifeguard-tower pools: the only places a whistle or a floating band can happen

    // Clock = minutes after midnight. Canon anchors: waves at :00/:30 for 15 minutes, closing broadcast 18:00.
    clock: {
        start: 17 * 60 + 2, waveRecede: 17 * 60 + 15, nextWave: 17 * 60 + 30, closing: 18 * 60,
        waveCap: 17 * 60 + 14,      // the clock waits for the first wave pool visit (core)
        slideCap: 17 * 60 + 56,     // ... and for the slide (core)
        spaLast: 17 * 60 + 44, foodLast: 17 * 60 + 54, lastFree: 17 * 60 + 55, late: 17 * 60 + 50
    },
    TIME_PHASES: [
        { id: 'open', from: 17 * 60, drift: 0 },              // tutorial: the clock moves only with actions
        { id: 'day', from: 17 * 60 + 30, drift: 20 },          // real seconds per game minute while roaming
        { id: 'late', from: 17 * 60 + 45, drift: 15 },
        { id: 'last', from: 17 * 60 + 55, drift: 12 },
        { id: 'closing', from: 18 * 60, drift: 0 }
    ],
    // Minutes each thing costs on the clock.
    cost: { move: 2, report: 2, lockerStore: 1, band: 3, child: 1, character: 2, slide: 8, food: 6, sunbed: 5, whistle: 1 },
    tuning: {
        lockerOpenDelay: 2.5, breathDeadline: 3, breathMax: 9,
        waveRide: 5, unwetNotice: 7, unwetWait: 14, overlayDelay: 3,
        broadcastLength: 8, whistleFreeze: 3, whistleCheck: 5, leaveWater: 4,
        bandCall: 5, childWait: 8, characterWait: 8,
        bathLength: 14, thirstAt: 5, bellExit: 3,
        curveGap: 2.2, blackout: 1.2, slideStop: 6,
        stayWait: 8, blockWait: 8, pathOpen: 10, bandFloatDelay: 2
    },

    // Event deck. CORE always happens; a run draws the rest so every run has the same shape:
    // 1 overlay inside the wave-pool core + 2 portable events + 1 late overlap pair (+ up to 2 abnormal facility lures).
    CORE_EVENTS: ['locker', 'wave', 'slide', 'closing'],
    OPTIONAL_EVENTS: {
        bandFloat: { portable: true, needsWater: true },     // A: loose -> floats in the water
        aloneChild: { portable: true },                      // C (doc): child alone asks for a hand
        whistleEmpty: { portable: true, needsWater: true },  // K: whistle with the nearest tower empty
        nameBroadcast: { overlay: true },                    // E: own name in the announcement
        whistleManned: { overlay: true },                    // K: whistle, tower manned (stop + check)
        spaThirst: { zone: 'spa' },                          // F
        foodUnordered: { zone: 'food' },                     // H (unordered dish + surgery question)
        sunbedLure: { zone: 'sunbed' },                      // I
        character: { late: true }                           // J (+ K or E overlay)
    },
    WAVE_OVERLAYS: ['nameBroadcast', 'whistleManned'],
    PORTABLE_PAIRS: [['bandFloat', 'aloneChild'], ['aloneChild', 'whistleEmpty'], ['whistleEmpty', 'bandFloat']],
    LURE_PAIRS: [['spaThirst', 'foodUnordered'], ['foodUnordered', 'sunbedLure'], ['sunbedLure', 'spaThirst']],
    portableSlots: [17 * 60 + 35, 17 * 60 + 43],
    lateSlot: 17 * 60 + 49,
    // Which secondary hazard may run on top of which scene. Every pair listed has an action that satisfies both rules;
    // anything not listed never overlaps (no QTE on a QTE, no opposite demands, one overlay at a time).
    OVERLAP_RULES: {
        wave: ['nameBroadcast', 'whistleManned'],   // stay still + eyes down; ignore the name / look at the tower
        character: ['whistleEmpty', 'whistleManned', 'nameBroadcast'],   // face it while stopping / backing out of the water
        bath: ['nameBroadcast'], food: ['nameBroadcast'], sunbed: ['nameBroadcast']
    },

    lockers: [214, 327, 108, 451],
    sunbeds: ['C-07', 'B-12', 'D-03'],
    menu: [{ name: '우동', price: 8000 }, { name: '핫도그', price: 5500 }],
    unordered: '주문하지 않은 맑은 국 한 그릇',
    prices: { slide: 8000, spa: 11000 },
    // Statement lines for facilities never used + one unreadable line. Presentation only; no amount is lore.
    phantom: { spa: '힐링존 이용', food: '푸드코트', unknown: ['[알 수 없는 이용]', '[내역 확인 불가]', '부대시설 이용'], unknownPrice: [48000, 23500, 31000] },
    crowdWet: ['머리에서 물이 뚝뚝 떨어지는 남자', '젖은 래시가드를 쥐어짜는 여자', '물안경을 이마에 올린 아이', '튜브를 끌어안은 커플', '젖은 수영모를 벗는 노인'],
    crowdDry: '머리카락 한 올 젖지 않은 채 서 있는 남자',
    video: {
        idle: 'movies/ep8_idle.mp4', slide: 'movies/ep8_event_slide.mp4', food: 'movies/ep8_event_food.mp4',
        mascot: 'movies/ep8_event_mascot.mp4', exit: 'movies/ep8_event_exit.mp4'
    },
    // Presentation only: the park's wording drifts from leisure to the care vocabulary the source itself uses.
    address: clock => clock < 17 * 60 + 50 ? '고객 여러분' : '환자 여러분',
    ambient: [
        { at: 17 * 60 + 20, text: '[안내 방송] 여름엔 유성! 웨이브존 파도는 매시 정각과 30분에 찾아옵니다.' },
        { at: 17 * 60 + 36, text: '[안내 방송] 유성 워터 페스티벌, 캐릭터 특별 퍼레이드가 곧 시작됩니다.' },
        { at: 17 * 60 + 45, text: '[안내 방송] 메가 슬라이드존, 오늘 마지막 탑승을 받습니다.' },
        { at: 17 * 60 + 50, text: '[주변] 광고 음악이 늘어진다. 같은 소절이 조금씩 느려진다.' },
        { at: 17 * 60 + 52, text: '[주변] 안내판의 "고객 쉼터"가 잠깐 "환자 쉼터"처럼 보였다.' },
        { at: 17 * 60 + 54, text: '[주변] 사람들이 출구가 아니라 물 쪽으로 걸어간다.' },
        { at: 17 * 60 + 56, text: '[주변] 멀리서 안내종이 한 번, 또 한 번 울린다.' }
    ],

    text: {
        bandOn: n => `[손목 밴드] 전자 손목 밴드를 찼다. 손목을 몸쪽으로 붙인다. 밴드 화면: 사물함 ${n}번.`,
        lockerZone: '탈의실. 손목 밴드를 사물함 패널에 대면 배정된 칸만 열린다.',
        wrongLocker: n => `[사물함] ${n}번 사물함은 반응하지 않는다.`,
        ownLocker: n => `[사물함] ${n}번 사물함에 소지품을 넣고 잠갔다.`,
        lockerOpens: n => `[탈의실] 덜컥. 아무도 없는 ${n}번 사물함 문이 스스로 열린다.`,
        holdBreath: '[탈의실] 숨을 멈췄다.',
        breathOut: '[탈의실] 참던 숨을 내쉬었다.',
        leftLocker: '[탈의실] 숨을 참은 채 탈의실 밖으로 나왔다. 숨을 쉬었다.',
        deskReport: '[안내 데스크] 직원이 고개를 든다. "무슨 일이십니까?"',
        reported: '[안내 데스크] 탈의실 사물함 일을 신고했다. 직원이 탈의실 쪽으로 향한다.',
        waveRide: '[파도풀] 파도가 몰아친다. 사람들이 비명 섞인 웃음을 터뜨린다.',
        waveRecede: '[파도풀] 17:15. 파도가 물러갔다. 모두 물에서 일어선다.',
        avert: '[파도풀] 시선을 떨구고 그 자리에 가만히 섰다.',
        dryTurn: '[파도풀] 시야 끝에서, 그 사람의 얼굴만 천천히 이쪽으로 돌아온다.',
        nextWave: '[파도풀] 17:30. 다음 파도가 밀려왔다. 물이 걷히고 나니 젖지 않은 사람은 보이지 않는다.',
        nameBroadcast: '[안내 방송] "……고객님, 안내 데스크로 와 주시기 바랍니다." 방송이 부른 이름은 분명히 내 이름이다.',
        broadcastOver: '[안내 방송] 방송이 끝났다. 아무도 다시 부르지 않는다.',
        whistle: '[주변] 삐익—! 후루라기 소리가 울린다.',
        alreadyStill: '[주변] 이미 움직이지 않고 있다.',
        freeze: '[주변] 즉시 동작을 멈췄다.',
        towerManned: '[안전요원대] 가장 가까운 안전 요원대에 붉은색 수영복의 안전 요원이 앉아 있다.',
        towerEmpty: '[안전요원대] 가장 가까운 안전 요원대가 비어 있다. 물가에 검은색 수영복 반바지 차림의 사람이 서 있다.',
        outOfWater: '[주변] 즉시 물 밖으로 나왔다.',
        loose: '[손목 밴드] 밴드가 헐거워진 느낌이 든다.',
        wristIn: '[손목 밴드] 조이지 않고 손목을 몸쪽으로 붙였다.',
        bandFloats: '[손목 밴드] 손목이 가볍다. 밴드가 저절로 풀려 물 위에 떠올랐다.',
        callLifeguard: '[주변] 힘껏 안전 요원을 불렀다. 붉은 수영복의 안전 요원이 달려온다.',
        newBand: '[손목 밴드] 손목 밴드를 재지급 받았다. 배정 번호는 그대로다.',
        aloneChild: '[주변] 보호자 없이 혼자 있는 아이가 다가와 손을 내민다. "손 잡아 주세요."',
        childRuns: '[주변] "오늘 수술받는 날이 아니었니?" 아이가 금방 도망쳤다. 사람들 사이로 보이지 않는다.',
        character: '[주변] 캐릭터 하나가 서 있다. 주변에 인솔 직원이 없다. 혼자다.',
        backAway: '[주변] 등을 보이지 않은 채 인파가 많은 쪽으로 천천히 물러났다. 캐릭터가 멀어진다.',
        backAwayWater: '[주변] 캐릭터를 마주 본 채 물가의 인파 쪽으로 뒷걸음질 쳐 물 밖으로 나왔다.',
        spaZone: '힐링존. 유성 온천수 스파. 김이 오른다.',
        spaIn: '[온천 스파] 온천수에 몸을 담갔다. 1회 입욕 15분.',
        spaClosed: '[온천 스파] 오늘 입욕 접수는 마감되었다.',
        thirst: '[온천 스파] 목이 타들어 간다. 탕 가장자리에 생수병이 놓여 있다.',
        bell: '[온천 스파] 딸랑— 안내종이 울린다.',
        spaOut: '[온천 스파] 탕에서 나왔다.',
        slideQueue: '메가 슬라이드존. 세 번의 곡선을 단숨에 쏟아져 내려오는 국내 최고 각도의 슬라이드.',
        slideDone: '[슬라이드] 다시 탈 생각은 들지 않는다.',
        rideStart: '[슬라이드] 출발. 물살에 몸이 쏠린다.',
        curve: ['[슬라이드] 몸이 왼쪽으로 크게 꺾인다.', '[슬라이드] 오른쪽으로 휘어진다. 물이 얼굴을 덮는다.', '[슬라이드] 다시 크게 꺾인다. 저 아래 빛이 보인다.', '[슬라이드] 몸이 또 꺾인다.'],
        blackout: '[슬라이드] 빛이 꺼진다. 물소리만 남는다.',
        counted: n => `[슬라이드] (${n})`,
        notYet: '[슬라이드] 물살이 너무 세다. 아직 버틸 수가 없다.',
        qte: { arms: '[슬라이드] 양팔을 벌렸다.', wall: '[슬라이드] 벽면에 팔을 밀착시켰다.', slow: '[슬라이드] 속도가 줄어든다.', stop: '[슬라이드] 그 자리에 멈췄다.' },
        qteOrder: '[슬라이드] 몸이 계속 미끄러진다.',
        tuck: '[슬라이드] 몸을 웅크리자 속도가 붙는다.',
        eyesShut: '[슬라이드] 눈을 감았다. 물소리가 더 크게 들린다.',
        rescued: '[손목 밴드] 긴급 전화 버튼을 눌렀다. 구조 요청이 접수되었다. 붉은 수영복의 안전 요원이 위에서 내려와 슬라이드 밖으로 끌어냈다.',
        emergencyIdle: '[손목 밴드] 긴급 전화가 연결되었다. 이상 없음을 알리고 종료했다.',
        foodZone: '푸드코트. 튀김 냄새와 음악.',
        foodClosed: '[푸드코트] 주문이 마감되었다.',
        ordered: (name, price) => `[푸드코트] ${name}을 주문했다. (${price.toLocaleString()}원 결제)`,
        served: '[푸드코트] 음식이 나왔다.',
        servedExtra: item => `[푸드코트] 음식이 나왔다. ${item}도 함께 나왔다.`,
        ate: '[푸드코트] 다 먹었다.',
        ateAll: '[푸드코트] 남기지 않고 전부 먹었다.',
        staffAsk: '[푸드코트] 직원이 다가와 묻는다. "언제 수술이십니까?"',
        notToday: '[푸드코트] "오늘은 아닙니다." 직원이 고개를 끄덕이고 돌아간다.',
        sunbedZone: bed => `선베드. 줄지어 선 파라솔. 밴드 표기 선베드 ${bed}은 저쪽 끝이다.`,
        sunbedLure: '[선베드] 바로 앞 선베드 두 개가 비어 있다. 하나엔 수건만 놓여 있다. 다리가 무겁다.',
        sunbedOwn: bed => `[선베드] 밴드에 표기된 ${bed} 선베드까지 걸어가 누웠다. 잠시 쉬었다.`,
        closing: who => `[안내 방송] 18:00. 오늘의 영업을 마칩니다. ${who}께서는 소지품을 챙겨 퇴장해 주시기 바랍니다.`,
        musicStop: '[주변] 음악이 멈췄다. 잠시 아무 소리도 나지 않는다.',
        stayAsk: '[주변] 풀 안에 남은 사람들이 웃으며 손짓한다. "조금 더 놀고 가자."',
        refused: '[주변] "아니요, 괜찮습니다. 먼저 가 보겠습니다." 정중하게 거절했다.',
        blocked: '[주변] 그들이 물에서 걸어 나와 팔을 붙잡고 앞을 막아선다.',
        pathOpen: '[손목 밴드] 긴급 전화 버튼을 눌렀다. 붉은 수영복의 안전 요원이 다가오자 사람들이 손을 놓았다. 길이 잠깐 열렸다.',
        reblocked: '[주변] 머뭇거리는 사이 다시 사람들이 앞을 막아선다.',
        notClosed: '[출구] 정산기 화면: "퇴장 정산은 폐장 후에 진행됩니다."',
        exitBack: '[출구] 등 뒤에서 아직 물놀이 소리가 들린다.',
        statement: '[출구] 정산기에 손목 밴드를 올렸다. 사용 내역이 출력된다.',
        staff: '[출구] 직원이 다가온다. "어느 내역이 문제이십니까?"',
        staffBack: '[출구] "아닙니다. 그대로 결제하겠습니다." 직원이 물러난다.',
        paid: total => `[출구] 표시된 금액 ${total.toLocaleString()}원을 그대로 결제했다. 결제 승인.`,
        returned: '[출구] 손목 밴드를 반납했다. 자동문이 열린다.',
        leave: '[출구] 뒤에서 누군가 웃는 소리가 들렸다. 밖으로 나왔다. 문이 닫혔다.',
        moved: zone => `[이동] ${zone}`,
        cannotWalk: '[이동] 지금은 움직일 수 없다.'
    },
    failures: {
        BAND_REMOVED: '퇴장 전에 손목 밴드를 풀었습니다.',
        BAND_TIGHTENED: '헐거워진 손목 밴드를 조였습니다.',
        BAND_FLOAT: '풀려 떠오른 손목 밴드를 보고도 즉시 안전 요원을 부르지 않았습니다. 손목 밴드를 재지급 받지 못했습니다.',
        LOCKER_BREATH: '배정받지 않은 사물함이 열린 탈의실에서 호흡했습니다. 간혹 변종 에볼라 바이러스 감염 증상을 보이며 고온과 전신 출혈을 반복하다 사망하는 사례가 확인되었습니다.',
        LOCKER_UNREPORTED: '스스로 열린 사물함을 안내 데스크에 신고하지 않았습니다.',
        CHILD_HAND: '혼자 있는 아이의 손을 잡았습니다.',
        CHILD_WORDS: '혼자 있는 아이에게 다른 말을 했습니다. 아이가 다시 손을 내밉니다.',
        UNWET: '젖지 않은 사람의 흥미를 끌었습니다. 이후 체내에 있는 수분에 거부 반응을 가지게 되며 한 시간 이내에 체내의 수분을 모두 게워낸 채 발견된 사례가 확인되었습니다. 수습된 유해에서는 혈액이 검출되지 않았습니다.',
        WHISTLE_MOVE: '후루라기 소리를 듣고도 동작을 멈추지 않았습니다.',
        WHISTLE_IGNORED: '후루라기 소리를 듣고도 가장 가까운 안전 요원대를 확인하지 않았습니다.',
        WHISTLE_STAY: '비어 있는 안전 요원대를 확인하고도 물에 남아 있었습니다. 검은색 수영복 반바지를 입은 안전 요원에게 심폐소생술을 받게 되며 양쪽 갈비뼈 골절 및 장기 손상을 당하는 사례가 확인되었습니다.',
        BROADCAST: '성함이 호명된 안내 방송에 응했습니다. 본 시설은 성인 고객을 안내 방송으로 호출하지 않습니다.',
        SPA_DRINK: '탕 안에서 물을 마셨습니다. 탕 안에서 수분을 섭취한 고객은 수술 대상으로 분류됩니다.',
        SPA_LATE: '안내종이 울렸는데도 탕에서 나오지 않았습니다.',
        SLIDE_END: '네 번째 곡선에서 멈추지 못하고 끝까지 내려갔습니다. 도착 지점이 아닌 지하 수술실로 이송되었으며 마취 없이 개복된 상태로 발견된 사례가 확인되었습니다. 해당 고객들의 체내에서는 혈액을 포함한 모든 수분이 제거되어 있었습니다.',
        FOOD_LEFT: '주문하지 않은 메뉴를 남기거나 돌려보냈습니다. 치료 프로세스에 협조하지 않는 환자들에게 인내심을 가지는 친절한 병원이 아님을 명심하여 주십시오.',
        SURGERY_DATE: '"언제 수술이십니까?"라는 질문에 날짜를 특정하여 답했습니다. 해당 날짜에 반드시 수술을 받게 됨을 확인하였습니다.',
        SURGERY_OTHER: '"언제 수술이십니까?"라는 질문에 "오늘은 아닙니다." 외의 대답을 했습니다.',
        SUNBED: '비워져 있는 선베드를 이용하신 고객께서는 퇴장하지 못하셨으며 폐장 후 분실물 센터에 부위별로 분류되어 있던 사례가 확인되었습니다.',
        CHARACTER: '혼자인 캐릭터에게 섣불리 다가가거나 등을 보이며 도망치려 했습니다. 폐장 후 해당 캐릭터 내부에서 으깨진 채로 발견된 사례가 확인되었습니다.',
        CHARACTER_STAY: '혼자인 캐릭터 앞에서 물러나지 않았습니다.',
        CLOSING_STAY: '폐장 방송 이후 풀 안에 남은 사람들 사이에 남았습니다.',
        CLOSING_FORCE: '막아선 사람들을 힘으로 뿌리치려 했습니다.',
        SETTLE_DISPUTE: '정산 내역에 이의를 제기하거나 환불을 요구했습니다. 본 시설의 결제 기록에는 오류가 발생하지 않습니다.'
    },
    canonFailures: ['LOCKER_BREATH', 'UNWET', 'WHISTLE_STAY', 'SPA_DRINK', 'SLIDE_END', 'SURGERY_DATE', 'SUNBED', 'CHARACTER']
};

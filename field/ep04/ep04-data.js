// EP04 Field data. Canon order: reviewed transcript -> 4화.txt (rule document, shown in the Story window) -> this data.
// The rule document is NOT duplicated here: the Field reads the same text from #darkwebReportWindowEP4 (reportSelector).
// Everything under `tuning`, `weights`, observation lines and the `system` failure texts is implementation tuning,
// NOT canon. Only the codes in `canonFailures` restate outcomes the reviewed transcript states. Outcomes the transcript
// does not state are kept to a minimal "record lost" system failure and listed in CHANGELOG_AI.md.
window.FieldEP04Data = {
    id: 'EP04', title: '불 꺼진 13층 엘리베이터',
    reportSelector: '#darkwebReportWindowEP4 textarea',
    // Named rolls so tests can force branches: start, side, delta, autoDir, autoDelta, event, eventKind (a string 'A'|'B'|'D'|'E'
    // is accepted as a forced pick), talk, male, voice, cue. Default is Math.random().
    random: name => Math.random(),
    startLog: '[승강기] 불 꺼진 승강기 안이다. 정면의 층 표시기는 13을 가리킨다. 수칙 문서를 확인하십시오.',
    restoredLog: '[복원] 진행 중이던 승강기 기록을 복원했습니다.',
    clearText: '생환 기록 저장 / EP.05 연결 권한 갱신. 다음 현장은 연결 준비 중입니다.',
    indicator: 13,   // front floor indicator: always 13 (canon). Never derived from the real floor.
    floors: 13,      // buttons 1..13 (tuning; the reviewed document gives no floor range)
    tuning: {
        count: 20,                 // canon: the first rear-mirror check shows 20
        critical: 14,              // approach steps until the light is out and only noise remains (tuning)
        topFloor: 12,              // ascents stop here (tuning); the real floor is never 13
        startFloor: [11, 12],
        deltas: [1, 1, 1, 1, 2, 2, 3],   // floors moved per trip (canon: "일정하지 않다")
        travel: 1.6, doorOpen: 6, doorRelease: 1.5,
        freeArrivals: 1, eventChance: 0.7, memoryBy: 5,
        talkChance: 0.6, talkDelay: 3, talkWindow: 45, maleChance: 0.4,
        c2Start: 6, c2Cue: [9, 14], c2StairEvery: 3,
        eHold: 3                   // canon: hold the matching floor button for 3 seconds
    },
    // Event mix by arrival count (tuning): early = rules of the mirror, late = memory events (D/E). C only follows B.
    weights: {
        early: [['A', 3], ['B', 3]],
        mid: [['A', 2], ['B', 3], ['D', 2], ['E', 2]],
        late: [['A', 1], ['B', 2], ['D', 3], ['E', 3]]
    },
    video: {
        outside: 'movies/ep4_idle.mp4',          // dark empty corridor beyond the doors (verified frame: corridor)
        mirror: 'movies/ep4_event_right.mp4',    // looping mirrored corridor, no figure (used for an empty side mirror)
        her: 'movies/ep4_event_left.mp4',        // long black hair, pale, crawling (used for her in a side mirror; flipped for the right)
        face: 'movies/ep4_event_speaker.mp4',    // face filling a round mirror (rear mirror during situation A)
        button: 'movies/ep4_event_exit.mp4'      // finger on a lit button (door-open / floor button holds)
    },
    text: {
        move: '[승강기] 승강기가 움직인다.',
        arrive: '[승강기] 진동이 멎고 정차했다. 문이 열린다.',
        open: '[승강기] 문이 열린다.',
        close: '[승강기] 문이 닫힌다.',
        rear: n => `[후면 거울] 거울에 비친 숫자는 ${n.floor}이다. 표시기 아래의 숫자는 ${n.count}이다.`,
        rearFace: '[후면 거울] 거울 가득 그녀의 얼굴이 비친다. 숫자는 보이지 않는다.',
        herAt: (side, dist) => `[${side} 거울] 반복되는 상 안쪽 ${dist < 5 ? '아주 깊은 곳' : dist < 9 ? '먼 곳' : dist < 12 ? '가까운 곳' : '바로 앞'}에서 창백한 무언가가 검은 머리카락을 늘어뜨린 채 네 발로 기어오고 있다.`,
        empty: side => `[${side} 거울] 끝없이 반복되는 승강기 내부의 상만 이어져 있다.`,
        dual: '[측면 거울] 마주 보는 두 거울 모두, 반복되는 상 안쪽에서 무언가가 네 발로 기어오고 있다.',
        dim: ['[승강기] 조명이 눈에 띄게 어두워졌다.', '[안내 방송] 잡음이 심해진다.', '[승강기] 조명이 깜빡인다. 방송은 잡음에 묻혀 거의 들리지 않는다.'],
        A: '[승강기 밖] 문이 열렸다. 불이 꺼진 빈 복도다.',
        AClose: '[승강기] 문이 닫히고 승강기가 다시 움직인다.',
        B: '[승강기] 문이 열리고 여러 개체가 승강기에 탑승한다. 그들은 서로에게도, 당신에게도 관심이 없어 보인다.',
        BTalk: '[승객] 개체 중 하나가 당신에게 말을 걸어온다.',
        BLeave: '[승강기] 탑승했던 개체들이 내린다.',
        knock: (side, n) => `[거울] ${side} 거울을 두드렸다. (${n}회)`,
        cover: '[귀] 두 손으로 귀를 막았다.',
        crouch: '[웅크림] 몸을 웅크린 채 다음 층을 기다린다.',
        C1: '[승객] 한 남성형 개체가 승강기에서 내린다. 흉기를 꺼내 들고 미친 듯이 웃으며 계단 쪽으로 뛰어간다.',
        C2: '[문밖] 문이 열렸다. 문밖 복도는 조용하다. 방금 계단으로 뛰어가던 개체가 먼저 이 층에 도착해 있을 것이다.',
        hold: '[조작반] 문 열림 버튼을 누른 채 대기한다.',
        stair: ['[외부 계단실] 처절하게 흐느끼는 소리가 들린다.', '[외부 계단실] 뼈가 부서지는 소리가 들린다.'],
        cue: '[안내 방송] 기괴한 흐느낌이 흘러나온다.',
        unhold: '[조작반] 문 열림 버튼에서 손을 뗐다. 다음 층으로 이동하기 위한 하강 절차를 진행한다.',
        photo: side => `[휴대폰] ${side} 거울을 촬영했다. 촬영한 거울 속에서 그녀가 사라졌다.`,
        still: '[그녀] 가만히 있었다. 그녀가 두 걸음 가까워졌다.',
        voiceName: '[안내 방송] 잡음이 멎고 당신의 이름을 부르는 목소리가 흘러나온다.',
        voiceFamily: '[안내 방송] 잡음이 멎고 가족의 목소리가 흘러나온다.',
        flicker: '[조작반] 버튼의 전등이 모두 무작위로 깜빡인다. 스피커에서 당신을 애타게 찾는 목소리가 이어진다.',
        press: n => `[조작반] ${n}층 버튼을 누르고 있다.`,
        scream: '[조작반] 스피커에서 비명이 터져 나오며 목소리가 끊긴다. 방송에는 다시 잡음만 남는다.',
        blockedDoor: '[조작반] 문이 열려 있어 승강기가 움직이지 않는다.',
        blockedTalk: '[조작반] 버튼을 눌렀지만 승강기가 움직이지 않는다.',
        exit: '[하차] 문밖으로 걸어 나왔다.',
        report: '[보고] 촬영한 사진은 확인하지 않았다. 복귀 후 본부 요원에게 촬영 사실을 말했다.',
        clear: '하차 성공 — 다음 날 오전 4시 40분경 신도림 만수오피스텔 건물의 승강기에서 발견되었습니다. 생환 기록 전송.'
    },
    // Failure codes. `canonFailures` lists the ones that restate the reviewed transcript; every other code is a minimal
    // non-canon "record lost" failure for results the transcript does not state (nothing new is described).
    failures: {
        MISSING: '1층을 지나쳤습니다. 실종자가 되었으며 이에 대한 정보는 파악하지 못하였습니다.',
        D_WRONG_MIRROR: '원래 위치해야 할 거울을 촬영했습니다. 전국 엘리베이터 수십 곳에 신체 일부가 흩뿌려져 있는 것이 확인되었습니다.',
        E_ANSWERED: '대답했습니다. 다음 날 해당 승강기의 천장에서 피 묻은 옷가지와 소지품만이 발견되었습니다.',
        E_SPEAKER: '소리가 나는 스피커 쪽으로 고개를 돌렸습니다. 현장 연결이 끊겼습니다. 기록 확보 불가.',
        E_WRONG_BUTTON: '잘못된 버튼을 눌렀습니다. 다음 날 해당 승강기의 천장에서 피 묻은 옷가지와 소지품만이 발견되었습니다.',
        RECORD_LOST: '조명이 완전히 꺼지고 안내 방송에는 잡음만 남았습니다. 이후의 기록은 확보되지 않았습니다.',
        NO_COUNT: '더 이상 정상 절차를 진행할 수 없습니다. 기록 확보 불가.',
        EXIT_WRONG_FLOOR: '1층이 아닌 층에서 하차했습니다. 현장 연결이 끊겼습니다. 기록 확보 불가.',
        B_ANSWERED: '개체의 말에 대답했습니다. 현장 연결이 끊겼습니다. 기록 확보 불가.',
        B_WRONG_MIRROR: '그녀가 있는 거울이 아닌 거울을 두드렸습니다. 현장 연결이 끊겼습니다. 기록 확보 불가.',
        B_BAD_ORDER: '절차를 마치지 않은 채 웅크렸습니다. 현장 연결이 끊겼습니다. 기록 확보 불가.',
        B_UNRESOLVED: '시간 안에 대응하지 못했습니다. 현장 연결이 끊겼습니다. 기록 확보 불가.',
        C_NO_HOLD: '문 열림 버튼을 누르지 않았습니다. 현장 연결이 끊겼습니다. 기록 확보 불가.',
        C_EARLY_RELEASE: '방송의 흐느낌이 들리기 전에 문 열림 버튼에서 손을 뗐습니다. 현장 연결이 끊겼습니다. 기록 확보 불가.',
        D_PHOTO_VIEWED: '촬영한 사진을 확인했습니다. 현장 연결이 끊겼습니다. 기록 확보 불가.'
    },
    canonFailures: ['MISSING', 'D_WRONG_MIRROR', 'E_ANSWERED', 'E_WRONG_BUTTON']
};

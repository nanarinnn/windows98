// EP03 Field data. Canon order: reviewed transcript -> 3화.txt (rule document, shown in the Story window) -> this data.
// The rule document is NOT duplicated here: the Field reads the same text from #darkwebReportWindowEP3 (reportSelector).
// Everything under `tuning`, `profiles`, `parts`, observation lines and fake-visitor lines is implementation tuning,
// NOT canon. Outcomes the transcript does not state are kept minimal and listed in CHANGELOG_AI.md.
window.FieldEP03Data = {
    id: 'EP03', title: '베리 해피 종합병원',
    reportSelector: '#darkwebReportWindowEP3 textarea',
    // Named rolls so tests can force branches (band, part, surgeryDay, surgeryTime, profile, realDay, fakeDays, fakeKind,
    // nightWalk, ...). Default is Math.random().
    random: name => Math.random(),
    startLog: '[병실] 베리 해피 종합병원에 환자로 입원되었습니다. 수칙 문서를 확인하십시오.',
    restoredLog: '[복원] 진행 중이던 입원 기록을 복원했습니다.',
    clearText: '구조 기록 저장 / EP.04 연결 권한 갱신. 다음 현장은 연결 준비 중입니다.',
    lastDay: 7,
    // Clock = minutes since 00:00. Real seconds per game minute are tuning (a day is ~100 s, a run ~12-15 min).
    tuning: {
        dayStart: 420, firstEvent: 423, introSeconds: 60,   // "편입 3분 내": 3 game minutes stretched over introSeconds on Day 1
        secPerMin: 0.1, slowSecPerMin: 0.4, slowBefore: 120, // slowed before a scheduled surgery so "30분 전" is playable
        rounds: 510, visitNotice: 660, visitEnd: 780, lightsOut: 1260, wheels: 1300, dayEnd: 1380,
        surgeryTimes: [900, 960], surgeryInterval: 3,
        redNurseWindow: 15, joints: 543, roundsWindow: 14,
        wheelsGrace: 8, wheelsHold: 6, nurseSpeakWindow: 10,
        drinkEarly: 35, drinkLate: 25,                        // drink between 35 and 25 minutes before the scheduled time
        emergencyDelay: 60, nightWalkChance: 0.7
    },
    bands: ['red', 'yellow', 'blue'],
    bandNames: { red: '빨간색', yellow: '노란색', blue: '파란색' },
    parts: ['오른쪽 팔', '왼쪽 팔', '오른쪽 다리', '왼쪽 다리'],
    // Patient profile placeholders used only to check the visitor's statement (not canon).
    profiles: [
        { age: '34세', job: '회사원', home: '수원시', family: '민서' },
        { age: '52세', job: '교사', home: '대전시', family: '정훈' },
        { age: '27세', job: '디자이너', home: '부산시', family: '지아' }
    ],
    // Vending machine (lounge). Only the canon item is named; other cells are plain drinks.
    vending: { rows: 3, cols: 4, targetRow: 1, targetCol: 3, targetName: '보라맛 요정 주스' },
    // Observation text. `view` is shown after the player is in that place; no event titles.
    places: {
        room: { view: '병실. 침상과 서랍, 문 옆에 차트가 있다. 공기 중에 짙은 포르말린 냄새가 난다. 모든 창문이 콘크리트로 막혀 있다.', video: 'movies/ep3_idle.mp4' },
        corridor: { view: '병실 밖 복도. 창문이 없다.', video: 'movies/ep3_idle.mp4' },
        lounge: { view: '병동 휴게실. 자판기가 있다.', video: 'movies/ep3_idle.mp4' },
        visit: { view: '1층 면회실. 탁자를 사이에 두고 의자가 놓여 있다.', video: 'movies/ep3_idle.mp4' }
    },
    // Fake visitors (tuning): the transcript only says someone who asks for your information "will not help you".
    visitorLines: {
        ask: '[면회자] "저는 본부 요원입니다. 안내문을 보여 주시고, 나이와 직업, 거주지, 가족 이름을 말씀해 주세요."',
        recite: p => `[면회자] "나이는 ${p.age}, 직업은 ${p.job}, 거주지는 ${p.home}, 가족은 ${p.family}이시죠."`
    },
    followLine: '[보호자] 지금부터 제 안내를 따라 주세요.',
    // Failure codes (internal ids; messages stay within the reviewed document).
    failures: {
        PILL_MISUSE: '해당 사항이 아닌데 빨간 알약을 복용했습니다. 즉발적 효과를 갖는 치사량의 합성 펜타닐 화합물입니다.',
        BLUE_JOINTS: '특수 매트리스에 결박된 채 체위 변경을 당했습니다. 모든 관절이 꺾입니다.',
        SPECIAL_ROOM: '약을 복용하지 않고 거짓으로 배탈을 호소했습니다. 특별 관리실로 보내졌습니다.',
        FALL_TEST: '아픈 기색을 내보였습니다. 엄격한 낙상 테스트는 인간의 내구성으로는 버틸 수 없는 강도로 진행됩니다.',
        BERRY_PSYCH: '완치를 주장했습니다. 정신 오염을 당했다고 판단되어 베리 정신병원으로 전원되었습니다. 그 어떤 구조도 불가능합니다.',
        NIGHT_NURSE: '소등 이후 마주친 간호사에게 10만원권 한 장을 건네지 못했습니다.',
        VENDING_OUTLET: '상품 반출구에 손을 넣었습니다.',
        SURGERY_WITHOUT_PREP: '예정된 수술이 진행되었습니다. 수술을 피할 방법은 없습니다.',
        FAKE_VISITOR: '정보를 요구하는 상대의 지시를 따랐습니다. 그들은 당신을 돕지 않습니다.',
        RESCUE_MISSED: '7일 차가 지났지만 구조가 이루어지지 않았습니다.'
    }
};

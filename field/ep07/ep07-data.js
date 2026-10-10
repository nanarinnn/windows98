// EP07 Field data. Canon order: reviewed transcript (docs/transcripts/reviewed/EP07_나눔_12시_편의점.txt, 문서 번호
// 2026-07-19, 나눔 12시 편의점) -> 7화.txt (rule document, shown in the Story window) -> this data. The rule document
// is NOT duplicated here: the Field reads the same text from #darkwebReportWindowEP7 (reportSelector).
// A-G are not stages: they are interrupts inside an ordinary night shift (door chime -> customer -> mirror -> scan ->
// ID -> payment -> bag -> exit). NOT canon (tuning/presentation): the shift schedule and its minutes, the customer
// profiles/items/prices, the previous shift's waste log entry, the bathroom urge, every `tuning` value and every failure
// text outside `canonFailures` (those are a minimal "기록 중단" result).
window.FieldEP07Data = {
    id: 'EP07', title: '나눔 12시 편의점',
    reportSelector: '#darkwebReportWindowEP7 textarea',
    // Named rolls so tests can force branches: dTier (0-5), ghostCode (0 blank / 1 code), endPresses (>= 1), items.
    random: name => Math.random(),
    startLog: '22:00 — 나눔 12시 편의점 야간 근무 시작. 계산대 안쪽. 수칙 문서를 확인하십시오.',
    clearText: '[근무 종료 처리 완료] EP07 나눔 12시 편의점 — 퇴근 기록 확인. EP.08 연결 권한 갱신.',

    // The shift. `at` = game minutes after 22:00. The clock runs only while nobody is at the counter; every finished
    // transaction adds `tuning.txMinutes`. Customers thin out toward dawn.
    schedule: [
        { at: 6, customer: { items: ['water'], pay: 'card' } },
        { at: 32, customer: { items: ['cigarette'], pay: 'card', id: 'normal' } },
        { at: 62, customer: { items: ['snack', 'cola'], pay: 'cash', bag: true, mirror: 'corridor' } },
        { at: 95, customer: { items: ['ramen'], pay: 'card', ask: true } },
        { at: 128, customer: { items: ['soju'], pay: 'card', id: 'blink' } },
        { at: 160, customer: { items: ['gum'], pay: 'cash', ask: true, voice: true } },
        { at: 196, phantom: 'enter' },
        { at: 210, customer: { items: ['coffee'], pay: 'card' } },
        { at: 226, urge: true },
        { at: 246, customer: { items: ['beer', 'snack'], pay: 'card', id: 'normal', bag: true } },
        { at: 300, waste: true },
        { at: 310, phantom: 'pay' },
        { at: 336, customer: { items: ['ghost'], pay: 'card', ghost: true } },
        { at: 392, customer: { items: ['water'], pay: 'cash' } },
        { at: 446, customer: { items: ['bread'], pay: 'card' } },
        { at: 480, dawn: true }
    ],
    products: {
        water: { name: '생수 500ml', price: 1000 }, cigarette: { name: '담배', price: 4500 }, snack: { name: '감자칩', price: 1800 },
        cola: { name: '콜라 500ml', price: 2200 }, ramen: { name: '컵라면', price: 1500 }, soju: { name: '소주', price: 1900 },
        gum: { name: '껌', price: 1000 }, coffee: { name: '캔커피', price: 1400 }, beer: { name: '캔맥주', price: 2500 },
        bread: { name: '단팥빵', price: 1600 }
    },
    // D: the customer brings an item the store does not stock. Scans fine; the POS name field is blank or a bare code.
    ghostTiers: [
        { price: 900, part: '왼손 엄지손톱' }, { price: 2500, part: '왼손 검지' }, { price: 4500, part: '오른손' },
        { price: 9500, part: '양쪽 귀' }, { price: 25000, part: '랜덤한 장기 한 부위' }, { price: 45000, part: '전두엽' }
    ],
    ghostCode: '8809 0719 2026 3',
    // F: the previous shift's waste log already exists; the same item is back on the shelf tonight.
    prevWaste: { item: '삼각김밥(참치마요)', at: '02:14' },
    shelf: [
        { id: 'lunchbox', name: '도시락(제육)', note: '폐기 시간 03:00 경과', expired: true },
        { id: 'returned', name: '삼각김밥(참치마요)', note: '', returned: true },
        { id: 'sandwich', name: '샌드위치(햄치즈)', note: '폐기 시간 03:00 경과', expired: true },
        { id: 'kimbap', name: '삼각김밥(전주비빔)', note: '06:00까지' }
    ],
    tuning: {
        idleSecondsPerMinute: 0.55, txMinutes: 6, browse: 4, leave: 3,         // browse: walk-in → counter, leave: paid → out (seconds)
        gazeWatch: 2.4, gazeAway: 2.8,                 // customer looks at you / looks away (mirror window)
        glanceMin: 0.25, corridorMax: 1.0, glanceMax: 2.2,
        blinkAfter: 0.6, idHold: 5, idTolerance: 0.6,  // return within ±60% of the take time
        urgeUntil: 440, restMinutes: 5, endPressesRange: [3, 5]
    },
    video: {
        idle: 'movies/ep7_idle.mp4', mirror: 'movies/ep7_event_mirror.mp4', id: 'movies/ep7_event_id.mp4',
        barcode: 'movies/ep7_event_barcode.mp4', dawn: 'movies/ep7_event_dawn.mp4'
    },
    text: {
        chime: '[자동문] 띵동—',
        enter: '[매장] 손님이 들어왔다. 진열대 사이를 지나간다.',
        nobody: '[매장] 아무도 보이지 않는다.',
        atCounter: names => `[계산대] 손님이 ${names}을(를) 계산대에 올려놓는다.`,
        gazeWatch: '손님이 이쪽을 보고 있다.',
        gazeAway: '손님이 휴대폰 화면을 내려다보고 있다.',
        glanceEmpty: '[방범거울] 빈 통로가 비친다.',
        mirrorNormal: '[방범거울] 결제기 화면을 보는 척 거울을 봤다. 평범한 매장 통로와 손님의 뒷모습.',
        mirrorCorridor: '[방범거울] 거울이 마주 보고 있는 것처럼 끝없이 반복되는 통로가 비친다.',
        mirrorAway: '[방범거울] 시선을 거뒀다. 결제기 화면.',
        scanned: (name, price) => `[POS] ${name} ${price.toLocaleString()}원`,
        scannedGhost: price => `[POS] (상품명 없음) ${price.toLocaleString()}원`,
        ask: '[손님] "이거 얼마예요?"',
        askOverlap: '[손님] "이거 얼마예요?" — 같은 말이 한 박자 늦게 한 번 더 들린다. 내 목소리다.',
        answeredAloud: price => `[응대] "${price.toLocaleString()}원입니다."`,
        pointed: what => `[응대] 말없이 ${what}을(를) 가리켰다. 손님이 고개를 끄덕인다.`,
        idHanded: '[손님] 손님이 신분증을 내민다.',
        idTaken: '[신분증] 신분증을 받아 들었다.',
        idBlink: '[신분증] 증명사진이 눈을 깜빡인다.',
        idLooked: '[신분증] 사진을 들여다봤다.',
        idReturned: '[신분증] 신분증을 돌려주었다.',
        idRefusedNormal: '[손님] 손님이 언짢은 얼굴로 상품을 두고 나갔다.',
        paid: (method, total) => `[결제] ${method} ${total.toLocaleString()}원 결제 완료.`,
        wrongMethod: method => `[손님] 손님이 ${method === 'card' ? '카드' : '현금'}를 내민다.`,
        bagRequest: '[손님] "봉투 주세요."',
        bagged: '[계산대] 봉투에 담아 건넸다.',
        notReady: '[POS] 아직 처리할 수 없다.',
        exit: '[자동문] 문이 열렸다 닫힌다. 손님이 나갔다.',
        phantomPay: '[POS] 아무도 없는데 결제 승인음이 울린다. 계산대 위 봉투가 저절로 들린다.',
        phantomExit: '[자동문] 문이 열렸다 닫힌다. 아무도 보이지 않는다.',
        hqDummy: '[본부] 0050-0200. "이상 없음으로 접수합니다."',
        hqGhost: '[본부] 0050-0200으로 말씀드렸다. "접수했습니다."',
        hqWaste: '[본부] 회수 완료를 보고했다. "접수했습니다."',
        lock: '[자동문] 매장 안에 손님이 없는 것을 확인하고 자동문을 잠갔다.',
        lockRefused: '[자동문] 매장 안에 손님이 있다.',
        unlock: '[자동문] 잠금을 해제했다.',
        rest: '[이동] 잠긴 매장을 두고 화장실에 다녀왔다. 계산대로 돌아와 잠금을 해제했다.',
        urge: '[몸] 화장실이 급하다.',
        urgeWorse: '[몸] 더 참기 어렵다.',
        wasteAlert: '[POS] 폐기 시간 알림 03:00 — 도시락·샌드위치.',
        shelfOpen: '[진열대] 계산대에서 보이는 진열대 쪽을 정리한다.',
        wasteRegistered: name => `[POS] ${name} 폐기 등록 완료.`,
        tidy: name => `[진열대] ${name}을(를) 가지런히 정리했다.`,
        tongsNormal: '[진열대] 평범한 상품이다. 집게를 내려놓았다.',
        tongs: '[회수] 계산대 아래 회수 집게 SNS-0719로 상품을 집었다.',
        contained: '[회수] 동봉된 회수 용기에 넣었다.',
        notNow: '[계산대] 손님이 앞에 있다.',
        dawn: '[시계] 06:00. 창밖이 밝아지지 않는다. 교대 근무자가 오지 않는다.',
        appOpen: '[알바지옥] 앱을 실행했다.',
        endEarly: '[알바지옥] 근무 시간이 남아 있습니다.',
        endFail: '[알바지옥] 처리 중 오류가 발생했습니다. 다시 시도해 주십시오.',
        endDone: '[알바지옥] 근무 종료 처리 완료. 창밖이 서서히 밝아진다. 유리문 너머로 첫차 소리가 들린다.',
        spoke: '[응대] "어서 오세요."'
    },
    failures: {
        SPOKE_FIRST: '손님에게 먼저 말을 걸었습니다.',
        MIRROR_SKIPPED: '방범 거울로 먼저 확인하지 않은 손님을 응대했습니다.',
        MIRROR_LOCKED: '방범 거울에서 시선을 거두지 못했거나 확인하는 모습을 들켰습니다. 손님이 기분 나쁜 미소를 지으며 "여기 알바는 거울을 좋아하나 봐요?"라고 말한 뒤 떠났습니다. 그 직후 야간 아르바이트생은 실종되며 해당 근무자와 인상착의가 일치하는 인물이 전국 각지의 승강기 측면 거울 안에서 절규하고 있었다는 목격담이 다수 발생하였습니다.',
        ID_FAIL: '손이 멈칫하거나 시선이 흔들렸습니다. 신분증 안에서 튀어나온 손에 신체 중 일부를 빼앗기는 사례가 확인되었습니다.',
        VOICE_LOST: '겹쳐 들리는 목소리에 입으로 대답했습니다. 실수로 대답한 근무자는 성대가 사라진 채로 발견된 사례가 확인되었습니다.',
        D_UNREPORTED: '상품명이 뜨지 않은 결제를 본부에 신고하지 못한 채 손님이 매장을 벗어났습니다.',
        E_LEFT_DURING_MISMATCH: '자동문 알림음 횟수와 매장을 나간 손님 수가 맞지 않는 동안 계산대를 지키지 않았습니다. 숫자를 세지 않은 근무자는 다음 날 CCTV 영상에서 혼자 봉투에 물건을 담아 허공에 건네는 자신의 모습을 확인했습니다. 그 봉투에 담긴 것이 무엇이었는지는 파악되지 않았습니다.',
        LEAVE_WITH_CUSTOMER: '매장에 손님이 있는 상태에서 계산대를 비웠습니다.',
        DOOR_UNLOCKED: '자동문을 잠그지 않고 자리를 비웠습니다. 잠그지 않고 다녀온 근무자는 자신의 이름표를 단 다른 사람이 서 있는 것을 발견한 뒤, 매장 진열대의 상품 포장 안에서 부위별로 나뉜 채 발견된 사례가 확인되었습니다.',
        F_BAREHAND: '진열대로 돌아온 폐기 상품을 맨손으로 만졌습니다.',
        F_REREGISTER: '이미 폐기 처리된 상품을 다시 폐기 등록했습니다. 다시 폐기 등록을 시도한 근무자는 폐기 목록 화면에 상품명 대신 자신의 이름과 근무 시작 시각이 등록되어 있는 것을 발견했습니다. 해당 근무자는 그날 이후 신원을 확인할 수 없게 되었습니다.',
        URGE: '자리를 비우지 못한 채 근무를 이어 가지 못했습니다.',
        G_OUTSIDE: '날이 밝지 않고 교대 근무자가 오지 않는 상태에서 매장 밖으로 나갔습니다. 조급함을 이기지 못하고 매장 밖으로 나간 근무자는 편의점 밖에서 대기하고 있던 손님들에게 잘게 뜯겨 나눠진 사례가 확인되었습니다.'
    },
    // record style shown with each failure (presentation)
    failureKind: {
        MIRROR_LOCKED: '본부 실종 기록', ID_FAIL: '본부 회수 기록', VOICE_LOST: '본부 회수 기록', D_UNREPORTED: '본부 회수 기록',
        E_LEFT_DURING_MISMATCH: 'CCTV 기록', DOOR_UNLOCKED: '본부 회수 기록', F_REREGISTER: 'POS 기록', G_OUTSIDE: '본부 회수 기록'
    },
    canonFailures: ['MIRROR_LOCKED', 'ID_FAIL', 'VOICE_LOST', 'D_UNREPORTED', 'E_LEFT_DURING_MISMATCH', 'DOOR_UNLOCKED', 'F_REREGISTER', 'G_OUTSIDE']
};

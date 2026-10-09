// EP07 Field data. Canon order: reviewed transcript (docs/transcripts/reviewed/EP07_나눔_12시_편의점.txt, 문서 번호
// 2026-07-19, 나눔 12시 편의점) -> 7화.txt (rule document, shown in the Story window) -> this data. The rule document
// is NOT duplicated here: the Field reads the same text from #darkwebReportWindowEP7 (reportSelector).
// Everything under `tuning`, the visit queue, normal-customer flavor and the non-canon failure texts is implementation
// tuning/presentation, NOT canon. `canonFailures` lists the codes whose text restates the reviewed transcript
// (mirror quote + vanishing/elevator sighting, ID hand, voice loss, the body-part damage table, the CCTV bagging-into-
// thin-air sighting, the re-discard name/time display, the torn-apart-outside result, the unlocked-break result);
// every other failure (SPOKE_FIRST, LEAVE_WITH_CUSTOMER, F_BAREHAND) is a minimal "record interrupted" result for outcomes the transcript does not state.
window.FieldEP07Data = {
    id: 'EP07', title: '나눔 12시 편의점',
    reportSelector: '#darkwebReportWindowEP7 textarea',
    // Named rolls so tests can force branches: dTier (0-5 index into items.ghostTiers, or numeric string), endPresses
    // (number of '근무 종료' presses required, forced by passing a number >= 1). Default is Math.random().
    random: name => Math.random(),
    startLog: '22:00 — 나눔 12시 편의점 야간 근무 시작. 수칙 문서를 확인하십시오.',
    clearText: '06:00 근무 종료 처리 완료 / EP.08 연결 권한 갱신. 다음 현장은 연결 준비 중입니다.',
    // Fixed phase order (no literal canon timestamps on A-F): normal customers are interleaved so not every
    // customer reads as an anomaly. G (dawn delay) always follows once the queue is done.
    queue: ['N', 'A', 'N', 'B', 'N', 'C', 'N', 'D', 'N', 'E', 'N', 'F'],
    tuning: {
        mirrorWindow: 4, idDeadline: 7, dReportDeadline: 8, eChimeAt: 5, eExitAt: 10, gPressesRange: [3, 5],
        prevDiscardItem: '삼각김밥(참치마요)'
    },
    items: {
        normal: ['생수 500ml', '삼각김밥(전주비빔)', '아이스크림', '담배(평범한 구매)', '숙취해소제'],
        ghostTiers: [
            { max: 1000, price: 900, part: '왼손 엄지손톱' },
            { max: 3000, price: 2500, part: '왼손 검지' },
            { max: 5000, price: 4500, part: '오른손' },
            { max: 10000, price: 9500, part: '양쪽 귀' },
            { max: 30000, price: 25000, part: '랜덤한 장기 한 부위' },
            { max: 50000, price: 45000, part: '전두엽' }
        ]
    },
    video: {
        idle: 'movies/ep7_idle.mp4',
        mirror: 'movies/ep7_event_mirror.mp4',
        id: 'movies/ep7_event_id.mp4',
        barcode: 'movies/ep7_event_barcode.mp4',
        dawn: 'movies/ep7_event_dawn.mp4'
    },
    text: {
        arriveNormal: item => `[자동문] 손님이 들어왔다. ${item}을 계산대에 올린다.`,
        payNormal: '[결제] 결제를 진행했다. 손님이 매장을 나갔다.',
        mirrorCheck: '[방범거울] 결제기 화면을 보는 척하며 시선을 거울로 옮겼다.',
        mirrorCorridor: '[방범거울] 거울이 마주 보고 있는 것처럼 끝없이 반복되는 통로가 비친다.',
        mirrorAway: '[방범거울] 시선을 거뒀다. 다시 결제기 화면을 본다.',
        mirrorNormal: '[방범거울] 평범한 매장 통로가 비친다.',
        payA: '[결제] 결제를 진행했다. 손님이 매장을 나갔다.',
        arriveB: '[손님] 손님이 담배를 요구하며 신분증을 내민다.',
        idCheck: '[신분증] 신분증을 확인했다. 증명사진이 눈을 깜빡인다.',
        idReturned: '[신분증] 건네받았을 때와 같은 손짓과 속도로 공손히 돌려주었다. 손님이 결제를 마치고 나갔다.',
        arriveC: '[손님] 손님이 무언가를 묻는다. 그 목소리가 내 목소리와 겹쳐 들린다.',
        cPoint: '[응대] 말없이 가격표를 가리켰다. 손님이 결제를 마치고 나갔다.',
        arriveD: '[자동문] 손님이 들어와 상품을 계산대에 올린다.',
        dScan: '[포스기] 바코드가 인식되어 가격이 찍혔다. 그러나 화면 상단 상품명 칸이 빈칸(코드만 표시)이다.',
        dReported: amount => `[본부] 0050-0200으로 신고했다. (결제 금액 ${amount.toLocaleString()}원)`,
        dDone: '[결제] 손님이 결제를 마치고 매장을 나갔다.',
        arriveE: '[자동문] 알림음이 울렸다. 그러나 들어온 사람이 보이지 않는다.',
        ePhantom: '[포스기] 화면에 결제가 진행되는 듯한 불빛이 비친다. 봉투가 저절로 들린다.',
        eResolved: '[자동문] 보이지 않는 무언가가 매장을 나갔다. 알림음과 퇴장 수가 다시 일치한다.',
        arriveF: item => `[진열대] ${item}가 다시 놓여 있다. 어제 폐기 처리를 마친 상품이다.`,
        fTongs: '[회수] 회수 집게 SNS-0719로 상품을 집었다.',
        fContained: '[회수] 동봉된 회수 용기에 담았다.',
        fReported: '[본부] 회수 완료를 보고했다.',
        prevDiscard: item => `[전표] 전 근무일 폐기 완료 상품: ${item}.`,
        gArrive: '[시계] 06:00. 창밖이 밝아지지 않고 교대자가 오지 않는다.',
        gAppOpen: '[알바지옥] 앱을 열었다. \'근무 종료\' 버튼이 보인다.',
        gPressFail: '[알바지옥] 오류: 처리할 수 없습니다. 다시 시도하십시오.',
        gPressDone: '[알바지옥] 근무 종료 처리 완료.',
        lockOk: '[자동문] 매장 안에 손님이 없는 것을 확인하고 자동문을 잠갔다.',
        lockRefused: '[자동문] 매장 안에 손님이 있다. 잠그지 않았다.',
        leaveOk: '[이동] 자동문을 잠근 채 짧게 자리를 비웠다. 계산대로 돌아와 잠금을 해제했다.'
    },
    failures: {
        SPOKE_FIRST: '손님에게 먼저 말을 걸었습니다. 현장 연결이 끊겼습니다. 기록 중단.',
        MIRROR_LOCKED: '방범 거울에서 시선을 거두지 못했거나 확인하는 모습을 들켰습니다. 손님이 기분 나쁜 미소를 지으며 "여기 알바는 거울을 좋아하나 봐요?"라고 말한 뒤 떠났습니다. 그 직후 실종되었으며 전국 각지의 승강기 측면 거울 안에서 절규하고 있었다는 목격담이 다수 발생했습니다.',
        ID_FAIL: s => `신분증을 다루는 중 ${s.data.idReason}. 신분증 안에서 튀어나온 손에 신체 중 일부를 빼앗겼습니다.`,
        VOICE_LOST: '겹쳐 들리는 목소리에 입으로 대답했습니다. 성대가 사라진 채로 발견되었습니다.',
        D_UNREPORTED: s => { const t = s.data.dTier; return `결제가 끝나기 전에 본부에 신고하지 않은 채 손님이 매장을 벗어났습니다. 결제 금액 ${t.price.toLocaleString()}원에 따라 ${t.part}을 잃었습니다.`; },
        E_LEFT_DURING_MISMATCH: '문 알림음과 퇴장 수가 일치하지 않는 동안 계산대를 지키지 않았습니다. 다음 날 CCTV 영상에서 혼자 봉투에 물건을 담아 허공에 건네는 자신의 모습을 확인한 사례가 확인되었습니다. 그 봉투에 담긴 것이 무엇이었는지는 파악되지 않았습니다.',
        LEAVE_WITH_CUSTOMER: '매장에 손님이 있는 상태에서 계산대를 비웠습니다. 현장 연결이 끊겼습니다. 기록 중단.',
        DOOR_UNLOCKED: '자동문을 잠그지 않고 자리를 비웠습니다. 자신의 이름표를 단 다른 사람이 서 있는 것을 발견한 뒤, 매장 진열대의 상품 포장 안에서 부위별로 나뉜 채 발견된 사례가 확인되었습니다.',
        F_BAREHAND: '폐기 처리된 상품을 맨손으로 만졌습니다. 현장 연결이 끊겼습니다. 기록 중단.',
        F_REREGISTER: '이미 폐기 처리된 상품을 다시 폐기 등록했습니다. 폐기 목록 화면에 상품명 대신 근무자의 이름과 근무 시작 시각이 등록되어 있는 것을 발견했습니다. 그날 이후 신원을 확인할 수 없게 되었습니다.',
        G_OUTSIDE: '날이 밝지 않고 교대자가 오지 않는 상태에서 조급함을 이기지 못하고 매장 밖으로 나갔습니다. 편의점 밖에서 대기하고 있던 손님들에게 잘게 뜯겨 나눠진 사례가 확인되었습니다.'
    },
    canonFailures: ['MIRROR_LOCKED', 'ID_FAIL', 'VOICE_LOST', 'D_UNREPORTED', 'E_LEFT_DURING_MISMATCH', 'DOOR_UNLOCKED', 'F_REREGISTER', 'G_OUTSIDE']
};

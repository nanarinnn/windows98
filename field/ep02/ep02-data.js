// EP02 Field data. Canon order: reviewed transcript -> 2화.txt (rule document, shown in the Story window) -> this data.
// The rule document is NOT duplicated here: the Field reads the same text from #darkwebReportWindowEP2 (reportSelector).
// Everything under `tuning`, `schedule` and the observation text is implementation tuning, NOT new canon.
// Outcomes the transcript does not state (what happens after a correct red-pill use, the cost of ignoring the clown)
// are kept minimal and listed in CHANGELOG_AI.md.
window.FieldEP02Data = {
    id: 'EP02', title: '서울 심야 2호선',
    reportSelector: '#darkwebReportWindowEP2 textarea',
    // Named rolls so tests can force branches: random('wake'), random('mode'), ... default is Math.random().
    random: name => Math.random(),
    startLog: '[후미 객차] 신설동행 열차에 편입되었습니다. 수칙 문서를 확인하십시오.',
    clearText: '탈출 기록 저장 / EP.03 연결 권한 갱신. 다음 현장은 연결 준비 중입니다.',
    cars: 7,
    tuning: {
        // Real seconds. The transcript's "3 minutes" void-station wait is compressed to voidHold.
        voidGrace: 8, voidHold: 18,
        chaseStart: 5, chaseMax: 8, chaseSeconds: 9, chaseMoveGain: 2,
        wakeChanceWithShoes: 0.85,
        girlNotice: 8,
        // Tunnel light: visible long enough to read the scene and act (was 1.4s every 2-4s, too fast in play).
        flashMin: 3, flashMax: 6, flashVisible: 3.2, thinChance: 0.3,
        pushCount: 6,
        recognitionWindow: 12,
        parentChancePerRisk: 0.25, parentChanceMax: 0.75,
        // Dark car branch (probabilities are tuning, not canon). One roll decides the branch on first entry:
        // r < clownChance -> C-2 clown encounter; next specialChance -> C-1 special card position; otherwise the 4 basic holders.
        clownChance: 0.25, specialChance: 0.25,
        seizureOnSearch: 0.12,   // contact raises the chance (transcript: higher on contact)
        seizureIdle: 0.03,       // checked once per tunnel flash (transcript: can happen without contact)
        pillDeadline: 10         // "즉시 섭취": seconds before the thin one's entry is no longer stoppable
    },
    // run = between stations (doors between cars can be used); stop = at a station; void = non-existent station.
    schedule: [
        { type: 'run', to: '성수', dur: 60 },
        { type: 'stop', at: '성수', dur: 12 },
        { type: 'run', to: '용답', dur: 180 },
        { type: 'stop', at: '용답', dur: 12 },
        { type: 'run', to: '신답', dur: 70 },
        { type: 'void', dur: 40 },
        { type: 'run', to: '신답', dur: 110 },
        { type: 'stop', at: '신답', dur: 12 },
        { type: 'run', to: '용두', dur: 180 },
        { type: 'stop', at: '용두', dur: 45, final: true },
        { type: 'run', to: '신설동', dur: 40, arrival: true }
    ],
    // Stations after the 성수 announcement (document: 4 stations remain).
    remainingAfterSeongsu: ['용답', '신답', '용두', '신설동'],
    rps: {
        order: ['paper', 'paper', 'rock', 'paper'],
        names: { rock: '바위', paper: '보', scissors: '가위' },
        beats: { rock: 'scissors', paper: 'rock', scissors: 'paper' },
        hints: ['아이가 손바닥을 활짝 펼친 채 기다린다.', '아이가 다시 손바닥을 활짝 펼친다.', '아이가 주먹을 꼭 쥐고 기다린다.', '아이가 손바닥을 활짝 펼친 채 기다린다.']
    },
    // Search holders named by the document. `found` is shown only when the card is really there.
    searchTargets: [
        { id: 'blueCheck', label: '파란색 체크 무늬 남성의 왼손', found: '남성의 왼손 안에 기관실 출입 카드가 쥐여 있다.' },
        { id: 'whiteBag', label: '흰 반팔 티셔츠 여성의 무릎 위 핸드백', found: '핸드백 안에서 기관실 출입 카드를 찾았다.' },
        { id: 'kids', label: '나란히 앉은 어린이 셋의 발 주변', found: '어린이들의 발 주변에서 기관실 출입 카드를 찾았다.' },
        { id: 'cap', label: '야구 모자·유니폼 남성의 바지 주머니', found: '남성의 바지 주머니에서 기관실 출입 카드를 꺼냈다.' }
    ],
    // C-1 special positions (document). Only present in the special branch.
    specialTargets: [
        { id: 'blackSuit', label: '검은색 정장 남성의 가슴 주머니', found: '검은색 정장을 입은 남성의 가슴 주머니에 기관실 출입 카드가 꽂혀 있다.' },
        { id: 'homeless', label: '바닥에 널브러진 노숙자의 배 위', found: '바닥에 널브러진 노숙자의 배 위에 기관실 출입 카드가 놓여 있다.' },
        { id: 'stroller', label: '유모차 한가운데', found: '유모차 한가운데 기관실 출입 카드가 놓여 있다.' },
        { id: 'oneEye', label: '눈이 하나로 합쳐진 먹이', found: '눈이 하나로 합쳐진 먹이가 기관실 출입 카드를 쥐고 있다.' }
    ],
    // Observation text only (no event titles). `look` = result of "주변을 살핀다". Videos reuse the existing EP02 Story assets.
    carText: {
        7: { enter: '[7번 객차] 후미 객차다. 귀하 외의 인원이 있다. 열차 달리는 소리가 들린다.', view: '후미 객차. 귀하 외의 인원이 있다. 열차 달리는 소리가 들린다.', look: '[주변을 살핀다] 별다른 움직임은 없다. 이 열차에서 귀하 외의 모든 인원은 비정상 개체로 간주해야 한다.', video: 'movies/ep2_idle.mp4' },
        6: { enter: '[6번 객차] 통로에 남성이 드러누워 있다. 술 냄새가 난다.', view: '통로에 남성이 드러누워 있다. 술 냄새가 난다. 손에는 술을 쥐고 있다.', look: '[조심스럽게 살핀다] 드러누운 남성은 잠들어 있는 듯하다. 통로를 지나려면 그의 곁을 지나야 한다.', video: 'movies/ep2_event_A.mp4' },
        5: { enter: '[5번 객차] 빈 좌석에 여자아이가 혼자 앉아 있다. 허공에 대고 가위바위보를 하고 있다.', view: '빈 좌석에 6~7세 가량의 단발머리 여자아이가 혼자 앉아 있다. 계절에 맞지 않는 노란색 유치원 원복을 입고 허공에 대고 가위바위보를 하고 있다.', look: '[주변을 살핀다] 아이는 허공을 향해 혼자 손을 내밀었다 거두기를 반복한다.', video: 'movies/ep2_event_B.mp4' },
        4: { enter: '[4번 객차] 별다른 이상은 눈에 띄지 않는다.', view: '별다른 이상은 눈에 띄지 않는다. 열차 달리는 소리가 들린다.', look: '[주변을 살핀다] 별다른 이상은 눈에 띄지 않는다.', video: 'movies/ep2_idle.mp4' },
        3: { enter: '[3번 객차] 실내 조명이 완전히 꺼져 있다.', view: '', look: '[주변을 살핀다] 아무것도 보이지 않는다. 창밖으로 지나가는 조명이 객차를 비추는 순간에만 내부가 드러난다.', video: 'movies/ep2_event_C.mp4' },
        2: { enter: '[2번 객차] 다음 객차로 이어지는 진입 통로에 기름이 구비되어 있다.', view: '다음 객차로 이어지는 진입 통로에 기름이 구비되어 있다.', look: '[주변을 살핀다] 통로 앞에 기름이 구비되어 있다. 다음은 1번 객차다.', video: 'movies/ep2_idle.mp4' },
        1: { enter: '[1번 객차] 좌석과 손잡이, 천장까지 승객으로 가득 차 있다. 출근 시간대와 같은 밀도다.', view: '좌석과 손잡이, 천장까지 승객으로 가득 차 있다. 출근 시간대와 같은 밀도다. 이들은 탈출 실패자이며 어떠한 상황에 처해 있든 사망하지 않은 상태다.', look: '[주변을 살핀다] 승객들이 귀하를 붙잡으려 한다. 통과하려면 이들을 밀치고 나아가야 한다.', video: 'movies/ep2_event_D.mp4' },
        0: { enter: '[기관실] 카드 인증 완료. 현재 노선 상태 표시, 현실 재인식 버튼, 창문이 있다.', view: '기관실.', look: '[주변을 살핀다] 노선 상태 표시, 현실 재인식 버튼, 창문이 있다.', video: 'movies/ep2_idle.mp4' }
    },
    flashScene: '창밖의 조명이 객차를 비춘다. 좌석에는 핏기 없이 새하얗게 질린 먹이 상태의 인원들이 널브러져 있다. 입술은 거미줄과 유사한 물질로 봉합되어 있다.',
    thinLines: ['빛이 스치는 순간, 차량 상부에 극도로 가늘고 긴 무언가가 걸려 있는 듯하다.', '창밖 조명이 지나가는 찰나, 시야 끝에서 가늘고 긴 형체가 움직였다.'],
    clownLines: ['[조우] 웃는 광대 가면을 착용한 남성이 서 있다. 먹이 상태의 인원들과 달리 체중이 정상으로 보인다.'],
    crowdLines: ['승객들을 밀치고 나아간다.', '손이 붙잡으려 하지만 기름 때문에 미끄러진다.', '밀집한 승객들 사이를 헤치고 나아간다.', '계속 밀치고 나아간다.', '앞쪽에 기관실 문이 보인다.', '기관실 문 앞에 도달했다.'],
    // Failure codes. EP02 reasons follow "<CODE> — <message>"; messages stay within the reviewed document.
    failures: {
        A_DRUNK_CAUGHT: '취객에게 붙잡혔습니다. 강제로 술을 삼키게 되었습니다.',
        B_DESTINATION_ANSWER: '아이의 질문에 직접 대답했습니다. 잘못된 역을 말한 승객의 혀를 뽑아 버립니다.',
        B_WRONG_RPS: '가위바위보 순서가 틀렸습니다.',
        B_PARENT_ENCOUNTER: '분노한 부모 개체를 마주쳤습니다. 전신의 뼈가 부서질 때까지 구타가 멈추지 않습니다.',
        VOID_STATION_MOVE: '존재하지 않는 역에서 움직였습니다.',
        VOID_STATION_OPEN_EYES: '존재하지 않는 역에서 눈을 떴습니다.',
        VOID_STATION_NO_RESPONSE: '존재하지 않는 역 안내에 제때 대응하지 못했습니다.',
        C_ARTIFICIAL_LIGHT: '인공 광원이 차량 상부의 얇은 것을 자극했습니다.',
        C_MOVE_WHILE_STOPPED: '정차 중 움직임이 진동으로 전달되었습니다. 얇은 것이 파손된 창문을 통해 객차 내부로 진입합니다.',
        C_WRONG_SEARCH: '터널 조명이 없는 암흑 속에서 수색했습니다. 진동이 전달되어 얇은 것이 객차 내부로 진입합니다.',
        C_THIN_ENTRY: '얇은 것의 진입이 확정되었습니다. 이를 저지할 방법은 없었습니다.',
        C1_PILL_MISUSE: '해당 상황이 아닌데 빨간 알약을 복용했습니다. 즉발적 효과를 갖는 치사량의 합성 약물입니다.',
        D_NO_OIL: '기름을 바르지 않고 진입했습니다. 승객들이 붙잡아 그들과 하나가 되기를 원합니다.',
        D_NO_UNDRESS: '탈의하지 않고 진입했습니다. 승객들이 붙잡아 그들과 하나가 되기를 원합니다.',
        FINAL_WRONG_STATION: '용두역이 아닌 곳에서 탈출을 시도했습니다.',
        FINAL_NO_RECOGNITION: '현실 재인식 버튼을 누르지 않고 창문으로 투신했습니다.',
        FINAL_TOO_LATE: '신설동에 도착했거나 재인식 시간이 끝났습니다.'
    },
    routeMap: ['2호선 내선순환 방향 · 성수지선', '', '성수 → 용답 → 신답 → 용두 → 신설동', '', '※ 노선도에 존재하는 역은 위와 같다. 신설동 도착 이전에 탈출을 완료해야 한다.'].join('\n')
};

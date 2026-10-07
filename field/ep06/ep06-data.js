// EP06 Field data. Canon order: reviewed transcript -> 6화.txt (rule document, shown in the Story window) -> this data.
// The rule document is NOT duplicated here: the Field reads the same text from #darkwebReportWindowEP6 (reportSelector).
// Everything under `tuning`, `schedule`, student placeholders, observation lines and the non-canon failure texts is
// implementation tuning, NOT canon (the day is a compressed simulation, not a claim that a whole term happens in one day).
// `canonFailures` lists the codes whose text restates the reviewed transcript; every other failure is a minimal
// "procedure not kept / record interrupted" result for outcomes the transcript does not state. Nothing about who 박예림 is,
// how she disappeared, the wet figure, SNS-0017's composition, or what "그 의미가 달라집니다" means is described here.
window.FieldEP06Data = {
    id: 'EP06', title: '청림고등학교 2학년 3반 17번',
    reportSelector: '#darkwebReportWindowEP6 textarea',
    // Named rolls so tests can force branches: deskDirty, b, call17 ('quiet'|'reply'|'A' accepted as strings), cOn, cSeat,
    // eOn, eIn, eAt, selfOpen, dOn, dAt, seat ('clean'|'smell'|'water' accepted as strings). Default is Math.random().
    random: name => Math.random(),
    startLog: '금년도 2학년 3반 담임 교사로 교실에 들어섰다. 수칙 문서를 확인하십시오.',
    restoredLog: '[복원] 진행 중이던 담임 업무 기록을 복원했습니다.',
    clearText: '일과 기록 저장 / EP.07 연결 권한 갱신. 다음 현장은 연결 준비 중입니다.',
    tuning: {
        bChance: 0.3, deskDirtyChance: 0.5, cChance: 0.75, eChance: 0.8, dChance: 0.8, selfOpenChance: 0.4,
        call17: [['quiet', 3], ['reply', 3], ['A', 3]],
        seat: [['clean', 3], ['smell', 4], ['water', 3]],
        // Attendance is a short stretch of the roll; the class size is not stated by the source and is never shown.
        rollFrom: 15, rollTo: 19,
        aTime: 45, aFocus: 6, aStrainEvery: 9, aStrainWindow: 5, aTalk: [12, 30], aUrge: [20, 38], aPromptShow: 8,   // "3분 안에" compressed to ~45 s
        isoWindow: 20, isoStay: 50,
        lessonNeed: [6, 6], chalkCd: 5, stall: 25, eAt: [8, 22], eDur: 30, eEvery: 6,
        breakTime: 40,
        exam: 60, dAt: [10, 30], sayWindow: 20, sprayWindow: 25, calmAfter: 4
    },
    schedule: {   // HUD labels only; the timetable is not canon
        prep: '08:10 교실 준비', homeroom: '08:30 조회', class1: '09:10 수업', break: '10:00 쉬는 시간', listening: '11:00 영어 듣기 능력 평가',
        class2: '13:40 오후 수업', closing: '16:10 방과 후 조례', done: '일과 종료'
    },
    students: { 15: '최○○', 16: '한○○', 18: '윤○○', 19: '정○○', other: '강○○' },   // masked placeholders (not canon)
    video: {
        room: 'movies/ep6_idle.mp4',          // empty classroom: desks, podium, board, windows (verified frame)
        roll: 'movies/ep6_event_call.mp4',    // the roll book on the podium, then a close view of the page (verified frame)
        freeze: 'movies/ep6_event_freeze.mp4',// dark classroom, everyone turned the same way (verified frame)
        water: 'movies/ep6_event_dismiss.mp4',// water spreading across the floor by a glass door (verified frame)
        door: 'movies/ep6_event_door.mp4'     // a frosted-glass door with a figure behind it (verified frame)
    },
    text: {
        prepDeskClean: '[17번 자리] 책상과 의자가 깨끗하게 정돈되어 있다.',
        prepDeskDirty: '[17번 자리] 책상 표면과 의자에 먼지가 앉아 있다. 17번 전용 책상과 의자는 항상 깨끗하게 관리해야 한다.',
        deskCleaned: '[17번 자리] 책상과 의자를 닦았다.',
        podium: '[교탁] 출석부, 방향제 SNS-0017, 버튼, 내선 전화가 놓여 있다.',
        clock: phase => `[시계] ${phase}.`,
        homeroom: '[조회] 조회 시간이 되었다. 출석부를 펼쳤다.',
        callOther: n => `[호명] ${n}번.`,
        call17: '[호명] 17번 박예림.',
        callTemp: '[호명] 임시 번호로 호명했다.',
        reply: '[교실] “네.” 하는 소리가 들렸다. 젖은 목소리 같다.',
        quiet: '[교실] 아무 대답이 없다.',
        absent: '[복창] 출석부에 시선을 고정한 채 “17번 박예림 결석”이라고 복창했다. 다음 번호로 넘어간다.',
        // A
        aStart: '[교실] 17번을 호명한 직후 학급 인원 전체가 하던 행동을 멈추고 교탁을 향해 고개를 옆으로 꺾은 채 응시한다.',
        aFocus: '[17번 자리] 17번 자리에 시선을 두었다.',
        aStrain: '[눈] 눈이 시려 온다.',
        aTalk: '[학생들] 학생들이 말을 걸어온다.',
        aUrge: '[충동] 움직이고 싶다는 욕구가 강하게 든다. 교실 바닥에서부터 물이 차오르고 있다.',
        aTeam: '[현장 대응팀] 현장 대응팀이 도착했다. 구조되었다.',
        aNote: '[대응] 현장 대응팀이 3분 안에 구조하도록 상시 대비하고 있다.',
        // B
        bNote: '[상황] 17번 자리에 학생이 배정되어 있다.',
        bCalled: n => `[호명] 17번 ${n}.`,
        bAware: '[인지] 17번으로 다른 학생을 호명했다.',
        bReport: '[현장 대응팀] 2층 교무실 옆 현장 대응팀에 보고했다. 정정 처리가 완료되기 전까지 해당 학생을 다른 임시 번호로 부른다.',
        isoIn: '[격리실] 해당 학생과 함께 2학년 3반 맞은편 격리실로 이동했다.',
        isoLines: ['[문 밖] 문 밖에서 무슨 소리가 들린다.', '[문 밖] 소리가 계속된다.', '[격리실] 오랜 시간이 지난 것 같다.', '[문 밖] 문 밖에서 소리가 이어진다.'],
        isoDone: '[격리실] 정정 처리가 완료되었다는 통보가 들어왔다. 교실로 돌아간다.',
        // lesson / E
        chalk: n => `[판서] 판서를 이어간다. (${n})`,
        lessonEnd: '[수업] 수업이 끝났다. 종이 울린다.',
        eVoice: '[교실 문 밖] 문 밖에서 열어 달라는 목소리가 들린다.',
        eMore: ['[교실 문] 문을 두드리는 소리가 난다.', '[교실 문] 문손잡이가 움직인다.', '[교실 문 밖] 열어 달라는 목소리가 계속된다.'],
        eEnd: '[교실 문 밖] 목소리가 그친다.',
        eSelf: '[교실 문] 문이 저절로 열린다. 수업을 이어간다.',
        doorQuiet: '[교실 문] 문 밖 복도는 조용하다.',
        // C
        breakStart: '[쉬는 시간] 종이 울렸다. 쉬는 시간이다.',
        seatNormal: (n, name) => `[${n}번 ${name}] 쉬는 시간을 보내고 있다.`,
        seatFollowed: (n, name) => `[${n}번 ${name}] 쉬는 시간을 보내고 있다. 학생 뒤쪽 바닥에 젖은 발자국 같은 흔적이 이어져 있다.`,
        button: '[교탁 버튼] 버튼을 눌렀다.',
        buttonNone: '[교탁 버튼] 버튼을 눌렀다. 아무 일도 일어나지 않는다.',
        escort: (n, name) => `[학생안전부] ${n}번 ${name} 학생을 현장 대응팀이 대기 중인 학생안전부로 직접 안내했다.`,
        // D
        examStart: '[듣기 평가] 영어 듣기 능력 평가가 시작되었다. 감독을 맡는다.',
        noise: '[스피커] 스피커에서 문항이 없는 소리, 파도 소리, 물 떨어지는 소리, 노이즈가 섞여 들린다.',
        say: '[감독] “시험 중에는 잡담 금지”라고 크게 말했다. 시험은 계속된다.',
        examEnd: '[종료 방송] 종료 방송이 나왔다. 시험이 끝났다.',
        spray: n => `[SNS-0017] 교실 안 모든 학생과 나에게 방향제 SNS-0017을 뿌렸다. (${n}회)`,
        sprayOther: '[SNS-0017] 방향제 SNS-0017을 뿌렸다.',
        speaker: '[스피커] 스피커다.',
        // closing
        closingStart: '[조례] 방과 후 조례 시간이다.',
        seatClean: '[17번 자리] 특별한 냄새는 나지 않는다.',
        seatSmell: '[17번 자리] 해당 자리에서 바다 냄새가 난다.',
        seatWater: '[17번 자리] 17번 책상 주변에서 바닷물과 젖은 해조류가 발견된다.',
        dismiss: '[교실] 모든 학생을 교실 밖으로 내보냈다.',
        phoneHq: '[특별재난관리본부] 0050-0200으로 연락했다.',
        phoneTeamNone: '[현장 대응팀] 내선이 연결되었다. 보고할 내용이 없다.',
        phoneHqNone: '[특별재난관리본부] 0050-0200으로 연락했다. 보고할 내용이 없다.',
        clear: '정상 절차를 지켜 일과를 마쳤습니다. 이 일과는 한 학기를 하루로 압축한 시뮬레이션입니다.'
    },
    failures: {
        ATTEND_PRESENT: '17번을 출석으로 처리했습니다. 출석으로 처리한 교사는 젖은 채 흐느끼는 긴 머리의 여성을 목격했다는 증언을 반복하다가 이후 TV나 PC 모니터와 같은 전자 기기 화면 앞에서 자취를 감춘 사례가 다수 확인되었습니다.',
        B_VANISHED: '17번으로 배정된 학생을 호명하고도 이동하지 않았습니다. 호명된 학생과 교사 모두 실종되었습니다.',
        ATTEND_LOOKED_UP: '고개를 들어 확인했습니다. 출석부에 시선을 고정해야 했습니다. 현장 연결이 끊겼습니다. 기록 중단.',
        ATTEND_SKIPPED: '“17번 박예림 결석”이라고 복창하지 않은 채 다음 번호로 넘어갔습니다. 현장 연결이 끊겼습니다. 기록 중단.',
        A_LOOKAWAY: '17번 자리에서 시선을 놓쳤습니다. 현장 연결이 끊겼습니다. 기록 중단.',
        A_EYES: '눈을 한쪽씩 번갈아 감지 않았습니다. 현장 연결이 끊겼습니다. 기록 중단.',
        A_ANSWERED: '학생들의 말에 대답했습니다. 현장 연결이 끊겼습니다. 기록 중단.',
        A_MOVED: '움직였습니다. 현장 연결이 끊겼습니다. 기록 중단.',
        ISO_OPENED: '격리실 문을 스스로 열었습니다. 현장 연결이 끊겼습니다. 기록 중단.',
        E_DOOR_OPENED: '직접 문을 열어 주었습니다. 그 의미가 달라집니다. 절차의 의미가 바뀌어 기록이 중단되었습니다.',
        ROUTINE_BROKEN: '평소와 같은 수업 진행이 중단되었습니다. 현장 연결이 끊겼습니다. 기록 중단.',
        C_INCOMPLETE: '박예림 학생이 따라다니는 학생을 학생안전부로 안내하지 못했습니다. 현장 연결이 끊겼습니다. 기록 중단.',
        C_WRONG_STUDENT: '다른 학생을 학생안전부로 안내했습니다. 현장 연결이 끊겼습니다. 기록 중단.',
        D_STOPPED: '시험을 중단시켰습니다. 시험을 중단시키지 않아야 했습니다. 현장 연결이 끊겼습니다. 기록 중단.',
        D_NO_WARNING: '“시험 중에는 잡담 금지”라고 크게 말하지 않았습니다. 현장 연결이 끊겼습니다. 기록 중단.',
        D_UNSPRAYED: '시험 종료 후 방향제 SNS-0017을 두 번씩 뿌리지 않았습니다. 현장 연결이 끊겼습니다. 기록 중단.',
        CLOSING_ORDER: '모든 학생을 내보내기 전에 연락했습니다. 현장 연결이 끊겼습니다. 기록 중단.',
        CLOSING_UNRESOLVED: '17번 자리의 이상을 처리하지 않고 조례를 마쳤습니다. 현장 연결이 끊겼습니다. 기록 중단.',
        CLOSING_UNCHECKED: '17번 자리를 확인하지 않고 조례를 마쳤습니다. 현장 연결이 끊겼습니다. 기록 중단.',
        DESK_NEGLECTED: '17번 전용 책상과 의자를 깨끗하게 관리하지 않았습니다. 현장 연결이 끊겼습니다. 기록 중단.'
    },
    canonFailures: ['ATTEND_PRESENT', 'B_VANISHED']
};

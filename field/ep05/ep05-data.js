// EP05 Field data. Canon order: reviewed transcript -> 5화.txt (rule document, shown in the Story window) -> this data.
// The rule document is NOT duplicated here: the Field reads the same text from #darkwebReportWindowEP5 (reportSelector).
// Everything under `tuning`, `zones`, `kinds`, observation/answer lines and the non-canon failure texts is implementation
// tuning, NOT canon. `canonFailures` lists the codes whose text restates the reviewed transcript; every other failure is a
// minimal "record lost / procedure not met" result for outcomes the transcript does not state. Nothing about the nature of
// 애기소, 확보 개체 91번 검은 것, or 빨간 알약 is described here, and situation A (deleted in the source) has no event.
window.FieldEP05Data = {
    id: 'EP05', title: '살둔계곡 애기소',
    reportSelector: '#darkwebReportWindowEP5 textarea',
    // Named rolls so tests can force branches: targetZone, miss, kind (a string 'clean'|'numb'|'overstay'|'survivor' is accepted),
    // wetSide, cAt, cKind, dAt, reflect, spray, bind. Default is Math.random().
    random: name => Math.random(),
    startLog: '구조 요청이 접수되었다. 3인 1조 구조팀이 애기소 반경 500m 진입 지점에 있다.',
    restoredLog: '[복원] 진행 중이던 구조작전 기록을 복원했습니다.',
    clearText: '구조 기록 저장 / EP.06 연결 권한 갱신. 다음 현장은 연결 준비 중입니다.',
    tuning: {
        timer: 600,                       // canon: the stimulant works for exactly 10 minutes, counted from entering the 500 m radius
        travel: { 'edge-trail': 35, 'trail-woods': 40, 'woods-shore': 40 },
        carryFactor: 1.25,                // escorting the target is slower (tuning)
        look: 6, search: 15, secure: 8, askDuration: 12, askSymptom: 12, askTrace: 8,
        cAt: [90, 240], cWindow: 25,      // seconds after entering; response window for the sound
        dAt: [150, 380], dEmp: 5, dSeal: 12, dReport: 5,
        reflectChance: 0.6, fCells: 5, fWindow: 30,
        contact: { numb: 25, swelling: 70, expanding: 115, burst: 150, irritated: 2.5 },   // canon order compressed from ~30 hours
        urgeStep: 150
    },
    kinds: [['clean', 4], ['numb', 2], ['overstay', 2.5], ['survivor', 1.5]],
    zones: {
        edge: { name: '500m 경계', view: '500m 경계선이다. 이 선 안쪽이 애기소의 영향권이다.', video: 'movies/ep5_event_escape.mp4' },
        trail: { name: '계곡 길', view: '계곡을 따라 이어진 길이다. 바위와 숲이 이어진다.', video: 'movies/ep5_idle.mp4' },
        woods: { name: '숲', view: '숲이 우거져 있다. 나뭇가지 사이로 아래쪽 바위와 웅덩이처럼 보이는 곳이 내려다보인다.', video: 'movies/ep5_idle.mp4' },
        shore: { name: '애기소 가장자리', view: '바위 사이로 웅덩이처럼 보이는 표면이 펼쳐져 있다.', video: 'movies/ep5_idle.mp4' }
    },
    neighbours: { edge: ['trail'], trail: ['edge', 'woods'], woods: ['trail', 'shore'], shore: ['woods'] },
    video: {
        briefing: 'movies/ep5_event_escape.mp4',   // three people in white suits walking through the forest (verified frame)
        hand: 'movies/ep5_event_water.mp4',        // a hand rising from a dark forest pond (used when the target is found at the pond)
        sound: 'movies/ep5_event_cry.mp4',         // dark forest, a standing silhouette and a bright stream (used while the sound is heard)
        surface: 'movies/ep5_event_mirror.mp4'     // dark pond surface with a small figure (used for the moving reflection)
    },
    equipment: ['각성제', '빨간 알약', '소형 EMP 폭탄', '확보 개체 91번 검은 것', '통신 장비'],
    text: {
        briefing: lastSeen => `구조 요청 접수: 대상자 1명(신고자 또는 최면 의심자). 마지막 확인 위치는 ${lastSeen} 부근이다.\n구조팀은 3인 1조다. 수칙 문서를 확인하십시오.`,
        equip: '[장비 점검] 각성제, 빨간 알약, 소형 EMP 폭탄, 확보 개체 91번 검은 것, 통신 장비를 지참했다.',
        inject: '[각성제] 구조팀 3인 전원에게 각성제를 주입했다.',
        enter: '[진입] 반경 500m 안으로 들어섰다.',
        look: {
            edge: '[주변] 500m 경계선이다. 안쪽으로 길이 이어진다.',
            trail: '[주변] 계곡 길이다. 바위 틈과 숲 사이로 길이 이어진다.',
            woods: wet => `[주변] 숲이 우거져 있다. 아래쪽 애기소 가장자리로 내려가는 길이 두 갈래다. ${wet === 'L' ? '왼쪽' : '오른쪽'} 길에는 젖은 것처럼 보이는 표면이 닿아 있다.`,
            shore: wet => `[주변] 웅덩이처럼 보이는 표면이 펼쳐져 있다. 숲으로 올라가는 길은 두 갈래다. ${wet === 'L' ? '왼쪽' : '오른쪽'} 길에는 젖은 것처럼 보이는 표면이 닿아 있다.`
        },
        searchNone: '[수색] 대상자는 보이지 않는다.',
        found: '[수색] 대상자를 발견했다.',
        secure: '[확보] 대상자를 확보했다. 확보 즉시 확인할 것이 있다.',
        durationAnswer: kind => `[대상자 진술] 각성제 없이 반경 안에 머문 시간: ${kind === 'clean' || kind === 'numb' ? '약 5분이다.' : '약 40분이다.'}`,
        symptomAnswer: kind => kind === 'numb' ? '[저림 확인] 접촉했다고 느끼는 부위에 경미한 저림이 있다.'
            : kind === 'survivor' ? '[저림 확인] 증상은 없다. 접촉한 지 30시간이 넘었지만 아직 살아 있다는 진술이다.'
            : '[저림 확인] 저림 등 증상은 전혀 없다.',
        traceAnswer: '[접촉 흔적 확인] 겉으로 드러나는 흔적은 확인되지 않는다.',
        bind: '[대상자] 발목이 부어오른다며 단단히 묶어 달라고 한다.',
        declined: '[대상자] 요구를 들어주지 않았다.',
        verdictTransport: '[판단] 접촉 전 단계로 판단했다. B급 정신 치료 시설로 후송한다.',
        verdictReport: '[판단] 이미 고체에 접촉한 것으로 간주한다. 규칙 1의 보고 절차에 따라 처리한다.',
        protocolAsk: '[격리] 접촉한 지 30시간이 지나도 살아 있는 접촉자다.',
        protocolDone: '[격리] 격리실에 비상 프로토콜 A 완전 격리 시스템을 적용한다.',
        urge: ['[충동] 애기소의 모습이 머릿속에 떠오른다.', '[충동] 가야만 한다는 생각이 떠나지 않는다.', '[충동] 발이 애기소 쪽으로 향한다. 각성제가 아직 듣고 있다.'],
        sound: ['[소리] 각성제를 주입했는데도 아기의 울음소리가 들린다.', '[소리] 각성제를 주입했는데도 아이의 웃음소리가 들린다.'],
        pill: '[빨간 알약] 즉시 복용했다.',
        devAlert: '[통신 장비] 애기소의 소리가 담긴 녹음 또는 영상 파일이 확보되어 있다. 재생 대기 상태다.',
        devPlayBlocked: '[재생 차단] ▁▂▃▅▇▅▃▂▁ 소리는 전달되지 않는다.',
        devEmp: '[소형 EMP 폭탄] 사용했다.',
        devSeal: '[밀폐] 해당 장비와 구역을 완전 밀폐 처리했다.',
        devReport: '[본부 보고] 장비와 구역의 밀폐 처리를 보고했다.',
        reflect: '[웅덩이 표면] 표면에 비친 내 모습이 내 움직임과 다르게 스스로 움직인다.',
        spray: '[확보 개체 91번 검은 것] 방사했다.',
        sprayPartial: '[웅덩이 표면] 비친 모습의 일부가 가려졌다. 아직 남아 있다.',
        sprayDone: '[웅덩이 표면] 비친 모습이 완전히 사라졌다.',
        move: dest => `[이동] ${dest}(으)로 이동한다.`,
        arrive: dest => `[도착] ${dest}.`,
        contactTouch: '[접촉] 신발이 표면에 스쳤다. 물에 젖듯 그대로 스며든다.',
        contactStages: { numb: '[접촉 부위] 경미한 저림이 느껴진다.', swelling: '[접촉 부위] 부종이 시작된다.', expanding: '[신체] 전신이 팽창하기 시작한다.' },
        rub: '[접촉 부위] 문질렀다. 자극을 받은 부위의 팽창이 더 빠르게 진행된다.',
        wash: '[접촉 부위] 씻어냈다. 자극을 받은 부위의 팽창이 더 빠르게 진행된다.',
        exitTransport: '[이탈] 반경 500m 밖으로 벗어났다. 대상자를 B급 정신 치료 시설로 후송했다.',
        exitReport: '[이탈] 반경 500m 밖으로 벗어났다. 대상자를 접촉자로 보고했다. 보고된 인원은 고통 없는 마지막이 가능한 시설로 이송된다.',
        exitIsolate: '[이탈] 반경 500m 밖으로 벗어났다. 대상자를 격리실로 인계해 비상 프로토콜 A 완전 격리 시스템이 적용되었다.'
    },
    failures: {
        TIME_OUT: '각성제의 효력이 끝났습니다. 10분을 초과하여 반경 내에 머무른 인원은 최면에 완전히 잠식되어 스스로 애기소를 향해 걸어 들어가며 이는 어떤 방법으로도 저지가 불가능했습니다.',
        CONTACT_PROGRESSION: '접촉 부위의 저림, 부종, 전신 팽창을 거쳐 파열음과 함께 사망했습니다.',
        CONTACT_PRESSURE: '팽창이 시작된 부위에 외부 압력이 가해졌습니다. 외부 압력이 가해진 부위는 즉발적으로 팽창, 파열이 진행됩니다.',
        CONTACT_REPORTED: '접촉을 확인하고 즉시 구조 요원에게 보고했습니다. 접촉자에 대한 치료법은 없으나 보고된 인원은 고통 없는 마지막이 가능한 시설로 이송됩니다.',
        TARGET_PRESSURE: '팽창이 시작된 부위에 외부 압력이 가해졌습니다. 외부 압력이 가해진 부위는 즉발적으로 팽창, 파열이 진행됩니다.',
        C_UNRESOLVED: '각성제 주입 후에도 들려온 소리에 대응하지 못했습니다. 2021년 통제 인원 전원이 사망한 원인으로 지목된 소리와 동일한 유형입니다.',
        D_PLAYED: '소리가 담긴 파일을 재생했습니다. 녹음, 녹화된 형태로 재생되어도 실제 노출과 동일하게 치명적입니다.',
        F_INCOMPLETE: '자신의 모습을 완전히 지우지 못했습니다. 자신의 모습을 완전히 지우지 못한 대상자는 반드시 애기소로 가게 되는 사례가 다수 확인되었습니다.',
        NO_STIMULANT: '각성제를 주입받지 않고 반경 500m 안으로 진입했습니다. 작전 기록이 무효 처리되었습니다. 기록 확보 불가.',
        TARGET_CONTACTED: '확보한 대상자가 애기소 표면에 접촉했습니다. 접촉자에 대한 치료법은 현재까지 파악되지 않았습니다.',
        E_MISJUDGED: '대상자의 상태를 규칙과 다르게 판단했습니다. 현장 연결이 끊겼습니다. 기록 확보 불가.',
        E_UNCHECKED: '확인 절차를 마치지 않은 채 대상자를 처리했습니다. 현장 연결이 끊겼습니다. 기록 확보 불가.',
        B_RECOVERY: '30시간 경과 시점까지 생존한 접촉자를 회복으로 판단했습니다. 이는 회복이 아닌 몸 내부에 애기소의 고체가 침투한 경우입니다.',
        B_NOT_ISOLATED: '30시간 경과 시점까지 생존한 접촉자를 완전 격리하지 않았습니다. 최대 3일 이내 무작위 시간에 몸이 폭발하며 내부의 고체가 반경 50m 밖까지 흩뿌려지는 사례가 확인되었습니다.',
        D_ORDER: '소형 EMP 폭탄, 밀폐 처리, 본부 보고의 순서를 지키지 않았습니다. 현장 연결이 끊겼습니다. 기록 확보 불가.',
        D_UNSEALED: '소리가 담긴 장비와 구역을 격리하지 않은 채 이탈했습니다. 현장 연결이 끊겼습니다. 기록 확보 불가.',
        CONTACT_UNREPORTED: '접촉을 보고하지 않은 채 이탈했습니다. 접촉을 확인한 즉시 구조 요원에게 보고해야 합니다. 기록 확보 불가.',
        ABORTED: '대상자를 확보하지 못한 채 반경 밖으로 이탈했습니다. 구조 실패.'
    },
    canonFailures: ['TIME_OUT', 'CONTACT_PROGRESSION', 'CONTACT_PRESSURE', 'CONTACT_REPORTED', 'TARGET_PRESSURE', 'C_UNRESOLVED', 'D_PLAYED', 'F_INCOMPLETE', 'B_RECOVERY', 'B_NOT_ISOLATED']
};

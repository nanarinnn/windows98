// EP09 Field data. Canon order: reviewed transcript (docs/transcripts/reviewed/EP09_안전_안내_문자.txt; the source states
// no document number) -> 9화.txt (rule document, shown in the Story window) -> this data. 9화-안전안내문자_original.txt is
// NOT a gameplay source. The rule document is NOT duplicated here: the Field reads the same text from
// #darkwebReportWindowEP9 (reportSelector) and shows it as the 안전 안내 문자 thread on the Field phone.
// The Field phone is its own system: it never reads or writes the Story PDA (#mobile-phone-view, phoneCurrentPhase...).
// Canon facts used as rules: situations A~L in transcript order with E deleted, the 3-minute billing limit and its amount
// table, the fifth scream, permissions (not deletion) for the unknown app, flashlight + photo for the crawling sound,
// the opposite-direction zoomed photo sent three times, a 5-minute face video, the auto-playing video, 0050-0200 asking
// for your location, the third verification code typed into the safety text, battery -> shorter interval, 0% = unknown.
// Everything under `tuning`, the phone numbers/amounts/app names/codes and the non-canon failure texts is
// implementation tuning/presentation, NOT canon. `canonFailures` lists the codes whose text restates a consequence the
// reviewed transcript states; every other failure is a minimal "record interrupted" result.
window.FieldEP09Data = {
    id: 'EP09', title: '안전 안내 문자',
    reportSelector: '#darkwebReportWindowEP9 textarea',
    // Named rolls so tests can force branches. Default Math.random(). Names: aAnswer (<.5 = the callee picks up),
    // bill (tier index 0-4), fApp, fIcon, gDir, h1/h2/h3 (photo angle index), jWho, code1/code2/code3, rescue, repeat.
    random: name => Math.random(),
    startLog: '[안전 안내 문자] 특별재난관리본부. 귀하는 금일 수신한 통화로 관리 대상자로 분류되었습니다.',
    clearText: '구출 완료 · 요원 도착 확인. EP.10 연결 권한 갱신. 다음 현장은 연결 준비 중입니다.',
    order: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'],
    // While the rescue is under way the existing rules keep applying: these situations can come back.
    repeatPool: ['A', 'C', 'D'],
    tuning: {
        startBattery: 72, drainIdle: 0.12, drainLight: [0, 0.12, 0.24, 0.4], drainRecord: 0.2,
        gapMax: 9, gapMinRatio: 0.3, gapFloor: 2, firstGap: 3,
        callbackLimit: 25, ringBeforeAnswer: 2, noAnswerRing: 3, hangupLimit: 4,
        stareStart: 3, stareHold: 6, lookAwayGrace: 0.6,
        billLimit: 30,
        screamLen: 1.4, screamGap: 1.6,
        permLimit: 45,
        crawlStep: 2.5, startDistance: 6, reach: [0, 2, 4, 6],
        photoGap: 12, zoomNeeded: 2,
        shutterGap: 2, iStartLimit: 40, selfieLen: 12,
        jLen: 16, kRing: 8, kSmsWait: 8, codeGap: 4,
        rescueMin: 18, rescueMax: 36
    },
    clockStart: 23 * 60 + 12,   // phone clock at dispatch (presentation)
    secondsPerMinute: 5,
    missedNumbers: ['010-4127-0913', '010-8840-2716'],   // [0] first A, [1] when A comes back during the rescue
    hqNumber: '0050-0200',
    // C: amounts sit inside the transcript's brackets. tierOf() maps any amount to the bracket.
    bills: [9800, 18700, 27400, 46200, 53000],
    billParts: ['왼쪽 귀', '양쪽 귀와 오른쪽 엄지발가락', '머리카락과 양손의 손톱', '왼손, 오른발', '해당 정보는 검열되었습니다.'],
    tierOf: amount => amount <= 10000 ? 0 : amount <= 20000 ? 1 : amount <= 30000 ? 2 : amount < 50000 ? 3 : 4,
    contacts: [{ name: '엄마', number: '010-2231-4808' }, { name: '아빠', number: '010-7719-2045' }, { name: '동생', number: '010-5530-1172' }, { name: '회사', number: '02-6941-3300' }],
    apps: [
        { id: 'phone', name: '전화', icon: '📞' }, { id: 'messages', name: '문자', icon: '💬' }, { id: 'settings', name: '설정', icon: '⚙️' },
        { id: 'camera', name: '카메라', icon: '📷' }, { id: 'photos', name: '사진', icon: '🖼️' }, { id: 'video', name: '동영상', icon: '🎞️' },
        { id: 'flashlight', name: '손전등', icon: '🔦' }, { id: 'memo', name: '메모', icon: '📝' }, { id: 'clock', name: '시계', icon: '⏰' }
    ],
    // F: a meaningless name or letters+digits; the icon copies one of the normal apps so the name is the only tell.
    strangeNames: ['x7Qe0b2', 'q0vR2nL', 'ㅁㄹㅇㄴㅡ', 'k8zT1wa'],
    strangeIcons: ['📷', '💬', '🖼️', '📝'],
    perms: ['마이크', '카메라', '연락처', '전화', '위치'],
    dirs: { front: '앞', left: '왼쪽', right: '오른쪽', back: '뒤' },
    opposite: { front: 'back', back: 'front', left: 'right', right: 'left' },
    angles: ['back', 'left', 'right', 'front'],
    jWho: ['엄마', '아빠', '동생'],
    jRequests: [
        { id: 'call', text: who => `영상 속 ${who}: "왜 연락이 안 돼? 지금 바로 전화해 줘."` },
        { id: 'reply', text: who => `영상 속 ${who}: "이거 보면 답장해 줘."` },
        { id: 'move', text: who => `영상 속 ${who}: "지금 있는 데서 나와서 이쪽으로 와 줘."` },
        { id: 'location', text: who => `영상 속 ${who}: "네 위치 보내 줘."` }
    ],
    video: { b: 'movies/ep9_event_video.mp4' },
    text: {
        missedSms: (n, time) => `[부재중 통화 안내] ${n} 에서 ${time}에 부재중 전화가 1건 있습니다.`,
        dialing: n => `[전화] ${n} 발신 중.`,
        noAnswer: '[전화] 연결되지 않았다. 발신 기록이 남았다.',
        picked: '[전화] 상대가 받았다. 수화기 너머로 아무 말도 들리지 않는다.',
        hungUp: '[전화] 통화를 종료했다. 발신 기록이 남았다.',
        otherCall: n => `[전화] ${n} 발신. 아무도 받지 않는다.`,
        videoCall: '[영상 통화] 영상 통화가 걸려 온다. 수신 화면에 영상이 이미 재생되고 있다. 유리에 얼굴을 바짝 붙인, 눈이 기괴하게 큰 남자가 이쪽을 보고 있다.',
        staring: '[영상 통화] 남자의 눈을 응시한다.',
        videoCallEnd: '[영상 통화] 화면이 꺼졌다. 영상 통화가 끊겼다.',
        billSms: amount => `[통신사] 고객님의 이번 달 이용 요금 ${amount.toLocaleString()}원이 미납되었습니다. 즉시 납부를 이용해 주십시오.`,
        billPaid: amount => `[통신사] ${amount.toLocaleString()}원 납부가 완료되었습니다.`,
        screamCall: '[전화] 전화가 온다. 수신음 대신 비명 소리가 울린다.',
        scream: '[전화] 비명.',
        screamFamiliar: '[전화] 비명. 어디선가 들어 본 듯한 목소리다.',
        screamCut: '[전화] ……끊겼다.',
        rejected: '[전화] 수신 거절. 비명이 멎었다.',
        eDeleted: '확인된 비정상 상황 E.\n[해당 항목은 삭제되었습니다.]',
        appSeen: '[홈] 홈 화면 앱 배치가 조금 달라진 것 같다.',
        appPermOff: (name, perm) => `[설정] ${name} — ${perm} 권한 해제.`,
        appPermOn: (name, perm) => `[설정] ${name} — ${perm} 권한 허용.`,
        appAllOff: name => `[설정] ${name}의 모든 권한을 해제했다.`,
        appCannotOpen: '[홈] 앱이 열리지 않는다. 화면이 잠깐 깜빡였다.',
        appSystem: '[설정] 기본 앱은 삭제할 수 없습니다.',
        dark: '[주변] 불이 나갔다. 조명이 하나도 없다.',
        crawl: dir => `[주변] ${dir}에서 바닥을 긁으며 무언가 기어오는 소리.`,
        closer: dir => `[주변] ${dir}에서 소리가 가까워진다.`,
        lit: '[주변] 빛이 닿았다. 소리가 멈췄다.',
        lightOff: '[주변] 빛이 닿지 않는다.',
        gShot: '[카메라] 빛 속에 웅크린 그것이 사진에 정확히 찍혔다. 기어오는 소리가 그쳤다. 불이 다시 들어왔다.',
        darkShot: '[카메라] 어둠만 찍혔다.',
        hPhoto: (n, angle, dist) => `[미상의 번호] (사진) ${n}번째 사진. 나를 ${angle}에서 찍은 사진이다. 촬영 거리 약 ${dist}m.`,
        hFixed: '[카메라] 무언가가 사진 안에 찍혔다. 그것은 사진 안에 고정되었다.',
        hMiss: '[카메라] 아무것도 찍히지 않았다.',
        shutter: '[카메라] 찰칵.',
        recStart: lens => lens === 'front' ? '[카메라] 동영상 촬영 시작. 화면에 내 얼굴이 보인다.' : '[카메라] 동영상 촬영 시작.',
        recStop: t => `[카메라] 동영상 촬영 종료 (${t}).`,
        recShort: '[카메라] 셔터 소리가 멈추지 않는다.',
        recDone: '[카메라] 동영상이 저장되었다. 셔터 소리가 멈췄다.',
        recNoFace: '[카메라] 화면에 내 얼굴이 없다. 셔터 소리가 계속된다.',
        jStart: '[동영상] 동영상 파일이 스스로 실행된다.',
        jRerun: '[동영상] 닫았던 동영상이 다시 스스로 실행된다.',
        jEnd: '[동영상] 영상이 끝났다.',
        jClosed: '[동영상] 영상을 닫았다.',
        kCall: n => `[전화] ${n} 에서 전화가 온다.`,
        kVoice: '[전화] "특별재난관리본부 요원입니다. 구조를 위해 지금 계신 위치를 말씀해 주십시오."',
        kHangUp: '[전화] 아무 말 없이 통화를 종료했다.',
        kSms: n => `[${n}] 요원입니다. 구조를 위해 현재 위치를 보내 주십시오.`,
        kQuiet: '[문자] 더 이상 문자가 오지 않는다.',
        code: (sender, code) => `[${sender}] 본인 확인 인증번호 [${code}]를 입력해 주세요.`,
        codeBad: '[안전 안내 문자] 인증 번호가 정확하지 않습니다.',
        rescueStart: '[안전 안내 문자] [구조 작업 진행 중] [위치 확인 완료]',
        rescueKeep: '[안전 안내 문자] 요원이 도착할 때까지 위 사항을 계속하여 지켜 주십시오.',
        rescued: '[안전 안내 문자] 특별재난관리본부. 요원이 도착했습니다. 구출 작업을 완료합니다.',
        replySent: '[문자] 답장을 보냈다.',
        lowBattery: n => `[배터리] 잔량 ${n}%.`
    },
    codeSenders: ['웹발신', '인증센터', 'Verify'],
    failures: {
        A_NO_CALL: '부재중 통화 안내 문자에 기재된 번호로 발신하지 않았습니다. 발신하지 않은 번호의 주인은 어떤 형태로든 익일 다양한 형태로 사망하는 사례가 다수 확인되었습니다.',
        A_SPOKE: '받은 상대에게 말을 했습니다. 현장 연결이 끊겼습니다. 기록 중단.',
        A_LINGER: '상대가 받은 통화를 즉시 종료하지 않았습니다. 현장 연결이 끊겼습니다. 기록 중단.',
        B_ANSWER: '이미 영상이 재생되고 있는 영상 통화를 받았습니다. 현장 연결이 끊겼습니다. 기록 중단.',
        B_REJECT: '이미 영상이 재생되고 있는 영상 통화를 거절했습니다. 현장 연결이 끊겼습니다. 기록 중단.',
        B_LOOKAWAY: '화면 속 남자의 눈에서 시선을 돌렸습니다. 시선을 돌린 대상자는 어딜 봐도 그 남자의 얼굴이 보인다는 말을 반복하다, 원인 불명의 쇼크로 사망하는 사례가 확인되었습니다.',
        C_UNPAID: part => `요금 미납 안내 문자를 수신하고 3분 이내에 결제를 완료하지 않았습니다. 미납 금액에 따라 귀하의 신체로 대신 납부됩니다. — ${part}`,
        D_ANSWER: '비명 소리로 울리는 전화를 받았습니다. 양쪽 고막이 완전히 파열되어 청각을 상실한 사례가 확인되었습니다.',
        D_SIXTH: '여섯 번째 비명을 들었습니다. 양쪽 고막이 완전히 파열되어 청각을 상실한 사례가 확인되었습니다.',
        D_EARLY: '다섯 번째 비명이 끊기기 전에 수신을 거절했습니다. 현장 연결이 끊겼습니다. 기록 중단.',
        F_DELETE: '설치한 적 없는 앱을 삭제하려 했습니다. 현장 연결이 끊겼습니다. 기록 중단.',
        F_KEPT: '설치한 적 없는 앱의 권한이 유지되었습니다. 수집된 음성은 귀하의 지인에게 발신하는 데 사용되며 해당 통화를 받고 이동한 이들이 실종되는 사례가 확인되었습니다.',
        G_REACHED: '기어오는 그것이 귀하에게 닿았습니다. 현장 연결이 끊겼습니다. 기록 중단.',
        H_MISSING: '세 번째 사진까지 그것을 촬영하지 못했습니다. 네 번째 사진이 전송되었으며 이와 동시에 대상자는 실종됩니다. 네 번째 사진에는 실종된 대상자의 얼굴이 담겨 있으며 그 표정이 실시간으로 일그러지고 있는 사례가 확인되었습니다.',
        H_DELETED: '그것이 고정된 사진을 삭제했습니다. 현장 연결이 끊겼습니다. 기록 중단.',
        I_VIEWED: '저장된 사진과 동영상을 확인했습니다. 현장 연결이 끊겼습니다. 기록 중단.',
        I_NO_VIDEO: '셔터 소리가 반복되는 동안 얼굴을 동영상으로 촬영하지 않았습니다. 현장 연결이 끊겼습니다. 기록 중단.',
        J_CONTACT: '동영상의 요구에 따라 연락했습니다. 확인을 위한 연락이 오히려 그들을 위험한 상황에 처하도록 하는 사례가 다수 있었습니다.',
        J_MOVE: '동영상의 요구에 따라 위치를 옮겼습니다. 해당 파일은 실제가 아닙니다. 현장 연결이 끊겼습니다. 기록 중단.',
        J_SEND_LOC: '동영상의 요구에 따라 위치를 보냈습니다. 해당 파일은 실제가 아닙니다. 현장 연결이 끊겼습니다. 기록 중단.',
        K_LOCATION: '0050-0200으로 요원이라 하는 상대에게 위치를 알렸습니다. 그들은 본부의 요원이 아닌 개체로 인한 피해 규모를 늘리는 테러리스트 세력입니다. 현장 연결이 끊겼습니다. 기록 중단.',
        NO_DATA: 'SIGNAL LOST — NO DATA. 휴대전화 배터리 잔량이 완전히 소진되었습니다. 잔량이 완전히 소진된 대상자에 대한 정보는 파악하지 못했습니다.'
    },
    canonFailures: ['A_NO_CALL', 'B_LOOKAWAY', 'C_UNPAID', 'D_ANSWER', 'D_SIXTH', 'F_KEPT', 'H_MISSING', 'J_CONTACT', 'NO_DATA']
};

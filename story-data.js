// ==========================================
// Story Data: 단서(CLUES) / 추리 연결(DEDUCTIONS)
// 원칙: quote 는 에피소드 원문(N화.txt, 요원 제이 기록)에 있는 문장을 한 글자도 바꾸지 않고 그대로 인용한다.
//       새로운 서사는 만들지 않는다. 연결(link)은 두 원문이 공유하는 키워드만 표시한다.
// 획득 시점(when): 'read' = 해당 수칙 문서를 열었을 때 / 'clear' = 해당 에피소드 클리어 시 / 'jay' = 요원 제이의 기록을 열었을 때
// ==========================================
const EPISODE_TITLES = {
    1: '부산 태양해안',
    2: '서울 심야 2호선',
    3: '베리 해피 종합병원',
    4: '13층 엘리베이터',
    5: '살둔계곡 애기소',
    6: '청림고등학교 2학년 3반 17번',
    7: '나눔 12시 편의점',
    8: '유성 워터파크',
    9: '안전 안내 문자',
    10: '인어왕국 행복 공장',
    J: '요원 제이의 기록'
};

// 문서 번호 (출처 표기용, 원고 헤더 그대로)
const EPISODE_DOCS = {
    1: '해안관리-2019-031',
    2: '순환관리-2021-014호',
    3: '2023-063호',
    4: '2026-013호',
    5: '2024-06-02',
    6: '2021-05-20',
    7: '2026-07-19',
    8: '워터파크-2021-08-YWP',
    9: '긴급통신-2026-EMERGENCY-SMS',
    10: '완구회수-216-091호'
    // 요원 제이의 기록은 문서 번호가 없는 일기다 (HQ-JAY-2019-FINAL 은 원문에 없는 사이트 창작 번호였음)
};

// 원본 영상 (채널 @유연괴담 의 각 에피소드 영상)
const CHANNEL_URL = 'https://www.youtube.com/@%EC%9C%A0%EC%97%B0%EA%B4%B4%EB%8B%B4';
const EPISODE_VIDEOS = {
    1: 'https://www.youtube.com/watch?v=JMSXv8ATalc',
    2: 'https://www.youtube.com/watch?v=qR5e_CYTQ3M',
    3: 'https://www.youtube.com/watch?v=H54eE_QvAJE',
    4: 'https://www.youtube.com/watch?v=wO6L-9C-k_I',
    5: 'https://www.youtube.com/watch?v=yB23KA2zE9A',
    6: 'https://www.youtube.com/watch?v=k4s5SHJvnsQ',
    7: 'https://www.youtube.com/watch?v=KE0uAJk1PYs',
    8: 'https://www.youtube.com/watch?v=n1ehuElD2UI',
    9: 'https://www.youtube.com/watch?v=YoxKoZTX3og',
    10: 'https://www.youtube.com/watch?v=VFnaLen5UIA'
};

// [중요] CLUES / DEDUCTIONS / ACHIEVEMENTS 는 "맨 뒤에만 추가"한다.
// 세이브 코드는 이 배열의 순서(인덱스)로 진행 상황을 압축하므로, 중간에 끼워 넣거나 순서를 바꾸면 기존 세이브가 어긋난다.
const CLUES = [
    // ---- EP.01 ----
    { id: 'c01-founded', ep: 1, when: 'read', tags: ['2019'],
      quote: "본 문서는 2019년 최초 작성 이후 2회 개정되었습니다." },
    { id: 'c01-remains', ep: 1, when: 'read', tags: ['기장군'],
      quote: "사망자의 유해는 공통적으로 새벽 3시에서 5시 사이 기장군 해안 일대에서 발견된다." },
    { id: 'c01-blink', ep: 1, when: 'clear', tags: ['한쪽 눈씩 번갈아 감기'],
      quote: "눈을 깜빡여야 하는 경우 한쪽 눈씩 번갈아 감으십시오." },
    { id: 'c01-noturn', ep: 1, when: 'clear', tags: ['뒤돌아보지 말 것'],
      quote: "낚시꾼을 목격했을 시 그 어떠한 경우에도 뒤돌아서지 마십시오." },

    // ---- EP.02 ----
    { id: 'c02-others', ep: 2, when: 'read', tags: ['비정상 개체로 간주'],
      quote: "열차 내 귀하 외의 모든 인원은 비정상 개체로 간주합니다." },
    { id: 'c02-remains', ep: 2, when: 'read', tags: [],
      quote: "유해는 공통적으로 오전 4시에서 5시 30분 사이 순환선 역사 및 선로 일대에서 발견된다." },
    { id: 'c02-feed', ep: 2, when: 'clear', tags: [],
      quote: "기관실 출입 카드는 이들 중 한 명이 소지하고 있습니다." },

    // ---- EP.03 ----
    { id: 'c03-rescue', ep: 3, when: 'read', tags: ['요원'],
      quote: "구조 요원이 편입일로부터 늦어도 7일 차에 반드시 도착합니다." },
    { id: 'c03-pill', ep: 3, when: 'read', tags: ['빨간 알약'],
      quote: "해당 알약은 즉발적 효과를 갖는 치사량의 합성 펜타닐 화합물입니다." },
    { id: 'c03-surgery', ep: 3, when: 'clear', tags: ['수술'],
      quote: "통증을 호소한 환자는 수술 예정일이 앞당겨집니다." },
    { id: 'c03-meri', ep: 3, when: 'clear', tags: ['병원'],
      quote: "베리 정신병원으로 입원된 환자는 그 어떤 정보도 파악이 불가능했으며 해당 병원으로는 그 어떤 구조도 불가능함을 명심해 주십시오." },

    // ---- EP.04 ----
    { id: 'c04-lies', ep: 4, when: 'read', tags: [],
      quote: "후면 거울에 비친 숫자만이 진짜입니다." },
    { id: 'c04-mirror', ep: 4, when: 'read', tags: ['거울'],
      quote: "후면 거울을 볼 때마다 그녀는 반대쪽 측면 거울에 비치며 조금씩 다가옵니다." },
    { id: 'c04-stop', ep: 4, when: 'clear', tags: [],
      quote: "1층에서는 반드시 정차합니다." },

    // ---- EP.05 ----
    { id: 'c05-annual', ep: 5, when: 'read', tags: [],
      quote: "강원도 홍천군 살둔계곡 내 애기소는 매년 150명가량의 인명 피해가 발생하는 극도로 위험한 곳입니다." },
    { id: 'c05-red', ep: 5, when: 'clear', tags: ['빨간 알약'],
      quote: "빨간 알약을 즉시 복용하십시오." },
    { id: 'c05-rights', ep: 5, when: 'clear', tags: [],
      quote: "당신은 고통받지 않을 권리가 있습니다." },

    // ---- EP.06 ----
    { id: 'c06-yerim', ep: 6, when: 'read', tags: ['2019', '기장군'],
      quote: "2019년 청림고등학교 2학년 3반 17번 박예림 학생이 수학여행 부산광역시 기장군 태양해안 중 실종되었다." },
    { id: 'c06-virtual', ep: 6, when: 'read', tags: [],
      quote: "이후 17번을 결번으로 두는 것 자체가 학급 전체를 위험에 빠뜨린다는 사실이 확인되었다." },
    { id: 'c06-eyes', ep: 6, when: 'clear', tags: ['한쪽 눈씩 번갈아 감기'],
      quote: "눈을 감아야 한다면 한쪽씩 번갈아 감으십시오." },

    // ---- EP.07 ----
    { id: 'c07-others', ep: 7, when: 'read', tags: ['비정상 개체로 간주'],
      quote: "근무 중 마주치는 모든 손님은 비정상 개체로 간주합니다." },
    { id: 'c07-hq', ep: 7, when: 'read', tags: ['본부(0050-0200)'],
      quote: "결제 시 화면 상단에 상품명이 뜨지 않고 빈칸이나 코드만 표시된다면 즉시 본부 0050-0200으로 말씀해 주십시오." },
    { id: 'c07-mirror', ep: 7, when: 'clear', tags: ['거울'],
      quote: "카드 결제기 화면을 보는 척하며 시선만 짧게 거울로 옮기십시오." },

    // ---- EP.08 ----
    { id: 'c08-surgery', ep: 8, when: 'read', tags: ['수술'],
      quote: "도착 지점이 아닌 지하 수술실로 이송되었으며 마취 없이 개복된 상태로 발견된 사례가 확인되었습니다." },
    { id: 'c08-ask', ep: 8, when: 'clear', tags: ['수술'],
      quote: "식사 도중 직원이 다가와 \"언제 수술이십니까?\"라고 묻는 경우 반드시 \"오늘은 아닙니다\"라고만 답하십시오." },
    { id: 'c08-character', ep: 8, when: 'clear', tags: [],
      quote: "인솔 직원 없이 혼자 돌아다니는 캐릭터를 발견하셨다면 절대 접근하지 마십시오." },

    // ---- EP.09 ----
    { id: 'c09-all', ep: 9, when: 'read', tags: ['비정상 개체로 간주'],
      quote: "이후 본 문자를 제외한 휴대 전화로 연락이 오는 모든 것을 비정상 개체로 간주합니다." },
    { id: 'c09-fake', ep: 9, when: 'read', tags: ['본부(0050-0)', '요원'],
      quote: "본부의 전화번호 0050-0으로 요원이라 하며 귀하의 위치를 물어오는 경우 본부는 대상자가 된 이들의 현재 위치를 즉시 파악 가능한 시스템을 구축하여 항시 대비하고 있습니다." },
    { id: 'c09-rescue', ep: 9, when: 'clear', tags: ['구출'],
      quote: "인증번호가 정확히 전송되어야만 구출 작업이 가능합니다." },

    // ---- EP.10 ----
    { id: 'c10-purpose', ep: 10, when: 'read', tags: [],
      quote: "본 문서는 폐업한 인어왕국 행복 공장에서 생산되어 시중에 남은 인어왕자를 통한 편입 사례에 대한 대응 안내입니다." },
    { id: 'c10-noturn', ep: 10, when: 'clear', tags: ['뒤돌아보지 말 것'],
      quote: "노래가 끝나기 전에 뒤를 돌아본 작업자는 자신의 사물함 안에 여덟 각으로 접힌 채 발견되었습니다." },
    { id: 'c10-voice', ep: 10, when: 'clear', tags: [],
      quote: "네 번째 대사에서 \"여기서 살아줄 거지\"가 재생되는 사례가 가장 많습니다. 반드시 \"친구가 되어 줄 거지\"라고 정정하십시오." },
    { id: 'c10-wrist', ep: 10, when: 'clear', tags: ['손목'],
      quote: "오른쪽 손목 안쪽에는 탈의실의 네 자리 사물함 번호가 피부 안쪽으로 눌린 것처럼 남으며 그 현상을 제거한 사례는 확인되지 않았습니다." },

    // ---- 요원 제이의 기록 (히든, 원문 일기) ----
    { id: 'cJ-date', ep: 'J', when: 'jay', tags: ['2019'],
      quote: "2019년 12월 6일." },
    { id: 'cJ-visit', ep: 'J', when: 'jay', tags: ['병원'],
      quote: "기장 앞바다에서의 임무 중 중상을 입은 동료 요원 제트를 면회하기 위해 갔던 비급 의료 시설 베리 해피 병원에서" },
    { id: 'cJ-hq', ep: 'J', when: 'jay', tags: ['요원'],
      quote: "\"본부\"라는 말도 \"요원\"이라는 말도 알아듣지 못한 채 처음 듣는 단어를 흉내 내듯 되뇌기만 했으나" },
    { id: 'cJ-subject', ep: 'J', when: 'jay', tags: ['회진'],
      quote: "문제는 대답의 내용이 아니라 주어였다." },
    { id: 'cJ-newpatient', ep: 'J', when: 'jay', tags: [],
      quote: "오늘 아침 우리 병동에 새로운 환자가 들어왔다." },

    // ---- 추가 (세이브 코드 호환을 위해 맨 뒤에만 추가) ----
    { id: 'c06-bus', ep: 6, when: 'read', tags: [],
      quote: "탑승객 26명 전원이 사흘간 발견되지 않았고 사흘 뒤 그중 13명만이 사고 지점 인근 폐가에서 발견되었다." },
    { id: 'c06-lost', ep: 6, when: 'read', tags: [],
      quote: "나머지 13명은 지금까지 발견되지 않았다." },
    { id: 'c03-rounds', ep: 3, when: 'read', tags: ['회진'],
      quote: "회진 시 개체 의사의 질문에는 반드시 “조금씩 나아지고 있습니다.”라고만 답하십시오." },
    { id: 'c04-voice', ep: 4, when: 'read', tags: ['이름을 부르는 소리'],
      quote: "절대 대답하거나 소리가 나는 스피커 쪽으로 고개를 돌리지 마십시오." },
    { id: 'c08-band', ep: 8, when: 'read', tags: ['손목'],
      quote: "입장 시 지급되는 전자 손목 밴드는 사물함 개폐와 시설 내 결제에 사용됩니다." },
    { id: 'c10-name', ep: 10, when: 'read', tags: ['이름을 부르는 소리'],
      quote: "귀하의 이름과 사물함 번호를 부르는 목소리가 들려도 계속 옷을 갈아입으십시오." },
    { id: 'cJ-wrist', ep: 'J', when: 'jay', tags: ['손목'],
      quote: "이 환자는 나흘 전부터 휴게실 구석에 앉아 하루 종일 왼팔 손목 안쪽을 문지르고 있었다." },
];

// 두 단서를 연결했을 때 성립하는 추리. link = 두 원문이 공유하는 키워드 (새 문장 없음)
const DEDUCTIONS = [
    { id: 'd01', pair: ['c01-founded', 'c06-yerim'], link: "2019" },
    { id: 'd02', pair: ['c01-founded', 'cJ-date'], link: "2019" },
    { id: 'd03', pair: ['c01-remains', 'c06-yerim'], link: "기장군" },
    { id: 'd04', pair: ['c01-blink', 'c06-eyes'], link: "한쪽 눈씩 번갈아 감기" },
    { id: 'd05', pair: ['c01-noturn', 'c10-noturn'], link: "뒤돌아보지 말 것" },
    { id: 'd06', pair: ['c03-surgery', 'c08-surgery'], link: "수술" },
    { id: 'd07', pair: ['c03-meri', 'cJ-visit'], link: "병원" },
    { id: 'd08', pair: ['c03-rescue', 'cJ-hq'], link: "요원" },
    { id: 'd09', pair: ['c09-fake', 'cJ-hq'], link: "본부 · 요원" },
    { id: 'd10', pair: ['c07-hq', 'c09-fake'], link: "본부(0050-0)" },
    { id: 'd11', pair: ['c03-pill', 'c05-red'], link: "빨간 알약" },
    { id: 'd12', pair: ['c04-voice', 'c10-name'], link: "이름을 부르는 소리" },
    { id: 'd13', pair: ['c04-mirror', 'c07-mirror'], link: "거울" },
    { id: 'd14', pair: ['c03-surgery', 'c08-ask'], link: "수술" },
    { id: 'd15', pair: ['c08-band', 'c10-wrist'], link: "손목" },
    { id: 'd16', pair: ['c02-others', 'c09-all'], link: "비정상 개체로 간주" },
    { id: 'd17', pair: ['c10-wrist', 'cJ-wrist'], link: "손목" },
    { id: 'd18', pair: ['c03-rounds', 'cJ-subject'], link: "회진" },
    { id: 'd19', pair: ['c02-others', 'c07-others'], link: "비정상 개체로 간주" }
];

// 업적: 저장된 진행 기록으로 계산한다 (별도 데이터 없음). secret=true 는 달성 전까지 이름/조건을 숨긴다.
// type: clearCount(n) 클리어한 에피소드 수 / allCleared / noDeathClear(n) 사망 없이 클리어한 에피소드 수
//       deathTotal(n) 누적 사망 / clueCount(n) / allClues / dedCount(n) / allDeductions / flag(name)
const ACHIEVEMENTS = [
    { id: 'a-first-clear', title: '첫 생환', desc: '에피소드를 하나 클리어한다.', cond: { type: 'clearCount', n: 1 } },
    { id: 'a-clear-5', title: '다섯 번의 생환', desc: '에피소드 5개를 클리어한다.', cond: { type: 'clearCount', n: 5 } },
    { id: 'a-clear-all', title: '전 구역 생환', desc: 'EP.01~EP.10을 모두 클리어한다.', cond: { type: 'allCleared' } },
    { id: 'a-no-death', title: '무사고 생환', desc: '한 번도 사망하지 않고 에피소드를 클리어한다.', cond: { type: 'noDeathClear', n: 1 } },
    { id: 'a-no-death-5', title: '모범 근무자', desc: '한 번도 사망하지 않고 에피소드 5개를 클리어한다.', cond: { type: 'noDeathClear', n: 5 } },
    { id: 'a-first-death', title: '수칙 위반', desc: '처음으로 사망한다.', cond: { type: 'deathTotal', n: 1 } },
    { id: 'a-death-10', title: '반복되는 위반', desc: '누적 사망 10회.', cond: { type: 'deathTotal', n: 10 } },
    { id: 'a-clue-10', title: '단서 10개', desc: '단서를 10개 수집한다.', cond: { type: 'clueCount', n: 10 } },
    { id: 'a-clue-25', title: '단서 25개', desc: '단서를 25개 수집한다.', cond: { type: 'clueCount', n: 25 } },
    { id: 'a-clue-all', title: '모든 단서 수집', desc: '모든 단서를 수집한다.', cond: { type: 'allClues' } },
    { id: 'a-ded-first', title: '첫 연결', desc: '단서 두 개를 처음으로 연결한다.', cond: { type: 'dedCount', n: 1 } },
    { id: 'a-ded-8', title: '연결 8개', desc: '추리 연결을 8개 성립시킨다.', cond: { type: 'dedCount', n: 8 } },
    { id: 'a-ded-all', title: '모든 연결 완성', desc: '추리 연결을 모두 성립시킨다.', cond: { type: 'allDeductions' } },
    { id: 'a-jay', title: '요원 제이의 기록', desc: '요원 제이의 기록을 열었다.', secret: true, cond: { type: 'flag', name: 'jayUnlocked' } },
    { id: 'a-finale', title: '관측 기준점(Anchor)', desc: '엔딩을 확인했다.', secret: true, cond: { type: 'flag', name: 'finaleSeen' } },
    // ---- 기밀 터미널 / 본부 메신저 (창작 콘텐츠) ----
    { id: 'a-term-5', title: '기밀 열람', desc: '기밀 터미널의 기록 5종을 모두 열람한다.', cond: { type: 'secretCount', ids: ['t-bus', 't-hq', 't-ourward', 't-record', 't-clue'], n: 5 } },
    { id: 'a-msg-5', title: '본부와의 대화', desc: '본부 메신저의 숨겨진 반응을 6종 발견한다.', cond: { type: 'secretCount', ids: ['m-profanity', 'm-mirror', 'm-glitch', 'm-factory', 'm-night', 'm-hinted', 'm-memory', 'm-record', 'm-episode'], n: 6 } },
    { id: 'a-truth', title: '종합 보고서', desc: '기밀 터미널에서 종합 보고서를 열람했다.', secret: true, cond: { type: 'secret', id: 't-report' } },
    // ---- 추가 (세이브 코드 호환을 위해 맨 뒤에만 추가) ----
    { id: 'a-term-deep', title: '기록 대조', desc: '기밀 터미널에서 구역별 기록과 연결된 기록을 조회한다.', cond: { type: 'secretCount', ids: ['t-episode', 't-link'], n: 2 } }
];

// 비밀 발견(기밀 터미널 검색어 / 본부 메신저 숨은 반응). 세이브 코드가 이 배열의 순서(인덱스)로 압축되므로 "맨 뒤에만 추가"한다.
const SECRETS = [
    't-bus', 't-hq', 't-ourward', 't-record', 't-clue', 't-report',
    'm-hinted', 'm-profanity', 'm-mirror', 'm-glitch', 'm-factory', 'm-night',
    'm-memory', 'm-record', 'm-episode',
    't-episode', 't-link', 'm-progress', 'm-jay'
];

// 본부 메신저의 "일반 응답"은 새로 지어내지 않고 에피소드 원문의 문장을 그대로 쓴다. (ep = 출처 원고 번호, 검증 스크립트가 원문과 대조)
const MESSENGER_GENERIC = {
    hq: [
        { ep: 1, quote: "본 수칙을 숙지한 귀하는 반드시 귀환할 수 있습니다." },
        { ep: 1, quote: "구판 문서 발견 시 즉시 관리소에 반납하십시오." },
        { ep: 3, quote: "본 문서 확인 이후 발생하는 일체의 상황에 대해 본부는 책임을 지지 않습니다." },
        { ep: 5, quote: "본부는 국민들의 생명을 위해 언제나 대비하고 있습니다." },
        { ep: 5, quote: "당신은 고통받지 않을 권리가 있습니다." },
        { ep: 7, quote: "본 수칙을 숙지한 귀하는 반드시 무사히 퇴근할 수 있습니다." }
    ],
    factory: [
        { ep: 10, quote: "정상적으로 작업을 종료하기 전까지는 공장 밖으로 나가려 하지 마십시오." },
        { ep: 10, quote: "문이 열린 뒤 홍보곡이 다시 시작되거나 작업자 번호를 부르는 소리가 들려도 입을 닫은 채 걸음을 멈추지 마십시오." },
        { ep: 10, quote: "웃을 때에만 목소리가 인어왕자와 같아집니다." },
        { ep: 10, quote: "본 수칙을 숙지한 귀하는 반드시 무사히 퇴근할 수 있습니다." }
    ]
};

// 기밀 터미널이 출력하는 요원 제이의 일기 문장 (사이트의 제이 기록 창에 그대로 있는 문장, 검증 스크립트가 확인)
const TERMINAL_QUOTES = {
    ward: '여기, 이곳, 이 병동이라고 하면 걸린다. 우리 병동, 우리 식단이라고 하면 넘어간다.',
    name: '첫 장에 적어 둔 이름이 누구였는지 기억나지 않는다.',
    ours: '다만 우리가 아닌 존재에 대해선 신경 쓸 바가 아님을 이제는 잘 알고 있다.',
    newPatient: '오늘 아침 우리 병동에 새로운 환자가 들어왔다.'
};

// 채널 영상 제목에 적힌 "생존율 N%" (EP.08 워터파크 50%, EP.09 재난안내문자 9%, EP.10 인형 공장 29%)
const VIDEO_SURVIVAL_RATES = { 8: 50, 9: 9, 10: 29 };

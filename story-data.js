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
    5: '살둔 계곡 아기소',
    6: '청림고 2-3반 17번',
    7: '나눔 12 편의점',
    8: '유성 워터파크',
    9: '안전 안내 문자',
    10: '인어왕국 행복 공장',
    J: '요원 제이의 기록'
};

// 문서 번호 (출처 표기용, 원고 헤더 그대로)
const EPISODE_DOCS = {
    1: '해안관리-20119-0315',
    2: '순환관리-2021-0145',
    3: '병원관리-2023-0635',
    4: '승강기관리-2016-0135',
    5: '통제구역-2024-06-02',
    6: '학급관리-2021-05-20',
    7: '편의점야간-2026-07-19',
    8: '워터파크-2021-08-YWP',
    9: '긴급통신-2026-EMERGENCY-SMS',
    10: '완구회수-216-091호',
    J: 'HQ-JAY-2019-FINAL'
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
      quote: '본 문서는 2019년 최초 작성 이후 2회 개정되었습니다.' },
    { id: 'c01-remains', ep: 1, when: 'read', tags: ['기장군'],
      quote: '근무 실패자 및 사망자의 유해는 공통적으로 새벽 3시에서 5시 사이 기장군 해안 일대에서 발견됩니다.' },
    { id: 'c01-blink', ep: 1, when: 'clear', tags: ['한쪽 눈씩 번갈아 감기'],
      quote: '눈을 깜빡여야 하는 경우 한쪽 눈씩 번갈아 감으십시오.' },
    { id: 'c01-noturn', ep: 1, when: 'clear', tags: ['뒤돌아보지 말 것'],
      quote: '방파제 또는 갯바위에서 낚시꾼을 목격했을 시, 어떠한 경우에도 뒤돌아서지 마십시오.' },

    // ---- EP.02 ----
    { id: 'c02-others', ep: 2, when: 'read', tags: ['비정상 개체로 간주'],
      quote: '열차 내 귀하 외의 모든 인원은 비정상 개체로 간주합니다.' },
    { id: 'c02-remains', ep: 2, when: 'read', tags: [],
      quote: '실패 시: 생환자 및 이탈 실패자·사망자의 유해는 오전 4시에서 5시 30분 사이 순환선 역사 및 선로 일대에서 발견됩니다.' },
    { id: 'c02-feed', ep: 2, when: 'clear', tags: [],
      quote: "좌석에 널부러진 '먹이 상태' 인원 중 한 명이 소지한 [기관실 출입 카드]를 찾아야 합니다." },

    // ---- EP.03 ----
    { id: 'c03-rescue', ep: 3, when: 'read', tags: ['구조 / 구출'],
      quote: '구조 요원이 편입으로부터 늦어도 7일 차에 반드시 도착합니다.' },
    { id: 'c03-pill', ep: 3, when: 'read', tags: ['빨간 알약'],
      quote: '파란색 인식표: 이번실에 구비된 빨간 알약을 복용하십시오 (펜타닐 화합물).' },
    { id: 'c03-surgery', ep: 3, when: 'clear', tags: ['수술'],
      quote: '통증 호소 시 수술일이 당일로 당겨지며' },
    { id: 'c03-meri', ep: 3, when: 'clear', tags: ['베리 해피 병원'],
      quote: "완치를 주장할 경우 정신 오염으로 판정되어 '메리 정신병원'으로 영구 격리 전원됩니다." },

    // ---- EP.04 ----
    { id: 'c04-lies', ep: 4, when: 'read', tags: [],
      quote: '층 표시기, 안내 방송, 조작반 버튼의 점등은 전부 거짓이거나 무의미합니다.' },
    { id: 'c04-mirror', ep: 4, when: 'read', tags: ['거울'],
      quote: '후면 거울을 볼 때마다 개체는 반대쪽 측면 거울로 옮겨가며 한 걸음 다가옵니다.' },
    { id: 'c04-exit', ep: 4, when: 'clear', tags: ['뒤돌아보지 말 것'],
      quote: '뒤돌아보지 말고 앞만 보며 신속히 문밖으로 걸어 나가십시오.' },

    // ---- EP.05 ----
    { id: 'c05-annual', ep: 5, when: 'read', tags: [],
      quote: "'아기소'는 매년 약 150명의 인명 피해가 발생하는 극도로 위험한 변칙 구역입니다." },
    { id: 'c05-red', ep: 5, when: 'clear', tags: ['빨간 알약'],
      quote: '즉시 구비된 [빨간 알약]을 복용하고 휴대용 소형 EMP를 작동시켜 통신 음파를 차단하십시오.' },
    { id: 'c05-rights', ep: 5, when: 'clear', tags: [],
      quote: '당신은 고통받지 않을 권리가 있습니다.' },

    // ---- EP.06 ----
    { id: 'c06-yerim', ep: 6, when: 'read', tags: ['2019', '기장군'],
      quote: '2019년 수학여행(부산 기장군 태양해안) 중 실종된 17번 박예림 학생과 관련된 연쇄 이상 현상 대응 문서입니다.' },
    { id: 'c06-virtual', ep: 6, when: 'read', tags: [],
      quote: "17번을 결번으로 둘 경우 수학여행 버스 전복 등 학급 전체에 괴멸적 참사가 발생하므로, 전산상 가상 학생 '박예림'을 영구 배정해 둔 상태입니다." },
    { id: 'c06-eyes', ep: 6, when: 'clear', tags: ['한쪽 눈씩 번갈아 감기'],
      quote: '17번 자리에 시선을 고정한 채 한쪽 눈씩 번갈아 감으며 3분간 버티십시오.' },

    // ---- EP.07 ----
    { id: 'c07-hire', ep: 7, when: 'read', tags: [],
      quote: '구인구직 사이트 공고를 통해 편입된 야간 근무자를 위한 생존 지침입니다.' },
    { id: 'c07-hq', ep: 7, when: 'read', tags: ['본부(0050-0)'],
      quote: '포스 화면에 상품명 대신 빈칸/코드만 찍힐 경우, 즉시 본부(0050-0)로 유선 신고하십시오.' },
    { id: 'c07-mirror', ep: 7, when: 'clear', tags: ['거울'],
      quote: '방범 거울에 끝없이 반복되는 통로가 비칠 경우, 결제기를 보는 척하며 슬쩍 시선만 옮겨 확인하십시오.' },

    // ---- EP.08 ----
    { id: 'c08-surgery', ep: 8, when: 'read', tags: [],
      quote: '탈출 실패 시 지하 수술실로 이송되어 체내 수분과 혈액이 전량 제거되므로 각별한 주의를 요합니다.' },
    { id: 'c08-ask', ep: 8, when: 'clear', tags: ['수술'],
      quote: '직원이 "언제 수술이십니까?"라고 묻는 경우, 반드시 "오늘은 아닙니다"라고만 답하십시오.' },
    { id: 'c08-mascot', ep: 8, when: 'clear', tags: ['인형'],
      quote: '인솔 요원 없이 혼자 돌아다니는 인형 탈 캐릭터에게 다가가지 말고, 등을 보이지 않은 채 인파 속으로 후퇴하십시오.' },

    // ---- EP.09 ----
    { id: 'c09-all', ep: 9, when: 'read', tags: ['비정상 개체로 간주'],
      quote: "이후 본 안내 문자를 제외하고 귀하의 스마트폰으로 걸려오는 모든 통화, 문자, 알림은 '비정상 개체'로 간주합니다." },
    { id: 'c09-fake', ep: 9, when: 'read', tags: ['본부(0050-0)'],
      quote: '본부 번호(0050-0)로 걸려와 위치를 묻는 경우 즉시 끊으십시오. (위치를 묻는 자들은 테러리스트 세력입니다.)' },
    { id: 'c09-rescue', ep: 9, when: 'clear', tags: ['구조 / 구출'],
      quote: '세 번째로 도착한 인증 번호를 입력창에 정확히 전송하여 구출팀을 호출하십시오.' },

    // ---- EP.10 ----
    { id: 'c10-purpose', ep: 10, when: 'read', tags: ['인형'],
      quote: "폐업한 '인어왕국 행복 공장'에 남은 인어왕자 완구 불량품으로 인해 편입된 작업자를 위한 생존 지침입니다." },
    { id: 'c10-noturn', ep: 10, when: 'clear', tags: ['뒤돌아보지 말 것'],
      quote: '노래가 끝나기 전 뒤쪽에서 당신의 이름이나 사물함 번호를 부르는 소리가 나도 절대 뒤돌아보지 마십시오.' },
    { id: 'c10-voice', ep: 10, when: 'clear', tags: [],
      quote: '4번째 대사에서 "여기서 살아줄 거지?"라는 비정상 음성이 재생되면, 즉시 인형을 마주 보고 "친구가 되어줄 거지"라고 육성으로 끝까지 정정하십시오.' },
    { id: 'c10-wrist', ep: 10, when: 'clear', tags: [],
      quote: '정상적으로 퇴장한 작업자의 오른쪽 손목 안쪽에는 4자리 사물함 번호가 피부 안쪽으로 영구히 눌려 남게 됩니다.' },

    // ---- 요원 제이의 기록 (히든) ----
    { id: 'cJ-doc', ep: 'J', when: 'jay', tags: ['2019'],
      quote: '문서 번호: HQ-JAY-2019-FINAL' },
    { id: 'cJ-visit', ep: 'J', when: 'jay', tags: ['베리 해피 병원'],
      quote: '기장 앞바다에서의 임무 중 중상을 입은 동료 요원 제트(Z)를 면회하기 위해 갔던 베리 해피 병원에서' },
    { id: 'cJ-chain', ep: 'J', when: 'jay', tags: [],
      quote: '태양해안(EP.01)에서 시작된 잔류 사념은 병원(EP.03)과 엘리베이터(EP.04), 편의점(EP.07)을 거쳐' },
    { id: 'cJ-nobody', ep: 'J', when: 'jay', tags: ['구조 / 구출'],
      quote: '더 이상의 구출 팀은 존재하지 않으며' },
    { id: 'cJ-mirror', ep: 'J', when: 'jay', tags: ['거울'],
      quote: '등 뒤의 거울을 보지 마십시오.' }
];

// 두 단서를 연결했을 때 성립하는 추리. link = 두 원문이 공유하는 키워드 (새 문장 없음)
const DEDUCTIONS = [
    { id: 'd01', pair: ['c01-founded', 'c06-yerim'], link: '2019' },
    { id: 'd02', pair: ['c01-founded', 'cJ-doc'], link: '2019' },
    { id: 'd03', pair: ['c01-remains', 'c06-yerim'], link: '기장군' },
    { id: 'd04', pair: ['c01-blink', 'c06-eyes'], link: '한쪽 눈씩 번갈아 감기' },
    { id: 'd05', pair: ['c01-noturn', 'c04-exit'], link: '뒤돌아보지 말 것' },
    { id: 'd06', pair: ['c04-exit', 'c10-noturn'], link: '뒤돌아보지 말 것' },
    { id: 'd07', pair: ['c03-meri', 'cJ-visit'], link: '베리 해피 병원' },
    { id: 'd08', pair: ['c03-rescue', 'cJ-nobody'], link: '구조 / 구출' },
    { id: 'd09', pair: ['c09-rescue', 'cJ-nobody'], link: '구조 / 구출' },
    { id: 'd10', pair: ['c07-hq', 'c09-fake'], link: '본부(0050-0)' },
    { id: 'd11', pair: ['c03-pill', 'c05-red'], link: '빨간 알약' },
    { id: 'd12', pair: ['c04-mirror', 'cJ-mirror'], link: '거울' },
    { id: 'd13', pair: ['c04-mirror', 'c07-mirror'], link: '거울' },
    { id: 'd14', pair: ['c03-surgery', 'c08-ask'], link: '수술' },
    { id: 'd15', pair: ['c08-mascot', 'c10-purpose'], link: '인형' },
    { id: 'd16', pair: ['c02-others', 'c09-all'], link: '비정상 개체로 간주' }
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
    { id: 'a-finale', title: '관측 기준점(Anchor)', desc: '엔딩을 확인했다.', secret: true, cond: { type: 'flag', name: 'finaleSeen' } }
];

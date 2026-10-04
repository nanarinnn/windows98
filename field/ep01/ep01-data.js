// Canonical rules: EP01 REVIEWED transcript. Scheduling/timing are slice tuning,
// not new narrative rules; C/E remain deleted. No uncertain telephone number.
window.FieldEP01Data = {
    id: 'EP01', title: '부산 태양해안',
    feedLabel: 'CH 01 · TAE-YANG / OBSERVATION', reportSelector: '#darkwebReportWindow textarea',
    equipment: ['baton', 'radio'],
    // Real seconds of uninterrupted protection; slice tuning, not a canonical duration.
    aProtectionSeconds: 10,
    events: [
        { type: 'A', minute: 60, location: 'coast', video: 'event_A_intro.mp4' },
        { type: 'B', minute: 220, location: 'harbor', video: 'event_B_intro.mp4' },
        { type: 'D', minute: 310, location: 'rocks', video: 'event_D_intro.mp4' },
        { type: 'F', minute: 415, location: 'sand', video: 'event_F_intro.mp4' }
    ],
    locations: { shelter: '안전요원 대기소', harbor: '항구 / 경로 A', coast: '해안선 / 경로 B', rocks: '방파제·갯바위', sand: '태양 모래사장 / 경로 C' },
    items: { baton: '순찰봉', radio: '통신기', money: '오른쪽 가슴 주머니 · 10,000원권 ×3', wallet: '개인 지갑', bait: '훌륭한 미끼 · 약 1m 갯지렁이', catch: '낚시꾼의 조과' },
    demands: [
        ['고등어', '손가락 1개'], ['전갱이', '왼쪽 심장 30%'], ['볼락', '치아 6개'],
        ['돌돔', '대장 40%'], ['갑오징어', '오른쪽 눈 전체'], ['참돔', '머리카락 전체의 50%']
    ],
    // Distinct observations; a head is never labelled as the creature itself.
    bags: [ { observation: '어패류', actualOgwibal: false },
        { observation: '사람의 머리', actualOgwibal: false, notify: true },
        { observation: '오귀발', actualOgwibal: true } ]
};

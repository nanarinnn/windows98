// ==========================================
// 기밀 터미널 / 본부 실시간 메신저
// - 서버나 AI 없이 브라우저에서 동작하는 규칙 기반(키워드) 응답이다.
// - 출력은 "에피소드 원문 문장"과 "플레이어의 진행 기록"만 사용한다. (새 설정을 지어내지 않는다)
// 의존: save.js (GameSave), story-data.js, notebook.js (showToast, NB_DIM), app.js (창 관리)
// ==========================================

// ---------- 공통 ----------
const TERM_DIM = '#888';
const TERM_RED = '#ff4444';

function normalizeInput(s) {
    return s.toLowerCase().replace(/\s+/g, '');
}

function pad2(n) { return String(n).padStart(2, '0'); }
function clueById(id) { return CLUES.find(c => c.id === id); }
function hasClue(id) { return GameSave.hasClue(id); }
function foundClues() { return CLUES.filter(c => GameSave.hasClue(c.id)); }
function clueSrc(c) { return c.ep === 'J' ? '제이의 기록' : `${c.ep}화`; }

function openToolWindow(id, onOpen) {
    const win = document.getElementById(id);
    if (!win) return;
    win.style.display = 'flex';
    highestZIndex++;
    win.style.zIndex = highestZIndex;
    updateDarkWebTaskbar();
    if (onOpen) onOpen();
}

function closeToolWindow(id) {
    const win = document.getElementById(id);
    if (!win) return;
    win.style.display = 'none';
    updateDarkWebTaskbar();
}

// 진행 기록 요약 (터미널과 메신저가 함께 사용)
function recordStats() {
    let clears = 0, deaths = 0;
    for (let n = 1; n <= 10; n++) {
        const r = GameSave.ep(n);
        if (r.clears > 0) clears++;
        deaths += r.deaths;
    }
    return {
        clears,
        deaths,
        clues: foundClues().length,
        ded: DEDUCTIONS.filter(d => GameSave.hasDeduction(d.id)).length,
        ach: ACHIEVEMENTS.filter(a => GameSave.hasAchievement(a.id)).length
    };
}

// ==========================================
// 기밀 터미널
// ==========================================
const terminalState = { busy: false, started: false, history: [], histIdx: -1, failStreak: 0, searched: [] };

function terminalOutput() { return document.getElementById('terminal-output'); }

function terminalPrint(text, color) {
    const out = terminalOutput();
    if (!out) return null;
    const line = document.createElement('div');
    line.style.cssText = `white-space: pre-wrap; word-break: break-all; margin-bottom: 4px;${color ? ' color: ' + color + ';' : ''}`;
    line.textContent = text;
    out.appendChild(line);
    out.scrollTop = out.scrollHeight;
    return line;
}

// 타자기처럼 한 글자씩 출력한다. (줄 사이에 잠시 멈춤)
function terminalType(lines, opts = {}) {
    const speed = opts.slow ? 55 : 14;
    const pause = opts.slow ? 900 : 140;
    return new Promise(resolve => {
        let li = 0;
        function nextLine() {
            if (li >= lines.length) return resolve();
            const el = terminalPrint('', opts.color);
            const text = lines[li++];
            let i = 0;
            (function step() {
                el.textContent = text.slice(0, ++i);
                const out = terminalOutput();
                if (out) out.scrollTop = out.scrollHeight;
                if (i < text.length) setTimeout(step, speed);
                else setTimeout(nextLine, pause);
            })();
        }
        nextLine();
    });
}

function setTerminalBusy(busy) {
    terminalState.busy = busy;
    const input = document.getElementById('terminal-input');
    if (input) {
        input.disabled = busy;
        if (!busy) input.focus();
    }
}

// 자동완성/도움말에 쓰는 검색어 목록: 고정 명령 + 획득한 단서의 키워드
function terminalVocabulary() {
    const tags = [];
    foundClues().forEach(c => c.tags.forEach(t => { if (!tags.includes(t)) tags.push(t); }));
    return ['내 기록', '사망 기록', '생존율', '작업자 번호', '연결', '도움말', ...tags];
}

// ---------- 단서 검색 ----------
function searchClues(query) {
    const q = normalizeInput(query);
    if (q.length < 2) return null;
    const matches = CLUES.filter(c => {
        const byTag = c.tags.some(t => { const nt = normalizeInput(t); return nt.length >= 2 && (nt.includes(q) || q.includes(nt)); });
        const byQuote = normalizeInput(c.quote).includes(q);
        const byTitle = c.ep !== 'J' && normalizeInput(EPISODE_TITLES[c.ep]).includes(q);
        return byTag || byQuote || byTitle;
    });
    return { open: matches.filter(c => hasClue(c.id)), locked: matches.filter(c => !hasClue(c.id)) };
}

function runSearch(query) {
    const res = searchClues(query);
    if (!res || (!res.open.length && !res.locked.length)) return null;
    const lines = [];
    res.open.slice(0, 8).forEach(c => lines.push(`> [${clueSrc(c)}] ${c.quote}`));
    if (res.open.length > 8) lines.push(`> 외 ${res.open.length - 8}건`);
    if (res.locked.length) lines.push(`> 열람 권한이 없는 기록 ${res.locked.length}건 (수칙 문서를 열람하거나 에피소드를 클리어하면 열립니다)`);
    return { lines, secret: res.open.length ? 't-clue' : null, color: res.open.length ? null : TERM_DIM };
}

// ---------- 숨은 항목 (원문 문장 + 플레이어 기록으로만 구성) ----------
function runHq() {
    const a = hasClue('c07-hq'), b = hasClue('c09-fake');
    if (!a && !b) return { lines: ['> 열람 권한이 없습니다.'], color: TERM_DIM };
    const lines = ['> 검색어: 0050-0200 (본부 번호)'];
    if (a) lines.push(`> [7화] ${clueById('c07-hq').quote}`);
    if (b) lines.push(`> [9화] ${clueById('c09-fake').quote}`);
    if (a && b) {
        lines.push('> 주의: 같은 번호가 신고처(7화)와 사칭 번호(9화)로 함께 기록되어 있습니다.');
        return { lines, secret: 't-hq' };
    }
    lines.push('> 관련 기록이 더 있습니다. 열람 권한이 부족합니다.');
    return { lines };
}

function runWard() {
    if (!GameSave.flag('jayUnlocked')) return { lines: ['> 열람 권한이 없습니다.'], color: TERM_DIM };
    return { lines: ['> 요원 제이의 기록', `> ${TERMINAL_QUOTES.ward}`], secret: 't-ourward' };
}

function runBus() {
    const ids = ['c06-yerim', 'c06-virtual', 'c06-bus', 'c06-lost'].filter(hasClue);
    if (!ids.length) return { lines: ['> 열람 권한이 없습니다.'], color: TERM_DIM };
    const lines = ['> 검색어: 청림고등학교 2학년 3반 17번'];
    ids.forEach(id => lines.push(`> [6화] ${clueById(id).quote}`));
    if (hasClue('c06-bus') && hasClue('c06-lost')) return { lines, secret: 't-bus' };
    lines.push('> 관련 기록이 더 있습니다. 열람 권한이 부족합니다.');
    return { lines };
}

function runRecordSummary() {
    const s = recordStats();
    const lines = [
        '> 요원 기록 조회',
        `> 생환 ${s.clears}/10개 구역 · 사망 ${s.deaths}회`,
        `> 단서 ${s.clues}/${CLUES.length} · 연결 ${s.ded}/${DEDUCTIONS.length} · 업적 ${s.ach}/${ACHIEVEMENTS.length}`,
        `> 엔딩: ${GameSave.flag('finaleSeen') ? '확인함' : '미확인'}`
    ];
    if (GameSave.workerNo()) lines.push(`> 작업자 번호: ${GameSave.workerNo()}`);
    return { lines, secret: 't-record' };
}

function runDeaths() {
    const lines = ['> 사망 기록 조회'];
    let total = 0, worst = null;
    for (let n = 1; n <= 10; n++) {
        const d = GameSave.ep(n).deaths;
        if (!d) continue;
        total += d;
        lines.push(`> EP.${pad2(n)} ${EPISODE_TITLES[n]}: 사망 ${d}회`);
        if (!worst || d > worst.d) worst = { n, d };
    }
    if (!total) lines.push('> 사망 기록이 없습니다.');
    else lines.push(`> 총 ${total}회 · 가장 많이 사망한 구역: EP.${pad2(worst.n)} ${EPISODE_TITLES[worst.n]}`);
    return { lines, secret: 't-record' };
}

function runSurvival() {
    const lines = ['> 생존율 조회 (생환 ÷ 시도)'];
    let any = false;
    for (let n = 1; n <= 10; n++) {
        const r = GameSave.ep(n);
        const attempts = r.clears + r.deaths;
        if (!attempts) continue;
        any = true;
        const video = VIDEO_SURVIVAL_RATES[n];
        lines.push(`> EP.${pad2(n)} ${EPISODE_TITLES[n]}: ${Math.round(r.clears / attempts * 100)}% (생환 ${r.clears} / 시도 ${attempts})` + (video !== undefined ? ` — 영상 표기 생존율 ${video}%` : ''));
    }
    if (!any) lines.push('> 기록이 없습니다.');
    return { lines, secret: 't-record' };
}

function runWorker() {
    const n = GameSave.workerNo();
    if (!n) return { lines: ['> 발급된 작업자 번호가 없습니다.'], color: TERM_DIM, secret: null };
    return { lines: [`> 작업자 번호: ${n}`, '> 오른쪽 손목 안쪽에 새겨진 번호입니다.'], secret: 't-record' };
}

function runReport() {
    const finale = GameSave.flag('finaleSeen');
    const ded = recordStats().ded;
    const NEED = 12;
    if (!(finale && ded >= NEED)) {
        return { lines: ['> 종합 보고서 — 열람 권한이 부족합니다.', `> 엔딩 확인: ${finale ? '완료' : '미완료'}`, `> 연결된 기록: ${ded}/${NEED} 이상 필요`], color: TERM_DIM };
    }
    const s = recordStats();
    const lines = [
        '> 종합 보고서 — 대상: 관측 기준점',
        `> 생환 ${s.clears}개 구역 · 사망 ${s.deaths}회 · 연결된 기록 ${s.ded}/${DEDUCTIONS.length}`
    ];
    if (GameSave.workerNo()) lines.push(`> 작업자 번호 ${GameSave.workerNo()}`);
    lines.push(`> ${TERMINAL_QUOTES.name}`, `> ${TERMINAL_QUOTES.ours}`, `> ${TERMINAL_QUOTES.newPatient}`);
    return { lines, secret: 't-report', blood: true, slow: true };
}

// 구역별 기록 조회: 열람한 단서의 원문 문장만 보여 준다.
function runEpisode(n) {
    if (!EPISODE_TITLES[n] || n < 1 || n > 10) return null;
    const list = foundClues().filter(c => c.ep === n);
    const lines = [`> EP.${pad2(n)} ${EPISODE_TITLES[n]}${EPISODE_DOCS[n] ? ` · 문서 ${EPISODE_DOCS[n]}` : ''}`];
    const total = CLUES.filter(c => c.ep === n).length;
    if (!list.length) {
        lines.push('> 열람 권한이 없습니다.');
        return { lines, color: TERM_DIM };
    }
    list.forEach(c => lines.push(`> ${c.quote}`));
    if (list.length < total) lines.push(`> 열람 권한이 없는 기록 ${total - list.length}건`);
    return { lines, secret: 't-episode' };
}

// 연결된 기록 조회: 플레이어가 성립시킨 추리의 출처와 공통 키워드만 보여 준다.
function runLinks() {
    const done = DEDUCTIONS.filter(d => GameSave.hasDeduction(d.id));
    if (!done.length) return { lines: ['> 연결된 기록이 없습니다.'], color: TERM_DIM };
    const lines = [`> 연결된 기록 ${done.length}/${DEDUCTIONS.length}`];
    done.forEach(d => {
        const [a, b] = d.pair.map(clueById);
        lines.push(`> [${clueSrc(a)}] ↔ [${clueSrc(b)}] 공통: ${d.link}`);
    });
    return { lines, secret: 't-link' };
}

const TERMINAL_SPECIAL = [
    { keys: ['연결', '연결기록', '연결된기록', '추리'], run: runLinks },
    { keys: ['0050-0200', '00500200', '0050-0', '00500', '본부번호', '본부전화'], run: runHq },
    { keys: ['우리병동', '우리식단', '주어'], run: runWard },
    { keys: ['13명', '26명', '수학여행', '버스'], run: runBus },
    { keys: ['내기록', '기록', '나의기록', '현황', 'status'], run: runRecordSummary },
    { keys: ['사망기록', '사망'], run: runDeaths },
    { keys: ['생존율', '나의생존율'], run: runSurvival },
    { keys: ['작업자번호', '사물함', '사물함번호', '요원번호'], run: runWorker },
    { keys: ['보고서', '종합보고서', '종합', '결산'], run: runReport }
];

function helpLines() {
    const tags = [];
    foundClues().forEach(c => c.tags.forEach(t => { if (!tags.includes(t)) tags.push(t); }));
    const lines = ['> 검색어를 입력하십시오.'];
    lines.push(tags.length
        ? `> 획득한 단서의 키워드: ${tags.slice(0, 8).join(', ')}`
        : '> 획득한 단서가 없습니다. 수칙 문서를 열람하거나 에피소드를 클리어하십시오.');
    lines.push('> 기록 조회: 내 기록 / 사망 기록 / 생존율 / 작업자 번호 / 연결');
    lines.push('> 구역 조회: 1화 ~ 10화 (예: 7화, EP.03)');
    lines.push('> ↑↓ 이전 입력 · Tab 자동완성 · 지우기');
    return lines;
}

// 검색 실패 시, 이미 획득한 단서의 키워드 중 글자(2글자 묶음)가 가장 많이 겹치는 것을 제안한다.
function bigrams(s) {
    const set = new Set();
    for (let i = 0; i < s.length - 1; i++) set.add(s.slice(i, i + 2));
    return set;
}

function nearestKeyword(query) {
    const q = normalizeInput(query);
    if (q.length < 2) return null;
    const qb = bigrams(q);
    let best = null, bestScore = 0;
    terminalVocabulary().forEach(v => {
        const nv = normalizeInput(v);
        if (nv.length < 2) return;
        let score = 0;
        bigrams(nv).forEach(g => { if (qb.has(g)) score++; });
        if (score > bestScore) { best = v; bestScore = score; }
    });
    return best;
}

function failHint() {
    const tags = [];
    foundClues().forEach(c => c.tags.forEach(t => { if (!tags.includes(t) && !terminalState.searched.includes(normalizeInput(t))) tags.push(t); }));
    if (tags.length) return [`> 힌트: 획득한 단서의 키워드를 검색해 보십시오. 예) ${tags.slice(0, 3).join(', ')}`];
    return ['> 힌트: 수칙 문서를 열람하거나 에피소드를 클리어하면 검색할 수 있는 단서가 생깁니다. 기록 조회는 내 기록 / 사망 기록 / 생존율 입니다.'];
}

async function runTerminalCommand(raw) {
    const text = raw.trim();
    if (!text || terminalState.busy) return;
    terminalState.history.push(text);
    terminalState.histIdx = terminalState.history.length;
    terminalPrint('> ' + text, '#aaffaa');
    const key = normalizeInput(text);
    setTerminalBusy(true);

    if (key === 'clear' || key === 'cls' || key === '지우기') {
        terminalOutput().innerHTML = '';
    } else if (key === 'help' || key === '도움말') {
        await terminalType(helpLines(), { color: TERM_DIM });
    } else {
        const special = TERMINAL_SPECIAL.find(e => e.keys.includes(key));
        const epMatch = key.match(/^(?:ep\.?|에피소드|구역)?0?(\d{1,2})(?:화)?$/);
        const result = special ? special.run() : (epMatch ? runEpisode(Number(epMatch[1])) : runSearch(text));
        if (!result) {
            terminalState.failStreak++;
            const lines = ['> 일치하는 기록이 없습니다.'];
            const near = nearestKeyword(text);
            if (near) lines.push(`> 혹시 '${near}'을(를) 찾으십니까?`);
            if (terminalState.failStreak >= 3) { lines.push(...failHint()); terminalState.failStreak = 0; }
            await terminalType(lines, { color: TERM_DIM });
        } else {
            terminalState.failStreak = 0;
            if (!terminalState.searched.includes(key)) terminalState.searched.push(key);
            if (result.blood) document.getElementById('terminalWindow').classList.add('terminal-blood');
            await terminalType(result.lines, { slow: result.slow, color: result.blood ? TERM_RED : result.color });
            if (result.secret) GameSave.addSecret(result.secret); // 업적 판정은 변경 알림으로 자동 처리된다
        }
    }
    setTerminalBusy(false);
}

function openTerminal() {
    openToolWindow('terminalWindow', () => {
        if (!terminalState.started) {
            terminalState.started = true;
            terminalPrint('[ 특별재난 관리본부 기밀 터미널 ]');
            terminalPrint('> 검색어를 입력하십시오. (도움말)');
            terminalPrint('(이 터미널은 이 사이트를 만든 개인이 추가한 비공식 요소이며, 출력은 원문 문장과 플레이어의 기록입니다.)', '#555');
        }
        const input = document.getElementById('terminal-input');
        if (input) input.focus();
    });
}

function closeTerminal() {
    const win = document.getElementById('terminalWindow');
    if (win) win.classList.remove('terminal-blood');
    closeToolWindow('terminalWindow');
}

// 입력창: Enter 실행 / ↑↓ 이전 입력 / Tab 자동완성
function terminalKeydown(e) {
    const input = e.target;
    if (e.key === 'Enter' && !e.isComposing) {
        const v = input.value;
        input.value = '';
        runTerminalCommand(v);
    } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        const h = terminalState.history;
        if (!h.length) return;
        terminalState.histIdx = Math.max(0, terminalState.histIdx - 1);
        input.value = h[terminalState.histIdx];
    } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        const h = terminalState.history;
        terminalState.histIdx = Math.min(h.length, terminalState.histIdx + 1);
        input.value = h[terminalState.histIdx] || '';
    } else if (e.key === 'Tab') {
        e.preventDefault();
        const n = normalizeInput(input.value);
        if (!n) return;
        const cands = terminalVocabulary().filter(v => normalizeInput(v).startsWith(n));
        if (cands.length === 1) input.value = cands[0];
        else if (cands.length > 1) terminalPrint('> ' + cands.join('   '), TERM_DIM);
    }
}

// ==========================================
// 본부 실시간 메신저
// ==========================================
const PROFANITY = /씨발|시발|씨팔|ㅅㅂ|ㅆㅂ|개새끼|개새|병신|ㅂㅅ|지랄|좆|존나|꺼져|닥쳐|염병|미친놈|미친년|fuck|shit|bitch/i;
const ASK_WHO = /누구세요|누구냐|누구야|너\s*누구|누구십니까|진짜\s*상황실|상황실\s*(맞|진짜)|정체/;
const RECORD_TALK = /죽|사망|몇\s*번|생존|살아/;
const EP_TOPICS = [
    { ep: 1, re: /해안|태양|바다|낚시|노파/ },
    { ep: 2, re: /지하철|2호선|열차|신설동/ },
    { ep: 3, re: /병원|간호|수술|회진|환자/ },
    { ep: 4, re: /엘리베이터|승강기|13층/ },
    { ep: 5, re: /계곡|애기소|아기소|살둔/ },
    { ep: 6, re: /학교|교실|17번|박예림|청림/ },
    { ep: 7, re: /편의점|알바|손님|포스/ },
    { ep: 8, re: /워터파크|슬라이드|수영/ },
    { ep: 9, re: /문자|전화|휴대폰|스마트폰|통화/ },
    { ep: 10, re: /공장|인어|인형|사물함/ }
];
const MEMORY_STOP = ['누구세요', '안녕하세요', '안녕', '그래서', '그런데', '그리고', '이거', '저거', '뭐야', '어디', '있어요', '합니다', '입니다',
    '저는', '제가', '나는', '내가', '그래', '그럼', '근데', '정말', '진짜', '오늘', '이야기'];

const Messenger = {
    persona: 'hq',          // 'hq' = 상황실, 'factory' = 행복 공장 인사과
    askCount: 0,            // "누구세요?" 류 질문 횟수
    junkStreak: 0,          // 의미 없는 입력이 연속된 횟수
    lastText: '',
    repeatCount: 0,         // 같은 문장을 연속으로 입력한 횟수
    nightSent: false,
    started: false,
    msgCount: 0,            // 보낸 메시지 수 (대화가 길어질수록 말투가 깨진다)
    memory: [],             // 사용자가 쓴 단어 (되받아 말하기용)
    topicIndex: {},         // 구역별로 어떤 단서를 말했는지
    genericIndex: { hq: 0, factory: 0 },
    nextFree: 0,            // 다음 답장을 예약할 수 있는 시각(ms)
    hour: () => new Date().getHours() // 테스트에서 대체할 수 있도록 함수로 둔다
};

function messengerStage() {
    return Messenger.msgCount <= 5 ? 1 : (Messenger.msgCount <= 11 ? 2 : 3);
}

function messengerChat() { return document.getElementById('messenger-chat'); }

function messengerAdd(kind, text, opts = {}) {
    const chat = messengerChat();
    if (!chat) return;
    const bubble = document.createElement('div');
    const mine = kind === 'me';
    bubble.className = 'msgr-bubble' + (opts.glitch ? ' msgr-glitch' : '');
    bubble.style.cssText = `align-self: ${mine ? 'flex-end' : 'flex-start'}; max-width: 85%; padding: 6px 10px; margin: 4px 0; border: 1px solid ${mine ? '#006600' : '#660000'}; background: ${mine ? '#001a00' : '#1a0000'}; color: ${mine ? '#00ff00' : '#ff5555'}; font-size: 12px; line-height: 1.5; word-break: break-all; white-space: pre-wrap;`;
    bubble.textContent = text;
    chat.appendChild(bubble);
    chat.scrollTop = chat.scrollHeight;
}

function messengerSetPersona(persona) {
    Messenger.persona = persona;
    const title = document.getElementById('messenger-title');
    if (title) title.textContent = persona === 'factory' ? '💬 인어왕국 행복 공장 인사과' : '💬 본부 실시간 메신저 - 상황실';
}

function pickGeneric(persona) {
    const list = MESSENGER_GENERIC[persona];
    const item = list[Messenger.genericIndex[persona] % list.length];
    Messenger.genericIndex[persona]++;
    return `${persona === 'factory' ? '[인사과]' : '[상황실]'}: ${item.quote}`;
}

// 의미 없는 입력 판정: 자음/모음만, 같은 글자 4번 이상 반복
function isMeaninglessText(text) {
    const t = text.replace(/\s+/g, '');
    if (t.length < 3) return false;
    return /^[ㄱ-ㅎㅏ-ㅣ]+$/.test(t) || /(.)\1{3,}/.test(t);
}

// 명사에 가까운 단어만 기억한다: 서술어/어미로 끝나는 말은 버리고, 끝의 조사는 떼어 낸다.
const MEMORY_PREDICATE = /(다|요|죠|네|까|니다|입니다|습니다|어서|니까|하고|해서|인데|이다)$/;
const MEMORY_PARTICLE = /(에서|으로|에게|이랑|까지|부터|이|가|은|는|을|를|에|도|만|의|와|과|로)$/;
function rememberWords(text) {
    (text.match(/[가-힣]{2,}/g) || []).forEach(raw => {
        if (MEMORY_PREDICATE.test(raw)) return;
        let w = raw;
        const stripped = raw.replace(MEMORY_PARTICLE, '');
        if (stripped.length >= 2) w = stripped;
        if (MEMORY_STOP.includes(w) || Messenger.memory.includes(w)) return;
        Messenger.memory.push(w);
        if (Messenger.memory.length > 10) Messenger.memory.shift();
    });
}

// 입력 한 줄에 대한 응답 목록을 만든다.
// 우선순위: 질문 콤보 > 욕설 > 4자리 숫자 > 거울 > 기록 이야기 > 구역 이야기 > 의미 없는 입력 > 되받아 말하기 > 일반 응답
function buildMessengerReplies(text) {
    const replies = [];
    const n = normalizeInput(text);
    Messenger.msgCount++;
    const stage = messengerStage();

    Messenger.repeatCount = (n && n === Messenger.lastText) ? Messenger.repeatCount + 1 : 1;
    Messenger.lastText = n;
    const junk = isMeaninglessText(text) || Messenger.repeatCount >= 3;
    Messenger.junkStreak = junk ? Messenger.junkStreak + 1 : 0;

    const digits = text.match(/(^|\D)(\d{4})(\D|$)/);
    const stats = recordStats();
    let topic = null;
    if (!digits) topic = EP_TOPICS.find(t => t.re.test(text));

    if (ASK_WHO.test(text)) {
        Messenger.askCount++;
        if (Messenger.askCount >= 3) {
            if (!GameSave.hasSecret('m-hinted')) {
                replies.push({ text: "[SYSTEM]: 더 이상 묻지 마. 궁금하면 터미널에 '보고서'를 검색해.", glitch: true, secret: 'm-hinted' });
            } else {
                replies.push({ text: '[SYSTEM]: 더 이상 묻지 마.', glitch: true });
            }
        } else {
            replies.push({ text: pickGeneric(Messenger.persona) });
        }
    } else if (PROFANITY.test(text)) {
        replies.push({ text: '[상황실]: "불필요한 감정 표출은 \'살아있는 지성체\'라는 명백한 증거입니다. 당신의 냄새를 맡고 개체들이 모여들고 있습니다."', secret: 'm-profanity' });
    } else if (digits) {
        const num = Number(digits[2]);
        const mine = GameSave.workerNo();
        if (mine && num === mine) {
            messengerSetPersona('factory');
            replies.push({ text: `[인사과]: "작업자 ${digits[2]}번. 휴게 시간은 끝났습니다. 즉시 조립 라인으로 복귀하십시오."`, secret: 'm-factory' });
        } else if (mine) {
            replies.push({ text: '[상황실]: 등록되지 않은 번호입니다.' });
        } else {
            replies.push({ text: '[상황실]: 숫자 네 자리는 작업자 번호 형식입니다. 아직 발급된 번호가 없습니다.' });
        }
    } else if (text.includes('거울')) {
        replies.push({ text: '[상황실]: "거울을 말씀하시는 겁니까? 그렇다면 지금 요원님 등 뒤에 있는 거울은 절대 돌아보지 마십시오."', secret: 'm-mirror' });
    } else if (RECORD_TALK.test(text)) {
        const msg = stats.deaths
            ? `[상황실]: 현재까지 사망 기록 ${stats.deaths}건, 생환 기록 ${stats.clears}건이 확인됩니다.`
            : (stats.clears ? `[상황실]: 현재까지 생환 기록 ${stats.clears}건이 확인됩니다. 사망 기록은 없습니다.` : '[상황실]: 확인되는 기록이 없습니다.');
        replies.push({ text: msg, secret: 'm-record' });
    } else if (/단서|추리|연결/.test(text)) {
        const linked = recordStats().ded;
        const waiting = availableDeductions().length;
        let msg = `[상황실]: 열람된 기록 ${stats.clues}건, 연결된 기록 ${linked}건이 확인됩니다.`;
        if (waiting) msg += ' 아직 대조하지 않은 기록이 있습니다.';
        replies.push({ text: msg, secret: 'm-progress' });
    } else if (/제이/.test(text)) {
        replies.push(GameSave.flag('jayUnlocked')
            ? { text: `[상황실]: 요원 제이의 기록 — "${TERMINAL_QUOTES.newPatient}"`, secret: 'm-jay' }
            : { text: '[상황실]: 열람 권한이 없습니다.' });
    } else if (topic) {
        const list = foundClues().filter(c => c.ep === topic.ep);
        if (list.length) {
            const i = (Messenger.topicIndex[topic.ep] = (Messenger.topicIndex[topic.ep] || 0) + 1) - 1;
            replies.push({ text: `${Messenger.persona === 'factory' ? '[인사과]' : '[상황실]'}: ${list[i % list.length].quote}`, secret: 'm-episode' });
        } else {
            replies.push({ text: '[상황실]: 해당 구역의 기록을 열람하지 않았습니다.' });
        }
    } else if (Messenger.junkStreak >= 2) {
        replies.push({ text: '[상황실]: "기기기기ㄱ... 당신... 뒤에... ㄷ... 닿았어... 규칙을... ㅈ..ㅣ..켜.."', glitch: true, secret: 'm-glitch' });
        Messenger.junkStreak = 0;
    } else if (stage >= 2 && Messenger.memory.length && Messenger.msgCount % 4 === 0) {
        const w = Messenger.memory[(Messenger.msgCount >> 2) % Messenger.memory.length];
        replies.push(stage === 3
            ? { text: `[상황실]: "${w}... ${w}... 요원님이 말한 것은 모두 기록하고 있습니다."`, glitch: true, secret: 'm-memory' }
            : { text: `[상황실]: 아까 '${w}'(이)라고 하셨죠. 기록했습니다.`, secret: 'm-memory' });
    } else {
        // 대화가 길어질수록(3단계) 일반 응답이 가끔 깨진다. (원문 문장은 그대로 두고 연출만 입힌다)
        replies.push({ text: pickGeneric(Messenger.persona), glitch: stage === 3 && Messenger.msgCount % 2 === 0 });
    }

    rememberWords(text);

    // 실제 현실 시간이 심야(0시~4시 미만)이면, 접속 후 처음 말을 건 순간 한 번 추가로 반응한다.
    const hour = Messenger.hour();
    if (!Messenger.nightSent && hour >= 0 && hour < 4) {
        Messenger.nightSent = true;
        replies.push({ text: `[상황실]: "현재 시각 새벽 ${hour}시. 심야 근무 시간입니다. 창밖에서 누가 문을 두드려도 절대 열어주지 마십시오."`, secret: 'm-night' });
    }
    return replies;
}

function sendMessengerMessage(raw) {
    const text = (raw || '').trim();
    if (!text) return;
    messengerAdd('me', text);
    const replies = buildMessengerReplies(text);
    // 답장이 오는 중에 또 보내도 메시지를 버리지 않는다. 답장끼리 시간이 겹치지 않게 순서대로 예약한다.
    const now = Date.now();
    let at = Math.max(Messenger.nextFree - now, 0) + 600;
    replies.forEach(r => {
        setTimeout(() => {
            messengerAdd('bot', r.text, { glitch: r.glitch });
            if (r.secret) GameSave.addSecret(r.secret);
        }, at);
        at += 900;
    });
    Messenger.nextFree = now + at;
}

function openMessenger() {
    openToolWindow('messengerWindow', () => {
        if (!Messenger.started) {
            Messenger.started = true;
            const s = recordStats();
            let greeting = '[상황실]: 본부 실시간 메신저에 연결되었습니다.';
            if (GameSave.flag('finaleSeen')) greeting += ' 관측 기준점 연결이 유지되고 있습니다.';
            else if (s.deaths) greeting += ` 사망 기록 ${s.deaths}건이 확인됩니다.`;
            messengerAdd('bot', greeting);
        }
        const input = document.getElementById('messenger-input');
        if (input) input.focus();
    });
}

function closeMessenger() {
    closeToolWindow('messengerWindow');
}

// ---------- 입력창/버튼 연결, 다크웹 종료·엔딩 시 창 닫기 ----------
window.addEventListener('load', () => {
    const tIn = document.getElementById('terminal-input');
    if (tIn) tIn.addEventListener('keydown', terminalKeydown);
    const tBtn = document.getElementById('terminal-send');
    if (tBtn) tBtn.addEventListener('click', () => { const v = tIn.value; tIn.value = ''; runTerminalCommand(v); });

    const mIn = document.getElementById('messenger-input');
    if (mIn) {
        mIn.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.isComposing) {
                const v = mIn.value;
                mIn.value = '';
                sendMessengerMessage(v);
            }
        });
    }
    const mBtn = document.getElementById('messenger-send');
    if (mBtn) mBtn.addEventListener('click', () => { const v = mIn.value; mIn.value = ''; sendMessengerMessage(v); });

    // 다크웹 연결 종료 / 엔딩(블루스크린) 시작 시 두 창을 닫는다
    ['disconnectDarkWeb', 'triggerLoopShutdown'].forEach(name => {
        const orig = window[name];
        if (typeof orig !== 'function') return;
        window[name] = function (...args) {
            const result = orig.apply(this, args);
            closeTerminal();
            closeMessenger();
            return result;
        };
    });
});

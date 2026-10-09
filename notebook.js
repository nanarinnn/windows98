// ==========================================
// 사건수사노트: 사건 보드 / 단서 / 추리 / 기록(세이브) UI + 진행 훅
// 의존: save.js (GameSave), story-data.js (CLUES, DEDUCTIONS, ...), app.js (창 관리 함수들)
// ==========================================
const EP_NUMBERS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const notebookState = { tab: 'board', selected: [], message: '', hintId: null, hintStep: 0 };

// ---------- 진행 기록 API (app.js 의 클리어/사망 지점에서 호출) ----------
const GameProgress = {
    onClear(ep) {
        GameSave.markClear(ep);
        if (ep === 10) GameSave.ensureWorkerNo(); // 인어왕국 행복 공장: 손목에 새겨지는 4자리 작업자 번호 발급
        this.grant(ep, 'clear');
    },
    onDeath(ep) {
        GameSave.markDeath(ep);
    },
    onReadReport(ep) {
        this.grant(ep, 'read');
    },
    onJayOpened() {
        GameSave.setFlag('jayUnlocked', true);
        this.grant('J', 'jay');
    },
    grant(ep, when) {
        CLUES.filter(c => c.ep === ep && c.when === when).forEach(c => {
            if (GameSave.addClue(c.id)) showClueToast(c);
        });
    }
};

// ---------- 작은 DOM 헬퍼 ----------
function h(tag, style, text, onclick) {
    const el = document.createElement(tag);
    if (style) el.style.cssText = style;
    if (text !== undefined && text !== null) el.textContent = text;
    if (onclick) el.addEventListener('click', onclick);
    return el;
}

const NB_RED = '#ff0000';
const NB_GREEN = '#00ff00';
const NB_DIM = '#888';

function clueSource(c) {
    const label = c.ep === 'J' ? EPISODE_TITLES.J : `${c.ep}화 ${EPISODE_TITLES[c.ep]}`;
    return EPISODE_DOCS[c.ep] ? `${label} · ${EPISODE_DOCS[c.ep]}` : label;
}

// ---------- 토스트 ----------
// 여러 개가 동시에 뜨면 아래로 쌓는다.
function showToast(title, sub, tab) {
    const host = document.getElementById('darkweb-overlay') || document.body;
    // 동시에 최대 4개까지만 쌓는다 (넘치면 가장 오래된 것부터 제거하고 위치를 다시 정렬)
    const existing = [...host.querySelectorAll('.nb-toast')];
    while (existing.length >= 4) existing.shift().remove();
    existing.forEach((t, i) => { t.style.top = `${44 + i * 58}px`; });
    const stacked = existing.length;
    const toast = h('div',
        `position: absolute; right: 16px; top: ${44 + stacked * 58}px; z-index: 99999; background: #1a0000; border: 2px solid #ff0000; color: #ff3333; font-family: monospace; font-size: 11px; padding: 8px 12px; max-width: 280px; box-shadow: 0 0 12px rgba(255,0,0,0.5); cursor: pointer;`);
    toast.className = 'nb-toast';
    toast.appendChild(h('div', 'font-weight: bold; margin-bottom: 4px;', title));
    toast.appendChild(h('div', 'color: #ffaaaa;', sub));
    toast.addEventListener('click', () => { openNotebook(tab); toast.remove(); });
    host.appendChild(toast);
    setTimeout(() => toast.remove(), 4500);
}

function showClueToast(clue) {
    showToast('📎 새 단서 획득', clue.ep === 'J' ? '제이의 기록' : `${clue.ep}화 ${EPISODE_TITLES[clue.ep]}`, 'clues');
}

// ---------- 업적 ----------
function achievementMet(a) {
    const eps = EP_NUMBERS.map(n => GameSave.ep(n));
    const c = a.cond;
    switch (c.type) {
        case 'clearCount': return eps.filter(r => r.clears > 0).length >= c.n;
        case 'allCleared': return eps.every(r => r.clears > 0);
        case 'noDeathClear': return eps.filter(r => r.clears > 0 && r.deaths === 0).length >= c.n;
        case 'deathTotal': return eps.reduce((s, r) => s + r.deaths, 0) >= c.n;
        case 'clueCount': return CLUES.filter(x => GameSave.hasClue(x.id)).length >= c.n;
        case 'allClues': return CLUES.every(x => GameSave.hasClue(x.id));
        case 'dedCount': return DEDUCTIONS.filter(x => GameSave.hasDeduction(x.id)).length >= c.n;
        case 'allDeductions': return DEDUCTIONS.every(x => GameSave.hasDeduction(x.id));
        case 'flag': return GameSave.flag(c.name);
        case 'secret': return GameSave.hasSecret(c.id);
        case 'secretCount': return c.ids.filter(id => GameSave.hasSecret(id)).length >= c.n;
        default: return false;
    }
}

let checkingAchievements = false;
function checkAchievements() {
    if (checkingAchievements) return; // addAchievement 가 다시 변경 알림을 보내므로 재진입 방지
    checkingAchievements = true;
    try {
        ACHIEVEMENTS.forEach(a => {
            if (!GameSave.hasAchievement(a.id) && achievementMet(a)) {
                GameSave.addAchievement(a.id);
                showToast('🏆 업적 달성', a.title, 'achievements');
            }
        });
    } finally {
        checkingAchievements = false;
    }
}

// ---------- 창 열기/닫기 ----------
function openNotebook(tab) {
    const win = document.getElementById('notebookWindow');
    if (!win) return;
    if (tab) notebookState.tab = tab;
    win.style.display = 'flex';
    highestZIndex++;
    win.style.zIndex = highestZIndex;
    updateDarkWebTaskbar();
    renderNotebook();
}

function closeNotebook() {
    const win = document.getElementById('notebookWindow');
    if (!win) return;
    win.style.display = 'none';
    updateDarkWebTaskbar();
}

function switchNotebookTab(tab) {
    notebookState.tab = tab;
    notebookState.message = '';
    renderNotebook();
}

// ---------- 렌더링 ----------
function renderNotebook() {
    const body = document.getElementById('notebook-body');
    if (!body) return;
    const prevScroll = body.scrollTop;
    body.innerHTML = '';

    const tabs = [['board', '사건 보드'], ['clues', '단서'], ['deductions', '추리'], ['achievements', '업적'], ['record', '기록']];
    // The CLASSIFIED section does not exist until the first recovered record.
    const hasClassified = !!(window.Classified && Classified.count() > 0);
    if (hasClassified) tabs.push(['classified', 'CLASSIFIED']);
    else if (notebookState.tab === 'classified') notebookState.tab = 'board';
    const bar = h('div', 'display: flex; gap: 4px; padding: 6px 8px 0; background: #1a1a1a; border-bottom: 1px solid #333; position: sticky; top: 0; z-index: 2;');
    bar.className = 'nb-tabs';
    tabs.forEach(([key, label]) => {
        const active = notebookState.tab === key;
        const tab = h('div',
            `padding: 4px 12px; font-size: 11px; cursor: pointer; border: 1px solid #555; border-bottom: none; color: ${active ? '#000' : NB_RED}; background: ${active ? NB_RED : '#111'}; font-weight: bold;`,
            label, () => switchNotebookTab(key));
        tab.className = 'nb-tab';
        bar.appendChild(tab);
    });
    body.appendChild(bar);

    const content = h('div', 'padding: 10px 12px;');
    ({ board: renderBoard, clues: renderClues, deductions: renderDeductions, achievements: renderAchievements, record: renderRecord, classified: renderClassified })[notebookState.tab](content);
    body.appendChild(content);
    body.scrollTop = prevScroll;
}

function clueCountFor(ep) {
    const all = CLUES.filter(c => c.ep === ep);
    return { found: all.filter(c => GameSave.hasClue(c.id)).length, total: all.length };
}

// 사건 카드 상태: 처리 완료 > 사망 기록 > 문서 열람 > 미접속
function episodeStatus(n, rec, cc) {
    if (rec.clears > 0) return { label: '처리 완료', color: NB_GREEN };
    if (rec.deaths > 0) return { label: '사망 기록', color: NB_RED };
    if (cc.found > 0) return { label: '문서 열람', color: '#ffcc00' };
    return { label: '미접속', color: NB_DIM };
}

function renderBoard(root) {
    const totalClues = CLUES.length;
    const foundClues = CLUES.filter(c => GameSave.hasClue(c.id)).length;
    const foundDed = DEDUCTIONS.filter(d => GameSave.hasDeduction(d.id)).length;
    const cleared = EP_NUMBERS.filter(n => GameSave.ep(n).clears > 0).length;
    const foundAch = ACHIEVEMENTS.filter(a => GameSave.hasAchievement(a.id)).length;
    root.appendChild(h('div', `color: ${NB_GREEN}; font-size: 12px; margin-bottom: 10px;`,
        `처리 완료 ${cleared}/${EP_NUMBERS.length} · 단서 ${foundClues}/${totalClues} · 추리 ${foundDed}/${DEDUCTIONS.length} · 업적 ${foundAch}/${ACHIEVEMENTS.length}`));

    const waiting = availableDeductions().length;
    if (waiting) {
        root.appendChild(h('div', 'color: #ffcc00; font-size: 11px; margin: -4px 0 10px; cursor: pointer; text-decoration: underline;',
            `연결할 수 있는 단서가 ${waiting}쌍 있습니다 → 추리 탭`, () => switchNotebookTab('deductions')));
    }

    const grid = h('div', 'display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px;');
    grid.className = 'nb-grid';
    EP_NUMBERS.forEach(n => {
        const rec = GameSave.ep(n);
        const cc = clueCountFor(n);
        const done = rec.clears > 0;
        const status = episodeStatus(n, rec, cc);
        const card = h('div',
            `border: 1px solid ${done ? NB_GREEN : '#555'}; padding: 8px; cursor: pointer; background: #111;`, null,
            () => { const fn = window[`openDarkWebFolderEP${n}`]; if (fn) fn(); });
        card.appendChild(h('div', `color: ${done ? NB_GREEN : NB_RED}; font-weight: bold; font-size: 12px;`,
            `${done ? '✔ ' : ''}[EP.${String(n).padStart(2, '0')}] ${EPISODE_TITLES[n]}`));
        card.appendChild(h('div', `color: ${status.color}; font-size: 11px; margin-top: 4px;`, status.label));
        card.appendChild(h('div', `color: ${NB_DIM}; font-size: 11px; margin-top: 2px;`,
            `사망 ${rec.deaths}회 · 단서 ${cc.found}/${cc.total}`));
        if (EPISODE_VIDEOS[n]) {
            const link = h('a', 'display: inline-block; margin-top: 6px; color: #ffcc00; font-size: 11px; text-decoration: underline;', '▶ 원본 영상 보기');
            link.href = EPISODE_VIDEOS[n];
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            link.addEventListener('click', (e) => e.stopPropagation()); // 카드(폴더 열기) 클릭과 분리
            card.appendChild(link);
        }
        grid.appendChild(card);
    });
    root.appendChild(grid);

    const channel = h('a', 'display: inline-block; margin-top: 12px; color: #ffcc00; font-size: 11px; text-decoration: underline;', '▶ 流:연 괴담 채널 바로가기');
    channel.href = CHANNEL_URL;
    channel.target = '_blank';
    channel.rel = 'noopener noreferrer';
    root.appendChild(channel);

    const jay = clueCountFor('J');
    if (GameSave.flag('jayUnlocked')) {
        root.appendChild(h('div', `margin-top: 10px; color: #ff3333; font-size: 11px;`,
            `📄 ${EPISODE_TITLES.J} · 단서 ${jay.found}/${jay.total}`));
    }
}

function toggleClueSelection(id) {
    const sel = notebookState.selected;
    const i = sel.indexOf(id);
    if (i >= 0) sel.splice(i, 1);
    else {
        if (sel.length >= 2) sel.shift();
        sel.push(id);
    }
    notebookState.message = '';
    renderNotebook();
}

// ---------- 힌트 ----------
function clueLabel(c) {
    return c.ep === 'J' ? EPISODE_TITLES.J : `${c.ep}화 ${EPISODE_TITLES[c.ep]}`;
}

// 두 단서를 모두 찾았지만 아직 연결하지 않은 추리 목록
function availableDeductions() {
    return DEDUCTIONS.filter(d => !GameSave.hasDeduction(d.id) && d.pair.every(id => GameSave.hasClue(id)));
}

function availableLinkCount(clueId) {
    return availableDeductions().filter(d => d.pair.includes(clueId)).length;
}

// 1단계: 어느 에피소드의 단서끼리 이어지는지 알려준다 / 2단계: 해당 두 단서를 선택해 준다
function requestHint() {
    const d = availableDeductions()[0];
    if (!d) {
        notebookState.message = '지금 연결할 수 있는 단서가 없습니다. 수칙 문서를 열거나 에피소드를 클리어해 단서를 더 모으십시오.';
        renderNotebook();
        return;
    }
    if (notebookState.hintId !== d.id) {
        notebookState.hintId = d.id;
        notebookState.hintStep = 0;
    }
    const [a, b] = d.pair.map(id => CLUES.find(c => c.id === id));
    if (notebookState.hintStep === 0) {
        notebookState.message = `힌트 1/2: [${clueLabel(a)}]와 [${clueLabel(b)}]의 단서 사이에 연결이 있습니다. 한 번 더 누르면 두 단서를 골라 줍니다.`;
        notebookState.hintStep = 1;
    } else {
        notebookState.selected = [...d.pair];
        notebookState.message = '힌트 2/2: 연결되는 두 단서를 선택해 두었습니다. [연결 시도]를 누르십시오.';
    }
    renderNotebook();
}

function tryConnectClues() {
    const sel = notebookState.selected;
    if (sel.length !== 2) {
        notebookState.message = '단서를 2개 선택하십시오.';
    } else {
        const d = DEDUCTIONS.find(x => x.pair.includes(sel[0]) && x.pair.includes(sel[1]));
        if (!d) {
            notebookState.message = '연결 고리를 찾지 못했습니다.';
        } else if (GameSave.hasDeduction(d.id)) {
            notebookState.message = `이미 연결한 단서입니다. 공통: ${d.link}`;
        } else {
            GameSave.addDeduction(d.id);
            notebookState.message = `연결 성립 — 공통: ${d.link}`;
            notebookState.hintId = null;
            notebookState.hintStep = 0;
        }
    }
    notebookState.selected = [];
    renderNotebook();
}

function renderClues(root) {
    const groups = [...EP_NUMBERS, 'J'];
    groups.forEach(ep => {
        const list = CLUES.filter(c => c.ep === ep);
        const cc = clueCountFor(ep);
        if (ep === 'J' && !GameSave.flag('jayUnlocked')) return; // 히든: 해금 전에는 목록 자체를 숨김
        const title = ep === 'J' ? EPISODE_TITLES.J : `[EP.${String(ep).padStart(2, '0')}] ${EPISODE_TITLES[ep]}`;
        root.appendChild(h('div', `color: ${NB_RED}; font-weight: bold; font-size: 12px; margin: 10px 0 4px; border-bottom: 1px solid #333;`,
            `${title}  (${cc.found}/${cc.total})`));
        list.forEach(c => {
            if (!GameSave.hasClue(c.id)) {
                root.appendChild(h('div', `color: #555; font-size: 11px; padding: 3px 0;`,
                    c.when === 'read' ? '??? — 수칙 문서를 열면 발견할 수 있습니다.' : c.when === 'clear' ? '??? — 에피소드를 클리어하면 발견할 수 있습니다.' : '???'));
                return;
            }
            const selected = notebookState.selected.includes(c.id);
            const box = h('div',
                `border: 1px solid ${selected ? NB_GREEN : '#444'}; background: ${selected ? '#001a00' : '#111'}; padding: 6px 8px; margin: 4px 0; cursor: pointer;`, null,
                () => toggleClueSelection(c.id));
            box.appendChild(h('div', `color: ${NB_GREEN}; font-size: 12px; line-height: 1.5;`, `"${c.quote}"`));
            box.appendChild(h('div', `color: ${NB_DIM}; font-size: 10px; margin-top: 3px;`, clueSource(c)));
            const links = availableLinkCount(c.id);
            if (links > 0) {
                box.appendChild(h('div', 'color: #ffcc00; font-size: 10px; margin-top: 3px;', `🔗 이 단서와 이어지는 다른 단서가 있습니다 (${links})`));
            }
            root.appendChild(box);
        });
    });

    // 연결 패널
    const panel = h('div', 'position: sticky; bottom: 0; background: #1a1a1a; border-top: 2px solid #ff0000; padding: 8px; margin-top: 12px;');
    const sel = notebookState.selected;
    panel.appendChild(h('div', `color: ${NB_GREEN}; font-size: 11px; margin-bottom: 6px;`,
        sel.length ? `선택한 단서 ${sel.length}/2` : '단서 2개를 선택해 연결하십시오.'));
    panel.appendChild(h('button',
        'background: #111; color: #ff0000; border: 1px solid #ff0000; font-family: monospace; font-size: 11px; padding: 4px 12px; cursor: pointer;',
        '연결 시도', tryConnectClues));
    panel.appendChild(h('button',
        'background: #111; color: #ffcc00; border: 1px solid #ffcc00; font-family: monospace; font-size: 11px; padding: 4px 12px; cursor: pointer; margin-left: 6px;',
        '힌트', requestHint));
    if (notebookState.message) {
        panel.appendChild(h('div', `margin-top: 6px; color: #ffff00; font-size: 11px; line-height: 1.5;`, notebookState.message));
    }
    root.appendChild(panel);
}

function renderDeductions(root) {
    const found = DEDUCTIONS.filter(d => GameSave.hasDeduction(d.id));
    root.appendChild(h('div', `color: ${NB_GREEN}; font-size: 12px; margin-bottom: 8px;`,
        `성립한 연결 ${found.length}/${DEDUCTIONS.length}`));
    const open = availableDeductions().length;
    root.appendChild(h('div', `color: #ffcc00; font-size: 11px; margin-bottom: 8px;`,
        open > 0 ? `지금 연결할 수 있는 단서 쌍: ${open} ([단서] 탭의 힌트 버튼을 사용해 보십시오)` : '지금 연결할 수 있는 단서 쌍이 없습니다. 단서를 더 모으십시오.'));
    if (!found.length) {
        root.appendChild(h('div', `color: ${NB_DIM}; font-size: 11px;`, '아직 연결한 단서가 없습니다. [단서] 탭에서 두 단서를 골라 연결해 보십시오.'));
    }
    found.forEach(d => {
        const box = h('div', 'border: 1px solid #444; background: #111; padding: 8px; margin: 6px 0;');
        box.appendChild(h('div', `color: ${NB_RED}; font-weight: bold; font-size: 12px; margin-bottom: 4px;`, `공통: ${d.link}`));
        d.pair.forEach(id => {
            const c = CLUES.find(x => x.id === id);
            box.appendChild(h('div', `color: ${NB_GREEN}; font-size: 11px; line-height: 1.5; margin-top: 4px;`, `"${c.quote}"`));
            box.appendChild(h('div', `color: ${NB_DIM}; font-size: 10px;`, clueSource(c)));
        });
        root.appendChild(box);
    });
}

function renderAchievements(root) {
    const got = ACHIEVEMENTS.filter(a => GameSave.hasAchievement(a.id)).length;
    root.appendChild(h('div', `color: ${NB_GREEN}; font-size: 12px; margin-bottom: 8px;`, `달성 ${got}/${ACHIEVEMENTS.length}`));
    ACHIEVEMENTS.forEach(a => {
        const on = GameSave.hasAchievement(a.id);
        const hidden = a.secret && !on; // 비밀 업적은 달성 전까지 이름과 조건을 숨긴다
        const box = h('div', `border: 1px solid ${on ? NB_GREEN : '#333'}; background: ${on ? '#001a00' : '#111'}; padding: 6px 8px; margin: 4px 0;`);
        box.appendChild(h('div', `color: ${on ? NB_GREEN : '#777'}; font-size: 12px; font-weight: bold;`, `${on ? '🏆' : '🔒'} ${hidden ? '???' : a.title}`));
        box.appendChild(h('div', `color: ${on ? NB_DIM : '#555'}; font-size: 11px; margin-top: 2px;`, hidden ? '조건은 달성하기 전까지 알 수 없습니다.' : a.desc));
        root.appendChild(box);
    });
}

// ---------- CLASSIFIED (공개 히든: 발견한 뒤에만 이 구역이 생긴다) ----------
function renderClassified(root) {
    const total = Classified.total, found = Classified.count();
    root.appendChild(h('div', `color: ${NB_RED}; font-size: 12px; font-weight: bold;`, '[ CLASSIFIED ]'));
    root.appendChild(h('div', `color: ${NB_DIM}; font-size: 11px; margin: 2px 0 10px;`, `복구된 분류 보류 기록 ${found} / ${total}`));
    const open = notebookState.classifiedOpen;
    Classified.entries().forEach(entry => {
        if (!Classified.has(entry.id)) return;
        const row = h('div', `color: ${open === entry.id ? '#ffcc00' : NB_GREEN}; font-size: 12px; margin-bottom: 6px; cursor: pointer;`,
            `■ ${entry.number}  ${entry.title}`, () => {
                notebookState.classifiedOpen = open === entry.id ? null : entry.id;
                if (notebookState.classifiedOpen) Classified.markViewed(entry.id);
                renderNotebook();
            });
        row.className = 'nb-classified-entry';
        root.appendChild(row);
        if (open === entry.id) {
            const doc = h('pre', 'color: #cfcfcf; background: #050505; border: 1px solid #333; padding: 10px; margin: 0 0 10px; font-size: 12px; line-height: 1.6; white-space: pre-wrap;', entry.document);
            doc.id = 'classified-document';
            root.appendChild(doc);
        }
    });
    // undefined / undiscovered slots are never listed (no locked rows); 3 / 3 is shown as just that, nothing else happens
}

function copyText(text, onDone) {
    const fallback = () => {
        const ta = document.createElement('textarea');
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand('copy'); } catch (e) { /* ignore */ }
        ta.remove();
        onDone();
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(onDone).catch(fallback);
    } else {
        fallback();
    }
}

function renderRecord(root) {
    const st = GameSave.get();
    const totalClears = EP_NUMBERS.reduce((a, n) => a + GameSave.ep(n).clears, 0);
    const totalDeaths = EP_NUMBERS.reduce((a, n) => a + GameSave.ep(n).deaths, 0);
    root.appendChild(h('div', `color: ${NB_GREEN}; font-size: 12px; margin-bottom: 4px;`,
        `총 클리어 ${totalClears}회 · 총 사망 ${totalDeaths}회 · 엔딩 ${GameSave.flag('finaleSeen') ? '확인함' : '미확인'}`));
    const termDone = ['t-bus', 't-hq', 't-ourward', 't-record', 't-clue', 't-report'].filter(id => GameSave.hasSecret(id)).length;
    const msgDone = ['m-hinted', 'm-profanity', 'm-mirror', 'm-glitch', 'm-factory', 'm-night', 'm-memory', 'm-record', 'm-episode'].filter(id => GameSave.hasSecret(id)).length;
    root.appendChild(h('div', `color: ${NB_DIM}; font-size: 11px; margin-bottom: 4px;`,
        `기밀 터미널 발견 ${termDone}/6 · 본부 메신저 반응 ${msgDone}/9${GameSave.workerNo() ? ` · 작업자 번호 ${GameSave.workerNo()}` : ''}`));
    root.appendChild(h('div', `color: ${NB_DIM}; font-size: 11px; margin-bottom: 12px;`,
        '사건·현장 근무·별도 기록은 이 브라우저에 각각 저장됩니다. 아래 세이브 코드로 함께 옮길 수 있습니다. 구 코드에 없는 기록은 현재 상태를 유지합니다.'));

    root.appendChild(h('div', `color: ${NB_RED}; font-size: 12px; font-weight: bold; margin-bottom: 4px;`, '세이브 코드 내보내기'));
    const out = h('textarea', 'width: 100%; height: 56px; background: #000; color: #00ff00; border: 1px solid #333; font-family: monospace; font-size: 10px; box-sizing: border-box;');
    out.readOnly = true;
    out.value = GameSave.exportCode();
    root.appendChild(out);
    const msg = h('span', `margin-left: 8px; color: #ffff00; font-size: 11px;`, '');
    const copyBtn = h('button', 'background: #111; color: #ff0000; border: 1px solid #ff0000; font-family: monospace; font-size: 11px; padding: 4px 12px; cursor: pointer; margin-top: 4px;',
        '복사', () => { out.value = GameSave.exportCode(); copyText(out.value, () => { msg.textContent = '복사했습니다.'; }); });
    root.appendChild(copyBtn);
    root.appendChild(msg);

    root.appendChild(h('div', `color: ${NB_RED}; font-size: 12px; font-weight: bold; margin: 14px 0 4px;`, '세이브 코드 불러오기'));
    const inp = h('textarea', 'width: 100%; height: 56px; background: #000; color: #00ff00; border: 1px solid #333; font-family: monospace; font-size: 10px; box-sizing: border-box;');
    inp.placeholder = '세이브 코드를 붙여넣으십시오...';
    inp.id = 'save-code-input';
    root.appendChild(inp);
    const msg2 = h('span', `margin-left: 8px; color: #ffff00; font-size: 11px;`, '');
    msg2.id = 'save-code-status'; msg2.setAttribute('role', 'status');
    const importBtn = h('button', 'background: #111; color: #ff0000; border: 1px solid #ff0000; font-family: monospace; font-size: 11px; padding: 4px 12px; cursor: pointer; margin-top: 4px;',
        '불러오기', async () => {
            const code = inp.value;
            if (!code.trim()) { msg2.textContent = '코드를 입력하십시오.'; return; }
            importBtn.disabled = true; inp.readOnly = true;
            try {
                // AUTHOR is separate browser metadata; it never replaces a Story save.
                if (window.AuthorRoute && await AuthorRoute.tryImport(code)) {
                    // Nothing is announced: the input is cleared and the notebook simply closes, as if nothing happened.
                    // ([제작자에게.txt] is there the next time the player looks at the desktop.)
                    inp.value = ''; msg2.textContent = '';
                    closeNotebook();
                    return;
                }
                if (!confirm('현재 진행 기록을 덮어씁니다. 계속할까요?')) return;
                if (GameSave.importCode(code)) {
                    msg2.textContent = '불러왔습니다. 화면을 새로고침합니다...';
                    setTimeout(() => location.reload(), 800); // Keep existing Story restore behavior.
                } else {
                    msg2.textContent = '올바르지 않은 코드입니다.';
                }
            } finally {
                importBtn.disabled = false; inp.readOnly = false;
            }
        });
    importBtn.id = 'save-code-import'; root.appendChild(importBtn);
    root.appendChild(msg2);

    root.appendChild(h('div', `color: ${NB_RED}; font-size: 12px; font-weight: bold; margin: 14px 0 4px;`, '기록 초기화'));
    root.appendChild(h('button', 'background: #2b0a0a; color: #ff3333; border: 1px solid #ff0000; font-family: monospace; font-size: 11px; padding: 4px 12px; cursor: pointer;',
        '모든 진행 기록 삭제', () => {
            if (!confirm('모든 진행 기록(사건, 현장 근무, 별도 기록)이 삭제됩니다. 되돌릴 수 없습니다. 계속할까요?')) return;
            GameSave.reset();
            notebookState.selected = [];
            notebookState.message = '';
            location.reload(); // 엔딩/루프 상태 등 화면 상태를 저장 데이터와 맞추기 위해
        }));
    root.appendChild(h('div', `color: #555; font-size: 10px; margin-top: 14px;`, `저장 형식 v${st.v}`));
}

// ---------- 훅 설치: app.js 를 거의 건드리지 않고 클리어/사망/문서열람 지점에 연결 ----------
function installProgressHooks() {
    const wrap = (name, after) => {
        const orig = window[name];
        if (typeof orig !== 'function') {
            console.warn('[progress hook] 함수를 찾을 수 없음:', name);
            return;
        }
        window[name] = function (...args) {
            const result = orig.apply(this, args);
            try { after(...args); } catch (e) { console.warn('[progress hook]', name, e); }
            return result;
        };
    };

    // EP.01 (접미사 없는 함수) 과 EP.02~08 은 이름 규칙이 같다.
    wrap('triggerGameClear', () => GameProgress.onClear(1));
    wrap('triggerDeath', () => GameProgress.onDeath(1));
    wrap('openDarkWebReport', () => GameProgress.onReadReport(1));
    for (let n = 2; n <= 8; n++) {
        wrap(`triggerGameClearEP${n}`, () => GameProgress.onClear(n));
        wrap(`triggerDeathEP${n}`, () => GameProgress.onDeath(n));
    }
    // 수칙 문서 열람 (EP.02~10)
    for (let n = 2; n <= 10; n++) {
        wrap(`openDarkWebReportEP${n}`, () => GameProgress.onReadReport(n));
    }
    // EP.09: 클리어는 app.js 에서 직접 GameProgress.onClear(9) 호출, 사망은 통화 함정 함수
    wrap('triggerCallTrap', () => GameProgress.onDeath(9));
    // 요원 제이의 기록
    wrap('openJayReport', () => GameProgress.onJayOpened());
    // 다크웹 재진입 시 저장된 진행 반영
    //  - 엔딩을 이미 봤다면: 루프 상태로 시작 (제이의 기록 아이콘 숨김, 새 근무자 문서 표시)
    //  - 아직 못 봤다면: EP.09 클리어/제이 해금 상태 유지
    wrap('confirmDarkWebWarning', () => {
        if (GameSave.flag('finaleSeen')) {
            applyLoopDesktopState(false);
        } else if (GameSave.ep(9).clears > 0 || GameSave.flag('jayUnlocked')) {
            unlockJayReport();
        }
    });
    wrap('disconnectDarkWeb', () => closeNotebook());
    // 엔딩(블루스크린)은 한 번만: 시작되는 순간 저장한다. 열려 있던 노트 창은 닫는다.
    // 루프 상태에서는 EP.01 수칙 아이콘이 '신규 근무자 문서'로 바뀌어 열 수 없게 되므로, 못 얻은 EP.01 문서 단서는 여기서 지급한다.
    wrap('triggerLoopShutdown', () => {
        closeNotebook();
        GameProgress.grant(1, 'read');
        GameSave.setFlag('finaleSeen', true);
    });
}

window.addEventListener('load', () => {
    installProgressHooks();
    GameSave.onChange(() => {
        const win = document.getElementById('notebookWindow');
        if (win && win.style.display !== 'none') renderNotebook();
    });
    GameSave.onChange(checkAchievements);
    if (window.Classified) Classified.onChange(() => {
        const win = document.getElementById('notebookWindow');
        if (win && win.style.display !== 'none') renderNotebook();
    });
    checkAchievements(); // 이미 저장된 기록으로 달성한 업적 반영
});

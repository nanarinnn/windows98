// EP06 view: one classroom. The roll book, desk 17, the podium, the door, the speaker, the board and the clock are the interface
// (each is a clickable object; clicking is the teacher's own action: looking, writing on the board, opening the door...). The HUD shows only the
// schedule label, the place and "lesson in progress". No anomaly name, no flag, no answer is displayed. Contextual buttons appear only when the
// situation is in front of the player (the roll answer, the strain of the eyes, a student speaking...), never as a standing list.
window.FieldEP06UI = (() => {
    const data = FieldEP06Data;
    const T = data.tuning;
    const X = data.text;
    const $ = id => document.getElementById(id);
    let sig = '', lastVideo = '', view = '', lastPhase = '', last = null;

    function mount(root) {
        sig = ''; lastVideo = ''; view = ''; lastPhase = ''; last = null;
        const seats = [15, 16, 17, 18, 19].map(n => `<button type="button" class="f6-obj f6-seat${n === 17 ? ' f6-seat17' : ''}" id="f6-seat-${n}" data-id="seat${n}" aria-label="${n}번 자리">${n}</button>`).join('');
        root.innerHTML = `<div class="field-hud"><strong id="f6-phase"></strong><span id="f6-place"></span><span id="f6-status"></span></div>
            <div class="field-grid"><section class="field-observation">
            <div class="field-camera f6-room" id="f6-room"><video id="f6-video" muted loop playsinline></video><div class="field-scanlines"></div>
              <button type="button" class="f6-obj" id="f6-board" data-id="board" aria-label="칠판">칠판</button>
              <button type="button" class="f6-obj" id="f6-speaker" data-id="speaker" aria-label="스피커">스피커</button>
              <button type="button" class="f6-obj" id="f6-clock" data-id="clock" aria-label="시계">시계</button>
              <button type="button" class="f6-obj" id="f6-door" data-id="door" aria-label="교실 문">교실 문</button>
              <button type="button" class="f6-obj" id="f6-podium" data-id="podium" aria-label="교탁">교탁</button>
              <div class="f6-seats">${seats}</div>
              <div id="f6-water"></div><div id="f6-card" hidden></div><div id="f6-text"></div></div>
            <div class="field-controls" id="f6-actions"></div>
            <pre id="field-log" role="log" aria-label="현장 통신 기록"></pre></section>
            <aside><h3>수칙 문서</h3><div id="field-tools"></div>
            <p class="field-help">수업과 조회는 수칙 열람 중에도 계속됩니다. 연결을 종료해도 일과 기록은 이 브라우저에 보관되며 다음 파견에서 이어집니다.</p></aside></div><div id="field-outcome"></div>`;
        for (const el of root.querySelectorAll('.f6-obj')) el.onclick = () => click(el.dataset.id);
        const pre = document.createElement('pre'); pre.className = 'field-rules';
        const source = document.querySelector(data.reportSelector);   // single source: same text as the Story window / 6화.txt
        pre.textContent = source ? source.value : '수칙 문서 연결 불가';
        $('field-tools').append(pre);
    }

    // The podium opens a card; the roll book is one of its items. Everything else goes straight to the game.
    function click(id) {
        if (id === 'podium') { view = view === 'podium' ? '' : 'podium'; card(last); }
        FieldCore.action('obj', id);
    }

    function btn(label, name, value, id) {
        const el = document.createElement('button'); el.type = 'button'; el.textContent = label; el.id = id;
        el.addEventListener('click', () => FieldCore.action(name, value)); return el;
    }

    function actions(s) {
        const d = s.data, list = [];
        const add = (...args) => list.push(btn(...args));
        const elapsed = T.aTime - d.aT;
        if (d.phase === 'prep') add('조회를 시작한다', 'startHomeroom', null, 'f6-start-homeroom');
        if (d.deskSeen && d.deskDirty && !d.deskClean && d.a !== 'active' && d.iso !== 'inside') add('17번 책상과 의자를 닦는다', 'clean', null, 'f6-clean');
        if (d.phase === 'homeroom') {
            if (d.a === 'active') {
                if (d.strainLeft > 0) { add('왼쪽 눈을 감는다', 'eye', 'L', 'f6-eye-left'); add('오른쪽 눈을 감는다', 'eye', 'R', 'f6-eye-right'); }
                if (d.talkShown > 0 && elapsed < d.talkUntil) add('대답한다', 'answer', null, 'f6-answer');
                if (d.urgeShown > 0 && elapsed < d.urgeUntil) add('자리에서 일어나 움직인다', 'move', null, 'f6-move');
            } else if (d.iso === 'pending') {
                add('해당 학생과 함께 2학년 3반 맞은편 격리실로 이동한다', 'goIso', null, 'f6-go-iso');
            } else if (d.iso !== 'inside') {
                if (d.att === 'await') {
                    add('“17번 박예림 결석”이라고 복창하며 결석 처리한다', 'absent', null, 'f6-absent');
                    add('17번 박예림 출석 처리한다', 'present', null, 'f6-present');
                }
                if (d.att === 'ready' || d.att === 'calling' || d.att === 'await') add('다음 번호를 호명한다', 'call', null, 'f6-call');
                if (d.att === 'done') add('조회를 마친다', 'endHomeroom', null, 'f6-end-homeroom');
            }
        }
        if (d.phase === 'break' && d.c === 'pressed') {
            for (const n of [16, 18, 19]) add(`${n}번 ${data.students[n]} 학생을 학생안전부로 안내한다`, 'escort', n, `f6-escort-${n}`);
        }
        if (d.phase === 'listening') {
            if (d.d === 'noise') { add('“시험 중에는 잡담 금지”라고 크게 말한다', 'say', null, 'f6-say'); add('시험을 중단시킨다', 'stopExam', null, 'f6-stop-exam'); }
            if (d.ltEnd && d.dAnom) add('교실 안 모든 학생과 나에게 SNS-0017을 뿌린다', 'sns', null, 'f6-spray');
        }
        if (d.phase === 'closing') {
            if (d.seatSeen && d.seat === 'water' && !d.out) add('모든 학생을 교실 밖으로 내보낸다', 'dismiss', null, 'f6-dismiss');
            add('조례를 마친다', 'endClosing', null, 'f6-end-closing');
        }
        $('f6-actions').replaceChildren(...list);
    }

    function card(s) {
        const el = $('f6-card'); if (!el || !s) return;
        const d = s.data;
        if (view === 'podium') {
            el.hidden = false; el.replaceChildren();
            const title = document.createElement('b'); title.textContent = '교탁'; el.append(title);
            const items = [['출석부', () => { view = 'roll'; card(last); FieldCore.action('obj', 'roll'); }, 'f6-item-roll'],
                ['방향제 SNS-0017', () => FieldCore.action('sns'), 'f6-item-sns'],
                ['버튼', () => FieldCore.action('button'), 'f6-item-button'],
                ['내선 전화 — 현장 대응팀 (2층 교무실 옆)', () => FieldCore.action('phone', 'team'), 'f6-item-team'],
                ['내선 전화 — 특별재난관리본부 0050-0200', () => FieldCore.action('phone', 'hq'), 'f6-item-hq']];
            for (const [label, fn, id] of items) { const b = document.createElement('button'); b.type = 'button'; b.id = id; b.textContent = label; b.onclick = fn; el.append(b); }
            const close = document.createElement('button'); close.type = 'button'; close.id = 'f6-card-close'; close.textContent = '닫기'; close.onclick = () => { view = ''; card(last); }; el.append(close);
        } else if (view === 'roll') {
            el.hidden = false; el.replaceChildren();
            const title = document.createElement('b'); title.textContent = '출석부'; el.append(title);
            const rows = [];
            for (let n = T.rollFrom; n <= T.rollTo; n++) {
                let name = n === 17 ? (d.b ? data.students.other : '박예림') : data.students[n];
                let mark = n < d.next ? '✓' : '○';
                if (n === 17) {
                    if (d.b && d.reported) name += ' (임시 번호로 호명)';
                    if (d.absent) mark = '결석';
                    else if (d.att === 'await') mark = '…';
                    else if (d.b && n < d.next) mark = '✓';
                }
                rows.push(`${n}번  ${name}   ${mark}`);
            }
            const pre = document.createElement('pre'); pre.id = 'f6-roll'; pre.textContent = ['…', ...rows, '…'].join('\n'); el.append(pre);
            const close = document.createElement('button'); close.type = 'button'; close.id = 'f6-card-close'; close.textContent = '닫기'; close.onclick = () => { view = ''; card(last); }; el.append(close);
        } else el.hidden = true;
    }

    function describe(s) {
        const d = s.data;
        if (d.iso === 'inside') return '격리실이다. 문이 하나 있다.';
        if (d.phase === 'prep') return '아직 학생들이 오지 않은 교실이다. 교탁, 칠판, 17번 자리, 교실 문, 스피커, 시계가 있다.';
        if (d.phase === 'homeroom') return '조회 시간이다. 학생들이 자리에 앉아 있다.';
        if (d.phase === 'class1' || d.phase === 'class2') return '수업 시간이다.';
        if (d.phase === 'break') return '쉬는 시간이다. 학생들이 자리에서 움직이고 있다.';
        if (d.phase === 'listening') return '영어 듣기 능력 평가 시간이다. 학생들이 시험지를 보고 있다.';
        if (d.phase === 'closing') return '방과 후 조례 시간이다.';
        return '';
    }

    function video(s) {
        const el = $('f6-video'); if (!el) return;
        const d = s.data;
        const src = d.a === 'active' ? data.video.freeze
            : d.e === 'active' ? data.video.door
            : d.phase === 'closing' && d.seat === 'water' && d.seatSeen ? data.video.water
            : d.phase === 'homeroom' && view === 'roll' ? data.video.roll
            : data.video.room;
        if (src !== lastVideo) { lastVideo = src; el.src = src; el.play().catch(() => {}); }
        if (s.status === 'dead') el.pause();
    }

    function render(s) {
        if (!s || !$('f6-phase')) return;
        last = s;
        const d = s.data;
        if (d.phase !== lastPhase) { lastPhase = d.phase; view = d.phase === 'homeroom' ? 'roll' : ''; }
        if (d.a === 'active' || d.iso === 'inside') view = '';   // nothing may cover the room while the eyes must stay on desk 17
        $('f6-phase').textContent = data.schedule[d.phase];
        $('f6-place').textContent = d.iso === 'inside' ? '격리실' : '2학년 3반 교실';
        const doorLabel = d.iso === 'inside' ? '격리실 문' : '교실 문';
        if ($('f6-door').textContent !== doorLabel) { $('f6-door').textContent = doorLabel; $('f6-door').setAttribute('aria-label', doorLabel); }
        $('f6-status').textContent = s.status === 'dead' ? '기록 중단' : s.status === 'cleared' ? '일과 종료' : '일과 진행 중';
        $('f6-text').textContent = describe(s);
        $('f6-room').classList.toggle('f6-iso', d.iso === 'inside');
        $('f6-room').classList.toggle('f6-dark', d.a === 'active');
        $('f6-water').style.height = d.a === 'active' ? `${Math.round((1 - d.aT / T.aTime) * 70)}%` : '0%';
        $('f6-seat-17').classList.toggle('f6-occupied', d.b && d.phase === 'homeroom');
        const next = JSON.stringify([d.phase, d.att, d.a, d.strainLeft > 0, d.talkShown, d.urgeShown, T.aTime - d.aT < d.talkUntil, T.aTime - d.aT < d.urgeUntil, d.iso, d.c, d.d, d.ltEnd, d.dAnom, d.seatSeen, d.out,
            d.deskSeen, d.deskClean, d.next, d.reported, d.absent, s.status]);
        if (next !== sig) { sig = next; actions(s); card(s); }
        video(s);
    }

    return { mount, render };
})();

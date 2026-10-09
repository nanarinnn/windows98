// EP10 view: one production line. Top = worker number (it slowly turns into a work counter), place, line status. Under
// it the line itself: stations already passed fade behind you. Middle = the station (video + what your hands feel) and
// the toy as it has been built so far — at the final table it is the first time it is whole. Bottom = what your hands,
// eyes and mouth can do. In the corridor the HUD goes away and only walking is left.
window.FieldEP10UI = (() => {
    const data = FieldEP10Data;
    const $ = id => document.getElementById(id);
    let sig = '', lastVideo = '';
    const STAGES = ['locker', 'head', 'voice', 'arms', 'tail', 'final'];
    const LABEL = { locker: '탈의실', head: '머리 검수', voice: '음성 시험', arms: '팔 결합', tail: '꼬리 봉합', final: '최종 조립' };

    function mount(root) {
        sig = ''; lastVideo = '';
        root.innerHTML = `<div class="field-hud" id="f10-hud"><strong id="f10-worker"></strong><span id="f10-place"></span><span id="f10-status"></span></div>
            <div id="f10-line" class="f10-line"></div>
            <div class="field-grid"><section class="field-observation">
            <div class="field-camera f10-stage" id="f10-stage"><video id="f10-video" muted loop playsinline></video><div class="field-scanlines"></div>
              <div id="f10-text"></div><div id="f10-toy"></div><div id="f10-epilogue" hidden></div></div>
            <div class="field-controls" id="f10-actions"></div>
            <pre id="field-log" role="log" aria-label="현장 통신 기록"></pre></section>
            <aside><h3>작업 수칙</h3><div id="field-tools"></div></aside></div><div id="field-outcome"></div>`;
        const pre = document.createElement('pre'); pre.className = 'field-rules';
        const source = document.querySelector(data.reportSelector);   // single source: same text as the Story window / 10화.txt
        pre.textContent = source ? source.value : '수칙 문서 연결 불가';
        $('field-tools').append(pre);
    }

    function btn(label, name, value, id, cls) {
        const el = document.createElement('button'); el.type = 'button'; el.textContent = label; el.id = id; if (cls) el.className = cls;
        el.addEventListener('click', () => FieldCore.action(name, value)); return el;
    }
    function holdBtn(label, name, id) {
        const el = document.createElement('button'); el.type = 'button'; el.textContent = label; el.id = id; el.className = 'f10-hold';
        const on = e => { e.preventDefault(); try { el.setPointerCapture(e.pointerId); } catch (error) { /* synthetic */ } FieldCore.action(name, true); };
        const off = () => FieldCore.action(name, false);
        el.addEventListener('pointerdown', on); el.addEventListener('pointerup', off); el.addEventListener('pointercancel', off);
        el.addEventListener('keydown', e => { if ([' ', 'Enter'].includes(e.key) && !e.repeat) { e.preventDefault(); FieldCore.action(name, true); } });
        el.addEventListener('keyup', e => { if ([' ', 'Enter'].includes(e.key)) { e.preventDefault(); off(); } });
        return el;
    }

    function describe(s) {
        const d = s.data, st = d.st;
        if (s.status === 'cleared') return '';
        switch (d.stage) {
            case 'intro': return '인어왕자 인형. 하늘색 상의, 초록색 꼬리. 등에 버튼이 있다.';
            case 'locker':
                if (st.phase === 'find') return '작업복 탈의실. 사물함이 늘어서 있다. 하나만 문이 열려 있다.';
                return st.playing ? '사물함 앞. 천장 스피커에서 노래가 나온다. ♪' : (st.ended ? '사물함 앞. 노래가 끝났다.' : '열린 사물함 앞.');
            case 'head':
                if (st.phase === 'open') return '들고 있는 머리의 입이 벌어져 있다.';
                if (st.phase === 'down') return '벌어진 입의 머리가 작업대에 놓여 있다.';
                if (st.phase === 'fingers') return '입술 사이에 손가락 두 개가 들어가 있다.';
                if (st.phase === 'stick') return '입이 처음 크기로 돌아왔다.';
                if (st.phase === 'held') return `${st.idx + 1}번째 머리를 들고 있다. 활짝 웃는 얼굴.`;
                return st.phase === 'done' ? '검수를 통과한 머리를 들고 있다.' : `머리 검수대. 앞에서 ${st.idx + 1}번째 머리.`;
            case 'voice':
                if (st.phase === 'correct') return '몸체를 마주 보고 정상 문장을 말하는 중.';
                return '음성 시험대. 하늘색 몸체.';
            case 'arms': {
                const h = st.holding;
                if (h && h.shown) return `${h.side === 'left' ? '왼쪽' : '오른쪽'} ${h.no}번 팔을 들고 있다. ${data.armActs[h.act]}`;
                return h ? `${h.no}번 팔을 들었다.` : '팔 결합대. 몸체 양옆에 번호가 적힌 팔들.';
            }
            case 'tail':
                if (st.songT >= 0 && !st.knotted) return '꼬리 봉합대. 스피커에서 홍보곡. ♪';
                return st.hand ? '한 손이 꼬리 안에 들어가 있다.' : '꼬리 봉합대.';
            case 'final':
                if (st.phase === 'inspect') return '검수 중… 공장의 소리가 모두 멎었다.';
                if (st.phase === 'pause') return '세 번째 대사가 끝났다. 조용하다.';
                if (st.phase === 'green') return '검수 등이 초록색이다.';
                if (st.phase === 'red') return '검수 등이 빨간색이다.';
                return '최종 조립실.';
            case 'corridor': return '긴 통로. 앞으로.';
        }
        return '';
    }

    function toy(s) {
        const d = s.data, el = $('f10-toy'), t = d.toy;
        if (['intro', 'locker', 'corridor'].includes(d.stage) || s.status === 'cleared') { el.hidden = true; return; }
        el.hidden = false;
        const parts = [];
        if (d.stage === 'head' && d.st.phase !== 'done') parts.push(`<span class="f10-head${d.st.phase === 'open' || d.st.phase === 'down' || d.st.phase === 'fingers' ? ' f10-open' : ''}">머리</span>`);
        else if (t.head) parts.push('<span class="f10-head">머리</span>');
        parts.push('<span class="f10-body">몸체</span>');
        if (t.leftArm || (d.stage === 'arms' && d.st.attached.left)) parts.push(`<span class="f10-arm">왼팔 ${t.leftArm ? t.leftArm.no : ''}</span>`);
        if (t.rightArm || (d.stage === 'arms' && d.st.attached.right)) parts.push(`<span class="f10-arm">오른팔 ${t.rightArm ? t.rightArm.no : ''}</span>`);
        if (t.tailComplete || d.stage === 'tail') parts.push(`<span class="f10-tail">꼬리${d.stage === 'tail' ? ` ${'·'.repeat(d.st.stitches)}` : ''}</span>`);
        el.className = d.stage === 'final' ? 'f10-whole' : '';
        el.innerHTML = parts.join('');
        if (d.stage === 'final' && d.toy.lamp) el.dataset.lamp = d.toy.lamp; else delete el.dataset.lamp;
    }

    function actions(s) {
        const d = s.data, st = d.st, list = [];
        const add = (...args) => list.push(btn(...args));
        switch (d.stage) {
            case 'intro': add('등 버튼을 누른다', 'pressBack', null, 'f10-press'); break;
            case 'locker':
                add('뒤를 돌아본다', 'turnBack', null, 'f10-turn-back');
                if (st.phase === 'find') { add('문이 열린 사물함으로 간다', 'openLocker', null, 'f10-open-locker'); add('옆 사물함을 열어 본다', 'otherLocker', null, 'f10-other-locker'); break; }
                if (!st.read) add('문 안쪽 숫자를 소리 내어 읽는다', 'readNumber', null, 'f10-read');
                if (st.read && !st.key) { add('열쇠를 왼쪽 손목에 찬다', 'key', 'left', 'f10-key-left'); add('열쇠를 오른쪽 손목에 찬다', 'key', 'right', 'f10-key-right'); }
                if (st.key && !st.clothesIn) add('사복과 신발을 사물함에 넣는다', 'clothesIn', null, 'f10-clothes-in');
                if (st.clothesIn) for (const [i, item] of ['하늘색 작업복', '분홍색 앞치마', '흰색 장갑'].entries()) if (!st.dressed.includes(item)) add(`${item}을(를) 입는다`, 'wear', item, 'f10-wear-' + i);
                if (st.clothesIn && st.dressed.length) add('맞는 옷을 찾아 다른 사물함을 연다', 'otherLocker', null, 'f10-other-locker');
                if (st.dressed.length === 3) { add('사물함 문을 잠근다', 'lock', null, 'f10-lock'); add('탈의실을 나간다', 'leave', null, 'f10-leave'); }
                break;
            case 'head':
                if (st.phase === 'pick') add('앞에서부터 다음 머리를 든다', 'lift', null, 'f10-lift');
                if (st.phase === 'held') {
                    add('눈동자를 본다', 'inspect', 'eyes', 'f10-eyes'); add('머리를 돌려 본다', 'rotate', null, 'f10-rotate');
                    add('머리카락을 본다', 'inspect', 'hair', 'f10-hair'); add('입술을 본다', 'inspect', 'lips', 'f10-lips');
                    add('빨간 상자에 넣는다', 'reject', null, 'f10-reject'); add('기준 통과 — 들고 간다', 'pass', null, 'f10-pass');
                }
                if (st.phase === 'open') { add('빨간 상자에 던져 넣는다', 'reject', null, 'f10-throw'); add('그 자리에 내려놓는다', 'putDown', null, 'f10-put-down'); }
                if (st.phase === 'down' || st.phase === 'fingers') list.push(holdBtn('입술 사이에 검지와 중지를 넣는다 (누르고 있기)', 'fingers', 'f10-fingers'));
                if (st.phase === 'stick') {
                    if (!st.stickers.includes('left')) add('왼쪽 볼에 불량 스티커', 'sticker', 'left', 'f10-sticker-left');
                    if (!st.stickers.includes('right')) add('오른쪽 볼에 불량 스티커', 'sticker', 'right', 'f10-sticker-right');
                    add('빨간 상자에 넣는다', 'redBox', null, 'f10-red-box');
                }
                break;
            case 'voice':
                if (st.phase === 'correct') {
                    const box = document.createElement('div'); box.className = 'f10-say';
                    box.innerHTML = '<input id="f10-say" autocomplete="off" aria-label="정상 문장" placeholder="정상 문장을 끝까지">';
                    const go = document.createElement('button'); go.type = 'button'; go.id = 'f10-say-send'; go.textContent = '말한다';
                    go.addEventListener('click', () => FieldCore.action('say', $('f10-say').value));
                    box.append(go); list.push(box);
                    add('천 끄는 소리 쪽을 돌아본다', 'turnAway', null, 'f10-turn-away');
                } else {
                    if (st.presses < 4) add('등 버튼을 누른다', 'pressBack', null, 'f10-press');
                    if (st.heard >= 0) add('몸체를 마주 보고 정상 문장을 말한다', 'correct', null, 'f10-correct');
                }
                break;
            case 'arms': {
                const h = st.holding;
                if (!h) {
                    for (const side of ['left', 'right']) st[side].forEach((a, i) => { if (!a.used && !st.attached[side]) add(`${side === 'left' ? '왼쪽' : '오른쪽'} ${a.no}번 팔을 든다`, 'lift', `${side}:${i}`, `f10-arm-${side}-${i}`); });
                    if (st.spareReady) add(`예비 팔(${st.spareNo}번)을 꺼낸다`, 'takeSpare', null, 'f10-spare');
                } else {
                    add('결합 핀을 끝까지 밀어 넣는다', 'pin', null, 'f10-pin');
                    add('뿌리친다', 'shake', null, 'f10-shake');
                    add('손목을 압착 홈에 넣고 은색 페달을 밟는다', 'crush', null, 'f10-crush');
                    add('제자리에 내려놓는다', 'putBack', null, 'f10-put-back');
                }
                break;
            }
            case 'tail':
                if (!st.hand) add('꼬리를 뒤집는다', 'flip', null, 'f10-flip');
                if (!st.hand) add('한 손을 꼬리 안에 넣는다', 'hand', true, 'f10-hand'); else add('꼬리 안에서 손을 뺀다', 'hand', false, 'f10-hand-out');
                if (!st.knotted) add('한 땀 꿰맨다', 'stitch', null, 'f10-stitch');
                if (st.tangle) { add('안쪽을 들여다본다', 'lookInside', null, 'f10-look-inside'); add('실만 당긴다', 'pullThread', null, 'f10-pull-thread'); }
                add('젖은 솜을 꺼내 짠다', 'squeeze', null, 'f10-squeeze');
                if (st.stitches >= data.tuning.stitches && !st.knotted) add('마지막 매듭을 묶는다', 'knot', null, 'f10-knot');
                break;
            case 'final':
                if (st.phase === 'assemble') add('몸체를 올리고 머리를 끼운다', 'assemble', null, 'f10-assemble');
                if (st.phase === 'face') add('정면으로 세운다', 'stand', null, 'f10-stand');
                if (st.phase === 'face' || st.phase === 'press') { add('양쪽 눈을 본다', 'check', 'eyes', 'f10-check-eyes'); add('금발을 본다', 'check', 'hair', 'f10-check-hair'); add('입술 사이를 본다', 'check', 'teeth', 'f10-check-teeth'); }
                if (st.phase === 'press') add('등 버튼을 누른다', 'pressBack', null, 'f10-press');
                if (st.phase === 'pause') { const b = btn('등 버튼을 누른다', 'pressBack', null, 'f10-press'); b.disabled = true; list.push(b); }
                if (st.phase === 'press4') add('등 버튼을 누른다', 'pressBack', null, 'f10-press');
                if (st.phase === 'red') add('인형을 다시 분해한다', 'disassemble', null, 'f10-disassemble');
                if (st.phase === 'green') { add('인형을 들고 나간다', 'takeDoll', null, 'f10-take-doll'); add('인형을 그대로 두고 뒤쪽 출입문으로 나간다', 'leaveDoll', null, 'f10-leave-doll'); }
                break;
            case 'corridor':
                add('걷는다', 'walk', null, 'f10-walk', 'f10-big');
                add('"네."', 'speak', null, 'f10-speak'); add('뒤를 돌아본다', 'turnBack', null, 'f10-turn-back');
                break;
        }
        if (d.ready && d.stage !== 'final' && d.stage !== 'corridor' && d.stage !== 'locker') add('다음 공정으로 걸어간다', 'next', null, 'f10-next');
        $('f10-actions').replaceChildren(...list);
    }

    function line(s) {
        const d = s.data, root = $('f10-line');
        const at = STAGES.indexOf(d.stage);
        root.hidden = d.stage === 'intro' || d.stage === 'corridor';
        root.innerHTML = STAGES.map((st, i) => `<span class="${i < at ? 'f10-past' : i === at ? 'f10-here' : ''}">${LABEL[st]}</span>`).join('<i>›</i>');
    }

    function video(s) {
        const el = $('f10-video'); if (!el) return;
        const st = s.data.stage;
        const src = data.video[{ locker: 'locker', head: 'head', voice: 'voice', arms: 'arm', corridor: 'exit' }[st] || 'idle'];
        if (src !== lastVideo) { lastVideo = src; el.src = src; el.play().catch(() => {}); }
        if (s.status !== 'active' || (st === 'final' && s.data.st.phase === 'inspect')) el.pause();
    }

    function render(s) {
        if (!s || !$('f10-worker')) return;
        const d = s.data, st = d.st, i = STAGES.indexOf(d.stage);
        // the HUD slowly treats you as a worker: number -> number with counters
        $('f10-worker').textContent = i >= 1 ? `${d.worker} / 검수 완료 ${d.counts.passed} · 불량 회수 ${d.counts.rejected}` : (d.stage === 'intro' ? '—' : `작업자 ${d.worker}`);
        $('f10-place').textContent = d.stage === 'intro' ? '' : (FieldCore.mission('EP10').PLACE[d.stage] || '');
        $('f10-status').textContent = (d.stage === 'locker' && st.playing) || (d.stage === 'tail' && st.songT >= 0 && !st.knotted) ? '♪' : d.toy.lamp === 'green' ? '검수 등 ●' : d.toy.lamp === 'red' ? '검수 등 ●' : '';
        $('f10-status').className = d.toy.lamp ? 'f10-lamp-' + d.toy.lamp : '';
        $('f10-hud').hidden = d.stage === 'corridor' || s.status === 'cleared';
        $('f10-stage').classList.toggle('f10-silent', d.stage === 'final' && st.phase === 'inspect');
        $('f10-stage').classList.toggle('f10-corridor', d.stage === 'corridor' || s.status === 'cleared');
        $('f10-text').textContent = describe(s);
        const epi = $('f10-epilogue');
        if (s.status === 'cleared') { epi.hidden = false; epi.textContent = ['FIELD OBSERVATION', '10 / 10', '', ...data.epilogue].join('\n'); } else epi.hidden = true;
        toy(s); line(s);
        const strip = (k, v) => (['t', 'song', 'songT', 'idle', 'wet', 'inside'].includes(k) ? undefined : v);
        const next = JSON.stringify([d.stage, JSON.stringify(st, strip), d.ready, d.toy.lamp, s.status]);
        if (next !== sig) {
            const keep = $('f10-say')?.value || '';
            sig = next; actions(s);
            if ($('f10-say') && keep) $('f10-say').value = keep;
        }
        const hold = $('f10-fingers');
        if (hold) hold.setAttribute('aria-pressed', String(st.phase === 'fingers'));
        video(s);
    }

    return { mount, render };
})();

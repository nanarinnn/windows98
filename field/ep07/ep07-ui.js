// EP07 view: the counter. Top = clock / where you stand / door lock (no chime or exit counts anywhere). Middle = the
// store as seen from the register, the security-mirror inset (only while glancing), the POS lines and the ID tray.
// Bottom = what your hands and mouth can do right now (right and wrong options side by side, nothing names an event).
// Right = the player's own tally memo, under-counter phone/door/restroom, the shelf within sight, the 알바지옥 app.
window.FieldEP07UI = (() => {
    const data = FieldEP07Data;
    const $ = id => document.getElementById(id);
    let sig = '', lastVideo = '';

    function mount(root) {
        sig = ''; lastVideo = '';
        root.innerHTML = `<div class="field-hud"><strong id="f7-clock"></strong><span id="f7-where">계산대</span><span id="f7-door"></span></div>
            <div class="field-grid"><section class="field-observation">
            <div class="field-camera f7-store" id="f7-store"><video id="f7-video" muted loop playsinline></video><div class="field-scanlines"></div>
              <div id="f7-text"></div><div id="f7-window"></div><div id="f7-mirror" hidden></div>
              <div id="f7-pos" hidden></div></div>
            <div id="f7-id" hidden><div id="f7-id-hand" class="f7-zone"><small>손님 손</small></div><div id="f7-id-tray" class="f7-zone"><small>계산대</small></div></div>
            <div class="field-controls"><span id="f7-glance-slot"></span><span id="f7-actions"></span></div>
            <pre id="field-log" role="log" aria-label="현장 통신 기록"></pre></section>
            <aside>
              <h3>메모</h3><div id="f7-tally"></div>
              <h3>계산대 아래</h3><div id="f7-desk"></div>
              <h3>진열대</h3><div id="f7-shelf"></div>
              <h3>알바지옥</h3><div id="f7-app"></div>
              <h3>수칙 문서</h3><div id="field-tools"></div>
            </aside></div><div id="field-outcome"></div>`;
        const pre = document.createElement('pre'); pre.className = 'field-rules';
        const source = document.querySelector(data.reportSelector);   // single source: same text as the Story window / 7화.txt
        pre.textContent = source ? source.value : '수칙 문서 연결 불가';
        $('field-tools').append(pre);
        // mounted once so a re-render can never drop a glance that is being held
        $('f7-glance-slot').append(holdBtn('결제기 화면을 보는 척 거울 보기 (누르고 있기)', 'glance', 'f7-glance'));
    }

    function btn(label, name, value, id) {
        const el = document.createElement('button'); el.type = 'button'; el.textContent = label; el.id = id;
        el.addEventListener('click', () => FieldCore.action(name, value)); return el;
    }
    function holdBtn(label, name, id) {
        const el = document.createElement('button'); el.type = 'button'; el.textContent = label; el.id = id; el.className = 'f7-hold';
        const on = e => { e.preventDefault(); try { el.setPointerCapture(e.pointerId); } catch (error) { /* synthetic */ } FieldCore.action(name, true); };
        const off = () => FieldCore.action(name, false);
        el.addEventListener('pointerdown', on); el.addEventListener('pointerup', off); el.addEventListener('pointercancel', off);
        el.addEventListener('keydown', e => { if ([' ', 'Enter'].includes(e.key) && !e.repeat) { e.preventDefault(); FieldCore.action(name, true); } });
        el.addEventListener('keyup', e => { if ([' ', 'Enter'].includes(e.key)) { e.preventDefault(); off(); } });
        return el;
    }
    // The ID card is dragged between the customer's hand and the counter tray; the drag time is the "speed".
    function idCard(c) {
        const el = document.createElement('button'); el.type = 'button'; el.id = 'f7-id-card'; el.className = 'f7-card' + (c.blinked ? ' f7-blink' : '');
        el.innerHTML = '<span class="f7-photo"><i></i><i></i></span><span>주민등록증<br>성인</span>';
        let t0 = 0;
        el.addEventListener('pointerdown', e => { e.preventDefault(); t0 = performance.now(); try { el.setPointerCapture(e.pointerId); } catch (error) { /* synthetic */ } });
        el.addEventListener('pointerup', e => {
            const ms = Math.round(performance.now() - t0);
            const zone = document.elementFromPoint(e.clientX, e.clientY)?.closest('.f7-zone');
            if (!zone) return;
            if (zone.id === 'f7-id-tray' && c.idStage === 'handed') FieldCore.action('idTake', ms);
            if (zone.id === 'f7-id-hand' && c.idStage === 'taken') FieldCore.action('idReturn', ms);
        });
        return el;
    }

    function describe(s) {
        const d = s.data, c = d.cust;
        if (d.dawn) return '계산대 안쪽. 06:00. 유리문 밖이 아직 캄캄하다. 교대 근무자가 보이지 않는다.';
        if (!c) return d.shelfOpen ? '계산대에서 보이는 진열대 쪽.' : (d.clock > 360 ? '매장이 조용하다. 냉장고 모터 소리만 들린다.' : '매장 안이 비어 있다. 형광등 소리.');
        if (c.phase === 'browse') return '손님이 진열대 사이를 걷고 있다.';
        if (c.phase === 'paid') return c.bag && !c.bagged ? '손님이 봉투를 기다린다.' : '손님이 물건을 챙긴다.';
        return `손님이 계산대 앞에 서 있다. ${c.gaze === 'watch' ? data.text.gazeWatch : data.text.gazeAway}`;
    }

    function pos(s) {
        const c = s.data.cust, el = $('f7-pos');
        if (!c || !c.scanned.length) { el.hidden = true; return; }
        const rows = c.scanned.map(i => {
            const item = c.items[i];
            const name = item.ghost ? (item.code || '') : item.name;
            return `${name.padEnd(18, ' ')} ${item.price.toLocaleString().padStart(7, ' ')}`;
        });
        const sum = c.scanned.reduce((a, i) => a + c.items[i].price, 0);
        el.hidden = false; el.textContent = `${rows.join('\n')}\n${'합계'.padEnd(17, ' ')} ${sum.toLocaleString().padStart(7, ' ')}${c.paid ? '  결제 완료' : ''}`;
    }

    function mirror(s) {
        const d = s.data, el = $('f7-mirror');
        if (!d.glance) { el.hidden = true; return; }
        el.hidden = false; el.className = d.glance.corridor ? 'f7-corridor' : '';
        el.textContent = d.glance.corridor ? '' : (d.cust ? '거울: 통로 · 손님 뒷모습' : '거울: 빈 통로');
    }

    function actions(s) {
        const d = s.data, c = d.cust, list = [];
        const add = (...args) => list.push(btn(...args));
        if (d.dawn) add('자동문을 열고 퇴근한다', 'goOutside', null, 'f7-go-outside-main');
        if (c) {
            add('"어서 오세요."', 'greet', null, 'f7-greet');
            if (c.phase === 'counter') {
                c.items.forEach((item, i) => { if (!c.scanned.includes(i)) add(`스캔: ${item.name || '포장된 상품'}`, 'scan', i, 'f7-scan-' + i); });
                if (c.q === 'pending') {
                    add(`"${c.items[0].price.toLocaleString()}원입니다."`, 'answer', null, 'f7-answer');
                    add('가격표를 가리킨다', 'pointPrice', null, 'f7-point-price');
                    add('POS 화면을 가리킨다', 'pointScreen', null, 'f7-point-screen');
                }
                if (c.idStage === 'taken') add('사진을 자세히 본다', 'idLook', null, 'f7-id-look');
                if (c.id && (c.idStage === 'handed' || c.idStage === 'taken')) add('판매를 거절한다', 'refuse', null, 'f7-refuse');
                add('카드 결제', 'pay', 'card', 'f7-pay-card'); add('현금 결제', 'pay', 'cash', 'f7-pay-cash');
            }
            if (c.bag && !c.bagged && c.phase !== 'browse') add('봉투에 담는다', 'bag', null, 'f7-bag');
        }
        $('f7-actions').replaceChildren(...list);
        const idBox = $('f7-id');
        if (c && (c.idStage === 'handed' || c.idStage === 'taken')) {
            idBox.hidden = false;
            $('f7-id-hand').replaceChildren(Object.assign(document.createElement('small'), { textContent: '손님 손' }));
            $('f7-id-tray').replaceChildren(Object.assign(document.createElement('small'), { textContent: '계산대' }));
            (c.idStage === 'handed' ? $('f7-id-hand') : $('f7-id-tray')).append(idCard(c));
        } else idBox.hidden = true;
    }

    function tally(s) {
        const d = s.data, root = $('f7-tally'); root.replaceChildren();
        const marks = n => (n ? '|'.repeat(n).replace(/(\|{5})/g, '$1 ') : '-');
        for (const [row, label] of [['chime', '띵동'], ['exit', '나감']]) {
            const line = document.createElement('div'); line.className = 'f7-tally-row';
            const t = document.createElement('span'); t.className = 'f7-marks'; t.id = `f7-marks-${row}`; t.textContent = `${label}  ${marks(d.tally[row])}`;
            line.append(t, btn('+', 'tally', { row, delta: 1 }, `f7-tally-${row}`), btn('−', 'tally', { row, delta: -1 }, `f7-tally-${row}-minus`));
            root.append(line);
        }
    }

    function desk(s) {
        const d = s.data, root = $('f7-desk'); root.replaceChildren();
        root.append(btn('전화 0050-0200', 'hq', null, 'f7-hq'));
        root.append(d.doorLocked ? btn('자동문 잠금 해제', 'unlockDoor', null, 'f7-unlock') : btn('자동문 잠금', 'lockDoor', null, 'f7-lock'));
        root.append(btn('화장실에 다녀온다', 'leave', null, 'f7-leave'));
        if (!d.dawn) root.append(btn('자동문을 열고 밖으로 나간다', 'goOutside', null, 'f7-go-outside'));
        const p = document.createElement('p'); p.className = 'field-help';
        p.textContent = `POS 폐기 내역(전 근무): ${data.prevWaste.item} ${data.prevWaste.at}${d.wasteDone.length ? ' / 오늘: ' + d.wasteDone.map(id => data.shelf.find(i => i.id === id).name).join(', ') : ''}`;
        root.append(p);
    }

    function shelf(s) {
        const d = s.data, root = $('f7-shelf'); root.replaceChildren();
        if (!d.shelfOpen) { root.append(btn('진열대를 정리한다', 'shelf', true, 'f7-shelf')); return; }
        root.append(btn('계산대로 시선을 돌린다', 'shelf', false, 'f7-shelf-close'));
        for (const item of data.shelf) {
            const box = document.createElement('div'); box.className = 'f7-shelf-item';
            const label = document.createElement('p'); label.textContent = `${item.name}${item.note && d.wasteAlert ? ' — ' + item.note : ''}`;
            box.append(label, btn('폐기 등록', 'registerWaste', item.id, 'f7-reg-' + item.id), btn('손으로 정리', 'barehand', item.id, 'f7-bare-' + item.id), btn('회수 집게 SNS-0719', 'tongs', item.id, 'f7-tongs-' + item.id));
            root.append(box);
        }
        if (d.f === 'tongs') root.append(btn('회수 용기에 넣는다', 'contain', null, 'f7-contain'));
    }

    function app(s) {
        const d = s.data, root = $('f7-app'); root.replaceChildren();
        root.append(d.appOpen ? btn('근무 종료', 'endShift', null, 'f7-app-end') : btn('알바지옥 앱 실행', 'openApp', null, 'f7-app-open'));
    }

    function video(s) {
        const el = $('f7-video'); if (!el) return;
        const d = s.data, c = d.cust;
        const src = d.glance && d.glance.corridor ? data.video.mirror
            : c && c.blinked && c.idStage === 'taken' ? data.video.id
            : c && c.ghostScanned ? data.video.barcode
            : d.dawn ? data.video.dawn : data.video.idle;
        if (src !== lastVideo) { lastVideo = src; el.src = src; el.play().catch(() => {}); }
        if (s.status === 'dead') el.pause();
    }

    function render(s) {
        if (!s || !$('f7-clock')) return;
        const d = s.data;
        $('f7-clock').textContent = FieldCore.time(d.clock);
        $('f7-door').textContent = d.doorLocked ? '자동문: 잠김' : '자동문: 열림';
        $('f7-text').textContent = describe(s);
        $('f7-window').textContent = d.exterior === 'light' ? '창밖: 밝아진다' : '창밖: 밤';
        $('f7-window').className = d.exterior === 'light' ? 'f7-light' : '';
        mirror(s); pos(s);
        const c = d.cust;
        // gaze and blink are applied in place (not in the signature) so a held glance or an ID drag is never rebuilt
        const card = $('f7-id-card'); if (card) card.classList.toggle('f7-blink', !!(c && c.blinked));
        const next = JSON.stringify([c && [c.phase, c.mirrored, c.scanned, c.q, c.idStage, c.bagged, c.paid],d.tally, d.doorLocked, d.shelfOpen, d.f, d.wasteAlert, d.wasteDone, d.dawn, d.appOpen, s.status]);
        if (next !== sig) { sig = next; actions(s); tally(s); desk(s); shelf(s); app(s); }
        const g = $('f7-glance'); if (g) g.setAttribute('aria-pressed', String(!!d.glance));
        video(s);
    }

    return { mount, render };
})();

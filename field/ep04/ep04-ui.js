// EP04 view: the inside of the elevator is one fixed interface. Rear / left / right mirrors are the interactive observation
// surfaces; the control panel sits beside them. Same design rule as EP02/EP03: nothing that was not observed is shown.
// The HUD has only the (false) indicator, the door state and the phone. No real floor, no side of her, no distance, no
// answer highlight, no event names. Lighting/noise are in-world cues of her approach (canon), not numbers.
window.FieldEP04UI = (() => {
    const data = FieldEP04Data;
    const T = data.tuning;
    const V = data.video;
    const $ = id => document.getElementById(id);
    let sig = '', last = null, litKey = -1, lit = new Set();
    const src = {};

    function mount(root) {
        sig = ''; litKey = -1; lit = new Set(); for (const k of Object.keys(src)) delete src[k];
        const floors = [];
        for (let n = data.floors; n >= 1; n--) floors.push(`<button type="button" class="f4-floor" id="f4-floor-${n}" data-n="${n}" aria-label="${n}층 버튼">${n}</button>`);
        root.innerHTML = `<div class="field-hud"><strong id="f4-indicator" aria-label="층 표시기">${data.indicator}F</strong><span id="f4-door"></span><span id="f4-phone">휴대폰</span></div>
            <div class="field-grid"><section class="field-observation">
            <div class="f4-stage">
              <div class="f4-room" id="f4-room">
                <div class="f4-front" id="f4-front"><video id="f4-outside" muted loop playsinline></video><span class="f4-indicator">${data.indicator}</span></div>
                <div class="f4-mirrors">
                  <button type="button" class="f4-mirror f4-side" id="f4-mirror-left" aria-label="왼쪽 거울"><video muted loop playsinline></video><span class="f4-label">왼쪽 거울</span><span class="f4-note"></span></button>
                  <button type="button" class="f4-mirror f4-rear" id="f4-mirror-rear" aria-label="후면 거울"><video muted loop playsinline></video><span class="f4-label">후면 거울</span><span class="f4-num"></span><span class="f4-cnt"></span><span class="f4-note"></span></button>
                  <button type="button" class="f4-mirror f4-side" id="f4-mirror-right" aria-label="오른쪽 거울"><video muted loop playsinline></video><span class="f4-label">오른쪽 거울</span><span class="f4-note"></span></button>
                </div>
                <div class="f4-shade" id="f4-shade"></div><div class="f4-noise" id="f4-noise"></div>
              </div>
              <div class="f4-panel" id="f4-panel"><div class="f4-floors" id="f4-floors">${floors.join('')}</div>
                <button type="button" id="f4-door-open" class="f4-open" aria-label="문 열림 버튼">◀▶ 열림</button>
                <video id="f4-press" muted loop playsinline></video></div>
            </div>
            <div class="field-controls" id="f4-actions"></div>
            <pre id="field-log" role="log" aria-label="현장 통신 기록"></pre></section>
            <aside><h3>수칙 문서</h3><div id="field-tools"></div>
            <p class="field-help">수칙 열람 중에도 승강기는 멈추지 않습니다. 연결을 종료해도 진행 기록은 이 브라우저에 보관되며 다음 파견에서 이어집니다.</p></aside></div><div id="field-outcome"></div>`;
        $('f4-mirror-rear').onclick = () => FieldCore.action('rear');
        $('f4-mirror-left').onclick = () => FieldCore.action('side', 'L');
        $('f4-mirror-right').onclick = () => FieldCore.action('side', 'R');
        for (const el of root.querySelectorAll('.f4-floor')) {
            const n = Number(el.dataset.n);
            hold(el, () => FieldCore.action('press', n), () => FieldCore.action('releaseFloor', n));
        }
        hold($('f4-door-open'), () => FieldCore.action('door', true), () => FieldCore.action('door', false));
        const pre = document.createElement('pre'); pre.className = 'field-rules';
        const source = document.querySelector(data.reportSelector);   // single source: same text as the Story window / 4화.txt
        pre.textContent = source ? source.value : '수칙 문서 연결 불가';
        $('field-tools').append(pre);
    }

    // Press-and-hold input shared by the floor buttons and the door-open button. The elements are built once so a render never
    // interrupts a hold. Losing focus lets go (never a failure by itself).
    function hold(el, down, up) {
        let held = false;
        const start = () => { if (held) return; held = true; down(); };
        const end = () => { if (!held) return; held = false; up(); };
        el.addEventListener('pointerdown', event => { if (event.button !== 0) return; try { el.setPointerCapture(event.pointerId); } catch (error) { /* ignore */ } start(); });
        el.addEventListener('pointerup', end); el.addEventListener('pointercancel', end); el.addEventListener('lostpointercapture', end);
        el.addEventListener('keydown', event => { if ([' ', 'Enter'].includes(event.key)) { event.preventDefault(); start(); } });
        el.addEventListener('keyup', event => { if ([' ', 'Enter'].includes(event.key)) { event.preventDefault(); end(); } });
        el.addEventListener('blur', end);
    }

    function btn(label, name, value, id) {
        const el = document.createElement('button'); el.type = 'button'; el.textContent = label; el.id = id;
        el.addEventListener('click', () => FieldCore.action(name, value)); return el;
    }

    // Situational actions only; they appear after the situation has been observed.
    function actions(s) {
        const d = s.data, ev = d.ev, list = [];
        const add = (...args) => list.push(btn(...args));
        if (d.doors === 'open' && d.moving <= 0) add('열린 문 밖으로 나간다', 'exit', null, 'f4-exit');
        if (ev?.t === 'B' && ev.talk === 'talking') {
            add('왼쪽 거울을 두드린다', 'knock', 'L', 'f4-knock-left');
            add('오른쪽 거울을 두드린다', 'knock', 'R', 'f4-knock-right');
            add('귀를 막는다', 'cover', null, 'f4-cover');
            add('웅크린다', 'crouch', null, 'f4-crouch');
            add('대답한다', 'answer', null, 'f4-answer');
        }
        if (ev?.t === 'D') {
            add('왼쪽 거울을 휴대폰으로 촬영한다', 'photo', 'L', 'f4-photo-left');
            add('오른쪽 거울을 휴대폰으로 촬영한다', 'photo', 'R', 'f4-photo-right');
            add('가만히 있는다', 'still', null, 'f4-still');
        }
        if (d.photoOffer) add('휴대폰의 사진을 확인한다', 'viewPhoto', null, 'f4-view-photo');
        if (ev?.t === 'E' && ev.stage === 'voice') {
            add('스피커 쪽으로 고개를 돌린다', 'turn', null, 'f4-turn');
            add('대답한다', 'answer', null, 'f4-answer');
        }
        $('f4-actions').replaceChildren(...list);
    }

    function setVideo(video, key, url, flip) {
        if (!video) return;
        if (src[key] !== url) { src[key] = url; if (url) { video.src = url; video.play().catch(() => {}); } else { video.pause(); video.removeAttribute('src'); video.load(); } }
        video.style.setProperty('--flip', flip ? '-1' : '1');
    }

    function mirrors(s) {
        const d = s.data, dist = Math.min(1, d.dist / T.critical);
        const rear = $('f4-mirror-rear');
        const rv = d.rear;
        rear.querySelector('.f4-num').textContent = rv?.floor ? String(rv.floor) : '';
        rear.querySelector('.f4-cnt').textContent = rv?.floor ? `남은 횟수 ${rv.count}` : '';
        rear.querySelector('.f4-note').textContent = rv?.face ? '거울 가득 얼굴이 비친다.' : '';
        rear.classList.toggle('observed', !!rv);
        setVideo(rear.querySelector('video'), 'rear', rv?.face ? V.face : rv ? V.mirror : '', false);
        for (const side of ['L', 'R']) {
            const el = $(side === 'L' ? 'f4-mirror-left' : 'f4-mirror-right');
            const view = d.sideView[side];
            el.classList.toggle('observed', !!view);
            el.classList.toggle('her', view === 'her');
            el.querySelector('.f4-note').textContent = view === 'her' ? '안쪽에서 무언가가 기어온다.' : view === 'none' ? '반복되는 상뿐이다.' : '';
            // Her figure grows as she approaches: the silhouette scale is an in-world cue, not a number.
            el.style.setProperty('--f4-near', String(0.55 + dist * 0.9));
            setVideo(el.querySelector('video'), side, view === 'her' ? V.her : V.mirror, side === 'R');
        }
    }

    function render(s) {
        if (!s || !$('f4-door')) return;
        last = s;
        const d = s.data, ev = d.ev;
        $('f4-door').textContent = d.moving > 0 ? '승강기 이동 중' : d.doors === 'open' ? '문 열림' : '문 닫힘';
        $('f4-phone').textContent = d.phone === 'taken' ? '휴대폰 (촬영함)' : '휴대폰';
        const room = $('f4-room');
        const dim = Math.min(1, d.dist / T.critical);
        $('f4-shade').style.opacity = String(0.12 + dim * 0.7);
        $('f4-noise').style.opacity = String(Math.max(0, dim - 0.15) * 0.9);
        room.classList.toggle('f4-doors-open', d.doors === 'open' && d.moving <= 0);
        room.classList.toggle('f4-moving', d.moving > 0);
        const voice = ev?.t === 'E' && ev.stage === 'voice';
        $('f4-panel').classList.toggle('f4-flicker', voice);
        // Button lights are never reliable (canon): a fresh random set per stop, and all flicker during the voice.
        if (litKey !== d.arrivals) {
            litKey = d.arrivals; lit = new Set();
            for (let n = 1; n <= data.floors; n++) if (Math.random() < 0.35) lit.add(n);
        }
        for (const el of document.querySelectorAll('.f4-floor')) {
            const n = Number(el.dataset.n);
            el.classList.toggle('lit', lit.has(n));
            if (voice) el.style.animationDelay = `${((n * 37) % 11) / 10}s`; else el.style.animationDelay = '';
        }
        const pressing = d.holdFloor || (d.doorHold && d.doors === 'open');
        $('f4-panel').classList.toggle('f4-pressing', !!pressing);
        setVideo($('f4-outside'), 'outside', d.doors === 'open' && d.moving <= 0 ? V.outside : '', false);
        setVideo($('f4-press'), 'press', pressing ? V.button : '', false);
        mirrors(s);
        const next = JSON.stringify([d.doors, d.moving > 0, ev?.t, ev?.talk, ev?.stage, d.photoOffer, s.status]);
        if (next !== sig) { sig = next; actions(s); }
        if (s.status === 'dead') document.querySelectorAll('#f4-room video, #f4-press').forEach(v => v.pause());
    }

    return { mount, render };
})();

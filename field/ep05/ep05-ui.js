// EP05 view: a forest field operation. HUD = stimulant timer / inside-outside the radius / mission state / TEAM 3 (the timer is
// operational information, not a debug value). Nothing about future events is shown: the contextual actions (red pill, EMP,
// seal, report, 91번, binding, contact responses, triage questions and verdicts) appear only after the situation has been
// observed. The right panel has the rule document, the rescue record (only what was actually confirmed) and the equipment list.
// Dangerous sounds are never played: situation D shows a blocked waveform as text.
window.FieldEP05UI = (() => {
    const data = FieldEP05Data;
    const T = data.tuning;
    const X = data.text;
    const $ = id => document.getElementById(id);
    const mmss = sec => `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(Math.floor(sec % 60)).padStart(2, '0')}`;
    let tab = 'rules', sig = '', lastVideo = '', last = null, recSig = '';

    function mount(root) {
        sig = ''; lastVideo = ''; recSig = ''; tab = 'rules';
        root.innerHTML = `<div class="field-hud"><strong id="f5-timer"></strong><span id="f5-radius"></span><span id="f5-status"></span><span id="f5-team" aria-label="구조팀 3인 1조"></span></div>
            <div class="field-grid"><section class="field-observation">
            <div class="field-camera f2-scene" id="f5-scene"><video id="f5-video" muted loop playsinline></video><div class="field-scanlines"></div>
            <span class="field-feed-label">SALDUN VALLEY FIELD OPERATION</span><div id="f5-text"></div>
            <div id="f5-surface" hidden><div class="f5-refl" id="f5-refl"><i class="f5-band"></i><i class="f5-band"></i><i class="f5-band"></i><i class="f5-band"></i><i class="f5-band"></i></div><span>표면에 비친 모습</span></div>
            <div id="f5-wave" hidden>▁▂▃▅▇▅▃▂▁ <b>재생 차단</b></div><div class="f5-vignette" id="f5-vignette"></div></div>
            <div class="field-controls" id="f5-actions"></div>
            <pre id="field-log" role="log" aria-label="현장 통신 기록"></pre></section>
            <aside><div class="field-tabs"><button id="f5-tab-rules" type="button">수칙 문서</button><button id="f5-tab-record" type="button">구조 기록</button><button id="f5-tab-equip" type="button">장비</button></div>
            <div id="field-tools"></div>
            <p class="field-help">진입 후에는 수칙을 읽는 동안에도 각성제 효력 시간이 줄어듭니다. 연결을 종료해도 작전 기록은 이 브라우저에 보관되며 다음 파견에서 이어집니다.</p></aside></div><div id="field-outcome"></div>`;
        for (const name of ['rules', 'record', 'equip']) $('f5-tab-' + name).onclick = () => { tab = name; panel(last, true); };
        panel(null, true);
    }

    function btn(label, name, value, id, opts = {}) {
        const el = document.createElement('button'); el.type = 'button'; el.textContent = label; el.id = id;
        if (opts.disabled) el.disabled = true;
        el.addEventListener('click', () => FieldCore.action(name, value)); return el;
    }

    const MOVE = {
        'edge>trail': '계곡 길 쪽으로 들어간다', 'trail>edge': '500m 경계 쪽으로 돌아간다', 'trail>woods': '숲 쪽으로 이동한다', 'woods>trail': '계곡 길 쪽으로 돌아간다'
    };

    // Situational actions only; they appear once the situation has been observed.
    function actions(s) {
        const d = s.data, list = [], busy = !!d.busy;
        const add = (label, name, value, id, opts) => list.push(btn(label, name, value, id, opts));
        const idle = { disabled: busy };
        if (d.phase === 'briefing') {
            add('장비를 점검한다', 'equip', null, 'f5-equip');
            add('각성제를 주입한다', 'inject', null, 'f5-inject', { disabled: d.injected });
            add('반경 500m 안으로 진입한다', 'enter', null, 'f5-enter');
            return $('f5-actions').replaceChildren(...list);
        }
        // --- emergencies first ---------------------------------------------------------------------------------------
        if (d.c === 'sound') add('빨간 알약을 복용한다', 'pill', null, 'f5-pill');
        if (d.dev === 'alert' || d.dev === 'emp' || d.dev === 'sealed') {
            add('소리가 담긴 파일을 재생한다', 'dPlay', null, 'f5-d-play');
            add('소형 EMP 폭탄을 사용한다', 'dEmp', null, 'f5-d-emp');
            add('해당 장비와 구역을 완전 밀폐한다', 'dSeal', null, 'f5-d-seal');
            add('본부에 보고한다', 'dReport', null, 'f5-d-report');
        }
        if (d.f === 'active') add('확보 개체 91번 검은 것을 방사한다', 'spray', null, 'f5-spray');
        if (d.contact !== 'none') {
            add('접촉 부위를 문지른다', 'rub', null, 'f5-contact-rub');
            add('구조 요원에게 보고한다', 'reportContact', null, 'f5-contact-report');
            add('접촉 부위를 씻어낸다', 'wash', null, 'f5-contact-wash');
            if (d.contact === 'swelling' || d.contact === 'expanding') { add('압박 붕대로 감는다', 'compress', null, 'f5-contact-compress'); add('얼음찜질을 한다', 'ice', null, 'f5-contact-ice'); }
        }
        if (d.bind === 'ask') {
            add('압박 붕대로 묶어 준다', 'bind', 'cloth', 'f5-bind-cloth');
            add('얼음찜질을 해 준다', 'bind', 'ice', 'f5-bind-ice');
            add('요구를 들어주지 않는다', 'declineBind', null, 'f5-bind-decline');
        }
        // --- the operation ---------------------------------------------------------------------------------------------
        add('주변을 살핀다', 'look', null, 'f5-look', idle);
        if (d.zone !== 'edge') add('주변을 수색한다', 'search', null, 'f5-search', idle);
        if (d.found && !d.secured && d.zone === d.targetZone) add('대상자를 확보한다', 'secure', null, 'f5-secure', idle);
        for (const dest of data.neighbours[d.zone]) {
            const urgeTail = d.urge >= 2 && dest === 'shore' ? ' …가까이' : '';
            if (dest === 'shore') { add(`왼쪽 길로 내려간다${urgeTail}`, 'go', 'shore:L', 'f5-go-shore-L', idle); add(`오른쪽 길로 내려간다${urgeTail}`, 'go', 'shore:R', 'f5-go-shore-R', idle); }
            else if (d.zone === 'shore' && dest === 'woods') { add('왼쪽 길로 올라간다', 'go', 'woods:L', 'f5-go-woods-L', idle); add('오른쪽 길로 올라간다', 'go', 'woods:R', 'f5-go-woods-R', idle); }
            else add(MOVE[`${d.zone}>${dest}`], 'go', dest, `f5-go-${dest}`, idle);
        }
        if (d.zone === 'edge') add('반경 밖으로 이탈한다', 'exit', null, 'f5-exit', idle);
        if (d.secured && !d.verdict) {
            add('체류 시간을 묻는다', 'askDuration', null, 'f5-ask-duration', idle);
            add('접촉 흔적을 살핀다', 'askTrace', null, 'f5-ask-trace', idle);
            add('저림 증상을 확인한다', 'askSymptom', null, 'f5-ask-symptom', idle);
            add('접촉 전 단계로 판단하고 후송한다', 'verdict', 'transport', 'f5-verdict-transport', idle);
            add('접촉자로 보고한다', 'verdict', 'report', 'f5-verdict-report', idle);
        }
        if (d.verdict === 'report' && d.kind === 'survivor' && !d.protocol) {
            add('격리실에 비상 프로토콜 A 완전 격리 시스템을 적용한다', 'protocol', 'isolate', 'f5-protocol-isolate');
            add('고통 없는 마지막이 가능한 시설로 이송한다', 'protocol', 'transfer', 'f5-protocol-transfer');
            add('일반 병동에 수용한다', 'protocol', 'ward', 'f5-protocol-ward');
        }
        $('f5-actions').replaceChildren(...list);
    }

    function describe(s) {
        const d = s.data;
        if (d.phase === 'briefing') return X.briefing(data.zones[d.lastSeen].name);
        let text = data.zones[d.zone].view;
        if (d.busy) text += d.busy.kind === 'move' ? '\n이동 중이다.' : '\n작업 중이다.';
        if (d.found && !d.secured && d.zone === d.targetZone) text += '\n대상자가 있다.';
        if (d.secured) text += '\n대상자와 함께 있다.';
        if (d.f === 'active') text += '\n표면 쪽을 보고 있다.';
        return text;
    }

    function video(s) {
        const el = $('f5-video'); if (!el) return;
        const d = s.data;
        const src = d.phase === 'briefing' ? data.video.briefing
            : d.c === 'sound' ? data.video.sound
            : d.f === 'active' ? data.video.surface
            : d.found && !d.secured && d.zone === 'shore' && d.targetZone === 'shore' ? data.video.hand
            : d.secured ? data.video.briefing
            : data.zones[d.zone].video;
        if (src !== lastVideo) { lastVideo = src; el.src = src; el.play().catch(() => {}); }
        if (s.status === 'dead') el.pause();
    }

    function panel(s, force) {
        const root = $('field-tools'); if (!root) return;
        for (const name of ['rules', 'record', 'equip']) $('f5-tab-' + name)?.setAttribute('aria-pressed', String(name === tab));
        if (tab === 'rules') {
            if (!force) return;
            root.replaceChildren();
            const pre = document.createElement('pre'); pre.className = 'field-rules';
            const source = document.querySelector(data.reportSelector);   // single source: same text as the Story window / 5화.txt
            pre.textContent = source ? source.value : '수칙 문서 연결 불가';
            root.append(pre); recSig = '';
            return;
        }
        let pre = $('f5-record');
        if (!pre) { root.replaceChildren(); pre = document.createElement('pre'); pre.id = 'f5-record'; pre.className = 'f2-status'; root.append(pre); }
        if (!s) return;
        const d = s.data;
        const lines = tab === 'equip'
            ? (d.equip ? data.equipment.map(name => `- ${name}`) : ['장비를 점검하지 않았습니다.'])
            : [`대상자: ${d.secured ? '확보' : d.found ? '발견' : '확인되지 않음'}`,
               `체류 시간 진술: ${d.known.dur || '확인하지 않음'}`,
               `접촉 흔적: ${d.known.trace || '확인하지 않음'}`,
               `저림 증상: ${d.known.sym || '확인하지 않음'}`,
               `대상자 처리: ${d.verdict === 'transport' ? 'B급 정신 치료 시설 후송' : d.verdict === 'report' ? '접촉자 보고' : '정하지 않음'}`,
               ...(d.contact !== 'none' ? ['', `본인 상태: ${d.contact === 'touched' ? '접촉 의심' : '접촉 확인'}`] : [])];
        const text = lines.join('\n');
        if (pre.textContent !== text) pre.textContent = text;
    }

    function render(s) {
        if (!s || !$('f5-timer')) return;
        last = s;
        const d = s.data, inRadius = d.phase === 'inside';
        $('f5-timer').textContent = inRadius ? `각성제 ${mmss(d.timer)}` : d.injected ? '각성제 주입됨' : '각성제 미주입';
        $('f5-timer').classList.toggle('f5-low', inRadius && d.timer <= 60);
        $('f5-radius').textContent = inRadius ? '반경 500m 내부' : '반경 500m 외부';
        $('f5-status').textContent = s.status === 'dead' ? '작전 실패' : s.status === 'cleared' ? '작전 완료' : inRadius ? '작전 중' : '브리핑';
        $('f5-team').textContent = `TEAM 3 ${d.injected ? '● ● ●' : '○ ○ ○'}`;
        $('f5-text').textContent = describe(s);
        $('f5-surface').hidden = d.f !== 'active';
        $('f5-wave').hidden = !(s.status === 'dead' && s.data.failCode === 'D_PLAYED');
        $('f5-vignette').style.opacity = String(d.urge * 0.2);
        const bands = document.querySelectorAll('#f5-refl .f5-band');
        bands.forEach((band, i) => band.classList.toggle('covered', i < d.cover));
        const next = JSON.stringify([d.phase, d.injected, d.zone, !!d.busy, d.found, d.secured, d.verdict, d.protocol, d.kind === 'survivor' && d.verdict === 'report', d.contact, d.c, d.dev, d.f, d.bind, d.urge >= 2, s.status]);
        if (next !== sig) { sig = next; actions(s); }
        panel(s, false); video(s);
    }

    return { mount, render };
})();

// 11 / 10 — 수신 기록 0050-0200. A short call sequence reached only after all three PUBLIC CLASSIFIED records are found and the
// Field Observation list is opened again. Not a mission: no death, score, QTE or FieldCore session; 10 / 10, return/death counts
// and unlocks never change. The case has no rule document: the three CLASSIFIED records (readable in the side panel) are its
// rules. A caller on 0050-0200 claims to be HQ and asks for the player's location (03: real rescue agents already know every
// personal detail and never ask; EP09: those who call from 0050-0200 asking for your location are not HQ agents), a date (02:
// whoever names a date is operated on that day), a fixed return point (01: returns happen at a random point in 기장군) and a
// name. The only clear is to give nothing and press the green end button (EP03: press the end button at once when someone asks
// for your information). Every choice is a prepared button: no name, location, device or anything typed by the player is
// collected, shown or sent. A failed call saves nothing; only a clear records the call times (Classified.completeEleven).
// All timers, sounds and listeners belong to one run and are dropped by stop() (close, disconnect, re-entry, reset).
window.ElevenTenView = (() => {
    const T = { roll: 170, line: 1300, ring: 1100, fail: 1600, repeat: 1100, after: 1800 };
    const NUMBER = '0050-0200';
    const REQ = ['loc', 'date', 'ret', 'name'];
    const REQ_LABEL = { loc: '위치 요청', date: '날짜 요청', ret: '귀환 지점', name: '성함 요청' };
    const REFUSED = { loc: '응답 없음', date: '거부', ret: '거부' };
    let run = null;
    const reduced = () => { try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } };
    const el = (tag, cls, text, attrs = {}) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; Object.assign(e, attrs); return e; };
    const btn = (label, id, onClick, cls) => { const b = el('button', cls || null, label, { type: 'button', id }); b.onclick = () => { if (run) onClick(); }; return b; };
    const hms = t => new Date(t).toLocaleTimeString('ko-KR', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const worker = () => { try { const n = window.GameSave?.workerNo?.() || 0; return n ? `작업자 번호 ${n}` : '작업자 번호 미발급'; } catch (e) { return '작업자 번호 미발급'; } };

    function later(fn, ms) { const my = run; if (!my) return; my.timers.push(setTimeout(() => { if (run === my) fn(); }, ms)); }
    // script steps stop as soon as the call is over (hung up or failed)
    function cue(fn, ms) { const live = run?.call; later(() => { if (run.call === live && !run.over) fn(); }, ms); }
    function tone(freqs, len, vol = 0.05) {
        if (!run) return;
        try {
            const A = window.AudioContext || window.webkitAudioContext; if (!A) return;
            run.audio = run.audio || new A(); const a = run.audio; if (a.state === 'suspended') a.resume().catch(() => {});
            freqs.forEach((f, i) => {
                const o = a.createOscillator(), g = a.createGain(), t0 = a.currentTime + i * len;
                o.frequency.value = f; g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vol, t0 + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t0 + len);
                o.connect(g); g.connect(a.destination); o.start(t0); o.stop(t0 + len + 0.02);
            });
        } catch (e) { /* the text is always shown */ }
    }

    function stop() {
        if (!run) return;
        const r = run; run = null;
        r.timers.forEach(clearTimeout); r.offs.forEach(off => { try { off(); } catch (e) { /* ignore */ } });
        if (r.audio) r.audio.close().catch(() => {});
        r.root.remove();
    }
    function begin(host) {
        stop();
        const root = el('div', 'e11' + (reduced() ? ' e11-calm' : ''), null, { id: 'e11' });
        host.replaceChildren(root);
        run = { host, root, timers: [], offs: [], audio: null, call: 0, over: false };
        // a reset (기록 초기화) or a lost 3 / 3 ends the sequence immediately without saving
        if (window.Classified) run.offs.push(Classified.onChange(() => { if (!window.ElevenTen.ready()) stop(); }));
        return run;
    }
    function head() {
        const h = el('div', 'e11-head', null, { id: 'e11-head' });
        for (const [k, v, id] of [['사건 번호', '11 / 10', 'e11-number'], ['사건명', '—'], ['수칙문서', '해당 없음', 'e11-rules']]) {
            const c = el('span'); c.append(el('small', null, k), el('b', null, v, id ? { id } : {})); h.append(c);
        }
        return h;
    }

    // ---------- entry: first time / after a clear ----------
    function start(host, opts = {}) {
        if (!host || !window.ElevenTen.ready()) return false;
        if (Classified.eleven() && !opts.replay) return menu(host);
        begin(host); boot(); return true;
    }
    function menu(host) {
        const r = begin(host);
        r.root.append(el('div', 'e11-title', '11 / 10'));
        const list = el('div', 'e11-files');
        list.append(btn(`수신 기록 ${NUMBER}.txt`, 'e11-file', () => residual()), btn('다시 보기', 'e11-replay', () => { begin(host); boot(); }), btn('관측 목록', 'e11-back', () => back()));
        r.root.append(list);
        return true;
    }
    function residual() {
        const e = Classified.eleven(); if (!e || !run) return;
        const lines = [`[수신 기록 ${NUMBER}]`, ''];
        REQ.forEach((k, i) => {
            if (i < e.stage) lines.push(`${hms(e.log[k])}  ${REQ_LABEL[k]} ── ${REFUSED[k]}`);
            else if (i === e.stage) lines.push(`--:--:--  ${REQ_LABEL[k]} ── 응답 전 연결 종료`);
        });
        lines.push(`${hms(e.log.end)}  연결 종료 ── 수신자`, '', '제공된 정보: 없음', '요청자의 소속은 확인되지 않았습니다.');
        run.root.querySelector('#e11-residual')?.remove();
        const box = el('div', 'e11-file', null, { id: 'e11-residual' });
        box.append(el('div', 'e11-filehead', `📄 수신 기록 ${NUMBER}.txt`), el('pre', null, lines.join('\n'), { id: 'e11-residual-text' }));
        run.root.append(box);
    }
    function back() { stop(); window.FieldUI?.catalog(); }

    // ---------- 1. loading: the return records are checked one by one, and one return is still open ----------
    function boot() {
        const r = run;
        r.root.append(head());
        const box = el('div', 'e11-boot', null, { id: 'e11-boot' });
        box.append(el('div', 'e11-boot-title', '귀환 기록 확인 중'));
        r.root.append(box);
        const cleared = window.FieldSave ? FieldSave.get().cleared : [];
        const rows = Array.from({ length: 10 }, (_, i) => {
            const id = `EP${String(i + 1).padStart(2, '0')}`, ok = cleared.includes(id);
            return [`[EP.${String(i + 1).padStart(2, '0')}] ${(typeof EPISODE_TITLES !== 'undefined' ? EPISODE_TITLES[i + 1] : '') || ''}`, ok ? '귀환 완료' : '귀환 기록 없음', ok];
        });
        const done = rows.filter(row => row[2]).length;
        const row = (label, state, cls) => { const d = el('div', 'e11-boot-row ' + (cls || '')); d.append(el('span', null, label), el('i'), el('b', null, state)); box.append(d); };
        rows.forEach(([label, state, ok], i) => later(() => { row(label, state, ok ? '' : 'e11-dim'); tone([1200], 0.03, 0.015); }, T.roll * (i + 1)));
        const t = T.roll * 11;
        later(() => { row('[ — ] —', '확인 중', 'e11-open-row'); }, t);
        later(() => {
            box.querySelector('.e11-open-row b').textContent = '귀환 절차 미완료';
            box.append(el('div', 'e11-boot-sum', `귀환 완료 ${done} / 10 · 미완료 1건`, { id: 'e11-boot-sum' }));
        }, t + T.ring);
        later(() => ring(), t + T.ring * 2);
    }
    function ring() {
        const r = run, box = r.root.querySelector('#e11-boot');
        const call = el('div', 'e11-ring', null, { id: 'e11-ring' });
        call.append(el('div', 'e11-ring-label', '[수신]'), el('div', 'e11-ring-number', NUMBER, { id: 'e11-ring-number' }), btn('수신', 'e11-answer', () => connect(), 'e11-answer'));
        box.after(call);
        const buzz = () => { tone([480, 620], 0.22, 0.04); later(buzz, 1600); };
        buzz();
    }

    // ---------- 2. the call ----------
    function connect() {
        const r = run;
        r.timers.forEach(clearTimeout); r.timers = [];
        r.root.replaceChildren(head());
        const body = el('div', 'e11-body');
        const callBox = el('section', 'e11-call');
        callBox.append(el('div', 'e11-caller', `[연결됨] ${NUMBER}`, { id: 'e11-caller' }));
        r.log = el('div', 'e11-log', null, { id: 'e11-log', role: 'log' }); r.log.setAttribute('aria-live', 'polite');
        r.choices = el('div', 'e11-choices', null, { id: 'e11-choices' });
        callBox.append(r.log, r.choices);
        body.append(callBox, reference());
        const foot = el('div', 'e11-foot');
        r.end = btn('■ 연결 종료', 'e11-hangup', () => hangup(), 'e11-hangup');
        foot.append(r.end);
        r.root.append(body, foot);
        r.call += 1; r.over = false; r.stage = 0; r.log0 = {};
        say(['확인되었습니다. 본부 현장지원팀입니다.', '귀환하신 현장 기록을 모두 확인했습니다. 수고 많으셨습니다.', '마지막 귀환 절차가 하나 남아 있습니다.', '몇 가지만 확인하겠습니다.'], askLoc);
    }
    // the three CLASSIFIED records are this case's rules
    function reference() {
        const box = el('aside', 'e11-ref', null, { id: 'e11-ref' });
        box.append(el('div', 'e11-ref-title', '참조 가능한 기록'));
        const tabs = el('div', 'e11-ref-tabs'), doc = el('pre', 'e11-ref-doc', '열람할 기록을 선택하십시오.', { id: 'e11-ref-doc' });
        for (const e of window.CLASSIFIED_ENTRIES) {
            const b = btn(e.number, `e11-ref-${e.number}`, () => {
                doc.textContent = e.document; tabs.querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b));
            });
            b.title = e.title; tabs.append(b);
        }
        box.append(tabs, doc);
        return box;
    }
    function line(text, who = 'them') {
        if (!run?.log) return;
        const d = el('div', 'e11-msg e11-' + who);
        if (who === 'them') d.append(el('small', null, NUMBER));
        d.append(el('span', null, text));
        run.log.append(d); run.log.scrollTop = run.log.scrollHeight;
        if (who === 'them') tone([900], 0.05, 0.02);
        return d;
    }
    function say(lines, then, gap = T.line) {
        run.choices.replaceChildren();
        lines.forEach((text, i) => cue(() => line(text), gap * i));
        if (then) cue(then, gap * lines.length);
    }
    function choose(list) {
        run.choices.replaceChildren(...list.map(([label, id, fn]) => btn('▸ ' + label, id, () => { run.choices.replaceChildren(); fn(); })));
    }
    function refused(k) { run.log0[k] = Date.now(); run.stage = REQ.indexOf(k) + 1; }

    function askLoc(asked) {
        if (!asked) line('현재 계신 위치를 알려 주십시오. 바로 인원을 보내겠습니다.');
        const list = [['현재 위치를 공유한다', 'e11-c-share', () => { line('현재 위치를 공유했다.', 'me'); fail('loc'); }]];
        if (!asked) list.push(['본부는 위치를 이미 알고 있지 않나요?', 'e11-c-ask', () => {
            line('본부는 위치를 이미 알고 있지 않나요?', 'me');
            say(['알고 있습니다.', '확인하려는 겁니다.', '위치를 알려 주십시오. 지금.'], () => askLoc(true));
        }]);
        list.push(['응답하지 않는다', 'e11-c-silent', () => { line('(응답하지 않았다)', 'me'); refused('loc'); askDate(); }]);
        choose(list);
    }
    function askDate() {
        say(['…응답이 없으시군요.', '괜찮습니다. 그럼 일정부터 잡겠습니다.', '구조를 원하시는 날짜를 하나 골라 주십시오.', '날짜만 정해 주시면, 그날 반드시 찾아가겠습니다.'], () => {
            run.choices.append(calendar());
            run.choices.append(btn('▸ 날짜는 정하지 않겠다', 'e11-c-nodate', () => { run.choices.replaceChildren(); line('날짜는 정하지 않겠다.', 'me'); refused('date'); askRet(); }));
        });
    }
    function calendar() {
        const now = new Date(), y = now.getFullYear(), m = now.getMonth();
        const box = el('div', 'e11-cal', null, { id: 'e11-cal' });
        box.append(el('div', 'e11-cal-head', `${y}년 ${m + 1}월`));
        const grid = el('div', 'e11-cal-grid');
        '일월화수목금토'.split('').forEach(d => grid.append(el('span', 'e11-cal-dow', d)));
        for (let i = 0; i < new Date(y, m, 1).getDay(); i++) grid.append(el('span'));
        const last = new Date(y, m + 1, 0).getDate();
        for (let d = 1; d <= last; d++) {
            const b = btn(String(d), `e11-day-${d}`, () => {
                run.choices.querySelectorAll('button').forEach(x => { x.disabled = true; });
                b.classList.add('e11-picked'); b.append(el('em', null, '수술 예정'));
                line(`${m + 1}월 ${d}일`, 'me'); fail('date', `${m + 1}월 ${d}일`);
            });
            if (d === now.getDate()) b.classList.add('e11-today');
            grid.append(b);
        }
        box.append(grid);
        return box;
    }
    function askRet() {
        say(['날짜를 정하지 않으면 구조할 수 없습니다.', '…알겠습니다.', '귀환 지점이 확정되었습니다.', '부산광역시 기장군, 태양해안 관리 본부 앞입니다.', '지금 바로 이동해 주십시오. 저희가 기다리고 있겠습니다.'], () => choose([
            ['이동한다', 'e11-c-go', () => { line('이동한다.', 'me'); fail('ret'); }],
            ['귀환 지점은 미리 정해지지 않는다', 'e11-c-random', () => { line('귀환 지점은 미리 정해지지 않는다.', 'me'); refused('ret'); askName(); }]
        ]));
    }
    function askName() {
        run.root.classList.add('e11-crack');
        say(['왜 거절하십니까.', '열 번이나 돌아오셨잖아요.', '이번에도 돌아오셔야죠.', '태양해안 기록. 수술 일정 기록. 구조 요원 확인 절차.', '다 보셨죠. 저희도 다 봤습니다.', '저희는 전부 알고 있습니다.', '그러니까 마지막으로 하나만.', '성함을 말씀해 주십시오.'], () => {
            choose([['이름을 말한다', 'e11-c-name', () => { line('이름을 말했다.', 'me'); fail('name'); }]]);
            run.end.classList.add('e11-pulse');
            const more = ['성함을 말씀해 주십시오.', '성함을.', '성함', '이름 이름 이름', '말해 말해 말해 말해', '■■■■■■■■'];
            more.forEach((text, i) => cue(() => line(text).classList.add('e11-glitch'), T.repeat * (i + 1)));
        }, T.line * 0.8);
    }

    // ---------- 3a. giving anything away: the call ends, nothing is saved ----------
    function fail(kind, date) {
        const r = run; r.over = true; r.end.disabled = true; r.end.classList.remove('e11-pulse');
        const sys = text => { const d = line(text, 'sys'); return d; };
        const next = (lines, gap = T.line) => lines.forEach((text, i) => later(() => line(text), gap * (i + 1)));
        let wait = T.line * 4;
        if (kind === 'loc') {
            const bar = el('div', 'e11-bar', null, { id: 'e11-bar' }); bar.append(el('span', null, '위치 정보 전송 중'), el('i'));
            r.log.append(bar); later(() => bar.classList.add('full'), 30);
            later(() => { bar.querySelector('span').textContent = '위치 정보 전송 완료'; next(['확인되었습니다.', '지금 그쪽으로 가고 있습니다.', '움직이지 마십시오.']); }, T.fail);
            later(() => sys('관측 위치가 확인되었습니다.'), T.fail + T.line * 4); wait = T.fail + T.line * 5;
        } else if (kind === 'date') next([`${date}. 확정되었습니다.`, '해당 날짜에 반드시 수술을 받게 됩니다.', '그날 뵙겠습니다.']);
        else if (kind === 'ret') next(['잘 생각하셨습니다.', '기다리고 있겠습니다.', '이번에는 돌아오지 않으셔도 됩니다.']);
        else next([`${worker()}.`, '확인되었습니다.', '찾았습니다.']);
        later(() => {
            r.root.classList.remove('e11-crack');
            const box = el('div', 'e11-result e11-result-fail', null, { id: 'e11-result' });
            box.append(el('p', null, '연결이 종료되었습니다.'), el('p', null, '제공된 정보: 1건', { id: 'e11-given' }));
            const row = el('div', 'e11-files');
            row.append(btn('다시 연결', 'e11-retry', () => { begin(r.host); boot(); }), btn('관측 목록', 'e11-back', () => back()));
            box.append(row);
            const cal = r.choices.querySelector('#e11-cal');   // the chosen date stays marked
            r.choices.replaceChildren(...(cal ? [cal] : []), box);
        }, wait);
    }

    // ---------- 3b. hanging up without giving anything: the clear (saved here, and only here) ----------
    function hangup() {
        const r = run; if (r.over) return;
        r.over = true; r.end.disabled = true; r.end.classList.remove('e11-pulse'); r.root.classList.remove('e11-crack');
        r.choices.replaceChildren();
        r.log0.end = Date.now();
        Classified.completeEleven({ log: r.log0, stage: r.stage });
        line('연결이 종료되었습니다.', 'sys');
        r.root.querySelector('#e11-caller').textContent = `[연결 종료] ${NUMBER}`;
        const box = el('div', 'e11-result', null, { id: 'e11-result' });
        box.append(el('p', null, '제공된 정보: 없음', { id: 'e11-given' }));
        if (r.stage < 3) box.append(el('p', null, '정보를 요구받고 바로 연결을 종료했습니다.'));
        box.append(el('p', null, '요청자의 소속은 확인되지 않았습니다.'));
        r.choices.append(box);
        // after the line is closed, one more message still arrives
        later(() => { tone([480, 620], 0.22, 0.04); line('다시 연락드리겠습니다.').classList.add('e11-glitch'); }, T.after);
        later(() => {
            box.append(el('p', 'e11-end', '관측 위치를 확인할 수 없습니다.', { id: 'e11-end' }), el('p', 'e11-end', '기록을 보관합니다.'));
            box.append(btn('관측 목록', 'e11-done', () => back()));
        }, T.after * 2);
    }

    return { start, stop, active: () => !!run, timing: T };
})();

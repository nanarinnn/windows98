// 11 / 10 — 관측 대상 미지정. A short record sequence (about 3 minutes, 5 when read slowly) reached only after all three PUBLIC
// CLASSIFIED records are found and the Field Observation list is opened again. Not a mission: no death, score, QTE, timer or
// FieldCore session; 10 / 10, return/death counts and unlocks never change. Every readable step waits for the player's click.
// Sources shown are verbatim reviewed-transcript sentences of episodes the player must have returned from to get here
// (EP03, EP08, EP09: required by classified-02/03); the EP07 door chime is reused only with a real EP07 return. Unreviewed EP10
// text is never used. The "observed subject" table lists only actions taken inside this sequence (with their real time): no name,
// address, device, browser, secret code or anything outside this view is collected or shown, and nothing is sent anywhere.
// The inner window in scene 4 is a static, inert DOM drawing (aria-hidden, no buttons, no listeners): no capture, camera or
// microphone. All timers, sounds and listeners belong to one run and are dropped by stop() (close, disconnect, re-entry, reset).
window.ElevenTenView = (() => {
    const T = { loading: 1600, blank: 900, flicker: 700, follow: 450, early: 1200, idle: 3500, residual: 2600 };
    const SRC = {
        doc: '귀하의 첫 수술은 편입 다음 날부터 7일 차 사이에 임의의 날짜로 이미 지정되어 있습니다.',            // EP03 (reviewed)
        smsHead: '안전 안내 문자. 특별재난관리본부.',                                                         // EP09 (reviewed)
        sms: '귀하는 금일 수신한 통화로 관리 대상자로 분류되었습니다.'
    };
    const ACT_LABEL = { read: '문서 열람', pick: '출처 선택', compare: '기록 대조' };
    let run = null;
    const reduced = () => { try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } };
    const el = (tag, cls, text, attrs = {}) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; Object.assign(e, attrs); return e; };
    const btn = (label, id, onClick) => { const b = el('button', null, label, { type: 'button', id }); b.onclick = () => { if (run) onClick(); }; return b; };
    const hms = t => new Date(t).toLocaleTimeString('ko-KR', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const cleared = id => (window.FieldSave ? FieldSave.get().cleared.includes(id) : false);

    function later(fn, ms) { const my = run; if (!my) return; my.timers.push(setTimeout(() => { if (run === my) fn(); }, ms)); }
    function act(k) { if (run && !run.acts[k]) run.acts[k] = Date.now(); }
    function tone(freqs, len) {
        if (!run) return;
        try {
            const A = window.AudioContext || window.webkitAudioContext; if (!A) return;
            run.audio = run.audio || new A(); const a = run.audio; if (a.state === 'suspended') a.resume().catch(() => {});
            freqs.forEach((f, i) => {
                const o = a.createOscillator(), g = a.createGain(), t0 = a.currentTime + i * len;
                o.frequency.value = f; g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(0.05, t0 + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t0 + len);
                o.connect(g); g.connect(a.destination); o.start(t0); o.stop(t0 + len + 0.02);
            });
        } catch (e) { /* the text signal is always shown */ }
    }
    function signal(text, freqs) { if (!run) return; run.sig.append(el('span', 'e11-sigline', text)); tone(freqs, 0.18); }

    function stop() {
        if (!run) return;
        const r = run; run = null;
        r.timers.forEach(clearTimeout); r.offs.forEach(off => { try { off(); } catch (e) { /* ignore */ } });
        r.root.querySelectorAll('video').forEach(v => { v.pause(); v.removeAttribute('src'); v.load(); });
        if (r.audio) r.audio.close().catch(() => {});
        r.root.remove();
    }
    function begin(host) {
        stop();
        const root = el('div', 'e11' + (reduced() ? ' e11-calm' : ''), null, { id: 'e11' });
        root.innerHTML = '<div class="e11-screen" id="e11-screen"></div><div class="e11-sig" id="e11-sig" aria-live="polite"></div><div class="e11-panel" id="e11-panel" aria-live="polite"></div>';
        host.replaceChildren(root);
        run = { root, screen: root.querySelector('#e11-screen'), sig: root.querySelector('#e11-sig'), panel: root.querySelector('#e11-panel'), timers: [], offs: [], acts: {}, audio: null };
        // a reset (기록 초기화) or a lost 3 / 3 ends the sequence immediately without saving
        if (window.Classified) run.offs.push(Classified.onChange(() => { if (!window.ElevenTen.ready()) stop(); }));
        return run;
    }

    // ---------- entry: first time / after completion ----------
    function start(host, opts = {}) {
        if (!host || !window.ElevenTen.ready()) return false;
        if (Classified.eleven() && !opts.replay) return menu(host);
        begin(host); scene1(); return true;
    }
    function menu(host) {
        const r = begin(host);
        r.panel.append(el('div', 'e11-title', '11 / 10'));
        const list = el('div', 'e11-files');
        list.append(btn('관측 대상 미지정.txt', 'e11-file', () => residual()), btn('다시 보기', 'e11-replay', () => { begin(host); scene1(); }), btn('관측 목록', 'e11-back', () => back()));
        r.panel.append(list);
        return true;
    }
    function residual() {
        const e = Classified.eleven(); if (!e || !run) return;
        const last = e.acts.compare ? ` ${hms(e.acts.compare)}` : '';
        const text = ['관측 기록: 11 / 10', '관측 위치: 미확인', '', '화면 출처와 문서 출처는 대조되었습니다.', '관측 대상은 확인되지 않았습니다.', '', '문서 열람', '출처 선택', `기록 대조${last}`].join('\n');
        run.panel.querySelector('#e11-residual')?.remove();
        const box = el('div', 'e11-file', null, { id: 'e11-residual' });
        box.append(el('div', 'e11-filehead', '📄 관측 대상 미지정.txt'), el('pre', null, text, { id: 'e11-residual-text' }));
        run.panel.append(box);
    }
    function back() { stop(); window.FieldUI?.catalog(); }

    // ---------- scene 1: loading without case information ----------
    function scene1() {
        const p = run.panel;
        p.append(el('div', 'e11-loading', 'OBSERVATION DATA LOADING', { id: 'e11-loading' }));
        later(() => {
            p.querySelector('#e11-loading').remove();
            const table = el('div', 'e11-table', null, { id: 'e11-case' });
            for (const k of ['사건명', '관측 위치', '문서 번호']) { const row = el('div', 'e11-row'); row.append(el('span', null, k), el('span', null, '—')); table.append(row); }
            p.append(table);
            later(() => {
                const row = el('div', 'e11-row e11-number'); row.append(el('span', null, '사건 번호'), el('b', null, '11 / 10', { id: 'e11-number' }));
                table.append(row);
                p.append(btn('기록 열기', 'e11-open', () => { act('read'); scene2(); }));
            }, T.blank);
        }, T.loading);
    }

    // ---------- scene 2: a misplaced source, then a thin overlay ----------
    function scene2() {
        const p = run.panel; p.replaceChildren();
        const v = el('video', 'e11-video', null, { muted: true, loop: true, playsInline: true, autoplay: true });
        v.setAttribute('muted', ''); v.setAttribute('playsinline', ''); v.src = (window.FieldEP08Data && FieldEP08Data.video.idle) || '';
        v.play().catch(() => {});
        run.screen.append(v, el('div', 'e11-overlay', SRC.doc, { id: 'e11-overlay' }));
        const src = el('div', 'e11-src', null, { id: 'e11-src-list' });
        const next = btn('다음 기록', 'e11-next', () => scene2b());
        next.hidden = true;
        p.append(el('p', 'e11-note', '관측 화면 위에 문장이 겹쳐 있다.'), btn('출처 확인', 'e11-src', () => {
            act('pick'); p.querySelector('#e11-src').remove();
            src.append(el('div', null, '화면: EP08'), el('div', null, '문서: EP03'));
            next.hidden = false;
        }), src, next);
    }
    function scene2b() {
        const p = run.panel; p.replaceChildren();
        const phone = el('div', 'e11-phone', null, { id: 'e11-phone' });
        phone.append(el('b', null, SRC.smsHead), el('span', null, SRC.sms));
        run.screen.append(phone);
        signal('[수신음]', [880, 660]);
        if (cleared('EP07')) later(() => signal(`[자동문 알림음] ${(window.FieldEP07Data && FieldEP07Data.text.chime) || ''}`.trim(), [740, 587]), 700);
        p.append(el('p', 'e11-note', '세 번째 출처가 얇게 겹친다.'), btn('출처 표 열기', 'e11-next2', () => scene3()));
    }

    // ---------- scene 3: sources, then a second table whose subject is empty ----------
    function scene3() {
        const p = run.panel; p.replaceChildren();
        const table = el('div', 'e11-table', null, { id: 'e11-sources' });
        const values = { screen: ['화면 출처', 'EP08'], doc: ['문서 출처', 'EP03'], comm: ['통신 출처', 'EP09'] };
        let seen = 0;
        for (const [k, [label, value]] of Object.entries(values)) {
            const row = el('div', 'e11-row'); const cell = el('span');
            cell.append(btn('확인', `e11-src-${k}`, () => {
                act('pick'); cell.replaceChildren(el('b', null, value)); seen += 1;
                if (seen === 3) p.append(btn('기록 대조', 'e11-compare', () => compare()));
            }));
            row.append(el('span', null, label), cell); table.append(row);
        }
        p.append(table);
        function compare() {
            act('compare'); p.querySelector('#e11-compare').remove();
            p.append(el('p', 'e11-note', '화면 출처와 문서 출처가 일치하지 않습니다.', { id: 'e11-compare-result' }));
            const second = el('div', 'e11-table', null, { id: 'e11-observed' });
            const r1 = el('div', 'e11-row'); r1.append(el('span', null, '관측 화면'), el('span', null, '연결됨'));
            const r2 = el('div', 'e11-row'); const cell = el('span');
            cell.append(btn('—', 'e11-subject', () => {
                const list = el('div', 'e11-acts', null, { id: 'e11-acts' });
                for (const k of ['read', 'pick', 'compare']) if (run.acts[k]) list.append(el('div', null, `${ACT_LABEL[k]}  ${hms(run.acts[k])}`));
                cell.replaceChildren(list);
                p.append(btn('다음', 'e11-next3', () => scene4()));
            }));
            r2.append(el('span', null, '관측 대상'), cell);
            second.append(r1, r2); p.append(second);
        }
    }

    // ---------- scene 4: the same window, moving from the inside ----------
    function scene4() {
        const p = run.panel, screen = run.screen; p.replaceChildren(); run.sig.replaceChildren();
        screen.classList.add('e11-off');
        const rows = [['화면 출처', 'EP08'], ['문서 출처', 'EP03'], ['통신 출처', 'EP09']];
        const mini = el('div', 'e11-mini', null, { id: 'e11-mini' });
        mini.setAttribute('aria-hidden', 'true');
        const miniTable = el('div', 'e11-mini-table');
        rows.forEach(([a, b]) => { const r = el('div'); r.append(el('span', null, a), el('span', null, b)); miniTable.append(r); });
        mini.append(el('div', 'e11-mini-head', '11 / 10'), el('div', 'e11-mini-label', '출처 표'), miniTable);
        miniTable.hidden = true;
        const real = el('div', 'e11-table', null, { id: 'e11-real-table' });
        rows.forEach(([a, b]) => { const r = el('div', 'e11-row'); r.append(el('span', null, a), el('b', null, b)); real.append(r); });
        real.hidden = true;
        let open = false, expands = 0, anomaly = false, ahead = false, wait = 0;
        const toggle = btn('출처 표 펼치기', 'e11-toggle', () => {
            open = !open; real.hidden = !open; toggle.textContent = open ? '출처 표 접기' : '출처 표 펼치기';
            toggle.setAttribute('aria-expanded', String(open));
            if (!open) ahead = false;
            const want = open;
            later(() => { if (!(ahead && want)) miniTable.hidden = !want; }, T.follow);   // the inner table follows a little late
            if (open) {
                expands += 1; const my = ++wait;
                later(() => {
                    if (anomaly || !open || my !== wait) return;
                    anomaly = true; ahead = true; miniTable.hidden = true;                                 // once: it folds before the player does
                    mini.classList.add('e11-mini-ahead');
                    later(() => { if (!p.querySelector('#e11-next4')) p.append(btn('다음', 'e11-next4', () => scene5())); }, 1500);
                }, expands >= 2 ? T.early : T.idle);
            }
        });
        toggle.setAttribute('aria-expanded', 'false');
        later(() => {
            screen.replaceChildren(mini); screen.classList.remove('e11-off');
            p.append(el('p', 'e11-note', '관측 화면이 다시 켜졌다. 출처 표를 펼쳐 확인하십시오.'), toggle, real);
        }, T.flicker);
    }

    // ---------- scene 5: residual record ----------
    function scene5() {
        const r = run; r.screen.replaceChildren(); r.screen.classList.add('e11-gone'); r.sig.replaceChildren();
        if (r.audio) { r.audio.close().catch(() => {}); r.audio = null; }
        r.panel.replaceChildren(el('p', 'e11-end', '관측 위치를 확인할 수 없습니다.', { id: 'e11-end' }), el('p', 'e11-end', '기록을 보관합니다.'));
        Classified.completeEleven(r.acts);   // saved only here, when the sequence reached its end
        r.panel.append(btn('관측 목록', 'e11-done', () => back()));
        later(() => back(), T.residual);
    }

    return { start, stop, active: () => !!run, timing: T };
})();

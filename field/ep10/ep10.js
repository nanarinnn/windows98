// EP10 mission: BUILD. One merman toy is made from start to finish along one production line (locker room -> head
// inspection -> voice test -> arm joining -> tail sewing -> final assembly -> the corridor out). A single toy state
// carries what the player passed at each station; the final inspection judges that toy, so an earlier mistake can be
// the reason the lamp turns red. Nothing explains the factory. Story, J record, blue screen, LOOP 02, AUTHOR and
// CLASSIFIED are never touched; the clear records Field EP10 only (10 / 10).
(() => {
    const data = FieldEP10Data;
    const T = data.tuning, X = data.text;
    const STAGES = ['intro', 'locker', 'head', 'voice', 'arms', 'tail', 'final', 'corridor'];
    const PLACE = { locker: '작업복 탈의실', head: '인어왕자 머리 검수대', voice: '인어왕자 음성 시험대', arms: '인어왕자 팔 결합대', tail: '인어왕자 꼬리 봉합대', final: '최종 조립실', corridor: '출입문 너머 통로' };
    const norm = v => String(v || '').replace(/[\s.,!?"'“”~…]/g, '');

    function pick(name, n, fallback) {
        const v = data.random(name);
        if (typeof v === 'number' && Number.isInteger(v) && v >= 0 && v < n) return v;
        if (typeof v === 'number' && v >= 0 && v < 1) return Math.floor(v * n);
        return fallback;
    }

    function fail(s, api, code) {
        const d = s.data; d.failCode = code;
        const kind = data.canonFailures.includes(code) ? '본부 회수 기록' : '작업 기록';
        api.die(`${code} — [${kind}] ${data.failures[code]} [작업 기록 중단]`, code, `[${kind}] 작업자 ${d.worker} — ${PLACE[d.stage] || '행복 공장'}`);
    }

    function workerNumber() {
        const v = data.random('worker');
        if (typeof v === 'number' && Number.isInteger(v) && v >= 1000 && v <= 9999) return v;
        try { const n = typeof GameSave !== 'undefined' && GameSave.workerNo ? GameSave.workerNo() : 0; if (n >= 1000) return n; } catch (error) { /* read only */ }
        return 1000 + Math.floor((typeof v === 'number' && v >= 0 && v < 1 ? v : Math.random()) * 9000);
    }

    function enter(s, api, stage) {
        const d = s.data;
        d.stage = stage; d.ready = false;
        if (stage !== 'intro' && stage !== 'locker') api.log(X.walk(PLACE[stage]));
        if (stage === 'locker') d.st = { phase: 'find', read: false, key: '', clothesIn: false, dressed: [], song: 0, playing: false, ended: false, behind: 0, locked: false };
        if (stage === 'head') {
            d.st = { heads: data.headLayouts[pick('heads', data.headLayouts.length, 0)].map(h => ({ ...h })), idx: 0, held: false, rotated: false, checked: {}, phase: 'pick', t: 0, stickers: [] };
            api.log('[머리 검수대] 밝은 금발과 활짝 웃는 인어왕자 머리들이 앞에서부터 한 줄로 놓여 있다.');
        }
        if (stage === 'voice') {
            const bad = [-1, 0, 1, 2][pick('badLine', 4, 0)];
            d.toy.voices = data.lines.map((_, i) => (i === 3 || i === bad) ? 'wrong' : 'ok');
            d.st = { presses: 0, phase: 'press', heard: -1, corr: null };
            api.log(X.bodyReady);
        }
        if (stage === 'arms') {
            const L = data.armLayouts[pick('arms', data.armLayouts.length, 0)];
            d.st = { left: L.left.map(a => ({ ...a })), right: L.right.map(a => ({ ...a })), spareNo: L.spare, holding: null, attached: { left: null, right: null } };
            api.log(X.armsReady);
        }
        if (stage === 'tail') {
            d.st = { orient: 'up', hand: false, stitches: 0, songT: -1, tangleAt: 3 + pick('tangleAt', 5, 2), tangle: false, tangled: false, inside: 0, knotted: false };
            api.log(X.tailReady);
        }
        if (stage === 'final') { d.st = { phase: 'assemble', presses: 0, t: 0 }; }
        if (stage === 'corridor') { d.st = { steps: 0, idle: 0, calls: 0 }; api.log(X.door); }
        api.majorEvent('STATION_' + stage.toUpperCase());
    }

    function init(s, api) {
        s.data = {
            stage: 'intro', worker: workerNumber(), failCode: '', ready: false,
            st: { presses: 0 },
            toy: { head: null, headInspection: {}, voices: [], voiceCorrections: [], leftArm: null, rightArm: null, tail: null, tailComplete: false, finalFace: null, finalVoice: null, lamp: '' },
            counts: { passed: 0, rejected: 0 }
        };
    }

    // ---- tick ----------------------------------------------------------------------------------------------------
    function tick(s, dt, api) {
        const d = s.data, st = d.st;
        if (s.status !== 'active') return;
        switch (d.stage) {
            case 'locker':
                if (st.playing) {
                    st.song += dt;
                    while (st.behind < T.behindAt.length && st.song >= T.behindAt[st.behind]) api.log(X.behind[st.behind++]);
                    if (st.song >= T.lockerSong) { st.playing = false; st.ended = true; api.log(X.songEnd); }
                }
                return;
            case 'head':
                if (st.phase === 'held' && st.heads[st.idx].mouth) {
                    st.t += dt;
                    if (st.t >= T.mouthWarn) { st.phase = 'open'; st.t = T.mouthOpenTime; api.log(X.mouthOpen); api.majorEvent('HEAD_MOUTH'); }
                } else if (st.phase === 'open') {
                    st.t -= dt; if (st.t <= 0) fail(s, api, 'HEAD_HELD');
                } else if (st.phase === 'fingers') {
                    st.t += dt;
                    if (st.t >= 1.5 && st.wet === 0) { st.wet = 1; api.log(X.wet[0]); }
                    if (st.t >= 3.5 && st.wet === 1) { st.wet = 2; api.log(X.wet[1]); }
                    if (st.t >= T.mouthHold) { st.phase = 'stick'; api.log(X.mouthBack); }
                }
                return;
            case 'voice':
                if (st.phase === 'correct') {
                    const c = st.corr; c.t += dt;
                    if (!c.cloth && c.t >= T.clothAt) { c.cloth = true; api.log(X.cloth); }
                    if (!c.whisper && c.t >= T.whisperAt) { c.whisper = true; api.log(X.whisper(c.word)); }
                    if (!c.touch && c.t >= T.touchAt) { c.touch = true; api.log(X.touch); }
                    if (c.t >= T.correctTime) failVoice(s, api, c.line);
                }
                return;
            case 'arms': {
                const h = st.holding;
                if (!h) return;
                h.t += dt;
                if (!h.shown && h.t >= T.armReveal) { h.shown = true; api.log(`[팔 결합대] ${data.armActs[h.act]}`); if (data.danger.includes(h.act)) api.majorEvent('ARM_DANGER'); }
                if (h.shown && data.danger.includes(h.act) && h.t >= T.armReveal + T.armDanger) fail(s, api, 'ARM_GRABBED');
                return;
            }
            case 'tail':
                if (st.songT >= 0 && !st.knotted) {
                    st.songT += dt;
                    if (st.songT >= T.sewSong) fail(s, api, 'TAIL_UNFINISHED');
                }
                return;
            case 'final':
                if (st.phase === 'pause') { st.t -= dt; if (st.t <= 0) st.phase = 'press4'; }
                else if (st.phase === 'inspect') {
                    st.t -= dt;
                    if (st.t <= 0) {
                        const h = d.toy.head || {};
                        const face = h.eyes === 'same' && h.hair === 'clear' && !h.teeth;
                        const voice = d.toy.voices.every(v => v !== 'wrong');
                        d.toy.finalFace = face; d.toy.finalVoice = voice;
                        if (face && voice) { st.phase = 'green'; d.toy.lamp = 'green'; api.log(X.green); api.majorEvent('LAMP_GREEN'); }
                        else { st.phase = 'red'; st.t = 3; d.toy.lamp = 'red'; api.log(X.red); api.majorEvent('LAMP_RED'); }
                    }
                } else if (st.phase === 'red') { st.t -= dt; if (st.t <= 0) fail(s, api, 'RED'); }
                return;
            case 'corridor':
                st.idle += dt;
                if (st.idle > T.stopLimit) fail(s, api, 'STOPPED');
                return;
        }
    }

    function failVoice(s, api, line) { fail(s, api, line === 0 ? 'VOICE_1' : line === 3 ? 'VOICE_4' : 'VOICE_MID'); }

    // ---- actions ---------------------------------------------------------------------------------------------------
    function action(s, name, value, api) {
        const d = s.data, st = d.st;
        if (s.status !== 'active') return;
        if (name === 'next') {
            if (!d.ready) return;
            const i = STAGES.indexOf(d.stage);
            return enter(s, api, STAGES[i + 1]);
        }
        switch (d.stage) {
            case 'intro':
                if (name !== 'pressBack' || st.presses >= 4) return;
                st.presses += 1; api.log(X.press(st.presses));
                api.log(X.play(st.presses === 4 ? data.abnormal4.replace(/\.$/, '') : data.lines[st.presses - 1]));
                if (st.presses === 4) { api.log(X.intake); api.majorEvent('INTAKE'); enter(s, api, 'locker'); api.log(X.lockerOpen); }
                return;
            case 'locker':
                if (name === 'turnBack') { if (!st.ended) return fail(s, api, 'TURNED_BACK'); return; }
                if (name === 'otherLocker') return fail(s, api, 'OTHER_LOCKER');
                if (name === 'openLocker' && st.phase === 'find') { st.phase = 'open'; return api.log(`[탈의실] 열린 사물함 안쪽 문에 네 자리 숫자가 적혀 있다.`); }
                if (st.phase === 'find') return;
                if (name === 'readNumber' && !st.read) { st.read = true; return api.log(X.readNo(d.worker)); }
                if (name === 'key' && st.read && !st.key) {
                    if (value !== 'right') return fail(s, api, 'WRONG_WRIST');
                    st.key = 'right'; return api.log(X.keyRight);
                }
                if (name === 'clothesIn' && st.key && !st.clothesIn) {
                    st.clothesIn = true; st.playing = true; st.song = 0; api.log(X.clothesIn); api.log(X.song); return api.majorEvent('LOCKER_SONG');
                }
                if (name === 'wear' && st.clothesIn && !st.dressed.includes(value) && ['하늘색 작업복', '분홍색 앞치마', '흰색 장갑'].includes(value)) {
                    st.dressed.push(value); api.log(X.dressed(value));
                    if (value === '하늘색 작업복') api.log(X.sleeveHair);
                    if (st.dressed.length === 3) api.log(X.facing);
                    return;
                }
                if (name === 'lock') {
                    if (!st.ended) return api.log('[탈의실] 아직 노래가 나오고 있다.');
                    if (st.dressed.length < 3) return api.log('[탈의실] 아직 다 갈아입지 않았다.');
                    st.locked = true; d.ready = true; return api.log(X.locked);
                }
                if (name === 'leave') {
                    if (!st.ended) return fail(s, api, 'LEFT_EARLY');
                    if (!st.locked) return api.log('[탈의실] 사물함 문이 열려 있다.');
                    return enter(s, api, 'head');
                }
                return;
            case 'head': {
                const head = st.heads[st.idx];
                if (name === 'lift' && st.phase === 'pick' && head) { st.phase = 'held'; st.t = 0; st.rotated = false; st.checked = {}; return api.log(X.headLift(st.idx + 1)); }
                if (st.phase === 'held') {
                    if (name === 'rotate') { st.rotated = true; return api.log('[머리 검수대] 머리를 천천히 돌려 본다.'); }
                    if (name === 'inspect') {
                        st.checked[value] = true;
                        if (value === 'eyes') return api.log(X.eyes(head.eyes));
                        if (value === 'hair') return api.log(st.rotated ? X.hair(head.hair) : '[머리 검수대] 앞에서만 봐서는 잘 모르겠다.');
                        if (value === 'lips') return api.log(X.lips(head.teeth));
                        return;
                    }
                    if (name === 'reject') { st.phase = 'pick'; st.idx += 1; d.counts.rejected += 1; api.log(X.redBox); return refill(st, api); }
                    if (name === 'pass') {
                        d.toy.head = { eyes: head.eyes, hair: head.hair, teeth: head.teeth }; d.toy.headInspection = { ...st.checked };
                        d.counts.passed += 1; st.phase = 'done'; d.ready = true; return api.log(X.passHead);
                    }
                    return;
                }
                if (st.phase === 'open') {
                    if (name === 'putDown') { st.phase = 'down'; return api.log(X.putDown); }
                    if (['reject', 'pass', 'inspect', 'rotate'].includes(name)) return fail(s, api, 'HEAD_HELD');
                    return;
                }
                if (st.phase === 'down' && name === 'fingers' && value) { st.phase = 'fingers'; st.t = 0; st.wet = 0; return api.log(X.fingersIn); }
                if (st.phase === 'fingers' && name === 'fingers' && !value) return fail(s, api, 'HEAD_FINGERS');
                if (st.phase === 'stick') {
                    if (name === 'fingers' && !value) return;   // releasing after the mouth closed is fine
                    if (name === 'sticker' && ['left', 'right'].includes(value) && !st.stickers.includes(value)) { st.stickers.push(value); return api.log(X.sticker(value === 'left' ? '왼쪽' : '오른쪽')); }
                    if (name === 'redBox') {
                        if (st.stickers.length < 2) return api.log('[머리 검수대] 양쪽 볼에 스티커를 붙여야 한다.');
                        st.phase = 'pick'; st.stickers = []; st.idx += 1; d.counts.rejected += 1; api.log(X.redBox); return refill(st, api);
                    }
                }
                return;
            }
            case 'voice': {
                if (st.phase === 'correct') {
                    if (name === 'turnAway') return fail(s, api, 'VOICE_TURNED');
                    if (name === 'say') {
                        const c = st.corr;
                        if (norm(value) === norm(data.lines[c.line])) {
                            d.toy.voices[c.line] = 'corrected'; d.toy.voiceCorrections.push(c.line);
                            st.phase = 'press'; st.corr = null; api.log(X.corrected(data.lines[c.line]));
                            if (st.presses >= 4) d.ready = true;
                            return;
                        }
                        return failVoice(s, api, c.line);
                    }
                    return;
                }
                if (name === 'pressBack' && st.presses < 4) {
                    st.presses += 1; const i = st.presses - 1; st.heard = i;
                    const wrong = d.toy.voices[i] === 'wrong';
                    api.log(X.press(st.presses));
                    api.log(X.play(wrong ? (i === 3 ? data.abnormal4 : data.wrongLines[i] || data.lines[i]) : data.lines[i]));
                    if (wrong && i === 3) api.majorEvent('VOICE_FOURTH');
                    if (st.presses >= 4 && !wrong) d.ready = true;
                    if (st.presses >= 4 && wrong) d.ready = true;   // walking on with it uncorrected is possible: the toy keeps the line
                    return;
                }
                if (name === 'correct' && st.heard >= 0 && d.toy.voices[st.heard] === 'wrong') {
                    st.phase = 'correct'; st.corr = { line: st.heard, t: 0, word: data.whispers[pick('whisper', data.whispers.length, 0)] };
                    d.ready = false;
                    api.log(X.faceBody); api.log(X.correcting); return;
                }
                return;
            }
            case 'arms': {
                const h = st.holding;
                if (name === 'lift' && !h) {
                    const [side, idx] = String(value).split(':'); const arm = (st[side] || [])[Number(idx)];
                    if (!arm || arm.used || st.attached[side]) return;
                    st.holding = { side, idx: Number(idx), no: arm.no, act: arm.act, t: 0, shown: false, spare: false };
                    return api.log(X.armLift(side === 'left' ? '왼쪽' : '오른쪽', arm.no));
                }
                if (name === 'takeSpare' && !h && st.spareReady) {
                    st.spareReady = false;
                    st.holding = { side: st.spareSide, idx: -1, no: st.spareNo, act: 'follow', t: 0, shown: false, spare: true };
                    return api.log(X.spare(st.spareNo));
                }
                if (!h) return;
                if (name === 'shake') { if (h.shown && ['sleeve', 'stroke', 'follow'].includes(h.act)) return fail(s, api, 'ARM_SHAKE'); return; }
                if (name === 'pin') {
                    if (data.danger.includes(h.act)) return fail(s, api, 'ARM_GRABBED');
                    const other = h.side === 'left' ? st.attached.right : st.attached.left;
                    if (other && other.no !== h.no) return fail(s, api, 'ARM_PAIR');
                    st.attached[h.side] = { no: h.no, act: h.act, spare: h.spare };
                    if (h.idx >= 0) st[h.side][h.idx].used = true;
                    d.toy[h.side === 'left' ? 'leftArm' : 'rightArm'] = { no: h.no, spare: h.spare };
                    st.holding = null; api.log(X.pinIn(h.side === 'left' ? '왼쪽' : '오른쪽', h.no));
                    if (st.attached.left && st.attached.right) { d.ready = true; api.log('[팔 결합대] 양팔 결합 완료.'); }
                    return;
                }
                if (name === 'crush') {
                    if (h.idx >= 0) st[h.side][h.idx].used = true;
                    d.counts.rejected += 1; st.holding = null; api.log(X.crushed(h.no));
                    if (h.no === st.spareNo) { st.spareReady = true; st.spareSide = h.side; }
                    return;
                }
                if (name === 'putBack') {
                    if (h.shown && data.danger.includes(h.act)) return fail(s, api, 'ARM_GRABBED');
                    st.holding = null; return api.log('[팔 결합대] 팔을 제자리에 내려놓았다.');
                }
                return;
            }
            case 'tail':
                if (name === 'flip') { if (st.hand) return; st.orient = st.orient === 'up' ? 'down' : 'up'; return api.log(X.flip(st.orient)); }
                if (name === 'hand') {
                    if (value && !st.hand) { st.hand = true; api.log(X.handIn); return; }
                    if (!value && st.hand) { if (!st.knotted && st.stitches > 0) return fail(s, api, 'TAIL_UNFINISHED'); st.hand = false; }
                    return;
                }
                if (name === 'lookInside') return fail(s, api, 'TAIL_LOOK');
                if (name === 'squeeze') return fail(s, api, 'TAIL_SQUEEZE');
                if (name === 'pullThread' && st.tangle) { st.tangle = false; st.tangled = true; return api.log(X.pullThread); }
                if (name === 'stitch') {
                    if (!st.hand) return api.log('[꼬리 봉합대] 한 손을 꼬리 안에 넣어 솜을 확인하면서 꿰매야 한다.');
                    if (st.orient !== 'down') return api.log(X.wrongWay);
                    if (st.tangle || st.stitches >= T.stitches) return;
                    st.stitches += 1; api.log(X.stitch(st.stitches, T.stitches));
                    if (st.inside < X.inside.length && st.stitches % 2 === 1) api.log(X.inside[st.inside++]);
                    if (st.stitches === T.sewSongAt && st.songT < 0) { st.songT = 0; api.log(X.sewSong); api.majorEvent('SEW_SONG'); }
                    if (st.stitches === st.tangleAt && !st.tangled) { st.tangle = true; api.log(X.tangle); }
                    return;
                }
                if (name === 'knot' && st.stitches >= T.stitches && !st.knotted) {
                    st.knotted = true; d.toy.tail = { orient: st.orient }; d.toy.tailComplete = true; d.ready = true; return api.log(X.knot);
                }
                return;
            case 'final':
                if (name === 'assemble' && st.phase === 'assemble') { st.phase = 'face'; return api.log(X.assembly); }
                if (st.phase === 'face' || st.phase === 'press') {
                    if (name === 'stand' && st.phase === 'face') { st.phase = 'press'; return api.log(X.stand); }
                    if (name === 'check') {
                        const h = d.toy.head || {};
                        if (value === 'eyes') return api.log(X.eyes(h.eyes));
                        if (value === 'hair') return api.log(X.hair(h.hair));
                        if (value === 'teeth') return api.log(X.lips(h.teeth));
                        return;
                    }
                    if (name === 'pressBack' && st.phase === 'press' && st.presses < 3) {
                        st.presses += 1; const i = st.presses - 1;
                        api.log(X.press(st.presses)); api.log(X.play(d.toy.voices[i] === 'wrong' ? (data.wrongLines[i] || data.lines[i]) : data.lines[i]));
                        if (st.presses === 3) { st.phase = 'pause'; st.t = T.finalPause; }
                        return;
                    }
                    return;
                }
                if (st.phase === 'press4' && name === 'pressBack') {
                    st.presses = 4; api.log(X.press(4));
                    api.log(X.play(d.toy.voices[3] === 'wrong' ? data.abnormal4 : data.lines[3]));
                    st.phase = 'inspect'; st.t = T.inspecting; api.log(X.inspecting); return;
                }
                if (st.phase === 'red' && name === 'disassemble') return fail(s, api, 'DISASSEMBLE');
                if (st.phase === 'green') {
                    if (name === 'takeDoll') return fail(s, api, 'TOOK_DOLL');
                    if (name === 'leaveDoll') return enter(s, api, 'corridor');
                }
                return;
            case 'corridor':
                if (name === 'speak') return fail(s, api, 'SPOKE');
                if (name === 'turnBack') return fail(s, api, 'STOPPED');
                if (name === 'walk') {
                    st.steps += 1; st.idle = 0; api.log(X.step);
                    if (st.steps === T.callAt[0]) api.log(X.songBack);
                    if (T.callAt.slice(1).includes(st.steps)) api.log(X.callNo(d.worker));
                    if (st.steps >= T.corridorSteps) {
                        api.log(X.doorClose);
                        for (const line of data.epilogue) api.log(line);
                        api.majorEvent('EXIT');
                        return api.win(data.clearText, { patrols: {}, elapsed: s.elapsed, injuries: [] });
                    }
                }
                return;
        }
    }

    function refill(st, api) {
        if (st.idx < st.heads.length) return;
        st.heads.push({ eyes: 'same', hair: 'clear', teeth: false });   // a new head is set on the table
        api.log('[머리 검수대] 검수대에 새 머리가 놓인다.');
    }

    FieldCore.register({
        id: data.id, data, init, tick, action, scene: () => '', STAGES, PLACE,
        logTag: run => run.data.stage === 'corridor' ? '' : String(run.data.worker),
        stamp: log => log.tag || '',
        manualClock: true, startLog: data.startLog,
        release() { /* nothing is held across focus changes except explicit holds, which the UI releases itself */ },
        get ui() { return window.FieldEP10UI; }
    });
})();

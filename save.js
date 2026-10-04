// ==========================================
// Save Data (localStorage)
// 진행 기록만 브라우저에 저장한다. 서버/계정 없음. 다른 기기로는 세이브 코드로 옮긴다.
//
// 새 세이브 코드(v5): v4 Story 코드 + Field/AUTHOR의 검증된 지속 기록을 UTF-8 JSON으로 묶는다.
// 아래 기존 Story 코드(v4): 진행 상황을 비트로 압축한 약 50자. 형식(바이트):
//   [버전=4, 에피소드 수, 단서 수, 추리 수, 업적 수, 비밀 발견 수]
//   + 에피소드별 [클리어 횟수, 사망 횟수] (각 0~255)
//   + 단서 비트 + 추리 비트 + 업적 비트 + 플래그 비트(제이 해금, 엔딩 확인) + 비밀 발견 비트
//   + 작업자 번호 2바이트
//   + 체크섬 1바이트
// 비트 위치는 story-data.js 의 CLUES / DEDUCTIONS / ACHIEVEMENTS / SECRETS 배열 인덱스이므로 그 배열은 "맨 뒤에만 추가"한다.
// 이전의 v2 코드와 더 오래된 긴 코드(v1, JSON)도 불러올 수 있다.
// ==========================================
const GameSave = (() => {
    const KEY = 'yuyeon98.save.v1';
    const EP_COUNT = 10;
    const listeners = [];
    let state = blank();

    function blank() {
        return { v: 1, eps: {}, clues: {}, deductions: {}, achievements: {}, secrets: {}, flags: {}, workerNo: 0, updatedAt: 0 };
    }

    function isValid(s) {
        return s && s.v === 1 && typeof s.eps === 'object' && typeof s.clues === 'object' && typeof s.deductions === 'object';
    }

    function load() {
        try {
            const raw = localStorage.getItem(KEY);
            if (raw) {
                const s = JSON.parse(raw);
                if (isValid(s)) state = Object.assign(blank(), s);
            }
        } catch (e) {
            console.warn('GameSave load failed:', e);
        }
    }

    function persist() {
        state.updatedAt = Date.now();
        try {
            localStorage.setItem(KEY, JSON.stringify(state));
        } catch (e) {
            console.warn('GameSave persist failed:', e);
        }
        listeners.forEach(fn => { try { fn(); } catch (e) { console.warn(e); } });
    }

    function epRecord(n) {
        if (!state.eps[n]) state.eps[n] = { clears: 0, deaths: 0, firstClearAt: 0 };
        return state.eps[n];
    }

    // ---------- 세이브 코드 (v2, 압축) ----------
    function packBits(list, out) {
        for (let i = 0; i < list.length; i += 8) {
            let b = 0;
            for (let j = 0; j < 8 && i + j < list.length; j++) if (list[i + j]) b |= 1 << j;
            out.push(b);
        }
    }

    function checksum(bytes) {
        return bytes.reduce((a, b) => (a + b) & 255, 0);
    }

    function encodeCompact() {
        const bytes = [4, EP_COUNT, CLUES.length, DEDUCTIONS.length, ACHIEVEMENTS.length, SECRETS.length];
        for (let n = 1; n <= EP_COUNT; n++) {
            const r = state.eps[n] || { clears: 0, deaths: 0 };
            bytes.push(Math.min(255, r.clears || 0), Math.min(255, r.deaths || 0));
        }
        packBits(CLUES.map(c => !!state.clues[c.id]), bytes);
        packBits(DEDUCTIONS.map(d => !!state.deductions[d.id]), bytes);
        packBits(ACHIEVEMENTS.map(a => !!state.achievements[a.id]), bytes);
        packBits([!!state.flags.jayUnlocked, !!state.flags.finaleSeen], bytes);
        packBits(SECRETS.map(id => !!state.secrets[id]), bytes);
        bytes.push((state.workerNo >> 8) & 255, state.workerNo & 255); // 작업자 번호(0~9999, 0=미발급)
        bytes.push(checksum(bytes));
        const b64 = btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
        return b64.match(/.{1,6}/g).join(' '); // 읽기 쉽게 6자씩 끊는다 (불러올 때 공백은 무시)
    }

    function decodeCompact(code) {
        const clean = code.replace(/\s+/g, '').replace(/-/g, '+').replace(/_/g, '/');
        if (!/^[A-Za-z0-9+/]+$/.test(clean)) return null;
        let bin;
        try { bin = atob(clean + '='.repeat((4 - clean.length % 4) % 4)); } catch (e) { return null; }
        const bytes = Array.from(bin, ch => ch.charCodeAt(0));
        if (bytes.length < 7 || bytes[0] < 2 || bytes[0] > 4) return null; // v2: 헤더 5바이트, v3: 비밀 발견 비트 추가(헤더 6바이트), v4: 작업자 번호 2바이트 추가
        if (checksum(bytes.slice(0, -1)) !== bytes[bytes.length - 1]) return null;

        const version = bytes[0];
        const [, nEps, nClues, nDed, nAch] = bytes;
        const nSecrets = version >= 3 ? bytes[5] : 0;
        let p = version >= 3 ? 6 : 5;
        const s = blank();
        for (let n = 1; n <= nEps; n++) {
            const clears = bytes[p++], deaths = bytes[p++];
            if (clears || deaths) s.eps[n] = { clears, deaths, firstClearAt: clears ? Date.now() : 0 };
        }
        const readBits = (count) => {
            const arr = [];
            for (let i = 0; i < count; i++) arr.push(!!((bytes[p + (i >> 3)] >> (i & 7)) & 1));
            p += Math.ceil(count / 8);
            return arr;
        };
        const now = Date.now();
        readBits(nClues).forEach((on, i) => { if (on && CLUES[i]) s.clues[CLUES[i].id] = now; });
        readBits(nDed).forEach((on, i) => { if (on && DEDUCTIONS[i]) s.deductions[DEDUCTIONS[i].id] = now; });
        readBits(nAch).forEach((on, i) => { if (on && ACHIEVEMENTS[i]) s.achievements[ACHIEVEMENTS[i].id] = now; });
        const flags = readBits(2);
        s.flags.jayUnlocked = flags[0];
        s.flags.finaleSeen = flags[1];
        readBits(nSecrets).forEach((on, i) => { if (on && SECRETS[i]) s.secrets[SECRETS[i]] = now; });
        if (version >= 4) {
            s.workerNo = (bytes[p] << 8) | bytes[p + 1];
            p += 2;
        }
        if (p + 1 !== bytes.length) return null; // 길이가 맞지 않으면 손상된 코드
        return s;
    }

    function decodeLegacy(code) {
        try {
            const s = JSON.parse(decodeURIComponent(escape(atob(code.trim()))));
            return isValid(s) ? Object.assign(blank(), s) : null;
        } catch (e) {
            return null;
        }
    }

    // v5 transport wraps the unchanged v4 Story code and optional independent layers.
    // Local storage keys/schemas remain separate. This checksum detects damage, not tampering.
    function encodeProgress() {
        const payload = { v: 5, story: encodeCompact() };
        if (window.FieldSave) payload.field = FieldSave.exportProgress();
        if (window.AuthorRoute) payload.author = AuthorRoute.exportProgress();
        const bytes = [5, ...new TextEncoder().encode(JSON.stringify(payload))];
        bytes.push(checksum(bytes));
        let bin = '';
        for (const byte of bytes) bin += String.fromCharCode(byte);
        return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '').match(/.{1,6}/g).join(' ');
    }
    function decodeProgress(code) {
        try {
            const clean = code.replace(/\s+/g, '').replace(/-/g, '+').replace(/_/g, '/');
            if (clean.length > 100000 || !/^[A-Za-z0-9+/]+$/.test(clean)) return null;
            const bytes = Uint8Array.from(atob(clean + '='.repeat((4 - clean.length % 4) % 4)), ch => ch.charCodeAt(0));
            if (bytes.length < 3 || bytes[0] !== 5 || checksum(bytes.slice(0, -1)) !== bytes[bytes.length - 1]) return null;
            const payload = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes.slice(1, -1)));
            if (!payload || payload.v !== 5 || typeof payload.story !== 'string') return null;
            const story = decodeCompact(payload.story);
            return story ? { story, payload } : null;
        } catch (error) { return null; }
    }

    load();

    return {
        get: () => state,
        ep: (n) => state.eps[n] || { clears: 0, deaths: 0, firstClearAt: 0 },
        markClear(n) {
            const r = epRecord(n);
            r.clears++;
            if (!r.firstClearAt) r.firstClearAt = Date.now();
            persist();
        },
        markDeath(n) {
            epRecord(n).deaths++;
            persist();
        },
        hasClue: (id) => !!state.clues[id],
        addClue(id) {
            if (state.clues[id]) return false;
            state.clues[id] = Date.now();
            persist();
            return true;
        },
        hasDeduction: (id) => !!state.deductions[id],
        addDeduction(id) {
            if (state.deductions[id]) return false;
            state.deductions[id] = Date.now();
            persist();
            return true;
        },
        hasAchievement: (id) => !!state.achievements[id],
        addAchievement(id) {
            if (state.achievements[id]) return false;
            state.achievements[id] = Date.now();
            persist();
            return true;
        },
        hasSecret: (id) => !!state.secrets[id],
        addSecret(id) {
            if (state.secrets[id]) return false;
            state.secrets[id] = Date.now();
            persist();
            return true;
        },
        // EP.10 클리어 시 발급되는 4자리 작업자(사물함) 번호. 한 번 발급되면 바뀌지 않는다.
        workerNo: () => state.workerNo || 0,
        ensureWorkerNo() {
            if (!state.workerNo) {
                state.workerNo = 1000 + Math.floor(Math.random() * 9000);
                persist();
            }
            return state.workerNo;
        },
        setFlag(name, value) {
            state.flags[name] = value;
            persist();
        },
        flag: (name) => !!state.flags[name],
        onChange: (fn) => listeners.push(fn),
        exportCode: encodeProgress,
        exportStoryCode: encodeCompact, // Exact v4 transport for legacy compatibility/testing.
        importCode(code) {
            if (typeof code !== 'string' || code.length > 150000) return false;
            const bundle = decodeProgress(code);
            const s = bundle ? bundle.story : decodeCompact(code) || decodeLegacy(code);
            if (!s) return false;
            // Validate Story before any writes; missing/invalid layers preserve current state.
            if (bundle) {
                if (window.FieldSave && Object.hasOwn(bundle.payload, 'field') && FieldSave.importProgress(bundle.payload.field)) {
                    // An old live shift must not overwrite restored records before the UI reload.
                    window.FieldCore?.disconnect();
                }
                if (window.AuthorRoute && Object.hasOwn(bundle.payload, 'author')) AuthorRoute.importProgress(bundle.payload.author);
            }
            state = s;
            persist();
            return true;
        },
        reset() {
            // Explicit record deletion resets every layer. Legacy import preserves absent layers.
            window.FieldSave?.reset();
            window.AuthorRoute?.reset();
            state = blank();
            persist();
        }
    };
})();

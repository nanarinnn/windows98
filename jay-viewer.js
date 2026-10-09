// [요원 제이의 기록] presentation layer: reading the record is the experience. The text itself stays exactly as written in
// #jay-report-textarea (content); this file only adds effects around it (presentation), so a future reviewed J text can
// replace the textarea content without touching this code. Nothing here changes jayUnlocked, the unlock conditions,
// the close/scroll-to-bottom -> triggerLoopShutdown() semantics, saves, or any text. No puzzle, no answer, no game over.
//
// Stages follow how far the reader has scrolled:
//   1 normal   — an ordinary HQ record viewer.
//   2 observe  — from the first dated entry: the scrollbar slips back a few px, a line doubles for a moment, an already
//                read paragraph lingers faintly behind, a caret blinks on a line that is not there.
//   3 imitate  — from the entry where a patient copies the writer (개체 D): a passage the reader just selected surfaces
//                faintly further down; a ghost paragraph follows the scroll one beat late.
//   4 assimilate — from the first "우리 병동": the header and the name fade, the HQ watermark thins, paragraphs settle
//                into an oddly even ward-document alignment (no layout change: the end of the record never moves).
// Ghost/echo text is always copied from the record itself; no new sentence is ever shown.
window.JayViewer = (() => {
    // presentation data: where each stage starts (substring of the record). Missing markers fall back to ratios.
    const STAGE_MARKERS = [
        { stage: 2, marker: '2019년 12월 6일.', ratio: 0.12 },
        { stage: 3, marker: '개체 D:', ratio: 0.45 },
        { stage: 4, marker: '우리 병동', ratio: 0.72 }
    ];
    const $ = id => document.getElementById(id);
    let ta = null, win = null, layer = null, ghost = null, echo = null, caret = null, mark = null;
    let stage = 1, starts = [], paragraphs = [], lastSlip = 0, lastDouble = 0, lastScroll = 0, ghostTimer = null;
    const reduce = () => window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function measure() {
        const text = ta.value, len = Math.max(1, text.length);
        starts = STAGE_MARKERS.map(s => {
            const i = text.indexOf(s.marker);
            return { stage: s.stage, at: i >= 0 ? i / len : s.ratio };
        });
        paragraphs = text.split(/\n+/).map(p => p.trim()).filter(p => p.length > 20);
    }
    // approximate the character position at the top of the viewport by scroll ratio
    function readRatio() {
        const max = Math.max(1, ta.scrollHeight - ta.clientHeight);
        return Math.min(1, (ta.scrollTop + ta.clientHeight * 0.5) / (max + ta.clientHeight * 0.5));
    }
    function stageAt(r) { let s = 1; for (const x of starts) if (r >= x.at) s = Math.max(s, x.stage); return s; }

    function setStage(next) {
        if (next === stage) return;
        stage = next;
        win.classList.remove('jv-s1', 'jv-s2', 'jv-s3', 'jv-s4');
        win.classList.add('jv-s' + stage);
        win.dataset.jvStage = String(stage);
    }

    // a paragraph the reader has already passed, shown faintly behind the text (copied verbatim)
    function readParagraph() {
        const r = readRatio(), upto = Math.max(1, Math.floor(paragraphs.length * r) - 1);
        return paragraphs[Math.floor(Math.random() * upto)] || paragraphs[0] || '';
    }

    function onScroll() {
        if (!win || win.style.display === 'none') return;
        const now = performance.now();
        setStage(stageAt(readRatio()));
        const down = ta.scrollTop > lastScroll; lastScroll = ta.scrollTop;
        if (stage >= 2 && !reduce()) {
            // the scrollbar slips back a few pixels now and then (never fights the reader: rare, tiny, only scrolling down)
            if (down && now - lastSlip > 6000 && Math.random() < 0.25) {
                lastSlip = now;
                setTimeout(() => { if (ta.scrollTop > 8 && ta.scrollTop + ta.clientHeight < ta.scrollHeight - 30) ta.scrollTop -= 3 + Math.floor(Math.random() * 4); }, 380);
            }
            // a line doubles for a moment
            if (now - lastDouble > 4500 && Math.random() < 0.2) {
                lastDouble = now; ta.classList.add('jv-double'); setTimeout(() => ta.classList.remove('jv-double'), 160);
            }
        }
        if (stage >= 2 && !ghost.textContent && Math.random() < 0.3) ghost.textContent = readParagraph();
        if (stage >= 3) {
            // a ghost paragraph follows the scroll one beat late
            clearTimeout(ghostTimer);
            ghostTimer = setTimeout(() => { ghost.style.transform = `translateY(${-(ta.scrollTop % 120)}px)`; }, reduce() ? 0 : 260);
            if (Math.random() < 0.08) ghost.textContent = readParagraph();
        }
    }

    // stage 3+: what the reader selects surfaces faintly further down (the record's own words only)
    function onSelect() {
        if (stage < 3) return;
        const s = ta.value.slice(ta.selectionStart, ta.selectionEnd).trim();
        if (!s || s.length > 160) return;
        echo.textContent = s;
        echo.classList.remove('jv-show'); void echo.offsetWidth; echo.classList.add('jv-show');
    }

    function reset() {
        ta.scrollTop = 0;   // every opening replays the same reading from the top
        stage = 0; setStage(1); lastScroll = 0;
        ghost.textContent = ''; echo.textContent = ''; ghost.style.transform = '';
        measure(); setStage(stageAt(readRatio()));
    }

    function mount() {
        win = $('jayReportWindow'); ta = $('jay-report-textarea');
        if (!win || !ta || ta._jayViewer) return;
        ta._jayViewer = true;
        const content = ta.parentElement;
        content.style.position = 'relative';
        layer = document.createElement('div'); layer.className = 'jv-layer'; layer.setAttribute('aria-hidden', 'true');
        ghost = document.createElement('div'); ghost.className = 'jv-ghost';
        echo = document.createElement('div'); echo.className = 'jv-echo';
        caret = document.createElement('div'); caret.className = 'jv-caret';
        mark = document.createElement('div'); mark.className = 'jv-mark'; mark.textContent = '특별재난관리본부';
        layer.append(mark, ghost, echo, caret);
        content.insertBefore(layer, ta);
        ta.classList.add('jv-text');
        ta.addEventListener('scroll', onScroll, { passive: true });
        ta.addEventListener('select', onSelect); ta.addEventListener('mouseup', onSelect); ta.addEventListener('keyup', onSelect);
        // every time the window is opened the same presentation starts again from the top
        new MutationObserver(() => { if (win.style.display !== 'none') reset(); }).observe(win, { attributes: true, attributeFilter: ['style'] });
        reset();
    }

    window.addEventListener('load', mount);
    return { STAGE_MARKERS, get stage() { return stage; }, mount, _measure: () => (measure(), starts) };
})();

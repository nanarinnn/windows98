// EP10 Field data. There is no reviewed transcript for EP10: the source is the original transcript
// (docs/transcripts/raw/EP10_인어왕국_행복_공장_original.txt) + the original video. Where the STT is unclear and the video
// was not checked, nothing is invented (the promo song lyrics are not in the transcript and are never shown).
// 10화.txt is the rule document rebuilt from that original; the Field reads it from #darkwebReportWindowEP10.
// One toy state runs through the whole episode: the head passed at station 1 and the voice lines as left at station 2 are
// what the final inspection sees. NOT canon (tuning/presentation): every timer, the heads' layout, arm numbers and
// behaviors, stitch counts, the corridor length, every failure text outside `canonFailures` ("작업 기록 중단").
window.FieldEP10Data = {
    id: 'EP10', title: '인어왕국 행복 공장',
    reportSelector: '#darkwebReportWindowEP10 textarea',
    // Named rolls (tests): worker (4-digit), heads (layout index), badLine (which extra line is wrong, -1 none),
    // whisper (index), arms (layout index), tangleAt (stitch index).
    random: name => Math.random(),
    startLog: '[인어왕자] 등 버튼이 있다.',
    clearText: 'FIELD OBSERVATION 10 / 10',
    lines: ['안녕 나는 인어왕자야.', '우리 같이 바다로 가자.', '반짝반짝 조개를 찾아보자.', '친구가 되어 줄 거지.'],
    abnormal4: '여기서 살아줄 거지.',
    // one-word variants for the occasional wrong 2nd/3rd line (station 2)
    wrongLines: { 1: '우리 같이 바닥으로 가자.', 2: '반짝반짝 조개를 숨겨 보자.' },
    whispers: ['여기서', '살아', '거지'],
    // Heads in a row on the inspection table, inspected from the front one by one. `mouth` opens while held.
    headLayouts: [
        [{ eyes: 'same', hair: 'clear', teeth: false, mouth: true }, { eyes: 'same', hair: 'clear', teeth: true }, { eyes: 'same', hair: 'clear', teeth: false }, { eyes: 'off', hair: 'clear', teeth: false }],
        [{ eyes: 'off', hair: 'clear', teeth: false }, { eyes: 'same', hair: 'clear', teeth: false, mouth: true }, { eyes: 'same', hair: 'cover', teeth: false }, { eyes: 'same', hair: 'clear', teeth: false }],
        [{ eyes: 'same', hair: 'cover', teeth: false }, { eyes: 'same', hair: 'clear', teeth: true, mouth: true }, { eyes: 'same', hair: 'clear', teeth: false }, { eyes: 'same', hair: 'clear', teeth: false }]
    ],
    // Arms on both sides of the body. `act` = what the arm does once lifted: unsettling-but-normal or real danger.
    armLayouts: [   // exactly one number has a pair; one arm of that pair is dangerous
        { left: [{ no: 7, act: 'follow' }, { no: 3, act: 'still' }], right: [{ no: 5, act: 'sleeve' }, { no: 7, act: 'converge' }], spare: 7 },
        { left: [{ no: 5, act: 'reach' }, { no: 2, act: 'stroke' }], right: [{ no: 9, act: 'follow' }, { no: 5, act: 'sleeve' }], spare: 5 },
        { left: [{ no: 4, act: 'stroke' }, { no: 8, act: 'follow' }], right: [{ no: 8, act: 'converge' }, { no: 6, act: 'still' }], spare: 8 }
    ],
    tuning: {
        lockerSong: 22, dressSteps: 3, behindAt: [6, 11, 16],
        mouthHold: 6, mouthWarn: 2.5,
        correctTime: 30, clothAt: 4, whisperAt: 8, touchAt: 13,
        armDanger: 5, pinHold: 1.5,
        stitches: 10, sewSongAt: 3, sewSong: 26,
        finalPause: 2.2, inspecting: 2.5,
        corridorSteps: 14, stopLimit: 6, callAt: [3, 7, 10]
    },
    video: {
        idle: 'movies/ep10_idle.mp4', locker: 'movies/ep10_event_locker.mp4', head: 'movies/ep10_event_head.mp4',
        voice: 'movies/ep10_event_voice.mp4', arm: 'movies/ep10_event_arm.mp4', exit: 'movies/ep10_event_exit.mp4'
    },
    armActs: {
        still: '팔이 가만히 있다.',
        follow: '손가락이 내 손가락을 따라 접혔다가 펴진다.',
        sleeve: '팔이 작업복 소매를 붙잡는다.',
        stroke: '손가락이 내 손등을 천천히 더듬는다.',
        converge: '손가락 다섯 개가 동시에 내 쪽으로 모인다.',
        reach: '팔이 작업대 바깥으로 넘어와 나를 향한다.'
    },
    danger: ['converge', 'reach'],
    text: {
        press: n => `[인어왕자] 등 버튼 ${n}번째.`,
        intake: '[인어왕자] 네 번째 대사가 끝나자 주위가 하얗게 바랜다. 형광등 소리. 작업복 탈의실이다.',
        lockerOpen: '[탈의실] 사물함들 가운데 문이 열린 사물함이 하나 있다.',
        readNo: n => `[탈의실] 문 안쪽의 숫자를 소리 내어 읽었다. "${n}."`,
        keyRight: '[탈의실] 열쇠를 오른쪽 손목에 찼다.',
        song: '[스피커] 천장 스피커에서 홍보곡이 흘러나온다. ♪',
        dressed: item => `[탈의실] ${item}을(를) 입었다.`,
        clothesIn: '[탈의실] 사복과 신발을 사물함에 넣었다.',
        sleeveHair: '[탈의실] 작업복 소매 안쪽에서 머리카락이 비어져 나온다. 옷이 조금 크다.',
        behind: ['[탈의실] 뒤쪽에서 사물함 문이 열리는 소리.', '[탈의실] 뒤에서 누군가 내 이름을 부른다.', '[탈의실] 뒤에서 내 사물함 번호를 부르는 목소리.'],
        facing: '[탈의실] 사물함만 바라본다.',
        songEnd: '[스피커] 노래가 끝났다.',
        locked: '[탈의실] 사물함 문을 잠갔다.',
        walk: where => `[이동] 생산 라인을 따라 안쪽으로. ${where}.`,
        headLift: n => `[머리 검수대] ${n}번째 머리를 들었다.`,
        eyes: v => v === 'same' ? '[머리 검수대] 두 눈동자가 같은 방향을 본다.' : '[머리 검수대] 한쪽 눈동자가 다른 곳을 본다.',
        hair: v => v === 'clear' ? '[머리 검수대] 밝은 금발. 얼굴을 가리지 않는다.' : '[머리 검수대] 금발 한 줄기가 얼굴을 가로질러 흘러내려 있다.',
        lips: v => v ? '[머리 검수대] 활짝 웃는 입술 사이로 작은 치아가 보인다.' : '[머리 검수대] 활짝 웃는 입술. 치아는 보이지 않는다.',
        mouthOpen: '[머리 검수대] 들고 있던 머리의 입이 천천히 벌어진다.',
        putDown: '[머리 검수대] 그 자리에 내려놓았다.',
        fingersIn: '[머리 검수대] 입술 사이에 검지와 중지를 넣었다.',
        wet: ['[머리 검수대] 안쪽이 축축하다.', '[머리 검수대] 무언가 혀처럼 손가락을 건드린다.'],
        mouthBack: '[머리 검수대] 입이 처음 크기로 돌아왔다.',
        sticker: side => `[머리 검수대] ${side} 볼에 불량 스티커를 붙였다.`,
        redBox: '[머리 검수대] 빨간 상자에 넣었다.',
        passHead: '[머리 검수대] 이 머리를 들고 간다.',
        bodyReady: '[음성 시험대] 하늘색 몸체가 놓여 있다. 등 버튼.',
        play: line => `[인어왕자] "${line}"`,
        faceBody: '[음성 시험대] 몸체를 마주 보고 섰다.',
        correcting: '[음성 시험대] 정상 문장을 말하기 시작했다.',
        cloth: '[음성 시험대] 뒤쪽에서 천을 끄는 소리가 다가온다.',
        whisper: w => `[음성 시험대] 귀 바로 옆에서 무언가 먼저 속삭인다. "${w}…"`,
        touch: '[음성 시험대] 입술과 턱에 차가운 손가락이 닿는다.',
        corrected: line => `[음성 시험대] "${line}" 끝까지 말했다. 소리가 물러났다.`,
        armsReady: '[팔 결합대] 몸체 양옆에 번호가 적힌 팔들이 놓여 있다.',
        armLift: (side, no) => `[팔 결합대] ${side} ${no}번 팔을 들었다.`,
        pinIn: (side, no) => `[팔 결합대] ${side} ${no}번 팔. 결합 핀을 끝까지 밀어 넣고 손을 뺐다.`,
        crushed: no => `[팔 결합대] ${no}번 팔의 손목을 오른쪽 압착 홈에 넣고 은색 페달을 밟았다. 끊어 냈다. 파란 회수통.`,
        spare: no => `[팔 결합대] 같은 번호(${no}번)의 예비 팔을 꺼냈다.`,
        tailReady: '[꼬리 봉합대] 초록색 꼬리. 비늘이 위를 향해 있다.',
        flip: v => v === 'down' ? '[꼬리 봉합대] 비늘이 아래를 향하게 맞췄다.' : '[꼬리 봉합대] 비늘이 위를 향한다.',
        handIn: '[꼬리 봉합대] 한 손을 꼬리 안에 넣었다. 솜이 만져진다.',
        inside: ['[꼬리 봉합대] 안쪽 솜이 젖어 있다.', '[꼬리 봉합대] 미지근하다.', '[꼬리 봉합대] 꼬리 끝 쪽으로 손이 더 깊이 끌려 들어간다.'],
        stitch: (n, total) => `[꼬리 봉합대] 점선을 따라 한 땀. (${n}/${total})`,
        wrongWay: '[꼬리 봉합대] 점선이 맞지 않는다.',
        sewSong: '[스피커] 홍보곡이 다시 흘러나온다. ♪',
        tangle: '[꼬리 봉합대] 실이 꼬였다.',
        pullThread: '[꼬리 봉합대] 안쪽은 보지 않고 실만 당겼다. 풀렸다.',
        knot: '[꼬리 봉합대] 마지막 매듭을 묶었다.',
        assembly: '[최종 조립실] 팔과 꼬리를 결합한 몸체를 조립대에 올리고, 검수를 마친 머리를 끼웠다.',
        stand: '[최종 조립실] 인어왕자를 정면으로 세웠다.',
        inspecting: '[최종 조립실] 검수 중…',
        green: '[최종 조립실] 검수 등이 초록색으로 켜졌다.',
        red: '[최종 조립실] 검수 등이 빨간색으로 켜졌다.',
        door: '[최종 조립실] 인형을 그대로 두었다. 뒤쪽 출입문이 열린다.',
        step: '[통로] 걷는다.',
        songBack: '[통로] 뒤에서 홍보곡이 다시 시작된다. ♪',
        callNo: n => `[통로] 뒤에서 작업자 번호를 부른다. "${n}."`,
        doorClose: '[통로] 문이 닫혔다.'
    },
    failures: {
        TURNED_BACK: '노래가 끝나기 전에 뒤를 돌아본 작업자는 자신의 사물함 안에 8조각으로 접힌 채 발견되었습니다.',
        OTHER_LOCKER: '다른 사물함을 열었습니다.',
        LEFT_EARLY: '노래가 끝나기 전에 탈의실을 나가려 했습니다.',
        WRONG_WRIST: '열쇠를 오른쪽 손목에 착용하지 않았습니다.',
        HEAD_FINGERS: '벌어진 입에서 손가락을 뺐습니다.',
        HEAD_HELD: '입이 벌어지는 머리를 그 자리에서 내려놓지 않았습니다.',
        VOICE_1: '첫 번째 대사의 정정에 실패했습니다. 목소리를 잃었으며, 이후 생산된 인어왕자에서 해당 작업자의 목소리가 재생되었습니다.',
        VOICE_MID: '대사의 정정에 실패했습니다.',
        VOICE_4: '네 번째 대사의 정정에 실패했습니다. 음성 시험대 안쪽에 앉은 채 발견되었습니다. 입은 양쪽 귀 밑까지 찢어진 채 굳어 있었습니다. 그것은 작업자가 다가올 때마다 "여기서 살아줄 거지"라고 반복했습니다.',
        VOICE_TURNED: '정정 도중 몸체에서 등을 돌렸습니다.',
        ARM_GRABBED: '압착하지 못한 팔에 붙잡힌 작업자는 양손이 작업대에 눌린 채 발견되었습니다. 손가락마다 작은 플라스틱 손이 하나씩 달려 있었습니다.',
        ARM_SHAKE: '팔을 뿌리쳤습니다.',
        ARM_PAIR: '번호가 다른 팔을 결합했습니다.',
        TAIL_LOOK: '꼬리 안쪽을 들여다보았습니다. 봉합을 마치지 못했거나 안쪽을 들여다본 작업자는 양다리가 하나로 강제 봉합되었으며, 허리 아래부터 초록색 비늘 같은 각질이 돋아났습니다.',
        TAIL_UNFINISHED: '봉합을 마치지 못했습니다. 봉합을 마치지 못했거나 안쪽을 들여다본 작업자는 양다리가 하나로 강제 봉합되었으며, 허리 아래부터 초록색 비늘 같은 각질이 돋아났습니다.',
        TAIL_SQUEEZE: '젖은 솜을 꺼내거나 짰습니다.',
        RED: '검수 등이 빨간색으로 켜졌습니다. 천장 스피커에서 "불량품 재작업을 시작합니다"라는 안내가 나온 뒤 재작업을 중단시킨 사례는 확인되지 않았습니다.',
        DISASSEMBLE: '빨간 검수 등이 켜진 인형을 다시 분해하려 했습니다.',
        TOOK_DOLL: '인형을 그대로 두지 않았습니다.',
        SPOKE: '문을 나선 뒤 입을 열었습니다.',
        STOPPED: '문을 나선 뒤 걸음을 멈췄습니다.'
    },
    canonFailures: ['TURNED_BACK', 'VOICE_1', 'VOICE_4', 'ARM_GRABBED', 'TAIL_LOOK', 'TAIL_UNFINISHED', 'RED'],
    // shown after the clear; only what the original states
    epilogue: ['[본부 관찰 기록]', '정상적으로 퇴장한 인원은 웃을 때에만 목소리가 인어왕자와 같아집니다.', '오른쪽 손목 안쪽에는 탈의실의 네 자리 사물함 번호가 피부 안쪽으로 눌린 것처럼 남습니다.', '두 현상을 제거한 사례는 확인되지 않았습니다.']
};

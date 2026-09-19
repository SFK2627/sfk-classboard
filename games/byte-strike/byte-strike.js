(() => {
  'use strict';

  const GLOBAL_NAME = 'ICT8ByteStrike';
  if (window[GLOBAL_NAME]) return;

  const GAME_ID = 'byte-strike';
  const ROOM_PREFIX = 'ICT8STRIKE:';
  const P2P_PREFIX = 'BSTRIKE1';
  const SNAPSHOT_HZ = 24;
  const INPUT_HZ = 24;
  const RECONNECT_MS = 12000;
  const PLAYER_R = 21;
  const PLAYER_SPEED = 245;
  const VISION_RANGE = 760;
  const VISION_HALF = Math.PI * 0.245;
  const AWARE_RANGE = 145;
  const PICKUP_R = 46;
  const NAV_CELL = 70;
  const LS_KEY = 'ict8.byteStrike.lastRoom.v1';
  const SETTINGS_KEY = 'ict8.byteStrike.settings.v1';
  const DEBUG = (()=>{ try{return new URLSearchParams(location.search).get('byteStrikeDebug')==='1';}catch(_){return false;} })();

  const $ = (s, root=document) => root.querySelector(s);
  const $$ = (s, root=document) => Array.from(root.querySelectorAll(s));
  const clamp = (v,a,b) => Math.max(a,Math.min(b,Number(v)||0));
  const lerp = (a,b,t) => a+(b-a)*t;
  const dist = (a,b,c,d) => Math.hypot(c-a,d-b);
  const angleDelta = (a,b) => Math.atan2(Math.sin(b-a),Math.cos(b-a));
  const normAngle = a => Math.atan2(Math.sin(a),Math.cos(a));
  const esc = value => String(value??'').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const now = () => performance.now();
  const M = () => window.ICT8ByteStrikeMaps;
  const P = () => window.ICT8ZeroDbP2P;

  const WEAPONS = Object.freeze({
    pistol:{name:'PISTOL',className:'Sidearm',kind:'sidearm',damage:24,fireMs:285,bulletSpeed:930,mag:12,reserve:60,reloadMs:1180,spread:.012,moveSpread:.008,range:790,pellets:1,recoil:2.2,color:'#8be9ff',loud:530,moveScale:1,ideal:455},
    revolver:{name:'REVOLVER',className:'Heavy Sidearm',kind:'sidearm',damage:39,fireMs:455,bulletSpeed:1020,mag:6,reserve:42,reloadMs:1540,spread:.009,moveSpread:.012,range:880,pellets:1,recoil:5.2,color:'#ffb86b',loud:700,moveScale:.98,ideal:520},
    machinepistol:{name:'MACHINE PISTOL',className:'Auto Sidearm',kind:'smg',damage:10,fireMs:72,bulletSpeed:850,mag:24,reserve:120,reloadMs:1320,spread:.065,moveSpread:.035,range:520,pellets:1,recoil:1.3,color:'#ff7fbc',loud:560,moveScale:1.03,ideal:300},
    smg:{name:'SMG',className:'Close Assault',kind:'smg',damage:12,fireMs:92,bulletSpeed:890,mag:28,reserve:112,reloadMs:1450,spread:.052,moveSpread:.025,range:620,pellets:1,recoil:1.5,color:'#7df1d2',loud:600,moveScale:1.02,ideal:360},
    pdw:{name:'PDW',className:'Fast Tactical',kind:'smg',damage:14,fireMs:105,bulletSpeed:930,mag:30,reserve:120,reloadMs:1540,spread:.041,moveSpread:.022,range:680,pellets:1,recoil:1.8,color:'#54f1ff',loud:620,moveScale:1.01,ideal:390},
    carbine:{name:'CARBINE',className:'Balanced Rifle',kind:'rifle',damage:17,fireMs:132,bulletSpeed:1030,mag:26,reserve:104,reloadMs:1620,spread:.025,moveSpread:.014,range:850,pellets:1,recoil:2.6,color:'#7aa7ff',loud:660,moveScale:.99,ideal:520},
    shotgun:{name:'SHOTGUN',className:'Close Breach',kind:'shotgun',damage:10,fireMs:760,bulletSpeed:770,mag:6,reserve:36,reloadMs:1680,spread:.175,range:390,pellets:7,recoil:5.5,color:'#ffd27a',loud:720,moveScale:.96,ideal:225},
    rifle:{name:'RIFLE',className:'Assault Rifle',kind:'rifle',damage:19,fireMs:165,bulletSpeed:1070,mag:20,reserve:80,reloadMs:1700,spread:.022,moveSpread:.012,range:920,pellets:1,recoil:3.2,color:'#c7a7ff',loud:700,moveScale:.98,ideal:590},
    dmr:{name:'DMR',className:'Marksman',kind:'marksman',damage:34,fireMs:365,bulletSpeed:1240,mag:10,reserve:50,reloadMs:1880,spread:.006,moveSpread:.018,range:1080,pellets:1,recoil:5.8,color:'#f0e68c',loud:780,moveScale:.94,ideal:700},
    lmg:{name:'LMG',className:'Support Weapon',kind:'heavy',damage:15,fireMs:112,bulletSpeed:980,mag:48,reserve:144,reloadMs:2380,spread:.043,moveSpread:.028,range:790,pellets:1,recoil:2.9,color:'#ff9466',loud:760,moveScale:.90,ideal:500}
  });
  const BOT = Object.freeze({
    easy:{label:'EASY',reaction:620,aim:.16,repath:820,strafe:.35,cover:.18,speed:.86,burst:.55},
    normal:{label:'NORMAL',reaction:390,aim:.095,repath:600,strafe:.55,cover:.42,speed:.94,burst:.7},
    hard:{label:'HARD',reaction:235,aim:.055,repath:450,strafe:.72,cover:.68,speed:.99,burst:.82},
    veryhard:{label:'VERY HARD',reaction:155,aim:.035,repath:340,strafe:.82,cover:.82,speed:1.02,burst:.9}
  });

  const r = {
    open:false, overlay:null, panels:{}, state:'home', bridge:null, music:null, onBack:null, onClose:null,
    role:'', roomCode:'', roomMeta:null, roomPoll:0, roomTouch:0, guestPoll:0, invitePoll:0, pendingInvites:[], hostPeer:null, guestSession:null, scannerStop:null,
    localReady:false, remoteReady:false, selectedMap:M()?.defaultMapId||'data-vault', lastMap:'', botDifficulty:'normal', bestOf:3, mapRotation:'same',
    settings:{fireMode:'manual',sfx:true,reduced:false},
    match:null, world:null, predicted:null, remoteVisual:null, authorityPaused:false, reconnectDeadline:0,
    raf:0,lastFrame:0,lastSnapshot:0,lastInputSend:0,frameCount:0,fps:0,fpsAt:0,
    canvas:null,ctx:null,fogCanvas:null,fogCtx:null,dpr:1,camera:{x:0,y:0,kick:0,shake:0},input:null,keys:new Set(),mouse:{x:0,y:0,down:false,inside:false},
    touch:{move:null,aim:null,fire:false,reload:false,pickup:false}, joy:{left:null,right:null}, resizeObs:null,
    particles:[],fx:[],predictedTracers:[],soundHints:[],damageHints:[],audio:null, soundCooldown:0, hitMarkerUntil:0,
    navCache:new Map(), pingSent:new Map(),pingMs:0,pingTimer:0,networkSeq:0,guestInputSeq:0,lastGuestInput:null,
    messageTimer:0,persistentTimer:0,debugLast:'',mobileFullscreenOwned:false,orientationBlocked:false,remoteOrientationReady:true
  };

  function identity(){
    const id = r.bridge?.getPlayerIdentity?.() || {};
    return {uid:String(id.uid||''),studentId:String(id.studentId||''),name:String(id.name||id.fullName||'PLAYER').trim().slice(0,24)||'PLAYER',section:String(id.section||''),loggedIn:!!id.uid};
  }
  function gameMap(){ return M()?.get(r.match?.mapId || r.selectedMap); }
  function weapon(id){ return WEAPONS[id] || WEAPONS.pistol; }
  function setStatus(el,text,error=false,good=false){ if(!el)return;el.textContent=String(text||'');el.classList.toggle('error',!!error);el.classList.toggle('good',!!good); }
  function soundEnabled(){ return r.settings.sfx && r.bridge?.getSnapshot?.()?.soundEnabled !== false; }
  function saveSettings(){ try{localStorage.setItem(SETTINGS_KEY,JSON.stringify(r.settings));}catch(_){} }
  function loadSettings(){ try{const v=JSON.parse(localStorage.getItem(SETTINGS_KEY)||'{}');r.settings={...r.settings,...v};}catch(_){} }

  function build(){
    if(r.overlay) return;
    const o=document.createElement('div');o.className='bs-overlay';o.hidden=true;o.innerHTML=`
      <div class="bs-shell">
        <header class="bs-head">
          <button class="bs-head-btn" type="button" data-bs-back>← MINI-GAMES</button>
          <div class="bs-brand"><span>G8CODE DIGITAL OPS</span><strong>BYTE STRIKE</strong><small>SEE THEM BEFORE THEY SEE YOU.</small></div>
          <div class="bs-head-actions"><button class="bs-icon-btn" type="button" data-bs-sound aria-label="Toggle sound">🔊</button><button class="bs-icon-btn" type="button" data-bs-close aria-label="Close">×</button></div>
        </header>
        <main class="bs-main">
          <section class="bs-panel active" data-bs-panel="home"><div class="bs-wrap">
            <div class="bs-hero"><div class="bs-agent-mark"><span class="bs-crosshair"></span></div><div><span class="bs-kicker">TOP-DOWN TACTICAL SHOOTER · 0 XP</span><h1>BYTE STRIKE</h1><div class="bs-tagline">SEE THEM BEFORE THEY SEE YOU.</div><p>Move, aim, listen, flank, and fight through dark cyber arenas where walls block vision. Built for phones and desktops with the same fair tactical sight rules.</p><div class="bs-home-actions"><button class="bs-btn primary" type="button" data-go="solo">VS BOT</button><button class="bs-btn" type="button" data-go="multi">MULTIPLAYER 1V1</button><button class="bs-btn ghost" type="button" data-go="how">HOW TO PLAY</button><button class="bs-btn ghost" type="button" data-go="settings">SETTINGS</button></div><div class="bs-note-row"><span>8 ORIGINAL MAPS</span><span>10 WEAPONS</span><span>TACTICAL VISION</span><span>WEBRTC LIVE DUEL</span><span>NO XP FARMING</span></div><div data-reconnect-slot></div></div></div>
          </div></section>
          <section class="bs-panel" data-bs-panel="solo"><div class="bs-wrap"><div class="bs-section-title"><div><span>SOLO OPERATIONS</span><h2>VS BOT</h2><p>Choose a bot level and arena. The bot follows the same wall/vision rules — no wall-hacks.</p></div></div><div class="bs-setup-grid"><div class="bs-card"><label class="bs-field"><span>BOT DIFFICULTY</span><select data-solo-difficulty><option value="easy">Easy</option><option value="normal" selected>Normal</option><option value="hard">Hard</option><option value="veryhard">Very Hard</option></select></label><div class="bs-field"><span>FIRE MODE</span><div class="bs-firemode"><button type="button" data-firemode="manual">MANUAL FIRE</button><button type="button" data-firemode="auto">AUTO FIRE</button></div></div><div class="bs-map-random"><span>Want a different arena instantly?</span><button class="bs-btn ghost" type="button" data-random-map="solo">RANDOM MAP</button></div><div class="bs-inline-actions"><button class="bs-btn primary" type="button" data-start-solo>START MATCH</button><button class="bs-btn ghost" type="button" data-go="home">BACK</button></div></div><div class="bs-card"><div class="bs-section-title"><div><span>SELECT MAP</span><h2 data-solo-map-title>DATA VAULT</h2></div></div><div class="bs-map-grid" data-map-grid="solo"></div></div></div></div></section>
          <section class="bs-panel" data-bs-panel="multi"><div class="bs-wrap"><div class="bs-section-title"><div><span>LIVE DUEL</span><h2>MULTIPLAYER 1V1</h2><p>Fast combat travels over WebRTC DataChannel. Firebase is used only for temporary room discovery and handshake data.</p></div></div><div class="bs-setup-grid"><div class="bs-card"><label class="bs-field"><span>PLAYER NAME</span><input data-host-name maxlength="24"></label><label class="bs-field"><span>MATCH FORMAT</span><select data-host-bestof><option value="1">Single Round</option><option value="3" selected>Best of 3</option><option value="5">Best of 5</option></select></label><label class="bs-field"><span>MAP ROTATION</span><select data-map-rotation><option value="same">Same Map</option><option value="random">Random Every Match</option></select></label><div class="bs-inline-actions"><button class="bs-btn primary" type="button" data-create-room>CREATE ROOM</button><button class="bs-btn" type="button" data-go="join">JOIN ROOM</button><button class="bs-btn ghost" type="button" data-go="home">BACK</button></div><div class="bs-status" data-create-status>Host selects the arena, then shares the room code or QR.</div></div><div class="bs-card"><div class="bs-section-title"><div><span>HOST MAP</span><h2 data-host-map-title>DATA VAULT</h2></div></div><div class="bs-map-grid" data-map-grid="host"></div><div class="bs-map-random"><span>Host can choose any valid arena.</span><button class="bs-btn ghost" type="button" data-random-map="host">RANDOM MAP</button></div></div></div></div></section>
          <section class="bs-panel" data-bs-panel="join"><div class="bs-wrap"><div class="bs-section-title"><div><span>JOIN LIVE DUEL</span><h2>ROOM CODE / QR</h2><p>Enter the six-character code, scan the Host QR, or accept a Student ID invite.</p></div></div><div class="bs-setup-grid"><div class="bs-card"><label class="bs-field"><span>PLAYER NAME</span><input data-guest-name maxlength="24"></label><label class="bs-field"><span>ROOM CODE</span><input data-room-input maxlength="6" autocomplete="off" placeholder="ABC123"></label><div class="bs-inline-actions"><button class="bs-btn primary" type="button" data-join-room>JOIN ROOM</button><button class="bs-btn" type="button" data-scan-room>📷 SCAN QR</button><button class="bs-btn ghost" type="button" data-go="multi">BACK</button></div><div class="bs-status" data-join-status>Waiting for a room code.</div></div><div class="bs-card"><div class="bs-section-title"><div><span>STUDENT ID INVITES</span><h2>INBOX</h2></div><button class="bs-btn ghost" type="button" data-refresh-invites>REFRESH</button></div><div class="bs-invite-list" data-invite-list><div class="bs-status">No pending BYTE STRIKE invites.</div></div></div></div></div></section>
          <section class="bs-panel" data-bs-panel="lobby"><div class="bs-wrap"><div class="bs-lobby-grid"><div class="bs-card"><div class="bs-room-code"><div><span>BYTE STRIKE ROOM</span><strong data-room-code>------</strong><small data-room-meta>Waiting for opponent...</small></div><div class="bs-inline-actions"><button class="bs-btn ghost" type="button" data-copy-room>COPY CODE</button><button class="bs-btn ghost" type="button" data-share-room>SHARE</button></div></div><div class="bs-room-qr"><img data-room-qr alt="Byte Strike room QR"><div><strong data-lobby-map-name>DATA VAULT</strong><p class="bs-status" data-lobby-map-info>Medium · Balanced</p><label class="bs-field"><span>INVITE BY STUDENT ID</span><input data-target-student placeholder="Student ID"></label><button class="bs-btn" type="button" data-send-invite>SEND INVITE</button><div class="bs-status" data-room-status></div></div></div></div><div class="bs-card"><div class="bs-section-title"><div><span>DUEL ROSTER</span><h2>READY CHECK</h2></div></div><div class="bs-roster" data-roster></div><div class="bs-inline-actions"><button class="bs-btn primary" type="button" data-ready>READY</button><button class="bs-btn danger" type="button" data-leave-room>LEAVE ROOM</button></div></div></div></div></section>
          <section class="bs-panel" data-bs-panel="how"><div class="bs-wrap"><div class="bs-section-title"><div><span>FIELD MANUAL</span><h2>HOW TO PLAY</h2><p>Movement and aim are independent. Darkness is information: walls block sight, but sound can warn you.</p></div></div><div class="bs-how-grid"><div class="bs-card"><h3>MOBILE</h3><div class="bs-control-diagram"><div><b>LEFT JOYSTICK</b><span>Move in any direction with analog control.</span></div><div><b>RIGHT JOYSTICK</b><span>Aim independently while moving.</span></div><div><b>FIRE</b><span>Shoot manually, or enable Auto Fire in Settings.</span></div><div><b>RELOAD / PICK UP</b><span>Use the compact action buttons near your aiming thumb.</span></div></div></div><div class="bs-card"><h3>DESKTOP</h3><div class="bs-control-diagram"><div><b>WASD</b><span>Move. Diagonal speed is normalized.</span></div><div><b>MOUSE</b><span>Aim toward the pointer in world space.</span></div><div><b>LEFT CLICK</b><span>Fire current weapon.</span></div><div><b>R / E</b><span>Reload / Pick up nearby weapon.</span></div></div></div></div><div class="bs-card" style="margin-top:12px"><h3>TACTICAL VISION</h3><p class="bs-status">You have a small awareness radius plus a larger aim-direction vision cone. Solid walls and crates cut line of sight. Hidden enemies lose their name/health/position immediately; gunshots only provide approximate directional information.</p></div><div class="bs-card" style="margin-top:12px"><h3>ARMORY · 10 WEAPONS</h3><div class="bs-armory"><span>PISTOL</span><span>REVOLVER</span><span>MACHINE PISTOL</span><span>SMG</span><span>PDW</span><span>CARBINE</span><span>SHOTGUN</span><span>RIFLE</span><span>DMR</span><span>LMG</span></div><p class="bs-status">Every weapon has its own damage, fire rate, spread, range, reload, sound, recoil, and movement trade-off.</p></div><div class="bs-inline-actions"><button class="bs-btn primary" type="button" data-go="home">BACK</button></div></div></section>
          <section class="bs-panel" data-bs-panel="settings"><div class="bs-wrap"><div class="bs-section-title"><div><span>TACTICAL SETTINGS</span><h2>CONTROLS & EFFECTS</h2></div></div><div class="bs-card"><div class="bs-field"><span>MOBILE FIRE MODE</span><div class="bs-firemode"><button type="button" data-firemode="manual">MANUAL FIRE</button><button type="button" data-firemode="auto">AUTO FIRE</button></div></div><label class="bs-field"><span>GAME AUDIO · SFX + MUSIC</span><select data-setting-sfx><option value="on">On</option><option value="off">Off</option></select></label><label class="bs-field"><span>REDUCED EFFECTS / MOTION</span><select data-setting-reduced><option value="off">Off</option><option value="on">On</option></select></label><div class="bs-inline-actions"><button class="bs-btn primary" type="button" data-save-settings>SAVE SETTINGS</button><button class="bs-btn ghost" type="button" data-go="home">BACK</button></div></div></div></section>
          <section class="bs-panel bs-game-panel" data-bs-panel="game"><div class="bs-game-wrap" data-game-wrap><canvas class="bs-canvas" data-canvas></canvas><div class="bs-orientation-gate" data-orientation-gate hidden><div class="bs-rotate-phone" aria-hidden="true"><span></span></div><span>MOBILE COMBAT MODE</span><strong>ROTATE TO LANDSCAPE</strong><p>BYTE STRIKE uses a wide tactical view so your movement, aim, FIRE, reload, and pickup controls stay clear.</p><small>Menus work in portrait. The battle starts in landscape.</small></div><div class="bs-hud"><div class="bs-hud-top"><div class="bs-hud-box"><div class="bs-health-row"><span class="bs-health-icon">HP</span><div class="bs-health-main"><div class="bs-health-label"><span>BYTE AGENT</span><b data-hp>100</b></div><div class="bs-health-bar"><i data-hp-bar></i></div></div></div><div class="bs-weapon-line"><strong data-weapon>PISTOL</strong><div><b data-ammo>12</b><small> / <span data-reserve>60</span></small></div></div></div><div class="bs-hud-box bs-round-box"><span data-round-label>ROUND 1</span><strong data-score>0 — 0</strong><small data-timer>00:00</small></div><div class="bs-hud-box bs-net-box" data-net-box><strong data-ping>SOLO</strong><span data-net-status>TACTICAL LINK</span></div></div><div class="bs-crosshair-ui" data-crosshair></div><div class="bs-message" data-message><span data-message-kicker>BYTE STRIKE</span><strong data-message-title></strong><small data-message-sub></small></div><div class="bs-reload" data-reload><span><b>RELOADING</b><b data-reload-pct>0%</b></span><div><i data-reload-bar></i></div></div><div class="bs-pickup-prompt" data-pickup-prompt></div><div class="bs-damage-arrow" data-damage-arrow></div><div class="bs-sound-arrow" data-sound-arrow></div></div><div class="bs-mobile-controls"><div class="bs-stick-zone left" data-stick-zone="left"><div class="bs-stick" data-stick="left"><i></i></div></div><div class="bs-stick-zone right" data-stick-zone="right"><div class="bs-stick" data-stick="right"><i></i></div></div><div class="bs-touch-buttons"><button class="bs-touch-btn reload" type="button" data-touch-reload>RLD</button><button class="bs-touch-btn pickup" type="button" data-touch-pickup>PICK</button><button class="bs-touch-btn fire" type="button" data-touch-fire>FIRE</button></div></div><div class="bs-game-menu"><button class="bs-icon-btn" type="button" data-game-menu aria-label="Pause or menu">☰</button></div><div class="bs-pause-layer" data-pause hidden><div class="bs-modal"><span data-pause-kicker>TACTICAL PAUSE</span><h2 data-pause-title>PAUSED</h2><p data-pause-text>Solo match paused.</p><div class="bs-inline-actions" style="justify-content:center"><button class="bs-btn primary" type="button" data-resume>RESUME</button><button class="bs-btn" type="button" data-game-settings>SOUND</button><button class="bs-btn danger" type="button" data-quit-match>LEAVE MATCH</button></div></div></div><div class="bs-countdown-layer" data-countdown hidden><div class="bs-modal"><span data-count-kicker>ROUND START</span><h2 class="bs-count-number" data-count-number>3</h2><p data-count-sub>Stay behind cover. Watch your angles.</p></div></div><div class="bs-result-layer" data-result hidden><div class="bs-modal"><span data-result-kicker>MATCH COMPLETE</span><h2 data-result-title>YOU WIN</h2><p data-result-sub></p><div class="bs-result-stats"><div><span>ROUND SCORE</span><b data-result-score>0 — 0</b></div><div><span>DAMAGE</span><b data-result-damage>0</b></div><div><span>ACCURACY</span><b data-result-accuracy>0%</b></div></div><div class="bs-inline-actions" style="justify-content:center"><button class="bs-btn primary" type="button" data-rematch>REMATCH</button><button class="bs-btn" type="button" data-change-map>CHANGE MAP</button><button class="bs-btn danger" type="button" data-leave-result>LEAVE</button></div><div class="bs-status" data-rematch-status></div></div></div><div class="bs-scanner" data-scanner hidden><div class="bs-modal"><div class="bs-scanner-head"><strong>SCAN BYTE STRIKE ROOM</strong><button class="bs-icon-btn" type="button" data-close-scanner>×</button></div><video data-scan-video playsinline muted></video><p class="bs-status" data-scan-status>Point the camera at the Host QR.</p></div></div><div class="bs-debug" data-debug></div></div></section>
        </main>
      </div>`;
    document.body.appendChild(o);r.overlay=o;r.canvas=$('[data-canvas]',o);r.ctx=r.canvas.getContext('2d',{alpha:false});r.fogCanvas=document.createElement('canvas');r.fogCtx=r.fogCanvas.getContext('2d');
    $$('[data-bs-panel]',o).forEach(p=>r.panels[p.dataset.bsPanel]=p);
    bindUi();renderMapCards('solo');renderMapCards('host');loadSettings();syncSettingsUi();resizeCanvas();
    if(window.ResizeObserver){r.resizeObs=new ResizeObserver(()=>resizeCanvas());r.resizeObs.observe($('[data-game-wrap]',o));}
    window.addEventListener('resize',()=>{resizeCanvas();updateOrientationGate();},{passive:true});
    window.addEventListener('orientationchange',()=>setTimeout(()=>{resizeCanvas();updateOrientationGate();},120),{passive:true});
  }

  function show(name){
    r.state=name;
    Object.entries(r.panels).forEach(([k,p])=>p.classList.toggle('active',k===name));
    r.overlay?.classList.toggle('bs-playing',name==='game');
    if(name==='join')startInvitePolling(); else stopInvitePolling();
    if(name==='home')renderReconnectCard();
    updateOrientationGate();
    if(name!=='game') setTimeout(()=>resizeCanvas(),0);
  }
  function mobileBattleDevice(){
    try{return matchMedia('(pointer:coarse)').matches&&Math.min(window.innerWidth,window.innerHeight)<=700;}catch(_){return false;}
  }
  function mobilePortraitBattle(){return mobileBattleDevice()&&window.innerHeight>window.innerWidth;}
  function updateOrientationGate(){
    const gate=$('[data-orientation-gate]',r.overlay);if(!gate)return;
    const blocked=r.state==='game'&&mobilePortraitBattle();
    r.orientationBlocked=blocked;gate.hidden=!blocked;
    r.overlay?.classList.toggle('bs-portrait-blocked',blocked);
    if(blocked){r.touch.fire=false;r.touch.reload=false;r.touch.pickup=false;r.joy.left=r.joy.right=null;r.keys.clear();r.mouse.down=false;}
    if(r.state==='game'){
      if(r.role==='host')r.hostPeer?.session?.send({t:'orientation',ready:!blocked});
      else if(r.role==='guest')r.guestSession?.send({t:'orientation',ready:!blocked});
    }
    setTimeout(()=>resizeCanvas(),0);
  }
  async function prepareMobileBattleView(){
    if(!mobileBattleDevice())return;
    try{
      if(!document.fullscreenElement&&r.overlay?.requestFullscreen){await r.overlay.requestFullscreen({navigationUI:'hide'});r.mobileFullscreenOwned=true;}
    }catch(_){}
    try{if(screen.orientation?.lock)await screen.orientation.lock('landscape');}catch(_){}
    updateOrientationGate();
  }
  function releaseMobileBattleView(){
    try{screen.orientation?.unlock?.();}catch(_){}
    if(r.mobileFullscreenOwned&&document.fullscreenElement){try{document.exitFullscreen?.();}catch(_){}}
    r.mobileFullscreenOwned=false;r.orientationBlocked=false;r.overlay?.classList.remove('bs-portrait-blocked');
    const gate=$('[data-orientation-gate]',r.overlay);if(gate)gate.hidden=true;
  }
  function syncSettingsUi(){
    $$('[data-firemode]',r.overlay).forEach(b=>b.classList.toggle('active',b.dataset.firemode===r.settings.fireMode));
    const s=$('[data-setting-sfx]',r.overlay),m=$('[data-setting-reduced]',r.overlay);if(s)s.value=r.settings.sfx?'on':'off';if(m)m.value=r.settings.reduced?'on':'off';
  }
  function bindUi(){
    const o=r.overlay;
    o.addEventListener('click',async e=>{
      const go=e.target.closest('[data-go]');if(go){show(go.dataset.go);return;}
      if(e.target.closest('[data-bs-back]')){returnHub();return;}
      if(e.target.closest('[data-bs-close]')){close(true);return;}
      if(e.target.closest('[data-bs-sound]')){toggleSound();return;}
      const fm=e.target.closest('[data-firemode]');if(fm){r.settings.fireMode=fm.dataset.firemode==='auto'?'auto':'manual';saveSettings();syncSettingsUi();return;}
      const map=e.target.closest('[data-map-id]');if(map){selectMap(map.dataset.mapId,map.closest('[data-map-grid]')?.dataset.mapGrid||'solo');return;}
      const step=e.target.closest('[data-map-step]');if(step){stepMap(Number(step.dataset.mapStep)||1,step.dataset.mapScope||'solo');return;}
      const rand=e.target.closest('[data-random-map]');if(rand){selectMap(M().random(r.selectedMap).id,rand.dataset.randomMap||'solo');return;}
      if(e.target.closest('[data-start-solo]')){await startSolo();return;}
      if(e.target.closest('[data-create-room]')){createRoom();return;}
      if(e.target.closest('[data-join-room]')){joinRoom(String($('[data-room-input]',o)?.value||''));return;}
      if(e.target.closest('[data-scan-room]')){scanRoom();return;}
      if(e.target.closest('[data-close-scanner]')){closeScanner();return;}
      if(e.target.closest('[data-copy-room]')){P()?.copyText?.(r.roomCode);setStatus($('[data-room-status]',o),'Room code copied.',false,true);return;}
      if(e.target.closest('[data-share-room]')){P()?.shareText?.(`BYTE STRIKE room ${r.roomCode}`,'BYTE STRIKE');return;}
      if(e.target.closest('[data-send-invite]')){sendStudentInvite();return;}
      if(e.target.closest('[data-refresh-invites]')){refreshInvites(true);return;}
      const ai=e.target.closest('[data-accept-invite]');if(ai){acceptInvite(ai.dataset.acceptInvite);return;}
      const di=e.target.closest('[data-decline-invite]');if(di){declineInvite(di.dataset.declineInvite);return;}
      if(e.target.closest('[data-ready]')){if(!r.localReady)await prepareMobileBattleView();toggleReady();return;}
      if(e.target.closest('[data-leave-room]')){leaveRoomToHome();return;}
      if(e.target.closest('[data-save-settings]')){r.settings.sfx=$('[data-setting-sfx]',o).value==='on';r.settings.reduced=$('[data-setting-reduced]',o).value==='on';r.bridge?.setSoundEnabled?.(r.settings.sfx);saveSettings();syncSettingsUi();show('home');return;}
      if(e.target.closest('[data-game-menu]')){openPause();return;}
      if(e.target.closest('[data-resume]')){resumePause();return;}
      if(e.target.closest('[data-game-settings]')){toggleSound();return;}
      if(e.target.closest('[data-quit-match]')){quitMatch();return;}
      if(e.target.closest('[data-rematch]')){requestRematch();return;}
      if(e.target.closest('[data-change-map]')){changeMapAfterMatch();return;}
      if(e.target.closest('[data-leave-result]')){quitMatch();return;}
      if(e.target.closest('[data-reconnect-last]')){reconnectLast();return;}
    });
    $('[data-solo-difficulty]',o).addEventListener('change',e=>r.botDifficulty=e.target.value);
    $('[data-host-bestof]',o).addEventListener('change',e=>r.bestOf=Number(e.target.value)||3);
    $('[data-map-rotation]',o).addEventListener('change',e=>r.mapRotation=e.target.value==='random'?'random':'same');
    document.addEventListener('keydown',onKey,{passive:false});document.addEventListener('keyup',onKeyUp,{passive:false});
    r.canvas.addEventListener('pointermove',onCanvasPointerMove);r.canvas.addEventListener('pointerdown',onCanvasPointerDown);window.addEventListener('pointerup',onWindowPointerUp,{passive:true});
    bindTouchControls();window.addEventListener('blur',onBlur);document.addEventListener('visibilitychange',onVisibility);
  }

  function renderMapCards(scope){
    const grid=$(`[data-map-grid="${scope}"]`,r.overlay);if(!grid||!M())return;
    const current=M().get(r.selectedMap);
    const nav=`<div class="bs-map-mobile-nav"><button type="button" data-map-step="-1" data-map-scope="${esc(scope)}" aria-label="Previous map">‹</button><div><span>SELECT ARENA</span><strong data-mobile-map-name>${esc(current.name)}</strong></div><button type="button" data-map-step="1" data-map-scope="${esc(scope)}" aria-label="Next map">›</button></div>`;
    grid.innerHTML=nav+M().maps.map(map=>`<button class="bs-map-card ${map.id===r.selectedMap?'active':''}" type="button" data-map-id="${esc(map.id)}"><canvas class="bs-map-preview" width="240" height="150" data-map-preview="${esc(map.id)}"></canvas><strong>${esc(map.name)}</strong><small>${esc(map.size)} · ${esc(map.environment)}</small><em>${esc(map.playStyle)}</em></button>`).join('');
    $$('[data-map-preview]',grid).forEach(c=>drawMapPreview(c,M().get(c.dataset.mapPreview)));
    updateMapTitle(scope);
  }
  function drawMapPreview(canvas,map){
    const c=canvas.getContext('2d'),sx=canvas.width/map.width,sy=canvas.height/map.height;c.fillStyle=map.floor;c.fillRect(0,0,canvas.width,canvas.height);
    c.strokeStyle=map.grid;c.lineWidth=1;for(let x=0;x<canvas.width;x+=24){c.beginPath();c.moveTo(x,0);c.lineTo(x,canvas.height);c.stroke();}for(let y=0;y<canvas.height;y+=24){c.beginPath();c.moveTo(0,y);c.lineTo(canvas.width,y);c.stroke();}
    map.walls.forEach(w=>{c.fillStyle=w.vision?`${map.accent}55`:'rgba(160,190,210,.25)';c.fillRect(w.x*sx,w.y*sy,Math.max(1,w.w*sx),Math.max(1,w.h*sy));});
    map.pickups.forEach(p=>{c.fillStyle=weapon(p.weapon).color;c.beginPath();c.arc(p.x*sx,p.y*sy,3,0,Math.PI*2);c.fill();});
    const sp=map.spawnPairs[0];if(sp){c.fillStyle='#67e8f9';c.beginPath();c.arc(sp[0].x*sx,sp[0].y*sy,4,0,Math.PI*2);c.fill();c.fillStyle='#fb7185';c.beginPath();c.arc(sp[1].x*sx,sp[1].y*sy,4,0,Math.PI*2);c.fill();}
  }
  function selectMap(id,scope='solo'){
    r.selectedMap=M().get(id).id;
    $$('[data-map-id]',r.overlay).forEach(b=>b.classList.toggle('active',b.dataset.mapId===r.selectedMap));
    $$('[data-mobile-map-name]',r.overlay).forEach(el=>el.textContent=M().get(r.selectedMap).name);
    updateMapTitle(scope);updateMapTitle(scope==='solo'?'host':'solo');
  }
  function stepMap(dir=1,scope='solo'){
    const maps=M()?.maps||[];if(!maps.length)return;const at=Math.max(0,maps.findIndex(m=>m.id===r.selectedMap));
    const next=maps[(at+(dir<0?-1:1)+maps.length)%maps.length];selectMap(next.id,scope);
  }
  function updateMapTitle(scope){const m=M().get(r.selectedMap),el=$(`[data-${scope}-map-title]`,r.overlay);if(el)el.textContent=m.name;}

  function toggleSound(){const next=!soundEnabled();r.settings.sfx=next;r.bridge?.setSoundEnabled?.(next);saveSettings();const b=$('[data-bs-sound]',r.overlay);if(b)b.textContent=next?'🔊':'🔇';if(next)r.music?.resume?.();else r.music?.pause?.();}
  function audioCtx(){if(r.audio)return r.audio;try{r.audio=new (window.AudioContext||window.webkitAudioContext)();}catch(_){}return r.audio;}
  function sfx(type,pan=0,vol=1){
    if(!soundEnabled())return;
    const a=audioCtx();if(!a)return;
    try{
      if(a.state==='suspended')a.resume();
      const t=a.currentTime;
      const master=a.createGain();
      const p=a.createStereoPanner?a.createStereoPanner():null;
      const comp=a.createDynamicsCompressor();
      comp.threshold.value=-16;comp.knee.value=12;comp.ratio.value=4;comp.attack.value=.003;comp.release.value=.12;
      const base=Math.max(.0002,window.__ict8SfxGain?__ict8SfxGain(.16*vol):.16*vol);
      master.gain.setValueAtTime(base,t);
      if(p){p.pan.value=clamp(pan,-1,1);master.connect(comp);comp.connect(p);p.connect(a.destination);}else{master.connect(comp);comp.connect(a.destination);}
      const tone=(freq,kind,dur,gain=1,endFreq=null,delay=0)=>{const o=a.createOscillator(),g=a.createGain(),st=t+delay;o.type=kind;o.frequency.setValueAtTime(Math.max(25,freq),st);if(endFreq)o.frequency.exponentialRampToValueAtTime(Math.max(20,endFreq),st+dur);g.gain.setValueAtTime(.0001,st);g.gain.exponentialRampToValueAtTime(Math.max(.00015,gain),st+.004);g.gain.exponentialRampToValueAtTime(.0001,st+dur);o.connect(g);g.connect(master);o.start(st);o.stop(st+dur+.02);};
      const noise=(dur,gain=.25,cut=2400,delay=0)=>{const st=t+delay,len=Math.max(1,Math.floor(a.sampleRate*dur)),buf=a.createBuffer(1,len,a.sampleRate),d=buf.getChannelData(0);for(let i=0;i<len;i++)d[i]=(Math.random()*2-1)*(1-i/len);const src=a.createBufferSource(),f=a.createBiquadFilter(),g=a.createGain();src.buffer=buf;f.type='lowpass';f.frequency.value=cut;g.gain.setValueAtTime(Math.max(.0001,gain),st);g.gain.exponentialRampToValueAtTime(.0001,st+dur);src.connect(f);f.connect(g);g.connect(master);src.start(st);src.stop(st+dur+.01);};
      switch(type){
        case 'pistol': case 'shot': tone(185,'square',.07,.68,92);tone(92,'sine',.1,.44,55);noise(.045,.30,3300);break;
        case 'revolver': tone(128,'sawtooth',.12,.92,48);tone(62,'sine',.16,.75,38);noise(.085,.55,2200);break;
        case 'machinepistol': tone(220,'square',.055,.55,115);noise(.038,.34,4200);break;
        case 'smg': tone(195,'square',.06,.60,100);noise(.045,.40,3600);break;
        case 'pdw': tone(210,'square',.062,.64,110);tone(86,'sine',.08,.32,60);noise(.04,.34,4200);break;
        case 'carbine': tone(150,'square',.085,.76,72);tone(74,'sine',.12,.46,44);noise(.052,.42,3400);break;
        case 'rifle': tone(132,'square',.095,.82,62);tone(68,'sine',.13,.48,42);noise(.06,.48,3200);break;
        case 'dmr': tone(108,'sawtooth',.13,.92,45);tone(54,'sine',.18,.60,34);noise(.075,.52,2700);break;
        case 'lmg': tone(118,'square',.095,.86,55);tone(50,'sine',.14,.55,34);noise(.06,.54,2800);break;
        case 'shotgun': tone(82,'sawtooth',.15,1,36);tone(46,'sine',.19,.78,28);noise(.12,.78,1800);break;
        case 'hit': tone(430,'sine',.055,.42,240);noise(.038,.24,5000);break;
        case 'wall': tone(760,'square',.03,.22,420);noise(.035,.18,6200);break;
        case 'reload': tone(340,'triangle',.045,.38,260);tone(510,'triangle',.045,.26,390,.08);break;
        case 'pickup': tone(560,'sine',.07,.42,780);tone(900,'sine',.08,.25,1180,.055);break;
        case 'empty': tone(155,'square',.025,.34,110);break;
        case 'start': tone(430,'square',.08,.42,620);tone(690,'square',.11,.32,920,.065);break;
        case 'win': tone(660,'sine',.14,.40,880);tone(990,'sine',.18,.32,1320,.09);break;
        case 'lose': tone(185,'sawtooth',.16,.38,72);tone(92,'sine',.2,.28,45,.07);break;
        case 'step': tone(78,'sine',.035,.12,55);noise(.026,.06,900);break;
        case 'ready': tone(610,'sine',.06,.32,780);break;
        default: tone(320,'sine',.06,.28,240);break;
      }
      setTimeout(()=>{try{master.disconnect();comp.disconnect();p?.disconnect();}catch(_){}},360);
    }catch(_){}
  }
  function shotSfxId(id){return WEAPONS[id]?id:'pistol';}


  async function startSolo(){
    await prepareMobileBattleView();
    r.role='solo';r.botDifficulty=$('[data-solo-difficulty]',r.overlay)?.value||r.botDifficulty;r.bestOf=3;r.match={mode:'solo',mapId:r.selectedMap,bestOf:3,winsTo:2,score:[0,0],round:1,startAt:Date.now()+2800,stats:[newStats(),newStats()]};
    prepareAuthorityRound();show('game');beginGameLoop();showCountdown(r.match.startAt,'ROUND 1');r.music?.resume?.();r.music?.duck?.(.82,180);
  }
  function newStats(){return{shots:0,hits:0,damage:0,kills:0};}
  function makePlayer(index,spawn,name,bot=false){const w=weapon('pistol');return{index,name,bot,x:spawn.x,y:spawn.y,vx:0,vy:0,aim:spawn.a||0,hp:100,maxHp:100,alive:true,weapon:'pistol',mag:w.mag,reserve:w.reserve,reloading:false,reloadEnd:0,lastShot:-9999,lastDamaged:0,lastStep:0,recoilKick:0,muzzleUntil:0,input:{mx:0,my:0,aim:spawn.a||0,fire:false,reload:false,pickup:false},brain:bot?{state:'patrol',seenAt:0,lastSeen:null,lastHeard:null,path:[],pathAt:0,pathTarget:null,strafeDir:Math.random()<.5?-1:1,error:0,errorAt:0,engageAt:0,patrol:null}:null};}
  function prepareAuthorityRound(){
    const map=gameMap(),pair=map.spawnPairs[(r.match.round-1)%map.spawnPairs.length];const id=identity();
    const p0=makePlayer(0,pair[0],id.name||'YOU',false);const p1=makePlayer(1,pair[1],r.role==='solo'?`${BOT[r.botDifficulty]?.label||'NORMAL'} BOT`:(r.hostPeer?.name||'OPPONENT'),r.role==='solo');
    r.world={players:[p0,p1],projectiles:[],pickups:map.pickups.map((p,i)=>({...p,id:i,active:true,respawnAt:0})),effects:[],shotEvents:[],hitEvents:[],noiseEvents:[],roundOver:false,startedAt:r.match.startAt,lastTick:now(),seq:0,lastLoud:null};
    r.predicted=null;r.remoteVisual=null;r.authorityPaused=false;buildNav(map);updateHud();persistRoomState();
  }
  function prepareGuestWorld(payload){
    r.localReady=false;r.remoteReady=false;r.match={mode:'multi',mapId:payload.mapId,bestOf:Number(payload.bestOf||3),winsTo:Math.ceil(Number(payload.bestOf||3)/2),score:[...payload.score],round:Number(payload.round||1),startAt:Number(payload.startAt||Date.now()+2500),stats:[newStats(),newStats()]};
    const snap=payload.world;const map=gameMap();r.world={players:[makePlayer(0,map.spawnPairs[0][0],payload.hostName||'HOST'),makePlayer(1,map.spawnPairs[0][1],identity().name||'YOU')],projectiles:[],pickups:map.pickups.map((p,i)=>({...p,id:i,active:true,respawnAt:0})),effects:[],shotEvents:[],hitEvents:[],noiseEvents:[],roundOver:false,startedAt:r.match.startAt,lastTick:now(),seq:0,lastLoud:null};
    applyGuestSnapshot(snap,true);const mine=r.world.players[1];r.predicted={x:mine.x,y:mine.y,aim:mine.aim};buildNav(map);show('game');beginGameLoop();showCountdown(r.match.startAt,`ROUND ${r.match.round}`);
  }

  function resizeCanvas(){if(!r.canvas)return;const wrap=$('[data-game-wrap]',r.overlay);if(!wrap)return;const rect=wrap.getBoundingClientRect(),dpr=Math.min(2,window.devicePixelRatio||1);if(rect.width<10||rect.height<10)return;r.dpr=dpr;r.canvas.width=Math.max(1,Math.round(rect.width*dpr));r.canvas.height=Math.max(1,Math.round(rect.height*dpr));r.canvas.style.width=`${rect.width}px`;r.canvas.style.height=`${rect.height}px`;if(r.fogCanvas){r.fogCanvas.width=r.canvas.width;r.fogCanvas.height=r.canvas.height;}}
  function canvasSize(){return{w:r.canvas.width/r.dpr,h:r.canvas.height/r.dpr};}
  function localIndex(){return r.role==='guest'?1:0;}
  function localPlayer(){return r.world?.players?.[localIndex()]||null;}
  function otherPlayer(){return r.world?.players?.[localIndex()===0?1:0]||null;}
  function resetInput(){return{mx:0,my:0,aim:0,fire:false,reload:false,pickup:false};}

  function onKey(e){if(!r.open||r.state!=='game'||e.target?.closest?.('input,textarea,select'))return;const k=String(e.key||'').toLowerCase();if(['w','a','s','d','r','e','escape'].includes(k)){e.preventDefault();if(e.type==='keydown')r.keys.add(k);if(k==='r'&&!e.repeat)r.touch.reload=true;if(k==='e'&&!e.repeat)r.touch.pickup=true;if(k==='escape'&&!e.repeat)openPause();}}
  function onKeyUp(e){const k=String(e.key||'').toLowerCase();r.keys.delete(k);}
  function onCanvasPointerMove(e){if(r.state!=='game')return;const rect=r.canvas.getBoundingClientRect();r.mouse.x=e.clientX-rect.left;r.mouse.y=e.clientY-rect.top;r.mouse.inside=true;}
  function onCanvasPointerDown(e){if(r.state!=='game'||e.pointerType==='touch')return;if(e.button===0){r.mouse.down=true;try{r.canvas.setPointerCapture(e.pointerId);}catch(_){}e.preventDefault();}}
  function onWindowPointerUp(e){if(e.pointerType!=='touch')r.mouse.down=false;}
  function onBlur(){if(!r.open||r.state!=='game')return;if(r.role==='solo')openPause(true);r.keys.clear();r.mouse.down=false;}
  function onVisibility(){if(document.visibilityState==='hidden'&&r.role==='solo'&&r.state==='game')openPause(true);}

  function bindTouchControls(){
    const zones=$$('[data-stick-zone]',r.overlay);zones.forEach(zone=>{
      const side=zone.dataset.stickZone;zone.addEventListener('pointerdown',e=>{if(e.pointerType!=='touch'&&e.pointerType!=='pen')return;e.preventDefault();startStick(side,e);},{passive:false});zone.addEventListener('pointermove',e=>{if(r.joy[side]?.id!==e.pointerId)return;e.preventDefault();moveStick(side,e);},{passive:false});zone.addEventListener('pointerup',e=>endStick(side,e));zone.addEventListener('pointercancel',e=>endStick(side,e));
    });
    const fire=$('[data-touch-fire]',r.overlay),reload=$('[data-touch-reload]',r.overlay),pickup=$('[data-touch-pickup]',r.overlay);
    fire.addEventListener('pointerdown',e=>{e.preventDefault();r.touch.fire=true;fire.classList.add('active');});['pointerup','pointercancel','pointerleave'].forEach(ev=>fire.addEventListener(ev,()=>{r.touch.fire=false;fire.classList.remove('active');}));
    reload.addEventListener('pointerdown',e=>{e.preventDefault();r.touch.reload=true;reload.classList.add('active');setTimeout(()=>reload.classList.remove('active'),100);});pickup.addEventListener('pointerdown',e=>{e.preventDefault();r.touch.pickup=true;pickup.classList.add('active');setTimeout(()=>pickup.classList.remove('active'),100);});
  }
  function startStick(side,e){const zone=e.currentTarget,rect=zone.getBoundingClientRect(),x=e.clientX-rect.left,y=e.clientY-rect.top;r.joy[side]={id:e.pointerId,cx:x,cy:y,x:0,y:0};const stick=$(`[data-stick="${side}"]`,r.overlay);stick.style.left=`${x}px`;stick.style.top=`${y}px`;stick.classList.add('show');try{zone.setPointerCapture(e.pointerId);}catch(_){}moveStick(side,e);}
  function moveStick(side,e){const j=r.joy[side];if(!j)return;const rect=e.currentTarget.getBoundingClientRect(),x=e.clientX-rect.left,y=e.clientY-rect.top,dx=x-j.cx,dy=y-j.cy,max=52,mag=Math.hypot(dx,dy),scale=mag>max?max/mag:1,jx=dx*scale,jy=dy*scale;j.x=Math.abs(jx/max)<.11?0:jx/max;j.y=Math.abs(jy/max)<.11?0:jy/max;const nub=$(`[data-stick="${side}"] i`,r.overlay);nub.style.transform=`translate(${jx}px,${jy}px)`;}
  function endStick(side,e){const j=r.joy[side];if(!j||j.id!==e.pointerId)return;r.joy[side]=null;const stick=$(`[data-stick="${side}"]`,r.overlay);stick.classList.remove('show');const nub=$('i',stick);nub.style.transform='translate(0,0)';}

  function sampleLocalInput(){
    if(r.orientationBlocked)return resetInput();
    const p=localPlayer();if(!p)return resetInput();let mx=0,my=0;if(r.keys.has('a'))mx-=1;if(r.keys.has('d'))mx+=1;if(r.keys.has('w'))my-=1;if(r.keys.has('s'))my+=1;if(r.joy.left){mx+=r.joy.left.x;my+=r.joy.left.y;}const ml=Math.hypot(mx,my);if(ml>1){mx/=ml;my/=ml;}
    let aim=p.aim,aimActive=false;if(r.joy.right&&Math.hypot(r.joy.right.x,r.joy.right.y)>.15){aim=Math.atan2(r.joy.right.y,r.joy.right.x);aimActive=true;}else if(r.mouse.inside&&matchMedia('(pointer:fine)').matches){const size=canvasSize(),wx=r.camera.x+(r.mouse.x-size.w/2),wy=r.camera.y+(r.mouse.y-size.h/2);aim=Math.atan2(wy-p.y,wx-p.x);aimActive=true;const cross=$('[data-crosshair]',r.overlay);cross.style.transform=`translate3d(${r.mouse.x}px,${r.mouse.y}px,0)`;}
    const fire=r.mouse.down||r.touch.fire||(r.settings.fireMode==='auto'&&aimActive&&!!r.joy.right);const input={mx,my,aim:normAngle(aim),fire,reload:!!r.touch.reload,pickup:!!r.touch.pickup};r.touch.reload=false;r.touch.pickup=false;return input;
  }

  function beginGameLoop(){cancelAnimationFrame(r.raf);r.lastFrame=now();r.lastSnapshot=0;r.lastInputSend=0;r.frameCount=0;r.fpsAt=r.lastFrame;r.raf=requestAnimationFrame(frame);startPing();startPersistence();}
  function stopGameLoop(){cancelAnimationFrame(r.raf);r.raf=0;stopPing();stopPersistence();}
  function frame(ts){if(!r.open||r.state!=='game')return;const dt=Math.min(.04,Math.max(.001,(ts-r.lastFrame)/1000));r.lastFrame=ts;r.frameCount++;if(ts-r.fpsAt>1000){r.fps=Math.round(r.frameCount*1000/(ts-r.fpsAt));r.frameCount=0;r.fpsAt=ts;}
    const localInput=sampleLocalInput();if(r.role==='solo'||r.role==='host')authorityStep(dt,ts,localInput);else guestStep(dt,ts,localInput);updateCamera(dt);render();updateHud();r.raf=requestAnimationFrame(frame);
  }

  function authorityStep(dt,ts,localInput){
    if(!r.world||r.authorityPaused||r.orientationBlocked||(r.role==='host'&&r.remoteOrientationReady===false)||r.world.roundOver||Date.now()<r.match.startAt)return;const w=r.world,p0=w.players[0],p1=w.players[1];p0.input=localInput;if(r.role==='solo')p1.input=botInput(p1,p0,dt,ts);else if(r.lastGuestInput)p1.input={...p1.input,...r.lastGuestInput};
    stepPlayer(p0,dt,ts,w);stepPlayer(p1,dt,ts,w);separatePlayers(p0,p1,gameMap());stepProjectiles(dt,ts,w);stepPickups(ts,w);stepEffects(dt);checkRoundEnd(ts);w.seq++;
    if(r.role==='host'&&ts-r.lastSnapshot>=1000/SNAPSHOT_HZ){r.lastSnapshot=ts;sendSnapshot();}
  }
  function guestStep(dt,ts,input){
    if(!r.world||r.world.roundOver)return;
    const blocked=r.orientationBlocked||r.remoteOrientationReady===false;
    const sendInput=blocked?resetInput():input;
    if(ts-r.lastInputSend>=1000/INPUT_HZ){r.lastInputSend=ts;r.guestInputSeq++;r.guestSession?.send({t:'i',s:r.guestInputSeq,mx:+sendInput.mx.toFixed(3),my:+sendInput.my.toFixed(3),a:+sendInput.aim.toFixed(4),f:!!sendInput.fire,r:!!sendInput.reload,p:!!sendInput.pickup,o:r.orientationBlocked?0:1,tm:Date.now()});}
    if(blocked||Date.now()<r.match.startAt){r.touch.reload=false;r.touch.pickup=false;return;}
    const remote=r.world.players[0];if(remote&&!remote.netHidden&&remote._tx!=null){const k=1-Math.exp(-dt*22);remote.x=lerp(remote.x,remote._tx,k);remote.y=lerp(remote.y,remote._ty,k);remote.aim=normAngle(remote.aim+angleDelta(remote.aim,remote._ta||0)*k);}const auth=r.world.players[1];if(!r.predicted)r.predicted={x:auth.x,y:auth.y,aim:auth.aim};const temp={x:r.predicted.x,y:r.predicted.y,aim:input.aim};moveEntity(temp,input.mx*PLAYER_SPEED*dt,input.my*PLAYER_SPEED*dt,gameMap(),PLAYER_R);r.predicted.x=temp.x;r.predicted.y=temp.y;r.predicted.aim=input.aim;auth.aim=input.aim;
    if(input.fire&&canPredictFire(auth,ts)){r.predictedTracers.push({x:r.predicted.x,y:r.predicted.y,a:input.aim,until:ts+80,color:weapon(auth.weapon).color});sfx(shotSfxId(auth.weapon),0,.92);auth._predShot=ts;}
    r.touch.reload=false;r.touch.pickup=false;stepEffects(dt);
  }
  function canPredictFire(p,ts){const w=weapon(p.weapon);return p.alive&&!p.reloading&&p.mag>0&&ts-(p._predShot||-9999)>=w.fireMs;}

  function stepPlayer(p,dt,ts,w){if(!p.alive)return;const input=p.input||resetInput();p.aim=normAngle(input.aim==null?p.aim:input.aim);p.recoilKick=lerp(p.recoilKick||0,0,1-Math.exp(-dt*18));const activeWeapon=weapon(p.weapon);const speed=PLAYER_SPEED*(activeWeapon.moveScale||1)*(p.bot?(BOT[r.botDifficulty]?.speed||1):1);moveEntity(p,input.mx*speed*dt,input.my*speed*dt,gameMap(),PLAYER_R);p.vx=input.mx*speed;p.vy=input.my*speed;
    if(Math.hypot(p.vx,p.vy)>35&&ts-p.lastStep>380){p.lastStep=ts;const foot={x:p.x,y:p.y,at:ts,owner:p.index,radius:230};w.lastFootstep=foot;if(r.role==='host'){w.noiseEvents.push(foot);if(w.noiseEvents.length>24)w.noiseEvents.splice(0,w.noiseEvents.length-24);}const me=localPlayer();if(p.index!==localIndex()&&me&&dist(me.x,me.y,p.x,p.y)<foot.radius&&!isVisible(me,p,gameMap())){showSoundDirection(p.x,p.y);const pan=clamp((p.x-me.x)/360,-1,1);if(Math.random()<.7)sfx('step',pan,.3);}else if(p.index===localIndex()&&Math.random()<.28)sfx('step',0,.22);}
    if(p.reloading&&ts>=p.reloadEnd)finishReload(p);if(input.reload)beginReload(p,ts);if(input.pickup)tryPickup(p,ts,w);if(input.fire)tryFire(p,ts,w);
  }
  function moveEntity(p,dx,dy,map,radius){
    if(!map)return;p.x+=dx;for(const w of map.walls)if(w.solid&&circleRect(p.x,p.y,radius,w)){if(dx>0)p.x=w.x-radius;else if(dx<0)p.x=w.x+w.w+radius;else separateCircleRect(p,w,radius,'x');}
    p.y+=dy;for(const w of map.walls)if(w.solid&&circleRect(p.x,p.y,radius,w)){if(dy>0)p.y=w.y-radius;else if(dy<0)p.y=w.y+w.h+radius;else separateCircleRect(p,w,radius,'y');}
    p.x=clamp(p.x,radius,map.width-radius);p.y=clamp(p.y,radius,map.height-radius);
  }
  function separatePlayers(a,b,map){if(!a?.alive||!b?.alive)return;const dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy),min=PLAYER_R*2+4;if(d>=min)return;const nx=d>0.001?dx/d:1,ny=d>0.001?dy/d:0,push=(min-Math.max(d,.001))*.5;moveEntity(a,-nx*push,-ny*push,map,PLAYER_R);moveEntity(b,nx*push,ny*push,map,PLAYER_R);}
  function circleRect(x,y,radius,w){const nx=clamp(x,w.x,w.x+w.w),ny=clamp(y,w.y,w.y+w.h);return (x-nx)*(x-nx)+(y-ny)*(y-ny)<radius*radius;}
  function separateCircleRect(p,w,radius,axis){const nx=clamp(p.x,w.x,w.x+w.w),ny=clamp(p.y,w.y,w.y+w.h),dx=p.x-nx,dy=p.y-ny,d=Math.hypot(dx,dy)||.001,over=radius-d;if(over<=0)return;if(axis==='x')p.x+=dx/d*over;else p.y+=dy/d*over;}
  function beginReload(p,ts){const w=weapon(p.weapon);if(!p.alive||p.reloading||p.mag>=w.mag||p.reserve<=0)return;p.reloading=true;p.reloadEnd=ts+w.reloadMs;sfx('reload',p.index===localIndex()?0:.3,.75);}
  function finishReload(p){const w=weapon(p.weapon),need=w.mag-p.mag,take=Math.min(need,p.reserve);p.mag+=take;p.reserve-=take;p.reloading=false;p.reloadEnd=0;}
  function tryFire(p,ts,wld){
    const w=weapon(p.weapon);if(!p.alive||p.reloading)return;
    if(p.mag<=0){if(ts-(p.emptyAt||0)>350){p.emptyAt=ts;sfx('empty',p.index===localIndex()?0:.4,.9);}return;}
    if(ts-p.lastShot<w.fireMs)return;
    p.lastShot=ts;p.mag--;p.recoilKick=Math.min(10,(p.recoilKick||0)+w.recoil);p.muzzleUntil=ts+72;
    r.match.stats[p.index].shots++;
    const moving=Math.hypot(p.vx,p.vy)>70;const spread=w.spread+(moving?(w.moveSpread||0):0);
    for(let i=0;i<w.pellets;i++){
      const a=p.aim+(Math.random()-.5)*spread*2,spd=w.bulletSpeed*(.97+Math.random()*.06);
      wld.projectiles.push({id:++r.networkSeq,owner:p.index,x:p.x+Math.cos(a)*30,y:p.y+Math.sin(a)*30,px:p.x,py:p.y,vx:Math.cos(a)*spd,vy:Math.sin(a)*spd,travel:0,max:w.range,damage:w.damage,color:w.color,weapon:p.weapon,thickness:w.kind==='marksman'?3:w.kind==='heavy'?2.6:2});
    }
    if(wld.projectiles.length>220)wld.projectiles.splice(0,wld.projectiles.length-220);
    wld.lastLoud={x:p.x,y:p.y,at:ts,owner:p.index,radius:w.loud};
    if(r.role==='host'){wld.shotEvents.push({x:p.x,y:p.y,a:p.aim,owner:p.index,weapon:p.weapon,at:ts});if(wld.shotEvents.length>40)wld.shotEvents.splice(0,wld.shotEvents.length-40);}
    sfx(shotSfxId(p.weapon),p.index===localIndex()?0:(p.index?1:-1),1);
    spawnMuzzle(p,w);
    if(p.index===localIndex()&&!r.settings.reduced){r.camera.kick=Math.min(12,(r.camera.kick||0)+w.recoil*1.1);r.camera.shake=Math.min(7,(r.camera.shake||0)+(w.kind==='shotgun'||w.kind==='marksman'?3.5:w.kind==='heavy'?2.2:1.1));r.music?.duck?.(.42,95);}
  }

  function stepProjectiles(dt,ts,wld){const map=gameMap(),out=[];for(const b of wld.projectiles){const nx=b.x+b.vx*dt,ny=b.y+b.vy*dt;let wallT=1.01;for(const wall of map.walls){if(!wall.solid)continue;const t=segmentRectT(b.x,b.y,nx,ny,wall);if(t>=0&&t<wallT)wallT=t;}const target=wld.players[b.owner===0?1:0];let hitT=1.01;if(target?.alive)hitT=segmentCircleT(b.x,b.y,nx,ny,target.x,target.y,PLAYER_R);if(hitT>=0&&hitT<=1&&hitT<wallT){const hx=lerp(b.x,nx,hitT),hy=lerp(b.y,ny,hitT);applyDamage(target,b.damage,b.owner,ts,hx,hy,wld);spawnImpact(hx,hy,b.color,true);continue;}if(wallT>=0&&wallT<=1){const hx=lerp(b.x,nx,wallT),hy=lerp(b.y,ny,wallT);spawnImpact(hx,hy,b.color,false);if(Math.random()<.35)sfx('wall',0,.25);continue;}b.px=b.x;b.py=b.y;b.x=nx;b.y=ny;b.travel+=Math.hypot(b.vx*dt,b.vy*dt);if(b.travel<b.max)out.push(b);}wld.projectiles=out;}
  function segmentRectT(x1,y1,x2,y2,rct){const dx=x2-x1,dy=y2-y1;let t0=0,t1=1;const p=[-dx,dx,-dy,dy],q=[x1-rct.x,rct.x+rct.w-x1,y1-rct.y,rct.y+rct.h-y1];for(let i=0;i<4;i++){if(Math.abs(p[i])<1e-9){if(q[i]<0)return -1;}else{const rr=q[i]/p[i];if(p[i]<0){if(rr>t1)return -1;if(rr>t0)t0=rr;}else{if(rr<t0)return -1;if(rr<t1)t1=rr;}}}return t0;}
  function segmentCircleT(x1,y1,x2,y2,cx,cy,rad){const dx=x2-x1,dy=y2-y1,fx=x1-cx,fy=y1-cy,a=dx*dx+dy*dy,b=2*(fx*dx+fy*dy),c=fx*fx+fy*fy-rad*rad,disc=b*b-4*a*c;if(disc<0||a<1e-9)return -1;const s=Math.sqrt(disc),t1=(-b-s)/(2*a),t2=(-b+s)/(2*a);if(t1>=0&&t1<=1)return t1;if(t2>=0&&t2<=1)return t2;return -1;}
  function applyDamage(target,damage,owner,ts,x,y,wld){if(!target.alive)return;const amount=Math.min(target.hp,Math.max(0,damage));target.hp-=amount;target.lastDamaged=ts;r.match.stats[owner].hits++;r.match.stats[owner].damage+=amount;if(owner===localIndex())r.hitMarkerUntil=ts+115;const shooter=wld.players[owner];const dir=shooter?Math.atan2(shooter.y-target.y,shooter.x-target.x):0;if(r.role==='host'){wld.hitEvents.push({target:target.index,damage:amount,dir,at:ts});if(wld.hitEvents.length>32)wld.hitEvents.splice(0,wld.hitEvents.length-32);}sfx('hit',target.index===localIndex()?0:(target.index?1:-1),.55);if(target.index===localIndex())showDamageDirection(shooter);if(target.hp<=0){target.hp=0;target.alive=false;r.match.stats[owner].kills++;spawnElimination(target);}}
  function stepPickups(ts,wld){for(const p of wld.pickups)if(!p.active&&p.respawnAt&&ts>=p.respawnAt){p.active=true;p.respawnAt=0;}}
  function nearestPickup(player){let best=null,bd=1e9;for(const p of r.world?.pickups||[]){if(!p.active)continue;const d=dist(player.x,player.y,p.x,p.y);if(d<bd){bd=d;best=p;}}return best&&bd<=PICKUP_R?best:null;}
  function tryPickup(p,ts,wld){const pick=nearestPickup(p);if(!pick)return;const w=weapon(pick.weapon);p.weapon=pick.weapon;p.mag=w.mag;p.reserve=w.reserve;p.reloading=false;if(p.bot&&p.brain){p.brain.state='patrol';p.brain.pathTarget=null;p.brain.path=[];p.brain.patrol=null;}pick.active=false;pick.respawnAt=ts+15000;sfx('pickup',0,.9);showMessage('WEAPON ACQUIRED',w.name,`${w.className} · ${w.mag}-round magazine`,1050);}

  function checkRoundEnd(ts){if(r.world.roundOver)return;const a=r.world.players[0],b=r.world.players[1];if(a.alive&&b.alive)return;r.world.roundOver=true;const winner=a.alive?0:b.alive?1:-1;if(winner>=0)r.match.score[winner]++;if(r.role==='host')r.hostPeer?.session?.send({t:'roundEnd',winner,score:r.match.score,round:r.match.round});showRoundEnd(winner);setTimeout(()=>advanceRound(winner),2300);}
  function showRoundEnd(winner){const me=localIndex(),mine=winner===me;showMessage(winner<0?'DRAW':mine?'ROUND WON':'ROUND LOST',winner<0?'NO SURVIVOR':mine?'TACTICAL ADVANTAGE':'REGROUP',`${r.match.score[0]} — ${r.match.score[1]}`,1800);sfx(mine?'win':'lose');}
  function advanceRound(){if(!r.match)return;const max=Math.max(...r.match.score);if(max>=r.match.winsTo){finishMatch();return;}r.match.round++;r.match.startAt=Date.now()+2600;if(r.role==='solo'){prepareAuthorityRound();showCountdown(r.match.startAt,`ROUND ${r.match.round}`);return;}if(r.role==='host'){prepareAuthorityRound();const payload=matchStartPayload();r.hostPeer?.session?.send({t:'nextRound',...payload});showCountdown(r.match.startAt,`ROUND ${r.match.round}`);}}
  function finishMatch(reason=''){if(!r.match)return;stopGameLoop();const me=localIndex(),winner=r.match.score[0]===r.match.score[1]?-1:(r.match.score[0]>r.match.score[1]?0:1);const mine=winner===me;const stats=r.match.stats[me]||newStats();const acc=stats.shots?Math.round(stats.hits/stats.shots*100):0;$('[data-result-kicker]',r.overlay).textContent=reason?'CONNECTION RESULT':'MATCH COMPLETE';$('[data-result-title]',r.overlay).textContent=winner<0?'DRAW':mine?'YOU WIN':'OPPONENT WINS';$('[data-result-sub]',r.overlay).textContent=reason||`${M().get(r.match.mapId).name} · ${r.match.bestOf===1?'Single Round':`Best of ${r.match.bestOf}`}`;$('[data-result-score]',r.overlay).textContent=`${r.match.score[me]} — ${r.match.score[me?0:1]}`;$('[data-result-damage]',r.overlay).textContent=Math.round(stats.damage);$('[data-result-accuracy]',r.overlay).textContent=`${acc}%`;$('[data-result]',r.overlay).hidden=false;$('[data-rematch-status]',r.overlay).textContent=r.role==='solo'?'Play the same setup again or change the map.':'Both players must agree to rematch.';if(r.role==='host')r.hostPeer?.session?.send({t:'matchEnd',score:r.match.score,stats:r.match.stats,reason});clearPersistentIfFinished();sfx(mine?'win':'lose');}

  function botInput(bot,player,dt,ts){const cfg=BOT[r.botDifficulty]||BOT.normal,brain=bot.brain,map=gameMap(),visible=isVisible(bot,player,map);if(visible){brain.lastSeen={x:player.x,y:player.y};if(!brain.seenAt)brain.seenAt=ts;if(ts-brain.seenAt>=cfg.reaction* (0.85+Math.random()*.3))brain.state='engage';}else{brain.seenAt=0;if(brain.state==='engage'){brain.state='search';brain.searchUntil=ts+2600;}}
    if(r.world.lastLoud&&r.world.lastLoud.owner===0&&ts-r.world.lastLoud.at<1800&&dist(bot.x,bot.y,r.world.lastLoud.x,r.world.lastLoud.y)<r.world.lastLoud.radius){brain.lastHeard={x:r.world.lastLoud.x,y:r.world.lastLoud.y};if(!visible&&brain.state!=='engage'){brain.state='investigate';brain.pathTarget=brain.lastHeard;}}
    if(bot.reloading||bot.hp<30&&Math.random()<cfg.cover){const cover=findCoverPoint(bot,player,map);if(cover){brain.state='cover';brain.pathTarget=cover;}}
    const wp=weapon(bot.weapon);let reload=false;if(bot.mag<=Math.max(1,Math.floor(wp.mag*.22))&&!bot.reloading){reload=true;if(Math.random()<cfg.cover){const cover=findCoverPoint(bot,player,map);if(cover){brain.state='cover';brain.pathTarget=cover;}}}
    let aim=bot.aim,fire=false,mx=0,my=0;const d=dist(bot.x,bot.y,player.x,player.y);if(brain.state==='engage'&&visible){if(ts-brain.errorAt>320){brain.error=(Math.random()-.5)*2*cfg.aim;brain.errorAt=ts;}aim=Math.atan2(player.y-bot.y,player.x-bot.x)+brain.error;fire=Math.random()<cfg.burst;const ideal=wp.ideal||460;const dx=player.x-bot.x,dy=player.y-bot.y,dl=Math.hypot(dx,dy)||1;let forward=d>ideal+80?1:d<ideal-90?-1:0;const strafe=Math.random()<cfg.strafe?brain.strafeDir:0;if(Math.random()<.01)brain.strafeDir*=-1;mx=(dx/dl)*forward+(-dy/dl)*strafe*.72;my=(dy/dl)*forward+(dx/dl)*strafe*.72;const ml=Math.hypot(mx,my)||1;if(ml>1){mx/=ml;my/=ml;}}
    else{let target=brain.pathTarget;if(brain.state==='search'){target=brain.lastSeen;if(ts>(brain.searchUntil||0)){brain.state='patrol';brain.lastSeen=null;target=null;}}if(brain.state==='investigate'&&target&&dist(bot.x,bot.y,target.x,target.y)<70){brain.state='search';brain.searchUntil=ts+1800;brain.lastSeen=target;}if(brain.state==='cover'&&target&&dist(bot.x,bot.y,target.x,target.y)<60){if(!bot.reloading&&bot.hp>25)brain.state='search';}
      if(!target||brain.state==='patrol'){if(!brain.patrol||dist(bot.x,bot.y,brain.patrol.x,brain.patrol.y)<80){brain.patrol=randomWalkPoint(map);}target=brain.patrol;}
      const mv=pathMove(bot,target,ts,cfg.repath,map);mx=mv.x;my=mv.y;if(target)aim=Math.atan2(target.y-bot.y,target.x-bot.x);
    }
    if(!visible&&fire)fire=false;const near=nearestPickup(bot);let pickup=!!near;if(!near&&bot.weapon==='pistol'){const candidate=(r.world.pickups||[]).filter(p=>p.active).sort((a,b)=>dist(bot.x,bot.y,a.x,a.y)-dist(bot.x,bot.y,b.x,b.y))[0];if(candidate&&dist(bot.x,bot.y,candidate.x,candidate.y)<420&&brain.state!=='engage'){brain.pathTarget={x:candidate.x,y:candidate.y};brain.state='pickup';const mv=pathMove(bot,brain.pathTarget,ts,cfg.repath,map);mx=mv.x;my=mv.y;}}
    const foot=r.world.lastFootstep;if(foot&&foot.owner===0&&ts-foot.at<1100&&dist(bot.x,bot.y,foot.x,foot.y)<foot.radius&&!visible){brain.lastHeard={x:foot.x,y:foot.y};if(brain.state!=='engage'&&brain.state!=='cover'){brain.state='investigate';brain.pathTarget=brain.lastHeard;}}return{mx,my,aim,fire,reload,pickup};}

  function buildNav(map){if(r.navCache.has(map.id))return r.navCache.get(map.id);const cols=Math.ceil(map.width/NAV_CELL),rows=Math.ceil(map.height/NAV_CELL),walk=new Uint8Array(cols*rows);for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){const px=(x+.5)*NAV_CELL,py=(y+.5)*NAV_CELL;let ok=px>PLAYER_R&&py>PLAYER_R&&px<map.width-PLAYER_R&&py<map.height-PLAYER_R;for(const w of map.walls)if(ok&&w.solid&&circleRect(px,py,PLAYER_R+5,w)){ok=false;break;}walk[y*cols+x]=ok?1:0;}const nav={cols,rows,walk,map};r.navCache.set(map.id,nav);return nav;}
  function gridNode(nav,x,y){const gx=clamp(Math.floor(x/NAV_CELL),0,nav.cols-1),gy=clamp(Math.floor(y/NAV_CELL),0,nav.rows-1);return{gx,gy,key:gy*nav.cols+gx};}
  function nearestWalk(nav,node){if(nav.walk[node.key])return node;for(let rr=1;rr<5;rr++)for(let dy=-rr;dy<=rr;dy++)for(let dx=-rr;dx<=rr;dx++){const x=node.gx+dx,y=node.gy+dy;if(x<0||y<0||x>=nav.cols||y>=nav.rows)continue;const k=y*nav.cols+x;if(nav.walk[k])return{gx:x,gy:y,key:k};}return node;}
  function findPath(map,sx,sy,tx,ty){const nav=buildNav(map),start=nearestWalk(nav,gridNode(nav,sx,sy)),goal=nearestWalk(nav,gridNode(nav,tx,ty));if(start.key===goal.key)return[{x:tx,y:ty}];const open=[{...start,g:0,f:0}],came=new Int32Array(nav.cols*nav.rows);came.fill(-1);const g=new Float32Array(nav.cols*nav.rows);g.fill(1e9);g[start.key]=0;const dirs=[[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]];let guard=0;while(open.length&&guard++<2200){open.sort((a,b)=>a.f-b.f);const cur=open.shift();if(cur.key===goal.key){const pts=[];let k=cur.key;while(k!==start.key&&k>=0){const x=k%nav.cols,y=Math.floor(k/nav.cols);pts.push({x:(x+.5)*NAV_CELL,y:(y+.5)*NAV_CELL});k=came[k];}pts.reverse();pts.push({x:tx,y:ty});return pts;}for(const [dx,dy] of dirs){const nx=cur.gx+dx,ny=cur.gy+dy;if(nx<0||ny<0||nx>=nav.cols||ny>=nav.rows)continue;const nk=ny*nav.cols+nx;if(!nav.walk[nk])continue;if(dx&&dy){const k1=cur.gy*nav.cols+nx,k2=ny*nav.cols+cur.gx;if(!nav.walk[k1]||!nav.walk[k2])continue;}const ng=cur.g+(dx&&dy?1.414:1);if(ng>=g[nk])continue;g[nk]=ng;came[nk]=cur.key;const h=Math.hypot(goal.gx-nx,goal.gy-ny);open.push({gx:nx,gy:ny,key:nk,g:ng,f:ng+h});}}
    return[{x:tx,y:ty}];}
  function pathMove(bot,target,ts,repath,map){const b=bot.brain;if(!target)return{x:0,y:0};if(!b.path.length||ts-b.pathAt>repath||!b.pathTarget||dist(b.pathTarget.x,b.pathTarget.y,target.x,target.y)>100){b.path=findPath(map,bot.x,bot.y,target.x,target.y);b.pathAt=ts;b.pathTarget={x:target.x,y:target.y};}while(b.path.length&&dist(bot.x,bot.y,b.path[0].x,b.path[0].y)<40)b.path.shift();const pt=b.path[0]||target,dx=pt.x-bot.x,dy=pt.y-bot.y,dl=Math.hypot(dx,dy)||1;return{x:dx/dl,y:dy/dl};}
  function randomWalkPoint(map){for(let i=0;i<60;i++){const x=80+Math.random()*(map.width-160),y=80+Math.random()*(map.height-160);if(!map.walls.some(w=>w.solid&&circleRect(x,y,PLAYER_R+12,w)))return{x,y};}return{x:map.width/2,y:map.height/2};}
  function findCoverPoint(bot,enemy,map){const nav=buildNav(map),cands=[];for(let i=0;i<80;i++){const k=Math.floor(Math.random()*nav.walk.length);if(!nav.walk[k])continue;const x=(k%nav.cols+.5)*NAV_CELL,y=(Math.floor(k/nav.cols)+.5)*NAV_CELL,d=dist(bot.x,bot.y,x,y);if(d>80&&d<430&&!hasLOS(enemy.x,enemy.y,x,y,map))cands.push({x,y,score:d+dist(enemy.x,enemy.y,x,y)*.15});}cands.sort((a,b)=>a.score-b.score);return cands[0]||null;}

  function rayRectDistance(ox,oy,dx,dy,rect,max){const invx=Math.abs(dx)<1e-9?1e12:1/dx,invy=Math.abs(dy)<1e-9?1e12:1/dy;let t1=(rect.x-ox)*invx,t2=(rect.x+rect.w-ox)*invx,t3=(rect.y-oy)*invy,t4=(rect.y+rect.h-oy)*invy;let tmin=Math.max(Math.min(t1,t2),Math.min(t3,t4)),tmax=Math.min(Math.max(t1,t2),Math.max(t3,t4));if(tmax<0||tmin>tmax||tmin<0)return max;return Math.min(max,tmin);}
  function rayDistance(ox,oy,a,max,map){const dx=Math.cos(a),dy=Math.sin(a);let d=max;for(const w of map.walls)if(w.vision)d=Math.min(d,rayRectDistance(ox,oy,dx,dy,w,max));return d;}
  function hasLOS(ax,ay,bx,by,map){const dx=bx-ax,dy=by-ay,max=Math.hypot(dx,dy);if(max<1)return true;const a=Math.atan2(dy,dx);return rayDistance(ax,ay,a,max,map)>=max-3;}
  function isVisible(viewer,target,map){if(!viewer||!target||!target.alive)return false;const d=dist(viewer.x,viewer.y,target.x,target.y);if(d<=AWARE_RANGE)return hasLOS(viewer.x,viewer.y,target.x,target.y,map);if(d>VISION_RANGE)return false;const a=Math.atan2(target.y-viewer.y,target.x-viewer.x);if(Math.abs(angleDelta(viewer.aim,a))>VISION_HALF)return false;return hasLOS(viewer.x,viewer.y,target.x,target.y,map);}
  function visibilityPolygon(p,map,range,half,full=false,steps=full?50:72){const pts=[{x:p.x,y:p.y}];if(full)pts.length=0;const start=full?-Math.PI:p.aim-half,end=full?Math.PI:p.aim+half;for(let i=0;i<=steps;i++){const a=start+(end-start)*(i/steps),d=rayDistance(p.x,p.y,a,range,map);pts.push({x:p.x+Math.cos(a)*d,y:p.y+Math.sin(a)*d});}return pts;}

  function updateCamera(dt){
    const p=localPlayer();if(!p)return;const size=canvasSize(),map=gameMap(),px=r.role==='guest'&&r.predicted?r.predicted.x:p.x,py=r.role==='guest'&&r.predicted?r.predicted.y:p.y,aim=r.role==='guest'&&r.predicted?r.predicted.aim:p.aim;
    const look=Math.min(118,Math.min(size.w,size.h)*.135),kick=r.camera.kick||0;
    const tx=px+Math.cos(aim)*(look-kick),ty=py+Math.sin(aim)*(look-kick),halfW=size.w/2,halfH=size.h/2;
    const k=1-Math.exp(-dt*10);r.camera.x=lerp(r.camera.x||tx,clamp(tx,halfW,map.width-halfW),k);r.camera.y=lerp(r.camera.y||ty,clamp(ty,halfH,map.height-halfH),k);
    r.camera.kick=lerp(r.camera.kick||0,0,1-Math.exp(-dt*20));r.camera.shake=lerp(r.camera.shake||0,0,1-Math.exp(-dt*17));
    if(!r.settings.reduced&&(r.camera.shake||0)>.1){r.camera.x+=(Math.random()-.5)*r.camera.shake;r.camera.y+=(Math.random()-.5)*r.camera.shake;}
    if(map.width<size.w)r.camera.x=map.width/2;if(map.height<size.h)r.camera.y=map.height/2;
  }

  function worldToScreen(x,y){const s=canvasSize();return{x:x-r.camera.x+s.w/2,y:y-r.camera.y+s.h/2};}

  function render(){
    const c=r.ctx;if(!c||!r.world)return;const size=canvasSize(),dpr=r.dpr;c.setTransform(dpr,0,0,dpr,0,0);c.clearRect(0,0,size.w,size.h);const map=gameMap();
    drawMap(c,size,map);drawPickups(c,map);drawFog(c,size,map);drawProjectiles(c,map);drawPlayers(c,map);drawParticles(c);drawPredictedTracers(c);drawCombatOverlay(c,size);if(DEBUG)drawDebug();
  }
  function drawMap(c,size,map){
    const left=r.camera.x-size.w/2,top=r.camera.y-size.h/2;
    const bg=c.createLinearGradient(0,0,size.w,size.h);bg.addColorStop(0,map.floor);bg.addColorStop(1,'#030910');c.fillStyle=bg;c.fillRect(0,0,size.w,size.h);
    c.save();c.translate(-left,-top);
    c.strokeStyle=map.grid;c.lineWidth=1;const step=80;
    for(let x=Math.floor(left/step)*step;x<left+size.w+step;x+=step){c.beginPath();c.moveTo(x,Math.max(0,top));c.lineTo(x,Math.min(map.height,top+size.h));c.stroke();}
    for(let y=Math.floor(top/step)*step;y<top+size.h+step;y+=step){c.beginPath();c.moveTo(Math.max(0,left),y);c.lineTo(Math.min(map.width,left+size.w),y);c.stroke();}
    const pulse=(Math.sin(now()/700)+1)*.5;
    for(const d of map.decor||[])drawDecor(c,d,map,pulse);
    for(const w of map.walls){
      const kind=w.kind||'wall';let fill=kind==='container'?'#182630':kind==='crate'?'#273038':kind==='server'?'#0c2534':kind==='reactor'?'#251739':kind==='pillar'?'#17243a':kind==='rail'?'#263a45':kind==='vault'?'#101d2c':'#12222f';
      c.save();c.shadowColor='rgba(0,0,0,.46)';c.shadowBlur=9;c.shadowOffsetY=5;c.fillStyle=fill;c.fillRect(w.x,w.y,w.w,w.h);c.shadowBlur=0;c.shadowOffsetY=0;
      c.strokeStyle=w.vision?`${map.accent}66`:'rgba(180,210,225,.24)';c.lineWidth=2;c.strokeRect(w.x+.5,w.y+.5,w.w-1,w.h-1);
      c.fillStyle='rgba(255,255,255,.055)';c.fillRect(w.x+3,w.y+3,Math.max(0,w.w-6),4);
      if(kind==='server'||kind==='vault'){c.fillStyle='rgba(66,220,255,.16)';for(let yy=w.y+15;yy<w.y+w.h-8;yy+=24)c.fillRect(w.x+8,yy,Math.max(2,w.w-16),2);}
      if(kind==='crate'||kind==='container'){c.strokeStyle='rgba(255,255,255,.06)';c.lineWidth=1;c.beginPath();c.moveTo(w.x+5,w.y+5);c.lineTo(w.x+w.w-5,w.y+w.h-5);c.moveTo(w.x+w.w-5,w.y+5);c.lineTo(w.x+5,w.y+w.h-5);c.stroke();}
      c.restore();
    }
    c.restore();
    const vg=c.createRadialGradient(size.w/2,size.h/2,Math.min(size.w,size.h)*.18,size.w/2,size.h/2,Math.max(size.w,size.h)*.72);vg.addColorStop(0,'rgba(0,0,0,0)');vg.addColorStop(1,'rgba(0,0,0,.23)');c.fillStyle=vg;c.fillRect(0,0,size.w,size.h);
  }
  function drawDecor(c,d,map,pulse){
    const kind=d.kind||'decor';
    if(kind==='reactor-glow'){const g=c.createRadialGradient(d.x+d.w/2,d.y+d.h/2,10,d.x+d.w/2,d.y+d.h/2,Math.max(d.w,d.h)*.65);g.addColorStop(0,`${map.accent}55`);g.addColorStop(1,'rgba(0,0,0,0)');c.fillStyle=g;c.fillRect(d.x-40,d.y-40,d.w+80,d.h+80);return;}
    if(kind==='lamp'||kind==='neon'){c.save();c.shadowColor=map.accent;c.shadowBlur=18+8*pulse;c.fillStyle=`${map.accent}55`;c.fillRect(d.x,d.y,d.w,d.h);c.restore();return;}
    c.fillStyle='rgba(100,170,205,.055)';c.fillRect(d.x,d.y,d.w,d.h);
    if(kind==='server'||kind==='lab'){c.fillStyle=`${map.accent}55`;for(let x=d.x+10;x<d.x+d.w-6;x+=24){c.fillRect(x,d.y+10,4,3);c.fillStyle=(((x-d.x)/24|0)+kind.length)%2?'rgba(115,255,205,.45)':`${map.accent}55`;}}
    if(kind==='stripe'||kind==='hazard'){c.save();c.strokeStyle=`${map.danger||map.accent}44`;c.lineWidth=5;for(let x=d.x-d.h;x<d.x+d.w;x+=24){c.beginPath();c.moveTo(x,d.y+d.h);c.lineTo(x+d.h,d.y);c.stroke();}c.restore();}
  }
  function drawWeaponGlyph(c,w,scale=1){
    c.save();c.scale(scale,scale);c.strokeStyle=w.color;c.fillStyle=w.color;c.lineCap='round';c.lineJoin='round';
    const kind=w.kind||'rifle';
    if(kind==='sidearm'){c.lineWidth=5;c.beginPath();c.moveTo(-11,-2);c.lineTo(9,-2);c.lineTo(9,3);c.lineTo(-4,3);c.lineTo(-1,10);c.stroke();}
    else if(kind==='shotgun'){c.lineWidth=5;c.beginPath();c.moveTo(-13,0);c.lineTo(16,0);c.stroke();c.lineWidth=3;c.beginPath();c.moveTo(-3,0);c.lineTo(-8,8);c.stroke();}
    else if(kind==='marksman'){c.lineWidth=4;c.beginPath();c.moveTo(-15,0);c.lineTo(17,0);c.moveTo(-4,0);c.lineTo(-8,8);c.stroke();c.strokeRect(0,-5,7,4);}
    else if(kind==='heavy'){c.lineWidth=6;c.beginPath();c.moveTo(-14,0);c.lineTo(15,0);c.stroke();c.lineWidth=3;c.beginPath();c.moveTo(-2,0);c.lineTo(-8,8);c.stroke();c.fillRect(-3,3,9,6);}
    else {c.lineWidth=5;c.beginPath();c.moveTo(-13,0);c.lineTo(14,0);c.stroke();c.lineWidth=3;c.beginPath();c.moveTo(-2,0);c.lineTo(-7,8);c.stroke();}
    c.restore();
  }
  function drawPickups(c,map){
    const t=now();for(const p of r.world.pickups||[]){if(!p.active)continue;const s=worldToScreen(p.x,p.y);if(s.x<-55||s.y<-55||s.x>canvasSize().w+55||s.y>canvasSize().h+55)continue;const w=weapon(p.weapon),pulse=.88+Math.sin(t/240+p.id)*.08;
      c.save();c.translate(s.x,s.y);c.scale(pulse,pulse);c.fillStyle='rgba(3,11,18,.86)';c.strokeStyle=w.color;c.lineWidth=2;c.shadowColor=w.color;c.shadowBlur=18;c.beginPath();c.arc(0,0,21,0,Math.PI*2);c.fill();c.stroke();c.shadowBlur=0;drawWeaponGlyph(c,w,.72);c.fillStyle=w.color;c.font='900 8px system-ui';c.textAlign='center';c.fillText(w.name,0,35);c.restore();}
  }
  function drawFog(c,size,map){const p=localPlayer();if(!p||!r.fogCtx||!r.fogCanvas)return;const px=r.role==='guest'&&r.predicted?r.predicted.x:p.x,py=r.role==='guest'&&r.predicted?r.predicted.y:p.y,pa=r.role==='guest'&&r.predicted?r.predicted.aim:p.aim,temp={x:px,y:py,aim:pa};const left=r.camera.x-size.w/2,top=r.camera.y-size.h/2,cone=visibilityPolygon(temp,map,VISION_RANGE,VISION_HALF,false,82),aware=visibilityPolygon(temp,map,AWARE_RANGE,Math.PI,true,54),f=r.fogCtx;f.setTransform(r.dpr,0,0,r.dpr,0,0);f.clearRect(0,0,size.w,size.h);f.fillStyle='rgba(0,3,8,.72)';f.fillRect(0,0,size.w,size.h);f.globalCompositeOperation='destination-out';f.globalAlpha=.97;f.beginPath();cone.forEach((pt,i)=>{const x=pt.x-left,y=pt.y-top;i?f.lineTo(x,y):f.moveTo(x,y);});f.closePath();f.fillStyle='#000';f.fill();f.globalAlpha=.93;f.beginPath();aware.forEach((pt,i)=>{const x=pt.x-left,y=pt.y-top;i?f.lineTo(x,y):f.moveTo(x,y);});f.closePath();f.fill();f.globalCompositeOperation='source-over';f.globalAlpha=1;c.save();c.setTransform(1,0,0,1,0,0);c.drawImage(r.fogCanvas,0,0);c.restore();}
  function drawProjectiles(c,map){for(const b of r.world.projectiles||[]){if(b.owner!==localIndex()&&!pointVisibleToLocal(b.x,b.y,map))continue;const a=worldToScreen(b.px??b.x,b.py??b.y),z=worldToScreen(b.x,b.y);c.save();c.shadowColor=b.color||'#fff';c.shadowBlur=7;c.strokeStyle=b.color||'#fff';c.lineWidth=b.thickness||2;c.globalAlpha=.96;c.beginPath();c.moveTo(a.x,a.y);c.lineTo(z.x,z.y);c.stroke();c.restore();}}
  function pointVisibleToLocal(x,y,map){const p=localPlayer();if(!p)return false;const temp=r.role==='guest'&&r.predicted?{...p,x:r.predicted.x,y:r.predicted.y,aim:r.predicted.aim}:p;const target={x,y,alive:true};return isVisible(temp,target,map);}
  function drawPlayers(c,map){const li=localIndex();for(const p of r.world.players){if(!p.alive)continue;let x=p.x,y=p.y,a=p.aim;if(r.role==='guest'&&p.index===1&&r.predicted){x=r.predicted.x;y=r.predicted.y;a=r.predicted.aim;}if(p.index!==li){if(r.role==='guest'){if(p.netHidden)continue;}else if(!isVisible(r.world.players[li],p,map))continue;}const s=worldToScreen(x,y);drawAgent(c,s.x,s.y,a,p,p.index===li?'#52e7ff':'#ff5f7f',p.index===li);if(p.index!==li){c.fillStyle='rgba(2,8,14,.78)';roundRectPath(c,s.x-39,s.y-47,78,9,4);c.fill();c.fillStyle='#fb7185';roundRectPath(c,s.x-38,s.y-46,76*(p.hp/100),7,3);c.fill();c.fillStyle='#e8f4ff';c.font='900 9px system-ui';c.textAlign='center';c.fillText(p.name||'OPPONENT',s.x,s.y-54);}}}
  function roundRectPath(c,x,y,w,h,radius){const rr=Math.min(radius,w/2,h/2);c.beginPath();c.moveTo(x+rr,y);c.arcTo(x+w,y,x+w,y+h,rr);c.arcTo(x+w,y+h,x,y+h,rr);c.arcTo(x,y+h,x,y,rr);c.arcTo(x,y,x+w,y,rr);c.closePath();}
  function drawAgent(c,x,y,a,p,color,local){
    const speed=Math.hypot(p.vx||0,p.vy||0),walk=speed>35?Math.sin(now()/95+p.index)*2.4:0,kick=p.recoilKick||0,w=weapon(p.weapon),hit=now()-Number(p.lastDamaged||0)<120;
    c.save();c.translate(x,y);c.rotate(a);c.shadowColor=color;c.shadowBlur=local?13:8;
    c.strokeStyle='rgba(160,205,225,.28)';c.lineWidth=5;c.lineCap='round';c.beginPath();c.moveTo(-10,-7+walk);c.lineTo(-20,-13+walk);c.moveTo(-10,7-walk);c.lineTo(-20,13-walk);c.stroke();
    c.fillStyle=hit?'#243648':'#0b1a25';c.strokeStyle=color;c.lineWidth=2.2;c.beginPath();c.arc(0,0,PLAYER_R,0,Math.PI*2);c.fill();c.stroke();c.shadowBlur=0;
    c.fillStyle=color;c.globalAlpha=.34;c.beginPath();c.moveTo(-7,-15);c.lineTo(10,-11);c.lineTo(16,0);c.lineTo(10,11);c.lineTo(-7,15);c.closePath();c.fill();c.globalAlpha=1;
    c.fillStyle='#bdefff';c.beginPath();c.roundRect?c.roundRect(2,-7,10,14,4):c.rect(2,-7,10,14);c.fill();
    c.save();c.translate(18-kick*.8,0);drawWeaponGlyph(c,w,1);c.restore();
    if(now()<Number(p.muzzleUntil||0)){c.save();c.translate(34-kick*.8,0);c.fillStyle='#fff7bf';c.shadowColor=w.color;c.shadowBlur=20;c.beginPath();c.moveTo(0,0);c.lineTo(13,-6);c.lineTo(9,0);c.lineTo(13,6);c.closePath();c.fill();c.restore();}
    c.restore();
  }
  function drawParticles(c){const t=now();r.particles=r.particles.filter(p=>t<p.until);for(const p of r.particles){const age=1-(p.until-t)/p.life,s=worldToScreen(p.x+p.vx*age,p.y+p.vy*age),alpha=Math.max(0,1-age);c.save();c.globalAlpha=alpha;c.fillStyle=p.color;c.strokeStyle=p.color;if(p.kind==='ring'){c.lineWidth=2;c.beginPath();c.arc(s.x,s.y,(p.size||4)*(1+age*2.4),0,Math.PI*2);c.stroke();}else if(p.kind==='spark'){c.lineWidth=1.5;c.beginPath();c.moveTo(s.x,s.y);c.lineTo(s.x+(p.vx||0)*.12,s.y+(p.vy||0)*.12);c.stroke();}else{c.translate(s.x,s.y);c.rotate((p.rot||0)+age*5);c.fillRect(-(p.size||2)/2,-(p.size||2)/2,p.size||2,p.kind==='casing'?Math.max(1,(p.size||2)*.45):(p.size||2));}c.restore();}}
  function drawPredictedTracers(c){const t=now();r.predictedTracers=r.predictedTracers.filter(x=>t<x.until);for(const x of r.predictedTracers){const a=worldToScreen(x.x,x.y),b=worldToScreen(x.x+Math.cos(x.a)*110,x.y+Math.sin(x.a)*110);c.save();c.globalAlpha=.55;c.shadowColor=x.color;c.shadowBlur=7;c.strokeStyle=x.color;c.lineWidth=2;c.beginPath();c.moveTo(a.x,a.y);c.lineTo(b.x,b.y);c.stroke();c.restore();}}
  function drawCombatOverlay(c,size){const t=now();if(t<r.hitMarkerUntil){c.save();c.translate(size.w/2,size.h/2);c.strokeStyle='#eafff7';c.lineWidth=2;c.globalAlpha=.9;const d=8;c.beginPath();c.moveTo(-d-5,-d-5);c.lineTo(-d,-d);c.moveTo(d+5,-d-5);c.lineTo(d,-d);c.moveTo(-d-5,d+5);c.lineTo(-d,d);c.moveTo(d+5,d+5);c.lineTo(d,d);c.stroke();c.restore();}}
  function spawnMuzzle(p,w){
    const muzzleX=p.x+Math.cos(p.aim)*34,muzzleY=p.y+Math.sin(p.aim)*34,count=r.settings.reduced?3:(w.kind==='shotgun'?10:w.kind==='heavy'?7:5);
    for(let i=0;i<count;i++){const a=p.aim+(Math.random()-.5)*.7,spd=10+Math.random()*45;r.particles.push({x:muzzleX,y:muzzleY,vx:Math.cos(a)*spd,vy:Math.sin(a)*spd,size:2+Math.random()*3,color:i%2?'#fff4b5':w.color,kind:i%3===0?'spark':'pixel',rot:a,life:120+Math.random()*80,until:now()+160});}
    if(!r.settings.reduced)r.particles.push({x:muzzleX,y:muzzleY,vx:0,vy:0,size:7,color:w.color,kind:'ring',life:120,until:now()+120});
    const side=p.aim-Math.PI/2;r.particles.push({x:p.x+Math.cos(p.aim)*13,y:p.y+Math.sin(p.aim)*13,vx:Math.cos(side)*(18+Math.random()*20),vy:Math.sin(side)*(18+Math.random()*20),size:3,color:'#c9a96a',kind:'casing',rot:p.aim,life:420,until:now()+420});
  }
  function spawnImpact(x,y,color,hit){const n=r.settings.reduced?3:hit?10:7;for(let i=0;i<n;i++){const a=Math.random()*Math.PI*2,spd=16+Math.random()*50;r.particles.push({x,y,vx:Math.cos(a)*spd,vy:Math.sin(a)*spd,size:1.5+Math.random()*2.5,color:hit?'#8effd5':color,kind:i%2?'spark':'pixel',rot:a,life:220+Math.random()*140,until:now()+300});}if(!r.settings.reduced)r.particles.push({x,y,vx:0,vy:0,size:5,color:hit?'#8effd5':color,kind:'ring',life:180,until:now()+180});}
  function spawnElimination(p){for(let i=0;i<(r.settings.reduced?14:34);i++){const a=Math.random()*Math.PI*2,spd=20+Math.random()*70;r.particles.push({x:p.x,y:p.y,vx:Math.cos(a)*spd,vy:Math.sin(a)*spd,size:2+Math.random()*5,color:i%2?'#67e8f9':'#fb7185',kind:i%4===0?'spark':'pixel',rot:a,life:650+Math.random()*180,until:now()+740});}if(!r.settings.reduced){for(let j=0;j<3;j++)r.particles.push({x:p.x,y:p.y,vx:0,vy:0,size:10+j*8,color:j%2?'#fb7185':'#67e8f9',kind:'ring',life:520+j*120,until:now()+520+j*120});}}
  function stepEffects(){/* visual FX are time-based during render */}


  function updateHud(){const p=localPlayer();if(!p)return;const w=weapon(p.weapon);$('[data-game-wrap]',r.overlay)?.classList.toggle('low-health',p.hp>0&&p.hp<30);$('[data-hp]',r.overlay).textContent=Math.round(p.hp);const hb=$('[data-hp-bar]',r.overlay);hb.style.width=`${clamp(p.hp,0,100)}%`;hb.style.background=p.hp<30?'linear-gradient(90deg,#fb7185,#ff8fa5)':'linear-gradient(90deg,#2ee6bb,#7df1d2)';$('[data-weapon]',r.overlay).textContent=w.name;$('[data-ammo]',r.overlay).textContent=p.mag;$('[data-reserve]',r.overlay).textContent=p.reserve;$('[data-round-label]',r.overlay).textContent=`ROUND ${r.match?.round||1}`;$('[data-score]',r.overlay).textContent=`${r.match?.score?.[localIndex()]||0} — ${r.match?.score?.[localIndex()?0:1]||0}`;const elapsed=Math.max(0,(Date.now()-(r.world.startedAt||Date.now()))/1000),mm=String(Math.floor(elapsed/60)).padStart(2,'0'),ss=String(Math.floor(elapsed%60)).padStart(2,'0');$('[data-timer]',r.overlay).textContent=`${mm}:${ss}`;
    if(r.role==='solo'){$('[data-ping]',r.overlay).textContent='SOLO';$('[data-net-status]',r.overlay).textContent=`${BOT[r.botDifficulty]?.label||'NORMAL'} BOT`;}else{$('[data-ping]',r.overlay).textContent=r.pingMs?`PING ${Math.round(r.pingMs)}ms`:'LINKING…';$('[data-net-status]',r.overlay).textContent=r.pingMs>220?'UNSTABLE CONNECTION':'WEBRTC DIRECT';$('[data-net-box]',r.overlay).classList.toggle('unstable',r.pingMs>220);}
    const re=$('[data-reload]',r.overlay);if(p.reloading){const pct=clamp(1-(p.reloadEnd-now())/w.reloadMs,0,1);re.classList.add('show');$('[data-reload-pct]',r.overlay).textContent=`${Math.round(pct*100)}%`;$('[data-reload-bar]',r.overlay).style.width=`${pct*100}%`;}else re.classList.remove('show');const pick=nearestPickup(p),pe=$('[data-pickup-prompt]',r.overlay);if(pick){pe.textContent=`${matchMedia('(pointer:fine)').matches?'E · ':'PICK UP · '}${weapon(pick.weapon).name}`;pe.classList.add('show');}else pe.classList.remove('show');}
  function showMessage(kicker,title,sub,duration=1200){const el=$('[data-message]',r.overlay);$('[data-message-kicker]',r.overlay).textContent=kicker;$('[data-message-title]',r.overlay).textContent=title;$('[data-message-sub]',r.overlay).textContent=sub||'';el.classList.add('show');clearTimeout(r.messageTimer);r.messageTimer=setTimeout(()=>el.classList.remove('show'),duration);}
  function showCountdown(startAt,label){const layer=$('[data-countdown]',r.overlay);layer.hidden=false;$('[data-count-kicker]',r.overlay).textContent=label;const tick=()=>{if(!r.open||r.state!=='game'){layer.hidden=true;return;}const ms=startAt-Date.now();if(ms<=0){$('[data-count-number]',r.overlay).textContent='FIGHT';sfx('start');setTimeout(()=>{layer.hidden=true;},420);return;}const n=Math.max(1,Math.ceil(ms/1000));$('[data-count-number]',r.overlay).textContent=n;setTimeout(tick,Math.min(400,ms));};tick();}
  function showDamageDirection(attacker){if(!attacker)return;const p=localPlayer(),worldA=Math.atan2(attacker.y-p.y,attacker.x-p.x);showDamageAngle(worldA);}
  function showDamageAngle(worldA){const p=localPlayer();if(!p)return;const a=worldA-p.aim,el=$('[data-damage-arrow]',r.overlay);el.style.transform=`rotate(${a}rad) translateY(-105px)`;el.classList.remove('show');void el.offsetWidth;el.classList.add('show');}
  function showSoundDirection(x,y){const p=localPlayer();if(!p)return;showSoundAngle(Math.atan2(y-p.y,x-p.x)+(Math.random()-.5)*.18);}
  function showSoundAngle(worldA){const p=localPlayer();if(!p)return;const a=worldA-p.aim,el=$('[data-sound-arrow]',r.overlay);el.style.transform=`rotate(${a}rad) translateY(-95px)`;el.classList.remove('show');void el.offsetWidth;el.classList.add('show');}
  function drawDebug(){const el=$('[data-debug]',r.overlay);el.classList.add('show');const p=localPlayer(),other=otherPlayer();el.textContent=`FPS ${r.fps}\nROLE ${r.role}\nMAP ${r.match?.mapId}\nPOS ${p?`${p.x.toFixed(0)},${p.y.toFixed(0)}`:'-'}\nENEMY VISIBLE ${p&&other?isVisible(p,other,gameMap()):false}\nBULLETS ${r.world?.projectiles?.length||0}\nPING ${Math.round(r.pingMs||0)}ms`;}

  function openPause(auto=false){if(r.state!=='game'||$('[data-result]',r.overlay).hidden===false)return;if(r.role==='solo'){r.authorityPaused=true;$('[data-pause-title]',r.overlay).textContent='PAUSED';$('[data-pause-text]',r.overlay).textContent=auto?'Match paused because the app lost focus.':'Solo simulation is paused safely.';$('[data-pause-kicker]',r.overlay).textContent='TACTICAL PAUSE';$('[data-resume]',r.overlay).hidden=false;}else{$('[data-pause-title]',r.overlay).textContent='MENU';$('[data-pause-text]',r.overlay).textContent='Multiplayer continues live. Opening this menu does not pause your opponent.';$('[data-pause-kicker]',r.overlay).textContent='LIVE MATCH';$('[data-resume]',r.overlay).hidden=false;}$('[data-pause]',r.overlay).hidden=false;}
  function resumePause(){if(r.role==='solo')r.authorityPaused=false;$('[data-pause]',r.overlay).hidden=true;}
  function pauseForExitGuard(){if(r.state!=='game')return false;openPause();return true;}
  function resumeFromExitGuard(){resumePause();return true;}

  // ---------------------------- Multiplayer signaling ----------------------------
  function randomRoomCode(){const chars='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';let out='';for(let i=0;i<6;i++)out+=chars[Math.floor(Math.random()*chars.length)];return out;}
  async function createRoom(){const status=$('[data-create-status]',r.overlay);if(!identity().loggedIn){setStatus(status,'Live rooms require a signed-in student account.',true);return;}const button=$('[data-create-room]',r.overlay);button.disabled=true;button.textContent='CREATING…';try{r.bestOf=Number($('[data-host-bestof]',r.overlay).value)||3;r.mapRotation=$('[data-map-rotation]',r.overlay).value==='random'?'random':'same';const name=String($('[data-host-name]',r.overlay).value||identity().name).trim().slice(0,24)||'HOST';let meta=null;for(let i=0;i<6&&!meta;i++){try{meta=await r.bridge.createByteStrikeRoom({roomCode:randomRoomCode(),hostName:name,mapId:r.selectedMap,bestOf:r.bestOf,mapRotation:r.mapRotation});}catch(err){if(i===5)throw err;}}r.role='host';r.roomMeta=meta;r.roomCode=meta.roomCode;r.localReady=false;r.remoteReady=false;r.hostPeer=null;show('lobby');renderLobby();startHostSignalLoop();touchRoomLoop();saveLastRoom();}catch(err){setStatus(status,err?.message||'Could not create room.',true);}finally{button.disabled=false;button.textContent='CREATE ROOM';}}
  async function joinRoom(code,reconnect=false){const status=$('[data-join-status]',r.overlay);const room=String(code||'').toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,6);if(room.length!==6){setStatus(status,'Enter a valid 6-character room code.',true);return;}if(!identity().loggedIn){setStatus(status,'Live rooms require a signed-in student account.',true);return;}try{closeNetwork(false);r.role='guest';r.roomCode=room;const name=String($('[data-guest-name]',r.overlay)?.value||identity().name).trim().slice(0,24)||'PLAYER';const req=await r.bridge.requestByteStrikeJoin({roomCode:room,name,reconnect:!!reconnect});r.roomMeta=req.meta;r.selectedMap=req.meta.mapId||M().defaultMapId;r.bestOf=Number(req.meta.bestOf||3);show('lobby');renderLobby();startGuestSignalLoop();saveLastRoom();setStatus($('[data-room-status]',r.overlay),'Join request sent. Waiting for Host…',false,true);}catch(err){setStatus(status,err?.message||'Could not join room.',true);if(!reconnect){r.role='';r.roomCode='';}}}
  function renderLobby(){const meta=r.roomMeta||{},map=M().get(meta.mapId||r.selectedMap);$('[data-room-code]',r.overlay).textContent=r.roomCode||'------';$('[data-room-meta]',r.overlay).textContent=`${meta.bestOf===1?'Single Round':`Best of ${meta.bestOf||3}`} · ${meta.mapRotation==='random'?'Random rotation':'Same map'}`;$('[data-lobby-map-name]',r.overlay).textContent=map.name;$('[data-lobby-map-info]',r.overlay).textContent=`${map.size} · ${map.playStyle}`;const qr=$('[data-room-qr]',r.overlay),url=r.bridge?.createQrDataUrl?.(`${ROOM_PREFIX}${r.roomCode}`,360)||'';if(url)qr.src=url;const id=identity(),hostName=meta.hostName||'HOST',remoteName=r.role==='host'?(r.hostPeer?.name||'WAITING…'):hostName;const myName=id.name;const hostReady=r.role==='host'?r.localReady:r.remoteReady,guestReady=r.role==='guest'?r.localReady:r.remoteReady;$('[data-roster]',r.overlay).innerHTML=`<article class="bs-player"><span>1</span><div><strong>${esc(hostName)}</strong><small>HOST · ${esc(map.name)}</small></div><b class="bs-ready-pill ${hostReady?'ready':''}">${hostReady?'READY':'NOT READY'}</b></article><article class="bs-player"><span>2</span><div><strong>${esc(r.role==='host'?remoteName:myName)}</strong><small>${r.role==='host'?(r.hostPeer?.connected?'CONNECTED':'WAITING FOR JOIN'):'YOU · GUEST'}</small></div><b class="bs-ready-pill ${guestReady?'ready':''}">${guestReady?'READY':'NOT READY'}</b></article>`;const rb=$('[data-ready]',r.overlay);rb.textContent=r.localReady?'UNREADY':'READY';rb.disabled=r.role==='host'&&!r.hostPeer?.connected||r.role==='guest'&&!r.guestSession?.connected;}
  function touchRoomLoop(){clearInterval(r.roomTouch);if(r.role!=='host')return;r.roomTouch=setInterval(()=>{if(r.open&&r.roomCode&&r.role==='host')r.bridge.touchByteStrikeRoom({roomCode:r.roomCode,status:r.state==='game'?'playing':'lobby',meta:r.roomMeta}).then(m=>{if(m)r.roomMeta=m;}).catch(()=>{});},20000);}
  function startHostSignalLoop(){clearTimeout(r.roomPoll);const poll=async()=>{if(!r.open||r.role!=='host'||!r.roomCode)return;try{const joins=await r.bridge.listByteStrikeJoins({roomCode:r.roomCode,meta:r.roomMeta});let join=null;if(r.hostPeer?.uid)join=joins.find(j=>j.uid===r.hostPeer.uid)||null;if(!join&&!r.hostPeer?.connected)join=joins.find(j=>j.uid&&j.uid!==identity().uid&&j.status==='reconnect')||joins.find(j=>j.uid&&j.uid!==identity().uid)||null;if(join){const stale=!r.hostPeer?.connected&&Date.now()-Number(r.hostPeer?.offerAt||0)>9000;if(!r.hostPeer||r.hostPeer.uid!==join.uid||stale)await prepareHostPeer(join);}if(r.hostPeer&&!r.hostPeer.connected&&!r.hostPeer.answerApplied){const answers=await r.bridge.listByteStrikeAnswers({roomCode:r.roomCode,meta:r.roomMeta});const ans=answers.find(a=>a.uid===r.hostPeer.uid&&Number(a.updatedAtMs||0)>=Number(r.hostPeer.offerAt||0)-1000);if(ans?.answerCode){r.hostPeer.answerApplied=true;await r.hostPeer.session.applyAnswer(ans.answerCode).catch(()=>{r.hostPeer.answerApplied=false;});}}}catch(_){}if(r.open&&r.role==='host')r.roomPoll=setTimeout(poll,500);};poll();}
  async function prepareHostPeer(join){if(r.hostPeer?.session)r.hostPeer.session.close();const session=P().createSession({gameId:`byte-strike-${r.roomCode}-${join.uid}`,prefix:P2P_PREFIX,channelLabel:'strike',timeoutMs:16000,onMessage:msg=>handleGuestMessage(msg),onConnected:()=>hostConnected(join),onDisconnected:()=>hostDisconnected()});r.hostPeer={uid:join.uid,name:join.name||'OPPONENT',session,connected:false,answerApplied:false,offerAt:Date.now()};const offer=await session.createOffer(identity().name||'HOST');r.hostPeer.offerAt=Date.now();await r.bridge.setByteStrikeOffer({roomCode:r.roomCode,targetUid:join.uid,status:'offer',offerCode:offer,meta:r.roomMeta});renderLobby();}
  function hostConnected(join){if(!r.hostPeer)return;r.hostPeer.connected=true;r.hostPeer.name=join.name||r.hostPeer.name;r.reconnectDeadline=0;setStatus($('[data-room-status]',r.overlay),`${r.hostPeer.name} connected.`,false,true);renderLobby();if(r.state==='game'&&r.match&&r.world){r.authorityPaused=false;r.hostPeer.session.send({t:'welcomeResume',...matchStartPayload()});showMessage('TACTICAL LINK','OPPONENT RECONNECTED','Match resumed.',1000);}saveLastRoom();}
  function hostDisconnected(){if(!r.open||r.role!=='host')return;if(r.hostPeer)r.hostPeer.connected=false;r.remoteReady=false;r.reconnectDeadline=Date.now()+RECONNECT_MS;if(r.state==='game'){r.authorityPaused=true;showReconnectOverlay('OPPONENT CONNECTION LOST','Waiting up to 12 seconds for reconnection…');setTimeout(()=>{if(r.open&&r.role==='host'&&r.state==='game'&&r.reconnectDeadline&&Date.now()>=r.reconnectDeadline&&!r.hostPeer?.connected){r.authorityPaused=false;finishMatch('Opponent disconnected and did not return.');}},RECONNECT_MS+300);}renderLobby();}
  function startGuestSignalLoop(){clearTimeout(r.guestPoll);let busy=false;const poll=async()=>{if(!r.open||r.role!=='guest'||!r.roomCode)return;if(!busy&&!r.guestSession?.connected){busy=true;try{const offer=await r.bridge.getByteStrikeOffer({roomCode:r.roomCode});if(offer?.offerCode&&(!r.guestSession||r.guestSession._offerStamp!==offer.updatedAtMs)){r.guestSession?.close();const session=P().createSession({gameId:`byte-strike-${r.roomCode}-${identity().uid}`,prefix:P2P_PREFIX,channelLabel:'strike',timeoutMs:16000,onMessage:handleHostMessage,onConnected:guestConnected,onDisconnected:guestDisconnected});session._offerStamp=offer.updatedAtMs;r.guestSession=session;const answer=await session.createAnswer(offer.offerCode,identity().name||'PLAYER');await r.bridge.setByteStrikeAnswer({roomCode:r.roomCode,answerCode:answer,meta:r.roomMeta});setStatus($('[data-room-status]',r.overlay),'Connecting directly to Host…');}}catch(_){}finally{busy=false;}}if(r.open&&r.role==='guest')r.guestPoll=setTimeout(poll,500);};poll();}
  function guestConnected(){r.reconnectDeadline=0;setStatus($('[data-room-status]',r.overlay),'Connected to Host.',false,true);r.guestSession?.send({t:'helloReady',ready:r.localReady,name:identity().name});renderLobby();saveLastRoom();}
  function guestDisconnected(){if(!r.open||r.role!=='guest')return;r.remoteReady=false;r.reconnectDeadline=Date.now()+RECONNECT_MS;if(r.state==='game'){showReconnectOverlay('HOST CONNECTION LOST','Reconnecting to the same room…');scheduleGuestReconnect();}else{setStatus($('[data-room-status]',r.overlay),'Connection lost. Reconnecting…',true);scheduleGuestReconnect();}renderLobby();}
  function scheduleGuestReconnect(){setTimeout(async()=>{if(!r.open||r.role!=='guest'||r.guestSession?.connected)return;if(Date.now()>=r.reconnectDeadline){if(r.state==='game')finishMatch('Host connection was lost.');return;}try{await r.bridge.requestByteStrikeJoin({roomCode:r.roomCode,name:identity().name,reconnect:true});startGuestSignalLoop();}catch(_){}setTimeout(scheduleGuestReconnect,1000);},650);}
  function showReconnectOverlay(title,text){$('[data-pause-kicker]',r.overlay).textContent='RECONNECTING…';$('[data-pause-title]',r.overlay).textContent=title;$('[data-pause-text]',r.overlay).textContent=text;$('[data-resume]',r.overlay).hidden=true;$('[data-pause]',r.overlay).hidden=false;}
  function clearReconnectOverlay(){if($('[data-pause-title]',r.overlay).textContent.includes('CONNECTION')){$('[data-pause]',r.overlay).hidden=true;$('[data-resume]',r.overlay).hidden=false;}}
  function toggleReady(){if(r.state!=='lobby')return;r.localReady=!r.localReady;sfx('ready');if(r.role==='host'){r.hostPeer?.session?.send({t:'ready',v:r.localReady});}else r.guestSession?.send({t:'ready',v:r.localReady});renderLobby();maybeStartLive();}
  function maybeStartLive(){if(r.role!=='host'||!r.hostPeer?.connected||!r.localReady||!r.remoteReady)return;r.match={mode:'multi',mapId:r.roomMeta.mapId||r.selectedMap,bestOf:Number(r.roomMeta.bestOf||3),winsTo:Math.ceil(Number(r.roomMeta.bestOf||3)/2),score:[0,0],round:1,startAt:Date.now()+3000,stats:[newStats(),newStats()]};r.localReady=false;r.remoteReady=false;prepareAuthorityRound();show('game');beginGameLoop();r.hostPeer.session.send({t:'matchStart',...matchStartPayload()});showCountdown(r.match.startAt,'ROUND 1');saveLastRoom();}
  function matchStartPayload(){return{mapId:r.match.mapId,bestOf:r.match.bestOf,score:r.match.score,round:r.match.round,startAt:r.match.startAt,hostName:identity().name,guestName:r.hostPeer?.name||'OPPONENT',world:makeSnapshotForGuest(false)};}
  function handleGuestMessage(m){if(!m)return;if(m.t==='ready'){r.remoteReady=!!m.v;renderLobby();maybeStartLive();}else if(m.t==='helloReady'){r.remoteReady=!!m.ready;if(r.hostPeer)r.hostPeer.name=m.name||r.hostPeer.name;renderLobby();if(r.state==='game'&&r.match&&r.world){r.authorityPaused=false;r.hostPeer?.session?.send({t:'welcomeResume',...matchStartPayload()});clearReconnectOverlay();}}else if(m.t==='orientation'){r.remoteOrientationReady=m.ready!==false;}else if(m.t==='i'&&r.state==='game'){r.remoteOrientationReady=m.o!==0;const mx=clamp(m.mx,-1,1),my=clamp(m.my,-1,1),ml=Math.hypot(mx,my),scale=ml>1?1/ml:1;r.lastGuestInput={mx:mx*scale,my:my*scale,aim:normAngle(Number(m.a)||0),fire:!!m.f,reload:!!m.r,pickup:!!m.p};}else if(m.t==='pong'){recordPong(m.id);}else if(m.t==='ping'){r.hostPeer?.session?.send({t:'pong',id:m.id});}else if(m.t==='rematch'){r.remoteReady=!!m.v;checkRematch();}else if(m.t==='leave'){finishMatch('Opponent left the duel.');}}
  function handleHostMessage(m){if(!m)return;if(m.t==='ready'){r.remoteReady=!!m.v;renderLobby();}else if(m.t==='orientation'){r.remoteOrientationReady=m.ready!==false;}else if(m.t==='matchStart'){prepareGuestWorld(m);clearReconnectOverlay();}else if(m.t==='welcomeResume'){prepareGuestWorld(m);clearReconnectOverlay();showMessage('TACTICAL LINK','RECONNECTED','Same room · same duel.',900);}else if(m.t==='nextRound'){prepareGuestWorld(m);}else if(m.t==='snap'){applyGuestSnapshot(m,false);}else if(m.t==='roundEnd'){if(r.match){r.match.score=[...m.score];showRoundEnd(Number(m.winner));}}else if(m.t==='matchEnd'){if(r.match){r.match.score=[...m.score];r.match.stats=m.stats||r.match.stats;}finishMatch(m.reason||'');}else if(m.t==='ping'){r.guestSession?.send({t:'pong',id:m.id});}else if(m.t==='pong'){recordPong(m.id);}else if(m.t==='rematch'){r.remoteReady=!!m.v;checkRematch();}else if(m.t==='exit'){finishMatch('Host ended the room.');}}
  function makeSnapshotForGuest(full=false){if(!r.world)return null;const guest=r.world.players[1],host=r.world.players[0],canSee=isVisible(guest,host,gameMap());const p0=canSee||full?[host.x,host.y,host.aim,host.hp,host.weapon,host.mag,host.reserve,host.reloading?host.reloadEnd-now():0,host.alive?1:0]:[null,null,null,null,null,null,null,null,host.alive?1:0];const p1=[guest.x,guest.y,guest.aim,guest.hp,guest.weapon,guest.mag,guest.reserve,guest.reloading?guest.reloadEnd-now():0,guest.alive?1:0];const projs=(r.world.projectiles||[]).filter(b=>b.owner===1||pointVisibleFrom(guest,b.x,b.y,gameMap())).map(b=>[b.id,b.owner,+b.x.toFixed(1),+b.y.toFixed(1),+b.px.toFixed(1),+b.py.toFixed(1),b.color]);const rawShots=r.world.shotEvents.splice(0),shots=rawShots.map(ev=>{const visible=ev.owner===1||pointVisibleFrom(guest,ev.x,ev.y,gameMap());if(visible)return{visible:true,x:ev.x,y:ev.y,a:ev.a,owner:ev.owner,weapon:ev.weapon};const ang=Math.atan2(ev.y-guest.y,ev.x-guest.x)+(Math.random()-.5)*.18;const d=dist(guest.x,guest.y,ev.x,ev.y);return{visible:false,angle:ang,distance:d<360?'near':d<650?'mid':'far',owner:ev.owner,weapon:ev.weapon};});const rawSteps=(r.world.noiseEvents||[]).splice(0),steps=rawSteps.filter(ev=>ev.owner===0&&dist(guest.x,guest.y,ev.x,ev.y)<ev.radius).map(ev=>({angle:Math.atan2(ev.y-guest.y,ev.x-guest.x)+(Math.random()-.5)*.28,distance:dist(guest.x,guest.y,ev.x,ev.y)<140?'near':'mid'}));return{t:'snap',seq:r.world.seq,at:Date.now(),p:[p0,p1],b:projs,pk:r.world.pickups.map(x=>[x.id,x.active?1:0,x.respawnAt?Math.max(0,x.respawnAt-now()):0]),shots,steps,hits:r.world.hitEvents.splice(0)}};
  function pointVisibleFrom(viewer,x,y,map){return isVisible(viewer,{x,y,alive:true},map);}
  function sendSnapshot(){if(!r.hostPeer?.connected)return;const snap=makeSnapshotForGuest(false);r.hostPeer.session.send(snap);}
  function applyGuestSnapshot(snap,initial=false){if(!snap||!r.world)return;const ts=now();for(let i=0;i<2;i++){const row=snap.p?.[i];if(!row)continue;const p=r.world.players[i];if(row[0]!=null){if(i===0&&!initial){p._tx=Number(row[0]);p._ty=Number(row[1]);p._ta=Number(row[2]||0);if(p.netHidden){p.x=p._tx;p.y=p._ty;p.aim=p._ta;}}else{p.x=Number(row[0]);p.y=Number(row[1]);p.aim=Number(row[2]||0);}p.hp=Number(row[3]??p.hp);p.weapon=row[4]||p.weapon;p.mag=Number(row[5]??p.mag);p.reserve=Number(row[6]??p.reserve);p.reloading=Number(row[7]||0)>0;p.reloadEnd=p.reloading?ts+Number(row[7]):0;}p.alive=Number(row[8])!==0;}
    if(snap.p?.[0])r.world.players[0].netHidden=snap.p[0][0]==null;if(snap.p?.[1])r.world.players[1].netHidden=false;if(r.predicted&&!initial){const a=r.world.players[1],err=dist(r.predicted.x,r.predicted.y,a.x,a.y);if(err>70){r.predicted.x=a.x;r.predicted.y=a.y;}else{r.predicted.x=lerp(r.predicted.x,a.x,.16);r.predicted.y=lerp(r.predicted.y,a.y,.16);}}
    r.world.projectiles=(snap.b||[]).map(b=>({id:b[0],owner:b[1],x:b[2],y:b[3],px:b[4],py:b[5],color:b[6],travel:0,max:999}));for(const row of snap.pk||[]){const pk=r.world.pickups[row[0]];if(pk){pk.active=!!row[1];pk.respawnAt=row[2]?ts+row[2]:0;}}
    for(const ev of snap.shots||[]){if(ev.owner===1)continue;if(ev.visible&&ev.x!=null&&ev.y!=null){if(!pointVisibleToLocal(ev.x,ev.y,gameMap()))showSoundDirection(ev.x,ev.y);}else if(ev.angle!=null){showSoundAngle(ev.angle);}const vol=ev.distance==='near'?.78:ev.distance==='mid'?.55:.35;sfx(shotSfxId(ev.weapon),0,Math.min(1.05,vol+0.12));}
    for(const ev of snap.steps||[]){if(ev.angle!=null){showSoundAngle(Number(ev.angle));sfx('step',clamp(Math.cos(Number(ev.angle)),-1,1),ev.distance==='near'?.32:.24);}}
    for(const ev of snap.hits||[])if(ev.target===1&&ev.dir!=null)showDamageAngle(Number(ev.dir));
  }

  function startPing(){stopPing();if(r.role==='solo')return;r.pingTimer=setInterval(()=>{const id=`${Date.now()}-${Math.random().toString(36).slice(2,6)}`;r.pingSent.set(id,performance.now());const s=r.role==='host'?r.hostPeer?.session:r.guestSession;s?.send({t:'ping',id});for(const [k,v] of r.pingSent)if(performance.now()-v>8000)r.pingSent.delete(k);},1000);}
  function stopPing(){clearInterval(r.pingTimer);r.pingTimer=0;r.pingSent.clear();}
  function recordPong(id){const at=r.pingSent.get(id);if(at==null)return;const ms=performance.now()-at;r.pingSent.delete(id);r.pingMs=r.pingMs?lerp(r.pingMs,ms,.28):ms;}

  async function sendStudentInvite(){const input=$('[data-target-student]',r.overlay),status=$('[data-room-status]',r.overlay),target=String(input.value||'').trim();if(!target){setStatus(status,'Enter a Student ID first.',true);return;}try{const sent=await r.bridge.createTwoPlayerInvite({gameId:GAME_ID,targetStudentId:target,offerCode:`${ROOM_PREFIX}${r.roomCode}`,hostName:identity().name});setStatus(status,`Invite sent to ${sent.targetStudentId||target}.`,false,true);input.value='';}catch(err){setStatus(status,err?.message||'Could not send invite.',true);}}
  async function refreshInvites(force=false){if(!r.bridge?.listTwoPlayerInvites||!identity().loggedIn)return;try{const result=await r.bridge.listTwoPlayerInvites({gameId:GAME_ID});r.pendingInvites=Array.isArray(result?.invites)?result.invites:[];renderInvites();}catch(err){if(force)$('[data-invite-list]',r.overlay).innerHTML=`<div class="bs-status error">${esc(err?.message||'Could not load invites.')}</div>`;}}
  function renderInvites(){const list=$('[data-invite-list]',r.overlay);if(!r.pendingInvites.length){list.innerHTML='<div class="bs-status">No pending BYTE STRIKE invites.</div>';return;}list.innerHTML=r.pendingInvites.map(inv=>`<article class="bs-invite"><div><strong>${esc(inv.fromName||'Student')}</strong><small>${esc(inv.fromStudentId||'')} · ${esc(String(inv.offerCode||'').replace(ROOM_PREFIX,''))}</small></div><div><button class="bs-btn primary" type="button" data-accept-invite="${esc(inv.inviteId)}">ACCEPT</button><button class="bs-btn ghost" type="button" data-decline-invite="${esc(inv.inviteId)}">DECLINE</button></div></article>`).join('');}
  function startInvitePolling(){stopInvitePolling();const poll=async()=>{if(!r.open||r.state!=='join')return;await refreshInvites(false);r.invitePoll=setTimeout(poll,r.pendingInvites.length?3500:8000);};r.invitePoll=setTimeout(poll,500);}
  function stopInvitePolling(){clearTimeout(r.invitePoll);r.invitePoll=0;}
  async function acceptInvite(id){const inv=r.pendingInvites.find(x=>x.inviteId===id);if(!inv)return;try{await r.bridge.respondTwoPlayerInvite({gameId:GAME_ID,inviteId:inv.inviteId,hostUid:inv.fromUid,status:'accepted',answerCode:'ROOM'});r.pendingInvites=r.pendingInvites.filter(x=>x!==inv);renderInvites();const code=String(inv.offerCode||'').replace(ROOM_PREFIX,'');await joinRoom(code);}catch(err){setStatus($('[data-join-status]',r.overlay),err?.message||'Could not accept invite.',true);}}
  async function declineInvite(id){const inv=r.pendingInvites.find(x=>x.inviteId===id);if(!inv)return;try{await r.bridge.respondTwoPlayerInvite({gameId:GAME_ID,inviteId:inv.inviteId,hostUid:inv.fromUid,status:'declined'});}catch(_){}r.pendingInvites=r.pendingInvites.filter(x=>x!==inv);renderInvites();}
  function scanRoom(){if(!P()?.openScanner){setStatus($('[data-join-status]',r.overlay),'QR scanner is unavailable. Enter the room code instead.',true);return;}closeScanner();const modal=$('[data-scanner]',r.overlay),video=$('[data-scan-video]',r.overlay);modal.hidden=false;$('[data-scan-status]',r.overlay).textContent='Point the camera at the Host QR.';P().openScanner({video,acceptPrefix:ROOM_PREFIX,onCode:value=>{closeScanner();joinRoom(String(value).slice(ROOM_PREFIX.length));}}).then(stop=>{r.scannerStop=stop;}).catch(err=>{$('[data-scan-status]',r.overlay).textContent=err?.message||'Could not open camera.';});}
  function closeScanner(){try{r.scannerStop?.();}catch(_){}r.scannerStop=null;const m=$('[data-scanner]',r.overlay);if(m)m.hidden=true;}

  function requestRematch(){if(r.role==='solo'){$('[data-result]',r.overlay).hidden=true;r.match.score=[0,0];r.match.round=1;r.match.stats=[newStats(),newStats()];r.match.startAt=Date.now()+2600;prepareAuthorityRound();beginGameLoop();showCountdown(r.match.startAt,'REMATCH');return;}r.localReady=true;const s=r.role==='host'?r.hostPeer?.session:r.guestSession;s?.send({t:'rematch',v:true});$('[data-rematch-status]',r.overlay).textContent='Waiting for opponent to accept rematch…';checkRematch();}
  function checkRematch(){if(!r.localReady||!r.remoteReady)return;if(r.role==='host'){r.localReady=r.remoteReady=false;$('[data-result]',r.overlay).hidden=true;r.match.score=[0,0];r.match.round=1;r.match.stats=[newStats(),newStats()];if(r.mapRotation==='random')r.match.mapId=M().random(r.match.mapId).id;r.match.startAt=Date.now()+2800;prepareAuthorityRound();beginGameLoop();r.hostPeer.session.send({t:'matchStart',...matchStartPayload()});showCountdown(r.match.startAt,'REMATCH');}else{$('[data-result]',r.overlay).hidden=true;}}
  function changeMapAfterMatch(){if(r.role==='solo'){quitMatch(false);show('solo');return;}if(r.role==='host'){quitMatch(false);show('multi');return;}$('[data-rematch-status]',r.overlay).textContent='Only the Host chooses the room map. Leave and join a new room to change it.';}

  function saveLastRoom(){if(!r.roomCode||!['host','guest'].includes(r.role))return;try{localStorage.setItem(LS_KEY,JSON.stringify({role:r.role,roomCode:r.roomCode,mapId:r.match?.mapId||r.roomMeta?.mapId||r.selectedMap,bestOf:r.match?.bestOf||r.roomMeta?.bestOf||r.bestOf,at:Date.now()}));}catch(_){} }
  function persistRoomState(){if(r.role!=='host'||!r.roomCode||!r.match||!r.world)return;try{const data={role:'host',roomCode:r.roomCode,at:Date.now(),roomMeta:r.roomMeta,match:r.match,world:{players:r.world.players.map(p=>({...p,brain:null,input:null})),pickups:r.world.pickups}};localStorage.setItem(`${LS_KEY}.hostState`,JSON.stringify(data));}catch(_){} }
  function startPersistence(){stopPersistence();r.persistentTimer=setInterval(()=>{saveLastRoom();persistRoomState();},1000);}
  function stopPersistence(){clearInterval(r.persistentTimer);r.persistentTimer=0;}
  function clearPersistentIfFinished(){try{localStorage.removeItem(`${LS_KEY}.hostState`);}catch(_){} }
  function renderReconnectCard(){const slot=$('[data-reconnect-slot]',r.overlay);if(!slot)return;let v=null;try{v=JSON.parse(localStorage.getItem(LS_KEY)||'null');}catch(_){}if(!v||Date.now()-Number(v.at||0)>45*60*1000){slot.innerHTML='';return;}slot.innerHTML=`<div class="bs-map-random" style="margin-top:16px"><span>Recent live room <b>${esc(v.roomCode)}</b> · ${esc(v.role?.toUpperCase())}</span><button class="bs-btn" type="button" data-reconnect-last>RECONNECT</button></div>`;}
  async function reconnectLast(){let v=null;try{v=JSON.parse(localStorage.getItem(LS_KEY)||'null');}catch(_){}if(!v)return;if(v.role==='guest'){show('join');$('[data-room-input]',r.overlay).value=v.roomCode;await joinRoom(v.roomCode,true);return;}if(v.role==='host'){try{let st=null;try{st=JSON.parse(localStorage.getItem(`${LS_KEY}.hostState`)||'null');}catch(_){}const meta=await r.bridge.createByteStrikeRoom({roomCode:v.roomCode,hostName:identity().name,mapId:v.mapId||M().defaultMapId,bestOf:v.bestOf||3,mapRotation:'same',resume:true});r.role='host';r.roomCode=v.roomCode;r.roomMeta=meta;r.selectedMap=meta.mapId;r.bestOf=meta.bestOf;r.hostPeer=null;r.localReady=true;r.remoteReady=false;show('lobby');renderLobby();startHostSignalLoop();touchRoomLoop();if(st?.match&&st?.world){r.match=st.match;r.match.startAt=Date.now()+1200;r.world={...st.world,projectiles:[],effects:[],shotEvents:[],hitEvents:[],noiseEvents:[],roundOver:false,lastTick:now(),seq:0,lastLoud:null};r.world.players.forEach((p,i)=>{p.input=resetInput();p.brain=i===1&&p.bot?{state:'search',seenAt:0,lastSeen:null,lastHeard:null,path:[],pathAt:0,pathTarget:null,strafeDir:1,error:0,errorAt:0,engageAt:0,patrol:null}:null;});}}catch(err){show('multi');setStatus($('[data-create-status]',r.overlay),err?.message||'Could not restore Host room.',true);}}}

  async function leaveRoomToHome(){const room=r.roomCode,host=r.role==='host';if(host)r.hostPeer?.session?.send({t:'exit'});else r.guestSession?.send({t:'leave'});closeNetwork();if(room&&r.bridge?.leaveByteStrikeRoom)r.bridge.leaveByteStrikeRoom({roomCode:room,closeRoom:host}).catch(()=>{});r.role='';r.roomCode='';r.roomMeta=null;r.localReady=r.remoteReady=false;show('home');}
  function closeNetwork(closeRoomTimers=true){clearTimeout(r.roomPoll);clearTimeout(r.guestPoll);clearInterval(r.roomTouch);r.roomPoll=r.guestPoll=r.roomTouch=0;try{r.hostPeer?.session?.close();}catch(_){}try{r.guestSession?.close();}catch(_){}r.hostPeer=null;r.guestSession=null;if(closeRoomTimers)stopInvitePolling();}
  function quitMatch(toHome=true){stopGameLoop();releaseMobileBattleView();$('[data-pause]',r.overlay).hidden=true;$('[data-result]',r.overlay).hidden=true;r.authorityPaused=false;r.world=null;r.match=null;r.predicted=null;r.remoteOrientationReady=true;r.particles=[];r.predictedTracers=[];if(r.role==='solo'){r.role='';if(toHome)show('home');else show('solo');return;}leaveRoomToHome();}
  function returnHub(){const cb=r.onBack;close(false);cb?.();}
  function close(call=true){if(!r.open)return;releaseMobileBattleView();const room=r.roomCode,host=r.role==='host';if(host)r.hostPeer?.session?.send({t:'exit'});else r.guestSession?.send({t:'leave'});stopGameLoop();closeScanner();closeNetwork();if(room&&r.bridge?.leaveByteStrikeRoom)r.bridge.leaveByteStrikeRoom({roomCode:room,closeRoom:host}).catch(()=>{});r.open=false;r.overlay.hidden=true;document.body.classList.remove('byte-strike-active');r.role='';r.roomCode='';r.roomMeta=null;r.world=null;r.match=null;r.predicted=null;r.keys.clear();r.mouse.down=false;if(call)r.onClose?.();}
  function open(opts={}){build();r.bridge=opts.bridge||null;r.music=opts.music||null;r.onBack=opts.onBack||null;r.onClose=opts.onClose||null;r.open=true;r.overlay.hidden=false;document.body.classList.add('byte-strike-active');loadSettings();syncSettingsUi();r.role='';r.roomCode='';r.roomMeta=null;r.world=null;r.match=null;r.localReady=r.remoteReady=false;r.remoteOrientationReady=true;closeNetwork();const id=identity();if(id.name){$('[data-host-name]',r.overlay).value=id.name;$('[data-guest-name]',r.overlay).value=id.name;}$('[data-bs-sound]',r.overlay).textContent=soundEnabled()?'🔊':'🔇';show('home');resizeCanvas();}

  window[GLOBAL_NAME]=Object.freeze({open,close:()=>close(true),isOpen:()=>r.open,pauseForExitGuard,resumeFromExitGuard,_debug:Object.freeze({state:()=>({state:r.state,role:r.role,map:r.match?.mapId||r.selectedMap,room:r.roomCode,fps:r.fps,ping:r.pingMs}),player:()=>{const p=localPlayer();return p?{x:Math.round(p.x),y:Math.round(p.y),hp:p.hp,weapon:p.weapon,mag:p.mag,reserve:p.reserve}:null;},opponent:()=>{const p=otherPlayer();return p?{x:Math.round(p.x),y:Math.round(p.y),hp:p.hp,weapon:p.weapon,hidden:!!p.netHidden,botState:p.brain?.state||''}:null;},maps:()=>M()?.maps?.map(x=>x.id)||[],weapons:()=>Object.keys(WEAPONS),visible:()=>r.world?isVisible(localPlayer(),otherPlayer(),gameMap()):false})});
})();

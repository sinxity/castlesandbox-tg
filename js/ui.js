// ── SOUND ──────────────────────────────────────────────────────
let audioCtx=null;

function initAudio(){
  if(audioCtx) return;
  try{audioCtx=new(window.AudioContext||window.webkitAudioContext)();}
  catch(e){soundEnabled=false;}
}

function playSound(type){
  if(!soundEnabled||!audioCtx) return;
  try{
    const now=audioCtx.currentTime;
    if(type==='victory'||type==='level'){
      const freqs=type==='victory'?[523,659,784,1047]:[440,550,660];
      freqs.forEach((f,i)=>{
        const o=audioCtx.createOscillator(),g=audioCtx.createGain();
        o.connect(g);g.connect(audioCtx.destination);
        o.frequency.value=f;
        g.gain.setValueAtTime(0.12,now+i*0.1);
        g.gain.exponentialRampToValueAtTime(0.001,now+i*0.1+0.15);
        o.start(now+i*0.1);o.stop(now+i*0.1+0.2);
      });
      return;
    }
    const o=audioCtx.createOscillator(),g=audioCtx.createGain();
    o.connect(g);g.connect(audioCtx.destination);
    if(type==='place'){
      o.frequency.value=660;
      g.gain.setValueAtTime(0.07,now);g.gain.exponentialRampToValueAtTime(0.001,now+0.07);
      o.start(now);o.stop(now+0.07);
    } else if(type==='explode'){
      o.type='sawtooth';
      o.frequency.setValueAtTime(200,now);o.frequency.exponentialRampToValueAtTime(35,now+0.35);
      g.gain.setValueAtTime(0.2,now);g.gain.exponentialRampToValueAtTime(0.001,now+0.35);
      o.start(now);o.stop(now+0.35);
    } else if(type==='zombie'){
      o.type='square';
      o.frequency.setValueAtTime(100,now);o.frequency.setValueAtTime(65,now+0.15);
      g.gain.setValueAtTime(0.15,now);g.gain.exponentialRampToValueAtTime(0.001,now+0.3);
      o.start(now);o.stop(now+0.3);
    }
  }catch(e){}
}

// ── EVENT LOG & STATS ─────────────────────────────────────────
function logEvent(msg){evts.unshift(msg);if(evts.length>5) evts.pop();document.getElementById('elog').innerHTML=evts.join('<br>');}
function updateStats(){
  const c={red:0,blue:0,green:0,gold:0};
  bots.forEach(b=>c[b.team]=(c[b.team]||0)+1);
  document.getElementById('sr').textContent=c.red||0;
  document.getElementById('sbl').textContent=c.blue||0;
  document.getElementById('sg').textContent=c.green||0;
  document.getElementById('sy').textContent=c.gold||0;
  const active=castles.reduce((best,c)=>(!best||c.power>best.power)?c:best,null)||castles[0];
  if(active){
    const r=RES[active.team];
    document.getElementById('res-wood').textContent=r.wood||0;
    document.getElementById('res-stone').textContent=r.stone||0;
    document.getElementById('res-iron').textContent=r.iron||0;
    document.getElementById('res-knights').textContent=r.knights||0;
  }
  const dt=dayTime;
  const dayLabel=dt<0.55?'День':dt<0.7?'Закат':dt<0.8?'Ночь':'Рассвет';
  document.getElementById('day-time').textContent=dayLabel;
  const dcEl=document.getElementById('day-count');
  if(dcEl) dcEl.textContent=dayCount;
  const wEl=document.getElementById('weather-icon');
  if(wEl) wEl.textContent={'clear':'☀️','rain':'🌧','storm':'⛈'}[weather]||'☀️';
}

// ── MAIN LOOP ─────────────────────────────────────────────────
let lastT=0;
function loop(ts){
  rafId=requestAnimationFrame(loop);
  if(Math.abs(camZ-targetZ)>0.001){camZ+=(targetZ-camZ)*0.15;clampCam();}
  const frameSkip=gameSpeed===2?30:60;
  if(gameSpeed===0||ts-lastT<frameSkip){render();applyTransform();return;}
  lastT=ts;tick++;
  if(tick%2===0) updateBots();
  if(tick%3===0) updateFire();
  if(tick%4===0) updateArmies();
  if(tick%3===0) updateRaids();
  if(tick%5===0) updatePlague();
  if(tick%60===0) updateWeather();
  if(tick%30===0) updateCastles();
  if(tick%600===0&&tick>0) spawnZombieWave();
  const dayTicks=Math.round(1/daySpeed);
  if(tick>0&&tick%dayTicks===0) dayCount++;
  if(tick%20===0) updateStats();
  render();
  applyTransform();
}

// ── TOUCH / MOUSE EVENTS ──────────────────────────────────────
function getTouchDist(t){return Math.hypot(t[1].clientX-t[0].clientX,t[1].clientY-t[0].clientY);}
function getTouchMid(t){return{x:(t[0].clientX+t[1].clientX)/2,y:(t[0].clientY+t[1].clientY)/2};}

// UI elements inside #cw that should NOT be intercepted by the canvas touch handler
function isUITouch(e){return!!e.target.closest('#topbar,#minimap-wrap,#victory-overlay,#loading,#castle-panel');}

function setupEvents(){
  // Mini-map click to navigate
  const mmWrap=document.getElementById('minimap-wrap');
  if(mmWrap) mmWrap.addEventListener('click',e=>{
    const mmEl=document.getElementById('minimap');
    if(!mmEl||!W||!H) return;
    const rect=mmWrap.getBoundingClientRect();
    const mx=(e.clientX-rect.left)*(mmEl.width/rect.width);
    const my=(e.clientY-rect.top)*(mmEl.height/rect.height);
    camX=mx/mmEl.width*W*camZ-wrap.clientWidth/2;
    camY=my/mmEl.height*H*camZ-wrap.clientHeight/2;
    clampCam();
  });

  let tapStartTime=0,tapStartX=0,tapStartY=0;
  let recentTouch=false,recentTouchTimer=null;

  wrap.addEventListener('touchstart',e=>{
    // CRITICAL FIX: don't intercept touches on topbar buttons or minimap
    // e.preventDefault() kills synthetic click events, breaking buttons
    // Mark recent touch so synthetic mouseup doesn't fire checkCastleTap
    recentTouch=true;
    clearTimeout(recentTouchTimer);
    recentTouchTimer=setTimeout(()=>{recentTouch=false;},600);
    if(isUITouch(e)) return;
    e.preventDefault();
    initAudio();
    if(e.touches.length===2){
      isPinching=true;isDrawing=false;
      pinchStartDist=getTouchDist(e.touches);
      lastPinchDist=pinchStartDist;
      pinchStartZ=camZ;
      const mid=getTouchMid(e.touches);
      panStartX=mid.x;panStartY=mid.y;
      panStartCamX=camX;panStartCamY=camY;
    } else if(e.touches.length===1&&!isPinching){
      const t=e.touches[0];
      tapStartTime=Date.now();tapStartX=t.clientX;tapStartY=t.clientY;
      if(curTool===null){
        // Pan mode (default — no tool selected)
        panStartX=t.clientX;panStartY=t.clientY;
        panStartCamX=camX;panStartCamY=camY;
      } else {
        lastSpriteCell={x:-99,y:-99};lastPaintPos={x:-99,y:-99};
        isDrawing=true;
        paintAt(t.clientX,t.clientY,true);
      }
    }
  },{passive:false});

  wrap.addEventListener('touchmove',e=>{
    if(isUITouch(e)) return;
    e.preventDefault();
    if(e.touches.length===2&&isPinching){
      const dist=getTouchDist(e.touches);
      const mid=getTouchMid(e.touches);
      if(lastPinchDist>0){
        const delta=dist/lastPinchDist;
        const newZ=Math.max(MIN_Z,Math.min(MAX_Z,camZ*delta));
        const rect=wrap.getBoundingClientRect();
        const mx=mid.x-rect.left,my=mid.y-rect.top;
        camX=mx+(camX-mx)*newZ/camZ;
        camY=my+(camY-my)*newZ/camZ;
        camZ=newZ;targetZ=newZ;
      }
      lastPinchDist=dist;
      const dx=mid.x-panStartX,dy=mid.y-panStartY;
      camX=panStartCamX-dx;camY=panStartCamY-dy;
      panStartX=mid.x;panStartY=mid.y;
      panStartCamX=camX;panStartCamY=camY;
      clampCam();showZoomIndicator();
    } else if(e.touches.length===1){
      const t=e.touches[0];
      if(curTool===null){
        camX=panStartCamX+(t.clientX-panStartX)*-1;
        camY=panStartCamY+(t.clientY-panStartY)*-1;
        clampCam();
      } else if(isDrawing){
        paintAt(t.clientX,t.clientY,false);
      }
    }
  },{passive:false});

  wrap.addEventListener('touchend',e=>{
    if(isUITouch(e)) return;
    e.preventDefault();
    if(e.touches.length<2){isPinching=false;lastPinchDist=0;}
    if(e.touches.length===0){
      isDrawing=false;lastPaintPos={x:-99,y:-99};
      // Detect tap: short duration + minimal movement → check for castle
      if(curTool===null&&!isPinching&&e.changedTouches.length>0){
        const t=e.changedTouches[0];
        const moved=Math.hypot(t.clientX-tapStartX,t.clientY-tapStartY);
        if(moved<12&&Date.now()-tapStartTime<350){
          const pos=screenToCanvas(t.clientX,t.clientY);
          checkCastleTap(pos.x,pos.y);
        }
      }
    }
  },{passive:false});

  let mouseDownX=0,mouseDownY=0,mouseDownTime=0;
  wrap.addEventListener('mousedown',e=>{
    if(recentTouch) return; // ignore synthetic mouse events from touch
    initAudio();
    mouseDownX=e.clientX;mouseDownY=e.clientY;
    if(curTool===null){
      panStartX=e.clientX;panStartY=e.clientY;panStartCamX=camX;panStartCamY=camY;
      isDrawing=true;
    } else {
      lastSpriteCell={x:-99,y:-99};lastPaintPos={x:-99,y:-99};
      isDrawing=true;paintAt(e.clientX,e.clientY,true);
    }
  });
  wrap.addEventListener('mousemove',e=>{
    if(recentTouch||!isDrawing) return;
    if(curTool===null){
      camX=panStartCamX-(e.clientX-panStartX);
      camY=panStartCamY-(e.clientY-panStartY);
      clampCam();
    } else {
      paintAt(e.clientX,e.clientY,false);
    }
  });
  wrap.addEventListener('mouseup',e=>{
    if(recentTouch) return; // ignore synthetic mouse events from touch
    isDrawing=false;
    if(curTool===null&&Math.hypot(e.clientX-mouseDownX,e.clientY-mouseDownY)<6){
      const pos=screenToCanvas(e.clientX,e.clientY);
      checkCastleTap(pos.x,pos.y);
    }
  });
  wrap.addEventListener('mouseleave',()=>{if(!recentTouch) isDrawing=false;});
  wrap.addEventListener('wheel',e=>{
    e.preventDefault();
    const delta=e.deltaY>0?0.9:1.1;
    const newZ=Math.max(MIN_Z,Math.min(MAX_Z,camZ*delta));
    const rect=wrap.getBoundingClientRect();
    const mx=e.clientX-rect.left,my=e.clientY-rect.top;
    camX=mx+(camX-mx)*newZ/camZ;
    camY=my+(camY-my)*newZ/camZ;
    camZ=newZ;clampCam();showZoomIndicator();
  },{passive:false});
}

// ── CASTLE PANEL ──────────────────────────────────────────────
let activeCastlePanel=null;

function checkCastleTap(cx,cy){
  const R=40/camZ;
  const hit=castles.find(c=>{
    const ccx=Math.round(c.nx*W),ccy=Math.round(c.ny*H);
    return Math.hypot(cx-ccx,cy-ccy)<R;
  });
  if(hit) openCastlePanel(hit);
  else closeCastlePanel();
}

function openCastlePanel(c){
  activeCastlePanel=c;
  const teamEmoji={red:'🔴',blue:'🔵',green:'🟢',gold:'🟡',zombie:'💀'}[c.team]||'🏰';
  const lv=c.level||1;
  const r=RES[c.team]||{};
  const workerCount=bots.filter(b=>b.team===c.team&&!b.isKnight).length;
  const knightCount=bots.filter(b=>b.team===c.team&&b.isKnight).length;
  const canUpgrade=lv<5;
  const nextName=canUpgrade?(LEVEL_DATA[lv+1]?.name||''):'';
  document.getElementById('cp-title').textContent=teamEmoji+' '+TRAITS[c.team]?.label+' · '+(LEVEL_DATA[lv]?.name||'Замок')+' ур.'+lv;
  const rows=document.getElementById('cp-rows');
  rows.innerHTML=`
    <div class="cp-row"><span>👥 Жители</span><b>${workerCount}</b><button class="cp-btn" onclick="cpAdd('workers')">+10</button></div>
    <div class="cp-row"><span>⚔️ Рыцари</span><b>${knightCount}</b><button class="cp-btn" onclick="cpAdd('knights')">+5</button></div>
    <div class="cp-row"><span>🪵 Дерево</span><b>${r.wood||0}</b><button class="cp-btn" onclick="cpAdd('wood')">+100</button></div>
    <div class="cp-row"><span>🪨 Камень</span><b>${r.stone||0}</b><button class="cp-btn" onclick="cpAdd('stone')">+100</button></div>
    <div class="cp-row"><span>⚙️ Железо</span><b>${r.iron||0}</b><button class="cp-btn" onclick="cpAdd('iron')">+100</button></div>
    <div class="cp-row"><span>⬆️ Уровень ${lv}/5</span><b></b><button class="cp-btn upgrade" onclick="cpUpgrade()" ${canUpgrade?'':'disabled'}>${canUpgrade?'→ '+nextName:'Максимум'}</button></div>
  `;
  document.getElementById('castle-panel').classList.add('open');
}

function closeCastlePanel(){
  activeCastlePanel=null;
  document.getElementById('castle-panel').classList.remove('open');
}

function cpAdd(type){
  if(!activeCastlePanel) return;
  const c=activeCastlePanel;
  const cx=Math.round(c.nx*W),cy=Math.round(c.ny*H);
  if(type==='workers'){
    let spawned=0;
    for(let dy=-20;dy<=20&&spawned<10;dy++) for(let dx=-20;dx<=20&&spawned<10;dx++){
      const nx2=cx+dx,ny2=cy+dy;
      if(nx2<0||ny2<0||nx2>=W||ny2>=H) continue;
      if(isLand(nx2,ny2)&&Math.random()<0.18){
        bots.push({x:nx2,y:ny2,team:c.team,hp:5,maxhp:5,
          timer:Math.floor(Math.random()*20),isKnight:false,
          carrying:null,res:0,homeX:cx,homeY:cy,state:'seek'});
        spawned++;
      }
    }
  } else if(type==='knights'){
    let spawned=0;
    for(let dy=-15;dy<=15&&spawned<5;dy++) for(let dx=-15;dx<=15&&spawned<5;dx++){
      const nx2=cx+dx,ny2=cy+dy;
      if(nx2<0||ny2<0||nx2>=W||ny2>=H) continue;
      if(isLand(nx2,ny2)&&Math.random()<0.28){
        bots.push({x:nx2,y:ny2,team:c.team,hp:20,maxhp:20,
          timer:Math.floor(Math.random()*20),isKnight:true,
          carrying:null,res:0,homeX:cx,homeY:cy,state:'seek'});
        spawned++;
      }
    }
  } else {
    const r=RES[c.team];
    if(r) r[type]=(r[type]||0)+100;
  }
  openCastlePanel(c);
}

function cpUpgrade(){
  if(!activeCastlePanel) return;
  const c=activeCastlePanel;
  const lv=c.level||1;
  if(lv>=5) return;
  c.level=lv+1;
  c.xp=LEVEL_XP[c.level]||0;
  logEvent('⬆️ '+({red:'🔴',blue:'🔵',green:'🟢',gold:'🟡'}[c.team]||'')+'→ '+LEVEL_DATA[c.level].name);
  playSound('level');
  openCastlePanel(c);
}

// ── TOOLS UI ──────────────────────────────────────────────────
function getToolIcon(id){
  const icons={
    water:'🌊',sand:'🏖',grass:'🌿',jungle:'🌴',desert:'🏜',
    rock:'🪨',mountain:'⛰',snow:'❄️',lava:'🌋',
    tree:'🌳',pine:'🌲',cactus:'🌵',ore:'⛏',gold:'💛',crystal:'💎',
    bomb:'💣',fire:'🔥',meteor:'☄️',flood:'💧',plague:'☠️',lightning:'⚡',
    house:'🏠',wall:'🧱',gate:'🚪',
    vil_red:'🔴',vil_blue:'🔵',vil_green:'🟢',vil_gold:'🟡',
  };
  return icons[id]||'❓';
}

function updateBrushVisibility(){
  // Show brush slider only for brush-type terrain tools (not sprites/oneshots)
  const isBrush=curTool&&!SPRITE_TOOLS.has(curTool)&&!ONESHOT_TOOLS.has(curTool)&&!curTool.startsWith('vil_');
  document.getElementById('brush-row').style.display=isBrush?'flex':'none';
}

function renderTools(){
  const box=document.getElementById('tbx');box.innerHTML='';
  TABS[curTab].forEach(t=>{
    const el=document.createElement('div');
    el.className='tl'+(curTool===t.id?' active':'');
    const icon=getToolIcon(t.id);
    el.innerHTML=`<div class="td" style="background:${t.color};display:flex;align-items:center;justify-content:center;font-size:13px">${icon}</div><span class="tn">${t.label}</span>`;
    const selectTool=()=>{
      // Tap active tool again → deselect (back to pan/hand mode)
      curTool=curTool===t.id?null:t.id;
      renderTools();
      updateBrushVisibility();
    };
    // stopPropagation prevents the wrap touchstart from also firing
    // passive:false + preventDefault stops the click from also firing after touchstart
    el.addEventListener('touchstart',ev=>{ev.stopPropagation();ev.preventDefault();selectTool();},{passive:false});
    el.addEventListener('click',selectTool); // handles mouse-only (no touch)
    box.appendChild(el);
  });
}

function swTab(i){
  curTab=i;
  curTool=null; // switching tabs returns to pan mode — user picks a tool explicitly
  document.querySelectorAll('.tab').forEach((el,j)=>el.classList.toggle('active',j===i));
  renderTools();
  updateBrushVisibility();
}

function showHint(txt){const h=document.getElementById('hint');h.textContent=txt;h.style.opacity='1';clearTimeout(h._t);h._t=setTimeout(()=>h.style.opacity='0',1500);}

document.getElementById('bsl').addEventListener('input',function(){brushSz=parseInt(this.value);document.getElementById('bval').textContent=brushSz;});

// ── SPEED CONTROL ─────────────────────────────────────────────
function cycleSpeed(){
  gameSpeed=(gameSpeed+1)%3;
  const btn=document.getElementById('speed-btn');
  if(btn) btn.textContent=['⏸','▶️','⏩'][gameSpeed];
}

// ── FACTION SELECTOR ──────────────────────────────────────────
function setPlayerTeam(team){
  playerTeam=playerTeam===team?null:team;
  document.querySelectorAll('.fbtn').forEach(b=>{
    b.classList.toggle('selected',b.dataset.team===playerTeam);
  });
  showHint(playerTeam?'👑 Ваша фракция: '+playerTeam:'👤 Наблюдатель');
}

// ── SAVE / LOAD ───────────────────────────────────────────────
function saveGame(){
  try{
    const data={
      mapSeed,useEurope,dayTime,dayCount,weather,playerTeam,
      castles:castles.map(c=>({nx:c.nx,ny:c.ny,team:c.team,power:c.power,radius:c.radius,level:c.level||1,xp:c.xp||0})),
      RES:JSON.parse(JSON.stringify(RES)),
      bots:bots.slice(0,80).map(b=>({x:b.x,y:b.y,team:b.team,hp:b.hp,maxhp:b.maxhp,isKnight:b.isKnight,state:b.state==='zombie'?'zombie':'seek'}))
    };
    localStorage.setItem('castle_save_v2',JSON.stringify(data));
    showHint('💾 Сохранено!');
    playSound('place');
  }catch(e){showHint('❌ Ошибка сохранения');}
}

function loadGame(){
  const raw=localStorage.getItem('castle_save_v2');
  if(!raw){showHint('📂 Нет сохранения');return;}
  try{
    const data=JSON.parse(raw);
    cancelAnimationFrame(rafId);
    mapSeed=data.mapSeed||0;
    useEurope=data.useEurope!==false;
    dayTime=data.dayTime||0;
    dayCount=data.dayCount||0;
    weather=data.weather||'clear';
    playerTeam=data.playerTeam||null;
    if(data.RES) Object.assign(RES,data.RES);
    landMask=null;mapCache=null;
    initBase();renderTools();
    document.getElementById('loading').style.display='flex';
    document.getElementById('loading-bar').style.width='0%';
    buildMask(()=>{
      buildMapCache();
      castles=[];
      (data.castles||[]).forEach(cd=>{
        const c={nx:cd.nx,ny:cd.ny,team:cd.team,power:cd.power||50,radius:cd.radius||8,
          cells:[],attackCooldown:0,craftTimer:0,level:cd.level||1,xp:cd.xp||0};
        computeTerritory(c);castles.push(c);
      });
      rebuildTerritories();
      bots=[];
      (data.bots||[]).forEach(bd=>{
        if(!isLand(bd.x,bd.y)) return;
        const castle=castles.find(c=>c.team===bd.team);
        bots.push({x:bd.x,y:bd.y,team:bd.team,hp:bd.hp||5,maxhp:bd.maxhp||5,
          timer:Math.floor(Math.random()*20),isKnight:bd.isKnight||false,
          carrying:null,res:0,
          homeX:castle?Math.round(castle.nx*W):bd.x,
          homeY:castle?Math.round(castle.ny*H):bd.y,
          state:bd.state||'seek'});
      });
      document.getElementById('loading').style.display='none';
      document.querySelectorAll('.fbtn').forEach(b=>b.classList.toggle('selected',b.dataset.team===playerTeam));
      rafId=requestAnimationFrame(loop);
      showHint('📂 Загружено!');
    });
  }catch(e){showHint('❌ Ошибка загрузки');}
}

// ── WORLD ACTIONS ─────────────────────────────────────────────
function resetWorld(){
  cancelAnimationFrame(rafId);
  useEurope=false;
  mapSeed=Math.floor(Math.random()*10000);
  landMask=null;mapCache=null;
  initBase();renderTools();updateBrushVisibility();
  const vo=document.getElementById('victory-overlay');
  if(vo) vo.style.display='none';
  document.getElementById('loading').style.display='flex';
  document.getElementById('loading-bar').style.width='0%';
  buildMask(()=>{buildMapCache();document.getElementById('loading').style.display='none';rafId=requestAnimationFrame(loop);});
}

function loadEurope(){
  cancelAnimationFrame(rafId);
  useEurope=true;
  landMask=null;mapCache=null;
  initBase();renderTools();updateBrushVisibility();
  const vo=document.getElementById('victory-overlay');
  if(vo) vo.style.display='none';
  document.getElementById('loading').style.display='flex';
  document.getElementById('loading-bar').style.width='0%';
  buildMask(()=>{buildMapCache();document.getElementById('loading').style.display='none';rafId=requestAnimationFrame(loop);});
}

// ── START ─────────────────────────────────────────────────────
window.addEventListener('load',function(){
  initBase();
  renderTools();
  updateBrushVisibility();
  setupEvents();
  document.getElementById('loading').style.display='flex';
  document.getElementById('loading-bar').style.width='0%';
  buildMask(()=>{
    buildMapCache();
    document.getElementById('loading').style.display='none';
    rafId=requestAnimationFrame(loop);
  });
});

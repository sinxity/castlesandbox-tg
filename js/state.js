// ── STATE ─────────────────────────────────────────────────────
let W=0,H=0,canvas,ctx,wrap;
let landMask=null,mapCache=null,terrCanvas=null,terrCtx=null;
let grid=[],bots=[],castles=[],armies=[],workers=[],tick=0,evts=[];
// Resources per team
const RES={red:{wood:0,stone:0,iron:0,swords:0,armor:0,knights:0},
           blue:{wood:0,stone:0,iron:0,swords:0,armor:0,knights:0},
           green:{wood:0,stone:0,iron:0,swords:0,armor:0,knights:0},
           gold:{wood:0,stone:0,iron:0,swords:0,armor:0,knights:0},
           zombie:{wood:0,stone:0,iron:0,swords:0,armor:0,knights:0}};
// Active raids: {team, knights[], tx, ty, targetTeam, phase, loot, battleTimer}
let raids=[];
let fireCells=new Set(); // track active fire cells for fast iteration
// Defeated castles waiting to rebuild: {castle, timer}
let defeated=[];
// Loot animations: {x,y,team,type,age}
let lootAnims=[];
// Particles: {x,y,vx,vy,r,g,b,age,maxAge,size}
let particles=[];
// Render optimization
let terrainDirty=true; // redraw terrain only when changed
let terrainCache=null; // offscreen canvas for terrain+sprites
let spriteDirty=true;
// Day/night cycle
let dayTime=0; // 0=noon, 0.5=midnight, cycles 0..1
let daySpeed=0.0002; // full cycle ~83 seconds
let curTab=0,curTool='water',brushSz=4;
let isDrawing=false,drawStart=null;
let rafId=null;
// Map mode: true = Europe polygon map, false = random noise map
let useEurope=true;
let mapSeed=0; // seed for random map generation

// ── GAME FEATURES ─────────────────────────────────────────────
let playerTeam=null;       // which faction the player controls
let gameSpeed=1;           // 0=pause, 1=normal, 2=fast
let weather='clear';       // 'clear','rain','storm'
let weatherTimer=600;      // ticks until next weather change
let plagueCells=new Set(); // active plague cells for fast iteration
let dayCount=0;            // how many full day/night cycles elapsed
let zombieWaveTimer=0;     // unused (handled by tick%600 in loop)
let gameOver=false;
let gameOverTeam=null;
let minimapCanvas=null;    // cached DOM reference to minimap element
let soundEnabled=true;

// ── VIEWPORT / ZOOM ───────────────────────────────────────────
let camX=0,camY=0,camZ=1;
let targetZ=1; // smooth zoom target
const MIN_Z=0.25,MAX_Z=6;
let pinchStartDist=0,pinchStartZ=1,lastPinchDist=0;
let panStartX=0,panStartY=0,panStartCamX=0,panStartCamY=0;
let isPinching=false,isPanMode=false;
let zoomTimer=null;
let panVelX=0,panVelY=0,lastPanX=0,lastPanY=0; // pan momentum (reserved)

function clampCam(){
  if(!canvas) return;
  const vw=wrap.clientWidth,vh=wrap.clientHeight;
  const maxX=Math.max(0,W*camZ-vw);
  const maxY=Math.max(0,H*camZ-vh);
  camX=Math.max(0,Math.min(camX,maxX));
  camY=Math.max(0,Math.min(camY,maxY));
}

function applyTransform(){
  canvas.style.transformOrigin='0 0';
  canvas.style.transform=`translate(${-camX}px,${-camY}px) scale(${camZ})`;
}

// Show zoom % indicator briefly on the screen
function showZoomIndicator(){
  const el=document.getElementById('zoom-indicator');
  if(!el) return;
  el.textContent=Math.round(camZ*100)+'%';
  el.style.opacity='1';
  clearTimeout(zoomTimer);
  zoomTimer=setTimeout(()=>{el.style.opacity='0';},1200);
}

// Screen → canvas coords (accounts for wrap offset + zoom + pan)
function screenToCanvas(sx,sy){
  const rect=wrap.getBoundingClientRect();
  const rx=sx-rect.left;
  const ry=sy-rect.top;
  return{x:(rx+camX)/camZ, y:(ry+camY)/camZ};
}

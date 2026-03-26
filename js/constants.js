// ── NOISE / MATH UTILS ────────────────────────────────────────
function hash(x,y){let h=(x*374761393+y*668265263);h=(h^(h>>13))*1274126177;return((h^(h>>16))&0xffff)/0xffff;}
function noise(x,y){const ix=Math.floor(x),iy=Math.floor(y),fx=x-ix,fy=y-iy,u=fx*fx*(3-2*fx),v=fy*fy*(3-2*fy);return hash(ix,iy)*(1-u)*(1-v)+hash(ix+1,iy)*u*(1-v)+hash(ix,iy+1)*(1-u)*v+hash(ix+1,iy+1)*u*v;}

function polyContains(poly,px,py,W,H){
  let inside=false;
  for(let i=0,j=poly.length-1;i<poly.length;j=i++){
    const xi=poly[i][0]*W,yi=poly[i][1]*H,xj=poly[j][0]*W,yj=poly[j][1]*H;
    if((yi>py)!==(yj>py)&&px<(xj-xi)*(py-yi)/(yj-yi)+xi) inside=!inside;
  }
  return inside;
}
function segDist(px,py,ax,ay,bx,by){
  const dx=bx-ax,dy=by-ay,l2=dx*dx+dy*dy;
  if(l2===0) return Math.hypot(px-ax,py-ay);
  const t=Math.max(0,Math.min(1,((px-ax)*dx+(py-ay)*dy)/l2));
  return Math.hypot(px-(ax+t*dx),py-(ay+t*dy));
}
function getMtn(nx,ny,W){
  let mx=0;
  for(const m of MTNS) for(let i=0;i<m.p.length-1;i++){
    const d=segDist(nx,ny,m.p[i][0],m.p[i][1],m.p[i+1][0],m.p[i+1][1]);
    const s=Math.max(0,1-d/m.w);if(s>mx)mx=s;
  }
  return mx;
}
function getFst(nx,ny,W){
  let mx=0;
  for(const f of FORESTS){
    // Domain warp: displace sample with multi-scale noise for organic edges
    const r=f.r;
    const wx=(noise(nx*12+f.c[0]*77,ny*12+f.c[1]*77)-0.5)*r*1.1;
    const wy=(noise(ny*12+f.c[0]*77+33,nx*12+f.c[1]*77+33)-0.5)*r*1.1;
    const wx2=(noise(nx*28+f.c[0]*133,ny*28+f.c[1]*133)-0.5)*r*0.45;
    const wy2=(noise(ny*28+f.c[1]*133+7,nx*28+f.c[0]*133+7)-0.5)*r*0.45;
    const d=Math.hypot((nx+wx+wx2-f.c[0])*W,(ny+wy+wy2-f.c[1])*W);
    const s=Math.max(0,1-d/(f.r*W));if(s>mx)mx=s;
  }
  return mx;
}
function getHill(nx,ny){
  let mx=0;
  for(const h of HILLS){
    const r=h.r;
    const wx=(noise(nx*10+h.c[0]*88,ny*10+h.c[1]*88)-0.5)*r*1.0;
    const wy=(noise(ny*10+h.c[0]*88+22,nx*10+h.c[1]*88+22)-0.5)*r*1.0;
    const wx2=(noise(nx*24+h.c[0]*155,ny*24+h.c[1]*155)-0.5)*r*0.4;
    const wy2=(noise(ny*24+h.c[1]*155+9,nx*24+h.c[0]*155+9)-0.5)*r*0.4;
    const d=Math.hypot(nx+wx+wx2-h.c[0],ny+wy+wy2-h.c[1]);
    const s=Math.max(0,1-d/h.r);if(s>mx)mx=s;
  }
  return mx;
}
function getDesert(nx,ny){
  let mx=0;
  for(const d of DESERTS){
    const r=d.r;
    const wx=(noise(nx*9+d.c[0]*66,ny*9+d.c[1]*66)-0.5)*r*0.9;
    const wy=(noise(ny*9+d.c[0]*66+15,nx*9+d.c[1]*66+15)-0.5)*r*0.9;
    const dist=Math.hypot(nx+wx-d.c[0],ny+wy-d.c[1]);
    const s=Math.max(0,1-dist/d.r);if(s>mx)mx=s;
  }
  return mx;
}
function isInLake(nx,ny){
  for(const l of LAKES){
    const d=Math.hypot(nx-l.c[0],ny-l.c[1]);
    if(d<l.r) return true;
  }
  return false;
}

// ── CONSTANTS ─────────────────────────────────────────────────
const TC={red:'#e74c3c',blue:'#3498db',green:'#2ecc71',gold:'#f1c40f',zombie:'#8a0a14'};
// Castle level system
const LEVEL_XP=[0,100,250,500,900,1500]; // XP needed for each level
const LEVEL_DATA=[
  {}, // level 0 unused
  {name:'Деревня',   workers:5,  maxPop:15, maxKnights:0,  canBuild:false, canTrade:false},
  {name:'Поселение', workers:10, maxPop:25, maxKnights:5,  canBuild:true,  canTrade:false},
  {name:'Город',     workers:15, maxPop:40, maxKnights:10, canBuild:true,  canTrade:false},
  {name:'Замок',     workers:20, maxPop:60, maxKnights:20, canBuild:true,  canTrade:true},
  {name:'Цитадель',  workers:30, maxPop:100,maxKnights:40, canBuild:true,  canTrade:true},
];

// Castle level colors (wall material changes)
const LEVEL_COLORS={
  wall:  ['#886644','#777788','#8888aa','#9999bb','#aaaacc'],
  wallHi:['#aa8866','#9999aa','#aaaacc','#bbbbdd','#ccccee'],
  keep:  ['#664422','#606080','#7070a0','#8080b0','#9090cc'],
};

// Faction traits: {buildSpeed, harvestMult, fightMult, growMult}
const TRAITS={
  red: {buildSpeed:0,harvestMult:0.8,fightMult:2.0,growMult:0.8,label:'Воины'},
  blue:{buildSpeed:3,harvestMult:1.0,fightMult:1.0,growMult:1.2,label:'Строители'},
  green:{buildSpeed:0,harvestMult:2.0,fightMult:0.8,growMult:1.5,label:'Добытчики'},
  gold:{buildSpeed:1,harvestMult:1.2,fightMult:0.9,growMult:1.8,label:'Торговцы'},
};
const TCRGB={red:'231,76,60',blue:'52,152,219',green:'46,204,113',gold:'241,196,15',zombie:'138,10,20'};
const WALKABLE=new Set(['grass','sand','snow','burned','desert','jungle','plague','hill']);
const FLAMMABLE=new Set(['tree','pine','grass','jungle','house','gate']);
const RESOURCE=new Set(['tree','pine','ore','gold','crystal','cactus']);
const SOLID=new Set(['rock','mountain','water','lava','wall']);
const BUILDINGS=new Set(['house','wall','gate','vil_red','vil_blue','vil_green','vil_gold','smithy','market','barracks','farm','tower']);
const SPECIAL_BUILDINGS=new Set(['smithy','market','barracks','farm','tower']);
const D4=[[-1,0],[1,0],[0,-1],[0,1]];
const D8=[[-1,0],[1,0],[0,-1],[0,1],[-1,-1],[1,-1],[-1,1],[1,1]];

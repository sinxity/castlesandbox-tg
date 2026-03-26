// ── PARTICLES ─────────────────────────────────────────────────
function spawnExplosion(cx,cy,count,r,g,b){
  for(let i=0;i<count;i++){
    const angle=Math.random()*Math.PI*2;
    const speed=1+Math.random()*4;
    particles.push({x:cx,y:cy,
      vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,
      r,g,b,age:0,maxAge:20+Math.floor(Math.random()*20),
      size:1+Math.random()*2});
  }
}

function spawnFireParticle(cx,cy){
  const colors=[[255,140,0],[255,80,0],[255,220,0],[200,50,0]];
  const c=colors[Math.floor(Math.random()*colors.length)];
  particles.push({x:cx+Math.random()*4-2,y:cy,
    vx:(Math.random()-0.5)*0.8,vy:-0.5-Math.random()*1.5,
    r:c[0],g:c[1],b:c[2],age:0,maxAge:12+Math.floor(Math.random()*8),
    size:1+Math.random()});
}

function updateParticles(){
  if(particles.length>200) particles.splice(0,particles.length-200);
  particles=particles.filter(p=>{
    p.age++;
    p.x+=p.vx;p.y+=p.vy;
    p.vy+=0.08; // gravity
    const alpha=Math.max(0,1-p.age/p.maxAge);
    ctx.fillStyle=`rgba(${p.r},${p.g},${p.b},${alpha.toFixed(2)})`;
    ctx.fillRect(Math.round(p.x),Math.round(p.y),Math.ceil(p.size),Math.ceil(p.size));
    return p.age<p.maxAge;
  });
}

// ── DRAW ENTITIES ─────────────────────────────────────────────
function drawCastle(c){
  const cx=Math.round(c.nx*W),cy=Math.round(c.ny*H),tc=TC[c.team]||'#888';
  const isDefeated=defeated.find(d=>d.castle===c);
  const lv=Math.max(1,Math.min(5,c.level||1));
  const li=lv-1;
  const wallCol=isDefeated?'#554444':LEVEL_COLORS.wall[li];
  const wallHi=isDefeated?'#665555':LEVEL_COLORS.wallHi[li];
  const keepCol=isDefeated?'#553333':LEVEL_COLORS.keep[li];
  const S=12+lv*4; // lv1=16, lv2=20, lv3=24, lv4=28, lv5=32

  // Outer ground shadow / moat
  ctx.fillStyle='rgba(0,0,0,0.35)';
  ctx.fillRect(cx-S-6,cy-S-6,S*2+12,S*2+12);
  ctx.fillStyle=isDefeated?'rgba(20,10,10,0.6)':'rgba(10,25,60,0.55)';
  ctx.fillRect(cx-S-5,cy-S-5,S*2+10,5);
  ctx.fillRect(cx-S-5,cy+S,S*2+10,5);
  ctx.fillRect(cx-S-5,cy-S-5,5,S*2+10);
  ctx.fillRect(cx+S,cy-S-5,5,S*2+10);

  // Cobblestone courtyard ground
  ctx.fillStyle=isDefeated?'#443333':'#5a4a38';
  ctx.fillRect(cx-S+3,cy-S+3,S*2-6,S*2-6);
  // Courtyard grid lines
  ctx.fillStyle='rgba(0,0,0,0.18)';
  const cg=Math.max(4,Math.round(S/4));
  for(let gi=cx-S+3;gi<cx+S-3;gi+=cg) ctx.fillRect(gi,cy-S+3,1,S*2-6);
  for(let gi=cy-S+3;gi<cy+S-3;gi+=cg) ctx.fillRect(cx-S+3,gi,S*2-6,1);

  // Outer walls
  ctx.fillStyle=wallCol;
  ctx.fillRect(cx-S,cy-S,S*2,4);
  ctx.fillRect(cx-S,cy+S-4,S*2,4);
  ctx.fillRect(cx-S,cy-S,4,S*2);
  ctx.fillRect(cx+S-4,cy-S,4,S*2);
  // Wall inner face (slightly darker)
  ctx.fillStyle='rgba(0,0,0,0.2)';
  ctx.fillRect(cx-S+4,cy-S+2,S*2-8,2);
  ctx.fillRect(cx-S+2,cy-S+4,2,S*2-8);
  // Wall highlight (top/left edges catch light)
  ctx.fillStyle=wallHi;
  ctx.fillRect(cx-S,cy-S,S*2,1);
  ctx.fillRect(cx-S,cy-S,1,S*2);

  // Crenellations
  ctx.fillStyle=wallHi;
  const crenStep=Math.max(4,6-lv);
  for(let i=cx-S;i<cx+S;i+=crenStep){
    ctx.fillRect(i,cy-S-4,3,5);
    ctx.fillStyle='rgba(0,0,0,0.3)';ctx.fillRect(i+2,cy-S-4,1,5);
    ctx.fillStyle=wallHi;
  }
  for(let i=cy-S;i<cy+S;i+=crenStep){
    ctx.fillRect(cx-S-4,i,5,3);
    ctx.fillRect(cx+S-1,i,5,3);
    ctx.fillStyle='rgba(0,0,0,0.2)';
    ctx.fillRect(cx-S-4,i+2,5,1);ctx.fillRect(cx+S-1,i+2,5,1);
    ctx.fillStyle=wallHi;
  }

  // Corner towers — bigger and more detailed
  const tw=7+lv,th=9+lv;
  const toff=S-2;
  [[-toff,-toff],[toff-tw+2,-toff],[-toff,toff-th+2],[toff-tw+2,toff-th+2]].forEach(([tx2,ty2])=>{
    // Tower body
    ctx.fillStyle=isDefeated?'#664444':'#9999aa';
    ctx.fillRect(cx+tx2,cy+ty2,tw,th);
    // Top highlight
    ctx.fillStyle=isDefeated?'#775555':wallHi;
    ctx.fillRect(cx+tx2,cy+ty2,tw,2);
    // Right shadow
    ctx.fillStyle='rgba(0,0,0,0.25)';
    ctx.fillRect(cx+tx2+tw-1,cy+ty2,1,th);
    ctx.fillRect(cx+tx2,cy+ty2+th-1,tw,1);
    // Arrow slit
    ctx.fillStyle='rgba(0,0,0,0.7)';
    ctx.fillRect(cx+tx2+Math.floor(tw/2)-1,cy+ty2+2,2,Math.floor(th*0.55));
    // Crenellations on tower top
    if(!isDefeated){
      ctx.fillStyle=wallHi;
      ctx.fillRect(cx+tx2,cy+ty2-3,2,3);
      ctx.fillRect(cx+tx2+tw-2,cy+ty2-3,2,3);
    }
    // Team flag
    if(!isDefeated){
      ctx.fillStyle='rgba(0,0,0,0.6)';ctx.fillRect(cx+tx2+1,cy+ty2-6,1,5);
      ctx.fillStyle=tc;ctx.fillRect(cx+tx2+2,cy+ty2-6,4,3);
      ctx.fillStyle='rgba(255,255,255,0.3)';ctx.fillRect(cx+tx2+2,cy+ty2-6,2,1);
    }
  });

  // Keep / donjon — center structure
  const ks=5+lv;
  // Keep shadow
  ctx.fillStyle='rgba(0,0,0,0.3)';ctx.fillRect(cx-ks+2,cy-ks+2,ks*2+2,ks*2+2);
  // Keep walls
  ctx.fillStyle=keepCol;ctx.fillRect(cx-ks,cy-ks,ks*2,ks*2);
  // Keep inner arch/door shadow
  ctx.fillStyle=isDefeated?'#442222':'#3a3a6a';
  ctx.fillRect(cx-ks+2,cy,ks*2-4,ks);
  // Keep door
  ctx.fillStyle='#0d0a05';ctx.fillRect(cx-2,cy+2,5,ks-1);
  ctx.fillStyle='rgba(180,140,60,0.6)';ctx.fillRect(cx+1,cy+Math.floor(ks*0.5),1,2); // door handle
  // Keep windows (arrow slits)
  ctx.fillStyle='rgba(150,200,255,0.5)';
  ctx.fillRect(cx-ks+2,cy-ks+3,2,3);ctx.fillRect(cx+ks-4,cy-ks+3,2,3);
  if(lv>=3){
    ctx.fillRect(cx-ks+2,cy-3,2,3);ctx.fillRect(cx+ks-4,cy-3,2,3);
  }
  // Keep top highlight
  ctx.fillStyle=isDefeated?'#553333':wallHi;ctx.fillRect(cx-ks,cy-ks,ks*2,2);
  ctx.fillRect(cx-ks,cy-ks,1,ks*2);

  // Keep crenellations
  if(!isDefeated){
    ctx.fillStyle=wallHi;
    for(let i=cx-ks;i<cx+ks;i+=3){
      ctx.fillRect(i,cy-ks-3,2,4);
      ctx.fillStyle='rgba(0,0,0,0.2)';ctx.fillRect(i+1,cy-ks-3,1,4);
      ctx.fillStyle=wallHi;
    }
  }

  // Lv4+: outer dry moat / second wall ring
  if(lv>=4&&!isDefeated){
    ctx.fillStyle='rgba(20,40,100,0.3)';
    ctx.fillRect(cx-S-8,cy-S-8,S*2+16,4);
    ctx.fillRect(cx-S-8,cy+S+4,S*2+16,4);
    ctx.fillRect(cx-S-8,cy-S-8,4,S*2+16);
    ctx.fillRect(cx+S+4,cy-S-8,4,S*2+16);
    // Second wall
    ctx.fillStyle=wallCol;ctx.globalAlpha=0.6;
    ctx.fillRect(cx-S-8,cy-S-8,S*2+16,2);
    ctx.fillRect(cx-S-8,cy-S-8,2,S*2+16);
    ctx.globalAlpha=1;
  }

  // Lv5: golden spire on keep
  if(lv>=5&&!isDefeated){
    ctx.fillStyle='#d4ac0d';
    ctx.fillRect(cx-1,cy-ks-8,3,6);
    ctx.fillStyle='#ffe040';ctx.fillRect(cx,cy-ks-8,1,2);
  }

  // Main flag on keep
  if(!isDefeated){
    ctx.fillStyle='rgba(0,0,0,0.65)';ctx.fillRect(cx,cy-ks-10,1,9);
    ctx.fillStyle=tc;ctx.fillRect(cx+1,cy-ks-10,7,4);
    ctx.fillStyle='rgba(255,255,255,0.35)';ctx.fillRect(cx+1,cy-ks-10,3,1);
  } else {
    ctx.fillStyle='#555';ctx.fillRect(cx,cy-ks-7,1,6);
    ctx.fillStyle='#888';ctx.fillRect(cx+1,cy-ks-7,5,3);
  }

  // XP arc
  const xpPct=Math.min(1,(c.xp||0)/LEVEL_XP[Math.min(lv,4)]);
  ctx.beginPath();ctx.arc(cx,cy,S+5,0-Math.PI/2,0-Math.PI/2+Math.PI*2*xpPct);
  ctx.strokeStyle=isDefeated?'rgba(150,50,50,0.5)':tc;
  ctx.lineWidth=2;ctx.stroke();ctx.lineWidth=1;

  // Player faction pulsing glow
  if(playerTeam&&c.team===playerTeam&&!isDefeated){
    const pulse=Math.sin(tick*0.12)*0.5+0.5;
    ctx.beginPath();ctx.arc(cx,cy,S+10,0,Math.PI*2);
    ctx.strokeStyle=`rgba(255,255,255,${(0.2+pulse*0.5).toFixed(2)})`;
    ctx.lineWidth=2;ctx.stroke();ctx.lineWidth=1;
  }

  // Level badge
  const ld=LEVEL_DATA[lv];
  ctx.fillStyle='rgba(0,0,0,0.8)';ctx.fillRect(cx-16,cy+S+4,32,12);
  ctx.fillStyle=tc;ctx.font='bold 7px monospace';ctx.textAlign='center';
  ctx.fillText('Lv'+lv+' '+(ld?ld.name:''),cx,cy+S+13);
  ctx.textAlign='left';

  // Warehouse (resource display)
  if(!isDefeated){
    const wx=cx+S+6,wy=cy-8;
    ctx.fillStyle='rgba(0,0,0,0.3)';ctx.fillRect(wx+1,wy+1,14,12);
    ctx.fillStyle='#8a6a2a';ctx.fillRect(wx,wy,14,12);
    ctx.fillStyle='#aa8a3a';ctx.fillRect(wx,wy,14,3);
    ctx.fillStyle='#3a2010';ctx.fillRect(wx+5,wy+6,4,6);
    ctx.fillStyle='rgba(255,240,180,0.55)';ctx.fillRect(wx+1,wy+4,3,3);
    const r=RES[c.team];
    if(r){
      ctx.fillStyle='rgba(0,0,0,0.7)';ctx.fillRect(wx-2,wy-13,44,12);
      ctx.font='bold 6px monospace';ctx.fillStyle='#aef';ctx.textAlign='left';
      ctx.fillText('W:'+r.wood+' S:'+r.stone+' I:'+r.iron,wx,wy-4);
    }
  }
  ctx.textAlign='left';
}

function drawArmy(a){
  const px=Math.round(a.x*W),py=Math.round(a.y*H);
  ctx.fillStyle=TC[a.team];
  ctx.beginPath();ctx.arc(px,py,5,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='rgba(255,255,255,0.9)';
  ctx.beginPath();ctx.arc(px,py,2,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='rgba(0,0,0,0.5)';ctx.fillRect(px-5,py-8,10,2);
  ctx.fillStyle=TC[a.team];ctx.fillRect(px-5,py-8,Math.round(10*a.hp/a.maxhp),2);
}

function drawBot(b){
  const tc=TC[b.team]||'#888';
  const px=Math.round(b.x),py=Math.round(b.y);
  if(b.isKnight){
    // Knight — armoured pixel figure ~7x10px
    const cx=px-3,cy=py-9;
    ctx.fillStyle='rgba(0,0,0,0.28)';ctx.fillRect(cx+1,py,6,2); // shadow
    // Helmet
    ctx.fillStyle=tc;ctx.fillRect(cx+1,cy,5,4);
    ctx.fillStyle='rgba(0,0,0,0.55)';ctx.fillRect(cx+2,cy+1,3,2); // visor
    ctx.fillStyle='rgba(255,255,255,0.35)';ctx.fillRect(cx+1,cy,2,1); // shine
    // Neck
    ctx.fillStyle='#c09070';ctx.fillRect(cx+2,cy+4,3,1);
    // Armour body
    ctx.fillStyle=tc;ctx.fillRect(cx,cy+5,7,4);
    ctx.fillStyle='rgba(255,255,255,0.22)';ctx.fillRect(cx,cy+5,2,4);
    ctx.fillStyle='rgba(0,0,0,0.28)';ctx.fillRect(cx+5,cy+5,2,4);
    ctx.fillStyle='rgba(0,0,0,0.25)';ctx.fillRect(cx+3,cy+5,1,4); // breastplate line
    // Sword
    ctx.fillStyle='#bbbccc';ctx.fillRect(cx+7,cy+3,1,6);
    ctx.fillStyle='#888899';ctx.fillRect(cx+6,cy+4,2,1);
    // Legs
    ctx.fillStyle='rgba(0,0,0,0.55)';ctx.fillRect(cx+1,cy+9,2,3);ctx.fillRect(cx+4,cy+9,2,3);
    ctx.fillStyle=tc;ctx.fillRect(cx+1,cy+9,1,3);ctx.fillRect(cx+4,cy+9,1,3);
    // HP bar
    if(b.hp<b.maxhp){
      ctx.fillStyle='rgba(0,0,0,0.6)';ctx.fillRect(cx,cy-3,7,2);
      ctx.fillStyle='#e44';ctx.fillRect(cx,cy-3,Math.round(7*b.hp/b.maxhp),2);
    }
  } else {
    // Settler / worker — small villager ~5x9px
    const cx=px-2,cy=py-8;
    ctx.fillStyle='rgba(0,0,0,0.22)';ctx.fillRect(cx,py,5,2); // shadow
    // Head (skin)
    ctx.fillStyle='#e0b882';ctx.fillRect(cx+1,cy,3,3);
    ctx.fillStyle=tc;ctx.fillRect(cx+1,cy,3,1); // hair in team color
    ctx.fillStyle='rgba(0,0,0,0.7)';ctx.fillRect(cx+1,cy+1,1,1);ctx.fillRect(cx+3,cy+1,1,1); // eyes
    // Body (shirt in team color)
    ctx.fillStyle=tc;ctx.fillRect(cx,cy+3,5,4);
    ctx.fillStyle='rgba(255,255,255,0.2)';ctx.fillRect(cx,cy+3,2,4);
    ctx.fillStyle='rgba(0,0,0,0.2)';ctx.fillRect(cx+4,cy+3,1,4);
    // Arms (skin)
    ctx.fillStyle='#e0b882';ctx.fillRect(cx-1,cy+3,1,2);ctx.fillRect(cx+5,cy+3,1,2);
    // Legs / pants
    ctx.fillStyle='#4a3828';ctx.fillRect(cx+1,cy+7,1,3);ctx.fillRect(cx+3,cy+7,1,3);
  }
}

// ── TERRAIN DITHERING ─────────────────────────────────────────
// Color lookup for painted grid cells
const GCOL={water:'#1a6bb5',sand:'#c8a84b',grass:'#3d6e2a',jungle:'#1a6a10',
  desert:'#d4a055',rock:'#666676',mountain:'#8a8a9a',snow:'#dde0f0',lava:'#cc3300',
  tree:'#235a14',pine:'#1a4a0a',cactus:'#4a8a30',ore:'#7a4010',gold:'#e6b800',
  crystal:'#6699cc',fire:'#ff4400',burned:'#2a2a2a',plague:'#446611',
  house:'#a0522d',wall:'#888899',gate:'#665533',
  vil_red:'#c0392b',vil_blue:'#2471a3',vil_green:'#1e8449',vil_gold:'#d4ac0d'};

const DITHER_PAL={
  water:[
    [13,42,88],[16,55,110],[20,72,138],
    [18,65,125],[13,42,88],[22,80,148],
    [15,50,100],[20,72,138],[13,42,88],
  ],
  sand:[
    [205,172,72],[218,185,82],[230,195,90],
    [210,178,76],[198,165,68],[222,188,85],
    [215,182,80],[205,172,72],[212,180,78],
  ],
  grass:[
    [45,85,30],[58,105,40],[50,92,34],
    [62,110,44],[45,85,30],[55,100,38],
    [48,88,32],[65,115,46],[45,82,28],
  ],
  jungle:[
    [12,72,6],[22,95,14],[18,85,10],
    [25,105,18],[12,70,5],[20,90,12],
    [15,78,8],[28,110,20],[12,72,6],
  ],
  desert:[
    [210,160,72],[225,175,85],[215,168,78],
    [220,170,80],[205,158,70],[228,178,88],
    [212,165,75],[218,172,82],[205,158,70],
  ],
  rock:[
    [82,82,95],[98,98,112],[88,88,102],
    [95,95,108],[78,78,90],[102,102,116],
    [85,85,98],[92,92,105],[80,80,92],
  ],
  mountain:[
    [118,118,136],[135,135,152],[148,148,168],
    [125,125,142],[110,110,128],[142,142,160],
    [130,130,148],[120,120,138],[115,115,132],
  ],
  snow:[
    [218,225,242],[228,235,250],[235,242,255],
    [222,230,246],[215,222,238],[232,240,255],
    [225,232,248],[218,225,242],[230,238,252],
  ],
  lava:[[180,40,0],[200,50,0],[160,30,0],[210,55,0],[185,42,0],[170,35,0],[195,48,0],[165,32,0],[205,52,0]],
  tree:[[25,70,12],[35,88,22],[28,76,16],[38,92,25],[22,65,10],[32,82,18],[26,72,14],[36,90,24],[24,68,12]],
  pine:[[14,52,4],[22,68,8],[18,60,6],[25,72,10],[12,48,3],[20,64,7],[16,56,5],[24,70,9],[13,50,4]],
  burned:[[32,28,28],[42,38,38],[38,34,34],[45,40,40],[30,26,26],[40,36,36],[35,31,31],[44,39,39],[33,29,29]],
  plague:[[32,48,10],[42,60,18],[38,55,14],[45,65,20],[30,44,8],[40,58,16],[35,52,12],[44,62,18],[33,50,11]],
};

function getDitherColor(type,x,y){
  const pal=DITHER_PAL[type];
  if(!pal) return null;
  const tx=(x/3|0)%3;
  const ty=(y/3|0)%3;
  const baseIdx=ty*3+tx;
  const noiseIdx=(hash(x>>1,y>>1)&3);
  const idx=(baseIdx+noiseIdx)%pal.length;
  return pal[idx];
}

function getMountainColor(x,y){
  const isN=grid[y-3]&&grid[y-3][x]&&(grid[y-3][x].type==='mountain'||grid[y-3][x].type==='snow');
  const isS=grid[y+3]&&grid[y+3][x]&&(grid[y+3][x].type==='mountain'||grid[y+3][x].type==='snow');
  const isW=grid[y]&&grid[y][x-3]&&(grid[y][x-3].type==='mountain'||grid[y][x-3].type==='snow');
  const isE=grid[y]&&grid[y][x+3]&&(grid[y][x+3].type==='mountain'||grid[y][x+3].type==='snow');
  let base=[128,128,145];
  if(!isN&&isS){base=[192,195,215];}      // top face — bright
  else if(isN&&!isS){base=[72,72,90];}    // bottom face — deep shadow
  else if(!isW&&isE){base=[162,165,185];} // left face — medium
  else if(isW&&!isE){base=[92,92,110];}   // right face — shadow
  // Cracks: occasional very dark pixels for jagged look
  const crack=(hash(x*3+7,y*3+11)&63)<3;
  if(crack) return[Math.max(0,base[0]-45),Math.max(0,base[1]-45),Math.max(0,base[2]-40)];
  // Bright fleck for rocky highlights
  const fleck=(hash(x*5+3,y*5+9)&127)<2;
  if(fleck) return[Math.min(255,base[0]+50),Math.min(255,base[1]+50),Math.min(255,base[2]+45)];
  const n=(hash(x>>1,y>>1)&15)-8;
  const n2=(hash(x*2+1,y*2+3)&7)-4;
  return[
    Math.max(0,Math.min(255,base[0]+n+n2)),
    Math.max(0,Math.min(255,base[1]+n+n2)),
    Math.max(0,Math.min(255,base[2]+n+n2))
  ];
}

function getSnowColor(x,y){
  const nearRock=
    (grid[y+2]&&grid[y+2][x]&&grid[y+2][x].type==='rock')||
    (grid[y]&&grid[y][x+2]&&grid[y][x+2].type==='rock')||
    (grid[y]&&grid[y][x-2]&&grid[y][x-2].type==='rock');
  const n=(hash(x,y)&7)-4;
  const n2=(hash(x>>1,y>>1)&3)-1;
  if(nearRock){
    const mix=(hash(x*5+1,y*5+3)&7)<4;
    if(mix) return[Math.min(255,170+n),Math.min(255,172+n),Math.min(255,190+n)];
  }
  const pattern=[
    [235,242,255],[245,250,255],[228,238,255],
    [242,248,255],[232,240,255],[240,247,255],
    [225,234,252],[238,245,255],[235,242,255]
  ];
  const tx=(x/3|0)%3,ty=(y/3|0)%3;
  const c=pattern[ty*3+tx];
  return[Math.min(255,c[0]+n+n2),Math.min(255,c[1]+n+n2),Math.min(255,c[2]+n+n2)];
}

// ── TERRAIN RENDER ────────────────────────────────────────────
function renderOverview(){
  for(let y=0;y<H;y+=6) for(let x=0;x<W;x+=6){
    const cell=grid[y]&&grid[y][x];
    if(!cell) continue;
    const t=cell.type;
    let r,g,b;
    if(t==='water'){r=13;g=45;b=95;}
    else if(t==='mountain'||t==='snow'){r=130;g=130;b=148;}
    else if(t==='desert'){r=200;g=165;b=80;}
    else if(t==='sand'){r=180;g=155;b=70;}
    else if(t==='rock'){r=90;g=90;b=105;}
    else{r=48;g=88;b=32;}
    ctx.fillStyle=`rgb(${r},${g},${b})`;
    ctx.fillRect(x,y,6,6);
  }
  castles.forEach(c=>{
    if(!c.cells||c.cells.length<2) return;
    const col=TCRGB[c.team]||'128,128,128';
    for(let i=0;i<c.cells.length;i+=2){
      ctx.fillStyle=`rgba(${col},0.35)`;
      ctx.fillRect(c.cells[i],c.cells[i+1],4,4);
    }
    const cellSet=new Set();
    for(let i=0;i<c.cells.length;i+=2) cellSet.add(c.cells[i+1]*W+c.cells[i]);
    ctx.fillStyle=`rgba(${col},0.95)`;
    for(let i=0;i<c.cells.length;i+=2){
      const x=c.cells[i],y=c.cells[i+1];
      const border=!cellSet.has(y*W+(x-1))||!cellSet.has(y*W+(x+1))||!cellSet.has((y-1)*W+x)||!cellSet.has((y+1)*W+x);
      if(border) ctx.fillRect(x,y,3,3);
    }
  });
  castles.forEach(c=>{
    const cx=Math.round(c.nx*W),cy=Math.round(c.ny*H);
    const tc=TC[c.team];
    ctx.fillStyle='rgba(0,0,0,0.6)';ctx.fillRect(cx-12,cy-8,24,16);
    ctx.fillStyle=tc;ctx.fillRect(cx-11,cy-7,22,14);
    ctx.fillStyle='rgba(0,0,0,0.5)';ctx.fillRect(cx-10,cy-6,20,12);
    ctx.fillStyle='#fff';ctx.font='bold 9px monospace';ctx.textAlign='center';
    ctx.fillText('🏰',cx,cy+4);
    ctx.textAlign='left';
    ctx.fillStyle='rgba(0,0,0,0.7)';ctx.fillRect(cx-15,cy+8,30,10);
    ctx.fillStyle=tc;ctx.font='bold 7px monospace';ctx.textAlign='center';
    ctx.fillText('⚡'+Math.floor(c.power),cx,cy+16);
    ctx.textAlign='left';
  });
  armies.forEach(a=>{
    const px=Math.round(a.x*W),py=Math.round(a.y*H);
    ctx.fillStyle=TC[a.team];
    ctx.beginPath();ctx.arc(px,py,5,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='rgba(0,0,0,0.5)';ctx.fillRect(px-4,py-7,8,4);
    ctx.fillStyle='#fff';ctx.font='5px monospace';ctx.textAlign='center';
    ctx.fillText('⚔',px,py-4);ctx.textAlign='left';
  });
}

function buildTerrainCache(){
  if(!terrainCache){
    terrainCache=document.createElement('canvas');
    terrainCache.width=W;terrainCache.height=H;
  }
  const tc=terrainCache.getContext('2d');
  const img=tc.createImageData(W,H);
  const d=img.data;
  for(let i=0;i<d.length;i+=4){d[i]=10;d[i+1]=28;d[i+2]=55;d[i+3]=255;}

  for(let y=0;y<H;y++) for(let x=0;x<W;x++){
    const gx=x;
    const gy=y;
    const cell=grid[gy]&&grid[gy][gx];
    if(!cell) continue;
    const t=cell.type;
    if(t==='fire'||t==='lava'||t==='water') continue;

    let col;
    if(t==='mountain') col=getMountainColor(x,y);
    else if(t==='snow') col=getSnowColor(x,y);
    else col=getDitherColor(t,x,y);
    if(!col) continue;

    const idx=(y*W+x)*4;
    d[idx]=col[0];d[idx+1]=col[1];d[idx+2]=col[2];d[idx+3]=255;
  }

  const WPS=3;
  for(let y=0;y<H;y+=WPS) for(let x=0;x<W;x+=WPS){
    const cell=grid[y]&&grid[y][x];
    if(!cell||cell.type!=='water') continue;
    let nearLand=false;
    for(let dy2=-6;dy2<=6;dy2+=6) for(let dx2=-6;dx2<=6;dx2+=6){
      const nx2=x+dx2,ny2=y+dy2;
      if(nx2<0||ny2<0||nx2>=W||ny2>=H) continue;
      const nc=grid[ny2]&&grid[ny2][nx2];
      if(nc&&nc.type!=='water'){nearLand=true;break;}
    }
    const n=(hash(x/6,y/6)&3);
    const c=nearLand?
      [[22,85,155],[20,78,148],[24,90,162],[18,72,140]][n]:
      [[13,42,88],[15,48,95],[12,38,82],[14,45,92]][n];
    for(let py=0;py<WPS&&y+py<H;py++) for(let px=0;px<WPS&&x+px<W;px++){
      const idx=((y+py)*W+(x+px))*4;
      d[idx]=c[0];d[idx+1]=c[1];d[idx+2]=c[2];d[idx+3]=255;
    }
  }

  // Terrain edge blending — type-aware darkening/lightening
  for(let y=1;y<H-1;y++) for(let x=1;x<W-1;x++){
    const t=grid[y]&&grid[y][x]?grid[y][x].type:'water';
    if(t==='fire'||t==='lava'||t==='water') continue;
    const tn=grid[y-1]&&grid[y-1][x]?grid[y-1][x].type:t;
    const ts=grid[y+1]&&grid[y+1][x]?grid[y+1][x].type:t;
    const tw=grid[y]&&grid[y][x-1]?grid[y][x-1].type:t;
    const te=grid[y]&&grid[y][x+1]?grid[y][x+1].type:t;
    if(tn===t&&ts===t&&tw===t&&te===t) continue;
    const idx=(y*W+x)*4;
    if(d[idx+3]!==255) continue;
    // Top edge brighter (light hits top), bottom edge darker (shadow)
    const topEdge=(tn!==t);
    const bottomEdge=(ts!==t);
    const adj=topEdge?18:bottomEdge?-25:-18;
    d[idx]=Math.max(0,Math.min(255,d[idx]+adj));
    d[idx+1]=Math.max(0,Math.min(255,d[idx+1]+adj));
    d[idx+2]=Math.max(0,Math.min(255,d[idx+2]+adj));
  }

  tc.putImageData(img,0,0);
  drawSpritesOnCtx(tc);
  terrainDirty=false;
}

function drawSpritesOnCtx(targetCtx){
  const origCtx=ctx;
  ctx=targetCtx;
  drawSprites();
  ctx=origCtx;
}

// ── MINI-MAP ──────────────────────────────────────────────────
function updateMinimap(){
  if(!minimapCanvas) minimapCanvas=document.getElementById('minimap');
  if(!minimapCanvas||!terrainCache) return;
  const mc=minimapCanvas.getContext('2d');
  const mw=minimapCanvas.width,mh=minimapCanvas.height;
  mc.drawImage(terrainCache,0,0,mw,mh);
  if(terrCanvas) mc.drawImage(terrCanvas,0,0,mw,mh);
  // Draw castle markers
  castles.forEach(c=>{
    const mx=Math.floor(c.nx*mw),my=Math.floor(c.ny*mh);
    const isD=defeated.find(d=>d.castle===c);
    mc.fillStyle='rgba(0,0,0,0.7)';mc.fillRect(mx-2,my-2,5,5);
    mc.fillStyle=isD?'#444':(TC[c.team]||'#fff');mc.fillRect(mx-2,my-2,5,5);
    mc.fillStyle='rgba(0,0,0,0.6)';mc.fillRect(mx-1,my-1,3,3);
    mc.fillStyle=isD?'#555':(TC[c.team]||'#fff');mc.fillRect(mx,my,1,1);
  });
  // Viewport rectangle
  if(wrap){
    const vx=Math.max(0,Math.floor(camX*mw/W));
    const vy=Math.max(0,Math.floor(camY*mh/H));
    const vw2=Math.min(mw-vx,Math.ceil(wrap.clientWidth/camZ*mw/W));
    const vh2=Math.min(mh-vy,Math.ceil(wrap.clientHeight/camZ*mh/H));
    mc.strokeStyle='rgba(255,255,255,0.85)';mc.lineWidth=1;
    mc.strokeRect(vx,vy,Math.max(2,vw2),Math.max(2,vh2));
  }
}

// ── MAIN RENDER ───────────────────────────────────────────────
function render(){
  if(terrainDirty||!terrainCache) buildTerrainCache();
  ctx.drawImage(terrainCache,0,0);

  // Animate fire/lava (always dynamic)
  const PS=3;
  for(let y=0;y<H;y+=PS) for(let x=0;x<W;x+=PS){
    const cell=grid[y]&&grid[y][x];if(!cell) continue;
    const t=cell.type;
    if(t==='fire'){
      const f=(tick+x+y)%4;
      ctx.fillStyle=f<2?'#ff6600':f===2?'#ff9900':'#ffcc00';
      ctx.fillRect(x,y,PS,PS);
      if(Math.random()<0.005) spawnFireParticle(x,y);
    } else if(t==='lava'){
      ctx.fillStyle=(tick*2+x+y)%6<3?'#cc3300':'#ff5500';
      ctx.fillRect(x,y,PS,PS);
    }
  }

  ctx.drawImage(terrCanvas,0,0);
  castles.forEach(drawCastle);
  armies.forEach(drawArmy);
  bots.forEach(drawBot);

  // Bug fix: draw loot animations here so they appear on top of entities
  lootAnims.forEach(a=>{
    if(a.type==='clash'){
      ctx.fillStyle='rgba(255,200,0,'+Math.max(0,0.8-a.age/20)+')';
      ctx.font='8px serif';ctx.textAlign='center';
      ctx.fillText('⚔',a.x,a.y-a.age*0.5);
    } else if(a.type==='victory'){
      ctx.fillStyle='rgba(255,215,0,'+Math.max(0,1-a.age/60)+')';
      ctx.font=(8+a.age/4)+'px serif';ctx.textAlign='center';
      ctx.fillText('🏆',a.x,a.y-a.age);
    }
    ctx.textAlign='left';
  });

  updateParticles();
  // Weather rain/storm particles
  if(weather==='rain'||weather==='storm'){
    const drops=weather==='storm'?15:8;
    for(let i=0;i<drops;i++){
      const rx=Math.random()*W,ry=Math.random()*H;
      ctx.fillStyle=weather==='storm'?'rgba(150,185,225,0.55)':'rgba(120,160,210,0.4)';
      ctx.fillRect(rx,ry,1,4);
    }
  }
  updateDayNight();
  if(camZ<0.5) drawZoomedOutBorders();
  if(tick%10===0) updateMinimap();
}

function drawZoomedOutBorders(){
  castles.forEach(c=>{
    if(!c.cells||c.cells.length<2) return;
    const col=TCRGB[c.team]||'128,128,128';
    const cellSet=new Set();
    for(let i=0;i<c.cells.length;i+=2) cellSet.add(c.cells[i+1]*W+c.cells[i]);
    ctx.fillStyle=`rgba(${col},0.9)`;
    for(let i=0;i<c.cells.length;i+=2){
      const x=c.cells[i],y=c.cells[i+1];
      const border=!cellSet.has(y*W+(x-1))||!cellSet.has(y*W+(x+1))||
                   !cellSet.has((y-1)*W+x)||!cellSet.has((y+1)*W+x);
      if(border) ctx.fillRect(x,y,4,4);
    }
    const cx=Math.round(c.nx*W),cy=Math.round(c.ny*H);
    const names={red:'Красные',blue:'Синие',green:'Зелёные',gold:'Золотые',zombie:'Зомби'};
    ctx.fillStyle='rgba(0,0,0,0.7)';ctx.fillRect(cx-20,cy-20,40,10);
    ctx.fillStyle=`rgb(${col})`;ctx.font='bold 8px monospace';ctx.textAlign='center';
    ctx.fillText(names[c.team]||c.team,cx,cy-12);ctx.textAlign='left';
  });
}

function updateDayNight(){
  dayTime=(dayTime+daySpeed)%1;
  const t=dayTime;
  let alpha,r,g,b;
  // Day 55%, sunset 15%, night 10%, dawn 15%, day 5%
  if(t<0.55){alpha=0;r=0;g=0;b=0;}
  else if(t<0.7){
    const p=(t-0.55)/0.15;
    alpha=p*0.5;r=20;g=10;b=40;
  } else if(t<0.8){
    alpha=0.5;r=5;g=5;b=30;
  } else if(t<0.95){
    const p=1-(t-0.8)/0.15;
    alpha=p*0.5;r=20;g=10;b=40;
  } else {alpha=0;r=0;g=0;b=0;}

  if(alpha>0.01){
    ctx.fillStyle=`rgba(${r},${g},${b},${alpha.toFixed(2)})`;
    ctx.fillRect(0,0,W,H);
  }

  if(alpha>0.25){
    const a1=(alpha*0.5).toFixed(2);
    const a2=(alpha*0.25).toFixed(2);
    castles.forEach(c=>{
      const cx=Math.round(c.nx*W),cy=Math.round(c.ny*H);
      ctx.fillStyle=`rgba(255,200,80,${a1})`;
      ctx.beginPath();ctx.arc(cx,cy,20,0,Math.PI*2);ctx.fill();
    });
    ctx.fillStyle=`rgba(255,200,80,${a2})`;
    for(let y=0;y<H;y+=24) for(let x=0;x<W;x+=24){
      const cell=grid[y]&&grid[y][x];
      if(cell&&cell.type==='house') ctx.fillRect(x-2,y-2,26,26);
    }
  }

  if(tick%6===0){
    for(let y=0;y<H;y+=24) for(let x=0;x<W;x+=24){
      const cell=grid[y]&&grid[y][x];
      if(cell&&cell.type==='house'&&Math.random()<0.03){
        particles.push({x:x+3,y:y-1,vx:(Math.random()-0.5)*0.3,vy:-0.4-Math.random()*0.3,
          r:180,g:180,b:185,age:0,maxAge:25+Math.floor(Math.random()*15),size:1.5});
      }
    }
    castles.forEach(c=>{
      if(Math.random()<0.1){
        const cx=Math.round(c.nx*W),cy=Math.round(c.ny*H);
        particles.push({x:cx+Math.random()*6-3,y:cy-12,vx:(Math.random()-0.5)*0.4,vy:-0.6,
          r:150,g:150,b:155,age:0,maxAge:30,size:2});
      }
    });
  }
}

// ── SPRITE LAYER ──────────────────────────────────────────────
function drawSprites(){
  for(let y=0;y<H;y+=16) for(let x=0;x<W;x+=16){
    const cell=grid[y]&&grid[y][x];if(!cell) continue;
    if(cell.type==='house') continue;
    drawSprite(cell.type,x,y,cell.owner);
  }
  for(let y=0;y<H;y+=24) for(let x=0;x<W;x+=24){
    const cell=grid[y]&&grid[y][x];if(!cell) continue;
    if(cell.type==='house') drawHouse(x,y,cell.owner);
  }
}

function drawSprite(t,x,y,owner){
  switch(t){
    case 'tree':   drawTree(x,y); break;
    case 'pine':   drawPine(x,y); break;
    case 'ore':    drawOre(x,y); break;
    case 'gold':   drawGold(x,y); break;
    case 'crystal':drawCrystal(x,y); break;
    case 'cactus': drawCactus(x,y); break;
    case 'house':  drawHouse(x,y,owner); break;
    case 'wall':   drawWall(x,y); break;
    case 'gate':   drawGate(x,y); break;
  }
}

function drawTree(x,y){
  // Shadow
  ctx.fillStyle='rgba(0,0,0,0.25)';ctx.fillRect(x+2,y+13,12,3);
  // Trunk
  ctx.fillStyle='#5a2e0e';ctx.fillRect(x+6,y+9,4,7);
  ctx.fillStyle='#7a4a1e';ctx.fillRect(x+6,y+9,2,7);
  ctx.fillStyle='#5a2e0e';ctx.fillRect(x+3,y+13,3,1);ctx.fillRect(x+10,y+13,3,1);
  // Canopy layers - widest at bottom
  ctx.fillStyle='#143a06';ctx.fillRect(x+0,y+7,16,4);
  ctx.fillStyle='#1a4a08';ctx.fillRect(x+1,y+5,14,4);
  ctx.fillStyle='#1e5a0a';ctx.fillRect(x+2,y+4,12,4);
  ctx.fillStyle='#256810';ctx.fillRect(x+3,y+3,10,4);
  ctx.fillStyle='#2d7818';ctx.fillRect(x+4,y+2,8,3);
  ctx.fillStyle='#388820';ctx.fillRect(x+5,y+1,6,3);
  ctx.fillStyle='#3d9224';ctx.fillRect(x+6,y+0,4,3);
  ctx.fillStyle='#4aaa2a';ctx.fillRect(x+7,y+0,2,2);
  // Highlight pixels
  ctx.fillStyle='#5abb38';ctx.fillRect(x+5,y+1,2,1);ctx.fillRect(x+4,y+3,2,1);
  ctx.fillStyle='rgba(255,255,255,0.18)';ctx.fillRect(x+6,y+0,2,1);
  // Shadow right side
  ctx.fillStyle='rgba(0,0,0,0.2)';ctx.fillRect(x+12,y+5,4,6);
  ctx.fillStyle='rgba(0,0,0,0.15)';ctx.fillRect(x+11,y+3,3,5);
}

function drawPine(x,y){
  // Shadow
  ctx.fillStyle='rgba(0,0,0,0.25)';ctx.fillRect(x+3,y+13,10,2);
  // Trunk
  ctx.fillStyle='#4a2808';ctx.fillRect(x+6,y+10,4,5);
  ctx.fillStyle='#6a3a18';ctx.fillRect(x+6,y+10,2,5);
  // Layers bottom to top
  ctx.fillStyle='#071e03';ctx.fillRect(x+1,y+9,14,3);
  ctx.fillStyle='#0a2804';ctx.fillRect(x+2,y+7,12,3);
  ctx.fillStyle='#0d3205';ctx.fillRect(x+1,y+6,14,3);
  ctx.fillStyle='#103808';ctx.fillRect(x+2,y+4,12,3);
  ctx.fillStyle='#0d3205';ctx.fillRect(x+3,y+3,10,3);
  ctx.fillStyle='#143e08';ctx.fillRect(x+4,y+2,8,3);
  ctx.fillStyle='#1a4a0a';ctx.fillRect(x+5,y+1,6,3);
  ctx.fillStyle='#1e540c';ctx.fillRect(x+6,y+0,4,3);
  // Highlight flecks
  ctx.fillStyle='#226614';ctx.fillRect(x+3,y+6,2,1);ctx.fillRect(x+4,y+3,2,1);
  ctx.fillStyle='rgba(0,0,0,0.25)';ctx.fillRect(x+12,y+7,4,6);ctx.fillRect(x+11,y+4,3,5);
  // Snow cap highlight
  ctx.fillStyle='rgba(220,235,255,0.65)';ctx.fillRect(x+6,y+0,2,1);ctx.fillRect(x+3,y+6,1,1);
  ctx.fillStyle='rgba(255,255,255,0.4)';ctx.fillRect(x+7,y+0,1,1);
}

function drawOre(x,y){
  // Shadow
  ctx.fillStyle='rgba(0,0,0,0.28)';ctx.fillRect(x+2,y+11,12,3);
  // Main rock body - multiple facets
  ctx.fillStyle='#3a3a45';ctx.fillRect(x+2,y+5,12,8);
  ctx.fillStyle='#444450';ctx.fillRect(x+3,y+3,10,8);
  ctx.fillStyle='#505060';ctx.fillRect(x+4,y+2,8,7);
  ctx.fillStyle='#5a5a6a';ctx.fillRect(x+5,y+1,6,6);
  // Left facet dark
  ctx.fillStyle='#333340';ctx.fillRect(x+2,y+6,3,6);
  // Right facet medium
  ctx.fillStyle='#48485a';ctx.fillRect(x+11,y+4,3,7);
  // Ore vein
  ctx.fillStyle='#c05520';ctx.fillRect(x+5,y+5,4,4);
  ctx.fillStyle='#d86830';ctx.fillRect(x+6,y+4,3,3);
  ctx.fillStyle='#e87838';ctx.fillRect(x+7,y+4,2,2);
  ctx.fillStyle='#ff9050';ctx.fillRect(x+8,y+4,1,1);
  ctx.fillStyle='#c05520';ctx.fillRect(x+4,y+7,2,2);
  // Highlight
  ctx.fillStyle='rgba(255,255,255,0.2)';ctx.fillRect(x+5,y+1,3,1);ctx.fillRect(x+4,y+2,2,1);
}

function drawGold(x,y){
  // Shadow
  ctx.fillStyle='rgba(0,0,0,0.25)';ctx.fillRect(x+2,y+11,12,3);
  // Rock body
  ctx.fillStyle='#554400';ctx.fillRect(x+2,y+5,12,8);
  ctx.fillStyle='#665500';ctx.fillRect(x+3,y+3,10,8);
  ctx.fillStyle='#776610';ctx.fillRect(x+4,y+2,8,7);
  // Left dark facet
  ctx.fillStyle='#443300';ctx.fillRect(x+2,y+6,3,6);
  // Gold vein - bright and multi-pixel
  ctx.fillStyle='#e6b800';ctx.fillRect(x+5,y+4,5,5);
  ctx.fillStyle='#f0c800';ctx.fillRect(x+6,y+3,4,5);
  ctx.fillStyle='#ffe040';ctx.fillRect(x+7,y+3,2,3);
  ctx.fillStyle='#fff080';ctx.fillRect(x+7,y+3,1,1);
  ctx.fillStyle='#e6b800';ctx.fillRect(x+4,y+7,2,2);ctx.fillRect(x+9,y+6,2,2);
  // Multi-pixel gleam
  ctx.fillStyle='rgba(255,255,255,0.6)';ctx.fillRect(x+7,y+3,1,1);
  ctx.fillStyle='rgba(255,255,200,0.4)';ctx.fillRect(x+6,y+3,1,1);ctx.fillRect(x+8,y+4,1,1);
  // Rock highlight
  ctx.fillStyle='rgba(255,255,255,0.18)';ctx.fillRect(x+5,y+2,3,1);ctx.fillRect(x+4,y+3,2,1);
}

function drawCrystal(x,y){
  // Shadow
  ctx.fillStyle='rgba(0,0,0,0.22)';ctx.fillRect(x+3,y+13,10,2);
  // Base / cluster
  ctx.fillStyle='#3355aa';ctx.fillRect(x+3,y+7,10,6);
  ctx.fillStyle='#4466bb';ctx.fillRect(x+4,y+6,8,6);
  // Main center shard - tall
  ctx.fillStyle='#3355aa';ctx.fillRect(x+6,y+2,4,12);
  ctx.fillStyle='#5577cc';ctx.fillRect(x+5,y+4,6,8);
  ctx.fillStyle='#7799dd';ctx.fillRect(x+6,y+2,4,7);
  ctx.fillStyle='#88aaee';ctx.fillRect(x+7,y+1,3,5);
  ctx.fillStyle='#aaccff';ctx.fillRect(x+7,y+0,3,3);
  ctx.fillStyle='#ccddff';ctx.fillRect(x+8,y+0,2,2);
  // Left shard
  ctx.fillStyle='#4466bb';ctx.fillRect(x+3,y+5,3,8);
  ctx.fillStyle='#6688cc';ctx.fillRect(x+3,y+4,3,5);
  ctx.fillStyle='#88aaee';ctx.fillRect(x+4,y+3,2,3);
  // Right shard
  ctx.fillStyle='#3a5aaa';ctx.fillRect(x+10,y+6,3,7);
  ctx.fillStyle='#5577bb';ctx.fillRect(x+10,y+5,3,5);
  // Prismatic highlights
  ctx.fillStyle='rgba(255,255,255,0.7)';ctx.fillRect(x+8,y+0,1,1);
  ctx.fillStyle='rgba(150,200,255,0.55)';ctx.fillRect(x+5,y+4,1,2);ctx.fillRect(x+4,y+3,1,1);
  ctx.fillStyle='rgba(180,220,255,0.35)';ctx.fillRect(x+7,y+1,1,2);ctx.fillRect(x+10,y+5,1,2);
}

function drawCactus(x,y){
  // Shadow
  ctx.fillStyle='rgba(0,0,0,0.2)';ctx.fillRect(x+4,y+13,8,2);
  // Main stalk - taller
  ctx.fillStyle='#2a5a10';ctx.fillRect(x+5,y+1,6,13);
  ctx.fillStyle='#3a7a18';ctx.fillRect(x+5,y+1,3,13);
  // Left arm
  ctx.fillStyle='#2a5a10';ctx.fillRect(x+1,y+3,4,4);
  ctx.fillStyle='#3a7a18';ctx.fillRect(x+1,y+3,2,3);
  ctx.fillStyle='#2a5a10';ctx.fillRect(x+1,y+2,4,3);
  // Right arm
  ctx.fillStyle='#2a5a10';ctx.fillRect(x+11,y+5,4,4);
  ctx.fillStyle='#3a7a18';ctx.fillRect(x+11,y+5,2,3);
  ctx.fillStyle='#2a5a10';ctx.fillRect(x+11,y+4,4,3);
  // Spines
  ctx.fillStyle='rgba(255,255,200,0.6)';
  ctx.fillRect(x+4,y+3,1,1);ctx.fillRect(x+11,y+5,1,1);
  ctx.fillRect(x+4,y+8,1,1);ctx.fillRect(x+11,y+9,1,1);
  ctx.fillRect(x+7,y+1,1,1);
  // Highlight
  ctx.fillStyle='rgba(255,255,200,0.35)';ctx.fillRect(x+5,y+1,2,3);
}

function drawHouse(x,y,owner){
  const rc=owner?({
    red:['#882222','#aa2a2a','#cc3333'],
    blue:['#1a4a99','#2255bb','#3366dd'],
    green:['#1a6632','#1e8449','#27ae60'],
    gold:['#8a6010','#b8860b','#d4ac0d'],
  }[owner]||['#1a4a99','#2255bb','#3366dd']):['#554433','#6a5544','#7a6655'];
  // Drop shadow
  ctx.fillStyle='rgba(0,0,0,0.32)';ctx.fillRect(x+3,y+21,20,3);
  // Stone foundation
  ctx.fillStyle='#7a6a58';ctx.fillRect(x,y+14,24,7);
  ctx.fillStyle='#6a5a48';ctx.fillRect(x+21,y+14,3,7);
  // Foundation stone lines
  ctx.fillStyle='rgba(0,0,0,0.2)';
  ctx.fillRect(x,y+17,24,1);ctx.fillRect(x+12,y+14,1,7);
  // Wall body - plaster with wooden beams
  ctx.fillStyle='#d8c096';ctx.fillRect(x+1,y+9,22,6);
  // Wooden beam cross
  ctx.fillStyle='#6a3e10';ctx.fillRect(x+1,y+9,22,1);ctx.fillRect(x+1,y+13,22,1);
  ctx.fillStyle='#6a3e10';ctx.fillRect(x+11,y+9,1,5);
  // Right wall shadow
  ctx.fillStyle='#a89070';ctx.fillRect(x+22,y+9,2,5);
  // Roof - layered shingles
  ctx.fillStyle=rc[0];ctx.fillRect(x,y+5,24,5);
  ctx.fillStyle=rc[1];ctx.fillRect(x+1,y+3,22,4);
  ctx.fillStyle=rc[2];ctx.fillRect(x+3,y+1,18,4);
  ctx.fillStyle=rc[2];ctx.fillRect(x+6,y+0,12,3);
  // Roof shingle lines
  ctx.fillStyle='rgba(0,0,0,0.2)';
  ctx.fillRect(x,y+7,24,1);ctx.fillRect(x+1,y+5,22,1);ctx.fillRect(x+3,y+3,18,1);
  // Roof highlight
  ctx.fillStyle='rgba(255,255,255,0.22)';ctx.fillRect(x+4,y+1,8,1);
  // Roof shadow (right side)
  ctx.fillStyle='rgba(0,0,0,0.22)';ctx.fillRect(x+18,y+0,6,5);
  ctx.fillRect(x+22,y+3,2,7);
  // Eave shadow
  ctx.fillStyle='rgba(0,0,0,0.25)';ctx.fillRect(x,y+9,24,1);
  // Chimney
  ctx.fillStyle='#8a6450';ctx.fillRect(x+17,y-3,5,7);
  ctx.fillStyle='#3a2010';ctx.fillRect(x+17,y-3,5,2);
  ctx.fillStyle='rgba(0,0,0,0.3)';ctx.fillRect(x+21,y-3,1,7);
  // Door
  ctx.fillStyle='#241408';ctx.fillRect(x+10,y+10,5,11);
  ctx.fillStyle='#3a2818';ctx.fillRect(x+10,y+10,5,2);
  ctx.fillStyle='#111';ctx.fillRect(x+10,y+10,1,11);ctx.fillRect(x+14,y+10,1,11);
  ctx.fillStyle='#cc8822';ctx.fillRect(x+14,y+15,1,2); // door handle
  // Left window with glass sheen
  ctx.fillStyle='#6ab8ff';ctx.fillRect(x+2,y+9,5,5);
  ctx.fillStyle='rgba(255,255,255,0.6)';ctx.fillRect(x+2,y+9,2,2);
  ctx.fillStyle='rgba(0,0,0,0.2)';ctx.fillRect(x+4,y+9,1,5);ctx.fillRect(x+2,y+12,5,1);
  // Right window
  ctx.fillStyle='#6ab8ff';ctx.fillRect(x+17,y+9,5,5);
  ctx.fillStyle='rgba(255,255,255,0.6)';ctx.fillRect(x+17,y+9,2,2);
  ctx.fillStyle='rgba(0,0,0,0.2)';ctx.fillRect(x+21,y+9,1,5);ctx.fillRect(x+17,y+12,5,1);
  // Team flag
  if(owner&&TC[owner]){
    ctx.fillStyle='rgba(0,0,0,0.5)';ctx.fillRect(x+13,y-6,1,6);
    ctx.fillStyle=TC[owner];ctx.fillRect(x+14,y-6,7,4);
    ctx.fillStyle='rgba(255,255,255,0.35)';ctx.fillRect(x+14,y-6,3,1);
  }
}

function hasWallAt(x,y){
  const sx=Math.floor(x/16)*16,sy=Math.floor(y/16)*16;
  const cell=grid[sy]&&grid[sy][sx];
  return cell&&(cell.type==='wall'||cell.type==='gate');
}

function drawWall(x,y){
  const S=16;
  const N=hasWallAt(x,y-S),S2=hasWallAt(x,y+S);
  const E=hasWallAt(x+S,y),Wl=hasWallAt(x-S,y);
  ctx.fillStyle='#55556a';ctx.fillRect(x,y,16,16);
  ctx.fillStyle='#888899';ctx.fillRect(x,y,16,3);
  ctx.fillStyle='#333344';ctx.fillRect(x,y+13,16,3);
  ctx.fillStyle='#444455';ctx.fillRect(x+13,y,3,16);
  if(!N){
    ctx.fillStyle='#55556a';ctx.fillRect(x,y,16,6);
    ctx.fillStyle='#777788';ctx.fillRect(x,y,6,6);
    ctx.fillStyle='#777788';ctx.fillRect(x+10,y,6,6);
    ctx.fillStyle='#333344';ctx.fillRect(x+6,y,4,6);
    ctx.fillStyle='#888899';ctx.fillRect(x,y,6,2);
    ctx.fillStyle='#888899';ctx.fillRect(x+10,y,6,2);
  }
  if(E) ctx.fillStyle='#55556a',ctx.fillRect(x+13,y+3,6,10);
  if(Wl) ctx.fillStyle='#55556a',ctx.fillRect(x-3,y+3,6,10);
  if(S2) ctx.fillStyle='#55556a',ctx.fillRect(x+3,y+13,10,6);
  ctx.fillStyle='rgba(0,0,0,0.25)';
  ctx.fillRect(x,y+8,16,1);
  ctx.fillRect(x+8,y,1,16);
}

function drawGate(x,y){
  // Shadow
  ctx.fillStyle='rgba(0,0,0,0.3)';ctx.fillRect(x+1,y+14,14,2);
  // Main stone arch body
  ctx.fillStyle='#887755';ctx.fillRect(x+0,y+2,16,12);
  ctx.fillStyle='#998866';ctx.fillRect(x+0,y+2,16,3);
  // Dark arch opening
  ctx.fillStyle='#1a1208';ctx.fillRect(x+4,y+5,8,9);
  ctx.fillStyle='#1a1208';ctx.fillRect(x+3,y+4,10,4);
  ctx.fillStyle='#887755';ctx.fillRect(x+3,y+4,1,1);ctx.fillRect(x+12,y+4,1,1);
  // Portcullis bars
  ctx.fillStyle='rgba(80,60,20,0.75)';
  ctx.fillRect(x+4,y+5,2,9);ctx.fillRect(x+7,y+5,2,9);ctx.fillRect(x+10,y+5,2,9);
  ctx.fillRect(x+4,y+7,10,2);ctx.fillRect(x+4,y+11,10,2);
  // Top crenellations
  ctx.fillStyle='#665544';ctx.fillRect(x+0,y+0,4,3);
  ctx.fillStyle='#665544';ctx.fillRect(x+6,y+0,4,3);
  ctx.fillStyle='#665544';ctx.fillRect(x+12,y+0,4,3);
  ctx.fillStyle='#776655';ctx.fillRect(x+0,y+0,4,1);
  ctx.fillStyle='#776655';ctx.fillRect(x+6,y+0,4,1);
  ctx.fillStyle='#776655';ctx.fillRect(x+12,y+0,4,1);
  // Gold lock / keystone
  ctx.fillStyle='#cc9900';ctx.fillRect(x+7,y+4,2,2);
  ctx.fillStyle='#eecc00';ctx.fillRect(x+7,y+4,1,1);
}

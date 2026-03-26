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
  // Scale castle size with level
  const S=8+lv*2; // lv1=10, lv2=12, lv3=14, lv4=16, lv5=18

  // Shadow
  ctx.fillStyle='rgba(0,0,0,0.3)';
  ctx.fillRect(cx-S-3,cy-S-1,S*2+8,S*2+8);

  // Outer walls - scale with level
  ctx.fillStyle=wallCol;
  ctx.fillRect(cx-S,cy-S,S*2,3);
  ctx.fillRect(cx-S,cy+S-3,S*2,3);
  ctx.fillRect(cx-S,cy-S,3,S*2);
  ctx.fillRect(cx+S-3,cy-S,3,S*2);
  // Wall highlight
  ctx.fillStyle=wallHi;
  ctx.fillRect(cx-S,cy-S,S*2,1);
  ctx.fillRect(cx-S,cy-S,1,S*2);

  // Crenellations - more at higher levels
  ctx.fillStyle=wallHi;
  const crenStep=Math.max(3,5-lv);
  for(let i=-(S-2);i<=S-2;i+=crenStep){
    ctx.fillRect(cx+i,cy-S-3,2,4);
    ctx.fillStyle='rgba(0,0,0,0.25)';ctx.fillRect(cx+i,cy-S-3,1,4);
    ctx.fillStyle=wallHi;
  }

  // Corner towers - grow with level
  const tw=5+lv,th=6+lv;
  const toff=S-1;
  [[-toff,-toff],[toff-tw+1,-toff],[-toff,toff-th+1],[toff-tw+1,toff-th+1]].forEach(([tx,ty])=>{
    ctx.fillStyle=isDefeated?'#664444':'#9999aa';ctx.fillRect(cx+tx,cy+ty,tw,th);
    ctx.fillStyle=isDefeated?'#775555':wallHi;ctx.fillRect(cx+tx,cy+ty,tw,2);
    ctx.fillStyle='rgba(0,0,0,0.2)';ctx.fillRect(cx+tx+tw-1,cy+ty,1,th);
    if(!isDefeated){
      ctx.fillStyle='rgba(0,0,0,0.5)';ctx.fillRect(cx+tx+1,cy+ty-4,1,4);
      ctx.fillStyle=tc;ctx.fillRect(cx+tx+2,cy+ty-4,3,2);
    }
  });

  // Keep center - grows with level
  const ks=4+lv;
  ctx.fillStyle=keepCol;ctx.fillRect(cx-ks,cy-ks,ks*2,ks*2);
  ctx.fillStyle=isDefeated?'#442222':'#50508a';ctx.fillRect(cx-ks+2,cy,ks*2-4,ks);
  ctx.fillStyle='#111122';ctx.fillRect(cx-1,cy+1,3,ks);
  ctx.fillStyle='rgba(150,200,255,0.5)';
  ctx.fillRect(cx-ks+1,cy-ks+2,2,2);ctx.fillRect(cx+ks-3,cy-ks+2,2,2);
  ctx.fillStyle=isDefeated?'#553333':wallHi;ctx.fillRect(cx-ks,cy-ks,ks*2,2);

  // Extra details at higher levels
  if(lv>=3){
    ctx.fillStyle='rgba(0,0,0,0.15)';
    ctx.fillRect(cx-ks-3,cy-ks-3,ks*2+6,2);
    ctx.fillRect(cx-ks-3,cy+ks+1,ks*2+6,2);
  }
  if(lv>=4){
    ctx.fillStyle='rgba(30,60,120,0.3)';
    ctx.fillRect(cx-S-4,cy-S-4,S*2+8,3);
    ctx.fillRect(cx-S-4,cy+S+1,S*2+8,3);
    ctx.fillRect(cx-S-4,cy-S-4,3,S*2+8);
    ctx.fillRect(cx+S+1,cy-S-4,3,S*2+8);
  }
  if(lv>=5){
    ctx.fillStyle='#d4ac0d';
    ctx.fillRect(cx,cy-S-8,2,6);
    ctx.fillRect(cx-S-1,cy-S/2,1,4);
    ctx.fillRect(cx+S,cy-S/2,1,4);
  }

  // Main flag
  if(!isDefeated){
    ctx.fillStyle='rgba(0,0,0,0.6)';ctx.fillRect(cx,cy-ks-8,1,7);
    ctx.fillStyle=tc;ctx.fillRect(cx+1,cy-ks-8,6,4);
    ctx.fillStyle='rgba(255,255,255,0.3)';ctx.fillRect(cx+1,cy-ks-8,2,1);
  } else {
    ctx.fillStyle='#555';ctx.fillRect(cx,cy-ks-6,1,5);
  }

  // Level indicator ring + XP arc
  const xpPct=Math.min(1,(c.xp||0)/LEVEL_XP[Math.min(lv,4)]);
  ctx.beginPath();ctx.arc(cx,cy,S+4,0-Math.PI/2,0-Math.PI/2+Math.PI*2*xpPct);
  ctx.strokeStyle=isDefeated?'rgba(150,50,50,0.5)':tc;
  ctx.lineWidth=2;ctx.stroke();ctx.lineWidth=1;

  // Player faction pulsing glow
  if(playerTeam&&c.team===playerTeam&&!isDefeated){
    const pulse=Math.sin(tick*0.12)*0.5+0.5;
    ctx.beginPath();ctx.arc(cx,cy,S+8,0,Math.PI*2);
    ctx.strokeStyle=`rgba(255,255,255,${(0.25+pulse*0.55).toFixed(2)})`;
    ctx.lineWidth=2;ctx.stroke();ctx.lineWidth=1;
  }

  // Level badge
  const ld=LEVEL_DATA[lv];
  ctx.fillStyle='rgba(0,0,0,0.75)';ctx.fillRect(cx-14,cy+S+2,28,10);
  ctx.fillStyle=tc;ctx.font='bold 6px monospace';ctx.textAlign='center';
  ctx.fillText('Lv'+lv+' '+(ld?ld.name:''),cx,cy+S+10);
  ctx.textAlign='left';

  // Warehouse
  if(!isDefeated){
    const wx=cx+22,wy=cy+2;
    ctx.fillStyle='rgba(0,0,0,0.25)';ctx.fillRect(wx+1,wy+1,12,10);
    ctx.fillStyle='#7a5a2a';ctx.fillRect(wx,wy,12,10);
    ctx.fillStyle='#9a7a3a';ctx.fillRect(wx,wy,12,3);
    ctx.fillStyle='#3a2010';ctx.fillRect(wx+4,wy+5,4,5);
    ctx.fillStyle='rgba(255,240,180,0.6)';ctx.fillRect(wx+1,wy+4,2,2);
    const r=RES[c.team];
    if(r){
      ctx.fillStyle='rgba(0,0,0,0.65)';ctx.fillRect(wx-1,wy-11,36,10);
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
  const tc=TC[b.team]||'#fff';
  const sz=b.isKnight?5:3;
  ctx.fillStyle=b.isKnight?tc:'rgba(255,255,255,0.5)';
  ctx.fillRect(b.x-Math.floor(sz/2),b.y-Math.floor(sz/2),sz,sz);
  if(b.isKnight){
    ctx.fillStyle=tc;ctx.fillRect(b.x-2,b.y-2,5,5);
    ctx.fillStyle='rgba(255,255,255,0.9)';ctx.fillRect(b.x-1,b.y-1,3,3);
    ctx.fillStyle=tc;ctx.fillRect(b.x,b.y,1,1);
  } else {
    ctx.fillStyle=tc;ctx.fillRect(b.x-1,b.y-1,3,3);
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
  if(!isN&&isS){base=[175,178,198];}
  else if(isN&&!isS){base=[90,90,108];}
  else if(!isW&&isE){base=[155,158,178];}
  else if(isW&&!isE){base=[100,100,118];}
  const n=(hash(x>>1,y>>1)&7)-4;
  return[
    Math.max(0,Math.min(255,base[0]+n)),
    Math.max(0,Math.min(255,base[1]+n)),
    Math.max(0,Math.min(255,base[2]+n))
  ];
}

function getSnowColor(x,y){
  const pattern=[[235,242,255],[242,248,255],[228,236,252],[245,250,255],[232,240,255],[238,245,255],[225,234,250],[240,247,255],[235,242,255]];
  const tx=(x/3|0)%3,ty=(y/3|0)%3;
  const idx=(ty*3+tx)%pattern.length;
  const n=(hash(x,y)&7)-4;
  const c=pattern[idx];
  return[Math.min(255,c[0]+n),Math.min(255,c[1]+n),Math.min(255,c[2]+n)];
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
    const gx=(Math.floor(x/3)*3);
    const gy=(Math.floor(y/3)*3);
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

  const WPS=6;
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

  for(let y=1;y<H-1;y++) for(let x=1;x<W-1;x++){
    const gx=Math.floor(x/3)*3,gy=Math.floor(y/3)*3;
    const t=grid[gy]&&grid[gy][gx]?grid[gy][gx].type:'water';
    if(t==='fire'||t==='lava') continue;
    const tn=grid[Math.max(0,gy-3)]&&grid[Math.max(0,gy-3)][gx]?grid[Math.max(0,gy-3)][gx].type:t;
    const ts=grid[Math.min(H-1,gy+3)]&&grid[Math.min(H-1,gy+3)][gx]?grid[Math.min(H-1,gy+3)][gx].type:t;
    const tw=grid[gy]&&grid[gy][Math.max(0,gx-3)]?grid[gy][Math.max(0,gx-3)].type:t;
    const te=grid[gy]&&grid[gy][Math.min(W-1,gx+3)]?grid[gy][Math.min(W-1,gx+3)].type:t;
    if(tn!==t||ts!==t||tw!==t||te!==t){
      const idx=(y*W+x)*4;
      if(d[idx+3]===255){
        d[idx]=Math.max(0,d[idx]-20);
        d[idx+1]=Math.max(0,d[idx+1]-20);
        d[idx+2]=Math.max(0,d[idx+2]-20);
      }
    }
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
  if(t<0.3){alpha=0;r=0;g=0;b=0;}
  else if(t<0.5){
    const p=(t-0.3)/0.2;
    alpha=p*0.55;r=20;g=10;b=40;
  } else if(t<0.7){
    alpha=0.55;r=5;g=5;b=30;
  } else if(t<0.9){
    const p=1-(t-0.7)/0.2;
    alpha=p*0.55;r=20;g=10;b=40;
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
    for(let y=0;y<H;y+=10) for(let x=0;x<W;x+=10){
      const cell=grid[y]&&grid[y][x];
      if(cell&&cell.type==='house') ctx.fillRect(x-2,y-2,14,14);
    }
  }

  if(tick%6===0){
    for(let y=0;y<H;y+=8) for(let x=0;x<W;x+=8){
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
  for(let y=0;y<H;y+=10) for(let x=0;x<W;x+=10){
    const cell=grid[y]&&grid[y][x];if(!cell) continue;
    if(cell.type==='house') continue;
    drawSprite(cell.type,x,y,cell.owner);
  }
  for(let y=0;y<H;y+=20) for(let x=0;x<W;x+=20){
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
  ctx.fillStyle='rgba(0,0,0,0.25)';ctx.fillRect(x+1,y+8,8,2);
  ctx.fillStyle='#5a2e0e';ctx.fillRect(x+4,y+6,2,4);
  ctx.fillStyle='#7a4a1e';ctx.fillRect(x+4,y+6,1,4);
  ctx.fillStyle='#5a2e0e';ctx.fillRect(x+2,y+9,2,1);ctx.fillRect(x+6,y+9,2,1);
  ctx.fillStyle='#143a06';ctx.fillRect(x+0,y+5,10,3);
  ctx.fillStyle='#1a4a08';ctx.fillRect(x+1,y+4,8,3);
  ctx.fillStyle='#1e5a0a';ctx.fillRect(x+2,y+3,6,3);
  ctx.fillStyle='#256810';ctx.fillRect(x+3,y+2,4,3);
  ctx.fillStyle='#2d7818';ctx.fillRect(x+3,y+1,4,2);
  ctx.fillStyle='#388820';ctx.fillRect(x+4,y+0,2,2);
  ctx.fillStyle='#4a9a28';ctx.fillRect(x+4,y,1,1);
  ctx.fillStyle='#3a8820';ctx.fillRect(x+2,y+3,1,1);ctx.fillRect(x+3,y+1,1,1);
  ctx.fillStyle='rgba(0,0,0,0.2)';ctx.fillRect(x+8,y+4,2,4);
  ctx.fillStyle='rgba(0,0,0,0.15)';ctx.fillRect(x+7,y+2,2,3);
}

function drawPine(x,y){
  ctx.fillStyle='rgba(0,0,0,0.25)';ctx.fillRect(x+2,y+9,6,2);
  ctx.fillStyle='#4a2808';ctx.fillRect(x+4,y+7,2,3);
  ctx.fillStyle='#6a3a18';ctx.fillRect(x+4,y+7,1,3);
  ctx.fillStyle='#071e03';ctx.fillRect(x+1,y+6,8,2);
  ctx.fillStyle='#0a2804';ctx.fillRect(x+2,y+5,6,2);
  ctx.fillStyle='#0d3205';ctx.fillRect(x+1,y+4,8,2);
  ctx.fillStyle='#103808';ctx.fillRect(x+2,y+3,6,2);
  ctx.fillStyle='#0d3205';ctx.fillRect(x+3,y+2,4,2);
  ctx.fillStyle='#143e08';ctx.fillRect(x+3,y+1,4,2);
  ctx.fillStyle='#1a4a0a';ctx.fillRect(x+4,y+0,2,2);
  ctx.fillStyle='#1a5a10';ctx.fillRect(x+2,y+4,1,2);ctx.fillRect(x+3,y+2,1,1);
  ctx.fillStyle='#206018';ctx.fillRect(x+4,y+0,1,1);
  ctx.fillStyle='rgba(0,0,0,0.25)';ctx.fillRect(x+8,y+5,2,4);ctx.fillRect(x+7,y+3,2,3);
  ctx.fillStyle='rgba(220,235,255,0.4)';ctx.fillRect(x+4,y,1,1);ctx.fillRect(x+2,y+4,1,1);
}

function drawOre(x,y){
  ctx.fillStyle='rgba(0,0,0,0.25)';ctx.fillRect(x+1,y+6,6,2);
  ctx.fillStyle='#444450';ctx.fillRect(x+1,y+2,6,5);
  ctx.fillStyle='#555560';ctx.fillRect(x+2,y+1,4,5);
  ctx.fillStyle='#c05520';ctx.fillRect(x+3,y+3,2,2);
  ctx.fillStyle='#e06030';ctx.fillRect(x+4,y+3,1,1);
  ctx.fillStyle='#c05520';ctx.fillRect(x+2,y+4,1,1);
  ctx.fillStyle='rgba(255,255,255,0.15)';ctx.fillRect(x+2,y+1,2,1);
}

function drawGold(x,y){
  ctx.fillStyle='rgba(0,0,0,0.25)';ctx.fillRect(x+1,y+6,6,2);
  ctx.fillStyle='#554400';ctx.fillRect(x+1,y+2,6,5);
  ctx.fillStyle='#665500';ctx.fillRect(x+2,y+1,4,5);
  ctx.fillStyle='#e6b800';ctx.fillRect(x+3,y+2,2,3);
  ctx.fillStyle='#ffe040';ctx.fillRect(x+3,y+2,1,1);
  ctx.fillStyle='#ffee80';ctx.fillRect(x+4,y+3,1,1);
  ctx.fillStyle='rgba(255,255,255,0.2)';ctx.fillRect(x+2,y+1,2,1);
}

function drawCrystal(x,y){
  ctx.fillStyle='rgba(0,0,0,0.2)';ctx.fillRect(x+2,y+7,4,1);
  ctx.fillStyle='#3355aa';ctx.fillRect(x+3,y+2,2,6);
  ctx.fillStyle='#6688cc';ctx.fillRect(x+2,y+3,4,4);
  ctx.fillStyle='#88aaee';ctx.fillRect(x+3,y+1,2,3);
  ctx.fillStyle='#aaccff';ctx.fillRect(x+3,y+0,2,2);
  ctx.fillStyle='#ffffff';ctx.fillRect(x+3,y,1,1);
  ctx.fillStyle='rgba(150,200,255,0.5)';ctx.fillRect(x+2,y+3,1,1);
}

function drawCactus(x,y){
  ctx.fillStyle='rgba(0,0,0,0.2)';ctx.fillRect(x+2,y+7,4,1);
  ctx.fillStyle='#2a5a10';ctx.fillRect(x+3,y+1,2,7);
  ctx.fillStyle='#2a5a10';ctx.fillRect(x+1,y+2,2,2);
  ctx.fillStyle='#2a5a10';ctx.fillRect(x+5,y+4,2,2);
  ctx.fillStyle='#3a7a18';ctx.fillRect(x+3,y+1,1,2);
  ctx.fillStyle='rgba(255,255,200,0.4)';ctx.fillRect(x+3,y+1,1,1);
}

function drawHouse(x,y,owner){
  const rc=owner?{
    red:['#882222','#aa2a2a','#cc3333'],
    blue:['#1a4a99','#2255bb','#3366dd'],
    green:['#1a6632','#1e8449','#27ae60'],
    gold:['#8a6010','#b8860b','#d4ac0d'],
  }[owner]||['#1a4a99','#2255bb','#3366dd']:['#1a4a99','#2255bb','#3366dd'];
  ctx.fillStyle='rgba(0,0,0,0.3)';ctx.fillRect(x+2,y+12,14,2);
  ctx.fillStyle='#7a6050';ctx.fillRect(x,y+8,16,4);
  ctx.fillStyle='rgba(0,0,0,0.2)';ctx.fillRect(x+14,y+8,2,4);
  ctx.fillStyle='#d4bc90';ctx.fillRect(x+1,y+5,14,4);
  ctx.fillStyle='#b89a70';ctx.fillRect(x+14,y+5,2,4);
  ctx.fillStyle='#8a5a20';ctx.fillRect(x+1,y+7,14,1);
  ctx.fillStyle=rc[0];ctx.fillRect(x,y+3,16,3);
  ctx.fillStyle=rc[1];ctx.fillRect(x+1,y+2,14,2);
  ctx.fillStyle=rc[2];ctx.fillRect(x+3,y+1,10,2);
  ctx.fillStyle=rc[2];ctx.fillRect(x+5,y,6,2);
  ctx.fillStyle='rgba(255,255,255,0.25)';ctx.fillRect(x+3,y+1,4,1);
  ctx.fillStyle='rgba(0,0,0,0.25)';ctx.fillRect(x,y+5,16,1);
  ctx.fillStyle='rgba(0,0,0,0.2)';ctx.fillRect(x+15,y+2,1,4);
  ctx.fillStyle='#7a5540';ctx.fillRect(x+12,y-1,2,4);
  ctx.fillStyle='#3a2515';ctx.fillRect(x+12,y-1,2,1);
  ctx.fillStyle='#2a1808';ctx.fillRect(x+7,y+6,3,6);
  ctx.fillStyle='#3a2818';ctx.fillRect(x+7,y+6,3,1);
  ctx.fillStyle='#cc8822';ctx.fillRect(x+9,y+9,1,1);
  ctx.fillStyle='#88ccff';ctx.fillRect(x+2,y+5,3,3);
  ctx.fillStyle='rgba(255,255,255,0.5)';ctx.fillRect(x+2,y+5,1,1);
  ctx.fillStyle='rgba(0,0,0,0.2)';ctx.fillRect(x+4,y+5,1,3);ctx.fillRect(x+2,y+7,3,1);
  ctx.fillStyle='#88ccff';ctx.fillRect(x+11,y+5,3,3);
  ctx.fillStyle='rgba(255,255,255,0.5)';ctx.fillRect(x+11,y+5,1,1);
  ctx.fillStyle='rgba(0,0,0,0.2)';ctx.fillRect(x+13,y+5,1,3);ctx.fillRect(x+11,y+7,3,1);
  if(owner&&TC[owner]){
    ctx.fillStyle='rgba(0,0,0,0.4)';ctx.fillRect(x+8,y-3,1,3);
    ctx.fillStyle=TC[owner];ctx.fillRect(x+9,y-3,4,2);
  }
}

function hasWallAt(x,y){
  const sx=Math.floor(x/10)*10,sy=Math.floor(y/10)*10;
  const cell=grid[sy]&&grid[sy][sx];
  return cell&&(cell.type==='wall'||cell.type==='gate');
}

function drawWall(x,y){
  const S=10;
  const N=hasWallAt(x,y-S),S2=hasWallAt(x,y+S);
  const E=hasWallAt(x+S,y),Wl=hasWallAt(x-S,y);
  ctx.fillStyle='#55556a';ctx.fillRect(x,y,10,10);
  ctx.fillStyle='#888899';ctx.fillRect(x,y,10,2);
  ctx.fillStyle='#333344';ctx.fillRect(x,y+8,10,2);
  ctx.fillStyle='#444455';ctx.fillRect(x+8,y,2,10);
  ctx.fillStyle='#6a6a7a';
  if(!N){
    ctx.fillStyle='#55556a';ctx.fillRect(x,y,10,4);
    ctx.fillStyle='#777788';ctx.fillRect(x,y,4,4);
    ctx.fillStyle='#777788';ctx.fillRect(x+6,y,4,4);
    ctx.fillStyle='#333344';ctx.fillRect(x+4,y,2,4);
    ctx.fillStyle='#888899';ctx.fillRect(x,y,4,1);
    ctx.fillStyle='#888899';ctx.fillRect(x+6,y,4,1);
  }
  if(E) ctx.fillStyle='#55556a',ctx.fillRect(x+8,y+2,4,6);
  if(Wl) ctx.fillStyle='#55556a',ctx.fillRect(x-2,y+2,4,6);
  if(S2) ctx.fillStyle='#55556a',ctx.fillRect(x+2,y+8,6,4);
  ctx.fillStyle='rgba(0,0,0,0.25)';
  ctx.fillRect(x,y+5,10,1);
  ctx.fillRect(x+5,y,1,10);
}

function drawGate(x,y){
  ctx.fillStyle='rgba(0,0,0,0.3)';ctx.fillRect(x+1,y+7,7,1);
  ctx.fillStyle='#887755';ctx.fillRect(x+0,y+1,8,7);
  ctx.fillStyle='#998866';ctx.fillRect(x+0,y+1,8,2);
  ctx.fillStyle='#1a1208';ctx.fillRect(x+2,y+3,4,5);
  ctx.fillStyle='#1a1208';ctx.fillRect(x+1,y+2,6,2);
  ctx.fillStyle='#887755';ctx.fillRect(x+1,y+2,1,1);
  ctx.fillStyle='#887755';ctx.fillRect(x+6,y+2,1,1);
  ctx.fillStyle='rgba(80,60,20,0.7)';
  ctx.fillRect(x+2,y+3,1,5);ctx.fillRect(x+4,y+3,1,5);
  ctx.fillStyle='#665544';ctx.fillRect(x+0,y+0,3,2);
  ctx.fillStyle='#665544';ctx.fillRect(x+5,y+0,3,2);
  ctx.fillStyle='#cc9900';ctx.fillRect(x+3,y+2,2,1);
}

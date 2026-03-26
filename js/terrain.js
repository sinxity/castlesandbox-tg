// ── INIT ──────────────────────────────────────────────────────
function initBase(){
  canvas=document.getElementById('gc');
  wrap=document.getElementById('cw');
  // Landscape rectangle map: use the longer screen dimension as the map width
  // so the world is wider than tall (like a real map)
  const dim=Math.max(wrap.clientWidth,wrap.clientHeight);
  W=Math.floor(dim*4);
  H=Math.floor(dim*3);
  canvas.width=W;canvas.height=H;
  canvas.style.width=W+'px';canvas.style.height=H+'px';
  canvas.style.transformOrigin='0 0';
  canvas.style.transform='none';
  ctx=canvas.getContext('2d');
  terrCanvas=document.createElement('canvas');
  terrCanvas.width=W;terrCanvas.height=H;
  terrCtx=terrCanvas.getContext('2d');
  camX=0;camY=0;camZ=1;
  isPanMode=false;
  grid=[];
  for(let y=0;y<H;y++){grid[y]=[];for(let x=0;x<W;x++) grid[y][x]={type:'water',fa:0};}
  bots=[];castles=[];armies=[];raids=[];defeated=[];lootAnims=[];particles=[];
  fireCells=new Set();plagueCells=new Set();
  tick=0;evts=[];dayTime=0;terrainDirty=true;spriteDirty=true;terrainCache=null;
  dayCount=0;gameOver=false;gameOverTeam=null;minimapCanvas=null;
  weather='clear';weatherTimer=600;daySpeed=0.0002;
}

function isLand(x,y){
  const ix=Math.floor(x),iy=Math.floor(y);
  if(ix<0||iy<0||ix>=W||iy>=H) return false;
  return landMask&&landMask[iy*W+ix]===1;
}

// ── MASK BUILD (async chunked) ────────────────────────────────
// Bug fix: useEurope=true uses polygon-based Europe map,
//          useEurope=false generates a random procedural island map
function buildMask(onDone){
  landMask=new Uint8Array(W*H);
  let y=0;
  function step(){
    const end=Math.min(y+12,H);
    for(;y<end;y++) for(let x=0;x<W;x++){
      if(useEurope){
        for(const poly of POLYS){
          if(polyContains(poly,x,y,W,H)){landMask[y*W+x]=1;break;}
        }
        // Punch lake holes in landmask
        if(landMask[y*W+x]===1 && isInLake(x/W,y/H)) landMask[y*W+x]=0;
      } else {
        // Procedural island using fractal noise + edge falloff
        const nx=x/W,ny=y/H;
        const n=noise(nx*3+mapSeed,ny*3+mapSeed)*0.5
               +noise(nx*7+mapSeed,ny*6+mapSeed)*0.3
               +noise(nx*15+mapSeed,ny*14+mapSeed)*0.2;
        // Shrink land near map edges to create island feel
        const edge=Math.min(nx,1-nx,ny,1-ny)*4;
        if(n*0.65+edge*0.35>0.52) landMask[y*W+x]=1;
      }
    }
    const pct=Math.round(y/H*100);
    document.getElementById('loading-pct').textContent='Генерируем мир... '+pct+'%';
    document.getElementById('loading-bar').style.width=pct+'%';
    if(y<H) requestAnimationFrame(step); else onDone();
  }
  requestAnimationFrame(step);
}

// ── MAP RENDER ────────────────────────────────────────────────
function buildMapCache(){
  mapCache=document.createElement('canvas');
  mapCache.width=W;mapCache.height=H;
  const mc=mapCache.getContext('2d');
  const img=mc.createImageData(W,H);
  for(let y=0;y<H;y++) for(let x=0;x<W;x++){
    const nx=x/W,ny=y/H;
    const land=isLand(x,y);
    const n=noise(nx*35,ny*35)*0.5+noise(nx*70,ny*70)*0.3+noise(nx*140,ny*140)*0.2;
    let r,g2,b;
    if(!land){
      // Noise-displaced coast check for organic shallow water gradient
      const nd=noise(nx*16,ny*16)*3-1.5; // -1.5 to 1.5 displacement
      const nd2=noise(ny*22+0.5,nx*22+0.3)*2-1;
      function nearLand(d){
        return isLand(x-d,y)||isLand(x+d,y)||isLand(x,y-d)||isLand(x,y+d)||
               isLand(x-d,y-d)||isLand(x+d,y+d)||isLand(x-d,y+d)||isLand(x+d,y-d);
      }
      const n1=nearLand(1)||nearLand(Math.round(1+nd));
      const n2=!n1&&(nearLand(3)||nearLand(Math.round(3+nd)));
      const n3=!n2&&!n1&&(nearLand(6)||nearLand(Math.round(5+nd2)));
      const n4=!n3&&!n2&&!n1&&(nearLand(10)||nearLand(Math.round(9+nd2)));
      if(n1){r=35;g2=110;b=185;}
      else if(n2){r=24;g2=90;b=165;}
      else if(n3){r=18;g2=72;b=148;}
      else if(n4){r=15;g2=55;b=120;}
      else{r=13;g2=42;b=92;}
      const v=Math.floor(n*8-4);r=Math.max(0,Math.min(255,r+v));g2=Math.max(0,Math.min(255,g2+v));b=Math.max(0,Math.min(255,b+v));
    } else {
      const ms=getMtn(nx,ny,W);
      const fs=getFst(nx,ny,W);
      const hs=getHill(nx,ny);
      const ds=getDesert(nx,ny);
      if(ms>0.72||(ny<0.15&&ms>0.2)){r=210+Math.floor(n*20);g2=218+Math.floor(n*18);b=238+Math.floor(n*12);}
      else if(ms>0.2){const t=Math.min(1,(ms-0.2)/0.55);r=Math.round(60+t*78+n*10);g2=Math.round(95+t*45+n*8);b=Math.round(40+t*110+n*12);}
      else{
        const c1=!isLand(x-1,y)||!isLand(x+1,y)||!isLand(x,y-1)||!isLand(x,y+1)||
                  !isLand(x-2,y)||!isLand(x+2,y)||!isLand(x,y-2)||!isLand(x,y+2);
        const c2=!c1&&(!isLand(x-3,y)||!isLand(x+3,y)||!isLand(x,y-3)||!isLand(x,y+3)||
                        !isLand(x-4,y)||!isLand(x+4,y)||!isLand(x,y-4)||!isLand(x,y+4));
        if(c1||c2){r=Math.round(195+n*20);g2=Math.round(162+n*15);b=Math.round(65+n*12);}
        else if(ds>0.55){r=Math.round(210+n*18);g2=Math.round(168+n*14);b=Math.round(72+n*10);}
        else if(fs>0.25){const t=Math.min(1,(fs-0.25)/0.5);r=Math.round(55-t*22+n*10);g2=Math.round(100-t*28+n*10);b=Math.round(35-t*12+n*8);}
        else if(hs>0.45&&ms<0.15){r=Math.round(82+n*12);g2=Math.round(118+n*14);b=Math.round(52+n*10);}
        else{r=Math.round(58+n*14);g2=Math.round(105+n*14);b=Math.round(40+n*10);}
      }
    }
    const i=(y*W+x)*4;
    img.data[i]=Math.max(0,Math.min(255,r));
    img.data[i+1]=Math.max(0,Math.min(255,g2));
    img.data[i+2]=Math.max(0,Math.min(255,b));
    img.data[i+3]=255;
  }
  mc.putImageData(img,0,0);
  mc.strokeStyle='rgba(40,100,200,0.65)';mc.lineWidth=2.5;mc.lineCap='round';mc.lineJoin='round';
  RIVERS.forEach(rv=>{
    mc.beginPath();mc.moveTo(rv[0][0]*W,rv[0][1]*H);
    for(let i=1;i<rv.length;i++) mc.lineTo(rv[i][0]*W,rv[i][1]*H);
    mc.stroke();
  });
  // Draw lake outlines
  mc.strokeStyle='rgba(20,80,180,0.5)';mc.fillStyle='rgba(20,80,180,0.55)';mc.lineWidth=1;
  LAKES.forEach(l=>{
    const lx=l.c[0]*W,ly=l.c[1]*H,lr=l.r*Math.min(W,H);
    mc.beginPath();mc.ellipse(lx,ly,lr*1.3,lr,0,0,Math.PI*2);mc.fill();
  });
  // Sync grid with map so terrain is interactive
  initGridFromMap();
}

function initGridFromMap(){
  for(let y=0;y<H;y++) for(let x=0;x<W;x++){
    const nx=x/W,ny=y/H;
    const land=isLand(x,y);
    if(!land){grid[y][x].type='water';continue;}
    const ms=getMtn(nx,ny,W);
    const fs=getFst(nx,ny,W);
    const hs=getHill(nx,ny);
    const ds=getDesert(nx,ny);
    if(ms>0.72||(ny<0.15&&ms>0.2)) grid[y][x].type='snow';
    else if(ms>0.45) grid[y][x].type='mountain';
    else if(ms>0.2) grid[y][x].type='rock';
    else{
      // Wider beach: 4-pixel coast
      const coast=!isLand(x-1,y)||!isLand(x+1,y)||!isLand(x,y-1)||!isLand(x,y+1)||
                  !isLand(x-2,y)||!isLand(x+2,y)||!isLand(x,y-2)||!isLand(x,y+2)||
                  !isLand(x-3,y)||!isLand(x+3,y)||!isLand(x,y-3)||!isLand(x,y+3)||
                  !isLand(x-4,y)||!isLand(x+4,y)||!isLand(x,y-4)||!isLand(x,y+4);
      if(coast) grid[y][x].type='sand';
      else if(ds>0.55) grid[y][x].type='desert';
      else if(fs>0.35) grid[y][x].type=ny<0.3?'pine':'tree';
      else if(hs>0.45&&ms<0.15) grid[y][x].type='hill';
      else grid[y][x].type='grass';
    }
  }
  terrainDirty=true;spriteDirty=true;
  // Add rivers as water in grid
  RIVERS.forEach(rv=>{
    for(let i=0;i<rv.length-1;i++){
      const x0=Math.round(rv[i][0]*W),y0=Math.round(rv[i][1]*H);
      const x1=Math.round(rv[i+1][0]*W),y1=Math.round(rv[i+1][1]*H);
      const steps=Math.max(Math.abs(x1-x0),Math.abs(y1-y0));
      for(let s=0;s<=steps;s++){
        const rx=Math.round(x0+(x1-x0)*s/steps);
        const ry=Math.round(y0+(y1-y0)*s/steps);
        if(rx>=0&&ry>=0&&rx<W&&ry<H) grid[ry][rx].type='water';
      }
    }
  });
  // Resource scatter pass — populates map with natural resources
  for(let ry=16;ry<H-16;ry+=16) for(let rx=16;rx<W-16;rx+=16){
    const cell=grid[ry]&&grid[ry][rx];
    if(!cell||cell.type==='water'||cell.type==='mountain'||cell.type==='snow') continue;
    const rnx=rx/W,rny=ry/H;
    const ms=getMtn(rnx,rny,W);
    const rng=hash(rx*3+137+(mapSeed||0),ry*7+251+(mapSeed||0));
    if(cell.type==='rock'){
      if(ms>0.12&&ms<0.5&&rng%10<2) cell.type='ore';
      else if(ms>0.12&&rng%20<1) cell.type='gold';
    } else if((cell.type==='grass'||cell.type==='rock')&&ms>0.3&&rng%28<1){
      cell.type='crystal';
    }
  }
}

// ── TERRITORY ─────────────────────────────────────────────────
function computeTerritory(c){
  const sx=Math.round(c.nx*W),sy=Math.round(c.ny*H);
  const maxD=Math.round(c.radius*Math.min(W,H)/100);
  const visited=new Uint8Array(W*H);
  const queue=[];queue.push(sx,sy,0);
  visited[sy*W+sx]=1;
  const cells=[];let qi=0;
  while(qi<queue.length){
    const x=queue[qi++],y=queue[qi++],d=queue[qi++];
    if(d>maxD) continue;
    cells.push(x,y);
    for(const[dx,dy] of D4){
      const nx2=x+dx,ny2=y+dy;
      if(nx2<0||ny2<0||nx2>=W||ny2>=H) continue;
      const k=ny2*W+nx2;
      if(visited[k]) continue;
      const ct=grid[ny2]&&grid[ny2][nx2]?grid[ny2][nx2].type:'water';
      if(!isLand(nx2,ny2)||ct==='water'||ct==='lava') continue;
      visited[k]=1;queue.push(nx2,ny2,d+1);
    }
  }
  c.cells=cells;
}

function rebuildTerritories(){
  // Multi-source Voronoi BFS — territories never overlap, each cell goes to nearest castle
  const owner=new Int16Array(W*H).fill(-1);
  const distArr=new Uint16Array(W*H).fill(65535);
  const queue=[];let qi=0;
  castles.forEach((c,ci)=>{
    const sx=Math.round(c.nx*W),sy=Math.round(c.ny*H);
    if(sx<0||sy<0||sx>=W||sy>=H) return;
    owner[sy*W+sx]=ci;distArr[sy*W+sx]=0;
    queue.push(sx,sy,ci,0);
  });
  const maxDs=castles.map(c=>Math.round(c.radius*Math.min(W,H)/100));
  while(qi<queue.length){
    const x=queue[qi++],y=queue[qi++],ci=queue[qi++],d=queue[qi++];
    if(d>=maxDs[ci]) continue;
    for(const[dx,dy] of D4){
      const nx2=x+dx,ny2=y+dy;
      if(nx2<0||ny2<0||nx2>=W||ny2>=H) continue;
      const k=ny2*W+nx2;
      const nd=d+1;
      if(nd>=distArr[k]) continue;
      const ct=grid[ny2]&&grid[ny2][nx2]?grid[ny2][nx2].type:'water';
      if(!isLand(nx2,ny2)||ct==='water'||ct==='lava') continue;
      distArr[k]=nd;owner[k]=ci;
      queue.push(nx2,ny2,ci,nd);
    }
  }
  // Assign cells
  castles.forEach(c=>c.cells=[]);
  for(let y=0;y<H;y++) for(let x=0;x<W;x++){
    const ci=owner[y*W+x];
    if(ci>=0) castles[ci].cells.push(x,y);
  }
  // Draw
  terrCtx.clearRect(0,0,W,H);
  castles.forEach(c=>{
    if(!c.cells||c.cells.length<2) return;
    const col=TCRGB[c.team]||'128,128,128';
    const cellSet=new Set();
    for(let i=0;i<c.cells.length;i+=2) cellSet.add(c.cells[i+1]*W+c.cells[i]);
    terrCtx.fillStyle=`rgba(${col},0.15)`;
    for(let i=0;i<c.cells.length;i+=2) terrCtx.fillRect(c.cells[i],c.cells[i+1],2,2);
    terrCtx.fillStyle=`rgba(${col},0.9)`;
    for(let i=0;i<c.cells.length;i+=2){
      const x=c.cells[i],y=c.cells[i+1];
      const border=!cellSet.has(y*W+(x-1))||!cellSet.has(y*W+(x+1))||!cellSet.has((y-1)*W+x)||!cellSet.has((y+1)*W+x);
      if(border) terrCtx.fillRect(x,y,2,2);
    }
  });
}

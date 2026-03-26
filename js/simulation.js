// ── WEAPONS ───────────────────────────────────────────────────
function explode(cx,cy,R,lava){
  for(let dy=0-R;dy<=R;dy++) for(let dx=0-R;dx<=R;dx++){
    if(dx*dx+dy*dy>R*R) continue;
    const nx=cx+dx,ny=cy+dy;if(nx<0||ny<0||nx>=W||ny>=H) continue;
    const dist=Math.sqrt(dx*dx+dy*dy);
    if(lava&&dist<R*0.35){grid[ny][nx].type='lava';}
    else{const r=Math.random();grid[ny][nx].type=r<0.4?'burned':r<0.7?'sand':'rock';}
  }
  bots=bots.filter(b=>Math.hypot(b.x-cx,b.y-cy)>R*0.8);
  armies=armies.filter(a=>Math.hypot(a.x*W-cx,a.y*H-cy)>R*0.7);
  spawnExplosion(cx,cy,30,255,150,0);
  spawnExplosion(cx,cy,20,255,50,0);
  spawnExplosion(cx,cy,15,200,200,200);
  if(lava) spawnExplosion(cx,cy,25,255,80,0);
  if(navigator.vibrate) navigator.vibrate(lava?150:80);
}

// ── TOOLS ─────────────────────────────────────────────────────
const SINGLE_PLACE=new Set(['house','gate','tree','pine','ore','gold','crystal','cactus',
  'vil_red','vil_blue','vil_green','vil_gold','bomb','meteor','lightning']);

const SPRITE_TOOLS=new Set(['house','tree','pine','ore','gold','crystal','cactus','wall','gate']);
const ONESHOT_TOOLS=new Set(['bomb','meteor','lightning','vil_red','vil_blue','vil_green','vil_gold']);
let lastSpriteCell={x:-99,y:-99};
let lastPaintPos={x:-99,y:-99};

function placeSprite(cx,cy){
  const gridSz=curTool==='house'?20:10;
  const lx=lastPaintPos.x<0?cx:lastPaintPos.x;
  const ly=lastPaintPos.y<0?cy:lastPaintPos.y;
  const dist=Math.hypot(cx-lx,cy-ly);
  const steps=Math.max(1,Math.ceil(dist/gridSz));
  for(let s=0;s<=steps;s++){
    const ix=Math.round(lx+(cx-lx)*s/steps);
    const iy=Math.round(ly+(cy-ly)*s/steps);
    const sx=Math.floor(ix/gridSz)*gridSz;
    const sy=Math.floor(iy/gridSz)*gridSz;
    if(sx<0||sy<0||sx>=W||sy>=H) continue;
    if(sx===lastSpriteCell.x&&sy===lastSpriteCell.y) continue;
    lastSpriteCell={x:sx,y:sy};
    const cell=grid[sy]&&grid[sy][sx];
    if(!cell) continue;
    cell.type=curTool;cell.owner=null;
    terrainDirty=true;
  }
  lastPaintPos={x:cx,y:cy};
}

function applyTool(cx,cy,isFirst){
  const safeCx=Math.max(0,Math.min(W-1,cx));
  const safeCy=Math.max(0,Math.min(H-1,cy));

  if(ONESHOT_TOOLS.has(curTool)){
    if(!isFirst) return;
    if(curTool==='bomb') explode(safeCx,safeCy,20,false);
    else if(curTool==='meteor') explode(safeCx,safeCy,40,true);
    else if(curTool==='lightning'){
      if(grid[safeCy]&&grid[safeCy][safeCx]) grid[safeCy][safeCx].type='burned';
      bots=bots.filter(b=>!(b.x===safeCx&&b.y===safeCy));
    }
    else if(curTool.startsWith('vil_')){
      const cellUnder=grid[safeCy]&&grid[safeCy][safeCx];
      const typeUnder=cellUnder?cellUnder.type:'water';
      if(typeUnder==='water'||typeUnder==='lava'){
        logEvent('⛔ Нельзя на воде!');return;
      }
      placeCastle(safeCx,safeCy,curTool.replace('vil_',''));
    }
    return;
  }

  if(SPRITE_TOOLS.has(curTool)){
    placeSprite(cx,cy);
    return;
  }

  const r=Math.round(brushSz*4);
  for(let dy=-r;dy<=r;dy++) for(let dx=-r;dx<=r;dx++){
    if(dx*dx+dy*dy>r*r) continue;
    const nx=cx+dx,ny=cy+dy;
    if(nx<0||ny<0||nx>=W||ny>=H) continue;
    const cell=grid[ny]&&grid[ny][nx];
    if(!cell) continue;
    if(curTool==='fire'){if(FLAMMABLE.has(cell.type)){cell.type='fire';fireCells.add(ny*W+nx);}}
    else if(curTool==='flood'){cell.type='water';}
    else if(curTool==='plague'){cell.type='plague';plagueCells.add(ny*W+nx);bots=bots.filter(b=>!(b.x===nx&&b.y===ny));}
    else cell.type=curTool;
  }
  terrainDirty=true;
}

function paintAt(sx,sy,isFirst){
  const{x:cx,y:cy}=screenToCanvas(sx,sy);
  applyTool(Math.round(cx),Math.round(cy),isFirst);
}

// ── CASTLE PLACEMENT ──────────────────────────────────────────
function placeCastle(cx,cy,team){
  castles=castles.filter(c=>c.team!==team);
  bots=bots.filter(b=>b.team!==team);
  const c={nx:cx/W,ny:cy/H,team,power:50,radius:6,cells:[],attackCooldown:0,craftTimer:0,level:1,xp:0};
  computeTerritory(c);castles.push(c);
  rebuildTerritories();
  RES[team]={wood:0,stone:0,iron:0,swords:0,armor:0,knights:0};
  let n=0;
  for(let dy=-20;dy<=20&&n<10;dy++) for(let dx=-20;dx<=20&&n<10;dx++){
    const nx2=cx+dx,ny2=cy+dy;
    if(nx2<0||ny2<0||nx2>=W||ny2>=H) continue;
    if(isLand(nx2,ny2)&&Math.random()<0.35){
      bots.push({x:nx2,y:ny2,team,hp:5,maxhp:5,timer:Math.floor(Math.random()*20),
        isKnight:false,carrying:null,res:0,homeX:cx,homeY:cy,state:'seek'});
      n++;
    }
  }
  logEvent('🏰 Замок '+team+' (+10 работяг)');
}

// ── SIMULATION ────────────────────────────────────────────────
function updateCastles(){
  let dirty=false;
  castles.forEach(c=>{
    c.power=Math.min(500,c.power+0.08);
    if(!c.level) c.level=1;
    if(!c.xp) c.xp=0;
    const r=RES[c.team];
    const totalRes=(r.wood+r.stone+r.iron);
    c.xp+=0.02+totalRes*0.001;
    const maxLv=5;
    if(c.level<maxLv&&c.xp>=LEVEL_XP[c.level]){
      const cost={wood:c.level*20,stone:c.level*15,iron:c.level*10};
      if(r.wood>=cost.wood&&r.stone>=cost.stone&&r.iron>=cost.iron){
        r.wood-=cost.wood;r.stone-=cost.stone;r.iron-=cost.iron;
        c.level++;c.xp=0;
        logEvent('🏰 '+c.team+' → Уровень '+c.level+': '+(LEVEL_DATA[c.level]||{}).name+'!');
        playSound('level');
        const hx=Math.round(c.nx*W),hy=Math.round(c.ny*H);
        const newWorkers=3;
        let spawned=0;
        for(let dy=-20;dy<=20&&spawned<newWorkers;dy++) for(let dx=-20;dx<=20&&spawned<newWorkers;dx++){
          const nx2=hx+dx,ny2=hy+dy;
          if(nx2<0||ny2<0||nx2>=W||ny2>=H) continue;
          if(isLand(nx2,ny2)&&Math.random()<0.3){
            bots.push({x:nx2,y:ny2,team:c.team,hp:5,maxhp:5,timer:Math.floor(Math.random()*20),
              isKnight:false,carrying:null,res:0,homeX:hx,homeY:hy,state:'seek'});
            spawned++;
          }
        }
        dirty=true;
      }
    }
    const nr=Math.min(30,8+c.level*4);
    if(nr!==c.radius){c.radius=nr;computeTerritory(c);dirty=true;}
    if(c.attackCooldown>0){c.attackCooldown--;return;}
    const enemies=castles.filter(e=>e.team!==c.team);
    if(!enemies.length||c.power<120) return;
    const target=enemies.reduce((b,e)=>Math.hypot(e.nx-c.nx,e.ny-c.ny)<Math.hypot(b.nx-c.nx,b.ny-c.ny)?e:b);
    const hp=Math.floor(c.power*0.4);
    armies.push({x:c.nx,y:c.ny,team:c.team,tx:target.nx,ty:target.ny,targetTeam:target.team,hp,maxhp:hp});
    c.power-=hp;c.attackCooldown=150;
    logEvent('⚔️ '+c.team+' → '+target.team);
  });
  if(dirty) rebuildTerritories();
  castles.forEach(c=>{
    const r=RES[c.team];if(!r) return;
    c.craftTimer=(c.craftTimer||0)+1;
    if(c.craftTimer%80!==0) return;
    if(r.wood>=3&&r.iron>=2){r.wood-=3;r.iron-=2;r.swords++;logEvent('⚔️ '+c.team+' скрафтил меч!');}
    if(r.stone>=4&&r.iron>=2){r.stone-=4;r.iron-=2;r.armor++;logEvent('🛡 '+c.team+' скрафтил броню!');}
    if((c.level||1)>=3&&r.swords>=1&&r.armor>=1){
      r.swords--;r.armor--;r.knights++;
      const worker=bots.find(b=>b.team===c.team&&!b.isKnight);
      if(worker){worker.isKnight=true;worker.hp=10;worker.maxhp=10;logEvent('🗡 '+c.team+' новый рыцарь!');}
    }
    const trait=TRAITS[c.team]||TRAITS.red;
    if(c.team==='gold'&&c.craftTimer%100===0&&(c.level||1)>=4){
      const ally=castles.find(a=>a.team!=='gold'&&Math.hypot(a.nx-c.nx,a.ny-c.ny)<0.3);
      if(ally){
        const tr=RES['gold'],ar=RES[ally.team];
        if(tr.wood>5){tr.wood-=3;ar.iron=(ar.iron||0)+2;logEvent('🤝 Золотые торгуют с '+ally.team);}
      }
    }
    if(trait.buildSpeed>0&&c.craftTimer%Math.floor(200/trait.buildSpeed)===0&&RES[c.team].wood>=2){
      const hx=Math.round(c.nx*W),hy=Math.round(c.ny*H);
      const R2=Math.round(c.radius*Math.min(W,H)/100*0.6);
      for(let attempt=0;attempt<8;attempt++){
        const bx=Math.floor((hx+Math.floor(Math.random()*R2*2-R2))/8)*8;
        const by=Math.floor((hy+Math.floor(Math.random()*R2*2-R2))/8)*8;
        if(bx<0||by<0||bx>=W||by>=H) continue;
        const bc=grid[by]&&grid[by][bx];
        if(!bc||!WALKABLE.has(bc.type)) continue;
        const buildType=Math.random()<0.4?'wall':'house';
        bc.type=buildType;bc.owner=c.team;
        RES[c.team].wood=Math.max(0,RES[c.team].wood-2);
        break;
      }
    }
    const gr=TRAITS[c.team]||TRAITS.red;
    if(c.craftTimer%Math.floor(300/gr.growMult)===0){
      const myBots=bots.filter(b=>b.team===c.team&&!b.isKnight);
      if(myBots.length<20&&RES[c.team].wood>=3){
        RES[c.team].wood-=3;
        const hx2=Math.round(c.nx*W),hy2=Math.round(c.ny*H);
        bots.push({x:hx2+Math.floor(Math.random()*10-5),y:hy2+Math.floor(Math.random()*10-5),
          team:c.team,hp:5,maxhp:5,timer:Math.floor(Math.random()*20),
          isKnight:false,carrying:null,res:0,homeX:hx2,homeY:hy2,state:'seek'});
        logEvent('👶 '+c.team+' +1 рабочий');
      }
    }
    if(r.knights>=10&&!raids.find(rd=>rd.team===c.team)){
      const knights=bots.filter(b=>b.team===c.team&&b.isKnight);
      if(knights.length>=10){
        const enemy=castles.find(ec=>ec.team!==c.team&&!defeated.find(d=>d.castle===ec));
        if(enemy){
          raids.push({team:c.team,knights:knights.slice(0,10),
            tx:Math.round(enemy.nx*W),ty:Math.round(enemy.ny*H),
            targetTeam:enemy.team,phase:'march',loot:0,battleTimer:0});
          r.knights=0;
          logEvent('⚔️ '+c.team+' — 10 рыцарей в поход на '+enemy.team+'!');
        }
      }
    }
  });
  defeated=defeated.filter(d=>{
    d.timer--;
    if(d.timer<=0){
      d.castle.power=40;d.castle.radius=8;d.castle.attackCooldown=100;
      computeTerritory(d.castle);rebuildTerritories();
      logEvent('🔄 Замок '+d.castle.team+' восстановился!');
      return false;
    }
    return true;
  });
  checkVictory();
}

function updateArmies(){
  const dead=new Set();
  armies.forEach((a,i)=>{
    if(dead.has(i)) return;
    const dx=a.tx-a.x,dy=a.ty-a.y,dist=Math.hypot(dx,dy);
    if(dist<0.008){
      const tc=castles.find(c=>c.team===a.targetTeam);
      if(tc){
        tc.power-=a.hp*1.5;
        if(tc.power<=0){
          logEvent('🏴 '+a.team+' захватил '+tc.team+'!');
          const old=tc.team;tc.team=a.team;tc.power=60;tc.radius=10;tc.attackCooldown=80;
          computeTerritory(tc);rebuildTerritories();
          bots.forEach(b=>{if(b.team===old&&Math.hypot(b.x-tc.nx*W,b.y-tc.ny*H)<15) b.team=a.team;});
        } else logEvent('🛡 '+tc.team+' отбил атаку!');
      }
      dead.add(i);return;
    }
    a.x+=dx/dist*0.005;a.y+=dy/dist*0.005;
    armies.forEach((b2,j)=>{
      if(i===j||dead.has(j)||b2.team===a.team) return;
      if(Math.hypot((b2.x-a.x)*W,(b2.y-a.y)*H)<6){
        const ta=TRAITS[a.team]||TRAITS.red;
        const tb=TRAITS[b2.team]||TRAITS.red;
        a.hp-=Math.min(a.hp,b2.hp*tb.fightMult*0.25);
        b2.hp-=Math.min(b2.hp,a.hp*ta.fightMult*0.25);
        if(a.hp<=0){dead.add(i);logEvent('💀 '+a.team+' разбит');}
        if(b2.hp<=0){dead.add(j);logEvent('💀 '+b2.team+' разбит');}
      }
    });
  });
  armies=armies.filter((_,i)=>!dead.has(i));
}

function moveToward(b,tx,ty){
  const dx=tx-b.x,dy=ty-b.y,dist=Math.hypot(dx,dy);
  if(dist<2) return true;
  const step=b.isKnight?2:1;
  const ndx=Math.round(dx/dist*step),ndy=Math.round(dy/dist*step);
  const nx2=b.x+ndx,ny2=b.y+ndy;
  if(nx2>=0&&ny2>=0&&nx2<W&&ny2<H&&isLand(nx2,ny2)){b.x=nx2;b.y=ny2;}
  return false;
}

function findNearestResource(b){
  const types=b.carrying===null?['tree','pine','rock','mountain','ore']:[];
  let best=null,bestD=9999;
  for(let dy=-60;dy<=60;dy+=2) for(let dx=-60;dx<=60;dx+=2){
    const nx2=b.x+dx,ny2=b.y+dy;
    if(nx2<0||ny2<0||nx2>=W||ny2>=H) continue;
    const t=grid[ny2][nx2].type;
    if(!types.includes(t)) continue;
    const d=Math.hypot(dx,dy);
    if(d<bestD){bestD=d;best={x:nx2,y:ny2,type:t};}
  }
  return best;
}

function updateBots(){
  const dead=new Set();
  bots.forEach((b,i)=>{
    if(dead.has(i)) return;
    b.timer=(b.timer||0)+1;
    const spd=b.isKnight?8:15;
    if(b.timer%spd!==0) return;
    if(!isLand(b.x,b.y)){dead.add(i);return;}

    // Zombie AI — runs before castle lookup (zombies have no castle)
    if(b.state==='zombie'){
      let zt=null,zd=60;
      bots.forEach((t2,j)=>{
        if(j===i||dead.has(j)||t2.team==='zombie') return;
        const d=Math.hypot(t2.x-b.x,t2.y-b.y);
        if(d<zd){zd=d;zt=t2;}
      });
      if(zt){
        moveToward(b,zt.x,zt.y);
        if(Math.hypot(zt.x-b.x,zt.y-b.y)<3){
          zt.hp--;
          if(zt.hp<=0){zt.team='zombie';zt.state='zombie';logEvent('🧟 Зомби обратил!');}
        }
      } else {
        const nc=castles.filter(c=>c.team!=='zombie');
        if(nc.length){const rc=nc[Math.floor(Math.random()*nc.length)];moveToward(b,Math.round(rc.nx*W),Math.round(rc.ny*H));}
      }
      const zc=grid[b.y]&&grid[b.y][b.x];
      if(zc&&WALKABLE.has(zc.type)&&zc.type!=='plague'&&Math.random()<0.008){
        zc.type='plague';plagueCells.add(b.y*W+b.x);terrainDirty=true;
      }
      return;
    }

    const castle=castles.find(c=>c.team===b.team);
    if(!castle) return;
    const hx=Math.round(castle.nx*W),hy=Math.round(castle.ny*H);

    b.hunger=(b.hunger||100)-0.5;
    if(b.hunger<=0){
      const r=RES[b.team];
      if(r&&r.wood>0){r.wood--;b.hunger=80;}
      else{b.hp--;if(b.hp<=0){dead.add(i);return;}}
    }

    if(b.isKnight){
      const myRaid=raids.find(r=>r.team===b.team&&r.knights.includes(b));
      if(!myRaid){
        if(Math.random()<0.3) moveToward(b,hx+Math.floor(Math.random()*16-8),hy+Math.floor(Math.random()*16-8));
      }
      return;
    }

    if(b.role==='guard'&&!b.isKnight){
      const angle=(b.timer*0.05)%(Math.PI*2);
      const cr=castle.radius*Math.min(W,H)/100*0.8;
      const tx=Math.round(hx+Math.cos(angle)*cr);
      const ty=Math.round(hy+Math.sin(angle)*cr);
      if(isLand(tx,ty)) moveToward(b,tx,ty);
      const ei=bots.findIndex((e,j)=>!dead.has(j)&&e.team!==b.team&&Math.hypot(e.x-b.x,e.y-b.y)<=4);
      if(ei>=0){bots[ei].hp-=1;if(bots[ei].hp<=0) dead.add(ei);}
      return;
    }

    if(b.role==='builder'&&!b.isKnight&&(castle.level||1)>=2){
      if(b.bc>0){b.bc--;return;}
      const r2=castle.radius*Math.min(W,H)/100*0.5;
      const bx=Math.floor((hx+Math.floor(Math.random()*r2*2-r2))/10)*10;
      const by=Math.floor((hy+Math.floor(Math.random()*r2*2-r2))/10)*10;
      if(bx>=0&&by>=0&&bx<W&&by<H){
        const bc2=grid[by]&&grid[by][bx];
        if(bc2&&WALKABLE.has(bc2.type)&&RES[b.team]&&RES[b.team].wood>=1){
          bc2.type=Math.random()<0.4?'wall':'house';
          bc2.owner=b.team;
          RES[b.team].wood--;
          b.bc=60;terrainDirty=true;
          return;
        }
      }
      moveToward(b,hx+Math.floor(Math.random()*20-10),hy+Math.floor(Math.random()*20-10));
      return;
    }

    if(!b.state) b.state='seek';

    if(b.state==='seek'){
      if(!b.target||Math.hypot(b.x-b.target.x,b.y-b.target.y)<3){
        b.target=findNearestResource(b);
      }
      if(b.target){
        const arrived=moveToward(b,b.target.x,b.target.y);
        if(arrived){
          const t=grid[b.target.y]&&grid[b.target.y][b.target.x]?grid[b.target.y][b.target.x].type:null;
          const trait=TRAITS[b.team]||TRAITS.green;
          if(t==='tree'||t==='pine'){b.carrying='wood';grid[b.target.y][b.target.x].type='grass';}
          else if(t==='rock'||t==='mountain'){b.carrying='stone';}
          else if(t==='ore'){b.carrying='iron';grid[b.target.y][b.target.x].type='rock';}
          else{b.carrying='wood';}
          spawnExplosion(b.target.x,b.target.y,3,180,140,80);
          b.state='return';b.target=null;
        }
      } else {
        const wx=hx+Math.floor(Math.random()*30-15);
        const wy=hy+Math.floor(Math.random()*30-15);
        moveToward(b,wx,wy);
      }
    } else if(b.state==='return'){
      const arrived=moveToward(b,hx,hy);
      if(arrived||Math.hypot(b.x-hx,b.y-hy)<8){
        const r=RES[b.team];
        const trait=TRAITS[b.team]||TRAITS.green;
        const bonus=Math.random()<(trait.harvestMult-1)?1:0;
        if(b.carrying==='wood') r.wood=Math.min(99,r.wood+1+bonus);
        else if(b.carrying==='stone') r.stone=Math.min(99,r.stone+1+bonus);
        else if(b.carrying==='iron') r.iron=Math.min(99,r.iron+1+bonus);
        b.carrying=null;b.state='seek';
      }
    }
  });
  bots=bots.filter((_,i)=>!dead.has(i));
}

function updateRaids(){
  raids=raids.filter(raid=>{
    if(!raid.knights||raid.knights.length===0) return false;
    const aliveKnights=raid.knights.filter(k=>bots.includes(k));
    if(aliveKnights.length===0){logEvent('💀 Отряд '+raid.team+' уничтожен!');return false;}
    raid.knights=aliveKnights;

    if(raid.phase==='march'){
      let allArrived=true;
      aliveKnights.forEach((k,idx)=>{
        const offsetX=(idx%4-2)*6,offsetY=(Math.floor(idx/4)-1)*6;
        const tx=raid.tx+offsetX,ty=raid.ty+offsetY;
        const arrived=moveToward(k,tx,ty);
        if(!arrived) allArrived=false;
      });
      if(allArrived||aliveKnights.some(k=>Math.hypot(k.x-raid.tx,k.y-raid.ty)<20)){
        raid.phase='battle';raid.battleTimer=0;
        const trait2=TRAITS[raid.team]||TRAITS.red;
        if(raid.team==='red') raid.aggro=2;
        else if(raid.team==='blue') raid.sieging=true;
        logEvent('⚔️ '+raid.team+' атакует '+raid.targetTeam+'!');
      }
    } else if(raid.phase==='battle'){
      raid.battleTimer++;
      const enemy=castles.find(c=>c.team===raid.targetTeam);
      if(!enemy){raid.phase='loot';return true;}

      // Bug fix: use mark-and-sweep instead of splice inside forEach
      const toKill=new Set();
      aliveKnights.forEach(k=>{
        const ei=bots.findIndex((e,i)=>!toKill.has(i)&&e.team!==k.team&&Math.hypot(e.x-k.x,e.y-k.y)<=6);
        if(ei>=0){bots[ei].hp-=1;if(bots[ei].hp<=0) toKill.add(ei);}
      });
      if(toKill.size>0) bots=bots.filter((_,i)=>!toKill.has(i));

      enemy.power=Math.max(0,enemy.power-aliveKnights.length*0.4);

      if(raid.battleTimer%5===0){
        lootAnims.push({x:raid.tx+Math.random()*20-10,y:raid.ty+Math.random()*20-10,
          team:raid.team,type:'clash',age:0});
      }

      if(enemy.power<=0){
        const er=RES[raid.targetTeam];
        const myR=RES[raid.team];
        const lootWood=Math.floor(er.wood*0.5);
        const lootStone=Math.floor(er.stone*0.5);
        const lootIron=Math.floor(er.iron*0.5);
        myR.wood=Math.min(99,myR.wood+lootWood);
        myR.stone=Math.min(99,myR.stone+lootStone);
        myR.iron=Math.min(99,myR.iron+lootIron);
        er.wood-=lootWood;er.stone-=lootStone;er.iron-=lootIron;
        raid.loot=lootWood+lootStone+lootIron;
        defeated.push({castle:enemy,timer:3000});
        enemy.power=0;enemy.radius=3;
        computeTerritory(enemy);rebuildTerritories();
        logEvent('🏆 '+raid.team+' захватил замок! +'+raid.loot+' ресурсов');
        lootAnims.push({x:raid.tx,y:raid.ty,team:raid.team,type:'victory',age:0});
        raid.phase='return';
      } else if(raid.battleTimer>400){
        logEvent('🏃 '+raid.team+' отступил — замок устоял!');
        raid.phase='return';
      }
    } else if(raid.phase==='return'){
      const castle=castles.find(c=>c.team===raid.team);
      if(!castle) return false;
      const hx=Math.round(castle.nx*W),hy=Math.round(castle.ny*H);
      let allHome=true;
      aliveKnights.forEach((k,idx)=>{
        const arrived=moveToward(k,hx+idx*3-15,hy);
        if(!arrived) allHome=false;
      });
      if(allHome){
        logEvent('🏠 '+raid.team+' вернулся домой!');
        aliveKnights.forEach(k=>{k.isKnight=false;k.hp=5;k.maxhp=5;k.state='seek';});
        return false;
      }
    }
    return true;
  });

  // Age loot animations (drawing happens in render.js)
  lootAnims=lootAnims.filter(a=>{a.age++;return a.age<60;});
}

function updateFire(){
  if(fireCells.size===0) return;
  const toRemove=[];
  for(const key of fireCells){
    const x=key%W, y=Math.floor(key/W);
    if(y<0||y>=H||x<0||x>=W){toRemove.push(key);continue;}
    const c=grid[y][x];
    if(c.type!=='fire'){toRemove.push(key);continue;}
    c.fa=(c.fa||0)+1;
    terrainDirty=true;
    if(c.fa>40+Math.floor(Math.random()*40)){
      c.type='burned';c.fa=0;toRemove.push(key);continue;
    }
    // Rain extinguishes fire faster; storm makes it spread faster
    if(weather==='rain'&&Math.random()<0.06){c.type='burned';c.fa=0;toRemove.push(key);continue;}
    const spreadChance=weather==='storm'?0.07:0.04;
    if(Math.random()<Math.max(0,spreadChance-c.fa*0.001)){
      const d=D4[Math.floor(Math.random()*4)];
      const nx2=x+d[0],ny2=y+d[1];
      if(nx2>=0&&ny2>=0&&nx2<W&&ny2<H&&FLAMMABLE.has(grid[ny2][nx2].type)){
        grid[ny2][nx2].type='fire';grid[ny2][nx2].fa=0;fireCells.add(ny2*W+nx2);
      }
    }
  }
  toRemove.forEach(k=>fireCells.delete(k));
}

// ── WEATHER ───────────────────────────────────────────────────
function updateWeather(){
  weatherTimer--;
  if(weatherTimer>0) return;
  const opts=['clear','clear','clear','rain','rain','storm'];
  weather=opts[Math.floor(Math.random()*opts.length)];
  weatherTimer=300+Math.floor(Math.random()*600);
  daySpeed=weather==='storm'?0.0004:0.0002;
  if(weather==='rain') logEvent('🌧 Начался дождь');
  else if(weather==='storm') logEvent('⛈ Разразилась гроза!');
  else logEvent('☀️ Погода прояснилась');
}

// ── PLAGUE SPREAD ─────────────────────────────────────────────
function updatePlague(){
  if(plagueCells.size===0) return;
  const toRemove=[];
  for(const key of plagueCells){
    const x=key%W,y=Math.floor(key/W);
    if(y<0||y>=H||x<0||x>=W){toRemove.push(key);continue;}
    const c=grid[y][x];
    if(c.type!=='plague'){toRemove.push(key);continue;}
    if(Math.random()<0.002){
      const d=D4[Math.floor(Math.random()*4)];
      const nx2=x+d[0],ny2=y+d[1];
      if(nx2>=0&&ny2>=0&&nx2<W&&ny2<H){
        const nc=grid[ny2][nx2];
        if(nc&&WALKABLE.has(nc.type)&&nc.type!=='plague'){
          nc.type='plague';plagueCells.add(ny2*W+nx2);terrainDirty=true;
        }
      }
    }
  }
  toRemove.forEach(k=>plagueCells.delete(k));
}

// ── ZOMBIE WAVE ───────────────────────────────────────────────
function spawnZombieWave(){
  if(gameOver) return;
  const count=Math.min(15,3+Math.floor(dayCount/3));
  const spawned=[];
  let attempts=count*5;
  while(spawned.length<count&&attempts>0){
    attempts--;
    const side=Math.floor(Math.random()*4);
    let x,y;
    if(side===0){x=Math.floor(Math.random()*W);y=2;}
    else if(side===1){x=Math.floor(Math.random()*W);y=H-3;}
    else if(side===2){x=2;y=Math.floor(Math.random()*H);}
    else{x=W-3;y=Math.floor(Math.random()*H);}
    if(isLand(x,y)) spawned.push({x,y});
  }
  spawned.forEach(pos=>{
    bots.push({x:pos.x,y:pos.y,team:'zombie',hp:3,maxhp:3,
      timer:Math.floor(Math.random()*10),isKnight:false,
      carrying:null,res:0,homeX:pos.x,homeY:pos.y,state:'zombie'});
  });
  if(spawned.length>0){
    logEvent('🧟 Волна зомби! +'+spawned.length);
    playSound('zombie');
    if(navigator.vibrate) navigator.vibrate([50,30,50]);
  }
}

// ── VICTORY CHECK ─────────────────────────────────────────────
function checkVictory(){
  if(gameOver||castles.length===0) return;
  const aliveTeams=new Set(
    castles.filter(c=>!defeated.find(d=>d.castle===c)).map(c=>c.team)
  );
  if(aliveTeams.size!==1) return;
  gameOver=true;
  gameOverTeam=[...aliveTeams][0];
  const el=document.getElementById('victory-overlay');
  if(el){
    el.style.display='flex';
    const names2={red:'КРАСНЫЕ',blue:'СИНИЕ',green:'ЗЕЛЁНЫЕ',gold:'ЗОЛОТЫЕ',zombie:'ЗОМБИ'};
    const vt=document.getElementById('victory-text');
    const vs=document.getElementById('victory-sub');
    if(vt) vt.textContent='🏆 '+(names2[gameOverTeam]||gameOverTeam.toUpperCase())+' ПОБЕДИЛИ!';
    if(vs) vs.textContent='День '+dayCount+' · Все замки покорены';
  }
  playSound('victory');
  if(navigator.vibrate) navigator.vibrate([100,50,100,50,200]);
  logEvent('🏆 '+gameOverTeam+' захватил весь мир!');
}

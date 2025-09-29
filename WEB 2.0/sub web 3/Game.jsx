// ✅ Button + Card (offline-safe)
const Button = ({ children, ...props }) => (
  <button className="btn" {...props}>{children}</button>
);

const Card = ({ children, className }) => (
  <div className={`card ${className||""}`}>{children}</div>
);

// ✅ Emoji-based icons
const PlayIcon = () => <span>▶️</span>;
const PauseIcon = () => <span>⏸️</span>;
const RestartIcon = () => <span>🔄</span>;
const LeftIcon = () => <span>⬅️</span>;
const RightIcon = () => <span>➡️</span>;

// ✅ Skins (all back!)
const playerSkins = {
  kingkong: {
    name: 'KINGKONG',
    draw: (ctx, p) => {
      const isFrame = Math.floor(p.animationFrame/10)%2;
      ctx.fillStyle='#4A4A4A';
      ctx.fillRect(p.x,p.y+5,p.width,p.height-5);
      ctx.fillRect(p.x+8,p.y,p.width-16,15);
      ctx.fillStyle='#D3D3D3';
      ctx.fillRect(p.x+12,p.y+5,p.width-24,7);
      ctx.fillStyle='#000';
      ctx.fillRect(p.x+15,p.y+7,3,3);
      ctx.fillRect(p.x+22,p.y+7,3,3);
      ctx.fillStyle='#4A4A4A';
      if(isFrame){
        ctx.fillRect(p.x+8,p.y+p.height,8,8);
        ctx.fillRect(p.x+24,p.y+p.height,8,8);
      } else {
        ctx.fillRect(p.x+12,p.y+p.height,8,8);
        ctx.fillRect(p.x+20,p.y+p.height,8,8);
      }
    }
  },
  octocat: {
    name: 'Octocat',
    draw: (ctx,p)=>{
      ctx.fillStyle='#24292E';
      ctx.fillRect(p.x,p.y,p.width,p.height-10);
      ctx.fillRect(p.x+10,p.y+p.height-10,p.width-20,10);
      ctx.fillStyle='#FFF';
      ctx.fillRect(p.x+8,p.y+12,8,8);
      ctx.fillRect(p.x+24,p.y+12,8,8);
    }
  },
  ninja: {
    name: 'Ninja',
    draw: (ctx,p)=>{
      ctx.fillStyle='#000';
      ctx.fillRect(p.x,p.y,p.width,p.height);
      ctx.fillStyle='#fff';
      ctx.fillRect(p.x+12,p.y+12,16,6);
    }
  },
  robot: {
    name: 'Robot',
    draw: (ctx,p)=>{
      ctx.fillStyle='#666';
      ctx.fillRect(p.x,p.y,p.width,p.height);
      ctx.fillStyle='#0ff';
      ctx.fillRect(p.x+10,p.y+10,6,6);
      ctx.fillRect(p.x+24,p.y+10,6,6);
    }
  },
  alien: {
    name: 'Alien',
    draw: (ctx,p)=>{
      ctx.fillStyle='#0f0';
      ctx.beginPath();
      ctx.ellipse(p.x+p.width/2,p.y+p.height/2,p.width/2,p.height/2,0,0,Math.PI*2);
      ctx.fill();
      ctx.fillStyle='#000';
      ctx.fillRect(p.x+12,p.y+12,4,8);
      ctx.fillRect(p.x+24,p.y+12,4,8);
    }
  }
};

const skinIds = Object.keys(playerSkins);

// ✅ Game
function Game(){
  const canvasRef=React.useRef(null);
  const loopRef=React.useRef(null);
  const [state,setState]=React.useState("menu");
  const [score,setScore]=React.useState(0);
  const [high,setHigh]=React.useState(localStorage.getItem("runnerHighScore")||0);
  const [skin,setSkin]=React.useState("kingkong");
  const [speed,setSpeed]=React.useState(2);

  const objs=React.useRef({
    player:{x:80,y:200,width:40,height:40,velocityY:0,isJumping:false,animationFrame:0},
    obstacles:[], ground:240
  });

  const jump=React.useCallback(()=>{
    if(state!=="playing") return;
    const p=objs.current.player;
    if(!p.isJumping){ p.velocityY=-14; p.isJumping=true; }
  },[state]);

  const collide=(a,b)=>(
    a.x<a.x+a.width&&a.x+a.width>b.x&&a.y<a.y+a.height&&a.y+a.height>b.y
  );

  const update=React.useCallback(()=>{
    if(state!=="playing") return;
    const c=canvasRef.current,ctx=c.getContext("2d");
    const {player,obstacles}=objs.current;

    ctx.fillStyle="#1E1E1E"; ctx.fillRect(0,0,c.width,c.height);
    player.animationFrame++;
    if(player.isJumping){
      player.y+=player.velocityY; player.velocityY+=0.5;
      if(player.y>=objs.current.ground-player.height){
        player.y=objs.current.ground-player.height; player.isJumping=false; player.velocityY=0;
      }
    }
    if(obstacles.length===0||obstacles[obstacles.length-1].x<c.width-350){
      obstacles.push({x:c.width,y:objs.current.ground-30,width:30,height:30});
    }
    for(let i=obstacles.length-1;i>=0;i--){
      obstacles[i].x-=speed;
      if(obstacles[i].x+obstacles[i].width<0){ obstacles.splice(i,1); setScore(s=>s+10); }
      else if(
        player.x<obstacles[i].x+obstacles[i].width&&player.x+player.width>obstacles[i].x&&
        player.y<obstacles[i].y+obstacles[i].height&&player.y+player.height>obstacles[i].y
      ){
        setState("gameOver");
        if(score>high){ setHigh(score); localStorage.setItem("runnerHighScore",score); }
        return;
      }
    }
    ctx.fillStyle="#2D2D30"; ctx.fillRect(0,objs.current.ground,c.width,2);
    ctx.fillStyle="#3E3E42"; for(let i=0;i<c.width;i+=20) ctx.fillRect(i,objs.current.ground+2,10,1);
    playerSkins[skin].draw(ctx,player);
    ctx.fillStyle="red"; obstacles.forEach(o=>ctx.fillRect(o.x,o.y,o.width,o.height));
    setSpeed(s=>Math.min(s+0.001,5));
  },[state,speed,skin,score,high]);

  const loop=React.useCallback(()=>{
    update(); if(state==="playing"){ loopRef.current=requestAnimationFrame(loop); }
  },[update,state]);

  React.useEffect(()=>{
    const key=(e)=>{
      if(e.code==="Space"||e.code==="ArrowUp"){ e.preventDefault();
        if(state==="playing") jump(); else if(state==="menu"||state==="gameOver") start(); }
    };
    window.addEventListener("keydown",key);
    return()=>window.removeEventListener("keydown",key);
  },[jump,state]);

  const start=()=>{
    setState("playing"); setScore(0); setSpeed(2);
    objs.current={
      player:{x:80,y:objs.current.ground-40,width:40,height:40,velocityY:0,isJumping:false,animationFrame:0},
      obstacles:[], ground:240
    };
  };

  React.useEffect(()=>{
    if(state==="playing") loopRef.current=requestAnimationFrame(loop);
    return()=>{ if(loopRef.current) cancelAnimationFrame(loopRef.current); };
  },[state,loop]);

  React.useEffect(()=>{
    const c=canvasRef.current; c.width=Math.min(800,window.innerWidth-40); c.height=300;
    objs.current.ground=c.height-60; objs.current.player.y=objs.current.ground-40;
  },[]);

  return(
    <div style={{display:"flex",justifyContent:"center",alignItems:"center",minHeight:"100vh"}}>
      <Card>
        <h1>KingKong Runner</h1>
        <p>Score: {score} | High: {high}</p>

        <div style={{marginBottom:"10px"}}>
          <Button onClick={()=>setSkin(skinIds[(skinIds.indexOf(skin)-1+skinIds.length)%skinIds.length])}><LeftIcon/></Button>
          <span style={{margin:"0 10px"}}>{playerSkins[skin].name}</span>
          <Button onClick={()=>setSkin(skinIds[(skinIds.indexOf(skin)+1)%skinIds.length])}><RightIcon/></Button>
        </div>

        <canvas ref={canvasRef} style={{border:"1px solid #555",borderRadius:"8px"}}/>

        {state==="menu"&&<div style={{marginTop:"10px"}}><Button onClick={start}><PlayIcon/> Start</Button></div>}
        {state==="playing"&&<div style={{marginTop:"10px"}}><Button onClick={()=>setState("paused")}><PauseIcon/> Pause</Button></div>}
        {state==="paused"&&<div style={{marginTop:"10px"}}><Button onClick={()=>setState("playing")}><PlayIcon/> Resume</Button></div>}
        {state==="gameOver"&&<div style={{marginTop:"10px"}}><h2>Game Over!</h2><Button onClick={start}><RestartIcon/> Retry</Button></div>}
      </Card>
    </div>
  );
}

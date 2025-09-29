// Lightbox script - intercept clicks on anchors with class 'has-badge'
;(function(){
  const lightbox = document.getElementById('lightbox');
  const iframe = lightbox.querySelector('iframe');
  const closeBtn = lightbox.querySelector('.lightbox-close');
  const backdrop = lightbox.querySelector('.lightbox-backdrop');

  function open(url){
    iframe.src = url;
    lightbox.setAttribute('aria-hidden','false');
    lightbox.classList.add('open');
    document.body.style.overflow = 'hidden';
    // focus close button for accessibility
    closeBtn.focus();
  }
  function close(){
    lightbox.classList.remove('open');
    lightbox.setAttribute('aria-hidden','true');
    iframe.src = '';
    document.body.style.overflow = '';
  }

  // attach handlers
  document.addEventListener('DOMContentLoaded', function(){
    document.querySelectorAll('.img-link.has-badge').forEach(a => {
      a.addEventListener('click', function(e){
        // only intercept left-click without modifier keys
        if(e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        e.preventDefault();
        const url = a.href;
        open(url);
      });
    });

    closeBtn.addEventListener('click', close);
    backdrop.addEventListener('click', close);
    document.addEventListener('keydown', function(e){
      if(e.key === 'Escape' && lightbox.classList.contains('open')) close();
    });
  });
})();

// Starfield background animation with corner-bouncing text
;(function(){
  const canvas = document.getElementById('starfield');
  if(!canvas) return;
  const ctx = canvas.getContext('2d');
  let width = 0, height = 0, stars = [];
  const STAR_COUNT = 160; // base density

  // Moving text settings
  const TEXT = "KING'S HUB";
  let textX = 0;
  let textY = 0;
  let textWidth = 0;
  let textHeight = 0;
  let textFont = '48px system-ui';
  let target = {x:0,y:0};
  let corners = [];
  let currentCorner = -1;
  let textSpeed = 100; // pixels per second (slow)

  function pickNewCorner(){
    if(corners.length === 0) return;
    let next = Math.floor(Math.random() * corners.length);
    // avoid same corner twice
    if(next === currentCorner){
      next = (next + 1 + Math.floor(Math.random()* (corners.length-1))) % corners.length;
    }
    currentCorner = next;
    target.x = corners[next].x;
    target.y = corners[next].y;
  }

  function resize(){
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    width = Math.max(1, window.innerWidth);
    height = Math.max(1, window.innerHeight);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    initStars();
    // compute font size relative to viewport height (smaller for less dominance)
    const fontSize = Math.max(20, Math.round(height * 0.08));
    textFont = `bold ${fontSize}px ${getComputedStyle(document.body).fontFamily || 'system-ui'}`;
    ctx.font = textFont;
    textWidth = Math.ceil(ctx.measureText(TEXT).width);
    textHeight = Math.ceil(fontSize * 1.0);
    const pad = Math.max(18, Math.round(fontSize * 0.35));
    corners = [
      { x: pad, y: pad },
      { x: Math.max(pad, width - textWidth - pad), y: pad },
      { x: pad, y: Math.max(pad, height - textHeight - pad) },
      { x: Math.max(pad, width - textWidth - pad), y: Math.max(pad, height - textHeight - pad) }
    ];
    // start at a random corner
    currentCorner = Math.floor(Math.random() * corners.length);
    textX = corners[currentCorner].x;
    textY = corners[currentCorner].y;
    pickNewCorner();
    // slower speed
    textSpeed = Math.max(18, Math.round(fontSize * 0.6));
  }

  function initStars(){
    stars = [];
    const area = width * height;
    const count = Math.min(500, Math.round(STAR_COUNT * (area / (1280*720))));
    for(let i=0;i<count;i++){
      stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        z: Math.random(),
        r: 0.6 + Math.random() * 1.8,
        vx: (Math.random() - 0.5) * 0.06,
        vy: (Math.random() - 0.5) * 0.06,
        twinkle: Math.random() * Math.PI * 2
      });
    }
  }

  let running = true;
  let last = performance.now();

  function tick(now){
    if(!running) return;
    const dt = Math.min(60, now - last);
    last = now;
    update(dt);
    draw();
    requestAnimationFrame(tick);
  }

  function update(dt){
    const speedFactor = dt * 0.02;
    for(const s of stars){
      s.x += s.vx * speedFactor * (1 + s.z*1.8);
      s.y += s.vy * speedFactor * (1 + s.z*1.8);
      s.twinkle += 0.02 * dt;
      if(s.x < -10) s.x += width + 20;
      if(s.x > width + 10) s.x -= width + 20;
      if(s.y < -10) s.y += height + 20;
      if(s.y > height + 10) s.y -= height + 20;
    }

    // move text toward target corner using constant speed (pixels/sec)
    const dx = target.x - textX;
    const dy = target.y - textY;
    const dist = Math.hypot(dx, dy) || 1;
    const move = (textSpeed * (dt/1000));
    if(dist <= move + 0.5){
      // snap and pick a new corner (avoid immediate repeat)
      textX = target.x;
      textY = target.y;
      // pick a new corner after a short pause
      setTimeout(pickNewCorner, 300 + Math.random()*800);
    } else {
      textX += dx / dist * move;
      textY += dy / dist * move;
    }
  }

  function draw(){
    ctx.clearRect(0,0,width,height);
    // subtle glow background layer
    const g = ctx.createLinearGradient(0,0,0,height);
    g.addColorStop(0, 'rgba(255,255,255,0.03)');
    g.addColorStop(1, 'rgba(255,255,255,0.00)');
    ctx.fillStyle = g;
    ctx.fillRect(0,0,width,height);

    // draw stars brighter
    for(const s of stars){
      const alpha = 0.6 + 0.8 * Math.abs(Math.sin(s.twinkle));
      ctx.beginPath();
      ctx.fillStyle = `rgba(255,255,255,${Math.min(1,(alpha * (0.6 + s.z*1.0))).toFixed(3)})`;
      const size = s.r * (1 + s.z * 2.2);
      ctx.arc(s.x, s.y, size, 0, Math.PI*2);
      ctx.fill();
    }

    // draw moving text with stronger glow
    ctx.save();
    ctx.font = textFont;
    ctx.textBaseline = 'top';
    // stronger glow
    ctx.shadowBlur = Math.max(18, Math.round(parseInt(textFont) * 0.4));
    ctx.shadowColor = 'rgba(255,255,255,0.28)';
    // brighter gradient fill for the text
    const grad = ctx.createLinearGradient(textX, textY, textX + textWidth, textY + 1);
    grad.addColorStop(0, 'rgba(255,255,255,0.28)');
    grad.addColorStop(1, 'rgba(255,255,255,0.12)');
    ctx.fillStyle = grad;
    ctx.fillText(TEXT, textX, textY);
    ctx.restore();
  }

  // pause when page hidden to save CPU
  function onVisibility(){
    if(document.hidden){ running = false; }
    else { running = true; last = performance.now(); requestAnimationFrame(tick); }
  }

  window.addEventListener('resize', resize);
  document.addEventListener('visibilitychange', onVisibility);
  resize();
  requestAnimationFrame(tick);
})();


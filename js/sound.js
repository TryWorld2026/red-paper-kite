/* ============ 音效系统（精简,偏氛围,减少 jump scare） ============ */
const Sound = (function(){
  let ctx=null, enabled=true, heartTimer=null, ambientTimer=null, bgmAudio=null, bgmVolume=0.4;
  function ac(){ if(!ctx){ try{ctx=new (window.AudioContext||window.webkitAudioContext)();}catch(e){} } return ctx; }
  function tone(freq,dur,type,vol,glide){
    if(!enabled) return; const c=ac(); if(!c) return;
    const o=c.createOscillator(),g=c.createGain();
    o.type=type||'sine'; o.frequency.value=freq;
    if(glide) o.frequency.exponentialRampToValueAtTime(Math.max(1,glide),c.currentTime+dur);
    g.gain.value=0; g.gain.linearRampToValueAtTime(vol||0.12,c.currentTime+0.03);
    g.gain.exponentialRampToValueAtTime(0.0001,c.currentTime+dur);
    o.connect(g);g.connect(c.destination); o.start(); o.stop(c.currentTime+dur);
  }
  function noise(dur,vol,filterFreq){
    if(!enabled) return; const c=ac(); if(!c) return;
    const buf=c.createBuffer(1,c.sampleRate*dur,c.sampleRate), d=buf.getChannelData(0);
    for(let i=0;i<d.length;i++) d[i]=(Math.random()*2-1)*Math.pow(1-i/d.length,2);
    const s=c.createBufferSource();s.buffer=buf;
    const f=c.createBiquadFilter();f.type='lowpass';f.frequency.value=filterFreq||800;
    const g=c.createGain();g.gain.value=vol||0.08;
    s.connect(f);f.connect(g);g.connect(c.destination);s.start();
  }
  return {
    setEnabled(v){
      enabled=v;
      if(!v){ this.stopHeart(); this.stopBgm(); }
      else { this.startBgm(); }
    },
    isEnabled(){return enabled;},
    /* 背景音乐循环播放 */
    startBgm(){
      if(!enabled) return;
      if(bgmAudio) return; // 已在播放
      try{
        bgmAudio=new Audio('shiver.mp3');
        bgmAudio.loop=true;
        bgmAudio.volume=bgmVolume;
        bgmAudio.autoplay=true;
        // 淡入
        bgmAudio.volume=0;
        bgmAudio.play().then(()=>{
          let v=0;
          const fade=setInterval(()=>{
            v+=0.04;
            if(v>=bgmVolume){v=bgmVolume;clearInterval(fade);}
            if(bgmAudio) bgmAudio.volume=v;
          },80);
        }).catch(()=>{ /* 自动播放被阻止,等待用户交互 */ });
      }catch(e){}
    },
    stopBgm(){
      if(bgmAudio){
        // 淡出
        const cur=bgmAudio.volume;
        let v=cur;
        const fade=setInterval(()=>{
          v-=0.04;
          if(v<=0){v=0;clearInterval(fade);if(bgmAudio){bgmAudio.pause();bgmAudio=null;}}
          if(bgmAudio) bgmAudio.volume=v;
        },60);
      }
    },
    setBgmVolume(v){ bgmVolume=v; if(bgmAudio) bgmAudio.volume=v; },
    /* 交互音 */
    click(){ tone(420,0.06,'triangle',0.06); },
    select(){ tone(330,0.08,'sine',0.08); },
    type(){ if(!enabled)return; if(Math.random()<0.12) tone(180+Math.random()*40,0.02,'square',0.015); },
    /* 氛围音（留白暗示型核心） */
    candle(){ noise(0.5,0.03,400); },                    // 红烛微响
    paper(){ noise(0.4,0.04,1000); },                    // 纸张窸窣
    drip(){ tone(800,0.05,'sine',0.06); setTimeout(()=>tone(600,0.08,'sine',0.04),80); }, // 滴水
    bell(){ tone(1200,0.3,'sine',0.04); setTimeout(()=>tone(1000,0.4,'sine',0.03),150); }, // 纸鸢铃
    breath(){ noise(0.8,0.025,300); },                   // 极轻呼吸
    ghost(){ tone(280,1.2,'sine',0.05,100); },           // 阴风（收敛）
    /* 关键剧情音 */
    knock(){ tone(110,0.15,'sine',0.2); setTimeout(()=>tone(95,0.15,'sine',0.18),200); setTimeout(()=>tone(110,0.18,'sine',0.2),400);},
    suona(){
      tone(440,0.2,'sawtooth',0.1,500); setTimeout(()=>tone(392,0.25,'sawtooth',0.08,350),180); setTimeout(()=>tone(523,0.35,'sawtooth',0.1,400),380);
    },
    heartbeat(){ tone(60,0.15,'sine',0.15); setTimeout(()=>tone(50,0.18,'sine',0.13),200); },
    /* 结局音 */
    death(){ tone(180,0.8,'sawtooth',0.12,40); setTimeout(()=>noise(0.8,0.08,250),150); },
    reveal(){ tone(523,0.3,'sine',0.08); setTimeout(()=>tone(659,0.3,'sine',0.08),150); setTimeout(()=>tone(784,0.5,'sine',0.1),300); },
    /* 心跳循环（低理智时） */
    startHeart(){ if(heartTimer) return; heartTimer=setInterval(()=>this.heartbeat(),1600); },
    stopHeart(){ if(heartTimer){clearInterval(heartTimer);heartTimer=null;} },
    /* 环境音循环 */
    startAmbient(){
      if(ambientTimer) return;
      ambientTimer=setInterval(()=>{
        if(!enabled) return;
        const r=Math.random();
        if(r<0.3) this.candle();
        else if(r<0.5) this.paper();
        else if(r<0.65) this.drip();
        else if(r<0.75) this.breath();
      }, 8000);
    },
    stopAmbient(){ if(ambientTimer){clearInterval(ambientTimer);ambientTimer=null;} }
  };
})();

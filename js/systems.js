/* ===================================================================
   系统层：时辰推进 / 随机事件 / 成就系统
   =================================================================== */

/* ============ 时辰推进系统 ============ */
/* 时辰: 0戌时 1亥时 2子时 3丑时 4寅时 */
function advanceHour(){
  if(G.hour<4){
    G.hour++;
    pendingTips.push({text:`【时辰】${HOUR_NAMES[G.hour-1]}已过,如今是${HOUR_NAMES[G.hour]}。烛火又短了一截。`,warn:false});
    // 烛火燃尽检查
    if(G.hour>=4 && !hasFlag('litCandle')){
      adjustYin(1);
      pendingTips.push({text:'红烛将尽。黑暗里,有什么在靠近。',warn:true});
    }
    updateStats();
  }
}

/* 检查时辰事件 */
function checkHourEvent(sceneId){
  // 子时三刻唢呐(在探索中枢时触发)
  if(sceneId==='explore' && G.hour>=2 && !hasFlag('ziShiDone') && hasFlag('doneStudy') && hasFlag('doneBridal') && hasFlag('doneShrine')){
    // 由场景自身处理
  }
  // 丑时:环境异变加剧
  if(G.hour>=3 && !hasFlag('chouShiWarned')){
    setFlag('chouShiWarned');
    pendingTips.push({text:'丑时已至。你注意到,墙上的囍字,颜色比刚才更深了。',warn:true});
    adjustYin(1);
  }
  // 寅时:天将明
  if(G.hour>=4 && !hasFlag('yinShiWarned')){
    setFlag('yinShiWarned');
    pendingTips.push({text:'寅时。东方将白。这是最后的时辰。',warn:false});
  }
}

/* ============ 随机事件系统 ============ */
function rollRandomEvents(){
  const pool=Object.keys(RANDOM_EVENTS);
  const count=3+Math.floor(Math.random()*3); // 3-5个
  G.randomEvents=[];
  const shuffled=pool.sort(()=>Math.random()-0.5);
  for(let i=0;i<Math.min(count,shuffled.length);i++){
    G.randomEvents.push(shuffled[i]);
  }
}

function checkRandomEvent(sceneId){
  if(!G.randomEvents || G.randomEvents.length===0) return;
  for(const eid of G.randomEvents){
    const ev=RANDOM_EVENTS[eid];
    if(!ev) continue;
    if(ev.trigger===sceneId && !hasFlag('ev_'+eid)){
      setFlag('ev_'+eid);
      // 延迟触发,在场景渲染后追加提示（不清除现有提示）
      setTimeout(()=>{
        pendingTips.push({text:ev.text, gain:ev.gain, warn:ev.warn});
        if(ev.sound) Sound[ev.sound]();
        if(ev.san) adjustSan(ev.san);
        if(ev.yin) adjustYin(ev.yin);
        if(ev.item){
          giveItem(ev.item);
          // 纸鸢收集成就检查
          if(ev.item==='kite') checkAchievements();
        }
        // 追加到现有提示区域
        const t=el('tip-area');
        if(t){
          pendingTips.forEach(tp=>{
            const d=document.createElement('div');
            d.className='tip-line'+(tp.gain?' gain':'')+(tp.warn?' warn':'');
            d.innerHTML=tp.text;
            t.appendChild(d);
          });
          pendingTips=[];
        }
      }, 1500);
      break;
    }
  }
}

/* ============ 成就系统 ============ */
const ACHIEVEMENTS={
  /* 流程类 */
  first_death:{name:'初入槐阴',desc:'第一次迎来结局。',hint:'完成第一次游戏。'},
  all_endings:{name:'六道轮回',desc:'解开新郎视角全部六种结局。',hint:'探索所有可能的终局。'},
  /* 规则类 */
  no_rule_broken:{name:'守礼之人',desc:'全程不违反任何真禁忌,通关。',hint:'找出真禁忌,并一条也不违反。'},
  broke_all_rules:{name:'忤逆新郎',desc:'违反全部四条真禁忌,仍活到结局。',hint:'反其道而行之,但活了下来。'},
  no_cord:{name:'不受束缚',desc:'拒绝系红绳。',hint:'识破第一条假规则。'},
  no_turn:{name:'不回首',desc:'子时唢呐响时,死不回首。',hint:'忍住好奇心。'},
  mirror_trick:{name:'借镜观形',desc:'用阴阳铜镜照身后,不回头便过了子时。',hint:'道具的巧妙运用。'},
  /* 探索类 */
  all_truths:{name:'真相大白',desc:'查明全部六处真相。',hint:'不放过任何一个线索。'},
  find_under:{name:'地宫探秘',desc:'发现并探索地宫。',hint:'铜镜与桃木簪,或许能打开新的路。'},
  all_items:{name:'行囊满载',desc:'收集全部道具。',hint:'仔细搜索每一个角落。'},
  /* 速度类 */
  fast_truth:{name:'速悟',desc:'在子时之前查明全部真相。',hint:'效率也是一种天赋。'},
  /* 特殊类 */
  save_ayuan:{name:'替她说话',desc:'超度阿鸢,助其安息。',hint:'天明前,烧却骨灰与婚书。'},
  truth_ending:{name:'槐阴无新郎',desc:'以真相结局通关。',hint:'带全部证据走出村口。'},
  illusion_5:{name:'幻中作乐',desc:'点击5次幻象选项。',hint:'理智越低,看到的越多……'},
  kite_collector:{name:'纸鸢收藏家',desc:'收集全部红纸鸢。',hint:'它们藏在宅子的各处。'},
  ng_plus:{name:'前尘不忘',desc:'以携带记忆的二周目通关。',hint:'有些事,记得比忘了更痛苦。'},
  /* 视角类 */
  ayuan_pov:{name:'鸢之视角',desc:'以阿鸢视角完成游戏。',hint:'换一双眼睛看这个故事。'},
  po_pov:{name:'喜婆之眼',desc:'以喜婆视角完成游戏。',hint:'你以为的恶人,也有她的故事。'}
};

let illusionClickCount=0;

function checkAchievements(){
  // 幻象点击计数
  if(G.achievements.includes('illusion_5')===false && illusionClickCount>=5){
    unlockAchievement('illusion_5');
  }
  // 全道具（纸鸢只需1个即可计入）
  const allItemIds=Object.keys(ITEMS);
  if(allItemIds.every(id=>hasItem(id)) && !hasAchievement('all_items')){
    unlockAchievement('all_items');
  }
  // 全真相
  if(G.truths.length>=TRUTH_TOTAL && !hasAchievement('all_truths')){
    unlockAchievement('all_truths');
  }
  // 速悟
  if(G.truths.length>=TRUTH_TOTAL && G.hour<2 && !hasAchievement('fast_truth')){
    unlockAchievement('fast_truth');
  }
  // 地宫
  if(hasFlag('fullTruth') && !hasAchievement('find_under')){
    unlockAchievement('find_under');
  }
  // 纸鸢收集（检查道具栏中的纸鸢数量）
  const kiteCount = G.inventory.filter(id=>id==='kite').length;
  if(kiteCount>=3 && !hasAchievement('kite_collector')){
    unlockAchievement('kite_collector');
  }
}

function checkEndingAchievements(endId){
  unlockAchievement('first_death');
  // 全结局（只检查新郎视角的6个结局）
  const newcomerEndings=['puppet','substitute','flee','save','together','truth'];
  const ends=getEndings();
  const newcomerUnlocked=newcomerEndings.filter(id=>ends.includes(id));
  if(newcomerUnlocked.length>=newcomerEndings.length && !hasAchievement('all_endings')){
    unlockAchievement('all_endings');
  }
  // 不违反规则通关
  if(!hasFlag('woreCord') && !hasFlag('turned') && !hasFlag('peekedBride') && !hasFlag('calledName')){
    if(!hasAchievement('no_rule_broken')) unlockAchievement('no_rule_broken');
  }
  // 违反全部规则仍活到结局
  if(hasFlag('woreCord') && hasFlag('turned') && hasFlag('peekedBride') && hasFlag('calledName')){
    if(!hasAchievement('broke_all_rules')) unlockAchievement('broke_all_rules');
  }
  // 各结局专属
  if(endId==='save' && !hasAchievement('save_ayuan')) unlockAchievement('save_ayuan');
  if(endId==='truth' && !hasAchievement('truth_ending')) unlockAchievement('truth_ending');
  if(endId==='truth' && !hasAchievement('ayuan_pov')) {} // 视角解锁另处理
  // New Game+
  if(G.carriedMemory && !hasAchievement('ng_plus')) unlockAchievement('ng_plus');
  // 视角通关
  if(G.pov==='ayuan' && !hasAchievement('ayuan_pov')) unlockAchievement('ayuan_pov');
  if(G.pov==='po' && !hasAchievement('po_pov')) unlockAchievement('po_pov');
}

/* 幻象选项点击计数 */
function onIllusionClick(){
  illusionClickCount++;
  if(illusionClickCount>=5 && !hasAchievement('illusion_5')){
    unlockAchievement('illusion_5');
  }
}

/* ============ 遗物表 (v3)：物即称呼的碎片 ============
   read 是玩家当场读到的原文。它存在，是为了让"她说过什么"可以被回看核对，
   而不是只留在作者的记忆里 —— 契约第 3 条：每次异常都要能被回溯验证。 */
const ITEMS = {
  fatherLetter:{name:'父亲的信',desc:'抬头是"周家小女"。落款的叮嘱，比信更长。',
    read:'生于某年某月，某时。性静，不善言。<br><br>末尾一行：<span class="ghost">「嫁入陈门后，勿再提周家旧事。」</span><br><br>信上写她生于何日，没有写她喜欢什么。'},
  marriageLetter:{name:'夫家的信',desc:'字迹端正得像牌位。她说"一切礼数，由新郎代全"。',
    read:'<span class="ghost">「吉时已定，新妇入轿。此后一切礼数，由新郎代全。」</span><br><br>字迹一笔一画，端正得像刻在牌位上。落款处不是你父亲的手，也不是她的。'},
  unfinishedLetter:{name:'没有抬头的纸',desc:'「若我还能选，我想先选自己。」落款空着。',
    read:'等我绣完这只纸鸢，我自己取名。<br><br><span class="ghost">「父亲说我归母家，夫家说我归夫门。若我还能选，我想先选自己。」</span><br><br>落款是空的。'},
  kite:{name:'未糊完的纸鸢',desc:'背面有一个被涂黑又刮开的字，笔画很急。',
    read:'正面被涂黑的地方隐约可辨：<span class="em">“新娘”</span>。<br><br>翻过来，刮开的墨底下是一个更小的自书：<span class="em">鸢</span>。<br><br>不是“阿鸢”，不是“周氏”，也不是“陈门新妇”。'},
  burnedPage:{name:'焦黑的婚书残页',desc:'夫家的名字烧没了，"新妇"两个字却烧不掉。',
    read:'火舌过去之后，夫家所有人的名字都没了，只剩中间两个字烧出个焦边：<span class="em">“新妇”</span>。<br><br>你意识到：烧掉婚书，并不等于还给她名字。'}
};

function hasItem(id){ return G.inventory.includes(id); }
function giveItem(id){
  if(!hasItem(id)){
    G.inventory.push(id);
    const it=ITEMS[id];
    if(it) pendingTips.push({text:`【拾起】${it.name}`,gain:true});
  }
}

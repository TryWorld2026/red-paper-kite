/* ============ 遗物表 (v3)：物即称呼的碎片 ============ */
const ITEMS = {
  fatherLetter:{name:'父亲的信',desc:'抬头是"周家小女"。落款的叮嘱，比信更长。'},
  marriageLetter:{name:'夫家的信',desc:'字迹端正得像牌位。她说"一切礼数，由新郎代全"。'},
  unfinishedLetter:{name:'没有抬头的纸',desc:'「若我还能选，我想先选自己。」落款空着。'},
  kite:{name:'未糊完的纸鸢',desc:'背面有一个被涂黑又刮开的字，笔画很急。'},
  burnedPage:{name:'焦黑的婚书残页',desc:'夫家的名字烧没了，"新妇"两个字却烧不掉。'}
};

function hasItem(id){ return G.inventory.includes(id); }
function giveItem(id){
  if(!hasItem(id)){
    G.inventory.push(id);
    const it=ITEMS[id];
    if(it) pendingTips.push({text:`【拾起】${it.name}`,gain:true});
  }
}
function takeItem(id){ G.inventory=G.inventory.filter(x=>x!==id); }

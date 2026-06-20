/* ============ 道具表 ============ */
const ITEMS = {
  candle:{name:'半截红烛',desc:'只剩半截,微弱地跳动。燃尽之时,便是天明。'},
  rulebook:{name:'《陈氏婚仪禁忌》',desc:'残缺的纸册,记载着诡异的规矩。字迹有新有旧。'},
  paperBride:{name:'纸扎新娘',desc:'一具糊得极精巧的纸人,眉眼含笑。你总觉得她在看你。'},
  redCord:{name:'红绳',desc:'系物辟邪,也可缚鬼。喜婆说该系在腕上——但血字说不要。'},
  coins:{name:'六枚铜钱',desc:'陪葬的买路钱。正面朝上的,有几枚?'},
  fragment1:{name:'婚书残页·一',desc:'…嫁与陈氏三郎…'},
  fragment2:{name:'婚书残页·二',desc:'…生不同衾,死当同穴…'},
  fragment3:{name:'婚书残页·三',desc:'…以活人填,方全礼数…'},
  ash:{name:'骨灰陶',desc:'无人认领的灰烬。捧在手里,是温的。'},
  mirror:{name:'阴阳铜镜',desc:'照得见人,也照得见鬼。镜面幽暗,映出的不一定是此刻。'},
  peach:{name:'桃木簪',desc:'克制邪祟之物。簪头刻着一朵鸢尾花。'},
  scissors:{name:'锈剪刀',desc:'剪红纸用的,刀口有暗褐痕迹。不知是锈,还是别的什么。'},
  charcoal:{name:'黑炭',desc:'祠堂地上捡的。可以写字——但你确定要写吗?'},
  kite:{name:'红纸鸢',desc:'一只糊得精巧的纸鸢。线还在,像是等着谁来放。'},
  fullBook:{name:'真禁忌册',desc:'阿鸢亲笔。娟秀的字迹,急切的语气。'},
  villageRecord:{name:'村志',desc:'记载着槐阴村九十年的秘密。每一页都沾着别人的命。'},
  weddingLetter:{name:'完整婚书',desc:'地宫中找到的。上面写着你的生辰。'},
  jadePendant:{name:'玉佩',desc:'阿鸢生前的物件。攥在手里,能听见极轻的叹息。'}
};

function hasItem(id){ return G.inventory.includes(id); }
function giveItem(id){
  // 纸鸢可以重复收集（用于成就）
  if(id==='kite'){
    G.inventory.push(id);
    const it=ITEMS[id];
    if(it) pendingTips.push({text:`【获得】${it.name}`,gain:true});
    return;
  }
  if(!hasItem(id)){
    G.inventory.push(id);
    const it=ITEMS[id];
    if(it) pendingTips.push({text:`【获得】${it.name}`,gain:true});
  }
}
function takeItem(id){ G.inventory=G.inventory.filter(x=>x!==id); }

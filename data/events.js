/* ===================================================================
   随机事件池 —— 每局随机抽取3-5个,增加重玩变化
   trigger: 触发场景
   =================================================================== */

const RANDOM_EVENTS={
  /* 氛围类（无言恐怖） */
  candle_out:{
    trigger:'gate',
    text:'你进门时,门楣的白灯笼闪了闪,灭了。只剩红灯笼还亮着。',
    sound:'candle', yin:1, warn:true
  },
  paper_move:{
    trigger:'bridal',
    text:'你回头时,轿帘的位置似乎和刚才不一样了。也许是你记错了。',
    sound:'paper', yin:1, warn:true
  },
  wall_bleed:{
    trigger:'hall1',
    text:'堂上的"囍"字,墨迹似乎比刚才更红了。你不确定是不是烛影的缘故。',
    sound:null, yin:1, warn:true
  },
  mirror_shadow:{
    trigger:'mirror',
    text:'铜镜里,你的身后多了一道影子。但当你转头,身后空无一人。',
    sound:'breath', san:-1, warn:true
  },
  distant_cry:{
    trigger:'explore',
    text:'远处传来一声极轻的哭声。不像是人,也不像是风。你分不清方向。',
    sound:'ghost', san:-1, warn:true
  },
  shoe_appear:{
    trigger:'study',
    text:'书架下,多了一双绣花鞋。鞋尖朝着门外。刚才这里明明什么都没有。',
    sound:'paper', yin:1, warn:true
  },
  kite_fall:{
    trigger:'explore',
    text:'老槐枝头,一只红纸鸢断了线,飘飘荡荡落在你脚边。你捡了起来。',
    sound:'bell', item:'kite', gain:true
  },
  wine_ripple:{
    trigger:'bridal',
    text:'桌上的合卺酒,酒面无风自动,泛起一圈涟漪。像有什么在酒里呼吸。',
    sound:'drip', yin:1, warn:true
  },
  tablet_name:{
    trigger:'shrine',
    text:'你瞥见祠堂正中的牌位上,"陈三郎"三个字,似乎变成了别的名字。再看,又变回来了。',
    sound:null, san:-1, warn:true
  },
  po_whisper:{
    trigger:'hall2',
    text:'喜婆转身时,你听见她极轻地嘀咕了一句:"这一个……倒像是她等的那个人。"',
    sound:null, san:0, warn:false
  },
  /* 道具/线索类 */
  hidden_kite:{
    trigger:'study2',
    text:'你在经书堆里,发现一只被压扁的红纸鸢。纸背上写着两个字:"等我"。',
    sound:'bell', item:'kite', gain:true
  },
  extra_coin:{
    trigger:'shrine2',
    text:'供桌下的暗格里,除了禁忌册,还滚落出一枚铜钱。和你在新房找到的不一样——这枚是冷的。',
    sound:null, item:'coins', gain:true
  },
  jade_find:{
    trigger:'mirror',
    text:'镜台下的缝隙里,卡着一枚玉佩。上面刻着鸢尾花。攥在手里,你听见一声极轻的叹息。',
    sound:'breath', item:'jadePendant', gain:true
  },
  /* 正向类 */
  candle_steady:{
    trigger:'gate',
    text:'你深吸一口气。门楣的灯笼忽然亮了起来,比之前更稳。像是有什么在帮你。',
    sound:'candle', san:1, gain:true
  },
  kite_sign:{
    trigger:'explore',
    text:'老槐枝头的纸鸢,在风中齐齐转向了同一个方向——那是东厢新房。像是在指引你。',
    sound:'bell', san:0, gain:true
  }
};

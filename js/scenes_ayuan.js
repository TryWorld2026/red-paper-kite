/* ===================================================================
   阿鸢视角 —— 以纸新娘/绣娘阿鸢的重玩视角
   看到她被殉葬的真相,她在轿中的等待,她对每个"新郎"的观察
   =================================================================== */

const SCENES_AYUAN={

ayuan_intro:{
  title:'九十年前 · 槐阴村',
  run(){
    Sound.bell();
    return {
      text:`你是阿鸢。槐阴村的绣娘。<br><br>
        你绣的花,村里没人比得上。你绣的纸鸢,能飞得最高。<br><br>
        民国二十三年,春。陈家三郎病死了。陈家族长说,三郎未婚而亡,凶煞不散,须行冥婚,方全阴阳。<br><br>
        他们选了你。`,
      choices:[
        {text:'……', go:'ayuan_chosen'}
      ]
    };
  }
},

ayuan_chosen:{
  title:'被选中的那天',
  run(){
    return {
      text:`族长派人来通知你娘。你娘跪在门口哭了一夜。<br><br>
        你听见她求他们:"鸢儿才十六……三郎已经死了……为什么还要活人……"<br><br>
        族长说:<span class="ghost">"这是规矩。陈氏的规矩。你女儿嫁过去,是去做新娘,不是去死。"</span><br><br>
        你知道他在说谎。但你没有选择。`,
      tips:[{text:'【阿鸢的记忆】你被选中行冥婚。你娘求过,没有用。'}],
      choices:[
        {text:'……', go:'ayuan_nailed'}
      ]
    };
  }
},

ayuan_nailed:{
  title:'入棺',
  run(){
    Sound.ghost();
    return {
      text:`他们给你穿上嫁衣,盖上盖头。<br><br>
        八抬大轿,把你抬进陈家祠堂。你听见喜婆念喜词,听见唢呐声,听见很多人的脚步。<br><br>
        然后他们把你塞进棺材。你挣扎,你喊叫。你娘不在。<br><br>
        有人按住你的手,有人按住你的脚。最后一颗钉子砸进来的时候,你听见了自己的骨头在响。<br><br>
        <span class="em">黑暗。</span>`,
      tips:[{gain:true,text:'【真相】阿鸢是被活活钉入棺中的。她挣扎过,呼救过,没有人来。'}],
      choices:[
        {text:'……', action:()=>{ addTruth('ayuanDeath'); goTo('ayuan_darkness'); }}
      ]
    };
  }
},

ayuan_darkness:{
  title:'黑暗中',
  run(){
    return {
      text:`你在黑暗里。不知道过了多久。<br><br>
        你用指甲在棺壁上刻字。你写你的名字,写你的冤屈,写你娘的名字。<br><br>
        没有人听见。没有人来。<br><br>
        你死后,你的怨念没有散。你化成了纸新娘,端坐在轿中,等着。<br><br>
        等一个肯替你说话的人。`,
      choices:[
        {text:'等……', go:'ayuan_waiting'}
      ]
    };
  }
},

ayuan_waiting:{
  title:'九十年后 · 轿中',
  run(){
    Sound.paper();
    return {
      text:`九十年了。你送走了很多"新郎"。<br><br>
        有的系了红绳,你只能看着他们被替死。<br>
        有的回了头,你只能看着他们疯掉。<br>
        有的喝了合卺酒,你只能看着他们变成纸偶。<br><br>
        你试过提醒他们。你在镜中指,在轿底藏线索,在祠堂留下真禁忌册。<br>
        但没有人听。没有人看见。<br><br>
        <span class="whisper">今夜,又来了一个。</span>`,
      choices:[
        {text:'观察这个新郎', go:'ayuan_observe'}
      ]
    };
  }
},

ayuan_observe:{
  title:'观察',
  run(){
    return {
      text:`他走进喜堂。他接过禁忌册。他翻开看了。<br><br>
        你在轿帘后面,看着他。他的眼睛和你九十年前见过的人不一样。他在思考。<br><br>
        喜婆让他系红绳。你在心里喊:<span class="em">不要系。那是假的。</span><br><br>
        他听不见你。没有人听得见你。`,
      choices:[
        {text:'他系了红绳', action:()=>{ setFlag('ayuan_sawCord'); adjustYin(1); goTo('ayuan_help'); }, disabled:hasFlag('ayuan_sawRefuse')},
        {text:'他没有系红绳', action:()=>{ setFlag('ayuan_sawRefuse'); adjustSan(1); goTo('ayuan_help'); }, disabled:hasFlag('ayuan_sawCord')}
      ]
    };
  }
},

ayuan_help:{
  title:'试图帮助',
  run(){
    return {
      text:`你决定帮他。<br><br>
        你能做的事很少。你只能在镜中指路,在轿底藏线索,在祠堂留下真禁忌册。<br><br>
        你看着他走进书房,找到族谱。你看着他走进新房,发现铜镜。你看着他走进祠堂,找到真禁忌册。<br><br>
        <span class="whisper">他看见了。他终于看见了。</span><br><br>
        但你不确定他会不会帮你。九十年了,你不确定。`,
      choices:[
        {text:'等待他的抉择', go:'ayuan_finale'}
      ]
    };
  }
},

ayuan_finale:{
  title:'最后的等待',
  run(){
    Sound.stopHeart();
    return {
      text:`寅时。天将明。他站在喜堂前,喜婆端着合卺酒。<br><br>
        你在轿中,一动不动。你在等。<br><br>
        九十年了。你等了九十年。<br><br>
        <span class="em">他会怎么做?</span>`,
      choices: buildAyuanFinaleChoices()
    };
  }
}

};

function buildAyuanFinaleChoices(){
  const c=[];
  // 阿鸢无法直接行动,只能等待,但可以选择"以怨念推动"或"放手"
  c.push({text:'【以怨念推动】让他看见你的痛苦,逼他帮你', action:()=>{
    adjustYin(2);
    if(hasFlag('ayuan_sawRefuse')){
      reachEnding('ayuan_saved');
    } else {
      reachEnding('ayuan_angry');
    }
  }});
  c.push({text:'【放手】不再执着,任他选择', action:()=>{
    if(hasFlag('ayuan_sawRefuse')){
      reachEnding('ayuan_peace');
    } else {
      reachEnding('ayuan_fade');
    }
  }});
  return c;
}

/* 阿鸢视角结局 */
const AYUAN_ENDINGS={
  ayuan_saved:{ type:'good', tag:'— 阿鸢视角 · 壹 —', name:'被 听 见', text:'他烧了你的骨灰和婚书。他念了你的名字。九十年了,终于有人肯替你说话。火光里,你感到自己的怨念在消散。你垂下头,第一次,没有笑。你在笑,因为你终于可以不笑了。'},
  ayuan_angry:{ type:'death', tag:'— 阿鸢视角 · 贰 —', name:'怨 念', text:'你的怨念太重了。他系了红绳,他违反了规矩,他没能帮你。你看着他变成新的纸偶,你感到一阵空虚的快意——然后是更深的空虚。九十年了,你还在等。'},
  ayuan_peace:{ type:'good', tag:'— 阿鸢视角 · 叁 —', name:'解 脱', text:'你放下了。你不再执着于被超度。你看着那个没有系红绳的新郎走出村口,你感到一丝宽慰。或许,不是每个故事都有结局。但至少,他活了下来。你,也可以歇歇了。'},
  ayuan_fade:{ type:'normal', tag:'— 阿鸢视角 · 肆 —', name:'消 散', text:'你放手了。你的怨念慢慢消散,像纸灰一样飘散在晨风里。没有人帮你,但你也不再需要了。九十年,够久了。你最后看了一眼那个新郎,他喝下了合卺酒。你闭上了眼。'}
};

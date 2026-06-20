/* ===================================================================
   喜婆视角 —— 以喜婆的重玩视角
   操控喜婆引导新郎,选择是救他还是害他
   =================================================================== */

const SCENES_PO={

po_intro:{
  title:'槐阴村 · 喜婆的清晨',
  run(){
    Sound.candle();
    return {
      text:`你是喜婆。槐阴村的喜婆。<br><br>
        你送走过很多新郎。你记不清具体多少个了。九十年,够久了。<br><br>
        今夜又有一个要来。一个外乡的读书人,说是要考证什么"纸扎冥婚"。<br><br>
        族长交代你:照旧。给他禁忌册,让他系红绳,让他行礼。<br><br>
        但你老了。你开始厌倦。`,
      choices:[
        {text:'准备迎接新郎', go:'po_prepare'}
      ]
    };
  }
},

po_prepare:{
  title:'准备',
  run(){
    return {
      text:`你把喜堂布置好。红烛,合卺酒,白纸剪的囍字。<br><br>
        你拿出那本假禁忌册。九十年前,族长亲手写的。第一条是假的——系红绳,其实是替死。<br><br>
        你又拿出一截红绳和一把锈剪刀。<br><br>
        <span class="whisper">你可以把真禁忌册藏在祠堂里。你也可以不藏。</span><br><br>
        你犹豫了一下。`,
      choices:[
        {text:'【救他】把真禁忌册藏在祠堂暗格', action:()=>{ setFlag('po_hidBook'); adjustSan(1); goTo('po_meet'); }, log:'喜婆藏真册'},
        {text:'【害他】什么都不做,照旧', action:()=>{ setFlag('po_didNothing'); goTo('po_meet'); }, log:'喜婆不作为'},
        {text:'【试探】把桃木簪留在书房,看他找不找得到', action:()=>{ setFlag('po_leftPeach'); goTo('po_meet'); }, log:'喜婆留簪'}
      ]
    };
  }
},

po_meet:{
  title:'喜堂 · 新郎至',
  run(){
    return {
      text:`他来了。年轻,戴着眼镜,背着行囊。像个读书人。<br><br>
        你把禁忌册递给他:<span class="ghost">"既来了,便是新郎官。这是《陈氏婚仪禁忌》,今夜子时至寅时,你须一一记住。"</span><br><br>
        你又补了一句:<span class="whisper">"规矩嘛……有些是真,有些是假。新郎官自己分辨咯。"</span><br><br>
        这句话,你每次都说。但这一次,你说的格外认真。你不知道他听没听出来。`,
      choices:[
        {text:'观察他的选择', go:'po_observe'}
      ]
    };
  }
},

po_observe:{
  title:'观察',
  run(){
    return {
      text:`你让他去四处逛逛。你坐在喜堂,看着他走向中庭。<br><br>
        你能做的,已经做了。剩下的,看他自己。<br><br>
        你想起九十年前,那个叫阿鸢的绣娘。你当时也是喜婆。你亲手把她塞进棺材。<br><br>
        你没有选择。族长的命令。但你记得她的眼睛。她看着你,没有恨,只有困惑。<br><br>
        <span class="whisper">九十年了,你还在想那双眼睛。</span>`,
      choices:[
        {text:'继续观察', go:'po_observe2'}
      ]
    };
  }
},

po_observe2:{
  title:'喜堂 · 等待',
  run(){
    return {
      text:`子时三刻。唢呐响了。<br><br>
        你看着他在中庭。他会不会回头?<br><br>
        你想起上一个新郎。他回了头。你看着他疯掉,看着他变成纸偶。你什么都没说。<br><br>
        这一次,你可以做点什么。你可以咳嗽一声,提醒他不要回头。你也可以沉默。`,
      choices:[
        {text:'【救他】咳嗽一声,提醒他不要回头', action:()=>{ setFlag('po_warned'); adjustSan(1); goTo('po_zishi'); }, log:'喜婆提醒'},
        {text:'【沉默】什么都不做', action:()=>{ goTo('po_zishi'); }, log:'喜婆沉默'}
      ]
    };
  }
},

po_zishi:{
  title:'子时过后',
  run(){
    return {
      text:`子时过了。他还活着。<br><br>
        你看着他继续探索。他找到了族谱,找到了铜镜,找到了祠堂里的真禁忌册——如果你藏了的话。<br><br>
        天快亮了。你该端着合卺酒去见他了。<br><br>
        <span class="em">这是最后的时刻。你可以做最后的抉择。</span>`,
      choices:[
        {text:'端着合卺酒,前往喜堂', go:'po_finale'}
      ]
    };
  }
},

po_finale:{
  title:'寅时 · 最后的抉择',
  run(){
    Sound.stopHeart();
    return {
      text:`你端着合卺酒,站在他面前。<br><br>
        <span class="ghost">"时辰到了,新郎官。行礼,便是夫妻;不行……这宅子,可没那么容易放人走。"</span><br><br>
        这句话,你说了九十年。每一次,你都看着他们喝下去。每一次,你都看着他们变成纸偶。<br><br>
        你的手在抖。合卺酒在碗里晃。<br><br>
        <span class="em">你可以做最后的抉择。</span>`,
      choices: buildPoFinaleChoices()
    };
  }
}

};

function buildPoFinaleChoices(){
  const c=[];
  // 喜婆的最终选择
  c.push({text:'【救他】打翻合卺酒,告诉他真相', action:()=>{
    if(hasFlag('po_hidBook')||hasFlag('po_warned')||hasFlag('po_leftPeach')){
      reachEnding('po_redemption');
    } else {
      reachEnding('po_attempt');
    }
  }, log:'喜婆打翻酒'});
  c.push({text:'【放他走】假装没看见,让他逃', action:()=>{
    reachEnding('po_release');
  }, log:'喜婆放人'});
  c.push({text:'【照旧】把酒递给他', action:()=>{
    reachEnding('po_duty');
  }, log:'喜婆照旧'});
  return c;
}

/* 喜婆视角结局 */
const PO_ENDINGS={
  po_redemption:{ type:'good', tag:'— 喜婆视角 · 壹 —', name:'赎 罪', text:'你打翻了合卺酒。你告诉他一切——阿鸢,假禁忌册,九十年来的新郎。他带着证据走出了槐阴村。你留在喜堂,等着族长的惩罚。但你心里,九十年头一回,觉得轻松了些。那双眼睛,终于不再看着你了。'},
  po_attempt:{ type:'normal', tag:'— 喜婆视角 · 贰 —', name:'徒 劳', text:'你想救他,但你之前什么都没做。他没有找到真禁忌册,他不相信你。他看着你打翻合卺酒,只当你是疯子。他逃了出去,但你不知道他能不能活到天亮。你做了你能做的,但那不够。九十年了,你欠的太多。'},
  po_release:{ type:'normal', tag:'— 喜婆视角 · 叁 —', name:'放 行', text:'你假装没看见他逃走。你端着合卺酒,站在空荡荡的喜堂里。族长会怪罪你。但你老了,你不在乎了。你想起阿鸢,想起那些新郎。你希望这一次,有人能活着走出去。'},
  po_duty:{ type:'death', tag:'— 喜婆视角 · 肆 —', name:'照 旧', text:'你把酒递给他。他喝了下去。你看着他变成纸偶,像看了九十年一样。你把他塞进轿中,合上轿帘。你回到喜堂,坐下,等下一个。九十年了,你还在等。你不知道自己还在等什么。'}
};

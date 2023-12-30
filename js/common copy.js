'use strict';
const body    = document.querySelector('body');
const main    = document.querySelector('main');
const header  = document.querySelector('header');
/* ※この文書では、Safariでbodyにoverflow-x: hidden;が効かないため、
// sub-bodyでposition: fixed;, width, heightを100, overflow-x: hidden;、
// bodyにoverflow-y: scrollとし、windowのスクロールをsubbodyのスクロールに肩代わりさせている。
// そのため、window.scrollは常に0を返す。
// scroll位置の取得はwindow.scrollではなく、subbody.scrollTopで取得できる。
*/
const subBody = document.querySelector('.sub-body');

// resizeイベント発火時に横幅の変化があったか判定するのに使う
let currentWidth = innerWidth;

const accDuration = getMs(document.documentElement, '--duration-acc');

// px単位で指定されるプロパティを数値で取得するのに便利
function getPx( elm, prop) { return Number(getComputedStyle(elm).getPropertyValue(prop).replace('px',  '')) }
function getRem(elm, prop) { return Number(getComputedStyle(elm).getPropertyValue(prop).replace('rem', '')) }
function getMs( elm, prop) { return Number(getComputedStyle(elm).getPropertyValue(prop).replace('ms',  '')) }
function remToPx(rem) {
  if      ( 1024 < innerWidth                      ) { return rem * ( 16 * (62.5/100) );}
  else if (  900 < innerWidth && innerWidth < 1024 ) { return rem * ( 16 * (50.0/100) );}
  else if (  600 < innerWidth && innerWidth <  900 ) { return rem * ( 16 * (45.0/100) );}
  else if (    0 < innerWidth && innerWidth <  600 ) { return rem * ( 16 * (40.0/100) );}
}
// 0からmaxまでの乱数生成
function randByMax(max) { return Math.random() * max }

// spのダブルタップで拡大する仕様を回避
document.addEventListener('dblclick', (e) => {e.preventDefault()});
// load時にanimationが再生される問題を回避するためにつけていたclassを除去してanimationを有効化
// http://14-00.com/archives/31
window.addEventListener('DOMContentLoaded', () => { body.classList.remove('preload') });

// resizeイベントの処理の実行猶予時間[ms]
const resizeDelay = 300;


{




////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////
// menu aside内のアコーディオン ////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////
const navInAside = document.querySelector('aside nav');
const accLis = document.querySelectorAll('.li-first-floor, .li-second-floor');
const accUls = document.querySelectorAll('.ul-second-floor, .ul-third-floor');

// CSS変数の取得

const defaultHeight = accLis[0].getBoundingClientRect().height;
function swithAccordion(targetLi, i) {
  // 階層: grandparent li > ul > target li > child ul (> li > ul > li)
  const grandParentLi = targetLi.parentNode.parentNode;
  const grandParentLiHeight = grandParentLi.getBoundingClientRect().height;
  const childUlHeight = accUls[i].getBoundingClientRect().height;
  accUls[i].classList.toggle('open');

  // OPEN Accordion ----------------------------------------------------------------
  if (accUls[i].classList.contains('open')) {
    // 展開する子要素のulの高さ分target elementを広げる
    targetLi.style.height = `${defaultHeight + childUlHeight}px`;

    if (targetLi.classList.contains('li-second-floor')) { // 第二階層のクリックだった場合
      // 第一階層のliの高さも連動して広げる
      grandParentLi.style.height = `${grandParentLiHeight + childUlHeight}px`;
    }
  }
  // --------------------------------------------------------------------------------

  // CLOSE Accordion ----------------------------------------------------------------
  else if (!accUls[i].classList.contains('open')) {
    // 展開する子要素のulの高さ分、親(target element)を縮める
    targetLi.style.height = `${defaultHeight}px`;

    if (targetLi.classList.contains('li-second-floor')) { // 第二階層のクリックだった場合
      // 第一階層のliの高さも連動して縮める
      grandParentLi.style.height = `${grandParentLiHeight - childUlHeight}px`;
    }
  }
  // --------------------------------------------------------------------------------
}

accLis.forEach((li, i) => {
  li.addEventListener('click', (e) => {
      e.stopPropagation(); // 子要素のクリックで親要素のイベントも発火する仕様を回避

      if (!navInAside.classList.contains('disabled')) {
        // click直後から展開animation終了まで再clickを禁止
        navInAside.classList.add('disabled');
        setTimeout(() => { navInAside.classList.remove('disabled') }, accDuration);

        // Accordion の開閉を実行
        swithAccordion(li, i);
      }
  });
});

////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////
// 泡のアニメーション //////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////
/* Intersection Observer API
  要素を監視し、(主に)画面内に入った等のタイミングで、処理を実行できる。
    --- IE以外は組み込みで使える。
    --- 'scroll'イベントで監視するより処理が軽くなる。
    --- アニメーションを画面内に入った時だけ再生することで、ブラウザへの負荷が軽くなる。

  [構文・使い方]
    document.addEventListener('DOMContentLoaded', () => {
      // intersection observer オブジェクトの生成
      const io = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) { 画面内に入ったら実行する処理 }
        else                      { 画面外に出たら実行する処理 }
        });
      }, { root: null, rootMargin: '0px 0px -30% 0px', threshold: 0 } );
      // 監視する要素を指定して監視を実行
      io.observe(targetElement);
    });
*/

  // コンテナを指定
  const bubblesBG = document.querySelector('#bubbles-bg-container');
  
  // 設定
  let creationInterval   = 400;   // 泡の生成間隔 [  ms ]
  let bubbleBorderWeight = .2;    // 輪郭の太さ   [ rem ]
  let minDiameter        = 10;    // 最大直径     [  px ]
  let maxDiameter        = 30;    // 最小直径     [  px ]
  let bubbleDuration     = 2500;  // animation再生時間(距離は固定なのでbubbleの速度ともいえる)

  // 泡を生成する関数
  const createBubble = () => {
      // span.bubbleを生成
      const bubbleEl = document.createElement('span');
      bubbleEl.className = 'bubble';
      // 実際の直径をランダムに決定
      const diameter = Math.random() * (maxDiameter + 1 - minDiameter) + minDiameter;
      // スタイルの適用
      bubbleEl.style.border = `${ bubbleBorderWeight }rem solid #eee`;
      bubbleEl.style.width  = `${ diameter }px`;
      bubbleEl.style.height = `${ diameter }px`;
      // 生成する座標
      bubbleEl.style.bottom = `${ - maxDiameter }px`;               // y(初期位置): 直径分コンテナの下に設定
      bubbleEl.style.left   = `${ Math.random() * innerWidth }px`;  // x          : ランダム
      // コンテナにappend
      bubblesBG.appendChild(bubbleEl);
      // animation
      const containerHeight = bubblesBG.clientHeight;
      bubbleEl.animate(
        [ { transform: 'translateY(0)',                                        offset: 0 },
          { transform: `translateY(${ - (containerHeight + maxDiameter) }px)`, offset: 1 } ],
        { duration: bubbleDuration, easing: 'ease-out' }
      );

      // 画面外に見切れたら泡(span.bubble)を消す
      setTimeout(() => { bubbleEl.remove() }, bubbleDuration);
  }

  // 泡の生成を実行するintervalのid
  let activeBubble;
  // Intersection observerに渡すコールバック関数
  const cb = (entries) => {
    entries.forEach(entry => {
      // 要素がフレームインで生成開始
      if (entry.isIntersecting) { activeBubble = setInterval(createBubble, creationInterval) }
      // 要素がフレームアウトで生成停止
      else                      { clearInterval(activeBubble) }
    });
  };
  // IntersectionObserver に渡すオプション: 20%下(上下左右)からisIntersectingの判定
  const bubbleOptions = { rootMargin: '20%' };

  /* [memo] DOMContentLoaded vs load      https://takayamato.com/eventlistener/

    DOMツリー読み込み完了
    ↓
    'DOMContentLoaded'イベント発火
    ↓
    画像・CSS読み込み完了
    ↓
    'load'イベント発火

    DOMContentLoaded と load 発火タイミングが異なる。
    応用例:
    画像・CSS読み込みに時間がかかる場合この時間内にLoading iconを表示する
  */
  // DOMツリーの読み込み完了時点からsectionの監視を開始
  document.addEventListener('DOMContentLoaded', () => {
    // Intersection observerの初期化
    const bubbleObserver = new IntersectionObserver(cb, bubbleOptions);
    /* io.POLL_INTERVAL = 100;
    Polyfill: IE用, とりあえずMEでは無しでも動作確認済みなので多分不要
    */
    bubbleObserver.observe(bubblesBG);


    // window幅が、600px以下の場合は、menu fishの色もここで制御
    const observerForFishBtn = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting && innerWidth < 600) {
          fishImg.style.filter = 'invert(90%)'; // 白く
        } else {
          fishImg.style.filter = 'invert(20%)'; // 黒く
        }
      });
    }, bubbleOptions);
    observerForFishBtn.observe(bubblesBG);
  });

////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////
// footer下部の海藻の描出 //////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////
  const seaweedBG    = document.querySelector('#seaweed-bg');
  const seaweedConts = document.querySelectorAll('.seaweed');

  // 海藻の線幅をCSSの:rootから取得する関数
  const hrWeight = () => { return getPx(document.documentElement, '--weed-weight') }
  function generateSeaweed() {

    // seaweedBGの幅を設定
    const em = getPx(seaweedConts[0], 'font-size');
    let shortHrlength  = 2.0 * em, shortSkew  =  45;
    let longHrlength   = 3.5 * em, longSkew   = -95;
    let middleHrlength = 3.5 * em, middleSkew = -45;
    const contWidth = shortHrlength + longHrlength + middleHrlength;
    seaweedBG.style.width = contWidth;

    // seaweedBGの高さを設定: hrを傾けた後の正味の高さを数値計算で出して親コンテナの高さとして設定
    let seaweedContNetHeight = longHrlength * Math.sin((Math.sign(longSkew) * longSkew) * (Math.PI / 180));
    seaweedBG.style.height = `${ seaweedContNetHeight }px`;
  
    seaweedConts.forEach((seaweedCont, i) => {
  
      const hrs = seaweedCont.querySelectorAll('hr');
      const shortHr  = hrs[0], longHr   = hrs[1], middleHr = hrs[2];
  
      // border-bottom, borderradius
      hrs.forEach(hr => {
        hr.style.borderBottom = `${ hrWeight() }px solid #eee`;
        hr.style.borderRadius = `${ hrWeight() }px`;
      });
      // width
      shortHr.style.width  = `${ shortHrlength  }px`;
      longHr.style.width   = `${ longHrlength   }px`;
      middleHr.style.width = `${ middleHrlength }px`;
      // transform
      shortHr.style.transform  = `translateX(${ - (hrWeight() / 2)                }px)
                                  rotate(${ shortSkew  }deg)`;
      longHr.style.transform   = `translateX(${ - (hrWeight() / 2)                }px)
                                  rotate(${ longSkew   }deg)`;
      middleHr.style.transform = `translateX(${ - (hrWeight() / 2) - longHrlength }px)
                                  rotate(${ middleSkew }deg)`;
      // transform-origin
      shortHr.style.transformOrigin  = 'right bottom'; // cssに移動
      longHr.style.transformOrigin   = 'left center';  // cssに移動
      middleHr.style.transformOrigin = 'left bottom';  // cssに移動
  
      // 海藻のx座標をランダムに、y座標は正味の高さ分下に下げる
      const randomX = Math.random() * (i + 1) * (innerWidth / seaweedConts.length - contWidth);
      seaweedCont.style.transform = `translate( ${ randomX }px, ${ seaweedContNetHeight }px)`;
    });
  }
  generateSeaweed();

////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////
// footerの砂粒の描出 //////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////
  // コンテナは後で丸々削除して入れ替えるので、関数内で都度取得
  let sandBG;

  // divでrow行col列の"grid"で敷き詰め、"particle"入れる-------------------------------------------------
  function generateParticles() {
    // sandBGを取得
    sandBG = document.querySelector('#sand-bg');
    // コンテナについたpadding, marginを取得
    let sandBGPadding   = getPx(sandBG, 'padding');
    let sandBGBorderTop = getComputedStyle(sandBG).getPropertyValue('border-top');
    sandBGBorderTop = Number(sandBGBorderTop[0]);
    // 設定
    let dotRadius = hrWeight() * .75;                                 // 砂粒の半径を海藻の線幅の関数とする
    let row = 2, col = 15;                                            // row × col 個のgrid
    const emptyRatio = .1;                                            // 空のgridの割合(0 < value < 1)
    // コンテナの正味の高さと幅を計算
    let netHeight = sandBG.getBoundingClientRect().height - (sandBGPadding * 2 + sandBGBorderTop);
    let netWidth  = sandBG.getBoundingClientRect().width  - (sandBGPadding * 2);
    let gridHeight = netHeight / row, gridWidth  = netWidth  / col;

    for (let i = 0; i < row * col; i++) {
      // gridを生成
      const grid = document.createElement('div');
      grid.style.position = 'relative';           // class付けてcssに移動
      grid.style.height   = `${ gridHeight }px`;
      grid.style.width    = `${ gridWidth  }px`;
      sandBG.appendChild(grid);

      // gridに0～1つspanで整形した"particle"を入れる
      if ( Math.random() > emptyRatio ) { // 逆条件にしてcontinueで飛ばしてみる
        // particleを設定
        const particle = document.createElement('span');
        particle.style.height       = `${ dotRadius * 2 }px`;
        particle.style.width        = `${ dotRadius * 2 }px`;
        particle.style.background   = '#eee';     // class付けてcssに移動
        particle.style.borderRadius = '50%';      // class付けてcssに移動
        particle.style.position     = 'absolute'; // class付けてcssに移動
        particle.style.top          = `${ randByMax(gridHeight - dotRadius) }px`;
        particle.style.left         = `${ randByMax(gridWidth  - dotRadius) }px`;
        grid.appendChild(particle);
      }
    }
  }
  generateParticles();

  // resize発火の度、再生成するための関数
  function regenerateParticles() {
    // コンテナの初期化
    /* cloneNodeの引数falseをうまく使って、子要素を全て削除する効率の良いやり方
    step1: cloneNode(false)で親のガワだけコピー
    step2: originalと置き換える
    */
    const clone = sandBG.cloneNode(false);          // step1
    sandBG.parentNode.replaceChild(clone, sandBG);  // step2

    // 再実行
    generateParticles();
  }

////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////
// menu aside要素の表示・非表示 ////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////
const fishContainer   = document.querySelector('#fish-btn-wrapper');
const fishBtn         = fishContainer.querySelector('#fish-btn');
const fishImg         = fishBtn.querySelector('#img-fish');
const headerContainer = document.querySelector('#header-container');
const footerContainer = document.querySelector('#footer-container');
const aside           = document.querySelector('aside');
const footer          = document.querySelector('footer');
const menuContainer   = document.querySelector('#menu-container');
const menuNav         = menuContainer.querySelector('nav');
const menuH4          = menuContainer.querySelector('h4');

const getNetNavMargin = () => {    
  return getPx(menuH4, 'height') + getPx(menuNav, 'margin-top') + getPx(menuContainer, 'padding-top');
}
const getFooterTopCoordinate = () => {
  return subBody.scrollTop + footer.getBoundingClientRect().top;
} 

const headerHeight = header.getBoundingClientRect().height;
let netNavMargin;


function adjustMenuNavHeight() {
  netNavMargin = getNetNavMargin();
  const footerTopCoordinate = getFooterTopCoordinate();

  if (subBody.scrollTop + innerHeight > footerTopCoordinate) { // 3: window下端がfooter上端を過ぎたら
    // console.log('3');
    menuNav.style.height = `${ footerTopCoordinate - subBody.scrollTop - netNavMargin * 2 }px`;
  } else if (subBody.scrollTop > headerHeight) {               // 2: window上端がheader下端を過ぎたら
    // console.log('2');
    menuNav.style.height = `${ innerHeight - netNavMargin * 2 }px`;
  } else {                                                     // 1: window上端がheaderに達するまで
    // console.log('1');
    menuNav.style.height = `${ (subBody.scrollTop + innerHeight) - headerHeight - netNavMargin * 2 }px`;
  }
}

window.addEventListener('resize', () => {
  // Safariでアドレスバーが縦方向のscrollに対して拡縮するので、真に横幅のresizeのみで実行するには↓が必要
  // https://qiita.com/tonkotsuboy_com/items/d32ec6e7a1f6f592d415
  if (currentWidth === innerWidth) { return }

  if (innerWidth < 600) {
    subBody.removeEventListener('scroll', adjustMenuNavHeight);
  } else {
    adjustMenuNavHeight();
    subBody.addEventListener('scroll', adjustMenuNavHeight);
  }
});

// asideの高さをレスポンシブに設定する処理はresizeイベントでも使うので関数化-----------------------------------
function adjustAsideHeight() {
  /* [レスポンシブ] ～600: mainとasideの2カラム、600～: asideをmainにかぶせる */
  if (innerWidth > 600) { 
    const marginTopMain   = getPx(main, 'margin-top');           // main上のマージンの取得
    const marginTopFooter = getPx(footer, 'margin-top');         // footer上のマージンの取得
    const mainHeight      = main.getBoundingClientRect().height; // main blockの高さを取得
    // asideの高さは上3つの和
    const asideHeight = mainHeight + marginTopMain + marginTopFooter;
    aside.style.height = `${ asideHeight }px`;
  }
}

// CSS変数からdurationを取得
const menuSwitchDuration = getMs(document.documentElement, '--duration-menu-switch');

const distance = () => { return innerWidth > 600 ? 25 : 85 ; }  // 25"vw"か85"vw"を返す
function fishBtnClickHandler(e) {
  if (e) {e.stopPropagation() }
  // classの着脱
  headerContainer.classList.toggle('slide');
  footerContainer.classList.toggle('slide');
  main.classList.toggle('slide');
  aside.classList.toggle('slide');
  fishContainer.classList.toggle('slide');

  // open状態でresizeしレイアウトが変わった後にcloseした場合のための調整
  if (!fishContainer.classList.contains('slide') && subBody.scrollTop < headerHeight) {
    if (innerWidth < 600) { fishImg.style.filter = 'invert(90%)' }
    else { fishImg.style.filter = 'invert(20%)' }
  }

  // 魚のAnimationの移動距離をresponsiveに決定
  const d = distance();
  const dx = d / 5;                                               // (5 / 2 =) 2.5周期上下に振る
  // menu OPEN ------------------------------------------------------------------------------------------------
  if (aside.classList.contains('slide')) {
    adjustAsideHeight();
    // 余白(main, header, footer)のclickでmenuを閉じられるようにevent listener追加
    main.addEventListener('click',    closeMenuByClickMargin);
    header.addEventListener('click',  closeMenuByClickMargin);
    footer.addEventListener('click',  closeMenuByClickMargin);
    subBody.addEventListener('click', closeMenuByClickMargin);

    if (innerWidth > 600) {
      aside.style.top = `${headerHeight}px`;
      adjustMenuNavHeight();
      subBody.addEventListener('scroll', adjustMenuNavHeight);
    } else {
      aside.style.top = `${subBody.scrollTop}px`;
      subBody.style.overflowY = 'hidden';
    }
    // 魚の往路Animation
    fishContainer.animate(
      [
        { transform: `translate(-${d - dx * 5}vw, 0)     rotate(-15deg)`,               offset:  0 },
        { transform: `translate(-${d - dx * 4}vw, .5vw)  rotate(0)`,                    offset: .2 },
        { transform: `translate(-${d - dx * 3}vw, 0)     rotate(15deg)`,                offset: .4 },
        { transform: `translate(-${d - dx * 2}vw, -.5vw) rotate(0)`,                    offset: .6 },
        { transform: `translate(-${d - dx * 1}vw, 0vw)   rotate(-15deg)`,               offset: .8 },
        { transform: `translate(-${d - dx * 0}vw, .5vw)  rotate(0)       scale(-1, 1)`, offset:  1 },
      ],
      { duration: menuSwitchDuration, easing: 'ease-out' }
    );
    // 疑似fill: forward
    fishContainer.style.transform = `translate(-${distance()}vw, .5vw) rotate(0) scale(-1, 1)`;
  }
  // ----------------------------------------------------------------------------------------------------------

  // menu CLOSE -----------------------------------------------------------------------------------------------
  if (!aside.classList.contains('slide')) {
    subBody.style.overflowY = 'visible';
    subBody.removeEventListener('scroll', adjustMenuNavHeight);
    // 魚の復路Animation
    fishContainer.animate(
      [
        { transform: `translate(-${d - dx * 0}vw, 0)     rotate(15deg)  scale(-1, 1)`, offset:  0 },
        { transform: `translate(-${d - dx * 1}vw, .5vw)  rotate(0)      scale(-1, 1)`, offset: .2 },
        { transform: `translate(-${d - dx * 2}vw, 0)     rotate(-15deg) scale(-1, 1)`, offset: .4 },
        { transform: `translate(-${d - dx * 3}vw, -.5vw) rotate(0)      scale(-1, 1)`, offset: .6 },
        { transform: `translate(-${d - dx * 4}vw, 0)     rotate(15deg)  scale(-1, 1)`, offset: .8 },
        { transform: `translate( ${d - dx * 5}vw, .5vw)  rotate(0)`, offset: 1 },
      ],
      {
        duration: menuSwitchDuration,
        easing: 'linear',
      }
    );
    // 疑似fill: forward
    fishContainer.style.transform = `translate(0, .5vw) rotate(0)`;
  }
  // ----------------------------------------------------------------------------------------------------------
}
fishBtn.addEventListener('click', fishBtnClickHandler);

function closeMenuByClickMargin(e) {
  if (aside.classList.contains('slide')) { fishBtnClickHandler() }
  e.currentTarget.removeEventListener('click', this);
}

// 魚のanimationを伴う移動はclassの着脱ではなく、上のfishBtnのclickイベントで定義しているので
// resizeイベントでレイアウトがかわる時に、jsから別途transformプロパティをいじる必要かある
function adjustFishStyle() {
  if (innerWidth > 600) {
    if (aside.classList.contains('slide')) {                        // 大画面 && menu OPEN
      fishContainer.style.transform = `translate(-${ distance() }vw, 0) rotate(0) scale(-1, 1)`;
    } else {                                                        // 大画面 && menu CLOSE
      fishImg.style.filter = 'invert(20%)';
    }
  }
  else {
    if (aside.classList.contains('slide')) {                        // 小画面 && menu OPEN
      fishContainer.style.transform = `translate(-${ distance() }vw, 0) rotate(0) scale(-1, 1)`;
    } else {
      if (subBody.scrollTop < headerHeight) { // 小画面 && menu CLOSE && scrollYがheader"内"
        fishImg.style.filter = 'invert(90%)';
      } else {                                // 小画面 && menu CLOSE && scrollYがheader"外"
        fishImg.style.filter = 'invert(20%)';
      }
    }
  }
}

window.addEventListener('resize', () => {
// Safariでアドレスバーが縦方向のscrollに対して拡縮するので、真に横幅のresizeのみで実行するには↓が必要
// https://qiita.com/tonkotsuboy_com/items/d32ec6e7a1f6f592d415
if (currentWidth === innerWidth) { return }

if (innerWidth > 600) {
  subBody.style.overflowY = 'visible';
  aside.style.top = `${headerHeight}px`;
} else {
  aside.style.top = `${subBody.scrollTop}px`;
  subBody.style.overflowY = 'hidden';
}
});


// resizeイベントは拡縮中、連続的に発火してしまうのである程度間引く
let tempId = null;
window.addEventListener('resize', () => {
// Safariでアドレスバーが縦方向のscrollに対して拡縮するので、真に横幅のresizeのみで実行するには↓が必要
// https://qiita.com/tonkotsuboy_com/items/d32ec6e7a1f6f592d415
if (currentWidth === innerWidth) { return }

clearTimeout(tempId);
tempId = setTimeout(() => {
  // 正味実行したい処理
  adjustAsideHeight();
  adjustFishStyle();
  generateSeaweed();
  regenerateParticles();
  currentWidth = innerWidth;
}, resizeDelay);
}, false);
}
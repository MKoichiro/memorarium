'use strict';



const body    = document.querySelector('body');
const main    = document.querySelector('main');
const header  = document.querySelector('header');


// resizeイベント発火時に横幅の変化があったか判定するのに使う
let currentWidth = innerWidth;
// resizeイベントの処理の実行猶予時間[ms]
const resizeDelay = 1000 / 60; // 60fps

const accDuration = getMs(document.documentElement, '--duration-acc');

// === 汎用的な関数 =================================================================================== //
// css で px, rem 単位で指定したプロパティ値を数値で取得する
function getPx(elm, prop) {
  return Number(getComputedStyle(elm).getPropertyValue(prop).replace('px',  ''));
}
function getRem(elm, prop) {
  return Number(getComputedStyle(elm).getPropertyValue(prop).replace('rem', ''));
}
function getMs(elm, prop) {
  return Number(getComputedStyle(elm).getPropertyValue(prop).replace('ms', ''));
}
// その他の単位で指定した場合はこれを使う
function getCSSVal(elm, prop, unit) {
  return Number(getComputedStyle(elm).getPropertyValue(prop).replace(unit, ''));
}
// html にあてている font-size を取得
const fsPC = getCSSVal(document.documentElement, '--font-size-pc', '%');
const fsTB = getCSSVal(document.documentElement, '--font-size-tb', '%');
const fsSP = getCSSVal(document.documentElement, '--font-size-sp', '%');

// rem → px 変換
function remToPx(rem) {
  if      ( 1024 < innerWidth                      ) { return rem * ( 16 * ( fsPC/100 ) ) }
  else if (  600 < innerWidth && innerWidth < 1024 ) { return rem * ( 16 * ( fsTB/100 ) ) }
  else if (    0 < innerWidth && innerWidth <  600 ) { return rem * ( 16 * ( fsSP/100 ) ) }
}
// px → rem 変換
function pxToRem(px) {
  if      ( 1024 < innerWidth                      ) { return px * 1 / (16 * ( fsPC/100 ) ) }
  else if (  600 < innerWidth && innerWidth < 1024 ) { return px * 1 / (16 * ( fsTB/100 ) ) }
  else if (    0 < innerWidth && innerWidth <  600 ) { return px * 1 / (16 * ( fsSP/100 ) ) }
}
// ==================================================================================================== //
// 0からmaxまでの乱数生成
function randByMax(max) { return Math.random() * max }

// spのダブルタップで拡大する仕様を回避
document.addEventListener('dblclick', (e) => {e.preventDefault()});
// load時にanimationが再生される問題を回避するためにつけていたclassを除去してanimationを有効化
// http://14-00.com/archives/31

window.addEventListener('DOMContentLoaded', () => {
  document.addEventListener('touchmove', preventScroll, {passive: false});
  document.addEventListener('wheel', preventScroll);
});

window.addEventListener('load', () => {
  setTimeout(() => { body.classList.remove('off-anime') }, 400);

  setTimeout(() => { body.classList.remove('loading') }, 500);
  setTimeout(() => {
    document.removeEventListener('touchmove', preventScroll, {passive: false});
    document.removeEventListener('wheel', preventScroll);
  }, 2500);
});




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

// ||| header の泡のアニメーション |||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||| //
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

  // Intersection observerの初期化
  const bubbleObserver = new IntersectionObserver(cb, bubbleOptions);
  bubbleObserver.observe(bubblesBG);


  const fishImg = document.querySelector('#menu-btn img');
  // window幅が、600px以下の場合は、menu fishの色もここで制御
  const observerForFishBtn = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting && innerWidth < 1024) {
        fishImg.classList.toggle('in-header');
        // fishImg.style.filter = 'invert(90%)'; // 白く
        console.log('in: ' + entry.intersectionRatio);
      } else {
        fishImg.classList.toggle('in-header');
        console.log('in: ' + entry.intersectionRatio);
      }
    });
  }, 
  { root: null,
    rootMargin: `${-remToPx(1.6 + 3)}px 0px 0px 0px`,
    threshold: 0
  });

  observerForFishBtn.observe(header);
// |||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||| //



// ||| footerの海藻の描出 ||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||| //
  const seaweedBG    = document.querySelector('#seaweed-bg');
  const seaweedConts = document.querySelectorAll('.seaweed');

// === 各種ゲッター定義 =============================================================================== //
  // コンテナごと、spanごとに取得[ [{length: XX, angle:YY}, {…}, {…}], [{…}, {…}, {…}] ]
  const getWeedData = () => {
    const weedData = [];
    seaweedConts.forEach(cont => {
      const firstLength  = pxToRem(getPx(cont.querySelector('.first'),  'min-width')),
            secondLength = pxToRem(getPx(cont.querySelector('.second'), 'min-width')),
            thirdLength  = pxToRem(getPx(cont.querySelector('.third'),  'min-width'));
      const firstSkew  =  45,
            secondSkew = -95,
            thirdSkew  = -45;
      weedData.push([
        { length: firstLength,  angle: firstSkew  },
        { length: secondLength, angle: secondSkew },
        { length: thirdLength,  angle: thirdSkew  }
      ]);
    });
    return weedData;
  }

  // 海藻の線幅をCSSの:rootから取得
  const getWeedWeight = () => { return getRem(document.documentElement, '--weed-weight') }

  // weed の長さと角度を渡して、y 成分の大きさを返す
  const getYComponent = (abs, angle) => { return abs * Math.abs(Math.sin(angle * (Math.PI / 180))) }

  // 傾けた結果、最大のy成分を有するspanのオブジェクト ({length: XX, angle: YY}) を返す
  const getMaxHeight = (weedData) => {
    const maxHeightObject = weedData.reduce((acc,cur) => {
      const max = cur.reduce((acc, cur) => {
        const accYcomponent = getYComponent(acc.length, acc.angle);
        const curYcomponent = getYComponent(cur.length, cur.angle);
        if (curYcomponent > accYcomponent) { return cur }
        else                               { return acc }
      }, {length: 0, angle: 0});

      const accYcomponent = getYComponent(acc.length, acc.angle);
      const curYcomponent = getYComponent(max.length, max.angle);
      if (curYcomponent > accYcomponent) { return max }
      else                               { return acc }
    }, {length: 0, angle: 0});

    return getYComponent(maxHeightObject.length, maxHeightObject.angle);
  }
// ==================================================================================================== //

// === 関数定義・実行 ================================================================================= //
  function generateSeaweed() {

    const weedWeight = getWeedWeight();
    const weedData   = getWeedData();   // [ [{length: XX, angle:YY}, {…}, {…}], [{…}, {…}, {…}] ]
    const maxHeight  = getMaxHeight(weedData);

    // スタイルをあてる
    seaweedConts.forEach((cont, i) => {
      // div.seaweed の高さを設定:
      //   span を傾けた後の正味の高さを計算、親コンテナの高さとして設定しておく。（しなくてもいいが...）
      cont.style.height = `${ maxHeight }rem`;

      const spans = cont.querySelectorAll('span');
      const firstSpan  = spans[0],
            secondSpan = spans[1],
            thirdSpan  = spans[2];
      const firstData  = weedData[i][0],
            secondData = weedData[i][1],
            thirdData  = weedData[i][2];

      // transform: 傾きと位置
      firstSpan.style.transform  = `
                                      translateX(${ - (weedWeight/2)                    }rem)
                                      rotate(${ firstData.angle  }deg)
                                    `;
      secondSpan.style.transform = `
                                      translateX(${ - (weedWeight/2)                    }rem)
                                      rotate(${ secondData.angle   }deg)
                                    `;
      thirdSpan.style.transform  = `
                                      translateX(${ - (weedWeight/2) - thirdData.length }rem)
                                      rotate(${ thirdData.angle }deg)
                                    `;

      // 海藻の x 座標をランダムに
      const randomX = pxToRem(innerWidth) * ( (Math.random() + i) / seaweedConts.length );
      cont.style.transform = `translateX(${ randomX }rem)`;
    });
  }

  // --- 実行 ----------------------------------------------------------------------------------------- //
  generateSeaweed();
  // -------------------------------------------------------------------------------------------------- //

// ==================================================================================================== //
// |||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||| //


// ||| footerの砂粒の描出 ||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||| //
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
    let dotRadius = getWeedWeight() * 5; // 砂粒の半径を海藻の線幅の関数とする
    let row = 2, col = 15;              // row × col 個のgrid
    const emptyRatio = .1;              // 空のgridの割合(0 < value < 1)
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
    const clone = sandBG.cloneNode(false);          // step1: cloneNode(false)で親のガワだけコピー
    sandBG.parentNode.replaceChild(clone, sandBG);  // step2: originalと置き換える

    // 再実行
    generateParticles();
  }
// |||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||| //


// ||| menu aside要素の表示・非表示 ||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||| //
// === 要素取得と定数定義など ========================================================================= //
// const body      = document.querySelector('body');

// 構造: main > article, aside, button#menu-btn > nav.menu > ul.menu-lists > ...
const menuAside = document.querySelector('aside');
const menuUl    = document.querySelector('.ul-first-floor');
const menuNav   = document.querySelector('.menu-nav');
const menuBtn   = document.querySelector('#menu-btn');

// const header    = document.querySelector('header');
const footer    = document.querySelector('footer');

// -- rem 単位でそれぞれ取得 -------------------------------------------------------------------------- //
// 1. header
const headerHeight = getRem(document.documentElement, '--header-height');
// 2. footer
const footerHeight = getRem(document.documentElement, '--footer-height');
// 3. ul.menu-lists 関連: aside の高さのうち ul 以外の部分
const menuTitleHeight    = getRem(document.documentElement, '--menu-title-height');
const menuTitleMarginTop = getRem(document.documentElement, '--menu-nav-padding');
const menuUlNetMargin = (menuTitleHeight + menuTitleMarginTop) * 2;
// main 部分をスクロール中の ul.menu-lists 高さ: innerHeight が変わるときに要更新
let menuUlNormalHeight = pxToRem(innerHeight) - menuUlNetMargin * 2;

// --- intersectionObserver 関連 ---------------------------------------------------------------------- //
// threshold オプションに渡す配列を用意
const makeThreshold = (a0, d, steps, max = 1) => {
  steps = steps || max / d + 1; // まあ、やらなくてもいい
  return new Array(steps).fill(0).map((value, i) => (i * d + a0).toFixed(2));
}
const headerIOThreshold = makeThreshold(0, .010); // [0.00, 0.05, 0.10, ..., 1.00]
const footerIOThreshold = makeThreshold(0, .005); // [0.00, 0.01, 0.02, ..., 1.00]

// intersectionRatio は resize 時にも使うので、グローバル変数を用意
// スクロール位置( header/footer 内をスクロール中か否か)の判定に便利
let headerIntersectionRatio = 0;
let footerIntersectionRatio = 0;

// --- ul.menu-listsのスクロール制御関連 -------------------------------------------------------------- //
const preventScroll = (e) => { e.preventDefault()  }
const reviveScroll  = (e) => { e.stopPropagation() }

// ul.menu-lists 用の overflow を判定
const hasMenuOverflow = (ulElm) => {
  const ulHeight = ulElm.getBoundingClientRect().height;
  const liFirst  = ulElm.querySelector('.menu-nav li:first-child'),
        liLast   = ulElm.querySelector('.menu-nav li:last-child');
  const ulContentHeight =   liLast.getBoundingClientRect().bottom
                          - liFirst.getBoundingClientRect().top;

  return ulHeight < ulContentHeight; // overflow なら true が返る
}

// ul.menu-lists の overflow によって、同要素内のスクロールを禁止/解除
const scrollControler = () => {
  if (hasMenuOverflow(menuUl)) {
    // add
    menuUl.addEventListener( 'wheel',     reviveScroll, {passive: false} );
    menuUl.addEventListener( 'touchmove', reviveScroll, {passive: false} );
  } else {
    // remove
    menuUl.removeEventListener( 'wheel',     reviveScroll, {passive: false} );
    menuUl.removeEventListener( 'touchmove', reviveScroll, {passive: false} );
  }
}
// ==================================================================================================== //


// === button#menu-btn の click イベント ============================================================== //
const switchMenu = () => {
  // クラス着脱で menu の開閉を実行
  body.classList.toggle('menu-opened');

  if (body.classList.contains('menu-opened') && innerWidth < 600) {
    menuUl.style.height = `${menuUlNormalHeight}rem`;
    return;
  }

  // ul.menu-lists の高さを可変にする intersectionObserver を管理
  if (body.classList.contains('menu-opened') && innerWidth > 600) {
    // 開いたら header/footer の監視を 開始。
    headerIO.observe(header);
    footerIO.observe(footer);

    // menu を開いたときの初回の ul の高さ調整は手動で
    if (scrollY <= headerHeight) { menuUl.style.height = `${menuUlNormalHeight - pxToRem(scrollY)}rem` }
  }
  else if (!body.classList.contains('menu-opened') && innerWidth > 600) {
    // 閉じたら header/footer の監視は 停止。交差率はリセットしておく。
    headerIntersectionRatio = 0;
    footerIntersectionRatio = 0;
    headerIO.unobserve(header);
    footerIO.unobserve(footer);
  }
}

menuBtn.addEventListener('click', switchMenu);
// ==================================================================================================== //


// === header/footer の intersectionObserver オブジェクト生成 ========================================= //
// ---- header ---------------------------------------------------------------------------------------- //
const adjustWithHeader = (entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      // 交差中:   交差率を更新、ul.menu-lists の高さを調整
      headerIntersectionRatio = entry.intersectionRatio;
      // headerは最上部なので、実は"- scrollY"でもこの場合は可
      menuUl.style.height = `${menuUlNormalHeight - headerHeight * headerIntersectionRatio}rem`;
      scrollControler();
    }
    else {
      // 交差終了: 交差率をリセット
      headerIntersectionRatio = 0;
      // threshold の粗さによって、微妙に崩れるのが気になれば定数値を指定しておく。
      menuUl.style.height = `${menuUlNormalHeight}rem`;
    }
  });
}
const headerIOOptions = {
  root: null,
  rootMargin: `0px 0px ${remToPx(menuUlNormalHeight)}px 0px`, // px / % しか使えないので変換
  threshold: headerIOThreshold // root の面積に対する(?) target と root の共有面積の割合
}
// 生成
const headerIO = new IntersectionObserver(adjustWithHeader, headerIOOptions);
// ---------------------------------------------------------------------------------------------------- //

// ---- footer ---------------------------------------------------------------------------------------- //
const adjustWithFooter = (entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      // 交差中:   交差率を更新、ul.menu-lists の高さを調整
      footerIntersectionRatio = entry.intersectionRatio;
      menuNav.classList.add('in-footer'); // stickyアイテムに bottom: 0; を追加。
      menuUl.style.height = `${menuUlNormalHeight - footerHeight * footerIntersectionRatio}rem`;
      scrollControler();
    }
    else {
      // 交差終了: 交差率などをリセット
      footerIntersectionRatio = 0;
      menuNav.classList.remove('in-footer');
      menuUl.style.height = `${menuUlNormalHeight}rem`;
    }
  });
}
const footerIOOptions = {
  root: null,
  rootMargin: `0px ${innerHeight - remToPx(footerHeight)}px 0px 0px`,
  threshold: footerIOThreshold
}
// 生成
const footerIO = new IntersectionObserver(adjustWithFooter, footerIOOptions);
// ---------------------------------------------------------------------------------------------------- //
// ==================================================================================================== //


// === resize イベント1: 横方向 ======================================================================= //
let hResizeId = 0;
function hResizeHandler() {
  // window の width に変化がなければ抜ける
  if (innerWidth === currentWidth) { return                    }
  else                             { currentWidth = innerWidth }
  // 一時的に transition によるアニメをオフに
  if (!body.classList.contains('off-anime')) { body.classList.add('off-anime') }
  // タイマーをクリアして再度セット
  if (hResizeId) { clearTimeout(hResizeId) }
  hResizeId = setTimeout(() => {
    body.classList.remove('off-anime');

    // 水草と砂粒の再生成
    generateSeaweed();
    regenerateParticles();
  }, resizeDelay);
}

window.addEventListener('resize', hResizeHandler);
// ==================================================================================================== //


// === resize イベント1: 両方向 ======================================================================= //
let resizeId = 0;
const resizeHandler = () => {
  if (resizeId) { clearTimeout(resizeId) }
  resizeId = setTimeout(() => {

    // innerHeight の変化で更新
    menuUlNormalHeight = pxToRem(innerHeight) - menuUlNetMargin;

    if (innerWidth <= 600) {
        // スマホでは監視しなくてよい
        headerIO.unobserve(header);
        footerIO.unobserve(footer);

        if (menuNav.classList.contains('in-footer')) { menuNav.classList.remove('in-footer') }
        menuUl.style.height = `${menuUlNormalHeight}rem`;
    }
    else if (body.classList.contains('menu-opened')) {
        // タブレット以上では監視を開始
        headerIO.observe(header);
        footerIO.observe(footer);

        if      (headerIntersectionRatio) { // scrollY などで条件式組んでも良いがこっちが楽
          // window 上端が header 内
          menuUl.style.height = `${menuUlNormalHeight - headerHeight * headerIntersectionRatio}rem`;
        }
        else if (footerIntersectionRatio) {
          // window 下端が footer 内
          menuUl.style.height = `${menuUlNormalHeight - footerHeight * footerIntersectionRatio}rem`;
        }
        else {
          // window は main 部分をスクロール中
          menuUl.style.height = `${menuUlNormalHeight}px`;
        }
    }

    scrollControler();
  }, resizeDelay);
}

window.addEventListener('resize', resizeHandler);
// ==================================================================================================== //


// === aside のスクロール禁止、ul.menu-lists のスクロール解禁 ========================================= //
menuAside.addEventListener( 'wheel',     preventScroll, {passive: false} );
menuAside.addEventListener( 'touchmove', preventScroll, {passive: false} );
// aside の中の ul で、overflow があればスクロール禁止を解除
// overflow がないときは実行しない、実行すると body がスクロールされる。
if (hasMenuOverflow(menuUl)) {
  menuUl.addEventListener(  'wheel',     reviveScroll,   {passive: false} );
  menuUl.addEventListener(  'touchmove', reviveScroll,   {passive: false} );
}
// ==================================================================================================== //
// |||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||| //

const lines = (elm) => {
  const elmHeight     = textNode.getBoundingClientRect().height;
  const lineHeight = getPx(textNode, 'line-height');
  // return (要素の高さ / 1行の高さ)の概数
  return lineHeight ? Math.round(elmHeight / lineHeight) : console.log('error: function lines()');
}

function hasLineBreak() {

}

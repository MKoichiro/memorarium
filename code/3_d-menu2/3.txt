'use strict';

// === 汎用的な関数 =================================================================================== //
// css で px, rem 単位で指定したプロパティ値を数値で取得する
function getPx(elm, prop) {
  return Number(getComputedStyle(elm).getPropertyValue(prop).replace('px',  ''));
}
function getRem(elm, prop) {
  return Number(getComputedStyle(elm).getPropertyValue(prop).replace('rem', ''));
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


// === 要素取得と定数定義など ========================================================================= //
const body      = document.querySelector('body');

// 構造: main > article, aside, button#menu-btn > nav.menu > ul.menu-lists > ...
const menuAside = document.querySelector('aside');
const menuUl    = document.querySelector('.menu-lists');
const menuNav   = document.querySelector('.menu');
const menuBtn   = document.querySelector('#menu-btn');

const header    = document.querySelector('header');
const footer    = document.querySelector('footer');

// -- rem 単位でそれぞれ取得 -------------------------------------------------------------------------- //
// 1. header
const headerHeight = getRem(document.documentElement, '--header-height');
// 2. footer
const footerHeight = getRem(document.documentElement, '--footer-height');
// 3. ul.menu-lists 関連: aside の高さのうち ul 以外の部分
const navPadding         = getRem(document.documentElement, '--nav-padding');
const menuHeadingHeight  = getRem(document.documentElement, '--menu-heading-height');
const menuUlNetMargin = navPadding * 2 + menuHeadingHeight;
// main 部分をスクロール中の ul.menu-lists 高さ: innerHeight が変わるときに要更新
let menuUlNormalHeight = pxToRem(innerHeight) - menuUlNetMargin;

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
  const liFirst  = ulElm.querySelector('.menu li:first-child'),
        liLast   = ulElm.querySelector('.menu li:last-child');
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
const resizeDelay = 1000 / 60; // 60fps 程度に間引く
let windowWidth = innerWidth;
let hResizeId = 0;
function hResizeHandler() {
  // window の width に変化がなければ抜ける
  if (innerWidth === windowWidth) { return                   }
  else                            { windowWidth = innerWidth }
  // 一時的に transition によるアニメをオフに
  if (!body.classList.contains('off-anime')) { body.classList.add('off-anime') }
  // タイマーをクリアして再度セット
  if (hResizeId) { clearTimeout(hResizeId) }
  hResizeId = setTimeout(() => {
    body.classList.remove('off-anime')
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
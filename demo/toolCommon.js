'use strict';

// 目次
// [1] ツールモーダル
// [2] テーマ変更

// [1] ツールモーダル ////////////////////////////////////////////////////////////////////////////////////
{
// === 汎用的な関数 =================================================================================== //
// cssで px, rem, ms 単位で指定したプロパティ値を数値で取得する
function getPx( elm, prop) {
  return Number(getComputedStyle(elm).getPropertyValue(prop).replace('px',  ''));
}
function getRem(elm, prop) {
  return Number(getComputedStyle(elm).getPropertyValue(prop).replace('rem', ''));
}
function getMs( elm, prop) {
  return Number(getComputedStyle(elm).getPropertyValue(prop).replace('ms',  ''));
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


// 要素を取得 ///////////////////////////////////////////////////////////////////////////////////////
const modal       = document.querySelector('.modal');
const btnBar      = document.querySelector('.modal-bar');
const minimizeBtn = document.querySelector('#minimize-btn');
const enlargeBtn  = document.querySelector('#enlarge-btn');
// ==================================================================================================== //


// 変数・定数 定義部分 //////////////////////////////////////////////////////////////////////////////
// modal の矩形情報を格納
let rect = modal.getBoundingClientRect();
// 展開・最小化アニメの duration を css変数 から取得
const animeDuration = getMs(document.documentElement, '--enlarge-duration');
// 最小化状態の半径を css変数 から取得
const minDiameter   = getRem(document.documentElement, '--minimized-modal-diameter');
// modal の window端 からの距離の初期値
const modalOffset   = getRem(document.documentElement, '--modal-offset');

// 展開時の高さと幅の初期値
let enlargedHeight = getRem(document.documentElement, '--enlarged-init-h');
let enlargedWidth  = getRem(document.documentElement, '--enlarged-init-w');

// 最終発火イベントタイプ
let lastExecutedEventType;
// 最小化前の座標保持用、初期値は modalOffset を採用すればよい
let xHist = modalOffset,
    yHist = modalOffset;
// 直前の座標を保持する変数 (px管理)
let previousX, previousY;
// ==================================================================================================== //


// --- 関数定義部分1 ---------------------------------------------------------------------------------- //
// スクロール禁止ための関数
const preventScroll = (e) => { e.preventDefault() };

// アニメを一時 ON にする関数。展開・最小化のときに使用。
const onAnime = (duration) => {
  // ON
  modal.style.pointerEvents = 'none';
  modal.style.transition    = `height ${ duration }ms,
                               width ${ duration }ms,
                               border-radius ${ duration }ms,
                               top ${ duration }ms,
                               right ${ duration }ms,
                               bottom ${ duration }ms,
                               left ${ duration }ms`;
  // OFF: duration[ms]後にOFF
  setTimeout(() => {
    modal.style.pointerEvents = 'auto';
    modal.style.transition    = 'none';
  }, duration);
}

// 展開・最小化でモーダルにあてるスタイル
const applyMinStyle = () => {
  modal.style.height = `${ minDiameter }rem`;
  modal.style.width  = `${ minDiameter }rem`;
  modal.style.top    = `calc(100dvh - ${ modalOffset + minDiameter }rem)`;
  modal.style.left   = `${ modalOffset }rem`;
  modal.style.bottom = `${ modalOffset }rem`;
}
const applyMaxStyle = () => {
  modal.style.height = `${ enlargedHeight }rem`;
  modal.style.width  = `${ enlargedWidth  }rem`;
  modal.style.bottom = `calc(100dvh - ${ modalOffset + enlargedHeight }rem)`;
  modal.style.left   = `${ xHist }rem`;
  modal.style.top    = `${ yHist }rem`;
}
// ---------------------------------------------------------------------------------------------------- //

// --- 関数定義部分2: 最小化と展開 -------------------------------------------------------------------- //
// 最小化の処理
const minimizeModal = (e) => {
  // 最小化する前の modal の座標と大きさを更新、展開するときに参照する
  rect = modal.getBoundingClientRect();
  xHist = pxToRem(rect.left), yHist = pxToRem(rect.top);
  enlargedHeight = pxToRem(getPx(modal, 'height')),
  enlargedWidth  = pxToRem(getPx(modal, 'width'));

  // 縮小と左下への移動を実行
  onAnime(animeDuration); // 一時的にアニメを ON
  applyMinStyle();
  modal.classList.add('minimized');

  // mousedown時にminimizeとmaximizeのclickイベントは毎回追加しているので、一旦削除しないと重複。
  minimizeBtn.removeEventListener('click', minimizeModal);
  enlargeBtn.removeEventListener('click', enlargeModal);
  // 最終発火イベントタイプを更新
  lastExecutedEventType = e.type;
  // console.log(lastExecutedEventType);
}

// 展開の処理
const enlargeModal = (e) => {
  // 拡大と前回展開していた場所、または現在地への移動を実行
  onAnime(animeDuration); // 一時的にアニメを ON
  applyMaxStyle();
  modal.classList.remove('minimized');

  // mousedown時にminimizeとmaximizeのclickイベントは毎回追加しているので、一旦削除しないと重複。
  minimizeBtn.removeEventListener('click', minimizeModal);
  enlargeBtn.removeEventListener('click', enlargeModal);
  // 最終発火イベントタイプを更新
  lastExecutedEventType = e.type;
  // console.log(lastExecutedEventType);
};
// ---------------------------------------------------------------------------------------------------- //

// --- 関数定義部分3: 開始時、移動実行時、終了時 のイベントハンドラ ----------------------------------- //
// "mousedown", "touchstart" ハンドラに指定: 開始時の処理
const processStart = (e) => {
  // touch 操作の場合、モーダル移動と window スクロールが同時に発生しないように
  if (e.type === 'touchstart') { window.addEventListener('wheel', preventScroll) }
  // 拡大・縮小の click イベントは mousedown/touchstart 時に都度追加
  minimizeBtn.addEventListener( 'click', minimizeModal );
  enlargeBtn.addEventListener(  'click', enlargeModal  );

  previousX = e.clientX || e.changedTouches[0].clientX
  previousY = e.clientY || e.changedTouches[0].clientY;
  if (e.type === 'touchstart') {
    window.addEventListener('touchmove', moveModal, {passive: false});
  }
  else if (e.type === 'mousedown') {
    window.addEventListener('mousemove', moveModal);
  }
  // 最終発火イベントタイプを更新
  lastExecutedEventType = e.type;
  // console.log(lastExecutedEventType);
}

// "mousemove", "touchmove" のハンドラに指定: 移動の処理 (連続的に呼び出される)
const moveModal = (e) => {
  // left(/top): modal左端(/上端) + (座標変化量); を指定して、移動を実行
  const currentX = e.clientX || e.changedTouches[0].clientX,
        currentY = e.clientY || e.changedTouches[0].clientY;
  rect = modal.getBoundingClientRect();
  modal.style.left = `${ rect.left + (currentX - previousX) }px`;
  modal.style.top  = `${ rect.top  + (currentY - previousY) }px`;

  // 各変数を更新
  previousX = currentX, previousY = currentY;     // previousX, previousX
  if(e.target.id === 'enlarge-btn') {
    xHist = pxToRem(previousX), yHist = pxToRem(previousY);         // 最小化状態での移動の場合 x, y の履歴も更新
  }
  lastExecutedEventType = e.type;                 // 最終発火イベントタイプを更新
  // console.log(lastExecutedEventType);
}

// "mouseup", "touchend"のハンドラに指定: 終了時の処理
const processEnd = (e) => {
  // 直前に mousemove が発火していた場合、click イベントの誤発火を回避。
  if (lastExecutedEventType === 'mousemove' || lastExecutedEventType ==='touchmove') {
    minimizeBtn.removeEventListener( 'click', minimizeModal );
    enlargeBtn.removeEventListener(  'click', enlargeModal  );
  }

  // move系 は mousedown/touchstart のたびに window に付けているので、mouseup/touchend で都度削除。
  if (e.type === 'mouseup') {
    window.removeEventListener('mousemove', moveModal);
  } else if (e.type === 'touchend') {
    window.removeEventListener('touchmove', moveModal);
    window.removeEventListener('wheel', preventScroll);
  }

  // 最終発火イベントタイプを更新
  lastExecutedEventType = e.type;
  // console.log(lastExecutedEventType);
}
// ---------------------------------------------------------------------------------------------------- //
// ==================================================================================================== //


// === イベントリスナーの登録 ========================================================================= //
// modal でのスクロール操作を禁止。後ろの本文がスクロールされてしまうのを防ぐ。
modal.addEventListener('wheel',     preventScroll, {passive: false});
modal.addEventListener('touchmove', preventScroll, {passive: false});

// mouse操作
btnBar.addEventListener('mousedown',      processStart);
enlargeBtn.addEventListener('mousedown',  processStart);
window.addEventListener('mouseup',        processEnd  );

// touch操作
btnBar.addEventListener('touchstart',     processStart, {passive: false});
enlargeBtn.addEventListener('touchstart', processStart, {passive: false});
window.addEventListener('touchend',       processEnd,   {passive: false});
// ==================================================================================================== //
}





// [2] テーマ変更 ////////////////////////////////////////////////////////////////////////////////////////
{
// === カラーセットを決めておく ======================================================================= //
  const colorSets = {
    normal: {
      '--color-header-title': '#666',
      '--color-sec-titles':   '#666',
      '--color-menu':         '#555', /* d-menu2 */
      '--color-footer-title': '#666',
      '--color-other-char':   '#666',

      '--bg-color-body':      '#eee',
      '--bg-color-header':    '#ddd',
      '--bg-color-menu':      '#ccc', /* d-menu2 */
      '--bg-color-footer':    '#ddd',

      '--img-filter': 'none',
    
      '--bg-color-modal-bar':  'rgba(  0   0   0 /  .50)',
      '--bg-color-modal-body': 'rgba(250 250 250 /  .50)',
      '--color-modal-bar':     'rgba(250 250 250 / 1.00)',
      '--color-modal-body':    'rgba(100 100 100 / 1.00)',
      '--color-modal-shadow':  'rgba(  0   0   0 /  .15)',
    },

    dark: {
      '--color-header-title': '#a3a3a3',
      '--color-sec-titles':   '#a3a3a3',
      '--color-menu':         '#bbbbbb', /* d-menu2 */
      '--color-footer-title': '#a3a3a3',
      '--color-other-char':   '#a3a3a3',

      '--bg-color-body':      '#282828',
      '--bg-color-header':    '#343434',
      '--bg-color-menu':      '#333333', /* d-menu2 */
      '--bg-color-footer':    '#343434',

      '--img-filter': 'grayscale(40%)',
  
      '--bg-color-modal-bar':  'rgba(  0   0   0 /  .75)',
      '--bg-color-modal-body': 'rgba(120 120 120 /  .50)',
      '--color-modal-bar':     'rgba(200 200 200 / 1.00)',
      '--color-modal-body':    'rgba( 28  28  28 / 1.00)',
      '--color-modal-shadow':  'rgba(  0   0   0 /  .50)',
    },
  }
// ==================================================================================================== //

// === 要素取得 ======================================================================================= //
const changeThemeRadioBtns = document.querySelectorAll('#change-theme input')
const radioNormal = document.querySelector('#change-theme input[value="normal"]'),
      radioDark   = document.querySelector('#change-theme input[value="dark"]');
// ==================================================================================================== //

// === ハンドラー定義部分 ============================================================================= //
// テーマ変更を実行する関数
const changeTheme = () => {
  const checkedRadio = [...changeThemeRadioBtns].find(radio => radio.checked);
  // radio.value で カラーセット(object) を選択。配列化してからforEach内で各css変数を上書き
  const colorSet = Object.entries(colorSets[checkedRadio.value]);
  colorSet.forEach(colorData => {
    const cssVariable = colorData[0]; // '--color-header-title' etc...
    const colorName   = colorData[1]; // '#666' etc...
    document.documentElement.style.setProperty(cssVariable, colorName);
  });
}
// ==================================================================================================== //

// === ブラウザの設定に応じて、radioボタンの初期値を決める ============================================ //
if(window.matchMedia('(prefers-color-scheme: dark)').matches == true){
  radioDark.checked = true;
} else {
  radioNormal.checked = true;
}
// ==================================================================================================== //

// === 2つのラジオボタンに変更があったら、changeTheme()を実行 ========================================= //
changeThemeRadioBtns.forEach(radio => { radio.addEventListener('input', changeTheme) });
// ==================================================================================================== //
}
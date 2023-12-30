'use strict';

// 汎用的な関数 /////////////////////////////////////////////////////////////////////////////////////
  // cssで px, rem, ms 単位で指定したプロパティ値を数値で取得する
function getPx( elm, prop) {
  return Number(getComputedStyle(elm).getPropertyValue(prop).replace('px',  ''))
}
function getRem(elm, prop) {
  return Number(getComputedStyle(elm).getPropertyValue(prop).replace('rem', ''))
}
function getMs( elm, prop) {
  return Number(getComputedStyle(elm).getPropertyValue(prop).replace('ms',  ''))
}
  // ↑でremで取得したものを渡してpxに変換する
function remToPx(rem) {
  if      ( 1024 < innerWidth                      ) { return rem * ( 16 * (62.5/100) ) }
  else if (  600 < innerWidth && innerWidth < 1024 ) { return rem * ( 16 * (50.0/100) ) }
  else if (    0 < innerWidth && innerWidth <  600 ) { return rem * ( 16 * (40.0/100) ) }
}
/////////////////////////////////////////////////////////////////////////////////////////////////////


// 要素を取得 ///////////////////////////////////////////////////////////////////////////////////////
const modal       = document.querySelector('.modal');
const btnBar      = document.querySelector('.modal-bar');
const minimizeBtn = document.querySelector('#minimize-btn');
const enlargeBtn  = document.querySelector('#enlarge-btn');
/////////////////////////////////////////////////////////////////////////////////////////////////////


// 変数・定数 定義部分 //////////////////////////////////////////////////////////////////////////////
// modal の矩形情報を格納
let rect = modal.getBoundingClientRect();
// 最小化状態の半径を css変数 から取得
const minDiameter   = remToPx(getRem(document.documentElement, '--minimized-modal-diameter'));
// 展開・最小化アニメの duration を css変数 から取得
const animeDuration = getMs(document.documentElement, '--enlarge-duration');
// modal の window端 からの距離の初期値
const modalOffset = remToPx(getRem(document.documentElement, '--modal-offset'));

// 展開時の高さと幅の初期値
let enlargedHeight = remToPx(getRem(document.documentElement, '--enlarged-init-h')),
    enlargedWidth  = remToPx(getRem(document.documentElement, '--enlarged-init-w'));
// 最終発火イベントタイプ
let lastExecutedEventType;
// 最小化前の座標保持用、初期値は modalOffset を採用すればよい
let xHist = modalOffset, yHist = modalOffset;
// 直前の座標を保持する変数
let previousX, previousY;
/////////////////////////////////////////////////////////////////////////////////////////////////////


// 関数定義部分1 ////////////////////////////////////////////////////////////////////////////////////
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
/////////////////////////////////////////////////////////////////////////////////////////////////////

// 関数定義部分2: 最小化と展開 //////////////////////////////////////////////////////////////////////
// 最小化の処理
const minimizeModal = (e) => {
  // 最小化する前の modal の座標と大きさを更新、展開するときに参照する
  rect = modal.getBoundingClientRect();
  xHist = rect.left, yHist = rect.top;
  enlargedHeight = getPx(modal, 'height'),
  enlargedWidth  = getPx(modal, 'width');

  // 縮小と左下への移動を実行
  onAnime(animeDuration); // 一時的にアニメを ON
  modal.style.height = `${ minDiameter }px`;
  modal.style.width  = `${ minDiameter }px`;
  modal.style.top    = `calc(100dvh - ${ modalOffset + minDiameter }px)`;
  modal.style.left   = `${ modalOffset }px`;
  modal.style.bottom = `${ modalOffset }px`;
  modal.classList.add('minimized');

  // mousedown時にminimizeとmaximizeのclickイベントは毎回追加しているので、一旦削除しないと重複。
  minimizeBtn.removeEventListener('click', minimizeModal);
  enlargeBtn.removeEventListener('click', enlargeModal);
  // 最終発火イベントタイプを更新
  lastExecutedEventType = e.type;
  console.log(lastExecutedEventType);
}

// 展開の処理
const enlargeModal = (e) => {
  // 拡大と前回展開していた場所、または現在地への移動を実行
  onAnime(animeDuration); // 一時的にアニメを ON
  modal.style.height = `${ enlargedHeight }px`;
  modal.style.width  = `${ enlargedWidth  }px`;
  modal.style.bottom = `calc(100dvh - ${ modalOffset + enlargedHeight }px)`;
  modal.style.left   = `${ xHist }px`;
  modal.style.top    = `${ yHist }px`;
  modal.classList.remove('minimized');

  // mousedown時にminimizeとmaximizeのclickイベントは毎回追加しているので、一旦削除しないと重複。
  minimizeBtn.removeEventListener('click', minimizeModal);
  enlargeBtn.removeEventListener('click', enlargeModal);
  // 最終発火イベントタイプを更新
  lastExecutedEventType = e.type;
  console.log(lastExecutedEventType);
};
/////////////////////////////////////////////////////////////////////////////////////////////////////

// 関数定義部分2: 開始時、移動実行時、終了時 のイベントハンドラ /////////////////////////////////////
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
  console.log(lastExecutedEventType);
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
    xHist = previousX, yHist = previousY;         // 最小化状態での移動の場合 x, y の履歴も更新
  }
  lastExecutedEventType = e.type;                 // 最終発火イベントタイプを更新
  console.log(lastExecutedEventType);
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
  console.log(lastExecutedEventType);
}
/////////////////////////////////////////////////////////////////////////////////////////////////////


// イベントリスナーの登録 ///////////////////////////////////////////////////////////////////////////
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
/////////////////////////////////////////////////////////////////////////////////////////////////////
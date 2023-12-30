'use strict';

// 要素取得 ////////////////////////////////////////////////////////////////////
const aside = document.querySelector('aside'),
      ul    = document.querySelector('ul.menu-lists'),
      mask  = document.querySelector('div.mask'),
      btn   = document.querySelector('button#menu-btn');
const iconBars   = btn.querySelector('.fa-bars'),
      iconXmark  = btn.querySelector('.fa-xmark');
////////////////////////////////////////////////////////////////////////////////


// 関数定義 ////////////////////////////////////////////////////////////////////
// スクロール禁止・解禁用
const preventScroll = (event) => { event.preventDefault()  }
const reviveScroll  = (event) => { event.stopPropagation() }

// button, mask の 'click' イベントハンドラ
const memuClickHandler = () => {
  aside.classList.toggle('show');
  mask.classList.toggle('show');
  iconBars.classList.toggle('show');
  iconXmark.classList.toggle('show');

  if (aside.classList.contains('show')) {
    // menu を開くとき:     mask のスクロールを禁止
    mask.addEventListener(  'wheel',        preventScroll, {passive: false} );
    mask.addEventListener(  'touchmove',    preventScroll, {passive: false} );
  } else {
    // menu を閉じるとき:   イベントは削除
    mask.removeEventListener(  'wheel',     preventScroll, {passive: false} );
    mask.removeEventListener(  'touchmove', preventScroll, {passive: false} );
  }
}
////////////////////////////////////////////////////////////////////////////////


// aside のスクロール禁止、ul のスクロール解禁 /////////////////////////////////
aside.addEventListener( 'wheel',     preventScroll, {passive: false} );
aside.addEventListener( 'touchmove', preventScroll, {passive: false} );
ul.addEventListener(  'wheel',     reviveScroll,   {passive: false} );
ul.addEventListener(  'touchmove', reviveScroll,   {passive: false} );
////////////////////////////////////////////////////////////////////////////////


// クリックで処理を実行 ////////////////////////////////////////////////////////
btn.addEventListener(  'click', memuClickHandler );
mask.addEventListener( 'click', memuClickHandler );
////////////////////////////////////////////////////////////////////////////////
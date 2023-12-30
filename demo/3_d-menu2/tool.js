'use strict';
{

// -- 要素取得 ---------------------------------------------------------------------------------------- //
const menuUl = document.querySelector('.menu-lists');
const reviveScroll  = (e) => { e.stopPropagation() }
// ---------------------------------------------------------------------------------------------------- //


// --- radio ------------------------------------------------------------------------------------------ //
const radios = document.querySelectorAll('#outline-radio input');

const radioEvent = () => {
  const checkedRadio = [...radios].find(radio => radio.checked);
  switch (checkedRadio.value) {
    case 'on':
      menuUl.style.outline = '.5rem dashed blue';
      break;
    case 'off':
      menuUl.style.outline = 'none';
      break;
  }
}

radios.forEach(radio => { radio.addEventListener('input', radioEvent) });
// ---------------------------------------------------------------------------------------------------- //


// --- slider ----------------------------------------------------------------------------------------- //
const slider   = document.querySelector('#li-num-slider input');
const span     = document.querySelector('#li-num-slider span');
const applyBtn = document.querySelector('#li-num-btn');
slider.addEventListener( 'touchmove', reviveScroll, {passive: false} );



span.textContent = slider.value;
slider.addEventListener('input', () => { span.textContent = slider.value });

const sliderEvent = () => {

  // 現在の li 要素の数を取得
  const nOfLis = menuUl.querySelectorAll('li').length;

  // 増やす
  if (slider.value > nOfLis) {
    for (let i = 0; i < slider.value - nOfLis; i++) {
      const li = document.createElement('li');
      li.innerHTML = `<a>
                        list-${String(i + nOfLis + 1).padStart(2, '0')}
                        list-${String(i + nOfLis + 1).padStart(2, '0')}
                        list-${String(i + nOfLis + 1).padStart(2, '0')}
                      </a>`
      menuUl.appendChild(li);
    }
    scrollControler(menuUl);
  }
  // 減らす
  else if (slider.value < nOfLis) {
    for (let i = 0; i < nOfLis - slider.value; i++) {
      const lastLi = menuUl.querySelector('li:last-child');
      lastLi.remove();
    }
    scrollControler(menuUl);
  }
}

applyBtn.addEventListener('click', sliderEvent);
// ---------------------------------------------------------------------------------------------------- //


// --- ul.menu-listsのスクロール制御関連 -------------------------------------------------------------- //

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
function scrollControler(ulElm) {
  if (hasMenuOverflow(ulElm)) {
    // add
    ulElm.addEventListener( 'wheel',     reviveScroll, {passive: false} );
    ulElm.addEventListener( 'touchmove', reviveScroll, {passive: false} );
  } else {
    // remove
    ulElm.removeEventListener( 'wheel',     reviveScroll, {passive: false} );
    ulElm.removeEventListener( 'touchmove', reviveScroll, {passive: false} );
  }
}
// ---------------------------------------------------------------------------------------------------- //


}





// === slider のひな型 ================================================================================ //
// const slider   = document.querySelector('#XXX-slider input');
// const span     = document.querySelector('#XXX-slider span');
// const applyBtn = document.querySelector('#XXX-btn');

// // span に初期値を代入して表示
// span.textContent = slider.value; 
// // slider の変化にあわせて span による表示も変化させる
// slider.addEventListener('input', () => { span.textContent = slider.value });

// // apply ボタンのクリックハンドラ
// const sliderEvent = () => {
//   // Applyボタンクリックで実行したい処理
// }

// applyBtn.addEventListener('click', sliderEvent);
// ==================================================================================================== //


// === radio ボタンのひな型 =========================================================================== //
// const radios = document.querySelectorAll('fieldset#XXX-radio input');
// const radioEvent = () => {
//   const checkedRadio = [...radios].find(radio => radio.checked);
//   switch (checkedRadio.value) {
//     case 'XXX':
//       menuUl.style.outline = '.5rem dashed blue';
//       break;
//     case 'YYY':
//       menuUl.style.outline = '.5rem dashed blue';
//       break;
//     case 'ZZZ':
//       menuUl.style.outline = '.5rem dashed blue';
//       break;
//   }
// }
// radios.forEach(radio => { radio.addEventListener('input', radioEvent) });
// ==================================================================================================== //

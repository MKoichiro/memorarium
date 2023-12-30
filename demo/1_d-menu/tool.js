'use strict';


{
  const menuNav = document.querySelector('.menu');
  const input   = document.querySelector('#li-num-slider input');
  const span    = document.querySelector('#li-num-slider span');
  const btn     = document.querySelector('#li-num-slider button');
  const radioItemAmount = document.querySelectorAll('#li-num-radio input');

  const changeListAmount = (num) => {
    const newUl = document.createElement('ul');
    newUl.classList.add('menu-lists')
    let html = '';
    for (let i = 1; i <= num; i++) {
      html += `<li>
                <a href="#">
                  link-${String(i).padStart(2, '0')}
                  link-${String(i).padStart(2, '0')}
                  link-${String(i).padStart(2, '0')}
                </a>
              </li>`;
    }
    newUl.innerHTML = html;
    const menuUl  = document.querySelector('.menu ul');
    menuUl.remove();
    menuNav.appendChild(newUl);
  }
  const resetoverflowJudge = () => {
    const newUl = document.querySelector('.menu ul');
    const reviveScroll  = (event) => { event.stopPropagation() }
        // menuのoverflowを判定
        const hasMenuOverflow = () => {
          const ulHeight = newUl.getBoundingClientRect().height;
          const liFirst = document.querySelector('.menu li:first-child'),
                liLast  = document.querySelector('.menu li:last-child');
          const ulContentHeight = liLast.getBoundingClientRect().bottom
                                  - liFirst.getBoundingClientRect().top;
          return ulHeight < ulContentHeight;
        }
        if (hasMenuOverflow()) {
          newUl.addEventListener(  'wheel',     reviveScroll,   {passive: false} );
          newUl.addEventListener(  'touchmove', reviveScroll,   {passive: false} );
        } else {
          newUl.removeEventListener(  'wheel',     reviveScroll,   {passive: false} );
          newUl.removeEventListener(  'touchmove', reviveScroll,   {passive: false} );
        }
  }

  radioItemAmount.forEach(input => {
    input.addEventListener('input', () => { 
      changeListAmount(input.value);
      resetoverflowJudge();
    });
  });

  input.addEventListener('input', () => { span.textContent = `${ input.value }` });

  btn.addEventListener('click', () => {
    changeListAmount(input.value);
    resetoverflowJudge();
  });

}


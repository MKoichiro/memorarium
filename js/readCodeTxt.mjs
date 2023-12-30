'use strict';

const codePrettifyContainers = document.querySelectorAll('.code-prettify-container');
const prettifyCodes = document.querySelectorAll('.prettyprint');
const cpLines  = [],
      codeText = [];
const borderCountLists = [];
const highlightLinesList = [];



// data-pp-highlightの値で指定した行をハイライト
// function ppHighlight(highlightLinesList) {
const ppHighlight = async (highlightLinesList) => {

  prettifyCodes.forEach((code, i) => {
    if (!highlightLinesList[i]) { return true }
    highlightLinesList[i].forEach(lines => {
      const start = Number(lines.split('-')[0]),
            end   = (Boolean(lines.split('-')[1])) ? Number(lines.split('-')[1]) : start;
      const liStart = code.querySelector( `li:nth-child(${ start })` ),
            liEnd   = code.querySelector( `li:nth-child(${ end   })` );
      liStart.classList.add( 'highlight-start' );
      liEnd.classList.add(   'highlight-end'   );

      let oddQuery, evenQuery;
      if (start % 2 === 0 && end % 2 === 0) {
        evenQuery = `li:nth-of-type(2n + ${ start     }):nth-of-type(-2n + ${ end     })`;
        oddQuery  = `li:nth-of-type(2n + ${ start + 1 }):nth-of-type(-2n + ${ end - 1 })`;
      } else if (start % 2 === 0 && end % 2 !== 0) {
        evenQuery = `li:nth-of-type(2n + ${ start     }):nth-of-type(-2n + ${ end - 1 })`;
        oddQuery  = `li:nth-of-type(2n + ${ start + 1 }):nth-of-type(-2n + ${ end     })`;
      } else if (start % 2 !== 0 && end % 2 === 0) {
        oddQuery  = `li:nth-of-type(2n + ${ start     }):nth-of-type(-2n + ${ end - 1 })`;
        evenQuery = `li:nth-of-type(2n + ${ start + 1 }):nth-of-type(-2n + ${ end     })`;
      } else {
        oddQuery  = `li:nth-of-type(2n + ${ start     }):nth-of-type(-2n + ${ end     })`;
        evenQuery = `li:nth-of-type(2n + ${ start + 1 }):nth-of-type(-2n + ${ end - 1 })`;
      }
      const liOdds  = code.querySelectorAll( oddQuery  ),
            liEvens = code.querySelectorAll( evenQuery );
      liOdds.forEach(li  => { li.classList.add( 'highlight-odds'  ) });
      liEvens.forEach(li => { li.classList.add( 'highlight-evens' ) });
    });
  });
}

const writeCode = async () => {
  // forEach文中でawaitが使用不可のためfor文
  for (let i = 0; i < prettifyCodes.length; i++) {
    const response = await fetch(`https://mkoichiro.github.io/memorarium/${ codeDir }/${ i + 1 }.txt`);

    if (response.ok) {
      const text = await response.text();
      prettifyCodes[i].textContent = text;

      // cpLines => codeText
      cpLines.push((text.match(/\n/g) || []).length + 1);
      codeText.push(text);

      // highlightLinesList
      const linesList = (prettifyCodes[i].dataset.ppHighlight) ? String(prettifyCodes[i].dataset.ppHighlight).split(' ') : undefined;
      highlightLinesList.push(linesList);
    }
  }

  prettyPrint();
  ppHighlight(highlightLinesList);
}


const regExp = /\d{1,}-\d{1,}|\d{1,}/g; // "1桁以上の数字-1桁以上の数字" または "1桁以上の数字"
// ここで使った正規表現...
// "[0-9]"      or "\d"      :  0 ～ 9 の数字
// "[0-9]{x,y}" or "\d{x,y}" :  x 桁以上 y 桁以下の数字
// "[0-9]{x,}"  or "\d{x,}"  :  x 桁以上の数字
// "|"                       :  "または"
// "/g"                      :  複数検索の"gオプション"

codePrettifyContainers.forEach(container => {
  const prettifyCodes = container.querySelectorAll('.prettyprint');
  const borderCount = [];
  prettifyCodes.forEach(code => {
    // borderCount => borderCountLists
    const hightlightCount = (code.dataset.ppHighlight) ? code.dataset.ppHighlight.match(regExp).length + 1 : 0;
    borderCount.push(hightlightCount * 2);
  });
  borderCountLists.push(borderCount);
});

export { writeCode, cpLines, codeText, borderCountLists, ppHighlight, highlightLinesList };

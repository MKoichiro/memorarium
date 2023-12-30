'use strict';

import { writeCode, cpLines, codeText, borderCountLists } from "./readCodeTxt.mjs";

await writeCode();

// 自身か先祖に display: none; を指定した要素から本来のwidthとheightを取得する関数
// 自身か先祖に display: none; を指定していなかった場合にも動く。
  function getHiddenRect(el) {
    // 見かけの幅と高さ
    const apparentWidth  = el.getBoundingClientRect().width;
    const apparentHeight = el.getBoundingClientRect().height;
    if (apparentWidth === 0 && apparentHeight === 0 && el.textContent !== '') {
      // .chapter または .subchapter にあたるまで順にさかのぼり、
      // display: none;が適用されている親要素を探す
      let parent = el;
      while (!(parent.classList.contains('chapter')) && !(parent.classList.contains('subchapter'))) {
        // display のプロパティ値へアクセス。
        const display = document.defaultView.getComputedStyle(parent,null).display;
        if (display === 'none') { // noneなら一時的にblockにしてwidth, heightを取得してreturn。
          parent.style.display = 'block';
          const trueWidth  = el.getBoundingClientRect().width;
          const trueHeight = el.getBoundingClientRect().height;
          // parent.style.display = 'none'; に戻すとcssよりstyle属性が優先されてしまうので、
          // style属性ごと削除
          parent.removeAttribute('style');
          return {width: trueWidth, height: trueHeight};
        }
        parent = parent.parentNode;
      }
    } else { return { width: apparentWidth, height: apparentHeight } }

  }

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

let currentWidth = innerWidth;

// 記事情報を記述した json を読み込み //////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////
const artInfoUrl = "../data/articleInfo.json";
let artInfoJson;
const response = await fetch(artInfoUrl);
if (response.ok) { artInfoJson = await response.json() }
const langArr = artInfoJson.dictionaries.langDicts;
const artInfo  = artInfoJson.articleInfo;
let relatedArtInfo = [];
relatedArtIds.forEach((id, i) => { relatedArtInfo[i] = artInfo.filter(art => art.id === id)[0] });
const thisArtInfo = artInfo.filter(art => art.id === articleId)[0];

const thisArtTime   = document.querySelector('time#this-art-date');
const thisArtTitle  = document.querySelector('h1#title');
const thisArtDatail = document.querySelector('p#intro');
thisArtTitle.innerHTML  = thisArtInfo.title.HTML;
thisArtTime.dateTime    = thisArtInfo.date;
thisArtTime.textContent = `[ ${ thisArtInfo.date.replaceAll('-', '.') } ]`;
thisArtDatail.innerHTML = thisArtInfo.detail.HTML;


// 記事情報に応じて関連記事部分の HTML を生成 //////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////
const relatedUl = document.querySelector('#related-ul');
relatedArtInfo.forEach(info => {
  const langId      = info.langId;
  const langInfo    = langArr.filter(langInfo => langInfo.id === langId)[0];
  const href          = (info.href) ? `../${info.href}` : '#';
  const artTitile     = info.title.plane,
        date          = info.date,
        detail        = info.detail.plane;
  const dateFormatted = date.replaceAll('-', '.');
  const li            = document.createElement('li');
  li.innerHTML = `<article class="related-article">
                    <div class="blur-mask"></div>
                    <div class="text-contents">

                      <div class="art-title-container">
                        <a class="art-link" href="${ href }">
                          <h3 class="art-title">
                              <i class="${ langInfo.iconClassList }"></i>
                              ${ artTitile }
                          </h3>
                        </a>

                        <button class="art-info-btn">
                          <i class="fa-solid fa-circle-info"></i>
                          <i class="fa-solid fa-circle-xmark"></i>
                        </button>
                      </div>

                      <div class="date-line"><hr><time datetime="${ date }" class="date">[ ${ dateFormatted } ]</time><hr></div>
                      <div class="art-desc-container">
                        <div class="art-desc"><p>${ detail }</p></div>
                      </div>
                    </div>

                    <div class="no-img">
                      <div>
                        <span class="no-img-line"></span>
                        <span class="no-img-txt">No Image for this art.</span>
                        <span class="no-img-line"></span>
                      </div>
                      <div>
                        <span class="no-img-line"></span>
                        <span class="no-img-txt">No Image for this art.</span>
                        <span class="no-img-line"></span>
                      </div>
                    </div>
                  </article>`;
  relatedUl.appendChild(li);
});


// outline 部分を生成 //////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////
const chaps = document.querySelectorAll('.chapter');
const olBtmBar = document.querySelector('.outline-bar:last-child');

const outlineContainer = document.querySelector('#outline-acc-container')
const ulF1 = document.createElement('ul');
ulF1.classList.add('outline-f1');
outlineContainer.insertBefore(ulF1, olBtmBar);

chaps.forEach((chap, i) => {
  const outlineF1 = document.createElement('li');
  const outlineInnerLink = document.createElement('a');
  outlineInnerLink.classList.add('outline-inner-link');
  outlineInnerLink.href = `#chapter${i}`;
  outlineInnerLink.textContent = chap.querySelector('.chapter-title').textContent;
  outlineF1.appendChild(outlineInnerLink);

  const subchaps = chap.querySelectorAll('.subchapter');
  if (subchaps) {
    const ulB1 = document.createElement('ul');
    ulB1.classList.add('outline-b1')
    subchaps.forEach((subchap, j) => {
      const outlineB1 = document.createElement('li');
      const outlineInnerLink = document.createElement('a');
      outlineInnerLink.href = `#subchapter${i}-${j + 1}`;
      outlineInnerLink.classList.add('outline-inner-link');
      outlineInnerLink.textContent = subchap.querySelector('.subchapter-title').textContent;
      outlineB1.appendChild(outlineInnerLink);
      ulB1.appendChild(outlineB1);
      outlineF1.appendChild(ulB1);
    });
  }
  ulF1.appendChild(outlineF1);
});


// OUTLINEのアコーディオン /////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////
let barHeight      = olBtmBar.getBoundingClientRect().height;
const outlineContent       = outlineContainer.querySelector(':scope>ul');
let outlineContentHeight = outlineContent.getBoundingClientRect().height;
const barBtn   = document.querySelector('#outline-btn');

function initializeOlBarBtn() {
  outlineContentHeight = outlineContent.getBoundingClientRect().height;
  barHeight            = olBtmBar.getBoundingClientRect().height;
  olBtmBar.style.transform = `translateY(${ -outlineContentHeight }px)`;
  barBtn.removeEventListener('click', outlineAcc);
  barBtn.addEventListener('click', outlineAcc);
}

function outlineAcc() {
  outlineContentHeight = outlineContent.getBoundingClientRect().height;
  barHeight            = olBtmBar.getBoundingClientRect().height;
  outlineContainer.classList.toggle('show');

  if (outlineContainer.classList.contains('show')) {
    outlineContainer.style.height = `${ barHeight * 2 + outlineContentHeight }px`;
    olBtmBar.style.transform = `translateY(0)`

  } else {
    outlineContainer.style.height = `${ barHeight * 2 }px`;
    olBtmBar.style.transform = `translateY(${ -outlineContentHeight }px)`
  }

}

initializeOlBarBtn();


// noteの中の箇条書きのインデントを調整 ////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////
// resizeに対して不変なモノは先に取得しておく。
// .note-containerの内、note-list-container(箇条書き部分)を含むもの
const hasListContainers = document.querySelectorAll('.note-container:has(.note-list-container)');
// .note-list-containerは、.note-container毎に1つまでとは限らないので、querySelector"All"で全て取得
const listsInContainers = [...hasListContainers].map(container => { 
  return container.querySelectorAll('.note-list-container') 
});
const ElmsInfoInLists = [...listsInContainers].map(ulOrOls => { 
  return [...ulOrOls].map(ulOrOl => {
    return { listItems:  ulOrOl.querySelectorAll(':not([data-container-type="step"])>*>.note-list-item:not(.acc):has(.note-list-title)'),
             listTitles: ulOrOl.querySelectorAll(':not([data-container-type="step"])>*>.note-list-item:not(.acc):has(.note-list-title)>.note-list-title') }
  });
});

function adjustMemoIndent() {

  hasListContainers.forEach((container, i) => {
      // note-containerの幅を取得
      const containerWidth = getHiddenRect(container).width;

      // forEachメソッドで各.note-list-containerのol/ul毎にインデント幅を調整
      ElmsInfoInLists[i].forEach(list => {
        const listItems  = list.listItems, listTitles = list.listTitles;
        if (listTitles.length === 0 ) { return true } // skip

        // 初期化: min-width: fit-contentなどに初期化しないと、適切な幅を測れない
        listTitles.forEach(title => { title.removeAttribute('style')});

        // .note-list-titleの幅の最大値を求める
        let maxTitleWidth = 0;
        listTitles.forEach(title => {
          const width = getHiddenRect(title).width;
          if (width > maxTitleWidth) { maxTitleWidth = width }
        });

        const markerWidth = remToPx(getRem(document.documentElement, '--list-marker-width'));
        const netIndentWidth = maxTitleWidth + markerWidth;

        // .note-list-titleの幅の最大値が.note-containerの幅の2/3以上ある場合は、
        // 全ての.note-list-titleの幅を.note-containerの幅の2/3に調整
        if      ( netIndentWidth > containerWidth * (2 / 3) ) {
            listItems.forEach(item   => { item.style.flexDirection = 'column'                           });
            listTitles.forEach(title => { title.style.minWidth     = `${ containerWidth * (2 / 3) }px`;
                                          title.style.width        = `${ containerWidth * (2 / 3) }px`; });
        }
        // 2/3以下の場合は、.note-list-titleの幅の最大値を全ての.note-list-titleの幅とする
        else if ( netIndentWidth > containerWidth * (1 / 3) ) {
            listItems.forEach(item   => { item.style.flexDirection = 'column'                           });
            listTitles.forEach(title => { title.style.minWidth     = `${ maxTitleWidth }px`;
                                          title.style.width        = `${ maxTitleWidth }px`;            });
        }
        else {
            listTitles.forEach(title => { title.style.minWidth     = `${ maxTitleWidth }px`;
                                          title.style.width        = `${ maxTitleWidth }px`;            });
        }

      });
  });

}
adjustMemoIndent();



// liにdata-list-style-type属性を付与 /////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////
/* memo: カスタムデータ型の取得方法
    [HTML]
      <h1 data-hoge-fuge></h1>
    [JavaScript]
      h1elment.dataset.hogeFuge
    
    memo: 特定の要素(parentElment)の直下の子要素(child)を取得
      e.g.) li子要素がliならば...
            parentElement.querySelector(':scope>li');
      ※この時、:scopeはparentElementとして機能する。また、'>li'だけだとエラー。
*/

// data-list-style-typeが指定されたul要素を取得
const ulEls = document.querySelectorAll('ul[data-list-style-type]');
ulEls.forEach(el => {
  // 自身直下のliを取得 :scopeでelを表せる。
  const childrenLi = el.querySelectorAll(':scope>li');
  // 直下のliに同じdata-list-style-type属性値を付与
  childrenLi.forEach(li => { li.dataset.listStyleType = el.dataset.listStyleType });
});


// note-containerのアコーディオン //////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////
function penAnime(container) {
  const contents = container.querySelector('.note-content');
  const ulWidth = contents.getBoundingClientRect().width;

  const penIcon = container.querySelector('.fa-pen-fancy');

  const initialLeft   = getPx(penIcon, 'left');
  const lineStartLeft = getPx(contents, 'margin-left');
  const lineEndLeft   = lineStartLeft + ulWidth;
  const vDistance     = 8;

  const duration1 = 250, duration2 = 1000, duration3 = 500;
  function anime1stPeriod() {
    penIcon.animate(
      [ { top: `${ vDistance }px`, left: `${ lineStartLeft }px`, opacity: 1, offset: 1 } ],
      { duration: duration1, easing: 'ease-out' }
    );
  }
  function anime2ndPeriod() {
    penIcon.animate(
      [ { top: `${ vDistance }px`, left: `${ lineStartLeft }px`, opacity: 1, offset: 0 },
        { top: `${ vDistance }px`, left: `${ lineEndLeft   }px`, opacity: 1, offset: 1 } ],
      { duration: duration2, easing: 'ease-in-out' }
    );
  }
  function anime3rdPeriod() {
    penIcon.animate(
      [ { top: `${ vDistance }px`, left: `${ lineEndLeft   }px`, opacity: 1, offset: 0  },
        {                                                        opacity: 1, offset: .33 },
        { top: `${ vDistance }px`, left: `${ lineEndLeft   }px`, opacity: 0, offset: .67 },
        { top: `0`,                left: `${ initialLeft   }px`, opacity: 0, offset: .67 },
        {                                                        opacity: 1, offset: 1  } ],
      { duration: duration3, easing: 'ease-in' }
    );
  }

  setTimeout( anime1stPeriod, 0                     );
  setTimeout( anime2ndPeriod, duration1             );
  setTimeout( anime3rdPeriod, duration1 + duration2 );
}


// line-break //////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////
  /* 以下重いので要修正(?)
  コンソールの警告: [Violation] Forced reflow while executing JavaScript took ***ms */
  
  // 行数を返す関数
  function lines(textNode) {
    const height = textNode.getBoundingClientRect().height; // 要素の高さ
    const txtLineHeight = getPx(textNode, 'line-height');   // 要素のline-height
    // return (要素の高さ / 1行の高さ)の概数
    return txtLineHeight ? Math.round(height / txtLineHeight) : console.log('error: function lines()');
  }

  // html のtextContent部分の末尾から2文字消去する関数
  function removeEndChar(HTML, iTag = false) {  // iTagは先頭にiTagがあれば渡す
    if (iTag) {                                 // iTag === '<i blah blah blah></i>'
      HTML = HTML.slice(iTag.length);           // iTag以降を切り抜き
      return iTag + HTML.slice(0, -2);
    }
    return HTML.slice(0, -2);
  }

  // 調整箇所のバックアップをとる (resizeイベントで呼び出して再調整するため)
  const artTitles   = document.querySelectorAll('.art-title a');
  const artDescs    = document.querySelectorAll('.art-desc p');
  const allArticles = document.querySelectorAll('.all-content p');
  let ATBackUp = [],  ADBackUp = [],  AABackUp = [];
  artTitles.forEach(   title  => { ATBackUp.push(title.innerHTML) });
  artDescs.forEach(    desc   => { ADBackUp.push( desc.innerHTML) });
  allArticles.forEach( art    => { AABackUp.push(  art.innerHTML) });

  // ALL内の各リストアイテムの高さを一定に
  // const allArtLineHeight = getPx(allArticles[0], 'line-height');
  // const dateHeight       = getPx(allArticles[0], 'height');
  // allArticles.forEach(art => {art.parentNode.height = `${allArtLineHeight * 2 + dateHeight}px`});

  function adjustLines() {
    // NEW ENTRY, ARTICLES のタイトル部分を調整 ------------------------------------------------------- //
    artTitles.forEach((title, i) => {
      title.innerHTML = ATBackUp[i];
      if (lines(title) > 1) {
        // iTagを文字列としてバックアップ---------------------
        const iEndIndex = title.innerHTML.indexOf('</i>') + 4;
        let iTagBackUp = title.innerHTML.slice(0, iEndIndex);
        // 1行になるまで末尾削除
        while (lines(title) > 1) { title.innerHTML = removeEndChar(title.innerHTML, iTagBackUp) }
        // もう2文字削除して省略文字を追加
        title.innerHTML = removeEndChar(title.innerHTML, iTagBackUp);
        title.innerHTML = removeEndChar(title.innerHTML, iTagBackUp);
        title.innerHTML = title.innerHTML + '<span style="font-size: 1rem;">_ _ _</span>';
      }
    });
    // ------------------------------------------------------------------------------------------------- //
    // NEW ENTRY, ARTICLES の中のp要素を調整 ----------------------------------------------------------- //
    artDescs.forEach((desc, i) => {
      desc.innerHTML = ADBackUp[i];
      if (lines(desc) > 2) { // 2行以上ある場合
        // 2行になるまで末尾から3文字ずつ消去
        while (lines(desc) > 2) { desc.innerHTML = removeEndChar(desc.innerHTML) }
        // もう1文字削除して省略文字を追加
        desc.innerHTML = removeEndChar(desc.innerHTML);
        desc.innerHTML = desc.textContent + '<span style="font-size: 1rem;">_ _ _</span>';
      }
    });
    // ------------------------------------------------------------------------------------------------- //
    // ALL の中の各記事タイトル部分を調整 -------------------------------------------------------------- //
    // allArticles.forEach((art, i) => {
    //   // 初期化
    //   art.style.height = 'auto';
    //   art.innerHTML = AABackUp[i];
    //   if (lines(art) > 2) {
    //     // 2行になるまで末尾削除
    //     while (lines(art) > 2) { art.innerHTML = removeEndChar(art.innerHTML) }
    //     // もう1文字削除して省略文字を追加
    //     art.innerHTML = removeEndChar(art.innerHTML);
    //     art.innerHTML = art.innerHTML + '<span style="font-size: 1rem;">_ _ _</span>';
    //   }
    //   art.style.height = `${allArtLineHeight * 2}px`;
    // });
    // ------------------------------------------------------------------------------------------------- //
  }

  adjustLines();

// (sub)chapter-title-containerとの交差を監視して拡縮されるアニメを再生////////////
///////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////
const cTitleContainers = document.querySelectorAll('.chapter-title-container');
const scTitleContainers = document.querySelectorAll('.subchapter-title-container');

// IOに渡す監視option
const titleIOOptions = { root: null, rootMargin: '0px 0px -85% 0px', threshold: 0 };


// chapter-title-container     との交差を監視して拡縮するアニメを再生
cTitleContainers.forEach(title => {
  // intersection observer オブジェクトの生成
  const cTitleObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) { title.classList.add('normalized')    }
      else                      { title.classList.remove('normalized') }
    });
  }, titleIOOptions);
  // 監視する要素を指定して監視を実行
  cTitleObserver.observe(title);
});

// "sub"chapter-title-container との交差を監視して拡縮するアニメを再生
scTitleContainers.forEach(title => {
  // intersection observer オブジェクトの生成
  const scTitleObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) { title.classList.add('normalized')    }
      else                      { title.classList.remove('normalized') }
    });
  }, titleIOOptions);
  // 監視する要素を指定して監視を実行
  scTitleObserver.observe(title);
});


// ref ///////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////
const refs             = document.querySelectorAll('.ref');
const refConts         = document.querySelectorAll('.ref-content');
const blinkingDuration = getMs(document.documentElement, '--duration-blinking')

refs.forEach((ref,i) => {
  ref.addEventListener('mouseover', () => {
    ref.classList.add('linking');
    refConts[i].classList.add('linking');
  });

  ref.addEventListener('mouseleave', () => {
    ref.classList.remove('linking');
    refConts[i].classList.remove('linking');
  });

  ref.addEventListener('click', () => {
    refConts[i].classList.add('blinking');
    setTimeout(() => {
    refConts[i].classList.remove('blinking');
    }, blinkingDuration);
  });

});


// code-prettify のタブメニュー //////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////
const codePrettifyContainers = document.querySelectorAll('.code-prettify-container'); 

let tabHeight  = document.querySelector('.lang-type-tab').getBoundingClientRect().height;
let btnHeight  = getPx(document.querySelector('.enlarge-btn'), 'height');
let restHeight = tabHeight + btnHeight;
// innerHeight に対して 35% の高さを container の上限にする。
const thresholdRatio = 35;
let thresholdHeight = innerHeight * (thresholdRatio/100);

let tabWidthLists       = getCPRects().tabWidthLists;
let codeHeightLists     = getCPRects().codeHeightLists;
let containerHeightList = getCPRects().containerHeightList;

function getCPRects() {
  // --- tabWidthLists -----------------------------------------------------------
  const tabWidthLists = [...codePrettifyContainers].map(container => {
    const tabs = container.querySelectorAll('.lang-type-tab');
    tabs.forEach(tab => { tab.style.minWidth = 'fit-content'; tab.style.maxWidth = 'fit-content'; });
    return [...tabs].map(tab => tab.getBoundingClientRect().width)
  });

  // --- codeHeightLists ---------------------------------------------------------
  let codeHeightLists = [];
  const separatePositions = tabWidthLists.map(list => list.length);
  let linesLists = [], startIndex = 0
  separatePositions.forEach(count => {
    linesLists.push(cpLines.slice(startIndex, startIndex + count));
    startIndex += count;
  });
  const lineHeight = getPx(document.querySelector('.active .code-prettify-li'), 'line-height');
  const paddings   = getPx(document.querySelector('.active ol.linenums'), 'padding-top') * 2;
  codeHeightLists = linesLists.map((list, i) => list.map((lines, j) => lines * lineHeight + paddings + borderCountLists[i][j]));

  // --- containerHeightList -----------------------------------------------------
  const codeMaxHeightList = codeHeightLists.map(list => Math.max(...list));
  const containerHeightList = codeMaxHeightList.map(maxCodeHeight => {
    return (maxCodeHeight + restHeight > thresholdHeight) ? thresholdHeight : maxCodeHeight + tabHeight;
  });

  return { tabWidthLists:       tabWidthLists,
           codeHeightLists:     codeHeightLists,
           containerHeightList: containerHeightList }
}

// accordionの内部の要素の高さが変わるとき (tab, enlargeBtn の handler 内)
// accordionの高さを連動して動かす関数
function accHeightInterlocker(element, diff) {
  // element: 高さが変化する要素 (同じ.acc の子要素ならなんでも可)
  // diff:    変化量 (負なら縮む時)
  const closestContainer = element.parentNode.parentNode.closest('.acc-container') || element.parentNode.parentNode.closest('.note-contents');

  // .acc が付いた親がなくなるまで祖先をたどり高さを再設定
  let parentContainer = closestContainer;
  while (parentContainer) {
    const currentContent   = parentContainer.querySelector(':scope>.acc-content') || parentContainer.querySelector(':scope>.note-content');
    // (height: auto; である) .acc-content の現在の高さを取得
    const currentContentHeight = currentContent.getBoundingClientRect().height;
    // accContainer の高さを "現在の値" + "変化量" とする
    parentContainer.style.height = `${ currentContentHeight + diff }px`;

    // accEl を更新:
    // closest()は自身も含んで探すので :not(:scope) を付けないと更新されず無限ループ
    parentContainer = parentContainer.closest(':not(:scope).acc-container') || parentContainer.closest(':not(:scope).note-contents');
  }

  const closestNoteListItem = element.closest('.note-list-item')
  const dottedLine = closestNoteListItem ? closestNoteListItem.querySelector('.step-dotted-line') : false;
  if (dottedLine) {
    const currentLineHeight = dottedLine.getBoundingClientRect().height;
    // 取得の精度がまちまちで-0.001とかの負の数で効かなくなるので絶対値
    dottedLine.style.height = `${ Math.abs(currentLineHeight + diff) }px`;
  }
}

// .lang-type-tab の中でも使用
function switchHeight(e, btn, enlarge = false) {
  const currentContainer    = btn.closest('.code-prettify-container');
  const activeContent       = currentContainer.querySelector('.code-prettify-content.active');
  const activePre           = activeContent.querySelector('pre');

  // 発火した btn の属する container の index を取得
  const containerIndex = [...codePrettifyContainers].findIndex(container => 
    container === currentContainer);
  // 表示中のtabのindexを取得
  const tabs = currentContainer.querySelectorAll('.lang-type-tab');
  const tabIndex = [...tabs].findIndex(tab => tab.classList.contains('active'));

  if (enlarge) {
    currentContainer.style.height = 'auto';                                             // [A] btn をクリックしたら container の高さ制限を解除
    activePre.style.height = `${ codeHeightLists[containerIndex][tabIndex] }px`;        // (1) 伸ばして、
    btn.removeAttribute('href');                                                        // (2) ページ内リンクを削除
  } else {
    activePre.style.height = `${ containerHeightList[containerIndex] - restHeight }px`; // (1) 縮めて、
    btn.href = `#reduce-target-${ containerIndex + 1 }`;                                // (2) ページ内リンクで飛ばす
  }

  // accordion内部の場合
  if (btn.closest('.acc-container')) {
    let afterHeight, beforeHeight;
    if (e.currentTarget.classList.contains('enlarge-btn')) {
      afterHeight  = enlarge ? codeHeightLists[containerIndex][tabIndex] + restHeight : containerHeightList[containerIndex];
      beforeHeight = enlarge ? containerHeightList[containerIndex] : codeHeightLists[containerIndex][tabIndex] + restHeight;
    }
    else if (e.currentTarget.classList.contains('lang-type-tab')) {
      beforeHeight = currentContainer.getBoundingClientRect().height;
      afterHeight  = containerHeightList[containerIndex];
    }
    const diff = afterHeight - beforeHeight;
    accHeightInterlocker(btn, diff);
  }
}

// .enlarge-btn の'click' event handler
function enlargeBtnClickHandler(e) {
  // [4] .enlarge-btn の .enlargedの .enlarged を着脱
  e.currentTarget.classList.toggle('enlarged');
  if (e.currentTarget.classList.contains('enlarged')) { switchHeight(e, e.currentTarget, true)  }
  else                                                { switchHeight(e, e.currentTarget, false) }
}

function cpTabClickHandler(e) {
  // (*)  .code-prettify-container の.lang-type-tab の
  // 'click'イベントのhandlerとして呼び出され event Object   が渡される場合と
  // (**) .output-container        の .output-tab   の
  // 'click'イベントのhandler内で呼び出され   .lang-type-tab が渡される場合がある
  // ため targetEl の取得法は分岐する
  const targetEl        = (e.currentTarget) ? e.currentTarget : e;
  const targetContainer = targetEl.closest('.code-prettify-container');
  const cpContents      = targetContainer.querySelectorAll('.code-prettify-content');
  const enlargeBtn      = targetContainer.querySelector('.enlarge-btn');
  const preEls          = targetContainer.querySelectorAll('pre');
  const currentTabsNav  = targetEl.closest('.lang-type-tabs');
  const tabs            = currentTabsNav.querySelectorAll(':scope>.lang-type-tab');

  // 前の tab の index を取得
  const prevTabIndex = [...tabs].findIndex(tab => tab.classList.contains('active') );
  // 発火した tab とそれが属する container の index を取得
  const tabIndex = [...tabs].findIndex(tab => tab === targetEl );
  const containerIndex = [...codePrettifyContainers].findIndex(container => 
    container === targetEl.closest('.code-prettify-container')
  );

  //             前 tab の container の高さを初期化 (enlarge btn で展開されていれば)
  switchHeight(e, enlargeBtn, false);
  // クリックされた tab の container の高さを初期化
  targetContainer.style.height = `${ containerHeightList[containerIndex] }px`;

  // 初期化・削除 ---------------------------------------------------------------------------
  // (1), (2) .lang-type-tab, .code-prettify-content の .active を外す
  tabs.forEach(tab => { tab.classList.remove('active') });
  cpContents.forEach(content => { content.classList.remove('active') });
  // (3), (4) .enlarge-btn の .show, .enlarged                  を外す
  enlargeBtn.classList.remove('enlarged');
  enlargeBtn.classList.remove('show');
  // (5) .enlarge-btn の イベントを削除
  enlargeBtn.removeEventListener('click', enlargeBtnClickHandler);
  // (6) .lang-type-tab の width の初期化
  [...tabs][prevTabIndex].style.minWidth = '12rem';
  [...tabs][prevTabIndex].style.maxWidth = '12rem';

  // 最適化・追加 ---------------------------------------------------------------------------
  // [1], [2] .lang-type-tab, .code-prettify-content の .active を付ける
  targetEl.classList.add('active');
  cpContents[tabIndex].classList.add('active');
    if (codeHeightLists[containerIndex][tabIndex] > thresholdHeight - restHeight) {
    // [3] .enlarge-btn                              の .show   を付ける
    enlargeBtn.classList.add('show');
    preEls[tabIndex].style.height = `${ thresholdHeight - restHeight }px`;
    // [5] .enlarge-btn の イベントを更新
    // [4] .enlarge-btn の .enlarged を着脱 (handlerの中)
    enlargeBtn.addEventListener('click', enlargeBtnClickHandler);
  } else {
    preEls[tabIndex].style.height = `${ codeHeightLists[containerIndex][tabIndex] }px`;
  }
  // [6] .lang-type-tab の width の最適化
  if (tabWidthLists[containerIndex][tabIndex] > remToPx(12)) {
    targetEl.style.minWidth = `${ tabWidthLists[containerIndex][tabIndex] }px`;
    targetEl.style.maxWidth = `${ tabWidthLists[containerIndex][tabIndex] }px`;
  }


  // output-container との連動
  const tabId = targetEl.dataset.tabLinkId;
  const linkedOpTab = document.querySelector(`[data-tab-link-id="${ tabId }"].output-tab`);
  if (linkedOpTab && !linkedOpTab.classList.contains('active')) { opTabClickHandler(linkedOpTab) }
}

function initializeCPHeight() {

  codePrettifyContainers.forEach((container, i) => {
    const tabs       = container.querySelectorAll('.lang-type-tab');
    const preEls     = container.querySelectorAll('pre');
    const enlargeBtn = container.querySelector('.enlarge-btn');

    // (A) container の高さを制限
    if (!enlargeBtn.classList.contains('enlarged')) { container.style.height = `${ containerHeightList[i] }px` }
  
    tabs.forEach((tab, j) => {
      if (tab.classList.contains('active') && !enlargeBtn.classList.contains('enlarged')) {
        // .active が付いている content 内の code の高さが閾値より高い場合
        if (codeHeightLists[i][j] > thresholdHeight - restHeight) {
          // enlargeBtn を表示してイベントを追加
          enlargeBtn.classList.add('show');
          enlargeBtn.addEventListener('click', enlargeBtnClickHandler);
          // pre の height の最適化
          preEls[j].style.height = `${ thresholdHeight - restHeight }px`;
        }
        else {
          preEls[j].style.height = `${ codeHeightLists[i][j] }px`;
        }
      }
      // enlarged 状態で resize された場合
      else if (tab.classList.contains('active') && enlargeBtn.classList.contains('enlarged')) {
        preEls[j].style.height = `${ codeHeightLists[i][j] }px`; // (1) 再計算されたcodeHeightListsで伸ばした状態に
      }

    });
  });
}

function initializeCPTab() {
  codePrettifyContainers.forEach((container, i) => {  
    const tabs         = container.querySelectorAll('.lang-type-tab');
    tabs.forEach((tab, j) => {
      // (I) .lang-type-tab の width の"初期化"
      tab.style.minWidth = '12rem';
      tab.style.maxWidth = '12rem';
        // [I] .lang-type-tab の width の"最適化"
      if (tab.classList.contains('active') && tabWidthLists[i][j] > remToPx(12)) {
          tab.style.minWidth = `${ tabWidthLists[i][j] }px`;
          tab.style.maxWidth = `${ tabWidthLists[i][j] }px`;
      }
    });
  });
}

// initialize 実行
initializeCPHeight();
initializeCPTab();

// その他設定
codePrettifyContainers.forEach((container, i) => {  
  // reduceボタンでページ内ジャンプするときのidを割り当て
  container.id = `reduce-target-${ i + 1 }`

  // tab が複数有ればボタンを有効化
  const tabs = container.querySelectorAll('.lang-type-tab');
  if (tabs.length > 0) {
    tabs.forEach(tab => {
      tab.style.cursor = 'pointer';
      tab.addEventListener('click', cpTabClickHandler);
    });
  }
});


// copy code to clipboard ////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////
const clipBtns = document.querySelectorAll('.clipboard-btn');
function copyToClipboard(i) {
  const code = codeText[i];
  if (navigator.clipboard) {
    return navigator.clipboard.writeText(code).then(
      () => { 
        alert('copied');
      },
      () => {
        // code.select();
        // document.execCommand('copy');
      });
  }
}
clipBtns.forEach((btn, i) => {
  btn.addEventListener('click', () => { copyToClipboard(i) });
});


// outputのタブメニュー //////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////
const outputContainers = document.querySelectorAll('.output-container');

const getOpTabWidthLists = () => [...outputContainers].map(container => {
  const tabs = container.querySelectorAll('.output-tab');
  tabs.forEach(tab => { tab.style.minWidth = 'fit-content'; tab.style.maxWidth = 'fit-content'; });
  return [...tabs].map(tab => tab.getBoundingClientRect().width);
});
let opTabWidthLists = getOpTabWidthLists();


function opTabClickHandler(e) {
  // (*) .output-container         の .output-tab    の
  // 'click'イベントのhandlerとして呼び出され event Object   が渡される場合と
  // (**) .code-prettify-container の .lang-type-tab の
  // 'click'イベントのhandler内で呼び出され   .lang-type-tab が渡される場合がある
  // ため targetEl の取得法は分岐する
  const targetEl        = (e.currentTarget) ? e.currentTarget : e;
  const targetTab       = targetEl;
  const tabs            = targetTab.parentNode.querySelectorAll(':scope>.output-tab');
  const targetContainer = targetTab.closest('.output-container');
  const contents        = targetContainer.querySelectorAll('.output-content');

  // 前のタブの index を取得
  const prevTabIndex = [...tabs].findIndex(tab => tab.classList.contains('active') );
  // (I) .lang-type-tab の width の初期化
  [...tabs][prevTabIndex].style.minWidth = '12rem';
  [...tabs][prevTabIndex].style.maxWidth = '12rem';

  // 発火した tab とそれが属する container の index を取得
  const tabIndex       = [...tabs].findIndex(tab => tab === targetEl );
  const containerIndex = [...outputContainers].findIndex(container => 
    container === targetEl.closest('.output-container')
  );

  // (1) .output-tab, .output-content の .active を"外す"
  tabs.forEach(tab => { tab.classList.remove('active') });
  contents.forEach(content => { content.classList.remove('active') });
  // [1] .output-tab, .output-content の .active を"付ける"
  targetTab.classList.add('active');
  contents[tabIndex].classList.add('active');

  // [I] .lang-type-tab の width の"最適化"
  if (opTabWidthLists[containerIndex][tabIndex] > remToPx(12)) {
    targetEl.style.minWidth = `${ opTabWidthLists[containerIndex][tabIndex] }px`;
    targetEl.style.maxWidth = `${ opTabWidthLists[containerIndex][tabIndex] }px`;
  }

  // code-prettify-container との連動
  const tabId = targetEl.dataset.tabLinkId;
  const linkedCpTab = document.querySelector(`[data-tab-link-id="${ tabId }"].lang-type-tab`);
  if (linkedCpTab && !linkedCpTab.classList.contains('active')) { cpTabClickHandler(linkedCpTab) }
}

function initializeOpTabWidth() {
  outputContainers.forEach((outputCont, i) => {

    const tabs = outputCont.querySelectorAll('.output-tab');
    tabs.forEach((tab, j) => {
      // (I) .lang-type-tab の width の初期化
      tab.style.minWidth = '12rem';
      tab.style.maxWidth = '12rem';
      // [I] .lang-type-tab の width の最適化
      if (tab.classList.contains('active') && tabWidthLists[i][j] > remToPx(12)) {
        tab.style.minWidth = `${ opTabWidthLists[i][j] }px`;
        tab.style.maxWidth = `${ opTabWidthLists[i][j] }px`;
      }
    });
  });
}

// initialize 実行
initializeOpTabWidth();

// その他設定
outputContainers.forEach(outputCont => {
  const tabs = outputCont.querySelectorAll('.output-tab');
  // tab が複数有ればボタンを有効化
  if (tabs.length > 0) {
    tabs.forEach(tab => {
      tab.style.cursor = 'pointer';
      tab.addEventListener('click', opTabClickHandler);
    });
  }
});


// steps-acc /////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////
// 適当な要素に.acc-container .acc-content クラスを付与
const accElements = document.querySelectorAll('.acc');
accElements.forEach(accEl => {
  const accContainer = accEl.querySelector(':scope>.note-contents, :scope>.step-detail-container');
  accContainer.classList.add('acc-container');
  const accContent = accEl.querySelector(':scope>.note-contents>.note-content, :scope>.step-detail-container>.step-detail');
  accContent.classList.add('acc-content');
  const accBtn = accEl.querySelector(':scope>.note-text, :scope>.note-list-title');
  accBtn.classList.add('acc-btn');
});

function accHandler(e) {
  const accBtn        = e.currentTarget;
  const accEl         = accBtn.closest('.acc');
  const content       = accEl.querySelector('.acc-content');
  const contentHeight = getHiddenRect(content).height;

  accEl.classList.toggle('show');

  setContainerHeight(accEl, content);
  const diff = (accEl.classList.contains('show')) ? contentHeight : -1 * contentHeight;
  accHeightInterlocker(content, diff);

  if (accEl.classList.contains('show') && accBtn.classList.contains('for-pen-anime')) { penAnime(accEl) }
}

function setContainerHeight(accEl, content) {
  const container     = accEl.querySelector('.acc-container');
  const contentHeight = content.getBoundingClientRect().height;
  if      ( accEl.classList.contains('show')) { container.style.height = `${ contentHeight }px` }
  else if (!accEl.classList.contains('show')) { container.style.height =                    '0' }
}

function setDottedLine() {
  const dottedLines = document.querySelectorAll('.step-dotted-line');
  dottedLines.forEach(line => {
    const parentClassList = line.parentNode.classList;
    const listTitle       = line.parentNode.querySelector('.note-list-title');
    const listTitleHeight = listTitle.getBoundingClientRect().height;
    // 非展開のアコーディオンの場合
    if (parentClassList.contains('acc') && !parentClassList.contains('show')) {
      line.style.height = `${(listTitleHeight - remToPx(2.6))}px`; // タイトルが1行なら０、2行以上の場合に意味がある。
    }
    // それ以外の場合
    else {
      const content       = line.parentNode.querySelector('.step-detail');
      const contentHeight = getHiddenRect(content).height;
      line.style.height = `${ contentHeight + (listTitleHeight - remToPx(2.6))}px`;
    }
  });
}

function settingAcc(accEls) {
  accEls.forEach(accEl => {
    const accContent = accEl.querySelector('.acc-content');
    const accBtn     = accEl.querySelector('.acc-btn');
    // 子孫要素にも.accがあれば先に、再帰的に処理を実行: 
    // 子から先に高さを設定しないと親の高さを決定できない(というかずれる)
    if (accEl.querySelector('.acc')) {
      // ひとまず1つ子孫accを取得
      const testChild = accEl.querySelector('.acc');
      // そのaccまでの世代数 i を求める
      let i = 0, testParent = testChild.parentNode;
      while (!(testParent === accEl)) { i++; testParent = testParent.parentNode; }
      // 同じ i 世代差にある .acc を全て取得
      const query = `:scope >${'*>'.repeat(i)} .acc`;
      const childAccEls = accEl.querySelectorAll(query);
  
      settingAcc(childAccEls); // 再帰
    }
    // 正味したい処理
    setContainerHeight(accEl, accContent);
    // btnのclickイベントを更新
    accBtn.removeEventListener('click', accHandler);
    accBtn.addEventListener('click', accHandler);
  });
}

// 実行
const f1accEls = document.querySelectorAll('.acc:not(.acc .acc)');
settingAcc(f1accEls);
setDottedLine();


// 関連記事のinfoボタンのクリックイベント ////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////
const relatedLis         = document.querySelectorAll( '.related-container li' );
const rArtDescContainers = document.querySelectorAll( '.art-desc-container'   );
const rArtDescs          = document.querySelectorAll( '.art-desc'             );
const noImgs             = document.querySelectorAll( '.no-img'               );
const blurMasks          = document.querySelectorAll( '.blur-mask'            );
const infoBtns           = document.querySelectorAll( '.art-info-btn'         );

const rArtDescMT        = getPx(document.querySelector('.art-desc'), 'margin-top'),
      rArtDescHeight    =  rArtDescs[0].getBoundingClientRect().height,
      rArtDescMB        = getPx(document.querySelector('.art-desc'), 'margin-bottom');
const netRArtDescHeight =  rArtDescMT + rArtDescHeight +  rArtDescMB;
const rArtTitleHeight = getPx(document.querySelector('.art-title'), 'height'),
      dateLineHeight  = getPx(document.querySelector('.date-line'), 'height');
const rLiHeight = rArtTitleHeight + dateLineHeight + netRArtDescHeight;

relatedLis.forEach((li, i) => {
  infoBtns[i].addEventListener('click', () => {
    li.classList.toggle('active');
    if (li.classList.contains('active')) {
      blurMasks[i].style.opacity = '1';
      rArtDescContainers[i].style.height = `${ netRArtDescHeight  }px`;
      noImgs[i].style.height             = `${ rLiHeight          }px`;
      setTimeout(() => {
        adjustLines();
        blurMasks[i].style.opacity = '0';
      }, 900);

    } else {
      rArtDescContainers[i].style.height = '0';
      noImgs[i].style.height = 'auto';
      setTimeout(() => {
        adjustLines();
      }, 900);
    }
  });
});


// resize イベント ///////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////
const resizeDelay = 300;

let tempId = null;
addEventListener('resize', () => {
  // Safariでアドレスバーが縦方向のscrollに対して拡縮するので、真に横幅のresizeのみで実行するには↓が必要
  if (currentWidth === innerWidth) { return }

  clearTimeout(tempId);
  tempId = setTimeout(() => {
    const body = document.querySelector('body');
    body.classList.add('off-anime');

    // 正味実行したい処理
    initializeOlBarBtn();
    adjustMemoIndent();
    // resizeで変わるモノを更新
    tabHeight = document.querySelector('.lang-type-tab').getBoundingClientRect().height;
    btnHeight = getPx(document.querySelector('.enlarge-btn'), 'height');
    restHeight = tabHeight + btnHeight;
    thresholdHeight = innerHeight * (thresholdRatio / 100);
    tabWidthLists       = getCPRects().tabWidthLists;
    codeHeightLists     = getCPRects().codeHeightLists;
    containerHeightList = getCPRects().containerHeightList;
    // initialize 実行
    initializeCPHeight();
    initializeCPTab();

    // output-container
    opTabWidthLists = getOpTabWidthLists();
    initializeOpTabWidth();

    // font-size が変わる等して、acc-content の高さも変わるのでアコーディオンの高さも再設定
    settingAcc(f1accEls);
    setDottedLine();
    
    body.classList.remove('off-anime');
    
  }, resizeDelay);
}, false);



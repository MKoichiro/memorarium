'use strict';

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
function pxToVw(px) {
  return px / innerWidth * 100; 
}
// ==================================================================================================== //
// ==================================================================================================== //
let currentWidth = innerWidth;
const resizeDelay = 1000 / 60; // 60fps
// ==================================================================================================== //


// 記事情報を記述した json を読み込み //////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////
let artInfoJson;
const getArtInfo = async () => {
  const artInfoUrl = "https://mkoichiro.github.io/memorarium/data/articleInfo.json";
  const response = await fetch(artInfoUrl);
  if (response.ok) { 
    artInfoJson = await response.json();
  }
}
await getArtInfo();
const langArr = artInfoJson.dictionaries.langDicts;
const artObj  = artInfoJson.articleInfo;
const newEntInfo = artObj.filter(artInfo => artInfo.id === newEntryId )[0];
const newEntLangInfo = langArr.filter(langInfo => langInfo.id === newEntInfo.langId)[0];
const newEntTitle = document.querySelector('#new-entry-title');
const newEntHref  = (newEntInfo.href.match('http', '#')) ? newEntInfo.href : `https://mkoichiro.github.io/memorarium/${ newEntInfo.href }`;
newEntTitle.innerHTML = `<a href="${ newEntInfo.href }" class="${ newEntLangInfo.abbreviation }">
                          <i class="${ newEntLangInfo.iconClassList }"></i>
                          ${ newEntInfo.title.plane }
                         </a>`;
const newEntDesc = document.querySelector('#new-entry-desc>p');
newEntDesc.innerHTML = `${ newEntInfo.detail.plane }`;
const newEntTime = document.querySelector('#new-art-wrapper time');
const date   = newEntInfo.date;
const dateFormatted = date.replaceAll('-', '.');
newEntTime.textContent = `[ ${ dateFormatted } ]`; // [ 20XX.XX.XX ]
newEntTime.dateTime = date;

////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////
// ALLのタブメニュー ///////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////
const allWrapper  = document.querySelector('#all-wrapper');
const allContentsContainer = allWrapper.querySelector('#all-contents-container');

let othersContent;
langArr.forEach((lang, i) => {
  const content = document.createElement('section');
  content.classList.add('all-content');
  if (lang.abbreviation === 'html') { content.classList.add('active') }
  content.classList.add(`${ lang.abbreviation }`);
  const ul = document.createElement('ul');
  content.appendChild(ul);

  const artInfoByLang = artObj.filter(obj => obj.langId === i); // 同じ言語のarticleの配列

  artInfoByLang.forEach(art => {
    const li = document.createElement('li');
    li.innerHTML = `<a href="https://mkoichiro.github.io/memorarium/${ art.href }">
                      <p> ${ art.title.plane } </p>
                      <time datetime="${art.date}" class="date"> ${ art.date.replaceAll('-', '.') } </time>
                    </a>`;
    ul.appendChild(li);
  });
  if (lang.abbreviation === 'others') { othersContent = content } // othersは最後にappend
  else { allContentsContainer.appendChild(content) }
});
allContentsContainer.appendChild(othersContent); // othersは最後にappend


////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////
// ALLのタブメニュー ///////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////


  const tabTitles = allWrapper.querySelectorAll('nav h3');
  const categoryBtns = allWrapper.querySelectorAll('.category-btn');
  const moveLine = allWrapper.querySelector('.move-spans');
  const allNav = allWrapper.querySelector('nav');
  const categoryLis = allWrapper.querySelectorAll('nav li');
  const staticLines = allWrapper.querySelectorAll('.static-spans');
  const MoveGraySpan = allWrapper.querySelector('.move:last-child');
  const staticGraySpans = allWrapper.querySelectorAll('.static:last-child');
  const allContents = allWrapper.querySelectorAll('.all-content');
    // CSS変数からdurationを取得
    const tabMenuDuration = getMs(document.documentElement, '--duration-tab-menu');


  const getTabTitleWidth = () => {
    const widthList = [];
    tabTitles.forEach(h3 => {
      const width = pxToRem(h3.getBoundingClientRect().width);
      widthList.push(width);
    });
    return widthList;
  }
  let titleWidthList = getTabTitleWidth();
  console.log(titleWidthList);

  staticGraySpans.forEach((span, i) => { span.style.width = `${ titleWidthList[i] }rem` });


  const clickHandler = (e) => {
    // バグ回避
    allNav.style.pointerEvents = 'none';

    // クリックされたボタンの index を取得
    const i = [...categoryBtns].findIndex(li => li === e.currentTarget);

    // 処理実行前のクラスの着脱
    categoryLis.forEach(li => { li.classList.remove('active') });
    categoryLis[i].classList.add('active');
    staticLines.forEach(li => { li.classList.remove('active') });
    moveLine.classList.add('moving');
    allContents.forEach(content => { content.classList.remove('active') });
    allContents[i].classList.add('active');

    // left 値で移動
    // left プロパティの基準点は #all-wrapper の左端と一致。
    // getBoundingClientRect() は文書からの距離しか測れないので、leftOrigin 分引く。
    // さらに、要素内のスクロール量をたす必要がある。
    const leftOrigin = allWrapper.getBoundingClientRect().left;
    const scrollLeft = allNav.scrollLeft;
    const targetLeftX = categoryBtns[i].getBoundingClientRect().left - leftOrigin + scrollLeft;
    moveLine.style.left = `${ targetLeftX }px`; // 移動を実行: 移動にしか使わないのでpxでok

    // 2色下線を調整
    MoveGraySpan.style.width = `${ titleWidthList[i] }rem`;

    // 移動後のクラスの着脱
    setTimeout(()=> {
      staticLines[i].classList.add('active');
      moveLine.classList.remove('moving');

      // バグ回避解除
      allNav.style.pointerEvents = 'auto';
    }, tabMenuDuration);
  }

  categoryBtns.forEach((btn, i) => { btn.addEventListener('click', clickHandler) });





// ||| 循環カルーセル: li.slides の生成 ||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||| //
const carouselSlides = document.querySelector('.slides');

// e.g.) carouselArtIds = [0, 5, 7, 2, 1, 3] などが index.html の head 内から渡される
carouselArtIds.forEach(id => {
  const artInfo  = artObj.filter(  obj  => obj.id  ===             id )[0],
        langInfo = langArr.filter( lang => lang.id === artInfo.langId )[0];
  const carHref  = (artInfo.href.match('http', '#')) ? artInfo.href : `https://mkoichiro.github.io/memorarium/${ artInfo.href }`;
  const liSlide = document.createElement('li');
  liSlide.classList.add('slide');
  liSlide.innerHTML = `<article>

                         <div class="text-contents">
                           <a href="${ carHref }" 
                              class="${ langInfo.lang } art-link">
                              <h3 class="art-title">
                                  <i class="${ langInfo.iconClassList }"></i>
                                  ${artInfo.title.plane}
                              </h3>
                           </a>

                           <div class="date-line">
                              <time datetime="${ artInfo.date }" class="date">
                                [ ${ artInfo.date.replaceAll('-', '.') } ]
                              </time>
                            </div>
                            <div class="art-desc">
                              <p>${ artInfo.detail.plane }</p>
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
  carouselSlides.appendChild(liSlide);
});
// |||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||| //


// ||| 循環カルーセル: 動作部分 ||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||| //

// === 要素の生成や取得 =============================================================================== //
  // スライド( li.slide )をすべて取得
  let slides = carouselSlides.querySelectorAll('.slide');

  // --- slides.length 個だけ .cp-bar-btns にボタンを生成 --------------------------------------------- //
  const nextBtn = document.querySelector('#cp-next-btn'),
        prevBtn = document.querySelector('#cp-prev-btn');
  const barBtnContainer = document.querySelector('.cp-bar-btns');
  const barBtnHTML      = '<button class="cp-bar-btn"><span></span></button>';

  barBtnContainer.innerHTML = `${barBtnHTML.repeat(slides.length)}`;
  barBtnContainer.querySelector('.cp-bar-btn').classList.add('active');
  const barBtns = document.querySelectorAll('.cp-bar-btn');
  // -------------------------------------------------------------------------------------------------- //

  // --- li.slide 要素の 0, 1番目のクローンを末尾に、n, n-1番目のクローンを先頭に追加 ----------------- //
  // → イメージ [ "n-1", "n", 0, 1, 2, ..., i, ..., n, "0", "1" ] としている。
  const firstClone   = slides[0].cloneNode(true);
  const secondClone  = slides[1].cloneNode(true);
  const semiEndClone = slides[slides.length - 2].cloneNode(true);
  const endClone     = slides[slides.length - 1].cloneNode(true);
  carouselSlides.appendChild(firstClone);
  carouselSlides.appendChild(secondClone);
  carouselSlides.prepend(endClone);
  carouselSlides.prepend(semiEndClone);
  // クローン作製後に active クラスを付与
  slides[0].classList.add('active');
  // -------------------------------------------------------------------------------------------------- //
// ==================================================================================================== //

// === ハンドラ定義の準備 ============================================================================= //
  // slides の HTMLCollection はクローンを含めたものに更新
  slides = carouselSlides.querySelectorAll('.slide');

  let currentIndex = 0;
  // CSS変数からdurationを取得
  const carouselDuration = getMs(document.documentElement, '--duration-carousel');

  // --- slide位置の初期設定 -------------------------------------------------------------------------- //
  let slideWidth = pxToVw(getPx(slides[0], 'min-width'));
  
  const mainContentsContainer = document.querySelector('.main-contents-container');
  const getInitialPos = (slideWidth) => {
    const mainWidth = pxToVw(getPx(mainContentsContainer, 'width'));
    // 「左右に前と次のスライドをチラ見せさせる幅」 = 「コンテナ幅」 - 「スライド1枚分の幅」
    const npShowWidth = mainWidth - slideWidth;
    // 初期位置は先頭に2つのクローンを追加したので 「2枚分のスライド幅」 + 「チラ見せ幅の左半分」
     return - (slideWidth * 2) + (npShowWidth / 2);
  }
  let initialPos = getInitialPos(slideWidth);

  // 初期位置を適用
  carouselSlides.style.transform = `translateX(${ initialPos }vw)`;
  // -------------------------------------------------------------------------------------------------- //

  function toggleActive() {
    // activeクラスの着脱: li.slide
    slides.forEach(slide => { slide.classList.remove('active') });
    slides[currentIndex + 2].classList.add('active');
    // activeクラスの着脱: .cp-slide-btn
    barBtns.forEach(btn => { btn.classList.remove('active') });
    barBtns[Math.abs((currentIndex + barBtns.length) % barBtns.length)].classList.add('active');
  }
// ==================================================================================================== //

// === ハンドラ定義部分 =============================================================================== //
  // --- button#cp-next(/prev)-btn 共通の hover イベントハンドラ -------------------------------------- //
  function getBarBtns(btn) {
    const bolderBar = btn.querySelector('span:first-child'),
          normalBar = btn.querySelector('span:last-child');
    return { bolder: bolderBar, normal: normalBar }
  }
  function npBtnMouseoverHandler(e) {
    const targetBars = getBarBtns(e.currentTarget);
    targetBars.bolder.style.flex = 2;
    targetBars.normal.style.flex = 1;
  }
  function npBtnMouseleaverHandler(e) {
    const targetBars = getBarBtns(e.currentTarget);
    targetBars.bolder.style.flex = 1;
    targetBars.normal.style.flex = 2;
  }
  // -------------------------------------------------------------------------------------------------- //

  // --- 次へボタン( button#cp-next-btn )の click イベントハンドラ ------------------------------------ //
  function showNextSlide(e) {
    // menu closeを回避
    if (innerWidth > 600) { e.stopPropagation() }
    currentIndex++;
    slides.forEach(slide => { slide.style.transition = `opacity ${ carouselDuration }ms` });
    toggleActive();
    // アニメを有効にして移動
    carouselSlides.style.transition = `transform ${ carouselDuration }ms`;
    carouselSlides.style.transform  = `translateX(${ initialPos - (slideWidth * currentIndex) }vw)`;

    // "clonedの0"へ遷移するアニメが終わった直後、"originalの0"までアニメを無効にして移動
    if (currentIndex === slides.length - 4) {
      setTimeout(() => {
        carouselSlides.style.transition = 'none';
        carouselSlides.style.transform  = `translateX(${ initialPos }vw)`;
        // currentIndexをoriginal-0にして循環させる
        currentIndex = 0;
        slides.forEach(slide => { slide.style.transition = `none` });
        toggleActive();
      }, carouselDuration);
    }
  }
  // -------------------------------------------------------------------------------------------------- //

  // --- 前へボタン( button#cp-prev-btn )の click イベントハンドラ ------------------------------------ //
  function showPrevSlide(e) {
    // menu closeを回避
    if (innerWidth > 600) { e.stopPropagation() }
    currentIndex--;
    slides.forEach(slide => { slide.style.transition = `opacity ${ carouselDuration }ms` });
    toggleActive();
    // アニメを有効にして移動
    carouselSlides.style.transition = `transform ${ carouselDuration }ms`;
    carouselSlides.style.transform  = `translateX(${initialPos - (slideWidth * currentIndex)}vw)`;
    
    // "clonedのn"へ遷移するアニメが終わった直後、"originalのn"までアニメを無効にして移動
    if (currentIndex === -1) {
      setTimeout(() => {
        carouselSlides.style.transition = 'none';
        carouselSlides.style.transform  = `translateX(${initialPos - (slideWidth * (slides.length - 5))}vw)`;
        // currentIndexをoriginal-nにして循環させる
        currentIndex = slides.length - 5;
        slides.forEach(slide => { slide.style.transition = `none` });
        toggleActive();
      }, carouselDuration);
    }
  }
  // -------------------------------------------------------------------------------------------------- //

  // --- '-----'部分の click イベントハンドラ --------------------------------------------------------- //
  const showSlide = (e) => {
    currentIndex = [...barBtns].findIndex(barBtn => barBtn === e.currentTarget);
    toggleActive();
    carouselSlides.style.transition = `transform ${ carouselDuration }ms`;
    carouselSlides.style.transform  = `translateX(${ initialPos - (slideWidth * currentIndex) }vw)`;
  }
  // -------------------------------------------------------------------------------------------------- //

  // --- swipe 操作のイベントハンドラ ----------------------------------------------------------------- //
  let startX;
  const effectiveRatio = .25; // slideWidthの"25%"以上の距離をスワイプした時にslideをめくる
  const preventScroll = (e) => { e.preventDefault() }
  // touchstart
  const carouselTouchstart = (e) => {
    startX = e.touches[0].pageX;
    // カルーセルをスワイプするときはページをスクロールを禁止
    document.addEventListener('touchmove', preventScroll, {passive: false});
  }
  // touchmove
  const carouselTouchmove = (e) => {
    const x  = e.changedTouches[0].pageX;
    const dx = pxToVw(x - startX);
    carouselSlides.style.transform  = `translateX(${ initialPos - (slideWidth * currentIndex) + dx }vw)`;
  }
  // touchend
  const carouselTouchend = (e) => {
    const endX              = e.changedTouches[0].pageX;
    const effectiveDistance = slideWidth * effectiveRatio;  // ページ移動を有効と判定する距離
    if (Math.abs(endX - startX) > effectiveDistance) {      // Math.abs(blah)はblahの絶対値
      if      ( endX - startX > 0 ) { showPrevSlide(e) }
      else if ( endX - startX < 0 ) { showNextSlide(e) }
    }
    else {
      carouselSlides.style.transition = `${ carouselDuration }ms`;
      carouselSlides.style.transform  = `translateX(${ initialPos - (slideWidth * currentIndex) }vw)`;
    }
    // 指を離したら、スクロール禁止を解除
    document.removeEventListener('touchmove', preventScroll);
  }
  // -------------------------------------------------------------------------------------------------- //
// ==================================================================================================== //

// === イベントリスナの登録 =========================================================================== //
  nextBtn.addEventListener( 'click',      showNextSlide           );
  nextBtn.addEventListener( 'mouseover',  npBtnMouseoverHandler   );
  nextBtn.addEventListener( 'mouseleave', npBtnMouseleaverHandler );

  prevBtn.addEventListener( 'click',      showPrevSlide           );
  prevBtn.addEventListener( 'mouseover',  npBtnMouseoverHandler   );
  prevBtn.addEventListener( 'mouseleave', npBtnMouseleaverHandler );

  barBtns.forEach(btn => { btn.addEventListener('click', showSlide) });

  carouselSlides.addEventListener( 'touchstart', carouselTouchstart, {passive: false} );
  carouselSlides.addEventListener( 'touchmove',  carouselTouchmove,  {passive: false} );
  carouselSlides.addEventListener( 'touchend',   carouselTouchend,   {passive: false} );
// ==================================================================================================== //

// === resizeイベント ================================================================================= //
// メニュー開閉でも同じ処理を実行するので関数化
console.log('ghj');
const resizeCarousel = () => {
  slideWidth = pxToVw(getPx(slides[0], 'min-width'));
  initialPos = getInitialPos(slideWidth);
  carouselSlides.style.transform  = `translateX(${ initialPos - (slideWidth * currentIndex) }vw)`;
}

const menuBtn = document.querySelector('#menu-btn');
menuBtn.addEventListener('click', () => {
  if (innerWidth > 600) {
    console.log('pass')
    setTimeout(() => { resizeCarousel() }, 1000);
  }
});

// resize イベントリスナを登録
let timeoutId = 0;
window.addEventListener('resize', () => {
  if (currentWidth === innerWidth) { return                    }
  else                             { currentWidth = innerWidth }

  if (timeoutId) { clearTimeout(timeoutId) }
  setTimeout(() => {
    console.log(';woaeifj');
    resizeCarousel();
    timeoutId = 0;
  }, resizeDelay);
});
// ==================================================================================================== //

// |||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||| //


// ||| line break 判定と文字数調整 |||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||| //
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
  const allArtLineHeight = getPx(allArticles[0], 'line-height');
  const dateHeight       = getPx(allArticles[0], 'height');
  allArticles.forEach(art => {art.parentNode.height = `${allArtLineHeight * 2 + dateHeight}px`});

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
    // ------------------------------------------------------------------------------------------------ //
    // NEW ENTRY, ARTICLES の中のp要素を調整 ---------------------------------------------------------- //
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
    // ------------------------------------------------------------------------------------------------ //
    // ALL の中の各記事タイトル部分を調整 ------------------------------------------------------------- //
    allArticles.forEach((art, i) => {
      // 初期化
      art.style.height = 'auto';
      art.innerHTML = AABackUp[i];
      if (lines(art) > 2) {
        // 2行になるまで末尾削除
        while (lines(art) > 2) { art.innerHTML = removeEndChar(art.innerHTML) }
        // もう1文字削除して省略文字を追加
        art.innerHTML = removeEndChar(art.innerHTML);
        art.innerHTML = art.innerHTML + '<span style="font-size: 1rem;">_ _ _</span>';
      }
      art.style.height = `${allArtLineHeight * 2}px`;
    });
    // ------------------------------------------=----------------------------------------------------- //
  }

  // adjustLines();
// |||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||| //


// resizeイベントは拡縮中、連続的に発火してしまうのである程度間引く
let indexResizeId = 0;
window.addEventListener('resize', () => {
  if (currentWidth === innerWidth) { return }

  if (indexResizeId) { clearTimeout(indexResizeId) }
  indexResizeId = setTimeout(() => {
    adjustTab();
    // adjustLines();
    indexResizeId = 0;
  }, resizeDelay);

});

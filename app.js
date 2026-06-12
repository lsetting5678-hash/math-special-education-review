/* -------------------------------------------------------------
 * 國小五年級下學期數學總複習簡報 - 互動邏輯 (app.js)
 * 包含簡報切換、語音合成朗讀、輔助功能、25題隨堂測驗及單位化聚圖表切換
 * ------------------------------------------------------------- */

// --- 簡報狀態管理 ---
let currentSlideIndex = 0;
const slides = document.querySelectorAll('.slide');
const navList = document.getElementById('navList');
const progressDotsContainer = document.getElementById('progressDots');
const btnPrev = document.getElementById('btnPrev');
const btnNext = document.getElementById('btnNext');

// 語音朗讀設定
let isTtsEnabled = true;
let currentUtterance = null;

// --- 初始化大綱導覽與進度點 ---
function initSlideshow() {
  navList.innerHTML = '';
  progressDotsContainer.innerHTML = '';
  
  slides.forEach((slide, index) => {
    // 建立側邊欄單元項目
    const title = slide.getAttribute('data-nav-title') || `投影片 ${index}`;
    const li = document.createElement('li');
    li.className = `nav-item ${index === 0 ? 'active' : ''}`;
    li.textContent = title;
    li.addEventListener('click', () => goToSlide(index));
    navList.appendChild(li);

    // 建立底部進度小圓點
    const dot = document.createElement('div');
    dot.className = `dot ${index === 0 ? 'active' : ''}`;
    dot.addEventListener('click', () => goToSlide(index));
    progressDotsContainer.appendChild(dot);
  });

  updateSlideControls();
}

// 切換至指定投影片
function goToSlide(index) {
  if (index < 0 || index >= slides.length) return;
  
  // 停止先前的朗讀
  stopSpeaking();
  
  // 清除所有投影片的 active 和 prev 狀態，防止類別殘留造成排版偏移
  slides.forEach(slide => {
    slide.classList.remove('active', 'prev');
  });
  
  // 如果是往後切換，將前一張投影片標記為 prev 以觸動向左滑出動畫
  if (index > currentSlideIndex) {
    slides[currentSlideIndex].classList.add('prev');
  }

  currentSlideIndex = index;
  slides[currentSlideIndex].classList.add('active');

  // 更新導覽與進度狀態
  document.querySelectorAll('.nav-item').forEach((item, idx) => {
    item.classList.toggle('active', idx === currentSlideIndex);
  });
  document.querySelectorAll('.dot').forEach((dot, idx) => {
    dot.classList.toggle('active', idx === currentSlideIndex);
  });

  updateSlideControls();
  
  // 檢查是否進入測驗頁面
  const activeSlide = slides[currentSlideIndex];
  const quizUnit = activeSlide.getAttribute('data-quiz-unit');
  if (quizUnit) {
    // 進入測驗頁面時，若尚未完成測驗，隱藏底部下一頁按鈕以防止跳過
    const unit = parseInt(quizUnit);
    if (quizState[unit].currentQuestionIndex < 5) {
      btnNext.style.visibility = 'hidden';
    } else {
      btnNext.style.visibility = 'visible';
    }
    loadQuizForUnit(unit);
  } else {
    btnNext.style.visibility = currentSlideIndex === slides.length - 1 ? 'hidden' : 'visible';
  }

  // 自動朗讀投影片主要內容
  if (isTtsEnabled) {
    autoSpeakSlide();
  }
}

// 更新按鈕狀態
function updateSlideControls() {
  btnPrev.style.visibility = currentSlideIndex === 0 ? 'hidden' : 'visible';
}

// 監聽鍵盤方向鍵切換
document.addEventListener('keydown', (e) => {
  // 測驗頁面中如果尚未完成，限制鍵盤方向鍵向右，防止跳過測驗
  const activeSlide = slides[currentSlideIndex];
  const quizUnit = activeSlide.getAttribute('data-quiz-unit');
  
  if (e.key === 'ArrowRight' || e.key === 'PageDown') {
    if (quizUnit && quizState[parseInt(quizUnit)].currentQuestionIndex < 5) {
      speakText("請先完成本單元的隨堂練習，才可以前往下一個單元喔！");
      return;
    }
    goToSlide(currentSlideIndex + 1);
  } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
    goToSlide(currentSlideIndex - 1);
  }
});

btnPrev.addEventListener('click', () => goToSlide(currentSlideIndex - 1));
btnNext.addEventListener('click', () => {
  const activeSlide = slides[currentSlideIndex];
  const quizUnit = activeSlide.getAttribute('data-quiz-unit');
  if (quizUnit && quizState[parseInt(quizUnit)].currentQuestionIndex < 5) {
    speakText("請先完成本單元的隨堂練習，才可以前往下一個單元喔！");
    return;
  }
  goToSlide(currentSlideIndex + 1);
});


// --- 語音朗讀 (Web Speech API) ---
const synth = window.speechSynthesis;

function speakText(text) {
  if (!synth) return;
  stopSpeaking();
  
  currentUtterance = new SpeechSynthesisUtterance(text);
  currentUtterance.lang = 'zh-TW';
  currentUtterance.rate = 0.85; // 稍慢的速度適合學習障礙孩子理解
  currentUtterance.pitch = 1.0;
  
  synth.speak(currentUtterance);
}

function stopSpeaking() {
  if (synth && synth.speaking) {
    synth.cancel();
  }
}

// 自動朗讀當前投影片的內容
function autoSpeakSlide() {
  const activeSlide = slides[currentSlideIndex];
  const quizUnit = activeSlide.getAttribute('data-quiz-unit');
  
  if (quizUnit) {
    // 測驗頁面自動朗讀目前的題目
    const unit = parseInt(quizUnit);
    const state = quizState[unit];
    if (state.currentQuestionIndex < 5) {
      const q = quizQuestionsDb[unit][state.currentQuestionIndex];
      speakText(`第 ${state.currentQuestionIndex + 1} 題。 ${q.question}。選項有。 一：${q.options[0]}。 二：${q.options[1]}。 三：${q.options[2]}。 四：${q.options[3]}。`);
    } else {
      speakText(`恭喜你完成單元 ${unit} 的隨堂測驗！你答對了 ${state.score} 題。請點選右下角下一頁，進入下一個單元複習！`);
    }
    return;
  }
  
  // 查找是否有自訂的朗讀按鈕
  const readBtn = activeSlide.querySelector('.btn-read-aloud');
  if (readBtn) {
    readBtn.click();
  } else if (currentSlideIndex === 0) {
    speakText("五年級下學期數學複習營。哈囉！歡迎來到五年級數學複習營！這裡有有趣的圖形、好玩的滑桿，還有會唱歌的星星喔！點擊右下角按鈕開始吧。");
  } else if (currentSlideIndex === slides.length - 1) {
    speakText("恭喜完成複習！你太棒了！完成了國小五年級下學期數學的總複習！多重感官與互動練習能幫助你的大腦更好記住數學規律。繼續保持好奇心，數學其實很有趣喔！");
  }
}

// 輔助功能控制鍵設定
const btnTts = document.getElementById('btnTts');
const btnContrast = document.getElementById('btnContrast');
const btnDarkMode = document.getElementById('btnDarkMode');

btnTts.addEventListener('click', () => {
  isTtsEnabled = !isTtsEnabled;
  btnTts.classList.toggle('active', isTtsEnabled);
  if (!isTtsEnabled) stopSpeaking();
  else autoSpeakSlide();
});

btnContrast.addEventListener('click', () => {
  const isContrast = document.documentElement.getAttribute('data-theme') === 'contrast';
  if (isContrast) {
    document.documentElement.removeAttribute('data-theme');
    btnContrast.classList.remove('active');
  } else {
    document.documentElement.setAttribute('data-theme', 'contrast');
    btnContrast.classList.add('active');
    btnDarkMode.classList.remove('active');
  }
});

btnDarkMode.addEventListener('click', () => {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  if (isDark) {
    document.documentElement.removeAttribute('data-theme');
    btnDarkMode.classList.remove('active');
  } else {
    document.documentElement.setAttribute('data-theme', 'dark');
    btnDarkMode.classList.add('active');
    btnContrast.classList.remove('active');
  }
});

// 字型大小調整
let fontSizeMultiplier = 1.0;
const root = document.documentElement;

document.getElementById('btnFontInc').addEventListener('click', () => {
  if (fontSizeMultiplier < 1.6) {
    fontSizeMultiplier += 0.1;
    root.style.setProperty('--font-size-multiplier', fontSizeMultiplier);
    updateBodyFont();
  }
});

document.getElementById('btnFontDec').addEventListener('click', () => {
  if (fontSizeMultiplier > 0.8) {
    fontSizeMultiplier -= 0.1;
    root.style.setProperty('--font-size-multiplier', fontSizeMultiplier);
    updateBodyFont();
  }
});

document.getElementById('btnFontReset').addEventListener('click', () => {
  fontSizeMultiplier = 1.0;
  root.style.setProperty('--font-size-multiplier', fontSizeMultiplier);
  updateBodyFont();
});

function updateBodyFont() {
  document.body.style.fontSize = `${fontSizeMultiplier * 100}%`;
}


// --- 單元六：小數除法步驟互動 ---
let divStep = 0;
const btnNextDivStep = document.getElementById('btnNextDivStep');
const divStepQ = document.getElementById('div-step-q');
const divStepZ1 = document.getElementById('div-step-z1');
const divSub1 = document.getElementById('div-sub-1');
const divLine1 = document.getElementById('div-line-1');
const divRem1 = document.getElementById('div-rem-1');
const divSub2 = document.getElementById('div-sub-2');
const divLine2 = document.getElementById('div-line-2');
const divRem2 = document.getElementById('div-rem-2');
const divSub3 = document.getElementById('div-sub-3');
const divLine3 = document.getElementById('div-line-3');
const divRem3 = document.getElementById('div-rem-3');

const divStepSpeech = [
  "步驟一：因為15比40小，所以在個位商寫上0，並點上小數點。同時在15後面補一個0，變成150。",
  "步驟二：商寫3。40乘以3等於120。150減120餘數是30。然後在30後面再補一個0，變成300。",
  "步驟三：商寫7。40乘以7等於280。300減280餘數是20。在20後面再補一個0，變成200。",
  "步驟四：商寫5。40乘以5等於200。200減200等於0，整除完成了！答案是0.375。"
];

btnNextDivStep.addEventListener('click', () => {
  divStep++;
  
  if (divStep === 1) {
    divStepQ.style.visibility = 'visible';
    divStepQ.textContent = '0.3';
    divStepZ1.style.visibility = 'visible';
    divStepZ1.textContent = '.0';
    divSub1.style.visibility = 'visible';
    divLine1.style.visibility = 'visible';
    divRem1.style.visibility = 'visible';
    speakText(divStepSpeech[0]);
  } else if (divStep === 2) {
    divStepQ.textContent = '0.37';
    divStepZ1.textContent = '.00';
    divSub2.style.visibility = 'visible';
    divLine2.style.visibility = 'visible';
    divRem2.style.visibility = 'visible';
    speakText(divStepSpeech[1]);
  } else if (divStep === 3) {
    divStepQ.textContent = '0.375';
    divStepZ1.textContent = '.000';
    divSub3.style.visibility = 'visible';
    divLine3.style.visibility = 'visible';
    divRem3.style.visibility = 'visible';
    speakText(divStepSpeech[2]);
    btnNextDivStep.textContent = "看最終結果";
  } else if (divStep === 4) {
    speakText(divStepSpeech[3]);
    celebrateConfetti();
    btnNextDivStep.textContent = "重新播放步驟";
  } else {
    // 重設步驟
    divStep = 0;
    divStepQ.style.visibility = 'hidden';
    divStepZ1.style.visibility = 'hidden';
    divSub1.style.visibility = 'hidden';
    divLine1.style.visibility = 'hidden';
    divRem1.style.visibility = 'hidden';
    divSub2.style.visibility = 'hidden';
    divLine2.style.visibility = 'hidden';
    divRem2.style.visibility = 'hidden';
    divSub3.style.visibility = 'hidden';
    divLine3.style.visibility = 'hidden';
    divRem3.style.visibility = 'hidden';
    btnNextDivStep.textContent = "看解題下一步";
  }
});


// --- 單元二：3D 長方體展開圖 ---
const cube3D = document.getElementById('cube3D');
const btnUnfoldPrism = document.getElementById('btnUnfoldPrism');
let isUnfolded = false;

btnUnfoldPrism.addEventListener('click', () => {
  isUnfolded = !isUnfolded;
  cube3D.classList.toggle('unfolded', isUnfolded);
  
  if (isUnfolded) {
    btnUnfoldPrism.innerHTML = `<i class="fa-solid fa-compress"></i> <span>折疊成立體圖形</span>`;
    speakText("長方體展開了！你可以看到對稱的六個面平躺在桌面上。紅色是前面和後面，藍色是上面和下面，粉色是左邊和右邊。這就是表面積的組合成因喔。");
  } else {
    btnUnfoldPrism.innerHTML = `<i class="fa-solid fa-expand"></i> <span>點我展開圖形！</span>`;
    speakText("收起來，變成一個長方體了！有立體空間感了吧！");
  }
});


// --- 單元三：比率與百分率百格圖與位值移動 ---
const grid100 = document.getElementById('grid100');
const pctSlider = document.getElementById('pctSlider');
const lblGridCount = document.getElementById('lblGridCount');
const lblPercentage = document.getElementById('lblPercentage');

// 動態生成 100 格百格圖
function generateGrid100() {
  if (!grid100) return;
  grid100.innerHTML = '';
  for (let i = 0; i < 100; i++) {
    const cell = document.createElement('div');
    cell.className = 'grid-cell';
    grid100.appendChild(cell);
  }
  updateGridColor(parseInt(pctSlider.value));
}

// 根據滑桿值更新百格圖著色
function updateGridColor(val) {
  if (!grid100) return;
  const cells = grid100.querySelectorAll('.grid-cell');
  cells.forEach((cell, idx) => {
    cell.classList.toggle('active', idx < val);
  });
  lblGridCount.textContent = val;
  lblPercentage.textContent = `${val}%`;
}

if (pctSlider) {
  pctSlider.addEventListener('input', (e) => {
    const val = parseInt(e.target.value);
    updateGridColor(val);
  });

  pctSlider.addEventListener('change', (e) => {
    const val = parseInt(e.target.value);
    speakText(`這代表一百格裡面的 ${val} 格，也就是比率 百分之 ${val}，記作百分率 ${val}%`);
  });
}

// 位值平移看板邏輯 0.78 ⇄ 78%
const btnToggleShift = document.getElementById('btnToggleShift');
const shiftDot = document.getElementById('shiftDot');
const shiftPercent = document.getElementById('shiftPercent');
const shiftN1 = document.getElementById('shift-n1');
let isPercentageState = false;

if (btnToggleShift) {
  btnToggleShift.addEventListener('click', () => {
    isPercentageState = !isPercentageState;
    
    if (isPercentageState) {
      shiftDot.style.transform = 'translateX(55px)'; // 平移到 8 的後面
      shiftPercent.style.opacity = '1';
      shiftN1.style.color = '#ccc'; // 0 變淡
      speakText("小數變百分率：小數點往右移兩位，變成七十八百分比。");
    } else {
      shiftDot.style.transform = 'translateX(0px)';
      shiftPercent.style.opacity = '0';
      shiftN1.style.color = 'var(--text-main)';
      speakText("百分率變小數：小數點往左移兩位，前方補上零點，變成零點七八。");
    }
  });
}


// --- 單元四：時間進位互動 ---
const btnTimeCarry = document.getElementById('btnTimeCarry');
const timeResultRow = document.getElementById('timeResultRow');

if (btnTimeCarry) {
  btnTimeCarry.addEventListener('click', () => {
    timeResultRow.style.visibility = 'visible';
    celebrateConfetti();
    speakText("太棒了！75分鐘裡有60分鐘，我們把它進位成 1小時。所以6小時加1小時等於7小時，剩下15分鐘！答案就是 7小時 15分。");
  });
}

// --- 單元九：時間切換頁籤與圖表放大 ---
let timeInfographicZoom = false;

function switchTimeTab(type) {
  const btnCalc = document.getElementById('tab-time-calc');
  const btnChart = document.getElementById('tab-time-chart');
  const calcContainer = document.getElementById('timeCalculatorContainer');
  const chartContainer = document.getElementById('timeChartContainer');
  
  if (!btnCalc || !btnChart || !calcContainer || !chartContainer) return;
  
  if (type === 'calc') {
    btnCalc.classList.add('active');
    btnChart.classList.remove('active');
    calcContainer.style.display = 'block';
    chartContainer.style.display = 'none';
    speakText("切換到時間計算練習。您可以練習進位操作。");
  } else {
    btnCalc.classList.remove('active');
    btnChart.classList.add('active');
    calcContainer.style.display = 'none';
    chartContainer.style.display = 'flex';
    
    // 重設放大
    timeInfographicZoom = false;
    const timeImg = document.getElementById('timeInfographicImg');
    if (timeImg) timeImg.style.transform = 'scale(1)';
    
    speakText("時間化聚圖表。一日等於二十四小時。一小時等於六十分鐘。一分鐘等於六十秒鐘。大單位化聚到小單位用乘法，小單位到大單位用除法。");
  }
}

function zoomTimeInfographic() {
  const timeImg = document.getElementById('timeInfographicImg');
  if (!timeImg) return;
  timeInfographicZoom = !timeInfographicZoom;
  timeImg.style.transform = timeInfographicZoom ? 'scale(1.5)' : 'scale(1)';
  speakText(timeInfographicZoom ? "圖表已放大，您可以更清晰地查看時間化聚的數字規律。" : "圖表已縮小還原。");
}


// --- 單元五：線對稱鏡像網格 ---
const symmetryGrid = document.getElementById('symmetryGrid');
const btnResetSymmetry = document.getElementById('btnResetSymmetry');
const gridCols = 10;
const gridRows = 10;

function generateSymmetryGrid() {
  if (!symmetryGrid) return;
  symmetryGrid.innerHTML = '<div class="symmetry-axis"></div>';
  for (let r = 0; r < gridRows; r++) {
    for (let c = 0; c < gridCols; c++) {
      const cell = document.createElement('div');
      cell.className = 'symmetry-cell';
      cell.setAttribute('data-row', r);
      cell.setAttribute('data-col', c);
      cell.addEventListener('click', () => handleSymmetryCellClick(r, c));
      symmetryGrid.appendChild(cell);
    }
  }
}

function handleSymmetryCellClick(r, c) {
  if (c >= gridCols / 2) {
    speakText("請點點看左邊的藍色區域，右邊會幫你變出一樣的綠色區域喔！");
    return;
  }
  
  const leftCell = symmetryGrid.querySelector(`[data-row="${r}"][data-col="${c}"]`);
  const targetC = gridCols - 1 - c;
  const rightCell = symmetryGrid.querySelector(`[data-row="${r}"][data-col="${targetC}"]`);
  const isActivated = leftCell.classList.contains('active-left');
  
  if (isActivated) {
    leftCell.classList.remove('active-left');
    rightCell.classList.remove('active-right');
  } else {
    leftCell.classList.add('active-left');
    rightCell.classList.add('active-right');
    speakText(`點選第 ${r+1} 行第 ${c+1} 格，右邊的對稱點第 ${targetC+1} 格同步著色！`);
  }
}

if (btnResetSymmetry) {
  btnResetSymmetry.addEventListener('click', () => {
    const cells = symmetryGrid.querySelectorAll('.symmetry-cell');
    cells.forEach(cell => {
      cell.classList.remove('active-left');
      cell.classList.remove('active-right');
    });
    speakText("網格清除，我們可以畫新的對稱圖形了！");
  });
}


// --- 單元十：大單位化聚資訊圖表切換與放大 ---
const infographicImg = document.getElementById('infographicImg');
const infographicCaption = document.getElementById('infographicCaption');
let infographicZoom = false;

const infographics = {
  area: {
    src: "assets/area.png",
    caption: "1公頃的面積和邊長100公尺的正方形面積一樣大，1公頃＝100公畝＝10000平方公尺；1平方公里是邊長1公里的正方形面積，等於100公頃。",
    tts: "面積大單位換算。一平方公里等於一百公頃。一公頃等於一百公畝。一公畝等於一百平方公尺。相鄰單位每次都是一百倍的關係。"
  },
  length: {
    src: "assets/length.png",
    caption: "1公里＝1000公尺。長度單位化聚：大單位換小單位乘以1000（如 1.5 公里 = 1500 公尺）；小單位換大單位除以1000（如 1062 公尺 = 1.062 公里）。",
    tts: "長度單位換算。一公里等於一千公尺。大單位換小單位用乘法乘以一千，小單位換大單位用除法除以一千。"
  },
  weight: {
    src: "assets/weight.png",
    caption: "1公噸(t)＝1000公斤(kg)。重量大單位化聚：公噸換公斤乘以1000（如 0.8 公噸 = 800 公斤）；公斤換公噸除以1000（如 4500 公斤 = 4.5 公噸）。",
    tts: "重量大單位換算。一公噸等於一千公斤。大單位換小單位用乘法乘以一千，小單位換大單位用除法除以一千。"
  },
  table: {
    src: "assets/table.png",
    caption: "單位化聚總表：平方公里、公頃、公畝、平方公尺相鄰進率皆為100；公噸與公斤進率為1000；公里與公尺進率為1000。",
    tts: "單位化聚總表。面積的平方公里、公頃、公畝、平方公尺相鄰換算都是一百倍。而重量的公噸與公斤、長度的公里與公尺都是一千倍的關係。"
  }
};

function switchInfographic(type) {
  // 切換 active 按鈕樣式
  document.querySelectorAll('.infographic-tab-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  const activeBtn = document.getElementById(`tab-${type}`);
  if (activeBtn) activeBtn.classList.add('active');
  
  // 更新圖形內容與朗讀
  const info = infographics[type];
  if (info) {
    infographicImg.src = info.src;
    infographicImg.alt = `${type}圖表`;
    infographicCaption.textContent = info.caption;
    
    // 重設放大
    infographicZoom = false;
    infographicImg.style.transform = 'scale(1)';
    
    speakText(info.tts);
  }
}

function zoomInfographic() {
  infographicZoom = !infographicZoom;
  infographicImg.style.transform = infographicZoom ? 'scale(1.5)' : 'scale(1)';
  speakText(infographicZoom ? "圖表已放大，您可以更清晰地查看數字規律。" : "圖表已縮小還原。");
}

let tableInfographicZoom = false;
function zoomTableInfographic() {
  const tableImg = document.getElementById('tableInfographicImg');
  if (!tableImg) return;
  tableInfographicZoom = !tableInfographicZoom;
  tableImg.style.transform = tableInfographicZoom ? 'scale(1.5)' : 'scale(1)';
  speakText(tableInfographicZoom ? "圖表已放大，您可以更清晰地查看兩大家族的進率關係。" : "圖表已縮小還原。");
}



// --- 隨堂測驗資料庫 (25題，每單元5題) ---
const quizQuestionsDb = {
  6: [
    {
      question: "直式計算：65 ÷ 4 等於多少？",
      options: ["16.25", "16.5", "16.75", "1.625"],
      correct: 0,
      hint: "在個位除完餘1之後，點上小數點補0繼續除。10除以4得2餘2，再補0，20除以4得5。"
    },
    {
      question: "直式計算：0.14 ÷ 7 等於多少？",
      options: ["0.2", "0.02", "0.002", "2"],
      correct: 1,
      hint: "小數點要對齊。0個位不夠記0，十分位1也不夠除以7記0，百分位14除以7記2。"
    },
    {
      question: "分數換小數：八分之三 (3/8) 等於多少？",
      options: ["0.375", "0.125", "0.625", "0.75"],
      correct: 0,
      hint: "八分之一是0.125，八分之三就是三個0.125相加，或是用3除以8計算。"
    },
    {
      question: "小數換分數：小數 2.7 用分數表示是多少？",
      options: ["2又7/100", "27/100", "2又7/10", "7/10"],
      correct: 2,
      hint: "小數點後有一位，代表分母是10。整數2不變，分數部分是十分之七。"
    },
    {
      question: "四捨五入求商：1.3 ÷ 3 用四捨五入法求商到小數點後第二位是多少？",
      options: ["0.43", "0.44", "0.433", "0.4"],
      correct: 0,
      hint: "算到小數點後第三位是0.433。第三位是3比5小，四捨五入捨去，得到0.43。"
    }
  ],
  7: [
    {
      question: "正方體的每個面面積是 25 平方公分，表面積是幾平方公分？",
      options: ["125 平方公分", "150 平方公分", "250 平方公分", "30 平方公分"],
      correct: 1,
      hint: "正方體總共有 6 個全等的面。所以是一面的面積 25 乘以 6。"
    },
    {
      question: "長方體的長 6cm、寬 5cm、高 3cm，表面積是幾平方公分？",
      options: ["90 平方公分", "63 平方公分", "150 平方公分", "126 平方公分"],
      correct: 3,
      hint: "長方體表面積公式：(長×寬 + 寬×高 + 長×高) × 2。試著列式：(6×5 + 5×3 + 6×3) × 2。"
    },
    {
      question: "一個正方體的表面積是 54 平方公尺，它一個面的面積是幾平方公尺？",
      options: ["9 平方公尺", "6 平方公尺", "27 平方公尺", "3 平方公尺"],
      correct: 0,
      hint: "正方體有6個面，六個面的總面積是54，那求一個面要用54除以幾？"
    },
    {
      question: "承上題，該正方體的邊長是幾公尺？",
      options: ["3 公尺", "9 公尺", "2 公尺", "4 公尺"],
      correct: 0,
      hint: "已知一個面的面積是9平方公尺。正方形面積是邊長乘以邊長，哪一個相同的數相乘等於9？"
    },
    {
      question: "將長方體木塊從中間鋸一刀，分成兩塊相同的長方體，鋸開後的表面積總和與原來相比會如何？",
      options: ["減少 2 個側面面積", "增加 2 個側面面積", "表面積保持不變", "增加 4 個側面面積"],
      correct: 1,
      hint: "鋸開後，兩塊木塊各自多出了一個切面，所以表面積總共會增加2個側面面積。"
    }
  ],
  8: [
    {
      question: "全班有 25 人，今天有 20 人到校，今天的出席率是多少？",
      options: ["20%", "5%", "80%", "85%"],
      correct: 2,
      hint: "出席率是指出席人數除以全班人數：20除以25等於0.8，小數點右移兩位是百分之多少？"
    },
    {
      question: "續上題，該班今天的缺席率是多少？",
      options: ["20%", "5%", "15%", "25%"],
      correct: 0,
      hint: "全班出席率與缺席率的和一定是 100%。100% 減去出席率 80% 就是缺席率。"
    },
    {
      question: "百分率換小數：78% 用小數表示是多少？",
      options: ["7.8", "0.78", "0.078", "78"],
      correct: 1,
      hint: "百分率換小數，小數點向左邊平移兩位，前方補上零點。"
    },
    {
      question: "折扣問題：妮妮買一包定價 40 元的餅乾，抽到打「六折」，打完折後要付幾元？",
      options: ["24 元", "30 元", "36 元", "16 元"],
      correct: 0,
      hint: "打六折代表付定價的 60% (也就是 0.6)。列式計算：40 乘以 0.6。"
    },
    {
      question: "服飾店促銷標示「30% off」，代表要付原本定價的百分之幾？",
      options: ["30%", "60%", "130%", "70%"],
      correct: 3,
      hint: "30% off 代表從原本的 100% 裡面減去 30% 不用付，也就是只要付剩餘的百分之幾？"
    }
  ],
  9: [
    {
      question: "時間高階換算：0.25 分鐘也可以說是跑了多少秒鐘？",
      options: ["25 秒鐘", "15 秒鐘", "40 秒鐘", "30 秒鐘"],
      correct: 1,
      hint: "一分鐘是60秒。零點二五分鐘就是 60 秒的 0.25 倍。列式：60 乘以 0.25。"
    },
    {
      question: "時間乘法：姐姐裝飾一片餅乾平均需要 80 秒，裝飾 5 片共要花幾分幾秒？",
      options: ["6 分鐘 40 秒鐘", "5 分鐘 80 秒鐘", "4 分鐘", "6 分鐘"],
      correct: 0,
      hint: "先算總秒數：80 乘以 5 等於 400 秒。因為一分鐘是60秒，400除以60得6餘40。"
    },
    {
      question: "時間乘法進位：烤箱烤一盤蛋糕要 1 小時 35 分，烤 2 盤共花了幾小時幾分鐘？",
      options: ["2 小時 70 分鐘", "3 小時 10 分鐘", "3 小時", "2 小時 35 分鐘"],
      correct: 1,
      hint: "分開乘得到2小時70分鐘。70分鐘裡有60分鐘，可以進位成1小時。所以2小時加1小時，餘10分。"
    },
    {
      question: "時間除法退位：製作 5 個沙包花 6 分 35 秒，平均製作一個沙包花幾分幾秒？",
      options: ["1 分鐘 35 秒鐘", "12 分鐘", "1 分鐘 19 秒鐘", "1 分鐘 7 秒鐘"],
      correct: 2,
      hint: "6分除以5得1分餘1分。餘下的1分換成60秒，加上35秒等於95秒。95秒除以5等於19秒。"
    },
    {
      question: "時間換小數：充電要 2 小時 30 分鐘，用小數表示是多少小時？",
      options: ["2.3 小時", "2.5 小時", "2.25 小時", "3 小時"],
      correct: 1,
      hint: "30分鐘是半小時，也就是 30/60 = 0.5 小時。所以 2 小時加上 0.5 小時等於多少？"
    }
  ],
  10: [
    {
      question: "重量換算：電梯限載重 0.8 公噸，相當於限制多少公斤？",
      options: ["80 公斤", "8000 公斤", "800 公斤", "0.8 公斤"],
      correct: 2,
      hint: "一公噸等於一千公斤。零點八公噸就是 0.8 乘以 1000 公斤。"
    },
    {
      question: "面積換算：邊長 100 公尺的正方形面積是 1 公頃，那是多少平方公尺？",
      options: ["100 平方公尺", "1000 平方公尺", "10000 平方公尺", "100000 平方公尺"],
      correct: 2,
      hint: "正方形面積是邊長乘以邊長。邊長100公尺，所以面積是 100 乘以 100 平方公尺。"
    },
    {
      question: "大單位比較：1 平方公里 (km²) 等於多少公頃 (ha)？",
      options: ["10 公頃", "100 公頃", "1000 公頃", "10000 公頃"],
      correct: 1,
      hint: "一平方公里等於一百萬平方公尺，而一公頃是一萬平方公尺。一百萬除以一萬等於多少？"
    },
    {
      question: "單位選擇：一輛大型公車的重量大約是 16 什麼單位？",
      options: ["公克", "公斤", "公頃", "公噸"],
      correct: 3,
      hint: "公車體積龐大，重量極重，一輛大約有一萬六千公斤，所以用公噸表示最適當。"
    },
    {
      question: "大單位計算：4 公噸 790 公斤 + 8.62 公噸 等於幾公噸？",
      options: ["13.41 公噸", "12.41 公噸", "13.01 公噸", "13.41 公斤"],
      correct: 0,
      hint: "先將4公噸790公斤化為 4.79 公噸。然後計算 4.79 + 8.62 等於多少？"
    }
  ]
};

// 追蹤各個單元的測驗狀態
const quizState = {
  6: { currentQuestionIndex: 0, score: 0 },
  7: { currentQuestionIndex: 0, score: 0 },
  8: { currentQuestionIndex: 0, score: 0 },
  9: { currentQuestionIndex: 0, score: 0 },
  10: { currentQuestionIndex: 0, score: 0 }
};

// 載入指定單元的測驗題目
function loadQuizForUnit(unit) {
  const state = quizState[unit];
  const qList = quizQuestionsDb[unit];
  
  const qQuestionEl = document.getElementById(`quizQuestion-${unit}`);
  const qOptionsEl = document.getElementById(`quizOptions-${unit}`);
  const qProgressEl = document.getElementById(`quizProgress-${unit}`);
  const qScoreEl = document.getElementById(`quizScore-${unit}`);
  const qStarsEl = document.getElementById(`quizStars-${unit}`);
  const qFeedbackEl = document.getElementById(`quizFeedback-${unit}`);
  const qReadBtn = document.getElementById(`btnQuizRead-${unit}`);
  
  // 更新分數看板
  qScoreEl.textContent = state.score;
  
  // 更新星星
  qStarsEl.innerHTML = '';
  for (let i = 0; i < state.score; i++) {
    const star = document.createElement('i');
    star.className = 'fa-solid fa-star';
    qStarsEl.appendChild(star);
  }

  // 判斷是否答完了 5 題
  if (state.currentQuestionIndex >= 5) {
    qProgressEl.textContent = "測驗已完成！";
    qQuestionEl.innerHTML = `<div style="text-align: center; color: var(--secondary); font-size: 1.6rem;"><i class="fa-solid fa-circle-check"></i> 恭喜過關！本單元隨堂挑戰完成！</div>`;
    
    // 生成進入下一個單元的大按鈕
    qOptionsEl.innerHTML = `
      <button class="btn-toggle" onclick="goToSlide(${currentSlideIndex + 1})" style="grid-column: span 2; margin: 1rem auto; padding: 1.25rem 2rem; font-size: 1.4rem; background: var(--secondary); color: white; border: none;">
        <i class="fa-solid fa-circle-arrow-right"></i> 解鎖成功！進入下一單元複習
      </button>
    `;
    qFeedbackEl.textContent = `太棒了！答對題數： ${state.score} / 5 題。`;
    qFeedbackEl.style.color = "var(--secondary)";
    
    // 答完後恢復底部 Next 按鈕的顯示
    btnNext.style.visibility = 'visible';
    
    qReadBtn.onclick = () => speakText(`恭喜你完成單元 ${unit} 的隨堂測驗！你答對了 ${state.score} 題。請點選解鎖按鈕，進入下一個單元複習！`);
    return;
  }

  // 載入當前題目
  const q = qList[state.currentQuestionIndex];
  qProgressEl.textContent = `第 ${state.currentQuestionIndex + 1} / 5 題`;
  qQuestionEl.textContent = q.question;
  qFeedbackEl.textContent = "加油！你可以做到的！";
  qFeedbackEl.style.color = "var(--text-muted)";
  
  qOptionsEl.innerHTML = '';
  q.options.forEach((opt, idx) => {
    const btn = document.createElement('button');
    btn.className = 'quiz-opt';
    btn.textContent = opt;
    btn.addEventListener('click', () => handleUnitQuizAnswer(unit, idx));
    qOptionsEl.appendChild(btn);
  });

  // 朗讀按鈕綁定
  qReadBtn.onclick = () => speakText(`第 ${state.currentQuestionIndex + 1} 題。 ${q.question}。選項有。 一：${q.options[0]}。 二：${q.options[1]}。 三：${q.options[2]}。 四：${q.options[3]}。`);
}

// 處理答題
function handleUnitQuizAnswer(unit, selectedIdx) {
  const state = quizState[unit];
  const qList = quizQuestionsDb[unit];
  const q = qList[state.currentQuestionIndex];
  
  const qOptionsEl = document.getElementById(`quizOptions-${unit}`);
  const qFeedbackEl = document.getElementById(`quizFeedback-${unit}`);
  const opts = qOptionsEl.querySelectorAll('.quiz-opt');
  
  // 禁用所有選項按鈕
  opts.forEach(btn => btn.disabled = true);
  
  if (selectedIdx === q.correct) {
    opts[selectedIdx].classList.add('correct');
    state.score++;
    
    qFeedbackEl.textContent = "哇！你答對了！太厲害了！";
    qFeedbackEl.style.color = "var(--secondary)";
    
    celebrateConfetti();
    speakText("答對了！你太優秀了！");
  } else {
    opts[selectedIdx].classList.add('wrong');
    opts[q.correct].classList.add('correct'); // 標示正確答案
    
    qFeedbackEl.textContent = `不氣餒，正確答案是【${q.options[q.correct]}】。提示：${q.hint}`;
    qFeedbackEl.style.color = "var(--accent)";
    
    speakText(`沒關係，我們再接再厲！正確答案是${q.options[q.correct]}。${q.hint}`);
  }
  
  // 4.5秒後進入下一題，給學障生足夠時間閱讀提示與聽語音
  setTimeout(() => {
    state.currentQuestionIndex++;
    loadQuizForUnit(unit);
    if (isTtsEnabled) autoSpeakSlide();
  }, 4500);
}


// --- 煙火慶祝特效 (Confetti) ---
function celebrateConfetti() {
  const duration = 2 * 1000;
  const end = Date.now() + duration;

  (function frame() {
    confetti({
      particleCount: 3,
      angle: 60,
      spread: 55,
      origin: { x: 0 }
    });
    confetti({
      particleCount: 3,
      angle: 120,
      spread: 55,
      origin: { x: 1 }
    });

    if (Date.now() < end) {
      requestAnimationFrame(frame);
    }
  }());
}


// --- 頁面加載初始化 ---
window.addEventListener('DOMContentLoaded', () => {
  initSlideshow();
  generateGrid100();
  generateSymmetryGrid();
  
  // 預設朗讀第一頁內容
  setTimeout(() => {
    if (isTtsEnabled) autoSpeakSlide();
  }, 1000);
});

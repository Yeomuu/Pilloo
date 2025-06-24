const bg = document.querySelector('#background');
const credit = document.querySelector('#holder');

// 초기 배경 랜덤 설정
document.addEventListener('DOMContentLoaded', () => {
    const bgIndex = Math.floor(Math.random() * bgAssets.length);
    const bgImg = bgAssets[bgIndex];
    
    bg.style.backgroundImage = `url(${bgImg.file})`;

    // 랜덤 배경 저작권자
    credit.innerText = bgImg.author;
    credit.setAttribute('href', bgImg.url);
});

// 이미지 페럴랙스 효과
document.addEventListener('mousemove', (e) => {
    const x = (e.clientX / window.innerWidth - 0.5) * 5;
    const y = (e.clientY / window.innerHeight - 0.5) * 5;   
    bg.style.transform = `translate(${x}px, ${y}px)`;
});

// 시계 현재 시간 연동
const clock = document.querySelector('#clock');

function updateClock() {
  const nowTime = new Date();

  const hours = String(nowTime.getHours()).padStart(2, '0');
  const minutes = String(nowTime.getMinutes()).padStart(2, '0');

  clock.textContent = `${hours} : ${minutes}`;
}

updateClock();

// 지금부터 다음 분까지 남은 시간
const now = new Date();
const delayToNextMinute = (60 - now.getSeconds()) * 1000;

// 첫 타이밍 맞추고 나서 정확히 1분 간격으로 갱신
setTimeout(() => {
  updateClock();
  setInterval(updateClock, 60 * 1000); // 1분마다
}, delayToNextMinute);

// 타이머 설정
let timer;
let remainingTime = 0; // 남은 시간 (초)
let selectedType = 'pomodoro'; // 기본 선택
let isRunning = false;

// 시간 설정
const timePresets = {
  pomodoro: 25 * 60,
  shortB: 5 * 60,
  longB: 15 * 60
};

// 요소 선택
const timerBox = document.querySelector('#timer');
const display = document.getElementById('timer-time');
const startBtn = document.getElementById('start');
const stopBtn = document.getElementById('stop');
const resetBtn = document.querySelector('.bottom-btn button img').parentElement;
const timerButtons = document.querySelectorAll('.time-set');
const timeBtn = document.querySelectorAll('.timeBtn');

// 시간 포맷
function formatTime(seconds) {
  const m = String(Math.floor(seconds / 60)).padStart(2, '0');
  const s = String(seconds % 60).padStart(2, '0');
  return `${m} : ${s}`;
}

// 타이머 화면 갱신
function updateDisplay() {
  display.textContent = formatTime(remainingTime);
}

// active 클래스 갱신
function updateActiveButton(selectedId) {
  timerButtons.forEach(btn => {
      btn.classList.toggle('active', btn.id === selectedId);
  });
}

function updateControlButtonActive(selectedId) {
  timeBtn.forEach(btn => {
    btn.classList.toggle('active', btn.id === selectedId);
  });
}

// 타이머 시작
function startTimer() {
  if (isRunning || remainingTime <= 0) return;

  isRunning = true;
  const startTime = new Date();
  saveToLocalStorage('start', startTime);

  updateControlButtonActive('start');

  timer = setInterval(() => {
    remainingTime--;
    updateDisplay();

    if (remainingTime <= 0) {
      clearInterval(timer);
      isRunning = false;
      const endTime = new Date();
      saveToLocalStorage('end', endTime);
    }
  }, 1000);
}

// 타이머 멈춤
function stopTimer() {
  if (!isRunning) return;
  clearInterval(timer);
  isRunning = false;

  const stopTime = new Date();
  saveToLocalStorage('stop', stopTime);
  updateControlButtonActive('stop');
}

// 타이머 리셋
function resetTimer() {
  clearInterval(timer);
  isRunning = false;
  remainingTime = timePresets[selectedType] || 0;
  updateDisplay();
  updateControlButtonActive();
}

// 타이머 유형 선택 버튼
timerButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    if (isRunning) stopTimer();

    // ① 떠나기 전에 현재 남은 시간 저장
    localStorage.setItem(
      `remaining-${selectedType}`,
      remainingTime
    );

    // ② 모드 전환
    selectedType = btn.id;

    // ③ 돌아왔을 때 저장된 남은 시간 있으면 불러오고, 없으면 preset
    const saved = localStorage.getItem(`remaining-${selectedType}`);
    remainingTime = saved !== null
      ? parseInt(saved, 10)
      : timePresets[selectedType];

    updateDisplay();
    updateActiveButton(selectedType);
  });
});

window.addEventListener('beforeunload', function(e) {
    if (isRunning) {
        // confirm 창 띄우기
        const ok = confirm();

        if (!ok) {
            // 취소: 언로드(리로드) 중단
            e.preventDefault();
            e.returnValue = '';
        } else {
            // 확인: 세션 종료 로그 남기고 리로드 허용
            saveLog('end', new Date());
        }
    }
});

window.addEventListener('unload', () => {
  if (isRunning) {
    stopTimer();
  }
  
  Object.keys(localStorage).forEach(key => {
        if (key.startsWith('remaining-')) {
            localStorage.removeItem(key);
        }
    });
});

// 버튼 이벤트 등록
startBtn.addEventListener('click', startTimer);
stopBtn.addEventListener('click', stopTimer);
resetBtn.addEventListener('click', resetTimer);

// 로컬스토리지 저장
function saveToLocalStorage(action, time) {
    const keyName = `lastTimerKey-${selectedType}`;
    let logKey = localStorage.getItem(keyName);
    if (!logKey) {
        logKey = `timer-log-${selectedType}-${Date.now()}`;
        localStorage.setItem(keyName, logKey);
    }

    let log = {};
    try { log = JSON.parse(localStorage.getItem(logKey)) || {}; }
    catch {}

    log.type = selectedType;
    const t = time.toISOString();
    if (action === 'start' || action === 'stop') {
        log[action] = log[action] || [];
        log[action].push(t);
    } else { // end
        log[action] = t;
    }

    localStorage.setItem(logKey, JSON.stringify(log));
}

// 페이지 진입 시 기본 상태 설정
remainingTime = timePresets[selectedType];
updateDisplay();
updateActiveButton(selectedType);

// 화면모드 토글(블랙 <-> 화이트)
const modeToggle = document.querySelector('#theme-toggle');
const body = document.body;
const toggleImg = document.querySelector('#theme-toggle img');

// 로컬스토리지 저장 값 사용
const savedTheme = localStorage.getItem('theme');
if (savedTheme === 'light') {
    body.classList.add('light-mode');
    toggleImg.setAttribute('src', 'images/white_sun.svg');
} else {
    body.classList.remove('light-mode');
    toggleImg.setAttribute('src', 'images/white_moon.svg');
}

// 토글 클릭 시 모드 전환
modeToggle.addEventListener('click', () => {
    body.classList.toggle('light-mode');

    const isLightMode = body.classList.contains('light-mode');

    // 이미지 변경
    toggleImg.setAttribute('src', isLightMode ? 'images/white_sun.svg' : 'images/white_moon.svg');

    // 상태 저장
    localStorage.setItem('theme', isLightMode ? 'light' : 'dark');

    const currentTimeMode = localStorage.getItem('time-mode') || 'clock';
    applyTimeMode(currentTimeMode);
});

// 화면 시계 <-> 타이머 토글
const timeClock = document.querySelector('.home>svg>path');
const timeTimer = document.querySelectorAll('.timer-icon>svg>path');
const clockBtn = document.querySelector('.home');
const timerBtn = document.querySelector('.timer-icon');
const timeToggle = document.querySelector('.toggle-bg');

// 로컬스토리지 저장 값 사용
const savedMode = localStorage.getItem('time-mode');

// 토글 변경값 함수
function applyTimeMode(mode) {
  if (mode === 'timer') {
    timeToggle.style.left = 'calc(100% - 50px)';
    clock.style.display = 'none';
    timerBox.style.display = 'flex';

    if (body.classList.contains('light-mode')) {
      timeTimer.forEach(path => path.style.fill = '#fff');
      timeClock.style.fill = '';
    }
  } else {
    timeToggle.style.left = '';
    clock.style.display = 'inline-block';
    timerBox.style.display = 'none';

    if (body.classList.contains('light-mode')) {
      timeClock.style.fill = '#fff';
      timeTimer.forEach(path => path.style.fill = '');
    }
  }
}

//로컬 스토리지 값없을 때는 시계가 기본
applyTimeMode(savedMode || 'clock');

// 토글 변경 및 상태 로컬스토리지 저장
timerBtn.addEventListener('click', () => {
  localStorage.setItem('time-mode', 'timer');
  applyTimeMode('timer');
});

clockBtn.addEventListener('click', () => {
  localStorage.setItem('time-mode', 'clock');
  applyTimeMode('clock');
});

// 왼쪽 사이드메뉴 이벤트
const mainpage = document.querySelector('main');

// 사이드메뉴
const CheckList = document.querySelector('#checkList-aside');
const dDay = document.querySelector('#D-DAY-aside');
const stats = document.querySelector('#stats-aside');
const Mypage = document.querySelector('#Mypage_aside');

// 사이드메뉴 아이콘
const checkListIcon = document.querySelector('#checkList');
const dDayIcon = document.querySelector('#D-DAY');
const chartIcon = document.querySelector('#chart');
const mypageIcon = document.querySelector('#mypage');

function togglePanel(panel) {
    if(!islogin&&panel!==Mypage){alert('로그인이 필요한 기능입니다.')};
    if (!islogin) return;
    const isOpen = panel.style.transform === 'translateX(0px)';

    [CheckList, dDay, stats, Mypage].forEach(p => {
        if (p) p.style.transform = '';
    });

    mainpage.style.transform = '';

    if (!isOpen && panel !== stats) {
        panel.style.transform    = 'translateX(0px)';
        mainpage.style.transform = 'translateX(450px)';
    }

    if (!isOpen && panel === stats) {
        panel.style.transform    = 'translateX(0px)';
        mainpage.style.transform = 'translateX(652px)';
    }
}

checkListIcon.addEventListener('click', () => togglePanel(CheckList));
dDayIcon.addEventListener('click', () => togglePanel(dDay));
chartIcon.addEventListener('click', () => togglePanel(stats));
mypageIcon.addEventListener('click', () => togglePanel(Mypage));

mainpage.addEventListener('click', () => {
        CheckList.style.transform = '';
        dDay.style.transform = '';
        stats.style.transform = '';
        Mypage.style.transform = '';
        mainpage.style.transform = '';
});

// 플레이리스트 열고 닫기
const playlistIcon = document.querySelector('#playlist-icon');
const playlistBox = document.querySelector('#playlistBox');
const player = document.querySelector('#player');

playlistBox.addEventListener('click', e => {
  e.stopPropagation();
});

playlistIcon.addEventListener('click', ()=> {
  playlistBox.style.display = playlistBox.style.display === 'flex' ? 'none' : 'flex';
});

player.addEventListener('click', e => {
    e.stopPropagation();
});

document.addEventListener('click', () => {
    if (playlistBox.style.display === 'flex') {
        playlistBox.style.display = 'none';
    }
});

checkListIcon.addEventListener('click', (e) => e.stopPropagation());
dDayIcon.addEventListener('click', (e) => e.stopPropagation());
chartIcon.addEventListener('click', (e) => e.stopPropagation());
mypageIcon.addEventListener('click', (e) => e.stopPropagation());

// 기본 랜덤 이미지 셋
const bgAssets = [
  {
    file: 'images/bg1.jpg',
    thumb: 'images/bg1-thumb.jpg',
    author: 'Travis Yewell',
    url: 'https://unsplash.com/ko/@shutters_guild'
  },
  {
    file: 'images/bg2.jpg',
    thumb: 'images/bg2-thumb.jpg',
    author: 'Cody Hiscox',
    url: 'https://unsplash.com/ko/@codyhiscox'
  },
  {
    file: 'images/bg3.jpg',
    thumb: 'images/bg3-thumb.jpg',
    author: 'Stephan Boehme',
    url: 'https://unsplash.com/ko/@shnipestar'
  },
  {
    file: 'images/bg4.jpg',
    thumb: 'images/bg4-thumb.jpg',
    author: 'Bernard Hermant',
    url: 'https://unsplash.com/ko/@bernardhermant'
  },
  {
    file: 'images/bg5.jpg',
    thumb: 'images/bg5-thumb.jpg',
    author: 'iccup',
    url: 'https://unsplash.com/ko/@iccup'
  },
  {
    file: 'images/bg6.jpg',
    thumb: 'images/bg6-thumb.jpg',
    author: 'Adam Neumann',
    url: 'https://unsplash.com/ko/@adamneumann'
  },
  {
    file: 'images/bg7.jpg',
    thumb: 'images/bg7-thumb.jpg',
    author: 'Tobias Arweiler',
    url: 'https://unsplash.com/ko/@tarweiler'
  },
  {
    file: 'images/bg8.jpg',
    thumb: 'images/bg8-thumb.jpg',
    author: 'Patrick Ryan',
    url: 'https://unsplash.com/ko/@patrickryan0117'
  },
  {
    file: 'images/bg9.jpg',
    thumb: 'images/bg9-thumb.jpg',
    author: 'elizabeth lies',
    url: 'https://unsplash.com/ko/@elizabethlies'
  },
  {
    file: 'images/bg10.jpg',
    thumb: 'images/bg10-thumb.jpg',
    author: 'Cristina Gottardi',
    url: 'https://unsplash.com/ko/@cristina_gottardi'
  },
  {
    file: 'images/bg11.jpg',
    thumb: 'images/bg11-thumb.jpg',
    author: 'Soliman Cifuentes',
    url: 'https://unsplash.com/ko/@aleexcif'
  },
  {
    file: 'images/bg12.jpg',
    thumb: 'images/bg12-thumb.jpg',
    author: 'Edgar Torabyan',
    url: 'https://unsplash.com/ko/@edgar_t'
  },
  {
    file: 'images/bg13.jpg',
    thumb: 'images/bg13-thumb.jpg',
    author: 'Mink Mingle',
    url: 'https://unsplash.com/ko/@minkmingle'
  },
  {
    file: 'images/bg14.jpg',
    thumb: 'images/bg14-thumb.jpg',
    author: 'Mohammad Alizade',
    url: 'https://unsplash.com/ko/@mohamadaz'
  },
  {
    file: 'images/bg15.jpg',
    thumb: 'images/bg15-thumb.jpg',
    author: 'Shifaaz shamoon',
    url: 'https://unsplash.com/ko/@sotti'
  }
];

localStorage.setItem('basic_background_images', JSON.stringify(bgAssets));
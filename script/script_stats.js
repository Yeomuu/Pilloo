const dBtn    = document.getElementById('dBtn');
const mBtn    = document.getElementById('mBtn');
const statsD  = document.getElementById('statsD');
const statsM  = document.getElementById('statsM');

function toggleStats(tab) {
    if (tab === 'daily') {
        dBtn.classList.add('nowStats');
        mBtn.classList.remove('nowStats');
        statsD.style.display = 'block';
        statsM.style.display = 'none';
    } else {
        dBtn.classList.remove('nowStats');
        mBtn.classList.add('nowStats');
        statsD.style.display = 'none';
        statsM.style.display = 'block';
    }
}

dBtn.addEventListener('click', function() {
    toggleStats('daily');
});

mBtn.addEventListener('click', function() {
    toggleStats('monthly');
});

// 오늘 통계 표시 대상
const focusEl    = document.querySelector('.focusTimeValue');
const todoEl     = document.querySelector('.todoValue');
const pomoEl     = document.querySelector('.pomodoroValue');
const breakEl    = document.querySelector('.breakValue');

// — 오늘 날짜 문자열, 'YYYY-MM-DD' 포맷으로
function getTodayISO() {
    const d = new Date();
    return d.toISOString().slice(0,10);
}

// 로그 내 타임스탬프가 “오늘”인지 체크
function isToday(ts) {
    if (!ts) return false;
    return ts.slice(0,10) === getTodayISO();
}

// 체크리스트 완료 개수
function countCompletedTodos() {
    return document.querySelectorAll('.todo-checkbox:checked').length;
}

// — 오늘 로그만 모아서 통계 계산
function loadTimerStatsToday() {
    let focusTime = 0;
    let breakTime = 0;
    let pomoCount = 0;

    Object.keys(localStorage).forEach(key => {
        if (!key.startsWith('timer-log-')) return;
        let log;
        try { log = JSON.parse(localStorage.getItem(key)); }
        catch { return; }

        // 오늘 것만 필터
        const starts = (Array.isArray(log.start)?log.start:[log.start]||[])
                        .filter(ts => ts && ts.startsWith(getTodayISO()));
        const stops  = (Array.isArray(log.stop)? log.stop : [log.stop]||[])
                        .filter(ts => ts && ts.startsWith(getTodayISO()));
        const ends   = (Array.isArray(log.end)?  log.end  : [log.end] || [])
                        .filter(ts => ts && ts.startsWith(getTodayISO()));

        // Pomodoro 통계
        if (log.type === 'pomodoro') {
            // 1) 완료 횟수: 오직 natural end 만
            pomoCount += ends.length;

            // 2) 시간 합산: stop + end 모두 “종료”로 간주
            const terms = stops.concat(ends)
                               .map(ts => new Date(ts))
                               .sort((a,b) => a - b)
                               .map(d => d.toISOString());

            // 완료된 구간
            for (let i = 0; i < terms.length && i < starts.length; i++) {
                focusTime += Math.ceil(
                  (new Date(terms[i]) - new Date(starts[i])) / 1000
                );
            }
            // 진행중인 마지막 구간
            if (starts.length > terms.length && isRunning) {
                const last   = new Date(starts[starts.length-1]).getTime();
                focusTime += Math.floor((Date.now() - last)/1000);
            }
        }

        // Break 통계 (기존 로직 유지)
        if (log.type === 'shortB' || log.type === 'longB') {
            for (let i = 0; i < stops.length && i < starts.length; i++) {
                breakTime += Math.ceil(
                  (new Date(stops[i]) - new Date(starts[i])) / 1000
                );
            }

            if (starts.length > stops.length && isRunning) {
                const last = new Date(starts[starts.length-1]).getTime();
                breakTime += Math.floor((Date.now() - last) / 1000);
            }
        }
    });

    return { focusTime, breakTime, pomoCount };
}

// 초 → 포맷
function fmtTime(sec) {
    if (sec < 3600) {
        const m = Math.floor(sec/60), s = sec%60;
        return `${m}m ${s}s`;
    } else {
        const h = Math.floor(sec/3600),
                m = Math.floor((sec%3600)/60);
        return `${h}h ${m}m`;
    }
}

// 오늘 통계 렌더링
function renderTodayStats() {
    todoEl.textContent   = countCompletedTodos();
    const st = loadTimerStatsToday();
    focusEl.textContent  = fmtTime(st.focusTime);
    pomoEl.textContent   = st.pomoCount;
    breakEl.textContent  = fmtTime(st.breakTime);
}

// — 자정에 한 번만 재실행 스케줄링
(function scheduleMidnightRefresh() {
    const now   = new Date();
    const then  = new Date(now);
    then.setHours(24,0,0,0);
    const ms    = then - now;
    setTimeout(function() {
        renderTodayStats();
        // 다음 날도 계속 갱신되도록 재귀 호출
        scheduleMidnightRefresh();
    }, ms);
})();

// 최근 집중 그래프

// 시간대 구하기
function getLocalISODate(dateObj) {
  const tzOffset = dateObj.getTimezoneOffset() * 60000;
  return new Date(dateObj - tzOffset).toISOString().slice(0,10);
}

function renderFocusChart() {
    const chartBars = document.getElementById('chartBars');
    // 6일(오늘 포함) 날짜 배열
    const dates = [];
    for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        dates.push(d);
    }

    // 날짜별 집중 시간(초) 계산
    const focusData = dates.map(date => {
        const isoDay = getLocalISODate(date);
        let totalSec = 0;
        Object.keys(localStorage).forEach(key => {
            if (!key.startsWith('timer-log-')) return;
            let log;
            try { log = JSON.parse(localStorage.getItem(key)); }
            catch { return; }
            if (log.type !== 'pomodoro') return;

            const starts = (Array.isArray(log.start)?log.start:[log.start]||[])
                .filter(ts => ts && ts.slice(0,10) === isoDay);
            const stops  = (Array.isArray(log.stop)? log.stop : [log.stop]||[])
                .filter(ts => ts && ts.slice(0,10) === isoDay);
            const ends   = (Array.isArray(log.end)?  log.end  : [log.end]||[])
                .filter(ts => ts && ts.slice(0,10) === isoDay);

            // validStops: stop 타임스탬프 정렬 및 start 개수 맞추기
            const validStops = stops
                .map(ts => new Date(ts))
                .sort((a,b)=>a-b)
                .map(d=>d.toISOString())
                .slice(0, starts.length);

            // 종료 시점 리스트
            const terms = validStops.concat(ends)
                .map(ts=>new Date(ts))
                .sort((a,b)=>a-b);

            // 완료된 구간 합산
            for (let i=0; i<terms.length && i<starts.length; i++) {
                totalSec += Math.ceil(
                    (terms[i].getTime() - new Date(starts[i]).getTime())/1000
                );
            }
            // 진행중인 마지막 세션
            if (starts.length > terms.length && isRunning) {
                const lastStart = new Date(starts[starts.length-1]).getTime();
                totalSec += Math.floor((Date.now() - lastStart)/1000);
            }
        });
        return { date, sec: totalSec };
    });

    // 최대값 계산
    const maxSec = Math.max(...focusData.map(d=>d.sec), 1);
    chartBars.innerHTML = '';  // 기존 바 전부 제거

    focusData.forEach(({ date, sec }) => {
        if (sec === 0) return;  // 0초인 날은 건너뜀
        // 시간 문자열
        let timeStr;
        if (sec >= 3600) {
            const h = Math.floor(sec/3600),
                  m = Math.floor((sec%3600)/60);
            timeStr = `${h}h ${m}m`;
        } else {
            const m = Math.floor(sec/60),
                  s = sec%60;
            timeStr = `${m}m ${s}s`;
        }
        // 날짜 문자열
        const month = date.getMonth()+1,
              day   = date.getDate();
        const dateStr = `${month}월 ${day}일`;
        const pct = Math.round(sec / maxSec * 100);

        // DOM 생성
        const group = document.createElement('div');
        group.className = 'bar-group';
        group.innerHTML =
            `<p class="bar-time">${timeStr}</p>` +
            `<div class="bar" style="height:${pct}%"></div>` +
            `<p class="bar-date">${dateStr}</p>`;
        chartBars.appendChild(group);
    });
}

renderTodayStats();
renderFocusChart();
toggleStats('daily');

setInterval(()=> {
    renderTodayStats();
    renderFocusChart();
}, 60*1000);

//  ——————————————————— 월별 통계  ———————————————————

document.addEventListener('DOMContentLoaded', () => {
  let today = new Date();
  let year  = today.getFullYear();
  let month = today.getMonth(); // 0 = 1월

  const monthNameEl  = document.querySelector('.calendarHeader .month');
  const dayCell      = document.getElementById('dayCell');
  const detail       = document.getElementById('dayDetail');
  const detailHeader = detail.querySelector('h4');
  const detailVals   = detail.querySelectorAll('.detail-item .value');
  const prevBtn      = document.querySelector('.calendarHeader .arrowL');
  const nextBtn      = document.querySelector('.calendarHeader .arrowR');

  // 오늘 통계에서 쓰던 함수 그대로 재사용
  function getStatsForDate(dateObj) {
    const isoDay = getLocalISODate(dateObj);
    let focusSec = 0, breakSec = 0;
    let startsAll = [], stopsAll = [], endsAll = [];

    Object.keys(localStorage).forEach(key => {
      if (!key.startsWith('timer-log-')) return;
      let log;
      try { log = JSON.parse(localStorage.getItem(key)); }
      catch { return; }

      // 해당 날짜에 속한 start/stop/end
      const starts = (Array.isArray(log.start)?log.start:[log.start]||[])
        .filter(ts => ts && ts.slice(0,10) === isoDay);
      const stops  = (Array.isArray(log.stop)? log.stop : [log.stop]||[])
        .filter(ts => ts && ts.slice(0,10) === isoDay);
      const ends   = (Array.isArray(log.end)?  log.end  : [log.end]||[])
        .filter(ts => ts && ts.slice(0,10) === isoDay);

      // Pomodoro 구간만 focusSec에 합산
      if (log.type === 'pomodoro') {
        const validStops = stops
          .map(ts=>new Date(ts)).sort((a,b)=>a-b).map(d=>d.toISOString())
          .slice(0, starts.length);
        const terms = validStops.concat(ends)
          .map(ts=>new Date(ts)).sort((a,b)=>a-b);
        // 완료 구간
        for (let i=0; i<terms.length && i<starts.length; i++) {
          focusSec += Math.ceil((terms[i] - new Date(starts[i]))/1000);
        }
        // 진행 중인 마지막 구간
        if (starts.length > terms.length) {
          focusSec += Math.floor((Date.now() - new Date(starts.slice(-1)[0]))/1000);
        }
        // 기록용
        startsAll = startsAll.concat(starts);
        endsAll   = endsAll.concat(ends, validStops);
      }

      // break 구간만 breakSec에 합산
      if (log.type === 'shortB' || log.type === 'longB') {
        for (let i=0; i<stops.length && i<starts.length; i++) {
          breakSec += Math.ceil((new Date(stops[i]) - new Date(starts[i]))/1000);
        }
        if (starts.length > stops.length) {
          breakSec += Math.floor((Date.now() - new Date(starts.slice(-1)[0]))/1000);
        }
      }
    });

    // 시작 시간: startsAll 중 가장 이른 것, 종료 시간: endsAll 중 가장 늦은 것
    const firstStart = startsAll.length
      ? new Date(Math.min(...startsAll.map(ts=>new Date(ts))))
      : null;
    const lastEnd    = endsAll.length
      ? new Date(Math.max(...endsAll.map(ts=>new Date(ts))))
      : null;

    return { focusSec, breakSec, firstStart, lastEnd };
  }

  // 초를 "Xh Ym" 또는 "Xm Ys"로 포맷
  function fmtTime(sec) {
    if (sec >= 3600) {
      const h = Math.floor(sec/3600),
            m = Math.floor((sec%3600)/60);
      return `${h}h ${m}m`;
    }
    const m = Math.floor(sec/60),
          s = sec%60;
    return `${m}m ${s}s`;
  }

  let selectedDay = null;

  // 달력 그리기
  function renderCalendar() {
    monthNameEl.textContent = `${month + 1}월`;
    dayCell.innerHTML = '';

    const first = new Date(year, month, 1);
    const last = new Date(year, month + 1, 0);
    const offset = first.getDay();

    // 빈칸
    for (let i = 0; i < offset; i++) {
        const blank = document.createElement('div');
        blank.className = 'day-cell blank';
        dayCell.appendChild(blank);
    }

    // 날짜 셀 + study-time 삽입 + 클릭 이벤트
    for (let d = 1; d <= last.getDate(); d++) {
        const cell = document.createElement('div');
        cell.className = 'day-cell';
        cell.textContent = d;

        const dateObj = new Date(year, month, d);
        const stats = getStatsForDate(dateObj);

        // study-time 표시
        if (stats.focusSec > 0) {
            const span = document.createElement('span');
            span.className = 'study-time';
            span.textContent = fmtTime(stats.focusSec);
            cell.appendChild(span);
        }

        // 클릭 이벤트: 날짜 선택 + 상세 표시
        cell.addEventListener('click', () => {
            selectedDay = d;

            // 기존 선택 제거
            dayCell.querySelectorAll('.select').forEach(el => el.classList.remove('select'));
            cell.classList.add('select');

            // 상세 패널 채우기
            detail.style.display = 'block';
            const weekday = ['일', '월', '화', '수', '목', '금', '토'][dateObj.getDay()];
            detailHeader.textContent = `${month + 1}월 ${d}일 (${weekday})`;

            const [focusEl, breakEl, startEl, endEl] = detailVals;
            focusEl.textContent = fmtTime(stats.focusSec);
            breakEl.textContent = fmtTime(stats.breakSec);
            startEl.textContent = stats.firstStart
                ? stats.firstStart.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : '--:--';
            endEl.textContent = stats.lastEnd
                ? stats.lastEnd.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : '--:--';
        });

        dayCell.appendChild(cell);
    }

    // ✅ 선택된 날짜 복원
    if (selectedDay !== null) {
            const selectedIndex = selectedDay + offset - 1;
            const selectedCell = dayCell.querySelectorAll('.day-cell')[selectedIndex];

            if (selectedCell) {
                selectedCell.classList.add('select');

                // 상세 패널 자동 유지
                const dateObj = new Date(year, month, selectedDay);
                const stats = getStatsForDate(dateObj);
                detail.style.display = 'block';
                const weekday = ['일', '월', '화', '수', '목', '금', '토'][dateObj.getDay()];
                detailHeader.textContent = `${month + 1}월 ${selectedDay}일 (${weekday})`;

                const [focusEl, breakEl, startEl, endEl] = detailVals;
                focusEl.textContent = fmtTime(stats.focusSec);
                breakEl.textContent = fmtTime(stats.breakSec);
                startEl.textContent = stats.firstStart
                    ? stats.firstStart.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : '--:--';
                endEl.textContent = stats.lastEnd
                    ? stats.lastEnd.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : '--:--';
            }
        } else {
            detail.style.display = 'none';
        }
    }


    // 초기에는 숨기기
    detail.style.display = 'none';

  // 좌우 화살표
  prevBtn.addEventListener('click', () => {
    month--;
    if (month < 0) { month = 11; year--; }
    renderCalendar();
  });
  nextBtn.addEventListener('click', () => {
    month++;
    if (month > 11) { month = 0; year++; }
    renderCalendar();
  });

  renderCalendar();
  setInterval(() => {
    renderCalendar();
  }, 60000);
});
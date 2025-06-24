const selectDate = document.getElementById('selectDate');
const dateLabel = document.getElementById('dateLabel');
const toggle = document.getElementById('dateToggle');
const weekdays = ['일','월','화','수','목','금','토'];

function formatDate(d) {
    const yy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const wd = weekdays[d.getDay()];
    return `${yy}.${mm}.${dd} (${wd})`;
}

// 초기값 세팅
const today = new Date();
selectDate.value = today.toISOString().split('T')[0];
dateLabel.textContent = formatDate(today);

// 변경 시에도 반영
selectDate.addEventListener('change', () => {
    const d = new Date(selectDate.value);
    if (!isNaN(d)) {
        dateLabel.textContent = formatDate(d);
    }
});

// 드롭다운 버튼 눌럿을 떄도 날짜 나오게
toggle.addEventListener('click', () => {
    if (selectDate.showPicker) {
        selectDate.showPicker();
    } else {
        selectDate.focus();
    }
});

const dayText      = document.getElementById('dayText');
const dayBtn       = document.getElementById('dayBtn');
const dayContainer = document.querySelector('.day');
const DAYS_KEY     = 'dDays';

// 템플릿 클론
const templateItem = dayContainer.querySelector('.day-item').cloneNode(true);

// diffDays와 문자열을 함께 반환
function calcDDayInfo(dateStr) {
    const today  = new Date();
    const target = new Date(dateStr);
    // 소수점 올림
    const diffMs = target - today;
    const diffD  = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    if (diffD >= 0) {
        return { text: `D-${diffD}`, diff: diffD };
    } else {
        return { text: `D+${Math.abs(diffD)}`, diff: diffD };
    }
}

function sortDays() {
    const today = new Date();
    const items = Array.from(dayContainer.children);

    items.sort((a, b) => {
        const diffA = new Date(a.dataset.date) - today;
        const diffB = new Date(b.dataset.date) - today;
        const pastA = diffA < 0;
        const pastB = diffB < 0;
        
        if (pastA !== pastB) {
            // pastA가 true면 a를 뒤로(1), false면 앞으로(-1)
            return pastA ? 1 : -1;
        }
        // 둘 다 같은 구간(미래 or 과거)이면 날짜 오름차순
        return new Date(a.dataset.date) - new Date(b.dataset.date);
    });

    items.forEach(item => dayContainer.appendChild(item));
}

function saveDays() {
    const list = Array.from(dayContainer.children).map(item => ({
        title: item.querySelector('.dayTitle').textContent,
        date : item.dataset.date
    }));

    localStorage.setItem(DAYS_KEY, JSON.stringify(list));
    sortDays();
}

function enableTitleEdit(titleEl) {
    const original = titleEl.textContent;
    const input = document.createElement('input');
    input.type = 'text';
    input.value = original;
    input.className = 'dayTitle';
    titleEl.replaceWith(input);
    input.focus();

    function finish() {
        const p = document.createElement('p');
        p.className = 'dayTitle';
        p.textContent = input.value.trim() || original;
        input.replaceWith(p);
        attachDayEvents(p.closest('.day-item'));
        saveDays();
        p.addEventListener('dblclick', () => enableTitleEdit(p));
    }

    input.addEventListener('keydown', e => e.key === 'Enter' && finish());
    input.addEventListener('blur', finish);
}

function attachDayEvents(item) {
    item.querySelector('#dayRemove')
    .addEventListener('click', () => { item.remove(); saveDays(); });
    item.querySelector('.dayTitle')
    .addEventListener('dblclick', e => enableTitleEdit(e.target));
}

function createDayItem(title, dateStr) {
    const item = templateItem.cloneNode(true);
    item.dataset.date = dateStr;
    item.classList.remove('past');       // 기존 클래스 초기화

    // 제목, 날짜
    item.querySelector('.dayTitle').textContent = title;
    const d = new Date(dateStr);
    item.querySelector('.dayDate').textContent =
    `${d.getFullYear()}년 ${d.getMonth()+1}월 ${d.getDate()}일 ` +
    `${weekdays[d.getDay()]}요일`;

    // D-day & 과거/미래 구분
    const { text, diff } = calcDDayInfo(dateStr);
    const ddEl = item.querySelector('.d-day');
    ddEl.textContent = text;
    if (diff < 0) {
        item.classList.add('past');        // 과거일 때 추가
        ddEl.classList.add('past-label');  // 필요시 D-day 레이블도 스타일링
    }

    dayContainer.appendChild(item);
    attachDayEvents(item);
    sortDays();
}

function loadDays() {
    const raw = localStorage.getItem(DAYS_KEY);
    if (!raw) {
        dayContainer.querySelectorAll('.day-item').forEach(item => {
            // 초기 HTML 아이템에도 dataset.date 세팅
            const txt = item.querySelector('.dayDate').textContent;
            const m   = txt.match(/(\d{4})년\s*(\d{1,2})월\s*(\d{1,2})일/);

            if (m) {
                const [ , yy, mm, dd ] = m;
                const iso = `${yy}-${mm.padStart(2,'0')}-${dd.padStart(2,'0')}`;
                item.dataset.date = iso;
                // D-day 업데이트
                const { text, diff } = calcDDayInfo(iso);
                const ddEl = item.querySelector('.d-day');
                ddEl.textContent = text;
                if (diff < 0) {
                item.classList.add('past');
                ddEl.classList.add('past-label');
                }
            }
            attachDayEvents(item);
        });
        sortDays();
        return;
    }

    dayContainer.innerHTML = '';
    JSON.parse(raw).forEach(({ title, date }) => {
    createDayItem(title, date);
    });
}

dayBtn.addEventListener('click', () => {
    const title = dayText.value.trim();
    const date  = selectDate.value;

    if (!title || !date) return;

    createDayItem(title, date);
    dayText.value = '';
    saveDays();
});

dayText.addEventListener('keydown', e => e.key === 'Enter' && dayBtn.click());

loadDays();
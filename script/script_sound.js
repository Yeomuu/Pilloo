// Freesound API
const soundAccessKey = "W1yXzqt52YcUVu53J1yK4gUsMGGPFhqRQBRmOoGw";
let query          = "piano";
let STORAGE_KEY    = "freesound_sounds_" + query;

let sounds         = [];
let audio          = null;
let currentIndex   = 0;
let hasPlayedOnce  = false;

// —————————— DOM 요소 ——————————
const playBtnSvg   = document.querySelector(".btn-pause>svg");
const prevBtn      = document.querySelector(".btn-before");
const nextBtn      = document.querySelector(".btn-next");
const playTitle    = document.querySelector("#title");
const progressBar  = document.querySelector(".progress-bar");
const playlist     = document.querySelector("#playlist");
const lp           = document.querySelector("#lp");

const albumListEl  = document.querySelector(".albumList");
const albumInEl    = document.querySelector(".album-in");
const albums       = Array.from(albumListEl.querySelectorAll(".LP"));
const lBtn         = document.querySelector("#lBtn");
const rBtn         = document.querySelector("#rBtn");
const albumBox     = document.querySelector('.albumBox');
const albumTitleEl = document.querySelector("#albumTitle");
const albumImgEl   = document.querySelector("#albumImg");
const albumListBtn = document.querySelector('#albumListBtn');
const albumName    = document.querySelector('#albumName');
const albumBtn     = document.querySelectorAll('.btn');
const albumBtnW    = document.querySelectorAll('.btn > svg');
const albumSources = document.querySelector('#albumSources');

// —————————— SVG 아이콘 ——————————
const playIcon = `
    <path d="M18.6123 0.772461C28.1266 0.772461 35.8398 8.4857 35.8398 18C35.8398 27.5143 28.1266 35.2275 18.6123 35.2275C9.09799 35.2275 1.3848 27.5143 1.38477 18C1.38477 8.4857 9.09797 0.772461 18.6123 0.772461Z" stroke="var(--icon-color)" stroke-width="1.54555"/>
    <path d="M28.6123 18L13.6123 26.6603V9.33975L28.6123 18Z" fill="var(--icon-color)"/>`;
const pauseIcon = `
    <path d="M18.7051 1.37695C28.2194 1.37695 35.9326 9.0902 35.9326 18.6045C35.9326 28.1188 28.2194 35.832 18.7051 35.832C9.19076 35.832 1.47757 28.1188 1.47754 18.6045C1.47754 9.0902 9.19074 1.37695 18.7051 1.37695Z" stroke="var(--icon-color)" stroke-width="1.54555"/>
    <rect x="12.165" y="10.354" width="4.125" height="16.4999" fill="var(--icon-color)"/>
    <rect x="21.1182" y="10.3538" width="4.125" height="16.4999" fill="var(--icon-color)"/>`;

// —————————— 헬퍼 함수 ——————————
function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

// —————————— 카테고리 전환 함수 ——————————
function switchCategory(cat) {
    query = cat;
    STORAGE_KEY = "freesound_sounds_" + cat;
    albumTitleEl.textContent = capitalize(cat);
    albumImgEl.src = `images/album_${cat}.jpg`;

    const albumCat = document.querySelector('#category');
    albumCat.innerText = capitalize(cat);

    const cached = localStorage.getItem(STORAGE_KEY);
    if (cached) {
        sounds = JSON.parse(cached);
    } else {
        fetchSoundsFromAPI();
        return;
    }

    // — 재생 중인 사운드가 새 리스트에 있을 때만 강조
    if (audio && sounds.length) {
        const idx = sounds.findIndex(s =>
            audio.src.includes(s.previews["preview-hq-mp3"])
        );
        if (idx !== -1) {
            currentIndex  = idx;
            hasPlayedOnce = true;
        } else {
            currentIndex  = 0;
            hasPlayedOnce = false;
        }
    } else {
        currentIndex  = 0;
        hasPlayedOnce = false;
    }

    createPlaylist();

    if (!audio && sounds.length) {
        playTitle.textContent = sounds[currentIndex].name;
    }
}

// —————————— 로컬/API 로딩 ——————————
const cachedSounds = localStorage.getItem(STORAGE_KEY);
if (cachedSounds) {
    try {
        sounds = JSON.parse(cachedSounds);
        createPlaylist();
    } catch {
        fetchSoundsFromAPI();
    }
} else {
    fetchSoundsFromAPI();
}

function fetchSoundsFromAPI() {
    fetch(
        `https://freesound.org/apiv2/search/text/?query=${query}&filter=duration:[60 TO *]&fields=name,previews,tags&token=${soundAccessKey}`
    )
    .then(res => res.json())
    .then(data => {
        sounds = data.results.filter(s => s.previews?.["preview-hq-mp3"]);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(sounds));
        createPlaylist();
    })
    .catch(err => console.error("Freesound API 실패:", err));
}

// —————————— 재생 함수 ——————————
function loadAndPlay(index) {
    currentIndex = index;
    const sound = sounds[index];
    const url = sound.previews["preview-hq-mp3"];
    if (audio) audio.pause();

    audio = new Audio(url);
    audio.volume = 0.5;
    audio.loop   = false;

    audio.addEventListener("canplay", () => {
        audio.play().catch(console.warn);
        playBtnSvg.innerHTML      = pauseIcon;
        lp.style.animationPlayState = "running";
    });
    audio.addEventListener("play",  () => createPlaylist());
    audio.addEventListener("pause", () => createPlaylist());
    audio.addEventListener("seeked", () => { if (!audio.paused) createPlaylist(); });
    audio.addEventListener("timeupdate", () => {
        if (audio.duration) {
            progressBar.value = (audio.currentTime / audio.duration) * 100;
        }
    });
    audio.addEventListener("ended", () => {
        currentIndex = (currentIndex + 1) % sounds.length;
        loadAndPlay(currentIndex);
    });

    playTitle.textContent = sound.name;
    hasPlayedOnce        = true;
    createPlaylist();
}

// —————————— 플레이리스트 렌더링 ——————————
function createPlaylist() {
    playlist.innerHTML = "";

    sounds.forEach((sound, index) => {
        const li = document.createElement("li");
        li.className   = "track";
        li.dataset.index = index;
        li.draggable   = true;

        // 강조 조건: hasPlayedOnce && 현재 인덱스일 때만
        if (hasPlayedOnce && index === currentIndex) {
            li.classList.add("highlight");
        }

        const info  = document.createElement("div");
        info.classList.add("info");
        const title = document.createElement("span");
        title.classList.add("title");
        title.textContent = sound.name;
        const tags  = document.createElement("span");
        tags.classList.add("tags");
        tags.textContent = (sound.tags || []).slice(0,5).map(t=>`#${t}`).join(" ") || `#${query}`;
        info.append(title, tags);

        const btn = document.createElement("button");
        btn.classList.add("btn-playpause");
        const isActive = index === currentIndex && audio && !audio.paused && hasPlayedOnce;
        btn.innerHTML  = isActive
            ? `<svg width="26" height="26" viewBox="0 0 37 36" fill="none" xmlns="http://www.w3.org/2000/svg">${pauseIcon}</svg>`
            : `<svg width="26" height="26" viewBox="0 0 37 36" fill="none" xmlns="http://www.w3.org/2000/svg">${playIcon}</svg>`;

        btn.addEventListener("click", e => {
            e.stopPropagation();
            if (index === currentIndex && audio) {
                audio.paused ? audio.play() : audio.pause();
            } else {
                loadAndPlay(index);
            }
        });

        li.addEventListener("click", () => loadAndPlay(index));
        li.addEventListener("dragstart", e => e.dataTransfer.setData("text/plain", index));
        li.addEventListener("dragover", e => e.preventDefault());
        li.addEventListener("drop", e => {
            e.preventDefault();

            const from = +e.dataTransfer.getData("text/plain");
            const moved = sounds.splice(from, 1)[0];
            sounds.splice(index, 0, moved);

            localStorage.setItem(STORAGE_KEY, JSON.stringify(sounds));

            if (hasPlayedOnce && audio) {
                const newIdx = sounds.findIndex(s =>
                    audio.src.includes(s.previews["preview-hq-mp3"])
                );
                if (newIdx !== -1) currentIndex = newIdx;
            }
            
            createPlaylist();
        });

        li.append(info, btn);
        playlist.appendChild(li);
    });

    if (!audio && sounds.length) {
        playTitle.textContent = sounds[0].name;
    }
}

// —————————— 헤더 재생 토글 ——————————
playBtnSvg.parentElement.addEventListener("click", () => {
    if (!audio) {
        loadAndPlay(currentIndex);
    } else {
        audio.paused ? audio.play() : audio.pause();
        playBtnSvg.innerHTML      = audio.paused ? playIcon : pauseIcon;
        lp.style.animationPlayState = audio.paused ? "paused" : "running";
        createPlaylist();
    }
});

// 이전/다음 버튼
prevBtn.addEventListener("click", () => {
    if (!sounds.length) return;
    currentIndex = (currentIndex - 1 + sounds.length) % sounds.length;
    loadAndPlay(currentIndex);
});
nextBtn.addEventListener("click", () => {
    if (!sounds.length) return;
    currentIndex = (currentIndex + 1) % sounds.length;
    loadAndPlay(currentIndex);
});

// 프로그레스바 seek
progressBar.addEventListener("input", () => {
    if (audio?.duration) {
        audio.currentTime = (progressBar.value/100)*audio.duration;
        if (!audio.paused) createPlaylist();
    }
});

// —————————— 앨범 슬라이더 & 선택 ——————————
const VISIBLE_COUNT = 3;
let startIndex = 0;

function renderAlbumWindow() {
    const len = albums.length;
    albums.forEach(el => {
        if (albumListEl.contains(el)) albumListEl.removeChild(el);
        el.classList.remove("center");
    });
    for (let k = 0; k < VISIBLE_COUNT; k++) {
        const idx = (startIndex + k + len) % len;
        const el  = albums[idx];
        albumListEl.appendChild(el);
        if (k === 1) el.classList.add("center");
    }
    const centerIdx = (startIndex + 1 + len) % len;
    albumTitleEl.textContent = capitalize(albums[centerIdx].dataset.category);
}

lBtn.addEventListener("click", () => {
    startIndex = (startIndex - 1 + albums.length) % albums.length;
    renderAlbumWindow();
});
rBtn.addEventListener("click", () => {
    startIndex = (startIndex + 1) % albums.length;
    renderAlbumWindow();
});

// 앨범 또는 제목 클릭 시 해당 카테고리 이동
function goToCategory(cat) {
    albumListEl.style.display = "none";
    albumInEl.style.display = "flex";
    albumListBtn.style.left = "100px";
    albumListBtn.style.top = "366px";
    albumName.style.margin = "0 22px";
    albumTitleEl.style.fontSize = "18px";
    albumSources.style.fontSize = "16px";

    albumBtn.forEach((btn) =>{
        btn.style.width = "40px";
        btn.style.height = "40px";
    });

    albumBtnW.forEach((btn) => {
        btn.setAttribute('width', '25px');
        btn.setAttribute('height', '24px');
    });

    switchCategory(cat);
}

albumBox.addEventListener("click", () => {
    albumInEl.style.display   = "none";
    albumListEl.style.display = "flex";
    albumListBtn.style.left = "";
    albumListBtn.style.top = "";
    albumName.style.margin = "";
    albumTitleEl.style.fontSize = "";
    albumSources.style.fontSize = "";

    albumBtn.forEach((btn) =>{
        btn.style.width = "";
        btn.style.height = "";
    });

    albumBtnW.forEach((btn) => {
        btn.setAttribute('width', '33px');
        btn.setAttribute('height', '32px');
    });

    renderAlbumWindow();
  });

albums.forEach(el => el.addEventListener("click", () => goToCategory(el.dataset.category)));

albumTitleEl.addEventListener("click", () => {
    const len = albums.length;
    const centerIdx = (startIndex + 1 + len) % len;
    goToCategory(albums[centerIdx].dataset.category);
});

function bindAlbumNavButtons() {
  const isDetail = () => albumInEl.style.display !== "none";
  function getCurrentCatIdx() {
    const cat = albumTitleEl.textContent.toLowerCase();
    return albums.findIndex(el => el.dataset.category === cat);
  }
}

// —————————— 앨범 상세 모드용 좌/우 버튼 핸들러 ——————————
lBtn.addEventListener('click', () => {
  if (albumInEl.style.display !== 'none') {
    // 1) 현재 상세 카테고리 인덱스
    const ci = albums.findIndex(el => el.dataset.category === query);
    // 2) 이전 인덱스
    const prev = (ci - 1 + albums.length) % albums.length;
    // 3) startIndex를 “prev가 가운데” 되도록 설정
    startIndex = (prev - 1 + albums.length) % albums.length;
    // 4) 카테고리 전환 및 슬라이더 렌더
    switchCategory(albums[prev].dataset.category);
    renderAlbumWindow();
  } else {
    // 기존 슬라이더 동작
    startIndex = (startIndex - 1 + albums.length) % albums.length;
    renderAlbumWindow();
  }
});

rBtn.addEventListener('click', () => {
  if (albumInEl.style.display !== 'none') {
    const ci   = albums.findIndex(el => el.dataset.category === query);
    const next = (ci + 1) % albums.length;
    // next를 가운데로
    startIndex = (next - 1 + albums.length) % albums.length;
    switchCategory(albums[next].dataset.category);
    renderAlbumWindow();
  } else {
    startIndex = (startIndex + 1) % albums.length;
    renderAlbumWindow();
  }
});


// 초기 UI 설정
albumInEl.style.display   = "none";
albumListEl.style.display = "flex";
renderAlbumWindow();
bindAlbumNavButtons();
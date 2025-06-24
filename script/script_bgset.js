const imgAccessKey = "WGjqUUOg2C5vmp56wRmem2JbNt-bNgdfYtcLAHFsmfE";

const spinner = document.querySelector('.spinner');
const imgContainers = document.querySelectorAll('#imgList > div[data-category]');

const basic_background_images = JSON.parse(
  localStorage.getItem('basic_background_images') || '[]'
);

imgContainers.forEach(container => {
  const topic = container.dataset.category; 
  if (topic === 'basic') {
    renderThumbnails(container, basic_background_images);
  } else {
    const CACHE_KEY = `unsplash_images_${topic}`;
    initImg(container, topic, CACHE_KEY);
  }
});

function initImg(container, topic, cacheKey) {
  const cached = localStorage.getItem(cacheKey);
  if (cached) {
    try {
      const images = JSON.parse(cached);
      renderThumbnails(container, images);
      console.log(`✅ [${topic}] 로컬 이미지 사용`);
    } catch {
      console.warn(`❌ [${topic}] 캐시 파싱 실패, API 호출`);
      loadImg(container, topic, cacheKey);
    }
  } else {
    loadImg(container, topic, cacheKey);
  }
}

function loadImg(container, topic, cacheKey) {
  fetch(`https://api.unsplash.com/photos/random?count=9&query=${topic}&orientation=landscape&client_id=${imgAccessKey}`)
    .then(res => res.json())
    .then(images => {
      localStorage.setItem(cacheKey, JSON.stringify(images));
      renderThumbnails(container, images);
      console.log(`🌍 [${topic}] API에서 새로 가져옴`);
    })
    .catch(err => {
      console.error(`❌ [${topic}] 이미지 가져오기 실패`, err);
    });
}

// ✅ 썸네일 렌더링
function renderThumbnails(container, imgArray) {
  container.innerHTML = "";

  imgArray.forEach(img => {
    const thumbSrc = img.thumb  || img.urls.small;
    const fullSrc  = img.file   || img.urls.full;
    const author   = img.author || img.user.name;
    const link     = img.url    || img.user.links.html;

    const thumb = document.createElement('img');
    thumb.src = thumbSrc;
    thumb.classList.add('thumbnail');
    container.appendChild(thumb);

    thumb.addEventListener('click', () => {
      if (bg.style.backgroundImage.includes(fullSrc)) return;

      spinner.style.display = 'flex';
      credit.innerText      = author;
      credit.href           = link;

      const loader = new Image();
      loader.src = fullSrc;
      loader.onload = () => {
        bg.style.backgroundImage = `url(${fullSrc})`;
        spinner.style.display    = 'none';
      };
    });
  });
}
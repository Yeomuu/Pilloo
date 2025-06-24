// 로그인 여부 로드
const loginWrap = document.querySelector('#loginWrap');
let islogin = false;

// 24시간 이내 자동 로그인 유지
const loginTime = localStorage.getItem('loginTime');

const userName = document.querySelector('#name');
const userImg = document.querySelector('#profile');

if (loginTime && Date.now() - Number(loginTime) < 24 * 60 * 60 * 1000) {
    islogin = true;

    // 👉 닉네임/프로필이 저장되어 있으면 불러오기
    const nickname = localStorage.getItem('nickname');
    const profileImg = localStorage.getItem('profileImg');

    if (nickname) userName.innerText = nickname;
    if (profileImg) userImg.src = profileImg;

    console.log('🟢 자동 로그인 상태입니다 (24시간 이내)');
} else {
    console.log('🔴 로그인 필요');
    localStorage.removeItem('loginTime');
}

// 로그인창 뜨기
mypageIcon.addEventListener('click', () => {
    if (!islogin) {
        loginWrap.style.display = 'flex';
    }
});

// 로그인창 닫기
const loginBox = document.querySelector('#login');

loginBox.addEventListener('click', (e) => e.stopPropagation());
loginWrap.addEventListener('click', () => loginWrap.style.display = '');

// 기본 로그인 비밀번호 보기
const email = document.querySelector('#ID');
const password = document.querySelector('#password');
const passwordToggle = document.querySelector('#openPassword');
const logIn = document.querySelector('#Sign-in');

// 입력창 포커스 시 아웃라인 색상 설정 함수
function outlineColor(element, color) {
    element.addEventListener('focus', () => {
        element.style.outline = `2px solid ${color}`;
    });
    element.addEventListener('blur', () => {
        element.style.outline = 'none';
    });
}

// 로그인 버튼 클릭 시 처리
logIn.addEventListener('click', () => {
    alert('아직 활성화되지 않은 기능입니다. \n간편로그인을 이용해주세요');
});

// 비밀번호 보기 토글
passwordToggle.addEventListener('change', function () {
    password.type = this.checked ? 'text' : 'password';
});

// 카카오 로그인 API
Kakao.init('6409061dce0b17ac534010851bbae288');

const kakaoLogBtn = document.querySelector('#kakaoLogin');
const logoutBtn = document.querySelector('#logout');

kakaoLogBtn.addEventListener('click', () => {
    Kakao.Auth.login({
        success: function(authObj) {
            console.log("✅ 로그인 성공!", authObj);
            loginWrap.style.display = '';
            islogin = true;
            localStorage.setItem('loginTime', Date.now()); // 로그인 시간 저장

            // ✅ 사용자 정보 요청
            Kakao.API.request({
                url: '/v2/user/me',
                success: function(res) {
                    console.log("🙋 사용자 정보:", res);

                    const profile = res.kakao_account.profile;
                    const nickname = profile?.nickname || "pilloo_00";
                    const isDefaultImage = profile?.is_default_image;
                    const profileImg = isDefaultImage ? "images/default_profile.jpg" : profile?.profile_image_url;

                    // 닉네임 활용
                    alert(`${nickname} 님 환영합니다!`);

                    // 화면에 표시
                    userName.innerText = nickname;
                    userImg.src = profileImg;

                    // ✅ localStorage 저장
                    localStorage.setItem("nickname", nickname);
                    localStorage.setItem("profileImg", profileImg);
                },
                fail: function(err) {
                    console.error("사용자 정보 요청 실패", err);
                }
            });
        },
        fail: function(err) {
            alert("로그인 실패 😢");
            console.error(err);
        }
    });
});

// 로그아웃 버튼 이벤트
logoutBtn.addEventListener('click', () => {
    Kakao.Auth.logout(() => {
        alert("로그아웃 되었습니다!");

        console.log('🎯 로그아웃되었습니다.')
        localStorage.removeItem("nickname");
        localStorage.removeItem("loginTime");
        islogin = false;
        Mypage.style.transform = ''
        mainpage.style.transform = ''
    });
});
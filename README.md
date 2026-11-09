# 📖 방명록 (Guestbook) - Supabase 연동 프로젝트

React, Tailwind CSS, Lucide Icons, Vite 및 **Supabase Cloud Database** 기반으로 제작된 모던 방명록 웹 애플리케이션입니다.

---

## ⚡ 주요 기능
- **Supabase Cloud DB 연동**: 원격 PostgreSQL 기반 실시간 데이터베이스 저장
- **실시간(Realtime) 동기화**: 다른 사용자가 글을 쓰면 새로고침 없이 화면 자동 갱신
- **방명록 작성/삭제/좋아요**: 익명 방문자 누구나 자유롭게 소통 가능
- **대기/오류 안내 UI**: DB 연결 대기 상태 및 로딩/에러 표시 완비
- **반응형 디자인**: 모바일 및 데스크톱 최적화

---

## 🛠️ Supabase 설정 방법 (3단계)

### 1단계: Supabase 프로젝트 생성 및 테이블 생성
1. [Supabase](https://supabase.com)에 로그인 후 새 프로젝트를 생성합니다.
2. 좌측 메뉴에서 **SQL Editor**로 이동합니다.
3. 프로젝트 내 `supabase-schema.sql` 파일의 내용을 복사하여 붙여넣고 우측 하단 **[Run]** 버튼을 누릅니다.
   - `guestbook` 테이블 생성 및 RLS(Row Level Security) 접근 정책이 자동으로 적용됩니다.

### 2단계: API 키 확인 및 `.env` 파일 설정
1. Supabase 대시보드 좌측 하단 **Project Settings (톱니바퀴)** > **API** 메뉴로 이동합니다.
2. `Project URL`과 `anon public key`를 복사합니다.
3. 프로젝트 폴더의 `.env` 파일을 열고 다음과 같이 입력합니다:
   ```env
   VITE_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

### 3단계: 로컬 실행
```bash
npm run dev
```
브라우저로 접속하면 상단에 **"Supabase 클라우드 데이터베이스 연결됨"** 표시가 나타나며 실시간 DB 연동이 동작합니다!

---

## 📁 프로젝트 구조
```
123131/
├── index.html            # 메인 HTML 템플릿
├── package.json          # 패키지 정보 (@supabase/supabase-js 포함)
├── supabase-schema.sql   # Supabase 테이블 및 RLS 설정 SQL
├── .env                  # Supabase 환경변수 (URL & API Key)
├── .env.example          # 환경변수 예시 파일
├── vite.config.js        # Vite 설정
├── tailwind.config.js    # Tailwind CSS 설정
├── src/
│   ├── main.jsx          # React 엔트리포인트
│   ├── App.jsx           # 방명록 메인 화면 및 Supabase CRUD
│   ├── supabase.js       # Supabase 클라이언트 초기화
│   └── index.css         # 전역 CSS
└── dist/                 # 빌드 결과물
```

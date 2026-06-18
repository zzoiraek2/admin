# Admin 설계정책서

어드민 메뉴별 설계정책서를 `docs/menus/*.md` 파일 기준으로 관리하고, 웹 UI에서 탐색·검색할 수 있는 설계정책서 도구입니다. GitHub Pages에서는 읽기 전용으로 보고, 로컬 관리 서버에서는 상태 변경을 MD 파일에 저장합니다.

## 구성

- `server.js`: 정적 파일 서빙, 메뉴 MD 파싱, 상태 저장 API
- `scripts/build-menus-index.js`: GitHub Pages용 정적 메뉴 인덱스 생성
- `index.html`: 화면 골격
- `styles.css`: 어드민 정책서 UI 스타일
- `app.js`: 메뉴 트리, 검색/필터, 상세 화면, 상태 변경 UI
- `docs/menus/*.md`: 메뉴별 설계정책 원천 문서
- `docs/menus-index.json`: GitHub Pages 읽기 전용 데이터
- `docs/domains/*.md`: 도메인 단위 정책 문서
- `vendor/lucide.min.js`: 아이콘 렌더링

## 사용 방식

### 보는 사람

GitHub Pages에서 읽기 전용으로 확인합니다.

```text
https://zzoiraek2.github.io/admin/
```

이 모드에서는 `docs/menus-index.json`을 읽어서 표시하므로 별도 서버가 필요 없습니다. 상태 변경은 비활성화됩니다.

### 수정하는 사람

상태 저장 기능은 로컬 관리 서버가 필요합니다.

Windows에서는 아래 파일을 더블클릭하거나 터미널에서 실행합니다.

```bat
start-admin-server.cmd
```

직접 실행하려면:

```bash
npm start
```

또는:

```bash
node server.js
```

브라우저에서 `http://127.0.0.1:4173/` 또는 `http://localhost:4173/`을 엽니다.

상태를 변경하면 해당 메뉴의 MD 파일이 수정됩니다. 변경 후 아래 명령으로 Pages용 정적 인덱스를 다시 생성하고 커밋/푸시합니다.

```bash
node scripts/build-menus-index.js
```

## 상태 저장 방식

상태 선택값은 브라우저 로컬스토리지에 저장하지 않습니다.

웹 UI에서 `정의됨 / 준비중 / 검토중`을 변경하면 `server.js`가 해당 메뉴의 `docs/menus/{MENU_CODE}.md` 파일 안에 있는 `- 상태:` 값을 직접 수정합니다. 이 변경분을 커밋하고 푸시하면 다른 사람도 같은 상태를 보게 됩니다.

## 주요 기능

- 메뉴 코드, 상단 메뉴, 좌측 메뉴 기준 탐색
- 메뉴명, 목적, 설명, 구 어드민 매핑, 설계 의견 통합 검색
- `정의됨 / 준비중 / 검토중` 상태 필터
- 메뉴별 MD 문서 바로 열기
- 메뉴별 화면 목적, 업무 설명, 탭 구성, 설계 방식 제안 확인
- RISK 등 특수 정책 영역의 보강 설계 표시

## 개발 지침

메뉴 코드 기준으로 개발을 지시하는 방식은 [DEVELOPMENT_GUIDE.md](./DEVELOPMENT_GUIDE.md)를 참고합니다.

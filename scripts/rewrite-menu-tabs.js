const fs = require("fs");
const path = require("path");
const { listMenus } = require("../server");

const menusDir = path.join(__dirname, "..", "docs", "menus");

function hasAny(text, words) {
  return words.some((word) => text.includes(word));
}

function tabsFor(menu) {
  const text = `${menu.code} ${menu.top} ${menu.left1} ${menu.title} ${menu.purpose} ${menu.description}`;

  if (menu.code === "ADM-MEM-001") {
    return ["회원 요약", "거래·입출금 요약", "KYC 상태·이력", "보안·접속", "제한·리스크", "상담·처리이력", "감사로그"];
  }
  if (menu.code === "ADM-MEM-006") {
    return ["보안 요약", "접속·기기 이력", "인증수단 상태", "OTP 해제 이력", "이상접속·제한", "감사로그"];
  }
  if (menu.code === "ADM-MEM-008") {
    return ["신청·증빙", "OCR·안면인증", "검토·보완", "승인·반려", "자동 제한·통지", "감사로그"];
  }
  if (menu.code === "ADM-CS-004") {
    return ["제출내역", "검토·보완", "보관·파기", "연계업무", "감사로그"];
  }
  if (menu.code === "ADM-MKT-004") {
    return ["거래 요약", "실시간 거래 모니터링", "기간별·페어 분석", "회원 영향도", "시장감시 모니터링"];
  }
  if (menu.code === "ADM-RISK-004") {
    return ["차단 관리대장", "원천 로그"];
  }
  if (menu.code === "ADM-RISK-013") {
    return ["VASP 요약", "식별정보 관리", "검증·위험상태", "차단목록 반영", "승인·변경 이력"];
  }
  if (menu.code === "ADM-WAL-013") {
    return ["지갑 요약", "잔고·상태 모니터링", "웜월렛·지갑 세팅"];
  }
  if (menu.code === "ADM-WAL-015") {
    return ["비율 요약", "자산별 비율 현황", "가상자산별 관리비율 설정", "비율 알림·자동조정", "조정 이력"];
  }
  if (menu.code === "ADM-SETTLE-014") {
    return ["종가", "경제적가치"];
  }

  if (menu.top === "대시보드") {
    if (hasAny(text, ["승인", "처리 대기", "완료 이력"])) return ["처리 대기 요약", "업무별 상세", "승인·반려", "처리 이력"];
    if (hasAny(text, ["보고서"])) return ["보고서 목록", "생성·예약", "다운로드 이력", "감사 대상"];
    return ["운영 요약", "실시간 지표", "알림·이벤트", "처리 현황", "추이·리포트"];
  }

  if (menu.top === "회원·고객확인") {
    if (hasAny(text, ["로그인·보안 조회", "로그인 보안상태"])) {
      return ["계정 보안 요약", "접속·기기 이력", "인증수단·잠금", "이상접속·제한", "처리 이력"];
    }
    if (menu.left1 === "회원 통합조회") {
      return ["회원 요약", "거래·입출금 요약", "KYC 상태·이력", "보안·접속", "제한·리스크", "상담·처리이력", "감사로그"];
    }
    if (hasAny(text, ["KYC", "고객확인", "사이렌", "CARF", "본인 인증", "OTP"])) {
      return ["대상 요약", "신청·증빙", "검토·보완", "승인·반려", "제한·후속조치", "감사로그"];
    }
    if (hasAny(text, ["내부지갑"])) {
      return ["지갑 요약", "주소·소유권 검증", "위험·제재", "연결 회원·입출금", "변경 이력"];
    }
    if (hasAny(text, ["고액자산가", "VIP", "블랙컨슈머"])) {
      return ["고객군 요약", "선정·등록 기준", "혜택·제한 정책", "변경·해제 이력", "감사로그"];
    }
    return ["회원 요약", "거래·입출금 요약", "KYC 상태·이력", "보안·접속", "제한·리스크", "상담·처리이력", "감사로그"];
  }

  if (menu.top === "거래·마켓 관리") {
    if (hasAny(text, ["API"])) return ["API 사용 요약", "주문·오류 모니터링", "이상 패턴", "차단·해제 이력"];
    if (hasAny(text, ["수수료", "멤버십", "최소 주문", "마켓 상태"])) return ["운영정책 요약", "대상별 설정", "변경·예약", "적용 이력", "감사로그"];
    if (hasAny(text, ["보유수량"])) return ["보유 요약", "회원·자산별 상세", "오류·락업", "변동 이력"];
    if (hasAny(text, ["거래량", "거래 현황"])) return ["거래 요약", "실시간 거래 모니터링", "기간별·페어 분석", "회원 영향도"];
    return ["거래 요약", "주문·체결 상세", "이상거래 징후", "처리·확정 이력", "감사로그"];
  }

  if (menu.top === "입출금·지갑") {
    if (menu.left1 === "입출금 정책" || hasAny(text, ["한도", "설정", "코인별 입출금 상태"])) return ["정책 요약", "대상별 설정", "중지·재개", "예외·승인", "변경 이력"];
    if (menu.left1 === "지갑 관리" || hasAny(text, ["주소 관리", "콜드", "자산 이전"])) return ["지갑 요약", "잔고·상태 모니터링", "이전·운영 작업", "위험·알림", "작업 이력"];
    if (menu.left1 === "자산 대사" || hasAny(text, ["대사", "분리보관", "고객자산", "회사자산"])) return ["대사 요약", "원장·온체인 비교", "차이·부족액", "보정·보고", "감사 이력"];
    if (hasAny(text, ["오입금", "반환"])) return ["접수 요약", "증빙·검증", "반환 승인", "처리 결과", "감사로그"];
    if (hasAny(text, ["승인", "보류", "실패", "재처리", "미반영", "지연", "이상"])) return ["처리 대상 요약", "원인·위험 확인", "수동 처리·승인", "처리 결과", "감사로그"];
    return ["입출금 요약", "처리 상태별 현황", "이상·보류 모니터링", "수동 처리·보정", "이력·감사"];
  }

  if (menu.top === "준법·FDS 관리") {
    if (hasAny(text, ["차단 등록"])) return ["등록 요청", "대상·범위", "사유·증빙", "승인·반영", "감사로그"];
    if (hasAny(text, ["차단 해제", "해제 승인"])) return ["해제 요청", "원 차단 근거", "검토·승인", "재개·통지", "감사로그"];
    if (hasAny(text, ["사유코드"])) return ["사유코드 목록", "보고·산출 매핑", "사용·변경 관리", "승인·감사로그"];
    if (hasAny(text, ["FDS Case", "KYT Alert"])) return ["알림·Case 요약", "위험 근거", "검토·조치", "보고·종결", "처리 이력"];
    if (hasAny(text, ["룰", "예외", "설정", "카테고리", "자산 설정"])) return ["정책 요약", "대상·조건 관리", "검증·시뮬레이션", "적용·비활성", "변경 이력"];
    if (hasAny(text, ["트래블룰", "VASP", "고객정보"])) return ["대상 요약", "송수신·검증 상세", "예외·수동확인", "후속조치", "감사로그"];
    return ["준법 요약", "위험 대상 상세", "검토·조치", "보고·이력", "감사로그"];
  }

  if (menu.top === "거래지원·상품") {
    if (menu.code === "ADM-LIST-003") return ["거래지원 신청 접수", "신청서·프로젝트 정보", "자료·체크리스트", "리스크 검토", "의결·승인", "조치·이력"];
    if (menu.code === "ADM-LIST-004") return ["유지심사 대상 선정", "프로젝트 현황", "자료·체크리스트", "리스크 검토", "의결·승인", "조치·이력"];
    if (menu.code === "ADM-LIST-005") return ["종료심사 사유 접수", "종료 영향 분석", "자료·체크리스트", "리스크 검토", "의결·승인", "조치·이력"];
    if (hasAny(text, ["자료"])) return ["자료 요청 요약", "제출·보완", "검토·승인", "만료·갱신", "이력"];
    if (hasAny(text, ["유의", "거래상태", "거래개시", "종료", "토큰스왑"])) return ["조치 요약", "일정·공지", "운영 상태", "후속 처리", "변경 이력"];
    if (hasAny(text, ["유통량", "토큰이코노미", "리스크"])) return ["프로젝트 요약", "공시·자료", "리스크 이벤트", "검토·조치", "이력"];
    return ["자산·프로젝트 요약", "운영 설정", "노출·거래상태", "검증·리스크", "변경 이력"];
  }

  if (menu.top === "정산·회계") {
    if (hasAny(text, ["지급", "회수", "리워드", "프로모션", "추천"])) return ["대상 요약", "지급·회수 요청", "승인·실행", "실패·보정", "정산 이력"];
    if (hasAny(text, ["마감"])) return ["마감 요약", "검증·차이", "조정·승인", "확정·보고", "마감 이력"];
    if (hasAny(text, ["평가", "환산가", "가격"])) return ["평가 요약", "기준가·예외", "수동 보정", "승인·반영", "변경 이력"];
    return ["정산 요약", "기간별 집계", "대사·차이", "보정·승인", "다운로드·감사"];
  }

  if (menu.top === "고객지원·서비스") {
    if (hasAny(text, ["공지", "FAQ", "보고서", "배너", "팝업", "미디어", "문구"])) return ["콘텐츠 요약", "작성·검토", "게시·예약", "종료·회수", "변경 이력"];
    if (hasAny(text, ["앱 버전", "업데이트", "자가"])) return ["운영 요약", "대상·조건 설정", "배포·예약", "예외·롤백", "변경 이력"];
    if (hasAny(text, ["증빙"])) return ["제출 요약", "증빙 상세", "검토·보완", "보관·만료", "처리 이력"];
    return ["문의 요약", "상담 상세", "답변·보류", "처리 결과", "사후·이력"];
  }

  if (menu.top === "보안·관리자통제") {
    if (hasAny(text, ["개인정보", "다운로드", "이상조회"])) return ["접근 요약", "조회·다운로드 상세", "사유·승인", "이상 패턴", "감사로그"];
    if (hasAny(text, ["역할", "권한"])) return ["권한 요약", "역할·대상 매핑", "승인·변경", "영향 범위", "감사로그"];
    if (hasAny(text, ["설정", "공통코드", "배치", "API", "알림", "승인선"])) return ["설정 요약", "대상·조건 관리", "검증·적용", "실패·알림", "변경 이력"];
    return ["관리자 요약", "접근·보안 정책", "승인·변경", "접속·작업 이력", "감사로그"];
  }

  return ["업무 요약", "대상 상세", "처리·조치", "이력·감사"];
}

function replaceTabsSection(text, tabs) {
  const lines = text.split(/\r?\n/);
  const start = lines.findIndex((line) => line.trim() === "## 탭 구성");
  if (start === -1) return text;

  let end = lines.length;
  for (let index = start + 1; index < lines.length; index += 1) {
    if (/^##\s+/.test(lines[index])) {
      end = index;
      break;
    }
  }

  const replacement = ["## 탭 구성", "", ...tabs.map((tab) => `- ${tab}`), "", ""];
  return [...lines.slice(0, start), ...replacement, ...lines.slice(end)].join("\n");
}

let changed = 0;

for (const menu of listMenus()) {
  const filePath = path.join(menusDir, `${menu.code}.md`);
  const before = fs.readFileSync(filePath, "utf8");
  const after = replaceTabsSection(before, tabsFor(menu));
  if (after !== before) {
    fs.writeFileSync(filePath, after, "utf8");
    changed += 1;
  }
}

console.log(`Updated tab sections in ${changed} menu docs.`);

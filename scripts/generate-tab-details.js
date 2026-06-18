const fs = require("fs");
const path = require("path");
const { listMenus } = require("../server");

const menusDir = path.join(__dirname, "..", "docs", "menus");

const domainPolicies = {
  DASH: {
    role: "운영 리더, 승인권자, 준법/리스크 담당자",
    search: "기간, 업무구분, 상태, 담당부서, SLA 초과 여부, 알림 등급",
    columns: "업무구분, 건수, 미처리 수, SLA 초과, 담당부서, 최근 갱신시각, 바로가기",
    detail: "지표 산출 기준, 원천 메뉴, 최근 이벤트, 미처리 사유, 담당자 메모, 관련 화면 링크",
    actions: "필터 저장, 담당자 배정, 관련 목록 이동, 보고서 다운로드, 알림 확인",
    links: "승인 대기, 입출금 처리, FDS/KYT Case, 고객상담, 보고서 센터"
  },
  MEM: {
    role: "CS, KYC 담당자, 준법/FDS 담당자, 승인권자",
    search: "회원번호, UID, 이름, 이메일, 휴대폰, CI/DI, KYC 상태, 계정상태, 위험등급",
    columns: "회원번호, 이름/식별값, KYC 상태, 계정상태, 거래/입출금 제한, 위험등급, 최근 활동, 담당자",
    detail: "회원 식별정보, 연락처, KYC 이력, 계정 보안상태, 제한/차단 상태, 상담/처리 이력, 감사로그",
    actions: "회원 360 조회, 관련 입출금/거래 이동, 상태 변경 요청, 제한/해제 상신, 상담 메모 등록",
    links: "회원 기본조회, KYC 심사, 로그인·보안 조회, 입출금 조회, 차단 등록/해제, 상담 이력"
  },
  WAL: {
    role: "입출금 운영자, 지갑 운영자, 정산/회계 담당자, 준법 담당자",
    search: "기간, 회원번호, 자산, 네트워크, TXID, 주소, 처리상태, 보류/실패 사유",
    columns: "요청일시, 회원번호, 자산/네트워크, 금액, 수수료, 상태, TXID/주소, 위험표시, 담당자",
    detail: "원장 반영 상태, 온체인 상태, 주소/메모, 위험 탐지 결과, 처리 로그, 수동 처리 근거",
    actions: "상세 조회, 보류/재처리 요청, 수동 확인, 차단 연계, 지갑 작업 요청, 증빙 첨부",
    links: "입출금 조회, 지갑 관리, 자산 대사, 차단 등록, KYT Alert, 정산/회계"
  },
  MKT: {
    role: "거래 운영자, 시장감시 담당자, 상품 담당자, 준법 담당자",
    search: "기간, 마켓/페어, 회원번호, 주문번호, 체결번호, 주문상태, 이상거래 유형",
    columns: "마켓, 주문/체결 건수, 거래금액, 회원 영향도, 이상징후, 상태, 최근 발생시각, 조치상태",
    detail: "주문/체결 상세, 호가/가격 영향, 관련 회원, 시장경보, 이상거래 근거, 조치 이력",
    actions: "상세 조회, 시장감시 Case 생성, 거래제한 요청, 공지/알림 연계, 보고서 추출",
    links: "거래 현황, 회원 기본조회, 시장감시 모니터링, FDS Case, 거래지원 상태, 보고서 센터"
  },
  RISK: {
    role: "준법 담당자, FDS/KYT 담당자, 입출금 운영자, 승인권자",
    search: "기간, 회원번호, 사유코드, Case 번호, 차단/해제 상태, 자산, VASP, 보고 기준",
    columns: "발생일시, 회원/대상, 사유코드, 차단범위, 건수/금액, 상태, 승인단계, 근거 문서",
    detail: "탐지/등록 근거, 차단 사유, 원천 로그, 증빙, 승인 이력, 보고 산출 기준, 후속 조치",
    actions: "Case 검토, 차단 등록/해제 상신, 증빙 첨부, 보고 집계 확인, 원천 로그 추적",
    links: "차단 등록, 차단 해제, 차단 사유코드, 차단 관리대장, KYT Alert, 회원 기본조회"
  },
  LIST: {
    role: "거래지원 심사 담당자, 상품 운영자, 준법 담당자, 승인권자",
    search: "프로젝트명, 자산명, 심사상태, 담당자, 위험등급, 요청일, 의결 결과",
    columns: "프로젝트/자산, 단계, 담당자, 위험등급, 요청일, 마감일, 의결 결과, 후속 조치",
    detail: "심사 자료, 체크리스트, 리스크 검토, 의결 근거, 공지/거래상태, 변경 이력",
    actions: "자료 요청, 보완 요청, 심사 의견 등록, 의결 상신, 거래상태 변경 예약",
    links: "거래지원 심사, 거래상태 관리, 공지 관리, 시장감시, 준법 검토, 감사로그"
  },
  SETTLE: {
    role: "정산 담당자, 회계 담당자, 감사 담당자, 승인권자",
    search: "기준일, 정산구분, 자산/통화, 계정과목, 마감상태, 차이 여부, 담당자",
    columns: "기준일, 정산구분, 금액, 원장 금액, 차이 금액, 상태, 조정 사유, 승인상태",
    detail: "산출식, 원천 데이터, 대사 결과, 차이 원인, 조정 전후 값, 승인/마감 이력",
    actions: "집계 재생성, 차이 확인, 조정 요청, 마감 상신, 보고서 다운로드",
    links: "정산 대시보드, 자산 대사, 입출금 조회, 회계 마감, 보고서 센터, 감사로그"
  },
  CS: {
    role: "CS 운영자, 서비스 운영자, 콘텐츠 담당자, 승인권자",
    search: "기간, 문의번호, 회원번호, 카테고리, 처리상태, 담당자, 게시상태",
    columns: "접수/게시일시, 대상, 카테고리, 상태, 담당자, SLA, 최근 변경, 노출/처리 결과",
    detail: "문의/콘텐츠 본문, 회원 맥락, 첨부/증빙, 처리 메모, 게시 조건, 변경 이력",
    actions: "답변/처리, 이관, 보류, 게시 예약, 종료/회수, 관련 회원/거래 이동",
    links: "회원 기본조회, 상담 이력, 공지/FAQ, 알림 발송, 증빙 관리, 감사로그"
  },
  SEC: {
    role: "보안 관리자, 시스템 관리자, 감사 담당자, 승인권자",
    search: "관리자ID, 역할, 권한, IP, 기간, 작업유형, 승인상태, 이상징후",
    columns: "관리자, 역할/권한, 대상 메뉴, 작업유형, 사유, IP/기기, 승인상태, 작업시각",
    detail: "권한 범위, 접근 이력, 작업 전후 값, 조회 사유, 마스킹 해제 여부, 승인/반려 이력",
    actions: "권한 부여/회수 상신, 세션 종료, 설정 변경, 로그 다운로드, 이상 작업 확인",
    links: "관리자 계정, 역할/권한, 개인정보 조회 로그, 공통 설정, 승인선 관리, 감사로그"
  },
  DEFAULT: {
    role: "업무 담당자, 승인권자, 감사 담당자",
    search: "기간, 상태, 대상 식별자, 담당자, 처리유형, 관련 Case 번호",
    columns: "대상, 상태, 주요 값, 담당자, 요청일시, 최근 변경일시, 처리 결과",
    detail: "현재 상태, 원천 데이터, 관련 증빙, 처리 이력, 변경 전후 값, 연계 화면 링크",
    actions: "조회, 상세 열람, 담당자 배정, 메모 등록, 관련 화면 이동",
    links: "회원 기본조회, 업무 처리 이력, 승인함, 보고서 센터, 감사로그"
  }
};

function domainKey(menu) {
  const match = menu.code.match(/^ADM-([A-Z]+)-/);
  return match?.[1] && domainPolicies[match[1]] ? match[1] : "DEFAULT";
}

function detailFor(menu, tabName) {
  const domain = domainPolicies[domainKey(menu)];
  const words = `${menu.title} ${tabName}`;
  const isApproval = hasAny(words, ["승인", "결재", "상신", "반려", "검토", "의결"]);
  const isHistory = hasAny(words, ["이력", "로그", "감사"]);
  const isSetting = hasAny(words, ["설정", "정책", "관리", "변경"]);
  const isRisk = hasAny(words, ["차단", "제한", "위험", "리스크", "보류", "이상"]);
  const isMonitoring = hasAny(words, ["요약", "현황", "모니터링", "실시간", "기간별", "집계"]);

  const approval = isApproval || isSetting || isRisk
    ? "등록, 변경, 해제, 제한 적용, 대량 처리, 외부 보고 값 확정은 결재 상신 후 승인 완료 시 실행한다."
    : "조회와 단순 필터링은 결재 없이 가능하되, 상태 변경이나 데이터 추출이 발생하면 승인 흐름으로 전환한다.";

  const actions = [
    domain.actions,
    isMonitoring ? "알림 확인, 추이 비교, 드릴다운 조회, 담당 업무 큐 이동" : "",
    isApproval ? "상신, 승인, 반려, 보완 요청, 승인선 변경, 승인 결과 반영" : "",
    isHistory ? "변경 전후 비교, 감사 로그 다운로드, 관련 승인 건 역추적" : "",
    isSetting ? "설정 초안 저장, 영향도 검증, 적용 예약, 비활성 처리, 롤백 요청" : "",
    isRisk ? "위험 근거 확인, 차단/해제 요청, 보류 처리, 후속 Case 연결" : ""
  ].filter(Boolean).join(", ");

  return {
    name: tabName,
    purpose: `${menu.title}의 ${tabName} 탭은 ${domain.role}가 ${menu.purpose} 업무를 ${tabName} 관점에서 판단하고 다음 처리 화면으로 자연스럽게 이동하도록 설계한다.`,
    search: addContext(domain.search, tabName, "검색"),
    columns: addContext(domain.columns, tabName, "목록"),
    detail: addContext(domain.detail, tabName, "상세"),
    actions,
    approval,
    links: domain.links,
    audit: "조회 사유, 검색 조건, 마스킹 해제, 다운로드, 등록/수정/삭제, 승인/반려, 실행 결과와 실패 사유를 관리자 감사로그로 남긴다."
  };
}

function addContext(base, tabName, mode) {
  if (mode === "검색") return `${base}, ${tabName} 상태/구분`;
  if (mode === "목록") return `${base}, ${tabName} 주요 판단값`;
  return `${base}, ${tabName}별 판단 기준, 운영자 메모, 관련 증빙`;
}

function hasAny(text, words) {
  return words.some((word) => text.includes(word));
}

function renderTabDetails(menu) {
  const tabs = menu.tabs && menu.tabs.length ? menu.tabs : ["업무 요약", "대상 상세", "처리·조치", "이력·감사"];
  const lines = ["## 탭별 상세 설계", ""];
  for (const tab of tabs) {
    const detail = detailFor(menu, tab);
    lines.push(`### ${detail.name}`);
    lines.push("");
    lines.push(`- 업무 목적: ${detail.purpose}`);
    lines.push(`- 검색 조건: ${detail.search}`);
    lines.push(`- 목록 컬럼: ${detail.columns}`);
    lines.push(`- 상세보기 정보: ${detail.detail}`);
    lines.push(`- 주요 기능: ${detail.actions}`);
    lines.push(`- 결재/승인: ${detail.approval}`);
    lines.push(`- 연계 메뉴: ${detail.links}`);
    lines.push(`- 권한/감사: ${detail.audit}`);
    lines.push("");
  }
  return lines;
}

function replaceOrInsertTabDetails(text, lines) {
  const source = text.split(/\r?\n/);
  const existingStart = source.findIndex((line) => line.trim() === "## 탭별 상세 설계");
  if (existingStart !== -1) {
    let existingEnd = source.length;
    for (let index = existingStart + 1; index < source.length; index += 1) {
      if (/^##\s+/.test(source[index])) {
        existingEnd = index;
        break;
      }
    }
    return [...source.slice(0, existingStart), ...lines, ...source.slice(existingEnd)].join("\n");
  }

  const tabsStart = source.findIndex((line) => line.trim() === "## 탭 구성");
  if (tabsStart === -1) {
    return `${text.trimEnd()}\n\n${lines.join("\n")}\n`;
  }

  let tabsEnd = source.length;
  for (let index = tabsStart + 1; index < source.length; index += 1) {
    if (/^##\s+/.test(source[index])) {
      tabsEnd = index;
      break;
    }
  }

  return [...source.slice(0, tabsEnd), "", ...lines, ...source.slice(tabsEnd)].join("\n");
}

let changed = 0;

for (const menu of listMenus()) {
  const filePath = path.join(menusDir, `${menu.code}.md`);
  const before = fs.readFileSync(filePath, "utf8");
  const after = replaceOrInsertTabDetails(before, renderTabDetails(menu));
  if (after !== before) {
    fs.writeFileSync(filePath, after, "utf8");
    changed += 1;
  }
}

console.log(`Updated tab detail sections in ${changed} menu docs.`);

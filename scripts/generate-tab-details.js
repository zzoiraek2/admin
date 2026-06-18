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
    links: "회원 기본조회, KYC 심사 대기, 고객확인 현황조회, 로그인·보안 조회, 입출금 조회, 차단 등록/해제, 상담 이력"
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
    search: "프로젝트명, 자산명, 심사상태, 담당자, 위험등급, 신청일, 의결 결과",
    columns: "프로젝트/자산, 단계, 담당자, 위험등급, 신청일, 마감일, 의결 결과, 후속 조치",
    detail: "신청서, 프로젝트 정보, 제출자료, 체크리스트, 리스크 검토, 의결 근거, 공지/거래상태, 변경 이력",
    actions: "신청 접수 확인, 자료 요청, 보완 요청, 심사 의견 등록, 의결 상신, 거래상태 변경 예약",
    links: "거래지원 신청 접수, 거래지원 심사, 프로젝트 정보관리, 제출자료 관리, 거래상태 관리, 공지 관리, 시장감시, 감사로그"
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

function specialDetail(menu, tabName) {
  if (menu.code === "ADM-MEM-001" && tabName === "KYC 상태·이력") {
    return {
      name: tabName,
      purpose: "회원 기본조회 안에서 해당 회원의 KYC 현재 상태, 최종 심사 결과, 보완/반려 이력, 재이행 필요 여부를 빠르게 확인하는 조회 탭이다. 실제 승인·반려 처리는 KYC 심사 대기 메뉴로 이동해 수행한다.",
      search: "회원번호, UID, 이름, CI/DI, KYC 상태, 심사유형, 최종 심사일, 재이행 만료일",
      columns: "회원번호, KYC 등급, 현재 상태, 최종 결과, 최종 심사일, 보완/반려 사유, 재이행 필요 여부, 심사 상세 링크",
      detail: "최근 KYC 신청 요약, 제출 서류 상태, OCR/안면인증 결과 요약, 직업/거래목적 요약, 반려/보완 이력, 재이행 만료일, 관련 심사 Case 링크",
      actions: "KYC 심사 상세 열기, 고객확인 현황조회 이동, 제출서류 요약 열람, 반려/보완 사유 확인, 상담 메모 참고",
      approval: "이 탭에서는 승인, 반려, 보완요청, 상태 변경을 직접 수행하지 않는다. 처리 액션은 ADM-MEM-008 KYC 심사 대기에서 권한과 승인 흐름에 따라 수행한다.",
      links: "ADM-MEM-008 KYC 심사 대기, ADM-MEM-009 고객확인 현황조회, ADM-MEM-001 회원 기본조회, 상담 이력, 감사로그",
      audit: "KYC 정보 조회, 증빙 열람, 마스킹 해제, 관련 Case 이동 이력을 남기며 처리성 로그는 KYC 심사 대기에서 남긴다."
    };
  }

  if (menu.code === "ADM-MEM-008") {
    return kycReviewDetail(tabName);
  }

  if (menu.code === "ADM-LIST-003") {
    return listingInitialDetail(tabName);
  }
  if (menu.code === "ADM-LIST-004") {
    return listingMaintainDetail(tabName);
  }
  if (menu.code === "ADM-LIST-005") {
    return listingDelistDetail(tabName);
  }

  return null;
}

function kycReviewDetail(tabName) {
  const base = {
    role: "KYC 심사 담당자, 준법 담당자, 승인권자",
    links: "회원 기본조회, 고객확인 현황조회, 로그인·보안 조회, 입출금 제한, 상담 이력, 감사로그"
  };
  const byTab = {
    "심사 큐": {
      purpose: "신규·재이행·보완 KYC 심사 대상자를 업무 큐로 관리하고 담당자, SLA, 위험도 기준으로 우선순위를 정하는 처리 탭이다.",
      search: "접수일시, 심사유형, 회원번호, KYC 단계, 제출상태, 위험등급, 담당자, SLA 초과 여부",
      columns: "접수일시, 회원번호, 심사유형, 제출상태, 위험등급, 담당자, SLA, 보완횟수, 처리상태",
      detail: "회원 요약, 신청 경로, 심사 유형, 제출 완료 여부, 이전 반려/보완 이력, 우선처리 사유",
      actions: "담당자 배정, 우선순위 변경, 심사 상세 진입, 보류 사유 등록, 관련 회원 화면 이동",
      approval: "담당자 배정과 단순 보류는 결재 없이 가능하되 고위험 예외 처리나 강제 진행은 승인 로그를 남긴다."
    },
    "신청·증빙": {
      purpose: "회원이 제출한 신분증, 얼굴 인증, 직업, 거래목적, 추가 증빙의 완전성과 유효성을 확인하는 탭이다.",
      search: "회원번호, 제출일시, 증빙유형, 제출상태, 만료 여부, 보완 요청 여부",
      columns: "회원번호, 증빙유형, 제출상태, OCR 결과, 유효기간, 보완 필요, 최근 제출일",
      detail: "신분증 이미지, OCR 추출값, 안면인증 캡처, 직업/거래목적, 자금원천 증빙, 제출 변경 이력",
      actions: "증빙 열람, 마스킹 해제 요청, 보완 필요 항목 체크, 보완 요청 초안 작성",
      approval: "민감증빙 다운로드나 마스킹 해제는 별도 권한과 사유 입력을 요구한다."
    },
    "OCR·안면인증": {
      purpose: "자동 검증 결과와 실패 사유를 확인하고 수동 판정이 필요한 케이스를 분리하는 탭이다.",
      search: "회원번호, OCR 결과, 안면인증 결과, 실패코드, 수동검토 필요 여부",
      columns: "회원번호, OCR 일치율, 안면일치율, 실패코드, 자동판정, 수동검토 여부, 재시도 횟수",
      detail: "OCR 원문/수정값 비교, 얼굴 일치율, 실패 원인, 재시도 이력, 기기/IP 정보",
      actions: "수동검토 지정, 재제출 요청, 자동판정 근거 확인, 실패코드 메모 등록",
      approval: "자동 실패를 수동 통과 처리하는 경우 승인자 확인과 사유 기록을 필수로 둔다."
    },
    "검토·보완": {
      purpose: "심사자가 제출 정보와 증빙을 검토하고 보완 요청, 보류, 내부 검토 의견을 남기는 처리 탭이다.",
      search: "회원번호, 검토상태, 보완유형, 담당자, 보완기한, 위험등급",
      columns: "회원번호, 검토상태, 보완항목, 보완기한, 담당자, 위험등급, 최근 코멘트",
      detail: "검토 체크리스트, 보완 요청 항목, 내부 의견, 고객 안내 문구, 관련 상담 이력",
      actions: "보완 요청, 내부 메모, 보류 처리, 추가 증빙 요청, 검토 완료 처리",
      approval: "보완 요청은 담당자 권한으로 가능하되 고위험 보류나 예외 인정은 승인 흐름을 태운다."
    },
    "승인·반려": {
      purpose: "KYC 승인, 반려, 조건부 승인, 재심사 요청을 최종 처리하는 탭이다.",
      search: "회원번호, 최종판정, 승인자, 반려사유, 처리일시, 고위험 여부",
      columns: "회원번호, 최종판정, 반려/승인 사유, 승인자, 처리일시, 제한 변경 여부",
      detail: "최종 판정 근거, 체크리스트 결과, 반려 사유, 고객 안내 문구, 승인 전후 KYC 상태",
      actions: "승인, 반려, 조건부 승인, 재심사 요청, 고객 통지 예약, 처리 결과 반영",
      approval: "고위험, PEP, 제재 의심, 수동 예외 승인 건은 2단계 승인 또는 준법 검토 후 확정한다."
    },
    "제한·후속조치": {
      purpose: "KYC 결과에 따른 거래·입출금 제한, 재이행 요청, 차단 연계, 고객 안내 등 후속 조치를 관리한다.",
      search: "회원번호, 후속조치 유형, 제한상태, 차단사유, 통지상태, 처리결과",
      columns: "회원번호, 후속조치, 제한범위, 차단사유, 통지상태, 처리결과, 담당자",
      detail: "제한 전후 상태, 차단 등록 연계, 고객 통지 이력, 재이행 기한, 후속 Case",
      actions: "제한 적용 요청, 차단 등록 연계, 재이행 안내, 통지 재발송, 후속 Case 생성",
      approval: "거래·입출금 제한 적용과 해제는 차단/해제 승인 정책과 연동한다."
    },
    "감사로그": {
      purpose: "KYC 심사 과정의 조회, 증빙 열람, 판정, 보완 요청, 승인/반려 이력을 감사 기준으로 추적한다.",
      search: "회원번호, 관리자ID, 작업유형, 기간, IP, 승인결과",
      columns: "작업일시, 관리자, 작업유형, 대상 회원, 사유, IP, 변경 전후 값",
      detail: "조회 사유, 마스킹 해제 사유, 판정 전후 상태, 승인선, 고객 통지 여부",
      actions: "감사 로그 조회, 변경 전후 비교, 로그 다운로드, 관련 승인 건 이동",
      approval: "감사 로그는 수정할 수 없고 다운로드는 별도 권한과 사유 입력을 요구한다."
    }
  };

  const item = byTab[tabName];
  return item && {
    name: tabName,
    ...item,
    links: base.links,
    audit: "심사자, 승인자, 조회 사유, 증빙 열람, 마스킹 해제, 승인/반려, 고객 통지와 상태 반영 결과를 관리자 감사로그로 남긴다."
  };
}

function listingInitialDetail(tabName) {
  const byTab = {
    "거래지원 신청 접수": {
      purpose: "거래지원 신청 홈페이지 또는 외부 신청 채널에서 접수된 신규 거래지원 신청서를 최초로 확인하는 탭이다. 심사는 신청 접수 정보가 완전해야 다음 단계로 넘어간다.",
      search: "신청일시, 신청번호, 신청경로, 프로젝트명, 자산명, 심볼, 신청자, 접수상태, 보완요청 여부",
      columns: "신청일시, 신청번호, 프로젝트명, 자산명/심볼, 신청자, 신청경로, 접수상태, 제출자료 완성도",
      detail: "신청 목적, 프로젝트 개요, 홈페이지, 백서, 법인/재단 정보, 담당자 연락처, 신청서 원문, 제출자료 목록",
      actions: "신청 접수 확인, 중복 신청 검토, 접수 반려, 보완 요청, 담당자 배정, 프로젝트 기초정보 생성",
      approval: "접수 확인은 담당자 권한으로 가능하되 접수 반려나 심사 개시 확정은 사유와 승인 로그를 남긴다."
    },
    "신청서·프로젝트 정보": {
      purpose: "신청서에 입력된 프로젝트 목적, 사업 구조, 토큰 정보, 발행주체 정보를 심사 가능한 내부 기준 정보로 정리한다.",
      search: "프로젝트명, 법인/재단명, 자산명, 심볼, 네트워크, 홈페이지, 백서 제출 여부",
      columns: "프로젝트명, 자산명/심볼, 발행주체, 네트워크, 홈페이지, 백서, 담당자, 정보 검증상태",
      detail: "프로젝트 목적, 서비스 개요, 토큰 유틸리티, 발행/유통 구조, 팀/법인 정보, 공식 채널, 외부 링크 검증",
      actions: "프로젝트 정보 보정, 공식 링크 검증, 내부 메모 등록, 보완 요청, 프로젝트 정보관리 연계",
      approval: "신청서 원문을 변경하지 않고 내부 관리 정보 보정은 변경 이력과 담당자 사유를 남긴다."
    }
  };
  return listingReviewDetail(tabName, byTab);
}

function listingMaintainDetail(tabName) {
  const byTab = {
    "유지심사 대상 선정": {
      purpose: "정기점검, 공시 변경, 유통량 이슈, 시장/준법 이벤트로 유지심사 대상이 된 프로젝트를 접수하고 심사 범위를 확정한다.",
      search: "대상 선정일, 프로젝트명, 자산명, 선정 사유, 이벤트 유형, 담당자, 상태",
      columns: "선정일, 프로젝트명, 자산명, 선정 사유, 위험등급, 담당자, 심사상태, 마감일",
      detail: "대상 선정 근거, 최근 공시/자료, 유통량 변동, 리스크 이벤트, 이전 심사 이력",
      actions: "대상 확정, 담당자 배정, 자료 요청, 심사 범위 지정, 유지심사 Case 생성",
      approval: "거래상태 변경 가능성이 있는 유지심사 개시는 승인자 확인을 거치도록 설계한다."
    },
    "프로젝트 현황": {
      purpose: "현재 거래지원 중인 프로젝트의 최신 사업, 기술, 유통량, 공시, 커뮤니티 상태를 심사 맥락으로 확인한다.",
      search: "프로젝트명, 자산명, 공시상태, 유통량 검증상태, 리스크 이벤트, 자료 갱신일",
      columns: "프로젝트명, 자산명, 최신 자료일, 유통량 상태, 공시상태, 리스크 이벤트, 담당자",
      detail: "프로젝트 최신 개요, 공식 링크, 공시/자료 변경, 유통량 계획 대비 실적, 이전 조치 이력",
      actions: "프로젝트 정보 갱신, 자료 요청, 리스크 메모, 공시 확인, 관련 조치 화면 이동",
      approval: "프로젝트 현황 정보 수정은 변경 전후 값과 근거를 남기고 주요 정보 변경은 승인 대상으로 둔다."
    }
  };
  return listingReviewDetail(tabName, byTab);
}

function listingDelistDetail(tabName) {
  const byTab = {
    "종료심사 사유 접수": {
      purpose: "거래지원 종료 검토가 필요한 사유를 접수하고 종료심사 Case의 근거와 범위를 확정한다.",
      search: "접수일, 프로젝트명, 자산명, 종료 검토 사유, 이벤트 유형, 담당자, 상태",
      columns: "접수일, 프로젝트명, 자산명, 종료 사유, 위험등급, 담당자, 심사상태, 공지 필요 여부",
      detail: "종료 검토 사유, 법률/기술/시장 근거, 유통량/공시 이슈, 관련 민원, 이전 유의종목 이력",
      actions: "종료심사 Case 생성, 사유 분류, 담당자 배정, 자료 요청, 유의종목/거래상태 화면 이동",
      approval: "종료심사 개시와 대외 공지 연계는 승인자 확인과 사유 기록을 요구한다."
    },
    "종료 영향 분석": {
      purpose: "거래지원 종료가 회원, 미체결 주문, 입출금, 지갑, 공지, 정산에 미치는 영향을 점검한다.",
      search: "자산명, 보유 회원수, 미체결 주문, 입출금 상태, 공지상태, 종료 예정일",
      columns: "자산명, 보유 회원수, 미체결 주문, 입출금 가능 여부, 지갑 상태, 공지 필요, 담당자",
      detail: "회원 보유 현황, 주문/체결 영향, 입출금 중단 계획, 지갑 회수/보관, 고객 통지 계획",
      actions: "영향도 산출, 입출금 정책 연계, 공지 초안 생성, 거래상태 변경 예약, 보고서 추출",
      approval: "거래종료 일정 확정, 입출금 중단, 고객 공지는 결재 완료 후 적용한다."
    }
  };
  return listingReviewDetail(tabName, byTab);
}

function listingReviewDetail(tabName, overrides) {
  const common = {
    "자료·체크리스트": {
      purpose: "신청 또는 심사 대상 프로젝트의 필수 제출자료와 내부 체크리스트 충족 여부를 확인한다.",
      search: "프로젝트명, 자산명, 자료유형, 제출상태, 보완기한, 담당자",
      columns: "자료유형, 제출상태, 검토상태, 보완 필요, 담당자, 최근 제출일, 만료 여부",
      detail: "백서, 법률의견, 기술자료, 유통량 자료, 보안감사 자료, 보완 요청 이력",
      actions: "자료 열람, 보완 요청, 체크리스트 판정, 내부 의견 등록, 자료요청 이력 이동",
      approval: "필수자료 면제나 예외 인정은 승인자 사유 확인 후 처리한다."
    },
    "리스크 검토": {
      purpose: "법률, 기술, 유통량, 시장, 준법 리스크를 종합 검토하고 거래지원 가능성을 판단한다.",
      search: "프로젝트명, 자산명, 리스크 유형, 위험등급, 검토자, 검토상태",
      columns: "리스크 유형, 위험등급, 검토결과, 근거자료, 담당자, 조치 필요 여부",
      detail: "법률 검토, 기술 검토, 유통량 검토, 제재/AML 검토, 시장감시 의견, 보완 필요 사항",
      actions: "리스크 의견 등록, 준법 검토 요청, 보완 요청, 검토 완료, 의결 안건 생성",
      approval: "고위험 또는 예외 승인 필요 항목은 의결·승인 탭에서 승인 흐름으로 확정한다."
    },
    "의결·승인": {
      purpose: "심사 의견과 리스크 검토 결과를 기반으로 거래지원 여부를 의결하고 승인 결과를 확정한다.",
      search: "프로젝트명, 자산명, 의결상태, 승인자, 의결일, 결과",
      columns: "프로젝트명, 자산명, 의결상태, 의결결과, 승인자, 승인일, 반려/보류 사유",
      detail: "의결 안건, 심사 요약, 리스크 검토 결과, 승인선, 반려/보류 사유, 조건부 승인 조건",
      actions: "의결 상신, 승인, 반려, 보류, 조건부 승인, 결과 통지, 거래지원 준비 연계",
      approval: "의결·승인 결과는 승인 완료 전까지 거래상태와 대외 공지에 반영하지 않는다."
    },
    "조치·이력": {
      purpose: "심사 결과 이후 거래상태, 공지, 자료 보관, 변경 이력, 후속 조치를 추적한다.",
      search: "프로젝트명, 자산명, 조치유형, 처리상태, 담당자, 처리일",
      columns: "조치유형, 처리상태, 담당자, 처리일, 관련 화면, 결과, 감사로그",
      detail: "거래상태 변경, 공지 이력, 자료 보관, 승인 결과, 변경 전후 값, 후속 업무 링크",
      actions: "관련 조치 이동, 변경 이력 조회, 보고서 다운로드, 감사로그 확인",
      approval: "거래상태 변경, 공지 게시, 종료 일정 확정 등 외부 영향이 있는 조치는 승인 완료 후 실행한다."
    }
  };
  const item = overrides[tabName] || common[tabName];
  return item && {
    name: tabName,
    ...item,
    links: "거래지원 신청 접수, 거래지원 심사, 프로젝트 정보관리, 제출자료 관리, 거래상태 관리, 공지 관리, 시장감시, 감사로그",
    audit: "신청서 조회, 자료 열람, 보완 요청, 심사 의견, 의결 상신, 승인/반려, 거래상태 변경과 공지 연계를 감사로그로 남긴다."
  };
}

function detailFor(menu, tabName) {
  const special = specialDetail(menu, tabName);
  if (special) return special;

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

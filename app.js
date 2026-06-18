const state = {
  rows: [],
  filteredRows: [],
  activeId: null,
  query: "",
  status: "all",
  canEdit: false,
  dataSource: "loading"
};

const specialPolicies = {
  "ADM-RISK-013": {
    type: "fieldList",
    title: "KYT VASP 차단 관리 기준",
    summary:
      "KYT VASP 차단 관리는 Chainalysis 등 KYT 기준에서 차단 또는 주의 대상으로 관리할 VASP, 거래소, OTC 채널 식별 정보를 관리하는 기준정보 화면이다. 입력 항목은 VASP 식별과 차단목록 판단에 필요한 최소 컬럼으로 제한한다.",
    principles: [
      "미신고 VASP 관리는 별도 메뉴로 두지 않고 KYT VASP 차단 관리에서 통합 관리한다.",
      "이 화면은 입출금 차단 행위를 직접 생성하는 화면이 아니라 KYT 판단과 차단 정책에서 참조할 VASP 식별 목록을 관리한다.",
      "VASP명, Cluster Name, Site, Status, 내부 비고를 기준으로 동일 VASP의 alias와 사이트 기반 식별 정보를 추적한다.",
      "Cluster Name이 확인되지 않은 경우에도 Site와 내부 비고를 기준으로 관리할 수 있어야 한다.",
      "등록 데이터는 KYT Alert, 입출금 VASP 검증, 차단 등록 정책에서 참조될 수 있어야 한다."
    ],
    fields: [
      { name: "No", policy: "목록 표시 순번 또는 관리 순번" },
      { name: "VASP명", policy: "내부에서 식별하는 VASP, 거래소, OTC 채널, 서비스명" },
      { name: "Cluster Name", policy: "Chainalysis 등 외부 분석도구에서 식별되는 클러스터명 또는 alias" },
      { name: "Site", policy: "공식 사이트, 도메인, 텔레그램 채널 등 식별 URL" },
      { name: "Status", policy: "exchange 등 VASP 또는 채널 분류 상태" },
      { name: "내부 비고", policy: "클러스터 미확인, 사이트 기반 관리, alias 필요 등 내부 운영 메모" }
    ]
  },
  "ADM-RISK-001": {
    type: "approvalFlow",
    title: "차단 등록 정책",
    summary:
      "차단 등록은 고객 대상자를 지정하고 차단 사유코드와 차단 범위를 선택한 뒤 승인 프로세스를 거쳐 적용하는 고위험 업무다. FDS, KYT, KYC, 제재국가, 트래블룰 등 자동 차단 이벤트도 동일한 정책 단위로 기록하고 관리한다.",
    principles: [
      "차단 등록은 고객 대상자 지정 없이 처리할 수 없으며 회원번호, 계정, 지갑주소, 관련 Case를 함께 연결한다.",
      "차단 사유는 ADM-RISK-003 차단 사유코드 중 하나를 선택하고 필요 시 세부 사유와 증빙을 첨부한다.",
      "수동 등록과 자동 등록을 구분하고, 자동 등록은 발생 룰과 탐지 시스템, 원 이벤트 ID를 저장한다.",
      "등록 요청은 즉시 적용하지 않고 사유, 범위, 증빙, 영향도를 검토한 뒤 승인 완료 시 적용한다.",
      "차단 등록, 승인, 반려, 보완요청, 적용 실패, 자동 등록 이벤트는 모두 감사로그로 남긴다."
    ],
    stages: [
      { step: "1", name: "대상자 지정", owner: "요청자", policy: "회원번호, 이름/식별자, 계정상태, 지갑주소, 관련 FDS/KYT/KYC Case를 확인하고 단일 또는 복수 대상자를 지정한다." },
      { step: "2", name: "차단 사유 선택", owner: "요청자", policy: "ADM-RISK-003 사유코드를 선택하고 등록 사유, 증빙, 차단 필요 기간, 긴급 여부를 입력한다." },
      { step: "3", name: "차단 범위 설정", owner: "요청자", policy: "로그인, 거래, 입금, 출금, 입고, 출고, 전체 차단 중 적용 범위를 선택하고 부분 차단 여부를 기록한다." },
      { step: "4", name: "결재 요청", owner: "승인자", policy: "고위험 차단은 승인 전 적용을 금지한다. 긴급 차단은 선적용 후 사후승인 정책을 별도로 표시한다." },
      { step: "5", name: "차단 적용", owner: "시스템", policy: "승인 완료 시 차단 상태를 적용하고 회원 상태, 입출금 제한, FDS/KYT Case와 동기화한다." },
      { step: "6", name: "로그/통지", owner: "시스템", policy: "요청자, 승인자, 적용 시각, 전후 상태, 사유코드, 관련 증빙, 고객 안내 여부를 기록한다." }
    ],
    requirements: [
      { area: "등록 대상", policy: "회원번호 기반 고객 대상자를 필수로 지정한다. 지갑주소나 거래만 있는 경우에도 연결 회원을 확인하거나 미확인 상태로 별도 Case를 만든다." },
      { area: "자동 등록", policy: "FDS시스템 차단, KYT Alert, 제재국가 IP, 트래블룰 미준수, KYC 미흡, 미신고 VASP 등은 자동 등록 후보로 수집하고 승인 정책에 따라 적용한다." },
      { area: "수동 등록", policy: "운영자 수동 등록은 차단 사유, 증빙, 대상 범위, 요청 부서, 만료 예정일을 필수로 입력한다." },
      { area: "블랙리스트 지갑", policy: "블랙리스트 지갑주소 등록은 주소, 네트워크, 위험 출처, 관련 Case, 적용 범위(입고/출고)를 기록하고 승인 후 입출고 차단 정책과 연동한다." },
      { area: "기관 요청", policy: "법원 동결, 행정기관 보전처분, 수사기관 협조 요청은 요청기관, 문서번호, 요청일, 대상 회원/계좌/주소, 차단 범위, 해제 조건을 필수로 기록한다." },
      { area: "사건 기록형", policy: "정기점검, 전산장애, 메인넷 업그레이드, 하드포크, 토큰스왑 같은 사건은 등록만으로 고객 차단을 발생시키지 않는다. 사건 발생일과 보고 기준만 관리대장 집계에 반영한다." },
      { area: "결재/승인", policy: "등록 요청, 긴급 등록, 대량 등록, 차단 범위 확대는 승인 프로세스를 태운다. 승인 전후 값과 반려 사유를 보관한다." },
      { area: "감사로그", policy: "누가 어떤 대상자를 어떤 사유로 어떤 범위까지 차단했는지 전후 상태와 함께 변경 불가능한 로그로 남긴다." }
    ]
  },
  "ADM-RISK-002": {
    type: "approvalFlow",
    title: "차단 해제 승인 정책",
    summary:
      "차단 해제는 FDS에 걸린 고객, 수동 차단 등록 대상자, KYC·제재·트래블룰 사유로 제한된 고객의 차단 상태를 검토 후 승인으로 해제하는 업무다. 원 차단 사유와 해제 사유를 함께 확인해야 하며 단순 버튼 처리로 구현하지 않는다.",
    principles: [
      "차단 해제는 원 차단 기록이 있는 대상자만 요청할 수 있고 원 차단 사유, 등록자, 승인자, 적용 범위를 함께 보여준다.",
      "해제 요청은 해제 사유, 증빙, 관련 Case 조치 결과, 고객 안내 여부를 포함해야 한다.",
      "FDS, KYT, KYC, 제재, 수사기관 요청 등 사유별로 해제 가능 조건과 승인 단계를 분리한다.",
      "부분 해제, 전체 해제, 보류, 반려, 해제 불가 상태를 명확히 구분한다.",
      "승인 완료 전에는 차단 상태를 변경하지 않고, 승인 후 시스템 적용 결과와 실패 사유를 기록한다."
    ],
    stages: [
      { step: "1", name: "차단 대상 조회", owner: "요청자", policy: "차단 상태인 회원을 조회하고 원 차단 사유코드, 차단 범위, 차단 등록 경로, 관련 Case를 확인한다." },
      { step: "2", name: "해제 요청 작성", owner: "요청자", policy: "해제 사유, 조치 결과, 증빙, 해제 범위, 고객 안내 필요 여부를 입력한다." },
      { step: "3", name: "위험 검토", owner: "승인자", policy: "FDS/KYT Alert, KYC 상태, 제재 여부, 입출금 위험도, 미해결 Case를 확인해 해제 가능 여부를 판단한다." },
      { step: "4", name: "승인/반려/보류", owner: "승인자", policy: "해제 승인, 반려, 보완요청, 보류, 해제 불가 중 하나로 처리하고 판단 사유를 필수 입력한다." },
      { step: "5", name: "해제 적용", owner: "시스템", policy: "승인 완료 시 선택한 범위만 해제하고 회원 상태, 입출금 제한, FDS/KYT Case를 동기화한다." },
      { step: "6", name: "사후 기록", owner: "시스템", policy: "원 차단 사유와 해제 사유, 승인자, 적용 결과, 실패 여부, 고객 통지 이력을 감사로그로 보관한다." }
    ],
    requirements: [
      { area: "해제 대상", policy: "FDS에 걸린 고객, 수동 차단 등록 고객, KYC 미흡 고객, 제재국가·트래블룰·KYT 사유 차단 고객을 해제 대상으로 조회한다." },
      { area: "원 차단 정보", policy: "원 차단 사유코드, 차단 등록자, 등록 승인자, 등록일, 차단 범위, 증빙, 관련 Case를 해제 화면에서 함께 보여준다." },
      { area: "해제 범위", policy: "전체 해제와 부분 해제를 구분한다. 출금만 해제, 입금만 해제, 로그인 유지 차단 등 범위별 처리를 지원한다." },
      { area: "승인 프로세스", policy: "해제는 승인 완료 후 적용한다. 고위험 사유는 2단계 승인 또는 준법 검토를 거치도록 설계한다." },
      { area: "감사로그", policy: "해제 요청자, 승인자, 해제 사유, 증빙, 전후 제한 상태, 적용 결과, 반려/보류 사유를 보관한다." }
    ]
  },
  "ADM-RISK-003": {
    type: "reasonCode",
    title: "차단 사유코드 정책",
    summary:
      "차단 사유코드는 코인거래소의 가상자산 입출고 기준과 원화거래소의 예치금 입출금 기준을 분리해 관리한다. 사유별 보고 기준과 건 수 산출 기준은 운영 처리, 보고서, 감사로그의 공통 기준으로 사용한다.",
    principles: [
      "사유 번호 1~13은 보고 기준 코드로 관리하고, 동일 번호 안에서도 업무 사유는 복수 행으로 관리한다.",
      "코인거래소 적용 사유와 원화거래소 적용 사유를 분리하되, 같은 의미의 사유는 동일 번호로 매핑한다.",
      "건 수 산출 기준은 사건발생일, 가상자산종목수, 이용자수 중 하나를 기본값으로 둔다.",
      "입금, 출금, 입고, 출고 차단 방향과 적용 범위를 코드 속성으로 관리한다.",
      "사유코드 생성, 수정, 사용중지, 보고 기준 변경은 승인과 감사로그 대상이다."
    ],
    rows: [
      { no: "1", virtualReason: "가상자산거래를 위한 정보시스템(사업자 자체 플랫폼) 전산장애 또는 보수점검", virtualCount: "사건발생일", fiatReason: "가상자산거래를 위한 정보시스템(사업자 자체 플랫폼) 전산장애 또는 보수점검", fiatCount: "사건발생일" },
      { no: "1", virtualReason: "가상자산거래를 위한 정보시스템(지갑시스템, 개인지갑업체) 전산장애 또는 보수점검", virtualCount: "사건발생일", fiatReason: "", fiatCount: "" },
      { no: "1", virtualReason: "", virtualCount: "", fiatReason: "가상자산거래를 위한 정보시스템(입출금서비스제공업체) 전산장애 또는 보수점검", fiatCount: "사건발생일" },
      { no: "1", virtualReason: "메인넷 업그레이드, 하드포크, 토큰스왑, 리브랜딩 등 가상자산 발행·관리 블록체인 네트워크 전산장애 또는 보수점검", virtualCount: "가상자산종목수", fiatReason: "", fiatCount: "" },
      { no: "2", virtualReason: "가상자산 거래를 위한 정보통신망(통신사, 서버 등) 전산장애 또는 보수점검", virtualCount: "사건발생일", fiatReason: "가상자산 거래를 위한 정보통신망(통신사, 서버 등) 전산장애 또는 보수점검", fiatCount: "사건발생일" },
      { no: "2", virtualReason: "2채널 인증수단의 전산장애 또는 보수점검", virtualCount: "사건발생일", fiatReason: "2채널 인증수단의 전산장애 또는 보수점검", fiatCount: "사건발생일" },
      { no: "3", virtualReason: "", virtualCount: "", fiatReason: "관리기관·실명계정은행 시스템 또는 네트워크의 전산장애 또는 보수점검", fiatCount: "사건발생일" },
      { no: "3", virtualReason: "", virtualCount: "", fiatReason: "관리기관·실명계정은행 시스템 일일 점검(예시: 매일 11:50~00:10)", fiatCount: "사건발생일" },
      { no: "4", virtualReason: "거래상대방 가상자산정보시스템 전산장애", virtualCount: "사건발생일", fiatReason: "", fiatCount: "" },
      { no: "5", virtualReason: "특정 가상자산의 거래지원 종료 절차 진행(입고만 차단)", virtualCount: "가상자산종목수", fiatReason: "", fiatCount: "" },
      { no: "6", virtualReason: "특정 가상자산 정기 실사", virtualCount: "사건발생일", fiatReason: "", fiatCount: "" },
      { no: "7", virtualReason: "직권말소, 영업정지명령 이행 또는 폐업(입고차단)", virtualCount: "사건발생일", fiatReason: "직권말소, 영업정지명령 이행 또는 폐업(입금차단)", fiatCount: "사건발생일" },
      { no: "8", virtualReason: "사업자에 대한 해킹, 전산장애 등 법상 사고 발생", virtualCount: "사건발생일", fiatReason: "사업자에 대한 해킹, 전산장애 등 법상 사고 발생", fiatCount: "사건발생일" },
      { no: "9", virtualReason: "가상자산 발행재단 해킹 및 전산장애 등", virtualCount: "가상자산종목수", fiatReason: "", fiatCount: "" },
      { no: "10", virtualReason: "행정기관의 강제집행 및 보전처분 등 요청, 명령", virtualCount: "이용자수", fiatReason: "행정기관의 강제집행 및 보전처분 등 요청, 명령", fiatCount: "이용자수" },
      { no: "11", virtualReason: "VPN을 통한 출금", virtualCount: "이용자수", fiatReason: "VPN을 통한 출금", fiatCount: "이용자수" },
      { no: "11", virtualReason: "트래블룰 솔루션(VV, CODE사)의 전산장애 또는 보수점검", virtualCount: "사건발생일", fiatReason: "", fiatCount: "" },
      { no: "11", virtualReason: "계정도용(해킹) 의심으로 인한 출금대기", virtualCount: "이용자수", fiatReason: "계정도용(해킹) 의심으로 인한 출금대기", fiatCount: "이용자수" },
      { no: "11", virtualReason: "실제소유주 의심", virtualCount: "이용자수", fiatReason: "실제소유주 의심", fiatCount: "이용자수" },
      { no: "11", virtualReason: "트래블룰 미준수 의심으로 인한 입고대기", virtualCount: "이용자수", fiatReason: "", fiatCount: "" },
      { no: "11", virtualReason: "고객 사망(상속절차 진행 중)", virtualCount: "이용자수", fiatReason: "고객 사망(상속절차 진행 중)", fiatCount: "이용자수" },
      { no: "11", virtualReason: "미신고 가상자산 거래소로의 입출고", virtualCount: "이용자수", fiatReason: "", fiatCount: "" },
      { no: "11", virtualReason: "제재국가 IP차단", virtualCount: "이용자수", fiatReason: "제재국가 IP차단", fiatCount: "이용자수" },
      { no: "11", virtualReason: "제재국가로부터 유입된 자금 관련 거래 차단", virtualCount: "이용자수", fiatReason: "제재국가로부터 유입된 자금 관련 거래 차단", fiatCount: "이용자수" },
      { no: "11", virtualReason: "체이널리시스 고위험 카테고리 거래 차단", virtualCount: "이용자수", fiatReason: "", fiatCount: "" },
      { no: "11", virtualReason: "확인되지 않은 지갑주소로의 출고", virtualCount: "이용자수", fiatReason: "", fiatCount: "" },
      { no: "11", virtualReason: "KYC 미이행 계정으로의 입고", virtualCount: "이용자수", fiatReason: "KYC 미이행 계정으로의 입금", fiatCount: "이용자수" },
      { no: "11", virtualReason: "KYC 재이행 만료 등 KYC가 미흡한 회원의 입출고", virtualCount: "이용자수", fiatReason: "KYC 재이행 만료 또는 KYC가 미흡한 회원의 입출금", fiatCount: "이용자수" },
      { no: "11", virtualReason: "FDS시스템 차단", virtualCount: "이용자수", fiatReason: "FDS시스템 차단", fiatCount: "이용자수" },
      { no: "11", virtualReason: "요주의인물", virtualCount: "이용자수", fiatReason: "요주의인물", fiatCount: "이용자수" },
      { no: "12", virtualReason: "24시간 출금지연제 및 72시간 출금지연제 등 전자통신금융사기 예방(출고차단)", virtualCount: "이용자수", fiatReason: "", fiatCount: "" },
      { no: "13", virtualReason: "범죄행위 예방을 위한 수사기관(검찰, 경찰) 등 요청", virtualCount: "이용자수", fiatReason: "범죄행위 예방을 위한 수사기관(검찰, 경찰) 등 요청", fiatCount: "이용자수" }
    ]
  },
  "ADM-RISK-004": {
    type: "ledger",
    title: "차단 관리대장 집계 정책",
    summary:
      "차단 관리대장은 차단 등록, 해제, 자동 차단 로그, 사건 기록형 등록을 원천으로 일별·월별 집계를 생성하고 사유코드별 산출 기준에 따라 숫자, 날짜, 전체, 종목수, 금액을 다르게 표시하는 보고/모니터링 화면이다.",
    principles: [
      "ADM-RISK-001의 차단 등록과 자동 차단 로그를 원천으로 삼되, 정기점검·전산장애 같은 사건 기록형 등록은 차단 행위가 아니라 사건 발생일 기준으로 집계한다.",
      "ADM-RISK-003의 건 수 산출 기준에 따라 이용자수, 가상자산종목수, 사건발생일, 전체, 금액 표시 방식을 결정한다.",
      "일별 집계는 차단일자 0시 기준 스냅샷과 발생 로그 누적을 함께 관리하고, 월별 집계는 일별 집계를 사유코드별로 합산 또는 목록화한다.",
      "최초 보고일자, 최초보고 문서번호, 차단사유 근거는 집계 행과 연결해 감사와 대외 보고 근거로 사용한다.",
      "수동 보정은 허용하되 보정 사유, 보정 전후 값, 승인자, 증빙을 남기고 원천 로그와 구분한다."
    ],
    sourceTypes: [
      { type: "자동 차단 로그", source: "FDS, KYT, KYC 미흡, 트래블룰, 제재국가, 고위험 지갑", ledgerRule: "발생 시점마다 회원, 사유코드, 차단 방향, 금액, Case ID를 기록하고 일별 집계에 반영한다." },
      { type: "수동 차단 등록", source: "운영자 차단 등록, 블랙리스트 지갑주소, 법원 동결, 수사기관 협조, 행정기관 요청", ledgerRule: "승인 완료 후 적용된 차단 상태를 원천으로 기록하고 대장 집계에 반영한다." },
      { type: "사건 기록형 등록", source: "정기점검, 전산장애, 메인넷 업그레이드, 하드포크, 토큰스왑, 유의종목·거래지원 종료", ledgerRule: "등록만으로 고객 차단을 만들지 않고 사건발생일, 대상 자산, 전체 여부를 보고값으로 관리한다." },
      { type: "수동 보정/보고 등록", source: "최초 보고 공문, 문서번호, 이전 집계 보정, 누락 데이터 보완", ledgerRule: "원천 로그와 별도 보정 행으로 관리하고 승인 후 일별·월별 집계에 반영한다." }
    ],
    aggregationRules: [
      { basis: "이용자수", display: "숫자 합계", example: "사유 11 KYC 미흡 회원 입출고 차단 122명", rule: "회원 기준 중복 제거 후 입금/출금/입고/출고 방향별 이용자수를 산출한다." },
      { basis: "가상자산종목수", display: "종목 수 또는 종목 목록", example: "BTC, ETH 2종 또는 전체", rule: "대상 자산 기준으로 산출하고 전체 자산 대상이면 전체로 표시한다." },
      { basis: "사건발생일", display: "날짜 목록 또는 발생일 수", example: "2026-06-18, 2026-06-21", rule: "해당 월에 2건이면 날짜 2개를 표시하고 필요 시 발생일 수로 집계한다." },
      { basis: "전체", display: "전체", example: "거래지원 종료로 전체 고객 입고차단", rule: "개별 이용자 로그가 없더라도 전체 대상 차단으로 표시하고 근거 사건을 연결한다." },
      { basis: "금액", display: "금액 합계", example: "2605월(5,495,691원)", rule: "출고 차단 대상 가상자산 금액과 출금 차단 대상 예치금 금액을 별도 합산한다." }
    ],
    tabs: [
      {
        name: "차단 관리대장",
        purpose: "사유코드별 일별·월별 집계와 보고값을 조회하는 탭이다. 기간 검색, 전월 기준 조회, 사유코드별 집계표, 최초 보고 근거를 한 화면에서 확인한다.",
        controls: [
          "기간검색: 차단일자 또는 보고 기준일 기준",
          "전월기준: 조회월의 전월 말 또는 전월 전체 기간 기준",
          "집계 단위: 일별, 월별",
          "차단사유: 1~13 사유코드",
          "대상 구분: 가상자산, 예치금, 전체",
          "차단 방향: 입금, 출금, 입고, 출고, 입출금/입출고 모두"
        ],
        columns: [
          "차단사유",
          "건수/보고값",
          "가상자산 종목수: 입고만·출고만·입출고 모두 차단",
          "가상자산 입출고 차단 이용자수: 입고차단·출고차단·입출고 모두 차단",
          "가상자산 출고 차단 대상 금액",
          "예치금 차단 이용자수: 입금만·출금만·입출금 모두 차단",
          "출금 차단 대상 예치금 금액",
          "최초 보고일자",
          "최초보고 문서번호",
          "차단사유 근거"
        ],
        policies: [
          "이용자수 기준은 숫자 합계로 표시하고 회원 중복 제거 기준을 명확히 한다.",
          "사건발생일 기준은 건수 숫자가 아니라 날짜 목록 또는 발생일 수로 표시한다.",
          "가상자산종목수 기준은 종목 수 또는 종목 목록을 표시하고 전체 대상이면 전체로 표시한다.",
          "월별 집계는 일별 집계를 사유코드별로 합산하되 날짜형 보고값은 날짜 목록으로 유지한다.",
          "집계값은 원천 로그와 수동 보정 이력을 추적할 수 있어야 한다."
        ]
      },
      {
        name: "원천 로그",
        purpose: "차단 행위와 사건 기록이 발생한 원천 행 단위 누적현황을 조회하는 탭이다. 관리대장 집계값의 산출 근거로 사용한다.",
        controls: [
          "기간검색: 차단일시, 통지일시, 재개(예정)일 기준",
          "전월기준: 전월 발생/유효 차단 로그 조회",
          "차단사유 검색",
          "차단대상 검색",
          "입출금 차단 구분 검색",
          "통지방법 검색",
          "재개 여부 검색"
        ],
        columns: [
          "순번",
          "차단대상",
          "입출금 차단 구분",
          "차단 사유",
          "차단대상 종목수",
          "가상자산 종목",
          "가상자산 종목명",
          "차단대상 이용자수",
          "통지방법",
          "차단일시",
          "통지일시",
          "재개(예정)일",
          "비고"
        ],
        policies: [
          "KYC, KYT, FDS 등 자동 로그는 발생 시점마다 사유코드와 함께 누적한다.",
          "블랙리스트 지갑, 법정 동결, 수사 협조 등 수동 등록형 원천도 승인 완료 후 누적한다.",
          "정기점검, 장애, 유의종목 지정 같은 사건 기록형은 차단 적용 로그와 구분해 누적한다.",
          "원천 로그는 집계값의 근거이므로 삭제하지 않고 정정은 보정 이력으로 남긴다.",
          "재개(예정)일이 있으면 해제 또는 재개 예정 상태로 집계에 반영한다."
        ]
      }
    ]
  }
};

const els = {};

document.addEventListener("DOMContentLoaded", () => {
  cacheElements();
  bindEvents();
  loadMenuDocs();
});

function cacheElements() {
  [
    "globalSearch",
    "searchCount",
    "modeChip",
    "statusFilter",
    "navList",
    "overviewPanel",
    "metricGrid",
    "priorityList",
    "topMenuTable",
    "detailPanel",
    "detailBreadcrumb",
    "detailTitle",
    "detailStatus",
    "detailCode",
    "detailDirective",
    "detailDocLink",
    "detailStatusSelect",
    "detailPurpose",
    "detailLegacy",
    "detailDescription",
    "detailTabs",
    "designOpinion",
    "policyChecklist",
    "specialPolicyBlock",
    "specialPolicyTitle",
    "specialPolicyContent",
    "menuGrid",
    "resultSummary",
    "backToOverview",
    "showAllButton"
  ].forEach((id) => {
    els[id] = document.getElementById(id);
  });
}

function bindEvents() {
  els.globalSearch.addEventListener("input", (event) => {
    state.query = event.target.value.trim();
    render();
  });

  els.backToOverview.addEventListener("click", showOverview);
  els.detailStatusSelect.addEventListener("change", updateActiveStatus);
  els.showAllButton.addEventListener("click", () => {
    state.query = "";
    state.status = "all";
    els.globalSearch.value = "";
    showOverview();
    render();
  });
}

async function loadMenuDocs() {
  try {
    const result = await fetchMenuDocs();
    state.rows = normalizeMenuDocs(result.docs);
    state.canEdit = result.canEdit;
    state.dataSource = result.source;
    state.filteredRows = state.rows;
    setupFilters();
    render();
  } catch (error) {
    document.querySelector(".content").innerHTML = `
      <div class="error-state">
        <strong>메뉴 문서 로딩 실패</strong>
        <p>${escapeHtml(error.message)}</p>
        <p>저장 기능을 사용하려면 <code>node server.js</code>로 로컬 관리 서버를 실행해 주세요.</p>
      </div>
    `;
  }
}

async function fetchMenuDocs() {
  try {
    const response = await fetch("./api/menus", { cache: "no-store" });
    if (response.ok) {
      return {
        docs: await response.json(),
        canEdit: true,
        source: "api"
      };
    }
  } catch (error) {
    // GitHub Pages does not have the local write API. Fall back to the static index.
  }

  const fallbackResponse = await fetch("./docs/menus-index.json", { cache: "no-store" });
  if (!fallbackResponse.ok) {
    throw new Error(`메뉴 문서를 불러오지 못했습니다. (${fallbackResponse.status})`);
  }
  return {
    docs: await fallbackResponse.json(),
    canEdit: false,
    source: "static"
  };
}

function normalizeMenuDocs(records) {
  return records.map((record, index) => {
    const code = record.code || `ADM-GEN-${String(index + 1).padStart(3, "0")}`;
    const title = record.title || "이름 미정";
    const tabs = Array.isArray(record.tabs) ? record.tabs : splitList(record.tabs, "/");
    const description = record.description || "";
    const descriptionItems = splitList(description, ",");
    const status = record.status || "정의됨";
    const suggestion = buildSuggestion({
      title,
      top: record.top,
      left1: record.left1,
      purpose: record.purpose,
      description,
      status,
      tabs
    });

    const normalized = {
      id: `menu-${index + 1}`,
      number: index + 1,
      top: record.top || "미분류",
      left1: record.left1 || "미분류",
      left2: title || "이름 미정",
      title: title || "이름 미정",
      code,
      tabs,
      status,
      purpose: record.purpose || "화면 목적 정의 필요",
      description,
      descriptionItems,
      legacy: record.legacy || "신규 정책 정의",
      suggestion,
      docPath: record.docPath || `./docs/menus/${code}.md`,
      specialPolicy: specialPolicies[code] || null
    };

    normalized.directive = buildDevelopmentDirective(normalized);
    normalized.searchText = buildRowSearchText(normalized);

    return normalized;
  });
}

function buildDevelopmentDirective(row) {
  return `${row.code} ${row.title} 화면은 이 설계정책서의 화면 목적, 탭 구성, 설계 방식 제안, 권한/감사 기준을 기준으로 개발합니다. 구현 중 설계와 달라지는 항목은 변경 사유와 대체 정책을 기록합니다.`;
}

function buildRowSearchText(row) {
  return normalizeSearchText([
    row.code,
    row.top,
    row.left1,
    row.left2,
    row.purpose,
    row.description,
    row.legacy,
    row.directive,
    row.docPath,
    row.status,
    ...row.tabs,
    ...buildDesignOpinionItems(row).flat(),
    ...buildChecklistItems(row).flat(),
    ...getSpecialPolicySearchParts(row.specialPolicy)
  ]
    .join(" "))
    .concat(" ", normalizeSearchText([row.code, row.title].join("")))
    .concat(" ", normalizeSearchText([row.top, row.left1, row.title].join("")))
    .concat(" ", normalizeSearchText(row.description))
    .concat(" ", normalizeSearchText(row.purpose));
}

function getSpecialPolicySearchParts(policy) {
  if (!policy) return [];
  const parts = [
    policy.title,
    policy.summary,
    ...policy.principles,
    ...(policy.rows || []).flatMap((item) => [
      item.no,
      item.virtualReason,
      item.virtualCount,
      item.fiatReason,
      item.fiatCount
    ]),
    ...(policy.stages || []).flatMap((item) => [
      item.step,
      item.name,
      item.owner,
      item.policy
    ]),
    ...(policy.requirements || []).flatMap((item) => [
      item.area,
      item.policy
    ]),
    ...(policy.sourceTypes || []).flatMap((item) => [
      item.type,
      item.source,
      item.ledgerRule
    ]),
    ...(policy.aggregationRules || []).flatMap((item) => [
      item.basis,
      item.display,
      item.example,
      item.rule
    ]),
    ...(policy.views || []).flatMap((item) => [
      item.name,
      item.policy
    ]),
    ...(policy.tabs || []).flatMap((item) => [
      item.name,
      item.purpose,
      ...(item.controls || []),
      ...(item.columns || []),
      ...(item.policies || [])
    ]),
    ...(policy.fields || []).flatMap((item) => [
      item.name,
      item.policy
    ]),
    ...(policy.reportColumns || [])
  ];
  return parts.filter(Boolean);
}

function splitList(value, separator) {
  if (!value) return [];
  return value
    .split(separator)
    .map((item) => cleanReadyText(item).trim())
    .filter(Boolean);
}

function cleanReadyText(value) {
  return String(value || "").replace(/\(준비중\)/g, "").trim();
}

function setupFilters() {
  const filters = [
    ["all", "전체"],
    ["준비중", "준비중"],
    ["검토중", "검토중"],
    ["정의됨", "정의됨"]
  ];

  els.statusFilter.innerHTML = filters
    .map(
      ([value, label]) => `
        <button class="filter-button ${state.status === value ? "is-active" : ""}" type="button" data-status="${value}">
          ${label}
        </button>
      `
    )
    .join("");

  els.statusFilter.querySelectorAll("button").forEach((button) => {
    button.addEventListener("click", () => {
      state.status = button.dataset.status;
      render();
    });
  });
}

function render() {
  state.filteredRows = getFilteredRows();
  syncActiveRowWithSearch();
  setupFilters();
  renderSummary();
  renderNavigation();
  renderOverview();
  renderMenuGrid();
  renderDetail();
  refreshIcons();
}

function getFilteredRows() {
  const query = normalizeSearchText(state.query);
  return state.rows.filter((row) => {
    const matchesStatus = state.status === "all" || row.status === state.status;
    const matchesQuery = !query || row.searchText.includes(query);
    return matchesStatus && matchesQuery;
  });
}

function syncActiveRowWithSearch() {
  if (!state.query) return;
  const activeStillVisible = state.filteredRows.some((row) => row.id === state.activeId);
  if (!activeStillVisible) {
    state.activeId = state.filteredRows[0]?.id || null;
  }
}

function renderSummary() {
  els.searchCount.textContent = state.filteredRows.length;
  els.modeChip.textContent = state.canEdit ? "편집 가능" : "읽기 전용";
  els.modeChip.className = `mode-chip ${state.canEdit ? "edit" : "readonly"}`;
  els.modeChip.title = state.canEdit
    ? "로컬 관리 서버가 실행 중입니다. 상태 변경이 MD 문서에 저장됩니다."
    : "GitHub Pages 정적 보기 모드입니다. 상태 변경은 로컬 서버에서 가능합니다.";
}

function renderNavigation() {
  const rows = state.filteredRows;
  const grouped = groupBy(rows, "top");

  if (!rows.length) {
    els.navList.innerHTML = `<div class="empty-state">검색 결과가 없습니다.</div>`;
    return;
  }

  els.navList.innerHTML = Object.entries(grouped)
    .map(([top, topRows]) => {
      const byLeft = groupBy(topRows, "left1");
      return `
        <div class="nav-group">
          <div class="nav-top">
            <span>${highlight(top)}</span>
            <span class="count-pill">${topRows.length}</span>
          </div>
          ${Object.entries(byLeft)
            .map(
              ([left1, leftRows]) => `
                <div class="nav-folder">${highlight(left1)}</div>
                ${leftRows
                  .map(
                    (row) => `
                      <button class="nav-leaf ${row.id === state.activeId ? "is-active" : ""}" type="button" data-id="${row.id}">
                        <span class="nav-label">
                          <span class="nav-title">${highlight(row.title)}</span>
                          <span class="nav-code">${highlight(row.code)}</span>
                        </span>
                        <span class="status-chip ${getStatusClass(row.status)}">${row.status}</span>
                      </button>
                    `
                  )
                  .join("")}
              `
            )
            .join("")}
        </div>
      `;
    })
    .join("");

  els.navList.querySelectorAll("[data-id]").forEach((button) => {
    button.addEventListener("click", () => selectRow(button.dataset.id));
  });
}

function renderOverview() {
  const total = state.rows.length;
  const ready = state.rows.filter((row) => row.status === "준비중").length;
  const withLegacy = state.rows.filter((row) => row.legacy !== "신규 정책 정의").length;
  const withTabs = state.rows.filter((row) => row.tabs.length > 0).length;

  els.metricGrid.innerHTML = [
    ["전체 메뉴", total, "MD 문서로 정의된 화면 단위"],
    ["제작 필요", ready, "상태가 준비중인 메뉴"],
    ["구 어드민 매핑", withLegacy, "이전 화면 추적 가능"],
    ["탭 정의", withTabs, "우측 화면 탭이 있는 메뉴"]
  ]
    .map(
      ([label, value, help]) => `
        <div class="metric-card">
          <span>${label}</span>
          <strong>${value}</strong>
          <span>${help}</span>
        </div>
      `
    )
    .join("");

  renderPriorityList();
  renderTopMenuTable();
}

function renderPriorityList() {
  const priorities = state.rows
    .filter((row) => row.status === "준비중")
    .map((row) => ({ row, score: priorityScore(row) }))
    .sort((a, b) => b.score - a.score || a.row.number - b.row.number)
    .slice(0, 10);

  els.priorityList.innerHTML = priorities
    .map(({ row, score }) => {
      const level = score >= 8 ? "high" : score >= 5 ? "medium" : "low";
      const label = score >= 8 ? "높음" : score >= 5 ? "중간" : "낮음";
      return `
        <div class="priority-item">
          <div>
            <button type="button" data-id="${row.id}">${highlight(row.title)}</button>
            <div class="small-code">${highlight(row.code)}</div>
            <p>${highlight(row.purpose)}</p>
          </div>
          <span class="priority-chip ${level}">${label}</span>
        </div>
      `;
    })
    .join("");

  els.priorityList.querySelectorAll("[data-id]").forEach((button) => {
    button.addEventListener("click", () => selectRow(button.dataset.id));
  });
}

function renderTopMenuTable() {
  const rows = Object.entries(groupBy(state.rows, "top")).map(([top, items]) => {
    const ready = items.filter((item) => item.status === "준비중").length;
    const review = items.filter((item) => item.status === "검토중").length;
    const defined = items.filter((item) => item.status === "정의됨").length;
    return [top, items.length, ready, review, `${Math.round((defined / items.length) * 100)}%`];
  });

  els.topMenuTable.innerHTML = `
    <table>
      <thead>
        <tr>
          <th>상단 메뉴</th>
          <th>전체</th>
          <th>준비중</th>
          <th>검토중</th>
          <th>정의율</th>
        </tr>
      </thead>
      <tbody>
        ${rows
          .map(
            ([top, total, ready, review, rate]) => `
              <tr>
                <td>${escapeHtml(top)}</td>
                <td>${total}</td>
                <td>${ready}</td>
                <td>${review}</td>
                <td>${rate}</td>
              </tr>
            `
          )
          .join("")}
      </tbody>
    </table>
  `;
}

function renderMenuGrid() {
  const rows = state.filteredRows;
  els.resultSummary.textContent = `${rows.length}개 표시`;

  if (!rows.length) {
    els.menuGrid.innerHTML = `<div class="empty-state">조건에 맞는 메뉴가 없습니다.</div>`;
    return;
  }

  els.menuGrid.innerHTML = rows
    .map(
      (row) => `
        <article class="menu-card" role="button" tabindex="0" data-id="${row.id}">
          <div class="menu-card-header">
            <h3>${highlight(row.title)}</h3>
            <span class="status-chip ${getStatusClass(row.status)}">${row.status}</span>
          </div>
          <div class="menu-code-row">
            <span class="code-chip">${highlight(row.code)}</span>
          </div>
          <div class="path">${highlight(row.top)} / ${highlight(row.left1)}</div>
          <p>${highlight(row.purpose)}</p>
          <div class="meta-row">
            <span class="priority-chip ${priorityClass(row)}">${priorityLabel(row)}</span>
            <span class="count-pill">탭 ${row.tabs.length}</span>
            <span class="count-pill">${row.legacy === "신규 정책 정의" ? "신규" : "매핑"}</span>
          </div>
        </article>
      `
    )
    .join("");

  els.menuGrid.querySelectorAll("[data-id]").forEach((card) => {
    card.addEventListener("click", () => selectRow(card.dataset.id));
    card.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        selectRow(card.dataset.id);
      }
    });
  });
}

function renderDetail() {
  const row = state.rows.find((item) => item.id === state.activeId);
  if (!row) {
    els.detailPanel.hidden = true;
    if (!state.query) {
      els.overviewPanel.hidden = false;
    }
    return;
  }

  els.overviewPanel.hidden = true;
  els.detailPanel.hidden = false;
  els.detailBreadcrumb.innerHTML = `${highlight(row.top)} / ${highlight(row.left1)}`;
  els.detailTitle.innerHTML = highlight(row.title);
  els.detailStatus.textContent = row.status;
  els.detailStatus.className = `status-chip ${getStatusClass(row.status)}`;
  els.detailCode.innerHTML = highlight(row.code);
  els.detailDirective.innerHTML = highlight(row.directive);
  els.detailDocLink.href = row.docPath;
  els.detailDocLink.title = `${row.code} Markdown policy document`;
  els.detailStatusSelect.value = row.status;
  els.detailStatusSelect.disabled = !state.canEdit;
  els.detailStatusSelect.title = state.canEdit
    ? "상태 변경 시 해당 MD 문서에 저장됩니다."
    : "GitHub Pages에서는 읽기 전용입니다. 상태 변경은 로컬 서버에서 가능합니다.";
  els.detailPurpose.innerHTML = highlight(row.purpose);
  els.detailLegacy.innerHTML = highlight(row.legacy);
  els.detailDescription.innerHTML = renderTokens(row.descriptionItems.length ? row.descriptionItems : ["설명 보강 필요"], "token");
  els.detailTabs.innerHTML = renderTokens(row.tabs.length ? row.tabs : inferTabs(row), "tab-token");
  els.designOpinion.innerHTML = renderDesignOpinion(row);
  els.policyChecklist.innerHTML = renderChecklist(row);
  renderSpecialPolicy(row);
}

function renderSpecialPolicy(row) {
  if (!row.specialPolicy) {
    els.specialPolicyBlock.hidden = true;
    els.specialPolicyTitle.textContent = "";
    els.specialPolicyContent.innerHTML = "";
    return;
  }

  const policy = row.specialPolicy;
  els.specialPolicyBlock.hidden = false;
  els.specialPolicyTitle.innerHTML = highlight(policy.title);
  els.specialPolicyContent.innerHTML = `
    <p class="special-summary">${highlight(policy.summary)}</p>
    <div class="special-principles">
      ${policy.principles
        .map(
          (item) => `
            <div class="special-principle">
              <i data-lucide="check-circle-2"></i>
              <span>${highlight(item)}</span>
            </div>
          `
        )
        .join("")}
    </div>
    ${renderSpecialPolicyBody(policy)}
  `;
}

function renderSpecialPolicyBody(policy) {
  if (policy.type === "approvalFlow") {
    return `
      <div class="workflow-grid">
        ${policy.stages
          .map(
            (item) => `
              <article class="workflow-card">
                <div class="workflow-step">${highlight(item.step)}</div>
                <div>
                  <h4>${highlight(item.name)}</h4>
                  <p class="workflow-owner">${highlight(item.owner)}</p>
                  <p>${highlight(item.policy)}</p>
                </div>
              </article>
            `
          )
          .join("")}
      </div>
      <div class="table-wrap requirement-table-wrap">
        <table class="requirement-table">
          <thead>
            <tr>
              <th>정책 영역</th>
              <th>구현 기준</th>
            </tr>
          </thead>
          <tbody>
            ${policy.requirements
              .map(
                (item) => `
                  <tr>
                    <td>${highlight(item.area)}</td>
                    <td>${highlight(item.policy)}</td>
                  </tr>
                `
              )
              .join("")}
          </tbody>
        </table>
      </div>
    `;
  }

  if (policy.type === "ledger") {
    return `
      <div class="ledger-tabs">
        ${policy.tabs.map((tab) => renderLedgerTab(tab)).join("")}
      </div>
      <div class="table-wrap requirement-table-wrap">
        <table class="requirement-table">
          <thead>
            <tr>
              <th>산출 기준</th>
              <th>표시 방식</th>
              <th>예시</th>
              <th>집계 규칙</th>
            </tr>
          </thead>
          <tbody>
            ${policy.aggregationRules
              .map(
                (item) => `
                  <tr>
                    <td>${highlight(item.basis)}</td>
                    <td>${highlight(item.display)}</td>
                    <td>${highlight(item.example)}</td>
                    <td>${highlight(item.rule)}</td>
                  </tr>
                `
            )
              .join("")}
          </tbody>
        </table>
      </div>
      <div class="ledger-section">
        <h4>원천 데이터 유형</h4>
        <div class="ledger-grid">
          ${policy.sourceTypes
            .map(
              (item) => `
                <article class="ledger-card compact">
                  <h5>${highlight(item.type)}</h5>
                  <p class="ledger-source">${highlight(item.source)}</p>
                  <p>${highlight(item.ledgerRule)}</p>
                </article>
              `
            )
            .join("")}
        </div>
      </div>
    `;
  }

  if (policy.type === "fieldList") {
    return `
      <div class="table-wrap requirement-table-wrap">
        <table class="requirement-table">
          <thead>
            <tr>
              <th>입력 항목</th>
              <th>관리 기준</th>
            </tr>
          </thead>
          <tbody>
            ${policy.fields
              .map(
                (item) => `
                  <tr>
                    <td>${highlight(item.name)}</td>
                    <td>${highlight(item.policy)}</td>
                  </tr>
                `
              )
              .join("")}
          </tbody>
        </table>
      </div>
    `;
  }

  return `
    <div class="table-wrap special-table-wrap">
      <table class="special-policy-table">
        <thead>
          <tr>
            <th rowspan="2">차단사유</th>
            <th colspan="2">코인거래소: 가상자산 입출고 관련</th>
            <th colspan="2">원화거래소: 예치금 입출금 관련</th>
          </tr>
          <tr>
            <th>사유</th>
            <th>건 수 산출 기준</th>
            <th>사유</th>
            <th>건 수 산출 기준</th>
          </tr>
        </thead>
        <tbody>
          ${policy.rows
            .map(
              (item) => `
                <tr>
                  <td class="reason-no">${highlight(item.no)}</td>
                  <td>${highlight(item.virtualReason || "-")}</td>
                  <td>${highlight(item.virtualCount || "-")}</td>
                  <td>${highlight(item.fiatReason || "-")}</td>
                  <td>${highlight(item.fiatCount || "-")}</td>
                </tr>
              `
            )
            .join("")}
        </tbody>
      </table>
    </div>
  `;
}

function renderLedgerTab(tab) {
  return `
    <article class="ledger-tab-card">
      <div class="ledger-tab-header">
        <h4>${highlight(tab.name)}</h4>
        <p>${highlight(tab.purpose)}</p>
      </div>
      <div class="ledger-tab-section">
        <h5>검색/조회 조건</h5>
        <div class="token-list">
          ${tab.controls.map((item) => `<span class="token">${highlight(item)}</span>`).join("")}
        </div>
      </div>
      <div class="ledger-tab-section">
        <h5>표시 컬럼</h5>
        <div class="token-list">
          ${tab.columns.map((item) => `<span class="token">${highlight(item)}</span>`).join("")}
        </div>
      </div>
      <div class="ledger-tab-section">
        <h5>집계/운영 정책</h5>
        <div class="ledger-policy-list">
          ${tab.policies
            .map(
              (item) => `
                <div class="ledger-policy-item">
                  <i data-lucide="check-circle-2"></i>
                  <span>${highlight(item)}</span>
                </div>
              `
            )
            .join("")}
        </div>
      </div>
    </article>
  `;
}

function selectRow(id) {
  state.activeId = id;
  render();
  scrollDetailIntoView();
}

function showOverview() {
  state.activeId = null;
  els.detailPanel.hidden = true;
  els.overviewPanel.hidden = false;
  renderNavigation();
  refreshIcons();
  els.overviewPanel.scrollIntoView({ behavior: "smooth", block: "start" });
}

function getStatusClass(status) {
  if (status === "준비중") return "ready";
  if (status === "검토중") return "review";
  return "defined";
}

async function updateActiveStatus() {
  const row = state.rows.find((item) => item.id === state.activeId);
  if (!row) return;
  if (!state.canEdit) {
    els.detailStatusSelect.value = row.status;
    window.alert("GitHub Pages에서는 읽기 전용입니다. 상태 변경은 start-admin-server.cmd로 로컬 서버를 실행한 뒤 가능합니다.");
    return;
  }

  const nextStatus = els.detailStatusSelect.value;
  const previousStatus = row.status;
  els.detailStatusSelect.disabled = true;

  try {
    const response = await fetch(`./api/menus/${encodeURIComponent(row.code)}/status`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus })
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || `상태 저장에 실패했습니다. (${response.status})`);
    }

    row.status = nextStatus;
    row.searchText = buildRowSearchText(row);
    render();
  } catch (error) {
    row.status = previousStatus;
    els.detailStatusSelect.value = previousStatus;
    window.alert(error.message);
  } finally {
    els.detailStatusSelect.disabled = false;
  }
}

function scrollDetailIntoView() {
  const topbarHeight = document.querySelector(".topbar")?.offsetHeight || 0;
  const panelTop = els.detailPanel.getBoundingClientRect().top + window.scrollY;
  window.scrollTo({
    top: Math.max(panelTop - topbarHeight - 14, 0),
    behavior: "smooth"
  });
}

function buildSuggestion(context) {
  const text = `${context.top} ${context.left1} ${context.title} ${context.purpose} ${context.description}`.toLowerCase();
  const category = inferCategory(text);
  const base = suggestionMap[category] || suggestionMap.default;
  const priority = context.status === "준비중" ? priorityLabelFromScore(priorityScoreFromText(text)) : "기존 정의 정돈";

  return {
    owner: base.owner,
    layout: base.layout,
    data: base.data,
    actions: base.actions,
    audit: base.audit,
    priority
  };
}

const suggestionMap = {
  dashboard: {
    owner: "운영 리더, 당직 운영자, 리스크 담당자가 같은 지표를 보도록 역할별 위젯 노출을 분리합니다.",
    layout: "상단 KPI, 이상 징후 큐, 미처리 업무, 최근 장애/점검 이력을 한 화면에서 스캔하는 대시보드형으로 설계합니다.",
    data: "건수, 금액, SLA 초과, 상태별 비율, 최근 갱신 시각을 기본 필드로 둡니다.",
    actions: "상세 화면 이동, 담당자 배정, 보고서 추출, 알림 확인을 빠르게 실행하게 합니다.",
    audit: "운영자가 알림을 확인하거나 배정한 시점, 필터 조건, 추출 이력을 남깁니다."
  },
  approval: {
    owner: "승인자, 부서 담당자, 감사 담당자가 같은 처리 단위를 추적할 수 있게 합니다.",
    layout: "처리함 중심의 큐 화면으로 만들고 상태 탭, SLA, 담당자, 우선순위 기준 정렬을 기본값으로 둡니다.",
    data: "요청자, 대상 회원, 요청 사유, 증빙, 만료 시간, 이전 처리 이력을 한 행에서 확인하게 합니다.",
    actions: "승인, 반려, 보완요청, 담당자 변경, 관련 화면 이동을 분리된 권한으로 제어합니다.",
    audit: "승인 전후 값, 사유, IP, 처리자, 결재선을 변경 불가능한 로그로 남깁니다."
  },
  member: {
    owner: "CS, KYC, 준법, 운영자가 회원 단위로 동일한 고객 맥락을 보도록 합니다.",
    layout: "회원 360도 상세 구조가 맞습니다. 기본정보, 자산, 거래, 입출금, KYC, 제재, 문의, 이력을 탭으로 분리합니다.",
    data: "회원번호, 식별정보, 상태, KYC 등급, 제한 상태, 최근 활동, 위험 태그를 핵심 필드로 둡니다.",
    actions: "상태 변경은 조회 화면과 분리하고, 제한/해제는 승인 흐름을 타도록 합니다.",
    audit: "개인정보 조회 사유, 마스킹 해제, 다운로드, 상태 변경 이력을 반드시 남깁니다."
  },
  compliance: {
    owner: "준법, FDS, 위험관리 담당자가 사건 단위로 판단하고 추적할 수 있어야 합니다.",
    layout: "Alert 큐와 Case 상세를 분리합니다. 탐지 근거, 위험 점수, 연결 회원/거래, 처리 결과를 함께 보여줍니다.",
    data: "위험 유형, 탐지 룰, 금액, 지갑/계좌, 회원 위험도, 제재 상태, 관련 증빙을 중심으로 설계합니다.",
    actions: "보류, 차단, 해제요청, Case 전환, 외부 보고 표시를 권한별로 제한합니다.",
    audit: "탐지 룰 버전, 판단 사유, 차단 전후 상태, 승인자를 법적 감사 기준으로 보관합니다."
  },
  wallet: {
    owner: "입출금 운영, 지갑 운영, 회계 담당자가 자산 흐름을 같이 검증하도록 합니다.",
    layout: "거래 원장과 처리 큐를 분리하고, 지갑/네트워크/상태/위험도를 빠르게 필터링하게 합니다.",
    data: "TXID, 네트워크, 주소, 금액, 수수료, 컨펌 수, 원장 반영 상태, 대사 결과를 핵심 필드로 둡니다.",
    actions: "보류, 재처리, 수동확인, 차단, 콜드월렛 이동 요청은 이중 승인으로 설계합니다.",
    audit: "주소 조회, 수동 처리, 대사 조정, 키 관리 접근은 별도 고위험 감사로그로 남깁니다."
  },
  settlement: {
    owner: "정산, 회계, 감사 담당자가 마감 기준과 차이를 같은 언어로 보도록 합니다.",
    layout: "일마감 현황, 대사 차이, 수수료/자산 집계, 조정 이력을 단계적으로 보여주는 운영 화면이 맞습니다.",
    data: "기준일, 통화, 원장 잔액, 외부 잔액, 차이 금액, 조정 사유, 마감 상태를 고정 필드로 둡니다.",
    actions: "마감, 보류, 조정 요청, 재대사, 추출은 권한과 승인 단계를 분리합니다.",
    audit: "마감 전후 값, 조정 근거, 파일 추출, 승인자와 승인 시각을 보관합니다."
  },
  report: {
    owner: "내부 보고자, 감사 대응자, 데이터 추출 승인자가 사용합니다.",
    layout: "보고서 템플릿, 추출 조건, 승인 상태, 다운로드 이력을 한 흐름으로 묶습니다.",
    data: "보고서 유형, 기간, 필터 조건, 개인정보 포함 여부, 생성자, 승인자, 만료일을 표시합니다.",
    actions: "미리보기, 추출요청, 승인, 다운로드, 폐기를 분리하고 대용량 처리는 비동기로 둡니다.",
    audit: "추출 조건, 다운로드 횟수, 파일 해시, 개인정보 포함 여부를 반드시 남깁니다."
  },
  product: {
    owner: "거래지원, 상품 운영, 공지 담당자가 변경 이력을 공유합니다.",
    layout: "상품/마켓 목록과 상세 설정을 분리하고 상태 전환 흐름을 명확히 보여줍니다.",
    data: "마켓, 종목, 노출 상태, 거래지원 상태, 점검 여부, 수수료, 공지 연결을 핵심 필드로 둡니다.",
    actions: "등록, 변경, 점검, 중지, 공지 연결은 예약 반영과 승인 흐름을 지원합니다.",
    audit: "설정 변경 전후 값, 예약 시각, 공지 발행자, 승인자를 보관합니다."
  },
  security: {
    owner: "보안 담당자, 시스템 관리자, 감사자가 접근 제어를 관리합니다.",
    layout: "권한 그룹, 관리자 계정, 접근 로그, 설정 변경 이력을 분리해 반복 점검이 쉽도록 합니다.",
    data: "관리자, 역할, 권한 범위, 최근 로그인, MFA, IP 제한, 변경 이력을 기본 필드로 둡니다.",
    actions: "권한 부여, 회수, 잠금, 세션 종료, 정책 변경은 승인과 사유 입력을 필수로 둡니다.",
    audit: "관리자 행위는 개인정보 조회보다 높은 수준으로 사유, IP, 기기, 전후 값을 남깁니다."
  },
  default: {
    owner: "담당 부서와 승인 부서를 분리해 조회, 처리, 감사 역할을 명확히 합니다.",
    layout: "목록, 상세, 처리 이력, 변경 이력을 기본 구조로 두고 상태 탭을 제공합니다.",
    data: "식별자, 상태, 대상, 사유, 담당자, 처리 시각, 관련 화면 링크를 핵심 필드로 둡니다.",
    actions: "조회와 변경 액션을 분리하고 변경 액션에는 사유와 권한 검사를 둡니다.",
    audit: "상태 변경, 다운로드, 마스킹 해제, 승인/반려는 전후 값을 포함해 기록합니다."
  }
};

function inferCategory(text) {
  if (hasAny(text, ["대시보드", "모니터링", "현황"])) return "dashboard";
  if (hasAny(text, ["승인", "처리함", "심사", "반려", "보완", "요청관리"])) return "approval";
  if (hasAny(text, ["회원", "고객", "kyc", "본인", "인증", "로그인"])) return "member";
  if (hasAny(text, ["준법", "fds", "위험", "차단", "제재", "kYT".toLowerCase(), "aml", "alert"])) return "compliance";
  if (hasAny(text, ["입출금", "출금", "입금", "지갑", "txid", "주소", "자산"])) return "wallet";
  if (hasAny(text, ["정산", "회계", "대사", "마감", "수수료"])) return "settlement";
  if (hasAny(text, ["보고서", "추출", "감사대응", "다운로드"])) return "report";
  if (hasAny(text, ["거래지원", "상품", "마켓", "종목", "공지"])) return "product";
  if (hasAny(text, ["보안", "관리자", "권한", "감사로그", "접근"])) return "security";
  return "default";
}

function hasAny(text, words) {
  return words.some((word) => text.includes(word));
}

function renderDesignOpinion(row) {
  const items = buildDesignOpinionItems(row);

  return items
    .map(
      ([title, body]) => `
        <article class="policy-card">
          <h4>${highlight(title)}</h4>
          <p>${highlight(body)}</p>
        </article>
      `
    )
    .join("");
}

function buildDesignOpinionItems(row) {
  return [
    ["사용자/권한", row.suggestion.owner],
    ["화면 구조", row.suggestion.layout],
    ["핵심 데이터", row.suggestion.data],
    ["주요 액션", row.suggestion.actions],
    ["감사/보안", row.suggestion.audit],
    ["개발 우선순위", row.suggestion.priority]
  ];
}

function renderChecklist(row) {
  const items = buildChecklistItems(row);

  return items
    .map(
      ([title, body]) => `
        <div class="check-item">
          <i data-lucide="check-circle-2"></i>
          <div>
            <h4>${highlight(title)}</h4>
            <p>${highlight(body)}</p>
          </div>
        </div>
      `
    )
    .join("");
}

function buildChecklistItems(row) {
  return [
    ["목록 기준", `${row.title} 목록은 상태, 기간, 담당자, 검색어 필터를 기본 제공해야 합니다.`],
    ["상세 기준", "상세 화면은 현재 값, 처리 이력, 관련 증빙, 연결 화면 링크를 함께 보여줍니다."],
    ["권한 기준", "조회 권한과 처리 권한을 분리하고 민감 정보는 마스킹 해제를 별도 권한으로 둡니다."],
    ["처리 기준", `${row.status === "준비중" ? "제작 시" : "정리 시"} 승인/반려/보완요청 같은 변경 액션에는 사유 입력을 요구합니다.`],
    ["로그 기준", "조회, 다운로드, 상태 변경, 승인 결과는 관리자 감사로그에 남깁니다."],
    ["운영 기준", "SLA 초과, 실패, 예외 상태는 대시보드와 알림으로 연결합니다."]
  ];
}

function renderTokens(items, className) {
  return items.map((item) => `<span class="${className}">${highlight(item)}</span>`).join("");
}

function inferTabs(row) {
  if (row.suggestion.layout.includes("360도")) return ["기본", "상태", "거래", "입출금", "이력"];
  if (row.suggestion.layout.includes("큐")) return ["대기", "처리중", "보완", "완료", "이력"];
  if (row.suggestion.layout.includes("대시보드")) return ["전체", "위험", "미처리", "장애", "이력"];
  return ["목록", "상세", "처리 이력", "변경 이력"];
}

function priorityScore(row) {
  return priorityScoreFromText(`${row.top} ${row.left1} ${row.title} ${row.purpose} ${row.description}`);
}

function priorityScoreFromText(text) {
  const lower = text.toLowerCase();
  let score = 1;
  if (hasAny(lower, ["준법", "fds", "위험", "차단", "출금", "입출금", "지갑", "kyc", "정산", "승인"])) score += 5;
  if (hasAny(lower, ["대시보드", "처리 대기", "심사", "보고서", "감사", "장애", "보류"])) score += 3;
  if (hasAny(lower, ["이력", "조회", "현황"])) score += 1;
  return score;
}

function priorityLabel(row) {
  return priorityLabelFromScore(priorityScore(row));
}

function priorityLabelFromScore(score) {
  if (score >= 8) return "우선순위 높음";
  if (score >= 5) return "우선순위 중간";
  return "정책 보강";
}

function priorityClass(row) {
  const score = priorityScore(row);
  if (score >= 8) return "high";
  if (score >= 5) return "medium";
  return "low";
}

function groupBy(rows, key) {
  return rows.reduce((grouped, row) => {
    const value = row[key] || "미분류";
    if (!grouped[value]) grouped[value] = [];
    grouped[value].push(row);
    return grouped;
  }, {});
}

function highlight(value) {
  const safe = escapeHtml(value || "");
  if (!state.query) return safe;
  const escapedQuery = escapeRegExp(state.query);
  return safe.replace(new RegExp(`(${escapedQuery})`, "gi"), "<mark>$1</mark>");
}

function normalizeSearchText(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFKC")
    .replace(/[^0-9a-z\u3131-\u314e\uac00-\ud7a3]+/g, "");
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function refreshIcons() {
  if (window.lucide) {
    window.lucide.createIcons();
  }
}

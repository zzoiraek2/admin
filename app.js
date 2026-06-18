const state = {
  rows: [],
  filteredRows: [],
  activeId: null,
  query: "",
  status: "all"
};

const columns = {
  top: "상단 주메뉴",
  left1: "좌측1메뉴",
  left2: "좌측2메뉴",
  tabs: "우측화면 탭",
  status: "상태",
  purpose: "화면목적",
  description: "설명",
  legacy: "구 어드민 매핑"
};

const menuCodePrefixes = {
  "대시보드": "ADM-DASH",
  "회원·고객확인": "ADM-MEM",
  "거래·마켓 관리": "ADM-MKT",
  "입출금·지갑": "ADM-WAL",
  "준법·FDS 관리": "ADM-RISK",
  "거래지원·상품": "ADM-LIST",
  "정산·회계": "ADM-SETTLE",
  "고객지원·서비스": "ADM-CS",
  "보안·관리자통제": "ADM-SEC"
};

const els = {};

document.addEventListener("DOMContentLoaded", () => {
  cacheElements();
  bindEvents();
  loadCsv();
});

function cacheElements() {
  [
    "globalSearch",
    "searchCount",
    "statusFilter",
    "sidebarSummary",
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
    "copyDirective",
    "detailPurpose",
    "detailLegacy",
    "detailDescription",
    "detailTabs",
    "designOpinion",
    "policyChecklist",
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
  els.copyDirective.addEventListener("click", copyActiveDirective);
  els.showAllButton.addEventListener("click", () => {
    state.query = "";
    state.status = "all";
    els.globalSearch.value = "";
    showOverview();
    render();
  });
}

async function loadCsv() {
  try {
    const response = await fetch("./admin.csv", { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`admin.csv를 불러오지 못했습니다. (${response.status})`);
    }
    const text = await response.text();
    const parsedRows = parseCsv(text);
    state.rows = normalizeRows(parsedRows);
    state.filteredRows = state.rows;
    setupFilters();
    render();
  } catch (error) {
    document.querySelector(".content").innerHTML = `
      <div class="error-state">
        <strong>CSV 로딩 실패</strong>
        <p>${escapeHtml(error.message)}</p>
        <p>로컬에서 확인할 때는 간단한 웹 서버로 열어주세요.</p>
      </div>
    `;
  }
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        cell += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      row.push(cell);
      cell = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") {
        index += 1;
      }
      row.push(cell);
      if (row.some((value) => value.trim() !== "")) {
        rows.push(row);
      }
      row = [];
      cell = "";
      continue;
    }

    cell += char;
  }

  if (cell.length || row.length) {
    row.push(cell);
    if (row.some((value) => value.trim() !== "")) {
      rows.push(row);
    }
  }

  const headers = rows.shift().map((header) => header.replace(/^\uFEFF/, "").trim());
  return rows.map((values) =>
    headers.reduce((record, header, index) => {
      record[header] = (values[index] || "").trim();
      return record;
    }, {})
  );
}

function normalizeRows(records) {
  let currentTop = "";
  let currentLeft1 = "";
  let currentLeft2 = "";
  const sequenceByPrefix = {};

  return records.map((record, index) => {
    if (record[columns.top]) currentTop = record[columns.top];
    if (record[columns.left1]) currentLeft1 = record[columns.left1];
    if (record[columns.left2]) currentLeft2 = record[columns.left2];

    const rawTitle = record[columns.left2] || record[columns.left1] || record[columns.top] || currentLeft2 || currentLeft1 || currentTop;
    const title = cleanReadyText(rawTitle);
    const status = record[columns.status] === "준비중" || rawTitle.includes("준비중") ? "준비중" : "정의됨";
    const tabs = splitList(record[columns.tabs], "/");
    const descriptionItems = splitList(record[columns.description], ",");
    const prefix = getMenuCodePrefix(currentTop);
    sequenceByPrefix[prefix] = (sequenceByPrefix[prefix] || 0) + 1;
    const code = `${prefix}-${String(sequenceByPrefix[prefix]).padStart(3, "0")}`;
    const suggestion = buildSuggestion({
      title,
      top: currentTop,
      left1: currentLeft1,
      purpose: record[columns.purpose],
      description: record[columns.description],
      status,
      tabs
    });

    const normalized = {
      id: `menu-${index + 1}`,
      number: index + 1,
      top: currentTop || "미분류",
      left1: currentLeft1 || "미분류",
      left2: title || "이름 미정",
      title: title || "이름 미정",
      code,
      tabs,
      status,
      purpose: record[columns.purpose] || "화면 목적 정의 필요",
      description: record[columns.description] || "",
      descriptionItems,
      legacy: record[columns.legacy] || "신규 정책 정의",
      suggestion
    };

    normalized.directive = buildDevelopmentDirective(normalized);
    normalized.searchText = [
      normalized.code,
      normalized.top,
      normalized.left1,
      normalized.left2,
      normalized.purpose,
      normalized.description,
      normalized.legacy,
      normalized.directive,
      normalized.status,
      ...normalized.tabs,
      ...Object.values(suggestion).flat()
    ]
      .join(" ")
      .toLowerCase();

    return normalized;
  });
}

function getMenuCodePrefix(topMenu) {
  return menuCodePrefixes[topMenu] || "ADM-GEN";
}

function buildDevelopmentDirective(row) {
  return `${row.code} ${row.title} 화면은 이 설계정책서의 화면 목적, 탭 구성, 설계 방식 제안, 권한/감사 기준을 기준으로 개발합니다. 구현 중 설계와 달라지는 항목은 변경 사유와 대체 정책을 기록합니다.`;
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
  setupFilters();
  renderSummary();
  renderNavigation();
  renderOverview();
  renderMenuGrid();
  renderDetail();
  refreshIcons();
}

function getFilteredRows() {
  const query = state.query.toLowerCase();
  return state.rows.filter((row) => {
    const matchesStatus = state.status === "all" || row.status === state.status;
    const matchesQuery = !query || row.searchText.includes(query);
    return matchesStatus && matchesQuery;
  });
}

function renderSummary() {
  const total = state.rows.length;
  const ready = state.rows.filter((row) => row.status === "준비중").length;
  const defined = total - ready;
  const topCount = new Set(state.rows.map((row) => row.top)).size;

  els.sidebarSummary.innerHTML = [
    ["전체", total],
    ["준비중", ready],
    ["정의됨", defined],
    ["상단 메뉴", topCount]
  ]
    .map(
      ([label, value]) => `
        <div class="summary-tile">
          <strong>${value}</strong>
          <span>${label}</span>
        </div>
      `
    )
    .join("");

  els.searchCount.textContent = state.filteredRows.length;
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
                        <span>${highlight(row.code)} · ${highlight(row.title)}</span>
                        <span class="status-chip ${row.status === "준비중" ? "ready" : "defined"}">${row.status}</span>
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
    ["전체 메뉴", total, "CSV에 정의된 화면 단위"],
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
            <button type="button" data-id="${row.id}">${highlight(row.code)} · ${highlight(row.title)}</button>
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
    return [top, items.length, ready, `${Math.round(((items.length - ready) / items.length) * 100)}%`];
  });

  els.topMenuTable.innerHTML = `
    <table>
      <thead>
        <tr>
          <th>상단 메뉴</th>
          <th>전체</th>
          <th>준비중</th>
          <th>정의율</th>
        </tr>
      </thead>
      <tbody>
        ${rows
          .map(
            ([top, total, ready, rate]) => `
              <tr>
                <td>${escapeHtml(top)}</td>
                <td>${total}</td>
                <td>${ready}</td>
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
            <span class="status-chip ${row.status === "준비중" ? "ready" : "defined"}">${row.status}</span>
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
  if (!row) return;

  els.overviewPanel.hidden = true;
  els.detailPanel.hidden = false;
  els.detailBreadcrumb.innerHTML = `${highlight(row.top)} / ${highlight(row.left1)}`;
  els.detailTitle.innerHTML = highlight(row.title);
  els.detailStatus.textContent = row.status;
  els.detailStatus.className = `status-chip ${row.status === "준비중" ? "ready" : "defined"}`;
  els.detailCode.innerHTML = highlight(row.code);
  els.detailDirective.innerHTML = highlight(row.directive);
  els.detailPurpose.innerHTML = highlight(row.purpose);
  els.detailLegacy.innerHTML = highlight(row.legacy);
  els.detailDescription.innerHTML = renderTokens(row.descriptionItems.length ? row.descriptionItems : ["설명 보강 필요"], "token");
  els.detailTabs.innerHTML = renderTokens(row.tabs.length ? row.tabs : inferTabs(row), "tab-token");
  els.designOpinion.innerHTML = renderDesignOpinion(row);
  els.policyChecklist.innerHTML = renderChecklist(row);
}

function selectRow(id) {
  state.activeId = id;
  render();
  els.detailPanel.scrollIntoView({ behavior: "smooth", block: "start" });
}

function showOverview() {
  state.activeId = null;
  els.detailPanel.hidden = true;
  els.overviewPanel.hidden = false;
  renderNavigation();
  refreshIcons();
  els.overviewPanel.scrollIntoView({ behavior: "smooth", block: "start" });
}

async function copyActiveDirective() {
  const row = state.rows.find((item) => item.id === state.activeId);
  if (!row) return;

  const original = els.copyDirective.innerHTML;
  try {
    await navigator.clipboard.writeText(row.directive);
    els.copyDirective.innerHTML = '<i data-lucide="check"></i>복사됨';
  } catch (error) {
    els.copyDirective.innerHTML = '<i data-lucide="alert-circle"></i>복사 실패';
  }
  refreshIcons();
  window.setTimeout(() => {
    els.copyDirective.innerHTML = original;
    refreshIcons();
  }, 1400);
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
  const items = [
    ["사용자/권한", row.suggestion.owner],
    ["화면 구조", row.suggestion.layout],
    ["핵심 데이터", row.suggestion.data],
    ["주요 액션", row.suggestion.actions],
    ["감사/보안", row.suggestion.audit],
    ["개발 우선순위", row.suggestion.priority]
  ];

  return items
    .map(
      ([title, body]) => `
        <article class="policy-card">
          <h4>${title}</h4>
          <p>${highlight(body)}</p>
        </article>
      `
    )
    .join("");
}

function renderChecklist(row) {
  const items = [
    ["목록 기준", `${row.title} 목록은 상태, 기간, 담당자, 검색어 필터를 기본 제공해야 합니다.`],
    ["상세 기준", "상세 화면은 현재 값, 처리 이력, 관련 증빙, 연결 화면 링크를 함께 보여줍니다."],
    ["권한 기준", "조회 권한과 처리 권한을 분리하고 민감 정보는 마스킹 해제를 별도 권한으로 둡니다."],
    ["처리 기준", `${row.status === "준비중" ? "제작 시" : "정리 시"} 승인/반려/보완요청 같은 변경 액션에는 사유 입력을 요구합니다.`],
    ["로그 기준", "조회, 다운로드, 상태 변경, 승인 결과는 관리자 감사로그에 남깁니다."],
    ["운영 기준", "SLA 초과, 실패, 예외 상태는 대시보드와 알림으로 연결합니다."]
  ];

  return items
    .map(
      ([title, body]) => `
        <div class="check-item">
          <i data-lucide="check-circle-2"></i>
          <div>
            <h4>${title}</h4>
            <p>${highlight(body)}</p>
          </div>
        </div>
      `
    )
    .join("");
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

const fs = require("fs");
const http = require("http");
const path = require("path");
const { URL } = require("url");

const rootDir = __dirname;
const menusDir = path.join(rootDir, "docs", "menus");
const port = Number(process.env.PORT || 4173);
const host = process.env.HOST || "127.0.0.1";

const validStatuses = new Set(["정의됨", "준비중", "검토중"]);
const topMenuOrder = [
  "대시보드",
  "회원·고객확인",
  "거래·마켓 관리",
  "입출금·지갑",
  "준법·FDS 관리",
  "거래지원·상품",
  "정산·회계",
  "고객지원·서비스",
  "보안·관리자통제"
];

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon"
};

const server = http.createServer(async (request, response) => {
  try {
    const requestUrl = new URL(request.url, `http://${request.headers.host || `${host}:${port}`}`);

    if (requestUrl.pathname === "/api/menus" && request.method === "GET") {
      sendJson(response, listMenus());
      return;
    }

    const statusMatch = requestUrl.pathname.match(/^\/api\/menus\/([^/]+)\/status$/);
    if (statusMatch && request.method === "PUT") {
      const code = decodeURIComponent(statusMatch[1]);
      const body = await readJsonBody(request);
      sendJson(response, updateMenuStatus(code, body.status));
      return;
    }

    serveStatic(requestUrl.pathname, response);
  } catch (error) {
    sendJson(response, { message: error.message }, error.statusCode || 500);
  }
});

if (require.main === module) {
  server.listen(port, host, () => {
    console.log(`Admin policy server running at http://${host}:${port}/`);
  });
}

function listMenus() {
  return fs
    .readdirSync(menusDir)
    .filter((fileName) => fileName.endsWith(".md"))
    .map((fileName) => parseMenuDoc(path.join(menusDir, fileName)))
    .sort(compareMenus)
    .map((menu, index) => ({
      ...menu,
      id: `menu-${index + 1}`,
      number: index + 1
    }));
}

function updateMenuStatus(code, status) {
  if (!/^ADM-[A-Z]+-\d{3}$/.test(code)) {
    throw badRequest("올바르지 않은 메뉴 코드입니다.");
  }
  if (!validStatuses.has(status)) {
    throw badRequest("상태는 정의됨, 준비중, 검토중 중 하나여야 합니다.");
  }

  const filePath = path.join(menusDir, `${code}.md`);
  assertInsideMenus(filePath);
  if (!fs.existsSync(filePath)) {
    const error = new Error(`${code} 문서를 찾을 수 없습니다.`);
    error.statusCode = 404;
    throw error;
  }

  const text = fs.readFileSync(filePath, "utf8");
  const nextText = replaceStatusLine(text, status);
  fs.writeFileSync(filePath, nextText, "utf8");
  writeMenusIndex();
  return parseMenuDoc(filePath);
}

function parseMenuDoc(filePath, number = 0) {
  const text = fs.readFileSync(filePath, "utf8");
  const fileCode = path.basename(filePath, ".md");
  const titleMatch = text.match(/^#\s+(\S+)\s+(.+)$/m);
  const info = parseInfoSection(text);
  const code = info["메뉴 코드"] || titleMatch?.[1] || fileCode;
  const title = info["좌측 2메뉴"] || titleMatch?.[2] || code;
  const description = readSection(text, "업무 설명");
  const tabDetails = readTabDetailSection(text, "탭별 상세 설계");

  return {
    id: `menu-${number || code}`,
    number,
    code,
    title,
    top: info["상단 메뉴"] || "미분류",
    left1: info["좌측 1메뉴"] || "미분류",
    left2: title,
    status: info["상태"] || "정의됨",
    legacy: info["구 어드민 매핑"] || "신규 정책 정의",
    purpose: readSection(text, "화면 목적") || "화면 목적 정의 필요",
    description,
    tabs: readBulletSection(text, "탭 구성"),
    tabDetails,
    approvalProcess: readApprovalProcessSection(text, "결재 프로세스", tabDetails),
    docPath: `./docs/menus/${code}.md`
  };
}

function compareMenus(a, b) {
  const topDiff = getTopMenuOrder(a.top) - getTopMenuOrder(b.top);
  if (topDiff) return topDiff;

  const codeDiff = getCodeNumber(a.code) - getCodeNumber(b.code);
  if (codeDiff) return codeDiff;

  return a.code.localeCompare(b.code);
}

function getTopMenuOrder(topMenu) {
  const index = topMenuOrder.indexOf(topMenu);
  return index === -1 ? topMenuOrder.length : index;
}

function getCodeNumber(code) {
  const match = code.match(/-(\d{3})$/);
  return match ? Number(match[1]) : Number.MAX_SAFE_INTEGER;
}

function writeMenusIndex() {
  const outputPath = path.join(rootDir, "docs", "menus-index.json");
  fs.writeFileSync(outputPath, `${JSON.stringify(listMenus(), null, 2)}\n`, "utf8");
}

function parseInfoSection(text) {
  const info = {};
  const section = readSection(text, "기본 정보");
  for (const line of section.split(/\r?\n/)) {
    const match = line.match(/^-\s*([^:]+):\s*(.*)$/);
    if (match) {
      info[match[1].trim()] = match[2].trim();
    }
  }
  return info;
}

function readSection(text, heading) {
  const lines = text.split(/\r?\n/);
  const headingPattern = new RegExp(`^##\\s+${escapeRegExp(heading)}\\s*$`);
  const startIndex = lines.findIndex((line) => headingPattern.test(line.trim()));
  if (startIndex === -1) return "";

  const body = [];
  for (let index = startIndex + 1; index < lines.length; index += 1) {
    if (/^##\s+/.test(lines[index])) break;
    body.push(lines[index]);
  }
  return body.join("\n").trim();
}

function readBulletSection(text, heading) {
  return readSection(text, heading)
    .split(/\r?\n/)
    .map((line) => line.match(/^-\s+(.+)$/)?.[1]?.trim())
    .filter(Boolean);
}

function readApprovalProcessSection(text, heading, tabDetails = []) {
  const section = readSection(text, heading);
  const lines = section
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const entries = [];
  for (const line of lines) {
    const bullet = line.match(/^-\s+(.+)$/)?.[1]?.trim();
    if (!bullet || bullet === "해당사항 없음") continue;

    const [tabName, ...rest] = bullet.split(":");
    if (rest.length) {
      entries.push({
        tab: tabName.trim(),
        process: rest.join(":").trim()
      });
    } else {
      entries.push({
        tab: bullet,
        process: ""
      });
    }
  }

  if (entries.length) {
    return {
      summary: entries.map((entry) => entry.tab).join(", "),
      tabs: entries
    };
  }

  const inferred = inferApprovalProcess(tabDetails);
  if (inferred.length) {
    return {
      summary: inferred.map((entry) => entry.tab).join(", "),
      tabs: inferred
    };
  }

  return {
    summary: "해당사항 없음",
    tabs: []
  };
}

function inferApprovalProcess(tabDetails = []) {
  const positivePatterns = [
    /결재\s*상신/,
    /상신/,
    /승인\s*(완료|흐름|대상|후|자|선|로그)/,
    /승인자/,
    /반려/,
    /예외\s*(승인|인정|처리)/,
    /2단계\s*승인/,
    /준법\s*검토/,
    /정책\s*변경/,
    /상태\s*변경/,
    /차단/,
    /해제/,
    /보정/,
    /확정/,
    /파기/,
    /지급/,
    /회수/,
    /게시/,
    /반영/
  ];
  const negativeOnlyPatterns = [
    /^조회.*결재 없이/,
    /직접 수행하지 않는다/,
    /승인 액션이 아니다/,
    /수정할 수 없/
  ];

  return tabDetails
    .filter((detail) => {
      const approval = detail.approval || "";
      const hasPositive = positivePatterns.some((pattern) => pattern.test(approval));
      const explicitlyNoApproval = /(결재상신 대상이 아니다|결재상신이 없다|승인 액션이 아니다|직접 수행하지 않는다)/.test(approval);
      const hasApprovalAction = /(승인 대상|승인 흐름|승인 완료|승인자|승인 후|2단계 승인|준법 검토|반려|예외 승인|상신(?! 대상이 아니다))/.test(approval);
      const isNegativeOnly = negativeOnlyPatterns.some((pattern) => pattern.test(approval))
        && !/(상태 변경|차단|해제|보정|확정|파기|지급|회수|게시|반영|예외|수동|정책 변경)/.test(approval);
      return hasPositive && !isNegativeOnly && !(explicitlyNoApproval && !hasApprovalAction);
    })
    .map((detail) => ({
      tab: detail.name,
      process: detail.approval
    }));
}

function readTabDetailSection(text, heading) {
  const section = readSection(text, heading);
  if (!section) return [];

  const keyMap = {
    "업무 목적": "purpose",
    "검색 조건": "search",
    "목록 컬럼": "columns",
    "상세보기 정보": "detail",
    "주요 기능": "actions",
    "결재/승인": "approval",
    "연계 메뉴": "links",
    "권한/감사": "audit"
  };
  const details = [];
  let current = null;

  for (const rawLine of section.split(/\r?\n/)) {
    const line = rawLine.trim();
    const headingMatch = line.match(/^###\s+(.+)$/);
    if (headingMatch) {
      current = { name: headingMatch[1].trim() };
      details.push(current);
      continue;
    }

    const bulletMatch = line.match(/^-\s*([^:]+):\s*(.*)$/);
    if (current && bulletMatch) {
      const key = keyMap[bulletMatch[1].trim()] || bulletMatch[1].trim();
      current[key] = bulletMatch[2].trim();
    }
  }

  return details;
}

function replaceStatusLine(text, status) {
  if (/^-\s*상태:\s*.*$/m.test(text)) {
    return text.replace(/^-\s*상태:\s*.*$/m, `- 상태: ${status}`);
  }

  if (/^##\s+기본 정보\s*$/m.test(text)) {
    return text.replace(/(^##\s+기본 정보\s*$)/m, `$1\n\n- 상태: ${status}`);
  }

  return `${text.trimEnd()}\n\n## 기본 정보\n\n- 상태: ${status}\n`;
}

function serveStatic(pathname, response) {
  const normalizedPath = pathname === "/" ? "/index.html" : decodeURIComponent(pathname);
  const filePath = path.normalize(path.join(rootDir, normalizedPath));

  if (!filePath.startsWith(rootDir)) {
    sendText(response, "Forbidden", 403);
    return;
  }
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    sendText(response, "Not found", 404);
    return;
  }

  const extension = path.extname(filePath).toLowerCase();
  response.writeHead(200, {
    "Content-Type": mimeTypes[extension] || "application/octet-stream",
    "Cache-Control": "no-store"
  });
  fs.createReadStream(filePath).pipe(response);
}

function readJsonBody(request) {
  return new Promise((resolve, reject) => {
    let raw = "";
    request.on("data", (chunk) => {
      raw += chunk;
      if (raw.length > 1024 * 1024) {
        reject(badRequest("요청 본문이 너무 큽니다."));
        request.destroy();
      }
    });
    request.on("end", () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch (error) {
        reject(badRequest("JSON 본문을 해석할 수 없습니다."));
      }
    });
    request.on("error", reject);
  });
}

function assertInsideMenus(filePath) {
  const relative = path.relative(menusDir, filePath);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw badRequest("메뉴 문서 경로를 벗어날 수 없습니다.");
  }
}

function sendJson(response, data, statusCode = 200) {
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store"
  });
  response.end(JSON.stringify(data));
}

function sendText(response, text, statusCode = 200) {
  response.writeHead(statusCode, {
    "Content-Type": "text/plain; charset=utf-8",
    "Cache-Control": "no-store"
  });
  response.end(text);
}

function badRequest(message) {
  const error = new Error(message);
  error.statusCode = 400;
  return error;
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

module.exports = {
  listMenus,
  parseMenuDoc,
  updateMenuStatus,
  writeMenusIndex
};

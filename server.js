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

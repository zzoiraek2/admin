const fs = require("fs");
const path = require("path");
const { listMenus } = require("../server");

const menusDir = path.join(__dirname, "..", "docs", "menus");

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

const nonActionOnly = /^(조회|모니터링).*결재 없이/;

function hasApprovalProcess(detail) {
  const approval = detail.approval || "";
  const hasPositive = positivePatterns.some((pattern) => pattern.test(approval));
  const hasActionImpact = /(상태 변경|차단|해제|보정|확정|파기|지급|회수|게시|반영|예외|수동|정책 변경|초기화)/.test(approval);
  const explicitlyNoApproval = /(결재상신 대상이 아니다|결재상신이 없다|승인 액션이 아니다|직접 수행하지 않는다)/.test(approval);
  const hasApprovalAction = /(승인 대상|승인 흐름|승인 완료|승인자|승인 후|2단계 승인|준법 검토|반려|예외 승인|상신(?! 대상이 아니다))/.test(approval);
  return hasPositive
    && !(nonActionOnly.test(approval) && !hasActionImpact)
    && !(explicitlyNoApproval && !hasApprovalAction);
}

function renderApprovalProcess(menu) {
  if (menu.code === "ADM-WAL-013" || menu.code === "ADM-SETTLE-014") {
    return ["## 결재 프로세스", "", "- 해당사항 없음", ""];
  }

  const entries = (menu.tabDetails || []).filter(hasApprovalProcess);
  const lines = ["## 결재 프로세스", ""];

  if (!entries.length) {
    lines.push("- 해당사항 없음", "");
    return lines;
  }

  for (const detail of entries) {
    lines.push(`- ${detail.name}: ${detail.approval}`);
  }
  lines.push("");
  return lines;
}

function replaceOrInsertApprovalProcess(text, lines) {
  const source = text.split(/\r?\n/);
  const existingStart = source.findIndex((line) => line.trim() === "## 결재 프로세스");

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

  const descriptionStart = source.findIndex((line) => line.trim() === "## 업무 설명");
  if (descriptionStart !== -1) {
    let descriptionEnd = source.length;
    for (let index = descriptionStart + 1; index < source.length; index += 1) {
      if (/^##\s+/.test(source[index])) {
        descriptionEnd = index;
        break;
      }
    }
    return [...source.slice(0, descriptionEnd), "", ...lines, ...source.slice(descriptionEnd)].join("\n");
  }

  return `${text.trimEnd()}\n\n${lines.join("\n")}\n`;
}

let changed = 0;

for (const menu of listMenus()) {
  const filePath = path.join(menusDir, `${menu.code}.md`);
  const before = fs.readFileSync(filePath, "utf8");
  const after = replaceOrInsertApprovalProcess(before, renderApprovalProcess(menu));
  if (after !== before) {
    fs.writeFileSync(filePath, after, "utf8");
    changed += 1;
  }
}

console.log(`Updated approval process sections in ${changed} menu docs.`);

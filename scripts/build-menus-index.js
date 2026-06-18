const fs = require("fs");
const path = require("path");
const { listMenus } = require("../server");

const outputPath = path.join(__dirname, "..", "docs", "menus-index.json");
const menus = listMenus();

fs.writeFileSync(outputPath, `${JSON.stringify(menus, null, 2)}\n`, "utf8");

console.log(`Wrote ${menus.length} menu records to ${path.relative(process.cwd(), outputPath)}`);

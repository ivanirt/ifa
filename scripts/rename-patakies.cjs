/**
 * One-off: rename pataki files and lift odun/order into YAML.
 * Pataki - <odun> - <order> - <title>.md  ->  <title>.md
 */
const fs = require("fs");
const path = require("path");

const DIR = path.join(__dirname, "..", "patakies");

function sanitize(name) {
  return name
    .replace(/[<>:"/\\|?*]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/[. ]+$/g, "");
}

function parseName(filename) {
  const base = filename.replace(/\.md$/i, "");
  const m = base.match(/^Pataki\s+-\s+(.+?)\s+-\s+(\d+)\s+-\s+(.+)$/i);
  if (!m) return null;
  return { odun: m[1].trim(), order: parseInt(m[2], 10), title: m[3].trim() };
}

function yamlEscape(s) {
  if (/[:#{}[\],&*?|<>=!%@`]/.test(s) || /^\s|\s$/.test(s)) {
    return JSON.stringify(s);
  }
  return s;
}

function upsertFrontmatter(raw, extra) {
  const text = raw.replace(/\r\n/g, "\n");
  let data = {};
  let body = text;
  if (text.startsWith("---")) {
    const end = text.indexOf("\n---", 3);
    if (end >= 0) {
      const yaml = text.slice(4, end);
      body = text.slice(end + 4).replace(/^\s*\n/, "");
      for (const line of yaml.split("\n")) {
        const m = line.match(/^([A-Za-z0-9_]+):\s*(.*)$/);
        if (m) data[m[1]] = m[2].trim();
      }
    }
  }
  data.type = "pataki";
  data.odun = extra.odun.startsWith("[[") ? extra.odun : `[[${extra.odun}]]`;
  data.order = String(extra.order);
  data.title = yamlEscape(extra.title);
  const keep = [];
  const seen = new Set(["type", "odun", "order", "title"]);
  for (const key of ["type", "odun", "order", "title"]) {
    keep.push(`${key}: ${data[key]}`);
  }
  if (text.startsWith("---")) {
    const end = text.indexOf("\n---", 3);
    if (end >= 0) {
      let listKey = null;
      const orig = text.slice(4, end).split("\n");
      for (const line of orig) {
        const m = line.match(/^([A-Za-z0-9_]+):\s*(.*)$/);
        if (m) {
          listKey = m[2].trim() === "" || m[2].trim() === "|" ? m[1] : null;
          if (seen.has(m[1])) continue;
          seen.add(m[1]);
          keep.push(line);
          continue;
        }
        if (listKey && /^\s+-\s+/.test(line)) keep.push(line);
      }
    }
  }
  body = body.replace(/^#\s+Pataki:[^\n]*\n+/, `# ${extra.title}\n\n`);
  if (!body.startsWith("#")) body = `# ${extra.title}\n\n${body}`;
  return `---\n${keep.join("\n")}\n---\n${body.startsWith("\n") ? body : `\n${body}`}`;
}

const files = fs.readdirSync(DIR).filter((f) => f.endsWith(".md"));
const used = new Set();
let renamed = 0;
for (const file of files) {
  const parsed = parseName(file);
  if (!parsed) continue;
  let dest = `${sanitize(parsed.title)}.md`;
  if (!dest || dest === ".md") dest = `pataki-${parsed.order}.md`;
  const base = dest.replace(/\.md$/i, "");
  let n = dest;
  let i = 2;
  while (used.has(n.toLowerCase()) || (fs.existsSync(path.join(DIR, n)) && n !== file)) {
    n = `${base} (${String(parsed.order).padStart(2, "0")}).md`;
    if (used.has(n.toLowerCase())) n = `${base} (${i++}).md`;
  }
  used.add(n.toLowerCase());
  const from = path.join(DIR, file);
  const raw = fs.readFileSync(from, "utf8");
  const next = upsertFrontmatter(raw, parsed);
  const to = path.join(DIR, n);
  fs.writeFileSync(from, next, "utf8");
  if (n !== file) {
    fs.renameSync(from, to);
  }
  renamed += 1;
}
console.log(`updated ${renamed} files`);

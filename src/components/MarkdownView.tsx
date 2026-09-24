"use client";

import { Fragment, type ReactNode } from "react";

function wiki(text: string): string {
  return text
    .replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, "$2")
    .replace(/\[\[([^\]]+)\]\]/g, "$1");
}

function inline(text: string): ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-semibold text-[#241B16]">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("*") && part.endsWith("*")) {
      return (
        <em key={i} className="italic">
          {part.slice(1, -1)}
        </em>
      );
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code key={i} className="border border-[#EADBCE] bg-[#FAF7F2] px-1 text-[0.9em] text-[#241B16]">
          {part.slice(1, -1)}
        </code>
      );
    }
    return <Fragment key={i}>{part}</Fragment>;
  });
}

function isBullet(line: string): boolean {
  return /^\s*[-*]\s+/.test(line);
}

function isNumbered(line: string): boolean {
  return /^\s*\d+[.)]\s+/.test(line);
}

function headingLevel(line: string): number {
  const m = line.match(/^(#{1,4})\s+/);
  return m ? m[1].length : 0;
}

export function MarkdownView({ source }: { source: string }) {
  const text = wiki(source).trim();
  if (!text) return <p className="text-sm text-[#6D5E52]">—</p>;

  const lines = text.split("\n");
  const nodes: ReactNode[] = [];
  let i = 0;
  let key = 0;

  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim() || /^---+$/.test(line.trim())) {
      i += 1;
      continue;
    }

    const level = headingLevel(line);
    if (level) {
      const body = line.replace(/^#{1,4}\s+/, "");
      const cls =
        level <= 2
          ? "mt-4 font-serif text-xl text-[#241B16] first:mt-0"
          : "mt-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#C4A574] first:mt-0";
      const Tag = (level <= 2 ? "h3" : "h4") as "h3" | "h4";
      nodes.push(
        <Tag key={key++} className={cls}>
          {inline(body)}
        </Tag>,
      );
      i += 1;
      continue;
    }

    if (line.trim().startsWith("```")) {
      const fence: string[] = [];
      i += 1;
      while (i < lines.length && !lines[i].trim().startsWith("```")) {
        fence.push(lines[i]);
        i += 1;
      }
      if (i < lines.length) i += 1;
      nodes.push(
        <pre
          key={key++}
          className="my-3 overflow-x-auto border border-[#EADBCE] bg-[#FAF7F2] px-4 py-3 font-mono text-sm leading-relaxed text-[#241B16]"
        >
          {fence.join("\n")}
        </pre>,
      );
      continue;
    }

    if (line.trim().startsWith(">")) {
      const quoted: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith(">")) {
        quoted.push(lines[i].replace(/^\s*>\s?/, ""));
        i += 1;
      }
      nodes.push(
        <blockquote
          key={key++}
          className="my-3 border-l-2 border-[#C4A574] pl-4 text-sm leading-relaxed text-[#6D5E52]"
        >
          {inline(quoted.join(" "))}
        </blockquote>,
      );
      continue;
    }

    if (isBullet(line)) {
      const items: string[] = [];
      while (i < lines.length && isBullet(lines[i])) {
        items.push(lines[i].replace(/^\s*[-*]\s+/, ""));
        i += 1;
      }
      nodes.push(
        <ul key={key++} className="my-2 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-[#6D5E52]">
          {items.map((item, idx) => (
            <li key={idx}>{inline(item)}</li>
          ))}
        </ul>,
      );
      continue;
    }

    if (isNumbered(line)) {
      const items: string[] = [];
      while (i < lines.length && isNumbered(lines[i])) {
        items.push(lines[i].replace(/^\s*\d+[.)]\s+/, ""));
        i += 1;
      }
      nodes.push(
        <ol key={key++} className="my-2 list-decimal space-y-1.5 pl-5 text-sm leading-relaxed text-[#6D5E52]">
          {items.map((item, idx) => (
            <li key={idx}>{inline(item)}</li>
          ))}
        </ol>,
      );
      continue;
    }

    if (line.includes("|") && line.trim().startsWith("|")) {
      const rows: string[][] = [];
      while (i < lines.length && lines[i].includes("|")) {
        const cells = lines[i]
          .split("|")
          .map((c) => c.trim())
          .filter((c, idx, arr) => !(idx === 0 && !c) && !(idx === arr.length - 1 && !c));
        if (!cells.every((c) => /^:?-+:?$/.test(c))) rows.push(cells);
        i += 1;
      }
      if (rows.length) {
        nodes.push(
          <div key={key++} className="my-3 overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm text-[#6D5E52]">
              <tbody>
                {rows.map((row, ri) => (
                  <tr key={ri} className="border-b border-[#EADBCE]">
                    {row.map((cell, ci) => (
                      <td key={ci} className={`py-1.5 pr-3 ${ri === 0 ? "font-medium text-[#241B16]" : ""}`}>
                        {inline(cell)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>,
        );
        continue;
      }
    }

    const para: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() &&
      !headingLevel(lines[i]) &&
      !isBullet(lines[i]) &&
      !isNumbered(lines[i]) &&
      !lines[i].trim().startsWith(">") &&
      !/^---+$/.test(lines[i].trim())
    ) {
      para.push(lines[i]);
      i += 1;
    }
    nodes.push(
      <p key={key++} className="my-2 text-sm leading-relaxed text-[#6D5E52] first:mt-0">
        {inline(para.join(" "))}
      </p>,
    );
  }

  return <div className="markdown-body">{nodes}</div>;
}

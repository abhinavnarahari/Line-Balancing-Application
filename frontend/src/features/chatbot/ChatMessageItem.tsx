import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Copy, Check, ThumbsUp, ThumbsDown, Database, Sparkles, AlertCircle, CornerDownRight, Download, ExternalLink, ArrowRight } from "lucide-react";
import type { ChatMessage } from "./types";
import { DataTableResponse } from "./DataTableResponse";
import { ChartResponse } from "./ChartResponse";
import { submitChatFeedback } from "./api";

interface ChatMessageItemProps {
  message: ChatMessage;
  onSelectPrompt?: (prompt: string) => void;
}

export const ChatMessageItem: React.FC<ChatMessageItemProps> = ({ message, onSelectPrompt }) => {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const [feedback, setFeedback] = useState<"up" | "down" | null>(null);

  const isUser = message.sender === "USER";

  const handleCopy = () => {
    navigator.clipboard.writeText(message.messageText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const content = `# SewNexa Assistant Report\nDate: ${new Date().toLocaleString()}\n\n${message.messageText}\n`;
    const blob = new Blob([content], { type: "text/markdown;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `sewnexa_report_${timestamp}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 2000);
  };

  const handleFeedback = async (helpful: boolean) => {
    setFeedback(helpful ? "up" : "down");
    try {
      await submitChatFeedback({ messageId: message.id, helpful });
    } catch (err) {
      console.error("Failed to submit feedback", err);
    }
  };

  /**
   * Enterprise Markdown Block Parser (Supports Tables, Headers, Code, Lists, Links, Callouts)
   */
  const renderCellContent = (cell: string, _headerName?: string) => {
    const trimmed = cell.trim();

    // Sequence badge e.g. #1, #2, #01
    if (/^#\d+$/.test(trimmed)) {
      return (
        <span className="w-6 h-6 rounded-md inline-flex items-center justify-center font-mono font-bold text-[11px] bg-slate-100 border border-slate-200 text-slate-700">
          {trimmed}
        </span>
      );
    }

    // Operation Code / Style / Bulletin code e.g. OP-001, OB-POLO-800
    if (/^(OP|STY|OB|SZ|LN|EM|ORD)-[A-Z0-9_-]+$/i.test(trimmed)) {
      return (
        <span className="font-mono font-bold text-amber-800 text-xs bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 shadow-2xs">
          {trimmed}
        </span>
      );
    }

    // Statuses
    if (["PUBLISHED", "ACTIVE", "IN_PROGRESS", "RUNNING", "COMPLETED"].includes(trimmed.toUpperCase())) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10.5px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
          {trimmed}
        </span>
      );
    }
    if (["DRAFT", "PENDING", "HOLD", "INACTIVE"].includes(trimmed.toUpperCase())) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10.5px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
          {trimmed}
        </span>
      );
    }

    // SMVs or Durations e.g. 27.0s, 3.700 min
    if (/^\d+(\.\d+)?\s*(s|sec|secs|min|mins|pcs|%)?$/i.test(trimmed)) {
      return (
        <span className="font-mono font-bold text-slate-900 text-xs">
          {trimmed}
        </span>
      );
    }

    return renderInlineFormatting(trimmed);
  };

  const renderInlineFormatting = (text: string) => {
    // Regex matches Markdown Links [Label](url), Bold (**bold**), Code (`code`), Italics (*italic*)
    const parts = text.split(/(\[.*?\]\(.*?\)|\*\*.*?\*\*|`.*?`|\*.*?\*)/g);
    return parts.map((part, idx) => {
      // 1. Markdown Links [Label](/path)
      if (part.startsWith("[") && part.includes("](") && part.endsWith(")")) {
        const linkMatch = part.match(/^\[(.*?)\]\((.*?)\)$/);
        if (linkMatch) {
          const [, linkText, linkUrl] = linkMatch;
          const isInternal = linkUrl.startsWith("/");
          return (
            <button
              key={idx}
              type="button"
              onClick={() => {
                if (isInternal) {
                  navigate(linkUrl);
                } else {
                  window.open(linkUrl, "_blank", "noopener,noreferrer");
                }
              }}
              className="inline-flex items-center gap-1 font-medium text-[#9C5B3C] hover:text-[#723E28] underline underline-offset-2 decoration-[#9C5B3C]/40 hover:decoration-[#723E28] cursor-pointer group"
              title={`Navigate to ${linkUrl}`}
            >
              <span>{linkText}</span>
              {isInternal ? (
                <ArrowRight className="h-3 w-3" />
              ) : (
                <ExternalLink className="h-3 w-3" />
              )}
            </button>
          );
        }
      }

      // 2. Bold text
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong key={idx} className="font-semibold text-slate-900">
            {part.slice(2, -2)}
          </strong>
        );
      }

      // 3. Inline code
      if (part.startsWith("`") && part.endsWith("`")) {
        return (
          <code key={idx} className="px-1.5 py-0.5 rounded-md bg-slate-100 border border-slate-200 font-mono text-[11px] font-semibold text-slate-800">
            {part.slice(1, -1)}
          </code>
        );
      }

      // 4. Italics
      if (part.startsWith("*") && part.endsWith("*") && !part.startsWith("**")) {
        return (
          <em key={idx} className="text-slate-600 italic">
            {/* italic notes can contain links, e.g. "*… open [Line Balancing](/line-balance) …*" */}
            {renderInlineFormatting(part.slice(1, -1))}
          </em>
        );
      }

      return part;
    });
  };

  const renderMarkdownBlocks = (rawText: string) => {
    const lines = rawText.split("\n");
    const elements: React.ReactNode[] = [];
    let i = 0;

    while (i < lines.length) {
      const line = lines[i];
      const trimmed = line.trim();

      // 1. Table Detection (| ... |)
      if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
        const tableLines: string[] = [];
        while (i < lines.length && lines[i].trim().startsWith("|") && lines[i].trim().endsWith("|")) {
          tableLines.push(lines[i].trim());
          i++;
        }

        if (tableLines.length >= 2) {
          const headerRow = tableLines[0].split("|").slice(1, -1).map(h => h.trim());
          // Skip divider row (index 1)
          const dataRows = tableLines.slice(2).map(r => r.split("|").slice(1, -1).map(c => c.trim()));

          elements.push(
            <div key={`tbl-${i}`} className="my-3 rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden w-full">
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[10.5px] font-bold text-slate-600 uppercase tracking-wider">
                      {headerRow.map((h, hIdx) => (
                        <th key={hIdx} className="py-2.5 px-3.5 whitespace-nowrap">
                          {renderInlineFormatting(h)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {dataRows.map((row, rIdx) => (
                      <tr key={rIdx} className="hover:bg-slate-50/80 transition-colors">
                        {row.map((cell, cIdx) => (
                          <td key={cIdx} className="py-2.5 px-3.5 text-slate-800 font-medium whitespace-nowrap text-xs">
                            {renderCellContent(cell, headerRow[cIdx])}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
          continue;
        }
      }

      // 2. Headings (###, ####, ##)
      if (trimmed.startsWith("### ")) {
        elements.push(
          <div key={`h3-${i}`} className="text-[13px] font-semibold text-slate-900 mt-3 mb-1">
            <span>{renderInlineFormatting(trimmed.substring(4))}</span>
          </div>
        );
        i++;
        continue;
      }
      if (trimmed.startsWith("#### ")) {
        elements.push(
          <div key={`h4-${i}`} className="text-xs font-semibold text-slate-500 mt-2.5 mb-1">
            {renderInlineFormatting(trimmed.substring(5))}
          </div>
        );
        i++;
        continue;
      }

      // 3. Bullet Lists (- , * , • )
      if (trimmed.startsWith("- ") || trimmed.startsWith("* ") || trimmed.startsWith("• ")) {
        elements.push(
          <li key={`li-${i}`} className="ml-4 list-disc text-[13px] text-slate-700 leading-relaxed marker:text-slate-400 my-0.5">
            {renderInlineFormatting(trimmed.substring(2))}
          </li>
        );
        i++;
        continue;
      }

      // 4. Numbered Lists (1. , 2. )
      if (/^\d+\.\s/.test(trimmed)) {
        const dotIdx = trimmed.indexOf(".");
        const num = trimmed.substring(0, dotIdx + 1);
        const content = trimmed.substring(dotIdx + 1).trim();
        elements.push(
          <div key={`num-${i}`} className="flex items-start gap-1.5 text-[13px] text-slate-700 leading-relaxed my-0.5">
            <span className="text-slate-500 shrink-0 tabular-nums">{num}</span>
            <span>{renderInlineFormatting(content)}</span>
          </div>
        );
        i++;
        continue;
      }

      // 5. Blank Lines
      if (trimmed === "") {
        elements.push(<div key={`blank-${i}`} className="h-1.5" />);
        i++;
        continue;
      }

      // 6. Regular Paragraph
      elements.push(
        <p key={`p-${i}`} className="text-[13px] text-slate-700 leading-relaxed my-1">
          {renderInlineFormatting(line)}
        </p>
      );
      i++;
    }

    return elements;
  };

  // Every assistant answer ends with "*Source: … · as of HH:mm*"; show it as a caption under any table or chart.
  const sourceMatch = isUser ? null : message.messageText.match(/\n*\*Source: ([^\n]+)\*\s*$/);
  const source = sourceMatch?.[1];
  const body = sourceMatch ? message.messageText.slice(0, sourceMatch.index) : message.messageText;

  if (isUser) {
    return (
      <div className="flex justify-end my-4">
        <div className="max-w-[85%] rounded-2xl rounded-br-md bg-[#F3EEE6] px-3.5 py-2 text-[13px] text-slate-900 whitespace-pre-wrap break-words">
          {message.messageText}
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-2.5 my-4">
      <div className="h-7 w-7 rounded-lg bg-[#9C5B3C] text-white flex items-center justify-center shrink-0 mt-0.5" aria-hidden="true">
        <Sparkles className="h-3.5 w-3.5" />
      </div>

      <div className="flex flex-col flex-1 min-w-0 items-start">
        <div className="w-full rounded-xl rounded-tl-md bg-white border border-slate-200 px-4 py-3">
          <div className="space-y-0.5">{renderMarkdownBlocks(body)}</div>

          {/* Structured Payload Metrics Card */}
          {message.structuredPayload?.metrics && (
            <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              {Object.entries(message.structuredPayload.metrics).map(([key, val]) => (
                <div key={key} className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs">
                  <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider truncate">{key}</div>
                  <div className="text-xs font-bold text-slate-900 mt-0.5 font-mono truncate">{String(val)}</div>
                </div>
              ))}
            </div>
          )}

          {/* Structured Payload Table */}
          {message.structuredPayload?.type === "TABLE" && (
            <DataTableResponse payload={message.structuredPayload} />
          )}

          {/* Structured Payload Comparison / Chart */}
          {(message.structuredPayload?.type === "COMPARISON" || message.structuredPayload?.type === "CHART") && (
            <>
              {message.structuredPayload.chartData && <ChartResponse payload={message.structuredPayload} />}
              {message.structuredPayload.rows && <DataTableResponse payload={message.structuredPayload} />}
            </>
          )}

          {/* Structured Alert Callout */}
          {message.structuredPayload?.type === "ALERT" && message.structuredPayload.metrics && (
            <div className="mt-2.5 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5">
              <AlertCircle className="h-4 w-4 text-amber-700 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-950 font-medium space-y-1 w-full">
                {Object.entries(message.structuredPayload.metrics).map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-4">
                    <span className="text-amber-800 font-semibold">{k}:</span>
                    <span className="font-mono font-bold">{String(v)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {source && (
            <p className="mt-3 pt-2 border-t border-slate-100 text-[11px] text-slate-500 flex items-center gap-1.5">
              <Database className="h-3 w-3 shrink-0" />
              <span>Source: {source}</span>
            </p>
          )}
        </div>

        <div className="mt-1 flex items-center gap-0.5 text-slate-400">
          <ActionButton label={copied ? "Copied" : "Copy answer"} onClick={handleCopy}>
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
          </ActionButton>
          <ActionButton label={downloaded ? "Downloaded" : "Download answer (.md)"} onClick={handleDownload}>
            {downloaded ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Download className="h-3.5 w-3.5" />}
          </ActionButton>
          <ActionButton label="Helpful" active={feedback === "up"} onClick={() => handleFeedback(true)}>
            <ThumbsUp className="h-3.5 w-3.5" />
          </ActionButton>
          <ActionButton label="Not helpful" active={feedback === "down"} onClick={() => handleFeedback(false)}>
            <ThumbsDown className="h-3.5 w-3.5" />
          </ActionButton>
        </div>

        {message.suggestedQuestions && message.suggestedQuestions.length > 0 && onSelectPrompt && (
          <div className="mt-1.5 flex flex-col items-start gap-1">
            {message.suggestedQuestions.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => onSelectPrompt(q)}
                className="px-2.5 py-1 text-xs text-slate-600 hover:text-[#9C5B3C] bg-white border border-slate-200 hover:border-[#9C5B3C]/50 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 text-left"
              >
                <CornerDownRight className="h-3 w-3 shrink-0 text-slate-400" />
                <span>{q}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const ActionButton: React.FC<{ label: string; onClick: () => void; active?: boolean; children: React.ReactNode }> = ({
  label,
  onClick,
  active,
  children,
}) => (
  <button
    type="button"
    onClick={onClick}
    title={label}
    aria-label={label}
    aria-pressed={active}
    className={`h-7 w-7 flex items-center justify-center rounded-md transition-colors cursor-pointer ${
      active ? "text-[#9C5B3C] bg-[#F6F1E8]" : "hover:text-slate-700 hover:bg-slate-100"
    }`}
  >
    {children}
  </button>
);

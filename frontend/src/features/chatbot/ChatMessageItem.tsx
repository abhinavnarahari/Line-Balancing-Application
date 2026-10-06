import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Copy, Check, ThumbsUp, ThumbsDown, Database, Sparkles, User, AlertCircle, ArrowRight, Download, ExternalLink } from "lucide-react";
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
              className="inline-flex items-center gap-1.5 px-2.5 py-0.5 mx-1 my-0.5 rounded-lg text-xs font-bold text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200 hover:border-amber-300 transition-all cursor-pointer shadow-2xs hover:shadow-xs group"
              title={`Navigate to ${linkUrl}`}
            >
              <span>{linkText}</span>
              {isInternal ? (
                <ArrowRight className="h-3 w-3 text-amber-700 group-hover:translate-x-0.5 transition-transform" />
              ) : (
                <ExternalLink className="h-3 w-3 text-amber-700" />
              )}
            </button>
          );
        }
      }

      // 2. Bold text
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong key={idx} className="font-bold text-slate-950">
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
            {part.slice(1, -1)}
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
          <div key={`h3-${i}`} className="text-xs font-bold text-slate-900 mt-3 mb-1.5 flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
            <span>{renderInlineFormatting(trimmed.substring(4))}</span>
          </div>
        );
        i++;
        continue;
      }
      if (trimmed.startsWith("#### ")) {
        elements.push(
          <div key={`h4-${i}`} className="text-xs font-bold text-slate-600 uppercase tracking-wider mt-2.5 mb-1">
            {renderInlineFormatting(trimmed.substring(5))}
          </div>
        );
        i++;
        continue;
      }

      // 3. Bullet Lists (- , * , • )
      if (trimmed.startsWith("- ") || trimmed.startsWith("* ") || trimmed.startsWith("• ")) {
        elements.push(
          <li key={`li-${i}`} className="ml-4 list-disc text-xs text-slate-700 leading-relaxed marker:text-amber-600 my-1">
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
          <div key={`num-${i}`} className="flex items-start gap-1.5 text-xs text-slate-700 leading-relaxed my-1">
            <span className="font-bold text-amber-700 shrink-0 font-mono">{num}</span>
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
        <p key={`p-${i}`} className="text-xs text-slate-700 leading-relaxed my-1">
          {renderInlineFormatting(line)}
        </p>
      );
      i++;
    }

    return elements;
  };

  return (
    <div className={`flex gap-3 my-3.5 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
      {/* Avatar */}
      <div
        className={`h-8 w-8 rounded-xl flex items-center justify-center shrink-0 shadow-xs mt-0.5 ${
          isUser
            ? "bg-[#221912] text-white"
            : "bg-gradient-to-br from-[#9C5B3C] to-[#723E28] text-white ring-2 ring-[#9C5B3C]/20 shadow-xs"
        }`}
      >
        {isUser ? <User className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
      </div>

      {/* Message Content Container */}
      <div className={`flex flex-col ${isUser ? "max-w-[85%] sm:max-w-[75%] items-end" : "w-full max-w-full items-start min-w-0"}`}>
        <div
          className={`rounded-2xl px-4 py-3.5 shadow-2xs border w-full ${
            isUser
              ? "bg-[#221912] text-white border-[#3A2B20] rounded-tr-xs"
              : "bg-white text-[#221912] border-[#E6DDCE] rounded-tl-xs"
          }`}
        >
          {/* Text Content */}
          <div className={`space-y-0.5 leading-normal ${isUser ? "[&_*]:!text-white" : ""}`}>
            {renderMarkdownBlocks(message.messageText)}
          </div>

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
        </div>

        {/* Footer Meta & Controls for Assistant */}
        {!isUser && (
          <div className="mt-1.5 flex items-center gap-3 px-1">
            <div className="flex items-center gap-1.5 text-[10px] font-semibold text-emerald-700">
              <Database className="h-3 w-3 text-emerald-600" />
              <span>SewNexa Verified</span>
            </div>

            <div className="h-2.5 w-px bg-slate-200" />

            <button
              onClick={handleCopy}
              className="text-[10px] text-slate-500 hover:text-slate-900 flex items-center gap-1 transition-colors cursor-pointer"
              title="Copy answer"
            >
              {copied ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
              <span>{copied ? "Copied" : "Copy"}</span>
            </button>

            <button
              onClick={handleDownload}
              className="text-[10px] text-slate-500 hover:text-slate-900 flex items-center gap-1 transition-colors cursor-pointer"
              title="Download response report (.md)"
            >
              {downloaded ? <Check className="h-3 w-3 text-emerald-600" /> : <Download className="h-3 w-3" />}
              <span>{downloaded ? "Exported" : "Export"}</span>
            </button>

            <div className="flex items-center gap-1">
              <button
                onClick={() => handleFeedback(true)}
                className={`p-1 rounded-md hover:bg-slate-100 transition-colors cursor-pointer ${
                  feedback === "up" ? "text-emerald-700 bg-emerald-50" : "text-slate-400 hover:text-slate-700"
                }`}
                title="Helpful"
              >
                <ThumbsUp className="h-3 w-3" />
              </button>
              <button
                onClick={() => handleFeedback(false)}
                className={`p-1 rounded-md hover:bg-slate-100 transition-colors cursor-pointer ${
                  feedback === "down" ? "text-red-700 bg-red-50" : "text-slate-400 hover:text-slate-700"
                }`}
                title="Not helpful"
              >
                <ThumbsDown className="h-3 w-3" />
              </button>
            </div>
          </div>
        )}

        {/* Suggested Next Questions Follow-up Chips */}
        {!isUser && message.suggestedQuestions && message.suggestedQuestions.length > 0 && onSelectPrompt && (
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {message.suggestedQuestions.map((q, qIdx) => (
              <button
                key={qIdx}
                onClick={() => onSelectPrompt(q)}
                className="px-3 py-1.5 text-xs font-semibold text-[#8B4E32] bg-white hover:bg-[#F6F1E8] border border-[#E6DDCE] hover:border-[#9C5B3C] rounded-full transition-all shadow-2xs hover:shadow-xs cursor-pointer flex items-center gap-1.5 group text-left"
              >
                <span>{q}</span>
                <ArrowRight className="h-3 w-3 text-[#9C5B3C] group-hover:translate-x-0.5 transition-transform" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

import React, { useState } from "react";
import { Copy, Check, ThumbsUp, ThumbsDown, Database, Sparkles, User, AlertCircle, ArrowRight, Download } from "lucide-react";
import type { ChatMessage } from "./types";
import { DataTableResponse } from "./DataTableResponse";
import { ChartResponse } from "./ChartResponse";
import { submitChatFeedback } from "./api";

interface ChatMessageItemProps {
  message: ChatMessage;
  onSelectPrompt?: (prompt: string) => void;
}

export const ChatMessageItem: React.FC<ChatMessageItemProps> = ({ message, onSelectPrompt }) => {
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
   * Enterprise Markdown Block Parser (Supports Tables, Headers, Code, Lists, Callouts)
   */
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
            <div key={`tbl-${i}`} className="my-3 overflow-x-auto rounded-xl border border-[#E8E2D9] bg-white shadow-2xs">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#FAF7F2] border-b border-[#E8E2D9] text-[11px] font-bold text-[#6B5C50] uppercase tracking-wider">
                    {headerRow.map((h, hIdx) => (
                      <th key={hIdx} className="py-2.5 px-3 whitespace-nowrap">
                        {renderInlineFormatting(h)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0EAE1]">
                  {dataRows.map((row, rIdx) => (
                    <tr key={rIdx} className="hover:bg-[#FAF7F2]/60 transition-colors">
                      {row.map((cell, cIdx) => (
                        <td key={cIdx} className="py-2 px-3 text-[#221912] font-medium whitespace-nowrap">
                          {renderInlineFormatting(cell)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
          continue;
        }
      }

      // 2. Headings (###, ####, ##)
      if (trimmed.startsWith("### ")) {
        elements.push(
          <div key={`h3-${i}`} className="text-sm font-extrabold text-[#221912] mt-3.5 mb-1.5 flex items-center gap-1.5">
            <span>{renderInlineFormatting(trimmed.substring(4))}</span>
          </div>
        );
        i++;
        continue;
      }
      if (trimmed.startsWith("#### ")) {
        elements.push(
          <div key={`h4-${i}`} className="text-xs font-bold text-[#8C7E6E] uppercase tracking-wider mt-2.5 mb-1">
            {renderInlineFormatting(trimmed.substring(5))}
          </div>
        );
        i++;
        continue;
      }

      // 3. Bullet Lists (- , * , • )
      if (trimmed.startsWith("- ") || trimmed.startsWith("* ") || trimmed.startsWith("• ")) {
        elements.push(
          <li key={`li-${i}`} className="ml-4 list-disc text-xs text-[#33251A] leading-relaxed marker:text-[#9C5B3C] my-0.5">
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
          <div key={`num-${i}`} className="flex items-start gap-1.5 text-xs text-[#33251A] leading-relaxed my-0.5">
            <span className="font-bold text-[#9C5B3C] shrink-0 font-mono">{num}</span>
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
        <p key={`p-${i}`} className="text-xs text-[#33251A] leading-relaxed my-0.5">
          {renderInlineFormatting(line)}
        </p>
      );
      i++;
    }

    return elements;
  };

  const renderInlineFormatting = (text: string) => {
    // Regex matches bold (**bold**), code (`code`), or italics (*italic*)
    const parts = text.split(/(\*\*.*?\*\*|`.*?`|\*.*?\*)/g);
    return parts.map((part, idx) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong key={idx} className="font-black text-[#1E1712]">
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith("`") && part.endsWith("`")) {
        return (
          <code key={idx} className="px-1.5 py-0.5 rounded-md bg-[#FAF7F2] border border-[#E8E2D9] font-mono text-[11px] font-bold text-[#9C5B3C]">
            {part.slice(1, -1)}
          </code>
        );
      }
      if (part.startsWith("*") && part.endsWith("*") && !part.startsWith("**")) {
        return (
          <em key={idx} className="text-[#6B5C50] italic">
            {part.slice(1, -1)}
          </em>
        );
      }
      return part;
    });
  };

  return (
    <div className={`flex gap-2.5 my-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
      {/* Avatar */}
      <div
        className={`h-7 w-7 rounded-xl flex items-center justify-center shrink-0 shadow-2xs ${
          isUser
            ? "bg-[#1E1712] text-white"
            : "bg-linear-to-br from-[#9C5B3C] to-[#7D462E] text-white"
        }`}
      >
        {isUser ? <User className="h-3.5 w-3.5" /> : <Sparkles className="h-3.5 w-3.5" />}
      </div>

      {/* Message Content Container */}
      <div className={`max-w-[92%] sm:max-w-[88%] flex flex-col ${isUser ? "items-end" : "items-start"}`}>
        <div
          className={`rounded-2xl px-4 py-3.5 shadow-xs border ${
            isUser
              ? "bg-[#1E1712] text-white border-[#33251A] rounded-tr-xs"
              : "bg-white text-[#221912] border-[#E8E2D9] rounded-tl-xs"
          }`}
        >
          {/* Text Content */}
          <div className={`space-y-0.5 ${isUser ? "[&_*]:!text-white" : ""}`}>
            {renderMarkdownBlocks(message.messageText)}
          </div>

          {/* Structured Payload Metrics Card */}
          {message.structuredPayload?.metrics && (
            <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2 bg-[#FAF7F2] p-2.5 rounded-xl border border-[#E8E2D9]">
              {Object.entries(message.structuredPayload.metrics).map(([key, val]) => (
                <div key={key} className="bg-white p-2 rounded-lg border border-[#EDE7DE] shadow-2xs">
                  <div className="text-[10px] uppercase font-bold text-[#8C7E6E] tracking-wider truncate">{key}</div>
                  <div className="text-xs font-bold text-[#221912] mt-0.5 font-mono truncate">{String(val)}</div>
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
            <div className="mt-2.5 p-2.5 bg-amber-50/80 border border-amber-200/80 rounded-xl flex items-start gap-2">
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
          <div className="mt-1.5 flex items-center gap-2.5 px-1">
            <div className="flex items-center gap-1.5 text-[10px] font-semibold text-[#77876F]">
              <Database className="h-3 w-3 text-[#77876F]" />
              <span>SewNexa Verified</span>
            </div>

            <div className="h-2.5 w-px bg-[#E8E2D9]" />

            <button
              onClick={handleCopy}
              className="text-[10px] text-[#8C7E6E] hover:text-[#221912] flex items-center gap-1 transition-colors cursor-pointer"
              title="Copy answer"
            >
              {copied ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
              <span>{copied ? "Copied" : "Copy"}</span>
            </button>

            <button
              onClick={handleDownload}
              className="text-[10px] text-[#8C7E6E] hover:text-[#221912] flex items-center gap-1 transition-colors cursor-pointer"
              title="Download response report (.md)"
            >
              {downloaded ? <Check className="h-3 w-3 text-emerald-600" /> : <Download className="h-3 w-3" />}
              <span>{downloaded ? "Exported" : "Export"}</span>
            </button>

            <div className="flex items-center gap-0.5">
              <button
                onClick={() => handleFeedback(true)}
                className={`p-1 rounded hover:bg-[#EAE2D5] transition-colors cursor-pointer ${
                  feedback === "up" ? "text-emerald-700 bg-emerald-100" : "text-[#8C7E6E]"
                }`}
                title="Helpful"
              >
                <ThumbsUp className="h-3 w-3" />
              </button>
              <button
                onClick={() => handleFeedback(false)}
                className={`p-1 rounded hover:bg-[#EAE2D5] transition-colors cursor-pointer ${
                  feedback === "down" ? "text-red-700 bg-red-100" : "text-[#8C7E6E]"
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
          <div className="mt-2 flex flex-wrap gap-1.5">
            {message.suggestedQuestions.map((q, qIdx) => (
              <button
                key={qIdx}
                onClick={() => onSelectPrompt(q)}
                className="px-2.5 py-1 text-[11px] font-medium text-[#9C5B3C] bg-white border border-[#E8E2D9] hover:border-[#9C5B3C] hover:bg-[#FAF7F2] rounded-full transition-all shadow-2xs cursor-pointer flex items-center gap-1 group text-left"
              >
                <span>{q}</span>
                <ArrowRight className="h-2.5 w-2.5 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-transform" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

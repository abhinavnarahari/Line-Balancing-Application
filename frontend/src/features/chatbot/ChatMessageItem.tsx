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

  const renderFormattedText = (text: string) => {
    const lines = text.split("\n");
    return lines.map((line, idx) => {
      // Bullet list items
      if (line.trim().startsWith("• ") || line.trim().startsWith("- ") || line.trim().startsWith("* ")) {
        const content = line.trim().substring(2);
        return (
          <li key={idx} className="ml-3.5 list-disc text-xs text-[#33251A] leading-relaxed marker:text-[#9C5B3C]">
            {renderInlineMarkdown(content)}
          </li>
        );
      }
      // Numbered list items
      if (/^\d+\.\s/.test(line.trim())) {
        const dotIdx = line.indexOf(".");
        const num = line.substring(0, dotIdx + 1);
        const content = line.substring(dotIdx + 1).trim();
        return (
          <div key={idx} className="flex items-start gap-1.5 text-xs text-[#33251A] leading-relaxed my-0.5">
            <span className="font-bold text-[#9C5B3C] shrink-0 font-mono">{num}</span>
            <span>{renderInlineMarkdown(content)}</span>
          </div>
        );
      }
      if (line.trim() === "") {
        return <div key={idx} className="h-1.5" />;
      }
      return (
        <p key={idx} className="text-xs text-[#33251A] leading-relaxed">
          {renderInlineMarkdown(line)}
        </p>
      );
    });
  };

  const renderInlineMarkdown = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong key={i} className="font-bold text-[#1E1712]">
            {part.slice(2, -2)}
          </strong>
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
      <div className={`max-w-[88%] flex flex-col ${isUser ? "items-end" : "items-start"}`}>
        <div
          className={`rounded-2xl px-4 py-3 shadow-xs border ${
            isUser
              ? "bg-[#1E1712] text-white border-[#33251A] rounded-tr-xs"
              : "bg-white text-[#221912] border-[#E8E2D9] rounded-tl-xs"
          }`}
        >
          {/* Text Content */}
          <div className={`space-y-1 ${isUser ? "[&_*]:!text-white" : ""}`}>
            {renderFormattedText(message.messageText)}
          </div>

          {/* Structured Payload Metrics Card */}
          {message.structuredPayload?.metrics && (
            <div className="mt-3 grid grid-cols-2 gap-2 bg-[#FAF7F2] p-2.5 rounded-xl border border-[#E8E2D9]">
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

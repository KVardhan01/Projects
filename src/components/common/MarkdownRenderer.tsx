import React, { useState } from 'react';
import { Copy, Check, Code2 } from 'lucide-react';

interface MarkdownRendererProps {
  content: string;
  className?: string;
  onApplyCode?: (code: string) => void;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  content,
  className = '',
  onApplyCode,
}) => {
  if (!content) return null;

  // Split content by fenced code blocks: ```lang ... ```
  const codeBlockRegex = /```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g;
  const parts: { type: 'code' | 'text'; language?: string; text: string }[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push({
        type: 'text',
        text: content.slice(lastIndex, match.index),
      });
    }
    parts.push({
      type: 'code',
      language: match[1]?.trim() || 'python',
      text: match[2]?.trimEnd() || '',
    });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < content.length) {
    parts.push({
      type: 'text',
      text: content.slice(lastIndex),
    });
  }

  return (
    <div className={`space-y-2 text-xs leading-relaxed text-slate-200 ${className}`}>
      {parts.map((part, pIdx) => {
        if (part.type === 'code') {
          return (
            <CodeBlockItem
              key={`cb-${pIdx}`}
              language={part.language || 'python'}
              code={part.text}
              onApplyCode={onApplyCode}
            />
          );
        }
        return <TextMarkdownSection key={`tm-${pIdx}`} rawText={part.text} />;
      })}
    </div>
  );
};

const CodeBlockItem: React.FC<{
  language: string;
  code: string;
  onApplyCode?: (code: string) => void;
}> = ({ language, code, onApplyCode }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isPython =
    language.toLowerCase() === 'python' ||
    language.toLowerCase() === 'py' ||
    language.toLowerCase() === 'qiskit';
  const displayLang = isPython ? 'Python / Qiskit' : language.toUpperCase();

  return (
    <div className="my-2.5 rounded-xl border border-slate-800 bg-slate-950 overflow-hidden shadow-lg">
      <div className="flex items-center justify-between px-3 py-1.5 bg-slate-900/90 border-b border-slate-800 text-[10px] font-mono text-slate-400">
        <div className="flex items-center gap-1.5 text-cyan-400 font-semibold">
          <Code2 className="w-3.5 h-3.5 text-cyan-400" />
          <span>{displayLang}</span>
        </div>
        <div className="flex items-center gap-2">
          {isPython && onApplyCode && (
            <button
              type="button"
              onClick={() => onApplyCode(code)}
              className="flex items-center gap-1 text-cyan-300 hover:text-cyan-100 transition-colors px-2 py-0.5 rounded bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 cursor-pointer font-medium text-[10px]"
              title="Apply to Visual Circuit"
            >
              <Check className="w-3 h-3 text-cyan-400" />
              <span>Apply to Circuit</span>
            </button>
          )}
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1 hover:text-slate-200 transition-colors px-1.5 py-0.5 rounded hover:bg-slate-800 cursor-pointer"
            title="Copy code"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 text-emerald-400" />
                <span className="text-emerald-400 font-semibold">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3 text-slate-400" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      </div>
      <pre className="p-3 text-[11px] font-mono text-cyan-200 overflow-x-auto leading-relaxed whitespace-pre selection:bg-cyan-900 selection:text-white">
        <code>{code}</code>
      </pre>
    </div>
  );
};

const TextMarkdownSection: React.FC<{ rawText: string }> = ({ rawText }) => {
  const lines = rawText.split('\n');
  const elements: React.ReactNode[] = [];
  let currentList: { type: 'ul' | 'ol'; items: string[] } | null = null;

  const flushList = () => {
    if (!currentList) return;
    const isUl = currentList.type === 'ul';
    const listKey = `list-${elements.length}`;
    if (isUl) {
      elements.push(
        <ul key={listKey} className="my-1.5 space-y-1 pl-1">
          {currentList.items.map((item, idx) => (
            <li key={idx} className="flex items-start gap-2">
              <span className="text-cyan-400 font-bold select-none text-[11px] leading-5">•</span>
              <span className="flex-1">{renderInline(item)}</span>
            </li>
          ))}
        </ul>
      );
    } else {
      elements.push(
        <ol key={listKey} className="my-1.5 space-y-1 pl-1">
          {currentList.items.map((item, idx) => (
            <li key={idx} className="flex items-start gap-2">
              <span className="font-mono text-[10px] text-cyan-400 font-semibold select-none leading-5 min-w-[14px]">
                {idx + 1}.
              </span>
              <span className="flex-1">{renderInline(item)}</span>
            </li>
          ))}
        </ol>
      );
    }
    currentList = null;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) {
      flushList();
      continue;
    }

    // Heading 4: ####
    if (trimmed.startsWith('#### ')) {
      flushList();
      elements.push(
        <h4 key={`h4-${i}`} className="text-xs font-bold text-cyan-200/90 font-mono mt-2.5 mb-1">
          {renderInline(trimmed.slice(5))}
        </h4>
      );
      continue;
    }

    // Heading 3: ###
    if (trimmed.startsWith('### ')) {
      flushList();
      elements.push(
        <h3 key={`h3-${i}`} className="text-xs font-bold text-cyan-300 uppercase tracking-wider font-mono mt-3 mb-1">
          {renderInline(trimmed.slice(4))}
        </h3>
      );
      continue;
    }

    // Heading 2: ##
    if (trimmed.startsWith('## ')) {
      flushList();
      elements.push(
        <h2 key={`h2-${i}`} className="text-sm font-bold text-slate-100 font-mono mt-3.5 mb-1.5">
          {renderInline(trimmed.slice(3))}
        </h2>
      );
      continue;
    }

    // Heading 1: #
    if (trimmed.startsWith('# ')) {
      flushList();
      elements.push(
        <h1 key={`h1-${i}`} className="text-sm font-bold text-cyan-200 mt-4 mb-2">
          {renderInline(trimmed.slice(2))}
        </h1>
      );
      continue;
    }

    // Blockquote: >
    if (trimmed.startsWith('> ')) {
      flushList();
      elements.push(
        <blockquote
          key={`bq-${i}`}
          className="border-l-2 border-cyan-500/60 bg-cyan-950/20 px-3 py-1.5 my-2 rounded-r-lg text-cyan-200/90 text-xs italic"
        >
          {renderInline(trimmed.slice(2))}
        </blockquote>
      );
      continue;
    }

    // Unordered List item: - or *
    const ulMatch = trimmed.match(/^[-*]\s+(.*)$/);
    if (ulMatch) {
      if (!currentList || currentList.type !== 'ul') {
        flushList();
        currentList = { type: 'ul', items: [] };
      }
      currentList.items.push(ulMatch[1]);
      continue;
    }

    // Ordered List item: 1. , 2. (or **1. ...**)
    const olMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
    if (olMatch) {
      if (!currentList || currentList.type !== 'ol') {
        flushList();
        currentList = { type: 'ol', items: [] };
      }
      currentList.items.push(olMatch[2]);
      continue;
    }

    // Standalone bold line like **Werner State Construction** or **1. What is a Werner State?**
    if (
      trimmed.startsWith('**') &&
      trimmed.endsWith('**') &&
      trimmed.length >= 5 &&
      !trimmed.slice(2, -2).includes('**')
    ) {
      flushList();
      const boldHeading = trimmed.slice(2, -2);
      elements.push(
        <div key={`bh-${i}`} className="text-xs font-bold text-slate-100 font-mono mt-3 mb-1">
          {renderInline(boldHeading)}
        </div>
      );
      continue;
    }

    // Regular Paragraph Line
    flushList();
    elements.push(
      <p key={`p-${i}`} className="my-1.5 leading-relaxed">
        {renderInline(trimmed)}
      </p>
    );
  }

  flushList();

  return <>{elements}</>;
};

/**
 * Parses inline markdown:
 * - Bold: **text** or __text__
 * - Italic: *text* or _text_
 * - Inline Code: `code`
 * - Math notation: $|0\rangle$, $|1\rangle$, $$...$$, $\rho_W$
 */
function renderInline(text: string): React.ReactNode {
  if (!text) return null;

  // Clean double-dollar math blocks into clean styled formulas
  let sanitized = text.replace(/\$\$([\s\S]*?)\$\$/g, '[$1]');

  // Tokenize string for code (`...`), bold (**...**), italic (*...*), or math ($...$)
  const tokenRegex = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*|__[^_]+__|_[^_]+_|\$[^$]+\$)/g;
  const parts = sanitized.split(tokenRegex);

  return parts.map((part, index) => {
    if (!part) return null;

    // Inline Code: `...`
    if (part.startsWith('`') && part.endsWith('`') && part.length >= 2) {
      const codeContent = part.slice(1, -1);
      return (
        <code
          key={index}
          className="px-1.5 py-0.5 mx-0.5 rounded-md bg-slate-900 border border-slate-700/80 text-cyan-300 font-mono text-[11px] font-medium"
        >
          {codeContent}
        </code>
      );
    }

    // Bold: **...** or __...__
    if (
      ((part.startsWith('**') && part.endsWith('**')) ||
        (part.startsWith('__') && part.endsWith('__'))) &&
      part.length >= 4
    ) {
      const boldContent = part.slice(2, -2);
      return (
        <strong key={index} className="font-semibold text-slate-100">
          {boldContent}
        </strong>
      );
    }

    // Italic: *...* or _..._
    if (
      ((part.startsWith('*') && part.endsWith('*')) ||
        (part.startsWith('_') && part.endsWith('_'))) &&
      part.length >= 2
    ) {
      const italicContent = part.slice(1, -1);
      return (
        <em key={index} className="italic text-slate-300">
          {italicContent}
        </em>
      );
    }

    // Math: $...$
    if (part.startsWith('$') && part.endsWith('$') && part.length >= 2) {
      const mathContent = part.slice(1, -1);
      return (
        <span
          key={index}
          className="px-1 py-0.2 mx-0.5 font-mono text-cyan-200 bg-cyan-950/40 border border-cyan-800/40 rounded text-[11px]"
        >
          {mathContent}
        </span>
      );
    }

    // Normal text - strip any stray double asterisks that weren't matched
    const cleanedText = part.replace(/\*\*/g, '');
    return <React.Fragment key={index}>{cleanedText}</React.Fragment>;
  });
}

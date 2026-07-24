import { useState, useCallback, useRef, useEffect } from 'react';
import { createReactBlockSpec } from '@blocknote/react';
import type { BlockConfig } from '@blocknote/core';

export const InstallCodeBlockConfig = {
  type: 'installCode' as const,
  propSchema: {
    language: { default: 'bash' },
    methodLabel: { default: '' },
  },
  content: 'none' as const,
} satisfies BlockConfig<'installCode', any, 'none'>;

const LANGUAGES = [
  'bash', 'shell', 'dockerfile', 'yaml', 'json', 'toml',
  'javascript', 'typescript', 'python', 'ruby', 'go', 'rust',
  'sql', 'html', 'css', 'markdown', 'text',
];

function InstallCodeEditor({
  block,
  editor,
}: {
  block: any;
  editor: any;
}) {
  const [code, setCode] = useState(() => {
    const content = block.content;
    if (Array.isArray(content)) {
      return content
        .map((c: any) => (typeof c === 'string' ? c : c.text ?? ''))
        .join('');
    }
    return typeof content === 'string' ? content : '';
  });
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [code]);

  const handleCodeChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const val = e.target.value;
      setCode(val);
      editor.updateBlock(block, {
        content: val || ' ',
      });
    },
    [block, editor],
  );

  const handleLanguageChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      editor.updateBlock(block, { props: { ...block.props, language: e.target.value } });
    },
    [block, editor],
  );

  const handleLabelChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      editor.updateBlock(block, { props: { ...block.props, methodLabel: e.target.value } });
    },
    [block, editor],
  );

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <div className="flex items-center gap-2 border-b border-border bg-muted/50 px-3 py-2">
        <input
          value={block.props.methodLabel}
          onChange={handleLabelChange}
          placeholder="Method label (e.g. Docker)"
          className="w-40 rounded border border-border bg-background px-2 py-1 text-xs text-foreground placeholder:text-muted-foreground"
        />
        <select
          value={block.props.language}
          onChange={handleLanguageChange}
          className="rounded border border-border bg-background px-2 py-1 text-xs text-foreground"
        >
          {LANGUAGES.map((l) => (
            <option key={l} value={l}>{l}</option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => {
            navigator.clipboard.writeText(code);
          }}
          className="ml-auto rounded border border-border bg-background px-2 py-1 text-xs text-muted-foreground hover:bg-accent"
        >
          Copy
        </button>
      </div>
      <textarea
        ref={textareaRef}
        value={code}
        onChange={handleCodeChange}
        spellCheck={false}
        className="w-full resize-none bg-card p-3 font-mono text-xs leading-relaxed text-foreground outline-none"
        rows={3}
      />
    </div>
  );
}

export const createInstallCodeBlockSpec = () =>
  createReactBlockSpec(InstallCodeBlockConfig, {
    render({ block, editor }) {
      return <InstallCodeEditor block={block} editor={editor} />;
    },
  })();

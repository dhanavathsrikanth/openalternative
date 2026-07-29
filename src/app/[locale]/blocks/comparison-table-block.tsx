import { useState, useCallback } from 'react';
import { createReactBlockSpec } from '@blocknote/react';
import type { BlockConfig } from '@blocknote/core';

export interface ComparisonData {
  headers: string[];
  rows: string[][];
}

export const ComparisonTableBlockConfig = {
  type: 'comparisonTable' as const,
  propSchema: {
    data: {
      default:
        '{"headers":["Feature","Product A"],"rows":[["Type","Open Source"],["License","MIT"]]}',
    },
  },
  content: 'none' as const,
} satisfies BlockConfig<'comparisonTable', any, 'none'>;

function parseData(raw: string): ComparisonData {
  try {
    const d = JSON.parse(raw);
    if (d.headers && d.rows) return d;
  } catch { /* ignore */ }
  return { headers: ['Feature', 'Product A'], rows: [['', '']] };
}

function ComparisonTableEditor({
  block,
  editor,
}: {
  block: any;
  editor: any;
}) {
  const [data, setData] = useState<ComparisonData>(() => parseData(block.props.data));

  const persist = useCallback(
    (next: ComparisonData) => {
      setData(next);
      editor.updateBlock(block, {
        props: { ...block.props, data: JSON.stringify(next) },
      });
    },
    [block, editor],
  );

  const updateHeader = (col: number, val: string) => {
    const headers = data.headers.map((h, i) => (i === col ? val : h));
    persist({ ...data, headers });
  };

  const updateCell = (row: number, col: number, val: string) => {
    const rows = data.rows.map((r, ri) =>
      ri === row ? r.map((c, ci) => (ci === col ? val : c)) : r,
    );
    persist({ ...data, rows });
  };

  const addColumn = () => {
    if (data.headers.length >= 6) return;
    persist({
      headers: [...data.headers, `Product ${data.headers.length}`],
      rows: data.rows.map((r) => [...r, '']),
    });
  };

  const addRow = () => {
    persist({
      ...data,
      rows: [...data.rows, new Array(data.headers.length).fill('')],
    });
  };

  const removeColumn = (col: number) => {
    if (data.headers.length <= 2) return;
    persist({
      headers: data.headers.filter((_, i) => i !== col),
      rows: data.rows.map((r) => r.filter((_, i) => i !== col)),
    });
  };

  const removeRow = (row: number) => {
    if (data.rows.length <= 1) return;
    persist({
      ...data,
      rows: data.rows.filter((_, i) => i !== row),
    });
  };

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              {data.headers.map((h, ci) => (
                <th key={ci} className="relative px-3 py-2 text-left font-medium text-foreground">
                  <input
                    value={h}
                    onChange={(e) => updateHeader(ci, e.target.value)}
                    className="w-full bg-transparent outline-none"
                  />
                  {data.headers.length > 2 && (
                    <button
                      type="button"
                      onClick={() => removeColumn(ci)}
                      className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive text-destructive-foreground text-[10px] leading-none flex items-center justify-center opacity-0 hover:opacity-100"
                    >
                      &times;
                    </button>
                  )}
                </th>
              ))}
              <th className="w-8" />
            </tr>
          </thead>
          <tbody>
            {data.rows.map((row, ri) => (
              <tr key={ri} className="border-b border-border last:border-0 group">
                {row.map((cell, ci) => (
                  <td key={ci} className="px-3 py-2">
                    <input
                      value={cell}
                      onChange={(e) => updateCell(ri, ci, e.target.value)}
                      placeholder={ci === 0 ? 'Feature name' : 'Value'}
                      className="w-full bg-transparent text-foreground outline-none placeholder:text-muted-foreground/50"
                    />
                  </td>
                ))}
                <td className="w-8 text-center">
                  {data.rows.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeRow(ri)}
                      className="h-5 w-5 rounded text-destructive text-xs opacity-0 group-hover:opacity-100 hover:bg-destructive/10 inline-flex items-center justify-center"
                    >
                      &times;
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex gap-2 border-t border-border bg-muted/30 px-3 py-2">
        <button
          type="button"
          onClick={addRow}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          + Row
        </button>
        <button
          type="button"
          onClick={addColumn}
          disabled={data.headers.length >= 6}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40"
        >
          + Column
        </button>
      </div>
    </div>
  );
}

export const createComparisonTableBlockSpec = () =>
  createReactBlockSpec(ComparisonTableBlockConfig, {
    render({ block, editor }) {
      return <ComparisonTableEditor block={block} editor={editor} />;
    },
  })();

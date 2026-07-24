'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useCreateBlockNote, BlockNoteViewRaw, SuggestionMenuController } from '@blocknote/react';
import '@blocknote/react/style.css';
import { customSchema } from '@/app/blocks/schema';
import { getSlashMenuItems } from '@/app/blocks/slash-menu';

const PRODUCT_ID = 1;

export default function TestEditorPage() {
  const editor = useCreateBlockNote({ schema: customSchema });
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [productName, setProductName] = useState<string>('');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/test-editor?productId=${PRODUCT_ID}`);
      if (!res.ok) return;
      const data = await res.json();
      setProductName(data.name ?? '');

      if (data.contentBlocks && Array.isArray(data.contentBlocks)) {
        const blocks = editor.document;
        editor.replaceBlocks(blocks, data.contentBlocks);
      }
      setLoaded(true);
    }
    load();
  }, [editor]);

  const handleSave = useCallback(async () => {
    setSaveState('saving');
    const blocks = editor.document;
    await fetch('/api/test-editor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId: PRODUCT_ID, contentBlocks: blocks }),
    });
    setSaveState('saved');
    setTimeout(() => setSaveState('idle'), 2000);
  }, [editor]);

  const slashMenuItems = useMemo(
    () => getSlashMenuItems(editor as any),
    [editor],
  );

  return (
    <main className="mx-auto max-w-3xl px-6 lg:px-8 py-12">
      <h1 className="mb-2 text-2xl font-bold">BlockNote Test Editor</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Product #{PRODUCT_ID}
        {productName ? ` \u2014 ${productName}` : ''}
        <span className="ml-2 text-muted-foreground/50">
          \u00B7 Type / for custom blocks
        </span>
      </p>

      {loaded && (
        <BlockNoteViewRaw
          editor={editor as any}
          theme="light"
          onChange={handleSave}
          className="min-h-[300px] rounded-lg border border-border bg-card p-4"
        >
          <SuggestionMenuController
            triggerCharacter="/"
            getItems={async (query) =>
              slashMenuItems.filter(
                (item) =>
                  item.title.toLowerCase().includes(query.toLowerCase()) ||
                  item.subtext?.toLowerCase().includes(query.toLowerCase()) ||
                  item.aliases?.some((a) =>
                    a.toLowerCase().includes(query.toLowerCase()),
                  ),
              )
            }
          />
        </BlockNoteViewRaw>
      )}

      <div className="mt-4 flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saveState === 'saving'}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
        >
          {saveState === 'saving' ? 'Saving\u2026' : saveState === 'saved' ? 'Saved' : 'Save'}
        </button>
        <span className="text-xs text-muted-foreground">
          {saveState === 'saved' ? 'Changes saved to Postgres' : 'Auto-saves on change'}
        </span>
      </div>
    </main>
  );
}

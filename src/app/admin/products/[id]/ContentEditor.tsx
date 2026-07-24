'use client'

import { useCallback, useEffect, useMemo, useRef, useState, forwardRef, useImperativeHandle } from 'react'
import { useCreateBlockNote, BlockNoteViewRaw, SuggestionMenuController } from '@blocknote/react'
import '@blocknote/react/style.css'
import { customSchema } from '@/app/blocks/schema'
import { getSlashMenuItems } from '@/app/blocks/slash-menu'
import { DefaultBlockNoteComponents } from '@/app/blocks/default-components'

type SaveState = 'idle' | 'saving' | 'saved' | 'error'

interface ContentEditorProps {
  productId: number | null
  initialContentBlocks: unknown[] | null
  onBlocksChange?: (blocks: unknown[]) => void
}

export interface ContentEditorHandle {
  saveImmediately: () => Promise<void>
  getBlocks: () => unknown[]
}

const AUTOSAVE_DELAY_MS = 3000

export const ContentEditor = forwardRef<ContentEditorHandle, ContentEditorProps>(
  function ContentEditor({ productId, initialContentBlocks, onBlocksChange }, ref) {
    const editor = useCreateBlockNote({ schema: customSchema })
    const [loaded, setLoaded] = useState(false)
    const [saveState, setSaveState] = useState<SaveState>('idle')
    const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const lastSavedRef = useRef<string>('')

    // Load initial content
    useEffect(() => {
      if (initialContentBlocks && Array.isArray(initialContentBlocks)) {
        editor.replaceBlocks(editor.document, initialContentBlocks as any)
      }
      setLoaded(true)
    }, [editor, initialContentBlocks])

    // ── Autosave (debounced) ────────────────────────────────────────
    const saveContent = useCallback(async () => {
      if (!productId) return

      const blocks = editor.document
      const serialized = JSON.stringify(blocks)

      // Skip if nothing changed since last save
      if (serialized === lastSavedRef.current) return

      setSaveState('saving')
      try {
        const res = await fetch(`/api/admin/products/${productId}/content-blocks`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contentBlocks: blocks }),
        })

        if (!res.ok) throw new Error(`Save failed (${res.status})`)

        lastSavedRef.current = serialized
        setSaveState('saved')
      } catch {
        setSaveState('error')
      }
    }, [editor, productId])

    const scheduleAutosave = useCallback(() => {
      const blocks = editor.document as unknown[]
      onBlocksChange?.(blocks)
      if (!productId) return
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
      setSaveState('idle')
      saveTimerRef.current = setTimeout(() => {
        saveContent()
      }, AUTOSAVE_DELAY_MS)
    }, [productId, saveContent, editor, onBlocksChange])

    // Cleanup timer on unmount
    useEffect(() => {
      return () => {
        if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
      }
    }, [])

    // ── Manual save (used by unified Save Draft button) ──────────────
    const saveImmediately = useCallback(async () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
      await saveContent()
    }, [saveContent])

    const getBlocks = useCallback(() => {
      return editor.document as unknown[]
    }, [editor])

    // ── Expose methods to parent via ref ─────────────────────────────
    useImperativeHandle(ref, () => ({
      saveImmediately,
      getBlocks,
    }), [saveImmediately, getBlocks])

    // ── Slash menu items ────────────────────────────────────────────
    const slashMenuItems = useMemo(
      () => getSlashMenuItems(editor as any),
      [editor],
    )

    const saveLabel =
      saveState === 'saving' ? 'Saving…' :
      saveState === 'saved' ? 'Saved' :
      saveState === 'error' ? 'Error saving' :
      ''

    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Type <kbd className="rounded border border-border bg-muted px-1 py-0.5 text-xs font-mono">/</kbd> for custom blocks
          </p>
          {productId && saveLabel && (
            <span className={`text-xs ${
              saveState === 'error' ? 'text-red-500' :
              saveState === 'saved' ? 'text-green-600' :
              'text-muted-foreground'
            }`}>
              {saveLabel}
            </span>
          )}
          {!productId && (
            <span className="text-xs text-muted-foreground">
              Content saves with product
            </span>
          )}
        </div>

        {loaded && (
          <DefaultBlockNoteComponents>
            <BlockNoteViewRaw
              editor={editor as any}
              theme="light"
              onChange={scheduleAutosave}
              className="min-h-[400px] rounded-lg border border-border bg-card p-4"
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
          </DefaultBlockNoteComponents>
        )}
      </div>
    )
  }
)

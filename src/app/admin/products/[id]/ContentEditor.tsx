'use client'

import { useCallback, useEffect, useMemo, useRef, useState, forwardRef, useImperativeHandle } from 'react'
import { useCreateBlockNote, useEditorChange, SuggestionMenuController } from '@blocknote/react'
import { BlockNoteView } from '@blocknote/ariakit'
import type { Block } from '@blocknote/core'
import '@blocknote/core/fonts/inter.css'
import '@blocknote/ariakit/style.css'
import { customSchema } from '@/app/blocks/schema'
import { getSlashMenuItems } from '@/app/blocks/slash-menu'
import { DefaultBlockNoteComponents } from '@/app/blocks/default-components'

type SaveState = 'idle' | 'saving' | 'saved' | 'error'

export interface ContentEditorProps {
  productId: number | null
  initialContentBlocks: unknown[] | null
  onBlocksChange?: (blocks: unknown[]) => void
}

export interface ContentEditorHandle {
  saveImmediately: (overrideProductId?: number) => Promise<void>
  getBlocks: () => unknown[]
}

const AUTOSAVE_DELAY_MS = 3000

export const ContentEditor = forwardRef<ContentEditorHandle, ContentEditorProps>(
  function ContentEditor({ productId, initialContentBlocks, onBlocksChange }, ref) {
    const [saveState, setSaveState] = useState<SaveState>('idle')
    const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const lastSavedRef = useRef<string>('')

    const editor = useCreateBlockNote({
      schema: customSchema,
      initialContent: (initialContentBlocks as Block[]) ?? undefined,
    })

    useEditorChange((editor) => {
      const blocks = editor.document as unknown[]
      onBlocksChange?.(blocks)
      if (!productId) return
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
      setSaveState('idle')
      saveTimerRef.current = setTimeout(() => {
        saveContent()
      }, AUTOSAVE_DELAY_MS)
    }, editor)

    const saveContent = useCallback(async (overrideProductId?: number) => {
      const effectiveId = overrideProductId ?? productId
      if (!effectiveId) return

      const blocks = editor.document
      const serialized = JSON.stringify(blocks)

      if (serialized === lastSavedRef.current) return

      setSaveState('saving')
      try {
        const res = await fetch(`/api/admin/products/${effectiveId}/content-blocks`, {
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

    useEffect(() => {
      return () => {
        if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
      }
    }, [])

    const saveImmediately = useCallback(async (overrideProductId?: number) => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
      await saveContent(overrideProductId)
    }, [saveContent])

    const getBlocks = useCallback(() => {
      return editor.document as unknown[]
    }, [editor])

    useImperativeHandle(ref, () => ({
      saveImmediately,
      getBlocks,
    }), [saveImmediately, getBlocks])

    const slashMenuItems = useMemo(
      () => getSlashMenuItems(editor as any),
      [editor],
    )

    const saveLabel =
      saveState === 'saving' ? 'Saving...' :
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

        <BlockNoteView
          editor={editor}
          theme="light"
          editable={true}
          className="min-h-[400px] rounded-lg border border-border bg-card p-4"
          onChange={() => {}}
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
        </BlockNoteView>
      </div>
    )
  }
)

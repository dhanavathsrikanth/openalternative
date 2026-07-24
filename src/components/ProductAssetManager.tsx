'use client'

import { useState, useRef, useCallback } from 'react'
import { UploadIcon, Trash2Icon, XIcon } from 'lucide-react'

interface Asset {
  id: number
  type: 'screenshot' | 'logo'
  url: string
  assetId: string
  createdAt: string
}

interface Props {
  productId: number
  initialAssets: Asset[]
}

const ACCEPT = 'image/png,image/jpeg,image/webp'
const MAX_SIZE_MB = 10

export function ProductAssetManager({ productId, initialAssets }: Props) {
  const [assets, setAssets] = useState<Asset[]>(initialAssets)
  const [uploading, setUploading] = useState(false)
  const [deleting, setDeleting] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)

  const handleFile = useCallback(async (file: File, type: 'logo' | 'screenshot') => {
    setError(null)
    setUploading(true)

    try {
      const form = new FormData()
      form.append('file', file)
      form.append('productId', String(productId))
      form.append('type', type)

      const res = await fetch('/api/dashboard/products/assets/upload', {
        method: 'POST',
        body: form,
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Upload failed')
        return
      }

      setAssets((prev) => [data.asset, ...prev])
    } catch {
      setError('Network error during upload')
    } finally {
      setUploading(false)
    }
  }, [productId])

  const onFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'screenshot') => {
    const file = e.target.files?.[0]
    if (!file) return
    await handleFile(file, type)
    e.target.value = ''
  }, [handleFile])

  const onDrop = useCallback(async (e: React.DragEvent, type: 'logo' | 'screenshot') => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (!file) return
    await handleFile(file, type)
  }, [handleFile])

  async function deleteAsset(asset: Asset) {
    if (!confirm(`Delete this ${asset.type}? This cannot be undone.`)) return

    setDeleting(asset.id)
    setError(null)

    try {
      const res = await fetch(`/api/dashboard/products/assets/${asset.id}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Delete failed')
        return
      }

      setAssets((prev) => prev.filter((a) => a.id !== asset.id))
    } catch {
      setError('Network error during delete')
    } finally {
      setDeleting(null)
    }
  }

  const logos = assets.filter((a) => a.type === 'logo')
  const screenshots = assets.filter((a) => a.type === 'screenshot')

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 flex items-start gap-2">
          <span className="flex-1">{error}</span>
          <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700">
            <XIcon className="size-4" />
          </button>
        </div>
      )}

      {/* Logo upload */}
      <div>
        <label className="text-sm font-medium">Logo</label>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Square image, 128-2048px. PNG, JPEG, or WebP. Max 10 MB.
        </p>

        {logos.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-3">
            {logos.map((asset) => (
              <div key={asset.id} className="group relative w-28 h-28 overflow-hidden rounded-lg border bg-card">
                <img
                  src={asset.url}
                  alt="Logo"
                  className="h-full w-full object-cover"
                />
                <button
                  onClick={() => deleteAsset(asset)}
                  disabled={deleting === asset.id}
                  className="absolute top-1 right-1 rounded-full bg-black/60 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-black/80 disabled:opacity-50"
                  title="Delete"
                >
                  {deleting === asset.id ? (
                    <span className="block size-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ) : (
                    <Trash2Icon className="size-4" />
                  )}
                </button>
              </div>
            ))}
            {logos.length < 3 && (
              <UploadZone
                label="Add logo"
                accept={ACCEPT}
                dragOver={dragOver}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => onDrop(e, 'logo')}
                onFileChange={(e) => onFileChange(e, 'logo')}
                uploading={uploading}
              />
            )}
          </div>
        ) : (
          <UploadZone
            label="Upload logo"
            accept={ACCEPT}
            dragOver={dragOver}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => onDrop(e, 'logo')}
            onFileChange={(e) => onFileChange(e, 'logo')}
            uploading={uploading}
          />
        )}
      </div>

      {/* Screenshot upload */}
      <div>
        <label className="text-sm font-medium">Screenshots</label>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Landscape images, 640-7680px wide. Up to 5 screenshots. PNG, JPEG, or WebP. Max 10 MB each.
        </p>

        {screenshots.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-3">
            {screenshots.map((asset) => (
              <div key={asset.id} className="group relative w-44 h-28 overflow-hidden rounded-lg border bg-card">
                <img
                  src={asset.url}
                  alt="Screenshot"
                  className="h-full w-full object-cover"
                />
                <button
                  onClick={() => deleteAsset(asset)}
                  disabled={deleting === asset.id}
                  className="absolute top-1 right-1 rounded-full bg-black/60 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-black/80 disabled:opacity-50"
                  title="Delete"
                >
                  {deleting === asset.id ? (
                    <span className="block size-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ) : (
                    <Trash2Icon className="size-4" />
                  )}
                </button>
              </div>
            ))}
          </div>
        )}

        {screenshots.length < 5 && (
          <div className="mt-3">
            <UploadZone
              label={screenshots.length === 0 ? 'Upload screenshots' : 'Add screenshot'}
              accept={ACCEPT}
              dragOver={dragOver}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => onDrop(e, 'screenshot')}
              onFileChange={(e) => onFileChange(e, 'screenshot')}
              uploading={uploading}
              wide
            />
          </div>
        )}
      </div>
    </div>
  )
}

function UploadZone({
  label,
  accept,
  dragOver,
  onDragOver,
  onDragLeave,
  onDrop,
  onFileChange,
  uploading,
  wide,
}: {
  label: string
  accept: string
  dragOver: boolean
  onDragOver: (e: React.DragEvent) => void
  onDragLeave: () => void
  onDrop: (e: React.DragEvent) => void
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  uploading: boolean
  wide?: boolean
}) {
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <div
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onClick={() => !uploading && inputRef.current?.click()}
      className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-4 text-center transition-colors ${
        dragOver
          ? 'border-green-500 bg-green-50 text-green-700'
          : 'border-muted-foreground/25 hover:border-muted-foreground/50 text-muted-foreground'
      } ${wide ? 'w-full py-8' : 'w-full py-6'}`}
    >
      {uploading ? (
        <span className="block size-5 animate-spin rounded-full border-2 border-green-600 border-t-transparent" />
      ) : (
        <UploadIcon className="size-6" />
      )}
      <span className="text-xs font-medium">
        {uploading ? 'Uploading…' : label}
      </span>
      <span className="text-[10px] opacity-60">
        Drag & drop or click · PNG, JPEG, WebP · Max {MAX_SIZE_MB} MB
      </span>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={onFileChange}
        className="hidden"
        disabled={uploading}
      />
    </div>
  )
}

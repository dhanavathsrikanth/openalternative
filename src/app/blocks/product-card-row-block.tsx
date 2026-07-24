import { useState, useCallback, useRef, useEffect } from 'react';
import { createReactBlockSpec } from '@blocknote/react';
import type { BlockConfig } from '@blocknote/core';

export const ProductCardRowBlockConfig = {
  type: 'productCardRow' as const,
  propSchema: {
    slugs: { default: '[]' },
  },
  content: 'none' as const,
} satisfies BlockConfig<'productCardRow', any, 'none'>;

function parseSlugs(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
  } catch { /* ignore */ }
  return [];
}

interface ProductHit {
  id: number;
  name: string;
  slug: string;
  tagline: string | null;
}

function ProductCardRowEditor({
  block,
  editor,
}: {
  block: any;
  editor: any;
}) {
  const [slugs, setSlugs] = useState<string[]>(() => parseSlugs(block.props.slugs));
  const [query, setQuery] = useState('');
  const [hits, setHits] = useState<ProductHit[]>([]);
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  const persist = useCallback(
    (next: string[]) => {
      setSlugs(next);
      editor.updateBlock(block, {
        props: { ...block.props, slugs: JSON.stringify(next) },
      });
    },
    [block, editor],
  );

  useEffect(() => {
    if (!query.trim()) {
      setHits([]);
      return;
    }
    const ctrl = new AbortController();
    fetch(`/api/search?q=${encodeURIComponent(query)}&limit=6`, {
      signal: ctrl.signal,
    })
      .then((r) => r.json())
      .then((d) => setHits(d.results ?? []))
      .catch(() => {});
    return () => ctrl.abort();
  }, [query]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const addSlug = (slug: string) => {
    if (!slugs.includes(slug)) {
      persist([...slugs, slug]);
    }
    setQuery('');
    setHits([]);
    setOpen(false);
  };

  const removeSlug = (idx: number) => {
    persist(slugs.filter((_, i) => i !== idx));
  };

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="mb-3 flex flex-wrap gap-2">
        {slugs.map((slug, idx) => (
          <span
            key={slug}
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary/50 px-3 py-1 text-xs text-foreground"
          >
            <a
              href={`/products/${slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline"
            >
              {slug}
            </a>
            <button
              type="button"
              onClick={() => removeSlug(idx)}
              className="text-muted-foreground hover:text-destructive"
            >
              &times;
            </button>
          </span>
        ))}
        {slugs.length === 0 && (
          <span className="text-xs text-muted-foreground/60">No products selected</span>
        )}
      </div>
      <div ref={wrapRef} className="relative">
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => query.trim() && setOpen(true)}
          placeholder="Search products by name..."
          className="w-full rounded border border-border bg-background px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground/50"
        />
        {open && hits.length > 0 && (
          <div className="absolute z-50 mt-1 w-full rounded-md border border-border bg-popover shadow-md">
            {hits.map((hit) => (
              <button
                key={hit.id}
                type="button"
                onClick={() => addSlug(hit.slug)}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-foreground hover:bg-accent transition-colors"
              >
                <span className="font-medium">{hit.name}</span>
                <span className="text-muted-foreground text-xs">/{hit.slug}</span>
                {hit.tagline && (
                  <span className="ml-auto truncate text-xs text-muted-foreground max-w-[200px]">
                    {hit.tagline}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export const createProductCardRowBlockSpec = () =>
  createReactBlockSpec(ProductCardRowBlockConfig, {
    render({ block, editor }) {
      return <ProductCardRowEditor block={block} editor={editor} />;
    },
  })();

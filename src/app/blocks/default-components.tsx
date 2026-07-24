import { ComponentsContext } from '@blocknote/react'
import { ReactNode, forwardRef } from 'react'

const DefaultSuggestionMenuRoot = (props: { id: string; className?: string; children?: ReactNode }) => (
  <div id={props.id} className={props.className}>
    {props.children}
  </div>
)

const DefaultSuggestionMenuItem = forwardRef<
  HTMLDivElement,
  {
    className?: string
    id: string
    isSelected: boolean
    onClick: () => void
    item: any
  }
>(function DefaultSuggestionMenuItem({ className, isSelected, onClick, item }, _ref) {
  return (
    <div
      className={className}
      style={{
        padding: '4px 8px',
        cursor: 'pointer',
        borderRadius: '4px',
        backgroundColor: isSelected ? 'var(--accent)' : 'transparent',
      }}
      onClick={onClick}
    >
      {item.icon && <span style={{ marginRight: 8 }}>{item.icon}</span>}
      {item.title}
      {item.subtext && (
        <div style={{ fontSize: '0.75em', opacity: 0.6 }}>{item.subtext}</div>
      )}
    </div>
  )
})

const DefaultSuggestionMenuLabel = (props: { className?: string; children?: ReactNode }) => (
  <div
    className={props.className}
    style={{ padding: '4px 8px', fontSize: '0.75em', fontWeight: 600, opacity: 0.6 }}
  >
    {props.children}
  </div>
)

const DefaultSuggestionMenuEmptyItem = (props: { className?: string; children?: ReactNode }) => (
  <div className={props.className} style={{ padding: '4px 8px', opacity: 0.6 }}>
    {props.children}
  </div>
)

const DefaultSuggestionMenuLoader = (props: { className?: string }) => (
  <div className={props.className} style={{ padding: '4px 8px', opacity: 0.6 }}>
    Loading…
  </div>
)

const defaultComponents = {
  FormattingToolbar: {} as any,
  FilePanel: {} as any,
  LinkToolbar: {} as any,
  SideMenu: {} as any,
  SuggestionMenu: {
    Root: DefaultSuggestionMenuRoot,
    Item: DefaultSuggestionMenuItem,
    Label: DefaultSuggestionMenuLabel,
    EmptyItem: DefaultSuggestionMenuEmptyItem,
    Loader: DefaultSuggestionMenuLoader,
  },
  GridSuggestionMenu: {} as any,
  TableHandle: {} as any,
  Comments: {} as any,
  Versioning: {} as any,
  AttributionTooltip: {} as any,
  Generic: {} as any,
}

export function DefaultBlockNoteComponents({ children }: { children: ReactNode }) {
  return (
    <ComponentsContext.Provider value={defaultComponents as any}>
      {children}
    </ComponentsContext.Provider>
  )
}

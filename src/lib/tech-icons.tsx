/**
 * Technology icon registry.
 *
 * Maps every canonical name from the MAPPING table in tech-detect.ts to an
 * SVG icon definition (paths + fill colour).  Icons use official brand
 * colours and simplified but recognisable shapes at 24×24 viewBox.
 *
 * Technologies without a dedicated icon receive a graceful fallback in the
 * rendering component — this file is intentionally comprehensive so the
 * fallback path is rarely hit.
 */

export interface TechIconDef {
  /** CSS fill colour (official brand colour) */
  color: string
  /** SVG child elements — either a single path or multiple elements */
  svg: React.ReactNode
}

// ── Shared viewBox ──────────────────────────────────────────────────────────

const V = '0 0 24 24'

// ── Languages ───────────────────────────────────────────────────────────────

const TS: TechIconDef = {
  color: '#3178C6',
  svg: <path d="M2 4.5A.5.5 0 0 1 2.5 4h19a.5.5 0 0 1 .5.5v15a.5.5 0 0 1-.5.5h-19a.5.5 0 0 1-.5-.5zM5 7v1.5h10V7zm0 3.25v1.5h10v-1.5zm0 3.25v1.5h7V13.5z" fill="currentColor" />,
}

const JS: TechIconDef = {
  color: '#F7DF1E',
  svg: <path d="M0 0h24v24H0V0z" fill="currentColor" />,
}

const Python: TechIconDef = {
  color: '#3776AB',
  svg: (
    <>
      <path d="M11.914 0C5.82 0 6.2 2.656 6.2 2.656l.007 2.752h5.822v.826H3.9S0 5.789 0 11.968c0 6.18 3.394 5.97 3.394 5.97h2.015v-2.87s-.109-3.394 3.34-3.394h5.765s3.232.052 3.232-3.128V3.194S18.11 0 11.914 0zM8.708 1.842a1.052 1.052 0 1 1 0 2.104 1.052 1.052 0 0 1 0-2.104z" fill="currentColor" />
      <path d="M12.086 24c6.094 0 5.714-2.656 5.714-2.656l-.007-2.752h-5.822v-.826H20.1S24 18.211 24 12.032c0-6.18-3.394-5.97-3.394-5.97h-2.015v2.87s.109 3.394-3.34 3.394H9.486s-3.232-.052-3.232 3.128v5.382S5.89 24 12.086 24zm3.206-1.842a1.052 1.052 0 1 1 0-2.104 1.052 1.052 0 0 1 0 2.104z" fill="currentColor" />
    </>
  ),
}

const Go: TechIconDef = {
  color: '#00ADD8',
  svg: (
    <>
      <path d="M1.811 10.231c-.047 0-.058-.023-.035-.059l.246-.315c.023-.035.081-.058.128-.058h4.172c.046 0 .058.035.035.07l-.199.303c-.023.036-.082.07-.117.07zM.047 11.306c-.047 0-.059-.023-.035-.058l.245-.316c.023-.035.082-.058.129-.058h5.328c.047 0 .07.035.058.07l-.093.28c-.012.047-.058.07-.105.07zm2.828 1.075c-.047 0-.059-.035-.035-.07l.163-.292c.023-.035.07-.07.117-.07h2.337c.047 0 .07.035.07.082l-.023.28c0 .047-.047.082-.082.082z" fill="currentColor" />
      <path d="M8.996 10.029h-2.36c-.199 0-.268.082-.199-.199l.174-.292c.07-.117.231-.233.41-.233h1.052c.174 0 .315.07.315.245v1.029c0 .174-.128.303-.303.303l-1.087.023zm2.197.07c-.117 0-.21-.093-.21-.21V8.21c0-.117.093-.21.21-.21.117 0 .21.093.21.21v1.679c0 .117-.093.21-.21.21zm4.983-.894c-.738 0-1.337-.174-1.806-.421-.174-.117-.21-.349-.082-.523.117-.174.349-.21.523-.082.349.186.795.292 1.364.292.993 0 1.679-.492 1.679-1.192 0-.41-.174-.691-.523-.88-.327-.174-.773-.268-1.341-.349-.581-.082-1.017-.233-1.285-.444-.268-.21-.396-.512-.396-.9 0-.668.535-1.123 1.37-1.123.581 0 1.04.128 1.39.396.128.117.28.163.421.07l.222-.174c.14-.105.186-.268.082-.41-.384-.5-1.087-.726-2.115-.726-1.274 0-2.227.68-2.227 1.727 0 .433.151.773.456 1.029.315.268.784.433 1.425.546.57.105.981.233 1.239.396.256.163.384.41.384.738 0 .726-.581 1.239-1.556 1.239z" fill="currentColor" />
    </>
  ),
}

const Rust: TechIconDef = {
  color: '#CE422B',
  svg: (
    <>
      <circle cx="12" cy="12" r="10.5" fill="none" stroke="currentColor" strokeWidth="1" />
      <circle cx="12" cy="12" r="3" fill="currentColor" />
      <circle cx="12" cy="12" r="6.5" fill="none" stroke="currentColor" strokeWidth="0.75" />
    </>
  ),
}

const Ruby: TechIconDef = {
  color: '#CC342D',
  svg: <path d="M20.156.083l-9.9 5.022-4.77-3.47L2.478.36A.506.506 0 0 0 2.04.674L.143 14.257a.502.502 0 0 0 .184.458l4.86 3.488-1.128 5.446a.5.5 0 0 0 .727.53l9.877-5.67 5.058 3.694a.5.5 0 0 0 .777-.262L23.837.61a.5.5 0 0 0-.377-.596zM12.52 6.438l4.722 3.44c-1.232 1.302-2.49 2.62-3.693 3.765L12.52 6.438z" fill="currentColor" />,
}

const PHP: TechIconDef = {
  color: '#777BB4',
  svg: (
    <>
      <path d="M7.013 10.207c.043-.687.396-1.864 1.059-3.532H5.361L2.635 16.84h1.77l.52-1.419h.005l.996-2.744c.196-.556.353-1.007.532-1.47h.027c.066.234.15.542.193.758l.157.762.637 1.703H7.92l-.907-2.515zM22.506 16.84l1.36-3.86h-1.77l-.867 2.56-.69-2.56h-1.73l1.347 3.86h1.35zM15.415 10.724c0-.625.15-1.11.45-1.453.3-.342.716-.514 1.247-.514.512 0 .92.172 1.22.514.3.343.449.828.449 1.453v.162c0 .625-.15 1.11-.45 1.453-.3.342-.717.513-1.247.513-.512 0-.92-.171-1.22-.513-.3-.343-.449-.828-.449-1.453v-.162zm-1.73.242c0 1.178.45 2.088 1.35 2.73.488.355 1.016.57 1.585.645v1.499h1.635v-1.499c.569-.075 1.097-.29 1.585-.645.9-.642 1.35-1.552 1.35-2.73v-2.06c0-1.178-.45-2.088-1.35-2.73-.488-.355-1.016-.57-1.585-.644V4.628H15.02v1.602c-.569.075-1.097.29-1.585.644-.9.642-1.35 1.552-1.35 2.73v2.06z" fill="currentColor" />
      <path d="M9.91 8.553c-.355 0-.624.107-.808.32-.184.215-.276.512-.276.893v4.84c0 .381.096.679.288.894.192.214.464.322.816.322.352 0 .624-.107.816-.322.192-.215.288-.513.288-.894v-4.84c0-.38-.092-.678-.276-.893-.184-.213-.453-.32-.808-.32z" fill="currentColor" />
    </>
  ),
}

const Java: TechIconDef = {
  color: '#ED8B00',
  svg: (
    <>
      <path d="M8.682 18.873c.906.55 1.97.898 3.102 1.044.282.037.568.055.858.055 1.138 0 2.208-.274 3.102-.724v-1.35c-.894.45-1.964.724-3.102.724a5.57 5.57 0 0 1-.858-.066 4.478 4.478 0 0 1-3.102-1.112v4.923zM6.713 12.185c0-2.173.48-4.064 1.44-5.676.96-1.613 2.196-2.87 3.708-3.773L10.84 1.2l-.299.288C8.435 3.1 6.907 5.81 6.093 9.053c-.815 3.244-.632 6.547.538 9.485l-.003.007c-.576-1.125-.915-2.372-.915-3.36z" fill="currentColor" />
      <path d="M18.27 15.682c-1.512.903-2.748 2.16-3.708 3.773-.96 1.613-1.44 3.504-1.44 5.676 0 2.173.48 4.064 1.44 5.676.96 1.613 2.196 2.87 3.708 3.773l.299-.288c2.106-2.613 3.634-5.322 4.448-8.565.815-3.244.632-6.547-.538-9.485l.003-.007c.576 1.125.915 2.372.915 3.36 0 2.173-.48 4.064-1.44 5.676-.96 1.613-2.196 2.87-3.708 3.773z" fill="currentColor" opacity="0.5" />
    </>
  ),
}

const Kotlin: TechIconDef = {
  color: '#7F52FF',
  svg: (
    <>
      <path d="M2.563 22.44L21.437.563 24 3.126 5.125 25h-.002l-.002-.003-.002.004zM2.563 22.44L14.4 10.6 12 8.2 2.563 22.44z" fill="currentColor" />
      <path d="M14.4 10.6L2.563 22.44 5.125 25 16.96 13.16 14.4 10.6z" fill="currentColor" opacity="0.5" />
    </>
  ),
}

const Scala: TechIconDef = {
  color: '#DC322F',
  svg: <path d="M3.5 3.5h17v3h-8.5v3h7v3h-7v3h8.5v3h-17v-3h8.5v-3h-7v-3h7v-3h-8.5z" fill="currentColor" />,
}

const Swift: TechIconDef = {
  color: '#F05138',
  svg: <path d="M17.826 11.257C15.67 8.068 12.205 6.2 8.826 6.2c-4.09 0-7.426 2.74-7.426 7.2 0 3.076 1.693 5.8 4.247 7.08.28.14.566.26.856.36-.16-.36-.285-.73-.377-1.11-.05-.2-.09-.4-.127-.6-.144-.78-.23-1.58-.23-2.37 0-4.14 3.128-7.5 7-7.5.57 0 1.12.07 1.65.2-.78-2.64-3.24-4.55-6.17-4.55-.4 0-.78.04-1.16.11C7.94 3.09 10.66 2 13.6 2c4.87 0 8.9 3.7 9.4 8.46a7.33 7.33 0 0 0-5.173.797zM21.6 14.6c-.4 0-.78.03-1.16.1.15-.6.14-1.23-.04-1.85-.13-.44-.35-.85-.63-1.22.02.04.03.09.05.13 1.5 2.68 1.1 5.76-.88 7.97a6.44 6.44 0 0 1-1.6-1.13c1.25-1.98 1.25-4.34.08-6.27-.5-.82-1.17-1.5-1.97-2.02.05-.02.1-.03.15-.05 1.08 2.05.65 4.54-1.1 6.43a7.4 7.4 0 0 1-1.56-.97c1.04-1.74 1.03-3.83-.03-5.53-.47-.75-1.07-1.38-1.78-1.87a6.8 6.8 0 0 1 1.43-.16c2.5 0 4.77 1.42 5.8 3.54.82-.48 1.75-.82 2.74-.97a6.6 6.6 0 0 1 .94.08 6.83 6.83 0 0 0-2.12-3.18 6.84 6.84 0 0 0-4.62-1.63c-.3 0-.6.02-.88.07.77-.54 1.66-.95 2.63-1.18.24-.06.48-.1.72-.12a6.9 6.9 0 0 1 2.23.3 6.84 6.84 0 0 0-2.7-2.22 6.85 6.85 0 0 0-2.36-.44c-.32 0-.63.02-.94.07C13.42.73 11.56.2 9.6.2 5.12.2 1.44 3.52 1.02 8.02c-.04.42-.06.85-.06 1.28 0 4.14 3.12 7.5 7 7.5.57 0 1.12-.07 1.65-.2-.78 2.64-3.24 4.55-6.17 4.55-.4 0-.78-.04-1.16-.1C4.56 23.31 7.84 26 11.8 26c4.37 0 8-3.16 8.7-7.36a8.4 8.4 0 0 0 1.1-3.84c0-.4-.03-.8-.08-1.2h.08z" fill="currentColor" />,
}

const Elixir: TechIconDef = {
  color: '#6E4A7E',
  svg: (
    <>
      <circle cx="12" cy="12" r="10.5" fill="currentColor" opacity="0.15" />
      <path d="M12 5.5c-3.59 0-6.5 2.91-6.5 6.5s2.91 6.5 6.5 6.5c1.28 0 2.47-.37 3.47-1.02l-3.28-3.28h4.76L12 19.5c3.59 0 6.5-2.91 6.5-6.5S15.59 5.5 12 5.5z" fill="currentColor" />
    </>
  ),
}

const Erlang: TechIconDef = {
  color: '#A90533',
  svg: (
    <>
      <rect x="2" y="8" width="8" height="8" rx="1.5" fill="currentColor" />
      <rect x="14" y="8" width="8" height="8" rx="1.5" fill="currentColor" opacity="0.5" />
    </>
  ),
}

const Clojure: TechIconDef = {
  color: '#5881D8',
  svg: (
    <>
      <circle cx="8" cy="12" r="4.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="16" cy="12" r="4.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
    </>
  ),
}

const Haskell: TechIconDef = {
  color: '#5D4F85',
  svg: <path d="M2.5 4l4.5 2v4l-4.5 2V4zm19 0l-4.5 2v4l4.5 2V4zm-9.5-2v20M6 7l6 5-6 5M18 7l-6 5 6 5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />,
}

const CSharp: TechIconDef = {
  color: '#239120',
  svg: <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm0 2.5a3 3 0 110 6 3 3 0 010-6zM7.5 15c0 .828.672 1.5 1.5 1.5h.5v2.5c0 .276.224.5.5.5s.5-.224.5-.5V17h1.5c.276 0 .5-.224.5-.5s-.224-.5-.5-.5H10v-2h2.5c.276 0 .5-.224.5-.5s-.224-.5-.5-.5H10v-2h2.5c.828 0 1.5-.672 1.5-1.5S13.328 7.5 12.5 7.5H11V6c0-.276-.224-.5-.5-.5s-.5.224-.5.5v1.5h-1c-.828 0-1.5.672-1.5 1.5s.672 1.5 1.5 1.5H10v2H8.5c-.828 0-1.5.672-1.5 1.5z" fill="currentColor" />,
}

// ── Frameworks ──────────────────────────────────────────────────────────────

const React: TechIconDef = {
  color: '#61DAFB',
  svg: (
    <>
      <circle cx="12" cy="12" r="2" fill="currentColor" />
      <ellipse cx="12" cy="12" rx="10" ry="4" fill="none" stroke="currentColor" strokeWidth="1" />
      <ellipse cx="12" cy="12" rx="10" ry="4" fill="none" stroke="currentColor" strokeWidth="1" transform="rotate(60 12 12)" />
      <ellipse cx="12" cy="12" rx="10" ry="4" fill="none" stroke="currentColor" strokeWidth="1" transform="rotate(120 12 12)" />
    </>
  ),
}

const NextJS: TechIconDef = {
  color: '#000000',
  svg: (
    <>
      <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2z" fill="currentColor" />
      <path d="M10 8v8l6-4-6-4z" fill="white" />
    </>
  ),
}

const Vue: TechIconDef = {
  color: '#42B883',
  svg: <path d="M2 3h4l6 10.5L18 3h4L12 22 2 3zm6.5 0L12 12l3.5-9H17l-5 9.5L7 3h1.5z" fill="currentColor" />,
}

const Angular: TechIconDef = {
  color: '#DD0031',
  svg: <path d="M12 2l-1.8 14.3L12 16.7l1.8-.4L12 2zM3.3 3.3l1.7 13.4h3.3L4.2 5.4 3.3 3.3zM20.7 3.3l-.9 2.1-1.7 11.3h3.3L20.7 3.3z" fill="currentColor" />,
}

const Svelte: TechIconDef = {
  color: '#FF3E00',
  svg: <path d="M12.5 2C9.64 2 7.7 3.88 7.28 5.83c-.7-.1-1.44-.1-2.18.08C3.18 6.24 2 7.84 2 9.53v.04c0 1.69 1.18 3.29 3.1 3.62.42 1.95 2.36 3.83 5.22 3.83h.44l-1.55 1.55a.75.75 0 0 0 1.06 1.06l2.83-2.83a.75.75 0 0 0 0-1.06l-2.83-2.83a.75.75 0 0 0-1.06 1.06l1.55 1.55h-.44c-2.04 0-3.88-1.34-4.48-3.26A3.5 3.5 0 0 1 2 9.57v-.04c0-2.47 2-4.45 4.36-4.76A6.3 6.3 0 0 1 12.5 2zm0 2a5.47 5.47 0 0 0-3.82 1.56.75.75 0 0 0 0 1.06l2.03 2.03a.75.75 0 0 0 1.06 0l2.03-2.03a.75.75 0 0 0 0-1.06A5.47 5.47 0 0 0 12.5 4z" fill="currentColor" />,
}

const Astro: TechIconDef = {
  color: '#FF5D01',
  svg: <path d="M12.3 3.2a1 1 0 0 0-1.6 0L2.8 12.6a1 1 0 0 0 .8 1.6h4.2v5.6a1 1 0 0 0 1.6.8l7.9-6.2a1 1 0 0 0 .1-1.6L12.3 3.2z" fill="currentColor" />,
}

const Express: TechIconDef = {
  color: '#000000',
  svg: (
    <>
      <path d="M3 7h18v1.5H3V7zm1.5 3h15l-1.5 7H6L4.5 10zm2.3 1.8l.7 3.4h3.4l-.7-3.4H6.8zm5.4 0l.7 3.4h3.4l-.7-3.4h-3.4zm5.4 0l.7 3.4h1.3l-.7-3.4h-1.3z" fill="currentColor" />
    </>
  ),
}

const Django: TechIconDef = {
  color: '#092E20',
  svg: (
    <>
      <path d="M10.5 2.7c-.4 0-.7.3-.7.7v3.1c0 .4.3.7.7.7h3c.4 0 .7-.3.7-.7V3.4c0-.4-.3-.7-.7-.7h-3z" fill="currentColor" />
      <path d="M18.4 5.6c0-2.1-1.2-3.8-3.5-4.5h-1.6c-.3 0-.6.3-.6.6v20.7c0 .3.3.6.6.6h1.6c2.3 0 3.5-1.7 3.5-4.5V5.6z" fill="currentColor" opacity="0.7" />
    </>
  ),
}

const Flask: TechIconDef = {
  color: '#000000',
  svg: <path d="M9 2h6v2H9V2zM8 4h8l-2 8v8H10v-8L8 4z" fill="currentColor" />,
}

const FastAPI: TechIconDef = {
  color: '#009688',
  svg: <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14.5v-2.3l-3.2-1.8V10l3.2 1.8v2.3l-3.2 1.8v2.3l3.2 1.8v2.3l-3.2 1.8v-2.3l3.2-1.8v-2.3l3.2 1.8v2.3l-3.2-1.8v-2.3l3.2-1.8V10l-3.2 1.8v2.3l3.2 1.8v2.3l-3.2-1.8z" fill="currentColor" />,
}

const Rails: TechIconDef = {
  color: '#CC0000',
  svg: <path d="M12 2L2 7v10l10 5 10-5V7L12 2zm0 2.2L19.5 8 12 11.8 4.5 8 12 4.2z" fill="currentColor" />,
}

const Laravel: TechIconDef = {
  color: '#FF2D20',
  svg: <path d="M21.8 5.4c-.2-.5-.7-.8-1.2-.6l-3 .8-.2-1-1.8.5.2 1-2.8.8-2-.5.8-2.8-1-.3-1.7.5-1.7-.5-1 .3.8 2.8-2 .5.2-1-1.8-.5-.2-1-3-.8c-.5-.2-1.1 0-1.3.6L2.8 10c-.2.5 0 1.1.5 1.3l3 .8.2 1-1.8-.5-.2-1-2.8-.8-2 .5-.8 2.8 1 .3 1.7-.5 1.7.5 1-.3-.8-2.8 2-.5-.2 1 1.8.5.2 1 3 .8c.5.2 1.1 0 1.3-.6L12 11.3c.2-.5 0-1.1-.5-1.3l-3-.8-.2-1 1.8.5.2 1 2.8.8 2-.5.8-2.8-1-.3-1.7.5-1.7-.5-1 .3.8 2.8-2 .5.2-1 1.8-.5-.2-1-3-.8c-.2-.4-.7-.6-1.1-.5z" fill="currentColor" />,
}

const Spring: TechIconDef = {
  color: '#6DB33F',
  svg: (
    <>
      <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="12" cy="12" r="3" fill="currentColor" />
      <path d="M12 5c3.87 0 7 3.13 7 7" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </>
  ),
}

const NestJS: TechIconDef = {
  color: '#E0234E',
  svg: <path d="M12 2L2 7v10l10 5 10-5V7L12 2zm0 3l6 3v6l-6 3-6-3V8l6-3z" fill="currentColor" />,
}

const Hono: TechIconDef = {
  color: '#FF6B35',
  svg: (
    <>
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" fill="currentColor" opacity="0.15" />
      <path d="M8 8h8v2H8zM9 11h6v2H9zM10 14h4v2h-4z" fill="currentColor" />
    </>
  ),
}

const Remix: TechIconDef = {
  color: '#3992FF',
  svg: <path d="M4 4h4v16l8-8-8-8z" fill="currentColor" />,
}

const Nuxt: TechIconDef = {
  color: '#00DC82',
  svg: (
    <>
      <path d="M12 2L2 7v10l10 5 10-5V7L12 2z" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M12 12v8l8-4V8L12 12z" fill="currentColor" opacity="0.5" />
      <path d="M12 12l-8 4V8l8-4v8z" fill="currentColor" />
    </>
  ),
}

const Gatsby: TechIconDef = {
  color: '#663399',
  svg: <path d="M12 2L2 12l10 10 10-10L12 2zm0 3.8L18.2 12 12 18.2 5.8 12 12 5.8z" fill="currentColor" />,
}

const Preact: TechIconDef = {
  color: '#673AB8',
  svg: (
    <>
      <circle cx="12" cy="12" r="2" fill="currentColor" />
      <ellipse cx="12" cy="12" rx="8" ry="3.5" fill="none" stroke="currentColor" strokeWidth="1" />
      <ellipse cx="12" cy="12" rx="8" ry="3.5" fill="none" stroke="currentColor" strokeWidth="1" transform="rotate(60 12 12)" />
      <ellipse cx="12" cy="12" rx="8" ry="3.5" fill="none" stroke="currentColor" strokeWidth="1" transform="rotate(120 12 12)" />
    </>
  ),
}

const Apollo: TechIconDef = {
  color: '#311C87',
  svg: (
    <>
      <path d="M12 2L2 12l10 10 10-10L12 2z" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="12" cy="12" r="2.5" fill="currentColor" />
    </>
  ),
}

const GraphQL: TechIconDef = {
  color: '#E10098',
  svg: (
    <>
      <circle cx="12" cy="12" r="2" fill="currentColor" />
      <circle cx="12" cy="4" r="1.5" fill="currentColor" />
      <circle cx="12" cy="20" r="1.5" fill="currentColor" />
      <circle cx="5" cy="8" r="1.5" fill="currentColor" />
      <circle cx="19" cy="8" r="1.5" fill="currentColor" />
      <circle cx="5" cy="16" r="1.5" fill="currentColor" />
      <circle cx="19" cy="16" r="1.5" fill="currentColor" />
      <line x1="12" y1="6" x2="12" y2="10" stroke="currentColor" strokeWidth="1" />
      <line x1="12" y1="14" x2="12" y2="18" stroke="currentColor" strokeWidth="1" />
      <line x1="6.2" y1="9" x2="10" y2="11" stroke="currentColor" strokeWidth="1" />
      <line x1="14" y1="11" x2="17.8" y2="9" stroke="currentColor" strokeWidth="1" />
      <line x1="6.2" y1="15" x2="10" y2="13" stroke="currentColor" strokeWidth="1" />
      <line x1="14" y1="13" x2="17.8" y2="15" stroke="currentColor" strokeWidth="1" />
    </>
  ),
}

const tRPC: TechIconDef = {
  color: '#398CCB',
  svg: <path d="M4 5h4v14H4zM10 5h4v14h-4zM16 5h4v14h-4z" fill="currentColor" />,
}

const Gin: TechIconDef = {
  color: '#0089F7',
  svg: <path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />,
}

const Fiber: TechIconDef = {
  color: '#00B9F7',
  svg: <path d="M4 4h16v4H4zM4 10h16v4H4zM4 16h16v4H4z" fill="currentColor" opacity="0.8" />,
}

// ── Databases ───────────────────────────────────────────────────────────────

const Postgres: TechIconDef = {
  color: '#336791',
  svg: (
    <>
      <ellipse cx="12" cy="6" rx="8" ry="3" fill="currentColor" />
      <path d="M4 6v12c0 1.66 3.58 3 8 3s8-1.34 8-3V6" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M4 12c0 1.66 3.58 3 8 3s8-1.34 8-3" fill="none" stroke="currentColor" strokeWidth="1" />
    </>
  ),
}

const MySQL: TechIconDef = {
  color: '#4479A1',
  svg: <path d="M4 4h16v2H4zM5 6v12h14V6zm2 2h10v2H7zm0 4h10v2H7z" fill="currentColor" />,
}

const MongoDB: TechIconDef = {
  color: '#47A248',
  svg: (
    <>
      <path d="M12 3c-1.5 0-3 .5-4 1.5V18c1-1 2.5-1.5 4-1.5s3 .5 4 1.5V4.5C15 3.5 13.5 3 12 3z" fill="currentColor" />
      <ellipse cx="12" cy="12" rx="4" ry="1.5" fill="none" stroke="currentColor" strokeWidth="0.75" />
    </>
  ),
}

const Redis: TechIconDef = {
  color: '#DC382D',
  svg: <path d="M6 4l6 2 6-2v16l-6 2-6-2V4zm6 2v12M6 4l6 2 6-2M6 20l6-2 6 2" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />,
}

const SQLite: TechIconDef = {
  color: '#003B57',
  svg: <path d="M12 2L4 7v10l8 5 8-5V7l-8-5zm0 2.5L18 8v8l-6 3.5L6 16V8l6-3.5z" fill="currentColor" />,
}

const Prisma: TechIconDef = {
  color: '#2D3748',
  svg: <path d="M12 2L4 20h4l4-10 4 10h4L12 2z" fill="currentColor" />,
}

const Drizzle: TechIconDef = {
  color: '#C5F74F',
  svg: (
    <>
      <circle cx="12" cy="6" r="2.5" fill="currentColor" />
      <circle cx="8" cy="14" r="2.5" fill="currentColor" />
      <circle cx="16" cy="14" r="2.5" fill="currentColor" />
      <line x1="12" y1="8.5" x2="9.5" y2="11.5" stroke="currentColor" strokeWidth="1.2" />
      <line x1="12" y1="8.5" x2="14.5" y2="11.5" stroke="currentColor" strokeWidth="1.2" />
    </>
  ),
}

const Elasticsearch: TechIconDef = {
  color: '#005571',
  svg: (
    <>
      <circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="12" cy="12" r="1" fill="currentColor" />
    </>
  ),
}

const Firebase: TechIconDef = {
  color: '#FFCA28',
  svg: <path d="M4 20L8 4l4 8 4-6 4 14H4z" fill="currentColor" />,
}

const Supabase: TechIconDef = {
  color: '#3ECF8E',
  svg: <path d="M12 2L4 8v8l8 6 8-6V8l-8-6zm0 3l5 4v6l-5 3.5L7 15V9l5-4z" fill="currentColor" />,
}

const Turso: TechIconDef = {
  color: '#4FF8D2',
  svg: <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 4a3 3 0 110 6 3 3 0 010-6zm0 14c-2.67 0-5.02-1.36-6.42-3.42.03-2.13 4.29-3.29 6.42-3.29s6.39 1.16 6.42 3.29A7.96 7.96 0 0112 20z" fill="currentColor" />,
}

const Neon: TechIconDef = {
  color: '#00E599',
  svg: (
    <>
      <path d="M12 2L4 7v10l8 5 8-5V7l-8-5z" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8 12l3 3 5-6" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
}

// ── Infrastructure ──────────────────────────────────────────────────────────

const Docker: TechIconDef = {
  color: '#2496ED',
  svg: (
    <>
      <rect x="2" y="9" width="16" height="7" rx="1" fill="currentColor" opacity="0.8" />
      <rect x="4" y="10" width="2" height="2" rx="0.3" fill="white" />
      <rect x="7" y="10" width="2" height="2" rx="0.3" fill="white" />
      <rect x="10" y="10" width="2" height="2" rx="0.3" fill="white" />
      <rect x="7" y="13" width="2" height="2" rx="0.3" fill="white" />
      <rect x="4" y="13" width="2" height="2" rx="0.3" fill="white" />
      <rect x="13" y="10.5" width="3" height="1" rx="0.3" fill="white" />
      <path d="M18 9c1.5 0 3 .5 4 1" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </>
  ),
}

const Kubernetes: TechIconDef = {
  color: '#326CE5',
  svg: (
    <>
      <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="1" />
      <circle cx="12" cy="12" r="2.5" fill="currentColor" />
      <circle cx="12" cy="4" r="1.5" fill="currentColor" />
      <circle cx="12" cy="20" r="1.5" fill="currentColor" />
      <circle cx="5" cy="8" r="1.5" fill="currentColor" />
      <circle cx="19" cy="8" r="1.5" fill="currentColor" />
      <circle cx="5" cy="16" r="1.5" fill="currentColor" />
      <circle cx="19" cy="16" r="1.5" fill="currentColor" />
      <line x1="12" y1="6.5" x2="12" y2="9.5" stroke="currentColor" strokeWidth="1" />
      <line x1="12" y1="14.5" x2="12" y2="17.5" stroke="currentColor" strokeWidth="1" />
      <line x1="6.5" y1="9" x2="9.5" y2="11" stroke="currentColor" strokeWidth="1" />
      <line x1="14.5" y1="11" x2="17.5" y2="9" stroke="currentColor" strokeWidth="1" />
      <line x1="6.5" y1="15" x2="9.5" y2="13" stroke="currentColor" strokeWidth="1" />
      <line x1="14.5" y1="13" x2="17.5" y2="15" stroke="currentColor" strokeWidth="1" />
    </>
  ),
}

const Terraform: TechIconDef = {
  color: '#7B42BC',
  svg: <path d="M12 2L2 7v10l10 5 10-5V7L12 2zm-1 5.5L7 8v3l4 2v-3.5zm2 0V13l4-2V8l-4 1.5z" fill="currentColor" />,
}

const Nginx: TechIconDef = {
  color: '#009639',
  svg: (
    <>
      <path d="M12 2L2 7v10l10 5 10-5V7L12 2z" fill="currentColor" opacity="0.15" />
      <path d="M12 2L2 7v10l10 5 10-5V7L12 2z" fill="none" stroke="currentColor" strokeWidth="1.5" />
    </>
  ),
}

const Grafana: TechIconDef = {
  color: '#F46800',
  svg: (
    <>
      <path d="M12 3a9 9 0 1 0 9 9" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="12" cy="12" r="2" fill="currentColor" />
    </>
  ),
}

const Prometheus: TechIconDef = {
  color: '#E6522C',
  svg: (
    <>
      <path d="M12 2v4M12 18v4M2 12h4M18 12h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="12" cy="12" r="5" fill="none" stroke="currentColor" strokeWidth="1.5" />
    </>
  ),
}

const Vercel: TechIconDef = {
  color: '#000000',
  svg: <path d="M12 2L2 20h20L12 2z" fill="currentColor" />,
}

const Netlify: TechIconDef = {
  color: '#00C7B7',
  svg: <path d="M12 2L2 20h20L12 2zm0 4l6.5 12h-13L12 6z" fill="currentColor" />,
}

const Cloudflare: TechIconDef = {
  color: '#F38020',
  svg: <path d="M6 16h12a4 4 0 0 0 0-8 5 5 0 0 0-9.8-1A3.5 3.5 0 0 0 6 16z" fill="currentColor" />,
}

const AWS: TechIconDef = {
  color: '#FF9900',
  svg: <path d="M4 16c0 1.1.9 2 2 2h12a2 2 0 0 0 2-2V8c0-1.1-.9-2-2-2H6a2 2 0 0 0-2 2v8zm5-6l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />,
}

const GCP: TechIconDef = {
  color: '#4285F4',
  svg: (
    <>
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M12 3a9 9 0 0 1 0 18" fill="currentColor" opacity="0.2" />
    </>
  ),
}

const Azure: TechIconDef = {
  color: '#0078D4',
  svg: <path d="M12 2L3 18h4l1.5-4h7l1.5 4h4L12 2zm-1 10L14 5l3.5 7H11z" fill="currentColor" />,
}

const Fly: TechIconDef = {
  color: '#7B3FE4',
  svg: <path d="M4 8l8-4 8 4v8l-8 4-8-4V8z" fill="none" stroke="currentColor" strokeWidth="1.5" />,
}

const Railway: TechIconDef = {
  color: '#0B0D0E',
  svg: <path d="M4 10h16M4 14h16M8 6l-4 4M16 6l4 4M8 18l-4-4M16 18l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" />,
}

const Render: TechIconDef = {
  color: '#46E3B7',
  svg: <path d="M12 2L2 7v10l10 5 10-5V7L12 2z" fill="none" stroke="currentColor" strokeWidth="1.5" />,
}

const RabbitMQ: TechIconDef = {
  color: '#FF6600',
  svg: (
    <>
      <circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8 8h8v8H8z" fill="currentColor" opacity="0.3" />
      <text x="12" y="14" textAnchor="middle" fontSize="6" fill="currentColor" fontWeight="bold">MQ</text>
    </>
  ),
}

const Kafka: TechIconDef = {
  color: '#231F20',
  svg: (
    <>
      <rect x="4" y="6" width="16" height="12" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <line x1="8" y1="6" x2="8" y2="18" stroke="currentColor" strokeWidth="1" />
      <line x1="12" y1="6" x2="12" y2="18" stroke="currentColor" strokeWidth="1" />
      <line x1="16" y1="6" x2="16" y2="18" stroke="currentColor" strokeWidth="1" />
    </>
  ),
}

const Ansible: TechIconDef = {
  color: '#EE0000',
  svg: <path d="M12 2L2 7v10l10 5 10-5V7L12 2zm0 4l5 2.5v5l-5 2.5-5-2.5v-5L12 6z" fill="currentColor" />,
}

const Consul: TechIconDef = {
  color: '#CA2171',
  svg: (
    <>
      <circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="12" cy="12" r="3" fill="currentColor" />
    </>
  ),
}

const Vault: TechIconDef = {
  color: '#FFC533',
  svg: (
    <>
      <rect x="4" y="8" width="16" height="12" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="12" cy="14" r="2.5" fill="currentColor" />
      <path d="M12 10V8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </>
  ),
}

const S3: TechIconDef = {
  color: '#3F8624',
  svg: (
    <>
      <rect x="3" y="6" width="18" height="12" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M3 10h18" stroke="currentColor" strokeWidth="1" />
    </>
  ),
}

const Minio: TechIconDef = {
  color: '#C72C48',
  svg: <path d="M6 8h12v2H6zM8 12h8v2H8zM10 16h4v2h-4z" fill="currentColor" />,
}

// ── Cache ───────────────────────────────────────────────────────────────────

const Memcached: TechIconDef = {
  color: '#448CFF',
  svg: (
    <>
      <rect x="4" y="4" width="16" height="16" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8 4v16M16 4v16M4 10h16M4 14h16" stroke="currentColor" strokeWidth="0.75" />
    </>
  ),
}

const Etcd: TechIconDef = {
  color: '#3C79D8',
  svg: (
    <>
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="12" cy="12" r="4" fill="currentColor" opacity="0.3" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" />
    </>
  ),
}

// ── Registry ────────────────────────────────────────────────────────────────
// Keys are the canonical lowercase names as stored by tech-detect.ts.
// Aliases (e.g. "ts" → typescript, "golang" → go) are included so
// every name in the MAPPING table resolves to an icon.

export const TECH_ICONS: Record<string, TechIconDef> = {
  // ── Languages ──
  typescript: TS,
  ts: TS,
  javascript: JS,
  javascriptscript: JS,
  coffeescript: { color: '#244776', svg: <path d="M6 4h12l-2 16H8L6 4z" fill="currentColor" /> },
  python: Python,
  go: Go,
  golang: Go,
  rust: Rust,
  ruby: Ruby,
  php: PHP,
  java: Java,
  kotlin: Kotlin,
  scala: Scala,
  swift: Swift,
  elixir: Elixir,
  erlang: Erlang,
  clojure: Clojure,
  haskell: Haskell,
  dotnet: CSharp,
  'c#': CSharp,
  csharp: CSharp,

  // ── Frameworks ──
  react: React,
  'react-dom': React,
  'react-native': React,
  next: NextJS,
  nextjs: NextJS,
  vue: Vue,
  vuejs: Vue,
  angular: Angular,
  '@angular/core': Angular,
  svelte: Svelte,
  'solid-js': { color: '#4F88C6', svg: <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z" fill="currentColor" opacity="0.3" /> },
  preact: Preact,
  gatsby: Gatsby,
  astro: Astro,
  express: Express,
  koa: { color: '#33333D', svg: <path d="M12 4c-4.42 0-8 3.58-8 8s3.58 8 8 8 8-3.58 8-8-3.58-8-8-8z" fill="none" stroke="currentColor" strokeWidth="1.5" /> },
  fastify: { color: '#000000', svg: <path d="M3 12l9-9 9 9-9 9-9-9z" fill="currentColor" /> },
  hapi: { color: '#95C11B', svg: <path d="M8 4v16M16 4v16M4 8h16M4 16h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" /> },
  nestjs: NestJS,
  '@nestjs/core': NestJS,
  hono: Hono,
  'express-session': Express,
  graphql: GraphQL,
  'graphql-yoga': GraphQL,
  apollo: Apollo,
  '@apollo/server': Apollo,
  trpc: tRPC,
  '@trpc/server': tRPC,
  django: Django,
  flask: Flask,
  fastapi: FastAPI,
  starlette: { color: '#009688', svg: <path d="M12 2l8 4v8l-8 4-8-4V6l8-4z" fill="currentColor" opacity="0.5" /> },
  tornado: { color: '#4479A1', svg: <path d="M12 2v20M8 6l4-4 4 4M6 12l-4 4 4 4M18 12l4-4-4-4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" /> },
  sanic: { color: '#FFFFFF', svg: <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" fill="none" stroke="currentColor" strokeWidth="1.5" /> },
  litestar: { color: '#2B6CB0', svg: <path d="M12 2l-8 4v8l8 4 8-4V6l-8-4z" fill="none" stroke="currentColor" strokeWidth="1.5" /> },
  uvicorn: { color: '#009688', svg: <circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" strokeWidth="1.5" /> },
  gunicorn: { color: '#49C9A9', svg: <circle cx="12" cy="12" r="8" fill="currentColor" opacity="0.2" /> },
  gin: Gin,
  echo: { color: '#00ADD8', svg: <path d="M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16z" fill="none" stroke="currentColor" strokeWidth="1.5" /> },
  fiber: Fiber,
  chi: { color: '#0F6FDE', svg: <path d="M5 5h14v14H5z" fill="none" stroke="currentColor" strokeWidth="1.5" /> },
  gorilla: { color: '#000000', svg: <circle cx="12" cy="10" r="6" fill="none" stroke="currentColor" strokeWidth="1.5" /> },
  rails: Rails,
  sinatra: { color: '#CC0000', svg: <path d="M12 4l-8 16h16L12 4z" fill="currentColor" opacity="0.5" /> },
  hanami: { color: '#D44B2B', svg: <path d="M12 2L2 12l10 10 10-10L12 2z" fill="currentColor" /> },
  laravel: Laravel,
  symfony: { color: '#000000', svg: <path d="M4 4h16v16H4z" fill="currentColor" opacity="0.1" /> },
  yii: { color: '#40B3DF', svg: <text x="12" y="16" textAnchor="middle" fontSize="10" fill="currentColor" fontWeight="bold">Y</text> },
  spring: Spring,
  'spring-boot': Spring,
  micronaut: { color: '#29ABE2', svg: <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.5" /> },
  quarkus: { color: '#4695EB', svg: <path d="M12 3l9 18H3L12 3z" fill="none" stroke="currentColor" strokeWidth="1.5" /> },
  actix: { color: '#FF6B35', svg: <path d="M12 4L4 20h16L12 4z" fill="currentColor" opacity="0.5" /> },
  axum: { color: '#7C3AED', svg: <path d="M12 2L2 7v10l10 5 10-5V7L12 2z" fill="none" stroke="currentColor" strokeWidth="1.5" /> },
  rocket: { color: '#D34B4B', svg: <path d="M12 2L8 12h8L12 2z" fill="currentColor" /> },
  warp: { color: '#000000', svg: <path d="M4 12c2-4 4-8 8-8s6 4 8 8-4 8-8 8-6-4-8-8z" fill="none" stroke="currentColor" strokeWidth="1.5" /> },
  'tower-web': { color: '#000000', svg: <path d="M12 2v20M2 12h20" stroke="currentColor" strokeWidth="1.5" fill="none" /> },

  // ── Databases ──
  pg: Postgres,
  postgres: Postgres,
  postgresql: Postgres,
  'node-postgres': Postgres,
  pgpromise: Postgres,
  knex: { color: '#E0694F', svg: <path d="M12 2L2 12l10 10 10-10L12 2z" fill="currentColor" /> },
  prisma: Prisma,
  '@prisma/client': Prisma,
  drizzle: Drizzle,
  'drizzle-orm': Drizzle,
  typeorm: { color: '#FE0803', svg: <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.5" /> },
  sequelize: { color: '#52B0E7', svg: <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 3a7 7 0 1 1 0 14 7 7 0 0 1 0-14z" fill="currentColor" /> },
  mongoose: { color: '#88C14A', svg: <path d="M4 4h16v16H4z" fill="none" stroke="currentColor" strokeWidth="1.5" /> },
  mongodb: MongoDB,
  'better-sqlite3': SQLite,
  sqlite3: SQLite,
  mysql2: MySQL,
  mysql: MySQL,
  mariadb: { color: '#003545', svg: <path d="M12 2L4 7v10l8 5 8-5V7l-8-5z" fill="currentColor" opacity="0.5" /> },
  ioredis: Redis,
  redis: Redis,
  '@upstash/redis': Redis,
  kysely: { color: '#FF6B9D', svg: <path d="M12 2l10 10-10 10L2 12 12 2z" fill="currentColor" /> },
  '@libsql/client': Turso,
  turso: Turso,
  neon: Neon,
  '@neondatabase/serverless': Neon,
  dynamoose: { color: '#4053D6', svg: <path d="M12 2L4 7v10l8 5 8-5V7l-8-5z" fill="currentColor" opacity="0.3" /> },
  '@aws-sdk/client-dynamodb': { color: '#4053D6', svg: <rect x="4" y="4" width="16" height="16" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5" /> },
  rethinkdb: { color: '#ED6C48', svg: <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm-3 8h6v2H9v6H7v-6h2v-2z" fill="currentColor" /> },
  arangojs: { color: '#E03C2F', svg: <path d="M12 2L4 20h4l4-8 4 8h4L12 2z" fill="currentColor" /> },
  neo4j: { color: '#008CC1', svg: <circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" strokeWidth="2" /> },
  '@neo4j/graphql': { color: '#008CC1', svg: <circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" strokeWidth="2" /> },
  psycopg2: Postgres,
  'psycopg2-binary': Postgres,
  sqlalchemy: { color: '#D71F00', svg: <path d="M12 2l9.5 5.5v11L12 24l-9.5-5.5v-11L12 2z" fill="currentColor" opacity="0.5" /> },
  alembic: { color: '#4E9A4E', svg: <path d="M8 4h8v6l-4 4-4-4V4z" fill="currentColor" /> },
  peewee: { color: '#77B863', svg: <circle cx="12" cy="10" r="5" fill="currentColor" /> },
  tortoise: { color: '#38B2AC', svg: <circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" strokeWidth="1.5" /> },
  motor: { color: '#47A248', svg: <path d="M4 8h16v8H4z" fill="currentColor" opacity="0.3" /> },
  pymongo: MongoDB,
  redispy: Redis,
  aioredis: Redis,
  pgx: Postgres,
  'lib/pq': Postgres,
  'go-sql-driver/mysql': MySQL,
  'go-redis': Redis,
  gorm: { color: '#00ACED', svg: <path d="M12 2L2 12l10 10 10-10L12 2z" fill="none" stroke="currentColor" strokeWidth="1.5" /> },
  sqlx: { color: '#FF6B6B', svg: <path d="M4 6h16M4 12h16M4 18h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" /> },
  ent: { color: '#47A248', svg: <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z" fill="none" stroke="currentColor" strokeWidth="1.5" /> },
  bongodb: MongoDB,
  diesel: { color: '#F47920', svg: <path d="M6 4h12l2 16H4L6 4z" fill="currentColor" /> },
  seaorm: { color: '#FF6B35', svg: <path d="M12 2L2 7v10l10 5 10-5V7L12 2z" fill="none" stroke="currentColor" strokeWidth="1.5" /> },
  redisrs: Redis,
  jdbc: { color: '#F89820', svg: <path d="M4 4h16v16H4z" fill="none" stroke="currentColor" strokeWidth="1.5" /> },
  'spring-data-jpa': Spring,
  hibernate: { color: '#59666C', svg: <circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" strokeWidth="1.5" /> },

  // ── Infrastructure ──
  docker: Docker,
  kubernetes: Kubernetes,
  k8s: Kubernetes,
  terraform: Terraform,
  ansible: Ansible,
  grafana: Grafana,
  prometheus: Prometheus,
  nginx: Nginx,
  traefik: { color: '#3FA8E5', svg: <path d="M12 2L2 12l10 10 10-10L12 2z" fill="none" stroke="currentColor" strokeWidth="1.5" /> },
  caddy: { color: '#1F8AC0', svg: <path d="M4 8h16M4 16h16M12 4v16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" /> },
  consul: Consul,
  vault: Vault,
  vercel: Vercel,
  netlify: Netlify,
  fly: Fly,
  railway: Railway,
  render: Render,
  cloudflare: Cloudflare,
  'cloudflare-workers': Cloudflare,
  aws: AWS,
  gcp: GCP,
  azure: Azure,
  supabase: Supabase,
  firebase: Firebase,
  rabbitmq: RabbitMQ,
  kafka: Kafka,
  'node-rdkafka': Kafka,
  bull: { color: '#E6262D', svg: <path d="M8 4c0 0-4 8 0 16M16 4c0 0 4 8 0 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" /> },
  bullmq: { color: '#E6262D', svg: <path d="M8 4c0 0-4 8 0 16M16 4c0 0 4 8 0 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" /> },
  'aws-sqs': AWS,
  celery: { color: '#A5CC54', svg: <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 4v6l4 4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /> },
  nats: { color: '#27AAE1', svg: <circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" strokeWidth="1.5" /> },
  mosquitto: { color: '#3C6F9E', svg: <path d="M12 4v16M8 8l4 4 4-4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" /> },
  s3: S3,
  minio: Minio,
  'aws-sdk': AWS,
  'minio-js': Minio,

  // ── Cache ──
  memcached: Memcached,
  memjs: Memcached,
  etcd: Etcd,
  keyv: { color: '#3B78E7', svg: <path d="M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16zm0 3a5 5 0 1 1 0 10 5 5 0 0 1 0-10z" fill="currentColor" opacity="0.3" /> },

  // ── Auto-detected names (from Dockerfile / compose parsing) ──
  'docker compose': Docker,
}

// ── Category fallback colours (used when no specific icon is mapped) ────────

export const CATEGORY_ICON_COLORS: Record<string, string> = {
  Languages: '#6B7280',
  Frameworks: '#8B5CF6',
  Databases: '#3B82F6',
  Infrastructure: '#10B981',
  Cache: '#F59E0B',
}

/**
 * Look up an icon for a given technology name.
 * Returns the icon definition or `null` if unmapped.
 */
export function getTechIcon(name: string): TechIconDef | null {
  const key = name.toLowerCase().replace(/[@\/\s]+/g, (m) => {
    // Preserve slash-separated segments (e.g. @prisma/client → prisma-client)
    if (m.includes('/')) return '-'
    return ''
  })

  // Direct lookup
  if (TECH_ICONS[key]) return TECH_ICONS[key]

  // Try the raw name (for names like "@angular/core")
  const rawKey = name.toLowerCase()
  if (TECH_ICONS[rawKey]) return TECH_ICONS[rawKey]

  // Try the last segment after / (e.g. "@prisma/client" → "client" won't match, but "prisma" might)
  const segments = rawKey.split('/')
  for (let i = segments.length - 1; i >= 0; i--) {
    if (segments[i] && TECH_ICONS[segments[i]]) return TECH_ICONS[segments[i]]
  }

  return null
}

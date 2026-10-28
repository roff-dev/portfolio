// The Shiki themes for the code library. The macOS (dark) one is made only from the locked palette in tokens.css.
// Every colour here is at least 4.5:1 on the terminal body (#1e1e1e).
const t = {
  body: '#1e1e1e',
  text: '#f0f0f0',
  muted: '#8a8a8a',
  keyword: '#ffa500',
  string: '#4caf50',
  heading: '#ffc107',
  accentHover: '#88b4dd',
  text2: '#cccccc',
};

export const codeTheme = {
  name: 'portfolio-terminal',
  type: 'dark' as const,
  colors: { 'editor.background': t.body, 'editor.foreground': t.text },
  settings: [
    { settings: { foreground: t.text, background: t.body } },
    { scope: ['comment', 'punctuation.definition.comment'], settings: { foreground: t.muted, fontStyle: 'italic' } },
    { scope: ['keyword', 'storage', 'storage.type', 'keyword.control', 'keyword.operator.new', 'keyword.other', 'entity.name.tag', 'keyword.control.at-rule'], settings: { foreground: t.keyword } },
    { scope: ['string', 'string.template', 'punctuation.definition.string', 'string.regexp'], settings: { foreground: t.string } },
    { scope: ['constant.numeric', 'constant.language', 'constant.other', 'support.constant', 'constant.other.color'], settings: { foreground: t.heading } },
    { scope: ['entity.name.function', 'support.function', 'meta.function-call entity.name.function'], settings: { foreground: t.accentHover } },
    { scope: ['entity.name.type', 'entity.name.class', 'support.type', 'support.class', 'storage.type.glsl', 'support.type.property-name'], settings: { foreground: t.heading } },
    { scope: ['variable.other.property', 'meta.property-name', 'variable.parameter'], settings: { foreground: t.text2 } },
    { scope: ['variable.scss', 'variable.other.sass'], settings: { foreground: t.accentHover } },
    { scope: ['punctuation', 'meta.brace', 'keyword.operator'], settings: { foreground: t.text2 } },
  ],
};

// The Windows (light) theme: Windows Terminal's One Half Light, darkened where it fell short, so every colour is
// at least 4.5:1 on the light code background (#fafafa)
const l = {
  body: '#fafafa',
  text: '#383a42',
  muted: '#696c77',
  keyword: '#a626a4',
  string: '#3c7a3b',
  number: '#8a5a00',
  fn: '#2a5fc7',
  prop: '#b0352a',
  punct: '#4f525d',
};

export const codeThemeLight = {
  name: 'portfolio-terminal-light',
  type: 'light' as const,
  colors: { 'editor.background': l.body, 'editor.foreground': l.text },
  settings: [
    { settings: { foreground: l.text, background: l.body } },
    { scope: ['comment', 'punctuation.definition.comment'], settings: { foreground: l.muted, fontStyle: 'italic' } },
    { scope: ['keyword', 'storage', 'storage.type', 'keyword.control', 'keyword.operator.new', 'keyword.other', 'entity.name.tag', 'keyword.control.at-rule'], settings: { foreground: l.keyword } },
    { scope: ['string', 'string.template', 'punctuation.definition.string', 'string.regexp'], settings: { foreground: l.string } },
    { scope: ['constant.numeric', 'constant.language', 'constant.other', 'support.constant', 'constant.other.color'], settings: { foreground: l.number } },
    { scope: ['entity.name.function', 'support.function', 'meta.function-call entity.name.function'], settings: { foreground: l.fn } },
    { scope: ['entity.name.type', 'entity.name.class', 'support.type', 'support.class', 'storage.type.glsl', 'support.type.property-name'], settings: { foreground: l.number } },
    { scope: ['variable.other.property', 'meta.property-name', 'variable.parameter'], settings: { foreground: l.prop } },
    { scope: ['variable.scss', 'variable.other.sass'], settings: { foreground: l.fn } },
    { scope: ['punctuation', 'meta.brace', 'keyword.operator'], settings: { foreground: l.punct } },
  ],
};

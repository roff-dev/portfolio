// The Shiki theme for the code library, made only from the locked palette in tokens.css.
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

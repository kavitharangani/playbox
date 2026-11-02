export const THEMES = [
  { id: 'indigo', name: 'Indigo', color: '#8b9dff', bg: '#0d1017' },
  { id: 'gold', name: 'Gold', color: '#ffc83d', bg: '#12131a' },
  { id: 'mint', name: 'Mint', color: '#5fe3b0', bg: '#0f1716' },
  { id: 'coral', name: 'Coral', color: '#ff8f73', bg: '#181213' },
  { id: 'sky', name: 'Sky', color: '#6cc4ff', bg: '#0f151c' },
  { id: 'violet', name: 'Violet', color: '#b9a0ff', bg: '#14121c' },
];

export function applyTheme(id) {
  const theme = THEMES.find((t) => t.id === id) || THEMES[0];
  document.documentElement.dataset.theme = theme.id;
  document.querySelector('meta[name="theme-color"]').content = theme.bg;
}

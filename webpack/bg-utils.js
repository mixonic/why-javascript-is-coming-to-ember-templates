export const randomColor = () =>
  '#' + (0x1000000 + Math.random() * 0xffffff).toString(16).slice(1, 6);
export const setBackground = (element, color) =>
  element.style.backgroundColor = color;

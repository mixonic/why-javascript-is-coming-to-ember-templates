import { welcome } from './components';

const render = steps => {
  return steps.map(([stepType, data]) => {
    switch (stepType) {
      case 0:
        return data;
      case 1:
        return data();
    }
  }).join('');
}

const template = [
  [0, 'To you I say: '],
  [1, welcome]
];

window.addEventListener('DOMContentLoaded', () => {
  render(template);
});

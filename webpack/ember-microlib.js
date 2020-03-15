import { welcome } from './components';

let components = {};
const setup = () => components['welcome'] = welcome;
const resolve = (name) => components[name];

const render = steps => {
  return steps.map(([stepType, data]) => {
    switch (stepType) {
      case 0:
        return data;
      case 1:
        return resolve(data)();
    }
  }).join('');
}

const template = [
  [0, 'To you I say: '],
  [1, 'welcome']
];

setup();
render(template);

import { randomColor, setBackground } from './bg-utils';

let components = {};
const setup = () => {
  components['random-color'] = randomColor;
  components['set-background'] = setBackground;
}

const render = steps => {
  return steps.map(([stepType, data]) => {
    switch (stepType) {
      case 0:
        return data;
      case 1:
        return components[component]();
    }
  }).join('');
}

const template = [[0, `No random colors today, just text :-)`]];

setup();
render(template);

# Why JavaScript is Coming to Ember Templates

or

# More Static

_Matthew Beale - Ember Framework & Steering_
_Engineering @ Addepar. Come work with me in NYC._

<!--

Good afternoon! I'm Matthew Beale and I'm excited to be back with you here
at EmberConf. I've been increadibly inspired by the work Tilde, the
conference organizers, my fellow speakers, and many others have done to make
this conference a success despite overwhelming circumstances. My heart and
thanks go out to each of you.

-->

---

<!--

So there is a joke on the core teams, it goes...

-->

---

# "No more unification RFCs"


<!--

Maybe some of you have an idea why.

-->

---

(screenshot MU RFC)


<!--

Just before EmberConf last year we decided to withdraw this RFC, the Module
Unification RFC, from consideration. It might seem late to be talking about
this topic and I won't be talking about Module Unification in detail, but
what you should know is that Module Unification was the framework's last
attempt to embrace dynamic linking over a pattern other build tools had started
adopting arounds the same time: Static linking.

"All good ideas end up in Ember" is another saying, so I'm going to talk about
the idea we think is better than Module Unification. And that is static linking.

-->

---

```js
// random-body-bg.js
const randomColor = () =>
  '#' + (0x1000000 + Math.random() * 0xffffff).toString(16).slice(1, 6);
const setBackground = (element, color) =>
  element.style.backgroundColor = color;

setBackground(document.body, randomColor());
```

```html
<html>
  <head>
    <script src="/random-body-bg.js"></script>
  </head>
  <body></body>
</html>
```

_A small, self-contained program_

<!--

Lets consider this small program. When the program, in this case app.js,
evaluates two functions are defined then called.

Because the functions are defined and executed in the same file our program has
some nice upsides. For example it is self-contained, I can add app.js to any
HTML file and I'll get a random background color.

Having local definition of the functions within the program also means the
language can give us some optimizaions for free.

-->

---

```js
// red-body-bg.js
const randomColor = () =>
  '#' + (0x1000000 + Math.random() * 0xffffff).toString(16).slice(1, 6);
const setBackground = (element, color) =>
  element.style.backgroundColor = color;

setBackground(document.body, '#ff0000');
```

```html
<html>
  <head>
    <script src="/red-body-bg.js"></script>
  </head>
  <body></body>
</html>
```

_A program with an unused function definition_

<!--

For example if we change the program to not call one of the functions then
the language parser can avoid doing work to fully prepare the unused function
for execution.

In fact minification tools take this a step further and use
their own implementations of a JavaScript language parser and printer to
entirely remove functions which aren't ever called. We say these tools work
"statically" because they analyze the structure
of a program without running it.

-->

---

```js
// random-body-bg.js
const randomColor = () =>
  '#' + (0x1000000 + Math.random() * 0xffffff).toString(16).slice(1, 6);
const setBackground = (element, color) =>
  element.style.backgroundColor = color;

setBackground(document.body, randomColor());
```

```js
// red-body-bg.js
const randomColor = () =>
  '#' + (0x1000000 + Math.random() * 0xffffff).toString(16).slice(1, 6);
const setBackground = (element, color) =>
  element.style.backgroundColor = color;

setBackground(document.body, '#ff0000');
```

_Two programs, one with all functions called and one without_

<!--

For example these programs are roughly the same in apparent complexity, but
after calling the minification tool terser...

-->

---

```js
// random-body-bg.js
var o,r;o=document.body,r="#"+(16777216+16777215*Math.random()).toString(16).slice(1,6),o.style.backgroundColor=r;
```

```js
// red-body-bg.js
var o,d;o=document.body,d="#ff0000",o.style.backgroundColor=d;
```

_Two programs after `terser`, one with all functions called and one without_

<!--

We can see that terser does the same analysis our eyeballs can do when reading
the code, and drops the unnecessary random color generation code.

Despite this I'm not sure I've convinced eveyone they should start
writing all their JavaScript in one file. Let's consider a solution more
friendly to code re-use.

-->

---

```js
// bg-utils.js
window.randomColor = () =>
  '#' + (0x1000000 + Math.random() * 0xffffff).toString(16).slice(1, 6);
window.setBackground = color =>
  document.body.style.backgroundColor = color;
```

```js
// random-body-bg.js
window.setBackground(document.body, window.randomColor());
```

```html
<html>
  <head>
    <script src="/bg-utils.js"></script>
    <script src="/random-body-bg.js"></script>
  </head>
  <body></body>
</html>
```

_A program with a runtime dependency_

<!--

So often we split off some part of the program in to a utility or library.
In JavaScript it has been common to do this by coupling the files at runtime.
In another programming paradigm we might call this dynamic linking. The
random-body-bg program executes with the assumption an implementation of what
it depends on has been provided.

Dynamic linking adds some flexibility. We could re-use this utility file on a
lot of pages, and write other programs that set the background on things
besides the body based on those same functions. The utility file might also
be cached by the browser, so that once any single HTML page loads all the other
pages with that dependency may load more quickly.

But let's make that same change we made before, and stop using one of the
functions.

-->

---

```js
// bg-utils.js
window.randomColor = () =>
  '#' + (0x1000000 + Math.random() * 0xffffff).toString(16).slice(1, 6);
window.setBackground = (element, color) =>
  element.style.backgroundColor = color;
```

```js
// red-body-bg.js
window.setBackground(document.body, '#ff0000');
```

```html
<html>
  <head>
    <script src="/bg-utils.js"></script>
    <script src="/red-body-bg.js"></script>
  </head>
  <body></body>
</html>
```

_A program with a runtime dependency, and unused code_

<!--

In this case the randomColor isn't being called. Lets apply the same static
analysis tool, terser, which we applied to the small self-contained program.

-->

---

```js
// bg-utils.js
window.randomColor=()=>"#"+(16777216+16777215*Math.random()).toString(16).slice(1,6),window.setBackground=(o,n)=>o.style.backgroundColor=n;
```

```js
// red-body-bg.js
window.setBackground(document.body,"#ff0000");
```

```html
<html>
  <head>
    <script src="/bg-utils.js"></script>
    <script src="/red-body-bg.js"></script>
  </head>
  <body></body>
</html>
```

_A minified program with a runtime dependency, and unused code_

<!--

We can see that randomColor remains in the utility file despite not being used.

This is an inherent limitation of dynamic linking. Because the analysis of the
dependency and the program happen independently you can't efficiently
optimize away unused parts of the dependency.

But could we analyze the dependency and the program at the same time?

-->

---

```js
// bg-utils.js
export const randomColor = () =>
  '#' + (0x1000000 + Math.random() * 0xffffff).toString(16).slice(1, 6);
export const setBackground = (element, color) =>
  element.style.backgroundColor = color;
```

```js
// red-body-bg.js
import { setBackground } from 'bg-utils';
setBackground(document.body, '#ff0000');
```

```html
<html>
  <head>
    <script src="/bundle.js"></script>
  </head>
  <body></body>
</html>
```

_A program with a static dependency, and unused code_

<!--

Lets port the program over to use ES modules. ES modules will give us the
benefits of having distinct files, but they also provide a path for tools
to analyze the program and dependency at the same time.

Because module paths are well understood by tools like rollup, they can do the
analysis tenser did on the self-contained program on programs with many
modules.

When I run rollup and tenser on red-body-bg we get...

-->

---

```js
// bundle.js
var o,d;o=document.body,d="#ff0000",o.style.backgroundColor=d;
```

```html
<html>
  <head>
    <script src="/bundle.js"></script>
  </head>
  <body></body>
</html>
```

_A bundled and minified program with a static dependency_

<!--

Wow, back down to nothing.

In contrast to dynamic linking where the dependency of the application was
found at runtime, in this case the dependency is statically linked.

Static linking with minification is a powerful way for us to prune code from
a compiled application, especially code which is hidden across many files
and dependencies. ES modules were in fact design with this vision in mind.

-->

---

```js
// bg-utils.js
export const randomColor = () =>
  '#' + (0x1000000 + Math.random() * 0xffffff).toString(16).slice(1, 6);
export const setBackground = (element, color) =>
  element.style.backgroundColor = color;
```

```js
import { randomColor } from './bg-utils';

let components = {};
const setup = () => {
  components['random-color'] = randomColor;
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
```

```html
<html>
  <head>
    <script src="/bundle.js"></script>
  </head>
  <body></body>
</html>
```

_Something similar to an Ember app_

<!--

This should work with an Ember app, right? So here I've written a version of
Ember's rendering engine in miniature. The template being rendered is only
going to show text though. The bg-util for randomColor is registered as a
component, but not actually used.

So lets try it through rollup and terser.

-->

---

```js
// bundle.js
const o=()=>"#"+(16777216+16777215*Math.random()).toString(16).slice(1,6),t=(o,t)=>o.style.backgroundColor=t;let n={};const r=[[0,"No random colors today, just text :-)"]];n["random-color"]=o,n["set-background"]=t,r.map(([o,t])=>{switch(o){case 0:return t;case 1:return n[component]()}}).join("");
```

```html
<html>
  <head>
    <script src="/bundle.js"></script>
  </head>
  <body></body>
</html>
```

_Something similar to an Ember app via a bundle and minification_

<!--

Hm, well the randomColor function is definitely still there.

Ember's implementation of resolution for components, but also services and
other parts of the framework, is too complex for tools like rollup and terser
to understand out of the box.

Now there are is effort underway to re-organize Ember CLI's build pipeline
so we can get these benefits in current Ember codebases. It isn't impossible.

However the complexity of the effort is high. There are a few notable caveats
in that some edge cases won't work like they did in the old implentation, and
also in that improving the build pipeline doesn't improve your editors tooling,
or the framework's TypeScript compatability, or the ability of other non-Ember
CLI build tooling to work seamlessly with your codebase.

-->

---

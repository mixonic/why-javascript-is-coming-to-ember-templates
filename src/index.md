---
theme: emberconf
footer: Why JavaScript is Coming to Ember Templates - EmberConf 2020
---

<style scoped>
p {
 font-size: 0.9em;
}
</style>

# Why JavaScript is Coming to Ember Templates

###### Matthew Beale<br>Ember Framework & Steering<br>Engineering @ Addepar.<br>_Come work with me in NYC!_

![bg right:40% w:80%](./images/emberconf-logo.svg)

<!--

Good afternoon! I'm Matthew Beale and I'm excited to be back with you here
at EmberConf. I've been increadibly inspired by the work Tilde, the
conference organizers, my fellow speakers, and many others have done to make
this conference a success despite overwhelming circumstances. My heart and
thanks go out to each of you.

-->

<!--

So there is a joke on the core teams, it goes...

-->

---

## "No more unification RFCs"


<!--

Maybe some of you have an idea why.

-->

---

![](./images/scroll-module-u.apng)

![bg right:40% w:80%](./images/look-fire.gif)


<!--

Just before EmberConf last year we decided to withdraw this RFC, the Module
Unification RFC, from consideration. It might seem late to be talking about
this topic and I won't be talking about Module Unification in detail.

What you should understand, if you don't already, is that Module Unification
was a last attempt at cleaning up some loose ends in how we organize and
reference files in Ember.

-->

---

```hbs
<Welcome />
```

<!--
So this is a valid component to render in Ember. And I want to ask you a
question: If I'm working on an app with this component where to I find the
template which goes with it?

Go ahead and think of your answer.
-->

* `app/templates/components/welcome.hbs`
* `app/templates/components/welcome/template.hbs`
* `node_modules/an-addon/app/templates/components/welcome.hbs`
* `node_modules/an-addon/app/templates/components/welcome/template.hbs`
* `node_modules/a-different-addon/app/templates/components/welcome.hbs`
* Actually, it could literally be anywhere since resolvers are a runtime concern :grimacing:

<!--

If you guess this, wrong! (for each until the last one)

So this facet of Ember make a couple things difficult. For example, if you
want to open the implemention of the modal component when clicking on it in
your IDE, we would need to run your apps resolver. If TypeScript wants to
check the definition of this object, we need to run your apps resolver.

And running the apps resolve isn't even itself always going to do the trick
since the resolver is a /runtime/ concern. I'll come back to that when I
talk about dynamic linking.

-->

---

(graph of local maxima)

<!--

Anyway who is familiar with the concept of a local maxima? When you're looking
for a solution to a problem there are probably may possible solutions. (joke
about how to fix things?)
Sometimes, you pick a totally reasonable solution, but you end up so fixated
on the solution you have that it is hard to see a better solution. (joke? AI?
RNN?)

Module Unification was a local maxima. We saw some problems with how complex
Ember's resolver system was and we tried to solve them by resolving even
harder than before. By introducing more formal rules and requirements.

In hindsight it was a local maxima, and the rest of the JavaScript community
was climbing the hill to a better solution. This talk is about how we're going
to align Ember with that better solution.

-->

---

### Matt's Elegant Ember Microlib

`components.js`

```js
export function welcome() {
  return '<strong>Welcome!</strong>';
};
```

<!--

To illustrate the problem with Ember's resolver system lets build a little
fork of Ember I'll call Matt's Elegant Ember Microlib. Here is a component
in my framework, you can see it just returns a string.

-->

---

### Matt's Elegant Ember Microlib


```js
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
window.addEventListener('DOMContentLoaded', () => {
  render(template);
});
```

<!--

So here is my framework. I import my components, add them to a named list in
setup, and resolve looks them up from that list.

Further down I've got a template inspired by Glimmer's opcode system, and
a render function above that processes that. When the opcode 1 is present,
that component is resolved and called.

Let's build this app using some popular bundling tools, rollup and terser.

-->

---

### Matt's Elegant Ember Microlib


```js
// rollup -i ember-microlib.js | terser --compress --mangle --toplevel --beautify
function e() {
  return "<strong>Welcome!</strong>";
}

let n = {};

const o = e => e.map(([e, o]) => {
  switch (e) {
    case 0:
      return o;

    case 1:
      return n[o]();
  }
}).join(""), t = [ [ 0, "To you I say: " ], [ 1, "welcome" ] ];

n.welcome = e, window.addEventListener("DOMContentLoaded", () => {
  o(t);
});
```

<!--

Rollup takes advantage of the fact that ES modules are static. That is,
the imports and exports from a module can be understood without running that
code. Rollup figures out how to take your multiple modules and safely
combine them into a single JavaScript program. You can think of it as a simple
compiler which takes our dependency, the component, and links it to the main
program.

Terser is a minification tool that uses static analysis to make your JavaScript
payload smaller.

Looks ok.

-->

---

### Matt's Elegant Ember Microlib

```js
const template = [
  [0, 'To you I say: '],
  [1, 'welcome']
];
```

<!--

But lets change the template. Instead of calling opcode 1 to print the
component, lets just render more text with opcode 0.

-->

---

### Matt's Elegant Ember Microlib

```js
const template = [
  [0, 'To you I say: '],
  [0, 'a fond farewell']
];
```

<!--

Ok, lets compile this.

-->

---

### Matt's Elegant Ember Microlib


```js
// rollup -i ember-microlib.js | terser --compress --mangle --toplevel --beautify
function e() {
    return "<strong>Welcome!</strong>";
}

let n = {};

const o = e => e.map(([e, o]) => {
    switch (e) {
      case 0:
        return o;

      case 1:
        return n[o]();
    }
}).join(""), t = [ [ 0, "To you I say: " ], [ 0, "a fond farewell" ] ];

n.welcome = e, window.addEventListener("DOMContentLoaded", () => {
    o(t);
});
```

<!--

Ok you can see our updated text, but look on top, our component is still
included. What's up?

The resolver pattern used in this example, and in Ember, simply isn't
trivial to analyze statically. In fact you could try to analyze this program,
but you would need to make several assumptions that aren't actually enforced
by the JavaScript language.

The dynamic nature of the resolver is also what makes it challenging for tools like
jump to definition or TypeScript to work trivially with Ember apps.

Tools like Embroider and the Ember language server attempt to do that extra
work, but the effort is heroic and not without some caveats.

-->

---

### Matt's Eleganter Ember Microlib

```js
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
```

<!--

Let's cut out the resolver. In this version of the template I've referenced
the welome component directly. There is no setup, no list of components,
no resolver.

Lets run it through rollup and terser

-->

---

### Matt's Eleganter Ember Microlib

```js
// rollup -i ember-microlib.js | terser --compress --mangle --toplevel --beautify
const n = [ [ 0, "To you I say: " ], [ 1, function() {
    return "<strong>Welcome!</strong>";
} ] ];

window.addEventListener("DOMContentLoaded", () => {
    n.map(([n, e]) => {
        switch (n) {
          case 0:
            return e;

          case 1:
            return e();
        }
    }).join("");
});
```

<!--

Check that out, the implementation of the component is actually written
directly into the template a compilation time.

We've made the link between the program and the component static, that is
analyzable at build time. Not only does that remove a lookup step to make
the component rendering faster, it means we analysis of the templates
themselves can decide what supporting code needs to be included.

-->

---

### Matt's Eleganter Ember Microlib

```js
const e = [ [ 0, "To you I say: " ], [ 0, "a fond farewell" ] ];

window.addEventListener("DOMContentLoaded", () => {
  e.map(([e, n]) => {
      switch (e) {
        case 0:
          return n;

        case 1:
          return n();
      }
  }).join("");
});
```

<!--

For example here the template has been updated avoid rendering the component,
and the bundlers can leave our component out all together.

ES modules were designed with this kind of analysis in mind. Efforts like
Embroider are amazing technical solutions that patch over Ember's dynamic
resolver, but if we can make the templates static we can get the same
benefits without the complexity.

-->

---


# Handlebars Strict Mode

<!--

So what would a static template in Ember look like?

Well Godfrey Chan has been exploring this in RFC #496. In that RFC he proposes
strict templates in Ember. We call this a "mode" because like strict mode in
JavaScript, it opts the user into a version of the language where messy edge
cases are disabled.

-->

---

# Handlebars Strict Mode

* No implicit `this` fallback. `{{foo}}` doesn't imply `{{this.foo}}`.
* No resolution. For example `{{foo-bar}}` is only ever a variable.
* No dynamic resolution. `{{component this.dynamicName}}`.
* No partials. `{{partial 'foo-bar'}}`.

<!--

What makes a strict mode template? Really it is a list of things we remove
from the framework. Lint warnings and deprecations already encourage
developers to follow the first two constraints.

But the second two constraints seem bizarre when you think about them in
isolation.

-->

---

# Handlebars Strict Mode

```hbs
{{#each @greetings as |myGreeting|}}
  To {{this.subjectName}} I say: <q>{{myGreeting}}</q>
{{/each}}
```

<!--

So here is some content for an handlebars strict mode template.
A strict mode template, unlike the Ember templates we use today, is
static. At build time the compiler can understand all links between this
template and the others is depends on.

Of course remember our constraints

-->

* No resolution. For example `{{foo-bar}}` is only ever a variable.
* No dynamic resolution. `{{component this.dynamicName}}`.
* No partials. `{{partial 'foo-bar'}}`.

<!--

There really isn't a clear way to have a dependency in the first place.
We've got a static template, but one of limited usefulness if we
want to get anything done.

And this brings us to the crux: We need a static solution for getting
other components into the local scope of a strict mode template. Since
we want to bundle our application as JavaScript, we want to do something that
works with ES modules.

And this takes us to the core of this talk: We don't use something that works
with ES modules, we just use ES modules. On these next slides I'm going
to show some template syntaxes that are very much not even in an RFC.
In order to find a maxima for our template design we need to think
creatively.

-->

---

# Template Imports

###### Source template:

```hbs
{{#each @greetings as |myGreeting|}}
  To {{this.subjectName}} I say: <q>{{myGreeting}}</q>
{{/each}}
```

###### Compiled output:

```js
import { createTemplateFactory } from '@ember/template-factory';

export default createTemplateFactory({
  "id": "ANJ73B7b",
  "block": "{\"statements\":[\"...\"]}",
  "meta": { "moduleName": "greetings.hbs" }
});
```

<!--

The strict mode templat RFC does provide a way to get other components
into the scope of a template.

First consider that an Ember template is compiled from handlebars into
JavaScript. Strict mode templates suggest that we can pass JavaScript variables
into the scope of the template as part of the compilation.

-->

---

# Template Imports

###### Source template:

```hbs
{{#each @greetings as |myGreeting|}}
  To {{this.subjectName}} I say: <Quote>{{myGreeting}}</Quote>
{{/each}}
```

###### Compiled output:

```js
import { createTemplateFactory } from '@ember/template-factory';
import Quote from './quote';

export default createTemplateFactory({
  "id": "ANJ73B7b",
  "block": "{\"statements\":[\"...\"]}",
  "meta": { "moduleName": "greetings.hbs" },
  "scope": () => [Quote]
});
```

<!--

For example here the strict template, which remember has no resolution,
is invoking the component "Quote". In the compiled output the Quote
component is explicitly imported, then passed into the compiled template
through a property "scope".;

This is basically as far a the handlebar strict mode template RFC goes.
The RFC answers a lot of questions about what the constraints are for a static
template, and proposes how the template engine can use ES modules at build
time.

We don't write compiled templates by hand though, so how do we use this
when working normally?

-->

---

# Template Imports

<!--

There are several plausible approaches. A few constraints have become clear
though.

-->

* Any system for importing components (and other data) into scope must use
  paths compatible with node.
* Any system should allow importing with the same semantics as ES Module
  imports (default, named).

<!--

Given that we accept these constraints, we should as a question: If we're going
to constrain ourselves so closly to re-implementing how ES modules work in
templates, why not just use ES modules syntax?

-->

---

# Template Imports

###### A single component import

```hbs
---
import Quote from './quote';
---
{{#each @greetings as |myGreeting|}}
  To {{this.subjectName}} I say: <Quote>{{myGreeting}}</Quote>
{{/each}}
```

---

# Template Imports

###### Imports from the app, framework, and an addon

```hbs
---
import Quote from './quote';
import { titleize } from '@ember/template-helpers';
import { animatedEach } from 'ember-animated/helpers';
---
{{#animatedEach @greetings as |myGreeting|}}
  To {{titleize this.subjectName}} I say: <Quote>{{myGreeting}}</Quote>
{{/each}}
```

---

# Template Imports

###### Imports from the app, framework, and an addon after compilation

```js
import { createTemplateFactory } from '@ember/template-factory';
import Quote from './quote';
import { titleize } from '@ember/template-helpers';
import { animatedEach } from 'ember-animated/helpers';

export default createTemplateFactory({
  "id": "ANJ73B7b",
  "block": "{\"statements\":[\"...\"]}",
  "meta": { "moduleName": "greetings.hbs" },
  "scope": () => [Quote, titleize, animatedEach]
});
```

---

# Why haven't you shipped it

* In testing, how do you import `Foo` into ``hbs`<Foo />` ``?
* How to you opt-in to strict mode and imports? `.hbml`?
* Some Ember keywords must remain built-ins (`{{outlet}}`, `{{yield}}`,
  `{{mount}}`), but what are the import paths for helpers?
* Once you allow imports to be used in templates, _why not allow
  any arbitrary old JavaScript and build single-file components?_

---

# Closing the gap

###### An Ember template using the resolver

```hbs
<Foo />
```

###### A static Ember template

```hbs
---
import Foo from './quote';
---
<Foo />
```

<!--

I want to remind everyone that performance isn't the biggest motivation.
Static templates with ES imports are going to be much easier for our tooling
to understand, and I would argue they make it much easier for new developers
to grasp where any random component is coming from.

Module Unification has some interesting features you might have hear of like
"contextual components". Explicit imports make those complex machinations
unnecessary. Although we will continue to build a framework with strong
conventions static imports also open the door to any organization of components
you could normally do on the filesystem.

-->

---

# Closing the gap

<!--

So that is why JavaScript, or at least JavaScript import syntax,
is coming to Ember templates in about 15 minutes. Explicit imports
are an important part of building static templates. Static linking of
template dependencies is a solution other frameworks and libraries have
already innovated on, and in fact it is core to the design of ES modules
themselves.

Stepping away from Module Unification last year was a recognition that our
designs were stuck on a local maxima. This reorientation will work us toward
something better, and something better aligned with the entirity of the
JavaScript ecosystem.

-->

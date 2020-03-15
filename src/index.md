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
To you I say: <Welcome />
```

<!--

Lets say we're reading this template: Most Ember developers would intuit
that they could look for the definition of `Welcome`'s template here:

-->

- `app/templates/components/welcome.hbs`

<!--

and that is often correct.

But if you want to build an implementation of jump to definition, or get
TypeScript to understand where the component's template might be, you need
to consider a number of other valid locations.

-->

---

```hbs
To you I say: <Welcome />
```

- `app/templates/components/welcome.hbs`
- `app/templates/components/welcome/template.hbs`
- `node_modules/an-addon/app/templates/components/welcome.hbs`
- `node_modules/an-addon/app/templates/components/welcome/template.hbs`
- `node_modules/a-different-addon/app/templates/components/welcome.hbs`
- Actually, it could literally be anywhere since resolvers are a runtime concern :grimacing:

<!--

Ember's resovler permits that template to be defined in a number of different
locations, and the logic for deciding which to use is implemented as part of
the application's runtime logic.

That makes
it challenging to support common static tooling like IDEs, type systmes,
and bundlers common across other parts of the JavaScript community.

-->

---
<style scoped>
  section {
    background-color: white;
  }
</style>

![bg auto](./images/local-maximum.png)

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
<style scoped>
  section {
    background-color: white;
  }
</style>

![bg auto](./images/local-maximum-local-img.png)

---

### Matt's Resolving Ember Microlib

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

### Matt's Resolving Ember Microlib


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
render(template);
```

<!--

So here is my framework. I import my components, add them to a named list in
setup, and resolve looks them up from that list.

Further down I've got a template inspired by Glimmer's opcode system, and
a render function above that processes that. When the opcode 1 is present,
that component is resolved and called.

The data passed with opcode 1 is the string `welcome`. This is the crux of a
dynamic system: Instead of referencing the component directly, or template is
using a name for the component. That introduces ambiguity about what the
string is used for, ambiguity a lot of tooling can't penetrate.

Let's see how that ambiguity presents itself in two common ways.

-->

---

### Matt's Resolving Ember Microlib


```js
// rollup -i ember-microlib.js | terser --compress --mangle --toplevel --beautify
function e() {
  return "<strong>Welcome!</strong>";
}

let o = {};

o.welcome = e, [ [ 0, "To you I say: " ], [ 1, "welcome" ] ].map(([e, n]) => {
  switch (e) {
    case 0:
      return n;

    case 1:
      return o[n]();
  }
}).join("");
```

<!--

First, I've run the program through some popular build tools: Rollup and terser.

Rollup takes advantage of the fact that ES modules are static. That is,
the imports and exports from a module can be understood without running that
code. Rollup figures out how to take your multiple modules and safely
combine them into a single JavaScript program. You can think of it as a simple
compiler which takes our dependency, the component, and links it to the main
program.

Terser is a minification tool that uses static analysis to make your JavaScript
payload smaller.

For this version of the program, the output looks like what we would expect.
the component is present, and the rendering logic is present.

-->

---

### Matt's Resolving Ember Microlib

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

### Matt's Resolving Ember Microlib

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

### Matt's Resolving Ember Microlib


```js
// rollup -i ember-microlib.js | terser --compress --mangle --toplevel --beautify
function e() {
  return "<strong>Welcome!</strong>";
}

let n = {};

n.welcome = e, [ [ 0, "To you I say: " ], [ 0, "a fond farewell" ] ].map(([e, o]) => {
  switch (e) {
    case 0:
      return o;

    case 1:
      return n[o]();
  }
}).join("");
```

<!--

In this output you wouldn't expect the component logic to be present, since we
stopped referencing it in the templates. But because that relationship was
something resolved at runtime and because rollup and terser don't know what the
program will actually do, they aren't able to strip it out.

Tool like Embroider close this gap by teaching build tools to assume
things about the runtime, but I can give you another example of how this dynamic
implementation frustrates analysis.

-->

---

### Matt's Resolving Ember Microlib

![](./images/failed-jump-to-definition.apng)

<!--

A second example of how the resolvers ambiguity has practical impacts is
as common as looking at the most popular IDE for Ember users: VSCode. Here
I've opened the micro lib and I've attempted to jump the definition of the
component as it is referenced in the template.

It isn't surprising this doesn't work: The data in the template is only a
string. Again, in order to resolve this ambiguity about the meaning of
the string "welcome" we would need to write a custom language server and
encode certain assumptions about where to look for definitions.

-->

---

### Dynamic resolution vs. static linking

```hbs
To you I say: <Welcome />
```

<!--

The first draft of my microlib used dynamic resolution to look up components.
Then the application boots, the available components are put in to a map then
templates reference them by strings. In order for our eyes to know where to
find a definition, or for our tooling to know, we need to teach those systems
what the rules for resolution are.

That's why when I ask *you* where to find the Welcome component, you can give
a reasonable answer. You've internalized the rules.

In contrast a static system, one based on ES modules, will always be explicit
about where to find a definition.

Lets build a second draft of the microlib, this time a static version.

-->

---

### Matt's Static Ember Microlib

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

render(template);
```

<!--

In this version of the template I've referenced
the welome component directly. There is no setup, no list of components,
no resolver.

Further more if you want to see where the welcome component comes from there
is little code to think about, right? You simple look to where the variable was
introduced. Here, as an import.

-->


---

### Matt's Static Ember Microlib

![](./images/jump-to-definition.apng)

<!--

Now that the template contains a direct reference to the component, we don't
need to teach tooling about any ambiguous cases. That means jump to definition
will just work in a template like it would in most JavaScript code.

-->
---

### Matt's Static Ember Microlib

```js
// rollup -i ember-microlib.js | terser --compress --mangle --toplevel --beautify
[ [ 0, "To you I say: " ], [ 1, function() {
  return "<strong>Welcome!</strong>";
} ] ].map(([n, r]) => {
  switch (n) {
    case 0:
      return r;

    case 1:
      return r();
  }
}).join("");
```

<!--

And when the bundlers process this, the implementation of the component is
actually written directly into the template a compilation time. Cool.

We've made the link between the program and the component static. The tooling
can not only understand where the component is being used, it can also
understand if it isn't used at all.

-->

---

### Matt's Static Ember Microlib

```js
// rollup -i ember-microlib.js | terser --compress --mangle --toplevel --beautify
[ [ 0, "To you I say: " ], [ 0, "a fond farewell" ] ].map(([a, e]) => {
  switch (a) {
    case 0:
      return e;

    case 1:
      return e();
  }
}).join("");
```

<!--

For example if we change the second render step back to "a fond farewell"
instead of a component invocation, the bundler understands that the variable
is not referenced and the entire component implementation can be dropped.

Great. So Ember's templates are more featureful than my microlib. How can we
bring the benefits of a staticly linked system to Ember itself?

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

# Handlebars Strict Mode

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
  "strict": true,
  "scope": () => [Quote]
});
```

<!--

The strict mode templat RFC does provide a way to get other components
into the scope of a template.

First consider that an Ember template is compiled from handlebars into
JavaScript. Strict mode templates suggest that we can pass JavaScript variables
into the scope of the template as part of the compilation.

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
  "strict": true,
  "scope": () => [Quote, titleize, animatedEach]
});
```

---

# The Next Steps

- Get Handlebars Strict Mode into Final Comment Period, and land the primitives
  it describes.
- Build an addon for template imports so we can experiment with syntax and
  opt-in for strict mode.
- Start a design for what the ES module API is for built-ins like `<LinkTo>`
  or `<Input />` 

<!--

What are our next steps in the process of delivering template imports? The
strategy we used to experiment with and land Glimmer Components is the same
as the approach we want to use here. We're going to land a flexible primitive,
strict mode templates, and then experiement with practice implementations on
top of that. This will help us test assumptions in the template imports
design, and help us get feedback from the parts of the commmunity most
excited to see this feature land.

-->

---

# Closing the gap

###### An Ember template using the resolver

```hbs
<Welcome />
```

###### A static Ember template

```hbs
---
import Welcome from './welcome';
---
<Welcome />
```

<!--

I want to remind everyone that performance isn't the biggest motivation.
Static templates with ES imports are going to be much easier for our tooling
to understand, and I would argue they make it much easier for new developers
to grasp where any random component is coming from.

Module Unification has some interesting features you might have hear of like
"local lookup". Explicit imports will make those features unnecessary.
An import syntax will allow components to be grouped naturally in
your projects without us losing common conventions as suggested by linting
and generators.

-->

---

# Closing the gap

<!--

So that is why JavaScript, or at least JavaScript import syntax,
is coming to Ember templates. Explicit imports
are an important part of building static templates. Static linking of
template dependencies is a solution other frameworks and libraries have
already innovated on, and in fact it is core to the design of ES modules
themselves.

Stepping away from Module Unification last year was a recognition that our
designs were stuck on a local maxima. This reorientation will work us toward
something better, and something better aligned with the entirity of the
JavaScript ecosystem.

-->

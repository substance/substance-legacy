# Substance

Building a web editor is a hard. Native browser support for text editing is [limited and not reliable](https://medium.com/medium-eng/why-contenteditable-is-terrible-122d8a40e480) and there are many pitfalls such as handling selections, copy&paste and undo/redo. Substance is being developed to solve those common problems and provides API's for building a custom editor, that makes no assumptions on the used markup or layout.

With Substance you can:

- Define a *custom article schema*
- Manipulate content and annotations using *operations* and *transactions*
- Define custom HTML structure and attach a `Substance Surface` on it to make it editable
- Implement custom tools for any possible task like toggling annotations, inserting content or trimming whitespace
- Control *undo/redo* behavior and *copy&paste*
- and more.

## Getting started

Let's develop a basic Rich Text Editor using Substance. We will define a simple article format, and an editor to manipulate it in the browser. Follow our guide here to get a feeling about the available concepts. Get your hands dirty by playing around with our [starter package](https://github.com/substance/starter) and if you feel more ambitious you can look at our [Science Writer](https://github.com/substance/science-writer) app.

### Define a custom article format

Modelling a schema is easy.

```js
var schema = new Substance.Document.Schema("rich-text-article", "1.0.0");
```

Substance has a number of predefined commonly used Node types, that we are going to borrow for our schema. But defining our own is very simple too.

```js
var Paragraph = Substance.Document.Paragraph;
var Emphasis = Substance.Document.Emphasis;
var Strong = Substance.Document.Strong;

var Highlight = Document.Annotation.extend({
  name: "highlight"
});

schema.addNodes([
  Paragraph,
  Emphasis,
  Strong,
  Highlight
]);
```

We need to specify a default text type, which will be the node being created when you hit enter.

```js
schema.getDefaultTextType = function() {
  return "paragraph";
};
```

Based on Substance Document, we now define a Javascript class, that will hold our future documents.

```js
var RichTextArticle = function() {
  RichTextArticle.super.call(this, schema);
};

RichTextArticle.Prototype = function() {
  this.initialize = function() {
    this.super.initialize.apply(this, arguments);

    // We will create a default container node `body` that references arbitrary many
    // content nodes, most likely paragraphs.
    this.create({
      type: "container",
      id: "body",
      nodes: []
    });
  };
};

Substance.inherit(RichTextArticle, Document);

RichTextArticle.schema = schema;
```

### Create an article programmatically

Create a new document instance.

```js
var doc = new RichTextArticle();
```

Create several paragraph nodes

```js
doc.create({
  id: "p1",
  type: "paragraph",
  content: "Hi I am a Substance paragraph."
});

doc.create({
  id: "p2",
  type: "paragraph",
  content: "And I am the second pargraph"
});
```

A Substance document works like an object store, you can create as many nodes as you wish and assign unique id's to them. However in order to show up as content, we need to show them on a container.

```js
// Get the body container
var body = doc.get('body');

body.show('p1');
body.show('p2');
```



### Anatomy of a Substance Document


TODO: describe 

- Nodes
- Properties
- Containers


TODO:

### Transactions

When you want to update a document, you should wrap all your changes in a transaction, so you don't end up in inconsistent in-between states. The API is fairly easy:

```js
doc.transaction(function(tx) {
  tx.delete("em2"); // deletes an emphasis annotation with id em2
});
```

```js
var updated = "Hello world!";
doc.transaction(function(tx) {
  tx.set([text_node_1, "content"], updated); // updates content property of node text_node_1
});
```

## Rules that make your life easier:

- Content tools must bind to mousedown instead of click to handle toggling.
  That way we can prevent the blur event to be fired on the surface.
- The root element of a Substance Surface must be set contenteditable


## Development

### Testing

1. Running the QUnit test-suite in a browser for debugging:

```
$ node test/serve
```

Then open http://localhost:4201 in your browser.

2. Running test-suite using Karma to generate a code coverage report.

```
$ karma start test/karma.conf.js
```

The report will be stored in the `coverage` folder.

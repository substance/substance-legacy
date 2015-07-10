# Substance

Substance is a toolkit for web-based content editors.

It provides generic API's:

- Substance Document (define custom document schemas, instantiate and manipulate a document)
- Substance Surface (Define the HTML structure of your custom editor and attach a Substance Surface on it to make it editable)

Substance also includes a reference implementation for an extensible web-editor.

- Substance Writer

API for manipulating documents (Substance Document)

## Getting started

TODO:

### Defining a and manipulating a Substance document

TODO:

### Transactions

When you want to update a document, you should wrap all your changes in a transaction, so you don't end up in inconsistent in-between states. The API is fairly easy:

```js
doc.transaction(function(tx) {
  tx.delete("em2"); // deletes an emphasis annotation with id em2
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

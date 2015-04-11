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

## Rules that make your life easier:

- Content tools must bind to mousedown instead of click to handle toggling.
  That way we can prevent the blur event to be fired on the surface.

- The root element of a Substance Surface must be set contenteditable

# Substance - a Library for Content Manipulation

Substance has been developed as an Open-Source library over the last 6 years.
Starting being just a web-platform we turned into a library in first place, as this turned out to be of greater value for us. In one sentence, Substance as a library serves as a toolkit to create web-based content editing solutions.

## Programming Language

Substance is written in pure ECMAScript 5 using the CommonJS pattern for module dependencies. Programs using Substance can be executed under `node.js` out-of-the-box. Using a tool like `browserify` it is easy to bundle the same code for execution in a browser, fostering code reuse.

## Substance.Data

Being at the heart of Substance, `Substance.Data` is a data modeling and manipulation API. A data model can be described using plain objects, arrays, strings, and primitives such as numbers or dates.
This representation is essentially compatible with JSON, thus it is easy to use JSON databases such as MongoDB or Postgres as a persistence layer.

`Substance.Data` leverages a theory called [Operational Transformations](https://en.wikipedia.org/wiki/Operational_transformation) describing changes in a way that they can be replayed at a later time, and also be merged with other changes. This forms the foundation for concurrent editing scenarios: real-time collaboration but also simultaneous offline editing.

To hide the complexity of the OT theory, a simplified manipulation API is provided that consists of four basic manipulations:

- `create`: for creating a new node
- `delete`: for deleting a node
- `set`: for setting (i.e., overwriting) node values
- `update`: for changing node values (arrays and strings) incrementally

Leveraging operations, `Substance.Data` provides a means to create data-bindings, which are a key requirement for creating dynamic UIs. For example, it is possible to register to changes to the content of a paragraph, and whenever the paragraph changes the associated UI element is rerendered automatically.

## Substance.Document

`Substance.Document` forms an API dedicated to working with documents. A document essentially consists of a schema, that defines which nodes can be used, and it may infer the notion of a certain structure. For example, a scientific article has a title, an abstract, a body, and additional meta-information.

`Substance.Document` provides means to formulate complex manipulations, called `Transformations`. For example, editing the text of a paragraph may involve updating the location of an attached comment. In fact, most manipulations consist of multiple primitive operations, such as inserting characters into a string value, updating the position of an annotation, etc.

Furthermore, it provides means for importing and exporting from and to other representations than JSON. HTML/XML is supported as a first class alternative.

## Substance.Editor

`Substance.Editor` provides essential building blocks to create web-based editors. It solves fundamental problems of mapping user input from the browser to the data model, and vice-versa.

It provides a Clipboard implementation which allows to copy-and-paste content from and to other applications, or just within the same document.

It is offering standard building blocks, such as for typical document content, such as paragraphs, lists, tables, etc., and provides an easy-to-embed HTML rich text widget.

## Summary

Substance is a library, as opposed to a framework, which is designed to be integrated into custom environments. It is light-weight as the full library is only about 200kB in size. It is extremely modular making it flexible and extensible to meet custom needs. It is not oppinionated regarding which persistence backend to use, which application framework or which rendering engine.

It provides the following features:

- server and client side execution
- simple data modeling
- extensible via custom data-schemas and node implementations
- customizable indexes
- compatibility with JSON data bases
- HTML/XML import export
- operation based manipulation
- basic concepts for implementing migrations
- data-bindings for UI development
- concepts for concurrent manipulations (collaborative editing)
- basic concepts for versioning (incremental model changes)
- building blocks for creating web-based editors

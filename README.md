# Substance

Substance is a web-based technology stack for collaborative document manipulation. Substance releases all building blocks as Open Source under an MIT license, so you can glue them together for your usecase.

# Getting started

We've prepared a sandbox where you can play around with our editor and run the tests. It's meant to be a starting point for creating your very-own Substance application.

Installation is easy:

1. Clone the repository

   ```bash
   $ git clone https://github.com/substance/substance.git
   ```
   
2. Run our update script

   ```bash
   $ cd substance
   $ npm install
   ```
   
3. Finally start the server and point your browser to `http://localhost:3000`

   ```bash
   $ npm start
   ```

Currently the following modules are available:

- [Substance.Data](http://github.com/substance/data) - A uniform interface to domain data that supports versioning, persistence and replication
- [Substance.Document](http://github.com/substance/document) - A feature-rich and well-tested document model and manipulation API
- [Substance.Surface](http://github.com/substance/surface) - A boilerplate for web-based text editors
- [Substance.Chronicle](http://github.com/substance/chronicle) - A git inspired versioning API based on Operational Transformations (OT)
- [Substance.Operator](http://github.com/substance/operator) - Operational Transformation for strings, arrays and objects.
- [Substance.Library](http://github.com/substance/library) - Filing Substance documents
- [Substance.Store](http://github.com/substance/store) - Document storage layer

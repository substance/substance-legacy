Substance
================================================================================

Substance is a data-driven realtime document authoring tool based on the [Data.Graph](http://github.com/michael/data) data format. Be aware this is demo-ware for the moment. However, our final mission is to create a free and independent information sharing platform, available to everyone.


Motivation
--------------------------------------------------------------------------------

* Information wants to be free
* Reading should be distraction-free (no noise like blinking ads etc.)
* Favor Semantic editing, since writing is about content, not formatting
* Allow realtime participation of collaborators


**And that's how it looks like (at least atm):**

The Substance Writer:

![Screenshot](http://ma.zive.at/substance_writer.png)

The Substance Reader:

![Screenshot](http://ma.zive.at/substance_reader.png)


Documents are composed of Content Nodes of various types. The Javascript-based editor takes a `Data.Graph` and picks a Document Node, which is associated with number of child nodes (Section, Text, Image, etc.). Document manipulation happens in memory, changes made are rendered dynamically. The user can immediately read and navigate the whole document. Everything is at one page. Every content node can be modified by clicking on it. A content node editor gets activated and the node's properties can be edited. The changes made are reflected in realtime. Users see the results as they type. Collaborators can join an editing session and participate in realtime too. This is made possible through the usage of WebSockets.


Demo
--------------------------------------------------------------------------------

You've got two options to try out the most recent work-in-progress version:

* [Edit Documents](http://edge.substance.io/writer) (a.k.a. The Writer)
* [Browse Documents](http://edge.substance.io) (a.k.a. The Reader)


Based on the Data.Graph format
--------------------------------------------------------------------------------

A Data.Graph, offered by [Data.js](http://github.com/michael/data), can be used for representing arbitrary complex object graphs. Relations between objects are expressed through links that point to referred objects. This special data format is the main building block of Substance. It introduces a dynamic type system, through special `Data.Type` nodes that hold all related meta-information and can be manipulated during run-time. The Data.Graph format is highly inspired by the [Metaweb Object Model](http://www.freebase.com/docs/mql/ch02.html) that is used at Freebase.com. So if you're familiar with Freebase and MQL, you should have already gotten the basic idea.

The JSON representation of an exemplified Data.Graph (containing the schema information and one document, with ass) looks like this:

<pre>
<code>

var serializedGraph = {
  
  // Data.Types (Schema)
  // --------------------
  
  "/type/document": {
    "type": "/type/type",
    "name": "Document",
    "properties": {
      "name": {
        "name": "Internal name",
        "unique": true,
        "type": "string",
        "required": true
      },
      "title": {
        "name": "Document Title",
        "unique": true,
        "type": "string",
        "default": "Untitled"
      },
      "creator": {
        "name": "Creator",
        "unique": true,
        "type": "/type/user",
        "required": true
      },
      "children": {
        "name": "Sections",
        "unique": false,
        "type": "/type/section",
        "default": []
      }
    }
  },
  
  "type/section/": {
    "type": "/type/type",
    "name": "Section",
    "properties": {
      "name": {
        "name": "Name",
        "unique": true,
        "type": "string",
        "default": "A new header"
      },
      "children": {
        "name": "Children",
        "unique": false,
        "type": ["/type/text", "/type/image", "/type/quote"],
        "default": []
      }
    }
  },
  
  "/type/text": {
    "type": "/type/type",
    "name": "Text",
    "properties": {
      "content": {
        "name": "Content",
        "unique": true,
        "type": "string",
        "default": "Some text ..."
      }
    }
  },
  
  
  // Data.Objects
  // --------------------
  
  "/document/demo/828812e890a1ebc6030bb7c51b3c53cd": {
    "type": "/type/document",
    "name": "demo_doc",
    "title": "Demo",
    "creator": "/user/demo",
    "children": ["/section/efd36d3ccf4f77e735f600a3ba39f803"],
    "created_at": "2010-12-31T17:11:22.515Z"
  },
  
  "/section/efd36d3ccf4f77e735f600a3ba39f803": {
    "type": "/type/section",
    "name": "First chapter",
    "children": ["/text/401db968c89917957f12afaf75bfb579"]
  },
  
  "/text/401db968c89917957f12afaf75bfb579": {
    "type": "/type/section",
    "content": "Hello world"
  }
}

</code>
</pre>

Nodes live in a flat map, while associated nodes are referenced using their id.


Storage
--------------------------------------------------------------------------------

Since documents are serialized as simple JSON it makes perfectly sense to store
them in a JSON based document store, such as CouchDB. The whole process is as
simple as storing the current serialized Data.Graph as a number CouchDB documents,
where each document corresponds to a Node in the graph.
Multiple saves result in multiple document revisions (a CouchDB feature) which
means we get document versioning for free. [Data.js](http://github.com/michael/data) takes care of all persistence related concerns.



Extensibility
--------------------------------------------------------------------------------

Since you can store arbitrary data within a ContentNode, you're encouraged to implement your own NodeTypes, when needed. Additional NodeType implementations that are not part of the main distribution can be developed and embedded as seperate plug-ins. An additional NodeType could be a Vimeo-Video Nodetype or a Github Gist-Nodetype for example.


Usage scenarios
--------------------------------------------------------------------------------

**Story authoring**

This is particularly useful for journalists who can publish and edit their stories in a fully web-based environment. Such online documents can be enriched by embedding interactive content, such as visualizations. I'm currently working on HTML5 based visualizations (http://dejavis.org) that will be available as ContentNode types in the future.

**Software Documentation**

You could use Substance to create and maintain software documentation (right in the browser). Well, it
may not be the best fit for API docs, but for any kind of Readme or Tutorial. Embedding code snippet's would be done through a special Code-NodeType.
  
**Documents as a service**

A Substance server instance exposes an API for retrieving documents either as data or as pre-rendered HTML, if you don't want to implement your own renderer. That enables you to embed documents in your web application. You could use Substance as a blogging engine. In such a case one document would correspond to one blog entry. You'd embed your document-stream like you'd embed a twitter feed. Pretty much straight forward. :)

**Visual Content Navigation**

Since a client consumes data rather then a rendered output (like HTML), lots of interesting things can be done using this data that contains all the knowledge about the documents structure. Visualizing the structure of a document in real-time could help during authoring and viewing a document. Not least it's visually appealing. ;-)




Roadmap
--------------------------------------------------------------------------------

1. Implement most important ContentNode types (like lists, images, videos, tables)
2. Create an appealing UI. The interface will be minimalistic, adding as little noise as possible. Authors should be able to focus on writing while readers should focus on reading.
3. <strike>Add support for realtime collaborative editing by synchronizing updated content-nodes between all clients that are editing the same doc at the same time (probably through Web-Sockets).</strike>
4. Introduce references, which are special content nodes that can be used to build a bibliography (cmp. BibTeX)
5. Implement a LaTeX renderer (this allows at any time the download of a snapshot as a pretty formatted PDF, ready to be printed).


Actually, the system aims to be an alternative to editing documents in LaTeX or Word. Since DocumentGraphs contain all the information necessary to be rendered as LaTeX markup you wouldn't need to write LaTeX. You can edit and share your documents online and update them at any time. 

Substance is being designed to work in a decentralized scenario where many Substance nodes exist on the web. Registered Substance nodes could then be aggregated and indexed to allow users to search and navigate among all registered substance-documents.


The current implementation is at an early state (roughly 3 month of coding work). However, I really want to push this forward, in addition to Unveil.js, a browser-based visualization toolkit. Any form of contribution is highly appreciated! :)



Installation
--------------------------------------------------------------------------------


**Prerequisites**

* Node.js >= 0.3
* CoffeeScript >= 0.9.6
* An empty CouchDB database (either locally or remote)
* Couchapp (install with: `$ easy_install couchapp`)


**Steps**

1. Clone the repository
2. Setup config.json (you can use config.json.example as a template)

   Fill in CouchDB Host, Port, and Database

3. Install Libraries

   `npm install underscore express dnode couch-client`
4. Seed the DB

  `$ node db/seed.js`
5. Start the server
  
   `$ node server.js`

6. Navigate to: `http://localhost:3003`


Updates
--------------------------------------------------------------------------------

**30th December 2010**

Migrated to Data.Graph based persistence for the whole system.

**11th December 2010**

Added a Visual Document Outline, and a whole bunch of new styles.

**7th December 2010**

Integrated [Proper](http://github.com/michael/proper), a Semantic Rich Text Editor.

**27th November 2010**

Added a first version of the Substance front-end. Documents can be browsed by various attributes using faceted navigation. The results are calculated on the client-side, so filtering operations should perform blazin' fast. :) In order to accomplish this, some data manipulation magic is used. I've made the corresponding code available as a separate library, [Data.js](http://github.com/michael/data).

**16th November 2010**

Added basic support for realtime collaborative editing. For now all parties need to open a persisted document, then start editing. If another party arrives at a later point in time, real-time changes are not visible to him (to be fixed...)


Contributors (so far)
--------------------------------------------------------------------------------

* Samo Korošec (User Interface)
* Gerald Stangl (Think Tank)

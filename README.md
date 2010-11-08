Substance
================================================================================

Substance is a data-driven document authoring tool based on the ContentGraph 
document format.

![Screenshot](http://ma.zive.at/substance.png)

Documents are created by adding and editing `ContentNodes` of various types. A Javascript-based editor takes
a `ContentGraph` as JSON, and holds an internal memory representation of the current document (respectively the arrangement of `ContentNodes`). This memory representation is rendered dynamically. The user can immediately read and navigate the whole document. Everything is at one page. Every ContentNode can be modified by clicking on it. A ContentNode editor pane gets activated and the node's properties can be edited. The changes made are reflected in realtime. Users see the results as they type.


ContentGraph
--------------------------------------------------------------------------------

A ContentGraph is a fundamentally different content representation format expressed as JSON. It makes only a few assumptions on the structure of a document and is meant to be used as an engine to build applications (like Substance) on top of it. A ContentGraph consists of a number of ContentNodes that are hierarchically organized. Since the basic data-structure is a graph, ContentNodes can be referred multiple times, but there are no cycles allowed. ContentNodes must have a type property (e.g. type="section" or type="image") and arbitrary many additional properties that describe the contents of a certain node with respect to its type. There are no limitations on how you store data within that nodes.


The JSON representation of a simple ContentGraph looks as follows:

<pre>
<code>
  {
    "title": "Untitled",
    "author": "John Doe",
    "children": ["1", "2"],
    "nodeCount": 4,
    "nodes": {
      "1": {
        "type": "section",
        "name": "First Chapter",
        "children": ["3"]
      },
      "2": {
        "type": "section",
        "name": "Second Chapter",
        "children": ["4"]
      },
      "3": {
        "type": "paragraph",
        "content": "Your text goes here."
      },
      "4": {
        "type": "image",
        "url": "http://tmp.vivian.transloadit.com/scratch/9a65045a69dd88c2baf281c28dbd15a7"
      }
    }
  };
</code>
</pre>

The ContentNodes are registered in a flat map. However child nodes are referenced using their id. As already discussed cyclic graphs are not valid.


Storage
--------------------------------------------------------------------------------

Since documents are serialized as simple JSON it makes perfectly sense to store
them in a JSON based document store, such as CouchDB. The whole process is as
simple as storing the current serialized ContentGraph as a CouchDB document.
Multiple saves result in multiple document revisions (a CouchDB feature) which
means we get document versioning for free. A CouchDB database functions as a
document repository containing arbitrary many documents. You'll eventually be able to manage
multiple document repositories within the same editor instance. 




Extensibility
--------------------------------------------------------------------------------

Since you can store arbitrary data within a ContentNode, you're encouraged to implement your own NodeTypes, when needed. Additional NodeType implementations that are not part of the main distribution can be developed and embedded as seperate plug-ins. An additional NodeType could be a Vimeo-Video Nodetype or a Github Gist-Nodetype for example.


Usage scenarios
--------------------------------------------------------------------------------

**Story authoring**

This is particularly useful for journalists who can publish and edit their stories in a fully web-based environment. Such online documents can be enriched by embedding interactive content, such as visualizations. I'm currently working on HTML5 based visualizations (http://dejavis.org) that will be available as ContentNode types in the future.

**Software Documentation**

You could use Substance to create and maintain the documentation for your software library. Well, it
may not be the best fit for API docs, but for any kind of Readme or Tutorial. Embedding code snippet's would be done through a special Code-NodeType.
  
**Documents as a service**

A Substance server instance exposes an API for retrieving documents either as data or as pre-rendered HTML, if you don't want to implement your own renderer. That enables you to embed documents in your web application. You could use Substance as a blogging engine. In such a case one document would correspond to one blog entry. You'd embed your document-stream like you'd embed a twitter feed. Pretty much straight forward. :)

**Visual Content Navigation**

Since a client consumes data rather then a rendered output (like HTML), lots of interesting things can be done using this data that contains all the knowledge about the documents structure. Visualizing the structure of a document in real-time could help during authoring and viewing a document. Not least it's visually appealing. ;-)


Roadmap
--------------------------------------------------------------------------------

1. Implement most important ContentNode types (like lists, images, videos, tables)
2. Create an appealing UI. The interface will be minimalistic, adding as little noise as possible. Authors should be able to focus on writing while readers should focus on reading.
3. Introduce references, which are special content nodes, that can be used to build a bibliography (cmp. BibTeX)
4. Implement a LaTeX renderer (this allows at any time the download of a snapshot as a pretty formatted PDF, ready to be printed).


Actually, the system aims to be an alternative to editing documents in LaTeX or Word. Since DocumentGraphs contain all the information necessary to be rendered as LaTeX markup you wouldn't need to write Latex. You can edit and share your documents online and update them at any time. 

Substance is being designed to work in a decentralized scenario where many
substance-nodes exist on the web. Registered Substance nodes could then be aggregated and indexed
to allow users to search and navigate among all registered substance-documents.


The current implementation is at an early state (roughly 2 weeks of coding work). 
However, I really want to push this forward, in addition to Unveil.js, a browser-based visualization toolkit. Any form of contribution is highly appreciated! :)


Installation
--------------------------------------------------------------------------------

Detailed installation instructions will be added soon. 

However, to setup your own Substance instance you'll need Node.js (>=0.3) installed and a CouchDB database if you want to host your own document repository. That's all basically. Actually, most stuff is done on the client side through regular Javascript. The Node.js server just functions as a proxy to the CouchDB database and exposes a clean API.


Contributors (so far)
--------------------------------------------------------------------------------

* Samo Korošec (User Interface)
* Gerald Stangl (Think Tank)


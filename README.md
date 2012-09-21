# Substance

Substance is a fully web-based document authoring and publishing platform.

# Collaboration

Since collaboration is more imporantant than ever before in order to create high quality content, Substance not only supports comments, but also the concept of patches to turn every reader into a potential collaborator.

## Add a comment

Comments can be added very easily by opening the comment tool. They are listed chronologically and turn the document into an active discussion. Every comment can refer to a certain part of the document. Your comment automatically belongs to your current node and text selection. If there's no selection, the comment just sticks on the document itself.

![Composer](https://raw.github.com/substance/composer/gh-pages/assets/layered-navigation.png)

## Submit a patch

Submitting a patch is easy. As a reader, you can always point your cursor to the text and cheerfully start modifying the document. Once you do that, the composer automatically switches over to the **recording patch** mode. From now on every change (=operation) will be recorded. Once you're done, you have to confirm by hitting the **Submit Patch** button.

![Composer](https://raw.github.com/substance/composer/gh-pages/assets/composer-patch.png)


## Apply (merge in) a patch

In many cases patches can be applied automatically. But sometimes user interaction might be necessary to resolve conflicting changes that can occur between diverging branches. We propose a semi-automatic resolve strategy that lets the user review every atomic operation that is contained in the patch. He can either accept, reject or manually adjust undecidable operations in order to get merged into the master branch.

![Composer](https://raw.github.com/substance/composer/gh-pages/assets/composer-merge.png)

# Extensibility

It's easy for developers to add their own node types. We'll provide a tutorial on this as soon as possible.

# Operations

Documents are manipulated using operations, which are represented as JSON. By keeping track of atomic document operations, the complete history can be replayed and allows users to go back and forth in time. You can either use the web-based editor for manipulating documents, or do it programmatically using the API. See the [Document](http://github.com/substance/document) module for more information about the Substance Document Manipulation Protocol.


## Nodes

Commands for inserting, updating, moving and deleting content nodes. A `Substance.Node` is an abstract interface for concrete elements that can be placed on the document. Those can be:

- Text
- Section
- Image
- Table
- Map
- Video
- etc.

You can create your own as well. But you have to make sure they support the Node interface.

## Install

```
git clone git@github.com:substance/substance.git
npm install
node server.js
```


# Build native OSX Application

```
mkdir build
cd build
cmake ..
make
```

## Enable Webkit Inspektor

```
defaults write quasipartikel.substance.Substance WebKitDeveloperExtras -bool true
```
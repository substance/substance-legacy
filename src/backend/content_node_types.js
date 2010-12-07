// Register ContentNode types (including meta information).

ContentNode.types = {
  "document": {
    name: "Document",
    allowedChildren: ["section"],
    properties: [
      {
        "key": "title",
        "name": "Title",
        "defaultValue": "A document title"
      }
    ]
  },
  "section": {
    name: "Section",
    allowedChildren: ["text", "image"],
    properties: [
      {
        "key": "name",
        "name": "Section name",
        "defaultValue": "Hooray I'm a new section "
      }
    ]
  },
  "text": {
    name: "Text",
    allowedChildren: [],
    properties: [
      {
        "key": "content",
        "name": "Content",
        "defaultValue": "Hooray I'm a newborn text node."
      }
    ]
  },
  "image": {
    name: "Image",
    allowedChildren: [],
    properties: [
      {
        "key": "url",
        "name": "Image URL",
        "defaultValue": null
      }
    ]
  }
};

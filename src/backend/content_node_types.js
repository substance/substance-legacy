// Register ContentNode types (including meta information).

ContentNode.types = {
  "/type/document": {
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
  "/type/section": {
    name: "Section",
    allowedChildren: ["text", "image"],
    properties: [
      {
        "key": "name",
        "name": "Section name",
        "defaultValue": "Hi, I'm a new section "
      }
    ]
  },
  "/type/text": {
    name: "Text",
    allowedChildren: [],
    properties: [
      {
        "key": "content",
        "name": "Content",
        "defaultValue": "Hi, I'm a another text node."
      }
    ]
  },
  "/type/image": {
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

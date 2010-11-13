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
    allowedChildren: ["paragraph", "image"],
    properties: [
      {
        "key": "name",
        "name": "Section name",
        "defaultValue": "Hooray I'm a new section "
      }
    ]
  },
  "paragraph": {
    name: "Paragraph",
    allowedChildren: [],
    properties: [
      {
        "key": "content",
        "name": "Content",
        "defaultValue": "Hooray I'm a newborn paragraph."
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
  },
  "text": {
    name: "Text",
    allowedChildren: [],
    properties: [
      {
        "key": "content",
        "name": "Content",
        "defaultValue": "Hurray, I'm a new node"
      },
      {
        "key": "em_level",
        "name": "Emphasis level",
        "defaultValue": "0"
      }
    ]
  }
};
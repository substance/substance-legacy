// Register ContentNode types (including meta information).

ContentNode.types = {
  "section": {
    name: "Section",
    allowedChildren: ["paragraph"],
    properties: [
      {
        "key": "name",
        "name": "Section name",
        "defaultValue": ""
      }
    ]
  },
  "paragraph": {
    name: "Paragraph",
    allowedChildren: ["text", "image"],
    properties: [
      
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
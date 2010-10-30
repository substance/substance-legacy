// Register ContentNode types (including meta information).

ContentNode.types = {
  "section": {
    name: "Section",
    allowedChildren: ["paragraph"],
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
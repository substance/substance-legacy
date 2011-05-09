// Collection of functions operating on content nodes
var ContentNode = {
  getTeaser: function(node) {
    if (node.type.key === "/type/section")
      return node.get('name') ? node.get('name').trim().substring(0, 15)+" ..." : "Section";      
    else if (node.type.key === "/type/text")
      return _.stripTags(node.get('content')).trim().substring(0, 15)+" ...";
    else if (node.type.key === "/type/image")
      return "Image";
    else if (node.type.key === "/type/resource")
      return "Resource";
    else if (node.type.key === "/type/quote")
      return "Quote";
    else if (node.type.key === "/type/code")
      return "Code";  
    return "N/A"
  }
}
function(doc) { 
  if (doc.type && doc.type.indexOf('/type/publication')>=0) { 
    emit([doc.network], 1); 
  }
}
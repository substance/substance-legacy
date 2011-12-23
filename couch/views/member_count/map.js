function(doc) { 
  if (doc.type && doc.type.indexOf('/type/membership')>=0) { 
    emit([doc.network], 1); 
  }
}
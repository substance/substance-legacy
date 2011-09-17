function(doc) { 
  if (doc.type.indexOf('/type/version') >= 0) { 
    emit(doc.created_at, doc.document);
  }
}
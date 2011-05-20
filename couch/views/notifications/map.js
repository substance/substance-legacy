function(doc) {
  if (doc.type.indexOf("/type/notification") >= 0) {
    
    emit([doc.recipient, doc.created_at], doc);
    // emit(doc.username.toLowerCase(), doc);
    // emit(doc.name, doc);
  }
}
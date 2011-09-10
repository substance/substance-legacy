function(doc) {
  if (doc.type.indexOf("/type/version") >= 0) {
    emit([doc.document, doc.created_at], doc);
  }
}
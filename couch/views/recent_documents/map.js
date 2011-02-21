function(doc) {
  if (doc.type.indexOf("/type/document") >= 0 && doc.published_on) {
    emit(doc.updated_at, doc);
  }
}
function(doc) {
  if (doc.type.indexOf("/type/document") >= 0) {
    emit(doc.title, doc);
    emit(doc.name, doc);
  }
}
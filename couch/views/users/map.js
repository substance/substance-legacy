function(doc) {
  if (doc.type.indexOf("/type/user") >= 0) {
    emit(doc.username, doc);
    emit(doc.name, doc);
  }
}
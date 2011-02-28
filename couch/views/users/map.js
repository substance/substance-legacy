function(doc) {
  if (doc.type.indexOf("/type/user") >= 0) {
    emit(doc.username.toLowerCase(), doc);
    emit(doc.name, doc);
  }
}
function(doc) {
  if (doc.type.indexOf("/type/attribute") >= 0) {
    emit(doc.member_of, doc);
  }
}
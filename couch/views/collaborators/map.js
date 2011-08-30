function(doc) {
  if (doc.type.indexOf("/type/collaborator") >= 0 && doc.user) {
    emit([doc.user, doc.document], doc);
  }
}
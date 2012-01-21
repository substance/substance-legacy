function (doc) {
  if (doc.type.indexOf('/type/network') >= 0) { 
    emit(doc.updated_at, doc._id);
  }
}
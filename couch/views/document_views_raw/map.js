function(doc) {
  if (doc.type.indexOf("/type/event") >= 0 && doc.event_type == 'view-document') {
    emit(doc._id, doc._rev);
  }
}
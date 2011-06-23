function(doc) {
  if (doc.type.indexOf("/type/event") >= 0 && doc.event_type == 'view-document') {
    var d = new Date(doc.created_at);
    emit([doc.object, d.getFullYear(), d.getMonth(), d.getDay()], 1);
  }
}
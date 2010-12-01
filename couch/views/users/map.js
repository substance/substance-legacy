function(doc) {
  if (doc.type == 'user') {
    // emits username as the key
    emit(doc._id.split(':')[1], doc);
  }
}
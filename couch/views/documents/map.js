function(doc) {
  if (doc.type === "document") {
    emit(doc._id, {
      id: doc._id,
      name: doc.name,
      title: doc.contents.title,
      attributes: doc.contents.attributes,
      author: doc.author
    });
  }
}
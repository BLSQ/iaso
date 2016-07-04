function(doc) {
  if (doc.dateCreated) {
    emit(doc.dateCreated);
  }
};
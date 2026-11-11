const documents = new Map();

function save(document) {
  documents.set(document.id, document);
}

function findById(id) {
  return documents.get(id);
}

function listByOwner(owner) {
  return [...documents.values()]
    .filter((document) => document.owner === owner)
    .sort((left, right) => right.uploadedAt.localeCompare(left.uploadedAt)
      || left.id.localeCompare(right.id));
}

module.exports = { save, findById, listByOwner };
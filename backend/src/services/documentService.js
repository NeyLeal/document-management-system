const fs = require('node:fs/promises');
const crypto = require('node:crypto');
const documentRepository = require('../repositories/documentRepository');

class DocumentServiceError extends Error {
  constructor(code) {
    super(code);
    this.code = code;
  }
}

function toPublicDocument(document) {
  return {
    id: document.id,
    originalName: document.originalName,
    size: document.size,
    uploadedAt: document.uploadedAt,
    owner: document.owner,
    mimeType: document.mimeType,
  };
}

async function createDocument(file, owner) {
  if (!file) {
    throw new DocumentServiceError('FILE_REQUIRED');
  }

  const document = {
    id: crypto.randomUUID(),
    originalName: file.originalname,
    size: file.size,
    uploadedAt: new Date().toISOString(),
    owner,
    mimeType: file.mimetype || 'application/octet-stream',
    storageName: file.filename,
    filePath: file.path,
  };

  try {
    documentRepository.save(document);
    return toPublicDocument(document);
  } catch (error) {
    await fs.unlink(file.path).catch(() => {});
    throw new DocumentServiceError('STORAGE_ERROR');
  }
}

function listDocuments(owner) {
  return documentRepository.listByOwner(owner).map(toPublicDocument);
}

function getDocumentForDownload(id, owner) {
  const document = documentRepository.findById(id);

  if (!document || document.owner !== owner) {
    throw new DocumentServiceError('DOCUMENT_NOT_FOUND');
  }

  return {
    filePath: document.filePath,
    originalName: document.originalName,
    mimeType: document.mimeType,
  };
}

module.exports = { createDocument, listDocuments, getDocumentForDownload };
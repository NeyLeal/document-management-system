const documentService = require('../services/documentService');

function getOwner(req) {
  return req.user?.id || process.env.DEFAULT_OWNER_ID || 'default';
}

async function upload(req, res, next) {
  try {
    const document = await documentService.createDocument(req.file, getOwner(req));
    return res.status(201).json(document);
  } catch (error) {
    return next(error);
  }
}

async function list(req, res, next) {
  try {
    const documents = documentService.listDocuments(getOwner(req));
    return res.status(200).json({ documents });
  } catch (error) {
    return next(error);
  }
}

async function download(req, res, next) {
  try {
    const document = documentService.getDocumentForDownload(req.params.id, getOwner(req));
    return res.download(document.filePath, document.originalName, {
      headers: { 'Content-Type': document.mimeType || 'application/octet-stream' },
    }, (error) => {
      if (error) {
        next(error);
      }
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = { upload, list, download };
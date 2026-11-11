const API_PREFIX = '/api';

async function ensureSuccess(response) {
  if (response.ok) return response;

  let message = 'Não foi possível concluir a operação.';
  try {
    const payload = await response.json();
    message = payload.error?.message || message;
  } catch {
    // Respostas sem JSON usam a mensagem padrão.
  }

  throw new Error(message);
}

export async function listDocuments() {
  const response = await ensureSuccess(await fetch(`${API_PREFIX}/documents`));
  const payload = await response.json();
  return payload.documents;
}

export async function uploadDocument(file) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await ensureSuccess(await fetch(`${API_PREFIX}/upload`, {
    method: 'POST',
    body: formData,
  }));

  return response.json();
}

export async function downloadDocument(document) {
  const response = await ensureSuccess(await fetch(
    `${API_PREFIX}/documents/${encodeURIComponent(document.id)}/download`,
  ));
  const file = await response.blob();
  const objectUrl = URL.createObjectURL(file);
  const link = window.document.createElement('a');
  link.href = objectUrl;
  link.download = document.originalName;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
}
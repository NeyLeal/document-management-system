const { after, before, test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const storageDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'dms-test-'));
process.env.STORAGE_DIR = storageDirectory;
process.env.MAX_FILE_SIZE_BYTES = '1024';

const app = require('../src/app');
let server;
let baseUrl;

before(async () => {
  server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
  fs.rmSync(storageDirectory, { recursive: true, force: true });
});

// Teste de fumaça do seed: garante que o app Express foi exportado.
// Novos testes serão adicionados durante os Steps 2, 6 e 7 com auxílio do Copilot.
test('o app backend é exportado', () => {
  assert.ok(app, 'o app deve estar definido');
  assert.strictEqual(typeof app, 'function', 'o app Express deve ser uma função');
});

test('faz upload, lista e baixa um documento', async () => {
  const form = new FormData();
  form.append('file', new Blob(['hello'], { type: 'text/plain' }), 'hello.txt');

  const uploadResponse = await fetch(`${baseUrl}/upload`, { method: 'POST', body: form });
  assert.strictEqual(uploadResponse.status, 201);
  const uploadedDocument = await uploadResponse.json();
  assert.strictEqual(uploadedDocument.originalName, 'hello.txt');
  assert.strictEqual(uploadedDocument.size, 5);
  assert.strictEqual(uploadedDocument.owner, 'default');
  assert.ok(uploadedDocument.id);
  assert.ok(uploadedDocument.uploadedAt);
  assert.strictEqual('filePath' in uploadedDocument, false);
  assert.strictEqual('storageName' in uploadedDocument, false);

  const listResponse = await fetch(`${baseUrl}/documents`);
  assert.strictEqual(listResponse.status, 200);
  const list = await listResponse.json();
  assert.deepStrictEqual(list.documents.map((document) => document.id), [uploadedDocument.id]);

  const downloadResponse = await fetch(`${baseUrl}/documents/${uploadedDocument.id}/download`);
  assert.strictEqual(downloadResponse.status, 200);
  assert.match(downloadResponse.headers.get('content-disposition'), /hello\.txt/);
  assert.strictEqual(await downloadResponse.text(), 'hello');
});

test('retorna erros para upload inválido, arquivo acima do limite e documento inexistente', async () => {
  const missingFileResponse = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{}',
  });
  assert.strictEqual(missingFileResponse.status, 400);

  const largeFileForm = new FormData();
  largeFileForm.append('file', new Blob(['x'.repeat(1025)]), 'large.txt');
  const largeFileResponse = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    body: largeFileForm,
  });
  assert.strictEqual(largeFileResponse.status, 413);

  const missingDocumentResponse = await fetch(`${baseUrl}/documents/missing-id/download`);
  assert.strictEqual(missingDocumentResponse.status, 404);
});

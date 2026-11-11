import { useEffect, useState } from 'react';
import DocumentList from './components/DocumentList.jsx';
import UploadComponent from './components/UploadComponent.jsx';
import { downloadDocument, listDocuments, uploadDocument } from './services/documentApi.js';
import './App.css';

export default function App() {
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [actionMessage, setActionMessage] = useState('');

  async function refreshDocuments() {
    setIsLoading(true);
    setLoadError('');

    try {
      setDocuments(await listDocuments());
    } catch (error) {
      setLoadError(error.message);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    refreshDocuments();
  }, []);

  async function handleUpload(file) {
    setIsUploading(true);
    setActionMessage('');

    try {
      await uploadDocument(file);
      await refreshDocuments();
      setActionMessage('Documento enviado com sucesso.');
      return true;
    } catch (error) {
      setActionMessage(error.message);
      return false;
    } finally {
      setIsUploading(false);
    }
  }

  async function handleDownload(document) {
    setDownloadingId(document.id);
    setActionMessage('');

    try {
      await downloadDocument(document);
    } catch (error) {
      setActionMessage(error.message);
    } finally {
      setDownloadingId(null);
    }
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="/" aria-label="DMS, início">
          <span className="brand-mark" aria-hidden="true">D</span>
          <span>Documentos</span>
        </a>
        <span className="topbar-caption">ESPAÇO DE ARQUIVOS</span>
      </header>

      <div className="workspace">
        <section className="page-heading" aria-labelledby="page-title">
          <p className="eyebrow">BIBLIOTECA PESSOAL</p>
          <h1 id="page-title">Seus documentos</h1>
          <p className="page-description">Envie e acesse seus arquivos em um só lugar.</p>
        </section>

        <section className="upload-section" aria-labelledby="upload-title">
          <div className="section-heading">
            <div>
              <p className="eyebrow">ADICIONAR</p>
              <h2 id="upload-title">Enviar documento</h2>
            </div>
            <span className="section-index">01</span>
          </div>
          <UploadComponent onUpload={handleUpload} isUploading={isUploading} />
        </section>

        <section className="documents-section" aria-labelledby="documents-title">
          <div className="section-heading document-heading">
            <div>
              <p className="eyebrow">ARQUIVOS SALVOS</p>
              <h2 id="documents-title">Documentos</h2>
            </div>
            <div className="list-tools">
              <span className="document-count" aria-live="polite">
                {isLoading ? 'Atualizando' : `${documents.length} ${documents.length === 1 ? 'arquivo' : 'arquivos'}`}
              </span>
              <button className="refresh-button" type="button" onClick={refreshDocuments} disabled={isLoading}>
                Atualizar
              </button>
            </div>
          </div>

          {actionMessage && <p className="action-message" role="status">{actionMessage}</p>}
          <DocumentList
            documents={documents}
            isLoading={isLoading}
            error={loadError}
            downloadingId={downloadingId}
            onDownload={handleDownload}
            onRetry={refreshDocuments}
          />
        </section>
      </div>
    </main>
  );
}
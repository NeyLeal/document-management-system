import DownloadButton from './DownloadButton.jsx';

function formatDate(value) {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function formatFileSize(size) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export default function DocumentList({
  documents,
  isLoading,
  error,
  downloadingId,
  onDownload,
  onRetry,
}) {
  if (isLoading) {
    return <p className="list-state" role="status">Carregando documentos...</p>;
  }

  if (error) {
    return (
      <div className="list-state error-state" role="alert">
        <p>{error}</p>
        <button className="text-button" type="button" onClick={onRetry}>Tentar novamente</button>
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="list-state empty-state">
        <span className="empty-mark" aria-hidden="true">—</span>
        <p>Nenhum documento por aqui ainda.</p>
      </div>
    );
  }

  return (
    <div className="table-scroll">
      <table className="document-table">
        <thead>
          <tr>
            <th scope="col">Nome</th>
            <th scope="col">Tamanho</th>
            <th scope="col">Enviado em</th>
            <th scope="col"><span className="visually-hidden">Ações</span></th>
          </tr>
        </thead>
        <tbody>
          {documents.map((document) => (
            <tr key={document.id}>
              <td>
                <div className="document-name">
                  <span className="file-mark" aria-hidden="true">FILE</span>
                  <span className="file-name-text" title={document.originalName}>{document.originalName}</span>
                </div>
              </td>
              <td className="secondary-cell">{formatFileSize(document.size)}</td>
              <td className="secondary-cell">{formatDate(document.uploadedAt)}</td>
              <td className="action-cell">
                <DownloadButton
                  onClick={() => onDownload(document)}
                  isLoading={downloadingId === document.id}
                  disabled={Boolean(downloadingId)}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
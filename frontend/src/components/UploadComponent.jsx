import { useState } from 'react';

function formatFileSize(size) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export default function UploadComponent({ onUpload, isUploading }) {
  const [file, setFile] = useState(null);

  async function handleSubmit(event) {
    event.preventDefault();
    if (!file || isUploading) return;

    const uploaded = await onUpload(file);
    if (uploaded) setFile(null);
  }

  return (
    <form className="upload-form" onSubmit={handleSubmit}>
      <label className={`file-picker${file ? ' has-file' : ''}`}>
        <span className="file-picker-icon" aria-hidden="true">+</span>
        <span className="file-picker-copy">
          <strong>{file ? file.name : 'Escolha um arquivo'}</strong>
          <small>{file ? formatFileSize(file.size) : 'Selecione no seu dispositivo'}</small>
        </span>
        <span className="browse-label">Procurar</span>
        <input
          type="file"
          onChange={(event) => setFile(event.target.files?.[0] || null)}
          disabled={isUploading}
        />
      </label>
      <button className="primary-button" type="submit" disabled={!file || isUploading}>
        {isUploading ? 'Enviando...' : 'Enviar arquivo'}
      </button>
    </form>
  );
}
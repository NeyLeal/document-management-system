export default function DownloadButton({ onClick, isLoading, disabled }) {
  return (
    <button
      className="download-button"
      type="button"
      onClick={onClick}
      disabled={disabled || isLoading}
      aria-label={isLoading ? 'Baixando documento' : 'Baixar documento'}
      title="Baixar documento"
    >
      {isLoading ? 'Baixando...' : 'Baixar'}
    </button>
  );
}
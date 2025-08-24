import React from 'react';

export default function ErrorFallback({ error, resetErrorBoundary }) {
  return (
    <div role="alert" style={{ padding: 20, textAlign: 'center' }}>
      <h1>Oups, une erreur est survenue.</h1>
      <pre style={{ color: 'red' }}>{error.message}</pre>
      <button onClick={resetErrorBoundary} style={{ marginTop: 20, padding: '10px 20px' }}>
        Réessayer
      </button>
    </div>
  );
}

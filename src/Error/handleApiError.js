export function handleApiError(error, setError) {
  if (error.response) {
    // erreur retournée par le serveur
    setError(error.response.data.error || "Erreur serveur");
  } else if (error.request) {
    // pas de réponse du serveur
    setError("Aucune réponse du serveur");
  } else {
    // autre erreur
    setError(error.message);
  }
}

import { handleApiError } from "./handleApiError";

try {
  const res = await axios.get(`${apiBase}/solde/${uid}`);
  // ...
} catch (e) {
  handleApiError(e, setError);
}

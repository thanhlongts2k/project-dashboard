export function getAuthStorage() {
  const localToken = localStorage.getItem("token");
  if (localToken) {
    return {
      token: localToken,
      expiry: localStorage.getItem("token_expiry") || "",
      username: localStorage.getItem("username") || "",
      storage: localStorage,
    };
  }

  const sessionToken = sessionStorage.getItem("token");
  if (sessionToken) {
    return {
      token: sessionToken,
      expiry: sessionStorage.getItem("token_expiry") || "",
      username: sessionStorage.getItem("username") || "",
      storage: sessionStorage,
    };
  }

  return {
    token: "",
    expiry: "",
    username: "",
    storage: null,
  };
}

export function isTokenExpired(expiry) {
  if (!expiry) return false;

  const expiryTime = new Date(expiry).getTime();
  if (Number.isNaN(expiryTime)) return false;

  return Date.now() >= expiryTime;
}

export function clearAuth() {
  localStorage.removeItem("token");
  localStorage.removeItem("token_expiry");
  localStorage.removeItem("username");

  sessionStorage.removeItem("token");
  sessionStorage.removeItem("token_expiry");
  sessionStorage.removeItem("username");
}
export function getToken() {
  try {
    return localStorage.getItem("token");
  } catch {
    return null;
  }
}

export function setToken(token) {
  try {
    localStorage.setItem("token", token);
  } catch { /* storage unavailable */ }
}

export function getUser() {
  try {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setUser(user) {
  try {
    localStorage.setItem("user", JSON.stringify(user));
  } catch { /* storage unavailable */ }
}

export function logout() {
  try {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  } catch { /* storage unavailable */ }
}

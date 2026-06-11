export function getToken() {
  try {
    return localStorage.getItem("token");
  } catch (err) {
    return null;
  }
}

export function setToken(token) {
  try {
    localStorage.setItem("token", token);
  } catch (err) {}
}

export function getUser() {
  try {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  } catch (err) {
    return null;
  }
}

export function setUser(user) {
  try {
    localStorage.setItem("user", JSON.stringify(user));
  } catch (err) {}
}

export function logout() {
  try {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  } catch (err) {}
}

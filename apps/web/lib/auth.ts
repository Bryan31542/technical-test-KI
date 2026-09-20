const STORAGE_KEY = "panel-basic";

export function getBasicToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }
  return sessionStorage.getItem(STORAGE_KEY);
}

export function setBasicToken(user: string, password: string): string {
  const token = window.btoa(`${user}:${password}`);
  sessionStorage.setItem(STORAGE_KEY, token);
  return token;
}

export function clearBasicToken(): void {
  sessionStorage.removeItem(STORAGE_KEY);
}

export function isLoggedIn(): boolean {
  return getBasicToken() !== null;
}

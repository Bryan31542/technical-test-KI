import axios, { type AxiosInstance } from "axios";
import { clearBasicToken, getBasicToken } from "./auth";

export const api: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080",
  timeout: 10_000,
});

api.interceptors.request.use((config) => {
  const token = getBasicToken();
  if (token) {
    config.headers.Authorization = `Basic ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      axios.isAxiosError(error) &&
      error.response?.status === 401 &&
      typeof window !== "undefined" &&
      !window.location.pathname.startsWith("/login")
    ) {
      clearBasicToken();
      window.location.replace("/login");
    }
    return Promise.reject(error);
  },
);

export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    if (error.response?.status === 401) {
      return "Usuario o contraseña incorrectos.";
    }
    const message = error.response?.data?.message;
    if (typeof message === "string" && message.length > 0) {
      return message;
    }
    if (Array.isArray(message) && message.length > 0) {
      return message.join(", ");
    }
    if (error.code === "ERR_NETWORK") {
      return "No se pudo conectar con el API. ¿Está corriendo en el puerto 8080?";
    }
    return error.message;
  }

  return "Ocurrió un error inesperado.";
}

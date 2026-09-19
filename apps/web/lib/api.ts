import axios, { type AxiosInstance } from "axios";

export const api: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080",
  timeout: 10_000,
});

export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
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

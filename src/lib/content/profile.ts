export const COLORS = [
  "rojo", "azul", "verde", "amarillo", "naranja", "morado", "rosa", "negro", "blanco", "gris", "marrón", "turquesa",
] as const;

export const MONTHS = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
] as const;

export type ProfileField = {
  key: string;
  /** Texto del formulario de la ficha. */
  label: string;
  /** Nombre corto (para títulos). */
  short: string;
  /** Frase que completa «averigua …». */
  ask: string;
  options?: readonly string[];
};

/** Datos que cada jugador rellena y que otros tienen que sacarle hablando. */
export const PROFILE_FIELDS: readonly ProfileField[] = [
  { key: "color", label: "Tu color favorito", short: "color favorito", ask: "cuál es su color favorito", options: COLORS },
  { key: "ciudad", label: "Ciudad que sueñas con visitar", short: "ciudad soñada", ask: "qué ciudad del mundo sueña con visitar" },
  { key: "comida", label: "Tu comida favorita", short: "comida favorita", ask: "cuál es su comida favorita" },
  { key: "mascota", label: "Nombre de tu primera mascota (o tu animal favorito)", short: "mascota", ask: "cómo se llamaba su primera mascota (o cuál es su animal favorito)" },
  { key: "mes", label: "Mes de tu cumpleaños", short: "cumpleaños", ask: "en qué mes cumple años", options: MONTHS },
  { key: "pelicula", label: "Tu película favorita", short: "película favorita", ask: "cuál es su película favorita" },
];

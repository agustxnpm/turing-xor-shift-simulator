/**
 * Configuración del algoritmo XOR-Shift
 */
export interface ConfiguracionXorShift {
  /** Semilla inicial (cadena binaria) */
  semillaInicial: string;

  /** Cantidad de desplazamiento 'a' (shift left) */
  desplazamientoA: number;

  /** Cantidad de desplazamiento 'b' (shift right) */
  desplazamientoB: number;

  /** Cantidad de desplazamiento 'c' (shift left) */
  desplazamientoC: number;
}

/**
 * LAYOUT OPTIMIZADO NUEVO:
 *
 *   ..._____@<semilla>#<historial>$...$_____...
 *
 * Estructura:
 *  - Área izquierda (blancos infinitos): Espacio para cálculos temporales (shifts, XOR)
 *  - '@' : Separador único que marca inicio de semilla (fin de área de cálculos)
 *  - <semilla> : Semilla actual (se actualiza in-place, NO se desplaza)
 *  - '#' : Separador único que marca fin de semilla e inicio de historial
 *  - <historial> : Números generados separados por '$' (se agregan al final, sin desplazar)
 *  - '$' : Separador entre entradas del historial
 *  - Área derecha (blancos infinitos): Se expande automáticamente al agregar al historial
 *  - '_' : Blanco
 *
 * Ejemplos de evolución:
 *
 * 1) Inicial (sin historial):
 *      ..._____@110010#_____...
 *      Cabezal en primer bit de semilla (posición después de '@')
 *
 * 2) Después de agregar primer valor al historial:
 *      ..._____@110010#110010$_____...
 *
 * 3) Después de generar y agregar segundo valor (101101):
 *      ..._____@101101#110010$101101$_____...
 *      (semilla actualizada a 101101, historial contiene ambos valores)
 *
 * 4) Durante cálculos (ejemplo: shift + XOR en área izquierda):
 *      ..._0110100_1101000_1011100@101101#110010$101101$_____...
 *      (temps en izquierda se limpian después de cada iteración)
 *
 * VENTAJAS:
 * - NO requiere desplazar bloques grandes al agregar al historial
 * - Área de cálculos aislada a la izquierda (no interfiere con semilla/historial)
 * - Movimientos cortos y locales durante operaciones
 * - Detección de ciclos: traverse historial una vez por iteración
 * - Semilla en posición fija relativa (solo se actualiza contenido, no posición)
 */
export interface LayoutCinta {
  separadorInicio: string;    // '@' - Marca inicio de semilla
  separadorFin: string;       // '#' - Marca fin de semilla e inicio de historial
  separadorHistorial: string; // '$' - Separador entre entradas del historial
  blanco: string;             // '_' - Blanco
}

/** Constantes del layout optimizado */
export const SEP_INICIO    = '@';  // Inicio de semilla (fin de área de cálculos)
export const SEP_FIN       = '#';  // Fin de semilla (inicio de historial)
export const SEP_HISTORIAL = '$';  // Separador entre entradas del historial
export const BLANCO        = '_';  // Blanco



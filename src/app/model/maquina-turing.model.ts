/**
 * Representa el nombre de un estado.
 * Ejemplos: 'q0', 'q1', 'q_acepta', 'q_rechaza', 'q_copia'
 */
export type Estado = string;

/**
 * Representa un símbolo que puede aparecer en la cinta de la Máquina de Turing.
 * Ejemplos: '0', '1', '_' (vacio), 'a', 'b'
 */
export type SimboloCinta = string;

/**
 * Define las posibles direcciones de movimiento del cabezal de lectura/escritura.
 * - 'I': Mover a la izquierda
 * - 'D': Mover a la derecha 
 * - 'N': Permanecer en la posición actual (sin movimiento)
 */
export type MoverDireccion = 'I' | 'D' | 'N';

/**
 * Representa una única regla de transición de la Máquina de Turing.
 * Define qué hacer cuando el cabezal lee un símbolo en un estado específico.
 */
export interface Transicion {
  /** Estado al que debe transicionar la máquina */
  nuevoEstado: Estado;
  
  /** Símbolo que debe escribirse en la cinta en la posición actual */
  simboloEscribir: SimboloCinta;
  
  /** Dirección en la que debe moverse el cabezal después de escribir */
  moverDireccion: MoverDireccion;
}

/**
 * Conjunto completo de reglas de transición (función de transición δ).
 * Estructura: Map<Estado Actual, Map<Símbolo Leído, Transición>>
 * 
 * Permite buscar eficientemente la acción a realizar dado:
 * - El estado actual de la máquina
 * - El símbolo que se lee en la posición actual de la cinta
 * 
 * Ejemplo de uso:
 * const transition = funcionTransicion.get('q0')?.get('1');
 * if (transition) {
 *   // Aplicar la transición
 * }
 */
export type FuncionTransicion = Map<Estado, Map<SimboloCinta, Transicion>>;

/**
 * Representa la cinta infinita de la Máquina de Turing.
 * La cinta se implementa como un arreglo dinámico que puede crecer según sea necesario.
 */
export interface Cinta {
  /** Arreglo de símbolos en la cinta. Se expande automáticamente si es necesario */
  simbolos: SimboloCinta[];
  
  /** Posición actual del cabezal de lectura/escritura (índice en el arreglo) */
  posicionCabezal: number;
}

/**
 * Representa la configuración instantánea de la Máquina de Turing.
 * Es una "fotografía" del estado de la máquina en un momento específico de la ejecución.
 * Útil para:
 * - Ejecutar la máquina paso a paso
 * - Mantener historial de ejecución
 * - Pausar y reanudar la ejecución
 */
export interface ConfiguracionMT {
  /** Estado actual en el que se encuentra la máquina */
  estadoActual: Estado;
  
  /** Estado de la cinta (símbolos y posición del cabezal) */
  cinta: Cinta;
}

/**
 * Definición completa de una Máquina de Turing.
 * Contiene todos los componentes necesarios según la definición formal:
 * M = (Q, Σ, Γ, δ, q0, F)
 */
export interface MaquinaTuring {
  /** Q: Conjunto finito de estados */
  estados: Set<Estado>;
  
  /** Γ: Alfabeto de la cinta (incluye el símbolo blanco) */
  alfabetoCinta: Set<SimboloCinta>;
  
  /** q0: Estado inicial de la máquina */
  estadoInicial: Estado;
  
  /** F: Conjunto de estados de aceptación (estados finales) */
  estadosAceptacion: Set<Estado>;
  
  /** δ: Función de transición */
  funcionTransicion: FuncionTransicion;
  
  /** Símbolo que representa una celda vacía en la cinta (_) */
  simboloBlanco: SimboloCinta;
}

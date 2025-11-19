import { 
  Estado, 
  SimboloCinta, 
  MoverDireccion, 
  Transicion, 
  FuncionTransicion, 
  Cinta, 
  ConfiguracionMT 
} from './model/maquina-turing.model';

/**
 * Clase que implementa el comportamiento de una Máquina de Turing.
 * Maneja el estado interno y la ejecución paso a paso del algoritmo.
 */
export class MaquinaTuring {
  /** Cinta de la máquina (arreglo de símbolos) */
  private cinta: Cinta;
  
  /** Estado actual de la máquina */
  private estadoActual: Estado;
  
  /** Conjunto de reglas de transición */
  private funcionTransicion: FuncionTransicion;
  
  /** Símbolo que representa una celda vacía */
  private simboloBlanco: SimboloCinta;
  
  /** Estados de aceptación (finales) */
  private estadosAceptacion: Set<Estado>;
  
  /** Historial de configuraciones para poder retroceder */
  private historial: ConfiguracionMT[];

  /**
   * Constructor de la Máquina de Turing
   * @param cintaInicial - Arreglo de símbolos inicial para la cinta
   * @param estadoInicial - Estado en el que comienza la máquina
   * @param funcionTransicion - Conjunto de reglas de transición
   * @param simboloBlanco - Símbolo que representa celdas vacías (default: '_')
   * @param estadosAceptacion - Conjunto de estados finales (default: Set vacío)
   */
  constructor(
    cintaInicial: SimboloCinta[],
    estadoInicial: Estado,
    funcionTransicion: FuncionTransicion,
    simboloBlanco: SimboloCinta = '_',
    estadosAceptacion: Set<Estado> = new Set(),
    posicionInicialCabezal: number = 0

  ) {
    this.cinta = {
      simbolos: [...cintaInicial],
      posicionCabezal: posicionInicialCabezal
    };
    this.estadoActual = estadoInicial;
    this.funcionTransicion = funcionTransicion;
    this.simboloBlanco = simboloBlanco;
    this.estadosAceptacion = estadosAceptacion;
    this.historial = [];
  }

  /**
   * Ejecuta un único paso de la Máquina de Turing.
   * Lee el símbolo actual, aplica la transición correspondiente,
   * escribe en la cinta y mueve el cabezal.
   * @returns true si se ejecutó un paso exitosamente, false si no hay transición disponible
   */
  paso(): boolean {
    // Guardar configuración actual en el historial antes de modificar
    this.guardarEnHistorial();

    // 1. Leer el símbolo actual de la cinta
    const simboloActual = this.leerSimbolo();

    // 2. Buscar la regla de transición correspondiente
    const transicion = this.funcionTransicion
      .get(this.estadoActual)
      ?.get(simboloActual);

    // 3. Si no hay regla disponible, la máquina se detiene
    if (!transicion) {
      return false;
    }

    // 4. Aplicar la transición
    this.escribirSimbolo(transicion.simboloEscribir);

    this.estadoActual = transicion.nuevoEstado;

    this.moverCabezal(transicion.moverDireccion);

    return true;
  }

  /**
   * Ejecuta la máquina hasta que se detenga (no haya transición disponible
   * o alcance un estado de aceptación).
   * @param maxPasos - Número máximo de pasos para evitar loops infinitos (default: 1000)
   * @returns true si termina en estado de aceptación, false en otro caso
   */
  ejecutar(maxPasos: number = 1000): boolean {
    let pasos = 0;
    
    while (pasos < maxPasos && !this.estaDetenida()) {
      this.paso();
      pasos++;
      
      // Si llegamos a un estado de aceptación, podemos detenernos
      if (this.estaEnEstadoAceptacion()) {
        return true;
      }
    }
    
    // Retorna true solo si terminó en estado de aceptación
    return this.estaEnEstadoAceptacion();
  }

  /**
   * Reinicia la máquina a su estado inicial con la cinta original.
   */
  reiniciar(): void {
    // Restaurar la primera configuración del historial si existe
    if (this.historial.length > 0) {
      const configInicial = this.historial[0];
      this.estadoActual = configInicial.estadoActual;
      this.cinta = {
        simbolos: [...configInicial.cinta.simbolos],
        posicionCabezal: configInicial.cinta.posicionCabezal
      };
    }
    
    // Limpiar el historial
    this.historial = [];
  }

  /**
   * Verifica si la máquina está detenida (no puede continuar ejecutándose).
   * @returns true si no hay transición disponible desde el estado actual
   */
  estaDetenida(): boolean {
    const simboloActual = this.leerSimbolo();
    const transicion = this.funcionTransicion
      .get(this.estadoActual)
      ?.get(simboloActual);
    
    return transicion === undefined;
  }

  /**
   * Verifica si la máquina está en un estado de aceptación.
   * @returns true si el estado actual es un estado de aceptación
   */
  estaEnEstadoAceptacion(): boolean {
    return this.estadosAceptacion.has(this.estadoActual);
  }

  /**
   * Obtiene la configuración actual de la máquina.
   * @returns Objeto con el estado actual y el estado de la cinta
   */
  obtenerConfiguracion(): ConfiguracionMT {
    return {
      estadoActual: this.estadoActual,
      cinta: {
        simbolos: [...this.cinta.simbolos],
        posicionCabezal: this.cinta.posicionCabezal
      }
    };
  }

  /**
   * Obtiene el símbolo en la posición actual del cabezal.
   * Si el cabezal está fuera de los límites de la cinta, retorna el símbolo blanco.
   * @returns Símbolo en la posición actual
   */
  leerSimbolo(): SimboloCinta {
    const posicion = this.cinta.posicionCabezal;
    
    // Si la posición está fuera de los límites, retornar símbolo blanco
    if (posicion < 0 || posicion >= this.cinta.simbolos.length) {
      return this.simboloBlanco;
    }
    
    return this.cinta.simbolos[posicion];
  }

  /**
   * Escribe un símbolo en la posición actual del cabezal.
   * Expande la cinta si es necesario.
   * @param simbolo - Símbolo a escribir
   */
  escribirSimbolo(simbolo: SimboloCinta): void {
    const posicion = this.cinta.posicionCabezal;
    
    // Expandir la cinta si es necesario
    this.expandirCinta(posicion);
    
    // Escribir el símbolo
    this.cinta.simbolos[posicion] = simbolo;
  }

  /**
   * Mueve el cabezal en la dirección especificada.
   * Expande la cinta si el cabezal se mueve fuera de los límites.
   * @param direccion - Dirección del movimiento ('I', 'D', 'N')
   */
  moverCabezal(direccion: MoverDireccion): void {
    switch (direccion) {
      case 'I': // Izquierda
        this.cinta.posicionCabezal--;
        break;
      case 'D': // Derecha
        this.cinta.posicionCabezal++;
        break;
      case 'N': // No mover (Stay)
        // No hacer nada
        break;
    }
    
    // Asegurar que la cinta sea accesible en la nueva posición
    this.expandirCinta(this.cinta.posicionCabezal);
  }

  /**
   * Obtiene la cinta completa como cadena de texto.
   * @returns Representación en string de la cinta
   */
  obtenerCintaComoString(): string {
    return this.cinta.simbolos.join('');
  }

  /**
   * Obtiene el historial completo de configuraciones.
   * @returns Arreglo de configuraciones históricas
   */
  obtenerHistorial(): ConfiguracionMT[] {
    return [...this.historial];
  }

  /**
   * Guarda la configuración actual en el historial.
   */
  private guardarEnHistorial(): void {
    this.historial.push(this.obtenerConfiguracion());
  }

  /**
   * Expande la cinta agregando símbolos blancos si es necesario.
   * @param posicion - Posición que debe estar accesible
   */
  private expandirCinta(posicion: number): void {
    // Expandir hacia la izquierda si la posición es negativa
    while (posicion < 0) {
      this.cinta.simbolos.unshift(this.simboloBlanco);
      this.cinta.posicionCabezal++;
      posicion++;
    }
    
    // Expandir hacia la derecha si la posición excede el tamaño
    while (posicion >= this.cinta.simbolos.length) {
      this.cinta.simbolos.push(this.simboloBlanco);
    }
  }
}

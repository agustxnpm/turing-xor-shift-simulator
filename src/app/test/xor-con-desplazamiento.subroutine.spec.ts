import { MaquinaTuring } from '../maquina-turing';
import { crearSubrutinaXorConDesplazamiento } from '../xor-shift/subroutines/xor-con-desplazamiento.subroutine';
import { BLANCO, SEP_INICIO, SEP_FIN } from '../xor-shift/xor-shift.types';

describe('Subrutina XOR con Desplazamiento', () => {

  const B = BLANCO; // Alias para legibilidad
  const LEN_PALABRA = 6;

  /**
   * Genera una máquina de prueba
   * @param scratchpad Contenido inicial del scratchpad (Operando A)
   * @param semilla Contenido de la semilla (Operando B)
   * @param desplazamiento El offset a aplicar (ej: -1 para << 1, +2 para >> 2)
   * @param namespace Un prefijo único para los estados de esta subrutina
   * @returns Una máquina de Turing lista para ejecutar
   */
  const crearMaquinaTest = (
    scratchpad: string,
    semilla: string,
    desplazamiento: number,
    namespace: string // <-- PARÁMETRO AÑADIDO
  ) => {
    const funcionTransicion = crearSubrutinaXorConDesplazamiento(
      'q_inicio',
      'q_fin',
      desplazamiento,
      namespace // <-- ARGUMENTO AÑADIDO
    );
    
    // Layout: ...blancos...[SCRATCHPAD]@[SEMILLA]#[HISTORIAL]...
    const padding = B.repeat(5);
    const cintaInicial =
      `${padding}${scratchpad}@${semilla}#${B.repeat(10)}`;
    
    // Posición inicial: Primer bit del SCRATCHPAD
    const posInicial = padding.length; // <-- Punto de inicio correcto

    const maquina = new MaquinaTuring(
      cintaInicial.split(''),
      'q_inicio',
      funcionTransicion,
      BLANCO,
      new Set(['q_fin']),
      posInicial // <--- CORRECCIÓN: Pasar la posición inicial
    );
    
    return { maquina, posInicial };
  };

  // ═══════════════════════════════════════════════════════════════
  // PRUEBAS DE SHIFT IZQUIERDA (OFFSET NEGATIVO)
  // ═══════════════════════════════════════════════════════════════

  it('debe calcular x = x XOR (x << 1)  [offset = -1]', () => {
    // ... (cálculos)
    // Resultado: 101011
    
    // Proporcionar un namespace único para este test
    const { maquina, posInicial } = crearMaquinaTest('110010', '110010', -1, 'test_ns_1');
    maquina.ejecutar(50000); 
    
    const config = maquina.obtenerConfiguracion();
    const cintaFinal = maquina.obtenerCintaComoString();

    expect(config.estadoActual).toBe('q_fin');
    expect(cintaFinal.includes('101011@110010#')).toBe(true);
    expect(config.cinta.posicionCabezal).toBe(posInicial);
  });

  it('debe calcular x = x XOR (x << 2)  [offset = -2]', () => {
    // ... (cálculos)
    // Resultado: 111110
    
    const { maquina, posInicial } = crearMaquinaTest('110010', '110010', -2, 'test_ns_2');
    maquina.ejecutar(50000); 
    
    const config = maquina.obtenerConfiguracion();
    const cintaFinal = maquina.obtenerCintaComoString();

    expect(config.estadoActual).toBe('q_fin');
    expect(cintaFinal.includes('111110@110010#')).toBe(true);
    expect(config.cinta.posicionCabezal).toBe(posInicial);
  });

  // ═══════════════════════════════════════════════════════════════
  // PRUEBAS DE SHIFT DERECHA (OFFSET POSITIVO)
  // ═══════════════════════════════════════════════════════════════

  it('debe calcular x = x XOR (x >> 2)  [offset = +2]', () => {
    // ... (cálculos)
    // Resultado: 111010
    
    const { maquina, posInicial } = crearMaquinaTest('110010', '110010', +2, 'test_ns_3');
    maquina.ejecutar(50000); 
    
    const config = maquina.obtenerConfiguracion();
    const cintaFinal = maquina.obtenerCintaComoString();

    expect(config.estadoActual).toBe('q_fin');
    expect(cintaFinal.includes('111010@110010#')).toBe(true);
    expect(config.cinta.posicionCabezal).toBe(posInicial);
  });

  it('debe calcular x = x XOR (x >> 3)  [offset = +3]', () => {
    // ... (cálculos)
    // Resultado: 111010
    
    const { maquina, posInicial } = crearMaquinaTest('101010', '101010', +3, 'test_ns_4');
    maquina.ejecutar(50000); 
    
    const config = maquina.obtenerConfiguracion();
    const cintaFinal = maquina.obtenerCintaComoString();

    expect(config.estadoActual).toBe('q_fin');
    expect(cintaFinal.includes('111010@101010#')).toBe(true);
    expect(config.cinta.posicionCabezal).toBe(posInicial);
  });
  
});
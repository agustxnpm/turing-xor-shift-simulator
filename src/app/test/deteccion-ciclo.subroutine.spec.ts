import { MaquinaTuring } from '../maquina-turing';
import { crearSubrutinaDeteccion } from '../xor-shift/subroutines/deteccion-ciclo.subroutine';
import { BLANCO, SEP_INICIO, SEP_FIN, SEP_HISTORIAL } from '../xor-shift/xor-shift.types';

describe('Subrutina Detección de Ciclo (Historial)', () => {

  const B = BLANCO;
  const S = SEP_HISTORIAL;
  const ESTADO_CONTINUAR = 'q_continuar_ciclo';
  const ESTADO_FIN_CICLO = 'q_ciclo_encontrado';

  /**
   * Genera una máquina de prueba
   */
  const crearMaquinaTest = (
    semilla: string,
    historial: string[],
  ) => {
    // ***** CORRECCIÓN 2: Llamar a la función correcta *****
    const funcionTransicion = crearSubrutinaDeteccion(
      'q_inicio',       // Estado inicial de la subrutina
      ESTADO_CONTINUAR, // Estado si NO hay ciclo
      ESTADO_FIN_CICLO,  // Estado si SÍ hay ciclo
      'testNS'          // Namespace fijo para evitar colisiones
    );
    
    const padding = B.repeat(5);
    const histString = historial.length > 0 ? historial.join(S) + S : '';
    
    const cintaInicial =
      `${padding}@${semilla}#${histString}${B.repeat(50)}`; // Padding amplio
    
    const posInicial = padding.length + 1; 

    const maquina = new MaquinaTuring(
      cintaInicial.split(''),
      'q_inicio', 
      funcionTransicion,
      BLANCO,
      new Set([ESTADO_CONTINUAR, ESTADO_FIN_CICLO]),
      posInicial 
    );
    
    return { maquina, posInicial, padding, histString };
  };

  it('debe añadir la semilla al historial si está vacío y continuar', () => {
    const semilla = '110010';
    const { maquina } = crearMaquinaTest(semilla, []);

    maquina.ejecutar(50000); 
    
    const config = maquina.obtenerConfiguracion();
    const cintaFinal = maquina.obtenerCintaComoString();

    // 1. Debe terminar en estado "Continuar"
    expect(config.estadoActual).toBe(ESTADO_CONTINUAR);
    
    // 2. La cinta debe contener la semilla añadida al historial
    // ***** CORRECCIÓN 3: Usar startsWith para ignorar padding *****
    const cintaEsperada = `${B.repeat(5)}@${semilla}#${semilla}${S}`;
    expect(cintaFinal.startsWith(cintaEsperada)).toBe(true);
  });

  it('debe añadir la semilla si no hay coincidencias y continuar', () => {
    const semilla = '010101';
    const historial = ['110010', '101101'];
    const { maquina } = crearMaquinaTest(semilla, historial);

    maquina.ejecutar(100000); 
    
    const config = maquina.obtenerConfiguracion();
    const cintaFinal = maquina.obtenerCintaComoString();

    // 1. Debe terminar en estado "Continuar"
    expect(config.estadoActual).toBe(ESTADO_CONTINUAR);
    
    // 2. La cinta debe contener la nueva semilla al final
    const histString = historial.join(S) + S;
    const cintaEsperada = `${B.repeat(5)}@${semilla}#${histString}${semilla}${S}`;
    expect(cintaFinal.startsWith(cintaEsperada)).toBe(true);
  });

  it('debe detectar un ciclo (match) y detenerse en estadoFinCiclo', () => {
    const semilla = '110101'; // Esta semilla ya existe
    const historial = ['110010', '110101', '101000'];
    const { maquina } = crearMaquinaTest(semilla, historial);

    maquina.ejecutar(100000);

    const config = maquina.obtenerConfiguracion();
    const cintaFinal = maquina.obtenerCintaComoString();

    // 1. ¡Debe terminar en estado "Fin Ciclo"!
    expect(config.estadoActual).toBe(ESTADO_FIN_CICLO);
    
    // 2. La cinta debe tener la semilla duplicada (la añade antes de chequear)
    const histString = historial.join(S) + S;
    const cintaEsperada = `${B.repeat(5)}@${semilla}#${histString}${semilla}${S}`;
    expect(cintaFinal.startsWith(cintaEsperada)).toBe(true);
  });

  it('debe detectar un ciclo (match) con la primera entrada del historial', () => {
    const semilla = '110010'; // Esta semilla ya existe
    const historial = ['110010', '101101'];
    const { maquina } = crearMaquinaTest(semilla, historial);

    maquina.ejecutar(100000); 
    
    const config = maquina.obtenerConfiguracion();

    // ¡Debe terminar en estado "Fin Ciclo"!
    expect(config.estadoActual).toBe(ESTADO_FIN_CICLO);
  });

});
import { MaquinaTuring } from '../maquina-turing';
import { crearSubrutinaActualizarSemilla } from '../xor-shift/subroutines/actualizar-semilla.subroutine';
import { BLANCO, SEP_INICIO, SEP_FIN } from '../xor-shift/xor-shift.types';

describe('Subrutina Actualizar Semilla (Corregida)', () => {

  const B = BLANCO;

  /**
   * Genera una máquina de prueba
   * @param scratchpad Contenido inicial del scratchpad
   * @param semilla Contenido inicial de la semilla
   * @returns Una máquina de Turing lista para ejecutar
   */
  const crearMaquinaTest = (
    scratchpad: string,
    semilla: string,
  ) => {
    const funcionTransicion = crearSubrutinaActualizarSemilla(
      'q_inicio',
      'q_fin',
      'testNS' // Usar un namespace fijo para evitar colisiones
    );
    
    const padding = B.repeat(5);
    const cintaInicial =
      `${padding}${scratchpad}@${semilla}#${B.repeat(10)}`;
    
    // Posición inicial: Primer bit del SCRATCHPAD
    const posInicial = padding.length; 

    const maquina = new MaquinaTuring(
      cintaInicial.split(''),
      'q_inicio',
      funcionTransicion,
      BLANCO,
      new Set(['q_fin']),
      posInicial // Pasar la posición inicial al constructor
    );
    
    return { maquina, posInicial, padding };
  };

  it('debe copiar "101010" del scratchpad a la semilla "000000"', () => {
    const scratchpad = '101010';
    const semilla = '000000';
    const { maquina, posInicial } = crearMaquinaTest(scratchpad, semilla);

    maquina.ejecutar(50000); 
    
    const config = maquina.obtenerConfiguracion();
    const cintaFinal = maquina.obtenerCintaComoString();

    expect(config.estadoActual).toBe('q_fin');
    
    // El scratchpad debe quedar limpio (sin marcas A/B)
    // La semilla debe ser actualizada
    const cintaEsperada = `${B.repeat(5)}101010@101010#${B.repeat(10)}`;
    expect(cintaFinal).toBe(cintaEsperada);

    // El cabezal debe volver al inicio del scratchpad
    expect(config.cinta.posicionCabezal).toBe(posInicial);
  });

  it('debe sobrescribir "111111" con "000111"', () => {
    const scratchpad = '000111';
    const semilla = '111111';
    const { maquina, posInicial } = crearMaquinaTest(scratchpad, semilla);

    maquina.ejecutar(50000); 
    
    const config = maquina.obtenerConfiguracion();
    const cintaFinal = maquina.obtenerCintaComoString();

    expect(config.estadoActual).toBe('q_fin');
    
    const cintaEsperada = `${B.repeat(5)}000111@000111#${B.repeat(10)}`;
    expect(cintaFinal).toBe(cintaEsperada);
    expect(config.cinta.posicionCabezal).toBe(posInicial);
  });

  it('debe manejar un scratchpad vacío (no hacer nada)', () => {
    const scratchpad = ''; // Vacío
    const semilla = '111111';
    const { maquina, posInicial } = crearMaquinaTest(scratchpad, semilla);

    // La posición inicial ahora es 5 (justo antes de @)
    const posInicialCorrecta = B.repeat(5).length;

    maquina.ejecutar(50000); 
    
    const config = maquina.obtenerConfiguracion();
    const cintaFinal = maquina.obtenerCintaComoString();

    expect(config.estadoActual).toBe('q_fin');
    
    // La cinta no debe cambiar
    const cintaEsperada = `${B.repeat(5)}@111111#${B.repeat(10)}`;
    expect(cintaFinal).toBe(cintaEsperada);
    
    // El cabezal debe terminar donde empezó (o cerca, después de limpiar)
    // En este caso, termina en la pos 5 (el padding)
    expect(config.cinta.posicionCabezal).toBe(posInicialCorrecta);
  });

});
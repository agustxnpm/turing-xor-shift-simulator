import { MaquinaTuring } from '../maquina-turing';
import { crearSubrutinaCopy } from '../xor-shift/subroutines/copy.subroutine';
import { BLANCO, SEP_INICIO, SEP_HISTORIAL, SEP_FIN } from '../xor-shift/xor-shift.types';

describe('Subrutina COPY (con Limpieza)', () => {
  /**
   * Caso 1: Copiar "110010"
   * Layout inicial: _______@110010#_______
   * Layout final: _110010@110010#_______ (Semilla restaurada, copiada a la izquierda)
   * Cabezal: sobre el PRIMER bit del área izquierda ('1' de la copia)
   */
  it('debe copiar "110010" al área izquierda y limpiar la semilla', () => {
    const funcionTransicion = crearSubrutinaCopy('q_inicio', 'q_fin');
    const cintaInicial =
      `${BLANCO.repeat(7)}@110010#${BLANCO.repeat(7)}`;
    const maquina = new MaquinaTuring(
      cintaInicial.split(''),
      'q_inicio',
      funcionTransicion,
      BLANCO,
      new Set(['q_fin'])
    );
    maquina.ejecutar(2000); // Aumentar pasos para la limpieza
    const cintaFinal = maquina.obtenerCintaComoString();
    const config = maquina.obtenerConfiguracion();

    expect(config.estadoActual).toBe('q_fin');
    // La semilla AHORA debe estar LIMPIA (restaurada)
    expect(cintaFinal).toBe(
      `${BLANCO}110010@110010#${BLANCO.repeat(7)}`
    );
    // Cabezal debe quedar sobre el PRIMER bit de la copia (inicio de '110010')
    expect(config.cinta.posicionCabezal).toBe(
      cintaFinal.indexOf('110010@') // El '1' justo antes de @
    );
  });

  /**
   * Caso 2: Copiar ignorando historial poblado
   */
  it('debe copiar "110010" con historial poblado y limpiar semilla', () => {
    const funcionTransicion = crearSubrutinaCopy('q_inicio', 'q_fin');
    const cintaInicial =
      `${BLANCO.repeat(7)}@110010#101${SEP_HISTORIAL}${BLANCO.repeat(6)}`;
    const maquina = new MaquinaTuring(
      cintaInicial.split(''),
      'q_inicio',
      funcionTransicion,
      BLANCO,
      new Set(['q_fin'])
    );
    maquina.ejecutar(3000); // Aumentar pasos
    const cintaFinal = maquina.obtenerCintaComoString();
    const config = maquina.obtenerConfiguracion();

    expect(config.estadoActual).toBe('q_fin');
    // La semilla restaurada, el historial intacto
    expect(cintaFinal).toBe(
      `${BLANCO}110010@110010#101${SEP_HISTORIAL}${BLANCO.repeat(6)}`
    );
    // Cabezal sobre el PRIMER bit de la copia
    expect(config.cinta.posicionCabezal).toBe(
      cintaFinal.indexOf('110010@')
    );
  });

  /**
   * Caso 3: Secuencia de ceros
   */
  it('debe copiar "000000" y limpiar', () => {
    const funcionTransicion = crearSubrutinaCopy('q_inicio', 'q_fin');
    const cintaInicial =
      `${BLANCO.repeat(7)}@000000#${BLANCO.repeat(7)}`;
    const maquina = new MaquinaTuring(
      cintaInicial.split(''),
      'q_inicio',
      funcionTransicion,
      BLANCO,
      new Set(['q_fin'])
    );
    maquina.ejecutar(2000);
    const cintaFinal = maquina.obtenerCintaComoString();
    expect(cintaFinal).toBe(
      `${BLANCO}000000@000000#${BLANCO.repeat(7)}`
    );
  });
});
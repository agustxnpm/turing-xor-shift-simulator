import { MaquinaTuring } from '../maquina-turing';
import { OrquestadorXorShift } from '../xor-shift/orquestador-xor-shift';
import { ConfiguracionXorShift } from '../xor-shift/xor-shift.types';
import { BLANCO, SEP_FIN, SEP_HISTORIAL } from '../xor-shift/xor-shift.types';

describe('Orquestador XOR-Shift (Integración Completa)', () => {

  it('debe ejecutar el ejemplo del PDF (a=1, b=2, c=1) y detectar el ciclo', () => {
    
    const config: ConfiguracionXorShift = {
      semillaInicial: '110010',
      desplazamientoA: 1,
      desplazamientoB: 2,
      desplazamientoC: 1,
    };

    const orquestador = new OrquestadorXorShift(config);
    const cintaInicial = orquestador.obtenerCintaInicial();
    const posInicial = orquestador.obtenerPosicionInicialCabezal();
    const funcionTransicion = orquestador.obtenerFuncionTransicion();

    const maquina = new MaquinaTuring(
      cintaInicial,
      'q_inicio', 
      funcionTransicion,
      BLANCO,
      new Set(['q_HALT_CICLO_ENCONTRADO']), 
      posInicial 
    );

    const maxPasos = 50000; 
    let pasos = 0;
    while (!maquina.estaDetenida() && pasos < maxPasos) {
      const pasoExitoso = maquina.paso();
      if (!pasoExitoso) break;
      pasos++;
    }
    console.log('TOTAL DE PASOS EJECUTADOS:', pasos);
    console.log('ESTADO FINAL:', maquina.obtenerConfiguracion().estadoActual);

    const configFinal = maquina.obtenerConfiguracion();
    const cintaFinal = maquina.obtenerCintaComoString();

    // 1. Verificar parada correcta
    expect(configFinal.estadoActual).toBe('q_HALT_CICLO_ENCONTRADO');

    // 2. Verificar que la semilla final es la repetida (110010, igual a la inicial)
    const semillaEnCinta = cintaFinal.substring(
      cintaFinal.indexOf('@') + 1,
      cintaFinal.indexOf('#')
    );
    expect(semillaEnCinta).toBe('110010');

    // 3. Verificar Historial Completo
    // NOTA: El algoritmo real produce un ciclo de 7 números antes de repetir la semilla.
    const historialEnCinta = cintaFinal.substring(
      cintaFinal.indexOf('#') + 1
    );
    
    const s = SEP_HISTORIAL; 
    // Secuencia generada por la máquina (Validada en logs):
    const expectedHistory = `110010${s}110101${s}101000${s}011010${s}101111${s}000111${s}011101${s}110010${s}`;
    
    expect(historialEnCinta.startsWith(expectedHistory)).toBe(true);
  });

});
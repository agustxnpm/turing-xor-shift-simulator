import { FuncionTransicion } from '../model/maquina-turing.model';
import { ConfiguracionXorShift, SEP_INICIO, SEP_FIN, SEP_HISTORIAL, BLANCO } from './xor-shift.types';
import { crearSubrutinaCopy } from './subroutines/copy.subroutine';
import { crearSubrutinaXorConDesplazamiento } from './subroutines/xor-con-desplazamiento.subroutine';
import { crearSubrutinaActualizarSemilla } from './subroutines/actualizar-semilla.subroutine';
import { crearSubrutinaDeteccion } from './subroutines/deteccion-ciclo.subroutine';

export class OrquestadorXorShift {
  private funcionTransicion: FuncionTransicion;
  private configuracion: ConfiguracionXorShift;
  private estadoFinal = 'q_HALT_CICLO_ENCONTRADO';
  private paddingIzquierdo = 10; 

  constructor(config: ConfiguracionXorShift) {
    this.configuracion = config;
    this.funcionTransicion = new Map();
    this.construirPrograma();
  }
  
  obtenerCintaInicial(): string[] {
    const cinta: string[] = [];
    for (let i = 0; i < this.paddingIzquierdo; i++) cinta.push(BLANCO);
    for (let i = 0; i < this.configuracion.semillaInicial.length; i++) cinta.push(BLANCO);
    cinta.push(SEP_INICIO);
    for (const bit of this.configuracion.semillaInicial) cinta.push(bit);
    cinta.push(SEP_FIN); 
    for (let i = 0; i < 500; i++) cinta.push(BLANCO);
    return cinta;
  }

  obtenerPosicionInicialCabezal(): number {
    return this.paddingIzquierdo + this.configuracion.semillaInicial.length;
  }

  obtenerFuncionTransicion(): FuncionTransicion {
    return this.funcionTransicion;
  }

  private construirPrograma(): void {
    const config = this.configuracion;
    
    const INICIO_CICLO = 'q_inicio_ciclo';     
    const PRE_LOOP_DETECT = 'q_pre_loop_detect'; 

    const inicio = new Map();
    inicio.set(SEP_INICIO, { 
      nuevoEstado: PRE_LOOP_DETECT, 
      simboloEscribir: SEP_INICIO, 
      moverDireccion: 'N' 
    });
    this.funcionTransicion.set('q_inicio', inicio);

    // 0.1 DETECCIÓN INICIAL (Namespace: 'det_init')
    this.combinarReglas(
      crearSubrutinaDeteccion(
        PRE_LOOP_DETECT,
        INICIO_CICLO, 
        this.estadoFinal,
        'det_init' 
      )
    );

    // 1. COPY
    this.combinarReglas(
      crearSubrutinaCopy(INICIO_CICLO, 'q_op1_xor_start')
    );

    // 2. XOR A
    this.combinarReglas(
      crearSubrutinaXorConDesplazamiento(
        'q_op1_xor_start',
        'q_op1_update_start',
        Math.abs(config.desplazamientoA), 
        'op1'
      )
    );

    // 3. UPDATE 1
    this.combinarReglas(
      crearSubrutinaActualizarSemilla(
        'q_op1_update_start', 
        'q_op2_xor_start', 
        'upd1'
      )
    );

    // 4. XOR B
    this.combinarReglas(
      crearSubrutinaXorConDesplazamiento(
        'q_op2_xor_start',
        'q_op2_update_start',
        -Math.abs(config.desplazamientoB), 
        'op2'
      )
    );

    // 5. UPDATE 2
    this.combinarReglas(
      crearSubrutinaActualizarSemilla(
        'q_op2_update_start', 
        'q_op3_xor_start', 
        'upd2'
      )
    );
    
    // 6. XOR C
    this.combinarReglas(
      crearSubrutinaXorConDesplazamiento(
        'q_op3_xor_start',
        'q_op3_update_start',
        Math.abs(config.desplazamientoC), 
        'op3'
      )
    );
    
    // 7. UPDATE 3
    this.combinarReglas(
      crearSubrutinaActualizarSemilla(
        'q_op3_update_start', 
        'q_bridge_to_detect', 
        'upd3'
      )
    );
    
    // 8. BRIDGE
    const bridge = new Map();
    for (const s of ['0', '1', BLANCO]) {
      bridge.set(s, { nuevoEstado: 'q_bridge_to_detect', simboloEscribir: s, moverDireccion: 'D' });
    }
    bridge.set(SEP_INICIO, { nuevoEstado: 'q_detect_start', simboloEscribir: SEP_INICIO, moverDireccion: 'N' });
    this.funcionTransicion.set('q_bridge_to_detect', bridge);

    // 9. DETECCIÓN (Namespace: 'det_loop')
    this.combinarReglas(
      crearSubrutinaDeteccion(
        'q_detect_start',
        INICIO_CICLO, 
        this.estadoFinal,
        'det_loop' 
      )
    );
  }

  private combinarReglas(nuevas: FuncionTransicion): void {
    nuevas.forEach((trans, estado) => {
      if (this.funcionTransicion.has(estado)) {
        console.warn(`Aviso: El estado ${estado} ha sido redefinido.`);
      }
      this.funcionTransicion.set(estado, trans);
    });
  }
}
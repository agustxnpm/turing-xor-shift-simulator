import { FuncionTransicion } from '../../model/maquina-turing.model';
import { SEP_INICIO, SEP_FIN, BLANCO } from '../xor-shift.types';

/**
 * XOR CON DESPLAZAMIENTO (VERSIÓN FINAL CON NAMESPACE)
 *
 * Aplica XOR(Scratchpad[i], Semilla[i + desplazamiento]) y sobrescribe Scratchpad[i] con el resultado.
 *
 * Acepta un 'namespace' para que todos los estados internos sean únicos.
 */
export function crearSubrutinaXorConDesplazamiento(
  estadoInicio: string,
  estadoFin: string,
  desplazamiento: number,
  namespace: string //
): FuncionTransicion {
  const reglas = new Map();
  const LEN_PALABRA = 6; // Asumido por el TP

  // Función helper para prefijar estados
  const ns = (estado: string) => `${namespace}_${estado}`;

  // ═══════════════════════════════════════════════════════════════
  // FASE 0: NAVEGAR AL PRIMER BIT DEL SCRATCHPAD
  // ═══════════════════════════════════════════════════════════════
  const navToStart = new Map();
  navToStart.set(BLANCO, { nuevoEstado: estadoInicio, simboloEscribir: BLANCO, moverDireccion: 'D' });
  navToStart.set(SEP_INICIO, { nuevoEstado: ns('q_xor_cleanup_start'), simboloEscribir: SEP_INICIO, moverDireccion: 'I' });
  navToStart.set('0', { nuevoEstado: ns('q_xor_loop_i0'), simboloEscribir: '0', moverDireccion: 'N' });
  navToStart.set('1', { nuevoEstado: ns('q_xor_loop_i0'), simboloEscribir: '1', moverDireccion: 'N' });
  reglas.set(estadoInicio, navToStart);

  // ═══════════════════════════════════════════════════════════════
  // BUCLE PRINCIPAL: Generar estados para i = 0 hasta 5
  // ═══════════════════════════════════════════════════════════════
  for (let i = 0; i < LEN_PALABRA; i++) {
    const loopState = ns(`q_xor_loop_i${i}`);
    const nextLoopState = (i < LEN_PALABRA - 1) ? ns(`q_xor_loop_i${i + 1}`) : ns('q_xor_cleanup_start');
    
    // Nombres de estados (con prefijo)
    const BIT_A_ES_0 = ns(`q_xor_A0_i${i}`);
    const BIT_A_ES_1 = ns(`q_xor_A1_i${i}`);
    const RETURN_A0_B0 = ns(`q_xor_return_A0_B0_i${i}`); 
    const RETURN_A0_B1 = ns(`q_xor_return_A0_B1_i${i}`);
    const RETURN_A1_B0 = ns(`q_xor_return_A1_B0_i${i}`);
    const RETURN_A1_B1 = ns(`q_xor_return_A1_B1_i${i}`);
    const APPLY_OFFSET_A0 = ns(`q_xor_apply_offset_A0_i${i}`);
    const APPLY_OFFSET_A1 = ns(`q_xor_apply_offset_A1_i${i}`);
    const FIND_MARK_A0_B0 = ns(`q_xor_find_mark_A0_B0_i${i}`);
    const FIND_MARK_A0_B1 = ns(`q_xor_find_mark_A0_B1_i${i}`);
    const FIND_MARK_A1_B0 = ns(`q_xor_find_mark_A1_B0_i${i}`);
    const FIND_MARK_A1_B1 = ns(`q_xor_find_mark_A1_B1_i${i}`);

    // FASE 1 (i): Leer bit 'i' de SCRATCHPAD
    const startLoop = new Map();
    startLoop.set('0', { nuevoEstado: BIT_A_ES_0, simboloEscribir: 'A', moverDireccion: 'D' });
    startLoop.set('1', { nuevoEstado: BIT_A_ES_1, simboloEscribir: 'B', moverDireccion: 'D' });
    startLoop.set(SEP_INICIO, { nuevoEstado: ns('q_xor_cleanup_start'), simboloEscribir: SEP_INICIO, moverDireccion: 'I' });
    reglas.set(loopState, startLoop);

    // FASE 2 (i): Navegar hasta @
    const goToSeed0 = new Map();
    const goToSeed1 = new Map();
    for (const s of ['0', '1', 'A', 'B']) {
      goToSeed0.set(s, { nuevoEstado: BIT_A_ES_0, simboloEscribir: s, moverDireccion: 'D' });
      goToSeed1.set(s, { nuevoEstado: BIT_A_ES_1, simboloEscribir: s, moverDireccion: 'D' });
    }
    goToSeed0.set(SEP_INICIO, { nuevoEstado: APPLY_OFFSET_A0, simboloEscribir: SEP_INICIO, moverDireccion: 'D' });
    goToSeed1.set(SEP_INICIO, { nuevoEstado: APPLY_OFFSET_A1, simboloEscribir: SEP_INICIO, moverDireccion: 'D' });
    reglas.set(BIT_A_ES_0, goToSeed0);
    reglas.set(BIT_A_ES_1, goToSeed1);
    
    // FASE 3 (i): Aplicar Offset y Leer Semilla
    const target_pos = i + desplazamiento;
    const mapOffsetA0 = new Map();
    const mapOffsetA1 = new Map();
    
    // Caso 1: Offset fuera de límites o en el borde
    if (target_pos < 0 || target_pos >= LEN_PALABRA) {
      for (const s of ['0', '1', SEP_FIN]) { 
        mapOffsetA0.set(s, { nuevoEstado: RETURN_A0_B0, simboloEscribir: s, moverDireccion: 'I' });
        mapOffsetA1.set(s, { nuevoEstado: RETURN_A1_B0, simboloEscribir: s, moverDireccion: 'I' });
      }
    } 
    // Caso 2: Offset en la cinta
    else {
      let currentStateA0 = APPLY_OFFSET_A0;
      let currentStateA1 = APPLY_OFFSET_A1;

      for (let j = 0; j < target_pos; j++) {
        const tempMapA0 = (j === 0) ? mapOffsetA0 : new Map();
        const tempMapA1 = (j === 0) ? mapOffsetA1 : new Map();
        const nextStateA0 = ns(`q_xor_offset_A0_i${i}_step${j+1}`);
        const nextStateA1 = ns(`q_xor_offset_A1_i${i}_step${j+1}`);
        
        for(const s of ['0', '1']) {
            tempMapA0.set(s, { nuevoEstado: nextStateA0, simboloEscribir: s, moverDireccion: 'D' });
            tempMapA1.set(s, { nuevoEstado: nextStateA1, simboloEscribir: s, moverDireccion: 'D' });
        }
        tempMapA0.set(SEP_FIN, { nuevoEstado: RETURN_A0_B0, simboloEscribir: SEP_FIN, moverDireccion: 'I' });
        tempMapA1.set(SEP_FIN, { nuevoEstado: RETURN_A1_B0, simboloEscribir: SEP_FIN, moverDireccion: 'I' });

        if (j > 0) reglas.set(currentStateA0, tempMapA0);
        if (j > 0) reglas.set(currentStateA1, tempMapA1);
        
        currentStateA0 = nextStateA0;
        currentStateA1 = nextStateA1;
      }

      const readMapA0 = (target_pos === 0) ? mapOffsetA0 : new Map();
      const readMapA1 = (target_pos === 0) ? mapOffsetA1 : new Map();
      
      readMapA0.set('0', { nuevoEstado: RETURN_A0_B0, simboloEscribir: '0', moverDireccion: 'I' });
      readMapA0.set('1', { nuevoEstado: RETURN_A0_B1, simboloEscribir: '1', moverDireccion: 'I' });
      readMapA1.set('0', { nuevoEstado: RETURN_A1_B0, simboloEscribir: '0', moverDireccion: 'I' });
      readMapA1.set('1', { nuevoEstado: RETURN_A1_B1, simboloEscribir: '1', moverDireccion: 'I' });
      readMapA0.set(SEP_FIN, { nuevoEstado: RETURN_A0_B0, simboloEscribir: SEP_FIN, moverDireccion: 'I' });
      readMapA1.set(SEP_FIN, { nuevoEstado: RETURN_A1_B0, simboloEscribir: SEP_FIN, moverDireccion: 'I' });

      if (target_pos > 0) reglas.set(currentStateA0, readMapA0);
      if (target_pos > 0) reglas.set(currentStateA1, readMapA1);
    }
    
    reglas.set(APPLY_OFFSET_A0, mapOffsetA0);
    reglas.set(APPLY_OFFSET_A1, mapOffsetA1);

    // FASE 4 (i): REGRESAR (mapeo de estados de retorno)
    const return_A0_B0 = new Map(); // A=0, B=0 (XOR=0)
    const return_A0_B1 = new Map(); // A=0, B=1 (XOR=1)
    const return_A1_B0 = new Map(); // A=1, B=0 (XOR=1)
    const return_A1_B1 = new Map(); // A=1, B=1 (XOR=0)

    for (const s of ['0', '1', SEP_FIN]) {
      return_A0_B0.set(s, { nuevoEstado: RETURN_A0_B0, simboloEscribir: s, moverDireccion: 'I' });
      return_A0_B1.set(s, { nuevoEstado: RETURN_A0_B1, simboloEscribir: s, moverDireccion: 'I' });
      return_A1_B0.set(s, { nuevoEstado: RETURN_A1_B0, simboloEscribir: s, moverDireccion: 'I' });
      return_A1_B1.set(s, { nuevoEstado: RETURN_A1_B1, simboloEscribir: s, moverDireccion: 'I' });
    }
    
    return_A0_B0.set(SEP_INICIO, { nuevoEstado: FIND_MARK_A0_B0, simboloEscribir: SEP_INICIO, moverDireccion: 'I' });
    return_A0_B1.set(SEP_INICIO, { nuevoEstado: FIND_MARK_A0_B1, simboloEscribir: SEP_INICIO, moverDireccion: 'I' });
    return_A1_B0.set(SEP_INICIO, { nuevoEstado: FIND_MARK_A1_B0, simboloEscribir: SEP_INICIO, moverDireccion: 'I' });
    return_A1_B1.set(SEP_INICIO, { nuevoEstado: FIND_MARK_A1_B1, simboloEscribir: SEP_INICIO, moverDireccion: 'I' });

    reglas.set(RETURN_A0_B0, return_A0_B0);
    reglas.set(RETURN_A0_B1, return_A0_B1);
    reglas.set(RETURN_A1_B0, return_A1_B0);
    reglas.set(RETURN_A1_B1, return_A1_B1);
    
    // FASE 5 (i): Encontrar marca A/B y escribir
    const findMark_A0_B0 = new Map();
    const findMark_A0_B1 = new Map();
    const findMark_A1_B0 = new Map();
    const findMark_A1_B1 = new Map();

    const symbolsToCross_A = ['0', '1', 'B']; 
    const symbolsToCross_B = ['0', '1', 'A']; 

    for (const s of symbolsToCross_A) {
      findMark_A0_B0.set(s, { nuevoEstado: FIND_MARK_A0_B0, simboloEscribir: s, moverDireccion: 'I' });
      findMark_A0_B1.set(s, { nuevoEstado: FIND_MARK_A0_B1, simboloEscribir: s, moverDireccion: 'I' });
    }
    for (const s of symbolsToCross_B) {
      findMark_A1_B0.set(s, { nuevoEstado: FIND_MARK_A1_B0, simboloEscribir: s, moverDireccion: 'I' });
      findMark_A1_B1.set(s, { nuevoEstado: FIND_MARK_A1_B1, simboloEscribir: s, moverDireccion: 'I' });
    }
    
    const failSafeCleanup = { nuevoEstado: ns('q_xor_cleanup_start'), simboloEscribir: BLANCO, moverDireccion: 'D' };
    findMark_A0_B0.set(BLANCO, failSafeCleanup);
    findMark_A0_B1.set(BLANCO, failSafeCleanup);
    findMark_A1_B0.set(BLANCO, failSafeCleanup);
    findMark_A1_B1.set(BLANCO, failSafeCleanup);
    
    // Reglas específicas (escribir resultado y mover al sig. bit)
    findMark_A0_B0.set('A', { nuevoEstado: nextLoopState, simboloEscribir: '0', moverDireccion: 'D' });
    findMark_A0_B1.set('A', { nuevoEstado: nextLoopState, simboloEscribir: '1', moverDireccion: 'D' });
    findMark_A1_B0.set('B', { nuevoEstado: nextLoopState, simboloEscribir: '1', moverDireccion: 'D' });
    findMark_A1_B1.set('B', { nuevoEstado: nextLoopState, simboloEscribir: '0', moverDireccion: 'D' });
    
    reglas.set(FIND_MARK_A0_B0, findMark_A0_B0);
    reglas.set(FIND_MARK_A0_B1, findMark_A0_B1);
    reglas.set(FIND_MARK_A1_B0, findMark_A1_B0);
    reglas.set(FIND_MARK_A1_B1, findMark_A1_B1);
  }

  // ═══════════════════════════════════════════════════════════════
  // FASE 6: LIMPIEZA FINAL
  // ═══════════════════════════════════════════════════════════════
  const cleanup = new Map();
  cleanup.set('A', { nuevoEstado: ns('q_xor_cleanup_start'), simboloEscribir: '0', moverDireccion: 'I' });
  cleanup.set('B', { nuevoEstado: ns('q_xor_cleanup_start'), simboloEscribir: '1', moverDireccion: 'I' });
  cleanup.set('0', { nuevoEstado: ns('q_xor_cleanup_start'), simboloEscribir: '0', moverDireccion: 'I' });
  cleanup.set('1', { nuevoEstado: ns('q_xor_cleanup_start'), simboloEscribir: '1', moverDireccion: 'I' });
  cleanup.set(SEP_INICIO, { nuevoEstado: ns('q_xor_cleanup_start'), simboloEscribir: SEP_INICIO, moverDireccion: 'I' });
  cleanup.set(BLANCO, { nuevoEstado: ns('q_xor_position_head'), simboloEscribir: BLANCO, moverDireccion: 'D' });
  reglas.set(ns('q_xor_cleanup_start'), cleanup);

  // Posicionar cabezal al inicio del scratchpad
  const positionHead = new Map();
  positionHead.set('0', { nuevoEstado: estadoFin, simboloEscribir: '0', moverDireccion: 'N' });
  positionHead.set('1', { nuevoEstado: estadoFin, simboloEscribir: '1', moverDireccion: 'N' });
  positionHead.set(BLANCO, { nuevoEstado: ns('q_xor_position_head'), simboloEscribir: BLANCO, moverDireccion: 'D'});
  reglas.set(ns('q_xor_position_head'), positionHead);

  return reglas;
}
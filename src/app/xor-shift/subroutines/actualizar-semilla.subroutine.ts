import { FuncionTransicion } from '../../model/maquina-turing.model';
import { SEP_INICIO, SEP_FIN, BLANCO } from '../xor-shift.types';

/**
 * ACTUALIZAR SEMILLA (VERSIÓN CORREGIDA CON NAMESPACE)
 * Copia el contenido del SCRATCHPAD a la SEMILLA bit a bit.
 * Soporta 'namespace' para evitar colisiones cuando se usa múltiples veces.
 */
export function crearSubrutinaActualizarSemilla(
  estadoInicio: string,
  estadoFin: string,
  namespace: string // <-- NUEVO PARÁMETRO OBLIGATORIO
): FuncionTransicion {
  const reglas = new Map();
  const LEN_PALABRA = 6;

  // Helper para prefijar estados
  const ns = (nombre: string) => `${namespace}_${nombre}`;

  // ═══════════════════════════════════════════════════════════════
  // BUCLE PRINCIPAL
  // ═══════════════════════════════════════════════════════════════
  for (let i = 0; i < LEN_PALABRA; i++) {
    const loopState = (i === 0) ? estadoInicio : ns(`q_update_loop_i${i}`);
    const nextLoopState = (i < LEN_PALABRA - 1) ? ns(`q_update_loop_i${i + 1}`) : ns('q_update_cleanup_start');

    // Estados únicos para este índice 'i' (PREFIJADOS)
    const GOTO_SEED_0 = ns(`q_update_goto_seed_0_i${i}`);
    const GOTO_SEED_1 = ns(`q_update_goto_seed_1_i${i}`);
    const APPLY_OFFSET_0 = ns(`q_update_apply_offset_0_i${i}`);
    const APPLY_OFFSET_1 = ns(`q_update_apply_offset_1_i${i}`);
    const RETURN_STATE = ns(`q_update_return_i${i}`);
    const FIND_MARK = ns(`q_update_find_mark_i${i}`);
    
    // FASE 1 (i): Leer bit 'i' de SCRATCHPAD y marcar
    const startLoop = new Map();
    startLoop.set('0', { nuevoEstado: GOTO_SEED_0, simboloEscribir: 'A', moverDireccion: 'D' });
    startLoop.set('1', { nuevoEstado: GOTO_SEED_1, simboloEscribir: 'B', moverDireccion: 'D' });
    startLoop.set(SEP_INICIO, { nuevoEstado: ns('q_update_cleanup_start'), simboloEscribir: SEP_INICIO, moverDireccion: 'I' });
    reglas.set(loopState, startLoop);

    // FASE 2 (i): Navegar hasta @
    const goToSeed0 = new Map();
    const goToSeed1 = new Map();
    for (const s of ['0', '1', 'A', 'B']) {
      goToSeed0.set(s, { nuevoEstado: GOTO_SEED_0, simboloEscribir: s, moverDireccion: 'D' });
      goToSeed1.set(s, { nuevoEstado: GOTO_SEED_1, simboloEscribir: s, moverDireccion: 'D' });
    }
    goToSeed0.set(SEP_INICIO, { nuevoEstado: APPLY_OFFSET_0, simboloEscribir: SEP_INICIO, moverDireccion: 'D' });
    goToSeed1.set(SEP_INICIO, { nuevoEstado: APPLY_OFFSET_1, simboloEscribir: SEP_INICIO, moverDireccion: 'D' });
    reglas.set(GOTO_SEED_0, goToSeed0);
    reglas.set(GOTO_SEED_1, goToSeed1);

    // FASE 3 y 4 (i): Avanzar 'i' posiciones y Escribir
    let currentOffsetState0 = APPLY_OFFSET_0;
    let currentOffsetState1 = APPLY_OFFSET_1;
    let mapOffset0: Map<string, any>;
    let mapOffset1: Map<string, any>;

    for (let j = 0; j < i; j++) {
      mapOffset0 = new Map();
      mapOffset1 = new Map();
      const nextOffsetState0 = ns(`q_update_offset_0_i${i}_step${j + 1}`);
      const nextOffsetState1 = ns(`q_update_offset_1_i${i}_step${j + 1}`);
      
      for (const s of ['0', '1']) {
        mapOffset0.set(s, { nuevoEstado: nextOffsetState0, simboloEscribir: s, moverDireccion: 'D' });
        mapOffset1.set(s, { nuevoEstado: nextOffsetState1, simboloEscribir: s, moverDireccion: 'D' });
      }
      
      reglas.set(currentOffsetState0, mapOffset0);
      reglas.set(currentOffsetState1, mapOffset1);

      currentOffsetState0 = nextOffsetState0;
      currentOffsetState1 = nextOffsetState1;
    }

    // Escribir en Semilla
    mapOffset0 = new Map();
    mapOffset1 = new Map();

    mapOffset0.set('0', { nuevoEstado: RETURN_STATE, simboloEscribir: '0', moverDireccion: 'I' });
    mapOffset0.set('1', { nuevoEstado: RETURN_STATE, simboloEscribir: '0', moverDireccion: 'I' });
    mapOffset1.set('0', { nuevoEstado: RETURN_STATE, simboloEscribir: '1', moverDireccion: 'I' });
    mapOffset1.set('1', { nuevoEstado: RETURN_STATE, simboloEscribir: '1', moverDireccion: 'I' });

    reglas.set(currentOffsetState0, mapOffset0);
    reglas.set(currentOffsetState1, mapOffset1);

    // FASE 5 (i): Regresar a @
    const returnMap = new Map();
    for (const s of ['0', '1', SEP_FIN]) {
      returnMap.set(s, { nuevoEstado: RETURN_STATE, simboloEscribir: s, moverDireccion: 'I' });
    }
    returnMap.set(SEP_INICIO, { nuevoEstado: FIND_MARK, simboloEscribir: SEP_INICIO, moverDireccion: 'I' });
    reglas.set(RETURN_STATE, returnMap);

    // FASE 6 (i): Encontrar la marca
    const findMark = new Map();
    const symbolsToCross = ['0', '1', 'A', 'B'];
    for (const s of symbolsToCross) {
      findMark.set(s, { nuevoEstado: FIND_MARK, simboloEscribir: s, moverDireccion: 'I' });
    }
    findMark.set(BLANCO, { nuevoEstado: ns('q_update_cleanup_start'), simboloEscribir: BLANCO, moverDireccion: 'D' });

    findMark.set('A', { nuevoEstado: nextLoopState, simboloEscribir: '0', moverDireccion: 'D' });
    findMark.set('B', { nuevoEstado: nextLoopState, simboloEscribir: '1', moverDireccion: 'D' });
    
    reglas.set(FIND_MARK, findMark);
  }

  // ═══════════════════════════════════════════════════════════════
  // FASE 7: LIMPIEZA FINAL
  // ═══════════════════════════════════════════════════════════════
  const cleanup = new Map();
  cleanup.set(SEP_INICIO, { nuevoEstado: ns('q_update_cleanup_start'), simboloEscribir: SEP_INICIO, moverDireccion: 'I' });
  cleanup.set('A', { nuevoEstado: ns('q_update_cleanup_start'), simboloEscribir: '0', moverDireccion: 'I' });
  cleanup.set('B', { nuevoEstado: ns('q_update_cleanup_start'), simboloEscribir: '1', moverDireccion: 'I' });
  cleanup.set('0', { nuevoEstado: ns('q_update_cleanup_start'), simboloEscribir: '0', moverDireccion: 'I' });
  cleanup.set('1', { nuevoEstado: ns('q_update_cleanup_start'), simboloEscribir: '1', moverDireccion: 'I' });
  cleanup.set(BLANCO, { nuevoEstado: ns('q_update_position_head'), simboloEscribir: BLANCO, moverDireccion: 'D' });
  reglas.set(ns('q_update_cleanup_start'), cleanup);

  // Posicionar cabezal al inicio del scratchpad
  const positionHead = new Map();
  positionHead.set('0', { nuevoEstado: estadoFin, simboloEscribir: '0', moverDireccion: 'N' });
  positionHead.set('1', { nuevoEstado: estadoFin, simboloEscribir: '1', moverDireccion: 'N' });
  positionHead.set(BLANCO, { nuevoEstado: ns('q_update_position_head'), simboloEscribir: BLANCO, moverDireccion: 'D'});
  // Caso scratchpad vacío (cabezal en @)
  positionHead.set(SEP_INICIO, { nuevoEstado: estadoFin, simboloEscribir: SEP_INICIO, moverDireccion: 'N'});
  
  reglas.set(ns('q_update_position_head'), positionHead);
  
  return reglas;
}
import { FuncionTransicion } from '../../model/maquina-turing.model';
import { SEP_INICIO, SEP_FIN, SEP_HISTORIAL, BLANCO } from '../xor-shift.types';

/**
 * DETECCIÓN DE CICLO (VERSIÓN FINAL CON NAMESPACE)
 * Soporta 'namespace' para evitar colisiones de estados.
 */
export function crearSubrutinaDeteccion(
  estadoInicio: string, 
  estadoContinuar: string,
  estadoFinCiclo: string,
  namespace: string // <-- NUEVO PARÁMETRO
): FuncionTransicion {
  const reglas = new Map();
  const LEN_PALABRA = 6;

  // Helper para prefijar estados
  const ns = (nombre: string) => `${namespace}_${nombre}`;

  // ═══════════════════════════════════════════════════════════════
  // FASE 1: SINCRONIZACIÓN EN @
  // ═══════════════════════════════════════════════════════════════
  const goToStart = new Map();
  
  // Caso A: Ya estamos en @
  goToStart.set(SEP_INICIO, { nuevoEstado: ns('q_hist_copy_bit_i0'), simboloEscribir: SEP_INICIO, moverDireccion: 'D' });
  
  // Caso B: Estamos a la derecha
  for (const s of ['0', '1', SEP_FIN, SEP_HISTORIAL]) {
    goToStart.set(s, { nuevoEstado: estadoInicio, simboloEscribir: s, moverDireccion: 'I' });
  }
  
  // Caso C: Estamos en BLANCO
  goToStart.set(BLANCO, { nuevoEstado: estadoInicio, simboloEscribir: BLANCO, moverDireccion: 'I' });

  reglas.set(estadoInicio, goToStart);

  // ═══════════════════════════════════════════════════════════════
  // FASE 2: ESCRIBIR LA SEMILLA EN EL HISTORIAL
  // ═══════════════════════════════════════════════════════════════

  for (let i = 0; i < LEN_PALABRA; i++) {
    const copyBitState = ns(`q_hist_copy_bit_i${i}`);
    const gotoEndState0 = ns(`q_hist_goto_end_0_i${i}`);
    const gotoEndState1 = ns(`q_hist_goto_end_1_i${i}`);
    const returnState = ns(`q_hist_return_i${i}`);
    const nextCopyState = (i < LEN_PALABRA - 1) ? ns(`q_hist_copy_bit_i${i + 1}`) : ns('q_hist_write_final_sep');

    // 1. Leer el bit i de la Semilla y marcar
    const readMap = new Map();
    readMap.set('0', { nuevoEstado: gotoEndState0, simboloEscribir: 'A', moverDireccion: 'D' });
    readMap.set('1', { nuevoEstado: gotoEndState1, simboloEscribir: 'B', moverDireccion: 'D' });
    reglas.set(copyBitState, readMap);

    // 2. Ir al fin del historial
    const gotoEndMap0 = new Map();
    const gotoEndMap1 = new Map();
    for (const s of ['A', 'B', '0', '1', SEP_FIN, SEP_HISTORIAL]) {
      gotoEndMap0.set(s, { nuevoEstado: gotoEndState0, simboloEscribir: s, moverDireccion: 'D' });
      gotoEndMap1.set(s, { nuevoEstado: gotoEndState1, simboloEscribir: s, moverDireccion: 'D' });
    }
    // 3. Escribir el bit y volver
    gotoEndMap0.set(BLANCO, { nuevoEstado: returnState, simboloEscribir: '0', moverDireccion: 'I' });
    gotoEndMap1.set(BLANCO, { nuevoEstado: returnState, simboloEscribir: '1', moverDireccion: 'I' });
    reglas.set(gotoEndState0, gotoEndMap0);
    reglas.set(gotoEndState1, gotoEndMap1);
    
    // 4. Volver a la marca en la Semilla
    const returnMap = new Map();
    for (const s of ['0', '1', SEP_FIN, SEP_HISTORIAL, SEP_INICIO]) {
      returnMap.set(s, { nuevoEstado: returnState, simboloEscribir: s, moverDireccion: 'I' });
    }
    // 5. Al encontrar nuestra marca, limpiar y avanzar al siguiente bit
    returnMap.set('A', { nuevoEstado: nextCopyState, simboloEscribir: '0', moverDireccion: 'D' });
    returnMap.set('B', { nuevoEstado: nextCopyState, simboloEscribir: '1', moverDireccion: 'D' });
    reglas.set(returnState, returnMap);
  }

  // FASE 2-Final: Escribir separador $ y marcar '&'
  const writeFinalSep = new Map(); 
  for (const s of ['0', '1', SEP_FIN, SEP_HISTORIAL, 'A', 'B']) {
    writeFinalSep.set(s, { nuevoEstado: ns('q_hist_write_final_sep'), simboloEscribir: s, moverDireccion: 'D' });
  }
  writeFinalSep.set(BLANCO, { nuevoEstado: ns('q_hist_goto_hash'), simboloEscribir: '&', moverDireccion: 'I' });
  reglas.set(ns('q_hist_write_final_sep'), writeFinalSep);

  // Volver a #
  const gotoHash = new Map();
  for (const s of ['0', '1', SEP_HISTORIAL, '&']) {
    gotoHash.set(s, { nuevoEstado: ns('q_hist_goto_hash'), simboloEscribir: s, moverDireccion: 'I' });
  }
  gotoHash.set(SEP_FIN, { nuevoEstado: ns('q_hist_check_peek_entry'), simboloEscribir: SEP_FIN, moverDireccion: 'D' });
  reglas.set(ns('q_hist_goto_hash'), gotoHash);


  // ═══════════════════════════════════════════════════════════════
  // FASE 3: DETECCIÓN DE CICLOS
  // ═══════════════════════════════════════════════════════════════

  const peekEntry = new Map();
  peekEntry.set('0', { nuevoEstado: ns('q_hist_check_inner_loop_0'), simboloEscribir: '0', moverDireccion: 'N' }); 
  peekEntry.set('1', { nuevoEstado: ns('q_hist_check_inner_loop_0'), simboloEscribir: '1', moverDireccion: 'N' });
  peekEntry.set('&', { nuevoEstado: ns('q_hist_check_no_match_found'), simboloEscribir: SEP_HISTORIAL, moverDireccion: 'I' });
  peekEntry.set(SEP_HISTORIAL, { nuevoEstado: ns('q_hist_check_peek_entry'), simboloEscribir: SEP_HISTORIAL, moverDireccion: 'D' });
  peekEntry.set(BLANCO, { nuevoEstado: ns('q_hist_check_no_match_found'), simboloEscribir: BLANCO, moverDireccion: 'I' });

  reglas.set(ns('q_hist_check_peek_entry'), peekEntry);


  for (let i = 0; i < LEN_PALABRA; i++) {
    const innerLoopState = ns(`q_hist_check_inner_loop_${i}`);
    const nextInnerLoopState = (i < LEN_PALABRA - 1) ? ns(`q_hist_check_inner_loop_${i + 1}`) : ns('q_hist_check_MATCH');
    
    const readHistMap = new Map();
    readHistMap.set('0', { nuevoEstado: ns(`q_hist_check_goto_seed_0_${i}`), simboloEscribir: 'A', moverDireccion: 'I' }); 
    readHistMap.set('1', { nuevoEstado: ns(`q_hist_check_goto_seed_1_${i}`), simboloEscribir: 'B', moverDireccion: 'I' }); 
    reglas.set(innerLoopState, readHistMap);

    const gotoSeed0 = new Map();
    const gotoSeed1 = new Map();
    for(const s of ['0','1','A','B', SEP_FIN, SEP_HISTORIAL]) {
      gotoSeed0.set(s, { nuevoEstado: ns(`q_hist_check_goto_seed_0_${i}`), simboloEscribir: s, moverDireccion: 'I' });
      gotoSeed1.set(s, { nuevoEstado: ns(`q_hist_check_goto_seed_1_${i}`), simboloEscribir: s, moverDireccion: 'I' });
    }
    
    gotoSeed0.set(SEP_INICIO, { nuevoEstado: ns(`q_hist_check_apply_offset_0_${i}`), simboloEscribir: SEP_INICIO, moverDireccion: 'D' });
    gotoSeed1.set(SEP_INICIO, { nuevoEstado: ns(`q_hist_check_apply_offset_1_${i}`), simboloEscribir: SEP_INICIO, moverDireccion: 'D' });
    
    reglas.set(ns(`q_hist_check_goto_seed_0_${i}`), gotoSeed0);
    reglas.set(ns(`q_hist_check_goto_seed_1_${i}`), gotoSeed1);
    
    let currentOffsetState0 = ns(`q_hist_check_apply_offset_0_${i}`);
    let currentOffsetState1 = ns(`q_hist_check_apply_offset_1_${i}`);
    let mapOffset0: Map<string, any>;
    let mapOffset1: Map<string, any>;

    for (let j = 0; j < i; j++) {
        mapOffset0 = new Map();
        mapOffset1 = new Map();
        const nextOffsetState0 = ns(`q_hist_check_offset_0_i${i}_step${j + 1}`);
        const nextOffsetState1 = ns(`q_hist_check_offset_1_i${i}_step${j + 1}`);

        for (const s of ['0', '1']) {
            mapOffset0.set(s, { nuevoEstado: nextOffsetState0, simboloEscribir: s, moverDireccion: 'D' });
            mapOffset1.set(s, { nuevoEstado: nextOffsetState1, simboloEscribir: s, moverDireccion: 'D' });
        }
        mapOffset0.set(SEP_FIN, { nuevoEstado: ns(`q_hist_return_MISMATCH_${i}`), simboloEscribir: SEP_FIN, moverDireccion: 'D' });
        mapOffset1.set(SEP_FIN, { nuevoEstado: ns(`q_hist_return_MISMATCH_${i}`), simboloEscribir: SEP_FIN, moverDireccion: 'D' });
        
        reglas.set(currentOffsetState0, mapOffset0);
        reglas.set(currentOffsetState1, mapOffset1);

        currentOffsetState0 = nextOffsetState0;
        currentOffsetState1 = nextOffsetState1;
    }

    mapOffset0 = new Map(); 
    mapOffset1 = new Map(); 

    mapOffset0.set('0', { nuevoEstado: ns(`q_hist_return_MATCH_${i}`), simboloEscribir: '0', moverDireccion: 'D' }); 
    mapOffset0.set('1', { nuevoEstado: ns(`q_hist_return_MISMATCH_${i}`), simboloEscribir: '1', moverDireccion: 'D' }); 
    
    mapOffset1.set('0', { nuevoEstado: ns(`q_hist_return_MISMATCH_${i}`), simboloEscribir: '0', moverDireccion: 'D' }); 
    mapOffset1.set('1', { nuevoEstado: ns(`q_hist_return_MATCH_${i}`), simboloEscribir: '1', moverDireccion: 'D' }); 

    mapOffset0.set(SEP_FIN, { nuevoEstado: ns(`q_hist_return_MISMATCH_${i}`), simboloEscribir: SEP_FIN, moverDireccion: 'D' });
    mapOffset1.set(SEP_FIN, { nuevoEstado: ns(`q_hist_return_MISMATCH_${i}`), simboloEscribir: SEP_FIN, moverDireccion: 'D' });

    reglas.set(currentOffsetState0, mapOffset0);
    reglas.set(currentOffsetState1, mapOffset1);
    
    const returnMatch = new Map();
    const returnMismatch = new Map();
    const symbolsToCross = ['0', '1', 'A', 'B', SEP_FIN, SEP_HISTORIAL, SEP_INICIO];
    
    for (const s of symbolsToCross) {
      returnMatch.set(s, { nuevoEstado: ns(`q_hist_return_MATCH_${i}`), simboloEscribir: s, moverDireccion: 'D' });
      returnMismatch.set(s, { nuevoEstado: ns(`q_hist_return_MISMATCH_${i}`), simboloEscribir: s, moverDireccion: 'D' });
    }
    
    returnMatch.set('A', { nuevoEstado: nextInnerLoopState, simboloEscribir: '0', moverDireccion: 'D' });
    returnMatch.set('B', { nuevoEstado: nextInnerLoopState, simboloEscribir: '1', moverDireccion: 'D' });
    
    returnMismatch.set('A', { nuevoEstado: ns('q_hist_check_mismatch_return'), simboloEscribir: '0', moverDireccion: 'I' });
    returnMismatch.set('B', { nuevoEstado: ns('q_hist_check_mismatch_return'), simboloEscribir: '1', moverDireccion: 'I' });
    
    reglas.set(ns(`q_hist_return_MATCH_${i}`), returnMatch);
    reglas.set(ns(`q_hist_return_MISMATCH_${i}`), returnMismatch);
  }
  
  // ═══════════════════════════════════════════════════════════════
  // FASE 4: RESOLUCIÓN
  // ═══════════════════════════════════════════════════════════════

  const matchFound = new Map();
  matchFound.set('0', { nuevoEstado: ns('q_hist_check_mismatch_return'), simboloEscribir: '0', moverDireccion: 'I' });
  matchFound.set('1', { nuevoEstado: ns('q_hist_check_mismatch_return'), simboloEscribir: '1', moverDireccion: 'I' });
  matchFound.set(SEP_HISTORIAL, { nuevoEstado: ns('q_hist_check_find_ampersand'), simboloEscribir: SEP_HISTORIAL, moverDireccion: 'D' });
  matchFound.set('&', { nuevoEstado: ns('q_hist_check_no_match_found'), simboloEscribir: SEP_HISTORIAL, moverDireccion: 'I' });
  matchFound.set(BLANCO, { nuevoEstado: ns('q_hist_check_no_match_found'), simboloEscribir: BLANCO, moverDireccion: 'I' });
  reglas.set(ns('q_hist_check_MATCH'), matchFound);
  
  const findAmpersand = new Map();
  for (const s of ['0', '1', 'A', 'B', SEP_HISTORIAL]) {
    findAmpersand.set(s, { nuevoEstado: ns('q_hist_check_find_ampersand'), simboloEscribir: s, moverDireccion: 'D' });
  }
  findAmpersand.set('&', { nuevoEstado: ns('q_hist_check_cleanup_all'), simboloEscribir: SEP_HISTORIAL, moverDireccion: 'I' });
  findAmpersand.set(BLANCO, { nuevoEstado: ns('q_hist_check_cleanup_all'), simboloEscribir: BLANCO, moverDireccion: 'I' });
  reglas.set(ns('q_hist_check_find_ampersand'), findAmpersand);

  const mismatchReturn = new Map();
  for (const s of ['0', '1', 'A', 'B']) {
    mismatchReturn.set(s, { nuevoEstado: ns('q_hist_check_mismatch_return'), simboloEscribir: s, moverDireccion: 'I' });
  }
  mismatchReturn.set(SEP_FIN, { nuevoEstado: ns('q_hist_check_mismatch_cleanup_entry'), simboloEscribir: SEP_FIN, moverDireccion: 'D' });
  mismatchReturn.set(SEP_HISTORIAL, { nuevoEstado: ns('q_hist_check_mismatch_cleanup_entry'), simboloEscribir: SEP_HISTORIAL, moverDireccion: 'D' });
  mismatchReturn.set(BLANCO, { nuevoEstado: ns('q_hist_check_mismatch_cleanup_entry'), simboloEscribir: BLANCO, moverDireccion: 'D' });
  reglas.set(ns('q_hist_check_mismatch_return'), mismatchReturn);
  
  const mismatchCleanup = new Map();
  mismatchCleanup.set('A', { nuevoEstado: ns('q_hist_check_mismatch_cleanup_entry'), simboloEscribir: '0', moverDireccion: 'D' });
  mismatchCleanup.set('B', { nuevoEstado: ns('q_hist_check_mismatch_cleanup_entry'), simboloEscribir: '1', moverDireccion: 'D' });
  mismatchCleanup.set('0', { nuevoEstado: ns('q_hist_check_mismatch_cleanup_entry'), simboloEscribir: '0', moverDireccion: 'D' });
  mismatchCleanup.set('1', { nuevoEstado: ns('q_hist_check_mismatch_cleanup_entry'), simboloEscribir: '1', moverDireccion: 'D' });
  
  mismatchCleanup.set(SEP_HISTORIAL, { nuevoEstado: ns('q_hist_check_peek_entry'), simboloEscribir: SEP_HISTORIAL, moverDireccion: 'D' });
  mismatchCleanup.set('&', { nuevoEstado: ns('q_hist_check_no_match_found'), simboloEscribir: SEP_HISTORIAL, moverDireccion: 'I' });
  mismatchCleanup.set(BLANCO, { nuevoEstado: ns('q_hist_check_no_match_found'), simboloEscribir: BLANCO, moverDireccion: 'I' });
  reglas.set(ns('q_hist_check_mismatch_cleanup_entry'), mismatchCleanup);

  const noMatch = new Map();
  noMatch.set('A', { nuevoEstado: ns('q_hist_check_no_match_found'), simboloEscribir: '0', moverDireccion: 'I' });
  noMatch.set('B', { nuevoEstado: ns('q_hist_check_no_match_found'), simboloEscribir: '1', moverDireccion: 'I' });
  noMatch.set('0', { nuevoEstado: ns('q_hist_check_no_match_found'), simboloEscribir: '0', moverDireccion: 'I' });
  noMatch.set('1', { nuevoEstado: ns('q_hist_check_no_match_found'), simboloEscribir: '1', moverDireccion: 'I' });
  noMatch.set(SEP_HISTORIAL, { nuevoEstado: ns('q_hist_check_no_match_found'), simboloEscribir: SEP_HISTORIAL, moverDireccion: 'I' });
  noMatch.set('&', { nuevoEstado: ns('q_hist_check_no_match_found'), simboloEscribir: SEP_HISTORIAL, moverDireccion: 'I' });
  noMatch.set(SEP_FIN, { nuevoEstado: ns('q_hist_check_no_match_found'), simboloEscribir: SEP_FIN, moverDireccion: 'I' });
  noMatch.set(SEP_INICIO, { nuevoEstado: ns('q_hist_check_no_match_found'), simboloEscribir: SEP_INICIO, moverDireccion: 'I' });
  noMatch.set(BLANCO, { nuevoEstado: ns('q_hist_check_return_to_seed'), simboloEscribir: BLANCO, moverDireccion: 'D' });
  reglas.set(ns('q_hist_check_no_match_found'), noMatch);
  
  const cleanupAll = new Map();
  cleanupAll.set('A', { nuevoEstado: ns('q_hist_check_cleanup_all'), simboloEscribir: '0', moverDireccion: 'I' });
  cleanupAll.set('B', { nuevoEstado: ns('q_hist_check_cleanup_all'), simboloEscribir: '1', moverDireccion: 'I' });
  cleanupAll.set('0', { nuevoEstado: ns('q_hist_check_cleanup_all'), simboloEscribir: '0', moverDireccion: 'I' });
  cleanupAll.set('1', { nuevoEstado: ns('q_hist_check_cleanup_all'), simboloEscribir: '1', moverDireccion: 'I' });
  cleanupAll.set(SEP_HISTORIAL, { nuevoEstado: ns('q_hist_check_cleanup_all'), simboloEscribir: SEP_HISTORIAL, moverDireccion: 'I' });
  cleanupAll.set('&', { nuevoEstado: ns('q_hist_check_cleanup_all'), simboloEscribir: SEP_HISTORIAL, moverDireccion: 'I' });
  cleanupAll.set(SEP_FIN, { nuevoEstado: ns('q_hist_check_cleanup_all'), simboloEscribir: SEP_FIN, moverDireccion: 'I' });
  cleanupAll.set(SEP_INICIO, { nuevoEstado: ns('q_hist_check_cleanup_all'), simboloEscribir: SEP_INICIO, moverDireccion: 'I' });
  cleanupAll.set(BLANCO, { nuevoEstado: estadoFinCiclo, simboloEscribir: BLANCO, moverDireccion: 'N' }); 
  reglas.set(ns('q_hist_check_cleanup_all'), cleanupAll);

  const returnToSeed = new Map();
  for(const s of ['0','1', SEP_FIN, SEP_HISTORIAL, 'A', 'B']) {
      returnToSeed.set(s, { nuevoEstado: ns('q_hist_check_return_to_seed'), simboloEscribir: s, moverDireccion: 'D' });
  }
  returnToSeed.set('&', { nuevoEstado: ns('q_hist_check_return_to_seed'), simboloEscribir: SEP_HISTORIAL, moverDireccion: 'D' });
  
  returnToSeed.set(SEP_INICIO, { nuevoEstado: estadoContinuar, simboloEscribir: SEP_INICIO, moverDireccion: 'D' });
  
  reglas.set(ns('q_hist_check_return_to_seed'), returnToSeed);

  return reglas;
}
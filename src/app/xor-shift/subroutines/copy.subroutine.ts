import { FuncionTransicion } from '../../model/maquina-turing.model';
import { SEP_INICIO, SEP_FIN, SEP_HISTORIAL, BLANCO } from '../xor-shift.types';

/**
 * COPY (MODIFICADA CON LIMPIEZA)
 * Copia la semilla al área de cálculos (scratchpad) y restaura la semilla original.
 *
 * Flujo:
 * 1. Mueve al fin de la semilla (#).
 * 2. Busca bit no marcado (0/1) de derecha a izquierda.
 * 3. Marca (X/Y) y navega al scratchpad (izquierda de @).
 * 4. Escribe el bit en el blank más izquierdo.
 * 5. Repite hasta encontrar @.
 * 6. (NUEVO) Limpia las marcas X/Y de la semilla.
 * 7. Posiciona cabezal al inicio de la copia (en scratchpad).
 */
export function crearSubrutinaCopy(
  estadoInicio: string,
  estadoFin: string
): FuncionTransicion {
  const reglas = new Map();

  // ═══════════════════════════════════════════════════════════════
  // FASE 0: IR AL FIN DE LA SEMILLA (INICIALIZACIÓN)
  // ═══════════════════════════════════════════════════════════════
  const goToEnd = new Map();
  for (const s of ['0', '1', 'X', 'Y', SEP_HISTORIAL, BLANCO, SEP_INICIO]) {
    goToEnd.set(s, {
      nuevoEstado: 'q_copy_go_to_end',
      simboloEscribir: s,
      moverDireccion: 'D',
    });
  }
  goToEnd.set(SEP_FIN, {
    nuevoEstado: 'q_copy_find_next_bit',
    simboloEscribir: SEP_FIN,
    moverDireccion: 'I',
  });
  reglas.set('q_copy_go_to_end', goToEnd);
  reglas.set(estadoInicio, goToEnd);

  // ═══════════════════════════════════════════════════════════════
  // FASE 1: IR AL FIN DE LA SEMILLA (RESET PARA BÚSQUEDA)
  // ═══════════════════════════════════════════════════════════════
  const goToEndReset = new Map();
  for (const s of ['0', '1', 'X', 'Y', SEP_INICIO, SEP_HISTORIAL]) {
    goToEndReset.set(s, {
      nuevoEstado: 'q_copy_go_to_end_reset',
      simboloEscribir: s,
      moverDireccion: 'D',
    });
  }
  goToEndReset.set(SEP_FIN, {
    nuevoEstado: 'q_copy_find_next_bit',
    simboloEscribir: SEP_FIN,
    moverDireccion: 'I',
  });
  reglas.set('q_copy_go_to_end_reset', goToEndReset);

  // ═══════════════════════════════════════════════════════════════
  // FASE 2: BUSCAR SIGUIENTE BIT NO MARCADO (DE DERECHA A IZQUIERDA)
  // ═══════════════════════════════════════════════════════════════
  const findNextBit = new Map();
  findNextBit.set('X', {
    nuevoEstado: 'q_copy_find_next_bit',
    simboloEscribir: 'X',
    moverDireccion: 'I',
  });
  findNextBit.set('Y', {
    nuevoEstado: 'q_copy_find_next_bit',
    simboloEscribir: 'Y',
    moverDireccion: 'I',
  });
  findNextBit.set('0', {
    nuevoEstado: 'q_copy_navigate_0',
    simboloEscribir: 'X', // Marca 0 como X
    moverDireccion: 'I',
  });
  findNextBit.set('1', {
    nuevoEstado: 'q_copy_navigate_1',
    simboloEscribir: 'Y', // Marca 1 como Y
    moverDireccion: 'I',
  });
  // Si encontramos @ → Copia terminada → Iniciar limpieza
  findNextBit.set(SEP_INICIO, {
    nuevoEstado: 'q_copy_cleanup_start', // IR A FASE DE LIMPIEZA
    simboloEscribir: SEP_INICIO,
    moverDireccion: 'D', // Mover a la derecha para empezar a limpiar
  });
  reglas.set('q_copy_find_next_bit', findNextBit);

  // ═══════════════════════════════════════════════════════════════
  // FASE 3: NAVEGAR AL SCRATCHPAD (A IZQUIERDA)
  // ═══════════════════════════════════════════════════════════════
  const navigate0 = new Map();
  const navigate1 = new Map();
  for (const s of ['0', '1', 'X', 'Y']) {
    navigate0.set(s, {
      nuevoEstado: 'q_copy_navigate_0',
      simboloEscribir: s,
      moverDireccion: 'I',
    });
    navigate1.set(s, {
      nuevoEstado: 'q_copy_navigate_1',
      simboloEscribir: s,
      moverDireccion: 'I',
    });
  }
  navigate0.set(SEP_INICIO, {
    nuevoEstado: 'q_copy_find_blank_0',
    simboloEscribir: SEP_INICIO,
    moverDireccion: 'I',
  });
  navigate1.set(SEP_INICIO, {
    nuevoEstado: 'q_copy_find_blank_1',
    simboloEscribir: SEP_INICIO,
    moverDireccion: 'I',
  });
  reglas.set('q_copy_navigate_0', navigate0);
  reglas.set('q_copy_navigate_1', navigate1);

  // ═══════════════════════════════════════════════════════════════
  // FASE 4: ENCONTRAR POSICIÓN DE ESCRITURA (BLANK MÁS IZQUIERDO)
  // ═══════════════════════════════════════════════════════════════
  const findBlank0 = new Map();
  const findBlank1 = new Map();
  findBlank0.set('0', {
    nuevoEstado: 'q_copy_find_blank_0',
    simboloEscribir: '0',
    moverDireccion: 'I',
  });
  findBlank0.set('1', {
    nuevoEstado: 'q_copy_find_blank_0',
    simboloEscribir: '1',
    moverDireccion: 'I',
  });
  findBlank1.set('0', {
    nuevoEstado: 'q_copy_find_blank_1',
    simboloEscribir: '0',
    moverDireccion: 'I',
  });
  findBlank1.set('1', {
    nuevoEstado: 'q_copy_find_blank_1',
    simboloEscribir: '1',
    moverDireccion: 'I',
  });
  // Escribir el bit y volver a la FASE 1
  findBlank0.set(BLANCO, {
    nuevoEstado: 'q_copy_go_to_end_reset',
    simboloEscribir: '0',
    moverDireccion: 'D',
  });
  findBlank1.set(BLANCO, {
    nuevoEstado: 'q_copy_go_to_end_reset',
    simboloEscribir: '1',
    moverDireccion: 'D',
  });
  reglas.set('q_copy_find_blank_0', findBlank0);
  reglas.set('q_copy_find_blank_1', findBlank1);

  // ═══════════════════════════════════════════════════════════════
  // FASE 5 (NUEVA): LIMPIAR MARCAS EN LA SEMILLA
  // ═══════════════════════════════════════════════════════════════
  const cleanup = new Map();
  // Estamos justo a la derecha de @
  cleanup.set('X', {
    nuevoEstado: 'q_copy_cleanup_start',
    simboloEscribir: '0', // Restaurar X a 0
    moverDireccion: 'D',
  });
  cleanup.set('Y', {
    nuevoEstado: 'q_copy_cleanup_start',
    simboloEscribir: '1', // Restaurar Y a 1
    moverDireccion: 'D',
  });
  // Si encontramos #, la limpieza terminó. Ir a posicionar cabezal.
  cleanup.set(SEP_FIN, {
    nuevoEstado: 'q_copy_position_head',
    simboloEscribir: SEP_FIN,
    moverDireccion: 'I', // Mover a la izquierda para encontrar @
  });
  reglas.set('q_copy_cleanup_start', cleanup);

  // ═══════════════════════════════════════════════════════════════
  // FASE 6: POSICIONAR CABEZAL AL INICIO DEL SCRATCHPAD
  // ═══════════════════════════════════════════════════════════════
  const positionHead = new Map();
  // Ir hacia la izquierda buscando @
  for (const s of ['0', '1', SEP_FIN, SEP_HISTORIAL]) {
    positionHead.set(s, {
      nuevoEstado: 'q_copy_position_head',
      simboloEscribir: s,
      moverDireccion: 'I',
    });
  }
  // Encontrar @, moverse a la izquierda al scratchpad
  positionHead.set(SEP_INICIO, {
    nuevoEstado: 'q_copy_find_scratch_start',
    simboloEscribir: SEP_INICIO,
    moverDireccion: 'I',
  });
  reglas.set('q_copy_position_head', positionHead);

  // Subfase: Encontrar blank izquierdo y mover a primer bit
  const findScratchStart = new Map();
  findScratchStart.set('0', {
    nuevoEstado: 'q_copy_find_scratch_start',
    simboloEscribir: '0',
    moverDireccion: 'I',
  });
  findScratchStart.set('1', {
    nuevoEstado: 'q_copy_find_scratch_start',
    simboloEscribir: '1',
    moverDireccion: 'I',
  });
  // Encontrar BLANCO, moverse a la derecha al primer bit
  findScratchStart.set(BLANCO, {
    nuevoEstado: 'q_copy_move_to_first_bit',
    simboloEscribir: BLANCO,
    moverDireccion: 'D',
  });
  reglas.set('q_copy_find_scratch_start', findScratchStart);

  // Subfase: Mover a primer bit (inicio de copia)
  const moveToFirstBit = new Map();
  moveToFirstBit.set('0', {
    nuevoEstado: estadoFin, // ¡Terminado!
    simboloEscribir: '0',
    moverDireccion: 'N',
  });
  moveToFirstBit.set('1', {
    nuevoEstado: estadoFin, // ¡Terminado!
    simboloEscribir: '1',
    moverDireccion: 'N',
  });
  // Si el scratchpad estaba vacío, terminar
  moveToFirstBit.set(SEP_INICIO, {
    nuevoEstado: estadoFin,
    simboloEscribir: SEP_INICIO,
    moverDireccion: 'N',
  });
  reglas.set('q_copy_move_to_first_bit', moveToFirstBit);

  return reglas;
}
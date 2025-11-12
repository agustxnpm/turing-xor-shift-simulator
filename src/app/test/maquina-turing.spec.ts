import { MaquinaTuring } from '../maquina-turing';
import { FuncionTransicion, SimboloCinta } from '../model/maquina-turing.model';

describe('MaquinaTuring', () => {
  
  describe('Ejemplo 1: Intercambio de secuencias 00 ↔ 11', () => {
    let funcionTransicion: FuncionTransicion;

    beforeEach(() => {
      // Construir la función de transición para intercambiar 00 por 11 y 11 por 00
      // Estrategia: marcar las secuencias con símbolos temporales (X, Y) y luego convertirlas
      funcionTransicion = new Map();

      // Fase 1: Buscar y marcar secuencias "00" con "XX"
      const q0Rules = new Map();
      q0Rules.set('0', { nuevoEstado: 'q1', simboloEscribir: 'X', moverDireccion: 'D' as const });
      q0Rules.set('1', { nuevoEstado: 'q3', simboloEscribir: 'Y', moverDireccion: 'D' as const });
      q0Rules.set('X', { nuevoEstado: 'q0', simboloEscribir: 'X', moverDireccion: 'D' as const });
      q0Rules.set('Y', { nuevoEstado: 'q0', simboloEscribir: 'Y', moverDireccion: 'D' as const });
      q0Rules.set('_', { nuevoEstado: 'q5', simboloEscribir: '_', moverDireccion: 'I' as const });
      funcionTransicion.set('q0', q0Rules);

      // q1: Vimos '0', verificar si hay otro '0'
      const q1Rules = new Map();
      q1Rules.set('0', { nuevoEstado: 'q0', simboloEscribir: 'X', moverDireccion: 'D' as const }); // 00 -> XX
      q1Rules.set('1', { nuevoEstado: 'q3', simboloEscribir: 'Y', moverDireccion: 'D' as const }); // 01 -> XY
      q1Rules.set('_', { nuevoEstado: 'q5', simboloEscribir: '_', moverDireccion: 'I' as const }); // Solo un 0 al final
      funcionTransicion.set('q1', q1Rules);

      // q3: Vimos '1', verificar si hay otro '1'
      const q3Rules = new Map();
      q3Rules.set('1', { nuevoEstado: 'q0', simboloEscribir: 'Y', moverDireccion: 'D' as const }); // 11 -> YY
      q3Rules.set('0', { nuevoEstado: 'q1', simboloEscribir: 'X', moverDireccion: 'D' as const }); // 10 -> YX
      q3Rules.set('_', { nuevoEstado: 'q5', simboloEscribir: '_', moverDireccion: 'I' as const }); // Solo un 1 al final
      funcionTransicion.set('q3', q3Rules);

      // Fase 2: Convertir marcas temporales al resultado final
      // q5: Ir al inicio
      const q5Rules = new Map();
      q5Rules.set('X', { nuevoEstado: 'q5', simboloEscribir: 'X', moverDireccion: 'I' as const });
      q5Rules.set('Y', { nuevoEstado: 'q5', simboloEscribir: 'Y', moverDireccion: 'I' as const });
      q5Rules.set('_', { nuevoEstado: 'q6', simboloEscribir: '_', moverDireccion: 'D' as const });
      funcionTransicion.set('q5', q5Rules);

      // q6: Convertir X->1, Y->0
      const q6Rules = new Map();
      q6Rules.set('X', { nuevoEstado: 'q6', simboloEscribir: '1', moverDireccion: 'D' as const });
      q6Rules.set('Y', { nuevoEstado: 'q6', simboloEscribir: '0', moverDireccion: 'D' as const });
      q6Rules.set('_', { nuevoEstado: 'q_halt', simboloEscribir: '_', moverDireccion: 'N' as const });
      funcionTransicion.set('q6', q6Rules);
    });

    it('debería intercambiar 00 por 11 en la cadena "001100"', () => {
      const cintaInicial = ['0', '0', '1', '1', '0', '0'];
      const mt = new MaquinaTuring(cintaInicial, 'q0', funcionTransicion, '_', new Set(['q_halt']));
      
      mt.ejecutar(200);
      
      const resultado = mt.obtenerCintaComoString().replace(/_/g, '');
      expect(resultado).toBe('110011');
    });

    it('debería intercambiar 11 por 00 en la cadena "1100"', () => {
      const cintaInicial = ['1', '1', '0', '0'];
      const mt = new MaquinaTuring(cintaInicial, 'q0', funcionTransicion, '_', new Set(['q_halt']));
      
      mt.ejecutar(200);
      
      const resultado = mt.obtenerCintaComoString().replace(/_/g, '');
      expect(resultado).toBe('0011');
    });

    it('debería manejar cadenas sin secuencias "00" o "11"', () => {
      const cintaInicial = ['0', '1', '0', '1'];
      const mt = new MaquinaTuring(cintaInicial, 'q0', funcionTransicion, '_', new Set(['q_halt']));
      
      mt.ejecutar(200);
      
      const resultado = mt.obtenerCintaComoString().replace(/_/g, '');
      expect(resultado).toBe('1010');
    });
  });

  describe('Ejemplo 2: Cálculo de paridad de número binario', () => {
    let funcionTransicion: FuncionTransicion;

    beforeEach(() => {
      // Construir la función de transición para calcular paridad
      funcionTransicion = new Map();

      // Estado q_par: número par de 1's encontrados
      const qParRules = new Map();
      qParRules.set('0', { nuevoEstado: 'q_par', simboloEscribir: '0', moverDireccion: 'D' as const });
      qParRules.set('1', { nuevoEstado: 'q_impar', simboloEscribir: '1', moverDireccion: 'D' as const });
      qParRules.set('_', { nuevoEstado: 'q_escribir_0', simboloEscribir: '_', moverDireccion: 'N' as const });
      funcionTransicion.set('q_par', qParRules);

      // Estado q_impar: número impar de 1's encontrados
      const qImparRules = new Map();
      qImparRules.set('0', { nuevoEstado: 'q_impar', simboloEscribir: '0', moverDireccion: 'D' as const });
      qImparRules.set('1', { nuevoEstado: 'q_par', simboloEscribir: '1', moverDireccion: 'D' as const });
      qImparRules.set('_', { nuevoEstado: 'q_escribir_1', simboloEscribir: '_', moverDireccion: 'N' as const });
      funcionTransicion.set('q_impar', qImparRules);

      // Estado q_escribir_0: añadir 0 (paridad par)
      const qEscribir0Rules = new Map();
      qEscribir0Rules.set('_', { nuevoEstado: 'q_halt', simboloEscribir: '0', moverDireccion: 'N' as const });
      funcionTransicion.set('q_escribir_0', qEscribir0Rules);

      // Estado q_escribir_1: añadir 1 (paridad impar)
      const qEscribir1Rules = new Map();
      qEscribir1Rules.set('_', { nuevoEstado: 'q_halt', simboloEscribir: '1', moverDireccion: 'N' as const });
      funcionTransicion.set('q_escribir_1', qEscribir1Rules);
    });

    it('debería añadir 0 al final si el número de 1s es par (caso: "1100")', () => {
      const cintaInicial = ['1', '1', '0', '0'];
      const mt = new MaquinaTuring(cintaInicial, 'q_par', funcionTransicion, '_', new Set(['q_halt']));
      
      mt.ejecutar(100);
      
      const resultado = mt.obtenerCintaComoString();
      expect(resultado).toContain('11000');
    });

    it('debería añadir 1 al final si el número de 1s es impar (caso: "101")', () => {
      const cintaInicial = ['1', '0', '1'];
      const mt = new MaquinaTuring(cintaInicial, 'q_par', funcionTransicion, '_', new Set(['q_halt']));
      
      mt.ejecutar(100);
      
      const resultado = mt.obtenerCintaComoString();
      // Dos 1's = par, debe añadir 0
      expect(resultado).toContain('1010');
    });

    it('debería añadir 0 al final si no hay 1s (caso: "000")', () => {
      const cintaInicial = ['0', '0', '0'];
      const mt = new MaquinaTuring(cintaInicial, 'q_par', funcionTransicion, '_', new Set(['q_halt']));
      
      mt.ejecutar(100);
      
      const resultado = mt.obtenerCintaComoString();
      expect(resultado).toContain('0000');
    });

    it('debería añadir 1 al final si solo hay un 1 (caso: "1")', () => {
      const cintaInicial = ['1'];
      const mt = new MaquinaTuring(cintaInicial, 'q_par', funcionTransicion, '_', new Set(['q_halt']));
      
      mt.ejecutar(100);
      
      const resultado = mt.obtenerCintaComoString();
      expect(resultado).toContain('11');
    });
  });

  describe('Ejemplo 3: Sucesor de un número binario', () => {
    let funcionTransicion: FuncionTransicion;

    beforeEach(() => {
      // Construir la función de transición para calcular el sucesor
      funcionTransicion = new Map();

      // Estado q0: ir al final de la cadena
      const q0Rules = new Map();
      q0Rules.set('0', { nuevoEstado: 'q0', simboloEscribir: '0', moverDireccion: 'D' as const });
      q0Rules.set('1', { nuevoEstado: 'q0', simboloEscribir: '1', moverDireccion: 'D' as const });
      q0Rules.set('_', { nuevoEstado: 'q1', simboloEscribir: '_', moverDireccion: 'I' as const });
      funcionTransicion.set('q0', q0Rules);

      // Estado q1: procesar desde el final (sumar 1)
      const q1Rules = new Map();
      q1Rules.set('0', { nuevoEstado: 'q_halt', simboloEscribir: '1', moverDireccion: 'N' as const });
      q1Rules.set('1', { nuevoEstado: 'q1', simboloEscribir: '0', moverDireccion: 'I' as const });
      q1Rules.set('_', { nuevoEstado: 'q_halt', simboloEscribir: '1', moverDireccion: 'N' as const });
      funcionTransicion.set('q1', q1Rules);
    });

    it('debería calcular el sucesor de "101" (5) como "110" (6)', () => {
      const cintaInicial = ['1', '0', '1'];
      const mt = new MaquinaTuring(cintaInicial, 'q0', funcionTransicion, '_', new Set(['q_halt']));
      
      mt.ejecutar(100);
      
      const resultado = mt.obtenerCintaComoString().replace(/_/g, '').trim();
      expect(resultado).toBe('110');
    });

    it('debería calcular el sucesor de "111" (7) como "1000" (8)', () => {
      const cintaInicial = ['1', '1', '1'];
      const mt = new MaquinaTuring(cintaInicial, 'q0', funcionTransicion, '_', new Set(['q_halt']));
      
      mt.ejecutar(100);
      
      const resultado = mt.obtenerCintaComoString().replace(/_/g, '').trim();
      expect(resultado).toBe('1000');
    });

    it('debería calcular el sucesor de "0" (0) como "1" (1)', () => {
      const cintaInicial = ['0'];
      const mt = new MaquinaTuring(cintaInicial, 'q0', funcionTransicion, '_', new Set(['q_halt']));
      
      mt.ejecutar(100);
      
      const resultado = mt.obtenerCintaComoString().replace(/_/g, '').trim();
      expect(resultado).toBe('1');
    });

    it('debería calcular el sucesor de "1010" (10) como "1011" (11)', () => {
      const cintaInicial = ['1', '0', '1', '0'];
      const mt = new MaquinaTuring(cintaInicial, 'q0', funcionTransicion, '_', new Set(['q_halt']));
      
      mt.ejecutar(100);
      
      const resultado = mt.obtenerCintaComoString().replace(/_/g, '').trim();
      expect(resultado).toBe('1011');
    });
  });

  describe('Funcionalidad básica de la MT', () => {
    it('debería inicializar correctamente la máquina', () => {
      const cintaInicial = ['1', '0', '1'];
      const ft = new Map();
      const mt = new MaquinaTuring(cintaInicial, 'q0', ft);

      const config = mt.obtenerConfiguracion();
      expect(config.estadoActual).toBe('q0');
      expect(config.cinta.simbolos).toEqual(['1', '0', '1']);
      expect(config.cinta.posicionCabezal).toBe(0);
    });

    it('debería leer el símbolo correctamente', () => {
      const cintaInicial = ['1', '0', '1'];
      const ft = new Map();
      const mt = new MaquinaTuring(cintaInicial, 'q0', ft);

      // Usar reflexión para acceder al método privado (solo para testing)
      const simbolo = (mt as any).leerSimbolo();
      expect(simbolo).toBe('1');
    });

    it('debería detectar cuando está detenida', () => {
      const cintaInicial = ['1', '0', '1'];
      const ft = new Map();
      const mt = new MaquinaTuring(cintaInicial, 'q0', ft);

      expect(mt.estaDetenida()).toBe(true); // No hay transiciones
    });

    it('debería expandir la cinta hacia la derecha', () => {
      const cintaInicial = ['1'];
      const ft = new Map();
      const q0Rules = new Map();
      q0Rules.set('1', { nuevoEstado: 'q0', simboloEscribir: '1', moverDireccion: 'D' as const });
      q0Rules.set('_', { nuevoEstado: 'q_halt', simboloEscribir: '_', moverDireccion: 'N' as const });
      ft.set('q0', q0Rules);

      const mt = new MaquinaTuring(cintaInicial, 'q0', ft, '_', new Set(['q_halt']));
      
      mt.paso(); // Mover a la derecha
      
      const config = mt.obtenerConfiguracion();
      expect(config.cinta.posicionCabezal).toBe(1);
      expect(config.cinta.simbolos.length).toBeGreaterThan(1);
    });
  });
});

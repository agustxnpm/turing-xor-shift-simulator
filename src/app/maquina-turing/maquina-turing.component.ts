import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaquinaTuring as MaquinaTuringClass } from '../maquina-turing';
import { FuncionTransicion } from '../model/maquina-turing.model';
import { DiagramaEstados } from '../diagrama-estados/diagrama-estados';
import { OrquestadorXorShift } from '../xor-shift/orquestador-xor-shift';
import { ConfiguracionXorShift } from '../xor-shift/xor-shift.types';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-maquina-turing',
  imports: [CommonModule, DiagramaEstados, FormsModule],
  templateUrl: './maquina-turing.component.html',
  styleUrl: './maquina-turing.component.scss',
  standalone: true
})
export class MaquinaTuringComponent implements OnInit, OnDestroy {
  mt!: MaquinaTuringClass;
  
  private cintaInicial: string[] = [];
  estadoInicial: string = '';
  funcionTransicion!: FuncionTransicion;
  private simboloBlanco: string = '_';
  estadosAceptacion: Set<string> = new Set();
  
  // NUEVO: Variable para guardar la posición inicial correcta
  private posicionInicialCabezal: number = 0;
  
  private intervaloEjecucion: any = null;
  ejecutandose: boolean = false;
  velocidadEjecucion: number = 1; // Un poco más rápido por defecto

  // NUEVO: Contador de pasos ejecutados
  pasosEjecutados: number = 0;

  ngOnInit(): void {
    this.inicializarEjemploXorShift();
  }

  ngOnDestroy(): void {
    this.detenerEjecucion();
  }

  inicializarEjemploXorShift(): void {
    const config: ConfiguracionXorShift = {
      semillaInicial: '110010',
      desplazamientoA: 1,
      desplazamientoB: 3,
      desplazamientoC: 2
    };

    const orquestador = new OrquestadorXorShift(config);

    this.funcionTransicion = orquestador.obtenerFuncionTransicion();
    this.cintaInicial = orquestador.obtenerCintaInicial();
    
    // CORRECCIÓN CRÍTICA: Obtener la posición desde el orquestador
    this.posicionInicialCabezal = orquestador.obtenerPosicionInicialCabezal();
    
    this.estadoInicial = 'q_inicio';
    this.simboloBlanco = '_';
    this.estadosAceptacion = new Set(['q_HALT_CICLO_ENCONTRADO']); // Nombre real del estado final

    this.crearMaquina();
  }

  inicializarEjemploSucesor(): void {
    this.cintaInicial = ['1', '1', '1', '0', '1','1', '0'];
    this.estadoInicial = 'q0';
    this.simboloBlanco = '_';
    this.estadosAceptacion = new Set(['q_halt']);
    this.posicionInicialCabezal = 0; // El sucesor sí empieza en 0

    this.funcionTransicion = new Map();
    // ... (reglas del sucesor igual que antes)
    const q0Rules = new Map();
    q0Rules.set('0', { nuevoEstado: 'q0', simboloEscribir: '0', moverDireccion: 'D' });
    q0Rules.set('1', { nuevoEstado: 'q0', simboloEscribir: '1', moverDireccion: 'D' });
    q0Rules.set('_', { nuevoEstado: 'q1', simboloEscribir: '_', moverDireccion: 'I' });
    this.funcionTransicion.set('q0', q0Rules);

    const q1Rules = new Map();
    q1Rules.set('0', { nuevoEstado: 'q_halt', simboloEscribir: '1', moverDireccion: 'N' });
    q1Rules.set('1', { nuevoEstado: 'q1', simboloEscribir: '0', moverDireccion: 'I' });
    q1Rules.set('_', { nuevoEstado: 'q_halt', simboloEscribir: '1', moverDireccion: 'N' });
    this.funcionTransicion.set('q1', q1Rules);

    this.crearMaquina();
  }

  private crearMaquina(): void {
    // Pasar la posición inicial al constructor
    this.mt = new MaquinaTuringClass(
      [...this.cintaInicial],
      this.estadoInicial,
      this.funcionTransicion,
      this.simboloBlanco,
      this.estadosAceptacion,
      this.posicionInicialCabezal
    );
  }

  
  onPaso(): void {
    if (!this.mt.estaDetenida()) {
      this.mt.paso();
      this.pasosEjecutados++;
    }
  }

  onEjecutar(): void {
    if (this.ejecutandose) {
      this.detenerEjecucion();
      return;
    }
    this.ejecutandose = true;
    this.intervaloEjecucion = setInterval(() => {
      if (this.mt.estaDetenida()) {
        this.detenerEjecucion();
      } else {
        this.mt.paso();
        this.pasosEjecutados++;
      }
    }, this.velocidadEjecucion);
  }

  onEjecutarInstantanea(): void {
    if (this.mt.estaDetenida()) {
      return;
    }
    while (!this.mt.estaDetenida()) {
      this.mt.paso();
      this.pasosEjecutados++;
    }
  }

  private detenerEjecucion(): void {
    if (this.intervaloEjecucion) {
      clearInterval(this.intervaloEjecucion);
      this.intervaloEjecucion = null;
    }
    this.ejecutandose = false;
  }

  onReiniciar(): void {
    this.detenerEjecucion();
    this.crearMaquina();
    this.pasosEjecutados = 0;
  }

  obtenerCinta(): string[] {
    return this.mt.obtenerConfiguracion().cinta.simbolos;
  }

  obtenerPosicionCabezal(): number {
    return this.mt.obtenerConfiguracion().cinta.posicionCabezal;
  }

  obtenerEstadoActual(): string {
    return this.mt.obtenerConfiguracion().estadoActual;
  }

  estaEnEstadoAceptacion(): boolean {
    return this.mt.estaEnEstadoAceptacion();
  }

  estaDetenida(): boolean {
    return this.mt.estaDetenida();
  }
}
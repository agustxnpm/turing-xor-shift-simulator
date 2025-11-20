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
  velocidadEjecucion: number = 10; // Un poco más rápido por defecto

  // NUEVO: Contador de pasos ejecutados
  pasosEjecutados: number = 0;

  // Configuración editable desde UI
  semillaInicial: string = '110010';
  desplazamientoA: number = 1;
  desplazamientoB: number = 2;
  desplazamientoC: number = 1;

  ngOnInit(): void {
    this.inicializarEjemploXorShift();
  }

  ngOnDestroy(): void {
    this.detenerEjecucion();
  }

  get ciclosEjecutados(): number {
      if (this.contarEntradasHistorial() === 0) {
          return 0;
      }
    return this.contarEntradasHistorial() - 1;
  }

  private contarEntradasHistorial(): number {
    const cinta = this.obtenerCinta();
    const historial = cinta.join('').substring(24);
    const matches = historial.match(/\$/g);
    return matches ? matches.length : 0;
  }

  inicializarEjemploXorShift(): void {
    const config: ConfiguracionXorShift = {
      semillaInicial: this.semillaInicial,
      desplazamientoA: this.desplazamientoA,
      desplazamientoB: this.desplazamientoB,
      desplazamientoC: this.desplazamientoC
    };

    const orquestador = new OrquestadorXorShift(config);

    this.funcionTransicion = orquestador.obtenerFuncionTransicion();
    this.cintaInicial = orquestador.obtenerCintaInicial();
    
    this.posicionInicialCabezal = orquestador.obtenerPosicionInicialCabezal();
    
    this.estadoInicial = 'q_inicio';
    this.simboloBlanco = '_';
    this.estadosAceptacion = new Set(['q_HALT_CICLO_ENCONTRADO']);

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
      if (this.mt.estaDetenida()) {
        console.log('Contenido final de la cinta:', this.obtenerCinta().join(''));
      }
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
        console.log('Contenido final de la cinta:', this.obtenerCinta().join(''));
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
    console.log('Contenido final de la cinta:', this.obtenerCinta().join(''));
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

  reinicializarMaquina(): void {
    this.detenerEjecucion();
    this.inicializarEjemploXorShift();
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

import { Component, Input, OnChanges, SimpleChanges, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import * as d3 from 'd3';
import { FuncionTransicion } from '../model/maquina-turing.model';

interface Nodo {
  id: string;
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
  esInicial?: boolean;
  esAceptacion?: boolean;
}

interface Enlace {
  source: string | Nodo;
  target: string | Nodo;
  etiqueta: string;
}

@Component({
  selector: 'app-diagrama-estados',
  imports: [],
  templateUrl: './diagrama-estados.html',
  styleUrl: './diagrama-estados.scss',
  standalone: true
})
export class DiagramaEstados implements AfterViewInit, OnChanges {
  @ViewChild('svgContainer', { static: false }) svgContainer!: ElementRef;
  
  @Input() funcionTransicion!: FuncionTransicion;
  @Input() estadoActual: string = '';
  @Input() estadoInicial: string = '';
  @Input() estadosAceptacion: Set<string> = new Set();
  @Input() width: number = 600;
  @Input() height: number = 400;

  private svg: any;
  private g: any;
  private simulation: any;
  private nodos: Nodo[] = [];
  private enlaces: Enlace[] = [];

  ngAfterViewInit(): void {
    this.inicializarSVG();
    if (this.funcionTransicion) {
      this.construirGrafo();
      this.renderizarGrafo();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['funcionTransicion'] && !changes['funcionTransicion'].firstChange) {
      // Detener simulación anterior antes de reconstruir
      if (this.simulation) {
        this.simulation.stop();
      }
      this.construirGrafo();
      this.renderizarGrafo();
    }
    if (changes['estadoActual'] && !changes['estadoActual'].firstChange) {
      this.actualizarEstadoActual();
    }
  }

  private inicializarSVG(): void {
    const element = this.svgContainer.nativeElement;
    
    this.svg = d3.select(element)
      .append('svg')
      .attr('width', this.width)
      .attr('height', this.height)
      .attr('viewBox', `-100 -100 ${this.width + 200} ${this.height + 200}`);

    // Agregar zoom con mayor rango
    const zoom = d3.zoom()
      .scaleExtent([0.1, 5])
      .on('zoom', (event) => {
        this.g.attr('transform', event.transform);
      });

    this.svg.call(zoom);

    // Grupo principal
    this.g = this.svg.append('g');

    // Definir marcadores de flecha
    this.svg.append('defs').selectAll('marker')
      .data(['end', 'end-active'])
      .enter().append('marker')
      .attr('id', (d: string) => d)
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 25)
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', (d: string) => d === 'end-active' ? '#2c3e50' : '#7f8c8d');
  }

  private construirGrafo(): void {
    if (!this.funcionTransicion) return;

    const nodosSet = new Set<string>();
    this.enlaces = [];

    // Extraer nodos y enlaces de la función de transición
    this.funcionTransicion.forEach((transiciones, estadoOrigen) => {
      nodosSet.add(estadoOrigen);
      
      transiciones.forEach((transicion, simbolo) => {
        nodosSet.add(transicion.nuevoEstado);
        
        // Crear etiqueta de la transición
        const etiqueta = `${simbolo}/${transicion.simboloEscribir},${transicion.moverDireccion}`;
        
        // Buscar si ya existe un enlace entre estos dos estados
        const enlaceExistente = this.enlaces.find(e => 
          (e.source === estadoOrigen || (e.source as Nodo).id === estadoOrigen) && 
          (e.target === transicion.nuevoEstado || (e.target as Nodo).id === transicion.nuevoEstado)
        );
        
        if (enlaceExistente) {
          // Si existe, agregar la etiqueta
          enlaceExistente.etiqueta += '\n' + etiqueta;
        } else {
          // Si no existe, crear nuevo enlace
          this.enlaces.push({
            source: estadoOrigen,
            target: transicion.nuevoEstado,
            etiqueta: etiqueta
          });
        }
      });
    });

    // Crear nodos con propiedades adicionales
    this.nodos = Array.from(nodosSet).map(id => ({
      id,
      esInicial: id === this.estadoInicial,
      esAceptacion: this.estadosAceptacion.has(id)
    }));
  }

  private renderizarGrafo(): void {
    if (!this.g || this.nodos.length === 0) return;

    // Detener simulación anterior si existe
    if (this.simulation) {
      this.simulation.stop();
    }

    // Limpiar el contenido anterior
    this.g.selectAll('*').remove();

    // Crear simulación de fuerzas
    this.simulation = d3.forceSimulation(this.nodos)
      .force('link', d3.forceLink(this.enlaces)
        .id((d: any) => d.id)
        .distance(150))
      .force('charge', d3.forceManyBody().strength(-500))
      .force('center', d3.forceCenter(this.width / 2, this.height / 2))
      .force('collision', d3.forceCollide().radius(50));

    // Renderizar enlaces (flechas)
    const link = this.g.append('g')
      .attr('class', 'links')
      .selectAll('line')
      .data(this.enlaces)
      .enter().append('line')
      .attr('class', 'link')
      .attr('marker-end', 'url(#end)');

    // Renderizar etiquetas de enlaces
    const linkLabels = this.g.append('g')
      .attr('class', 'link-labels')
      .selectAll('text')
      .data(this.enlaces)
      .enter().append('text')
      .attr('class', 'link-label')
      .attr('text-anchor', 'middle')
      .selectAll('tspan')
      .data((d: Enlace) => d.etiqueta.split('\n').map(line => ({ line, enlace: d })))
      .enter().append('tspan')
      .attr('x', 0)
      .attr('dy', (_d: any, i: number) => i === 0 ? 0 : 12)
      .text((d: any) => d.line);

    // Renderizar nodos
    const node = this.g.append('g')
      .attr('class', 'nodes')
      .selectAll('g')
      .data(this.nodos)
      .enter().append('g')
      .attr('class', 'node')
      .call(d3.drag<any, Nodo>()
        .on('start', (event, d) => this.dragstarted(event, d))
        .on('drag', (event, d) => this.dragged(event, d))
        .on('end', (event, d) => this.dragended(event, d)));

    // Círculo del nodo
    node.append('circle')
      .attr('r', 20)
      .attr('class', (d: Nodo) => {
        let classes = 'node-circle';
        if (d.esInicial) classes += ' inicial';
        if (d.esAceptacion) classes += ' aceptacion';
        if (d.id === this.estadoActual) classes += ' activo';
        return classes;
      });

    // Círculo doble para estados de aceptación
    node.filter((d: Nodo) => d.esAceptacion)
      .append('circle')
      .attr('r', 17)
      .attr('class', 'node-circle-inner');

    // Flecha de entrada para estado inicial
    node.filter((d: Nodo) => d.esInicial)
      .append('line')
      .attr('x1', -40)
      .attr('y1', 0)
      .attr('x2', -22)
      .attr('y2', 0)
      .attr('class', 'initial-arrow')
      .attr('marker-end', 'url(#end)');

    // Etiqueta del nodo
    node.append('text')
      .attr('class', 'node-label')
      .attr('text-anchor', 'middle')
      .attr('dy', '.35em')
      .text((d: Nodo) => d.id);

    // Actualizar posiciones en cada tick
    this.simulation.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      linkLabels
        .attr('x', function(this: any) {
          const enlace = d3.select(this.parentNode).datum() as Enlace;
          return ((enlace.source as Nodo).x! + (enlace.target as Nodo).x!) / 2;
        })
        .attr('y', function(this: any) {
          const enlace = d3.select(this.parentNode).datum() as Enlace;
          return ((enlace.source as Nodo).y! + (enlace.target as Nodo).y!) / 2;
        });

      node.attr('transform', (d: Nodo) => `translate(${d.x},${d.y})`);
    });
  }

  private actualizarEstadoActual(): void {
    if (!this.g) return;

    this.g.selectAll('.node-circle')
      .attr('class', (d: Nodo) => {
        let classes = 'node-circle';
        if (d.esInicial) classes += ' inicial';
        if (d.esAceptacion) classes += ' aceptacion';
        if (d.id === this.estadoActual) classes += ' activo';
        return classes;
      });

    this.g.selectAll('.link')
      .attr('marker-end', (d: Enlace) => {
        const sourceId = typeof d.source === 'string' ? d.source : d.source.id;
        return sourceId === this.estadoActual ? 'url(#end-active)' : 'url(#end)';
      })
      .attr('class', (d: Enlace) => {
        const sourceId = typeof d.source === 'string' ? d.source : d.source.id;
        return sourceId === this.estadoActual ? 'link active' : 'link';
      });
  }

  private dragstarted(event: any, d: Nodo): void {
    if (!event.active) this.simulation.alphaTarget(0.3).restart();
    d.fx = d.x;
    d.fy = d.y;
  }

  private dragged(event: any, d: Nodo): void {
    d.fx = event.x;
    d.fy = event.y;
  }

  private dragended(event: any, d: Nodo): void {
    if (!event.active) this.simulation.alphaTarget(0);
    d.fx = null;
    d.fy = null;
  }
}

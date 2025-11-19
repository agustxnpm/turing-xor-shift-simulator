import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DiagramaEstados } from './diagrama-estados';

describe('DiagramaEstados', () => {
  let component: DiagramaEstados;
  let fixture: ComponentFixture<DiagramaEstados>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DiagramaEstados]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DiagramaEstados);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

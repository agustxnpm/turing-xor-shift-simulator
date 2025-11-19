import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MaquinaTuringComponent } from './maquina-turing.component';

describe('MaquinaTuringComponent', () => {
  let component: MaquinaTuringComponent;
  let fixture: ComponentFixture<MaquinaTuringComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MaquinaTuringComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MaquinaTuringComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

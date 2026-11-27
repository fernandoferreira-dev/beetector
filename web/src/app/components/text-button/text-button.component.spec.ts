import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TextButtonComponent } from './text-button.component';

describe('TextButtonComponent', () => {
  let component: TextButtonComponent;
  let fixture: ComponentFixture<TextButtonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TextButtonComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(TextButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProductResult } from './product-result';

describe('ProductResult', () => {
  let component: ProductResult;
  let fixture: ComponentFixture<ProductResult>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductResult]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProductResult);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

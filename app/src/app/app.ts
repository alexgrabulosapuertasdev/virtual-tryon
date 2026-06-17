import { Component } from '@angular/core';
import { ProductResult } from './product-result/product-result';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.scss',
  imports: [ProductResult],
})
export class App {}

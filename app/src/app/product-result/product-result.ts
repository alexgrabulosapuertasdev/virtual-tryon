import { ChangeDetectorRef, Component } from '@angular/core';
import { ProductResultService } from './product-result.service';
import { CommonModule } from '@angular/common';
import { catchError, finalize, throwError } from 'rxjs';

@Component({
  selector: 'app-product-result',
  templateUrl: './product-result.html',
  styleUrls: ['./product-result.scss'],
  imports: [CommonModule],
})
export class ProductResult {
  personFile: File | null = null;
  garmentFile: File | null = null;
  garmentType: string = 'top';

  personPreview: string | null = null;
  garmentPreview: string | null = null;

  loading = false;
  resultUrl: string | null = null;
  statusMessage = '';
  statusType: 'loading' | 'error' | 'success' | '' = '';

  constructor(
    private readonly productResultService: ProductResultService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  setGarmentType(type: string) {
    this.garmentType = type;
  }

  onPersonSelected(event: any) {
    const file = event.target.files[0];
    this.personFile = file;

    const reader = new FileReader();
    reader.onload = () => {
      this.personPreview = reader.result as string;
      this.cdr.detectChanges();
    };
    reader.readAsDataURL(file);
  }

  onGarmentSelected(event: any) {
    const file = event.target.files[0];
    this.garmentFile = file;

    const reader = new FileReader();
    reader.onload = () => {
      this.garmentPreview = reader.result as string;
      this.cdr.detectChanges();
    };
    reader.readAsDataURL(file);
  }

  async generateTryOn() {
    this.statusMessage = '';
    this.statusType = '';

    if (!this.personFile || !this.garmentFile) return;

    this.loading = true;
    this.statusMessage = 'Generando imagen...';
    this.statusType = 'loading';

    this.productResultService
      .generate(this.personFile, this.garmentFile, this.garmentType)
      .pipe(
        finalize(() => {
          this.loading = false;
          this.cdr.detectChanges();
        }),
        catchError((err) => {
          this.statusMessage =
            err?.message || 'Error en el servidor al generar la imagen.';
          this.statusType = 'error';
          console.error(
            { statusMessage: this.statusMessage, statusType: this.statusType },
            err,
          );
          return throwError(() => err);
        }),
      )
      .subscribe({
        next: (response: any) => {
          this.resultUrl = response.result_url;
          this.statusMessage = '¡Imagen generada correctamente!';
          this.statusType = 'success';
        },
      });
  }
}

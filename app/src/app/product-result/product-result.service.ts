import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environments';

@Injectable({
  providedIn: 'root',
})
export class ProductResultService {
  private apiUrlTryon = `${environment.apiUrl}/tryon`;

  constructor(private readonly http: HttpClient) {}

  generate(person: File, garment: File, type: string) {
    const formData = new FormData();
    formData.append('person_image', person);
    formData.append('garment_image', garment);
    formData.append('garment_type', type);

    return this.http.post(this.apiUrlTryon, formData);
  }
}

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config/dist/config.service';

@Injectable()
export class PythonAiClient {
  constructor(private readonly configService: ConfigService) {}

  async tryOn(data: any) {
    const formData = new FormData();

    formData.append(
      'person_image',
      new Blob([data.person.buffer]),
      data.person.originalname,
    );
    formData.append(
      'garment_image',
      new Blob([data.garment.buffer]),
      data.garment.originalname,
    );
    formData.append('garment_type', data.garmentType);

    const response = await fetch(
      `${this.configService.get('API_IA_URL')}/tryon`,
      {
        method: 'POST',
        body: formData as any,
      },
    );

    return await response.json();
  }
}

import { Injectable } from '@nestjs/common';
import { PythonAiClient } from '../../clients/python-ai.client';

@Injectable()
export class TryonService {
  constructor(private readonly pythonClient: PythonAiClient) {}

  async process(
    person: Express.Multer.File,
    garment: Express.Multer.File,
    garmentType: string,
  ) {
    const result = await this.pythonClient.tryOn({
      person,
      garment,
      garmentType,
    });

    return {
      status: 'success',
      result_url: result.result_url,
    };
  }
}

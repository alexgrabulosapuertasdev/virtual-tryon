import {
  Body,
  Controller,
  Post,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express/multer/interceptors/file-fields.interceptor';
import { TryonService } from './tryon.service';

@Controller('tryon')
export class TryonController {
  constructor(private readonly tryonService: TryonService) {}

  @Post()
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'person_image', maxCount: 1 },
      { name: 'garment_image', maxCount: 1 },
    ]),
  )
  async tryOn(
    @UploadedFiles()
    files: {
      person_image?: Express.Multer.File[];
      garment_image?: Express.Multer.File[];
    },
    @Body() body: { garment_type: string },
  ) {
    const person = files.person_image?.[0];
    const garment = files.garment_image?.[0];

    return this.tryonService.process(person, garment, body.garment_type);
  }
}

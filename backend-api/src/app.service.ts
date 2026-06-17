import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Welcome to the Virtual Try-On API! This API allows you to try on different products virtually using augmented reality technology. You can upload an image of yourself and select a product to see how it looks on you. Enjoy your virtual shopping experience!';
  }
}

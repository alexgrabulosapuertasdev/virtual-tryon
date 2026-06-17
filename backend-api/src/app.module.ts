import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TryonModule } from './modules/tryon/tryon.module';
import { ConfigModule } from '@nestjs/config/dist/config.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TryonModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

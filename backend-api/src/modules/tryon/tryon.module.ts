import { Module } from '@nestjs/common';
import { TryonController } from './tryon.controller';
import { PythonAiClient } from '../../clients/python-ai.client';
import { TryonService } from './tryon.service';

@Module({
  controllers: [TryonController],
  providers: [TryonService, PythonAiClient],
  exports: [TryonService, PythonAiClient],
})
export class TryonModule {}

import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { EncolamientoController } from './encolamiento/encolamiento.controller';
import { EncolamientoService } from './encolamiento/encolamiento.service';
import { EncolamientoModule } from './encolamiento/encolamiento.module';

@Module({
  imports: [EncolamientoModule],
  controllers: [AppController, EncolamientoController],
  providers: [AppService, EncolamientoService],
})
export class AppModule {}

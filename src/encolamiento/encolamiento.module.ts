import { Module } from '@nestjs/common';
import { EncolamientoController } from './encolamiento.controller';
import { EncolamientoService } from './encolamiento.service';

@Module({

    controllers: [EncolamientoController],
    providers: [EncolamientoService],
})
export class EncolamientoModule { }

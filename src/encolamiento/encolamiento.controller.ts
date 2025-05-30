import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { EncolamientoService } from './encolamiento.service';

@Controller('encolar')
export class EncolamientoController {
    constructor(private readonly encolamientoService: EncolamientoService) { }

    @Post()
    async encolarTarea(@Body() body: { n?: number; tipo?: string }) {
        return this.encolamientoService.enqueue(body);
    }

    @Get('status/:taskId')
    async getStatus(@Param('taskId') taskId: string) {
        return this.encolamientoService.getTaskStatus(taskId);
    }
}
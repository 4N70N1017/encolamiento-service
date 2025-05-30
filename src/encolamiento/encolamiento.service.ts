import { Injectable, BadRequestException, OnModuleInit } from '@nestjs/common';
import PQueue from 'p-queue';
import { randomUUID } from 'crypto';
import Redis from 'ioredis';

@Injectable()
export class EncolamientoService implements OnModuleInit {
    private queue: PQueue;
    private redis: Redis;

    constructor() {
        this.queue = new PQueue({ concurrency: 15 });
        this.redis = new Redis(); // Por defecto localhost:6379
    }

    async onModuleInit() {
        // Al iniciar, reprocesa tareas pendientes o en proceso
        const keys = await this.redis.keys('tarea:*');
        for (const key of keys) {
            const tarea = JSON.parse(await this.redis.get(key));
            if (tarea.estado === 'pendiente' || tarea.estado === 'procesando') {
                this.queue.add(() => this.handleRequest(tarea));
            }
        }
    }

    private async saveTask(task: any) {
        await this.redis.set(`tarea:${task.taskId}`, JSON.stringify({ ...task, estado: 'pendiente' }));
    }

    private async setTaskState(taskId: string, estado: string, extra: any = {}) {
        const key = `tarea:${taskId}`;
        const tarea = JSON.parse(await this.redis.get(key));
        await this.redis.set(key, JSON.stringify({ ...tarea, estado, ...extra }));
    }

    public async enqueue(data: any) {
        if (!data.n || typeof data.n !== 'number' || data.n < 1 || data.n > 1_000_000) {
            throw new BadRequestException('El valor de n debe ser un número entre 1 y 1,000,000');
        }
        const taskId = randomUUID();
        const task = { ...data, taskId };
        await this.saveTask(task);
        console.log(`Tarea encolada: ${taskId} tipo=${data.tipo ?? 'primo'} n=${data.n}`);
        return await this.queue.add(() => this.handleRequest(task));
    }

    private async handleRequest(data: any) {
        const { taskId } = data;
        await this.setTaskState(taskId, 'procesando');
        const tipo = data.tipo ?? 'primo';
        const n = data.n ?? 100000;
        let result: number;

        try {
            switch (tipo) {
                case 'fibonacci':
                    result = this.calculateFibonacci(n);
                    break;
                case 'factorial':
                    result = this.calculateFactorial(n);
                    break;
                case 'primo':
                default:
                    result = this.calculateNthPrime(n);
            }
            await this.setTaskState(taskId, 'completada', { result });
            console.log(`Fin de procesamiento: tarea=${taskId} tipo=${tipo} n=${n} resultado=${result}`);
            return { taskId, message: 'Procesado con éxito', tipo, n, result };
        } catch (error) {
            await this.setTaskState(taskId, 'error', { error: error.message });
            console.error(`Error en tarea ${taskId}:`, error);
            return { taskId, message: 'Error en el cálculo', tipo, n, error: error.message };
        }
    }

    public async getTaskStatus(taskId: string) {
        const data = await this.redis.get(`tarea:${taskId}`);
        if (!data) {
            return { taskId, message: 'No existe la tarea' };
        }
        return JSON.parse(data);
    }

    private calculateNthPrime(n: number): number {
        let count = 0;
        let num = 1;
        while (count < n) {
            num++;
            if (this.isPrime(num)) {
                count++;
            }
        }
        return num;
    }

    private calculateFibonacci(n: number): number {
        if (n <= 1) return n;
        let a = 0, b = 1, temp;
        for (let i = 2; i <= n; i++) {
            temp = a + b;
            a = b;
            b = temp;
            console.log(b);
        }
        return b;
    }

    private calculateFactorial(n: number): number {
        let result = 1;
        for (let i = 2; i <= n; i++) {
            result *= i;
            console.log(result);
        }
        return result;
    }

    private isPrime(num: number): boolean {
        if (num < 2) return false;
        for (let i = 2; i <= Math.sqrt(num); i++) {
            if (num % i === 0) return false;
        }
        return true;
    }
}
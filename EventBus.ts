// src/infrastructure/events/EventBus.ts
export class EventBus {
  private handlers = new Map<string, Function[]>();

  subscribe(eventType: string, handler: Function): void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, []);
    }
    this.handlers.get(eventType)!.push(handler);
  }

  async publish(event: any): Promise<void> {
    const handlers = this.handlers.get(event.type) || [];
    // Executa todos os handlers para o evento de forma assíncrona
    await Promise.all(handlers.map((h) => h(event)));
  }
}
export class LootManager {
  private loot: number = 0;
  
  constructor() {
  }

  increment(amount: number = 1): void {
    this.loot += amount;
  }

  getLoot(): number {
    return this.loot;
  }


  reset(): void {
    this.loot = 0;
  }
}

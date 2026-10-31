import { MetalPriceService, MetalPriceData } from '@/core/utils/metal-price-service';

export { MetalPriceService, MetalPriceData };

export class BullionService {
  static async fetchLiveRates() {
    return MetalPriceService.getLiveMetalPrices(true);
  }
}

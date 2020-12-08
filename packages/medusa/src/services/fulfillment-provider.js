import { MedusaError } from "medusa-core-utils"

/**
 * Helps retrive fulfillment providers
 */
class FulfillmentProviderService {
  constructor(container) {
    /** @private {logger} */
    this.container_ = container
  }

  async registerInstalledProviders(providers) {
    const { manager, fulfillmentProviderRepository } = this.container_
    const model = manager.getCustomRepository(fulfillmentProviderRepository)
    model.update({}, { is_installed: false })
    for (const p of providers) {
      const n = model.create({ id: p, is_installed: true })
      await model.save(n)
    }
  }

  async listFulfillmentOptions(providers) {
    const result = await Promise.all(
      providers.map(async p => {
        const provider = await this.retrieveProvider(p)
        return {
          provider_id: p,
          options: await provider.getFulfillmentOptions(),
        }
      })
    )

    return result
  }

  /**
   * @returns {FulfillmentService} the payment fulfillment provider
   */
  retrieveProvider(provider_id) {
    try {
      return this.container_[`fp_${provider_id}`]
    } catch (err) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `Could not find a fulfillment provider with id: ${provider_id}`
      )
    }
  }
}

export default FulfillmentProviderService

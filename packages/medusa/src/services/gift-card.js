import _ from "lodash"
import randomize from "randomatic"
import { BaseService } from "medusa-interfaces"
import { Validator, MedusaError } from "medusa-core-utils"

/**
 * Provides layer to manipulate gift cards.
 * @implements BaseService
 */
class GiftCardService extends BaseService {
  constructor({ manager, giftCardRepository, regionService, eventBusService }) {
    super()

    /** @private @const {EntityManager} */
    this.manager_ = manager

    /** @private @const {GiftCardRepository} */
    this.giftCardRepository_ = giftCardRepository

    /** @private @const {RegionService} */
    this.regionService_ = regionService

    /** @private @const {EventBus} */
    this.eventBus_ = eventBusService
  }

  withTransaction(transactionManager) {
    if (!transactionManager) {
      return this
    }

    const cloned = new GiftCardService({
      manager: transactionManager,
      giftCardRepository: this.giftCardRepository_,
      regionService: this.regionService_,
      eventBusService: this.eventBus_,
    })

    cloned.transactionManager_ = transactionManager

    return cloned
  }

  /**
   * Generates a 16 character gift card code
   * @return {string} the generated gift card code
   */
  generateCode_() {
    const code = [
      randomize("A0", 4),
      randomize("A0", 4),
      randomize("A0", 4),
      randomize("A0", 4),
    ].join("-")

    return code
  }

  /**
   * @param {Object} selector - the query object for find
   * @return {Promise} the result of the find operation
   */
  async list(selector = {}, config = { relations: [], skip: 0, take: 10 }) {
    const giftCardRepo = this.manager_.getCustomRepository(
      this.giftCardRepository_
    )

    const query = this.buildQuery_(selector, config)
    return giftCardRepo.find(query)
  }

  /**
   * Creates a gift card with provided data given that the data is validated.
   * @param {GiftCard} giftCard - the gift card data to create
   * @return {Promise<GiftCard>} the result of the create operation
   */
  async create(giftCard) {
    return this.atomicPhase_(async manager => {
      const giftCardRepo = manager.getCustomRepository(this.giftCardRepository_)

      if (!giftCard.region_id) {
        throw new MedusaError(
          MedusaError.Types.NOT_FOUND,
          `Gift card is missing region_id`
        )
      }

      // Will throw if region does not exist
      const region = await this.regionService_.retrieve(giftCard.region_id)

      const code = this.generateCode_()

      const toCreate = {
        code,
        region_id: region.id,
        ...giftCard,
      }

      const created = await giftCardRepo.create(toCreate)
      const result = await giftCardRepo.save(created)
      return result
    })
  }

  /**
   * Gets a gift card by id.
   * @param {string} giftCardId - id of gift card to retrieve
   * @return {Promise<GiftCard>} the gift card
   */
  async retrieve(giftCardId, relations = []) {
    const giftCardRepo = this.manager_.getCustomRepository(
      this.giftCardRepository_
    )

    const validatedId = this.validateId_(giftCardId)

    const giftCard = await giftCardRepo.findOne({
      where: { id: validatedId },
      relations,
    })

    if (!giftCard) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `Gift card with ${giftCardId} was not found`
      )
    }

    return giftCard
  }

  /**
   * Updates a giftCard.
   * @param {string} giftCardId - giftCard id of giftCard to update
   * @param {GiftCard} update - the data to update the giftCard with
   * @return {Promise} the result of the update operation
   */
  async update(giftCardId, update) {
    return this.atomicPhase_(async manager => {
      const giftCardRepo = manager.getCustomRepository(this.giftCardRepository_)

      const giftCard = await this.retrieve(giftCardId)

      const { region_id, ...rest } = update

      if (region_id && region_id !== giftCard.region_id) {
        const region = await this.regionService_.retrieve(region_id)
        giftCard.region_id = region.id
      }

      if (metadata) {
        giftCard.metadata = await this.setMetadata_(giftCard.id, metadata)
      }

      for (const [key, value] of Object.entries(rest)) {
        giftCard[key] = value
      }

      const updated = await giftCardRepo.save(giftCard)
      return updated
    })
  }

  /**
   * Deletes a gift card idempotently
   * @param {string} giftCardId - id of gift card to delete
   * @return {Promise} the result of the delete operation
   */
  async delete(giftCardId) {
    return this.atomicPhase_(async manager => {
      const giftCardRepo = manager.getCustomRepository(this.giftCardRepository_)

      const giftCard = await giftCardRepo.findOne({ where: { id: giftCardId } })

      if (!giftCard) return Promise.resolve()

      await giftCardRepo.softRemove(giftCard)

      return Promise.resolve()
    })
  }
}

export default GiftCardService
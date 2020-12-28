import _ from "lodash"
import { In } from "typeorm"
import { Validator, MedusaError } from "medusa-core-utils"
import { BaseService } from "medusa-interfaces"

/**
 * Provides layer to manipulate profiles.
 * @implements BaseService
 */
class ShippingProfileService extends BaseService {
  /** @param {
   *    shippingProfileModel: (ShippingProfileModel),
   *    productService: (ProductService),
   *    shippingOptionService: (ProductService),
   *  } */
  constructor({
    manager,
    shippingProfileRepository,
    productService,
    productRepository,
    shippingOptionService,
  }) {
    super()

    /** @private @const {EntityManager} */
    this.manager_ = manager

    /** @private @const {ShippingProfileRepository} */
    this.shippingProfileRepository_ = shippingProfileRepository

    /** @private @const {ProductService} */
    this.productService_ = productService

    /** @private @const {ProductReppsitory} */
    this.productRepository_ = productRepository

    /** @private @const {ShippingOptionService} */
    this.shippingOptionService_ = shippingOptionService
  }

  withTransaction(transactionManager) {
    if (!transactionManager) {
      return this
    }

    const cloned = new ShippingProfileService({
      manager: transactionManager,
      shippingProfileRepository: this.shippingProfileRepository_,
      productService: this.productService_,
      shippingOptionService: this.shippingOptionService_,
    })

    cloned.transactionManager_ = transactionManager

    return cloned
  }

  /**
   * @param {Object} selector - the query object for find
   * @return {Promise} the result of the find operation
   */
  async list(listOptions = { where: {}, relations: [], skip: 0, take: 10 }) {
    const shippingProfileRepo = this.manager_.getCustomRepository(
      this.shippingProfileRepository_
    )

    const query = {
      where: listOptions?.where || {},
      skip: listOptions?.skip || 0,
      take: listOptions?.take || 10,
    }

    if (listOptions.relations) {
      query.relations = listOptions.relations
    }

    return shippingProfileRepo.find(query)
  }

  async fetchOptionsByProductIds(productIds, filter) {
    const products = await this.productService_.list({
      where: { id: Any(productIds) },
      relations: ["profile", "profile.shipping_options"],
    })

    const profiles = products.map(p => p.profile)

    const optionIds = profiles.reduce(
      (acc, next) => acc.concat(next.shipping_options),
      []
    )

    const options = await Promise.all(
      optionIds.map(async option => {
        let canSend = true
        if (filter.region_id) {
          if (filter.region_id !== option.region_id) {
            canSend = false
          }
        }
        return canSend ? option : null
      })
    )

    return options.filter(o => !!o)
  }

  /**
   * Gets a profile by id.
   * Throws in case of DB Error and if profile was not found.
   * @param {string} profileId - the id of the profile to get.
   * @return {Promise<Product>} the profile document.
   */
  async retrieve(profileId, relations = []) {
    const profileRepository = this.manager_.getCustomRepository(
      this.shippingProfileRepository_
    )
    const validatedId = this.validateId_(profileId)

    const profile = await profileRepository.findOne({
      where: { id: validatedId },
      relations,
    })

    if (!profile) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `Profile with id: ${profileId} was not found`
      )
    }

    return profile
  }

  async retrieveDefault() {
    const profileRepository = this.manager_.getCustomRepository(
      this.shippingProfileRepository_
    )

    const profile = await profileRepository.findOne({
      where: { type: "default" },
    })

    return profile
  }

  /**
   * Creates a default shipping profile, if this does not already exist.
   * @return {Promise<ShippingProfile>} the shipping profile
   */
  async createDefault() {
    let profile = await this.retrieveDefault()

    if (!profile) {
      const profileRepository = this.manager_.getCustomRepository(
        this.shippingProfileRepository_
      )

      const p = await profileRepository.create({
        type: "default",
        name: "Default Shipping Profile",
      })

      profile = await profileRepository.save(p)
    }

    return profile
  }

  /**
   * Retrieves the default gift card profile
   * @return the shipping profile for gift cards
   */
  async retrieveGiftCardDefault() {
    const profileRepository = this.manager_.getCustomRepository(
      this.shippingProfileRepository_
    )

    const giftCardProfile = await profileRepository.findOne({
      where: { type: "gift_card" },
    })

    return giftCardProfile
  }

  /**
   * Creates a default shipping profile, for gift cards if unless it already
   * exists.
   * @return {Promise<ShippingProfile>} the shipping profile
   */
  async createGiftCardDefault() {
    let profile = await this.retrieveGiftCardDefault()

    if (!profile) {
      const profileRepository = this.manager_.getCustomRepository(
        this.shippingProfileRepository_
      )

      const p = await profileRepository.create({
        type: "gift_card",
        name: "Gift Card Profile",
      })

      profile = await profileRepository.save(p)
    }

    return profile
  }

  /**
   * Creates a new shipping profile.
   * @param {ShippingProfile} profile - the shipping profile to create from
   * @return {Promise} the result of the create operation
   */
  async create(profile) {
    return this.atomicPhase_(async manager => {
      const profileRepository = manager.getCustomRepository(
        this.shippingProfileRepository_
      )

      if (profile.products || profile.shipping_options) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          "Please add products and shipping_options after creating Shipping Profiles"
        )
      }

      const created = await profileRepository.create(profile)
      const result = await profileRepository.save(created)
      return result
    })
  }

  /**
   * Updates a profile. Metadata updates and product updates should use
   * dedicated methods, e.g. `setMetadata`, `addProduct`, etc. The function
   * will throw errors if metadata or product updates are attempted.
   * @param {string} profileId - the id of the profile. Must be a string that
   *   can be casted to an ObjectId
   * @param {object} update - an object with the update values.
   * @return {Promise} resolves to the update result.
   */
  async update(profileId, update) {
    return this.atomicPhase_(async manager => {
      const profileRepository = manager.getCustomRepository(
        this.shippingProfileRepository_
      )

      const profile = await this.retrieve(profileId, [
        "products",
        "products.profile",
        "shipping_options",
        "shipping_options.profile",
      ])

      const { metadata, products, shipping_options, ...rest } = update

      if (metadata) {
        profile.metadata = this.setMetadata_(profile, metadata)
      }

      if (products) {
        // We use the set to ensure that the array doesn't include duplicates
        const productSet = new Set(products)

        // Go through each product and ensure they exist and if they are found in
        // other profiles that they are removed from there.
        profile.products = await Promise.all(
          [...productSet].map(async product => {
            // Ensure that every product only exists in exactly one profile
            if (product.profile && product.profile.id !== profile.id) {
              await this.removeProduct(product.profile.id, product.id)
            }

            return product
          })
        )
      }

      if (shipping_options) {
        // No duplicates
        const optionSet = new Set(shipping_options)

        profile.shipping_options = await Promise.all(
          [...optionSet].map(async so => {
            // If the shipping method exists in a different profile remove it
            if (so.profile && so.profile.id !== profile.id) {
              await this.removeShippingOption(so.profile.id, so.id)
            }

            return so
          })
        )
      }

      for (const [key, value] of Object.entries(rest)) {
        profile[key] = value
      }

      const result = await profileRepository.save(profile)
      return result
    })
  }

  /**
   * Deletes a profile with a given profile id.
   * @param {string} profileId - the id of the profile to delete. Must be
   *   castable as an ObjectId
   * @return {Promise} the result of the delete operation.
   */
  async delete(profileId) {
    return this.atomicPhase_(async manager => {
      const profileRepo = manager.getCustomRepository(
        this.shippingProfileRepository_
      )

      // Should not fail, if profile does not exist, since delete is idempotent
      const profile = await profileRepo.findOne({ where: { id: profileId } })

      if (!profile) return Promise.resolve()

      await profileRepo.softRemove(profile)

      return Promise.resolve()
    })
  }

  /**
   * Adds a product to a profile. The method is idempotent, so multiple calls
   * with the same product variant will have the same result.
   * @param {string} profileId - the profile to add the product to.
   * @param {string} productId - the product to add.
   * @return {Promise} the result of update
   */
  async addProduct(profileId, productId) {
    return this.atomicPhase_(async manager => {
      const profileRepository = manager.getCustomRepository(
        this.shippingProfileRepository_
      )

      const profile = await this.retrieve(profileId, ["products"])

      // If profile already has given product, we return an empty promise
      if (profile.products.find(p => p.id === profileId)) {
        return Promise.resolve()
      }

      const product = await this.productService_
        .withTransaction(manager)
        .retrieve(productId)

      profile.products = [...profile.products, product]

      const updated = await profileRepository.save(profile)
      return updated
    })
  }

  /**
   * Adds a shipping option to the profile. The shipping option can be used to
   * fulfill the products in the products field.
   * @param {string} profileId - the profile to apply the shipping option to
   * @param {string} optionId - the option to add to the profile
   * @return {Promise} the result of the model update operation
   */
  async addShippingOption(profileId, optionId) {
    const profile = await this.retrieve(profileId, ["shipping_options"])
    const shippingOption = await this.shippingOptionService_.retrieve(optionId)

    // Make sure that option doesn't already exist
    if (profile.shipping_options.find(o => o === shippingOption.id)) {
      // If the option already exists in the profile we just return an
      // empty promise for then-chaining
      return Promise.resolve()
    }

    // If the shipping method exists in a different profile remove it

    // DET ER HER JEG NÅEDE TIL SEB

    const profiles = await this.list({ shipping_options: shippingOption._id })
    if (profiles.length > 0) {
      await this.removeShippingOption(profiles[0]._id, shippingOption._id)
    }

    // Everything went well add the shipping option
    return this.profileModel_.updateOne(
      { _id: profileId },
      { $push: { shipping_options: shippingOption._id } }
    )
  }

  /**
   * Delete a shipping option from a profile.
   * @param {string} profileId - the profile to delete an option from
   * @param {string} optionId - the option to delete
   * @return {Promise} return the result of update
   */
  async removeShippingOption(profileId, optionId) {
    const profile = await this.retrieve(profileId)

    return this.profileModel_.updateOne(
      { _id: profile._id },
      { $pull: { shipping_options: optionId } }
    )
  }

  /**
   * Removes a product from the a profile.
   * @param {string} profileId - the profile to remove the product from
   * @param {string} productId - the product to remove
   * @return {Promise} the result of update
   */
  async removeProduct(profileId, productId) {
    const profile = await this.retrieve(profileId)

    if (!profile.products.find(p => p === productId)) {
      // Remove is idempotent
      return Promise.resolve()
    }

    return this.profileModel_.updateOne(
      { _id: profile._id },
      { $pull: { products: productId } }
    )
  }

  /**
   * Decorates a profile.
   * @param {Profile} profile - the profile to decorate.
   * @param {string[]} fields - the fields to include.
   * @param {string[]} expandFields - fields to expand.
   * @return {Profile} return the decorated profile.
   */
  async decorate(profile, fields, expandFields = []) {
    const requiredFields = ["_id", "metadata"]
    let decorated = _.pick(profile, fields.concat(requiredFields))

    if (expandFields.includes("products") && profile.products) {
      decorated.products = await Promise.all(
        profile.products.map(pId => this.productService_.retrieve(pId))
      )
    }

    if (expandFields.includes("shipping_options") && profile.shipping_options) {
      decorated.shipping_options = await Promise.all(
        profile.shipping_options.map(oId =>
          this.shippingOptionService_.retrieve(oId)
        )
      )
    }

    const final = await this.runDecorators_(decorated)
    return final
  }

  /**
   * Returns a list of all the productIds in the cart.
   * @param {Cart} cart - the cart to extract products from
   * @return {[string]} a list of product ids
   */
  getProductsInCart_(cart) {
    return cart.items.reduce((acc, next) => {
      if (Array.isArray(next.content)) {
        next.content.forEach(({ product }) => {
          if (!acc.includes(product._id)) {
            acc.push(product._id)
          }
        })
      } else {
        // We may have line items that are not associated with a product
        if (next.content.product) {
          if (!acc.includes(next.content.product._id)) {
            acc.push(next.content.product._id)
          }
        }
      }

      return acc
    }, [])
  }

  /**
   * Finds all the shipping profiles that cover the products in a cart, and
   * validates all options that are available for the cart.
   * @param {Cart} cart - the cart object to find shipping options for
   * @return {[ShippingOptions]} a list of the available shipping options
   */
  async fetchCartOptions(cart) {
    const products = this.getProductsInCart_(cart)
    const profiles = await this.list({ products: { $in: products } })
    const optionIds = profiles.reduce(
      (acc, next) => acc.concat(next.shipping_options),
      []
    )

    const options = await Promise.all(
      optionIds.map(async oId => {
        const option = await this.shippingOptionService_
          .validateCartOption(oId, cart)
          .catch(_ => {
            // If validation failed we skip the option
            return null
          })

        if (option) {
          return {
            ...option,
            profile: profiles.find(p => p._id.equals(option.profile_id)),
          }
        }
        return null
      })
    )

    return options.filter(o => !!o)
  }

  /**
   * Dedicated method to set metadata for a profile.
   * @param {string} profileId - the profile to decorate.
   * @param {string} key - key for metadata field
   * @param {string} value - value for metadata field.
   * @return {Promise} resolves to the updated result.
   */
  async setMetadata(profileId, key, value) {
    const validatedId = this.validateId_(profileId)

    if (typeof key !== "string") {
      throw new MedusaError(
        MedusaError.Types.INVALID_ARGUMENT,
        "Key type is invalid. Metadata keys must be strings"
      )
    }

    const keyPath = `metadata.${key}`
    return this.profileModel_
      .updateOne({ _id: validatedId }, { $set: { [keyPath]: value } })
      .catch(err => {
        throw new MedusaError(MedusaError.Types.DB_ERROR, err.message)
      })
  }

  /**
   * Dedicated method to delete metadata for a shipping profile.
   * @param {string} profileId - the shipping profile to delete metadata from.
   * @param {string} key - key for metadata field
   * @return {Promise} resolves to the updated result.
   */
  async deleteMetadata(profileId, key) {
    const validatedId = this.validateId_(profileId)

    if (typeof key !== "string") {
      throw new MedusaError(
        MedusaError.Types.INVALID_ARGUMENT,
        "Key type is invalid. Metadata keys must be strings"
      )
    }

    const keyPath = `metadata.${key}`
    return this.profileModel_
      .updateOne({ _id: validatedId }, { $unset: { [keyPath]: "" } })
      .catch(err => {
        throw new MedusaError(MedusaError.Types.DB_ERROR, err.message)
      })
  }
}

export default ShippingProfileService

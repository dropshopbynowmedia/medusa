import mongoose from "mongoose"
import _ from "lodash"
import { Validator, MedusaError, compareObjectsByProp } from "medusa-core-utils"
import { BaseService } from "medusa-interfaces"

/**
 * Provides layer to manipulate products.
 * @implements BaseService
 */
class ProductService extends BaseService {
  static Events = {
    UPDATED: "product.updated",
    CREATED: "product.created",
  }

  constructor({
    manager,
    productRepository,
    productVariantRepository,
    productOptionRepository,
    eventBusService,
    productVariantService,
  }) {
    super()

    /** @private @const {EntityManager} */
    this.manager_ = manager

    /** @private @const {ProductOption} */
    this.productOptionRepository_ = productOptionRepository

    /** @private @const {Product} */
    this.productRepository_ = productRepository

    /** @private @const {ProductVariant} */
    this.productVariantRepository_ = productVariantRepository

    /** @private @const {EventBus} */
    this.eventBus_ = eventBusService

    /** @private @const {ProductVariantService} */
    this.productVariantService_ = productVariantService
  }

  withTransaction(transactionManager) {
    if (!transactionManager) {
      return this
    }

    const cloned = new ProductService({
      manager: transactionManager,
      productRepository: this.productRepository_,
      productOptionRepository: this.productOptionRepository_,
      eventBusService: this.eventBus_,
      productVariantService: this.productVariantService_,
    })

    cloned.transactionManager_ = transactionManager

    return cloned
  }

  /**
   * Used to validate product ids. Throws an error if the cast fails
   * @param {string} rawId - the raw product id to validate.
   * @return {string} the validated id
   */
  validateId_(rawId) {
    return rawId
  }

  /**
   * @param {Object} selector - the query object for find
   * @return {Promise} the result of the find operation
   */
  list(selector, relations = [], skip, take) {
    const productRepo = this.manager_.getCustomRepository(
      this.productRepository_
    )

    return productRepo.find({ where: selector, skip, take, relations })
  }

  /**
   * Return the total number of documents in database
   * @return {Promise} the result of the count operation
   */
  count() {
    const productRepo = this.manager_.getCustomRepository(
      this.productRepository_
    )
    return productRepo.count()
  }

  /**
   * Gets a product by id.
   * Throws in case of DB Error and if product was not found.
   * @param {string} productId - id of the product to get.
   * @return {Promise<Product>} the result of the find one operation.
   */
  async retrieve(productId, relations = []) {
    return this.atomicPhase_(async manager => {
      const productRepo = manager.getCustomRepository(this.productRepository_)
      const validatedId = this.validateId_(productId)

      const product = await productRepo.findOne({
        where: { id: validatedId },
        relations,
      })

      if (!product) {
        throw new MedusaError(
          MedusaError.Types.NOT_FOUND,
          `Product with id: ${productId} was not found`
        )
      }

      return product
    })
  }

  /**
   * Gets all variants belonging to a product.
   * @param {string} productId - the id of the product to get variants from.
   * @return {Promise} an array of variants
   */
  async retrieveVariants(productId) {
    const productRepo = this.manager_.getCustomRepository(
      this.productRepository_
    )

    const product = await productRepo.findOne({
      where: { id: productId },
      relations: ["variants"],
    })

    return product.variants
  }

  /**
   * Creates a product.
   * @param {object} productObject - the product to create
   * @return {Promise} resolves to the creation result.
   */
  async create(productObject) {
    return this.atomicPhase_(async manager => {
      const productRepo = manager.getCustomRepository(this.productRepository_)
      const optionRepo = manager.getCustomRepository(
        this.productOptionRepository_
      )

      const product = await productRepo.create(productObject)

      product.options = await Promise.all(
        productObject.options.map(async o => {
          const res = await optionRepo.create({ ...o, product_id: product.id })
          await optionRepo.save(res)
          return res
        })
      )

      const result = await productRepo.save(product)

      await this.eventBus_
        .withTransaction(manager)
        .emit(ProductService.Events.CREATED, result)
      return result
    })
  }

  /**
   * Creates an publishes product.
   * @param {string} productId - ID of the product to publish.
   * @return {Promise} resolves to the creation result.
   */
  async publish(productId) {
    return this.atomicPhase_(async manager => {
      const productRepo = manager.getCustomRepository(this.productRepository_)
      const product = await this.retrieve(productId)

      product.published = true

      const result = await productRepo.save(product)

      await this.eventBus_
        .withTransaction(manager)
        .emit(ProductService.Events.UPDATED, result)
      return result
    })
  }

  /**
   * Updates a product. Product variant updates should use dedicated methods,
   * e.g. `addVariant`, etc. The function will throw errors if metadata or
   * product variant updates are attempted.
   * @param {string} productId - the id of the product. Must be a string that
   *   can be casted to an ObjectId
   * @param {object} update - an object with the update values.
   * @return {Promise} resolves to the update result.
   */
  async update(productId, update) {
    return this.atomicPhase_(async manager => {
      const productRepo = manager.getCustomRepository(this.productRepository_)
      const productVariantRepo = manager.getCustomRepository(
        this.productVariantRepository_
      )

      const product = await this.retrieve(productId, ["variants"])

      const { variants, metadata, options, ...rest } = update

      if (metadata) {
        product.metadata = this.setMetadata_(product, metadata)
      }

      if (variants) {
        // Iterate product variants and update their properties accordingly
        for (const variant of product.variants) {
          const exists = variants.find(v => v.id && variant.id === v.id)
          if (!exists) {
            await productVariantRepo.remove(variant)
          }
        }

        for (const newVariant of variants) {
          if (newVariant.id) {
            const variant = product.variants.find(v => v.id === newVariant.id)

            if (!variant) {
              throw new MedusaError(
                MedusaError.Types.NOT_FOUND,
                `Variant with id: ${newVariant.id} is not associated with this product`
              )
            }

            await this.productVariantService_.update(variant, newVariant)
          } else {
            // If the provided variant does not have an id, we assume that it
            // should be created
            await this.productVariantService_.create(product.id, variant)
          }
        }
      }

      for (const [key, value] of Object.entries(rest)) {
        product[key] = value
      }

      const result = await productRepo.save(product)
      await this.eventBus_
        .withTransaction(manager)
        .emit(ProductService.Events.UPDATED, result)
      return result
    })
  }

  /**
   * Deletes a product from a given product id. The product's associated
   * variants will also be deleted.
   * @param {string} productId - the id of the product to delete. Must be
   *   castable as an ObjectId
   * @return {Promise} empty promise
   */
  async delete(productId) {
    return this.atomicPhase_(async manager => {
      const productRepo = manager.getCustomRepository(this.productRepository_)

      // Should not fail, if product does not exist, since delete is idempotent
      const product = await productRepo.findOne({ where: { id: productId } })

      if (!product) return Promise.resolve()

      await productRepo.softRemove(product)

      return Promise.resolve()
    })
  }

  /**
   * Adds an option to a product. Options can, for example, be "Size", "Color",
   * etc. Will update all the products variants with a dummy value for the newly
   * created option. The same option cannot be added more than once.
   * @param {string} productId - the product to apply the new option to
   * @param {string} optionTitle - the display title of the option, e.g. "Size"
   * @return {Promise} the result of the model update operation
   */
  async addOption(productId, optionTitle) {
    return this.atomicPhase_(async manager => {
      const productOptionRepo = manager.getCustomRepository(
        this.productOptionRepository_
      )

      const product = await this.retrieve(productId, ["options", "variants"])

      if (product.options.find(o => o.title === optionTitle)) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          `An option with the title: ${optionTitle} already exists`
        )
      }

      const option = await productOptionRepo.create({
        title: optionTitle,
        product_id: productId,
      })

      const result = await productOptionRepo.save(option)

      for (const variant of product.variants) {
        this.productVariantService_.addOptionValue(
          variant.id,
          option.id,
          "Default Value"
        )
      }

      await this.eventBus_
        .withTransaction(manager)
        .emit(ProductService.Events.UPDATED, result)
      return result
    })
  }

  async reorderVariants(productId, variantOrder) {
    return this.atomicPhase_(async manager => {
      const productRepo = manager.getCustomRepository(this.productRepository_)

      const product = await this.retrieve(productId, ["variants"])

      if (product.variants.length !== variantOrder.length) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          `Product variants and new variant order differ in length.`
        )
      }

      product.variants = variantOrder.map(vId => {
        const variant = product.variants.find(v => v.id === vId)
        if (!variant) {
          throw new MedusaError(
            MedusaError.Types.INVALID_DATA,
            `Product has no variant with id: ${vId}`
          )
        }

        return variant
      })

      const result = productRepo.save(product)
      await this.eventBus_
        .withTransaction(manager)
        .emit(ProductService.Events.UPDATED, result)
      return result
    })
  }

  /**
   * Changes the order of a product's options. Will throw if the length of
   * optionOrder and the length of the product's options are different. Will
   * throw optionOrder contains an id not associated with the product.
   * @param {string} productId - the product whose options we are reordering
   * @param {[ObjectId]} optionId - the ids of the product's options in the
   *    new order
   * @return {Promise} the result of the update operation
   */
  async reorderOptions(productId, optionOrder) {
    return this.atomicPhase_(async manager => {
      const productRepo = manager.getCustomRepository(this.productRepository_)

      const product = await this.retrieve(productId, ["options"])

      if (product.options.length !== optionOrder.length) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          `Product options and new options order differ in length.`
        )
      }

      product.options = optionOrder.map(oId => {
        const option = product.options.find(o => o.id === oId)
        if (!option) {
          throw new MedusaError(
            MedusaError.Types.INVALID_DATA,
            `Product has no option with id: ${oId}`
          )
        }

        return option
      })

      const result = productRepo.save(product)
      await this.eventBus_
        .withTransaction(manager)
        .emit(ProductService.Events.UPDATED, result)
      return result
    })
  }

  /**
   * Updates a product's option. Throws if the call tries to update an option
   * not associated with the product. Throws if the updated title already exists.
   * @param {string} productId - the product whose option we are updating
   * @param {string} optionId - the id of the option we are updating
   * @param {object} data - the data to update the option with
   * @return {Promise} the updated product
   */
  async updateOption(productId, optionId, data) {
    return this.atomicPhase_(async manager => {
      const productOptionRepo = manager.getCustomRepository(
        this.productOptionRepository_
      )

      const product = await this.retrieve(productId, ["options"])

      const { title, values } = data

      const optionExists = product.options.some(
        o => o.title.toUpperCase() === title.toUpperCase() && o.id !== optionId
      )
      if (optionExists) {
        throw new MedusaError(
          MedusaError.Types.NOT_FOUND,
          `An option with title ${title} already exists`
        )
      }

      const productOption = await productOptionRepo.findOne({
        where: { id: optionId },
      })

      if (!productOption) {
        throw new MedusaError(
          MedusaError.Types.NOT_FOUND,
          `Option with id: ${optionId} deos not exists`
        )
      }

      productOption.title = title
      productOption.values = values

      await productOptionRepo.save(productOption)

      await this.eventBus_
        .withTransaction(manager)
        .emit(ProductService.Events.UPDATED, product)
      return product
    })
  }

  /**
   * Delete an option from a product.
   * @param {string} productId - the product to delete an option from
   * @param {string} optionId - the option to delete
   * @return {Promise} the updated product
   */
  async deleteOption(productId, optionId) {
    return this.atomicPhase_(async manager => {
      const productOptionRepo = manager.getCustomRepository(
        this.productOptionRepository_
      )

      const product = await this.retrieve(productId, [
        "variants",
        "variants.options",
      ])

      const productOption = await productOptionRepo.findOne({
        where: { id: optionId, product_id: productId },
      })

      if (!productOption) {
        return Promise.resolve()
      }

      // For the option we want to delete, make sure that all variants have the
      // same option values. The reason for doing is, that we want to avoid
      // duplicate variants. For example, if we have a product with size and
      // color options, that has four variants: (black, 1), (black, 2),
      // (blue, 1), (blue, 2) and we delete the size option from the product,
      // we would end up with four variants: (black), (black), (blue), (blue).
      // We now have two duplicate variants. To ensure that this does not
      // happen, we will force the user to select which variants to keep.
      const firstVariant = product.variants[0]

      const valueToMatch = firstVariant.options.find(
        o => o.option_id === optionId
      ).value

      const equalsFirst = await Promise.all(
        product.variants.map(async v => {
          const option = v.options.find(o => o.option_id === optionId)
          return option.value === valueToMatch
        })
      )

      if (!equalsFirst.every(v => v)) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          `To delete an option, first delete all variants, such that when option is deleted, no duplicate variants will exist.`
        )
      }

      // If we reach this point, we can safely delete the product option
      await productOptionRepo.softRemove(productOption)

      await this.eventBus_
        .withTransaction(manager)
        .emit(ProductService.Events.UPDATED, product)
      return product
    })
  }

  /**
   * Decorates a product with product variants.
   * @param {Product} product - the product to decorate.
   * @param {string[]} fields - the fields to include.
   * @param {string[]} expandFields - fields to expand.
   * @return {Product} return the decorated product.
   */
  async decorate(product, fields, expandFields = []) {
    const requiredFields = ["_id", "metadata"]
    const decorated = _.pick(product, fields.concat(requiredFields))
    if (expandFields.includes("variants")) {
      decorated.variants = await this.retrieveVariants(product._id)
    }
    const final = await this.runDecorators_(decorated)
    return final
  }

  /**
   * Dedicated method to set metadata for a product.
   * @param {string} product - the product to set metadata for.
   * @param {object} metadata - the metadata to set
   * @return {object} updated metadata object
   */
  setMetadata_(product, metadata) {
    const existing = product.metadata || {}
    const newData = {}
    for (const [key, value] of Object.entries(metadata)) {
      if (typeof key !== "string") {
        throw new MedusaError(
          MedusaError.Types.INVALID_ARGUMENT,
          "Key type is invalid. Metadata keys must be strings"
        )
      }

      newData[key] = value
    }

    const updated = {
      ...existing,
      ...newData,
    }

    return updated
  }
}

export default ProductService

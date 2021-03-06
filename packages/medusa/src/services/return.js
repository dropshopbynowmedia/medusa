import _ from "lodash"
import { BaseService } from "medusa-interfaces"
import { MedusaError } from "medusa-core-utils"

/**
 * Handles Returns
 * @implements BaseService
 */
class ReturnService extends BaseService {
  constructor({
    manager,
    totalsService,
    lineItemService,
    returnRepository,
    returnItemRepository,
    shippingOptionService,
    fulfillmentProviderService,
  }) {
    super()

    /** @private @const {EntityManager} */
    this.manager_ = manager

    /** @private @const {TotalsService} */
    this.totalsService_ = totalsService

    /** @private @const {ReturnRepository} */
    this.returnRepository_ = returnRepository

    /** @private @const {ReturnItemRepository} */
    this.returnItemRepository_ = returnItemRepository

    /** @private @const {ReturnItemRepository} */
    this.lineItemService_ = lineItemService

    /** @private @const {ShippingOptionService} */
    this.shippingOptionService_ = shippingOptionService

    /** @private @const {FulfillmentProviderService} */
    this.fulfillmentProviderService_ = fulfillmentProviderService
  }

  withTransaction(transactionManager) {
    if (!transactionManager) {
      return this
    }

    const cloned = new ReturnService({
      manager: transactionManager,
      totalsService: this.totalsService_,
      lineItemService: this.lineItemService_,
      returnRepository: this.returnRepository_,
      returnItemRepository: this.returnItemRepository_,
      shippingOptionService: this.shippingOptionService_,
      fulfillmentProviderService: this.fulfillmentProviderService_,
    })

    cloned.transactionManager_ = transactionManager

    return cloned
  }

  /**
   * Retrieves the order line items, given an array of items.
   * @param {Order} order - the order to get line items from
   * @param {{ item_id: string, quantity: number }} items - the items to get
   * @param {function} transformer - a function to apply to each of the items
   *    retrieved from the order, should return a line item. If the transformer
   *    returns an undefined value the line item will be filtered from the
   *    returned array.
   * @return {Promise<Array<LineItem>>} the line items generated by the transformer.
   */
  async getFulfillmentItems_(order, items, transformer) {
    const toReturn = await Promise.all(
      items.map(async ({ item_id, quantity }) => {
        const item = order.items.find(i => i.id === item_id)
        return transformer(item, quantity)
      })
    )

    return toReturn.filter(i => !!i)
  }

  /**
   * @param {Object} selector - the query object for find
   * @return {Promise} the result of the find operation
   */
  list(
    selector,
    config = { skip: 0, take: 50, order: { created_at: "DESC" } }
  ) {
    const returnRepo = this.manager_.getCustomRepository(this.returnRepository_)
    const query = this.buildQuery_(selector, config)
    return returnRepo.find(query)
  }

  /**
   * Checks that an order has the statuses necessary to complete a return.
   * fulfillment_status cannot be not_fulfilled or returned.
   * payment_status must be captured.
   * @param {Order} order - the order to check statuses on
   * @throws when statuses are not sufficient for returns.
   */
  validateReturnStatuses_(order) {
    if (
      order.fulfillment_status === "not_fulfilled" ||
      order.fulfillment_status === "returned"
    ) {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        "Can't return an unfulfilled or already returned order"
      )
    }

    if (order.payment_status !== "captured") {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        "Can't return an order with payment unprocessed"
      )
    }
  }

  /**
   * Checks that a given quantity of a line item can be returned. Fails if the
   * item is undefined or if the returnable quantity of the item is lower, than
   * the quantity that is requested to be returned.
   * @param {LineItem?} item - the line item to check has sufficient returnable
   *   quantity.
   * @param {number} quantity - the quantity that is requested to be returned.
   * @return {LineItem} a line item where the quantity is set to the requested
   *   return quantity.
   */
  validateReturnLineItem_(item, quantity) {
    if (!item) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Return contains invalid line item"
      )
    }

    const returnable = item.quantity - item.returned_quantity
    if (quantity > returnable) {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        "Cannot return more items than have been purchased"
      )
    }

    return {
      ...item,
      quantity,
    }
  }

  /**
   * Retrieves a return by its id.
   * @param {string} id - the id of the return to retrieve
   * @return {Return} the return
   */
  async retrieve(id, config = {}) {
    const returnRepository = this.manager_.getCustomRepository(
      this.returnRepository_
    )

    const validatedId = this.validateId_(id)
    const query = this.buildQuery_({ id: validatedId }, config)

    const returnObj = await returnRepository.findOne(query)

    if (!returnObj) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `Return with id: ${id} was not found`
      )
    }
    return returnObj
  }

  async retrieveBySwap(swapId, relations = []) {
    const returnRepository = this.manager_.getCustomRepository(
      this.returnRepository_
    )

    const validatedId = this.validateId_(swapId)

    const returnObj = await returnRepository.findOne({
      where: {
        swap_id: validatedId,
      },
      relations,
    })

    if (!returnObj) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `Return with swa_id: ${swapId} was not found`
      )
    }
    return returnObj
  }

  async update(returnId, update) {
    return this.atomicPhase_(async manager => {
      const ret = await this.retrieve(returnId)

      const { metadata, ...rest } = update

      if ("metadata" in update) {
        ret.metadata = this.setMetadata_(ret, update.metadata)
      }

      for (const [key, value] of Object.entries(rest)) {
        ret[key] = value
      }

      const retRepo = manager.getCustomRepository(this.returnRepository_)
      const result = await retRepo.save(ret)
      return result
    })
  }

  /**
   * Creates a return request for an order, with given items, and a shipping
   * method. If no refund amount is provided the refund amount is calculated from
   * the return lines and the shipping cost.
   * @param {object} data - data to use for the return e.g. shipping_method,
   *    items or refund_amount
   * @param {object} orderLike - order object
   * @returns {Promise<Return>} the resulting order.
   */
  async create(data, orderLike) {
    return this.atomicPhase_(async manager => {
      const returnRepository = manager.getCustomRepository(
        this.returnRepository_
      )

      const returnLines = await this.getFulfillmentItems_(
        orderLike,
        data.items,
        this.validateReturnLineItem_
      )

      let toRefund = data.refund_amount
      if (typeof toRefund !== "undefined") {
        const refundable = orderLike.total - orderLike.refunded_total
        if (toRefund > refundable) {
          throw new MedusaError(
            MedusaError.Types.INVALID_DATA,
            "Cannot refund more than the original payment"
          )
        }
      } else {
        toRefund = await this.totalsService_.getRefundTotal(
          orderLike,
          returnLines
        )

        if (data.shipping_method) {
          toRefund = Math.max(
            0,
            toRefund -
              data.shipping_method.price * (1 + orderLike.tax_rate / 100)
          )
        }
      }

      const method = data.shipping_method
      delete data.shipping_method

      const returnObject = {
        ...data,
        status: "requested",
        refund_amount: Math.floor(toRefund),
      }

      const rItemRepo = manager.getCustomRepository(this.returnItemRepository_)
      returnObject.items = returnLines.map(i =>
        rItemRepo.create({
          item_id: i.id,
          quantity: i.quantity,
          requested_quantity: i.quantity,
          metadata: i.metadata,
        })
      )

      const created = await returnRepository.create(returnObject)
      const result = await returnRepository.save(created)

      if (method) {
        await this.shippingOptionService_
          .withTransaction(manager)
          .createShippingMethod(
            method.option_id,
            {},
            {
              price: method.price,
              return_id: result.id,
            }
          )
      }

      return result
    })
  }

  fulfill(returnId) {
    return this.atomicPhase_(async manager => {
      const returnOrder = await this.retrieve(returnId, {
        relations: [
          "items",
          "shipping_method",
          "shipping_method.shipping_option",
          "swap",
          "claim_order",
        ],
      })

      const items = await this.lineItemService_.list({
        id: returnOrder.items.map(({ item_id }) => item_id),
      })

      returnOrder.items = returnOrder.items.map(item => {
        const found = items.find(i => i.id === item.item_id)
        return {
          ...item,
          item: found,
        }
      })

      if (returnOrder.shipping_data) {
        throw new MedusaError(
          MedusaError.Types.NOT_ALLOWED,
          "Return has already been fulfilled"
        )
      }

      if (returnOrder.shipping_method === null) {
        return returnOrder
      }

      const fulfillmentData = await this.fulfillmentProviderService_.createReturn(
        returnOrder
      )

      returnOrder.shipping_data = fulfillmentData

      const returnRepo = manager.getCustomRepository(this.returnRepository_)
      const result = await returnRepo.save(returnOrder)
      return result
    })
  }

  /**
   * Registers a previously requested return as received. This will create a
   * refund to the customer. If the returned items don't match the requested
   * items the return status will be updated to requires_action. This behaviour
   * is useful in sitautions where a custom refund amount is requested, but the
   * retuned items are not matching the requested items. Setting the
   * allowMismatch argument to true, will process the return, ignoring any
   * mismatches.
   * @param {string} orderId - the order to return.
   * @param {string[]} lineItems - the line items to return
   * @return {Promise} the result of the update operation
   */
  async receiveReturn(
    returnId,
    receivedItems,
    refundAmount,
    allowMismatch = false
  ) {
    return this.atomicPhase_(async manager => {
      const returnRepository = manager.getCustomRepository(
        this.returnRepository_
      )

      const returnObj = await this.retrieve(returnId, {
        relations: [
          "items",
          "order",
          "order.items",
          "order.discounts",
          "order.refunds",
          "order.shipping_methods",
          "order.region",
          "swap",
          "swap.order",
          "swap.order.items",
          "swap.order.refunds",
          "swap.order.shipping_methods",
          "swap.order.region",
        ],
      })

      const order = returnObj.order || (returnObj.swap && returnObj.swap.order)

      if (returnObj.status === "received") {
        throw new MedusaError(
          MedusaError.Types.NOT_ALLOWED,
          `Return with id ${returnId} has already been received`
        )
      }

      const returnLines = await this.getFulfillmentItems_(
        order,
        receivedItems,
        this.validateReturnLineItem_
      )

      const newLines = returnLines.map(l => {
        const existing = returnObj.items.find(i => l.id === i.item_id)
        if (existing) {
          return {
            ...existing,
            quantity: l.quantity,
            requested_quantity: existing.quantity,
            received_quantity: l.quantity,
            is_requested: l.quantity === existing.quantity,
          }
        } else {
          return {
            return_id: returnObj.id,
            item_id: l.id,
            quantity: l.quantity,
            is_requested: false,
            received_quantity: l.quantity,
            metadata: l.metadata || {},
          }
        }
      })

      let returnStatus = "received"

      const isMatching = newLines.every(l => l.is_requested)
      if (!isMatching && !allowMismatch) {
        // Should update status
        returnStatus = "requires_action"
      }

      const toRefund = refundAmount || returnObj.refund_amount
      const total = await this.totalsService_.getTotal(order)
      const refunded = await this.totalsService_.getRefundedTotal(order)

      if (toRefund > total - refunded) {
        returnStatus = "requires_action"
      }

      const now = new Date()
      const updateObj = {
        ...returnObj,
        status: returnStatus,
        items: newLines,
        refund_amount: toRefund,
        received_at: now.toISOString(),
      }

      const result = await returnRepository.save(updateObj)
      return result
    })
  }
}

export default ReturnService

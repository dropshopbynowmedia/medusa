class ReepaySubscriber {
  constructor({ reepayService, cartService, orderService, eventBusService }) {
    this.reepayService_ = reepayService

    this.cartService_ = cartService

    this.orderService_ = orderService

    this.eventBus_ = eventBusService

    this.eventBus_.subscribe("reepay.event_received", async (event) =>
      this.handleReepayEvent(event)
    )
  }

  async handleReepayEvent(event) {
    switch (true) {
      case event.event_type === "invoice_authorized": {
        this.handleAuthorization_(event)
        break
      }
      case event.event_type === "invoice_settled": {
        this.handleCapture_(event)
        break
      }
      case event.event_type === "invoice_failed": {
        this.handleFailedCapture_(event)
        break
      }
      case event.event_type === "invoice_refund": {
        this.handleRefund_(event)
        break
      }
      case event.event_type === "invoice_refund_failed": {
        this.handleFailedRefund_(event)
        break
      }
      default:
        break
    }
  }

  async handleAuthorization_(event) {
    const cartId = event.invoice
    // We need to ensure, that an order is created in situations, where the
    // customer might have closed their browser prior to order creation
    try {
      await this.orderService_.retrieveByCartId(cartId)
    } catch (error) {
      let cart = await this.cartService_.retrieve(cartId)

      const reepayPayment = await this.reepayService_.retrievePayment({
        invoice: cart._id,
      })

      await this.cartService_.setPaymentMethod(cart._id, {
        provider_id: "reepay",
        data: reepayPayment,
      })

      const toCreate = await this.cartService_.retrieve(cart._id)

      return this.orderService_.createFromCart(toCreate)
    }
  }

  async handleCapture_(event) {
    const cartId = event.invoice

    let order
    try {
      order = await this.orderService_.retrieveByCartId(cartId)
    } catch (error) {
      // If no order has been made yet, try to do that
      order = await this.handleAuthorization_(event)
    }

    const paymentMethod = order.payment_method

    paymentMethod.data = {
      ...paymentMethod.data,
      state: "settled",
    }

    await this.orderService_.update(order._id, {
      payment_method: paymentMethod,
    })
  }

  async handleFailedCapture_(event) {
    const cartId = event.invoice

    const order = await this.orderService_.retrieveByCartId(cartId)

    await this.orderService_.registerPaymentFailed(order._id, "failed capture")

    const paymentMethod = order.payment_method

    paymentMethod.data = {
      ...paymentMethod.data,
      state: "failed",
    }

    await this.orderService_.update(order._id, {
      payment_method: paymentMethod,
    })
  }

  async handleFailedRefund_(event) {
    const cartId = event.invoice

    const order = await this.orderService_.retrieveByCartId(cartId)

    await this.orderService_.registerRefundFailed(order._id, "failed refund")

    const paymentMethod = order.payment_method

    paymentMethod.data = {
      ...paymentMethod.data,
      state: "failed",
    }

    await this.orderService_.update(order._id, {
      payment_method: paymentMethod,
    })
  }

  async handleRefund_(event) {
    const cartId = event.invoice

    const order = await this.orderService_.retrieveByCartId(cartId)

    await this.orderService_.registerRefund(order._id)

    const paymentMethod = order.payment_method

    paymentMethod.data = {
      ...paymentMethod.data,
      state: "refunded",
    }

    await this.orderService_.update(order._id, {
      payment_method: paymentMethod,
    })
  }
}

export default ReepaySubscriber

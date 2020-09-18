import _ from "lodash"
import { PaymentService } from "medusa-interfaces"

class CardReepayService extends PaymentService {
  static identifier = "card-reepay"

  constructor({ reepayService }) {
    super()

    this.reepayService_ = reepayService
  }

  /**
   * Status for Reepay payment.
   * @param {Object} paymentData - payment method data from cart
   * @returns {string} the status of the payment
   */
  async getStatus(paymentData) {
    let status = "initial"
    return status
  }

  async createPayment(cart) {
    return this.reepayService_.createPayment(cart)
  }

  async authorizePayment(cart, paymentMethod) {
    return this.reepayService_.authorizePayment(cart, paymentMethod)
  }

  async retrievePayment(data) {
    return this.reepayService_.retrievePayment(data)
  }

  async updatePayment(data, _) {
    return this.reepayService_.updatePayment(data)
  }

  async deletePayment(data) {
    return this.reepayService_.deletePayment(data)
  }

  async capturePayment(data) {
    try {
      return this.reepayService_.capturePayment(data)
    } catch (error) {
      throw error
    }
  }

  async refundPayment(data) {
    try {
      return this.reepayService_.refundPayment(data)
    } catch (error) {
      throw error
    }
  }

  async cancelPayment(data) {
    try {
      return this.reepayService_.cancelPayment(data)
    } catch (error) {
      throw error
    }
  }
}

export default CardReepayService

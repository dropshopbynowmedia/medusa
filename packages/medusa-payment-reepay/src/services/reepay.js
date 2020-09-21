import axios from "axios"
import _ from "lodash"
import { v4 as uuidv4 } from "uuid"
import { PaymentService } from "medusa-interfaces"
import { MedusaError } from "medusa-core-utils"

class ReepayProviderService extends PaymentService {
  static identifier = "reepay"

  constructor(
    { regionService, customerService, cartService, totalsService },
    options
  ) {
    super()

    this.regionService_ = regionService

    this.customerService_ = customerService

    this.cartService_ = cartService

    this.totalsService_ = totalsService

    this.options_ = options

    this.reepayCheckoutApi = this.initReepayCheckout()

    this.reepayApi = this.initReepayApi()
  }

  getOptions() {
    return this.options_
  }

  initReepayCheckout() {
    const token = Buffer.from(this.options_.api_key).toString("base64")
    return axios.create({
      baseURL: "https://checkout-api.reepay.com/v1/session",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Basic ${token}`,
      },
    })
  }

  initReepayApi() {
    const token = Buffer.from(this.options_.api_key).toString("base64")
    return axios.create({
      baseURL: "https://api.reepay.com/v1",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Basic ${token}`,
      },
    })
  }

  async createSession(cart) {
    const total = await this.totalsService_.getTotal(cart)
    const region = await this.regionService_.retrieve(cart.region_id)

    const paymentMethods = this.retrievePaymentMethods(cart)

    const request = {
      order: {
        handle: cart._id,
        amount: total * 100,
        currency: region.currency_code,
        customer: {
          email: cart.email,
        },
      },
      payment_methods: paymentMethods,
      accept_url: "http://localhost:8000/checkout/payment",
      cancel_url: "http://localhost:8000/checkout",
    }

    try {
      return this.reepayCheckoutApi.post("/charge", request)
    } catch (error) {
      console.log(error)
      throw error
    }
  }

  /**
   * Retrieve payment methods from Reepay
   * @param {Cart} cart - cart to fetch payment methods for
   * @returns {[string]} payment methods
   */
  retrievePaymentMethods(cart) {
    return cart.payment_sessions
      .filter((ps) => ps.provider_id.includes("-reepay"))
      .map((ps) => ps.provider_id.split("-reepay")[0])
  }

  /**
   * Status for Reepay payment
   * @param {Object} paymentMethod - payment method data from cart
   * @returns {string} the status of the payment
   */
  async getStatus(paymentMethod) {
    const { invoice } = paymentMethod
    const { data } = await this.reepayApi.get(`/charge/${invoice}`)

    let status = "initial"

    if (data.state === "created") {
      return status
    }

    if (data.state === "authorized") {
      status = "authorized"
    }

    if (data.state === "settled") {
      status = "succeeded"
    }

    if (data.state === "failed") {
      status = "cancelled"
    }

    return status
  }

  /**
   * Creates Reepay payment object
   * @returns {Object} empty payment data
   */
  async createPayment(cart) {
    return { invoice: cart._id }
  }

  async retrievePayment(paymentMethod) {
    const { invoice } = paymentMethod

    try {
      const { data } = await this.reepayApi.get(`/charge/${invoice}`)
      return data
    } catch (error) {
      throw error
    }
  }

  /**
   * Captures an Reepay payment
   * @param {Object} data - payment data to capture
   * @returns {Object} payment data result of capture
   */
  async capturePayment(data) {
    const { handle } = data

    try {
      const captured = await this.reepayApi.post(`/charge/${handle}/settle`)

      if (captured.data.state !== "settled") {
        throw new MedusaError(
          MedusaError.Types.INVALID_ARGUMENT,
          "Could not process capture"
        )
      }

      return "processing_capture"
    } catch (error) {
      throw error
    }
  }

  /**
   * Refunds an Reepay payment
   * @param {Object} paymentData - payment data to refund
   * @param {number} amountToRefund - amount to refund
   * @returns {Object} payment data result of refund
   */
  async refundPayment(data, amountToRefund) {
    const { handle } = data

    try {
      const refunded = await this.reepayApi.post("/refund", {
        invoice: handle,
        key: uuidv4(),
        amount: amountToRefund * 100,
      })

      console.log(refunded)

      if (refunded.data.state !== "refunded") {
        throw new MedusaError(
          MedusaError.Types.INVALID_ARGUMENT,
          "Could not process capture"
        )
      }

      return "processing_refund"
    } catch (error) {
      throw error
    }
  }

  /**
   * Cancels an Reepay payment
   * @param {Object} paymentData - payment data to cancel
   * @returns {Object} payment data result of cancel
   */
  async cancelPayment(paymentData) {
    const { handle } = paymentData

    try {
      return this.reepayApi.post(`/charge/${handle}/cancel`)
    } catch (error) {
      throw error
    }
  }

  async deletePayment(paymentData) {
    const { handle } = paymentData

    try {
      return this.reepayApi.delete(`/charge/${handle}`)
    } catch (error) {
      throw error
    }
  }
}

export default ReepayProviderService

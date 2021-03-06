jest.unmock("axios")

import BrightpearlService from "../brightpearl"
import { mockCreateOrder } from "../../utils/brightpearl"
import MockAdapter from "axios-mock-adapter"

jest.mock("../../utils/brightpearl")

const order = {
  region: {
    tax_code: "1234",
  },
  items: [
    {
      title: "Test",
      variant: {
        sku: "TEST",
      },
      unit_price: 1100,
      quantity: 2,
    },
  ],
  shipping_total: 12399,
  shipping_methods: [
    {
      name: "standard",
      price: 12399,
    },
  ],
  payment_method: {
    id: "123",
  },
  tax_rate: 23.1,
  currency_code: "DKK",
  display_id: "1234",
  id: "12355",
  discounts: [],
  shipping_address: {
    first_name: "Test",
    last_name: "Testson",
    address_1: "Test",
    address_2: "TEst",
    postal_code: "1234",
    country_code: "DK",
    phone: "12345678",
  },
  email: "test@example.com",
}

const OrderService = {
  retrieve: () => {
    return Promise.resolve(order)
  },
  update: () => {
    return Promise.resolve()
  },
}

const TotalsService = {
  getTotal: () => {
    return Promise.resolve(123)
  },
  getLineDiscounts: () => {
    return Promise.resolve([])
  },
  getShippingTotal: () => {
    return 12399
  },
  rounded: (value) => {
    const decimalPlaces = 4
    return Number(
      Math.round(parseFloat(value + "e" + decimalPlaces)) + "e-" + decimalPlaces
    )
  },
}

const OAuthService = {
  retrieveByName: () => {
    return Promise.resolve({
      data: {
        access_token: "12345",
      },
    })
  },
}

const RegionService = {
  retrieve: () => {
    return Promise.resolve({
      tax_code: "1234",
    })
  },
}

describe("BrightpearlService", () => {
  describe("getClient", () => {
    it("creates client", async () => {
      let token = "bad"
      const oauth = {
        refreshToken: () => {
          token = "good"
          return Promise.resolve({
            data: {
              access_token: "good",
            },
          })
        },
        retrieveByName: () => {
          return Promise.resolve({
            data: {
              access_token: token,
            },
          })
        },
      }

      const bpService = new BrightpearlService({ oauthService: oauth }, {})
      const client = await bpService.getClient()

      const mockServer = new MockAdapter(client.client)

      mockServer.onGet("/success").reply(() => {
        return [200]
      })
      mockServer.onGet("/fail").reply((req) => {
        if (req.headers.Authorization === "Bearer good") {
          return [200]
        }
        return [401]
      })

      await client.test.fail()
      await client.test.fail()
    })
  })

  describe("createSalesOrder", () => {
    const bpService = new BrightpearlService(
      {
        orderService: OrderService,
        totalsService: TotalsService,
        oauthService: OAuthService,
        regionService: RegionService,
      },
      { account: "test" }
    )

    it("successfully builds sales order", async () => {
      await bpService.createSalesOrder(order)

      expect(mockCreateOrder).toHaveBeenCalledWith({
        currency: { code: "DKK" },
        ref: "1234",
        externalRef: "12355",
        channelId: "1",
        installedIntegrationInstanceId: undefined,
        statusId: "3",
        customer: {
          id: "12345",
          address: {
            addressFullName: "Test Testson",
            addressLine1: "Test",
            addressLine2: "TEst",
            postalCode: "1234",
            countryIsoCode: "DK",
            telephone: "12345678",
            email: "test@example.com",
          },
        },
        delivery: {
          shippingMethodId: 0,
          address: {
            addressFullName: "Test Testson",
            addressLine1: "Test",
            addressLine2: "TEst",
            postalCode: "1234",
            countryIsoCode: "DK",
            telephone: "12345678",
            email: "test@example.com",
          },
        },
        rows: [
          {
            name: "Test",
            net: 22,
            tax: 5.082,
            quantity: 2,
            taxCode: "1234",
            externalRef: undefined,
            nominalCode: "4000",
          },
          {
            name: "Shipping: standard",
            quantity: 1,
            net: 123.99,
            tax: 28.6417,
            taxCode: "1234",
            nominalCode: "4040",
          },
        ],
      })
    })
  })
})

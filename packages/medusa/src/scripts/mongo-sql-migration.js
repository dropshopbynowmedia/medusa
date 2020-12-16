#!/usr/bin/env node

import path from "path"
import glob from "glob"
import mongo from "mongodb"
import chalk from "chalk"
import { QueryRunner, In, createConnection } from "typeorm"

import { getConfigFile, createRequireFromPath } from "medusa-core-utils"

import { MoneyAmount } from "../models/money-amount"
import { Country } from "../models/country"
import { Currency } from "../models/currency"
import { Discount } from "../models/discount"
import { Customer } from "../models/customer"
import { Order } from "../models/order"
import { LineItem } from "../models/line-item"
import { Fulfillment } from "../models/fulfillment"
import { FulfillmentItem } from "../models/fulfillment-item"
import { ReturnItem } from "../models/return-item"
import { FulfillmentProvider } from "../models/fulfillment-provider"
import { PaymentProvider } from "../models/payment-provider"
import { Payment } from "../models/payment"
import { Swap } from "../models/swap"
import { GiftCard } from "../models/gift-card"
import { Region } from "../models/region"
import { Refund } from "../models/refund"
import { Return } from "../models/return"
import { Address } from "../models/address"
import { ProductVariant } from "../models/product-variant"
import { ShippingMethod } from "../models/shipping-method"
import { ShippingOption } from "../models/shipping-option"
import { ShippingProfile } from "../models/shipping-profile"
import { DiscountRule } from "../models/discount-rule"
import { Store } from "../models/store"
import { ProductOption } from "../models/product-option"
import { ProductOptionValue } from "../models/product-option-value"
import { ShippingOptionRequirement } from "../models/shipping-option-requirement"

import { RegionRepository } from "../repositories/region"
import { DiscountRepository } from "../repositories/discount"
import { GiftCardRepository } from "../repositories/gift-card"
import { ShippingProfileRepository } from "../repositories/shipping-profile"
import { ShippingOptionRepository } from "../repositories/shipping-option"
import { ProductRepository } from "../repositories/product"
import { ProductVariantRepository } from "../repositories/product-variant"

/**
 * Migrate store
 * @param {MongoDb} mongodb
 * @param {QueryRunner} queryRunner
 */
const migrateStore = async (mongodb, queryRunner) => {
  const dcol = mongodb.collection("stores")

  const dcur = dcol.find({})
  const stores = await dcur.toArray()

  const storeRepo = queryRunner.manager.getRepository(Store)
  const currencyRepo = queryRunner.manager.getRepository(Currency)

  for (const d of stores) {
    const newly = storeRepo.create({
      name: d.name,
      default_currency_code: d.default_currency.toLowerCase(),
      currencies: await Promise.all(
        d.currencies.map(c => currencyRepo.findOne({ code: c.toLowerCase() }))
      ),
      swap_link_template: d.swap_link_template,
    })
    await storeRepo.save(newly)
  }
}

/**
 * Migrates Regions
 * @param {MongoDb} mongodb
 * @param {QueryRunner} queryRunner
 */
const migrateRegions = async (mongodb, queryRunner) => {
  const rcol = mongodb.collection("regions")
  const regCursor = rcol.find({})
  const regions = await regCursor.toArray()

  const countryRepository = queryRunner.manager.getRepository(Country)
  const payRepository = queryRunner.manager.getRepository(PaymentProvider)
  const fulRepository = queryRunner.manager.getRepository(FulfillmentProvider)

  const regionRepository = queryRunner.manager.getCustomRepository(
    RegionRepository
  )

  for (const reg of regions) {
    const countries = await countryRepository.find({
      iso_2: In(reg.countries.map(c => c.toLowerCase())),
    })

    const newRegion = regionRepository.create({
      name: reg.name,
      currency_code: reg.currency_code.toLowerCase(),
      tax_rate: reg.tax_rate * 100,
      tax_code: reg.tax_code,
      countries,
    })

    newRegion.payment_providers = []
    for (const pp of reg.payment_providers) {
      let exists = await payRepository.findOne({ id: pp })
      if (!exists) {
        let newly = payRepository.create({
          id: pp,
          is_installed: false,
        })
        exists = await payRepository.save(newly)
      }

      newRegion.payment_providers.push(exists)
    }

    newRegion.fulfillment_providers = []
    for (const pp of reg.fulfillment_providers) {
      let exists = await fulRepository.findOne({ id: pp })
      if (!exists) {
        let newly = fulRepository.create({
          id: pp,
          is_installed: false,
        })
        exists = await fulRepository.save(newly)
      }

      newRegion.fulfillment_providers.push(exists)
    }

    await regionRepository.save(newRegion)
  }
}

/**
 * Migrates Shipping Options
 * @param {MongoDb} mongodb
 * @param {QueryRunner} queryRunner
 */
const migrateShippingOptions = async (mongodb, queryRunner) => {
  const col = mongodb.collection("shippingoptions")
  const cursor = col.find({})
  const options = await cursor.toArray()

  const rCol = mongodb.collection("regions")
  const rCursor = rCol.find({})
  const regions = await rCursor.toArray()

  const pCol = mongodb.collection("shippingprofiles")
  const pCursor = pCol.find({})
  const profiles = await pCursor.toArray()

  const reqRepo = queryRunner.manager.getRepository(ShippingOptionRequirement)
  const regionRepository = queryRunner.manager.getCustomRepository(
    RegionRepository
  )
  const optionRepository = queryRunner.manager.getCustomRepository(
    ShippingOptionRepository
  )
  const profileRepo = queryRunner.manager.getCustomRepository(
    ShippingProfileRepository
  )

  for (const option of options) {
    const mongoReg = regions.find(r => r._id.equals(option.region_id))
    const region = await regionRepository.findOne({ name: mongoReg.name })

    const mongoProfile = profiles.find(p => p._id.equals(option.profile_id))
    let profile
    if (mongoProfile.name === "default_shipping_profile") {
      profile = await profileRepo.findOne({ type: "default" })
    } else if ((mongoProfile.name = "default_gift_card_profile")) {
      profile = await profileRepo.findOne({ type: "gift_card" })
    }

    const newOption = optionRepository.create({
      name: option.name,
      region,
      profile,
      provider_id: option.provider_id,
      price_type: option.price.type,
      amount: Math.round(option.price.amount * 100),
      is_return: !!option.is_return,
      data: option.data,
      requirements: option.requirements.map(r =>
        reqRepo.create({
          type: r.type,
          amount: Math.round(r.value * 100),
        })
      ),
    })
    await optionRepository.save(newOption)
  }
}

/**
 * Migrates products and product variants
 * @param {MongoDb} mongodb
 * @param {QueryRunner} queryRunner
 */
const migrateProducts = async (mongodb, queryRunner) => {
  const col = mongodb.collection("products")
  const cursor = col.find({})
  const products = await cursor.toArray()

  const variantCol = mongodb.collection("productvariants")

  const maRepo = queryRunner.manager.getRepository(MoneyAmount)
  const optValRepo = queryRunner.manager.getRepository(ProductOptionValue)
  const optRepo = queryRunner.manager.getRepository(ProductOption)
  const varRepo = queryRunner.manager.getCustomRepository(
    ProductVariantRepository
  )
  const prodRepo = queryRunner.manager.getCustomRepository(ProductRepository)
  const profileRepo = queryRunner.manager.getCustomRepository(
    ShippingProfileRepository
  )

  const defProf = await profileRepo.findOne({ type: "default" })
  const gcProf = await profileRepo.findOne({ type: "gift_card" })

  for (const p of products) {
    const newOptions = await Promise.all(
      p.options.map(o => {
        const newO = optRepo.create({
          title: o.title,
        })
        return optRepo.save(newO)
      })
    )

    const varCur = variantCol.find({
      _id: { $in: p.variants.map(id => new mongo.ObjectID(id)) },
    })
    const mongoVariants = await varCur.toArray()

    const newVariants = await Promise.all(
      mongoVariants.map(v => {
        const newV = varRepo.create({
          title: v.title,
          barcode: v.ean,
          ean: v.ean,
          sku: v.sku,
          manage_inventory: v.manage_inventory,
          allow_backorder: v.allow_backorder,
          inventory_quantity: v.inventory_quantity,
          options: v.options.map((o, idx) => {
            const opt = newOptions[idx]
            return optValRepo.create({
              value: o.value,
              option: opt,
            })
          }),
          prices: v.prices.map(p =>
            maRepo.create({
              currency_code: p.currency_code.toLowerCase(),
              amount: Math.round(p.amount * 100),
            })
          ),
          hs_code: v.metadata && v.metadata.hs_code,
          origin_country: v.metadata && v.metadata.origin_country,
          metadata: v.metadata && {
            alternative_size: v.metadata.alternative_size,
            color: v.metadata.color,
          },
        })
        return varRepo.save(newV)
      })
    )

    const newProd = prodRepo.create({
      title: p.title,
      tags: p.tags || null,
      description: p.description,
      handle: p.handle,
      is_giftcard: p.is_giftcard,
      thumbnail: p.thumbnail,
      profile: p.is_giftcard ? gcProf : defProf,
      options: newOptions,
      variants: newVariants,
    })
    await prodRepo.save(newProd)
  }
}

const createDiscount = async (mongodb, queryRunner, d) => {
  const rcol = mongodb.collection("regions")

  const ruleRepo = queryRunner.manager.getRepository(DiscountRule)
  const gcRepo = queryRunner.manager.getCustomRepository(GiftCardRepository)
  const discountRepo = queryRunner.manager.getCustomRepository(
    DiscountRepository
  )
  const regRepo = queryRunner.manager.getCustomRepository(RegionRepository)

  if (d.is_giftcard) {
    const rcur = rcol.find({
      _id: mongo.ObjectID(d.regions[0]),
    })
    const mongoRegs = await rcur.toArray()
    const region = await regRepo.findOne({ name: mongoRegs[0].name })

    const newD = gcRepo.create({
      code: d.code,
      is_disabled: d.disabled,
      value: !!d.original_amount ? Math.round(d.original_amount * 100) : 0,
      balance: Math.round(d.discount_rule.value * 100),
      region,
    })

    return gcRepo.save(newD)
  } else {
    const rcur = rcol.find({
      _id: { $in: d.regions.map(id => mongo.ObjectID(id)) },
    })
    const mongoRegs = await rcur.toArray()
    const regions = regRepo.find({ name: In(mongoRegs.map(r => r.name)) })

    const newD = discountRepo.create({
      code: d.code,
      is_dynamic: !!d.is_dynamic,
      discount_rule: ruleRepo.create({
        description: d.discount_rule.description,
        type: d.discount_rule.type,
        allocation: d.discount_rule.allocation,
        value:
          d.discount_rule.type === "percentage"
            ? d.discount_rule.value
            : Math.round(d.discount_rule.value * 100),
        usage_limit: d.discount_rule.usage_limit,
      }),
      is_disabled: d.disabled,
      regions,
    })

    return discountRepo.save(newD)
  }
}

/**
 * Migrates discounts
 * @param {MongoDb} mongodb
 * @param {QueryRunner} queryRunner
 */
const migrateDiscounts = async (mongodb, queryRunner) => {
  const dcol = mongodb.collection("discounts")

  const dcur = dcol.find({})
  const discounts = await dcur.toArray()
  for (const d of discounts) {
    await createDiscount(mongodb, queryRunner, d)
  }

  await migrateDynamicDiscounts(mongodb, queryRunner)
}

/**
 * Migrates dynamic discounts
 * @param {MongoDb} mongodb
 * @param {QueryRunner} queryRunner
 */
const migrateDynamicDiscounts = async (mongodb, queryRunner) => {
  const dcol = mongodb.collection("discounts")
  const dyncol = mongodb.collection("dynamicdiscountcodes")

  const dcur = dyncol.find({})
  const dynamicCodes = await dcur.toArray()

  const discountRepo = queryRunner.manager.getCustomRepository(
    DiscountRepository
  )

  const mongoV = {}
  const visited = {}

  const toSave = []
  for (const d of dynamicCodes) {
    let disc
    if (mongoV[d.discount_id]) {
      disc = mongoV[d.discount_id]
    } else {
      disc = await dcol.findOne({ _id: mongo.ObjectID(d.discount_id) })
      mongoV[d.discount_id] = disc
    }

    let discount
    if (visited[disc.code]) {
      discount = visited[disc.code]
    } else {
      const pare = await discountRepo.findOne({ code: disc.code })
      discount = pare
      visited[disc.code] = pare
    }

    const newD = discountRepo.create({
      code: d.code,
      is_dynamic: true,
      is_disabled: d.disabled,
      parent_discount: discount,
      discount_rule_id: discount.discount_rule_id,
    })
    toSave.push(newD)
  }

  return discountRepo.save(toSave)
}

/**
 * Migrates customers
 * @param {MongoDb} mongodb
 * @param {QueryRunner} queryRunner
 */
const migrateCustomers = async (mongodb, queryRunner) => {
  const col = mongodb.collection("customers")

  const cur = col.find({})
  const customers = await cur.toArray()

  const customerRepo = queryRunner.manager.getRepository(Customer)

  const toSave = []
  for (const c of customers) {
    if (toSave.find(s => s.email === c.email.toLowerCase())) {
      continue
    }

    const newC = customerRepo.create({
      email: c.email.toLowerCase(),
      first_name: c.first_name,
      last_name: c.last_name,
      phone: c.phone,
      has_account: c.has_account,
      password_hash: c.password_hash,
      metadata: c.metadata,
    })
    toSave.push(newC)
  }
  return customerRepo.save(toSave)
}

/**
 * Migrates orders
 * @param {MongoDb} mongodb
 * @param {QueryRunner} queryRunner
 */
const migrateOrders = async (mongodb, queryRunner) => {
  const swapCol = mongodb.collection("swaps")
  const rcol = mongodb.collection("regions")
  const rcur = rcol.find({})
  const regions = await rcur.toArray()

  const col = mongodb.collection("orders")

  const cur = col.find({})
  const orders = await cur.toArray()

  const regionRepo = queryRunner.manager.getRepository(Region)
  const customerRepo = queryRunner.manager.getRepository(Customer)
  const orderRepo = queryRunner.manager.getRepository(Order)
  const lineItemRepo = queryRunner.manager.getRepository(LineItem)
  const fulItemRepo = queryRunner.manager.getRepository(FulfillmentItem)
  const retItemRepo = queryRunner.manager.getRepository(ReturnItem)
  const fulfillmentRepo = queryRunner.manager.getRepository(Fulfillment)
  const paymentRepo = queryRunner.manager.getRepository(Payment)
  const refundRepo = queryRunner.manager.getRepository(Refund)
  const returnRepo = queryRunner.manager.getRepository(Return)
  const gcRepo = queryRunner.manager.getRepository(GiftCard)
  const swapRepo = queryRunner.manager.getRepository(Swap)
  const discountRepo = queryRunner.manager.getRepository(Discount)
  const methodRepo = queryRunner.manager.getRepository(ShippingMethod)
  const optionRepo = queryRunner.manager.getRepository(ShippingOption)
  const variantRepo = queryRunner.manager.getRepository(ProductVariant)
  const addressRepo = queryRunner.manager.getRepository(Address)
  const profileRepo = queryRunner.manager.getRepository(ShippingProfile)
  const fulProvRepo = queryRunner.manager.getRepository(FulfillmentProvider)

  for (const o of orders) {
    const mongoreg = regions.find(r => r._id.equals(o.region_id))
    const region = await regionRepo.findOne({ name: mongoreg.name })

    /*************************************************************************
     * SHIPPING METHODS
     *************************************************************************/
    const createShippingMethod = async m => {
      let shippingOption = await optionRepo.findOne({
        name: m.name,
        region_id: region.id,
      })
      if (!shippingOption) {
        const profile = await profileRepo.findOne({ type: "default" })
        let provider = await fulProvRepo.findOne({ id: m.provider_id })
        if (!provider) {
          const newly = fulProvRepo.create({
            id: m.provider_id,
            is_installed: false,
          })
          provider = await fulProvRepo.save(newly)
        }
        const newly = optionRepo.create({
          name: m.name,
          region_id: region.id,
          profile_id: profile.id,
          price_type: "flat_rate",
          amount: Math.round(m.price * 100),
          data: m.data,
          is_return: false,
          deleted_at: new Date(),
          provider,
        })
        shippingOption = await optionRepo.save(newly)
      }

      return methodRepo.create({
        shipping_option_id: shippingOption.id,
        price: Math.round(m.price * 100),
        data: m.data,
      })
    }

    let shippingMethods = []
    for (const m of o.shipping_methods) {
      const method = await createShippingMethod(m)
      shippingMethods.push(method)
    }

    /*************************************************************************
     * CUSTOMER
     *************************************************************************/
    let customer = await customerRepo.findOne({ email: o.email.toLowerCase() })
    if (!customer) {
      const n = customerRepo.create({
        email: o.email.toLowerCase(),
      })
      customer = await customerRepo.save(n)
    }

    /*************************************************************************
     * LINE ITEMS
     *************************************************************************/
    const createLineItem = async li => {
      let variant = await variantRepo.findOne({ sku: li.content.variant.sku })
      if (!variant) {
        variant = await variantRepo.findOne({ title: li.content.variant.title })
      }

      let fulfilled_quantity = Math.min(li.fulfilled_quantity || 0, li.quantity)
      let shipped_quantity = Math.min(
        li.fulfilled_quantity || 0,
        li.shipped_quantity || 0
      )
      let returned_quantity = Math.min(
        li.shipped_quantity || 0,
        li.returned_quantity || 0
      )

      return lineItemRepo.create({
        title: li.title,
        description: li.description,
        quantity: li.quantity,
        is_giftcard: !!li.is_giftcard,
        should_merge: !!li.should_merge,
        allow_discounts: !li.no_discount,
        thumbnail: li.thumbnail,
        unit_price: Math.round(li.content.unit_price * 100),
        variant,
        fulfilled_quantity,
        shipped_quantity,
        returned_quantity,
        metadata: li.metadata,
      })
    }

    const lineItems = []
    for (const li of o.items) {
      const lineitem = await createLineItem(li)
      lineItems.push(lineitem)
    }

    /*************************************************************************
     * DISCOUNT
     *************************************************************************/
    const discounts = []
    const giftCards = []
    for (const d of o.discounts) {
      if (d.is_giftcard) {
        let gc = await gcRepo.findOne({ code: d.code })
        if (!gc) {
          gc = await createDiscount(mongodb, queryRunner, d)
        }
        giftCards.push(gc)
      } else {
        let disc = await discountRepo.findOne({ code: d.code })
        if (!disc) {
          disc = await createDiscount(mongodb, queryRunner, d)
        }
        discounts.push(disc)
      }
    }

    /*************************************************************************
     * ADDREESS
     *************************************************************************/
    const address = addressRepo.create({
      customer,
      first_name: o.shipping_address.first_name,
      last_name: o.shipping_address.last_name,
      address_1: o.shipping_address.address_1,
      address_2: o.shipping_address.address_2,
      city: o.shipping_address.city,
      country_code: o.shipping_address.country_code.toLowerCase(),
      province: o.shipping_address.province,
      postal_code: o.shipping_address.postal_code,
      phone: o.shipping_address.phone,
    })

    /*************************************************************************
     * CREATE ORDER
     *************************************************************************/
    const nOrder = orderRepo.create({
      tax_rate: o.tax_rate * 100,
      currency_code: o.currency_code.toLowerCase(),
      email: o.email.toLowerCase(),
      status: o.status,
      fulfillment_status: o.fulfillment_status,
      payment_status: o.payment_status,
      shipping_address: address,
      billing_address: address,
      shipping_methods: shippingMethods,
      items: lineItems,
      gift_cards: giftCards,
      region,
      customer,
      discounts,
      created_at: new Date(parseInt(o.created)),
      canceled_at: o.status === "canceled" ? new Date() : null,
    })

    let or = await orderRepo.save(nOrder)
    or.display_id = o.display_id

    /*************************************************************************
     * FULFILLMENTS
     *************************************************************************/
    const createFulfillment = async (f, parent_items, seen) => {
      const items = f.items.map(fi => {
        const original = parent_items.find(
          li =>
            li.title === fi.title &&
            li.description === fi.description &&
            !seen[li.id]
        )

        if (!original) {
          console.log(f)
          console.log(parent_items)
        }

        seen[original.id] = true

        return fulItemRepo.create({
          item: original,
          quantity: fi.quantity,
        })
      })

      let provider = await fulProvRepo.findOne({ id: f.provider_id })

      const toCreate = {
        items,
        provider,
        order: or,
        tracking_numbers: f.tracking_numbers,
        data: {},
        metadata: f.metadata,
        canceled_at: f.is_canceled ? new Date() : null,
        shipped_at: f.shipped_at ? new Date(parseInt(f.shipped_at)) : null,
      }

      if (!!f.created) {
        toCreate.created_at = new Date(parseInt(f.created))
      }

      return fulfillmentRepo.create(toCreate)
    }

    const fulfillments = []
    for (const f of o.fulfillments) {
      const seen = {}
      const ful = await createFulfillment(f, or.items, seen)
      fulfillments.push(ful)
    }
    or.fulfillments = fulfillments

    /*************************************************************************
     * REFUNDS
     *************************************************************************/
    const refunds = []
    const totalRefund = 0
    for (const r of o.refunds) {
      const reason = r.reason || "return"
      totalRefund += r.amount
      refunds.push(
        refundRepo.create({
          order: or,
          currency_code: or.currency_code,
          amount: Math.round(r.amount * 100),
          reason,
          note: r.note,
          created_at: new Date(parseInt(r.created)),
        })
      )
    }
    or.refunds = refunds

    const createReturn = async r => {
      const m = r.shipping_method
      let method
      if (m && m.name) {
        let shippingOption = await optionRepo.findOne({
          name: m.name,
          region_id: region.id,
        })
        if (!shippingOption) {
          const profile = await profileRepo.findOne({ type: "default" })
          let provider = await fulProvRepo.findOne({ id: m.provider_id })
          if (!provider) {
            const newly = fulProvRepo.create({
              id: m.provider_id,
              is_installed: false,
            })
            provider = await fulProvRepo.save(newly)
          }
          const newly = optionRepo.create({
            name: m.name,
            region_id: region.id,
            profile_id: profile.id,
            price_type: "flat_rate",
            amount: Math.round(m.price * 100),
            data: m.data,
            is_return: true,
            deleted_at: new Date(),
            provider,
          })
          shippingOption = await optionRepo.save(newly)
        }

        method = methodRepo.create({
          shipping_option_id: shippingOption.id,
          price: Math.round(m.price * 100),
          data: m.data,
        })
      }

      const items = r.items.map(raw => {
        const ri = o.items.find(i => i._id.equals(raw.item_id))
        const original = or.items.find(
          li => li.title === ri.title && li.description === ri.description
        )

        return retItemRepo.create({
          item: original,
          quantity: raw.quantity,
          requested_quantity: raw.is_requested ? raw.quantity : null,
          received_quantity: raw.is_registered ? raw.quantity : null,
        })
      })

      return returnRepo.create({
        status: r.status || "received",
        order: or,
        refund_amount: Math.round(r.refund_amount * 100),
        shipping_method: method,
        shipping_data: r.shipping_data,
        items,
        received_at: r.status === "received" ? new Date() : null,
        created_at: new Date(parseInt(r.created)),
        metadata: r.metadata,
      })
    }

    /*************************************************************************
     * RETURNS
     *************************************************************************/
    const returns = []
    for (const r of o.returns) {
      if (r.items.length === 0) {
        continue
      }

      const ret = await createReturn(r)
      returns.push(ret)
    }

    or.returns = returns

    /*************************************************************************
     * SWAPS
     *************************************************************************/
    if (o.swaps) {
      const swapCur = swapCol.find({
        _id: { $in: o.swaps.map(i => mongo.ObjectID(i)) },
      })
      const oSwaps = await swapCur.toArray()
      if (oSwaps.length) {
        let swaps = []
        for (const s of oSwaps) {
          const toCreate = {
            fulfillment_status: s.fulfillment_status,
            payment_status: s.payment_status,
            additional_items: await Promise.all(
              s.additional_items.map(createLineItem)
            ),
            shipping_methods: await Promise.all(
              s.shipping_methods.map(createShippingMethod)
            ),
            created_at: new Date(parseInt(s.created)),
          }

          if (s.shipping_address) {
            const address = addressRepo.create({
              customer,
              first_name: s.shipping_address.first_name,
              last_name: s.shipping_address.last_name,
              address_1: s.shipping_address.address_1,
              address_2: s.shipping_address.address_2,
              city: s.shipping_address.city,
              country_code: s.shipping_address.country_code.toLowerCase(),
              province: s.shipping_address.province,
              postal_code: s.shipping_address.postal_code,
              phone: s.shipping_address.phone,
            })
            toCreate.shipping_address = address
          }

          if (s.return) {
            toCreate.return_order = await createReturn(s.return)
          }

          if (s.payment_method) {
            toCreate.payment = paymentRepo.create({
              amount:
                (s.payment_method.data && s.payment_method.data.amount) || 0,
              currency_code: s.currency_code.toLowerCase(),
              amount_refunded: 0,
              provider_id: o.payment_method.provider_id,
              data: o.payment_method.data,
              canceled_at: or.payment_status === "canceled" ? new Date() : null,
              captured_at:
                or.payment_status === "captured" ||
                or.payment_status === "refunded" ||
                or.payment_status === "partially"
                  ? new Date()
                  : null,
            })
          }

          const newly = swapRepo.create(toCreate)
          const sw = await swapRepo.save(newly)
          const seen = {}
          sw.fulfillments = await Promise.all(
            s.fulfillments.map(f =>
              createFulfillment(f, sw.additional_items, seen)
            )
          )
          swaps.push(sw)
        }

        or.swaps = swaps
      }
    }

    /*************************************************************************
     * PAYMENTS
     *************************************************************************/
    const amount =
      o.payment_method.provider_id === "stripe"
        ? o.payment_method.data.amount
        : o.payment_method.data.order_amount ||
          (o.payment_method.data.amount &&
            o.payment_method.data.amount.value) ||
          0
    or.payments = [
      paymentRepo.create({
        order: or,
        amount,
        currency_code: or.currency_code,
        amount_refunded: Math.round(totalRefund * 100),
        provider_id: o.payment_method.provider_id,
        data: o.payment_method.data,
        canceled_at: or.payment_status === "canceled" ? new Date() : null,
        captured_at:
          or.payment_status === "captured" ||
          or.payment_status === "refunded" ||
          or.payment_status === "partially"
            ? new Date()
            : null,
      }),
    ]

    await orderRepo.save(or)

    await queryRunner.query(
      `ALTER SEQUENCE order_display_id_seq RESTART WITH ${parseInt(
        o.display_id
      ) + 1}`
    )
  }
}

const migrate = async () => {
  const root = path.resolve(".")
  const { configModule } = getConfigFile(root, "medusa-config")
  const { mongo_url, database_type, database_url } = configModule.projectConfig

  if (!mongo_url) {
    throw new Error(
      "Cannot run migration script without a mongo_url in medusa-config"
    )
  }

  if (!database_type || !database_url) {
    throw new Error(
      "Cannot run migration script without a database_type and database_url in medusa-config"
    )
  }

  const mPath = path.resolve(__dirname, "../models")

  console.log(chalk.blue("MONGO:"), "Connecting to ", mongo_url)
  const client = await mongo.MongoClient.connect(mongo_url, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })

  const db = client.db(client.dbName)
  console.log(chalk.green("MONGO:"), "Connecting created")

  console.log(chalk.blue("SQL:"), "Connecting to ", database_url)
  const sqlConnection = await createConnection({
    type: database_type,
    url: database_url,
    entities: [`${mPath}/*.js`],
    // logging: true,
  })
  const queryRunner = sqlConnection.createQueryRunner()
  await queryRunner.connect()
  await queryRunner.startTransaction()
  console.log(chalk.green("SQL:"), "Connecting created")

  let error
  try {
    await queryRunner.query(
      "UPDATE country SET region_id=NULL WHERE iso_2 IS NOT NULL"
    )
    await queryRunner.query(`DELETE FROM store WHERE id IS NOT NULL`)
    await queryRunner.query(
      `DELETE FROM return_item WHERE return_id IS NOT NULL`
    )
    await queryRunner.query(
      `DELETE FROM fulfillment_item WHERE fulfillment_id IS NOT NULL`
    )
    await queryRunner.query(`DELETE FROM line_item WHERE id IS NOT NULL`)
    await queryRunner.query("DELETE FROM gift_card WHERE code IS NOT NULL")
    await queryRunner.query("DELETE FROM discount WHERE code IS NOT NULL")
    await queryRunner.query("DELETE FROM discount_rule WHERE type IS NOT NULL")
    await queryRunner.query(
      "DELETE FROM money_amount WHERE currency_code IS NOT NULL"
    )
    await queryRunner.query(
      `DELETE FROM product_option_value WHERE value IS NOT NULL`
    )
    await queryRunner.query(
      `DELETE FROM product_option WHERE title IS NOT NULL`
    )
    await queryRunner.query(
      `DELETE FROM product_variant WHERE title IS NOT NULL`
    )
    await queryRunner.query(`DELETE FROM product WHERE title is NOT NULL`)
    await queryRunner.query(
      `DELETE FROM shipping_option_requirement WHERE id IS NOT NULL`
    )
    await queryRunner.query(`DELETE FROM shipping_method WHERE id IS NOT NULL`)
    await queryRunner.query(
      `DELETE FROM shipping_option WHERE name IS NOT NULL`
    )
    await queryRunner.query(
      `DELETE FROM order_discounts WHERE order_id IS NOT NULL`
    )
    await queryRunner.query(`DELETE FROM fulfillment WHERE id IS NOT NULL`)
    await queryRunner.query(`DELETE FROM swap WHERE id IS NOT NULL`)
    await queryRunner.query(`DELETE FROM return WHERE id IS NOT NULL`)
    await queryRunner.query(`DELETE FROM payment WHERE id IS NOT NULL`)
    await queryRunner.query(`DELETE FROM refund WHERE id IS NOT NULL`)
    await queryRunner.query(`DELETE FROM "order" WHERE id IS NOT NULL`)
    await queryRunner.query(`DELETE FROM address WHERE id IS NOT NULL`)
    await queryRunner.query(`DELETE FROM region WHERE name IS NOT NULL`)
    await queryRunner.query(`DELETE FROM customer WHERE email IS NOT NULL`)

    await migrateStore(db, queryRunner).then(() => {
      console.log(chalk.green("SUCCESS: "), "Store migrated")
    })

    await migrateRegions(db, queryRunner).then(() => {
      console.log(chalk.green("SUCCESS: "), "Regions migrated")
    })

    await migrateShippingOptions(db, queryRunner).then(() => {
      console.log(chalk.green("SUCCESS: "), "Shipping Options Migrated")
    })

    await migrateProducts(db, queryRunner).then(() => {
      console.log(chalk.green("SUCCESS: "), "Products migrated")
    })

    await migrateDiscounts(db, queryRunner).then(() => {
      console.log(chalk.green("SUCCESS: "), "Discounts migrated")
    })

    await migrateCustomers(db, queryRunner).then(() => {
      console.log(chalk.green("SUCCESS: "), "Customers migrated")
    })

    await migrateOrders(db, queryRunner).then(() => {
      console.log(chalk.green("SUCCESS: "), "Orders migrated")
    })

    await queryRunner.commitTransaction()
  } catch (err) {
    await queryRunner.rollbackTransaction()
    error = err
  } finally {
    await queryRunner.release()
  }

  if (error) {
    throw error
  }
}

migrate()
  .then(() => {
    console.log("Migration complete")
    process.exit()
  })
  .catch(err => {
    console.log(err)
    process.exit(1)
  })
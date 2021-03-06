import { MedusaError } from "medusa-core-utils"

export default async (req, res) => {
  const { id } = req.params

  const idempotencyKeyService = req.scope.resolve("idempotencyKeyService")

  const headerKey = req.get("Idempotency-Key") || ""

  let idempotencyKey
  try {
    idempotencyKey = await idempotencyKeyService.initializeRequest(
      headerKey,
      req.method,
      req.params,
      req.path
    )
  } catch (error) {
    console.log(error)
    res.status(409).send("Failed to create idempotency key")
    return
  }

  res.setHeader("Access-Control-Expose-Headers", "Idempotency-Key")
  res.setHeader("Idempotency-Key", idempotencyKey.idempotency_key)

  try {
    const cartService = req.scope.resolve("cartService")
    const orderService = req.scope.resolve("orderService")
    const swapService = req.scope.resolve("swapService")

    let inProgress = true
    let err = false

    while (inProgress) {
      switch (idempotencyKey.recovery_point) {
        case "started": {
          const { key, error } = await idempotencyKeyService.workStage(
            idempotencyKey.idempotency_key,
            async manager => {
              const cart = await cartService
                .withTransaction(manager)
                .authorizePayment(id, {
                  ...req.request_context,
                  idempotency_key: idempotencyKey.idempotency_key,
                })

              if (cart.payment_session) {
                if (
                  cart.payment_session.status === "requires_more" ||
                  cart.payment_session.status === "pending"
                ) {
                  return {
                    response_code: 200,
                    response_body: { data: cart },
                  }
                }
              }

              return {
                recovery_point: "payment_authorized",
              }
            }
          )

          if (error) {
            inProgress = false
            err = error
          } else {
            idempotencyKey = key
          }
          break
        }

        case "payment_authorized": {
          const { key, error } = await idempotencyKeyService.workStage(
            idempotencyKey.idempotency_key,
            async manager => {
              const cart = await cartService
                .withTransaction(manager)
                .retrieve(id, {
                  select: ["total"],
                  relations: ["payment", "payment_sessions"],
                })

              let order

              // If cart is part of swap, we register swap as complete
              switch (cart.type) {
                case "swap": {
                  const swapId = cart.metadata?.swap_id
                  order = await swapService
                    .withTransaction(manager)
                    .registerCartCompletion(swapId)

                  order = await swapService
                    .withTransaction(manager)
                    .retrieve(order.id, { relations: ["shipping_address"] })

                  return {
                    response_code: 200,
                    response_body: { data: order },
                  }
                }
                // case "payment_link":
                default: {
                  if (!cart.payment && cart.total > 0) {
                    throw new MedusaError(
                      MedusaError.Types.INVALID_DATA,
                      `Cart payment not authorized`
                    )
                  }

                  try {
                    order = await orderService
                      .withTransaction(manager)
                      .createFromCart(cart.id)
                  } catch (error) {
                    if (
                      error &&
                      error.message === "Order from cart already exists"
                    ) {
                      order = await orderService
                        .withTransaction(manager)
                        .retrieveByCartId(id, {
                          select: [
                            "subtotal",
                            "tax_total",
                            "shipping_total",
                            "discount_total",
                            "total",
                          ],
                          relations: ["shipping_address", "items", "payments"],
                        })

                      return {
                        response_code: 200,
                        response_body: { data: order },
                      }
                    } else {
                      throw error
                    }
                  }
                }
              }

              order = await orderService
                .withTransaction(manager)
                .retrieve(order.id, {
                  select: [
                    "subtotal",
                    "tax_total",
                    "shipping_total",
                    "discount_total",
                    "total",
                  ],
                  relations: ["shipping_address", "items", "payments"],
                })

              return {
                response_code: 200,
                response_body: { data: order },
              }
            }
          )

          if (error) {
            inProgress = false
            err = error
          } else {
            idempotencyKey = key
          }
          break
        }

        case "finished": {
          inProgress = false
          break
        }

        default:
          idempotencyKey = await idempotencyKeyService.update(
            idempotencyKey.idempotency_key,
            {
              recovery_point: "finished",
              response_code: 500,
              response_body: { message: "Unknown recovery point" },
            }
          )
          break
      }
    }

    if (err) {
      throw err
    }

    res.status(idempotencyKey.response_code).json(idempotencyKey.response_body)
  } catch (error) {
    console.log(error)
    throw error
  }
}

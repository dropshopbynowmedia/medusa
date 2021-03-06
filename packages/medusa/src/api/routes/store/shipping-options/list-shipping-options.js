import { Validator, MedusaError } from "medusa-core-utils"

export default async (req, res) => {
  const schema = Validator.object().keys({
    cart_id: Validator.string().required(),
  })

  const { value, error } = schema.validate(req.params)
  if (error) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, error.details)
  }

  try {
    const cartService = req.scope.resolve("cartService")
    const shippingProfileService = req.scope.resolve("shippingProfileService")

    const cart = await cartService.retrieve(value.cart_id, {
      select: ["subtotal"],
      relations: ["region", "items", "items.variant", "items.variant.product"],
    })

    const options = await shippingProfileService.fetchCartOptions(cart)

    res.status(200).json({ shipping_options: options })
  } catch (err) {
    throw err
  }
}

import { defaultFields, defaultRelations } from "./"
export default async (req, res) => {
  const { id } = req.params

  try {
    const cartService = req.scope.resolve("cartService")

    // Ask the cart service to set payment sessions
    await cartService.setPaymentSessions(id)

    // return the updated cart
    const cart = await cartService.retrieve(id, {
      select: defaultFields,
      relations: defaultRelations,
    })

    res.status(200).json({ cart })
  } catch (err) {
    throw err
  }
}

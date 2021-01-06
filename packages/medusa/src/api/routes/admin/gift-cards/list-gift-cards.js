export default async (req, res) => {
  try {
    const selector = {}

    const giftCardService = req.scope.resolve("giftCardService")

    const giftCards = await giftCardService.list(selector)

    res.status(200).json({ gift_cards: giftCards })
  } catch (err) {
    throw err
  }
}
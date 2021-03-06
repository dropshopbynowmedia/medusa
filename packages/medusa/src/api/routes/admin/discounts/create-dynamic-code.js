import { MedusaError, Validator } from "medusa-core-utils"

export default async (req, res) => {
  const { discount_id } = req.params

  const schema = Validator.object().keys({
    code: Validator.string().required(),
    metadata: Validator.object().optional(),
  })

  const { value, error } = schema.validate(req.body)
  if (error) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, error.details)
  }

  try {
    const discountService = req.scope.resolve("discountService")
    await discountService.createDynamicCode(discount_id, value)

    const discount = await discountService.retrieve(discount_id, {
      relations: ["rule", "rule.valid_for", "regions"],
    })

    res.status(200).json({ discount })
  } catch (err) {
    throw err
  }
}

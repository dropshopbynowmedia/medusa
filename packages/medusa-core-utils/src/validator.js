import Joi from "joi"

Joi.objectId = require("joi-objectid")(Joi)

Joi.address = () => {
  return Joi.object().keys({
    first_name: Joi.string().required(),
    last_name: Joi.string().required(),
    address_1: Joi.string().required(),
    address_2: Joi.string().allow(null),
    city: Joi.string().required(),
    country_code: Joi.string().required(),
    province: Joi.string().allow(null),
    postal_code: Joi.string().required(),
    phone: Joi.string().optional(),
    metadata: Joi.object().allow(null),
  })
}

export default Joi

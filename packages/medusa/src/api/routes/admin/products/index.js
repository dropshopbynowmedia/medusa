import { Router } from "express"
import middlewares from "../../../middlewares"

const route = Router()

export default app => {
  app.use("/products", route)

  route.post("/", middlewares.wrap(require("./create-product").default))
  route.post("/:id", middlewares.wrap(require("./update-product").default))
  route.post(
    "/:id/publish",
    middlewares.wrap(require("./publish-product").default)
  )

  route.post(
    "/:id/variants",
    middlewares.wrap(require("./create-variant").default)
  )

  route.get(
    "/:id/variants",
    middlewares.wrap(require("./get-variants").default)
  )

  route.post(
    "/:id/variants/:variant_id",
    middlewares.wrap(require("./update-variant").default)
  )

  route.post(
    "/:id/options/:option_id",
    middlewares.wrap(require("./update-option").default)
  )
  route.post("/:id/options", middlewares.wrap(require("./add-option").default))

  route.delete(
    "/:id/variants/:variant_id",
    middlewares.wrap(require("./delete-variant").default)
  )
  route.delete("/:id", middlewares.wrap(require("./delete-product").default))
  route.delete(
    "/:id/options/:option_id",
    middlewares.wrap(require("./delete-option").default)
  )

  route.post(
    "/:id/metadata",
    middlewares.wrap(require("./set-metadata").default)
  )

  route.get("/:id", middlewares.wrap(require("./get-product").default))
  route.get("/", middlewares.wrap(require("./list-products").default))

  return app
}

export const defaultRelations = [
  "variants",
  "variants.prices",
  "images",
  "options",
]

export const defaultFields = [
  "id",
  "title",
  "subtitle",
  "description",
  "tags",
  "handle",
  "is_giftcard",
  "thumbnail",
  "profile_id",
  "weight",
  "length",
  "height",
  "width",
  "hs_code",
  "origin_country",
  "mid_code",
  "material",
  "created_at",
  "updated_at",
  "metadata",
]

export const allowedFields = [
  "id",
  "title",
  "subtitle",
  "description",
  "tags",
  "handle",
  "is_giftcard",
  "thumbnail",
  "profile_id",
  "weight",
  "length",
  "height",
  "width",
  "hs_code",
  "origin_country",
  "mid_code",
  "material",
  "created_at",
  "updated_at",
  "metadata",
]

export const allowedRelations = [
  "variants",
  "variants.prices",
  "images",
  "options",
]

import { Router } from "express"
import middlewares from "../../../middlewares"

const route = Router()

export default app => {
  app.use("/returns", route)

  /**
   * List returns
   */
  route.get("/", middlewares.wrap(require("./list-returns").default))

  return app
}

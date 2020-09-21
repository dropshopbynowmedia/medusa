import { Router } from "express"
import cors from "cors"
import bodyParser from "body-parser"
import middlewares from "../../middlewares"
import { getConfigFile } from "medusa-core-utils"

const route = Router()

export default (app, rootDirectory) => {
  const { configModule } = getConfigFile(rootDirectory, `medusa-config`)
  const config = (configModule && configModule.projectConfig) || {}

  const storeCors = config.store_cors || ""
  route.use(
    cors({
      origin: storeCors.split(","),
      credentials: true,
    })
  )

  app.use("/reepay", route)

  route.post(
    "/event",
    bodyParser.json(),
    middlewares.wrap(require("./reepay-events").default)
  )

  return app
}

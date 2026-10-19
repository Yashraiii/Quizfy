import { ZodTypeAny } from "zod"
import { Request, Response, NextFunction } from "express"

const validate = (schema: ZodTypeAny, source: "body" | "query" | "params" = "body") => {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[source])

    if (!result.success) {
      return res.status(400).json({
        success: false,
        errors: result.error?.issues.map(e => ({
          field: e.path[0],
          message: e.message
        }))
      })
    }
    req[source] = result.data
    next()
  }
}

export default validate
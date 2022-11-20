import { Config } from "./types"
import { NowApiHandler } from "@vercel/node"
import assert from "ow"
import { createLambdaHandler } from "./fastify-lambda"
import fastify from "fastify"
import { registerCookieMiddleware } from "./fastify-cookie"
import { registerGoogleOAuth } from "./google-oauth"
import { registerServeStatic } from "./fastify-static"

/**
 * GOOGLE_OAUTH_CLIENT_ID=135351410126-8i1fj70m1sqnbivenmhie13m6fobon63.apps.googleusercontent.com
 * GOOGLE_OAUTH_CLIENT_SECRET=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
 */

export const createLambdaProxyAuthHandler: (config: Config) => NowApiHandler = (
  config,
) => {
  assert(config.cryptoSecret, "config.cryptoSecret", assert.string.nonEmpty)
  assert(config.googleClientId, "config.googleClientId", assert.string.nonEmpty)
  assert(
    config.googleClientSecret,
    "config.googleClientSecret",
    assert.string.nonEmpty,
  )

  const server = fastify({ logger: true })

  registerCookieMiddleware(server, config)
  registerGoogleOAuth(server, config)
  registerServeStatic(server, config)

  return createLambdaHandler(server)
}

export type { Config } from "./types"

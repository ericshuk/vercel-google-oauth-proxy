import { createLambdaProxyAuthHandler } from "../lib"
import path from "path"

export default createLambdaProxyAuthHandler({
  cryptoSecret: process.env.CRYPTO_SECRET!,
  googleClientId: process.env.GOOGLE_CLIENT_ID!,
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  googleRedirectUri: process.env.GOOGLE_REDIRECT_URI!,
  staticDir: path.resolve(__dirname, "../static"),
  sessionDurationSeconds: 604800, // 1 week
})

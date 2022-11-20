import {
  Config,
  GoogleAccessToken,
  GoogleUser,
  OAuthState,
  RoutePrams,
} from "./types"
import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify"

import { URLSearchParams } from "url"
import axios from "axios"
import { nanoid } from "nanoid"

export function registerGoogleOAuth(server: FastifyInstance, config: Config) {
  const secureCookies = !!process.env.VERCEL_URL

  const urls = {
    localAuthorize: "/login/oauth/authorize",
    localMembershipError: "/login/oauth/error-membership",
    localGenericError: "/login/oauth/error",
    googleAuthorize: "https://accounts.google.com/o/oauth2/v2/auth",
    googleToken: "https://oauth2.googleapis.com/token",
    googleUserDetails: "https://www.googleapis.com/oauth2/v1/userinfo",
  }

  const cookieNames = {
    state: "state",
    user: "user",
  } as const

  const formatQueryParams = (params: NodeJS.Dict<string>) => {
    return "?" + new URLSearchParams(params).toString()
  }

  const unsignCookie = (res: FastifyReply, value: string) => {
    const unsigned = res.unsignCookie(value)

    if (unsigned.valid) {
      return JSON.parse(unsigned.value || "null")
    }
  }

  /**
   * Make sure the authentication request was initiated by this application.
   */
  const initiateOAuth = async (req: FastifyRequest, res: FastifyReply) => {
    const state: OAuthState = {
      randomToken: nanoid(),
      path: req.url,
    }

    res.clearCookie(cookieNames.user)
    res.setCookie(cookieNames.state, JSON.stringify(state), {
      httpOnly: true,
      maxAge: config.sessionDurationSeconds,
      path: "/",
      sameSite: "lax",
      secure: secureCookies,
      signed: true,
    })
    res.redirect(302, urls.localAuthorize)
  }

  //
  // https://developers.google.com/identity/protocols/oauth2/web-server#httprest_1
  //
  const redirectToGoogle = async (
    req: FastifyRequest<RoutePrams>,
    res: FastifyReply,
  ) => {
    const query = formatQueryParams({
      client_id: config.googleClientId,
      redirect_uri: config.googleRedirectUri,
      response_type: "code",
      scope:
        "https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile",
      state: req.cookies[cookieNames.state],
    })
    res.redirect(302, urls.googleAuthorize + query)
  }

  const denyAccess = async (res: FastifyReply, message?: string) => {
    res.clearCookie(cookieNames.user)
    res.clearCookie(cookieNames.state)
    res.status(401).send({
      statusCode: 401,
      error: "Unauthorized",
      message,
    })
  }

  const getGoogleAccessToken = async (
    code: string,
  ): Promise<GoogleAccessToken> => {
    const url = urls.googleToken
    const headers = {
      Accept: "application/json",
    }
    const body = {
      client_id: config.googleClientId,
      client_secret: config.googleClientSecret,
      code,
      grant_type: "authorization_code",
      redirect_uri: config.googleRedirectUri,
    }

    const { data } = await axios.post<GoogleAccessToken>(url, body, { headers })

    return data
  }

  const getGoogleUser = async (
    tokenData: GoogleAccessToken,
  ): Promise<GoogleUser> => {
    const url = urls.googleUserDetails
    const headers = {
      Accept: "application/json",
      Authorization: `${tokenData.token_type} ${tokenData.access_token}`,
    }

    const { data } = await axios.get<GoogleUser>(url, { headers })

    return data
  }

  const retrieveState = (
    req: FastifyRequest<RoutePrams>,
    res: FastifyReply,
  ) => {
    const state: OAuthState = unsignCookie(res, req.query.state || "")
    const expectedState: OAuthState = unsignCookie(
      res,
      req.cookies[cookieNames.state] || "",
    )

    if (
      !state?.randomToken ||
      state.randomToken !== expectedState?.randomToken
    ) {
      throw new Error("State mismatch")
    }

    return state
  }

  const succeed = (res: FastifyReply, user: GoogleUser, path: string) => {
    res.setCookie(cookieNames.user, JSON.stringify(user), {
      httpOnly: false,
      maxAge: config.sessionDurationSeconds,
      path: "/",
      sameSite: "lax",
      secure: secureCookies,
      signed: false,
    })
    res.redirect(302, path)
  }

  //
  // https://www.fastify.io/docs/latest/Hooks/
  //
  server.addHook<RoutePrams>("preValidation", async (req, res) => {
    try {
      if (req.url === urls.localGenericError) {
        return denyAccess(
          res,
          "It appears that the authentication request was initiated or processed incorrectly.",
        )
      }

      if (req.url === urls.localAuthorize) {
        return redirectToGoogle(req, res)
      }

      if (req.cookies[cookieNames.state] && req.cookies[cookieNames.user]) {
        if (req.query.state || req.query.code) {
          const state = retrieveState(req, res)
          return res.redirect(302, state.path)
        }
        return
      }

      const code = req.query.code

      if (!code) {
        return initiateOAuth(req, res)
      }

      const state = retrieveState(req, res)
      const tokenData = await getGoogleAccessToken(code)
      const user: GoogleUser = await getGoogleUser(tokenData)

      console.log("Login attempt:", user.email)

      return succeed(res, user, state.path)
    } catch (error) {
      console.error(error)
      return res.redirect(302, urls.localGenericError)
    }
  })
}

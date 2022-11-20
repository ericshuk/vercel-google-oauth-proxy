export interface Config {
  cryptoSecret: string
  staticDir: string
  sessionDurationSeconds: number
  googleClientId: string
  googleClientSecret: string
  googleRedirectUri: string
}

export interface OAuthState {
  randomToken: string
  path: string
}

export interface RoutePrams {
  Querystring: {
    code?: string
    state?: string
  }
}

export interface GoogleAccessToken {
  token_type: string
  scope: string
  access_token: string
  expires_in: number
  id_token: string
}

export interface GitHubOrgMembership {
  login: string
  id: number
  node_id: string
  avatar_url: string
  gravatar_id: string
  url: string
  html_url: string
  followers_url: string
  following_url: string
  gists_url: string
  starred_url: string
  subscriptions_url: string
  organizations_url: string
  repos_url: string
  events_url: string
  received_events_url: string
  type: string
  site_admin: boolean
}

export interface GitHubPlan {
  name: string
  space: number
  private_repos: number
  collaborators: number
}

export interface GoogleUser {
  id: string
  email: string
  verified_email: boolean
  name: string
  given_name: string
  family_name: string
  picture: string
  locale: string
  hd: string
}

export interface StaticFallbacks {
  [url: string]: string
}

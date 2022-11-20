<h1 align="center">
  ▲🔐 Vercel Google OAuth Proxy
</h1>

<p align="center">
  Protect a static website hosted on Vercel behind Google authentication.
</p>

## Setup

### Step 1 — Add the library

```
yarn add vercel-google-oauth-proxy
```

### Step 2 — Create an API endpoint at `/api/index.ts`

```ts
import { createLambdaProxyAuthHandler } from "vercel-google-oauth-proxy"

export default createLambdaProxyAuthHandler(config)
```

`config.cryptoSecret`

This is used to sign cookies.

`config.staticDir`

The output directory of the static website.

`config.googleClientId`
`config.googleClientSecret`
`config.googleRedirectUri`

The id/secret/redirectUri of your Google OAuth app.
You can create a new app in the [Google Cloud Console](https://console.cloud.google.com/).

Set your organization to internal to restrict logins to those inside your organization.

Therefore we're using a separate org admin token to verify membership during login (org admins can see all users).

### Step 3 — Create a `vercel.json`

```json
{
  "version": 2,
  "routes": [{ "src": "/(.*)", "dest": "/api/index.ts" }],
  "functions": {
    "api/index.ts": {
      "includeFiles": "static/**"
    }
  }
}
```

This routes all traffic through the lambda endpoint.

Adapt `includeFiles` to your public output folder. Including these files is required because the static website needs to be deployed as part of the lambda function, not the default build. See also the [function docs](https://vercel.com/docs/configuration?query=includeFiles#project/functions) and [limits](https://vercel.com/docs/platform/limits?query=includeFiles#serverless-function-size).

### Step 4 — Build

If you have an existing `build` script, rename it to `vercel-build` to build your website as part of the lambda build instead of the normal build.

Make sure to not keep the `build` script as it would result in duplicate work or may break deployment entirely. For more information see [custom-build-step-for-node-js](https://vercel.com/docs/runtimes#advanced-usage/advanced-node-js-usage/custom-build-step-for-node-js).

```json
{
  "scripts": {
    "vercel-build": "your website build command"
  }
}
```

## Local development

To develop locally, run

```
yarn vercel dev
```

When developing locally, you'll need to update your Google OAuth app's redirect URL to `http://localhost:3000`.

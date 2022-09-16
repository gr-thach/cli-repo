# guardrailsio/api

> ⚡ GuardRails API

Production (based on `master`): https://api.guardrails.io  
Staging (based on `develop`): https://staging.api.guardrails.io

## Install

```bash
$ git clone git@github.com:guardrailsio/api.git
$ cd api
$ npm install
```

## Usage

```bash
$ npm start

> @guardrails/api@1.0.0 start /Users/kytwb/Desktop/devops/api
> node index.js

================================
 Missing environment variables:
    AMQP_URI: undefined
    GITHUB_APP_ISSUER_ID: undefined
    GUARDRAILS_CLI_TOKEN_SECRET: undefined
    GUARDRAILS_JWT_TOKEN_SECRET: undefined
    GUARDRAILS_SAU_PRIVATE_KEY_BASE64: undefined
    GUARDRAILS_SAU_SECRET_KEY: undefined
```

You can add a `.env` file with the missing environment variables and manage your own dependencies, or use [guardrails/devops](https://github.com/guardrailsio/devops) development environment that will take care of setting up most of that with Docker Compose.

## Wiki

- [Endpoints](https://github.com/guardrailsio/api/wiki/Endpoints)
- [Access Control Layer (ACL)](<https://github.com/guardrailsio/api/wiki/Access-Control-Layer-(ACL)>)
- [Sign As User (SAU)](<https://github.com/guardrailsio/api/wiki/Sign-As-User-(SAU)>)

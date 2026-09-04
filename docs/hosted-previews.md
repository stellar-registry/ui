# Hosted pull-request previews

The repository supports Cloudflare Workers Builds previews. A Cloudflare account
administrator must connect the Worker to GitHub once; the repository files alone
do not publish a site or install the GitHub integration.

## Targets and isolation

| Purpose                              | Worker           | Build command                          | Publisher                          |
| ------------------------------------ | ---------------- | -------------------------------------- | ---------------------------------- |
| PR review / latest main review build | `registry-ui`    | `npm run build:preview`                | Cloudflare Workers Builds          |
| Live Testnet UI                      | `rgstry-testnet` | `CLOUDFLARE_ENV=testnet npm run build` | Existing GitHub Actions deployment |
| Live Mainnet UI                      | `rgstry-stellar` | `CLOUDFLARE_ENV=stellar npm run build` | Existing GitHub Actions deployment |

`build:preview` selects `wrangler.preview.jsonc` using the Vite plugin's
`CLOUDFLARE_VITE_WRANGLER_CONFIG_PATH` setting and clears `CLOUDFLARE_ENV`. It
then checks the generated upload config for the expected Worker, Testnet
endpoints, preview flags, static assets, and absence of custom domains. GitHub
CI builds and checks this target without credentials or publishing anything.

Keeping preview flags in a separate config avoids inheriting them into the named
environments in `wrangler.jsonc`. The live deployment workflow is unchanged.
Normal builds and preview builds share `build/`; always rebuild the intended
target immediately before an upload.

## One-time Cloudflare setup

1. In the intended Cloudflare account, create or select the dedicated
   `registry-ui` Worker. Do not connect `rgstry-testnet` or `rgstry-stellar` to
   these build settings. If `registry-ui` already serves something else, stop
   and choose a dedicated name before configuring it; update the preview config
   and its validation together.
2. Open **Settings → Builds → Connect**, authorize the Cloudflare Workers &
   Pages GitHub App for only `stellar-registry/ui`, and select that repository.
3. Use these settings for the dedicated review Worker:

   | Setting                                  | Value                                 |
   | ---------------------------------------- | ------------------------------------- |
   | Root directory                           | Repository root (`/`)                 |
   | Production branch                        | `main`                                |
   | Build command                            | `npm ci && npm run build:preview`     |
   | Production branch deploy command         | `npx wrangler deploy`                 |
   | Non-production branch deploy command     | `npx wrangler versions upload`        |
   | Builds for non-production branches       | Enabled                               |
   | Build variable `NODE_VERSION`            | `22`                                  |
   | Build variable `SKIP_DEPENDENCY_INSTALL` | `1` (the build command runs `npm ci`) |

   Use npm 10.9.x, as required by `package.json`. Do not add `--env testnet` or
   `--env stellar` to these commands. Wrangler reads the generated configuration
   from the preview build, including the server bundle and client assets; do not
   pass the source config to the upload command instead.

4. Use a Cloudflare-managed or appropriately restricted build token. Do not copy
   the production GitHub Actions API token or application secrets into preview
   build variables. Review repository write access and build-token permissions;
   a separate Worker is not a security sandbox for untrusted build code.
5. Push a commit to the PR branch after connection, or trigger its build in
   Cloudflare. Check the resulting PR comment and build check.

Here, Cloudflare's **production branch** setting means the main deployment of
the dedicated review Worker only. It does not deploy either live network Worker.
Before this change is on `main`, that branch will not have `build:preview`; its
first build with these settings will fail. This PR branch can still be built and
previewed before merging. Retry `main` after merging.

## Review a PR

Cloudflare's GitHub integration posts a build comment containing preview links.
Use the branch alias for a URL that follows new commits, or a version URL to
review one exact build. For the design gallery, append:

- `/explorer-preview`
- `/explorer-preview/continuum`
- `/explorer-preview/workbench`
- `/explorer-preview/console`

The non-production command uploads a version without changing traffic on the
Worker's main deployment. New PR commits receive new version URLs; the branch
alias points to the latest successful upload. Existing previews are not promised
to disappear when a PR closes, so do not treat them as expiring secret links.

## Access and verification

- Previews are public unless Cloudflare Access is configured. Set the intended
  access policy before the first preview if review should be private.
- The whole app is hosted, not just the design gallery. The `/explorer-preview`
  fixtures do not sign or submit transactions; other app routes can use the real
  Testnet API and wallet flows. Worker configuration does not make all app code
  read-only.
- Do not attach Mainnet variables, production domains, or production secrets to
  the review Worker. Uploaded versions can inherit existing Worker secrets, so
  use a dedicated Worker without production secrets.
- For the first hosted build, verify each gallery route, an asset request, and
  the Testnet network label outside the gallery. Confirm the upload targets
  `registry-ui` and that Cloudflare posts a comment on the intended PR.
- If no comment appears, confirm the GitHub App's repository access,
  non-production branch builds, the preview build command, and enabled Preview
  URLs in the review Worker's **Domains & Routes** settings.

## References

- [Cloudflare GitHub integration](https://developers.cloudflare.com/workers/ci-cd/builds/git-integration/github-integration/)
- [Workers Builds settings](https://developers.cloudflare.com/workers/ci-cd/builds/configuration/)
- [Build-image version and dependency settings](https://developers.cloudflare.com/workers/ci-cd/builds/build-image/)
- [Version and branch-alias preview URLs, access, and limits](https://developers.cloudflare.com/workers/versions-and-deployments/preview-urls/)
- [Vite plugin configuration selection](https://developers.cloudflare.com/workers/vite-plugin/reference/api/)

# How To Contribute

## Installation

- `git clone https://github.com/nickschot/ember-mobile-pane.git`
- `cd ember-mobile-pane`
- `pnpm install`

## Linting

- `pnpm lint`
- `pnpm lint:fix`

## Building the addon

- `pnpm build`

## Running tests

- `pnpm test`: runs the test suite on the current Ember version
- `pnpm start` and visit [http://localhost:5173/tests/](http://localhost:5173/tests/): runs the tests in the browser, re-running on changes

### Testing against other Ember versions

The scenarios live in `.try.mjs` (ember-source 3.28 up to alpha). To run one
locally:

```sh
pnpm dlx @embroider/try apply ember-lts-4.12
pnpm install --no-lockfile
ENABLE_COMPAT_BUILD=true pnpm test   # only for scenarios with `env.ENABLE_COMPAT_BUILD`
git checkout package.json pnpm-lock.yaml && git clean -fd config ember-cli-build.cjs
```

## Running the demo application

- `pnpm start`
- Visit the demo application at [http://localhost:5173](http://localhost:5173).

## Releasing

Releases are made with [release-plan](https://github.com/embroider-build/release-plan).
Label merged PRs (`breaking`, `enhancement`, `bug`, `documentation`, `internal`)
and merge the "Prepare Release" PR it opens to publish. See
[RELEASE.md](RELEASE.md).

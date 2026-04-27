# Release

This repository publishes to npmjs.org from GitHub Actions when a `v*` tag is pushed.

## Prerequisites

- You have access to the npm package and the GitHub repository.
- npm Trusted Publisher is configured for this repository on npmjs.org.
- The `main` branch is up to date and passing local checks.

## Release Steps

1. Update the package version in `package.json`.

   Use the next patch, minor, or major version as appropriate.

2. Run the local checks.

   ```bash
   bun install
   bun run check
   bun run typecheck
   bun run build
   ```

3. Commit the version bump.

   ```bash
   git add package.json
   git commit -m "fix(release): bump package version to x.y.z"
   ```

   Add `bun.lock` too if the release work changed dependencies or lockfile state.

4. Create the release tag on `main`.

   ```bash
   git tag -a vx.y.z -m "Release vx.y.z"
   ```

5. Push `main` and the tag.

   ```bash
   git push origin main
   git push origin refs/tags/vx.y.z
   ```

6. Watch the GitHub Actions run for the tag push.

   The publish workflow runs on tag pushes only and publishes with npm Trusted Publishing via OIDC.

## Notes

- The tag name and `package.json` version should match.
- If npm rejects the publish as an already published version, bump the version and tag again.

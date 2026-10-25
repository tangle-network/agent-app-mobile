# Agent App Mobile

Native mobile adapter for `@tangle-network/agent-app`.

## Boundary

- This repo owns React Native / Expo UI and mobile transport adapters.
- `@tangle-network/agent-app` owns runtime, stream, tool, mission, trace, billing, and profile primitives.
- Do not import `@tangle-network/agent-app/web-react`, `@tangle-network/agent-app/composer`, `@tangle-network/agent-app/web-react/terminal`, `@tangle-network/sandbox-ui`, `@xterm/*`, or `@xyflow/react`.
- Router-backed mobile chat is first-class.
- Sandbox-backed mobile chat is chat + activity only. Terminal belongs on web/tablet/desktop unless a separate native terminal surface is intentionally built.

## React Native Rules

- Use `FlatList` for message/activity/model lists.
- Use `Pressable`, not `Touchable*`.
- Put every string inside `Text`.
- Do not use `{value && <Text />}` when `value` can be `''` or `0`; use ternaries or explicit booleans.
- Use `StyleSheet.create`, `gap`, `padding`, and `borderCurve: 'continuous'` on rounded surfaces.
- Keep list rows memoized and pass primitive props where practical.

## Verification

For code qualification, merge `origin/main` and run the canonical local gate (the launcher performs the frozen install): `beelink-gate auto https://github.com/tangle-network/agent-app-mobile.git <full-sha> -- bash -lc 'pnpm typecheck && pnpm build && pnpm test && pnpm example:typecheck && pnpm example:web:export && pnpm example:native:export'`. Build finishes before tests; the existing Expo example checks export web, iOS, and Android bundles. Device behavior and signed native publication require their own proof. Workflow and documentation changes use YAML and content checks.

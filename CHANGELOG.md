# Changelog

## 0.4.1 - 2026-07-01

- Fixed the Expo example backend URL wiring to use direct `EXPO_PUBLIC_*` env access so Expo can inline the real agent-app route into web/native bundles.

## 0.4.0 - 2026-07-01

- Added per-request abort signal support to `createAgentAppChatClient().start()` and `.resume()` so stop/cancel controls can cancel the actual fetch.
- Reworked the Expo example to stream from `EXPO_PUBLIC_AGENT_APP_BASE_URL` when configured, with explicit local demo mode only when no backend URL is set.
- Added iOS and Android Expo export checks to the release path and CI so native bundling is covered alongside web.

## 0.3.0 - 2026-07-01

- Reworked the default chat shell into a cleaner mobile layout with a compact header, one-row composer, and three optional prompt starters.
- Added `MobilePromptSuggestion`, `suggestions`, `onSuggestionPress`, and `placeholder` so apps can configure starter prompts and agent-specific input copy.
- Hid the send action until text is present, while keeping file import and optional voice callbacks available without forcing voice UI into apps that do not wire it.
- Updated the Expo preview to show a Pi-style chat surface instead of demo/instructional copy.

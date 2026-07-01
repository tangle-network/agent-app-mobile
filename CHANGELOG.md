# Changelog

## 0.3.0 - 2026-07-01

- Reworked the default chat shell into a cleaner mobile layout with a compact header, one-row composer, and three optional prompt starters.
- Added `MobilePromptSuggestion`, `suggestions`, `onSuggestionPress`, and `placeholder` so apps can configure starter prompts and agent-specific input copy.
- Hid the send action until text is present, while keeping file import and optional voice callbacks available without forcing voice UI into apps that do not wire it.
- Updated the Expo preview to show a Pi-style chat surface instead of demo/instructional copy.

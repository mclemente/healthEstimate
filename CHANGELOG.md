# Changelog
## 2.5.0.4
- Added support to Star Wars FFG.

## 2.5.0.3
- Added an Output Estimate to Chat setting. Whenever the stage changes, a message is shown telling the new estimate. It currently doesn't show the Dead estimate for NPCs (the mouse-over estimate will be "Dead" while it'll be "Unconscious" on chat).
- Added a Hide Estimate macro. It makes selected tokens' actors not show their estimate to players, it also replaces the name of creatures on chat as Unknown Entity.
- Renamed Death Macro compendium to Health Estimate Macros.
- Changed License from MIT to GPL.

## 2.5.0.2
- Fixed another refactoring issue with games hosted on Forge.

## 2.5.0.1
- Added a generic system support. The module should now work with any system whose actors have HP set up as either `token.actor.data.data.attributes.hp` or `token.actor.data.data.hp`.
- Fixed an issue where the module would fail to work because of a refactoring issue.

## 2.5.0.0
- New release under a new repo.

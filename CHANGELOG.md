# Changelog
## 2.5.3
- Added support to Call of Cthulhu 7e (CoC7), thanks to [snap01](https://github.com/snap01).

## 2.5.2
- Fixed a console error when trying to render the estimate for tokens without actors (e.g. a token whose actor has been deleted).

## 2.5.1.3
- Fixed a bug on SWFFG where NPCs would have the descriptions of vehicles.

## 2.5.1.2
- Output Estimate to Chat setting now outputs Dead estimates normally.

## 2.5.1.1
- Fixed an issue with a setting not loading correctly.
- Moved settings related to death into its own category.
- Aggregated the four "Only show estimations to" settings into a single setting.

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

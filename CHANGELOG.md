# 30.8
- Added support for the [Z Scatter module](https://foundryvtt.com/packages/z-scatter). Caveat: the estimates will be off if you use the Always Show Estimate setting (#156).

# 30.6
- Several changes to Style Settings menu:
  - The Font Size setting, which only accepts numbers now.
    - Here's how each value used to be written: x-large: 24, large: 18, medium: 16, small: 13, x-small: 10.
  - The Position setting is now a range instead of a 3-choice select.
  - Changes to the styling and showing/hiding settings when toggling other settings.
- Zooming out with the Scale to Zoom setting enabled will refresh the estimates automatically if they're showing.
- D&D 5e: Added support for CUB module's name replacement (#148).
- PF2e: Added support for PF2e Workbench module's mystification (#148).

# 30.1-30.5
- Lots of fixes.

# 30.0 (2023-04-03)

## Major Changes
### Estimations
- Reworked how the Stages/Estimations are set. Instead of a string of estimates that were split equally between the 100-0 range, you can now set their ranges individually.
  - Example: Bloodied condition (on D&D 4e) no longer needs to be copied multiple times to affect the 50-1 range.
- You no longer need to add an extra comma to ignore the 100% estimate. Just remove the estimate and leave the latest at 99 maximum and it'll work.
- You can set up your own custom rules with the JS Rule, like checking for actor types, items, effects, etc.
  - Example: specific estimates for undead, oozes, or creatures affected by an item/effect/feat, etc.
- The Ignore Color option is a way to set up custom rules that will use the color logic of the next valid estimation for the token. Its use-case is for when a specific effect should take precedence over the current health state of the token.
  - The only systems that have these by default are the D35E and PF1 systems.
- Note for people inputting estimates: you don't need to rearrange the values when adding a new estimate to be in-between a range, it'll get sorted correctly once you save the list.

### New Systems Supported
- Added support for more Free League games: Blade Runner, Coriolis, and Twilight 2000

### Under the Hood
- The System Specific files are now loaded immediately instead being imported after load. This isn't something most users will notice, but this solves an issue known to some as the `game.healthEstimate.breakOverlayRender is not a function` error.
- It is now possible to set system-specific default settings
  - I'm looking for feedback on what could be added to accomodate most systems better.

## Minor Changes
- The "Uninjured" term has been replaced for the more common "Unharmed".
- Fixed an issue with the system-agnostic and Custom System Builder implementations where estimations were being calculated as healthy incorrectly.
- The Death Settings menu has been merged with the Behavior Settings menu.
  - The actual "Behavior" setting has been removed since it became useless.
- The Custom Stages keybind and its logic have been removed since the new Estimations can do a better job.
- The Macros compendium has been removed. All its features became keybinds a long time ago, so nothing was really lost.
- Vehicles, ships, loot, and other non-living actor types now won't be shown as Dead. Caveat: some systems might have unusual Actor types not show as Dead too, but none of the systems I know of.
- Deleting an actor now refreshes their tokens on the canvas so their estimate doesn't get stuck until you change scenes or refresh the page.

## Known Issues
- **Settings:** Some settings were removed, if you want to get their data back, you can use the following:
  - Stages: `game.settings.get("healthEstimate", "core.stateNames")`
  - Staggered Stage for D35E and PF1 systems: `game.settings.get("healthEstimate", "PF1.disabledName")`
  - Unconscious Stage for D35E and PF1 systems: `game.settings.get("healthEstimate", "PF1.dyingName")`
  - Vehicle Stages: `game.settings.get("healthEstimate", "starfinder.vehicleNames")` (it's starfinder, no matter your system).
  - Threshold Stages for the Starfinder system: `game.settings.get("healthEstimate", "starfinder.thresholdNames")`
- Some of the logic of the module is still hard-coded and has no way to be configured by the users yet, most notably is the logic that handles the Dead stage.

# 29.10.1 (2023-03-29)
- Further improved support for the Cypher System game system (contribution from @farling42, #141).

# 29.10 (2023-03-27)
This is hotfix to 29.9 due to an unexpected behavior.

# 29.9 (2023-03-27)
- Added improvements to the Output Estimates to Chat feature.
  - The message now hides its header unless you hover over it.
  - Descriptions now are only shown if the new description's text is different from the previous description's. E.g. when using duplicate stages.
  - Dead NPCs are shown as Dead instead of Unconscious (#138).
- Added support for the Cypher System game system (contribution from @farling42, #139).
- ~~Updated the System Specifics logic to not require adding a system's name to a regex.~~
- Added a [Contributing page](https://github.com/mclemente/healthEstimate/blob/master/CONTRIBUTING.md) to add some guidance on how to add your own system specific estimations.

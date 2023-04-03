# 30.0 (2023-04-03)

## Major Changes
- Reworked how the Estimations are set: instead of a string of estimates that were split equally between the 100-0 range, you can now set their ranges individually.
  - You can also set up your own custom rules with the JS Rule, like checking for actor types, items, effects, etc.
  - The Ignore Color option is a way to set up custom rules that will use the color logic of the next valid estimation for the token. Its use-case is for when a specific effect should take precedence over the current health state of the token.
    - The only systems that have these by default are the D35E and PF1 systems.
- Reworked the whole System Specifics logic. Now the files are loaded with the module instead of being imported after load, which caused some issues in some games.
  - This isn't something most users will notice, but this solves an issue known to some as the `game.healthEstimate.breakOverlayRender is not a function` error.
  - Due to this change, it is now possible to set system-specific default settings (e.g. Cyberpunk Red Core's uses the same logic as the game system, SWADE has the Dead option as "Incapacitated" by default now). I'm looking for feedback on what else could be added to systems.

### Examples

- 1: Uninjured now actually shows only at 100% HP without the need of an entire setting, and you can just remove it instead of adding an extra comma too.
- 2: The famous Bloodied condition, which happens when monsters are at 50% HP or less in certain games, can now encompass the whole 50-1 range without the need of repeating it over the setting.
- 3: You can set creature-specific estimates, like checking for a creature's type (Undead, Ooze, Incorporeal, etc) or some item/effect/feat (Weak, Frail, etc).

## New Systems Supported
- Added support for more Free League games: Blade Runner, Coriolis, and Twilight 2000

## Minor Changes
- The "Uninjured" term has been replaced for the more common "Unharmed".
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
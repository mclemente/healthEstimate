# Contributing to Health Estimate
## Adding Support to a System

1. Get your system's id (`game.system.id`).
2. Go to the [src/module/providers](./src/module/providers/) folder.
3. Make a copy of `templates/Generic.js` file on the providers folder and name it with your system's name.
4. Rename the GenericEstimationProvider subclass to to the exact ID of the system, unless it contains invalid characters like hyphens.
  - If it does include invalid characters, go to the `_shared.js` file and add a `[system id]: [subclass name]` to the providerKeys.
5. Check the documentation in the EstimationProvider class on `templates/Base.js`. Consider checking other system's subclasses, like D&D5e, PF2e, SWADE, etc.
    - The minimum needed is a fraction function, everything else is optional.

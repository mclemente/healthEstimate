# Contributing to Health Estimate
## Adding Support to a System

1. Get your system's id (`game.system.id`).
2. Go to the [module/EstimationProvider.js](./module/EstimationProvider.js) file.
3. Create your own subclass of EstimationProvider to the list. It needs to be named exactly as your system. If your system's name has invalid characters (e.g. `name-with-hyphens`), then you'll need to set its name in the `providerKeys` constant at the top of the file.
4. Follow the instructions in the EstimationProvider class. Check out some other subclasses, like PF2e, SWADE, etc.
    - The minimum needed is a fraction function, everything else is optional.

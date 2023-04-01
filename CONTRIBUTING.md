# Contributing to Health Estimate

-   [Contributing to Health Estimate](#contributing-to-health-estimate)
    -   [Adding Support to a System](#adding-support-to-a-system)
        -   [Example File](#example-file)

## Adding Support to a System

1. Get your system's id (`game.system.id`).
2. Go to the [module/EstimationProvider.js](./module/EstimationProvider.js) file and add your own subclass of EstimationProvider to the list. The subclass needs to be named exactly like your system, or you'll have to set its name in the providerKeys.
3. Follow the instructions in the EstimationProvider class. Check out some other subclasses, like PF2e, SWADE, etc.

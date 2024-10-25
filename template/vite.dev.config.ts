import { builtinModules } from "module"

import config from "./vite.config"

delete config.lib

export default config


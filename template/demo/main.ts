import "../assets/tailwind.css"

import { createApp } from "vue"

import App from "./App.vue"

const head = createHead()
createApp(App)
	.use(head)
	.mount("#app")

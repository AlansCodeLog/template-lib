<template>
	<div id="app"
		:class="autoOutline ? 'group outlined outlined-visible' : '[&_*]:outline-none'"
		class="
			dark
			min-h-screen

		"
		tabindex="-1"
		ref="el">
		<div class="
			bg-gradient-to-b
			from-black
			via-neutral-950
			to-black
			min-h-screen
			dark:text-neutral-50
			flex
			flex-col
			items-center
		">
			<LibNotifications :handler="notificationHandler" />
			<slot />
		</div>
	</div>
</template>
<script setup lang="ts">
import { setupAccesibilityOutline } from "@alanscodelog/vue-components/mixins/setupAccesibilityOutline.js"
import { onMounted, ref } from "vue"

import { notificationHandler } from "./utils/notificationHandler.js"
import { theme } from "./utils/theme.js"


const el = ref<HTMLElement | null>(null)

const autoOutline = setupAccesibilityOutline(el).outline


if ((process as any).client) {
	onMounted(() => {
		theme.attach(el.value!)
	})
}

// useHead({
// 	link: [
// 		{ rel: "sitemap", title: "Sitemap", type: "text/xml", href: "/sitemap.xml" },
// 	],
// })

</script>


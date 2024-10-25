<template>
	<WRoot :theme="theme">
		<LibNotifications :handler="notificationHandler" />
		<slot />
	</WRoot>
</template>
<script setup lang="ts">
import { notificationHandler } from "../utils/notificationHandler.js"
import { theme } from "../utils/theme.js"
</script>


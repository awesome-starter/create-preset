<template>
  <router-view :key="key" />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const key = computed(() =>
  route.name ? String(route.name) + new Date() : String(route.path) + new Date()
)
</script>

<style></style>

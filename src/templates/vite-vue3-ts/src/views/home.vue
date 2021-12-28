<template>
  <div class="home">
    <img alt="Vue logo" :src="logo" />
    <HelloWorld msg="Hello Vue 3 + TypeScript + Vite" />
  </div>
</template>

<script setup lang="ts">
import HelloWorld from '@cp/HelloWorld.vue'
import logo from '@img/logo.png'
</script>

<style lang="less" scoped>
.home {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: @color-black;
  margin-top: (@margin * 3);
}
</style>

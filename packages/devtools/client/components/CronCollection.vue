<script setup lang="ts">
import type { CronCollection } from '../../src/types/tasks'
import cronstrue from 'cronstrue'
import { computed, ref } from 'vue'
import { useCurrentServerTask } from '~/composables/state-routes'

const props = defineProps<{
  collection: CronCollection
}>()

const currentTaskRoute = useCurrentServerTask()
const open = ref(true)

const humanReadableCron = computed(() => {
  return cronstrue.toString(props.collection.cron)
})
</script>

<template>
  <div>
    <button
      flex="~ gap-2" w-full items-start items-center p2 hover-bg-active
      :title="humanReadableCron"
      @click="open = !open"
    >
      <div flex-none text-left>
        <NIcon icon="carbon:chevron-right" mb0.5 :transform-rotate="open ? 90 : 0" transition />
      </div>
      <span flex="~ gap-2" min-w-0 items-center text-sm>
        <NBadge
          class="font-mono n-primary"
          v-text="collection.cron"
        />
        <span class="truncate">{{ humanReadableCron }}</span>
        <span text-xs op50>({{ collection.tasks.length }})</span>
      </span>
    </button>
    <div x-divider />
    <ul v-if="open">
      <li v-for="task in collection.tasks" :key="task">
        <button
          flex="~ gap-2" w-full items-start items-center px2 py1 pl-9 font-mono hover-bg-active
          :class="[{ 'bg-active': currentTaskRoute === task }]"
          @click="currentTaskRoute = task"
        >
          {{ task }}
        </button>
        <div x-divider />
      </li>
    </ul>
  </div>
</template>

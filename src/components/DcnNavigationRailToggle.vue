<template>
  <!--
    For NcAppNavigation's `search` slot. Its placement in that row is styled
    from navigation-rail.css, imported in the shell component's scoped block;
    see that file for why a rule for it cannot live in this component's scope.
  -->
  <NcButton v-if="canRail"
            class="nav-rail-toggle"
            variant="tertiary"
            :aria-label="railed ? expandLabel : collapseLabel"
            :title="railed ? expandLabel : collapseLabel"
            @click="toggleRail">
    <template #icon>
      <PanelLeftOpen v-if="railed" :size="20" />
      <PanelLeftClose v-else :size="20" />
    </template>
  </NcButton>
</template>

<script setup lang="ts">
import { NcButton } from '@nextcloud/vue'
import { PanelLeftClose, PanelLeftOpen } from '@lucide/vue'
import { useNavigationRail } from '../composables/useNavigationRail'

/** Collapses the app navigation to a rail of icons, and back. The labels are the app's own translations. */
defineProps<{
  expandLabel: string
  collapseLabel: string
}>()

const { railed, canRail, toggleRail } = useNavigationRail()
</script>

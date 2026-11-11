<template>
  <NcSelect
    class="dcn-principal-picker"
    :model-value="shownValue"
    :options="options"
    :loading="loading"
    label="displayName"
    :filterable="false"
    :multiple="multiple"
    :clearable="clearable"
    :disabled="disabled"
    :placeholder="shownPlaceholder"
    :input-label="shownPlaceholder"
    :label-outside="true"
    @search="onSearch"
    @update:model-value="onChange">
    <template #option="option">
      <NcListItemIcon
        v-bind="option"
        :avatar-size="32"
        :name="option.displayName"
        :search="query" />
    </template>
    <template #selected-option="option">
      <NcListItemIcon
        v-bind="option"
        :avatar-size="24"
        :name="option.displayName"
        no-margin />
    </template>
    <!-- The directory is too big to list unprompted, so the picker needs a
         query first — but "No matches" before anyone typed reads as "your
         search found nothing". Say what is actually true. -->
    <template #no-options>
      <span class="dcn-principal-picker__empty">{{ emptyText }}</span>
    </template>
  </NcSelect>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import { NcListItemIcon, NcSelect } from '@nextcloud/vue'
import { translate } from '../config'
import type { DcnPrincipal, DcnPrincipalKind } from '../types'

/**
 * Picks users, groups and Teams, in one of three ways:
 *
 * - without `v-model`: one at a time. Each pick is a `@select`, and the field
 *   empties itself again; the caller keeps the list (a grant, an ACL row).
 * - `v-model` with a principal or null: one, which stays in the field (an
 *   owner). `clearable` lets it be emptied again.
 * - `multiple` with `v-model` and an array: several, as chips in the field.
 *
 * The picker draws; the app searches. `search` is the app's own lookup, so
 * which accounts are offered — guests or not, only members of some groups,
 * Teams only where the server has them — stays with the app and its backend,
 * and this package makes no request of its own.
 *
 * `kinds` says what the app's search can return. It chooses the placeholder
 * ("Search users, groups or Teams…") and nothing else: the picker promises in
 * its label exactly what the search delivers, and a label that offers Teams
 * on a server without them teaches people to distrust it. An app that only
 * sometimes has Teams passes them only when it does.
 *
 * From DoCoNEXT Core's PrincipalPicker.
 */
const props = withDefaults(defineProps<{
  /** The app's lookup: at most a page of matches for what was typed. */
  search: (query: string) => Promise<DcnPrincipal[]>
  /** What `search` can return; chooses the placeholder. */
  kinds?: DcnPrincipalKind[]
  /** Several in the field, bound with v-model to an array. */
  multiple?: boolean
  /**
   * The choice the field holds: an array with `multiple`, else a principal or
   * null. Leave it out to pick one at a time with `@select`.
   */
  modelValue?: DcnPrincipal[] | DcnPrincipal | null
  /** A choice the field holds can be emptied again. */
  clearable?: boolean
  /** Replaces the placeholder `kinds` chooses. */
  placeholder?: string
  /**
   * The app's search is narrowed (to some groups, say). Only the empty text
   * changes, so nobody hunts for a name that is simply out of scope here.
   */
  restricted?: boolean
  disabled?: boolean
}>(), {
  kinds: () => ['user', 'group'],
  multiple: false,
  modelValue: undefined,
  clearable: true,
  placeholder: '',
  restricted: false,
  disabled: false,
})

const emit = defineEmits<{
  /** Every pick, in all three ways; without v-model the field then empties itself. */
  select: [principal: DcnPrincipal]
  /** With v-model: the array (`multiple`), or the principal or null. */
  'update:modelValue': [value: DcnPrincipal[] | DcnPrincipal | null]
}>()

/**
 * What NcSelect and NcListItemIcon are given. vue-select tells options apart
 * by `id`, and a user and a group can share one (`admin` is both), so `id` is
 * `<type>:<id>` and the principal itself rides along.
 */
interface Option {
  id: string
  displayName: string
  user?: string
  subname?: string
  isNoUser: boolean
  principal: DcnPrincipal
}

/** How long typing pauses before the search runs. */
const DEBOUNCE_MS = 300

const options = ref<Option[]>([])
const loading = ref(false)
// The live query, both for match highlighting and to tell "nothing typed yet"
// apart from "typed, and there is nothing".
const query = ref('')
let debounceTimer: ReturnType<typeof setTimeout> | null = null
// Answers can overtake each other; only the latest query's may fill the list.
let latestSearch = 0

const shownPlaceholder = computed(() => {
  if (props.placeholder) return props.placeholder
  const users = props.kinds.includes('user')
  const groups = props.kinds.includes('group')
  const teams = props.kinds.includes('circle')
  if (users && groups && teams) return translate('Search users, groups or Teams…')
  if (users && groups) return translate('Search users or groups…')
  if (groups && teams) return translate('Search groups or Teams…')
  if (users && teams) return translate('Search users or Teams…')
  if (groups) return translate('Search groups…')
  if (teams) return translate('Search Teams…')
  return translate('Search users…')
})

const emptyText = computed(() => {
  if (loading.value) return translate('Loading…')
  if (query.value.length > 0) {
    return props.restricted ? translate('No matches in the allowed groups') : translate('No matches')
  }
  if (props.restricted) return translate('Type a name to search the allowed groups')
  return translate('Type a name to search')
})

function toOption(principal: DcnPrincipal): Option {
  return {
    id: `${principal.type}:${principal.id}`,
    displayName: principal.displayName,
    // Only a user has an avatar and a status; for the others NcListItemIcon
    // draws the initials.
    user: principal.type === 'user' ? principal.id : undefined,
    // 'circle' is how Nextcloud stores a Team; "Team" is the only word a
    // person should ever see for it.
    subname: principal.type === 'group'
      ? translate('Group')
      : (principal.type === 'circle' ? translate('Team') : undefined),
    isNoUser: principal.type !== 'user',
    principal,
  }
}

/** Whether the field holds its choice (v-model), rather than emptying after each pick. */
const holdsValue = computed(() => props.modelValue !== undefined)

/** What the field shows as chosen, as options. */
const selectedOptions = computed<Option[]>(() => {
  const value = props.modelValue
  if (Array.isArray(value)) return value.map(toOption)
  return value ? [toOption(value)] : []
})

const shownValue = computed(() => {
  if (props.multiple) return selectedOptions.value
  return holdsValue.value ? (selectedOptions.value[0] ?? null) : undefined
})

function onSearch(newQuery: string | null) {
  if (debounceTimer) clearTimeout(debounceTimer)
  query.value = newQuery ?? ''
  if (query.value.trim() === '') {
    latestSearch++
    options.value = []
    loading.value = false
    return
  }
  debounceTimer = setTimeout(() => runSearch(query.value), DEBOUNCE_MS)
}

async function runSearch(text: string) {
  const ticket = ++latestSearch
  loading.value = true
  try {
    const found = await props.search(text)
    if (ticket !== latestSearch) return
    // In the field already: offering it again would only add it twice.
    const chosen = new Set(selectedOptions.value.map(o => o.id))
    options.value = found.map(toOption).filter(o => !chosen.has(o.id))
  } catch (e) {
    if (ticket !== latestSearch) return
    // "No matches" and "the lookup failed" look the same in the dropdown;
    // at least leave a trace of which one happened.
    // eslint-disable-next-line no-console -- the only trace a failed lookup leaves
    console.error('[@doconext/nc-ui] Principal search failed:', e)
    options.value = []
  } finally {
    if (ticket === latestSearch) loading.value = false
  }
}

function onChange(value: Option | Option[] | null) {
  if (props.multiple) {
    const list = Array.isArray(value) ? value : (value ? [value] : [])
    const before = new Set(selectedOptions.value.map(o => o.id))
    const added = list.find(o => !before.has(o.id))
    emit('update:modelValue', list.map(o => o.principal))
    if (added) emit('select', added.principal)
  } else {
    const picked = Array.isArray(value) ? (value[0] ?? null) : value
    if (holdsValue.value) emit('update:modelValue', picked?.principal ?? null)
    if (picked) emit('select', picked.principal)
  }
  // Either way the search is done with: the next one starts from an empty field.
  latestSearch++
  options.value = []
  query.value = ''
}

onBeforeUnmount(() => {
  if (debounceTimer) clearTimeout(debounceTimer)
})
</script>

<style scoped>
/* NcSelect sets min-width: 260px on .nc-select.v-select.select, more than a
   form column is wide, and its stylesheet may load after this one: outrank
   it by one class rather than with !important. */
.dcn-principal-picker.nc-select.v-select.select {
  width: 100%;
  min-width: 0;
}

.dcn-principal-picker__empty {
  color: var(--color-text-maxcontrast);
}
</style>

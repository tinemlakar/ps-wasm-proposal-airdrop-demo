<template>
  <n-data-table
    :bordered="false"
    :columns="columns"
    :data="voters"
    :pagination="{ pageSize: PaginationValues.PAGE_DEFAULT_LIMIT }"
  />
</template>

<script lang="ts" setup>
import type { DataTableColumns } from 'naive-ui';
import { PaginationValues } from '~/lib/values/general.values';

defineProps({
  voters: { type: Array<VoterInterface>, required: true },
});

const createColumns = (): DataTableColumns<VoterInterface> => {
  return [
    {
      key: 'voter',
      title: 'Voter',
      render(row: VoterInterface, index: number) {
        return h('span', { class: 'whitespace-nowrap' }, row.voter);
      },
    },
    {
      key: 'decision',
      title: 'Decision',
      render(row: VoterInterface, index: number) {
        return h('span', { class: 'whitespace-nowrap' }, row.decision);
      },
    },
  ];
};
const columns = createColumns();
</script>

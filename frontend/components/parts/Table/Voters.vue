<template>
  <n-data-table
    size="small"
    :bordered="false"
    :columns="columns"
    :data="voters"
    :pagination="{ pageSize: 10 }"
  />
  <Btn @click="saveVoters()">Save voters</Btn>
</template>

<script lang="ts" setup>
import type { DataTableColumns } from 'naive-ui';
import { encodeAstarAddress } from '~/lib/misc/crypto';
import { apiError } from '~/lib/misc/errors';

defineProps({
  voters: { type: Array<VoterInterface>, required: true },
});
const emit = defineEmits(['onSave']);

const message = useMessage();
const userStore = useUserStore();
const { handleError } = useErrors();

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

async function saveVoters() {
  let uploadItems = userStore.voters.map(data => {
    return { wallet: encodeAstarAddress(data.voter) };
  });

  const ids = uploadItems.map(({ wallet }) => wallet);
  uploadItems = uploadItems.filter(({ wallet }, index) => !ids.includes(wallet, index + 1));

  try {
    await $api.post('/users', { users: uploadItems });

    message.success('Recipients are successfully added.');
    emit('onSave');
  } catch (err: any) {
    const error =
      err?.data?.errors && Array.isArray(err.data.errors) && err.data.errors.length
        ? err.data.errors[0]
        : null;
    if (error?.message === 'DATABASE_ERROR') {
      message.error('Voters already exists in table.');
    } else {
      handleError(err);
    }
  }
}
</script>

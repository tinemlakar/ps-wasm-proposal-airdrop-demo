<template>
  <n-data-table
    :bordered="false"
    :columns="columns"
    :data="users"
    :pagination="{ pageSize: PaginationValues.PAGE_DEFAULT_LIMIT }"
  />
</template>

<script lang="ts" setup>
import { NInput, type DataTableColumns } from 'naive-ui';
import { encodeAstarAddress, substrateAddressValidate } from '~/lib/misc/crypto';
import { SubstrateChainPrefix } from '~/lib/types/general.types';
import { AirdropStatus, PaginationValues } from '~/lib/values/general.values';

const props = defineProps({
  users: { type: Array<UserInterface>, required: true },
});
const emit = defineEmits(['addUser', 'removeUser']);
const message = useMessage();

const newUser = ref<UserInterface>({
  airdrop_status: AirdropStatus.PENDING,
  wallet: '',
});

function isEditable(row: UserInterface, index: number) {
  return !row.wallet && props.users.length % PaginationValues.PAGE_DEFAULT_LIMIT === index + 1;
}

const createColumns = (): DataTableColumns<UserInterface> => {
  return [
    {
      key: 'wallet',
      title: 'Wallet',
      minWidth: 100,
      render(row: UserInterface, index: number) {
        if (isEditable(row, index)) {
          return h(NInput, {
            value: newUser.value.wallet,
            type: 'wallet',
            onUpdateValue(v: any) {
              newUser.value.wallet = `${v}`;
            },
          });
        } else {
          return h(resolveComponent('TableEllipsis'), { text: row.wallet }, '');
        }
      },
    },
    {
      key: 'tx_hash',
      title: 'Transaction hash',
      minWidth: 100,
      render(row: UserInterface) {
        return h(resolveComponent('TableEllipsis'), { text: row.tx_hash }, '');
      },
    },
    {
      key: 'airdrop_status',
      title: 'Status',
      minWidth: 100,
      render(row: UserInterface) {
        return AirdropStatus[row.airdrop_status].replaceAll('_', ' ');
      },
    },

    {
      key: 'action_remove',
      title: '',
      render(row: UserInterface, index: number) {
        if (isEditable(row, index)) {
          return h(
            'button',
            { class: 'icon-check text-xl text-green', onClick: () => addItem(row) },
            ''
          );
        } else if (!row.id) {
          return h(
            'button',
            { class: 'icon-delete text-xl text-white', onClick: () => removeItem(row) },
            ''
          );
        }
        return '';
      },
    },
  ];
};
const columns = createColumns();

function userAlreadyExists(address: string) {
  return props.users.some(item => item.wallet === address);
}

function addItem(user: UserInterface) {
  if (!newUser.value.wallet) {
    message.warning('Please add Polkadot wallet address');
  } else if (
    !substrateAddressValidate(newUser.value.wallet) &&
    !substrateAddressValidate(newUser.value.wallet, SubstrateChainPrefix.SUBSTRATE)
  ) {
    message.warning('Please provide a valid Polkadot wallet address');
  } else {
    const encodedWallet = encodeAstarAddress(newUser.value.wallet);
    if (userAlreadyExists(encodedWallet)) {
      message.warning('Please add different wallet address');
      return;
    }
    user.wallet = encodeAstarAddress(newUser.value.wallet);
    newUser.value.wallet = '';

    emit('addUser', newUser.value);
  }
}

function removeItem(user: UserInterface) {
  emit('removeUser', user.wallet);
}
</script>

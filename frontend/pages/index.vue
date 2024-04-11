<script lang="ts" setup>
import { useAccount } from 'use-wagmi';
import UploadSVG from '~/assets/images/upload.svg';
import { encodeAstarAddress, substrateAddressValidate } from '~/lib/misc/crypto';
import { SubstrateChainPrefix } from '~/lib/types/general.types';
import { AirdropStatus } from '~/lib/values/general.values';

useHead({
  title: 'Apillon Wasm proposal airdrop prebuilt solution',
});

const message = useMessage();
const userStore = useUserStore();
const { isConnected } = useAccount();
const { handleError } = useErrors();

const items = ref<UserInterface[]>([]);
const statistics = ref<StatisticsInterface | null>(null);
const modalUploadCsvVisible = ref<boolean>(false);

const isLoggedIn = computed(() => isConnected.value && userStore.jwt);
const selectedRecipients = computed(() => items.value.length);

onMounted(async () => {
  if (isLoggedIn.value) {
    await getUsers();
    await getStatistics();
  }
});

watch(
  () => isLoggedIn.value,
  async _ => {
    if (isLoggedIn.value) {
      await getUsers();
      await getStatistics();
    }
  }
);

function onFileUploaded(csvData: CsvItem[]) {
  modalUploadCsvVisible.value = false;

  const data: UserInterface[] = csvData.map(item => {
    return {
      airdrop_status: AirdropStatus.PENDING,
      tx_hash: null,
      wallet: item.wallet,
    } as UserInterface;
  });

  if (!Array.isArray(items.value) || items.value.length === 0) {
    items.value = data;
  } else {
    data.forEach(item => {
      if (!item.wallet) {
        message.warning('Please add Polkadot wallet address');
      } else if (
        !substrateAddressValidate(item.wallet) &&
        !substrateAddressValidate(item.wallet, SubstrateChainPrefix.SUBSTRATE)
      ) {
        message.warning('Please provide a valid Polkadot wallet address');
      } else {
        const encodedWallet = encodeAstarAddress(item.wallet);
        if (walletAlreadyExists(encodedWallet)) {
          message.warning(`Wallet: ${item.wallet} is already on the list`);
        } else {
          item.wallet = encodedWallet;
          items.value.unshift(item as UserInterface);
        }
      }
    });
  }
}

function walletAlreadyExists(wallet: string) {
  return items.value.some(item => item.wallet === wallet);
}

async function getUsers() {
  try {
    const res = await $api.get<UsersResponse>('/users', { itemsPerPage: 10000 });
    if (items.value.length === 0 || items.value.length === res.data.items.length) {
      items.value = res.data.items;
    } else {
      res.data.items.forEach(item => {
        const recipient = items.value.find(r => r.wallet === item.wallet);
        if (recipient) {
          recipient.airdrop_status = item.airdrop_status;
          recipient.id = item.id;
          recipient.tx_hash = item.tx_hash;
          recipient.wallet = item.wallet;
        } else {
          items.value.unshift(item);
        }
      });
    }
  } catch (e) {
    handleError(e);
  }
}

async function getStatistics() {
  const res = await $api.get<StatisticsResponse>('/users/statistics');
  statistics.value = res.data;
}

function addRecipient() {
  if (!items.value.some(item => item.wallet === null)) {
    items.value.push({
      airdrop_status: AirdropStatus.PENDING,
      tx_hash: null,
      wallet: null,
    });
  }
}

async function checkRecipients() {
  try {
    await $api.post('/users/confirm');
    await getUsers();

    message.success('Recipient statuses are updated');
  } catch (e) {
    handleError(e);
  }
}

function onUserRemove(wallet: string) {
  items.value = items.value.filter(item => item.wallet !== wallet);
}
function onUserAdded(user: UserInterface) {
  items.value.push(JSON.parse(JSON.stringify(user)));
  saveRecipients();
}

async function saveRecipients() {
  const uploadItems = items.value.filter(item => !item.id && item.wallet);

  if (!userStore.jwt) {
    message.warning('Please login first to proceed with this action');
    return;
  } else if (!uploadItems || uploadItems.length === 0) {
    message.warning('Upload CSV file and add some recipients first.');
    return;
  }

  try {
    await $api.post('/users', { users: uploadItems });
    await getUsers();
    await getStatistics();

    message.success('Recipients are successfully added.');
  } catch (e) {
    handleError(e);
  }
}

async function onVotersSaved() {
  await getUsers();
  await getStatistics();
}
</script>

<template>
  <div>
    <div class="w-full mt-8 mb-12 mx-auto">
      <div class="max-w-xl mx-auto">
        <FormVoters />
        <TableVoters
          v-if="userStore.voters?.length"
          :voters="userStore.voters"
          @on-save="onVotersSaved"
        />
      </div>

      <h3 class="my-8">NFT Recipients</h3>

      <n-space class="pb-8" size="large" justify="space-between" align="end">
        <Statistics v-if="statistics" :statistics="statistics" />
        <Btn class="float-right" type="secondary" @click="checkRecipients"> Check recipients </Btn>
      </n-space>
      <TableUsers v-if="items" :users="items" @add-user="onUserAdded" @remove-user="onUserRemove" />

      <n-space class="w-full my-8" size="large" align="center" justify="space-between">
        <n-space size="large">
          <Btn @click="modalUploadCsvVisible = true"> Upload CSV </Btn>
          <Btn type="secondary" @click="addRecipient"> Add recipient </Btn>
        </n-space>

        <div v-if="items && items.length" class="flex gap-4 items-center">
          <p>Price ≈ {{ selectedRecipients * 100 }} credits</p>
          <Btn :disabled="!items || items.length === 0" @click="saveRecipients()">
            Save recipients
          </Btn>
        </div>
      </n-space>
    </div>

    <modal
      :show="modalUploadCsvVisible"
      @close="() => (modalUploadCsvVisible = false)"
      @update:show="modalUploadCsvVisible = false"
    >
      <div class="max-w-md w-full md:px-6 my-12 mx-auto">
        <div class="mb-5 text-center">
          <img :src="UploadSVG" class="mx-auto" width="203" height="240" alt="airdrop" />
          <h3 class="my-8 text-center">Upload your CSV file with recipients’ addresses</h3>
          <p class="text-center">
            Select and upload the CSV file containing addresses to which you wish to distribute
            NFTs.
          </p>
          <Btn type="builders" size="tiny" href="/files/example.csv"> Download CSV sample </Btn>
        </div>
        <FormUpload @close="modalUploadCsvVisible = false" @proceed="onFileUploaded" />
      </div>
    </modal>
  </div>
</template>

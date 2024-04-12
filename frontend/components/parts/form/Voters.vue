<template>
  <n-form
    ref="formRef"
    :model="formData"
    :rules="rules"
    size="small"
    @submit.prevent="handleSubmit"
  >
    <n-form-item
      path="proposalIndex"
      label="Proposal index"
      :label-props="{ for: 'proposalIndex' }"
    >
      <n-input-number
        v-model:value="formData.proposalIndex"
        :input-props="{ id: 'proposalIndex' }"
        placeholder="Type proposal index here"
      />
    </n-form-item>

    <n-form-item
      path="proposalDecision"
      label="Select proposal decision"
      :label-props="{ for: 'proposalDecision' }"
    >
      <select-options
        v-model:value="formData.proposalDecision"
        :options="proposalDecisions"
        :input-props="{ id: 'proposalDecision' }"
        placeholder="Select proposal decision"
        autocomplete="off"
        filterable
        tag
      />
    </n-form-item>

    <!--  Form submit -->
    <n-form-item :show-label="false">
      <input type="submit" class="hidden" />
      <Btn type="primary" class="w-full mt-2" size="small" :loading="loading" @click="handleSubmit">
        Fetch voters
      </Btn>
    </n-form-item>
  </n-form>
</template>

<script lang="ts" setup>
import { ruleRequired } from '~/lib/utils/validation';
import type { FormInst, FormRules, FormValidationError } from 'naive-ui';

type FormVoters = {
  proposalIndex: number | null;
  proposalDecision: string | null;
};

const emit = defineEmits(['submitSuccess']);

const message = useMessage();
const userStore = useUserStore();

const loading = ref(false);
const formRef = ref<FormInst | null>(null);

const formData = ref<FormVoters>({
  proposalIndex: null,
  proposalDecision: 'yes',
});

const rules: FormRules = {
  proposalIndex: [ruleRequired('Please enter proposal index')],
  proposalDecision: [ruleRequired('Please select proposal decision')],
};

const proposalDecisions = [
  { label: 'Yes', value: 'yes' },
  { label: 'No', value: 'no' },
  { label: 'Abstain', value: 'abstain' },
];

// Submit
function handleSubmit(e: Event | MouseEvent) {
  e.preventDefault();
  formRef.value?.validate(async (errors: Array<FormValidationError> | undefined) => {
    if (errors) {
      errors.map(fieldErrors => fieldErrors.map(error => message.error(error.message || 'Error')));
    } else {
      await getVoters();
    }
  });
}

async function getVoters() {
  loading.value = true;

  // , decision: string
  if (formData.value.proposalIndex) {
    const query = gql`
      query getVoters($proposal: Int!, $decision: VoteDecision!) {
        flattenedConvictionVotes(
          where: { proposalIndex_eq: $proposal, removedAt_isNull: true, decision_eq: $decision }
          orderBy: parentVote_createdAt_ASC
        ) {
          balance {
            ... on StandardVoteBalance {
              value
            }
          }
          decision
          lockPeriod
          voter
          removedAt
        }
      }
    `;
    const variables = {
      proposal: formData.value.proposalIndex,
      decision: formData.value.proposalDecision,
    };
    const { data }: any = await useAsyncQuery(query, variables);
    userStore.voters = data.value.flattenedConvictionVotes;
  }
  loading.value = false;
}
</script>

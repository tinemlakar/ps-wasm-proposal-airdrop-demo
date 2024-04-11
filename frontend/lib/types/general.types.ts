export interface ConfigInterface {
  APP_URL: string;
  API_BASE: string;
  PROPOSAL_GQL_URL: string;
}

export enum SubstrateChainPrefix {
  POLKADOT = 0,
  ASTAR = 5,
  SUBSTRATE = 42,
}

declare global {
  type CsvItem = {
    email: string;
    email_start_send_time: string;
    email_send_time?: string | null;
    nft_id?: number | null;
    tx_hash?: string | null;
    wallet: string;
    airdrop_status?: number | null;
    status?: number | null;
  };

  /** Papa parser */
  type CsvFileData = {
    data: Array<CsvItem>;
    errors: Array<any>;
    meta: {
      aborted: boolean;
      cursor: number;
      delimeter: string;
      fields: Array<string>;
      linebreak: string;
      truncated: boolean;
    };
  };

  /** Response */
  type GeneralResponse<T> = {
    data: T;
    id: string;
    status: number;
  };
  type GeneralItemsResponse<T> = {
    data: {
      items: Array<T>;
      total: number;
    };
    id: string;
    status: number;
  };
  type SuccessResponse = GeneralResponse<{ success: boolean }>;
  type ClaimResponse = GeneralResponse<{ success: boolean; transactionHash: string }>;

  interface UserInterface {
    airdrop_status: number;
    createTime?: string;
    id?: number | null;
    status?: number;
    tx_hash?: string | null;
    updateTime?: string;
    wallet: string | null;
  }

  interface VoterInterface {
    voter: string;
    decision: string;
  }

  type UsersResponse = GeneralItemsResponse<UserInterface>;

  interface StatisticsInterface {
    airdropped: number | null;
    pending: number | null;
    threwError: number | null;
    total: number | null;
    unconfirmed: number | null;
  }

  type StatisticsResponse = GeneralResponse<StatisticsInterface>;

  type Metadata = {
    name: string;
    description: string;
    image: string;
  };
}

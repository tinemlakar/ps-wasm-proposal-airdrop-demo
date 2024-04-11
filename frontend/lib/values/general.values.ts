export const Environments = {
  dev: 'development',
  stg: 'staging',
  prod: 'production',
};

export const WebStorageKeys = {
  USER: 'kal_user',
  APP_VERSION: 'kal_version',
};

/** NFT Chains */
export enum Chains {
  MOONBEAM = 1284,
  MOONBASE = 1287,
  ASTAR_SHIBUYA = 81, // testnet
  ASTAR = 592,
}

/**
 * Default pagination values.
 */
export enum PaginationValues {
  PAGE_MAX_LIMIT = 100,
  PAGE_DEFAULT_LIMIT = 25,
}

export enum AirdropStatus {
  UNCONFIRMED = 1,
  PENDING = 2,
  AIRDROP_COMPLETED = 3,
  AIRDROP_ERROR = 4,
}

import {
  CollectionType,
  EvmChain,
  LogLevel,
  Nft,
  SubstrateChain,
} from '@apillon/sdk';
import { env } from '../../config/env';

(async () => {
  const nft = new Nft({
    key: env.APILLON_KEY,
    secret: env.APILLON_SECRET,
    logLevel: LogLevel.VERBOSE,
  });

  const collection = await nft.createSubstrate({
    chain: SubstrateChain.ASTAR,
    collectionType: CollectionType.GENERIC,
    name: 'Drop test',
    description: 'Specific ID drop test',
    symbol: 'DT',
    royaltiesFees: 0,
    royaltiesAddress: 'WfuyB8znWybwbkrXu5a6e4CdPPwRygyoqzByAZHBZuCgQdn',
    baseUri: 'https://test.com/metadata/',
    baseExtension: '.json',
    maxSupply: 0,
    drop: false,
  });
  console.log(collection.serialize());
})().catch(async (err) => {
  console.log(err);
});

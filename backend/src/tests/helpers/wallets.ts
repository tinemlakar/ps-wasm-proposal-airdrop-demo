import { Keyring } from '@polkadot/api';
import { mnemonicGenerate } from '@polkadot/util-crypto';

export async function getWallet() {
  const mnemonic = mnemonicGenerate();
  const keyring = new Keyring({ type: 'sr25519', ss58Format: 5 });
  const pair = keyring.createFromUri(mnemonic);
  return pair;
}

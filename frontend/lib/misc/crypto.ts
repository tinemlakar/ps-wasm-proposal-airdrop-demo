import Keyring from '@polkadot/keyring';
import { checkAddress } from '@polkadot/util-crypto';
import { SubstrateChainPrefix } from '~/lib/types/general.types';

const keyring = new Keyring({ type: 'sr25519' });

export function encodeAstarAddress(address: string): string {
  if (substrateAddressValidate(address, SubstrateChainPrefix.ASTAR)) {
    return address;
  }
  const decodeAddress = keyring.decodeAddress(address);
  return keyring.encodeAddress(decodeAddress, SubstrateChainPrefix.ASTAR);
}

export function substrateAddressValidate(
  value: string | null,
  chainPrefix?: SubstrateChainPrefix | number
): boolean {
  try {
    const [isValid] = checkAddress(`${value}`, chainPrefix || SubstrateChainPrefix.POLKADOT);

    return isValid;
  } catch (e: any) {
    return false;
  }
}

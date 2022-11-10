import {
  naclBoxPairFromSecret,
  blake2AsU8a,
  keyFromPath,
  naclOpen,
  naclSeal,
  sr25519PairFromSeed,
  keyExtractPath,
  mnemonicToMiniSecret,
  cryptoWaitReady,
} from '@polkadot/util-crypto'
import { Utils, Did, KeyRelationship } from '@kiltprotocol/sdk-js'
import * as Kilt from '@kiltprotocol/sdk-js'
import { websiteConfig } from '../data/website-config'
import { generateKeypairs } from '../utilities/generateKeypairs'
import * as dotenv from 'dotenv'
dotenv.config()

export const mnemonic = process.env.VERIFIER_MNEMONIC

export async function getAccount() {
  await cryptoWaitReady()
  const signingKeyPairType = 'sr25519'
  const keyring = new Utils.Keyring({
    ss58Format: 38,
    type: signingKeyPairType,
  })
  return keyring.addFromMnemonic(mnemonic)
}

export async function keypairs() {
  const account = await getAccount()
  const keypairs = {
    authentication: account.derive('//did//0'),
    assertion: account.derive('//did//assertion//0'),
    keyAgreement: (function () {
      const secretKeyPair = sr25519PairFromSeed(mnemonicToMiniSecret(mnemonic))
      const { path } = keyExtractPath('//did//keyAgreement//0')
      const { secretKey } = keyFromPath(secretKeyPair, path, 'sr25519')
      const blake = blake2AsU8a(secretKey)
      const boxPair = naclBoxPairFromSecret(blake)
      return {
        ...boxPair,
        type: 'x25519',
      }
    })(),
  }

  return keypairs
}

export async function relationships() {
  return {
    [KeyRelationship.authentication]: keypairs.authentication,
    [KeyRelationship.assertionMethod]: keypairs.assertion,
    [KeyRelationship.keyAgreement]: keypairs.keyAgreement,
  }
}

export async function getFullDid() {
  await Kilt.connect(websiteConfig.kilt_wss)
  const api = Kilt.ConfigService.get('api')
  // const fullDid = await api.call.did.query(Kilt.Did.toChain(process.env.VERIFIER_DID_URI))
  // const fullDid = await Did.FullDidDetails.fromChainInfo(process.env.VERIFIER_DID_URI)
  // return fullDid

  const attesterDidMnemonic = process.env.ATTESTER_DID_MNEMONIC
  const { authentication, attestation } =
    generateKeypairs(attesterDidMnemonic)
  const attesterDidUri = Kilt.Did.getFullDidUriFromKey(authentication)
  const encodedFullDid = await api.call.did.query(Kilt.Did.toChain(attesterDidUri))

  return encodedFullDid
}

export async function decryptChallenge(
  encryptedChallenge,
  encryptionKey,
  nonce
) {
  // decrypt the challenge
  const data = Utils.Crypto.coToUInt8(encryptedChallenge)
  const nonced = Utils.Crypto.coToUInt8(nonce)
  const peerPublicKey = encryptionKey.publicKey
  const keypair = await keypairs()
  const decrypted = naclOpen(
    data,
    nonced,
    peerPublicKey,
    keypair.keyAgreement.secretKey
  )

  // compare hex strings, fail if mismatch
  return Utils.Crypto.u8aToHex(decrypted)
}

export const encryptionKeystore = {
  async encrypt({ data, alg, peerPublicKey }) {
    const keypair = await keypairs()
    const { sealed, nonce } = naclSeal(
      data,
      keypair.keyAgreement.secretKey,
      peerPublicKey
    )
    return { data: sealed, alg, nonce }
  },
  async decrypt({ data, alg, nonce, peerPublicKey }) {
    const keypair = await keypairs()

    const decrypted = naclOpen(
      data,
      nonce,
      peerPublicKey,
      keypair.keyAgreement.secretKey
    )
    if (!decrypted) throw new Error('Failed to decrypt with given key')
    return { data: decrypted, alg }
  },
}

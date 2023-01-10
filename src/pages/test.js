import Layout from '../layouts/layout'
import { useConfig } from '../hooks/use-config';
import { VictoryPie } from 'victory';
import {
  Checkbox,
  createTheme,
  FormControl,
  FormControlLabel,
  FormGroup,
  FormHelperText,
  FormLabel,
  Slider,
  ThemeProvider
} from '@mui/material';
import { useEffect, useState } from 'react';
import useSporran from '../hooks/use-sporran'
import useUser from '../hooks/use-sporran-user';
import Button from '../components/ui/button';
import * as Kilt from '@kiltprotocol/sdk-js'
import { websiteConfig } from '../data/website-config';

/**
 * (0)
 * Add kilt to window in script tag to next js
 * https://nextjs.org/docs/basic-features/script
 */

/**
 * (I)
 * Register a dApp full chain DID via either sporran wallet or check the
 * workshop
 */

/**
 * (II)
 * setup communication between dapp and sporran extension
 * https://docs.kilt.io/docs/develop/dApp/session
 * 
 * const api = Kilt.ConfigService.get('api')
 * const did = 'did:kilt:4smcAoiTiCLaNrGhrAM4wZvt5cMKEGm8f3Cu9aFrpsh5EiNV'
 * const dAppName = 'Your dApp Name'
 */

/**
 * (III)
 * Frontend claim flow: https://docs.kilt.io/docs/develop/workshop/claimer/request
 *
 * 1. we need to create a claim from the frontend
 * a) have the ctype, content, and lightDID from the claimer ready
 * b) can we get lightDID from sporran?
 * c) claim = Kilt.Claim.fromCTypeAndClaimContents(ctype, content, lightDid)
 * d) content can e.g. look like this:
 * {
 *  age: 28,
 *  name: 'Max Mustermann'
 * }
 *
 * 2. then we need to create a credential from that claim
 * a) credential = Kilt.Credential.fromClaim(claim)
 */


function Test() {
  const { user, connected, login, logout } = useUser()
  // const sporran = useSporran()

  const setupSporran = async () => {
    await Kilt.connect(websiteConfig.kilt_wss)
    const kiltApi = Kilt.ConfigService.get('api')

    const did = 'did:kilt:4qsuK1AEoFBBRTwyuz7ip8CtLEydJqL12ybZk11Fbqy4HSU3'
    const dAppName = 'Proof of Chaos dApp'
    const encodedFullDid = await kiltApi.call.did.query(Kilt.Did.toChain(did))
    console.log('encodedFullDid', encodedFullDid)
    const { document } = Kilt.Did.linkedInfoFromChain(encodedFullDid)
    console.log('linkedInfo', document)
    //If there is no DID, or the DID does not have any key agreement key, return
    if (!document.keyAgreement || !document.keyAgreement[0]) {
      console.log('there is no DID, or the DID does not have any key agreement key')
      return
    }
    const dAppEncryptionKeyUri = `${document.uri}${document.keyAgreement[0].id}`

    console.log('dAppEncryptionKeyUri', dAppEncryptionKeyUri)

    /// IIIIMPORTANT ---- MUST COME FROM SERVER
    const challenge = "123"
    

    console.log("kilt", window.kilt.sporran)
    try {
      const session = await window.kilt.sporran.startSession(
        dAppName,
        dAppEncryptionKeyUri,
        challenge
      )
      console.log("allg", session)
    } catch (err) {
      console.log('>>> err', err);
    }

  }

  const generateCredential = () => {

    console.log('generateCredential', window.kilt.sporran)
  }

  return <div className="mx-auto max-w-4xl ">
    <div className="flex flex-col">
      {/* <p>sporran loaded: { sporran ? sporran.version : 'false' }</p>
      <p>session: { JSON.stringify(session) }</p> */}
      <Button variant="calm" onClick={setupSporran}>setup sporran communication</Button>
      <Button variant="calm" onClick={generateCredential}>generate claim + credential</Button>
      <Button variant="calm" onClick={login}>login</Button>
      <Button variant="calm" onClick={logout}>logout</Button>
    </div>
  </div>
}

Test.getLayout = function getLayout(page) {
  return <Layout>{page}</Layout>
}

export default Test

import Layout from "../layouts/layout";
import { useConfig } from "../hooks/use-config";
import { VictoryPie } from "victory";
import {
  Checkbox,
  createTheme,
  FormControl,
  FormControlLabel,
  FormGroup,
  FormHelperText,
  FormLabel,
  Slider,
  ThemeProvider,
} from "@mui/material";
import { useEffect, useState } from "react";
import useSporran from "../hooks/use-sporran";
import useUser from "../hooks/use-sporran-user";
import Button from "../components/ui/button";
import * as Kilt from "@kiltprotocol/sdk-js";
import { websiteConfig } from "../data/website-config";
import { mnemonicGenerate, mnemonicToMiniSecret, randomAsHex } from '@polkadot/util-crypto'

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

function generateKeypairs(mnemonic = mnemonicGenerate()) {
  const authentication = Kilt.Utils.Crypto.makeKeypairFromSeed(
    mnemonicToMiniSecret(mnemonic)
  )
  const encryption = Kilt.Utils.Crypto.makeEncryptionKeypairFromSeed(
    mnemonicToMiniSecret(mnemonic)
  )
  const attestation = authentication.derive(
    '//attestation'
  )
  const delegation = authentication.derive(
    '//delegation'
  )

  return {
    authentication,
    encryption,
    attestation,
    delegation
  }
}

const emailCType = {
  $id: 'kilt:ctype:0x3291bb126e33b4862d421bfaa1d2f272e6cdfc4f96658988fbcffea8914bd9ac',
  $schema: 'http://kilt-protocol.org/draft-01/ctype#',
  title: 'Email',
  properties: {
    Email: {
      type: 'string'
    }
  },
  type: 'object'
}

function isTrustedAttester(attester) {
  // We only trust SocialKYC for now.
  console.log("attester", attester)

  // SocialKYC on spiritnet:
  // return attester === "did:kilt:4pnfkRn5UurBJTW92d9TaVLR2CqJdY4z5HPjrEbpGyBykare"

  // SocialKYC on peregrine:
  return attester === "did:kilt:4pehddkhEanexVTTzWAtrrfo2R7xPnePpuiJLC7shQU894aY"
}

function Test() {
  const { user, connected, login, logout } = useUser();
  const [session, setSession] = useState()

  // const sporran = useSporran()

  const setupSporran = async () => {
    await Kilt.connect(websiteConfig.kilt_wss);
    const kiltApi = Kilt.ConfigService.get("api");

    const did = "did:kilt:4tWp3bN2eGrahhYS6kZ725eimhnHx8hnsS6qZ4177FHH1dAT";
    const dAppName = "Proof of Chaos dApp";
    const encodedFullDid = await kiltApi.call.did.query(Kilt.Did.toChain(did));
    console.log("encodedFullDid", encodedFullDid);
    const { document } = Kilt.Did.linkedInfoFromChain(encodedFullDid);
    console.log("linkedInfo", document);
    //If there is no DID, or the DID does not have any key agreement key, return
    if (!document.keyAgreement || !document.keyAgreement[0]) {
      console.log(
        "there is no DID, or the DID does not have any key agreement key"
      );
      return;
    }
    const dAppEncryptionKeyUri = `${document.uri}${document.keyAgreement[0].id}`;

    console.log("dAppEncryptionKeyUri", dAppEncryptionKeyUri);

    /// IIIIMPORTANT ---- MUST COME FROM SERVER
    const challenge = "123";

    console.log("kilt", window.kilt.sporran);
    let newSession;
    try {
      newSession = await window.kilt.sporran.startSession(
        dAppName,
        dAppEncryptionKeyUri,
        challenge
      );
      console.log("allg", newSession);
    } catch (err) {
      console.log(">>> err", err);
      return;
    }
    setSession(newSession)
    const { encryptionKeyUri, encryptedChallenge, nonce } = newSession;
    console.log(encryptionKeyUri)
    const encryptionKey = await Kilt.Did.resolveKey(encryptionKeyUri);
    console.log(encryptionKey);
    if (!encryptionKey) {
      throw "an encryption key is required";
    }
  };

  const generateCredential = () => {
    console.log("generateCredential", window.kilt.sporran);
  };

  const verify = async () => {
    console.log("generateCredential", window.kilt.sporran);

    const requestChallenge = randomAsHex(24);

    const verifierDid = 'did:kilt:VERIFIER DID'
    const verifierDidDoc = await Kilt.Did.resolve(verifierDid)
    const verifierMnemomic = 'INPUT MNEMONIC HERE'
    const verifierKeys = generateKeypairs(verifierMnemomic)
    const { did: claimerDid } = Kilt.Did.parse(session.encryptionKeyUri)

    const message = Kilt.Message.fromBody(
      {
        content: {
          cTypes: [{ cTypeHash: "0x3291bb126e33b4862d421bfaa1d2f272e6cdfc4f96658988fbcffea8914bd9ac", requiredProperties: ["Email"] }],
          challenge: requestChallenge,
        },
        type: 'request-credential',
      },
      verifierDid,
      claimerDid
    )

    const encryptedMesage = await Kilt.Message.encrypt(
      message,
      async ({
        data,
        peerPublicKey
      }) => {
        const { box, nonce } = Kilt.Utils.Crypto.encryptAsymmetric(
          data,
          peerPublicKey,
          verifierKeys.encryption.secretKey
        )
        return {
          data: box,
          nonce,
          keyUri: `${verifierDid}${verifierDidDoc.document.keyAgreement[0].id}`
        }
      },
      session.encryptionKeyUri
    )

    await session.send(encryptedMesage)
    await session.listen(async (message) => {
      // Create a callback that uses the DID encryption key to decrypt the message.
      const decryptCallback = async ({
        data,
        nonce,
        peerPublicKey
      }) => {
        const result = Kilt.Utils.Crypto.decryptAsymmetric(
          { box: data, nonce },
          peerPublicKey,
          verifierKeys.encryption.secretKey
        )
        if (!result) {
          throw new Error('Cannot decrypt')
        }
        return {
          data: result
        }
      }

      const decryptedMessage = await Kilt.Message.decrypt(
        message,
        decryptCallback
      )

      if (decryptedMessage.body.type !== 'submit-credential') {
        throw new Error('Unexpected message type')
      }
      const credential = decryptedMessage.body.content[0]
      await Kilt.Credential.verifyPresentation(credential);

      const api = Kilt.ConfigService.get('api')
      const attestationChain = await api.query.attestation.attestations(
        credential.rootHash
      )
    
      const attestation = Kilt.Attestation.fromChain(
        attestationChain,
        credential.rootHash
      )
    
      if (attestation.revoked) {
        throw new Error("Credential has been revoked and hence it's not valid.")
      }
      if (attestation.cTypeHash !== credential.claim.cTypeHash) {
        console.log(attestation.cTypeHash, credential.claim.cTypeHash)
        throw new Error("Credential has invalid ctype and hence it's not valid.")
      }
      if (!isTrustedAttester(attestation.owner)) {
        throw new Error("Credential has an untrusted attester and hence it's not valid.")
      }
      console.log(
        "The claim is valid. Claimer's email:",
        credential.claim.contents.Email
      )
    })
  };

  return (
    <div className="mx-auto max-w-4xl ">
      <div className="flex flex-col">
        {/* <p>sporran loaded: { sporran ? sporran.version : 'false' }</p>
      <p>session: { JSON.stringify(session) }</p> */}
        <Button variant="calm" onClick={setupSporran}>
          setup sporran communication
        </Button>
        <Button variant="calm" onClick={generateCredential}>
          generate claim + credential
        </Button>
        <Button variant="calm" onClick={verify} disabled={typeof session === 'undefined'}>
          Verify
        </Button>
        <Button variant="calm" onClick={login}>
          login
        </Button>
        <Button variant="calm" onClick={logout}>
          logout
        </Button>
      </div>
    </div>
  );
}

Test.getLayout = function getLayout(page) {
  return <Layout>{page}</Layout>;
};

export default Test;

import Document, {
  DocumentContext,
  Head,
  Html,
  Main,
  NextScript,
} from 'next/document';
import Script from 'next/script';

import { ServerStyleSheet } from 'styled-components'


class CustomDocument extends Document {
  static async getInitialProps(ctx) {
    return Document.getInitialProps(ctx);
  }
  render() {
    return (
      <Html lang="en-US" dir="ltr" className="light">
        <Head>
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
          <link href="https://fonts.googleapis.com/css2?family=Ubuntu+Mono:wght@400;700&display=swap" rel="stylesheet" />
          <link rel="shortcut icon" href="/favicon.ico" />
        </Head>
        <body>
          <Script strategy='beforeInteractive' id="load-sporran-kilt-extension">
            {`window.kilt = {};Object.defineProperty(window.kilt, 'meta', {value: { versions: { credentials: '3.0' } },enumerable: false});`}
          </Script>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}

export default CustomDocument;

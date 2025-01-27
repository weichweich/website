import { useWindowScroll } from "react-use"
import { MenuItems } from './layout-menu'
import { useBreakpoint } from '../hooks/use-breakpoint'
import { isMounted, useIsMounted } from '../hooks/use-is-mounted'
import Hamburger from "../components/ui/hamburger"
import WalletConnect from "../components/nft/wallet-connect"
import Logo from "../components/ui/logo";
import Footer from "../components/ui/footer"
import { useState } from "react"
import { useDrawer } from "../components/drawer/context"
import { NextSeo } from "next-seo"
import { getApi } from "../data/chain"
import { useSubscribeChainHead } from "../hooks/use-chain"

function HeaderRight() {
  const { openDrawer, isOpen } = useDrawer();

  return(
    <div className="order-last flex shrink-0 items-center">
      <div className="hidden sm:block">
        <WalletConnect className="pl-3 pr-3 ml-3" />
      </div>
      <div className="lg:hidden">
        <Hamburger
          isOpen={isOpen}
          onClick={() => openDrawer('DASHBOARD_SIDEBAR')}
        />
      </div>
    </div>
  )
}

export function Header() {
  const breakpoint = useBreakpoint();
  const isMounted = useIsMounted();
  const api = getApi();
  useSubscribeChainHead( api );

  return (
    <nav
      className={`fixed top-0 z-30 flex w-full items-center justify-between px-4 transition-all duration-300 ltr:right-0 rtl:left-0 sm:px-10 lg:px-10 xl:px-10 3xl:px-12 h-16 bg-gradient-to-b from-gray-50 to-gray-50/80 shadow-card backdrop-blur-sm dark:from-dark dark:to-dark/80 sm:h-20` }
    >
      <Logo />
      {isMounted && ['xs', 'sm', 'md'].indexOf(breakpoint) == -1 && (
        <MenuItems />
      )}
      <HeaderRight />
    </nav>
  )
}

export default function Layout({ children }) {
  return(
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="mb-12 flex flex-grow flex-col pt-16 sm:pt-24">
        {children}
      </main>
      <Footer />
    </div>
  )
}
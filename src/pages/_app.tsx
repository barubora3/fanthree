import "@/styles/globals.css";
import type { AppProps } from "next/app";
import "@rainbow-me/rainbowkit/styles.css";
import { Header } from "../components/header";
import SidebarWithHeader from "../components/sidebar";
import { getDefaultWallets, RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { configureChains, createClient, WagmiConfig } from "wagmi";
import { polygonMumbai } from "wagmi/chains";
import { alchemyProvider } from "wagmi/providers/alchemy";
import { publicProvider } from "wagmi/providers/public";

import { ChakraProvider } from "@chakra-ui/react";

import {
  LivepeerConfig,
  createReactClient,
  studioProvider,
} from "@livepeer/react";
import * as React from "react";

const livepeerClient = createReactClient({
  provider: studioProvider({
    apiKey: process.env.NEXT_PUBLIC_STUDIO_API_KEY || "",
  }),
});

const { chains, provider } = configureChains(
  [polygonMumbai],
  [
    alchemyProvider({ apiKey: process.env.NEXT_PUBLIC_ALCHEMY_ID || "" }),
    publicProvider(),
  ]
);

const { connectors } = getDefaultWallets({
  appName: "My RainbowKit App",
  projectId: process.env.NEXT_PUBLIC_ALCHEMY_ID || "",
  chains,
});

const wagmiClient = createClient({
  autoConnect: true,
  connectors,
  provider,
});

export default function App({ Component, pageProps }: AppProps) {
  return (
    <WagmiConfig client={wagmiClient}>
      <RainbowKitProvider chains={chains}>
        <LivepeerConfig client={livepeerClient}>
          <ChakraProvider>
            {/* <Header></Header> */}
            <SidebarWithHeader {...pageProps}>
              <Component {...pageProps} />
            </SidebarWithHeader>
          </ChakraProvider>
        </LivepeerConfig>
      </RainbowKitProvider>
    </WagmiConfig>
  );
}

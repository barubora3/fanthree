import { useCallback, useMemo, useState, useEffect } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import {
  Box,
  Button,
  Heading,
  FormControl,
  FormLabel,
  Input,
  VStack,
  HStack,
  Text,
  Center,
  useToast,
  Flex,
  Spacer,
} from "@chakra-ui/react";
import { firestore, doc, getDoc, setDoc } from "../../lib/firebase";
import { useAccount } from "wagmi";
import NextLink from "next/link";
import paymentToken from "../../config/paymentToken.json";

import { deploy } from "@bunzz/deploy-sdk";
import { providers } from "ethers";
const TEMPLATE_ID = "d5817b20-f008-4e66-946e-3c67fd09b7a5";

export default function NFT() {
  const toast = useToast();
  const { address, isConnected } = useAccount();
  const [contractAddress, setContractAddress] = useState<string>("");
  const [txHash, setTxHash] = useState<string>("");
  const [uri, setUri] = useState<string>("");
  const [completed, setCompleted] = useState<boolean>(false);
  useEffect(() => {}, []);

  const deployContract = async () => {
    setCompleted(false);
    // get a Signer object in the ethers' style.
    const signer = getSigner();

    // Arguments for the constructor as an array.
    // The types must follow the ethers style.
    const args = [uri];

    // The return value is the same as the ethers one.
    const tx = await deploy(TEMPLATE_ID, signer, args);

    // You can get receipt as well.
    const receipt = await tx.wait();

    console.log(receipt);
    console.log(receipt.contractAddress);

    setContractAddress(receipt.contractAddress);
    setTxHash(receipt.transactionHash);

    setCompleted(true);
    toast({
      title: "Deploy Successed.",
      status: "success",
      duration: 3000,
      isClosable: true,
      position: "bottom-right",
    });
  };
  const getSigner = () => {
    const provider = new providers.Web3Provider((window as any).ethereum);
    return provider.getSigner();
  };
  return (
    <>
      <Box px={40} pt={10}>
        <Heading w="100%" textAlign={"center"} fontWeight="normal" mb="2%">
          Crate Membership Token
        </Heading>

        {!isConnected && (
          <>
            <VStack>
              <Heading
                w="100%"
                textAlign={"center"}
                fontWeight="normal"
                mb="2%"
                size={"md"}
                pt={4}
              >
                Please Connect Your Wallet
              </Heading>
              <ConnectButton />
            </VStack>
          </>
        )}
        {isConnected && (
          <Box suppressHydrationWarning={true}>
            <Box pt={4} px={20}>
              <VStack>
                <Heading w="100%" fontWeight="normal" mb="2%" size="lg">
                  Deploy Your Contract (ERC1155)
                </Heading>

                <FormControl mt="2%">
                  <FormLabel fontWeight={"normal"}>base URI </FormLabel>
                  <Input
                    id="contract"
                    type="text"
                    value={uri}
                    onChange={(e) => setUri(e.target.value)}
                  />
                </FormControl>
              </VStack>
              <Center pt={4}>
                <Button colorScheme="orange" onClick={deployContract}>
                  Deploy
                </Button>
              </Center>
            </Box>
            {completed && (
              <Box pt={4}>
                <Text>Contract Address</Text>
                <a
                  href={`https://mumbai.polygonscan.com/address/${contractAddress}`}
                  target="_blank"
                >
                  <Text>{contractAddress}</Text>
                </a>
                <Text>Transaction Hash</Text>
                <a
                  href={`https://mumbai.polygonscan.com/tx/${txHash}`}
                  target="_blank"
                >
                  <Text>{txHash}</Text>
                </a>{" "}
              </Box>
            )}
          </Box>
        )}
      </Box>
    </>
  );
}

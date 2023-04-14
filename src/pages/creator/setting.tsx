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
} from "@chakra-ui/react";
import { firestore, doc, getDoc, setDoc } from "../../lib/firebase";
import { useAccount } from "wagmi";

export default function Setting() {
  const toast = useToast();
  const { address, isConnected } = useAccount();

  const [subscriptionPrice, setSubscriptionPrice] = useState<number>(0);
  const [membershipNFTAddress, setMembershipNFTAddress] = useState<string>("");
  useEffect(() => {
    if (!isConnected || !address) {
      return;
    }

    const initialize = async () => {
      const docRef = doc(firestore, "creator", address);

      try {
        const doc = await getDoc(docRef);

        if (doc.exists()) {
        }
        console.log("Cached document data:", doc.data());
        const data = doc.data();
        if (!data) {
          alert("data fetch error");
          return;
        }
        setSubscriptionPrice(data.price);
        setMembershipNFTAddress(data.contractAddress);
      } catch (e) {
        console.log("Error getting cached document:", e);
      }
    };
    initialize();
  }, []);

  const update = async () => {
    if (!address) return;
    await setDoc(doc(firestore, "creator", address), {
      price: subscriptionPrice,
      contractAddress: membershipNFTAddress,
    });

    toast({
      title: "Setting Updated.",
      status: "success",
      duration: 3000,
      isClosable: true,
      position: "bottom-right",
    });
  };

  return (
    <>
      <Box px={40} pt={10}>
        <Heading w="100%" textAlign={"center"} fontWeight="normal" mb="2%">
          Subscription Setting
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
            <Box pt={8} w="100%">
              <VStack>
                <Heading
                  w="100%"
                  textAlign={"center"}
                  fontWeight="normal"
                  mb="2%"
                  size="md"
                >
                  Subscription Fee
                </Heading>
                <FormControl mt="2%">
                  <FormLabel fontWeight={"normal"}>
                    Monthly Payment (Paid in USDCx)
                  </FormLabel>
                  <HStack>
                    <Input
                      id="contract"
                      type="number"
                      w={"50%"}
                      value={subscriptionPrice}
                      onChange={(e) =>
                        setSubscriptionPrice(Number(e.target.value))
                      }
                    />
                    <Text pl={4}>USDCx</Text>
                  </HStack>
                </FormControl>
              </VStack>
              <Box py={4} />
              <VStack>
                <Heading
                  w="100%"
                  textAlign={"center"}
                  fontWeight="normal"
                  mb="2%"
                  size="md"
                >
                  Membership NFT
                </Heading>
                <FormControl mt="2%">
                  <FormLabel htmlFor="email" fontWeight={"normal"}>
                    Contract Address
                  </FormLabel>
                  <Input
                    id="contract"
                    type="text"
                    value={membershipNFTAddress}
                    onChange={(e) => setMembershipNFTAddress(e.target.value)}
                  />
                </FormControl>
              </VStack>
              <Center pt={4}>
                <Button colorScheme="orange" onClick={update}>
                  Set
                </Button>
              </Center>
            </Box>
          </Box>
        )}
      </Box>
    </>
  );
}

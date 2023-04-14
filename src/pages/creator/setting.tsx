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

export default function Setting() {
  const toast = useToast();
  const { address, isConnected } = useAccount();

  const [name, setName] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [pfp, setPfp] = useState<string>("");
  const [subscriptionPrice, setSubscriptionPrice] = useState<number>(0);
  const [membershipNFTAddress, setMembershipNFTAddress] = useState<string>("");
  useEffect(() => {
    if (!isConnected || !address) {
      return;
    }

    const initialize = async () => {
      const docRef = doc(firestore, "creator", address.toLowerCase());

      try {
        const doc = await getDoc(docRef);

        console.log("Cached document data:", doc.data());
        const data = doc.data();
        if (data) {
          setName(data.name);
          setDescription(data.description);
          setPfp(data.pfp);
          setSubscriptionPrice(data.price);
          setMembershipNFTAddress(data.contractAddress);
        }
      } catch (e) {
        console.log("Error getting cached document:", e);
      }
    };
    initialize();
  }, []);

  const update = async () => {
    if (!address) return;
    await setDoc(
      doc(firestore, "creator", address.toLowerCase()),
      {
        name,
        description,
        pfp,
        price: subscriptionPrice,
        contractAddress: membershipNFTAddress,
      },
      { merge: true }
    );

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
          Creator Setting
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
            <Box pt={4} px={60}>
              <Flex justifyContent={"justify-end"}>
                <Box /> <Spacer />
                <NextLink
                  href={`/creator/profile/${address?.toLowerCase()}`}
                  style={{ textDecoration: "none" }}
                >
                  <Button colorScheme="orange" variant="outline">
                    My Profile Page
                  </Button>
                </NextLink>
              </Flex>
              <VStack pb={8}>
                <Heading w="100%" fontWeight="normal" mb="2%" size="lg">
                  Profile
                </Heading>

                <FormControl mt="2%" py={2}>
                  <FormLabel fontWeight={"normal"}>Name</FormLabel>
                  <Input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </FormControl>

                <FormControl mt="2%" py={2}>
                  <FormLabel fontWeight={"normal"}>Description</FormLabel>
                  <Input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </FormControl>

                <FormControl mt="2%" py={2}>
                  <FormLabel fontWeight={"normal"}>
                    Profile Picture(URL)
                  </FormLabel>

                  <Input
                    type="text"
                    value={pfp}
                    onChange={(e) => setPfp(e.target.value)}
                  />
                  {pfp && (
                    <Box pt={4}>
                      <img
                        width={250}
                        height={250}
                        src={pfp}
                        alt="profile picture"
                      />
                    </Box>
                  )}
                </FormControl>
              </VStack>
              <VStack>
                <Heading w="100%" fontWeight="normal" mb="2%" size="lg">
                  Subscription Fee
                </Heading>
                <FormControl mt="2%">
                  <FormLabel fontWeight={"normal"}>
                    Monthly Payment (Paid in {paymentToken.symbol})
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
                    <Text pl={4}>{paymentToken.symbol}</Text>
                  </HStack>
                </FormControl>
              </VStack>
              <Box py={4} />
              <VStack>
                <Heading w="100%" fontWeight="normal" mb="2%" size="lg">
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

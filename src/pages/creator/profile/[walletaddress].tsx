import { useCallback, useMemo, useState, useEffect } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import {
  Box,
  Button,
  Heading,
  FormControl,
  FormLabel,
  Input,
  Stack,
  VStack,
  HStack,
  Text,
  Center,
  useToast,
  Avatar,
  Card,
  CardHeader,
  CardBody,
  CardFooter,
} from "@chakra-ui/react";
import { firestore, doc, getDoc, setDoc } from "../../../lib/firebase";
import { useAccount } from "wagmi";
import { useRouter } from "next/router";
import paymentToken from "../../../config/paymentToken.json";

export default function Setting() {
  const router = useRouter();
  const walletaddress = router.query.walletaddress as string;

  const toast = useToast();
  const { address, isConnected } = useAccount();

  const [name, setName] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [pfp, setPfp] = useState<string>("");
  const [subscriptionPrice, setSubscriptionPrice] = useState<number>(0);
  const [membershipNFTAddress, setMembershipNFTAddress] = useState<string>("");

  const [isSubscribed, setIsSubscribed] = useState<boolean>(false);
  const [contentsList, setContentsList] = useState<any[]>([]);
  useEffect(() => {
    if (!isConnected || !address) {
      return;
    }

    const initialize = async () => {
      if (!walletaddress) {
        return;
      }
      const creatorRef = doc(firestore, "creator", walletaddress.toLowerCase());
      const contentsRef = doc(
        firestore,
        "contents",
        walletaddress.toLowerCase()
      );

      try {
        // get profile
        const creatorDoc = await getDoc(creatorRef);

        const creator = creatorDoc.data();
        if (!creator) {
          alert("data fetch error");
          return;
        }
        setName(creator.name);
        setDescription(creator.description);
        setPfp(creator.pfp);
        setSubscriptionPrice(creator.price);
        setMembershipNFTAddress(creator.contractAddress);

        // get contents
        const contentsDoc = await getDoc(contentsRef);

        const contents = contentsDoc.data();
        console.log(contents);
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
        <Box suppressHydrationWarning={true}>
          <Box pt={4} px={60}>
            <HStack>
              <Avatar src={pfp} size={"2xl"}></Avatar>
              <Stack pl={4}>
                <Text fontSize={"2xl"}>{name}</Text>
                <Text>{description}</Text>
              </Stack>
            </HStack>
            <Box pt={12}>
              <Card variant={"elevated"} align="center">
                <CardBody>
                  <VStack>
                    <Text fontSize={"lg"} pt={4} pb={2}>
                      Begin ongoing support!
                    </Text>

                    <Heading size={"lg"}>
                      {/* {`${subscriptionPrice} ${paymentToken.symbol}`} / month */}
                    </Heading>
                    <Text fontSize={"sm"}>
                      ※Transferred every second using SuperFluid
                    </Text>

                    <Box py={4}>
                      <Button colorScheme="orange">Support</Button>
                    </Box>
                  </VStack>
                </CardBody>
              </Card>
            </Box>
            <VStack pt={12} pb={8}>
              <Heading w="100%" fontWeight="normal" mb="2%" size="lg">
                Contents
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
      </Box>
    </>
  );
}

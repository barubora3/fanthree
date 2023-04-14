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
import { Framework } from "@superfluid-finance/sdk-core";
import { useProvider, useSwitchNetwork, useSigner } from "wagmi";
import { ethers } from "ethers";

export default function Setting() {
  const router = useRouter();
  const provider = useProvider();
  const { chains, error, pendingChainId, switchNetwork } = useSwitchNetwork();
  const { data: signer, isError, isLoading } = useSigner();

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
    // if (!isConnected || !address) {
    //   return;
    // }

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

  function calculateFlowRate(amountInEther: number) {
    let calculatedFlowRate = "";
    if (
      typeof Number(amountInEther) !== "number" ||
      isNaN(Number(amountInEther)) === true
    ) {
      console.log(typeof Number(amountInEther));
      alert("You can only calculate a flowRate based on a number");
    } else if (typeof Number(amountInEther) === "number") {
      const monthlyAmount = Number(
        ethers.utils.parseEther(amountInEther.toString())
      );
      calculatedFlowRate = String(Math.floor(monthlyAmount / 3600 / 24 / 30));
    }
    return calculatedFlowRate;
  }

  const subscribe = async () => {
    const chainId = paymentToken.chainId;
    if (!chainId) {
      alert("data id is not set.");
      return;
    }
    await switchNetwork?.(chainId);

    // The wagmi signature does not match the type SuperFluid is assuming.
    // I don't have time for this, so I'll use Ethers. Waste of code. Defeat.
    const provider = new ethers.providers.Web3Provider(
      (window as any).ethereum
    );
    await provider.send("eth_requestAccounts", []);

    const signer = provider.getSigner();
    console.log(signer);

    // const chainId = await window.ethereum.request({ method: "eth_chainId" });
    console.log("A");
    const sf = await Framework.create({
      chainId: paymentToken.chainId,
      provider,
    });

    const superSigner = sf.createSigner({ signer: signer });

    console.log(signer);
    console.log(await superSigner.getAddress());
    const tokenx = await sf.loadSuperToken(paymentToken.symbol);

    console.log(tokenx);
    const flowRate = calculateFlowRate(subscriptionPrice);
    if (!flowRate) {
      alert("Flow rate is cant calculated.");
    }
    console.log(flowRate);

    try {
      const createFlowOperation = tokenx.createFlow({
        sender: await superSigner.getAddress(),
        receiver: walletaddress,
        flowRate: flowRate,
        // userData?: string
      });
      console.log({
        sender: await superSigner.getAddress(),
        receiver: walletaddress,
        flowRate: flowRate,
      });
      console.log(createFlowOperation);
      console.log("Creating your stream...");

      const result = await createFlowOperation.exec(superSigner);
      console.log(result);

      console.log(
        `Congrats - you've just created a money stream!
      `
      );
    } catch (error) {
      console.log(
        "Hmmm, your transaction threw an error. Make sure that this stream does not already exist, and that you've entered a valid Ethereum address!"
      );
      console.error(error);
    }
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
              {subscriptionPrice > 0 && (
                <Card variant={"elevated"} align="center">
                  <CardBody>
                    <VStack>
                      <Text fontSize={"lg"} pt={4} pb={2}>
                        Begin ongoing support!
                      </Text>

                      <Heading size={"lg"}>
                        {`${subscriptionPrice} ${paymentToken.symbol}`} / month
                      </Heading>
                      <Text fontSize={"sm"}>
                        ※Transferred every second using SuperFluid
                      </Text>

                      <Box py={4}>
                        <Button colorScheme="orange" onClick={subscribe}>
                          Support
                        </Button>
                      </Box>
                    </VStack>
                  </CardBody>
                </Card>
              )}
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

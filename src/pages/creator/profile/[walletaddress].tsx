import { useCallback, useMemo, useState, useEffect } from "react";
import { Player } from "@livepeer/react";

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
  Badge,
  Spacer,
  Flex,
} from "@chakra-ui/react";
import { firestore, doc, getDoc, setDoc } from "../../../lib/firebase";
import { useAccount } from "wagmi";
import { useRouter } from "next/router";
import paymentToken from "../../../config/paymentToken.json";
import { Framework } from "@superfluid-finance/sdk-core";
import { useProvider, useSwitchNetwork, useSigner } from "wagmi";
import { ethers } from "ethers";
import { useMutation } from "@tanstack/react-query";
import {
  CreateSignedPlaybackBody,
  CreateSignedPlaybackResponse,
} from "../../api/sign-jwt";
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

  interface ApiError {
    message: string;
  }
  useEffect(() => {
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

        setContentsList(creator.contents ? creator.contents : []);

        // console.log(contents);
      } catch (e) {
        console.log("Error getting cached document:", e);
      }

      // check subscription
      if (!isConnected || !address) {
        checkSubscription()
      }
    };
    initialize();
  }, [walletaddress]);

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

  const checkSubscription = async () => {
    const chainId = paymentToken.chainId;
    if (!chainId) {
      alert("data id is not set.");
      return;
    }
    await switchNetwork?.(chainId);
    (window as any).reload();

    const provider = new ethers.providers.Web3Provider(
      (window as any).ethereum
    );
    const signer = provider.getSigner();
 

    const sf = await Framework.create({
      chainId: paymentToken.chainId,
      provider,
    });


    const tokenx = await sf.loadSuperToken(paymentToken.symbol);

    let res = await tokenx.getFlow({
      sender: address ||"",
      receiver: walletaddress,
      providerOrSigner: signer
    });

    console.log(res)

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
    const sf = await Framework.create({
      chainId: paymentToken.chainId,
      provider,
    });

    const superSigner = sf.createSigner({ signer: signer });

    const tokenx = await sf.loadSuperToken(paymentToken.symbol);

    const flowRate = calculateFlowRate(subscriptionPrice);
    if (!flowRate) {
      alert("Flow rate is cant calculated.");
    }

    try {
      const createFlowOperation = tokenx.createFlow({
        sender: await superSigner.getAddress(),
        receiver: walletaddress,
        flowRate: flowRate,
        // userData?: string
      });
      console.log(createFlowOperation);
      console.log("Creating your stream...");

      const result = await createFlowOperation.exec(superSigner);
      console.log(result);
      console.log(
        `Congrats - you've just created a money stream!
      `
      );
      setIsSubscribed(true);
    } catch (error) {
      console.log(
        "Hmmm, your transaction threw an error. Make sure that this stream does not already exist, and that you've entered a valid Ethereum address!"
      );
      console.error(error);
    }

    // 冗長だけどまとめてる時間ない
    const unsubscribe = async () => {
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
      const sf = await Framework.create({
        chainId: paymentToken.chainId,
        provider,
      });
  
      const superSigner = sf.createSigner({ signer: signer });
  
      const tokenx = await sf.loadSuperToken(paymentToken.symbol);
  
  
      try {
        const deleteFlowOperation = tokenx.deleteFlow({
          sender: await signer.getAddress(),
          receiver: walletaddress
          // userData?: string
        });  
        console.log(deleteFlowOperation);
        console.log("Creating your stream...");
  
        const result = await deleteFlowOperation.exec(superSigner);
        console.log(result);
        console.log(
          `Congrats - you've just created a money stream!
        `
        );
        setIsSubscribed(false);

      } catch (error) {
        console.log(
          "Hmmm, your transaction threw an error. Make sure that this stream does not already exist, and that you've entered a valid Ethereum address!"
        );
        console.error(error);
      }

    const { mutate: createJwt, data: createdJwt } = useMutation({
      mutationFn: async (param: any) => {
        const body: CreateSignedPlaybackBody = {
          playbackId: param.playbackId,
          // we pass along a "secret key" to demonstrate how gating can work
          secret: "supersecretkey",
        };

        // we make a request to the Next.JS API route shown above
        const response = await fetch("/api/create-signed-jwt", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        });

        return response.json() as Promise<
          CreateSignedPlaybackResponse | ApiError
        >;
      },
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
              {contentsList.map((content) => {
                return (
                  <Box key={content.playbackId}>
                  {!content.onlySubscriber && (
                    <Card w={"100%"}>
                      <CardBody>
                        <Stack
                          flexDirection="column"
                          justifyContent="center"
                          alignItems="start"
                        >
               

                          <HStack pb={4}>
                            <Box>
                              <Heading fontSize={"2xl"} fontFamily={"body"}>
                                {content.name}
                              </Heading>
                            </Box>
                            <Box pt={0} pl={2}>
                              <Badge variant="solid" colorScheme="green">
                                Public
                              </Badge>
                            </Box>
                          </HStack>
                          <Player
                            title={content?.name}
                            playbackId={content?.playbackId}
                            autoPlay
                            muted
                            // jwt={
                            //   (createdJwt as CreateSignedPlaybackResponse)?.token
                            // }
                          />
                          <Text
                            fontWeight={600}
                            color={"gray.500"}
                            size="sm"
                            py={2}
                          >
                            {content.description}
                          </Text>
                        </Stack>
                      </CardBody>
                    </Card>
                  )}
                  {/* {content.onlySubscriber && (
                    <Card w={"100%"}>
                      <CardBody>
                        <Stack
                          flexDirection="column"
                          justifyContent="center"
                          alignItems="start"
                        >
                          <HStack pb={4}>
                            <Box>
                              <Heading fontSize={"2xl"} fontFamily={"body"}>
                                {content.name}
                              </Heading>
                            </Box>
                            <Box pt={0} pl={2}>
                              <Badge variant="solid" colorScheme="blue">
                                Only Subscriber
                              </Badge>
                            </Box>
                          </HStack>
                          <Player
                            title={content?.name}
                            playbackId={content?.playbackId}
                            autoPlay
                            muted
                            // jwt={
                            //   (
                            //     createdJwt
                          
                            //     as CreateSignedPlaybackResponse
                            //   )?.token
                            // }
                          />
                          <Text
                            fontWeight={600}
                            color={"gray.500"}
                            size="sm"
                            py={2}
                          >
                            {content.description}
                          </Text>
                        </Stack>
                      </CardBody>
                    </Card>
                  )} */}
            
                </Box>
                )
              })}
            </VStack>
          </Box>
          
        </Box>
      </Box>
    </>
  );
};
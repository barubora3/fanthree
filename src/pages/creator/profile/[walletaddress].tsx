import { useCallback, useMemo, useState, useEffect } from "react";
import { Player } from "@livepeer/react";
import * as PushAPI from "@pushprotocol/restapi";

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
import { firestore, doc, getDoc, updateDoc } from "../../../lib/firebase";
import { useAccount } from "wagmi";
import { useRouter } from "next/router";
import paymentToken from "../../../config/paymentToken.json";
import { Framework } from "@superfluid-finance/sdk-core";
import { useProvider, useSwitchNetwork, useSigner, useNetwork } from "wagmi";
import { ethers } from "ethers";
import { useMutation } from "@tanstack/react-query";
import { ENV } from "@pushprotocol/uiweb";
import {
  CreateSignedPlaybackBody,
  CreateSignedPlaybackResponse,
} from "../../api/create-signed-jwt";
export default function Setting() {
  const router = useRouter();
  const provider = useProvider();
  const { chains, error, pendingChainId, switchNetwork } = useSwitchNetwork();
  const { data: signer, isError, isLoading } = useSigner();
  const { chain } = useNetwork();

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

  const [jwtToken, setJwtToken] = useState<string>("");
  const [jwtMap, setJwtMap] = useState<any>({});
  const [isReceiveNotification, setIsRecievedNotification] = useState(false);

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

        setContentsList(creator.contents.length > 0 ? creator.contents : []);

        // console.log(contents);
        // check subscription
        if (isConnected && address) {
          // stateを参照だとラグがあるので引数で渡す
          checkSubscription(creator.price);
          checkRecievedNotification();
        }
      } catch (e) {
        console.log("Error getting cached document:", e);
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

  const checkSubscription = async (monthlyPrice: number) => {
    if (chain?.id != paymentToken.chainId) {
      alert("Please switch to Mumbai.");
      return;
    }

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
      sender: address || "",
      receiver: walletaddress,
      providerOrSigner: signer,
    });

    console.log(res.flowRate);
    console.log(calculateFlowRate(subscriptionPrice));

    if (res.flowRate >= calculateFlowRate(monthlyPrice)) {
      setIsSubscribed(true);
    } else {
      setIsSubscribed(false);
    }
  };
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
  };

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
        receiver: walletaddress,
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
  };

  const setJwt = async (playbackId: string, index: number) => {
    const body: CreateSignedPlaybackBody = {
      // playbackId: playbackId ,
      playbackId: playbackId,
      // we pass along a "secret key" to demonstrate how gating can work
      secret: "supersecretkey",
      address: address?.toString() || "",
    };

    // we make a request to the Next.JS API route shown above
    const response = await fetch("/api/create-signed-jwt", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const res = await response.json();
    let newContentsList = contentsList;
    newContentsList[index].jwt = res.token;
    setContentsList(newContentsList);
    setJwtToken(res.token);
    setJwtMap((jwtMap: any) => ({ ...jwtMap, [index]: res.token }));
    console.log(jwtMap);

    console.log(newContentsList);
    // return response.json() as Promise<CreateSignedPlaybackResponse | ApiError>;
  };

  const checkRecievedNotification = async () => {
    const docRef = doc(firestore, "creator", walletaddress.toLowerCase());
    const docSnap = await getDoc(docRef);

    let addressList = docSnap.data()?.noticeAddresses;
    if (addressList == undefined) {
      return;
    }
    if (addressList.includes(address?.toLowerCase())) {
      setIsRecievedNotification(true);
    }
  };

  const receiveNotification = async () => {
    const provider = new ethers.providers.Web3Provider(
      (window as any).ethereum
    );
    await provider.send("eth_requestAccounts", []);

    const signer = provider.getSigner();

    await PushAPI.channels.subscribe({
      signer: signer,
      channelAddress: `eip155:80001:0x9bFB274fd7af15127382DcA012bE1af2C0F4d713`, // channel address in CAIP
      userAddress: `eip155:80001:${address}`, // user address in CAIP
      onSuccess: () => {
        console.log("opt in success");
      },
      onError: () => {
        console.error("opt in error");
      },
      // env: "staging",
      env: ENV.STAGING,
    });
    const docRef = doc(firestore, "creator", walletaddress.toLowerCase());
    const docSnap = await getDoc(docRef);

    let addressList = docSnap.data()?.noticeAddresses;
    console.log(addressList);
    if (addressList == undefined) {
      addressList = [];
    }
    addressList.push(address?.toLowerCase() || "");
    await updateDoc(docRef, { noticeAddresses: addressList });
    setIsRecievedNotification(true);
  };

  const stopNotification = async () => {
    const docRef = doc(firestore, "creator", walletaddress.toLowerCase());
    const docSnap = await getDoc(docRef);

    let addressList = docSnap.data()?.noticeAddresses;
    console.log(addressList);
    console.log(addressList[0]);

    console.log(typeof addressList);
    const index = addressList.indexOf(address?.toLowerCase());
    addressList.splice(index, 1);
    await updateDoc(docRef, { addressList: addressList });
    setIsRecievedNotification(false);
  };

  // const { mutate: createJwt, data: createdJwt } = useMutation({
  //   mutationFn: async () => {
  //     const body: CreateSignedPlaybackBody = {
  //       // playbackId: playbackId ,
  //       playbackId: "",
  //       // we pass along a "secret key" to demonstrate how gating can work
  //       secret: "supersecretkey",
  //     };

  //     // we make a request to the Next.JS API route shown above
  //     const response = await fetch("/api/create-signed-jwt", {
  //       method: "POST",
  //       headers: {
  //         "Content-Type": "application/json",
  //       },
  //       body: JSON.stringify(body),
  //     });

  //     return response.json() as Promise<
  //       CreateSignedPlaybackResponse | ApiError
  //     >;
  //   },
  // });

  const Subscribe = () => {
    return (
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
    );
  };

  const Unsubscribe = () => {
    return (
      <Card variant={"elevated"} align="center">
        <CardBody>
          <VStack>
            <Text fontSize={"lg"} pt={4} pb={2}>
              Stop Support
            </Text>

            <Heading size={"lg"}>
              {`${subscriptionPrice} ${paymentToken.symbol}`} / month
            </Heading>
            <Text fontSize={"sm"} textColor={"red"}>
              ※You will not be able to see subscriber-only content.
            </Text>

            <Box py={4}>
              <Button colorScheme="red" variant="outline" onClick={unsubscribe}>
                Stop
              </Button>
            </Box>
          </VStack>
        </CardBody>
      </Card>
    );
  };

  const PublicVideo = (content: any) => {
    return (
      <>
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
                title={content?.title}
                playbackId={content?.playbackId}
                // autoPlay
                // muted
              />
              <Text fontWeight={600} color={"gray.500"} size="sm" py={2}>
                {content.description}
              </Text>
            </Stack>
          </CardBody>
        </Card>
      </>
    );
  };

  const PrivateVideo = (content: any) => {
    return (
      <>
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
              {isSubscribed && (
                <>
                  {/* {contentsList[content.index].jwt && ( */}

                  {jwtMap[content.index] && (
                    <Player
                      title={content?.title}
                      playbackId={content?.playbackId}
                      // jwt={
                      //   // (createdJwt as CreateSignedPlaybackResponse)?.token
                      //   content.jwt
                      // }

                      jwt={jwtMap[content.index]}
                    />
                  )}
                  {!jwtMap[content.index] && (
                    <Button
                      onClick={() => setJwt(content.playbackId, content.index)}
                    >
                      Check if you have the right to view
                    </Button>
                  )}
                  <Box>
                    {/* {contentsList[content.index].jwt} {content.index} */}
                  </Box>
                </>
              )}

              <Text fontWeight={600} color={"gray.500"} size="sm" py={2}>
                {content.description}
              </Text>
            </Stack>
          </CardBody>
        </Card>
      </>
    );
  };
  return (
    <>
      <Box pt={4} px={60}>
        <HStack>
          <Avatar src={pfp} size={"2xl"}></Avatar>
          <Stack pl={4}>
            <Text fontSize={"2xl"}>{name}</Text>
            <Text>{description}</Text>
          </Stack>
          <Spacer />
          {isReceiveNotification && (
            <Button
              colorScheme="orange"
              variant={"outline"}
              onClick={stopNotification}
            >
              Stop Notifications
            </Button>
          )}
          {!isReceiveNotification && (
            <Button
              colorScheme="orange"
              variant={"outline"}
              onClick={receiveNotification}
            >
              Receive Notifications
            </Button>
          )}
        </HStack>
        <Box pt={12}>
          {subscriptionPrice > 0 && !isSubscribed && <Subscribe />}
        </Box>
        <Box>
          <VStack pt={12} pb={8}>
            <Heading w="100%" fontWeight="normal" mb="2%" size="lg">
              Contents
            </Heading>
            <Box>
              {contentsList.map((content, index) => {
                return (
                  <Box key={content.playbackId} py={4}>
                    {!content.onlySubscriber && (
                      <PublicVideo
                        name={content.title}
                        description={content.description}
                        playbackId={content.playbackId}
                      />
                    )}
                    {content.onlySubscriber && (
                      <PrivateVideo
                        name={content.title}
                        description={content.description}
                        playbackId={content.playbackId}
                        // jwt={content.jwt}
                        index={index}
                      />
                    )}
                    {/* <Box>{jwtMap[index]}</Box> */}
                  </Box>
                );
              })}
            </Box>
          </VStack>
          {subscriptionPrice > 0 && isSubscribed && <Unsubscribe />}
        </Box>
      </Box>
    </>
  );
}

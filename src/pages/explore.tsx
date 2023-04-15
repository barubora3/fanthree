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
  Spacer,
  Flex,
} from "@chakra-ui/react";
import { firestore, collection, getDocs } from "../lib/firebase";
import NextLink from "next/link";

import { useAccount } from "wagmi";
import { useRouter } from "next/router";
import paymentToken from "../config/paymentToken.json";
export default function Explore() {
  const toast = useToast();
  const { address, isConnected } = useAccount();

  const [name, setName] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [pfp, setPfp] = useState<string>("");
  const [subscriptionPrice, setSubscriptionPrice] = useState<number>(0);
  const [membershipNFTAddress, setMembershipNFTAddress] = useState<string>("");

  const [isSubscribed, setIsSubscribed] = useState<boolean>(false);

  const [creatorList, setCreatorList] = useState<any[]>([]);
  useEffect(() => {
    const initialize = async () => {
      setCreatorList([]);
      const creatorRef = collection(firestore, "creator");
      //   const snapshot = await g;

      const querySnapshot = await getDocs(collection(firestore, "creator"));
      let list: any[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        list.push({
          address: doc.id,
          name: data.name,
          description: data.description,
          pfp: data.pfp,
          price: data.price,
          contractAddress: data.contractAddress,
        });
      });
      console.log(creatorList);
      setCreatorList(list);
    };
    initialize();
  }, []);

  const CreatorCard = (props: any) => {
    return (
      <Center py={4}>
        <Stack
          borderWidth="1px"
          borderRadius="lg"
          w={{ sm: "100%", md: "80%" }}
          height={"8rem"}
          direction={{ base: "column", md: "row" }}
          // bg={useColorModeValue('white', 'gray.900')}
          boxShadow={"2xl"}
          padding={4}
        >
          <Flex pl={6}>
            <Avatar size={"xl"} src={props.pfp} />
          </Flex>
          <Stack
            flexDirection="column"
            justifyContent="center"
            alignItems="start"
            pt={2}
            pl={4}
          >
            <Heading fontSize={"2xl"} fontFamily={"body"}>
              {props.name}
            </Heading>
            <Text fontWeight={600} color={"gray.500"} size="sm" mb={4} pl={1}>
              {props.description}
            </Text>
          </Stack>
          <Spacer />
          <Stack
            flexDirection="column"
            justifyContent="center"
            alignItems="end"
            pt={2}
            pr={6}
          >
            <Heading fontSize={"2xl"} fontFamily={"body"}>
              {`${props.price} ${paymentToken.symbol}`}
            </Heading>
            <Text
              fontWeight={600}
              color={"gray.500"}
              fontSize={"sm"}
              mb={4}
              pl={1}
            >
              {props.address}
            </Text>
          </Stack>
        </Stack>
      </Center>
    );
  };

  return (
    <>
      <Box px={40} pt={10}>
        <Box suppressHydrationWarning={true}>
          <Box pt={4}>
            {creatorList.map((creator) => {
              return (
                <>
                  <NextLink
                    href={`/creator/profile/${creator.address}`}
                    style={{ textDecoration: "none" }}
                  >
                    <CreatorCard
                      name={creator.name}
                      description={creator.description}
                      pfp={creator.pfp}
                      price={creator.price}
                      address={creator.address}
                    />
                  </NextLink>
                </>
              );
            })}
          </Box>
        </Box>
      </Box>
    </>
  );
}

import { useCreateAsset } from "@livepeer/react";
import { useMemo, useState, useEffect } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";

import {
  firestore,
  doc,
  getDoc,
  setDoc,
  addDoc,
  collection,
  updateDoc,
  FieldValue,
} from "../../lib/firebase";
import {
  Box,
  Text,
  Input,
  VStack,
  Heading,
  Button,
  FormControl,
  FormLabel,
  HStack,
  Center,
  Select,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Progress,
  useToast,
} from "@chakra-ui/react";
import { useAccount } from "wagmi";

export default function Home() {
  const [video, setVideo] = useState<File | undefined>();
  //   const [videoUrl, setVideoUrl] = useState<string>();
  const toast = useToast();
  const { address, isConnected } = useAccount();

  const [title, setTitle] = useState<string>();
  const [description, setDescription] = useState<string>();
  const [onlySubscriber, setOnlySubscriber] = useState<boolean>(true);

  const [creatorName, setCreatorName] = useState<string>();

  const isReady = title && description && video ? true : false;
  const { isOpen, onOpen, onClose } = useDisclosure();

  const {
    mutate: createAsset,
    data: asset,
    status,
    progress,
    error,
  } = useCreateAsset(
    video
      ? onlySubscriber
        ? {
            sources: [
              {
                name: video.name,
                file: video,
                playbackPolicy: { type: "jwt" },
              },
            ] as const,
          }
        : {
            sources: [
              {
                name: video.name,
                file: video,
              },
            ] as const,
          }
      : null
  );

  const onChangeFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      console.log("changed");
      setVideo(files[0]);
    }
  };
  const videoUrl = useMemo(
    () => (video ? window.URL.createObjectURL(video) : ""),
    [video]
  );

  const progressFormatted = useMemo(
    () =>
      progress?.[0].phase === "failed"
        ? "Failed to process video."
        : progress?.[0].phase === "waiting"
        ? "Waiting"
        : progress?.[0].phase === "uploading"
        ? `Uploading: ${Math.round(progress?.[0]?.progress * 100)}%`
        : progress?.[0].phase === "processing"
        ? `Processing: ${Math.round(progress?.[0].progress * 100)}%`
        : null,
    [progress]
  );

  useEffect(() => {
    console.log(status, progress, asset);
    if (status == "success") {
      regist();
    }
  }, [progress?.[0].phase]);

  const notice = async (creatorName: string) => {
    const body: any = {
      creatorName: creatorName,
      // we pass along a "secret key" to demonstrate how gating can work
      title: title,
      address: address?.toString() || "",
    };
    const response = await fetch("/api/push", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    console.log(response);
  };
  const regist = async () => {
    if (!asset) return;
    const id = asset?.[0].id;
    const name = asset?.[0].name;
    const createdAt = asset?.[0].createdAt;
    const playbackUrl = asset?.[0].playbackUrl;
    const playbackId = asset?.[0].playbackId;

    if (!address) {
      toast({
        title: "Database Update Failed.",
        status: "error",
        duration: 3000,
        isClosable: true,
        position: "bottom-right",
      });
      return;
    }

    const docRef = doc(firestore, "creator", address.toLowerCase());
    const docSnap = await getDoc(docRef);
    // const data = docSnap.data();
    const creatorName = docSnap.data()?.name;
    console.log(docSnap.data());
    console.log(creatorName);

    let contentsList = docSnap.data()?.contents;
    if (contentsList == undefined) {
      contentsList = [];
    }
    contentsList.push({
      title,
      description,
      onlySubscriber,
      id,
      name,
      createdAt,
      playbackUrl,
      playbackId,
    });
    await updateDoc(docRef, { contents: contentsList });
    notice(creatorName);
    toast({
      title: "Upload Compleated.",
      status: "success",
      duration: 3000,
      isClosable: true,
      position: "bottom-right",
    });
    onClose();
  };

  return (
    <>
      <Box px={{ lg: 40 }} pt={10}>
        <Heading w="100%" textAlign={"center"} fontWeight="normal" mb="2%">
          Upload Video
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
          <Box pt={4} px={60}>
            <Box>
              <FormControl mt="2%" py={2}>
                <FormLabel fontWeight={"normal"}>Movie</FormLabel>
                {video && (
                  <Center pb={8}>
                    <video width="400" src={videoUrl} autoPlay loop></video>
                  </Center>
                )}
                <Input type="file" accept="video/mp4" onChange={onChangeFile} />
              </FormControl>
            </Box>
            <Box>
              <FormControl mt="2%" py={2}>
                <FormLabel fontWeight={"normal"}>Title</FormLabel>
                <Input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
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
                <FormLabel fontWeight={"normal"}>Visibility Setting</FormLabel>
                <Select
                  onChange={(e) =>
                    setOnlySubscriber(
                      e.target.value == "Only Subscriber" ? true : false
                    )
                  }
                >
                  <option value="Only Subscriber" defaultChecked>
                    Only subscriber
                  </option>
                  <option value="Anyone can see">Anyone can see</option>
                </Select>
              </FormControl>
            </Box>

            {/* {progressFormatted && <p>{progressFormatted}</p>} */}
            <Center pt={4}>
              <Button
                colorScheme="orange"
                onClick={() => {
                  onOpen();
                  createAsset?.();
                }}
                isDisabled={!isReady}
                isLoading={status === "loading"}
              >
                Upload
              </Button>
            </Center>
          </Box>
        )}
        {/* <Button onClick={onOpen}>Trigger modal</Button> */}
        {/* <Box>
          <Button onClick={notice} colorScheme="blue">
            Notice
          </Button>
        </Box> */}

        <Modal onClose={onClose} isOpen={isOpen} isCentered>
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>{status}</ModalHeader>
            <ModalBody>
              <Progress
                hasStripe
                value={Math.round(progress ? progress?.[0]?.progress * 100 : 0)}
              />
            </ModalBody>
            <ModalFooter>{progressFormatted}</ModalFooter>
          </ModalContent>
        </Modal>
      </Box>
    </>
  );
}

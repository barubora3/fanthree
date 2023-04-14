import { useCreateAsset } from "@livepeer/react";
import { useMemo, useState, useEffect } from "react";
import { firestore, doc, getDoc, setDoc } from "../../lib/firebase";
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
  const [tags, setTags] = useState<string>();
  const [onlySubscriber, setOnlySubscriber] = useState<boolean>(true);

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
      ? {
          sources: [{ name: video.name, file: video }] as const,
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

  const regist = async () => {
    if (!asset) return;
    const id = asset?.[0].id;
    const name = asset?.[0].name;
    const createdAt = asset?.[0].createdAt;
    const playbackUrl = asset?.[0].playbackUrl;

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
    await setDoc(doc(firestore, "contents", address), {
      title,
      description,
      id,
      name,
      createdAt,
      playbackUrl,
    });

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
      <Box px={40} pt={10}>
        <Heading w="100%" textAlign={"center"} fontWeight="normal" mb="2%">
          Upload Video
        </Heading>
        <Box pt={8} px={60}>
          {video && (
            <Center pb={8}>
              <video width="400" src={videoUrl} autoPlay loop></video>
            </Center>
          )}
          <Box>
            <Input type="file" accept="video/mp4" onChange={onChangeFile} />
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
          <Center>
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

        {/* <Button onClick={onOpen}>Trigger modal</Button> */}

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

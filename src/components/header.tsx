/* src/components/Header.tsx */
import { Box, Flex, Container, Heading } from "@chakra-ui/react";
import NextLink from "next/link";
import { FC } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";

export const Header: FC = () => {
  return (
    <Box px={4} bgColor="gray.100">
      <Container maxW="container.lg">
        <Flex
          as="header"
          py="4"
          justifyContent="space-between"
          alignItems="center"
        >
          <NextLink href="/" passHref>
            <Heading as="h1" fontSize="2xl" cursor="pointer">
              FanThree
            </Heading>
          </NextLink>
          <ConnectButton />
        </Flex>
      </Container>
    </Box>
  );
};

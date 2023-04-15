// use the signAccessJwt export from `livepeer` in Node.JS
import { signAccessJwt } from "livepeer/crypto";
import { NextApiRequest, NextApiResponse } from "next";
import { ethers } from "ethers";
export type CreateSignedPlaybackBody = {
  playbackId: string;
  secret: string;
  address: string;
  contractAddress: string;
  creatorAddress: string;
  subscriptionPrice: number;
};
import { Framework } from "@superfluid-finance/sdk-core";
import paymentToken from "../../config/paymentToken.json";
import calculateFlowRate from "../../lib/calculateFlowRate";
export type CreateSignedPlaybackResponse = {
  token: string;
};

interface ApiError {
  message: string;
}
const accessControlPrivateKey = process.env.ACCESS_CONTROL_PRIVATE_KEY;
const accessControlPublicKey =
  process.env.NEXT_PUBLIC_ACCESS_CONTROL_PUBLIC_KEY;

const handler = async (
  req: NextApiRequest,
  res: NextApiResponse<CreateSignedPlaybackResponse | ApiError>
) => {
  try {
    const method = req.method;

    if (method === "POST") {
      if (!accessControlPrivateKey || !accessControlPublicKey) {
        return res
          .status(500)
          .json({ message: "No private/public key configured." });
      }

      const {
        playbackId,
        secret,
        address,
        contractAddress,
        creatorAddress,
        subscriptionPrice,
      }: CreateSignedPlaybackBody = req.body;
      // ContractAddress: Should be referenced from DB, not request

      // add custom check
      // i want check if the address is the created Flow

      const provider = new ethers.providers.AlchemyProvider(
        paymentToken.chainId,
        process.env.NEXT_PUBLIC_ALCHEMY_ID
      );

      const sf = await Framework.create({
        chainId: paymentToken.chainId,
        provider,
      });

      const tokenx = await sf.loadSuperToken(paymentToken.symbol);

      let flow = await tokenx.getFlow({
        sender: address || "",
        receiver: creatorAddress,
        providerOrSigner: provider,
      });

      console.log(calculateFlowRate(subscriptionPrice));
      const monthlyPrice = calculateFlowRate(subscriptionPrice);

      // check if the flow is greater than the monthly price
      if (flow.flowRate <= calculateFlowRate(Number(monthlyPrice))) {
        // check if the address is the holder of the NFT
        const options = {
          method: "GET",
          headers: { accept: "application/json" },
        };

        const response = await fetch(
          "https://polygon-mumbai.g.alchemy.com/nft/v2/" +
            process.env.NEXT_PUBLIC_ALCHEMY_ID +
            "/isHolderOfCollection?wallet=" +
            address +
            "&contractAddress=" +
            contractAddress,
          options
        );
        console.log(response);
        const data = await response.json();

        if (!data.isHolderOfCollection) {
          return res.status(401).json({ message: "You have not NFT." });
        }
      }

      // check complete

      // we sign the JWT and return it to the user
      const token = await signAccessJwt({
        privateKey: accessControlPrivateKey,
        publicKey: accessControlPublicKey,
        issuer: "https://docs.livepeer.org",
        // playback ID to include in the JWT
        playbackId,
        // expire the JWT in 1 hour
        expiration: "1h",
        // custom metadata to include
        // custom: {
        //   userId: "user-id-1",
        // },
      });

      return res.status(200).json({
        token,
      });
    }

    res.setHeader("Allow", ["POST"]);
    return res.status(405).end(`Method ${method} Not Allowed`);
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ message: (err as Error)?.message ?? "Error" });
  }
};

export default handler;

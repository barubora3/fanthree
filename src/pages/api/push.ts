import * as PushAPI from "@pushprotocol/restapi";
import * as ethers from "ethers";
import { Chat, ENV } from "@pushprotocol/uiweb";
import type { NextApiRequest, NextApiResponse } from "next";

type Data = {
  status: string;
};

const handler = async (req: NextApiRequest, res: NextApiResponse<Data>) => {
  const method = req.method;

  if (method != "POST") {
    res.status(400).json({ status: "errors" });
  }

  const { creatorName, title, address }: any = req.body;

  const PK = process.env.PRIVATE_KEY; // channel private key
  const Pkey = `0x${PK}`;
  const _signer = new ethers.Wallet(Pkey);
  const channelAddress = "0x9bFB274fd7af15127382DcA012bE1af2C0F4d713";

  //   TODO get target addresses from the database and send only subscribers
  try {
    const apiResponse = await PushAPI.payloads.sendNotification({
      senderType: 0,
      signer: _signer,
      type: 1, // broadcast
      identityType: 2, // direct payload
      notification: {
        title: `[New!] ${title}`,
        body: `Upload by ${creatorName}}`,
      },
      payload: {
        title: `[New!] ${title}`,
        body: `Upload by ${creatorName}} `,
        cta: "",
        img: "",
      },
      channel: `eip155:80001:${channelAddress}`, // your channel address
      //   env: ENV.STAGING,
      //   env: "staging",
      env: ENV.STAGING,
    });
    console.log(apiResponse);
  } catch (err) {
    console.error("Error: ", err);
    res.status(400).json({ status: "errors" });
  }

  res.status(200).json({ status: "success" });
};

export default handler;

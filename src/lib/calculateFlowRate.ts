import { ethers } from "ethers";

export default function calculateFlowRate(amountInEther: number) {
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

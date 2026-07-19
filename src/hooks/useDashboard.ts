"use client";

import { useQuery } from "@tanstack/react-query";
import { useAccount } from "wagmi";
import { getDeposits, getPayoutRequests } from "@/app/actions/pool";

/** The connected wallet's treasury-pool deposit history. */
export function useDepositHistory() {
  const { address } = useAccount();
  return useQuery({
    queryKey: ["dashboard-deposits", address],
    enabled: !!address,
    queryFn: () => getDeposits(address as string),
  });
}

/** The connected wallet's payout request history (withdrawals + yield claims). */
export function usePayoutHistory() {
  const { address } = useAccount();
  return useQuery({
    queryKey: ["dashboard-payouts", address],
    enabled: !!address,
    queryFn: () => getPayoutRequests(address as string),
  });
}

"use client";

import { useQuery } from "@tanstack/react-query";
import { useAccount } from "wagmi";
import { getAllDeposits, getAllPayoutRequests } from "@/app/actions/pool";

/** The connected wallet's treasury deposit history, across every property. */
export function useDepositHistory() {
  const { address } = useAccount();
  return useQuery({
    queryKey: ["dashboard-deposits", address],
    enabled: !!address,
    queryFn: () => getAllDeposits(address as string),
  });
}

/** The connected wallet's payout request history, across every property. */
export function usePayoutHistory() {
  const { address } = useAccount();
  return useQuery({
    queryKey: ["dashboard-payouts", address],
    enabled: !!address,
    queryFn: () => getAllPayoutRequests(address as string),
  });
}

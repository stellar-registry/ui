import { type Contract, type ContractListResponse } from "./types";

const API_BASE =
  "https://1q735crigc.execute-api.us-east-2.amazonaws.com/prod/registry";

export async function getContracts(cursor?: string): Promise<Contract[]> {
  const url = new URL(`${API_BASE}/contracts`);
  if (cursor) url.searchParams.set("cursor", cursor);

  const res = await fetch(url.toString());
  if (!res.ok) {
    throw new Error(`Failed to fetch contracts: ${res.status} ${res.statusText}`);
  }

  const data: ContractListResponse = await res.json();
  return data.result;
}

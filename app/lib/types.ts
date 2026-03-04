export interface Contract {
  author: string; // Stellar G... address
  version: string;
  wasm_name: string;
  wasm_hash: string;
  // TODO — add when backend supports:
  // description?: string
  // source_url?: string
  // contract_id?: string   // deployed C... address
  // network?: "mainnet" | "testnet" | "futurenet"
  // deployed_at?: string   // ISO timestamp
  // license?: string
  // tags?: string[]
  // readme?: string
  // verified?: boolean
}

export interface ContractListResponse {
  result: Contract[];
  next: string | null;
}

import { Buffer } from "buffer"
import { Address } from "@stellar/stellar-sdk"
import {
	AssembledTransaction,
	Client as ContractClient,
	ClientOptions as ContractClientOptions,
	MethodOptions,
	Result,
	Spec as ContractSpec,
} from "@stellar/stellar-sdk/contract"
import type {
	u32,
	i32,
	u64,
	i64,
	u128,
	i128,
	u256,
	i256,
	Option,
	Timepoint,
	Duration,
} from "@stellar/stellar-sdk/contract"
export * from "@stellar/stellar-sdk"
export * as contract from "@stellar/stellar-sdk/contract"
export * as rpc from "@stellar/stellar-sdk/rpc"

if (typeof window !== "undefined") {
	//@ts-ignore Buffer exists
	window.Buffer = window.Buffer || Buffer
}

export const Errors = {
	/**
	 * NoSuchWasmPublished
	 */
	1: { message: "NoSuchWasmPublished" },
	/**
	 * No such version of the contact has been published
	 */
	2: { message: "NoSuchVersion" },
	/**
	 * Wasm name already claimed
	 */
	3: { message: "WasmNameAlreadyTaken" },
	/**
	 * No such contract deployed
	 */
	4: { message: "NoSuchContractDeployed" },
	/**
	 * Contract already deployed
	 */
	5: { message: "AlreadyDeployed" },
	/**
	 * Failed to upgrade a contract
	 */
	6: { message: "UpgradeInvokeFailed" },
	/**
	 * Only Admin is allowed
	 */
	7: { message: "AdminOnly" },
	/**
	 * New version must be greater than the most recent version
	 */
	8: { message: "VersionMustBeGreaterThanCurrent" },
	/**
	 * Invalid name. Must be at most 64 characters and non-empty; ascii alphanumeric, '-', or '_'; start with a ascii alphabetic character; and not be a Rust keyword
	 */
	9: { message: "InvalidName" },
	/**
	 * Must be valid cargo version
	 */
	10: { message: "InvalidVersion" },
	/**
	 * Hash has aleady been published
	 */
	11: { message: "HashAlreadyPublished" },
	/**
	 * Root registry requires manager when deploying
	 */
	12: { message: "ManagerRequired" },
	/**
	 * No pending batch entries to process
	 */
	13: { message: "NoPendingBatch" },
	/**
	 * Caller is not the contract owner
	 */
	14: { message: "NotContractOwner" },
	/**
	 * Batch entry missing from temporary storage (likely expired)
	 */
	15: { message: "BatchEntryExpired" },
	/**
	 * Given "contract ID" appears to be a G-address, not a contract ID
	 */
	16: { message: "AccountAddressNotValid" },
	/**
	 * Given contract ID does not exist on this network
	 */
	17: { message: "ContractIdAddressDoesNotExist" },
	/**
	 * Invoking contract's function has failed
	 */
	18: { message: "ProxyInvocationFailed" },
	/**
	 * Contract to be invoked is compromised
	 */
	19: { message: "ProxyContractCompromised" },
	/**
	 * Subregistry contract call failed
	 */
	20: { message: "SubRegistryCrossContractCallFailed" },
	/**
	 * Subregistry must be a different contract than the current registry
	 */
	21: { message: "SubRegistryIsSelf" },
}

export interface Client {
	/**
	 * Construct and simulate a admin transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
	 */
	admin: (options?: MethodOptions) => Promise<AssembledTransaction<string>>

	/**
	 * Construct and simulate a deploy transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
	 * Deploys a new published contract returning the deployed contract's id
	 * and register the contract name.
	 * If no salt provided it will use the current sequence number.
	 * If no deployer is provided it uses the contract as the deployer
	 * Note: `deployer` is an advanced feature.
	 * If you need to resolve contract IDs deterministically without RPC calls,
	 * you can set a known Deployer account, which will be used as the `--salt`.
	 */
	deploy: (
		{
			wasm_name,
			version,
			contract_name,
			admin,
			init,
			deployer,
		}: {
			wasm_name: string
			version: Option<string>
			contract_name: string
			admin: string
			init: Option<Array<any>>
			deployer: Option<string>
		},
		options?: MethodOptions,
	) => Promise<AssembledTransaction<Result<string>>>

	/**
	 * Construct and simulate a manager transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
	 * The manager account which if set authorizes initial publishes and claiming a contract id
	 */
	manager: (
		options?: MethodOptions,
	) => Promise<AssembledTransaction<Option<string>>>

	/**
	 * Construct and simulate a publish transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
	 * Publish a binary. Contract uploads bytes ensuring hash is correct.
	 * If contract had been previously published only previous author can publish again
	 */
	publish: (
		{
			wasm_name,
			author,
			wasm,
			version,
		}: { wasm_name: string; author: string; wasm: Buffer; version: string },
		options?: MethodOptions,
	) => Promise<AssembledTransaction<Result<void>>>

	/**
	 * Construct and simulate a upgrade transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
	 * Upgrades the contract to a new hash.
	 * Admin Only.
	 */
	upgrade: (
		{ new_wasm_hash }: { new_wasm_hash: Buffer },
		options?: MethodOptions,
	) => Promise<AssembledTransaction<null>>

	/**
	 * Construct and simulate a set_admin transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
	 */
	set_admin: (
		{ new_admin }: { new_admin: string },
		options?: MethodOptions,
	) => Promise<AssembledTransaction<null>>

	/**
	 * Construct and simulate a dev_deploy transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
	 * Skips the publish step to deploy a contract directly, keeping the name
	 */
	dev_deploy: (
		{
			name,
			wasm,
			upgrade_fn,
		}: { name: string; wasm: Buffer; upgrade_fn: Option<string> },
		options?: MethodOptions,
	) => Promise<AssembledTransaction<Result<string>>>

	/**
	 * Construct and simulate a fetch_hash transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
	 * Fetch the hash of a Wasm binary from the registry
	 */
	fetch_hash: (
		{ wasm_name, version }: { wasm_name: string; version: Option<string> },
		options?: MethodOptions,
	) => Promise<AssembledTransaction<Result<Buffer>>>

	/**
	 * Construct and simulate a set_manager transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
	 * Admin can set the new manager
	 */
	set_manager: (
		{ new_manager }: { new_manager: string },
		options?: MethodOptions,
	) => Promise<AssembledTransaction<null>>

	/**
	 * Construct and simulate a publish_hash transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
	 * Publish a hash of a binary.
	 * If contract had been previously published only previous author can publish again
	 */
	publish_hash: (
		{
			wasm_name,
			author,
			wasm_hash,
			version,
		}: {
			wasm_name: string
			author: string
			wasm_hash: Buffer
			version: string
		},
		options?: MethodOptions,
	) => Promise<AssembledTransaction<Result<void>>>

	/**
	 * Construct and simulate a flag_contract transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
	 * Flag contract, marking contract as compromised or
	 * un-marking it as being compromised
	 */
	flag_contract: (
		{ contract_name, flagged }: { contract_name: string; flagged: boolean },
		options?: MethodOptions,
	) => Promise<AssembledTransaction<Result<void>>>

	/**
	 * Construct and simulate a process_batch transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
	 * Process up to `limit` pending batch entries, registering each contract.
	 * Callable by anyone. Returns the number of contracts processed.
	 * Call repeatedly to iterate through all entries.
	 */
	process_batch: (
		{ limit }: { limit: u32 },
		options?: MethodOptions,
	) => Promise<AssembledTransaction<Result<u32>>>

	/**
	 * Construct and simulate a batch_register transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
	 * Stage a batch of existing contracts for registration.
	 * Requires manager auth if manager is set, otherwise admin auth.
	 * Each entry is (`contract_name`, `contract_address`, `owner`).
	 * The entire batch is stored in a single write after validation.
	 */
	batch_register: (
		{ contracts }: { contracts: Array<readonly [string, string, string]> },
		options?: MethodOptions,
	) => Promise<AssembledTransaction<Result<void>>>

	/**
	 * Construct and simulate a deploy_unnamed transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
	 * Deploys a new published contract returning the deployed contract's id
	 * but does not register the contract name.
	 * Otherwise if no salt provided it will use a random one.
	 */
	deploy_unnamed: (
		{
			wasm_name,
			version,
			init,
			salt,
			deployer,
		}: {
			wasm_name: string
			version: Option<string>
			init: Option<Array<any>>
			salt: Buffer
			deployer: string
		},
		options?: MethodOptions,
	) => Promise<AssembledTransaction<Result<string>>>

	/**
	 * Construct and simulate a remove_manager transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
	 * Admin can remove manager
	 */
	remove_manager: (
		options?: MethodOptions,
	) => Promise<AssembledTransaction<null>>

	/**
	 * Construct and simulate a current_version transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
	 * Most recent version of the published Wasm binary
	 */
	current_version: (
		{ wasm_name }: { wasm_name: string },
		options?: MethodOptions,
	) => Promise<AssembledTransaction<Result<string>>>

	/**
	 * Construct and simulate a rename_contract transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
	 * Rename a registered contract.
	 * Requires current owner auth, or manager auth if manager is set.
	 */
	rename_contract: (
		{ old_name, new_name }: { old_name: string; new_name: string },
		options?: MethodOptions,
	) => Promise<AssembledTransaction<Result<void>>>

	/**
	 * Construct and simulate a upgrade_contract transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
	 * Upgrades a contract by calling the upgrade function.
	 * Default is 'upgrade' and expects that first arg is the corresponding wasm hash
	 */
	upgrade_contract: (
		{
			name,
			wasm_name,
			version,
			upgrade_fn,
		}: {
			name: string
			wasm_name: string
			version: Option<string>
			upgrade_fn: Option<string>
		},
		options?: MethodOptions,
	) => Promise<AssembledTransaction<Result<string>>>

	/**
	 * Construct and simulate a fetch_contract_id transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
	 * Look up the contract id of a deployed contract
	 */
	fetch_contract_id: (
		{ contract_name }: { contract_name: string },
		options?: MethodOptions,
	) => Promise<AssembledTransaction<Result<string>>>

	/**
	 * Construct and simulate a register_contract transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
	 * Register a name for an existing contract which wasn't deployed by the registry
	 */
	register_contract: (
		{
			contract_name,
			contract_address,
			owner,
		}: { contract_name: string; contract_address: string; owner: string },
		options?: MethodOptions,
	) => Promise<AssembledTransaction<Result<void>>>

	/**
	 * Construct and simulate a fetch_contract_owner transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
	 * Look up the owner of a deployed contract
	 */
	fetch_contract_owner: (
		{ contract_name }: { contract_name: string },
		options?: MethodOptions,
	) => Promise<AssembledTransaction<Result<string>>>

	/**
	 * Construct and simulate a xcc_hash_and_version transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
	 * Fetch the hash and version of a Wasm binary from the registry and bump TTL
	 * This is used for cross contract calls (xcc)
	 */
	xcc_hash_and_version: (
		{ wasm_name, version }: { wasm_name: string; version: Option<string> },
		options?: MethodOptions,
	) => Promise<AssembledTransaction<Result<readonly [string, Buffer]>>>

	/**
	 * Construct and simulate a proxy_invoke_contract transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
	 * Invokes contract with the given contract name, using given function name and arguments
	 */
	proxy_invoke_contract: (
		{
			contract_name,
			contract_fn,
			args,
		}: { contract_name: string; contract_fn: string; args: Array<any> },
		options?: MethodOptions,
	) => Promise<AssembledTransaction<Result<any>>>

	/**
	 * Construct and simulate a update_contract_owner transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
	 * Update the owner of a registered contract.
	 * Requires current owner auth, or manager auth if manager is set.
	 */
	update_contract_owner: (
		{ contract_name, new_owner }: { contract_name: string; new_owner: string },
		options?: MethodOptions,
	) => Promise<AssembledTransaction<Result<void>>>

	/**
	 * Construct and simulate a deploy_with_subregistry transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
	 * Deploys a new published contract returning the deployed contract's id
	 * and register the contract name.
	 * The subregistry passed is where the `wasm_name` is located.
	 * If no salt provided it will use the current sequence number.
	 * If no deployer is provided it uses the contract as the deployer
	 * Note: `deployer` is an advanced feature.
	 * If you need to resolve contract IDs deterministically without RPC calls,
	 * you can set a known Deployer account, which will be used as the `--salt`.
	 */
	deploy_with_subregistry: (
		{
			wasm_name,
			version,
			contract_name,
			admin,
			init,
			deployer,
			subregistry,
		}: {
			wasm_name: string
			version: Option<string>
			contract_name: string
			admin: string
			init: Option<Array<any>>
			deployer: Option<string>
			subregistry: string
		},
		options?: MethodOptions,
	) => Promise<AssembledTransaction<Result<string>>>

	/**
	 * Construct and simulate a update_contract_address transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
	 * Update the contract address of a registered contract.
	 * Requires current owner auth, or manager auth if manager is set.
	 */
	update_contract_address: (
		{
			contract_name,
			new_address,
		}: { contract_name: string; new_address: string },
		options?: MethodOptions,
	) => Promise<AssembledTransaction<Result<void>>>
}
export class Client extends ContractClient {
	static async deploy<T = Client>(
		/** Constructor/Initialization Args for the contract's `__constructor` method */
		{
			admin,
			manager,
			root,
		}: { admin: string; manager: Option<string>; root: Option<string> },
		/** Options for initializing a Client as well as for calling a method, with extras specific to deploying. */
		options: MethodOptions &
			Omit<ContractClientOptions, "contractId"> & {
				/** The hash of the Wasm blob, which must already be installed on-chain. */
				wasmHash: Buffer | string
				/** Salt used to generate the contract's ID. Passed through to {@link Operation.createCustomContract}. Default: random. */
				salt?: Buffer | Uint8Array
				/** The format used to decode `wasmHash`, if it's provided as a string. */
				format?: "hex" | "base64"
			},
	): Promise<AssembledTransaction<T>> {
		return ContractClient.deploy({ admin, manager, root }, options)
	}
	constructor(public readonly options: ContractClientOptions) {
		super(
			new ContractSpec([
				"AAAAAAAAAAAAAAAFYWRtaW4AAAAAAAAAAAAAAQAAABM=",
				"AAAAAAAAAZ5EZXBsb3lzIGEgbmV3IHB1Ymxpc2hlZCBjb250cmFjdCByZXR1cm5pbmcgdGhlIGRlcGxveWVkIGNvbnRyYWN0J3MgaWQKYW5kIHJlZ2lzdGVyIHRoZSBjb250cmFjdCBuYW1lLgpJZiBubyBzYWx0IHByb3ZpZGVkIGl0IHdpbGwgdXNlIHRoZSBjdXJyZW50IHNlcXVlbmNlIG51bWJlci4KSWYgbm8gZGVwbG95ZXIgaXMgcHJvdmlkZWQgaXQgdXNlcyB0aGUgY29udHJhY3QgYXMgdGhlIGRlcGxveWVyCk5vdGU6IGBkZXBsb3llcmAgaXMgYW4gYWR2YW5jZWQgZmVhdHVyZS4KSWYgeW91IG5lZWQgdG8gcmVzb2x2ZSBjb250cmFjdCBJRHMgZGV0ZXJtaW5pc3RpY2FsbHkgd2l0aG91dCBSUEMgY2FsbHMsCnlvdSBjYW4gc2V0IGEga25vd24gRGVwbG95ZXIgYWNjb3VudCwgd2hpY2ggd2lsbCBiZSB1c2VkIGFzIHRoZSBgLS1zYWx0YC4AAAAAAAZkZXBsb3kAAAAAAAYAAAAAAAAACXdhc21fbmFtZQAAAAAAABAAAAAAAAAAB3ZlcnNpb24AAAAD6AAAABAAAAAAAAAADWNvbnRyYWN0X25hbWUAAAAAAAAQAAAAAAAAAAVhZG1pbgAAAAAAABMAAAAAAAAABGluaXQAAAPoAAAD6gAAAAAAAAAAAAAACGRlcGxveWVyAAAD6AAAABMAAAABAAAD6QAAABMAAAAD",
				"AAAAAAAAAFhUaGUgbWFuYWdlciBhY2NvdW50IHdoaWNoIGlmIHNldCBhdXRob3JpemVzIGluaXRpYWwgcHVibGlzaGVzIGFuZCBjbGFpbWluZyBhIGNvbnRyYWN0IGlkAAAAB21hbmFnZXIAAAAAAAAAAAEAAAPoAAAAEw==",
				"AAAAAAAAAJNQdWJsaXNoIGEgYmluYXJ5LiBDb250cmFjdCB1cGxvYWRzIGJ5dGVzIGVuc3VyaW5nIGhhc2ggaXMgY29ycmVjdC4KSWYgY29udHJhY3QgaGFkIGJlZW4gcHJldmlvdXNseSBwdWJsaXNoZWQgb25seSBwcmV2aW91cyBhdXRob3IgY2FuIHB1Ymxpc2ggYWdhaW4AAAAAB3B1Ymxpc2gAAAAABAAAAAAAAAAJd2FzbV9uYW1lAAAAAAAAEAAAAAAAAAAGYXV0aG9yAAAAAAATAAAAAAAAAAR3YXNtAAAADgAAAAAAAAAHdmVyc2lvbgAAAAAQAAAAAQAAA+kAAAACAAAAAw==",
				"AAAAAAAAADBVcGdyYWRlcyB0aGUgY29udHJhY3QgdG8gYSBuZXcgaGFzaC4KQWRtaW4gT25seS4AAAAHdXBncmFkZQAAAAABAAAAAAAAAA1uZXdfd2FzbV9oYXNoAAAAAAAD7gAAACAAAAAA",
				"AAAAAAAAAAAAAAAJc2V0X2FkbWluAAAAAAAAAQAAAAAAAAAJbmV3X2FkbWluAAAAAAAAEwAAAAA=",
				"AAAAAAAAAEZTa2lwcyB0aGUgcHVibGlzaCBzdGVwIHRvIGRlcGxveSBhIGNvbnRyYWN0IGRpcmVjdGx5LCBrZWVwaW5nIHRoZSBuYW1lAAAAAAAKZGV2X2RlcGxveQAAAAAAAwAAAAAAAAAEbmFtZQAAABAAAAAAAAAABHdhc20AAAAOAAAAAAAAAAp1cGdyYWRlX2ZuAAAAAAPoAAAAEQAAAAEAAAPpAAAAEwAAAAM=",
				"AAAAAAAAADFGZXRjaCB0aGUgaGFzaCBvZiBhIFdhc20gYmluYXJ5IGZyb20gdGhlIHJlZ2lzdHJ5AAAAAAAACmZldGNoX2hhc2gAAAAAAAIAAAAAAAAACXdhc21fbmFtZQAAAAAAABAAAAAAAAAAB3ZlcnNpb24AAAAD6AAAABAAAAABAAAD6QAAA+4AAAAgAAAAAw==",
				"AAAAAAAAAB1BZG1pbiBjYW4gc2V0IHRoZSBuZXcgbWFuYWdlcgAAAAAAAAtzZXRfbWFuYWdlcgAAAAABAAAAAAAAAAtuZXdfbWFuYWdlcgAAAAATAAAAAA==",
				"AAAAAAAAAGxQdWJsaXNoIGEgaGFzaCBvZiBhIGJpbmFyeS4KSWYgY29udHJhY3QgaGFkIGJlZW4gcHJldmlvdXNseSBwdWJsaXNoZWQgb25seSBwcmV2aW91cyBhdXRob3IgY2FuIHB1Ymxpc2ggYWdhaW4AAAAMcHVibGlzaF9oYXNoAAAABAAAAAAAAAAJd2FzbV9uYW1lAAAAAAAAEAAAAAAAAAAGYXV0aG9yAAAAAAATAAAAAAAAAAl3YXNtX2hhc2gAAAAAAAPuAAAAIAAAAAAAAAAHdmVyc2lvbgAAAAAQAAAAAQAAA+kAAAACAAAAAw==",
				"AAAAAAAAAootIGBhZG1pbmA6IGFjY291bnQgd2hpY2ggd2lsbDogdXBncmFkZSB0aGlzIFJlZ2lzdHJ5IGl0c2VsZjsgYWRkLCBzZXQsIG9yIHJlbW92ZSBgbWFuYWdlcmAKLSBgbWFuYWdlcmA6IG9wdGlvbmFsLiBJZiBzZXQsIG1ha2VzIHRoaXMgYSAqbWFuYWdlZCogcmVnaXN0cnksIG1lYW5pbmcgYHB1Ymxpc2hgLCBgcmVnaXN0ZXJfY29udHJhY3RgLCAmIGBkZXBsb3lgIG11c3QgYmUgYXBwcm92ZWQgYnkgdGhlIG1hbmFnZXIgYmVmb3JlIGNhbGxlcidzIGFjY291bnQgaXMgY29uc2lkZXJlZCB0cnVzdGVkIGZvciB0aGF0IGNvbnRyYWN0L3dhc20gbmFtZS4KLSBgcm9vdGA6IGlmIE5vbmUsIHRoaXMgcmVnaXN0cnkgaXMgdGhlIHJvb3QgcmVnaXN0cnkg4oCUIGl0IGhhcyBubyBuYW1lc3BhY2UsIG90aGVyIHJlZ2lzdHJpZXMgKGxpa2UgdGhlIGB1bnZlcmlmaWVkYCBvbmUpIGFyZSByZWdpc3RlcmVkIGluIGl0LCBhbmQgdGhlIGNvbnN0cnVjdG9yIGF1dG8tZGVwbG95cyB0aGUgYHVudmVyaWZpZWRgIHJlZ2lzdHJ5LiBJZiBTb21lLCB0aGlzIGlzIGEgc3VicmVnaXN0cnkgdGhhdCBkZWZlcnMgdG8gdGhlIGdpdmVuIHJvb3QgZm9yIHJlc29sdmluZyBzaWJsaW5nIHN1YnJlZ2lzdHJ5IG5hbWVzIGR1cmluZyBjcm9zcy1yZWdpc3RyeSBkZXBsb3lzLgAAAAAADV9fY29uc3RydWN0b3IAAAAAAAADAAAAAAAAAAVhZG1pbgAAAAAAABMAAAAAAAAAB21hbmFnZXIAAAAD6AAAABMAAAAAAAAABHJvb3QAAAPoAAAAEwAAAAEAAAPpAAAAAgAAAAM=",
				"AAAAAAAAAFRGbGFnIGNvbnRyYWN0LCBtYXJraW5nIGNvbnRyYWN0IGFzIGNvbXByb21pc2VkIG9yCnVuLW1hcmtpbmcgaXQgYXMgYmVpbmcgY29tcHJvbWlzZWQAAAANZmxhZ19jb250cmFjdAAAAAAAAAIAAAAAAAAADWNvbnRyYWN0X25hbWUAAAAAAAAQAAAAAAAAAAdmbGFnZ2VkAAAAAAEAAAABAAAD6QAAAAIAAAAD",
				"AAAAAAAAALZQcm9jZXNzIHVwIHRvIGBsaW1pdGAgcGVuZGluZyBiYXRjaCBlbnRyaWVzLCByZWdpc3RlcmluZyBlYWNoIGNvbnRyYWN0LgpDYWxsYWJsZSBieSBhbnlvbmUuIFJldHVybnMgdGhlIG51bWJlciBvZiBjb250cmFjdHMgcHJvY2Vzc2VkLgpDYWxsIHJlcGVhdGVkbHkgdG8gaXRlcmF0ZSB0aHJvdWdoIGFsbCBlbnRyaWVzLgAAAAAADXByb2Nlc3NfYmF0Y2gAAAAAAAABAAAAAAAAAAVsaW1pdAAAAAAAAAQAAAABAAAD6QAAAAQAAAAD",
				"AAAAAAAAAPFTdGFnZSBhIGJhdGNoIG9mIGV4aXN0aW5nIGNvbnRyYWN0cyBmb3IgcmVnaXN0cmF0aW9uLgpSZXF1aXJlcyBtYW5hZ2VyIGF1dGggaWYgbWFuYWdlciBpcyBzZXQsIG90aGVyd2lzZSBhZG1pbiBhdXRoLgpFYWNoIGVudHJ5IGlzIChgY29udHJhY3RfbmFtZWAsIGBjb250cmFjdF9hZGRyZXNzYCwgYG93bmVyYCkuClRoZSBlbnRpcmUgYmF0Y2ggaXMgc3RvcmVkIGluIGEgc2luZ2xlIHdyaXRlIGFmdGVyIHZhbGlkYXRpb24uAAAAAAAADmJhdGNoX3JlZ2lzdGVyAAAAAAABAAAAAAAAAAljb250cmFjdHMAAAAAAAPqAAAD7QAAAAMAAAAQAAAAEwAAABMAAAABAAAD6QAAAAIAAAAD",
				"AAAAAAAAAKZEZXBsb3lzIGEgbmV3IHB1Ymxpc2hlZCBjb250cmFjdCByZXR1cm5pbmcgdGhlIGRlcGxveWVkIGNvbnRyYWN0J3MgaWQKYnV0IGRvZXMgbm90IHJlZ2lzdGVyIHRoZSBjb250cmFjdCBuYW1lLgpPdGhlcndpc2UgaWYgbm8gc2FsdCBwcm92aWRlZCBpdCB3aWxsIHVzZSBhIHJhbmRvbSBvbmUuAAAAAAAOZGVwbG95X3VubmFtZWQAAAAAAAUAAAAAAAAACXdhc21fbmFtZQAAAAAAABAAAAAAAAAAB3ZlcnNpb24AAAAD6AAAABAAAAAAAAAABGluaXQAAAPoAAAD6gAAAAAAAAAAAAAABHNhbHQAAAPuAAAAIAAAAAAAAAAIZGVwbG95ZXIAAAATAAAAAQAAA+kAAAATAAAAAw==",
				"AAAAAAAAABhBZG1pbiBjYW4gcmVtb3ZlIG1hbmFnZXIAAAAOcmVtb3ZlX21hbmFnZXIAAAAAAAAAAAAA",
				"AAAAAAAAADBNb3N0IHJlY2VudCB2ZXJzaW9uIG9mIHRoZSBwdWJsaXNoZWQgV2FzbSBiaW5hcnkAAAAPY3VycmVudF92ZXJzaW9uAAAAAAEAAAAAAAAACXdhc21fbmFtZQAAAAAAABAAAAABAAAD6QAAABAAAAAD",
				"AAAAAAAAAF1SZW5hbWUgYSByZWdpc3RlcmVkIGNvbnRyYWN0LgpSZXF1aXJlcyBjdXJyZW50IG93bmVyIGF1dGgsIG9yIG1hbmFnZXIgYXV0aCBpZiBtYW5hZ2VyIGlzIHNldC4AAAAAAAAPcmVuYW1lX2NvbnRyYWN0AAAAAAIAAAAAAAAACG9sZF9uYW1lAAAAEAAAAAAAAAAIbmV3X25hbWUAAAAQAAAAAQAAA+kAAAACAAAAAw==",
				"AAAAAAAAAINVcGdyYWRlcyBhIGNvbnRyYWN0IGJ5IGNhbGxpbmcgdGhlIHVwZ3JhZGUgZnVuY3Rpb24uCkRlZmF1bHQgaXMgJ3VwZ3JhZGUnIGFuZCBleHBlY3RzIHRoYXQgZmlyc3QgYXJnIGlzIHRoZSBjb3JyZXNwb25kaW5nIHdhc20gaGFzaAAAAAAQdXBncmFkZV9jb250cmFjdAAAAAQAAAAAAAAABG5hbWUAAAAQAAAAAAAAAAl3YXNtX25hbWUAAAAAAAAQAAAAAAAAAAd2ZXJzaW9uAAAAA+gAAAAQAAAAAAAAAAp1cGdyYWRlX2ZuAAAAAAPoAAAAEQAAAAEAAAPpAAAAEwAAAAM=",
				"AAAAAAAAAC5Mb29rIHVwIHRoZSBjb250cmFjdCBpZCBvZiBhIGRlcGxveWVkIGNvbnRyYWN0AAAAAAARZmV0Y2hfY29udHJhY3RfaWQAAAAAAAABAAAAAAAAAA1jb250cmFjdF9uYW1lAAAAAAAAEAAAAAEAAAPpAAAAEwAAAAM=",
				"AAAAAAAAAE5SZWdpc3RlciBhIG5hbWUgZm9yIGFuIGV4aXN0aW5nIGNvbnRyYWN0IHdoaWNoIHdhc24ndCBkZXBsb3llZCBieSB0aGUgcmVnaXN0cnkAAAAAABFyZWdpc3Rlcl9jb250cmFjdAAAAAAAAAMAAAAAAAAADWNvbnRyYWN0X25hbWUAAAAAAAAQAAAAAAAAABBjb250cmFjdF9hZGRyZXNzAAAAEwAAAAAAAAAFb3duZXIAAAAAAAATAAAAAQAAA+kAAAACAAAAAw==",
				"AAAAAAAAAChMb29rIHVwIHRoZSBvd25lciBvZiBhIGRlcGxveWVkIGNvbnRyYWN0AAAAFGZldGNoX2NvbnRyYWN0X293bmVyAAAAAQAAAAAAAAANY29udHJhY3RfbmFtZQAAAAAAABAAAAABAAAD6QAAABMAAAAD",
				"AAAAAAAAAHZGZXRjaCB0aGUgaGFzaCBhbmQgdmVyc2lvbiBvZiBhIFdhc20gYmluYXJ5IGZyb20gdGhlIHJlZ2lzdHJ5IGFuZCBidW1wIFRUTApUaGlzIGlzIHVzZWQgZm9yIGNyb3NzIGNvbnRyYWN0IGNhbGxzICh4Y2MpAAAAAAAUeGNjX2hhc2hfYW5kX3ZlcnNpb24AAAACAAAAAAAAAAl3YXNtX25hbWUAAAAAAAAQAAAAAAAAAAd2ZXJzaW9uAAAAA+gAAAAQAAAAAQAAA+kAAAPtAAAAAgAAABAAAAPuAAAAIAAAAAM=",
				"AAAAAAAAAFZJbnZva2VzIGNvbnRyYWN0IHdpdGggdGhlIGdpdmVuIGNvbnRyYWN0IG5hbWUsIHVzaW5nIGdpdmVuIGZ1bmN0aW9uIG5hbWUgYW5kIGFyZ3VtZW50cwAAAAAAFXByb3h5X2ludm9rZV9jb250cmFjdAAAAAAAAAMAAAAAAAAADWNvbnRyYWN0X25hbWUAAAAAAAAQAAAAAAAAAAtjb250cmFjdF9mbgAAAAARAAAAAAAAAARhcmdzAAAD6gAAAAAAAAABAAAD6QAAAAAAAAAD",
				"AAAAAAAAAGpVcGRhdGUgdGhlIG93bmVyIG9mIGEgcmVnaXN0ZXJlZCBjb250cmFjdC4KUmVxdWlyZXMgY3VycmVudCBvd25lciBhdXRoLCBvciBtYW5hZ2VyIGF1dGggaWYgbWFuYWdlciBpcyBzZXQuAAAAAAAVdXBkYXRlX2NvbnRyYWN0X293bmVyAAAAAAAAAgAAAAAAAAANY29udHJhY3RfbmFtZQAAAAAAABAAAAAAAAAACW5ld19vd25lcgAAAAAAABMAAAABAAAD6QAAAAIAAAAD",
				"AAAAAAAAAdpEZXBsb3lzIGEgbmV3IHB1Ymxpc2hlZCBjb250cmFjdCByZXR1cm5pbmcgdGhlIGRlcGxveWVkIGNvbnRyYWN0J3MgaWQKYW5kIHJlZ2lzdGVyIHRoZSBjb250cmFjdCBuYW1lLgpUaGUgc3VicmVnaXN0cnkgcGFzc2VkIGlzIHdoZXJlIHRoZSBgd2FzbV9uYW1lYCBpcyBsb2NhdGVkLgpJZiBubyBzYWx0IHByb3ZpZGVkIGl0IHdpbGwgdXNlIHRoZSBjdXJyZW50IHNlcXVlbmNlIG51bWJlci4KSWYgbm8gZGVwbG95ZXIgaXMgcHJvdmlkZWQgaXQgdXNlcyB0aGUgY29udHJhY3QgYXMgdGhlIGRlcGxveWVyCk5vdGU6IGBkZXBsb3llcmAgaXMgYW4gYWR2YW5jZWQgZmVhdHVyZS4KSWYgeW91IG5lZWQgdG8gcmVzb2x2ZSBjb250cmFjdCBJRHMgZGV0ZXJtaW5pc3RpY2FsbHkgd2l0aG91dCBSUEMgY2FsbHMsCnlvdSBjYW4gc2V0IGEga25vd24gRGVwbG95ZXIgYWNjb3VudCwgd2hpY2ggd2lsbCBiZSB1c2VkIGFzIHRoZSBgLS1zYWx0YC4AAAAAABdkZXBsb3lfd2l0aF9zdWJyZWdpc3RyeQAAAAAHAAAAAAAAAAl3YXNtX25hbWUAAAAAAAAQAAAAAAAAAAd2ZXJzaW9uAAAAA+gAAAAQAAAAAAAAAA1jb250cmFjdF9uYW1lAAAAAAAAEAAAAAAAAAAFYWRtaW4AAAAAAAATAAAAAAAAAARpbml0AAAD6AAAA+oAAAAAAAAAAAAAAAhkZXBsb3llcgAAA+gAAAATAAAAAAAAAAtzdWJyZWdpc3RyeQAAAAAQAAAAAQAAA+kAAAATAAAAAw==",
				"AAAAAAAAAHVVcGRhdGUgdGhlIGNvbnRyYWN0IGFkZHJlc3Mgb2YgYSByZWdpc3RlcmVkIGNvbnRyYWN0LgpSZXF1aXJlcyBjdXJyZW50IG93bmVyIGF1dGgsIG9yIG1hbmFnZXIgYXV0aCBpZiBtYW5hZ2VyIGlzIHNldC4AAAAAAAAXdXBkYXRlX2NvbnRyYWN0X2FkZHJlc3MAAAAAAgAAAAAAAAANY29udHJhY3RfbmFtZQAAAAAAABAAAAAAAAAAC25ld19hZGRyZXNzAAAAABMAAAABAAAD6QAAAAIAAAAD",
				"AAAABAAAAAAAAAAAAAAABUVycm9yAAAAAAAAFQAAABNOb1N1Y2hXYXNtUHVibGlzaGVkAAAAABNOb1N1Y2hXYXNtUHVibGlzaGVkAAAAAAEAAAAxTm8gc3VjaCB2ZXJzaW9uIG9mIHRoZSBjb250YWN0IGhhcyBiZWVuIHB1Ymxpc2hlZAAAAAAAAA1Ob1N1Y2hWZXJzaW9uAAAAAAAAAgAAABlXYXNtIG5hbWUgYWxyZWFkeSBjbGFpbWVkAAAAAAAAFFdhc21OYW1lQWxyZWFkeVRha2VuAAAAAwAAABlObyBzdWNoIGNvbnRyYWN0IGRlcGxveWVkAAAAAAAAFk5vU3VjaENvbnRyYWN0RGVwbG95ZWQAAAAAAAQAAAAZQ29udHJhY3QgYWxyZWFkeSBkZXBsb3llZAAAAAAAAA9BbHJlYWR5RGVwbG95ZWQAAAAABQAAABxGYWlsZWQgdG8gdXBncmFkZSBhIGNvbnRyYWN0AAAAE1VwZ3JhZGVJbnZva2VGYWlsZWQAAAAABgAAABVPbmx5IEFkbWluIGlzIGFsbG93ZWQAAAAAAAAJQWRtaW5Pbmx5AAAAAAAABwAAADhOZXcgdmVyc2lvbiBtdXN0IGJlIGdyZWF0ZXIgdGhhbiB0aGUgbW9zdCByZWNlbnQgdmVyc2lvbgAAAB9WZXJzaW9uTXVzdEJlR3JlYXRlclRoYW5DdXJyZW50AAAAAAgAAACeSW52YWxpZCBuYW1lLiBNdXN0IGJlIGF0IG1vc3QgNjQgY2hhcmFjdGVycyBhbmQgbm9uLWVtcHR5OyBhc2NpaSBhbHBoYW51bWVyaWMsICctJywgb3IgJ18nOyBzdGFydCB3aXRoIGEgYXNjaWkgYWxwaGFiZXRpYyBjaGFyYWN0ZXI7IGFuZCBub3QgYmUgYSBSdXN0IGtleXdvcmQAAAAAAAtJbnZhbGlkTmFtZQAAAAAJAAAAG011c3QgYmUgdmFsaWQgY2FyZ28gdmVyc2lvbgAAAAAOSW52YWxpZFZlcnNpb24AAAAAAAoAAAAeSGFzaCBoYXMgYWxlYWR5IGJlZW4gcHVibGlzaGVkAAAAAAAUSGFzaEFscmVhZHlQdWJsaXNoZWQAAAALAAAALVJvb3QgcmVnaXN0cnkgcmVxdWlyZXMgbWFuYWdlciB3aGVuIGRlcGxveWluZwAAAAAAAA9NYW5hZ2VyUmVxdWlyZWQAAAAADAAAACNObyBwZW5kaW5nIGJhdGNoIGVudHJpZXMgdG8gcHJvY2VzcwAAAAAOTm9QZW5kaW5nQmF0Y2gAAAAAAA0AAAAgQ2FsbGVyIGlzIG5vdCB0aGUgY29udHJhY3Qgb3duZXIAAAAQTm90Q29udHJhY3RPd25lcgAAAA4AAAA7QmF0Y2ggZW50cnkgbWlzc2luZyBmcm9tIHRlbXBvcmFyeSBzdG9yYWdlIChsaWtlbHkgZXhwaXJlZCkAAAAAEUJhdGNoRW50cnlFeHBpcmVkAAAAAAAADwAAAEBHaXZlbiAiY29udHJhY3QgSUQiIGFwcGVhcnMgdG8gYmUgYSBHLWFkZHJlc3MsIG5vdCBhIGNvbnRyYWN0IElEAAAAFkFjY291bnRBZGRyZXNzTm90VmFsaWQAAAAAABAAAAAwR2l2ZW4gY29udHJhY3QgSUQgZG9lcyBub3QgZXhpc3Qgb24gdGhpcyBuZXR3b3JrAAAAHUNvbnRyYWN0SWRBZGRyZXNzRG9lc05vdEV4aXN0AAAAAAAAEQAAACdJbnZva2luZyBjb250cmFjdCdzIGZ1bmN0aW9uIGhhcyBmYWlsZWQAAAAAFVByb3h5SW52b2NhdGlvbkZhaWxlZAAAAAAAABIAAAAlQ29udHJhY3QgdG8gYmUgaW52b2tlZCBpcyBjb21wcm9taXNlZAAAAAAAABhQcm94eUNvbnRyYWN0Q29tcHJvbWlzZWQAAAATAAAAIFN1YnJlZ2lzdHJ5IGNvbnRyYWN0IGNhbGwgZmFpbGVkAAAAIlN1YlJlZ2lzdHJ5Q3Jvc3NDb250cmFjdENhbGxGYWlsZWQAAAAAABQAAABCU3VicmVnaXN0cnkgbXVzdCBiZSBhIGRpZmZlcmVudCBjb250cmFjdCB0aGFuIHRoZSBjdXJyZW50IHJlZ2lzdHJ5AAAAAAARU3ViUmVnaXN0cnlJc1NlbGYAAAAAAAAV",
				"AAAABQAAAAAAAAAAAAAABkRlcGxveQAAAAAAAQAAAAZkZXBsb3kAAAAAAAUAAAAAAAAACXdhc21fbmFtZQAAAAAAABAAAAAAAAAAAAAAAAd2ZXJzaW9uAAAAABAAAAAAAAAAAAAAAAhkZXBsb3llcgAAABMAAAAAAAAAAAAAAAtjb250cmFjdF9pZAAAAAATAAAAAAAAAAAAAAAIcmVnaXN0cnkAAAATAAAAAAAAAAI=",
				"AAAABQAAAAAAAAAAAAAABlJlbmFtZQAAAAAAAQAAAAZyZW5hbWUAAAAAAAIAAAAAAAAACG9sZF9uYW1lAAAAEAAAAAAAAAAAAAAACG5ld19uYW1lAAAAEAAAAAAAAAAC",
				"AAAABQAAAAAAAAAAAAAAB1B1Ymxpc2gAAAAAAQAAAAdwdWJsaXNoAAAAAAQAAAAAAAAACXdhc21fbmFtZQAAAAAAABAAAAAAAAAAAAAAAAl3YXNtX2hhc2gAAAAAAAPuAAAAIAAAAAAAAAAAAAAAB3ZlcnNpb24AAAAAEAAAAAAAAAAAAAAABmF1dGhvcgAAAAAAEwAAAAAAAAAC",
				"AAAABQAAAAAAAAAAAAAACFJlZ2lzdGVyAAAAAQAAAAhyZWdpc3RlcgAAAAQAAAAAAAAADWNvbnRyYWN0X25hbWUAAAAAAAAQAAAAAAAAAAAAAAALY29udHJhY3RfaWQAAAAAEwAAAAAAAAAAAAAAA3NhYwAAAAABAAAAAAAAAAAAAAAJd2FzbV9oYXNoAAAAAAAD6AAAA+4AAAAgAAAAAAAAAAI=",
				"AAAABQAAAAAAAAAAAAAAC1N1YlJlZ2lzdHJ5AAAAAAEAAAAHc3ViX3JlZwAAAAACAAAAAAAAAARuYW1lAAAAEAAAAAAAAAAAAAAAC2NvbnRyYWN0X2lkAAAAABMAAAAAAAAAAg==",
				"AAAABQAAAAAAAAAAAAAAC1VwZGF0ZU93bmVyAAAAAAEAAAAMdXBkYXRlX293bmVyAAAAAgAAAAAAAAANY29udHJhY3RfbmFtZQAAAAAAABAAAAAAAAAAAAAAAAluZXdfb3duZXIAAAAAAAATAAAAAAAAAAI=",
				"AAAABQAAAAAAAAAAAAAADVVwZGF0ZUFkZHJlc3MAAAAAAAABAAAADnVwZGF0ZV9hZGRyZXNzAAAAAAACAAAAAAAAAA1jb250cmFjdF9uYW1lAAAAAAAAEAAAAAAAAAAAAAAAC25ld19hZGRyZXNzAAAAABMAAAAAAAAAAg==",
				"AAAABQAAAAAAAAAAAAAAFFNlY3VyaXR5RmxhZ0NvbnRyYWN0AAAAAQAAAA1zZWN1cml0eV9mbGFnAAAAAAAAAQAAAAAAAAAHZmxhZ2dlZAAAAAABAAAAAAAAAAI=",
			]),
			options,
		)
	}
	public readonly fromJSON = {
		admin: this.txFromJSON<string>,
		deploy: this.txFromJSON<Result<string>>,
		manager: this.txFromJSON<Option<string>>,
		publish: this.txFromJSON<Result<void>>,
		upgrade: this.txFromJSON<null>,
		set_admin: this.txFromJSON<null>,
		dev_deploy: this.txFromJSON<Result<string>>,
		fetch_hash: this.txFromJSON<Result<Buffer>>,
		set_manager: this.txFromJSON<null>,
		publish_hash: this.txFromJSON<Result<void>>,
		flag_contract: this.txFromJSON<Result<void>>,
		process_batch: this.txFromJSON<Result<u32>>,
		batch_register: this.txFromJSON<Result<void>>,
		deploy_unnamed: this.txFromJSON<Result<string>>,
		remove_manager: this.txFromJSON<null>,
		current_version: this.txFromJSON<Result<string>>,
		rename_contract: this.txFromJSON<Result<void>>,
		upgrade_contract: this.txFromJSON<Result<string>>,
		fetch_contract_id: this.txFromJSON<Result<string>>,
		register_contract: this.txFromJSON<Result<void>>,
		fetch_contract_owner: this.txFromJSON<Result<string>>,
		xcc_hash_and_version: this.txFromJSON<Result<readonly [string, Buffer]>>,
		proxy_invoke_contract: this.txFromJSON<Result<any>>,
		update_contract_owner: this.txFromJSON<Result<void>>,
		deploy_with_subregistry: this.txFromJSON<Result<string>>,
		update_contract_address: this.txFromJSON<Result<void>>,
	}
}

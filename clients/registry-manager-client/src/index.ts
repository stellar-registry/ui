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

export const networks = {
	testnet: {
		networkPassphrase: "Test SDF Network ; September 2015",
		contractId: "CB4CNQJVA4PUQDHGTHNLAICM2A6TBBJBMU5YG6E3XTMWUISHJTC5BJ5Q",
	},
} as const

export const Errors = {
	/**
	 * Proposal has no outcomes attached.
	 */
	1: { message: "NoOutcomeContracts" },
	/**
	 * Proposal has more than one outcome — this manager authorizes exactly one sub-call per proposal.
	 */
	2: { message: "MultipleOutcomes" },
}

export interface Client {
	/**
	 * Construct and simulate a tansu transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
	 */
	tansu: (options?: MethodOptions) => Promise<AssembledTransaction<string>>

	/**
	 * Construct and simulate a trigger transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
	 * Drive a Tansu proposal through to outcome execution in one transaction.
	 *
	 * Flow:
	 *
	 * 1. Read the proposal from this manager's configured Tansu under this
	 * manager's configured `project_key`. Wrong-project callers can't
	 * construct a working invocation — `get_proposal` is keyed by
	 * `(project_key, proposal_id)` Tansu-side, so any mismatched proposal
	 * decodes to whatever lives at that key in *our* DAO or panics.
	 * 2. Take the single approved-branch outcome (`outcome_contracts[0]`):
	 * its `address`, `execute_fn`, and `args`.
	 * 3. Pre-authorize **this contract's auth** for exactly that one
	 * sub-call via `env.authorize_as_current_contract(...)`. Nothing
	 * else gets authorized. The auth entry is scoped to one specific
	 * `(contract, fn, args)` triple.
	 * 4. Call `Tansu.execute(maintainer, project_key, proposal_id, _, _)`.
	 * Tansu tallies the votes, sets the proposal to its terminal status,
	 * and (on `Approved`) auto-invokes the outcome. When that outcome
	 * reaches `manager.require_auth()`, the host matches it against the
	 * pre-authorization from
	 */
	trigger: (
		{ proposal_id }: { proposal_id: u32 },
		options?: MethodOptions,
	) => Promise<AssembledTransaction<Result<void>>>

	/**
	 * Construct and simulate a registry transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
	 */
	registry: (options?: MethodOptions) => Promise<AssembledTransaction<string>>

	/**
	 * Construct and simulate a project_key transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
	 */
	project_key: (
		options?: MethodOptions,
	) => Promise<AssembledTransaction<Buffer>>
}
export class Client extends ContractClient {
	static async deploy<T = Client>(
		/** Constructor/Initialization Args for the contract's `__constructor` method */
		{
			tansu,
			project_key,
			registry,
		}: { tansu: string; project_key: Buffer; registry: string },
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
		return ContractClient.deploy({ tansu, project_key, registry }, options)
	}
	constructor(public readonly options: ContractClientOptions) {
		super(
			new ContractSpec([
				"AAAABAAAAAAAAAAAAAAABUVycm9yAAAAAAAAAgAAACJQcm9wb3NhbCBoYXMgbm8gb3V0Y29tZXMgYXR0YWNoZWQuAAAAAAASTm9PdXRjb21lQ29udHJhY3RzAAAAAAABAAAAYVByb3Bvc2FsIGhhcyBtb3JlIHRoYW4gb25lIG91dGNvbWUg4oCUIHRoaXMgbWFuYWdlciBhdXRob3JpemVzIGV4YWN0bHkgb25lIHN1Yi1jYWxsIHBlciBwcm9wb3NhbC4AAAAAAAAQTXVsdGlwbGVPdXRjb21lcwAAAAI=",
				"AAAAAAAAAAAAAAAFdGFuc3UAAAAAAAAAAAAAAQAAABM=",
				"AAAAAAAABABEcml2ZSBhIFRhbnN1IHByb3Bvc2FsIHRocm91Z2ggdG8gb3V0Y29tZSBleGVjdXRpb24gaW4gb25lIHRyYW5zYWN0aW9uLgoKRmxvdzoKCjEuIFJlYWQgdGhlIHByb3Bvc2FsIGZyb20gdGhpcyBtYW5hZ2VyJ3MgY29uZmlndXJlZCBUYW5zdSB1bmRlciB0aGlzCm1hbmFnZXIncyBjb25maWd1cmVkIGBwcm9qZWN0X2tleWAuIFdyb25nLXByb2plY3QgY2FsbGVycyBjYW4ndApjb25zdHJ1Y3QgYSB3b3JraW5nIGludm9jYXRpb24g4oCUIGBnZXRfcHJvcG9zYWxgIGlzIGtleWVkIGJ5CmAocHJvamVjdF9rZXksIHByb3Bvc2FsX2lkKWAgVGFuc3Utc2lkZSwgc28gYW55IG1pc21hdGNoZWQgcHJvcG9zYWwKZGVjb2RlcyB0byB3aGF0ZXZlciBsaXZlcyBhdCB0aGF0IGtleSBpbiAqb3VyKiBEQU8gb3IgcGFuaWNzLgoyLiBUYWtlIHRoZSBzaW5nbGUgYXBwcm92ZWQtYnJhbmNoIG91dGNvbWUgKGBvdXRjb21lX2NvbnRyYWN0c1swXWApOgppdHMgYGFkZHJlc3NgLCBgZXhlY3V0ZV9mbmAsIGFuZCBgYXJnc2AuCjMuIFByZS1hdXRob3JpemUgKip0aGlzIGNvbnRyYWN0J3MgYXV0aCoqIGZvciBleGFjdGx5IHRoYXQgb25lCnN1Yi1jYWxsIHZpYSBgZW52LmF1dGhvcml6ZV9hc19jdXJyZW50X2NvbnRyYWN0KC4uLilgLiBOb3RoaW5nCmVsc2UgZ2V0cyBhdXRob3JpemVkLiBUaGUgYXV0aCBlbnRyeSBpcyBzY29wZWQgdG8gb25lIHNwZWNpZmljCmAoY29udHJhY3QsIGZuLCBhcmdzKWAgdHJpcGxlLgo0LiBDYWxsIGBUYW5zdS5leGVjdXRlKG1haW50YWluZXIsIHByb2plY3Rfa2V5LCBwcm9wb3NhbF9pZCwgXywgXylgLgpUYW5zdSB0YWxsaWVzIHRoZSB2b3Rlcywgc2V0cyB0aGUgcHJvcG9zYWwgdG8gaXRzIHRlcm1pbmFsIHN0YXR1cywKYW5kIChvbiBgQXBwcm92ZWRgKSBhdXRvLWludm9rZXMgdGhlIG91dGNvbWUuIFdoZW4gdGhhdCBvdXRjb21lCnJlYWNoZXMgYG1hbmFnZXIucmVxdWlyZV9hdXRoKClgLCB0aGUgaG9zdCBtYXRjaGVzIGl0IGFnYWluc3QgdGhlCnByZS1hdXRob3JpemF0aW9uIGZyb20gAAAAB3RyaWdnZXIAAAAAAQAAAAAAAAALcHJvcG9zYWxfaWQAAAAABAAAAAEAAAPpAAAAAgAAAAM=",
				"AAAAAAAAAAAAAAAIcmVnaXN0cnkAAAAAAAAAAQAAABM=",
				"AAAAAAAAAAAAAAALcHJvamVjdF9rZXkAAAAAAAAAAAEAAAAO",
				"AAAAAAAAAAAAAAANX19jb25zdHJ1Y3RvcgAAAAAAAAMAAAAAAAAABXRhbnN1AAAAAAAAEwAAAAAAAAALcHJvamVjdF9rZXkAAAAADgAAAAAAAAAIcmVnaXN0cnkAAAATAAAAAA==",
			]),
			options,
		)
	}
	public readonly fromJSON = {
		tansu: this.txFromJSON<string>,
		trigger: this.txFromJSON<Result<void>>,
		registry: this.txFromJSON<string>,
		project_key: this.txFromJSON<Buffer>,
	}
}

import type * as __compactRuntime from '@midnight-ntwrk/compact-runtime';

export enum ContactMode { NO_CONTACT = 0,
                          PRIVATE_CONTACT_AVAILABLE = 1,
                          PUBLIC_CONTACT_ALLOWED = 2
}

export type Witnesses<PS> = {
  localSecretKey(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, Uint8Array];
}

export type ImpureCircuits<PS> = {
  registerEntry(context: __compactRuntime.CircuitContext<PS>,
                profileKey_0: Uint8Array,
                initialMode_0: ContactMode): __compactRuntime.CircuitResults<PS, []>;
  setContactMode(context: __compactRuntime.CircuitContext<PS>,
                 profileKey_0: Uint8Array,
                 nextMode_0: ContactMode): __compactRuntime.CircuitResults<PS, []>;
  isEntryRegistered(context: __compactRuntime.CircuitContext<PS>,
                    profileKey_0: Uint8Array): __compactRuntime.CircuitResults<PS, boolean>;
  getContactMode(context: __compactRuntime.CircuitContext<PS>,
                 profileKey_0: Uint8Array): __compactRuntime.CircuitResults<PS, ContactMode>;
  getEntryOwnerCommitment(context: __compactRuntime.CircuitContext<PS>,
                          profileKey_0: Uint8Array): __compactRuntime.CircuitResults<PS, Uint8Array>;
}

export type ProvableCircuits<PS> = {
  registerEntry(context: __compactRuntime.CircuitContext<PS>,
                profileKey_0: Uint8Array,
                initialMode_0: ContactMode): __compactRuntime.CircuitResults<PS, []>;
  setContactMode(context: __compactRuntime.CircuitContext<PS>,
                 profileKey_0: Uint8Array,
                 nextMode_0: ContactMode): __compactRuntime.CircuitResults<PS, []>;
  isEntryRegistered(context: __compactRuntime.CircuitContext<PS>,
                    profileKey_0: Uint8Array): __compactRuntime.CircuitResults<PS, boolean>;
  getContactMode(context: __compactRuntime.CircuitContext<PS>,
                 profileKey_0: Uint8Array): __compactRuntime.CircuitResults<PS, ContactMode>;
  getEntryOwnerCommitment(context: __compactRuntime.CircuitContext<PS>,
                          profileKey_0: Uint8Array): __compactRuntime.CircuitResults<PS, Uint8Array>;
}

export type PureCircuits = {
  getOwnerCommitment(_sk_0: Uint8Array): Uint8Array;
}

export type Circuits<PS> = {
  registerEntry(context: __compactRuntime.CircuitContext<PS>,
                profileKey_0: Uint8Array,
                initialMode_0: ContactMode): __compactRuntime.CircuitResults<PS, []>;
  setContactMode(context: __compactRuntime.CircuitContext<PS>,
                 profileKey_0: Uint8Array,
                 nextMode_0: ContactMode): __compactRuntime.CircuitResults<PS, []>;
  isEntryRegistered(context: __compactRuntime.CircuitContext<PS>,
                    profileKey_0: Uint8Array): __compactRuntime.CircuitResults<PS, boolean>;
  getContactMode(context: __compactRuntime.CircuitContext<PS>,
                 profileKey_0: Uint8Array): __compactRuntime.CircuitResults<PS, ContactMode>;
  getEntryOwnerCommitment(context: __compactRuntime.CircuitContext<PS>,
                          profileKey_0: Uint8Array): __compactRuntime.CircuitResults<PS, Uint8Array>;
  getOwnerCommitment(context: __compactRuntime.CircuitContext<PS>,
                     _sk_0: Uint8Array): __compactRuntime.CircuitResults<PS, Uint8Array>;
}

export type Ledger = {
  ownerCommitments: {
    isEmpty(): boolean;
    size(): bigint;
    member(key_0: Uint8Array): boolean;
    lookup(key_0: Uint8Array): Uint8Array;
    [Symbol.iterator](): Iterator<[Uint8Array, Uint8Array]>
  };
  contactModes: {
    isEmpty(): boolean;
    size(): bigint;
    member(key_0: Uint8Array): boolean;
    lookup(key_0: Uint8Array): ContactMode;
    [Symbol.iterator](): Iterator<[Uint8Array, ContactMode]>
  };
}

export type ContractReferenceLocations = any;

export declare const contractReferenceLocations : ContractReferenceLocations;

export declare class Contract<PS = any, W extends Witnesses<PS> = Witnesses<PS>> {
  witnesses: W;
  circuits: Circuits<PS>;
  impureCircuits: ImpureCircuits<PS>;
  provableCircuits: ProvableCircuits<PS>;
  constructor(witnesses: W);
  initialState(context: __compactRuntime.ConstructorContext<PS>): __compactRuntime.ConstructorResult<PS>;
}

export declare function ledger(state: __compactRuntime.StateValue | __compactRuntime.ChargedState): Ledger;
export declare const pureCircuits: PureCircuits;

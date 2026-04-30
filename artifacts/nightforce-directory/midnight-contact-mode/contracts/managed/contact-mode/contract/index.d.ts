import type * as __compactRuntime from '@midnight-ntwrk/compact-runtime';

export enum ContactMode { NO_CONTACT = 0,
                          PRIVATE_CONTACT_AVAILABLE = 1,
                          PUBLIC_CONTACT_ALLOWED = 2
}

export type Witnesses<PS> = {
  localSecretKey(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, Uint8Array];
}

export type ImpureCircuits<PS> = {
  setContactMode(context: __compactRuntime.CircuitContext<PS>,
                 nextMode_0: ContactMode): __compactRuntime.CircuitResults<PS, []>;
}

export type ProvableCircuits<PS> = {
  setContactMode(context: __compactRuntime.CircuitContext<PS>,
                 nextMode_0: ContactMode): __compactRuntime.CircuitResults<PS, []>;
}

export type PureCircuits = {
  getOwnerCommitment(_sk_0: Uint8Array): Uint8Array;
}

export type Circuits<PS> = {
  setContactMode(context: __compactRuntime.CircuitContext<PS>,
                 nextMode_0: ContactMode): __compactRuntime.CircuitResults<PS, []>;
  getOwnerCommitment(context: __compactRuntime.CircuitContext<PS>,
                     _sk_0: Uint8Array): __compactRuntime.CircuitResults<PS, Uint8Array>;
}

export type Ledger = {
  readonly ownerCommitment: Uint8Array;
  readonly contactMode: ContactMode;
}

export type ContractReferenceLocations = any;

export declare const contractReferenceLocations : ContractReferenceLocations;

export declare class Contract<PS = any, W extends Witnesses<PS> = Witnesses<PS>> {
  witnesses: W;
  circuits: Circuits<PS>;
  impureCircuits: ImpureCircuits<PS>;
  provableCircuits: ProvableCircuits<PS>;
  constructor(witnesses: W);
  initialState(context: __compactRuntime.ConstructorContext<PS>,
               initialMode_0: ContactMode): __compactRuntime.ConstructorResult<PS>;
}

export declare function ledger(state: __compactRuntime.StateValue | __compactRuntime.ChargedState): Ledger;
export declare const pureCircuits: PureCircuits;

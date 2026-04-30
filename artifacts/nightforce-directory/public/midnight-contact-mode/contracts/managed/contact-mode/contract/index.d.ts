import type * as __compactRuntime from '@midnight-ntwrk/compact-runtime';

export enum ContactMode { NO_CONTACT = 0,
                          PRIVATE_CONTACT_AVAILABLE = 1,
                          PUBLIC_CONTACT_ALLOWED = 2
}

export type Witnesses<PS> = {
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
}

export type Circuits<PS> = {
  setContactMode(context: __compactRuntime.CircuitContext<PS>,
                 nextMode_0: ContactMode): __compactRuntime.CircuitResults<PS, []>;
}

export type Ledger = {
  readonly owner: { bytes: Uint8Array };
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

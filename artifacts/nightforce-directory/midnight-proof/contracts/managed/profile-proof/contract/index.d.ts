import type * as __compactRuntime from '@midnight-ntwrk/compact-runtime';

export enum Visibility { HIDDEN = 0, PUBLIC = 1 }

export enum CountryCode { UNKNOWN = 0, MY = 1 }

export type Witnesses<PS> = {
}

export type ImpureCircuits<PS> = {
  setProfile(context: __compactRuntime.CircuitContext<PS>,
             nextVisibility_0: Visibility,
             nextCountryCode_0: CountryCode): __compactRuntime.CircuitResults<PS, []>;
}

export type ProvableCircuits<PS> = {
  setProfile(context: __compactRuntime.CircuitContext<PS>,
             nextVisibility_0: Visibility,
             nextCountryCode_0: CountryCode): __compactRuntime.CircuitResults<PS, []>;
}

export type PureCircuits = {
}

export type Circuits<PS> = {
  setProfile(context: __compactRuntime.CircuitContext<PS>,
             nextVisibility_0: Visibility,
             nextCountryCode_0: CountryCode): __compactRuntime.CircuitResults<PS, []>;
}

export type Ledger = {
  readonly visibility: Visibility;
  readonly countryCode: CountryCode;
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

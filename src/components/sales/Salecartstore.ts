import { useSyncExternalStore } from "react";

import type { SelectedProduct } from "@/config/types/saleTypes";
import type { ProductUnit } from "@/config/types/types";

type UnitsMap = Record<string, ProductUnit[]>;

type State = {
  selected: SelectedProduct[];
  selectedUnitsMap: UnitsMap;
};

type Updater<T> = T | ((prev: T) => T);

let state: State = { selected: [], selectedUnitsMap: {} };
const listeners = new Set<() => void>();

const emit = () => listeners.forEach((l) => l());
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
};
const getSnapshot = () => state;

/**
 * Tiny external store for the current sale cart.
 * Works like React state, but any screen (Sales, Scan) can read/write it.
 */
export const saleCart = {
  get: () => state,

  setSelected(updater: Updater<SelectedProduct[]>) {
    const next =
      typeof updater === "function"
        ? (updater as (p: SelectedProduct[]) => SelectedProduct[])(
            state.selected,
          )
        : updater;
    state = { ...state, selected: next };
    emit();
  },

  setSelectedUnitsMap(updater: Updater<UnitsMap>) {
    const next =
      typeof updater === "function"
        ? (updater as (m: UnitsMap) => UnitsMap)(state.selectedUnitsMap)
        : updater;
    state = { ...state, selectedUnitsMap: next };
    emit();
  },
};

export function useSaleCart() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

import { storage } from "@wxt-dev/storage";

export const filterStrictness = storage.defineItem<number>(
  "local:filterStrictness",
  {
    fallback: 40
  }
);

import { createMachine, sendParent } from "xstate";
import { CartItem, Product } from "../utils/types";
import { delay } from "../utils/misc";

export const cartMachine = createMachine(
  {
    /** @xstate-layout N4IgpgJg5mDOIC5QEMIQJIBcwFsAqA9gMLIBOmAssgMYAWAlgHZgB0AMgPICCAIugHIBxAMQQCzFkwBuBANatUGbPmJlKNBhM68BghNILVkmeuIDaABgC6lq4lAAHArHonx9kAA9EAZh8AWFgB2AFYggA4AJiCATh8ANhj-eJ8AGhAAT0QARgsglkj-GJjw0KDsn0iLOIBfGvTFLFxCEnIqOiZWbT4hYTBSUgJSFgcAG2MAMyGcFkblFrV2zS7uHr0DIzdGW1sPJxctj28EP0CyqNiEpJT0rIRIipZi4pC-eP8qxPi6+pBGAggcA8c2aqjaGk6e2crlMjCOiAAtPFbojvr8QSpWuoOlpVrooQdYfCEB8UQhwuEWH4-BZ-JUYiELD5suE6g00E1MYsIRIeBx+ABRAkw9xILyIV7xFh5cIVaKnIL+fxk2UsRkWCzZbIheLheLxSI6tkgDELcE41gCgBKVo4VuFhzFx0l0oicqCCqVZJZMRYRWKRVipSiPlZPyAA */
    id: "addItemToCartMachine",
    context: {
      product: null,
      cart: [],
    },
    initial: "ADDING_ITEM",
    states: {
      ADDING_ITEM: {
        entry: "sendLoadingStateToParent",
        invoke: {
          src: "addItemToCart",
          onDone: {
            target: "DONE",
            actions: "done",
          },
          onError: {
            target: "ERROR",
          },
        },
      },
      DONE: {
        type: "final",
      },
      ERROR: {
        entry: ["sendErrorState"],
        type: "final",
      },
    },
    schema: {
      context: {} as {
        product: Product | null;
        cart: CartItem[];
      },
      services: {} as {
        addItemToCart: {
          data: {
            success: boolean;
            error?: {
              code: string;
              message: string;
              metadata: Record<any, any>;
            };
          };
        };
      },
    },
    predictableActionArguments: true,
    preserveActionOrder: true,
    tsTypes: {} as import("./cart.machine.typegen").Typegen0,
  },
  {
    actions: {
      done: sendParent((ctx, event) => {
        if (event.data.success) {
          return {
            type: "DONE_ADDING",
            product: { ...ctx.product },
            qty: 1,
          };
        }

        return {
          type: "DONE_ADDING",
          // Don't increment qty if maxOrderQty is reached
          product: { ...ctx.product },
          qty: 0,
        };
      }),
      sendLoadingStateToParent: sendParent((ctx) => {
        return {
          type: "ADDING_ITEM",
          product: { ...ctx.product, qty: 1 },
        };
      }),
      sendErrorState: sendParent((ctx, event) => {
        return {
          type: "CART_ERROR",
          product: ctx.product,
          data: event.data,
        };
      }),
    },
    services: {
      addItemToCart: async (ctx, event) => {
        const findItemInCart = ctx.cart.find(
          (obj) => obj.id === ctx?.product?.id
        );

        if (
          findItemInCart &&
          findItemInCart.maxOrderQty &&
          findItemInCart.qty + 1 > findItemInCart.maxOrderQty
        ) {
          return {
            success: false,
            error: {
              code: "MAX_ORDER_QTY_REACHED",
              message: "Max order quantity reached",
              metadata: {
                qty: findItemInCart.maxOrderQty,
              },
            },
          };
        }

        try {
          console.log("Adding item to cart", {
            ctx,
            event,
          });
          await delay(1000, 0);
          return {
            success: true,
          };
        } catch (err) {
          throw new Error("Failed to add item to cart");
        }
      },
    },
  }
);

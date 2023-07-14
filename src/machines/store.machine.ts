import { createMachine, assign, spawn } from "xstate";
import { produce } from "immer";
import { cartMachine } from "./cart.machine";
import { CartItem, Product } from "../utils/types";

export const storeMachine = createMachine(
  {
    /** @xstate-layout N4IgpgJg5mDOIC5QGUAqB5ASgUQMQEEARQgSQDkBxAfRNWwFkBtABgF1FQAHAe1gEsALn24A7DiAAeiAKwAmWQDoAHLKXNpAdgAssgGwbmsgMwAaEAE8Zu3QoCczXfI0BGbbI2aAvp7NoseQnQybCoiUkoWdiQQHn4hUXEpBH0zSwQtZlsFWWYjZm1rJWdDLW9fDBxcAGF8TFQqbExMLEjxWMFhMWikuQ0FIxUNI2lmJRcM2VTEZ1kykD9KsJo6eioMKhq61uj2+K7QHtVle2ldYr0NJSVdKeTHZWlbWUelR91bIrmF7AUSQgAZPDoAAK2DIG1qqG2XF4HQS3Wm0iUCl0mSM9mMGlslyUpgsiCMsi0CgyjlkzjUtmkzmpXwqP02qGq-3QyBCjOhMVhe0SiORqNs6MMRixOLxaVcfS00jyeQyHz0jjp-gUjNVkKoILB1QAEtgqgBpdAAVShbDa3M6vIQMv5Yy0H2lWi0Hmkt2lilJ8ltqPkROVOHVdSD9S1ZFwxuBhHwdCoAEVUABNTm7K0IhBGLTOBSPEXDa7vIwi27DbNUvJPa7OYoGaQBn7IHUkYHA8gUX4AvAiMASAQpy3wg6IJRUklKLR5GV51Rad1yEkOb0DX3kozeHwgETcCBwcTfC1xNNDhDOWy3Ed2GW5PSvHTGXT1juAg9w-aSRApfEZ5w2FSqMZIjk0gjHWG7fCGL48umsiCjmgpDEi1iCsWX7klk5a5Jo2hIhozyPmqjKaqCZCQUe74ZtS-SqNWzgikSLziogHp2IuzzLoY8iPo2zatpQpGDuRGioso2gfLY2Iju8zgljkC6OLoRQDOJtJgfSCjcS2bZPtg-FvkkajIvaYkSbYUlzoo9hkj6HGzKpKoabx7b4FuAgABZgAATgABAAxq5fAADYQF5sACAAhgIYC6da4nMCS4m2M61KGD+GjmSxVnsX666eEAA */
    id: "STORE",
    initial: "IDLE",
    states: {
      IDLE: {
        on: {
          OPEN_CART: {
            target: "CART",
          },
        },
      },
      CART: {
        description: "Shopping Cart",
        initial: "CART_OPEN",
        states: {
          CART_OPEN: {
            on: {
              CHECKOUT: {
                target: "#STORE.SHIPPING.IDLE",
                cond: "hasItems",
              },
              UPDATE_QTY: {
                target: "CART_OPEN",
                actions: "updateItemQty",
              },
            },
          },
        },
        on: {
          CLOSE_CART: {
            target: "IDLE",
          },
        },
      },
      SHIPPING: {
        description: "Shipping Details",
        initial: "IDLE",
        states: {
          IDLE: {
            on: {
              next: {
                target: "Another child state",
              },
            },
          },
          "Another child state": {},
        },
      },
    },
    on: {
      ADDING_ITEM: {
        actions: "updateAddingItemsContext",
      },
      DONE_ADDING: {
        actions: ["finishAddingItemsContext", "updateCartContext"],
        target: "CART.CART_OPEN",
      },
      CART_ERROR: {
        actions: "finishAddingItemsContext",
      },
      ADD_ITEM_TO_CART: {
        actions: "spawnAddToCartProcess",
      },
    },
    schema: {
      context: {} as { cart: CartItem[]; addingItems: string[] },
      events: {} as
        | { type: "CLOSE_CART" }
        | { type: "OPEN_CART" }
        | { type: "next" }
        | { type: "CHECKOUT" }
        | {
            type: "CART_ERROR";
            data: {
              message: string;
            };
          }
        | {
            type: "UPDATE_QTY";
            payload: {
              id: string;
              qty: string;
            };
          }
        | { type: "DONE_ADDING"; product: Product; qty: number }
        | { type: "ADDING_ITEM"; product: Product }
        | {
            type: "ADD_ITEM_TO_CART";
            payload: Product;
          },
    },
    context: {
      cart: [],
      addingItems: [],
    },
    predictableActionArguments: true,
    preserveActionOrder: true,
  },
  {
    actions: {
      spawnAddToCartProcess: (ctx, event) => {
        if (
          event.type !== "ADD_ITEM_TO_CART" ||
          ctx.addingItems.some((id) => id === event.payload.id)
        ) {
          return;
        }

        spawn(
          cartMachine.withContext({
            cart: ctx.cart,
            product: { ...event.payload },
          }),
          `item-${event.payload.id}`
        );
      },

      updateAddingItemsContext: assign({
        addingItems: (ctx, event) => {
          if (event.type !== "ADDING_ITEM") {
            return ctx.addingItems;
          }

          return produce(ctx.addingItems, (arr) => {
            arr.push(event.product.id);
          });
        },
      }),

      finishAddingItemsContext: assign({
        addingItems: (ctx, event) => {
          if (event.type !== "DONE_ADDING") {
            return ctx.addingItems;
          }

          return produce(ctx.addingItems, (arr) =>
            arr.filter((id) => id !== event.product.id)
          );
        },
      }),

      updateItemQty: assign({
        cart: (ctx, event) => {
          if (event.type !== "UPDATE_QTY") {
            return ctx.cart;
          }

          const { id } = event.payload;
          const qty = Number(event.payload.qty);
          const idx = ctx.cart.findIndex((obj) => obj.id === id);

          return produce(ctx.cart, (items) => {
            items[idx].qty = qty;
          });
        },
      }),

      updateCartContext: assign({
        cart: (ctx, event) => {
          if (event.type !== "DONE_ADDING") {
            return ctx.cart;
          }

          const { product, qty } = event;
          const idx = ctx.cart.findIndex((obj) => obj.id === product.id);

          return produce(ctx.cart, (items) => {
            if (idx === -1) {
              items.push({
                ...product,
                qty: 1,
              });
            } else {
              items[idx].qty += qty;
            }
          });
        },
      }),
    },
  }
);

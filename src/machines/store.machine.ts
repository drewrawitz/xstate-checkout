import { createMachine, assign, spawn } from "xstate";
import { produce } from "immer";
import { cartMachine } from "./cart.machine";

export interface Product {
  id: string;
  name: string;
  image: string;
  price: number;
  maxOrderQty?: number;
}

interface CartItem extends Product {
  qty: number;
}

export const storeMachine = createMachine(
  {
    /** @xstate-layout N4IgpgJg5mDOIC5QGUAqB5ASgUQMQEEARQgSQDkBxAfRNWwFkBtABgF1FQAHAe1gEsALn24A7DiAAeiABwA2AHQBOaQFZZsgCwAmWcwDsixcwCMAGhABPRHpXT5zDSu3Lnc4wF935tFjyF0ZNhURKSULOxIIDz8QqLiUgi28trMKlpaNioAzNIaeeZWiSoq8nrS0sbl+rLpilqe3hg4uADC+JioVNiYmFjh4tGCwmKRCeoa8rJyWZXSirJOWioF1kkOTlNZehpZdQ0gPs0hNHT0VBhUbR39kYOxI6AJOVrytorGasyyOVuKKwg2OzrDSbba7dL7Q7YeQkQgAGTw6AACtgyJd2qgblxeEM4qNEB87LoPppKjM9N9pP8sho7Co9FpVDT3sZjGVIU1oVdUK04ehkEFuViojj7vECUliWoNGS2ZT-my9Epsl89Ky9FlZGV6l4Dpz5NyYfC8C0ABLYFoAaXQAFVMWwBqLhuKEMYNHpmKV6eV5lkZrN-tkSk5FFkdCCdDMVBzfAaMUaEbgbUjCPg6FQAIqoACawruzvxCB2djZijVWjDRgrf0siDydlyNRUzGYGQW81kMZwcY68mTqdQ5Go3NwEFEYHkfBEADduABrCdQnuoPsptND9EdBBT2cAYwAhvdwnmnXjHnXaa8Sbk6tqVDXCllivJdjNZPNWZrWxou1z4-310oTceTAAAnUDuFA+ROAAG0PAAzSCAFt5CXQ0AMHIDuW3GduAPI82BPGIC3PBBlGML0ymkfQPkUe8zFrItW2VLJUgyRUNSfX9UNNEgkSRIcEzwEQwAkAQiNxB5JAJaQMleEF3iDBl0ipRig3k0Nwxqb5jE7fYRG4CA4HEKFHWIs9pNdT0UjSDJihyPINH+IxkhVUFjDLek9MaWNYQRMzJJdLVqQ0T1lEUd13Q8t0pm47kArFQstGUV4ymMHIVGMZKP3+dJrLcp8Pm0J8f11ND4z87AEpIyyaQUb10tULLDFkBjCgU+RZIyMsPhbEx9Di-810w4cMWqiyxjkeQtEqAxHC2BwKWpNJXNYrYms1TRozK-V0OGwUMS6HosHGqSEiyyp5Cy5stQi7YKmWRjQooujWKWZgKnKBZtp87tkF4-ih1Ol1dLqJR5uo-QdBMf5QqyDSw36upP24-6+IEyghOBws2VC8HskhhliUDTV7A0CLmCfJY8i4nbYzRwHMfwAyBAACzAgACXdWb4GCIA52ABEPMBsdIjz0leJtNFCpYDBJhQHApqmnB2bbPCAA */
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
        | { type: "DONE_ADDING"; product: Product }
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

          console.log("Done");

          const { product } = event;
          const findExisting = ctx.cart.findIndex(
            (obj) => obj.id === product.id
          );

          return produce(ctx.cart, (items) => {
            if (findExisting === -1) {
              items.push({
                ...product,
                qty: 1,
              });
            } else {
              ctx.cart[findExisting].qty += 1;
            }
          });
        },
      }),
    },
  }
);

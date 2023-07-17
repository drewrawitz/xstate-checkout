import { IconAlertCircle } from "@tabler/icons-react";
import { produce } from "immer";
import {
  Container,
  Box,
  Text,
  Grid,
  Select,
  Group,
  Stack,
  Drawer,
  Button,
  Alert,
  NumberInput,
  LoadingOverlay,
} from "@mantine/core";
import { products } from "../data/db";
import { useState, useEffect, useMemo } from "react";
import ProductCard from "./ProductCard";
import { InterpreterFrom, StateFrom } from "xstate";
import { storeMachine } from "../machines/store.machine";
import { useSelector } from "@xstate/react";

type State = StateFrom<typeof storeMachine>;
type BulkItemState = { [key: string]: number };

// TODO: Refactor this to a store config or something
const MAX_ITEMS_IN_DROPDOWN = 10;
const DEFAULT_BULK_ITEM_QTY = MAX_ITEMS_IN_DROPDOWN;

const selectCart = (state: State) => state.context.cart;
const selectAddingItems = (state: State) => state.context.addingItems;

const Store: React.FC<{
  service: InterpreterFrom<typeof storeMachine>;
  state: State;
}> = ({ service, state }) => {
  const { send } = service;
  const [error, setError] = useState("");
  const cart = useSelector(service, selectCart);
  const addingItems = useSelector(service, selectAddingItems);
  const [bulkItemQty, setBulkItemQty] = useState<BulkItemState>({});
  const [isDrawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    const defaultState = cart.reduce((acc, item) => {
      if (item.qty >= DEFAULT_BULK_ITEM_QTY) {
        return {
          ...acc,
          [item.id]: item.qty,
        };
      }
      return acc;
    }, {});

    setBulkItemQty(defaultState);
  }, []);

  const numItems = useMemo(() => {
    return cart.reduce((acc, item) => acc + item.qty, 0);
  }, [cart]);

  const updateBulkItemQty = (id: string, qty: number) => {
    const updatedState = produce(bulkItemQty, (draft) => {
      draft[id] = qty;
    });

    setBulkItemQty(updatedState);
  };

  useEffect(() => {
    const subscription = service.subscribe((state) => {
      if (state.event.type === "DONE_ADDING") {
        const { id } = state.event.product;

        // Get Current Qty
        const currentItem = state.context.cart.find((obj) => obj.id === id);
        const shouldUpdate =
          currentItem && currentItem.qty >= DEFAULT_BULK_ITEM_QTY;

        if (shouldUpdate) {
          updateBulkItemQty(id, currentItem.qty);
        }
      }

      if (state.event.type === "CART_ERROR") {
        const event = state.event;

        if (event?.data?.message) {
          setError(String(event.data.message));
        }
      }

      if (state.matches({ CART: "CART_OPEN" })) {
        setDrawerOpen(true);
      }

      if (state.event.type === "OPEN_CART") {
        setDrawerOpen(true);
      }

      if (state.event.type === "CLOSE_CART") {
        setDrawerOpen(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [service, bulkItemQty]);

  return (
    <>
      <Drawer
        position="right"
        opened={isDrawerOpen}
        onClose={() => {
          send({ type: "CLOSE_CART" });
        }}
        title="Your Cart"
        overlayProps={{ opacity: 0.5, blur: 4 }}
      >
        {/* <LoadingOverlay visible={true} overlayBlur={2} /> */}
        <pre>{JSON.stringify(state.value)}</pre>

        {numItems === 0 ? (
          <Box mt="xl">
            <Stack align="center" spacing="xl">
              <Text>Your cart is currently empty.</Text>

              <Button
                color="dark"
                radius="xl"
                size="lg"
                onClick={() => send({ type: "CLOSE_CART" })}
              >
                Keep Shopping
              </Button>
            </Stack>
          </Box>
        ) : (
          <div>
            {cart.map((item) => {
              const itemMaxQty = item.maxOrderQty ?? 10;
              const bulkQty = bulkItemQty[item.id] ?? DEFAULT_BULK_ITEM_QTY;

              return (
                <Box
                  key={item.id}
                  py="lg"
                  sx={{ borderBottom: "1px solid #ccc" }}
                >
                  <Text weight={700}>{item.name}</Text>

                  {item.price.savings?.message && (
                    <Text size="sm" color="red" mt={5}>
                      {item.price.savings?.message}
                    </Text>
                  )}

                  <Group align="center" position="apart" mt="sm">
                    <Group>
                      <Text>Quantity:</Text>
                      {item.qty >= MAX_ITEMS_IN_DROPDOWN &&
                      itemMaxQty > MAX_ITEMS_IN_DROPDOWN ? (
                        <Group>
                          <NumberInput
                            value={bulkQty}
                            onChange={(val) => {
                              updateBulkItemQty(item.id, Number(val));
                            }}
                            w={100}
                            min={1}
                            max={itemMaxQty}
                            defaultValue={MAX_ITEMS_IN_DROPDOWN}
                          />
                          {bulkQty !== item.qty && (
                            <Button
                              variant="subtle"
                              onClick={() => {
                                if (bulkQty) {
                                  send({
                                    type: "UPDATE_QTY",
                                    payload: {
                                      id: item.id,
                                      qty: String(bulkQty),
                                    },
                                  });

                                  updateBulkItemQty(
                                    item.id,
                                    Math.max(bulkQty, MAX_ITEMS_IN_DROPDOWN)
                                  );
                                }
                              }}
                            >
                              Update
                            </Button>
                          )}
                        </Group>
                      ) : (
                        <Select
                          w={100}
                          value={String(item.qty)}
                          data={Array.from(
                            {
                              length: Math.min(
                                itemMaxQty,
                                MAX_ITEMS_IN_DROPDOWN
                              ),
                            },
                            (_, i) => {
                              const canAddMoreThanMax =
                                i + 1 === MAX_ITEMS_IN_DROPDOWN &&
                                itemMaxQty > MAX_ITEMS_IN_DROPDOWN;

                              return canAddMoreThanMax
                                ? `${MAX_ITEMS_IN_DROPDOWN}+`
                                : String(i + 1);
                            }
                          )}
                          onChange={(val) => {
                            const qty = val?.endsWith("+")
                              ? MAX_ITEMS_IN_DROPDOWN
                              : val;

                            send({
                              type: "UPDATE_QTY",
                              payload: {
                                id: item.id,
                                qty: String(qty),
                              },
                            });
                          }}
                          transitionProps={{
                            transition: "pop-top-left",
                            duration: 80,
                            timingFunction: "ease",
                          }}
                          withinPortal
                        />
                      )}
                    </Group>

                    <Stack spacing={0}>
                      {item.price.sale?.value && (
                        <Text size="xs" color="dimmed" strikethrough>
                          {item.price.list.formatted}
                        </Text>
                      )}
                      <Text size="lg" weight="bold">
                        {item.price.sale?.formatted ??
                          item.price.list.formatted}
                      </Text>
                    </Stack>
                  </Group>
                </Box>
              );
            })}
            <Button
              onClick={() => send({ type: "CHECKOUT" })}
              color="dark"
              radius="md"
              fullWidth
              size="lg"
              mt="xl"
            >
              Checkout
            </Button>
          </div>
        )}
      </Drawer>
      <Container>
        <div className="card">
          <pre>{JSON.stringify(state.value)}</pre>

          {error && (
            <Alert
              icon={<IconAlertCircle size="1rem" />}
              title={error}
              withCloseButton
              color="red"
              variant="outline"
              onClose={() => setError("")}
            >
              Something terrible happened! You made a mistake and there is no
              going back, your data was lost forever!
            </Alert>
          )}

          <Group>
            <Button onClick={() => send({ type: "OPEN_CART" })}>
              Open Cart ({numItems})
            </Button>
          </Group>

          <Grid mt="lg">
            {products.map((product) => {
              const isAddingToCart = addingItems.some(
                (obj) => obj === product.id
              );

              return (
                <Grid.Col span={4} key={product.id}>
                  <ProductCard
                    product={product}
                    onClickAddToCart={(product) =>
                      send({
                        type: "ADD_ITEM_TO_CART",
                        payload: product,
                      })
                    }
                    isAddingToCart={isAddingToCart}
                  />
                </Grid.Col>
              );
            })}
          </Grid>
        </div>
      </Container>
    </>
  );
};

export default Store;

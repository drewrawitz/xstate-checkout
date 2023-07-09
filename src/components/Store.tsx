import { IconAlertCircle } from "@tabler/icons-react";
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
} from "@mantine/core";
import { products } from "../data/db";
import { useState, useEffect, useMemo } from "react";
import ProductCard from "./ProductCard";
import { InterpreterFrom, StateFrom } from "xstate";
import { storeMachine } from "../machines/store.machine";

// TODO: Refactor this to a store config or something
const MAX_ITEMS_IN_DROPDOWN = 10;
const DEFAULT_BULK_ITEM_QTY = MAX_ITEMS_IN_DROPDOWN;

const Store: React.FC<{
  service: InterpreterFrom<typeof storeMachine>;
  state: StateFrom<typeof storeMachine>;
}> = ({ service, state }) => {
  const { send } = service;
  const [error, setError] = useState("");
  const [bulkItemQty, setBulkItemQty] = useState<number | "">(
    DEFAULT_BULK_ITEM_QTY
  );
  const [isDrawerOpen, setDrawerOpen] = useState(false);

  const numItems = useMemo(() => {
    return state.context.cart.reduce((acc, item) => acc + item.qty, 0);
  }, [state.context]);

  useEffect(() => {
    const subscription = service.subscribe((state) => {
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
  }, [service]);

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
            {state.context.cart.map((item) => {
              const itemMaxQty = item.maxOrderQty ?? 10;

              return (
                <Box key={item.id} py="lg">
                  <Text weight={700}>{item.name}</Text>
                  <Group mt="sm">
                    <Text>Quantity:</Text>
                    {item.qty >= MAX_ITEMS_IN_DROPDOWN &&
                    itemMaxQty > MAX_ITEMS_IN_DROPDOWN ? (
                      <Group>
                        <NumberInput
                          value={bulkItemQty}
                          onChange={setBulkItemQty}
                          w={100}
                          min={1}
                          max={itemMaxQty}
                          defaultValue={MAX_ITEMS_IN_DROPDOWN}
                        />
                        {bulkItemQty !== item.qty && (
                          <Button
                            variant="subtle"
                            onClick={() => {
                              if (bulkItemQty) {
                                send({
                                  type: "UPDATE_QTY",
                                  payload: {
                                    id: item.id,
                                    qty: String(bulkItemQty),
                                  },
                                });

                                setBulkItemQty(
                                  Math.max(bulkItemQty, MAX_ITEMS_IN_DROPDOWN)
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
                            length: Math.min(itemMaxQty, MAX_ITEMS_IN_DROPDOWN),
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
                </Box>
              );
            })}
            <Button
              onClick={() => send({ type: "CHECKOUT" })}
              color="dark"
              radius="md"
              fullWidth
              size="lg"
            >
              Checkout
            </Button>
          </div>
        )}
      </Drawer>
      <Container>
        <div className="card">
          <pre>{JSON.stringify(state.value)}</pre>
          <pre>{JSON.stringify(state.context)}</pre>

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
              const isAddingToCart = state.context.addingItems.some(
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

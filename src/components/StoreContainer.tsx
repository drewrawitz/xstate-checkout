import { useMachine } from "@xstate/react";
import { storeMachine } from "../machines/store.machine";
import Store from "./Store";

export default function StoreContainer() {
  const [state, _, service] = useMachine(storeMachine);

  return <Store state={state} service={service} />;
}

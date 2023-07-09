// This file was automatically generated. Edits will be overwritten

export interface Typegen0 {
  "@@xstate/typegen": true;
  internalEvents: {
    "done.invoke.addItemToCartMachine.ADDING_ITEM:invocation[0]": {
      type: "done.invoke.addItemToCartMachine.ADDING_ITEM:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "error.platform.addItemToCartMachine.ADDING_ITEM:invocation[0]": {
      type: "error.platform.addItemToCartMachine.ADDING_ITEM:invocation[0]";
      data: unknown;
    };
    "xstate.init": { type: "xstate.init" };
  };
  invokeSrcNameMap: {
    addItemToCart: "done.invoke.addItemToCartMachine.ADDING_ITEM:invocation[0]";
  };
  missingImplementations: {
    actions: never;
    delays: never;
    guards: never;
    services: never;
  };
  eventsCausingActions: {
    done: "done.invoke.addItemToCartMachine.ADDING_ITEM:invocation[0]";
    sendErrorState: "error.platform.addItemToCartMachine.ADDING_ITEM:invocation[0]";
    sendLoadingStateToParent: "xstate.init";
  };
  eventsCausingDelays: {};
  eventsCausingGuards: {};
  eventsCausingServices: {
    addItemToCart: "xstate.init";
  };
  matchesStates: "ADDING_ITEM" | "DONE" | "ERROR";
  tags: never;
}

import { MantineProvider } from "@mantine/core";
import { ModalsProvider } from "@mantine/modals";
import StoreContainer from "./components/StoreContainer";

function App() {
  return (
    <MantineProvider
      withGlobalStyles
      withNormalizeCSS
      theme={{
        globalStyles: (theme) => {
          return {
            body: {
              backgroundColor: theme.colors.gray[3],
            },
          };
        },
        components: {
          Drawer: {
            styles: {
              header: {
                borderBottom: "1px solid #e6e6e6",
              },
              title: { fontSize: "1.3rem", fontWeight: "bold" },
            },
          },
          Modal: {
            styles: {
              title: { fontSize: "1.3rem" },
            },
          },
        },
      }}
    >
      <ModalsProvider>
        <StoreContainer />
      </ModalsProvider>
    </MantineProvider>
  );
}

export default App;

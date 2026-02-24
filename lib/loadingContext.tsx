import { createContext, useContext, useState } from "react";
import { ActivityIndicator, Modal, View } from "react-native";

const LoadingContext = createContext<{
  showLoading: () => void;
  hideLoading: () => void;
}>({
  showLoading: () => {},
  hideLoading: () => {},
});

export function LoadingProvider({ children }: { children: React.ReactNode }) {
  const [visible, setVisible] = useState(false);

  return (
    <LoadingContext.Provider
      value={{
        showLoading: () => setVisible(true),
        hideLoading: () => setVisible(false),
      }}
    >
      {children}
      <Modal visible={visible} transparent animationType="fade">
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.5)",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <ActivityIndicator size="large" color="#fff" />
        </View>
      </Modal>
    </LoadingContext.Provider>
  );
}

export const useLoading = () => useContext(LoadingContext);

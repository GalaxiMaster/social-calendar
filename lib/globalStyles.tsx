import { StyleSheet } from "react-native";

export const BLUE = "#4DA8E3";
const BG_SURFACE = "#161B22";

export const globalStyles = StyleSheet.create({
  createButtonText: {
    color: BLUE,
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
  createButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: BG_SURFACE,
    borderWidth: 0.5,
    borderColor: BLUE,
    borderRadius: 8,
    paddingVertical: 5,
    paddingHorizontal: 16,
    gap: 8,
  },
  createButtonPressed: {
    opacity: 0.7,
    backgroundColor: "rgba(77, 168, 227, 0.1)",
  },
});

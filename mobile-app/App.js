import React from "react";
import { View, Platform, Text, StyleSheet } from "react-native";
import { StatusBar } from "expo-status-bar";
import { AuthProvider } from "./context/AuthContext";
import { NetworkProvider } from "./context/NetworkContext";
import OfflineBanner from "./components/OfflineBanner";

const SafeGestureWrapper = Platform.OS === "web"
  ? ({ children }) => <View style={{ flex: 1 }}>{children}</View>
  : require("react-native-gesture-handler").GestureHandlerRootView;

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("App Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Something went wrong</Text>
          <Text style={styles.errorText}>{this.state.error?.toString()}</Text>
          <Text style={styles.errorHint}>Check the console for more details</Text>
        </View>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  
  const [AppNavigator, setAppNavigator] = React.useState(null);
  const [loadError, setLoadError] = React.useState(null);

  React.useEffect(() => {
    const loadApp = async () => {
      try {
        
        await import("./services/firebase");
        console.log("Firebase loaded");

const nav = await import("./navigation/AppNavigator");
        console.log("Navigator loaded");
        setAppNavigator(() => nav.default);
      } catch (error) {
        console.error("Failed to load app:", error);
        setLoadError(error.message);
      }
    };
    loadApp();
  }, []);

  if (loadError) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Failed to load app</Text>
        <Text style={styles.errorText}>{loadError}</Text>
      </View>
    );
  }

  if (!AppNavigator) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <ErrorBoundary>
      <SafeGestureWrapper style={{ flex: 1 }}>
        <NetworkProvider>
          <AuthProvider>
            <StatusBar style="auto" />
            <View style={{ flex: 1 }}>
              <OfflineBanner />
              <AppNavigator />
            </View>
          </AuthProvider>
        </NetworkProvider>
      </SafeGestureWrapper>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#fff",
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#EF4444",
  },
  errorText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 10,
  },
  errorHint: {
    fontSize: 12,
    color: "#999",
    fontStyle: "italic",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  loadingText: {
    fontSize: 16,
    color: "#666",
  },
});

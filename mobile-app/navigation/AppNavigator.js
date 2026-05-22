import React from "react";
import { ActivityIndicator, View } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { useAuth } from "../context/AuthContext";
import { Colors, FontSize } from "../constants/theme";

import LoginScreen from "../screens/LoginScreen";
import RegisterScreen from "../screens/RegisterScreen";
import LandingScreen from "../screens/LandingScreen";
import HomeScreen from "../screens/HomeScreen";
import AddApplianceScreen from "../screens/AddApplianceScreen";
import ApplianceListScreen from "../screens/ApplianceListScreen";
import EditApplianceScreen from "../screens/EditApplianceScreen";
import UploadScreen from "../screens/UploadScreen";
import AIResponseScreen from "../screens/AiResponseScreen";
import NotificationScreen from "../screens/NotificationScreen";

import DiagnosticHomeScreen from "../screens/DiagnosticHomeScreen";
import DeviceSelectionScreen from "../screens/DeviceSelectionScreen";
import DeviceTestScreen from "../screens/DeviceTestScreen";
import SoundTestScreen from "../screens/SoundTestScreen";
import VibrationTestScreen from "../screens/VibrationTestScreen";
import VisualTestScreen from "../screens/VisualTestScreen";
import ThermalTestScreen from "../screens/ThermalTestScreen";
import SymptomTestScreen from "../screens/SymptomTestScreen";
import PerformanceTestScreen from "../screens/PerformanceTestScreen";
import BatteryHealthScreen from "../screens/BatteryHealthScreen";
import StorageHealthScreen from "../screens/StorageHealthScreen";
import ConnectivityTestScreen from "../screens/ConnectivityTestScreen";
import PowerAnalysisScreen from "../screens/PowerAnalysisScreen";
import ComingSoonScreen from "../screens/ComingSoonScreen";
import DiagnosticResultScreen from "../screens/DiagnosticResultScreen";

import PredictiveMaintenanceScreen from "../screens/PredictiveMaintenanceScreen";
import UsagePatternScreen from "../screens/UsagePatternScreen";
import AIChatTroubleshootScreen from "../screens/AIChatTroubleshootScreen";
import RiskScoreScreen from "../screens/RiskScoreScreen";

import ConnectDeviceScreen from "../screens/ConnectDeviceScreen";
import ConnectedDevicesScreen from "../screens/ConnectedDevicesScreen";
import DeviceHealthScreen from "../screens/DeviceHealthScreen";
import DeviceAlertsScreen from "../screens/DeviceAlertsScreen";

import MultimodalDiagnosticScreen from "../screens/MultimodalDiagnosticScreen";
import GuidedQuestionsScreen from "../screens/GuidedQuestionsScreen";
import RulesTraceScreen from "../screens/RulesTraceScreen";
import DesktopAgentPairScreen from "../screens/DesktopAgentPairScreen";
import PdfReportScreen from "../screens/PdfReportScreen";

const Stack = createNativeStackNavigator();

const screenOptions = {
  headerStyle: { backgroundColor: Colors.white },
  headerTintColor: Colors.text,
  headerTitleStyle: { fontWeight: "700", fontSize: FontSize.lg },
  headerTitleAlign: "center",
  headerShadowVisible: false,
  contentStyle: { backgroundColor: Colors.background },
};

export default function AppNavigator() {
  const { user, token, loading, onboardingSeen, onboardingChecked } = useAuth();

  if (loading || !onboardingChecked) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: Colors.background }}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

const initialRouteName = !onboardingSeen
    ? "Landing"
    : user && token
      ? "Home"
      : "Login";

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={initialRouteName}
        screenOptions={screenOptions}
      >
        <Stack.Screen name="Landing" component={LandingScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Register" component={RegisterScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Add Appliance" component={AddApplianceScreen} options={{ title: "Add Appliance" }} />
        <Stack.Screen name="Appliance List" component={ApplianceListScreen} options={{ title: "My Appliances" }} />
        <Stack.Screen name="Edit Appliance" component={EditApplianceScreen} options={{ title: "Edit Appliance" }} />
        <Stack.Screen name="Upload" component={UploadScreen} options={{ title: "Report Issue" }} />
        <Stack.Screen name="AIResponse" component={AIResponseScreen} options={{ title: "AI Analysis", headerStyle: { backgroundColor: Colors.primary }, headerTintColor: Colors.white, headerTitleStyle: { fontWeight: "700", color: Colors.white } }} />
        <Stack.Screen name="Notifications" component={NotificationScreen} options={{ title: "Reminders" }} />
        
        {}
        <Stack.Screen name="DiagnosticHome" component={DiagnosticHomeScreen} options={{ headerShown: false }} />
        <Stack.Screen name="DeviceSelection" component={DeviceSelectionScreen} options={{ headerShown: false }} />
        <Stack.Screen name="DeviceTest" component={DeviceTestScreen} options={{ headerShown: false }} />
        <Stack.Screen name="SoundTest" component={SoundTestScreen} options={{ headerShown: false }} />
        <Stack.Screen name="VibrationTest" component={VibrationTestScreen} options={{ headerShown: false }} />
        <Stack.Screen name="VisualTest" component={VisualTestScreen} options={{ headerShown: false }} />
        <Stack.Screen name="ThermalTest" component={ThermalTestScreen} options={{ headerShown: false }} />
        <Stack.Screen name="SymptomTest" component={SymptomTestScreen} options={{ headerShown: false }} />
        <Stack.Screen name="PerformanceTest" component={PerformanceTestScreen} options={{ headerShown: false }} />
        <Stack.Screen name="BatteryTest" component={BatteryHealthScreen} options={{ headerShown: false }} />
        <Stack.Screen name="StorageTest" component={StorageHealthScreen} options={{ headerShown: false }} />
        <Stack.Screen name="DisplayTest" component={VisualTestScreen} options={{ headerShown: false }} />
        <Stack.Screen name="ConnectivityTest" component={ConnectivityTestScreen} options={{ headerShown: false }} />
        <Stack.Screen name="AudioTest" component={SoundTestScreen} options={{ headerShown: false }} />
        <Stack.Screen name="InputTest" component={SymptomTestScreen} options={{ headerShown: false }} />
        <Stack.Screen name="PowerTest" component={PowerAnalysisScreen} options={{ headerShown: false }} />
        <Stack.Screen name="ComprehensiveTest" component={MultimodalDiagnosticScreen} options={{ headerShown: false }} />
        <Stack.Screen name="DiagnosticResult" component={DiagnosticResultScreen} options={{ headerShown: false }} />
        
        {}
        <Stack.Screen name="PredictiveMaintenance" component={PredictiveMaintenanceScreen} options={{ headerShown: false }} />
        <Stack.Screen name="UsagePattern" component={UsagePatternScreen} options={{ headerShown: false }} />
        <Stack.Screen name="AIChatTroubleshoot" component={AIChatTroubleshootScreen} options={{ headerShown: false }} />
        <Stack.Screen name="RiskScore" component={RiskScoreScreen} options={{ headerShown: false }} />
        
        {}
        <Stack.Screen name="ConnectDevice" component={ConnectDeviceScreen} options={{ headerShown: false }} />
        <Stack.Screen name="ConnectedDevices" component={ConnectedDevicesScreen} options={{ headerShown: false }} />
        <Stack.Screen name="DeviceHealth" component={DeviceHealthScreen} options={{ headerShown: false }} />
        <Stack.Screen name="DeviceAlerts" component={DeviceAlertsScreen} options={{ headerShown: false }} />

        {}
        <Stack.Screen name="MultimodalDiagnostic" component={MultimodalDiagnosticScreen} options={{ headerShown: false }} />
        <Stack.Screen name="GuidedQuestions" component={GuidedQuestionsScreen} options={{ headerShown: false }} />
        <Stack.Screen name="RulesTrace" component={RulesTraceScreen} options={{ title: "Rule Engine" }} />
        <Stack.Screen name="DesktopAgent" component={DesktopAgentPairScreen} options={{ headerShown: false }} />
        <Stack.Screen name="PdfReport" component={PdfReportScreen} options={{ headerShown: false }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export { screenOptions };

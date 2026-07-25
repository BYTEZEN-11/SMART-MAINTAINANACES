import { useState } from "react";
import { ImageBackground, View, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Colors, Radius } from "../../constants/theme";

export default function RemoteOrFallback({
  uri,
  gradient = [Colors.primary, Colors.primaryDark],
  overlayOpacity = 0.55,
  style,
  imageStyle,
  children,
  ...rest
}) {
  const [failed, setFailed] = useState(false);
  const showImage = !!uri && !failed;

  return (
    <View style={[styles.container, style]} {...rest}>
      {showImage ? (
        <ImageBackground
          source={{ uri }}
          style={StyleSheet.absoluteFill}
          imageStyle={imageStyle}
          onError={() => setFailed(true)}

defaultSource={undefined}
        >
          <LinearGradient
            colors={[
              `${gradient[0] ?? Colors.primary}${Math.round(overlayOpacity * 255)
                .toString(16)
                .padStart(2, "0")}`,
              `${gradient[1] ?? gradient[0] ?? Colors.primaryDark}${Math.round(
                overlayOpacity * 255,
              )
                .toString(16)
                .padStart(2, "0")}`,
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        </ImageBackground>
      ) : (
        <LinearGradient
          colors={gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      )}
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { overflow: "hidden", borderRadius: Radius.lg },
  content: { flex: 1 },
});
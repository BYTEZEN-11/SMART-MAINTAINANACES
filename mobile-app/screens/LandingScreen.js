import { useState } from "react";
import {
  View, Text, ScrollView,
  TouchableOpacity, FlatList, LayoutAnimation, Platform, UIManager,
  Dimensions, StyleSheet, StatusBar,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import {
  GradientButton, DecorativeBlob, SectionHeader,
  GlassCard,
} from "../components/UI";
import { RemoteOrFallback } from "../src/components";
import { Colors, Gradients, Spacing, Radius, FontSize, Shadow } from "../constants/theme";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { width: SCREEN_W } = Dimensions.get("window");

const CATEGORIES = [
  { key: "ac",      label: "AC",        icon: "air-conditioner", iconFamily: "MaterialCommunityIcons", gradient: Gradients.iot,         photo: "https://images.unsplash.com/photo-1631545806609-cf3a01b13b48?w=400&q=70" },
  { key: "fridge",  label: "Fridge",    icon: "fridge-outline",  iconFamily: "MaterialCommunityIcons", gradient: Gradients.alerts,      photo: "https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?w=400&q=70" },
  { key: "washing", label: "Washer",    icon: "washing-machine", iconFamily: "MaterialCommunityIcons", gradient: Gradients.health,      photo: "https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?w=400&q=70" },
  { key: "tv",      label: "TV",        icon: "television",      iconFamily: "MaterialCommunityIcons", gradient: Gradients.diagnostics, photo: "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=400&q=70" },
  { key: "laptop",  label: "Laptop",    icon: "laptop",          iconFamily: "MaterialCommunityIcons", gradient: Gradients.analytics,   photo: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400&q=70" },
  { key: "phone",   label: "Phone",     icon: "cellphone",       iconFamily: "MaterialCommunityIcons", gradient: Gradients.rules,       photo: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&q=70" },
];

const FEATURES = [
  {
    icon: "scan-outline", title: "AI Diagnostics",
    desc: "Photo, sound, sensor or text — Gemini finds the issue in seconds.",
    gradient: Gradients.diagnostics, photo: "https://images.unsplash.com/photo-1581090700227-1e37b190418e?w=600&q=70",
  },
  {
    icon: "trending-up-outline", title: "Predictive Care",
    desc: "Stay ahead of breakdowns with risk scores and 30/90/180-day forecasts.",
    gradient: Gradients.alerts, photo: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&q=70",
  },
  {
    icon: "wifi-outline", title: "IoT Connectivity",
    desc: "Pair ESP32 sensors and laptops with a 6-digit code — no IT team needed.",
    gradient: Gradients.iot, photo: "https://images.unsplash.com/photo-1558002038-1055907df827?w=600&q=70",
  },
  {
    icon: "document-text-outline", title: "PDF Reports",
    desc: "Executive, technician & insurance-ready PDFs in one tap.",
    gradient: Gradients.reports, photo: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=600&q=70",
  },
];

const STATS = [
  { value: "10K+", label: "Homes", icon: "home-outline" },
  { value: "98%",  label: "Accuracy", icon: "checkmark-circle-outline" },
  { value: "24/7", label: "Monitoring", icon: "pulse-outline" },
  { value: "40+",  label: "Devices", icon: "cube-outline" },
];

const TESTIMONIALS = [
  {
    name: "Ananya Sharma", role: "Working mom, Bangalore",
    avatar: "AS", gradient: Gradients.heroIndigo,
    quote: "I snapped a photo of my geyser making a weird noise at 11 PM. By morning I had a PDF telling me exactly which part to order. Saved me a service call.",
    stars: 5,
  },
  {
    name: "Rohit Verma", role: "Engineer, Delhi",
    avatar: "RV", gradient: Gradients.iot,
    quote: "The desktop agent caught my laptop fan failing two weeks before the warranty expired. Predictive maintenance actually works.",
    stars: 5,
  },
  {
    name: "Priya Iyer", role: "Designer, Mumbai",
    avatar: "PI", gradient: Gradients.heroAurora,
    quote: "I track 14 appliances now. The reminders sync across my phone and husband's phone — we never miss a service date anymore.",
    stars: 5,
  },
];

const HOW_STEPS = [
  { num: "1", title: "Snap or describe", desc: "Upload a photo, record a sound or type the issue.",         gradient: Gradients.heroIndigo },
  { num: "2", title: "AI diagnoses",     desc: "Multimodal models + rule engine pinpoint the cause.",     gradient: Gradients.heroSky },
  { num: "3", title: "Fix or schedule",  desc: "Get a step-by-step solution or book a service slot.",     gradient: Gradients.heroAurora },
];

const FAQ = [
  { q: "How does AI Home Assistant work?",
    a: "We fuse computer vision, audio analysis and sensor data through Google's Gemini 1.5 multimodal model, then enrich the answer with a deterministic rule engine trained on 1000+ appliance failure modes." },
  { q: "Do I need any hardware?",
    a: "No — the mobile app works with just your phone's camera and microphone. For continuous monitoring, you can pair an ESP32 sensor or our desktop agent (free for personal use)." },
  { q: "Is my data private?",
    a: "Your appliance data is encrypted at rest and in transit. Photos and sensor readings are processed only when you actively run a diagnosis — we never train models on your private data." },
  { q: "Which devices are supported?",
    a: "Any home appliance: AC, fridge, washing machine, TV, laptop, phone, geyser, microwave, dishwasher, vacuum, router and more. New device types are added monthly." },
  { q: "How much does it cost?",
    a: "Free for up to 5 appliances with full AI diagnostics. Pro tier unlocks unlimited appliances, IoT pairing, predictive maintenance and PDF reports." },
];

export default function LandingScreen({ navigation }) {
  const { completeOnboarding } = useAuth();
  const [expandedFaq, setExpandedFaq] = useState(null);

  const handleCta = async (route) => {
    await completeOnboarding();
    navigation.replace(route);
  };

  const toggleFaq = (i) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedFaq((prev) => (prev === i ? null : i));
  };

  const renderCategory = ({ item }) => (
    <RemoteOrFallback
      uri={item.photo}
      gradient={item.gradient}
      overlayOpacity={0.45}
      style={styles.categoryCard}
    >
      <View style={styles.categoryOverlay}>
        <View style={styles.categoryIconCircle}>
          <MaterialCommunityIcons name={item.icon} size={26} color="#FFFFFF" />
        </View>
        <Text style={styles.categoryLabel}>{item.label}</Text>
      </View>
    </RemoteOrFallback>
  );

  const renderTestimonial = ({ item }) => (
    <View style={[styles.testimonialCard, { width: SCREEN_W - Spacing.lg * 2 }]}>
      <View style={styles.starsRow}>
        {Array.from({ length: item.stars }).map((_, i) => (
          <Ionicons key={i} name="star" size={16} color={Colors.warning} />
        ))}
      </View>
      <Text style={styles.testimonialQuote}>"{item.quote}"</Text>
      <View style={styles.testimonialFooter}>
        <LinearGradient
          colors={item.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.testimonialAvatar}
        >
          <Text style={styles.testimonialAvatarText}>{item.avatar}</Text>
        </LinearGradient>
        <View style={{ flex: 1 }}>
          <Text style={styles.testimonialName}>{item.name}</Text>
          <Text style={styles.testimonialRole}>{item.role}</Text>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primaryDark} />
      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: Spacing.xxl }}
      >

        <RemoteOrFallback
          uri="https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1200&q=70"
          gradient={Gradients.heroIndigo}
          overlayOpacity={0.85}
          style={styles.hero}
        >
          <DecorativeBlob color="#6366F1" opacity={0.55} size={300} style={{ top: -100, right: -100 }} />
          <DecorativeBlob color="#0EA5E9" opacity={0.35} size={220} style={{ bottom: -60, left: -60 }} />
          <DecorativeBlob color="#FFFFFF" opacity={0.10} size={180} style={{ top: 120, left: 80 }} />

          <View style={styles.header}>
            <View style={styles.brandRow}>
              <View style={styles.brandBadge}>
                <MaterialCommunityIcons name="home-lightning-bolt" size={18} color="#FFFFFF" />
              </View>
              <Text style={styles.brandText}>AI Home Assistant</Text>
            </View>
            <TouchableOpacity
              onPress={() => handleCta("Login")}
              activeOpacity={0.7}
              style={styles.signInPill}
            >
              <Text style={styles.signInLink}>Sign In</Text>
              <Ionicons name="arrow-forward" size={14} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <View style={styles.heroCopy}>
            <View style={styles.heroPill}>
              <View style={styles.heroPillDot} />
              <Text style={styles.heroPillText}>POWERED BY GEMINI 1.5</Text>
            </View>
            <Text style={styles.heroTitle}>
              Your home's{"\n"}
              <Text style={styles.heroTitleAccent}>AI mechanic.</Text>
            </Text>
            <Text style={styles.heroSubtitle}>
              Snap a photo, describe the noise or let our sensors listen.
              Get a root-cause diagnosis and a fix plan in seconds.
            </Text>

            <View style={styles.heroCtaRow}>
              <GradientButton
                label="Get Started Free"
                icon="rocket-outline"
                onPress={() => handleCta("Register")}
                colors={Gradients.primary}
                style={styles.heroCtaPrimary}
              />
              <TouchableOpacity
                style={styles.heroCtaSecondary}
                onPress={() => handleCta("Login")}
                activeOpacity={0.8}
              >
                <Ionicons name="log-in-outline" size={16} color="#FFFFFF" />
                <Text style={styles.heroCtaSecondaryText}>I have an account</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.heroTrustRow}>
              <Ionicons name="shield-checkmark" size={14} color="rgba(255,255,255,0.85)" />
              <Text style={styles.heroTrustText}>
                No credit card · Free for 5 devices · 256-bit encrypted
              </Text>
            </View>
          </View>

          <View style={styles.statsBar}>
            {STATS.map((s) => (
              <View key={s.label} style={styles.statCell}>
                <Ionicons name={s.icon} size={16} color={Colors.white} />
                <Text style={styles.statValue}>{s.value}</Text>
                <Text style={styles.statLabel}>{s.label}</Text>
              </View>
            ))}
          </View>
        </RemoteOrFallback>


        <View style={styles.section}>
          <SectionHeader title="Trusted across categories" />
          <Text style={styles.sectionLead}>
            From the smallest fan to the biggest fridge — we cover everything with precision.
          </Text>
          <FlatList
            data={CATEGORIES}
            keyExtractor={(item) => item.key}
            renderItem={renderCategory}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              paddingHorizontal: Spacing.lg,
              gap: Spacing.md,
              paddingVertical: Spacing.sm,
            }}
          />
        </View>


        <View style={styles.section}>
          <SectionHeader title="Built for the way you live" />
          <Text style={styles.sectionLead}>
            Diagnostics, predictions and reports — engineered into one workflow.
          </Text>
          <View style={styles.featuresGrid}>
            {FEATURES.map((f) => (
              <GlassCard key={f.title} accent={f.gradient[0] + "30"} style={styles.featureCard}>
                <RemoteOrFallback
                  uri={f.photo}
                  gradient={f.gradient}
                  overlayOpacity={0.55}
                  style={styles.featureBg}
                >
                  <View style={styles.featureIconCircle}>
                    <Ionicons name={f.icon} size={20} color="#FFFFFF" />
                  </View>
                </RemoteOrFallback>
                <Text style={styles.featureTitle}>{f.title}</Text>
                <Text style={styles.featureDesc}>{f.desc}</Text>
              </GlassCard>
            ))}
          </View>
        </View>


        <View style={[styles.section, styles.howSection]}>
          <SectionHeader title="How it works" />
          <Text style={styles.sectionLead}>
            Three steps from problem to resolution.
          </Text>
          <View style={styles.stepsRow}>
            {HOW_STEPS.map((s, idx) => (
              <View key={s.num} style={styles.step}>
                <LinearGradient
                  colors={s.gradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.stepCircle}
                >
                  <Text style={styles.stepNum}>{s.num}</Text>
                </LinearGradient>
                <Text style={styles.stepTitle}>{s.title}</Text>
                <Text style={styles.stepDesc}>{s.desc}</Text>
                {idx < HOW_STEPS.length - 1 && (
                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color={Colors.gray300}
                    style={styles.stepArrow}
                  />
                )}
              </View>
            ))}
          </View>
        </View>


        <View style={styles.section}>
          <SectionHeader title="Loved by 10,000+ homes" />
          <FlatList
            data={TESTIMONIALS}
            keyExtractor={(item) => item.name}
            renderItem={renderTestimonial}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            snapToInterval={SCREEN_W - Spacing.lg * 2 + Spacing.md}
            decelerationRate="fast"
            contentContainerStyle={{
              paddingHorizontal: Spacing.lg,
              gap: Spacing.md,
              paddingVertical: Spacing.sm,
            }}
          />
        </View>


        <View style={styles.section}>
          <SectionHeader title="Frequently asked" />
          <View style={styles.faqList}>
            {FAQ.map((item, i) => {
              const expanded = expandedFaq === i;
              return (
                <TouchableOpacity
                  key={i}
                  activeOpacity={0.85}
                  onPress={() => toggleFaq(i)}
                  style={[styles.faqItem, expanded && styles.faqItemExpanded]}
                >
                  <View style={styles.faqHeader}>
                    <Text style={styles.faqQuestion}>{item.q}</Text>
                    <Ionicons
                      name={expanded ? "chevron-up" : "chevron-down"}
                      size={18}
                      color={expanded ? Colors.primary : Colors.gray600}
                    />
                  </View>
                  {expanded && (
                    <Text style={styles.faqAnswer}>{item.a}</Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>


        <RemoteOrFallback
          uri="https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200&q=70"
          gradient={Gradients.heroIndigo}
          overlayOpacity={0.92}
          style={styles.finalCta}
        >
          <DecorativeBlob color="#0EA5E9" opacity={0.35} size={220} style={{ top: -60, right: -60 }} />
          <DecorativeBlob color="#FFFFFF" opacity={0.10} size={160} style={{ bottom: -40, left: -40 }} />
          <View style={styles.finalCtaCopy}>
            <Text style={styles.finalCtaEyebrow}>START IN 60 SECONDS</Text>
            <Text style={styles.finalCtaTitle}>Ready to give your home a brain?</Text>
            <Text style={styles.finalCtaSubtitle}>
              Join thousands of households that catch problems before they cost a fortune.
            </Text>
            <GradientButton
              label="Get Started Free"
              icon="rocket-outline"
              onPress={() => handleCta("Register")}
              colors={["#FFFFFF", "#E0E7FF"]}
              style={styles.finalCtaButton}
            />
            <View style={styles.finalCtaBadges}>
              <View style={styles.finalCtaBadge}>
                <Ionicons name="shield-checkmark" size={14} color={Colors.white} />
                <Text style={styles.finalCtaBadgeText}>Bank-grade security</Text>
              </View>
              <View style={styles.finalCtaBadge}>
                <Ionicons name="time-outline" size={14} color={Colors.white} />
                <Text style={styles.finalCtaBadgeText}>Setup in minutes</Text>
              </View>
            </View>
          </View>
        </RemoteOrFallback>


        <View style={styles.footer}>
          <View style={styles.footerBrandRow}>
            <View style={styles.footerBrandBadge}>
              <MaterialCommunityIcons name="home-lightning-bolt" size={16} color="#FFFFFF" />
            </View>
            <Text style={styles.footerBrand}>AI Home Assistant</Text>
          </View>
          <Text style={styles.footerTagline}>
            Smart maintenance, powered by AI.
          </Text>

          <View style={styles.footerColumns}>
            <View style={styles.footerCol}>
              <Text style={styles.footerColTitle}>Product</Text>
              <Text style={styles.footerLink}>Diagnostics</Text>
              <Text style={styles.footerLink}>Predictive Care</Text>
              <Text style={styles.footerLink}>IoT Pairing</Text>
              <Text style={styles.footerLink}>Reports</Text>
            </View>
            <View style={styles.footerCol}>
              <Text style={styles.footerColTitle}>Company</Text>
              <Text style={styles.footerLink}>About</Text>
              <Text style={styles.footerLink}>Blog</Text>
              <Text style={styles.footerLink}>Careers</Text>
              <Text style={styles.footerLink}>Press</Text>
            </View>
            <View style={styles.footerCol}>
              <Text style={styles.footerColTitle}>Support</Text>
              <Text style={styles.footerLink}>Help centre</Text>
              <Text style={styles.footerLink}>Contact</Text>
              <Text style={styles.footerLink}>Privacy</Text>
              <Text style={styles.footerLink}>Terms</Text>
            </View>
          </View>

          <View style={styles.footerDivider} />
          <Text style={styles.footerCopy}>
            © 2026 AI Home Assistant. All rights reserved.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },

  hero: {
    minHeight: 700, paddingTop: 56, paddingBottom: 0,
    paddingHorizontal: Spacing.lg, justifyContent: "space-between",
  },
  header: {
    flexDirection: "row", alignItems: "center",
    justifyContent: "space-between", marginBottom: Spacing.lg,
  },
  brandRow: { flexDirection: "row", alignItems: "center", gap: Spacing.sm },
  brandBadge: {
    width: 36, height: 36, borderRadius: 11,
    backgroundColor: "rgba(255,255,255,0.18)",
    justifyContent: "center", alignItems: "center",
    borderWidth: 1.5, borderColor: "rgba(255,255,255,0.3)",
  },
  brandText: {
    color: "#FFFFFF", fontWeight: "800", fontSize: FontSize.md,
    letterSpacing: -0.2,
  },
  signInPill: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingVertical: 8, paddingHorizontal: 14,
    borderRadius: Radius.full,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.3)",
  },
  signInLink: {
    color: "#FFFFFF", fontWeight: "700", fontSize: FontSize.sm,
    letterSpacing: 0.2,
  },

  heroCopy: { paddingTop: Spacing.xl },
  heroPill: {
    flexDirection: "row", alignItems: "center", alignSelf: "flex-start",
    gap: 8, backgroundColor: "rgba(255,255,255,0.18)",
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: Radius.full,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.3)",
    marginBottom: Spacing.md,
  },
  heroPillDot: {
    width: 6, height: 6, borderRadius: 3,
    backgroundColor: "#22D3EE",
  },
  heroPillText: {
    color: "#FFFFFF", fontSize: 10, fontWeight: "800",
    letterSpacing: 0.8,
  },
  heroTitle: {
    color: "#FFFFFF", fontSize: FontSize.display,
    fontWeight: "800", letterSpacing: -1.2, lineHeight: 44,
  },
  heroTitleAccent: {
    color: "#A5B4FC", fontSize: FontSize.display,
    fontWeight: "800", letterSpacing: -1.2,
  },
  heroSubtitle: {
    color: "rgba(226,232,240,0.92)", fontSize: FontSize.md,
    lineHeight: 23, marginTop: Spacing.md, fontWeight: "500",
    maxWidth: 520,
  },

  heroCtaRow: {
    flexDirection: "row", alignItems: "center", gap: Spacing.md,
    marginTop: Spacing.lg, flexWrap: "wrap",
  },
  heroCtaPrimary: { minWidth: 200 },
  heroCtaSecondary: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingVertical: 14, paddingHorizontal: 16,
  },
  heroCtaSecondaryText: {
    color: "#FFFFFF", fontSize: FontSize.sm, fontWeight: "700",
  },

  heroTrustRow: {
    flexDirection: "row", alignItems: "center", gap: 6,
    marginTop: Spacing.md,
  },
  heroTrustText: {
    color: "rgba(226,232,240,0.85)", fontSize: 11,
    fontWeight: "600", letterSpacing: 0.2,
  },

  statsBar: {
    flexDirection: "row", marginTop: Spacing.xl,
    marginHorizontal: -Spacing.lg, paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg, paddingBottom: Spacing.lg,
    backgroundColor: "rgba(15,23,42,0.35)",
    borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.10)",
    borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.10)",
  },
  statCell: {
    flex: 1, alignItems: "center", gap: 4,
  },
  statValue: {
    color: "#FFFFFF", fontSize: FontSize.xl, fontWeight: "800",
    letterSpacing: -0.4, marginTop: 2,
  },
  statLabel: {
    color: "rgba(226,232,240,0.75)", fontSize: 10,
    fontWeight: "700", letterSpacing: 0.6, textTransform: "uppercase",
  },


  section: { marginTop: Spacing.lg },
  howSection: {
    backgroundColor: Colors.white,
    paddingTop: Spacing.lg, paddingBottom: Spacing.md,
    marginTop: Spacing.lg,
    borderTopWidth: 1, borderTopColor: Colors.border,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  sectionLead: {
    fontSize: FontSize.sm, color: Colors.textSecondary,
    paddingHorizontal: Spacing.lg, marginBottom: Spacing.md, lineHeight: 20,
  },

  categoryCard: { width: 140, height: 170, ...Shadow.md },
  categoryOverlay: {
    flex: 1, padding: Spacing.md, justifyContent: "space-between",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.25)",
  },
  categoryIconCircle: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.20)",
    justifyContent: "center", alignItems: "center",
    borderWidth: 1.5, borderColor: "rgba(255,255,255,0.4)",
  },
  categoryLabel: {
    color: "#FFFFFF", fontSize: FontSize.md, fontWeight: "800", letterSpacing: -0.2,
  },

  featuresGrid: {
    flexDirection: "row", flexWrap: "wrap",
    paddingHorizontal: Spacing.lg, gap: Spacing.md, rowGap: Spacing.md,
  },
  featureCard: { width: "47%", flexGrow: 1, padding: Spacing.md },
  featureBg: { width: "100%", height: 110, justifyContent: "flex-end", padding: Spacing.sm },
  featureIconCircle: {
    width: 36, height: 36, borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.28)",
    justifyContent: "center", alignItems: "center",
    borderWidth: 1.5, borderColor: "rgba(255,255,255,0.4)",
  },
  featureTitle: {
    fontSize: FontSize.md, fontWeight: "700", color: Colors.text,
    marginTop: Spacing.sm, letterSpacing: -0.2,
  },
  featureDesc: {
    fontSize: FontSize.xs, color: Colors.textSecondary,
    marginTop: 4, lineHeight: 18,
  },

  stepsRow: {
    flexDirection: "row", alignItems: "flex-start",
    paddingHorizontal: Spacing.lg, gap: Spacing.sm,
  },
  step: { flex: 1, alignItems: "center" },
  stepCircle: {
    width: 56, height: 56, borderRadius: 28,
    justifyContent: "center", alignItems: "center", marginBottom: Spacing.sm,
    ...Shadow.md,
  },
  stepNum: { color: "#FFFFFF", fontSize: FontSize.xl, fontWeight: "800" },
  stepTitle: {
    fontSize: FontSize.sm, fontWeight: "700",
    color: Colors.text, textAlign: "center", letterSpacing: -0.1,
  },
  stepDesc: {
    fontSize: 11, color: Colors.textSecondary,
    textAlign: "center", marginTop: 4, lineHeight: 16,
  },
  stepArrow: { position: "absolute", top: 18, right: -10 },

  testimonialCard: {
    backgroundColor: Colors.white, borderRadius: Radius.lg,
    padding: Spacing.lg, gap: Spacing.md,
    borderWidth: 1, borderColor: Colors.border,
    ...Shadow.md,
  },
  starsRow: { flexDirection: "row", gap: 2 },
  testimonialQuote: {
    fontSize: FontSize.md, color: Colors.text,
    lineHeight: 22, fontWeight: "500",
  },
  testimonialFooter: { flexDirection: "row", alignItems: "center", gap: Spacing.sm },
  testimonialAvatar: {
    width: 44, height: 44, borderRadius: 22,
    justifyContent: "center", alignItems: "center",
  },
  testimonialAvatarText: { color: "#FFFFFF", fontSize: FontSize.md, fontWeight: "800" },
  testimonialName: { fontSize: FontSize.sm, fontWeight: "700", color: Colors.text },
  testimonialRole: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },

  faqList: { paddingHorizontal: Spacing.lg, gap: Spacing.sm },
  faqItem: {
    backgroundColor: Colors.white, borderRadius: Radius.md,
    padding: Spacing.md, borderWidth: 1, borderColor: Colors.border,
  },
  faqItemExpanded: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  faqHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  faqQuestion: {
    flex: 1, fontSize: FontSize.md, fontWeight: "700",
    color: Colors.text, paddingRight: Spacing.sm,
  },
  faqAnswer: {
    fontSize: FontSize.sm, color: Colors.textSecondary,
    lineHeight: 20, marginTop: Spacing.sm,
  },

  finalCta: {
    marginTop: Spacing.xl, minHeight: 320,
    paddingVertical: Spacing.xxl, paddingHorizontal: Spacing.lg,
    justifyContent: "center",
  },
  finalCtaCopy: { alignItems: "center" },
  finalCtaEyebrow: {
    color: "#A5B4FC", fontSize: 11, fontWeight: "800",
    letterSpacing: 1.2, marginBottom: Spacing.sm,
  },
  finalCtaTitle: {
    color: "#FFFFFF", fontSize: FontSize.xxl, fontWeight: "800",
    textAlign: "center", letterSpacing: -0.5, lineHeight: 32,
  },
  finalCtaSubtitle: {
    color: "rgba(226,232,240,0.92)", fontSize: FontSize.sm,
    textAlign: "center", marginTop: Spacing.sm, lineHeight: 20,
    maxWidth: 460,
  },
  finalCtaButton: { marginTop: Spacing.lg, minWidth: 220 },
  finalCtaBadges: {
    flexDirection: "row", gap: Spacing.lg,
    marginTop: Spacing.lg, flexWrap: "wrap", justifyContent: "center",
  },
  finalCtaBadge: {
    flexDirection: "row", alignItems: "center", gap: 6,
  },
  finalCtaBadgeText: {
    color: "rgba(255,255,255,0.92)", fontSize: 11, fontWeight: "600",
    letterSpacing: 0.2,
  },

  footer: {
    backgroundColor: "#0F172A",
    paddingHorizontal: Spacing.lg, paddingTop: Spacing.xl,
    paddingBottom: Spacing.xl, marginTop: Spacing.lg,
  },
  footerBrandRow: { flexDirection: "row", alignItems: "center", gap: Spacing.sm },
  footerBrandBadge: {
    width: 28, height: 28, borderRadius: 8,
    backgroundColor: Colors.primary,
    justifyContent: "center", alignItems: "center",
  },
  footerBrand: {
    fontSize: FontSize.md, fontWeight: "800",
    color: Colors.white, letterSpacing: -0.2,
  },
  footerTagline: {
    fontSize: FontSize.sm, color: Colors.gray400, marginTop: 6,
  },
  footerColumns: {
    flexDirection: "row", justifyContent: "space-between",
    marginTop: Spacing.lg, gap: Spacing.md,
  },
  footerCol: { flex: 1 },
  footerColTitle: {
    fontSize: FontSize.sm, fontWeight: "700",
    color: Colors.white, marginBottom: Spacing.sm, letterSpacing: -0.1,
  },
  footerLink: {
    fontSize: FontSize.xs, color: Colors.gray400,
    marginBottom: 8,
  },
  footerDivider: {
    height: 1, backgroundColor: "#1E293B",
    marginTop: Spacing.lg, marginBottom: Spacing.md,
  },
  footerCopy: {
    fontSize: FontSize.xs, color: Colors.gray500,
    textAlign: "center",
  },
});

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors as COLORS, Spacing as SIZES } from '../constants/theme';
import usageService from '../services/usageService';

const { width } = Dimensions.get('window');

const UsagePatternScreen = ({ route, navigation }) => {
  const { applianceId, applianceName } = route.params;
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalysis();
  }, []);

  const loadAnalysis = async () => {
    try {
      const result = await usageService.getPatternAnalysis(applianceId);
      setAnalysis(result);
    } catch (error) {
      console.error('Pattern analysis error:', error);
      if (error.message?.includes('Insufficient data')) {
        Alert.alert('Insufficient Data', 'Need at least 7 days of usage data to perform analysis.');
      } else {
        Alert.alert('Error', 'Failed to load usage patterns. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity) => {
    const colors = {
      low: '#10B981',
      medium: '#F59E0B',
      high: '#EF4444',
      critical: '#991B1B'
    };
    return colors[severity] || COLORS.gray;
  };

  const getSeverityIcon = (severity) => {
    const icons = {
      low: 'information-circle',
      medium: 'warning',
      high: 'alert-circle',
      critical: 'skull'
    };
    return icons[severity] || 'help-circle';
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Analyzing usage patterns...</Text>
      </View>
    );
  }

  if (!analysis) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={64} color={COLORS.gray} />
        <Text style={styles.errorText}>No usage data available</Text>
        <Text style={styles.errorSubtext}>Start logging usage data to see patterns</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadAnalysis}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const { patterns, anomalies, baseline } = analysis;

  return (
    <View style={styles.container}>
      {}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>Usage Patterns</Text>
          <Text style={styles.headerSubtitle}>{applianceName}</Text>
        </View>
      </View>

      <ScrollView style={styles.content}>
        {}
        <View style={styles.statsCard}>
          <Text style={styles.cardTitle}>Usage Statistics</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Ionicons name="flash" size={24} color={COLORS.primary} />
              <Text style={styles.statValue}>{patterns.stats.avgPower} kWh</Text>
              <Text style={styles.statLabel}>Avg Power</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="time" size={24} color={COLORS.primary} />
              <Text style={styles.statValue}>{patterns.stats.avgRuntime} hrs</Text>
              <Text style={styles.statLabel}>Avg Runtime</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="repeat" size={24} color={COLORS.primary} />
              <Text style={styles.statValue}>{patterns.stats.cycles}</Text>
              <Text style={styles.statLabel}>Cycles/Day</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="speedometer" size={24} color={COLORS.primary} />
              <Text style={styles.statValue}>{patterns.stats.efficiency}%</Text>
              <Text style={styles.statLabel}>Efficiency</Text>
            </View>
          </View>
        </View>

        {}
        <Text style={styles.sectionTitle}>Power Consumption Trend</Text>
        <View style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <View style={styles.chartLegend}>
              <View style={[styles.legendDot, { backgroundColor: COLORS.primary }]} />
              <Text style={styles.legendText}>Current: {patterns.powerConsumption.current} kWh</Text>
            </View>
            <View style={styles.chartLegend}>
              <View style={[styles.legendDot, { backgroundColor: '#94A3B8' }]} />
              <Text style={styles.legendText}>Baseline: {patterns.powerConsumption.baseline} kWh</Text>
            </View>
          </View>
          
          {}
          <View style={styles.chart}>
            {patterns.powerConsumption.data.slice(-7).map((value, index) => {
              const maxValue = Math.max(...patterns.powerConsumption.data);
              const height = (value / maxValue) * 120;
              const isAboveBaseline = value > parseFloat(patterns.powerConsumption.baseline);
              
              return (
                <View key={index} style={styles.barContainer}>
                  <View style={[styles.bar, { 
                    height,
                    backgroundColor: isAboveBaseline ? '#EF4444' : COLORS.primary
                  }]} />
                  <Text style={styles.barLabel}>
                    {patterns.powerConsumption.labels[patterns.powerConsumption.labels.length - 7 + index]?.replace('Day ', 'D')}
                  </Text>
                </View>
              );
            })}
          </View>
          
          <View style={styles.baselineLine}>
            <View style={styles.baselineDash} />
            <Text style={styles.baselineLabel}>Baseline</Text>
          </View>
        </View>

        {}
        <Text style={styles.sectionTitle}>Runtime Pattern</Text>
        <View style={styles.chartCard}>
          <View style={styles.chart}>
            {patterns.runtime.data.slice(-7).map((value, index) => {
              const maxValue = Math.max(...patterns.runtime.data);
              const height = (value / maxValue) * 120;
              
              return (
                <View key={index} style={styles.barContainer}>
                  <View style={[styles.bar, { 
                    height,
                    backgroundColor: '#3B82F6'
                  }]} />
                  <Text style={styles.barLabel}>
                    {patterns.runtime.labels[patterns.runtime.labels.length - 7 + index]?.replace('Day ', 'D')}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {}
        <View style={styles.baselineCard}>
          <View style={styles.baselineHeader}>
            <Ionicons name="analytics" size={24} color={COLORS.primary} />
            <Text style={styles.baselineTitle}>Baseline Analysis</Text>
          </View>
          <View style={styles.baselineRow}>
            <Text style={styles.baselineLabel}>Power Baseline:</Text>
            <Text style={styles.baselineValue}>{baseline.power.toFixed(2)} kWh</Text>
          </View>
          <View style={styles.baselineRow}>
            <Text style={styles.baselineLabel}>Runtime Baseline:</Text>
            <Text style={styles.baselineValue}>{baseline.runtime.toFixed(1)} hours</Text>
          </View>
          <View style={styles.baselineRow}>
            <Text style={styles.baselineLabel}>Power Std Dev:</Text>
            <Text style={styles.baselineValue}>±{baseline.stdDev.power.toFixed(2)} kWh</Text>
          </View>
          <View style={styles.baselineRow}>
            <Text style={styles.baselineLabel}>Runtime Std Dev:</Text>
            <Text style={styles.baselineValue}>±{baseline.stdDev.runtime.toFixed(1)} hours</Text>
          </View>
        </View>

        {}
        {anomalies && anomalies.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Detected Anomalies</Text>
            {anomalies.map((anomaly, index) => (
              <View key={index} style={styles.anomalyCard}>
                <View style={styles.anomalyHeader}>
                  <View style={[styles.anomalyIcon, { 
                    backgroundColor: getSeverityColor(anomaly.severity) + '20'
                  }]}>
                    <Ionicons 
                      name={getSeverityIcon(anomaly.severity)} 
                      size={24} 
                      color={getSeverityColor(anomaly.severity)} 
                    />
                  </View>
                  <View style={styles.anomalyHeaderText}>
                    <Text style={styles.anomalyType}>{anomaly.type}</Text>
                    <Text style={styles.anomalyDate}>{anomaly.detectedDate}</Text>
                  </View>
                  <View style={[styles.severityBadge, { 
                    backgroundColor: getSeverityColor(anomaly.severity) 
                  }]}>
                    <Text style={styles.severityText}>
                      {anomaly.severity.toUpperCase()}
                    </Text>
                  </View>
                </View>
                <Text style={styles.anomalyDescription}>{anomaly.description}</Text>
                <View style={styles.anomalyIssue}>
                  <Ionicons name="warning-outline" size={16} color="#F59E0B" />
                  <Text style={styles.anomalyIssueText}>{anomaly.possibleIssue}</Text>
                </View>
                <View style={styles.anomalyMetric}>
                  <Text style={styles.anomalyMetricLabel}>
                    {anomaly.metric === 'power' ? 'Power Consumption' : 'Runtime'}:
                  </Text>
                  <Text style={styles.anomalyMetricValue}>
                    {anomaly.value.toFixed(2)} {anomaly.metric === 'power' ? 'kWh' : 'hrs'}
                  </Text>
                </View>
              </View>
            ))}
          </>
        )}

        {anomalies && anomalies.length === 0 && (
          <View style={styles.noAnomaliesCard}>
            <Ionicons name="checkmark-circle" size={48} color="#10B981" />
            <Text style={styles.noAnomaliesText}>No anomalies detected</Text>
            <Text style={styles.noAnomaliesSubtext}>
              Your appliance is operating within normal parameters
            </Text>
          </View>
        )}

        {}
        <TouchableOpacity style={styles.refreshButton} onPress={loadAnalysis}>
          <Ionicons name="refresh" size={20} color={COLORS.white} />
          <Text style={styles.refreshButtonText}>Refresh Analysis</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.gray
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    padding: SIZES.lg
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 16,
    marginBottom: 8
  },
  errorSubtext: {
    fontSize: 14,
    color: COLORS.gray,
    marginBottom: 24,
    textAlign: 'center'
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8
  },
  retryButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600'
  },
  header: {
    backgroundColor: COLORS.primary,
    padding: SIZES.lg,
    paddingTop: SIZES.lg * 2,
    flexDirection: 'row',
    alignItems: 'center'
  },
  backButton: {
    marginRight: 16
  },
  headerInfo: {
    flex: 1
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.white
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.white,
    opacity: 0.9,
    marginTop: 4
  },
  content: {
    flex: 1,
    padding: SIZES.lg
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 12,
    marginTop: 8
  },
  statsCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: SIZES.lg,
    marginBottom: 16,
    elevation: 2
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 16
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12
  },
  statItem: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    padding: 12,
    backgroundColor: COLORS.background,
    borderRadius: 8
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: 8
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.gray,
    marginTop: 4
  },
  chartCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: SIZES.lg,
    marginBottom: 16,
    elevation: 2
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    flexWrap: 'wrap',
    gap: 8
  },
  chartLegend: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6
  },
  legendText: {
    fontSize: 12,
    color: COLORS.gray
  },
  chart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 140,
    paddingTop: 20
  },
  barContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end'
  },
  bar: {
    width: '70%',
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    minHeight: 4
  },
  barLabel: {
    fontSize: 10,
    color: COLORS.gray,
    marginTop: 4
  },
  baselineLine: {
    position: 'absolute',
    top: 80,
    left: SIZES.lg,
    right: SIZES.lg,
    flexDirection: 'row',
    alignItems: 'center'
  },
  baselineDash: {
    flex: 1,
    height: 1,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: '#94A3B8'
  },
  baselineLabel: {
    fontSize: 10,
    color: '#94A3B8',
    marginLeft: 4
  },
  baselineCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: SIZES.lg,
    marginBottom: 16,
    elevation: 1
  },
  baselineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16
  },
  baselineTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginLeft: 12
  },
  baselineRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray
  },
  baselineLabel: {
    fontSize: 14,
    color: COLORS.gray
  },
  baselineValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text
  },
  anomalyCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: SIZES.lg,
    marginBottom: 12,
    elevation: 1
  },
  anomalyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12
  },
  anomalyIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12
  },
  anomalyHeaderText: {
    flex: 1
  },
  anomalyType: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text
  },
  anomalyDate: {
    fontSize: 12,
    color: COLORS.gray,
    marginTop: 2
  },
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8
  },
  severityText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: '700'
  },
  anomalyDescription: {
    fontSize: 14,
    color: COLORS.text,
    marginBottom: 12
  },
  anomalyIssue: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FEF3C7',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12
  },
  anomalyIssueText: {
    flex: 1,
    fontSize: 13,
    color: '#92400E',
    marginLeft: 8
  },
  anomalyMetric: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  anomalyMetricLabel: {
    fontSize: 13,
    color: COLORS.gray
  },
  anomalyMetricValue: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text
  },
  noAnomaliesCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: SIZES.lg * 2,
    alignItems: 'center',
    marginBottom: 16,
    elevation: 1
  },
  noAnomaliesText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 16
  },
  noAnomaliesSubtext: {
    fontSize: 14,
    color: COLORS.gray,
    marginTop: 8,
    textAlign: 'center'
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
    marginBottom: 24
  },
  refreshButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8
  }
});

export default UsagePatternScreen;

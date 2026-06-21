import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors as COLORS, Spacing as SIZES } from '../constants/theme';
import maintenanceService from '../services/maintenanceService';

const PredictiveMaintenanceScreen = ({ route, navigation }) => {
  const { applianceId, applianceName } = route.params;
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPrediction();
  }, []);

  const loadPrediction = async () => {
    try {
      const result = await maintenanceService.getPrediction(applianceId);
      setPrediction(result);
    } catch (error) {
      console.error('Prediction error:', error);
      Alert.alert('Error', 'Failed to load prediction. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getHealthColor = (score) => {
    if (score >= 80) return '#10B981';
    if (score >= 60) return '#3B82F6';
    if (score >= 40) return '#F59E0B';
    return '#EF4444';
  };

  const getRiskColor = (risk) => {
    if (risk >= 70) return '#EF4444';
    if (risk >= 50) return '#F59E0B';
    if (risk >= 30) return '#3B82F6';
    return '#10B981';
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Analyzing appliance health...</Text>
      </View>
    );
  }

  if (!prediction) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={64} color={COLORS.gray} />
        <Text style={styles.errorText}>No prediction data available</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadPrediction}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>Predictive Maintenance</Text>
          <Text style={styles.headerSubtitle}>{applianceName}</Text>
        </View>
      </View>

      <ScrollView style={styles.content}>
        {}
        <View style={styles.healthScoreCard}>
          <View style={styles.healthScoreCircle}>
            <View style={[styles.healthScoreInner, { 
              borderColor: getHealthColor(prediction.healthScore),
              borderWidth: 8
            }]}>
              <Text style={[styles.healthScoreValue, { 
                color: getHealthColor(prediction.healthScore) 
              }]}>
                {prediction.healthScore}%
              </Text>
              <Text style={styles.healthScoreLabel}>Health Score</Text>
            </View>
          </View>
          <Text style={styles.healthScoreDescription}>
            {prediction.healthScore >= 80 ? 'Excellent condition' :
             prediction.healthScore >= 60 ? 'Good condition' :
             prediction.healthScore >= 40 ? 'Fair condition' :
             'Poor condition - needs attention'}
          </Text>
        </View>

        {}
        <View style={styles.riskCard}>
          <View style={styles.riskHeader}>
            <Ionicons name="warning" size={24} color={getRiskColor(prediction.failureRisk)} />
            <Text style={styles.riskTitle}>Failure Risk</Text>
          </View>
          <View style={styles.riskBarContainer}>
            <View style={styles.riskBar}>
              <View style={[styles.riskFill, { 
                width: `${prediction.failureRisk}%`,
                backgroundColor: getRiskColor(prediction.failureRisk)
              }]} />
            </View>
            <Text style={styles.riskPercentage}>{prediction.failureRisk}%</Text>
          </View>
          <Text style={styles.riskText}>
            {prediction.failureRisk >= 70 ? 'High risk of failure in next 6 months' :
             prediction.failureRisk >= 50 ? 'Moderate risk - monitor closely' :
             prediction.failureRisk >= 30 ? 'Low risk - routine maintenance recommended' :
             'Very low risk - appliance is healthy'}
          </Text>
        </View>

        {}
        <View style={styles.lifespanCard}>
          <Ionicons name="time-outline" size={24} color={COLORS.primary} />
          <View style={styles.lifespanInfo}>
            <Text style={styles.lifespanLabel}>Estimated Remaining Life</Text>
            <Text style={styles.lifespanValue}>{prediction.estimatedLifespan}</Text>
          </View>
        </View>

        {}
        <Text style={styles.sectionTitle}>Component Health</Text>
        {prediction.components && prediction.components.map((comp, index) => (
          <View key={index} style={styles.componentCard}>
            <View style={styles.componentHeader}>
              <Text style={styles.componentName}>{comp.name}</Text>
              <Text style={[styles.componentHealth, { 
                color: getHealthColor(comp.health) 
              }]}>
                {comp.health}%
              </Text>
            </View>
            <View style={styles.componentBarContainer}>
              <View style={styles.componentBar}>
                <View style={[styles.componentFill, { 
                  width: `${comp.health}%`,
                  backgroundColor: getHealthColor(comp.health)
                }]} />
              </View>
            </View>
            <Text style={styles.componentNote}>{comp.note}</Text>
          </View>
        ))}

        {}
        {prediction.maintenanceSchedule && prediction.maintenanceSchedule.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Recommended Maintenance</Text>
            {prediction.maintenanceSchedule.map((task, index) => (
              <View key={index} style={styles.taskCard}>
                <View style={[styles.taskPriority, { 
                  backgroundColor: task.priority === 'high' ? '#FEE2E2' : 
                                   task.priority === 'medium' ? '#FEF3C7' : '#DBEAFE'
                }]}>
                  <Ionicons 
                    name={task.priority === 'high' ? 'alert-circle' : 
                          task.priority === 'medium' ? 'warning' : 'information-circle'} 
                    size={20} 
                    color={task.priority === 'high' ? '#EF4444' : 
                           task.priority === 'medium' ? '#F59E0B' : '#3B82F6'} 
                  />
                </View>
                <View style={styles.taskInfo}>
                  <Text style={styles.taskTitle}>{task.title}</Text>
                  <Text style={styles.taskDate}>
                    Due: {new Date(task.dueDate).toLocaleDateString()}
                  </Text>
                </View>
                <TouchableOpacity style={styles.scheduleButton}>
                  <Ionicons name="calendar" size={20} color={COLORS.primary} />
                </TouchableOpacity>
              </View>
            ))}
          </>
        )}

        {}
        {prediction.recommendations && prediction.recommendations.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Expert Recommendations</Text>
            {prediction.recommendations.map((rec, index) => (
              <View key={index} style={styles.recommendationCard}>
                <View style={styles.recommendationHeader}>
                  <View style={[styles.priorityBadge, {
                    backgroundColor: rec.priority === 'high' ? '#FEE2E2' : '#FEF3C7'
                  }]}>
                    <Text style={[styles.priorityText, {
                      color: rec.priority === 'high' ? '#EF4444' : '#F59E0B'
                    }]}>
                      {rec.priority.toUpperCase()}
                    </Text>
                  </View>
                </View>
                <Text style={styles.recommendationAction}>{rec.action}</Text>
                <Text style={styles.recommendationReason}>{rec.reason}</Text>
                <Text style={styles.recommendationTimeframe}>
                  Timeframe: {rec.timeframe}
                </Text>
              </View>
            ))}
          </>
        )}

        {}
        <TouchableOpacity style={styles.refreshButton} onPress={loadPrediction}>
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
    fontSize: 16,
    color: COLORS.gray,
    marginTop: 16,
    marginBottom: 24
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
  healthScoreCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: SIZES.lg * 1.5,
    alignItems: 'center',
    marginBottom: 16,
    elevation: 2
  },
  healthScoreCircle: {
    marginBottom: 16
  },
  healthScoreInner: {
    width: 160,
    height: 160,
    borderRadius: 80,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.white
  },
  healthScoreValue: {
    fontSize: 48,
    fontWeight: 'bold'
  },
  healthScoreLabel: {
    fontSize: 14,
    color: COLORS.gray,
    marginTop: 4
  },
  healthScoreDescription: {
    fontSize: 16,
    color: COLORS.text,
    textAlign: 'center'
  },
  riskCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: SIZES.lg,
    marginBottom: 16,
    elevation: 2
  },
  riskHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16
  },
  riskTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginLeft: 12
  },
  riskBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12
  },
  riskBar: {
    flex: 1,
    height: 12,
    backgroundColor: COLORS.lightGray,
    borderRadius: 6,
    overflow: 'hidden',
    marginRight: 12
  },
  riskFill: {
    height: '100%',
    borderRadius: 6
  },
  riskPercentage: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    minWidth: 45
  },
  riskText: {
    fontSize: 14,
    color: COLORS.gray
  },
  lifespanCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: SIZES.lg,
    marginBottom: 24,
    elevation: 2
  },
  lifespanInfo: {
    marginLeft: 16,
    flex: 1
  },
  lifespanLabel: {
    fontSize: 14,
    color: COLORS.gray,
    marginBottom: 4
  },
  lifespanValue: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 12,
    marginTop: 8
  },
  componentCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: SIZES.lg,
    marginBottom: 12,
    elevation: 1
  },
  componentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  componentName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text
  },
  componentHealth: {
    fontSize: 18,
    fontWeight: 'bold'
  },
  componentBarContainer: {
    marginBottom: 8
  },
  componentBar: {
    height: 8,
    backgroundColor: COLORS.lightGray,
    borderRadius: 4,
    overflow: 'hidden'
  },
  componentFill: {
    height: '100%',
    borderRadius: 4
  },
  componentNote: {
    fontSize: 12,
    color: COLORS.gray
  },
  taskCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: SIZES.lg,
    marginBottom: 12,
    elevation: 1
  },
  taskPriority: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12
  },
  taskInfo: {
    flex: 1
  },
  taskTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4
  },
  taskDate: {
    fontSize: 12,
    color: COLORS.gray
  },
  scheduleButton: {
    padding: 8
  },
  recommendationCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: SIZES.lg,
    marginBottom: 12,
    elevation: 1
  },
  recommendationHeader: {
    marginBottom: 12
  },
  priorityBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '700'
  },
  recommendationAction: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8
  },
  recommendationReason: {
    fontSize: 14,
    color: COLORS.gray,
    marginBottom: 8
  },
  recommendationTimeframe: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '500'
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

export default PredictiveMaintenanceScreen;

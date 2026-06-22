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
import riskService from '../services/riskService';

const RiskScoreScreen = ({ route, navigation }) => {
  const { applianceId, applianceName } = route.params;
  const [riskData, setRiskData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRiskScore();
  }, []);

  const loadRiskScore = async () => {
    try {
      const result = await riskService.calculateRiskScore(applianceId);
      setRiskData(result);
    } catch (error) {
      console.error('Risk score error:', error);
      Alert.alert('Error', 'Failed to calculate risk score. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (level) => {
    const colors = {
      low: '#10B981',
      medium: '#F59E0B',
      high: '#EF4444',
      critical: '#991B1B'
    };
    return colors[level] || COLORS.gray;
  };

  const getRiskIcon = (level) => {
    const icons = {
      low: 'shield-checkmark',
      medium: 'warning',
      high: 'alert-circle',
      critical: 'skull'
    };
    return icons[level] || 'help-circle';
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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Calculating risk score...</Text>
      </View>
    );
  }

  if (!riskData) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={64} color={COLORS.gray} />
        <Text style={styles.errorText}>No risk data available</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadRiskScore}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const { overallRisk, riskFactors, predictions, recommendations } = riskData;

  return (
    <View style={styles.container}>
      {}
      <View style={[styles.header, { backgroundColor: getRiskColor(overallRisk.level) }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>Risk Assessment</Text>
          <Text style={styles.headerSubtitle}>{applianceName}</Text>
        </View>
      </View>

      <ScrollView style={styles.content}>
        {}
        <View style={styles.overallRiskCard}>
          <View style={styles.riskScoreCircle}>
            <View style={[styles.riskScoreInner, { 
              borderColor: getRiskColor(overallRisk.level),
              borderWidth: 8
            }]}>
              <Ionicons 
                name={getRiskIcon(overallRisk.level)} 
                size={48} 
                color={getRiskColor(overallRisk.level)} 
              />
              <Text style={[styles.riskScoreValue, { 
                color: getRiskColor(overallRisk.level) 
              }]}>
                {overallRisk.score}
              </Text>
              <Text style={styles.riskScoreLabel}>Risk Score</Text>
            </View>
          </View>
          <View style={[styles.riskLevelBadge, { 
            backgroundColor: getRiskColor(overallRisk.level) 
          }]}>
            <Text style={styles.riskLevelText}>
              {overallRisk.level.toUpperCase()} RISK
            </Text>
          </View>
        </View>

        {}
        <Text style={styles.sectionTitle}>Failure Probability</Text>
        <View style={styles.predictionsCard}>
          <View style={styles.predictionRow}>
            <Text style={styles.predictionLabel}>Next 30 Days</Text>
            <View style={styles.predictionBar}>
              <View style={[styles.predictionFill, { 
                width: `${predictions.failureProbability.next30Days}%`,
                backgroundColor: predictions.failureProbability.next30Days > 50 ? '#EF4444' : '#F59E0B'
              }]} />
            </View>
            <Text style={styles.predictionValue}>
              {predictions.failureProbability.next30Days}%
            </Text>
          </View>
          
          <View style={styles.predictionRow}>
            <Text style={styles.predictionLabel}>Next 90 Days</Text>
            <View style={styles.predictionBar}>
              <View style={[styles.predictionFill, { 
                width: `${predictions.failureProbability.next90Days}%`,
                backgroundColor: predictions.failureProbability.next90Days > 50 ? '#EF4444' : '#F59E0B'
              }]} />
            </View>
            <Text style={styles.predictionValue}>
              {predictions.failureProbability.next90Days}%
            </Text>
          </View>
          
          <View style={styles.predictionRow}>
            <Text style={styles.predictionLabel}>Next 180 Days</Text>
            <View style={styles.predictionBar}>
              <View style={[styles.predictionFill, { 
                width: `${predictions.failureProbability.next180Days}%`,
                backgroundColor: predictions.failureProbability.next180Days > 50 ? '#EF4444' : '#F59E0B'
              }]} />
            </View>
            <Text style={styles.predictionValue}>
              {predictions.failureProbability.next180Days}%
            </Text>
          </View>

          <View style={styles.predictionInfo}>
            <Ionicons name="time-outline" size={20} color={COLORS.primary} />
            <View style={styles.predictionInfoText}>
              <Text style={styles.predictionInfoLabel}>Estimated Time to Failure</Text>
              <Text style={styles.predictionInfoValue}>{predictions.estimatedTimeToFailure}</Text>
            </View>
          </View>

          <View style={styles.predictionInfo}>
            <Ionicons name="warning-outline" size={20} color={COLORS.primary} />
            <View style={styles.predictionInfoText}>
              <Text style={styles.predictionInfoLabel}>Most Likely Failure Mode</Text>
              <Text style={styles.predictionInfoValue}>{predictions.mostLikelyFailureMode}</Text>
            </View>
          </View>
        </View>

        {}
        <Text style={styles.sectionTitle}>Risk Factors Analysis</Text>
        {riskFactors.map((factor, index) => (
          <View key={index} style={styles.factorCard}>
            <View style={styles.factorHeader}>
              <View style={styles.factorTitleRow}>
                <Text style={styles.factorCategory}>
                  {factor.category.charAt(0).toUpperCase() + factor.category.slice(1)}
                </Text>
                <View style={[styles.severityBadge, { 
                  backgroundColor: getSeverityColor(factor.severity) + '20'
                }]}>
                  <Text style={[styles.severityText, { 
                    color: getSeverityColor(factor.severity) 
                  }]}>
                    {factor.severity.toUpperCase()}
                  </Text>
                </View>
              </View>
              <Text style={[styles.factorScore, { 
                color: getSeverityColor(factor.severity) 
              }]}>
                {factor.score}/100
              </Text>
            </View>
            <View style={styles.factorBarContainer}>
              <View style={styles.factorBar}>
                <View style={[styles.factorFill, { 
                  width: `${factor.score}%`,
                  backgroundColor: getSeverityColor(factor.severity)
                }]} />
              </View>
            </View>
            <Text style={styles.factorDescription}>{factor.description}</Text>
            <Text style={styles.factorWeight}>
              Weight: {Math.round(factor.weight * 100)}% of overall risk
            </Text>
          </View>
        ))}

        {}
        {recommendations && recommendations.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Recommended Actions</Text>
            {recommendations.map((rec, index) => (
              <View key={index} style={styles.recommendationCard}>
                <View style={styles.recommendationHeader}>
                  <View style={[styles.priorityBadge, {
                    backgroundColor: rec.priority === 'critical' ? '#FEE2E2' :
                                     rec.priority === 'high' ? '#FED7AA' :
                                     rec.priority === 'medium' ? '#FEF3C7' : '#DBEAFE'
                  }]}>
                    <Text style={[styles.priorityText, {
                      color: rec.priority === 'critical' ? '#991B1B' :
                             rec.priority === 'high' ? '#C2410C' :
                             rec.priority === 'medium' ? '#92400E' : '#1E40AF'
                    }]}>
                      {rec.priority.toUpperCase()}
                    </Text>
                  </View>
                </View>
                <Text style={styles.recommendationAction}>{rec.action}</Text>
                <Text style={styles.recommendationImpact}>
                  <Ionicons name="checkmark-circle" size={14} color="#10B981" /> {rec.impact}
                </Text>
                {rec.cost && rec.cost.min > 0 && (
                  <Text style={styles.recommendationCost}>
                    Estimated Cost: ₹{rec.cost.min.toLocaleString()} - ₹{rec.cost.max.toLocaleString()}
                  </Text>
                )}
              </View>
            ))}
          </>
        )}

        {}
        <TouchableOpacity style={styles.refreshButton} onPress={loadRiskScore}>
          <Ionicons name="refresh" size={20} color={COLORS.white} />
          <Text style={styles.refreshButtonText}>Recalculate Risk</Text>
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
  overallRiskCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: SIZES.lg * 1.5,
    alignItems: 'center',
    marginBottom: 16,
    elevation: 2
  },
  riskScoreCircle: {
    marginBottom: 16
  },
  riskScoreInner: {
    width: 160,
    height: 160,
    borderRadius: 80,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.white
  },
  riskScoreValue: {
    fontSize: 36,
    fontWeight: 'bold',
    marginTop: 8
  },
  riskScoreLabel: {
    fontSize: 14,
    color: COLORS.gray,
    marginTop: 4
  },
  riskLevelBadge: {
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: 20
  },
  riskLevelText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold'
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 12,
    marginTop: 8
  },
  predictionsCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: SIZES.lg,
    marginBottom: 16,
    elevation: 2
  },
  predictionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16
  },
  predictionLabel: {
    width: 100,
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '500'
  },
  predictionBar: {
    flex: 1,
    height: 8,
    backgroundColor: COLORS.lightGray,
    borderRadius: 4,
    overflow: 'hidden',
    marginHorizontal: 12
  },
  predictionFill: {
    height: '100%',
    borderRadius: 4
  },
  predictionValue: {
    width: 45,
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'right'
  },
  predictionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray
  },
  predictionInfoText: {
    marginLeft: 12,
    flex: 1
  },
  predictionInfoLabel: {
    fontSize: 12,
    color: COLORS.gray,
    marginBottom: 4
  },
  predictionInfoValue: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text
  },
  factorCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: SIZES.lg,
    marginBottom: 12,
    elevation: 1
  },
  factorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12
  },
  factorTitleRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  factorCategory: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text
  },
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8
  },
  severityText: {
    fontSize: 10,
    fontWeight: '700'
  },
  factorScore: {
    fontSize: 18,
    fontWeight: 'bold'
  },
  factorBarContainer: {
    marginBottom: 12
  },
  factorBar: {
    height: 8,
    backgroundColor: COLORS.lightGray,
    borderRadius: 4,
    overflow: 'hidden'
  },
  factorFill: {
    height: '100%',
    borderRadius: 4
  },
  factorDescription: {
    fontSize: 14,
    color: COLORS.text,
    marginBottom: 8
  },
  factorWeight: {
    fontSize: 12,
    color: COLORS.gray,
    fontStyle: 'italic'
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
  recommendationImpact: {
    fontSize: 14,
    color: COLORS.gray,
    marginBottom: 8
  },
  recommendationCost: {
    fontSize: 13,
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

export default RiskScoreScreen;

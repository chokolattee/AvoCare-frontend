import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

interface CheckoutStepsProps {
  currentStep: 'shipping' | 'confirm' | 'payment';
}

const STEPS = [
  { key: 'shipping', label: 'Shipping', icon: 'location-outline' as const },
  { key: 'confirm', label: 'Confirm', icon: 'list-outline' as const },
  { key: 'payment', label: 'Payment', icon: 'card-outline' as const },
];

const CheckoutSteps: React.FC<CheckoutStepsProps> = ({ currentStep }) => {
  const currentIndex = STEPS.findIndex((s) => s.key === currentStep);

  return (
    <View style={styles.container}>
      {STEPS.map((step, index) => {
        const isCompleted = index < currentIndex;
        const isActive = index === currentIndex;

        return (
          <React.Fragment key={step.key}>
            {/* Connector line (before each step except first) */}
            {index > 0 && (
              <View
                style={[
                  styles.connector,
                  isCompleted || isActive ? styles.connectorActive : styles.connectorInactive,
                ]}
              />
            )}

            <View style={styles.stepWrap}>
              <View
                style={[
                  styles.stepCircle,
                  isCompleted && styles.stepCircleCompleted,
                  isActive && styles.stepCircleActive,
                  !isCompleted && !isActive && styles.stepCircleInactive,
                ]}
              >
                {isCompleted ? (
                  <Ionicons name="checkmark" size={14} color="#fff" />
                ) : (
                  <Ionicons
                    name={step.icon}
                    size={14}
                    color={isActive ? '#fff' : '#bbb'}
                  />
                )}
              </View>
              <Text
                style={[
                  styles.stepLabel,
                  isActive && styles.stepLabelActive,
                  isCompleted && styles.stepLabelCompleted,
                  !isCompleted && !isActive && styles.stepLabelInactive,
                ]}
              >
                {step.label}
              </Text>
            </View>
          </React.Fragment>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e8f0e0',
  },
  connector: {
    height: 2,
    flex: 1,
    marginTop: 13,
    marginHorizontal: -2,
  },
  connectorActive: {
    backgroundColor: '#7aad4e',
  },
  connectorInactive: {
    backgroundColor: '#ddd',
  },
  stepWrap: {
    alignItems: 'center',
    gap: 4,
  },
  stepCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCircleActive: {
    backgroundColor: '#3d6b22',
  },
  stepCircleCompleted: {
    backgroundColor: '#7aad4e',
  },
  stepCircleInactive: {
    backgroundColor: '#e0e0e0',
  },
  stepLabel: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  stepLabelActive: {
    color: '#3d6b22',
  },
  stepLabelCompleted: {
    color: '#7aad4e',
  },
  stepLabelInactive: {
    color: '#bbb',
  },
});

export default CheckoutSteps;
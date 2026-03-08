import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';

// Import prop type from AppNavigator — fixes TS2322
import type { OrderSuccessProps } from '../../Navigation/AppNavigator';
import { orderSuccessStyles as styles } from '../../Styles/Checkout.styles';

const OrderSuccessScreen: React.FC<OrderSuccessProps> = ({ navigation }) => {
  useEffect(() => {
    navigation.setOptions({ headerShown: false, gestureEnabled: false });
  }, [navigation]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.iconCircle}>
          <Ionicons name="checkmark" size={52} color="#3d6b22" />
        </View>
        <Text style={styles.title}>Order Placed!</Text>
        <Text style={styles.subtitle}>
          Your order has been placed successfully.{'\n'}You'll receive a confirmation shortly.
        </Text>
        <TouchableOpacity
          style={styles.ordersBtn}
            onPress={() => navigation.navigate('ListOrders')}
          activeOpacity={0.85}
        >
          <Ionicons name="list-outline" size={18} color="#fff" />
            <Text style={styles.ordersBtnText}>View My Orders</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.shopBtn}
          onPress={() => navigation.navigate('MainTabs')}
          activeOpacity={0.8}
        >
          <Ionicons name="storefront-outline" size={16} color="#3d6b22" />
          <Text style={styles.shopBtnText}>Continue Shopping</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default OrderSuccessScreen;
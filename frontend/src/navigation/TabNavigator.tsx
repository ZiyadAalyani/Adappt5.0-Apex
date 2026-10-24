import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import HomeScreen from '../screens/HomeScreen';
import AdminScreen from '../screens/AdminScreen';
import AegisBotScreen from '../screens/AegisBotScreen';
import HistoryScreen from '../screens/HistoryScreen';
import SettingsScreen from '../screens/SettingsScreen';
import CyberBot from '../components/CyberBot';
import { Colors } from '../constants/theme';

const Tab = createBottomTabNavigator();

export default function TabNavigator() {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: Colors.accent,
        tabBarInactiveTintColor: 'rgba(255,255,255,0.4)',
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: '#070B14',
          borderTopWidth: 1,
          borderTopColor: 'rgba(255,255,255,0.08)',
          elevation: 10,
          height: 60 + (insets.bottom > 0 ? insets.bottom : 8),
          paddingBottom: insets.bottom > 0 ? insets.bottom : 6,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '700',
          marginTop: 2,
        },
        tabBarIcon: ({ focused, color }) => {
          if (route.name === 'AegisBot') {
            return (
              <View style={[styles.aegisFloatingBtn, focused && styles.aegisFloatingBtnActive]}>
                <CyberBot size={34} mood={focused ? 'scanning' : 'happy'} />
              </View>
            );
          }

          let iconName: keyof typeof Ionicons.glyphMap = 'home';
          if (route.name === 'Home') iconName = focused ? 'shield-checkmark' : 'shield-outline';
          else if (route.name === 'Admin') iconName = focused ? 'hardware-chip' : 'hardware-chip-outline';
          else if (route.name === 'Sentinel') iconName = focused ? 'radio' : 'radio-outline';
          else if (route.name === 'Settings') iconName = focused ? 'settings' : 'settings-outline';

          return (
            <View style={focused ? styles.activeIcon : undefined}>
              <Ionicons name={iconName} size={21} color={color} />
            </View>
          );
        },
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ tabBarLabel: 'Dashboard' }}
      />
      <Tab.Screen
        name="Admin"
        component={AdminScreen}
        options={{
          tabBarLabel: 'Admin Hub',
          tabBarLabelStyle: { fontSize: 10, fontWeight: '700' },
        }}
      />
      <Tab.Screen
        name="AegisBot"
        component={AegisBotScreen}
        options={{
          tabBarLabel: 'SecureBot',
          tabBarLabelStyle: { fontSize: 10, fontWeight: '800', color: Colors.accent },
        }}
      />
      <Tab.Screen
        name="Sentinel"
        component={HistoryScreen}
        options={{ tabBarLabel: 'Sentinel' }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ tabBarLabel: 'Settings' }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  activeIcon: {
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 6,
  },
  aegisFloatingBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#0E172A',
    borderWidth: 1.5,
    borderColor: 'rgba(34,211,238,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -16,
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 8,
  },
  aegisFloatingBtnActive: {
    borderColor: Colors.accent,
    shadowOpacity: 1,
    shadowRadius: 14,
    transform: [{ scale: 1.06 }],
  },
});

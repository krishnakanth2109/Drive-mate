import 'react-native-gesture-handler';
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

// Screens
import SplashScreen from './src/screens/Splash/SplashScreen';
import OnboardingScreen from './src/screens/Onboarding/OnboardingScreen';
import LoginScreen from './src/screens/Authentication/Login';
import RegisterScreen from './src/screens/Authentication/Register';
import OTPVerificationScreen from './src/screens/Authentication/OTPVerification';
import ForgotPasswordScreen from './src/screens/Authentication/ForgotPassword';
import ResetPasswordScreen from './src/screens/Authentication/ResetPassword';
import DrawerNavigator from './src/navigation/DrawerNavigator';
import QuickActionsScreen from './src/screens/MainDashboard/QuickActions';
import HistoryScreen from './src/screens/Orders/OrderHistory';

// Phase 4 - Orders & Tracking
import ActiveOrderScreen from './src/screens/Orders/ActiveOrder';
import OrderDetailsScreen from './src/screens/Orders/OrderDetails';
import PickupNavigationScreen from './src/screens/Navigation/PickupNavigation';
import DropNavigationScreen from './src/screens/Navigation/DropNavigation';
import RouteDetailsScreen from './src/screens/Navigation/RouteDetails';

import OffersScreen from './src/screens/MainDashboard/Offers';
import OfficeScreen from './src/screens/MainDashboard/Office';
import TermsScreen from './src/screens/Support/Terms';
import IncentivesScreen from './src/screens/Earnings/Incentives';

// Driver Profile Screens
import EarningsScreen from './src/screens/Earnings/Earnings';
import TransactionDetailsScreen from './src/screens/Earnings/TransactionDetails';
import DocumentsScreen from './src/screens/Account/Documents';
import VehicleScreen from './src/screens/Account/Vehicle';
import SupportScreen from './src/screens/Support/HelpCenter';
import SettingsScreen from './src/screens/Account/Settings';
import OutstationOptInScreen from './src/screens/MainDashboard/OutstationOptIn';
import WalletScreen from './src/screens/Account/WalletScreen';

// Support Sub-Screens
import RaiseTicketScreen from './src/screens/Support/RaiseTicket';
import FAQsScreen from './src/screens/Support/FAQs';
import ContactSupportScreen from './src/screens/Support/ContactSupport';

// Notifications
import NotificationsScreen from './src/screens/Notifications/Notifications';

// Active Ride Interaction Screens
import ChatScreen from './src/screens/ActiveRide/ChatScreen';
import ContactCustomerScreen from './src/screens/ActiveRide/ContactCustomerScreen';
import CancelRideScreen from './src/screens/ActiveRide/CancelRideScreen';
import RideInfoScreen from './src/screens/ActiveRide/RideInfoScreen';

import { RiderProvider } from './src/context/RiderContext';

const Stack = createStackNavigator();

export default function App() {
  return (
    <RiderProvider>
      <NavigationContainer>
        <StatusBar style="dark" />
        <Stack.Navigator initialRouteName="Splash">
          {/* Auth Screens */}
          <Stack.Screen name="Splash" component={SplashScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Onboarding" component={OnboardingScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Register" component={RegisterScreen} options={{ headerShown: false }} />
          <Stack.Screen name="OTPVerification" component={OTPVerificationScreen} options={{ headerShown: false }} />
          <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} options={{ headerShown: false }} />
          <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} options={{ headerShown: false }} />

          {/* Main App with Drawer and Tabs */}
          <Stack.Screen name="MainTabs" component={DrawerNavigator} options={{ headerShown: false }} />
          <Stack.Screen name="QuickActions" component={QuickActionsScreen} options={{ headerShown: false }} />

          {/* Orders & Tracking Flows */}
          <Stack.Screen name="ActiveOrder" component={ActiveOrderScreen} options={{ headerShown: false }} />
          <Stack.Screen name="OrderDetails" component={OrderDetailsScreen} options={{ headerShown: false }} />
          <Stack.Screen name="PickupNavigation" component={PickupNavigationScreen} options={{ headerShown: false }} />
          <Stack.Screen name="DropNavigation" component={DropNavigationScreen} options={{ headerShown: false }} />
          <Stack.Screen name="RouteDetails" component={RouteDetailsScreen} options={{ headerShown: false }} />

          {/* Profile Sub-Pages */}
          <Stack.Screen name="Earnings" component={EarningsScreen} options={{ title: 'My Earnings' }} />
          <Stack.Screen name="Documents" component={DocumentsScreen} options={{ title: 'Documents & Verification' }} />
          <Stack.Screen name="Vehicle" component={VehicleScreen} options={{ title: 'Vehicle Information' }} />
          <Stack.Screen name="Support" component={SupportScreen} options={{ title: 'Driver Support' }} />
          <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: 'App Settings' }} />
          <Stack.Screen name="Wallet" component={WalletScreen} options={{ headerShown: false }} />

          {/* Active Ride Sub-Pages */}
          <Stack.Screen name="ChatScreen" component={ChatScreen} options={{ headerShown: false }} />
          <Stack.Screen name="ContactCustomer" component={ContactCustomerScreen} options={{ headerShown: false }} />
          <Stack.Screen name="CancelRide" component={CancelRideScreen} options={{ headerShown: false }} />
          <Stack.Screen name="RideInfo" component={RideInfoScreen} options={{ headerShown: false }} />
          
          {/* Outstation Feature */}
          <Stack.Screen name="OutstationOptIn" component={OutstationOptInScreen} options={{ title: 'Outstation Rides' }} />

          {/* Legacy Menu Screens */}
          <Stack.Screen name="History" component={HistoryScreen} options={{ title: 'Your Trips' }} />
          <Stack.Screen name="Offers" component={OffersScreen} options={{ title: 'Offers & Coupons' }} />
          <Stack.Screen name="Incentives" component={IncentivesScreen} options={{ title: 'Rewards' }} />
          <Stack.Screen name="Terms" component={TermsScreen} options={{ title: 'Terms & Conditions' }} />

          {/* Additional Dedicated Screens */}
          <Stack.Screen name="TransactionDetails" component={TransactionDetailsScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ headerShown: false }} />
          <Stack.Screen name="RaiseTicket" component={RaiseTicketScreen} options={{ headerShown: false }} />
          <Stack.Screen name="FAQs" component={FAQsScreen} options={{ headerShown: false }} />
          <Stack.Screen name="ContactSupport" component={ContactSupportScreen} options={{ headerShown: false }} />
        </Stack.Navigator>
      </NavigationContainer>
    </RiderProvider>
  );
}
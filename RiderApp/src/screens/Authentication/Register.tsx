import React from 'react';
import DriverOnboardingWizard from '../Onboarding/DriverOnboardingWizard';

/**
 * RegisterScreen — Complete 7-Step Driver Partner Registration & Verification Wizard
 */
export default function RegisterScreen({ navigation, route }: any) {
  return <DriverOnboardingWizard navigation={navigation} route={route} />;
}

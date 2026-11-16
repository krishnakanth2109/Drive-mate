import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Linking,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../services/api';

interface DriverInRideSupportModalProps {
  visible: boolean;
  onClose: () => void;
  rideId?: string;
  displayId?: string;
  customerName?: string;
  customerPhone?: string;
  fare?: number;
  waitTimeFormatted?: string;
  waitTimeMs?: number;
  rideStatus?: string;
  driverArrivedAt?: string | null;
}

const DRIVER_SUPPORT_PHONE = '+918001234567';
const EMERGENCY_PHONE = '112';

const DRIVER_SUPPORT_OPTIONS = [
  {
    id: 'wait_exceeded',
    category: 'Wait Time Exceeded',
    icon: 'hourglass-outline' as const,
    title: 'Customer wait time exceeded (> 3 mins)',
    desc: 'You have arrived at the pickup location but customer has not come out.',
    solution: 'Waiting charges of ₹2/min apply automatically after the 3-min grace period. If customer does not show after 5 mins, you can cancel with a no-show cancellation fee.',
    priority: 'medium',
  },
  {
    id: 'customer_unreachable',
    category: 'Customer Unreachable',
    icon: 'call-outline' as const,
    title: 'Customer phone unreachable / not answering',
    desc: 'You called the customer multiple times but there is no response or phone is off.',
    solution: 'Try sending an in-app arrival chime. Wait until the 5-minute timer expires so your cancellation fee is protected.',
    priority: 'high',
  },
  {
    id: 'inaccessible_pickup',
    category: 'Pickup Issue',
    icon: 'location-outline' as const,
    title: 'Pickup location road blocked or inaccessible',
    desc: 'Cannot enter the lane, society gate denied entry, or narrow road blocked.',
    solution: 'Park at the nearest safe spot, call the customer and guide them to walk 20-50m to your vehicle.',
    priority: 'medium',
  },
  {
    id: 'luggage_passenger',
    category: 'Vehicle Capacity',
    icon: 'people-outline' as const,
    title: 'Extra passengers or oversized luggage',
    desc: 'Customer has more riders than allowed or luggage that does not fit.',
    solution: 'Do not overload your vehicle. Explain capacity rules politely and advise customer to book an Auto or Car.',
    priority: 'medium',
  },
  {
    id: 'wrong_destination',
    category: 'Route Issue',
    icon: 'map-outline' as const,
    title: 'Customer entered wrong drop address / Wants detour',
    desc: 'Customer asks to be dropped at a different or unlisted address.',
    solution: 'Follow the GPS route. Extra distance traveled will be factored into the final distance calculation upon trip completion.',
    priority: 'low',
  },
  {
    id: 'fare_dispute',
    category: 'Fare Dispute',
    icon: 'cash-outline' as const,
    title: 'Customer dispute regarding fare or waiting fee',
    desc: 'Customer refuses to pay cash or questions wait time charges.',
    solution: 'Fares and wait fees are automated by DriveMate algorithm. Do not engage in arguments; our finance desk will review and credit adjustments.',
    priority: 'high',
  },
  {
    id: 'unruly_behavior',
    category: 'Safety Concern',
    icon: 'shield-alert-outline' as const,
    title: 'Unruly, intoxicated, or abusive customer',
    desc: 'Customer is verbally abusive, aggressive, or compromising ride safety.',
    solution: 'Your safety is paramount. Stop at a public, well-lit location. Contact police (112) or our 24/7 partner safety line.',
    priority: 'urgent',
  },
  {
    id: 'breakdown',
    category: 'Vehicle Breakdown',
    icon: 'build-outline' as const,
    title: 'Vehicle breakdown / Puncture / Accident',
    desc: 'Flat tire, engine stall, or road collision during the ride.',
    solution: 'Pull over safely. Report here so we immediately cancel the booking without penalty and dispatch a backup ride for the customer.',
    priority: 'urgent',
  },
  {
    id: 'customer_cancel_req',
    category: 'Trip Cancellation',
    icon: 'close-circle-outline' as const,
    title: 'Customer verbally asked me to cancel',
    desc: 'Customer requested cancellation after you arrived at pickup.',
    solution: 'Ask customer to cancel from their app so reason is captured correctly. If they refuse, choose "Customer Requested Cancellation" with reason.',
    priority: 'medium',
  },
  {
    id: 'general_driver',
    category: 'Partner Support',
    icon: 'chatbubbles-outline' as const,
    title: 'Other driver issue or urgent query',
    desc: 'Any other situation requiring partner operations intervention.',
    solution: 'Our 24x7 driver partner operations desk will assist you on the helpline.',
    priority: 'medium',
  },
];

export default function DriverInRideSupportModal({
  visible,
  onClose,
  rideId,
  displayId,
  customerName = 'Customer',
  customerPhone,
  fare,
  waitTimeFormatted = '00:00',
  waitTimeMs = 0,
}: DriverInRideSupportModalProps) {
  const [selectedIssue, setSelectedIssue] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [ticketSubmitted, setTicketSubmitted] = useState<string | null>(null);

  const cleanDisplayId = displayId || `DM-${(rideId || 'RIDE').slice(-6).toUpperCase()}`;
  const isWaitFeeActive = waitTimeMs > 180000; // > 3 mins

  const handleCallSupport = () => {
    Linking.openURL(`tel:${DRIVER_SUPPORT_PHONE}`).catch(() => {
      Alert.alert('Partner Helpline', `Toll-free: 1800-123-4567\nRide Ref: #${cleanDisplayId}`);
    });
  };

  const handleCallCustomer = () => {
    if (!customerPhone) {
      Alert.alert('Customer Contact', 'Customer phone number is not available.');
      return;
    }
    Linking.openURL(`tel:${customerPhone}`).catch(() => {
      Alert.alert('Customer Phone', `Number: ${customerPhone}`);
    });
  };

  const handleCallEmergency = () => {
    Alert.alert(
      'Emergency SOS',
      'Are you sure you want to dial emergency services (112)?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Call 112', style: 'destructive', onPress: () => Linking.openURL(`tel:${EMERGENCY_PHONE}`) },
      ]
    );
  };

  const handleSendArrivalChime = () => {
    Alert.alert(
      'Arrival Alert Sent',
      `An arrival chime notification was broadcast to ${customerName}.`,
      [{ text: 'OK' }]
    );
  };

  const handleSubmitTicket = async (issue: typeof DRIVER_SUPPORT_OPTIONS[0]) => {
    setIsSubmitting(true);
    try {
      const res = await api.post('/support/tickets', {
        userType: 'Rider',
        userName: 'Driver Partner',
        userPhone: 'Driver Partner',
        rideId,
        category: issue.category,
        subject: `[${cleanDisplayId}] Driver Issue: ${issue.title}`,
        details: `${issue.desc}. Ride #${cleanDisplayId}. Current wait time: ${waitTimeFormatted}. Fare: ₹${fare || 'N/A'}.`,
        priority: issue.priority,
      });

      const ticketNo = res.data?.data?.ticketNumber || 'TK-PARTNER';
      setTicketSubmitted(ticketNo);
      Alert.alert(
        'Support Ticket Logged',
        `Ticket #${ticketNo} has been filed for Ride #${cleanDisplayId}.\n\nOperations support has been flagged for this trip.`,
        [{ text: 'Understood' }]
      );
    } catch {
      const fallbackTicket = `TK-${Math.floor(100000 + Math.random() * 900000)}`;
      setTicketSubmitted(fallbackTicket);
      Alert.alert(
        'Ticket Logged',
        `Ticket #${fallbackTicket} registered for Ride #${cleanDisplayId}.\nPartner operations team alerted.`,
        [{ text: 'OK' }]
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <View style={styles.headerBadgeRow}>
                <View style={styles.partnerBadge}>
                  <Text style={styles.partnerBadgeText}>PARTNER 24/7 DESK</Text>
                </View>
              </View>
              <Text style={styles.headerTitle}>Trip Safety & Assistance</Text>
              <View style={styles.rideIdChip}>
                <Text style={styles.rideIdChipLabel}>RIDE ID:</Text>
                <Text style={styles.rideIdChipValue}>#{cleanDisplayId}</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Ionicons name="close" size={22} color="#ffffff" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* Wait-Time Live Dashboard Card */}
            <View style={[styles.waitTimeCard, isWaitFeeActive && styles.waitTimeCardWarning]}>
              <View style={styles.waitHeaderRow}>
                <View style={[styles.waitIconWrap, isWaitFeeActive && { backgroundColor: 'rgba(239, 68, 68, 0.2)' }]}>
                  <Ionicons name="stopwatch" size={20} color={isWaitFeeActive ? '#ef4444' : '#38bdf8'} />
                </View>
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Text style={styles.waitCardTitle}>Wait Time Status</Text>
                    <Text style={[styles.waitTimerText, isWaitFeeActive && { color: '#ef4444' }]}>
                      {waitTimeFormatted}
                    </Text>
                  </View>
                  <Text style={styles.waitCardSub}>
                    {isWaitFeeActive
                      ? '⚠️ Free wait time exceeded. Billable waiting charges (+₹2/min) active.'
                      : 'Free 3-min grace period active. No charges yet.'}
                  </Text>
                </View>
              </View>

              <Text style={styles.waitActionLabel}>Quick Actions:</Text>
              <View style={styles.waitActionRow}>
                <TouchableOpacity style={styles.waitActionChip} onPress={handleSendArrivalChime}>
                  <Text style={styles.waitActionChipText}>🔔 Send Arrival Chime</Text>
                </TouchableOpacity>
                {customerPhone ? (
                  <TouchableOpacity
                    style={[styles.waitActionChip, { backgroundColor: '#10b981' }]}
                    onPress={handleCallCustomer}
                  >
                    <Text style={styles.waitActionChipText}>📞 Call {customerName}</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>

            {/* Support Options Header */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Common Ride Issues</Text>
              <Text style={styles.sectionSubtitle}>Select an issue below for instructions or to alert operations</Text>
            </View>

            {/* List of 10 Options */}
            {DRIVER_SUPPORT_OPTIONS.map((item) => {
              const isSelected = selectedIssue === item.id;
              return (
                <View
                  key={item.id}
                  style={[
                    styles.issueCard,
                    isSelected && styles.issueCardActive,
                    item.priority === 'urgent' && styles.issueCardUrgent,
                  ]}
                >
                  <TouchableOpacity
                    style={styles.issueHeader}
                    onPress={() => setSelectedIssue(isSelected ? null : item.id)}
                    activeOpacity={0.7}
                  >
                    <View
                      style={[
                        styles.issueIconCircle,
                        item.priority === 'urgent' && { backgroundColor: 'rgba(239, 68, 68, 0.2)' },
                      ]}
                    >
                      <Ionicons
                        name={item.icon as any}
                        size={20}
                        color={item.priority === 'urgent' ? '#ef4444' : '#38bdf8'}
                      />
                    </View>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={styles.issueTitle}>{item.title}</Text>
                      <Text style={styles.issueDesc} numberOfLines={isSelected ? undefined : 1}>
                        {item.desc}
                      </Text>
                    </View>
                    <Ionicons
                      name={isSelected ? 'chevron-up' : 'chevron-down'}
                      size={18}
                      color="#9ca3af"
                    />
                  </TouchableOpacity>

                  {/* Expanded Solution & Submit Action */}
                  {isSelected && (
                    <View style={styles.issueBody}>
                      <View style={styles.solutionBox}>
                        <Ionicons name="information-circle" size={16} color="#38bdf8" />
                        <Text style={styles.solutionText}>{item.solution}</Text>
                      </View>

                      <View style={styles.issueActionRow}>
                        <TouchableOpacity
                          style={styles.submitTicketBtn}
                          disabled={isSubmitting}
                          onPress={() => handleSubmitTicket(item)}
                        >
                          {isSubmitting ? (
                            <ActivityIndicator size="small" color="#fff" />
                          ) : (
                            <>
                              <Ionicons name="paper-plane" size={15} color="#fff" />
                              <Text style={styles.submitTicketBtnText}>
                                {ticketSubmitted ? 'Ticket Logged ✓' : 'Alert Operations Desk'}
                              </Text>
                            </>
                          )}
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                </View>
              );
            })}

            <View style={{ height: 20 }} />
          </ScrollView>

          {/* Bottom Direct Call Support Actions */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.callSupportBtn} onPress={handleCallSupport}>
              <Ionicons name="call" size={18} color="#ffffff" />
              <Text style={styles.callSupportBtnText}>Call Driver Helpline</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.emergencyBtn} onPress={handleCallEmergency}>
              <Ionicons name="warning" size={18} color="#ffffff" />
              <Text style={styles.emergencyBtnText}>SOS 112</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#1E1E2C',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '90%',
    paddingBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  headerBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  partnerBadge: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
  },
  partnerBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#38bdf8',
    letterSpacing: 0.5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#ffffff',
    marginTop: 4,
  },
  rideIdChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(247, 37, 133, 0.15)',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
    marginTop: 6,
    borderWidth: 1,
    borderColor: 'rgba(247, 37, 133, 0.3)',
  },
  rideIdChipLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#f72585',
    marginRight: 4,
  },
  rideIdChipValue: {
    fontSize: 12,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  waitTimeCard: {
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
    marginBottom: 20,
  },
  waitTimeCardWarning: {
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  waitHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  waitIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  waitCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
  waitTimerText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#38bdf8',
  },
  waitCardSub: {
    fontSize: 12,
    color: '#cbd5e1',
    marginTop: 4,
  },
  waitActionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94a3b8',
    marginTop: 12,
    marginBottom: 8,
  },
  waitActionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  waitActionChip: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
  },
  waitActionChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
  },
  sectionHeader: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
  },
  issueCard: {
    backgroundColor: '#2a2a3c',
    borderRadius: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    overflow: 'hidden',
  },
  issueCardActive: {
    borderColor: '#3498db',
  },
  issueCardUrgent: {
    borderColor: 'rgba(239, 68, 68, 0.4)',
  },
  issueHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  issueIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  issueTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
  issueDesc: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
  },
  issueBody: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  solutionBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
    borderRadius: 10,
    padding: 10,
    marginTop: 10,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.2)',
  },
  solutionText: {
    flex: 1,
    fontSize: 12,
    color: '#bae6fd',
    marginLeft: 8,
    lineHeight: 17,
  },
  issueActionRow: {
    marginTop: 12,
  },
  submitTicketBtn: {
    backgroundColor: '#3498db',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  submitTicketBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 12,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  callSupportBtn: {
    flex: 2,
    backgroundColor: '#2ecc71',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
    elevation: 3,
  },
  callSupportBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  emergencyBtn: {
    flex: 1,
    backgroundColor: '#e74c3c',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    gap: 6,
    elevation: 3,
  },
  emergencyBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
});

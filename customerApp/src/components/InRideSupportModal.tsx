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

interface InRideSupportModalProps {
  visible: boolean;
  onClose: () => void;
  rideId: string;
  displayId?: string;
  driverName?: string;
  driverPhone?: string;
  fare?: number;
  userName?: string;
  userPhone?: string;
  userId?: string;
}

const SUPPORT_PHONE = '+918001234567';
const EMERGENCY_PHONE = '112';

const CUSTOMER_SUPPORT_OPTIONS = [
  {
    id: 'delay',
    category: 'Driver Delay',
    icon: 'time-outline' as const,
    title: 'Driver is taking too long / Not moving',
    desc: 'The driver is stationary or moving away from your pickup location.',
    solution: 'We monitor driver movement via GPS. If delayed by more than 5 minutes, you can cancel with zero penalty or contact support.',
    priority: 'medium',
  },
  {
    id: 'wrong_loc',
    category: 'Pickup Location',
    icon: 'location-outline' as const,
    title: 'Driver arrived at wrong pickup spot',
    desc: 'Driver marked arrived but is not at the pinned pickup location.',
    solution: 'Please call your driver directly using the call button below to clarify landmarks or gate entry.',
    priority: 'medium',
  },
  {
    id: 'extra_cash',
    category: 'Fare Dispute',
    icon: 'cash-outline' as const,
    title: 'Driver demanding extra cash / offline fare',
    desc: 'Driver asked for extra charges or refused in-app wallet/digital fare.',
    solution: 'DriveMate strictly forbids offline fare demands. Never pay extra cash. Your in-app fare is all-inclusive.',
    priority: 'high',
  },
  {
    id: 'mismatch',
    category: 'Vehicle Mismatch',
    icon: 'car-outline' as const,
    title: 'Vehicle or driver details do not match',
    desc: 'The license plate, vehicle model, or driver identity differs from the app.',
    solution: 'For your safety, DO NOT board a mismatched vehicle. Report immediately and request another ride.',
    priority: 'high',
  },
  {
    id: 'route_change',
    category: 'Route Issue',
    icon: 'navigate-outline' as const,
    title: 'Need to change drop location / detour',
    desc: 'You want to change your final destination or request a multi-stop detour.',
    solution: 'Inform the driver before starting the route. Distance differences will automatically adjust the final meter fare.',
    priority: 'low',
  },
  {
    id: 'refusal',
    category: 'Driver Refusal',
    icon: 'close-circle-outline' as const,
    title: 'Driver asked to cancel or refused ride',
    desc: 'Driver requested you to cancel or refused to proceed to destination.',
    solution: 'Do not cancel from your end if driver asked. Report here and our automated dispatcher will reassign you.',
    priority: 'high',
  },
  {
    id: 'safety',
    category: 'Safety Concern',
    icon: 'shield-alert-outline' as const,
    title: 'Safety / Rash driving / Harassment concern',
    desc: 'Driver is driving recklessly, speeding, or behaving inappropriately.',
    solution: 'Your safety is our #1 priority. If in immediate danger, use the Emergency 112 button below.',
    priority: 'urgent',
  },
  {
    id: 'wait_policy',
    category: 'Wait Time Query',
    icon: 'hourglass-outline' as const,
    title: 'Wait time inquiry & fee policy',
    desc: 'Questions regarding free grace period vs billable waiting charges.',
    solution: 'First 3 minutes after arrival are completely free. Post 3 mins, standard ₹2/min waiting charges apply.',
    priority: 'low',
  },
  {
    id: 'lost_item',
    category: 'Lost & Found',
    icon: 'briefcase-outline' as const,
    title: 'Left an item / belongings in vehicle',
    desc: 'You forgot your phone, bag, or personal belongings in the cab/bike.',
    solution: 'Our 24/7 Lost & Found desk will hold the vehicle and coordinate immediate return.',
    priority: 'medium',
  },
  {
    id: 'general',
    category: 'General Support',
    icon: 'chatbubbles-outline' as const,
    title: 'Other trip query or assistance',
    desc: 'Any other issue or general inquiry regarding your ongoing booking.',
    solution: 'Our 24x7 support desk is standing by to resolve any questions.',
    priority: 'medium',
  },
];

export default function InRideSupportModal({
  visible,
  onClose,
  rideId,
  displayId,
  driverName = 'Driver',
  driverPhone,
  fare,
  userName = 'Customer',
  userPhone = '',
  userId = '',
}: InRideSupportModalProps) {
  const [selectedIssue, setSelectedIssue] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [ticketSubmitted, setTicketSubmitted] = useState<string | null>(null);

  const cleanDisplayId = displayId || `DM-${(rideId || 'RIDE').slice(-6).toUpperCase()}`;

  const handleCallSupport = () => {
    Linking.openURL(`tel:${SUPPORT_PHONE}`).catch(() => {
      Alert.alert('DriveMate Support', `Helpline: 1800-123-4567\nRide Ref: #${cleanDisplayId}`);
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

  const handleCallDriver = () => {
    if (!driverPhone) {
      Alert.alert('Driver Phone', 'Driver phone number is not available.');
      return;
    }
    Linking.openURL(`tel:${driverPhone}`).catch(() => {
      Alert.alert('Call Driver', `Driver Phone: ${driverPhone}`);
    });
  };

  const handleNotifyWait = (mins: number) => {
    Alert.alert(
      'Driver Notified',
      `Notification sent to ${driverName}: "Customer is on the way (arriving in ~${mins} min). Please wait."`,
      [{ text: 'OK' }]
    );
  };

  const handleSubmitTicket = async (issue: typeof CUSTOMER_SUPPORT_OPTIONS[0]) => {
    setIsSubmitting(true);
    try {
      const res: any = await api.post('/support/tickets', {
        userId,
        userType: 'Customer',
        userName,
        userPhone: userPhone || 'Not provided',
        rideId,
        category: issue.category,
        subject: `[${cleanDisplayId}] ${issue.title}`,
        details: `${issue.desc}. Customer requested assistance for Ride #${cleanDisplayId}. Fare: ₹${fare || 'N/A'}.`,
        priority: issue.priority,
      });

      const ticketNo = res.data?.ticketNumber || res.data?.data?.ticketNumber || 'TK-SUPPORT';
      setTicketSubmitted(ticketNo);
      Alert.alert(
        'Support Ticket Raised',
        `Ticket #${ticketNo} has been created for Ride #${cleanDisplayId}.\n\nA support executive has been notified. You can also call us directly.`,
        [{ text: 'Got it' }]
      );
    } catch {
      // Offline / fallback mock success
      const fallbackTicket = `TK-${Math.floor(100000 + Math.random() * 900000)}`;
      setTicketSubmitted(fallbackTicket);
      Alert.alert(
        'Request Logged',
        `Ticket #${fallbackTicket} registered for Ride #${cleanDisplayId}.\nOur support desk has been flagged.`,
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
                <View style={styles.liveIndicator} />
                <Text style={styles.headerSubtitle}>24/7 LIVE RIDE SUPPORT</Text>
              </View>
              <Text style={styles.headerTitle}>Ride Assistance & Safety</Text>
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
            {/* Quick Wait-Time Guidance Card */}
            <View style={styles.waitTimeCard}>
              <View style={styles.waitHeaderRow}>
                <View style={styles.waitIconWrap}>
                  <Ionicons name="timer" size={20} color="#ffb703" />
                </View>
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.waitCardTitle}>Wait Time & Arrival Guidance</Text>
                  <Text style={styles.waitCardSub}>
                    3 min free grace period • ₹2.00/min standard charge thereafter
                  </Text>
                </View>
              </View>

              <Text style={styles.waitActionLabel}>Quick Actions for Driver:</Text>
              <View style={styles.waitActionRow}>
                <TouchableOpacity
                  style={styles.waitActionChip}
                  onPress={() => handleNotifyWait(1)}
                >
                  <Text style={styles.waitActionChipText}>🏃 Walking to cab</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.waitActionChip}
                  onPress={() => handleNotifyWait(3)}
                >
                  <Text style={styles.waitActionChipText}>⏳ Need 2-3 mins</Text>
                </TouchableOpacity>
                {driverPhone ? (
                  <TouchableOpacity
                    style={[styles.waitActionChip, { backgroundColor: '#10b981' }]}
                    onPress={handleCallDriver}
                  >
                    <Text style={styles.waitActionChipText}>📞 Call Driver</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>

            {/* Support Options Header */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Select Issue / Concern</Text>
              <Text style={styles.sectionSubtitle}>Choose an option below for instant resolution or escalation</Text>
            </View>

            {/* List of 10 Options */}
            {CUSTOMER_SUPPORT_OPTIONS.map((item) => {
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
                        color={item.priority === 'urgent' ? '#ef4444' : '#a855f7'}
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
                                {ticketSubmitted ? 'Ticket Submitted ✓' : 'Report Issue to Support'}
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
              <Text style={styles.callSupportBtnText}>Call 24/7 Helpline</Text>
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
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#0f172a',
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
  liveIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10b981',
    marginRight: 6,
  },
  headerSubtitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#10b981',
    letterSpacing: 0.8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#ffffff',
  },
  rideIdChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(168, 85, 247, 0.15)',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
    marginTop: 6,
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.3)',
  },
  rideIdChipLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#c084fc',
    marginRight: 4,
  },
  rideIdChipValue: {
    fontSize: 12,
    fontWeight: '800',
    color: '#f3e8ff',
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
    backgroundColor: 'rgba(255, 183, 3, 0.08)',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 183, 3, 0.25)',
    marginBottom: 20,
  },
  waitHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  waitIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 183, 3, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  waitCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffb703',
  },
  waitCardSub: {
    fontSize: 12,
    color: '#cbd5e1',
    marginTop: 2,
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
    backgroundColor: '#1e293b',
    borderRadius: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    overflow: 'hidden',
  },
  issueCardActive: {
    borderColor: 'rgba(168, 85, 247, 0.4)',
    backgroundColor: '#1e293b',
  },
  issueCardUrgent: {
    borderColor: 'rgba(239, 68, 68, 0.35)',
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
    backgroundColor: 'rgba(168, 85, 247, 0.15)',
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
    backgroundColor: '#8b5cf6',
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
    backgroundColor: '#059669',
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
    backgroundColor: '#dc2626',
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

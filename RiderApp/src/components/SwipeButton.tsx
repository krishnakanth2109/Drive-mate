import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, Animated, PanResponder, Dimensions } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

const SCREEN_WIDTH = Dimensions.get('window').width;
const BUTTON_WIDTH = SCREEN_WIDTH - 40; // 20 padding on each side
const THUMB_SIZE = 50;
const MAX_DRAG = BUTTON_WIDTH - THUMB_SIZE - 10; // 5px padding on edges

interface SwipeButtonProps {
  onSwipeSuccess: () => void;
  title: string;
  buttonColor?: string;
}

const SwipeButton: React.FC<SwipeButtonProps> = ({ onSwipeSuccess, title, buttonColor = '#000' }) => {
  const pan = useRef(new Animated.ValueXY()).current;
  const [swipeCompleted, setSwipeCompleted] = useState(false);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !swipeCompleted,
      onMoveShouldSetPanResponder: () => !swipeCompleted,
      onPanResponderMove: (_, gestureState) => {
        if (swipeCompleted) return;
        // Restrict drag to X-axis and between 0 and MAX_DRAG
        const newX = Math.max(0, Math.min(gestureState.dx, MAX_DRAG));
        pan.setValue({ x: newX, y: 0 });
      },
      onPanResponderRelease: (_, gestureState) => {
        if (swipeCompleted) return;
        
        // If dragged more than 80% of max drag, trigger success
        if (gestureState.dx > MAX_DRAG * 0.8) {
          setSwipeCompleted(true);
          Animated.spring(pan, {
            toValue: { x: MAX_DRAG, y: 0 },
            useNativeDriver: false,
          }).start(() => {
            onSwipeSuccess();
          });
        } else {
          // Snap back to start
          Animated.spring(pan, {
            toValue: { x: 0, y: 0 },
            friction: 5,
            useNativeDriver: false,
          }).start();
        }
      },
    })
  ).current;

  return (
    <View style={[styles.container, { backgroundColor: swipeCompleted ? '#2ecc71' : buttonColor }]}>
      <Text style={styles.title}>{swipeCompleted ? 'Done' : title}</Text>
      
      <Animated.View
        style={[
          styles.thumb,
          {
            transform: [{ translateX: pan.x }],
          },
        ]}
        {...panResponder.panHandlers}
      >
        <MaterialIcons name="keyboard-arrow-right" size={30} color={swipeCompleted ? '#2ecc71' : buttonColor} />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 60,
    width: BUTTON_WIDTH,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginTop: 15,
  },
  title: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  thumb: {
    height: THUMB_SIZE,
    width: THUMB_SIZE,
    borderRadius: 25,
    backgroundColor: '#fff',
    position: 'absolute',
    left: 5,
    top: 5,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 2 },
  },
});

export default SwipeButton;

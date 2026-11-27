import { safeGet, socket, connectSocket } from '../../../services/api';

export const trackingService = {
  getActiveRide: () => safeGet<any | null>('/ride/customer/active'),
  getRideDetails: (rideId: string) => safeGet<any>(`/ride/${rideId}`),
  subscribeToRide: async (
    rideId: string,
    handlers: {
      onLocation?: (loc: { latitude: number; longitude: number; heading?: number }) => void;
      onStatusChange?: (payload: any) => void;
    }
  ) => {
    await connectSocket();
    socket.emit('join_ride', rideId);

    const handleLocation = (data: any) => {
      if (data?.lat !== undefined && data?.lng !== undefined && handlers.onLocation) {
        handlers.onLocation({
          latitude: Number(data.lat),
          longitude: Number(data.lng),
          heading: data.heading,
        });
      }
    };
    const handleStatus = (data: any) => {
      if (handlers.onStatusChange) handlers.onStatusChange(data);
    };

    socket.on('driver_location_update', handleLocation);
    socket.on('ride_status_update', handleStatus);
    socket.on('ride_accepted', handleStatus);
    socket.on('ride_cancelled', handleStatus);

    return () => {
      socket.off('driver_location_update', handleLocation);
      socket.off('ride_status_update', handleStatus);
      socket.off('ride_accepted', handleStatus);
      socket.off('ride_cancelled', handleStatus);
    };
  },
};

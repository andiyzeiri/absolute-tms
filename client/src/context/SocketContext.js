import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const { token } = useAuth();
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [vehicles, setVehicles] = useState([]);
  const [trips, setTrips] = useState([]);

  useEffect(() => {
    if (token) {
      const newSocket = io('http://localhost:5000', {
        auth: { token }
      });

      newSocket.on('connect', () => {
        console.log('Connected to server');
        setConnected(true);
      });

      newSocket.on('disconnect', () => {
        console.log('Disconnected from server');
        setConnected(false);
      });

      // Listen for initial data
      newSocket.on('initialData', (data) => {
        setVehicles(data.vehicles);
        setTrips(data.trips);
      });

      // Listen for real-time location updates
      newSocket.on('locationUpdate', (data) => {
        setVehicles(prev => prev.map(vehicle => 
          vehicle._id === data.vehicleId 
            ? { ...vehicle, currentLocation: { lat: data.lat, lng: data.lng, timestamp: data.timestamp } }
            : vehicle
        ));
      });

      // Listen for trip updates
      newSocket.on('tripCreated', (trip) => {
        setTrips(prev => [...prev, trip]);
      });

      newSocket.on('tripUpdated', (updatedTrip) => {
        setTrips(prev => prev.map(trip => 
          trip._id === updatedTrip._id ? updatedTrip : trip
        ));
      });

      setSocket(newSocket);

      return () => {
        newSocket.close();
      };
    }
  }, [token]);

  const emitLocationUpdate = (vehicleId, lat, lng) => {
    if (socket && connected) {
      socket.emit('locationUpdate', { vehicleId, lat, lng });
    }
  };

  const value = {
    socket,
    connected,
    vehicles,
    trips,
    emitLocationUpdate,
    setVehicles,
    setTrips
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};
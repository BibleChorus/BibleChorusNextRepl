import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

// Define the shape of a notification
interface Notification {
  id: string;
  message: string;
  // Add other properties as needed
}

const NotificationContext = createContext<Notification[]>([]);

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    // Initialize WebSocket connection
    const socket = new WebSocket('ws://your-api-endpoint/notifications');

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data) as Notification;
      setNotifications((prev) => [...prev, data]);
    };

    return () => {
      socket.close();
    };
  }, []);

  return (
    <NotificationContext.Provider value={notifications}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationContext);

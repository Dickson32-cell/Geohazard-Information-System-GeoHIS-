import React, { createContext, useContext, useCallback } from 'react';

const UpdateContext = createContext();

export const useUpdate = () => {
  const context = useContext(UpdateContext);
  if (!context) {
    throw new Error('useUpdate must be used within an UpdateProvider');
  }
  return context;
};

export const UpdateProvider = ({ children }) => {
  // Store listeners for different update types
  const listenersRef = React.useRef({
    profile: [],
    projects: [],
    services: [],
    all: []
  });

  const subscribe = useCallback((updateType, callback) => {
    if (!listenersRef.current[updateType]) {
      listenersRef.current[updateType] = [];
    }
    listenersRef.current[updateType].push(callback);

    // Return unsubscribe function
    return () => {
      listenersRef.current[updateType] = listenersRef.current[updateType].filter(
        (cb) => cb !== callback
      );
    };
  }, []);

  const notify = useCallback((updateType, data) => {
    if (listenersRef.current[updateType]) {
      listenersRef.current[updateType].forEach((callback) => callback(data));
    }
    // Also notify 'all' listeners
    if (updateType !== 'all' && listenersRef.current.all) {
      listenersRef.current.all.forEach((callback) => callback({ type: updateType, data }));
    }
  }, []);

  const value = {
    subscribe,
    notify
  };

  return (
    <UpdateContext.Provider value={value}>
      {children}
    </UpdateContext.Provider>
  );
};

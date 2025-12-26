/* eslint-disable react/prop-types */
import { createContext, useContext } from "react";
import { useAuth } from "../../Contexts/AuthContext";

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const { user, profile, isLoggedIn } = useAuth();

  // Combine user and profile data for backward compatibility
  const userData = user && profile ? {
    name: profile.name,
    email: user.email,
    role: profile.role,
    id: user.id,
    created_at: profile.created_at
  } : null;

  const loading = !isLoggedIn && !user;

  return (
    <UserContext.Provider value={{ userData, loading, user, profile }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);

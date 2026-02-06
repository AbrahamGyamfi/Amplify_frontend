import { useState, useEffect } from 'react';
import { Auth } from 'aws-amplify';

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState('Member');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    checkUser();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkUser = async () => {
    try {
      setLoading(true);
      const currentUser = await Auth.currentAuthenticatedUser();
      setUser(currentUser);
      
      // Get role from Cognito groups or custom attribute
      const session = await Auth.currentSession();
      const groups = session.getIdToken().payload['cognito:groups'] || [];
      
      // Check if user is in Admin group
      if (groups.includes('Admin')) {
        setUserRole('Admin');
      } else {
        // Fallback to custom attribute
        const role = currentUser.attributes['custom:role'] || 'Member';
        setUserRole(role);
      }
      
      return currentUser;
    } catch (error) {
      console.log('No user signed in');
      setError('Please sign in to continue');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await Auth.signOut();
      setUser(null);
      setUserRole('Member');
    } catch (error) {
      console.error('Error signing out:', error);
      setError('Failed to sign out');
    }
  };

  return {
    user,
    userRole,
    loading,
    error,
    setError,
    checkUser,
    handleSignOut
  };
};

import { useState, useEffect } from 'react';
import { Auth } from 'aws-amplify';

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState('member');
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
      
      // Get role based on email domain to match Lambda logic
      const email = currentUser.attributes?.email || '';
      
      // Check email domain (matches Lambda post-confirmation.js logic)
      if (email.toLowerCase().includes('@amalitech.com')) {
        setUserRole('admin');
      } else if (email.toLowerCase().includes('@amalitechtraining.org')) {
        setUserRole('member');
      } else {
        // Fallback to cognito groups or custom attribute
        const session = await Auth.currentSession();
        const groups = session.getIdToken().payload['cognito:groups'] || [];
        const role = groups.includes('Admin') ? 'admin' : (currentUser.attributes['custom:role'] || 'member');
        setUserRole(role.toLowerCase());
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
      setUserRole('member');
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

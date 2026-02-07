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
      
      // Get role from Cognito groups in the JWT token
      const session = await Auth.currentSession();
      const idToken = session.getIdToken();
      const groups = idToken.payload['cognito:groups'] || [];
      
      // Check if user is in admin or member group
      if (groups.includes('admin')) {
        setUserRole('admin');
      } else if (groups.includes('member')) {
        setUserRole('member');
      } else {
        // Fallback to email domain check for users without groups
        const email = currentUser.attributes?.email || '';
        if (email.toLowerCase().includes('@amalitech.com')) {
          setUserRole('admin');
        } else {
          setUserRole('member');
        }
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

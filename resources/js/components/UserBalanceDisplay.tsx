import { useState, useEffect } from 'react';
import axios from 'axios';

interface UserBalanceDisplayProps {
  email: string;
}

const UserBalanceDisplay = ({ email }: UserBalanceDisplayProps) => {
  const [balance, setBalance] = useState('0.00');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBalance = async () => {
      try {
        const response = await axios.get(`/user-balance?email=${encodeURIComponent(email)}`);
        setBalance(parseFloat(response.data.balance || '0').toFixed(2));
      } catch (error) {
        console.error('Error fetching balance:', error);
        setBalance('0.00');
      } finally {
        setLoading(false);
      }
    };

    if (email) {
      fetchBalance();
    }
  }, [email]);

  return loading ? '...' : balance;
};

export default UserBalanceDisplay;
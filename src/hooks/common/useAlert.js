import { useState, useCallback } from 'react';

export const useAlert = () => {
  const [alert, setAlert] = useState({
    open: false,
    type: 'info', // success | error | warning | info
    title: '',
    message: '',
    onConfirm: null
  });

  const showAlert = useCallback(
    ({ type = 'info', title = '', message = '', onConfirm = null }) => {
      setAlert({
        open: true,
        type,
        title,
        message,
        onConfirm
      });
    },
    []
  );

  const closeAlert = useCallback(() => {
    setAlert(prev => ({ ...prev, open: false }));
  }, []);

  return {
    alert,
    showAlert,
    closeAlert
  };
};

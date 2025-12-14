import { useCallback, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import LoginRequiredModal from '../../components/common/LoginRequiredModal';

export function useLoginRequiredModal(defaultMessage) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const openLoginRequired = useCallback(() => {
    setOpen(true);
  }, []);

  const handleClose = useCallback(() => {
    setOpen(false);
  }, []);

  const handleConfirm = useCallback(() => {
    setOpen(false);
    navigate('/login', { state: { from: location.pathname + location.search } });
  }, [navigate, location.pathname, location.search]);

  const LoginRequiredModalElement = useMemo(
    () => (
      <LoginRequiredModal
        open={open}
        onClose={handleClose}
        onConfirm={handleConfirm}
        message={defaultMessage}
      />
    ),
    [open, handleClose, handleConfirm, defaultMessage]
  );

  return { openLoginRequired, LoginRequiredModalElement };
}

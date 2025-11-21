// src/pages/payment/PaymentSuccess.jsx

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8090/payments';

function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const paymentKey = searchParams.get('paymentKey');
  const orderId = searchParams.get('orderId');
  const amount = searchParams.get('amount');

  const [status, setStatus] = useState('결제 승인 처리 중...');
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (!paymentKey || !orderId || !amount) {
      setStatus('필수 결제 정보(paymentKey, orderId, amount)가 누락되었습니다.');
      setIsSuccess(false);
      return;
    }

    const confirmPayment = async () => {
      try {
        // ✅ JSON Body 로 전송 → 백엔드 @RequestBody 와 일치
        const response = await axios.post(
          `${API_BASE_URL}/confirm`,
          {
            paymentKey: paymentKey,
            orderId: orderId,
            amount: amount,
          }
        );

        if (response.status === 200 && response.data?.status === 'DONE') {
          setStatus(
            `✅ 결제가 성공적으로 완료되었습니다! 주문 ID: ${response.data.orderId}`
          );
          setIsSuccess(true);
        } else {
          setStatus('결제는 처리되었으나 응답 형식이 예상과 다릅니다.');
          setIsSuccess(false);
        }
      } catch (error) {
        console.error('최종 결제 승인 실패:', error.response || error);

        let errorMessage = '알 수 없는 오류로 최종 결제 승인이 실패했습니다.';

        if (error.response && error.response.data && error.response.data.message) {
          errorMessage = error.response.data.message;
        } else if (error.message) {
          errorMessage = `통신 오류: ${error.message}`;
        }

        setStatus(`❌ ${errorMessage}`);
        setIsSuccess(false);
      }
    };

    confirmPayment();
  }, [paymentKey, orderId, amount]);

  return (
    <div style={{ maxWidth: '600px', margin: '50px auto', textAlign: 'center' }}>
      {isSuccess ? (
        <h1 style={{ color: 'green' }}>결제 및 구독권 활성화 성공</h1>
      ) : (
        <h1 style={{ color: 'orange' }}>결제 처리 중 / 오류</h1>
      )}
      <p>{status}</p>

      {isSuccess && (
        <p>
          이제 <strong>{orderId}</strong> 주문으로 구독 서비스를 이용하실 수 있습니다.
        </p>
      )}

      {!isSuccess && (
        <button
          onClick={() => (window.location.href = '/traders/payment/buy')}
          style={{
            marginTop: '20px',
            padding: '10px 20px',
            backgroundColor: 'gray',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          결제 다시 시도하기
        </button>
      )}
    </div>
  );
}

export default PaymentSuccess;
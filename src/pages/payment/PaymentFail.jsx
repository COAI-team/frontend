import React from 'react';
import { useSearchParams } from 'react-router-dom';

function PaymentFail() {
    const [searchParams] = useSearchParams();
    // 토스페이먼츠에서 전달하는 실패 정보
    const code = searchParams.get('code');       
    const message = searchParams.get('message'); 
    const orderId = searchParams.get('orderId');

    return (
        <div style={{ maxWidth: '600px', margin: '50px auto', textAlign: 'center', padding: '20px', border: '1px solid #ff000030', borderRadius: '8px', backgroundColor: '#fff8f8' }}>
            <h1 style={{ color: '#CC0000' }}>❌ 결제가 실패 또는 취소되었습니다.</h1>
            <p style={{ fontSize: '1.1em', fontWeight: 'bold' }}>
                {message || '결제 진행 중 알 수 없는 오류가 발생했습니다.'}
            </p>
            
            <div style={{ marginTop: '30px', textAlign: 'left', padding: '20px', backgroundColor: '#f9f9f9', borderRadius: '6px' }}>
                <p><strong>주문 번호:</strong> {orderId || '정보 없음'}</p>
                {code && <p><strong>토스 에러 코드:</strong> {code}</p>}
            </div>

            <p style={{ marginTop: '20px', color: '#555' }}>
                고객센터에 문의하시거나, 결제 수단을 확인 후 다시 시도해 주세요.
            </p>
            {/* 필요한 경우 메인 페이지로 돌아가는 버튼 추가 */}
            <button onClick={() => window.location.href = '/'} style={{ marginTop: '30px', padding: '10px 20px', backgroundColor: 'gray', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                메인으로 돌아가기
            </button>
        </div>
    );
}

export default PaymentFail;
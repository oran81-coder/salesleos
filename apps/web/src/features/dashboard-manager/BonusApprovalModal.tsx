import { useState } from 'react';
import { APIClient } from '../../api/client';

interface BonusApprovalModalProps {
    deal: any;
    month: string;
    onClose: () => void;
    onSuccess: () => void;
}

export function BonusApprovalModal({ deal, month, onClose, onSuccess }: BonusApprovalModalProps) {
    const [amount, setAmount] = useState(deal.remaining_eligible);
    const [payoutMonth, setPayoutMonth] = useState(month);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (amount <= 0 || amount > deal.remaining_eligible) {
            alert(`סכום לא תקין. ניתן לאשר עד ₪${deal.remaining_eligible.toLocaleString()}`);
            return;
        }

        setIsLoading(true);
        try {
            await APIClient.post('/bonuses/approve', {
                repId: deal.rep_id,
                departmentId: deal.department_id,
                sheetMonth: deal.sheet_month,
                dealId: deal.deal_id,
                legacyKey: deal.legacy_key,
                amount: Number(amount),
                payoutMonth: payoutMonth + "-01"
            });
            onSuccess();
        } catch (err: any) {
            alert('אישור הבונוס נכשל: ' + err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content card" style={{ maxWidth: '400px' }}>
                <div className="modal-header">
                    <h3>אישור בונוס לעסקה {deal.deal_id || deal.legacy_key}</h3>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="field">
                        <label className="field-label">סכום לאישור (₪)</label>
                        <input
                            type="number"
                            step="0.01"
                            max={deal.remaining_eligible}
                            value={amount}
                            onChange={e => setAmount(Number(e.target.value))}
                            required
                        />
                        <p className="hint">נותר לאישור: ₪{deal.remaining_eligible.toLocaleString()}</p>
                    </div>

                    <div className="field">
                        <label className="field-label">חודש תשלום (עבור דחייה)</label>
                        <input
                            type="month"
                            value={payoutMonth}
                            onChange={e => setPayoutMonth(e.target.value)}
                            required
                        />
                    </div>

                    <div className="modal-actions" style={{ marginTop: '1.5rem', display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        <button type="button" className="button secondary" onClick={onClose}>ביטול</button>
                        <button type="submit" className="button primary" disabled={isLoading}>
                            {isLoading ? 'מאשר...' : 'אשר בונוס'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

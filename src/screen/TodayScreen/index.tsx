import { useMemo, useEffect } from "react";
import type { Transaction } from "../../types";

interface TodayScreenProps {
  transactions: Transaction[];
  removeTransaction: (id: string) => void;
  onEdit: (tx: Transaction) => void;
  highlightedId?: string | null;
}

const TodayScreen = ({ transactions, removeTransaction, onEdit, highlightedId }: TodayScreenProps) => {

  useEffect(() => {
    // Scroll to top on mount
    const container = document.getElementById('main-scroll-container');
    if (container) {
      container.scrollTop = 0;
    }
  }, []);
  
  const todayTransactions = useMemo(() => {
    const today = new Date();
    const isSameDay = (d1: Date, d2: Date) => 
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate();

    return transactions
      .filter(t => isSameDay(new Date(t.created_at), today))
      .sort((a, b) => {
        // Planned expenses (price 0) first
        if (a.price === 0 && b.price !== 0) return -1;
        if (a.price !== 0 && b.price === 0) return 1;
        // Then by date newest first
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }); 
  }, [transactions]);

  const totalAmount = useMemo(() => 
    todayTransactions.reduce((sum, t) => sum + t.price, 0),
  [todayTransactions]);

  return (
    <div style={{ padding: '20px' }}>
      <h1>Today's Spending</h1>
      
      <div className="card" style={{ 
        padding: '20px', 
        marginBottom: '20px', 
        backgroundColor: 'var(--primary)', 
        color: 'var(--text-inv)', 
        borderRadius: '12px',
        textAlign: 'center', 
        boxShadow: '0 4px 6px var(--shadow-color)'
      }}>
        <div style={{ fontSize: '0.9em', opacity: 0.9 }}>Total</div>
        <div style={{ fontSize: '2.5em', fontWeight: 'bold' }}>
          ${totalAmount.toLocaleString()}
        </div>
        <div style={{ fontSize: '0.8em', marginTop: '5px', opacity: 0.8 }}>
          {todayTransactions.length} transaction{todayTransactions.length !== 1 ? 's' : ''}
        </div>
      </div>

      <div className="transaction-list">
        <style>{`
          @keyframes flash-normal {
            0% { background-color: var(--primary-bg-subtle); } 
            100% { background-color: var(--bg-item); }
          }
          @keyframes flash-warning {
             0% { background-color: var(--primary-bg-subtle); }
             100% { background-color: var(--warning-bg-subtle); }
          }
        `}</style>
        {todayTransactions.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '40px' }}>
            No transactions yet today.
          </div>
        ) : (
          todayTransactions.map(tx => {
            const isPlanned = tx.price === 0;
            const isHighlighted = highlightedId === tx.id;
            const bgStart = isPlanned ? 'var(--warning-bg-subtle)' : 'var(--bg-item)';
            
            return (
            <div 
              key={tx.id} 
              onClick={() => onEdit(tx)}
              style={{ 
                backgroundColor: bgStart,
                animation: isHighlighted ? `${isPlanned ? 'flash-warning' : 'flash-normal'} 3s ease-out` : 'none',
                padding: '15px', 
                borderRadius: '8px',
                border: isPlanned ? '1px solid var(--warning)' : '1px solid var(--border-color)',
                marginBottom: '10px',
                display: 'flex', 
                justifyContent: 'space-between',
                alignItems: 'center',
                opacity: tx.syncStatus === 'pending' ? 0.7 : 1,
                boxShadow: '0 1px 3px var(--shadow-color)',
                cursor: 'pointer',
                position: 'relative' // For badge
              }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <strong style={{ fontSize: '1.1em', color: tx.price === 0 ? 'var(--warning-text)' : 'var(--text-main)' }}>{tx.name}</strong>
                  {tx.price === 0 ? (
                      <span style={{ 
                          fontSize: '0.85em', 
                          color: '#000', 
                          backgroundColor: 'var(--warning)', 
                          padding: '2px 8px', 
                          borderRadius: '4px',
                          fontWeight: 'bold'
                      }}>
                          Planned Expense
                      </span>
                  ) : (
                      <span style={{ fontWeight: 'bold', fontSize: '1.1em', color: 'var(--text-main)' }}>${tx.price}</span>
                  )}
                </div>
                
                <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginBottom: '4px' }}>
                  {tx.tags.map(tag => (
                    <span key={tag} style={{ 
                      fontSize: '0.75em', 
                      backgroundColor: 'var(--chip-bg)', 
                      padding: '2px 8px', 
                      borderRadius: '10px',
                      color: 'var(--text-secondary)'
                    }}>
                      {tag}
                    </span>
                  ))}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '5px' }}>
                  <small style={{ color: 'var(--text-muted)' }}>
                    {new Date(tx.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    {tx.syncStatus === 'pending' && <span style={{ color: 'var(--warning)', marginLeft: '5px' }}> (Syncing...)</span>}
                    {tx.syncStatus === 'error' && <span style={{ color: 'var(--danger)', marginLeft: '5px' }}> (Failed)</span>}
                  </small>
                  
                  <button 
                    onClick={(e) => {
                        e.stopPropagation();
                        if (confirm('Delete this transaction?')) {
                            removeTransaction(tx.id);
                        }
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--danger)',
                      cursor: 'pointer',
                      fontSize: '0.9em',
                      padding: '5px',
                      display: 'flex', 
                      alignItems: 'center'
                    }}
                  >
                    <span className="material-icons" style={{ fontSize: '1.2em' }}>delete</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })
        )}
      </div>
    </div>
  );
};

export default TodayScreen;
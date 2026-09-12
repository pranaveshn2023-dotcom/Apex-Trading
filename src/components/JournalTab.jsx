import React, { useState } from 'react';
import { 
  Sparkles, 
  BookOpen, 
  Tag, 
  Save, 
  Check, 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  Calendar, 
  Filter, 
  CheckCircle2,
  Award
} from 'lucide-react';
import { formatINR, formatPercent, formatDate } from '../utils/formatters';

export default function JournalTab({ journal, onUpdateJournal }) {
  const [filter, setFilter] = useState('ALL'); // 'ALL' | 'WIN' | 'LOSS'
  const [editingId, setEditingId] = useState(null);
  const [editNotes, setEditNotes] = useState({});
  const [saveSuccessId, setSaveSuccessId] = useState(null);

  const filteredEntries = (journal || []).filter(entry => {
    if (filter === 'WIN') return entry.pnl > 0;
    if (filter === 'LOSS') return entry.pnl < 0;
    return true;
  });

  const handleSaveLesson = async (id) => {
    const lessonText = editNotes[id];
    if (lessonText !== undefined && onUpdateJournal) {
      await onUpdateJournal(id, { lessons: lessonText });
      setSaveSuccessId(id);
      setTimeout(() => setSaveSuccessId(null), 3000);
      setEditingId(null);
    }
  };

  const totalTrades = journal?.length || 0;
  const wins = journal?.filter(j => j.pnl > 0).length || 0;
  const losses = journal?.filter(j => j.pnl < 0).length || 0;
  const winRate = totalTrades > 0 ? ((wins / totalTrades) * 100).toFixed(1) : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header & Mindset Banner */}
      <div className="glass-panel" style={{ padding: '20px 24px', background: '#ffffff', border: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <div style={{ background: '#ecfdf5', padding: '6px', borderRadius: '8px', color: '#059669' }}>
                <BookOpen size={20} />
              </div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                Individual Stock Picking & Strategy Journal
              </h2>
            </div>
            <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0, maxWidth: '650px' }}>
              Review every stock pick, validate your entry thesis, study post-trade outcomes, and log actionable lessons to continuously refine your edge in the Indian equity markets.
            </p>
          </div>

          {/* Quick Win/Loss Stats */}
          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '8px 14px', borderRadius: '8px', textAlign: 'center' }}>
              <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600 }}>Stock Picks</div>
              <div className="font-mono" style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>{totalTrades}</div>
            </div>
            <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', padding: '8px 14px', borderRadius: '8px', textAlign: 'center' }}>
              <div style={{ fontSize: '0.7rem', color: '#047857', fontWeight: 600 }}>Win Rate</div>
              <div className="font-mono" style={{ fontSize: '1.1rem', fontWeight: 800, color: '#059669' }}>{winRate}%</div>
            </div>
            <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', padding: '8px 14px', borderRadius: '8px', textAlign: 'center' }}>
              <div style={{ fontSize: '0.7rem', color: '#0284c7', fontWeight: 600 }}>Wins / Losses</div>
              <div className="font-mono" style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0284c7' }}>{wins}W - {losses}L</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '6px' }}>
          {[
            { id: 'ALL', label: 'All Stock Picks' },
            { id: 'WIN', label: 'Profitable Trades (Wins)' },
            { id: 'LOSS', label: 'Losing Trades (Losses)' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              style={{
                background: filter === tab.id ? '#ecfdf5' : '#ffffff',
                color: filter === tab.id ? '#047857' : '#64748b',
                border: `1px solid ${filter === tab.id ? '#a7f3d0' : '#e2e8f0'}`,
                padding: '6px 14px',
                borderRadius: '8px',
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Journal Cards List */}
      {filteredEntries.length === 0 ? (
        <div className="glass-panel" style={{ padding: '60px 20px', textAlign: 'center', color: '#64748b', background: '#ffffff', border: '1px solid #e2e8f0' }}>
          <Sparkles size={40} style={{ margin: '0 auto 12px auto', color: '#059669', opacity: 0.6 }} />
          <h3 style={{ fontSize: '1.1rem', color: '#0f172a', marginBottom: '6px', fontWeight: 700 }}>No Journal Entries in this category</h3>
          <p style={{ fontSize: '0.85rem', maxWidth: '420px', margin: '0 auto' }}>
            When you exit or square off a position in your paper portfolio, a full trade analysis card will automatically appear here.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {filteredEntries.map(entry => {
            const isWin = entry.pnl > 0;
            const isEditing = editingId === entry.id;
            const currentLesson = editNotes[entry.id] !== undefined ? editNotes[entry.id] : (entry.lessons || '');

            return (
              <div 
                key={entry.id} 
                className="glass-panel" 
                style={{ 
                  padding: '20px', 
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderLeft: `4px solid ${isWin ? '#059669' : '#e11d48'}`,
                  transition: 'transform 0.15s ease'
                }}
              >
                {/* Entry Top Row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '14px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                      <span style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>
                        {entry.symbol.replace('.NS', '')}
                      </span>
                      <span style={{ fontSize: '0.72rem', background: '#f1f5f9', color: '#475569', padding: '2px 8px', borderRadius: '4px', fontWeight: 600, border: '1px solid #e2e8f0' }}>
                        {entry.product || 'CNC'}
                      </span>
                      <span style={{ fontSize: '0.72rem', background: '#f8fafc', color: '#64748b', padding: '2px 8px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                        {entry.sector || 'Equities'}
                      </span>
                      {entry.tags && entry.tags.map((t, idx) => (
                        <span key={idx} style={{ fontSize: '0.68rem', background: '#ecfdf5', color: '#047857', padding: '1px 6px', borderRadius: '4px', border: '1px solid #a7f3d0' }}>
                          #{t}
                        </span>
                      ))}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                      {entry.name} • {entry.qty} shares
                    </div>
                  </div>

                  {/* P&L Badge */}
                  <div style={{ textAlign: 'right' }}>
                    <div className={`font-mono ${isWin ? 'profit-text' : 'loss-text'}`} style={{ fontSize: '1.3rem', fontWeight: 800 }}>
                      {formatINR(entry.pnl, true)}
                    </div>
                    <div className={`font-mono ${isWin ? 'profit-text' : 'loss-text'}`} style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                      {formatPercent(entry.pnlPct)} return
                    </div>
                  </div>
                </div>

                {/* Numbers Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px', background: '#f8fafc', padding: '12px 14px', borderRadius: '8px', marginBottom: '14px', border: '1px solid #e2e8f0' }}>
                  <div>
                    <div style={{ fontSize: '0.68rem', color: '#64748b' }}>Entry Price</div>
                    <div className="font-mono" style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a' }}>{formatINR(entry.entryPrice)}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.68rem', color: '#64748b' }}>Exit Price</div>
                    <div className="font-mono" style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0284c7' }}>{formatINR(entry.exitPrice)}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.68rem', color: '#64748b' }}>Taxes & Charges</div>
                    <div className="font-mono" style={{ fontSize: '0.85rem', color: '#64748b' }}>{formatINR(entry.charges || 0)}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.68rem', color: '#64748b' }}>Entry Date</div>
                    <div style={{ fontSize: '0.75rem', color: '#0f172a' }}>{formatDate(entry.entryDate)}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.68rem', color: '#64748b' }}>Exit Date</div>
                    <div style={{ fontSize: '0.75rem', color: '#0f172a' }}>{formatDate(entry.exitDate)}</div>
                  </div>
                </div>

                {/* Thesis & Exit Analysis */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                  <div style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '0.72rem', color: '#0284c7', fontWeight: 700, marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Initial Stock Picking Thesis
                    </div>
                    <div style={{ fontSize: '0.825rem', color: '#334155', lineHeight: 1.4 }}>
                      {entry.thesis || 'No initial thesis recorded.'}
                    </div>
                  </div>

                  <div style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '0.72rem', color: '#d97706', fontWeight: 700, marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Exit Rationale
                    </div>
                    <div style={{ fontSize: '0.825rem', color: '#334155', lineHeight: 1.4 }}>
                      {entry.exitThesis || 'Closed manually or hit exit order.'}
                    </div>
                  </div>
                </div>

                {/* Lessons Learned & Self-Reflection */}
                <div style={{ background: '#f0fdf4', padding: '12px 14px', borderRadius: '8px', border: '1px solid #a7f3d0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <div style={{ fontSize: '0.75rem', color: '#047857', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Award size={14} /> LESSONS LEARNED & STOCK PICKING FEEDBACK
                    </div>
                    {!isEditing && (
                      <button
                        onClick={() => {
                          setEditingId(entry.id);
                          setEditNotes({ ...editNotes, [entry.id]: entry.lessons || '' });
                        }}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#059669',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        {entry.lessons ? 'Edit Reflection' : '+ Add Stock Picking Note'}
                      </button>
                    )}
                  </div>

                  {isEditing ? (
                    <div>
                      <textarea
                        value={currentLesson}
                        onChange={(e) => setEditNotes({ ...editNotes, [entry.id]: e.target.value })}
                        placeholder="What did you learn from this pick? (e.g. Bought too close to resistance, held through earnings properly, respected stop loss)"
                        rows={2}
                        style={{
                          width: '100%',
                          background: '#ffffff',
                          border: '1px solid #cbd5e1',
                          borderRadius: '6px',
                          color: '#0f172a',
                          padding: '8px 10px',
                          fontSize: '0.825rem',
                          marginBottom: '8px',
                          outline: 'none'
                        }}
                      />
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => setEditingId(null)}
                          className="btn-ghost"
                          style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleSaveLesson(entry.id)}
                          className="btn-primary"
                          style={{ padding: '4px 12px', fontSize: '0.75rem' }}
                        >
                          <Save size={13} /> Save Note
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ fontSize: '0.825rem', color: entry.lessons ? '#0f172a' : '#64748b', fontStyle: entry.lessons ? 'normal' : 'italic' }}>
                      {entry.lessons || 'No review added yet. Click "+ Add Stock Picking Note" to capture what worked or didn\'t.'}
                    </div>
                  )}

                  {saveSuccessId === entry.id && (
                    <div style={{ color: '#047857', fontSize: '0.75rem', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <CheckCircle2 size={13} /> Saved note to journal!
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

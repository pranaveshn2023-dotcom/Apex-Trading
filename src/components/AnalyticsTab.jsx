import React from 'react';
import { 
  TrendingUp, 
  Award, 
  PieChart, 
  ShieldCheck, 
  Scale, 
  Zap, 
  BarChart3, 
  ArrowUpRight, 
  ArrowDownRight 
} from 'lucide-react';
import { formatINR, formatPercent } from '../utils/formatters';

export default function AnalyticsTab({ portfolio }) {
  const analytics = portfolio?.analytics || {};
  const {
    totalTrades = 0,
    winCount = 0,
    lossCount = 0,
    winRate = 0,
    profitFactor = 0,
    avgWin = 0,
    avgLoss = 0,
    bestTrade = null,
    sectorBreakdown = []
  } = analytics;

  const totalReturn = portfolio?.totalReturn || 0;
  const totalReturnPct = portfolio?.totalReturnPct || 0;

  // Sector color map
  const sectorColors = [
    '#059669', '#0284c7', '#d97706', '#7c3aed', '#db2777', 
    '#10b981', '#2563eb', '#f59e0b', '#8b5cf6', '#06b6d4'
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Banner Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
        <div className="glass-panel" style={{ padding: '20px', background: '#ffffff', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Win Rate</span>
            <div style={{ background: '#ecfdf5', padding: '4px', borderRadius: '6px', color: '#059669' }}>
              <Award size={16} />
            </div>
          </div>
          <div className="font-mono" style={{ fontSize: '1.85rem', fontWeight: 800, color: '#059669' }}>
            {winRate}%
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>
            {winCount} Wins / {lossCount} Losses ({totalTrades} total picks)
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '20px', background: '#ffffff', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Profit Factor</span>
            <div style={{ background: '#f0f9ff', padding: '4px', borderRadius: '6px', color: '#0284c7' }}>
              <Scale size={16} />
            </div>
          </div>
          <div className="font-mono" style={{ fontSize: '1.85rem', fontWeight: 800, color: '#0284c7' }}>
            {profitFactor > 900 ? '∞' : profitFactor}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>
            Gross Profits ÷ Gross Losses
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '20px', background: '#ffffff', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Avg Win vs Avg Loss</span>
            <div style={{ background: '#fffbeb', padding: '4px', borderRadius: '6px', color: '#d97706' }}>
              <Zap size={16} />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span className="font-mono profit-text" style={{ fontSize: '1.3rem', fontWeight: 800 }}>
              {formatINR(avgWin)}
            </span>
            <span style={{ color: '#64748b', fontSize: '0.8rem' }}>vs</span>
            <span className="font-mono loss-text" style={{ fontSize: '1.1rem', fontWeight: 700 }}>
              {formatINR(avgLoss)}
            </span>
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>
            Risk-Reward Realized Ratio: {avgLoss > 0 ? `1 : ${(avgWin / avgLoss).toFixed(2)}` : 'N/A'}
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '20px', background: '#ffffff', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Net Capital Growth</span>
            <div style={{ background: '#ecfdf5', padding: '4px', borderRadius: '6px', color: '#059669' }}>
              <TrendingUp size={16} />
            </div>
          </div>
          <div className={`font-mono ${totalReturn >= 0 ? 'profit-text' : 'loss-text'}`} style={{ fontSize: '1.85rem', fontWeight: 800 }}>
            {formatINR(totalReturn, true)}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>
            {formatPercent(totalReturnPct)} overall account return
          </div>
        </div>
      </div>

      {/* Two Column Layout: Sector Breakdown & Best Trades */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '16px' }}>
        {/* Sectoral Asset Allocation */}
        <div className="glass-panel" style={{ padding: '20px', background: '#ffffff', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <PieChart size={18} color="#059669" />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
              Sector Diversification & Exposure
            </h3>
          </div>

          {sectorBreakdown.length === 0 ? (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: '#64748b', fontSize: '0.85rem' }}>
              No active delivery holdings yet. Buy stocks across IT, Banking, Auto, Energy to see diversification breakdown.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Stacked Progress Bar */}
              <div style={{ width: '100%', height: '12px', borderRadius: '6px', background: '#e2e8f0', display: 'flex', overflow: 'hidden' }}>
                {sectorBreakdown.map((s, idx) => (
                  <div
                    key={s.sector}
                    style={{
                      width: `${s.percent}%`,
                      background: sectorColors[idx % sectorColors.length],
                      height: '100%'
                    }}
                    title={`${s.sector}: ${s.percent}%`}
                  />
                ))}
              </div>

              {/* Sector Legend */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {sectorBreakdown.map((s, idx) => (
                  <div key={s.sector} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.825rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: sectorColors[idx % sectorColors.length] }} />
                      <span style={{ color: '#0f172a', fontWeight: 600 }}>{s.sector}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span className="font-mono" style={{ color: '#64748b' }}>{formatINR(s.value)}</span>
                      <span className="font-mono" style={{ color: '#0f172a', fontWeight: 700, minWidth: '45px', textAlign: 'right' }}>
                        {s.percent}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Best Stock Pick Card */}
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', background: '#ffffff', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <Award size={18} color="#d97706" />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
              Top Stock Pick Highlight
            </h3>
          </div>

          {bestTrade ? (
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '16px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                  <div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
                      {bestTrade.symbol.replace('.NS', '')}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{bestTrade.name}</div>
                  </div>
                  <div className="font-mono profit-bg" style={{ fontSize: '1.1rem', fontWeight: 800, padding: '4px 10px', borderRadius: '6px' }}>
                    {formatINR(bestTrade.pnl, true)} ({formatPercent(bestTrade.pnlPct)})
                  </div>
                </div>

                <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '8px' }}>
                  <b>Entry Thesis:</b> {bestTrade.thesis || 'Technical Breakout'}
                </div>
              </div>
            </div>
          ) : (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: '#64748b', fontSize: '0.85rem' }}>
              Close your first profitable trade to see your top stock pick highlight.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

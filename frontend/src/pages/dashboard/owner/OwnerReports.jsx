import React, { useState, useEffect, useCallback } from 'react';
import { 
  PieChart, Pie, Cell, Tooltip as RechartsTooltip, Legend, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, AreaChart, Area, 
  ResponsiveContainer
} from 'recharts';
import api from '../../../api/axios';
import { getBranches } from '../../../api/branches';
import { FaChartLine, FaChartPie, FaMoneyBillWave, FaUserInjured, FaBoxOpen, FaBuilding } from 'react-icons/fa';

const COLORS = ['#3C8E7F', '#D17C43', '#111827', '#E5E7EB', '#0D9488', '#F59E0B', '#6366F1'];

const DAY_OPTIONS = [
  { label: 'All', value: 'all' },
  { label: 'Today', value: 1 },
  { label: '7 Days', value: 7 },
  { label: '15 Days', value: 15 },
  { label: '30 Days', value: 30 },
];

function DayToggle({ value, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 4, background: 'var(--bg)', borderRadius: 8, padding: 3 }}>
      {DAY_OPTIONS.map(opt => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          style={{
            padding: '5px 12px',
            fontSize: '0.75rem',
            fontWeight: 600,
            border: 'none',
            borderRadius: 6,
            cursor: 'pointer',
            background: value === opt.value ? 'var(--primary)' : 'transparent',
            color: value === opt.value ? '#fff' : 'var(--text-muted)',
            transition: 'all 0.2s',
          }}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export default function OwnerReports() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Per-chart day filters
  const [deptDays, setDeptDays] = useState(30);
  const [genderDays, setGenderDays] = useState(30);
  const [financeDays, setFinanceDays] = useState(30);
  const [peakDays, setPeakDays] = useState(7);
  const [activeFinanceTab, setActiveFinanceTab] = useState('revenue');

  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState('');

  // We fetch with the max days needed, then the API returns all data for that range
  const maxDays = [deptDays, genderDays, financeDays, peakDays].includes('all') ? 'all' : Math.max(deptDays, genderDays, financeDays, peakDays, 30);

  const fetchData = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    params.append('days', maxDays);
    if (selectedBranch) params.append('branch_id', selectedBranch);
    if (deptDays) params.append('dept_days', deptDays);
    if (genderDays) params.append('gender_days', genderDays);
    if (financeDays) params.append('finance_days', financeDays);
    if (peakDays) params.append('peak_days', peakDays);

    api.get(`/reports/owner-summary/?${params.toString()}`)
      .then(res => { setData(res.data); setLoading(false); })
      .catch(() => { setError('Failed to fetch report data.'); setLoading(false); });
  }, [maxDays, selectedBranch, deptDays, genderDays, financeDays, peakDays]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    getBranches().then(res => setBranches(res.data.results || res.data)).catch(() => {});
  }, []);

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '100px 0' }}>
      <div className="spinner" />
    </div>
  );

  if (error || !data) return (
    <div style={{ padding: '20px', color: 'var(--danger)', background: 'var(--danger-bg)', borderRadius: '8px' }}>
      {error}
    </div>
  );

  // Process data
  const formatDepartmentData = data.patients_by_department.map(d => ({
    name: d.primary_department__name || 'Unassigned',
    value: d.count
  }));

  const formatGenderData = data.patients_by_gender.map(d => ({
    name: d.gender ? d.gender.charAt(0).toUpperCase() + d.gender.slice(1) : 'Unknown',
    value: d.count
  }));
  
  // Peak hours
  const hourMap = {};
  data.appointments.forEach(a => {
    if (a.scheduled_time) {
      const hr = parseInt(a.scheduled_time.split(':')[0], 10);
      hourMap[hr] = (hourMap[hr] || 0) + 1;
    }
  });
  const hourData = Object.keys(hourMap).map(hr => ({
    hour: `${hr}:00`,
    count: hourMap[hr]
  })).sort((a, b) => parseInt(a.hour) - parseInt(b.hour));

  const rt = data.revenue_totals || {};

  return (
    <div style={{ paddingBottom: 40 }}>
      <div style={{ marginBottom: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h2 style={{ fontSize: '2rem', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 12, fontWeight: 700, color: 'var(--bark)' }}>
            <FaChartLine style={{ color: 'var(--turmeric)' }} /> Reports & Analytics Hub
          </h2>
          <p style={{ color: 'var(--text-muted)' }}>Visualize key performance indicators and operational metrics across your branches.</p>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'var(--bg)', padding: '12px 16px', borderRadius: 12, border: '1px solid var(--border)' }}>
          <FaBuilding style={{ color: 'var(--primary)' }} />
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 2 }}>Branch Filter</div>
            <select className="input input-sm" value={selectedBranch} onChange={e => setSelectedBranch(e.target.value)} style={{ minWidth: 200, padding: '4px 8px', fontSize: '0.9rem' }}>
              <option value="">All Branches</option>
              {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Revenue Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Gross Revenue', value: rt.gross, color: 'var(--moss)' },
          { label: 'Collected', value: rt.collected, color: 'var(--success)' },
          { label: 'Total Discount', value: rt.discount, color: 'var(--warning)' },
          { label: 'Pending', value: rt.pending, color: 'var(--danger)' },
        ].map(card => (
          <div key={card.label} className="card card-body" style={{ padding: '16px 20px', borderLeft: `4px solid ${card.color}` }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>{card.label}</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: card.color }}>₹{(card.value || 0).toLocaleString('en-IN')}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 24, marginBottom: 24 }}>
        
        {/* Department Distribution */}
        <div className="card card-body" style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h4 style={{ display: 'flex', alignItems: 'center', gap: 8, margin: 0, color: 'var(--text-primary)' }}>
              <FaChartPie style={{ color: 'var(--moss)' }}/> Patients by Department
            </h4>
            <DayToggle value={deptDays} onChange={setDeptDays} />
          </div>
          <div style={{ width: '100%', height: 300 }}>
            {formatDepartmentData.length > 0 ? (
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={formatDepartmentData} cx="50%" cy="50%" innerRadius={70} outerRadius={110} paddingAngle={5} dataKey="value" stroke="none">
                    {formatDepartmentData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                  <Legend verticalAlign="bottom" height={36} iconType="circle"/>
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>No data available</div>
            )}
          </div>
        </div>

        {/* Gender Demographics */}
        <div className="card card-body" style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h4 style={{ display: 'flex', alignItems: 'center', gap: 8, margin: 0, color: 'var(--text-primary)' }}>
              <FaUserInjured style={{ color: 'var(--copper)' }}/> Patient Demographics
            </h4>
            <DayToggle value={genderDays} onChange={setGenderDays} />
          </div>
          <div style={{ width: '100%', height: 300 }}>
            {formatGenderData.length > 0 ? (
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={formatGenderData} cx="50%" cy="50%" outerRadius={110} dataKey="value" stroke="#fff" strokeWidth={3}>
                    {formatGenderData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                  <Legend verticalAlign="bottom" height={36} iconType="diamond"/>
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>No data available</div>
            )}
          </div>
        </div>
      </div>

      {/* Financial Area Chart */}
      <div className="card card-body" style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: '16px', marginBottom: 24, padding: 32 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <h4 style={{ display: 'flex', alignItems: 'center', gap: 8, margin: 0, color: 'var(--text-primary)' }}>
            <FaMoneyBillWave style={{ color: 'var(--moss)' }}/> Financial Trajectory ({financeDays === 1 ? 'Today' : `${financeDays} Days`})
          </h4>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <DayToggle value={financeDays} onChange={setFinanceDays} />
            <div style={{ display: 'flex', gap: 4, marginLeft: 8 }}>
              <button className={`btn btn-sm ${activeFinanceTab === 'revenue' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setActiveFinanceTab('revenue')}>Revenue</button>
              <button className={`btn btn-sm ${activeFinanceTab === 'collected' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setActiveFinanceTab('collected')}>Collected</button>
            </div>
          </div>
        </div>
        <div style={{ width: '100%', height: 350 }}>
          {data.finances.length > 0 ? (
            <ResponsiveContainer>
              <AreaChart data={data.finances} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={activeFinanceTab === 'revenue' ? '#3C8E7F' : '#D17C43'} stopOpacity={0.4}/>
                    <stop offset="95%" stopColor={activeFinanceTab === 'revenue' ? '#3C8E7F' : '#D17C43'} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 12}} tickFormatter={(v) => `₹${v}`} />
                <RechartsTooltip 
                  contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}
                  formatter={(value) => [`₹${Number(value).toLocaleString('en-IN')}`, activeFinanceTab === 'revenue' ? 'Gross Revenue' : 'Collected Amount']}
                />
                <Area 
                  type="monotone" 
                  dataKey={activeFinanceTab === 'revenue' ? 'revenue' : 'collected'} 
                  stroke={activeFinanceTab === 'revenue' ? '#3C8E7F' : '#D17C43'} 
                  strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>Not enough financial data</div>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 24 }}>
        {/* Busy Timing */}
        <div className="card card-body" style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: '16px', padding: 32 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h4 style={{ display: 'flex', alignItems: 'center', gap: 8, margin: 0, color: 'var(--text-primary)' }}>
              Operational Peak Hours
            </h4>
            <DayToggle value={peakDays} onChange={setPeakDays} />
          </div>
          <div style={{ width: '100%', height: 250 }}>
            {hourData.length > 0 ? (
              <ResponsiveContainer>
                <BarChart data={hourData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB"/>
                  <XAxis dataKey="hour" axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} axisLine={false} tickLine={false} />
                  <RechartsTooltip cursor={{fill: 'rgba(60, 142, 127, 0.1)'}} contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                  <Bar dataKey="count" fill="var(--moss)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>No data</div>
            )}
          </div>
        </div>

        {/* Inventory Insights */}
        <div className="card card-body" style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: '16px', padding: 32 }}>
          <h4 style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, color: 'var(--text-primary)' }}>
            <FaBoxOpen style={{ color: 'var(--copper)' }}/> Top Billed Items
          </h4>
          <div style={{ width: '100%', height: 250 }}>
            {data.top_items && data.top_items.length > 0 ? (
              <ResponsiveContainer>
                <BarChart data={data.top_items} layout="vertical" margin={{ top: 0, right: 20, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5E7EB" />
                  <XAxis type="number" axisLine={false} tickLine={false} />
                  <YAxis dataKey="description" type="category" width={120} axisLine={false} tickLine={false} tick={{ fontSize: 11 }}/>
                  <RechartsTooltip 
                    cursor={{fill: '#f3f4f6'}} 
                    contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} 
                    formatter={(value, name) => [name === 'total_qty' ? `${value} units` : `₹${Number(value).toLocaleString('en-IN')}`, name === 'total_qty' ? 'Quantity Sold' : 'Revenue']}
                  />
                  <Bar dataKey="total_qty" fill="var(--copper)" radius={[0, 6, 6, 0]} name="total_qty" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>No billing items data</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

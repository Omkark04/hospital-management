import React, { useState, useEffect } from 'react';
import { 
  PieChart, Pie, Cell, Tooltip as RechartsTooltip, Legend, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, AreaChart, Area, 
  ResponsiveContainer, LineChart, Line, ScatterChart, Scatter 
} from 'recharts';
import api from '../../../api/axios';
import { FaChartLine, FaChartPie, FaMoneyBillWave, FaUserInjured } from 'react-icons/fa';

const COLORS = ['#3C8E7F', '#D17C43', '#111827', '#E5E7EB', '#0D9488'];

export default function OwnerReports() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Chart toggles for dynamic feeling
  const [activeFinanceTab, setActiveFinanceTab] = useState('revenue');

  useEffect(() => {
    api.get('/reports/owner-summary/')
      .then(res => {
        setData(res.data);
        setLoading(false);
      })
      .catch(err => {
        setError('Failed to fetch report data.');
        setLoading(false);
      });
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

  // Process data for Recharts
  const formatDepartmentData = data.patients_by_department.map(d => ({
    name: d.primary_department__name || 'Unassigned',
    value: d.count
  }));

  const formatGenderData = data.patients_by_gender.map(d => ({
    name: d.gender.charAt(0).toUpperCase() + d.gender.slice(1),
    value: d.count
  }));
  
  // Aggregate appointments by hour for heatmap-like scatter / bar
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

  return (
    <div style={{ paddingBottom: 40 }}>
      <div style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: '2rem', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 12, fontWeight: 700, color: 'var(--bark)' }}>
          <FaChartLine style={{ color: 'var(--turmeric)' }} /> Reports & Analytics Hub
        </h2>
        <p style={{ color: 'var(--text-muted)' }}>Visualize key performance indicators and operational metrics across your branches.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 24, marginBottom: 24 }}>
        
        {/* Department Distribution (Pie) */}
        <div className="card card-body hover-elevate" style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: '16px', transition: 'transform 0.3s' }}>
          <h4 style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, color: 'var(--text-primary)' }}>
            <FaChartPie style={{ color: 'var(--moss)' }}/> Patients by Department
          </h4>
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

        {/* Gender Demographics (Pie) */}
        <div className="card card-body hover-elevate" style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: '16px', transition: 'transform 0.3s' }}>
          <h4 style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, color: 'var(--text-primary)' }}>
            <FaUserInjured style={{ color: 'var(--copper)' }}/> Patient Demographics
          </h4>
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
      <div className="card card-body hover-elevate" style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: '16px', marginBottom: 24, padding: 32 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h4 style={{ display: 'flex', alignItems: 'center', gap: 8, margin: 0, color: 'var(--text-primary)' }}>
            <FaMoneyBillWave style={{ color: 'var(--moss)' }}/> Financial Trajectory (7 Days)
          </h4>
          <div style={{ display: 'flex', gap: 8 }}>
            <button 
              className={`btn btn-sm ${activeFinanceTab === 'revenue' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setActiveFinanceTab('revenue')}
            >
               Total Revenue
            </button>
            <button 
              className={`btn btn-sm ${activeFinanceTab === 'collected' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setActiveFinanceTab('collected')}
            >
               Collected Info
            </button>
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
                   formatter={(value) => [`₹${value}`, activeFinanceTab === 'revenue' ? 'Gross Revenue' : 'Collected Amount']}
                 />
                 <Area 
                   type="monotone" 
                   dataKey={activeFinanceTab === 'revenue' ? 'revenue' : 'collected'} 
                   stroke={activeFinanceTab === 'revenue' ? '#3C8E7F' : '#D17C43'} 
                   strokeWidth={3} 
                   fillOpacity={1} 
                   fill="url(#colorValue)" 
                 />
               </AreaChart>
             </ResponsiveContainer>
           ) : (
                <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>Not enough financial data for the past 7 days</div>
           )}
        </div>
      </div>

      {/* Busy Timing Report */}
      <div className="card card-body hover-elevate" style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: '16px', padding: 32 }}>
        <h4 style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, color: 'var(--text-primary)' }}>
           Operational Peak Hours
        </h4>
        <p style={{ marginTop: '-12px', marginBottom: '24px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          Appointment density by hour across all branches over the last 7 days.
        </p>
        
        <div style={{ width: '100%', height: 250 }}>
          {hourData.length > 0 ? (
            <ResponsiveContainer>
              <BarChart data={hourData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB"/>
                <XAxis dataKey="hour" axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} axisLine={false} tickLine={false} />
                <RechartsTooltip
                    cursor={{fill: 'rgba(60, 142, 127, 0.1)'}}
                    contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                />
                <Bar dataKey="count" fill="var(--moss)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
             <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>No appointment times available</div>
          )}
        </div>
      </div>

    </div>
  );
}

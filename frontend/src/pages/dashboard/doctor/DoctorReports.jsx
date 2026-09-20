import React, { useState, useEffect, useCallback } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, ComposedChart, Bar, BarChart
} from 'recharts';
import api from '../../../api/axios';
import { FaChartArea, FaWalking, FaStethoscope, FaCalendarCheck, FaClock, FaMoneyBillWave } from 'react-icons/fa';

const COLORS = ['#D17C43', '#3C8E7F', '#F59E0B', '#111827', '#0D9488'];

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

export default function DoctorReports() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Per-chart filters
  const [footfallDays, setFootfallDays] = useState(7);
  const [diagnosisDays, setDiagnosisDays] = useState(7);
  const [conversionDays, setConversionDays] = useState(7);
  const [peakDays, setPeakDays] = useState(7);

  const maxDays = [footfallDays, diagnosisDays, conversionDays, peakDays].includes('all') ? 'all' : Math.max(footfallDays, diagnosisDays, conversionDays, peakDays, 7);

  const fetchData = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    params.append('days', maxDays);
    if (footfallDays) params.append('footfall_days', footfallDays);
    if (diagnosisDays) params.append('diagnosis_days', diagnosisDays);
    if (conversionDays) params.append('conversion_days', conversionDays);
    if (peakDays) params.append('peak_days', peakDays);

    api.get(`/reports/doctor-summary/?${params.toString()}`)
      .then(res => { setData(res.data); setLoading(false); })
      .catch(() => { setError('Failed to fetch report data.'); setLoading(false); });
  }, [maxDays, footfallDays, diagnosisDays, conversionDays, peakDays]);

  useEffect(() => { fetchData(); }, [fetchData]);

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

  const diagnosesData = data.diagnoses.map(d => ({
    name: d.diagnosis || 'Unspecified',
    value: d.count
  }));

  const footfallData = data.footfall.map(d => ({
    name: d.scheduled_date,
    Patients: d.count
  }));

  const statusData = data.status_counts.map(d => ({
    name: d.status.toUpperCase(),
    value: d.count
  }));

  const rev = data.revenue || {};

  return (
    <div style={{ paddingBottom: 40 }}>
      <div style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: '2rem', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 12, fontWeight: 700, color: 'var(--bark)' }}>
          <FaChartArea style={{ color: 'var(--turmeric)' }} /> Performance & Insights
        </h2>
        <p style={{ color: 'var(--text-muted)' }}>Deep dive into your clinical outcomes and appointment statistics.</p>
      </div>

      {/* Revenue Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
        <div className="card card-body" style={{ padding: '16px 20px', borderLeft: '4px solid var(--moss)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>Total Revenue</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--moss)' }}>₹{(rev.total || 0).toLocaleString('en-IN')}</div>
        </div>
        <div className="card card-body" style={{ padding: '16px 20px', borderLeft: '4px solid var(--success)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>Collected</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--success)' }}>₹{(rev.collected || 0).toLocaleString('en-IN')}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: 24, marginBottom: 24 }}>
        
        {/* Footfall */}
        <div className="card card-body" style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: '16px', padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h4 style={{ display: 'flex', alignItems: 'center', gap: 8, margin: 0, color: 'var(--text-primary)' }}>
              <FaWalking style={{ color: 'var(--copper)' }}/> Patient Footfall
            </h4>
            <DayToggle value={footfallDays} onChange={setFootfallDays} />
          </div>
          <div style={{ width: '100%', height: 280 }}>
            {footfallData.length > 0 ? (
              <ResponsiveContainer>
                <LineChart data={footfallData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB"/>
                  <XAxis dataKey="name" tick={{fontSize: 12}} tickMargin={10} axisLine={false} tickLine={false}/>
                  <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{fontSize: 12}}/>
                  <RechartsTooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                  <Line type="monotone" dataKey="Patients" stroke="var(--moss)" strokeWidth={4} activeDot={{ r: 8 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>No completed appointments</div>
            )}
          </div>
        </div>

        {/* Diagnoses */}
        <div className="card card-body" style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: '16px', padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h4 style={{ display: 'flex', alignItems: 'center', gap: 8, margin: 0, color: 'var(--text-primary)' }}>
              <FaStethoscope style={{ color: 'var(--moss)' }}/> Primary Diagnoses
            </h4>
            <DayToggle value={diagnosisDays} onChange={setDiagnosisDays} />
          </div>
          <div style={{ width: '100%', height: 280 }}>
            {diagnosesData.length > 0 ? (
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={diagnosesData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={4} dataKey="value" stroke="none">
                    {diagnosesData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                  <Legend verticalAlign="bottom" height={24} iconType="circle"/>
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>No visit notes logged</div>
            )}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 24, marginTop: 24 }}>
        {/* Appointment Conversion */}
        <div className="card card-body" style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: '16px', padding: 32 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h4 style={{ display: 'flex', alignItems: 'center', gap: 8, margin: 0, color: 'var(--text-primary)' }}>
              <FaCalendarCheck style={{ color: 'var(--primary)' }}/> Appointment Conversion
            </h4>
            <DayToggle value={conversionDays} onChange={setConversionDays} />
          </div>
          <div style={{ width: '100%', height: 250 }}>
            {statusData.length > 0 ? (
              <ResponsiveContainer>
                <ComposedChart data={statusData} layout="vertical" margin={{ top: 0, right: 20, left: 20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5E7EB"/>
                  <XAxis type="number" axisLine={false} tickLine={false}/>
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} width={120}/>
                  <RechartsTooltip cursor={{fill: '#f3f4f6'}} contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                  <Bar dataKey="value" barSize={32} fill="var(--copper)" radius={[0, 8, 8, 0]} />
                </ComposedChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>No appointment status data</div>
            )}
          </div>
        </div>

        {/* Operational Peak Hours */}
        <div className="card card-body" style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: '16px', padding: 32 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h4 style={{ display: 'flex', alignItems: 'center', gap: 8, margin: 0, color: 'var(--text-primary)' }}>
               <FaClock style={{ color: 'var(--moss)' }}/> Operational Peak Hours
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
      </div>
    </div>
  );
}

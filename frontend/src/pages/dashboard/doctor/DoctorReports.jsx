import React, { useState, useEffect } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, ComposedChart, Bar
} from 'recharts';
import api from '../../../api/axios';
import { FaChartArea, FaWalking, FaStethoscope, FaCalendarCheck } from 'react-icons/fa';

const COLORS = ['#D17C43', '#3C8E7F', '#F59E0B', '#111827', '#0D9488'];

export default function DoctorReports() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.get('/reports/doctor-summary/')
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

  return (
    <div style={{ paddingBottom: 40 }}>
      <div style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: '2rem', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 12, fontWeight: 700, color: 'var(--bark)' }}>
          <FaChartArea style={{ color: 'var(--turmeric)' }} /> Performance & Insights
        </h2>
        <p style={{ color: 'var(--text-muted)' }}>Deep dive into your clinical outcomes and appointment statistics.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: 24, marginBottom: 24 }}>
        
        {/* Footfall line chart */}
        <div className="card card-body" style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: '16px', padding: 24 }}>
          <h4 style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, color: 'var(--text-primary)' }}>
            <FaWalking style={{ color: 'var(--copper)' }}/> Patient Footfall (Past 7 Days)
          </h4>
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

        {/* Diagnoses distribution pie chart */}
        <div className="card card-body" style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: '16px', padding: 24 }}>
          <h4 style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, color: 'var(--text-primary)' }}>
            <FaStethoscope style={{ color: 'var(--moss)' }}/> Primary Diagnoses Breakdown
          </h4>
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

      {/* Appointment Conversion */}
      <div className="card card-body" style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: '16px', padding: 32 }}>
        <h4 style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, color: 'var(--text-primary)' }}>
           <FaCalendarCheck style={{ color: 'var(--primary)' }}/> Appointment Conversion (Past 7 Days)
        </h4>
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
      
    </div>
  );
}

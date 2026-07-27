import React from 'react';
import { 
  Users, CreditCard, Award, FileText, ArrowRight, BarChart2, 
  TrendingUp, Mail, CalendarRange, History, ChevronRight, Upload 
} from 'lucide-react';

export default function DashboardView({ 
  employees, 
  historyList, 
  salaryHistory, 
  attendanceList, 
  onNavigate 
}) {
  // Format currency to Indian Rupees
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(value);
  };

  const totalPayroll = employees.reduce((sum, emp) => sum + (Number(emp.grossSalary) || 0), 0);
  const avgSalary = employees.length ? Math.round(totalPayroll / employees.length) : 0;
  
  // Attendance calculations
  const getCurrentMonthString = () => {
    const d = new Date();
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    return `${months[d.getMonth()]} ${d.getFullYear()}`;
  };
  
  const targetMonth = getCurrentMonthString();
  const monthRecords = (attendanceList || []).filter(r => r.monthYear === targetMonth);
  
  let attendanceRate = 'N/A';
  let attendanceDesc = 'No logs for this month';
  
  if (monthRecords.length > 0) {
    const totalPresent = monthRecords.reduce((sum, r) => sum + r.presentDays, 0);
    const totalDays = monthRecords.reduce((sum, r) => sum + r.totalDays, 0);
    const rate = totalDays > 0 ? (totalPresent / totalDays) * 100 : 100;
    attendanceRate = `${rate.toFixed(1)}%`;
    const totalLop = monthRecords.reduce((sum, r) => sum + r.lopDays, 0);
    attendanceDesc = `${totalLop} LOP days logged`;
  }
  
  // Group by department
  const deptData = {};
  employees.forEach(emp => {
    const dept = emp.department || 'General';
    if (!deptData[dept]) {
      deptData[dept] = { count: 0, payroll: 0 };
    }
    deptData[dept].count += 1;
    deptData[dept].payroll += Number(emp.grossSalary) || 0;
  });

  const departments = Object.keys(deptData).map(name => ({
    name,
    count: deptData[name].count,
    payroll: deptData[name].payroll,
    percentage: totalPayroll > 0 ? Math.round((deptData[name].payroll / totalPayroll) * 100) : 0
  })).sort((a, b) => b.payroll - a.payroll);

  // Group by salary brackets
  const brackets = [
    { label: 'Under ₹25k', min: 0, max: 25000, count: 0 },
    { label: '₹25k - ₹50k', min: 25001, max: 50000, count: 0 },
    { label: '₹50k - ₹1L', min: 50001, max: 100000, count: 0 },
    { label: '₹1L - ₹2L', min: 100001, max: 200000, count: 0 },
    { label: 'Above ₹2L', min: 200001, max: Infinity, count: 0 }
  ];

  employees.forEach(emp => {
    const sal = Number(emp.grossSalary) || 0;
    const bracket = brackets.find(b => sal >= b.min && sal <= b.max);
    if (bracket) bracket.count += 1;
  });

  const maxBracketCount = Math.max(...brackets.map(b => b.count), 1);

  // Quick Stats
  const stats = [
    {
      title: 'Active Employees',
      value: employees.length,
      desc: 'Registered in directory',
      icon: <Users size={18} />,
      color: 'var(--accent-primary)',
      bg: 'rgba(99, 102, 241, 0.1)',
      onClick: () => onNavigate('employees')
    },
    {
      title: 'Monthly Payroll Outflow',
      value: formatCurrency(totalPayroll),
      desc: 'Cumulative gross CTC',
      icon: <CreditCard size={18} />,
      color: 'var(--success)',
      bg: 'rgba(52, 211, 153, 0.1)',
      onClick: () => onNavigate('salary-tracker')
    },
    {
      title: 'Average CTC',
      value: formatCurrency(avgSalary),
      desc: 'Per employee monthly',
      icon: <TrendingUp size={18} />,
      color: 'var(--warning)',
      bg: 'rgba(251, 191, 36, 0.1)',
      onClick: () => onNavigate('employees')
    },
    {
      title: 'Monthly Attendance Rate',
      value: attendanceRate,
      desc: attendanceDesc,
      icon: <CalendarRange size={18} />,
      color: 'var(--accent-hover)',
      bg: 'rgba(99, 102, 241, 0.08)',
      onClick: () => onNavigate('attendance')
    },
    {
      title: 'Documents Printed',
      value: historyList.length,
      desc: 'All-time audit trail log',
      icon: <FileText size={18} />,
      color: 'var(--danger)',
      bg: 'rgba(248, 113, 113, 0.1)',
      onClick: () => onNavigate('history')
    }
  ];

  return (
    <div className="dashboard-container" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Welcome Banner */}
      <div className="dashboard-welcome-card" style={{
        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(139, 92, 246, 0.08) 100%)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-xl)',
        padding: '1.5rem',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '0.25rem', color: 'var(--text-primary)' }}>HR Analytics Workspace</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', maxWidth: '500px' }}>
            Real-time visual insights for compensation plans, personnel distributions, and overall organizational payroll overhead.
          </p>
        </div>
        <div className="glow-effect" style={{
          position: 'absolute', right: '-50px', bottom: '-50px', width: '200px', height: '200px',
          background: 'var(--accent-gradient)', filter: 'blur(80px)', opacity: 0.15, pointerEvents: 'none'
        }} />
      </div>

      {/* HR Operations Structured Quick Access */}
      <div style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-lg)',
        padding: '1.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        boxShadow: 'var(--shadow-sm)'
      }}>
        
        <h3 style={{ 
          fontSize: '0.85rem', 
          fontWeight: '700', 
          color: 'var(--text-primary)', 
          margin: 0,
          borderBottom: '1px solid var(--border-color)', 
          paddingBottom: '0.5rem' 
        }}>
          HR Operations Control Center
        </h3>
        
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
          gap: '1.25rem',
          marginTop: '0.25rem'
        }}>
          
          {/* Column 1: Personnel & Roster */}
          <div style={{
            background: 'var(--bg-tertiary)',
            borderRadius: 'var(--radius-lg)',
            padding: '1.25rem',
            border: '1px solid var(--border-color)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.65rem'
          }}>
            <h4 style={{ fontSize: '0.7rem', fontWeight: '700', color: 'var(--accent-primary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>
              Personnel & Roster
            </h4>
            
            <div className="quick-action-row" onClick={() => onNavigate('employees')} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.65rem 0.75rem',
              background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', cursor: 'pointer', transition: 'var(--transition)'
            }}>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <Users size={14} style={{ color: 'var(--accent-primary)' }} />
                <span style={{ fontSize: '0.72rem', fontWeight: '500' }}>Manage Directory</span>
              </div>
              <ChevronRight size={13} style={{ color: 'var(--text-muted)' }} />
            </div>

            <div className="quick-action-row" onClick={() => onNavigate('attendance')} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.65rem 0.75rem',
              background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', cursor: 'pointer', transition: 'var(--transition)'
            }}>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <CalendarRange size={14} style={{ color: 'var(--accent-primary)' }} />
                <span style={{ fontSize: '0.72rem', fontWeight: '500' }}>Attendance Roster</span>
              </div>
              <ChevronRight size={13} style={{ color: 'var(--text-muted)' }} />
            </div>
          </div>

          {/* Column 2: Payroll Operations */}
          <div style={{
            background: 'var(--bg-tertiary)',
            borderRadius: 'var(--radius-lg)',
            padding: '1.25rem',
            border: '1px solid var(--border-color)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.65rem'
          }}>
            <h4 style={{ fontSize: '0.7rem', fontWeight: '700', color: 'var(--success)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>
              Payroll Management
            </h4>
            
            <div className="quick-action-row" onClick={() => onNavigate('salary')} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.65rem 0.75rem',
              background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', cursor: 'pointer', transition: 'var(--transition)'
            }}>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <CreditCard size={14} style={{ color: 'var(--success)' }} />
                <span style={{ fontSize: '0.72rem', fontWeight: '500' }}>Generate Payroll Slips</span>
              </div>
              <ChevronRight size={13} style={{ color: 'var(--text-muted)' }} />
            </div>

            <div className="quick-action-row" onClick={() => onNavigate('salary-tracker')} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.65rem 0.75rem',
              background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', cursor: 'pointer', transition: 'var(--transition)'
            }}>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <BarChart2 size={14} style={{ color: 'var(--warning)' }} />
                <span style={{ fontSize: '0.72rem', fontWeight: '500' }}>View Salary Ledger</span>
              </div>
              <ChevronRight size={13} style={{ color: 'var(--text-muted)' }} />
            </div>

            <div className="quick-action-row" onClick={() => onNavigate('email-config')} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.65rem 0.75rem',
              background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', cursor: 'pointer', transition: 'var(--transition)'
            }}>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <Mail size={14} style={{ color: 'var(--accent-hover)' }} />
                <span style={{ fontSize: '0.72rem', fontWeight: '500' }}>Email SMTP Settings</span>
              </div>
              <ChevronRight size={13} style={{ color: 'var(--text-muted)' }} />
            </div>
          </div>

          {/* Column 3: Document Creators */}
          <div style={{
            background: 'var(--bg-tertiary)',
            borderRadius: 'var(--radius-lg)',
            padding: '1.25rem',
            border: '1px solid var(--border-color)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.65rem'
          }}>
            <h4 style={{ fontSize: '0.7rem', fontWeight: '700', color: 'var(--warning)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>
              Document Creators
            </h4>
            
            <div className="quick-action-row" onClick={() => onNavigate('offer')} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.65rem 0.75rem',
              background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', cursor: 'pointer', transition: 'var(--transition)'
            }}>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <FileText size={14} style={{ color: '#60a5fa' }} />
                <span style={{ fontSize: '0.72rem', fontWeight: '500' }}>Offer Letter Creator</span>
              </div>
              <ChevronRight size={13} style={{ color: 'var(--text-muted)' }} />
            </div>

            <div className="quick-action-row" onClick={() => onNavigate('termination')} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.65rem 0.75rem',
              background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', cursor: 'pointer', transition: 'var(--transition)'
            }}>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <FileText size={14} style={{ color: '#f87171' }} />
                <span style={{ fontSize: '0.72rem', fontWeight: '500' }}>Exit Letter Creator</span>
              </div>
              <ChevronRight size={13} style={{ color: 'var(--text-muted)' }} />
            </div>

            <div className="quick-action-row" onClick={() => onNavigate('experience')} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.65rem 0.75rem',
              background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', cursor: 'pointer', transition: 'var(--transition)'
            }}>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <Award size={14} style={{ color: '#fbbf24' }} />
                <span style={{ fontSize: '0.72rem', fontWeight: '500' }}>Experience Certificate</span>
              </div>
              <ChevronRight size={13} style={{ color: 'var(--text-muted)' }} />
            </div>

            <div className="quick-action-row" onClick={() => onNavigate('custom')} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.65rem 0.75rem',
              background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', cursor: 'pointer', transition: 'var(--transition)'
            }}>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <Upload size={14} style={{ color: 'var(--accent-hover)' }} />
                <span style={{ fontSize: '0.72rem', fontWeight: '500' }}>Custom Templates Library</span>
              </div>
              <ChevronRight size={13} style={{ color: 'var(--text-muted)' }} />
            </div>

            <div className="quick-action-row" onClick={() => onNavigate('history')} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.65rem 0.75rem',
              background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', cursor: 'pointer', transition: 'var(--transition)'
            }}>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <History size={14} style={{ color: '#a78bfa' }} />
                <span style={{ fontSize: '0.72rem', fontWeight: '500' }}>Printed Archives logs</span>
              </div>
              <ChevronRight size={13} style={{ color: 'var(--text-muted)' }} />
            </div>
          </div>

        </div>
      </div>

      {/* KPI Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        {stats.map((stat, idx) => (
          <div 
            key={idx} 
            onClick={stat.onClick}
            style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-lg)',
              padding: '1.25rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem',
              cursor: 'pointer',
              boxShadow: 'var(--shadow-sm)',
              transition: 'transform 0.2s, box-shadow 0.2s, border-color 0.2s'
            }}
            className="kpi-card"
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)' }}>{stat.title}</span>
              <div style={{ width: '34px', height: '34px', borderRadius: '50%', backgroundColor: stat.bg, color: stat.color, display: 'flex', alignItems: 'center', justify: 'center' }}>
                {stat.icon}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '1.35rem', fontWeight: '700', color: 'var(--text-primary)', fontFamily: 'var(--font-family)', letterSpacing: '-0.02em' }}>{stat.value}</div>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{stat.desc}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem' }}>
        
        {/* Department Payroll */}
        <div style={{
          background: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-lg)', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1.25rem',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Award size={16} style={{ color: 'var(--accent-primary)' }} />
            <h3 style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-primary)' }}>Payroll Distribution by Department</h3>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {departments.map((dept, i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  <span style={{ fontWeight: '500' }}>{dept.name} <span style={{ color: 'var(--text-muted)', fontWeight: 'normal' }}>({dept.count} {dept.count === 1 ? 'employee' : 'employees'})</span></span>
                  <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{formatCurrency(dept.payroll)} ({dept.percentage}%)</span>
                </div>
                <div style={{ height: '8px', background: 'var(--bg-tertiary)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%',
                    width: `${dept.percentage}%`,
                    background: i === 0 ? 'var(--accent-gradient)' : i === 1 ? 'linear-gradient(135deg, #10b981, #34d399)' : 'linear-gradient(135deg, #f59e0b, #fbbf24)',
                    borderRadius: '4px',
                    transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)'
                  }} />
                </div>
              </div>
            ))}
            {departments.length === 0 && (
              <p style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)', padding: '2rem 0' }}>
                No department allocations calculated yet. Add employee salaries to populate data.
              </p>
            )}
          </div>
        </div>

        {/* Salary Brackets */}
        <div style={{
          background: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-lg)', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1.25rem',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BarChart2 size={16} style={{ color: 'var(--accent-primary)' }} />
            <h3 style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-primary)' }}>Compensation Ranges (Roster Count)</h3>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {brackets.map((bracket, i) => {
              const barWidth = Math.round((bracket.count / maxBracketCount) * 100);
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{ width: '85px', fontSize: '0.75rem', color: 'var(--text-secondary)', textAlign: 'right', fontWeight: '500' }}>
                    {bracket.label}
                  </span>
                  <div style={{ flex: 1, height: '24px', background: 'var(--bg-tertiary)', borderRadius: '4px', position: 'relative', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%',
                      width: `${barWidth}%`,
                      background: 'rgba(99, 102, 241, 0.15)',
                      borderRight: barWidth > 0 ? '2px solid var(--accent-primary)' : 'none',
                      transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)'
                    }} />
                    <span style={{
                      position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)',
                      fontSize: '0.7rem', fontWeight: '600', color: bracket.count > 0 ? 'var(--text-primary)' : 'var(--text-muted)'
                    }}>
                      {bracket.count} {bracket.count === 1 ? 'employee' : 'employees'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

    </div>
  );
}

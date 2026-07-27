import React, { useState, useEffect } from 'react';
import { CalendarRange, Check, AlertCircle, RefreshCw, Trash2, ShieldCheck, Calendar, X, Menu } from 'lucide-react';

export default function AttendanceTrackerView({ 
  employees, 
  attendanceList, 
  onSaveAttendance,
  onNavigate,
  sidebarCollapsed,
  toggleSidebarCollapse
}) {
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const d = new Date();
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    return `${months[d.getMonth()]} ${d.getFullYear()}`;
  });

  const [localRecords, setLocalRecords] = useState([]);
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Daily modal state
  const [modalEmployee, setModalEmployee] = useState(null);
  const [modalDays, setModalDays] = useState([]); // Array of daily statuses: 'P' | 'A' | 'L' | 'H'

  // Load attendance records for the selected month
  useEffect(() => {
    const records = attendanceList.filter(rec => rec.monthYear === selectedMonth);
    if (records.length > 0) {
      const synced = records.map(rec => {
        const emp = employees.find(e => e.id === rec.employeeId);
        return {
          ...rec,
          employeeName: emp ? emp.name : rec.employeeName,
          employeeCode: emp ? emp.empId : rec.employeeCode,
          designation: emp ? emp.designation : rec.designation,
          dailyDays: rec.dailyDays || Array(rec.totalDays).fill('P')
        };
      });
      setLocalRecords(synced);
      setIsInitialized(true);
    } else {
      setLocalRecords([]);
      setIsInitialized(false);
    }
  }, [selectedMonth, attendanceList, employees]);

  // Helper to retrieve standard day count and Sunday indexes
  const getMonthMetadata = (monthStr) => {
    let daysCount = 30;
    try {
      const parts = monthStr.split(' ');
      if (parts.length === 2) {
        const monthName = parts[0];
        const year = parseInt(parts[1], 10);
        const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        const monthIdx = months.indexOf(monthName);
        if (monthIdx !== -1) {
          daysCount = new Date(year, monthIdx + 1, 0).getDate();
        }
      }
    } catch (e) {
      console.error("Error calculating month details:", e);
    }
    return { daysCount };
  };

  const handleInitialize = () => {
    if (employees.length === 0) {
      alert("Employee Directory is empty! Register employees first.");
      return;
    }
    const { daysCount } = getMonthMetadata(selectedMonth);
    
    const newRecords = employees.map(emp => {
      // Default array: All days are 'P' (Present) as Saturday and Sunday are working days
      const dailyDays = Array(daysCount).fill('P');

      return {
        id: Date.now() + Math.random(),
        employeeId: emp.id,
        employeeName: emp.name,
        employeeCode: emp.empId || 'N/A',
        designation: emp.designation || 'N/A',
        monthYear: selectedMonth,
        totalDays: daysCount,
        presentDays: daysCount, // Initial present is full total
        lopDays: 0,
        dailyDays: dailyDays
      };
    });
    setLocalRecords(newRecords);
    setIsInitialized(true);
  };

  const handleUpdateRecord = (empId, field, val) => {
    setLocalRecords(prev => prev.map(rec => {
      if (rec.employeeId !== empId) return rec;

      let updated = { ...rec, [field]: Number(val) || 0 };
      if (field === 'lopDays') {
        updated.presentDays = Math.max(0, updated.totalDays - updated.lopDays);
      } else if (field === 'totalDays') {
        updated.presentDays = Math.max(0, updated.totalDays - updated.lopDays);
      } else if (field === 'presentDays') {
        updated.lopDays = Math.max(0, updated.totalDays - updated.presentDays);
      }
      return updated;
    }));
  };

  const handleSave = () => {
    if (localRecords.length === 0) return;
    onSaveAttendance(selectedMonth, localRecords);
    alert(`Attendance for ${selectedMonth} saved successfully!`);
  };

  const handleMarkAllFull = () => {
    setLocalRecords(prev => prev.map(rec => {
      const dailyDays = Array(rec.totalDays).fill('P');
      return {
        ...rec,
        presentDays: rec.totalDays,
        lopDays: 0,
        dailyDays: dailyDays
      };
    }));
  };

  const handleDeleteMonth = () => {
    if (window.confirm(`Are you sure you want to clear attendance ledger for ${selectedMonth}?`)) {
      onSaveAttendance(selectedMonth, []);
      setLocalRecords([]);
      setIsInitialized(false);
    }
  };

  // Open Daily Modal
  const openDailyModal = (record) => {
    setModalEmployee(record);
    setModalDays(record.dailyDays || Array(record.totalDays).fill('P'));
  };

  // Toggle single day status: P -> A -> L -> H -> P
  const toggleDayStatus = (index) => {
    const nextStatus = {
      'P': 'A', // Present to Absent (LOP)
      'A': 'L', // Absent to Paid Leave
      'L': 'H', // Leave to Holiday
      'H': 'P'  // Holiday to Present
    };
    setModalDays(prev => prev.map((status, idx) => idx === index ? nextStatus[status] : status));
  };

  // Save changes from Modal
  const saveDailyModalChanges = () => {
    const lopCount = modalDays.filter(s => s === 'A').length;
    const presentCount = modalDays.length - lopCount;

    setLocalRecords(prev => prev.map(rec => {
      if (rec.employeeId === modalEmployee.employeeId) {
        return {
          ...rec,
          lopDays: lopCount,
          presentDays: presentCount,
          dailyDays: [...modalDays]
        };
      }
      return rec;
    }));

    setModalEmployee(null);
  };

  // Helper to style daily calendar blocks
  const getDayBlockStyle = (status) => {
    switch (status) {
      case 'P':
        return { bg: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#10b981' }; // Present
      case 'A':
        return { bg: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.3)', color: 'var(--danger)' }; // LOP Absent
      case 'L':
        return { bg: 'rgba(99, 102, 241, 0.12)', border: '1px solid rgba(99, 102, 241, 0.3)', color: 'var(--accent-hover)' }; // Paid Leave
      case 'H':
        return { bg: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-muted)' }; // Weekend / Holiday
      default:
        return {};
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'P': return 'Present';
      case 'A': return 'LOP Absent';
      case 'L': return 'Paid Leave';
      case 'H': return 'Weekend/Holiday';
      default: return '';
    }
  };

  const getMonthOptions = () => {
    const list = [];
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const d = new Date();
    for (let i = -12; i <= 3; i++) {
      const target = new Date(d.getFullYear(), d.getMonth() + i, 1);
      list.push(`${months[target.getMonth()]} ${target.getFullYear()}`);
    }
    return list;
  };

  return (
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', minHeight: '100%', position: 'relative' }}>
      
      {/* Selector & Action bar */}
      <div style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-lg)',
        padding: '1.25rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '1rem',
        flexWrap: 'wrap',
        boxShadow: 'var(--shadow-sm)'
      }}>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {sidebarCollapsed && toggleSidebarCollapse && (
            <button 
              type="button" 
              onClick={toggleSidebarCollapse}
              className="btn-action-outline no-print"
              style={{ padding: '0.45rem 0.75rem', fontSize: '0.7rem', fontWeight: '700', borderRadius: '6px', marginRight: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <Menu size={12} /> Sidebar
            </button>
          )}
          <div style={{
            background: 'rgba(99, 102, 241, 0.1)',
            padding: '8px',
            borderRadius: '8px',
            color: 'var(--accent-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <CalendarRange size={20} />
          </div>
          <div>
            <h2 style={{ fontSize: '1rem', fontWeight: '700', margin: 0, color: 'var(--text-primary)' }}>Monthly Attendance Roster</h2>
            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: 0 }}>Sync working days and Loss of Pay (LOP) to payroll calculations</p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Select Period:</label>
          <select 
            value={selectedMonth} 
            onChange={e => setSelectedMonth(e.target.value)} 
            className="doc-form-input"
            style={{ width: '180px', padding: '0.45rem', fontSize: '0.75rem', fontWeight: '500' }}
          >
            {getMonthOptions().map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>

          {isInitialized && (
            <>
              <button 
                type="button" 
                onClick={handleMarkAllFull} 
                className="btn-action-outline"
                style={{ fontSize: '0.75rem', padding: '0.45rem 0.75rem' }}
              >
                <Check size={13} /> Full Attendance
              </button>
              <button 
                type="button" 
                onClick={handleDeleteMonth} 
                className="btn-action-outline btn-action-danger"
                style={{ fontSize: '0.75rem', padding: '0.45rem 0.75rem' }}
              >
                <Trash2 size={13} /> Clear Month
              </button>
            </>
          )}
        </div>

      </div>

      {/* Main Roster Panel */}
      <div style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-sm)',
        overflow: 'hidden',
        flex: 1,
        display: 'flex',
        flexDirection: 'column'
      }}>
        
        {!isInitialized ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '4rem 2rem',
            textAlign: 'center',
            gap: '1rem',
            flex: 1
          }}>
            <AlertCircle size={40} style={{ color: 'var(--text-muted)' }} />
            <div>
              <h3 style={{ fontSize: '0.95rem', fontWeight: '600', color: 'var(--text-primary)', margin: '0 0 4px 0' }}>Roster Uninitialized</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', maxWidth: '380px', margin: 0 }}>
                Attendance records for <strong>{selectedMonth}</strong> have not been configured yet. Initialize to copy all active employees from the directory.
              </p>
            </div>
            <button 
              type="button" 
              onClick={handleInitialize} 
              className="btn-action-primary"
              style={{ padding: '0.65rem 1.25rem', display: 'flex', gap: '6px', alignItems: 'center' }}
            >
              <RefreshCw size={14} /> Initialize {selectedMonth} Attendance
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%', flex: 1 }}>
            
            {/* Ledger Table */}
            <div style={{ overflowX: 'auto', flex: 1 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.8rem' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-tertiary)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontWeight: '600' }}>
                    <th style={{ padding: '0.85rem 1.25rem' }}>Employee Profile</th>
                    <th style={{ padding: '0.85rem 1.25rem' }}>Designation</th>
                    <th style={{ padding: '0.85rem 1.25rem', width: '110px', textAlign: 'center' }}>Total Days</th>
                    <th style={{ padding: '0.85rem 1.25rem', width: '110px', textAlign: 'center' }}>Loss of Pay (LOP)</th>
                    <th style={{ padding: '0.85rem 1.25rem', width: '110px', textAlign: 'center' }}>Present / Paid Days</th>
                    <th style={{ padding: '0.85rem 1.25rem', width: '150px', textAlign: 'center' }}>Calculations status</th>
                    <th style={{ padding: '0.85rem 1.25rem', width: '140px', textAlign: 'center' }}>Daily Logs</th>
                  </tr>
                </thead>
                <tbody>
                  {localRecords.map(rec => (
                    <tr key={rec.employeeId} className="table-row-hover" style={{ borderBottom: '1px solid var(--border-color)', transition: 'var(--transition)' }}>
                      
                      <td style={{ padding: '0.85rem 1.25rem' }}>
                        <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{rec.employeeName}</div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '2px' }}>ID: {rec.employeeCode}</div>
                      </td>

                      <td style={{ padding: '0.85rem 1.25rem', color: 'var(--text-secondary)', fontWeight: '500' }}>
                        {rec.designation}
                      </td>

                      <td style={{ padding: '0.85rem 1.25rem', textAlign: 'center' }}>
                        <input 
                          type="number" 
                          value={rec.totalDays} 
                          min="1" 
                          max="31"
                          onChange={e => handleUpdateRecord(rec.employeeId, 'totalDays', e.target.value)}
                          className="doc-form-input"
                          style={{ width: '70px', padding: '0.35rem', textAlign: 'center', margin: '0 auto', fontSize: '0.75rem' }}
                        />
                      </td>

                      <td style={{ padding: '0.85rem 1.25rem', textAlign: 'center' }}>
                        <input 
                          type="number" 
                          value={rec.lopDays} 
                          min="0" 
                          max={rec.totalDays}
                          onChange={e => handleUpdateRecord(rec.employeeId, 'lopDays', e.target.value)}
                          className="doc-form-input"
                          style={{ 
                            width: '70px', padding: '0.35rem', textAlign: 'center', margin: '0 auto', fontSize: '0.75rem',
                            borderColor: rec.lopDays > 0 ? 'rgba(239, 68, 68, 0.4)' : 'var(--border-color)',
                            color: rec.lopDays > 0 ? 'var(--danger)' : 'var(--text-primary)',
                            fontWeight: rec.lopDays > 0 ? '600' : 'normal'
                          }}
                        />
                      </td>

                      <td style={{ padding: '0.85rem 1.25rem', textAlign: 'center', fontWeight: '700', color: 'var(--text-primary)', fontSize: '0.85rem' }}>
                        {rec.presentDays}
                      </td>

                      <td style={{ padding: '0.85rem 1.25rem', textAlign: 'center' }}>
                        {rec.lopDays === 0 ? (
                          <span style={{
                            padding: '0.15rem 0.45rem', borderRadius: '4px', fontSize: '0.65rem', fontWeight: '600',
                            background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', display: 'inline-flex', gap: '3px', alignItems: 'center'
                          }}>
                            <ShieldCheck size={11} /> Standard
                          </span>
                        ) : (
                          <span style={{
                            padding: '0.15rem 0.45rem', borderRadius: '4px', fontSize: '0.65rem', fontWeight: '600',
                            background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', display: 'inline-flex', gap: '3px', alignItems: 'center'
                          }}>
                            Pro-rated (-{rec.lopDays}d)
                          </span>
                        )}
                      </td>

                      <td style={{ padding: '0.85rem 1.25rem', textAlign: 'center' }}>
                        <button
                          type="button"
                          onClick={() => openDailyModal(rec)}
                          className="btn-action-outline"
                          style={{
                            padding: '0.35rem 0.65rem',
                            fontSize: '0.7rem',
                            display: 'inline-flex',
                            gap: '4px',
                            alignItems: 'center',
                            borderColor: 'rgba(99, 102, 241, 0.25)',
                            color: 'var(--accent-hover)'
                          }}
                        >
                          <Calendar size={12} /> Log Daily
                        </button>
                      </td>

                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Bottom save bar */}
            <div style={{
              borderTop: '1px solid var(--border-color)',
              padding: '1rem 1.25rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: 'var(--bg-tertiary)'
            }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                Logging attendance details for <strong>{localRecords.length} employees</strong>.
              </span>
              <button 
                type="button" 
                onClick={handleSave} 
                className="btn-action-primary"
                style={{ padding: '0.6rem 1.5rem', display: 'flex', gap: '6px', alignItems: 'center' }}
              >
                <Check size={14} /> Save Attendance Ledger
              </button>
            </div>

          </div>
        )}

      </div>

      {/* Daily Attendance Calendar Modal */}
      {modalEmployee && (
        <div className="modal-overlay" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(10, 12, 22, 0.75)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '1rem'
        }}>
          
          <div style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-xl)',
            width: '100%',
            maxWidth: '520px',
            boxShadow: 'var(--shadow-lg)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}>
            
            {/* Modal Header */}
            <div style={{
              padding: '1.25rem',
              borderBottom: '1px solid var(--border-color)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: 'var(--bg-tertiary)'
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '0.9rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                  Daily Roster: {modalEmployee.employeeName}
                </h3>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                  Logging attendance for {selectedMonth}
                </span>
              </div>
              <button 
                type="button" 
                onClick={() => setModalEmployee(null)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Content */}
            <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              
              {/* Legends explanation */}
              <div style={{ 
                display: 'flex', 
                flexWrap: 'wrap', 
                gap: '8px', 
                padding: '8px', 
                background: 'var(--bg-primary)', 
                borderRadius: '6px',
                fontSize: '0.65rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ display: 'inline-block', width: '12px', height: '12px', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10b981', borderRadius: '3px' }}></span>
                  <span style={{ color: 'var(--text-secondary)' }}>Present (P)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ display: 'inline-block', width: '12px', height: '12px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid var(--danger)', borderRadius: '3px' }}></span>
                  <span style={{ color: 'var(--text-secondary)' }}>LOP Absent (A)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ display: 'inline-block', width: '12px', height: '12px', background: 'rgba(99, 102, 241, 0.15)', border: '1px solid var(--accent-hover)', borderRadius: '3px' }}></span>
                  <span style={{ color: 'var(--text-secondary)' }}>Paid Leave (L)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ display: 'inline-block', width: '12px', height: '12px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '3px' }}></span>
                  <span style={{ color: 'var(--text-secondary)' }}>Weekend/Holiday (H)</span>
                </div>
              </div>

              {/* Day Selection Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 1fr)',
                gap: '6px',
                maxHeight: '260px',
                overflowY: 'auto',
                padding: '2px'
              }}>
                {modalDays.map((status, idx) => {
                  const styles = getDayBlockStyle(status);
                  return (
                    <div 
                      key={idx}
                      onClick={() => toggleDayStatus(idx)}
                      style={{
                        backgroundColor: styles.bg,
                        border: styles.border,
                        color: styles.color,
                        borderRadius: '6px',
                        padding: '8px 0',
                        textAlign: 'center',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center',
                        transition: 'transform 0.1s',
                        userSelect: 'none'
                      }}
                      className="calendar-day-block"
                      title={`Day ${idx + 1}: ${getStatusLabel(status)} (Click to toggle)`}
                    >
                      <span style={{ fontSize: '0.75rem', fontWeight: '700' }}>{idx + 1}</span>
                      <span style={{ fontSize: '0.6rem', fontWeight: '800', marginTop: '2px', opacity: 0.9 }}>{status}</span>
                    </div>
                  );
                })}
              </div>

              {/* Live calculations preview */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr 1fr',
                gap: '8px',
                textAlign: 'center',
                paddingTop: '0.5rem'
              }}>
                <div style={{ background: 'var(--bg-primary)', padding: '8px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: '500' }}>Month total</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: '700', color: 'var(--text-primary)', marginTop: '2px' }}>{modalDays.length}d</div>
                </div>
                <div style={{ background: 'rgba(16, 185, 129, 0.05)', padding: '8px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.65rem', color: '#10b981', fontWeight: '600' }}>Present</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: '700', color: '#10b981', marginTop: '2px' }}>{modalDays.filter(s => s === 'P').length}d</div>
                </div>
                <div style={{ background: 'rgba(239, 68, 68, 0.05)', padding: '8px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.65rem', color: 'var(--danger)', fontWeight: '600' }}>LOP Absents</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: '700', color: 'var(--danger)', marginTop: '2px' }}>{modalDays.filter(s => s === 'A').length}d</div>
                </div>
                <div style={{ background: 'rgba(99, 102, 241, 0.05)', padding: '8px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.65rem', color: 'var(--accent-hover)', fontWeight: '600' }}>Paid Leaves</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: '700', color: 'var(--accent-hover)', marginTop: '2px' }}>{modalDays.filter(s => s === 'L').length}d</div>
                </div>
              </div>

            </div>

            {/* Modal Actions */}
            <div style={{
              padding: '1rem 1.25rem',
              borderTop: '1px solid var(--border-color)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: 'var(--bg-tertiary)'
            }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', maxWidth: '240px' }}>
                * Leaves & Holidays count as standard paid days. LOP reduces paid present count.
              </span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button 
                  type="button" 
                  onClick={() => setModalEmployee(null)} 
                  className="btn-action-outline"
                  style={{ fontSize: '0.75rem', padding: '0.5rem 0.85rem' }}
                >
                  Cancel
                </button>
                <button 
                  type="button" 
                  onClick={saveDailyModalChanges} 
                  className="btn-action-primary"
                  style={{ fontSize: '0.75rem', padding: '0.5rem 1.25rem' }}
                >
                  Save Daily logs
                </button>
              </div>
            </div>

          </div>

        </div>
      )}

    </div>
  );
}

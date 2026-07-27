import React, { useState, useEffect } from 'react';
import { 
  DEFAULT_OFFER_LETTER, 
  DEFAULT_TERMINATION_LETTER, 
  DEFAULT_EXPERIENCE_LETTER, 
  DEFAULT_SALARY_SLIP 
} from './lib/templates';
import OfferLetterView from './components/OfferLetterView';
import TerminationLetterView from './components/TerminationLetterView';
import ExperienceLetterView from './components/ExperienceLetterView';
import SalarySlipView from './components/SalarySlipView';
import BatchSalarySlips from './components/BatchSalarySlips';
import DashboardView from './components/DashboardView';
import SalaryTrackerView from './components/SalaryTrackerView';
import EmployeeDirectoryView from './components/EmployeeDirectoryView';
import HistoryView from './components/HistoryView';
import EmailConfigView from './components/EmailConfigView';
import AttendanceTrackerView from './components/AttendanceTrackerView';
import CustomTemplateView from './components/CustomTemplateView';
import CustomTemplatesList from './components/CustomTemplatesList';
import { extractTextFromDocx, extractTextFromPdf } from './lib/docxPdfParser';
import { 
  Printer, RefreshCw, Trash2, Eye, FileText, Upload, Palette, 
  Moon, Sun, Download, FileArchive, LayoutDashboard, Users, History as HistoryIcon, Layers, CreditCard, Mail, CalendarRange,
  ChevronLeft, Menu
} from 'lucide-react';
import html2pdf from 'html2pdf.js';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

// Bind ipcRenderer to window object in Electron environment
if (typeof window !== 'undefined' && window.require) {
  try {
    window.ipcRenderer = window.require('electron').ipcRenderer;
  } catch (e) {
    console.warn('Electron IPC not available in this environment:', e);
  }
}

const MONTH_OPTIONS = (() => {
  const list = [];
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const d = new Date();
  for (let i = -12; i <= 3; i++) {
    const target = new Date(d.getFullYear(), d.getMonth() + i, 1);
    list.push(`${months[target.getMonth()]} ${target.getFullYear()}`);
  }
  return list;
})();

const getCurrencySymbol = (code) => {
  if (code === 'INR') return '₹';
  if (code === 'USD') return '$';
  if (code === 'EUR') return '€';
  if (code === 'GBP') return '£';
  return '₹';
};

const DEFAULT_CUSTOM_TEMPLATE = {
  id: 'default-memo',
  name: 'Standard Memorandum',
  body: `MEMORANDUM OF APPOINTMENT

Date: {{Date}}

To,
{{Employee Name}}
{{Address}}

Dear {{Employee Name}},

We are pleased to offer you employment at {{Company Name}} as a {{Position}}.

Your monthly gross salary will be {{Monthly Salary}}.

Please sign below to accept this appointment.

Sincerely,
{{Signee Name}}
{{Signee Title}}`
};

const DEFAULT_OFFER_BODY_TEMPLATE = `We are pleased to offer you the position of {{position}} with {{companyName}}. We believe your skills and capabilities will be a valuable asset to our organization.

1. Role and Key Details:
- Designation: {{position}}
- Date of Joining: {{joiningDate}}
- Probation Period: {{probationPeriod}} from the date of joining.
- Reporting Structure: You will report to your assigned {{reportingManager}}.
- Work Location: You will work from the office location designated by the Company.

2. Working Hours & Attendance:
Your regular working hours shall be from {{workingHours}}. The Company reserves the right to modify work schedules based on business requirements.

3. Leaves & Holidays:
Leave entitlement and holidays shall be governed by the Company's HR Leave Policy in effect from time to time.

<!-- pagebreak -->

4. Confidentiality & Non-Disclosure:
You shall maintain strict confidentiality regarding all Company proprietary information, business strategies, technical processes, client records, and other trade secrets. This obligation remains in force during and after your employment.

5. Intellectual Property Rights:
Any inventions, designs, code, structures, or intellectual works created by you during your employment with the Company shall belong exclusively to the Company.

6. Non-Solicitation:
During your employment and for a period of six (6) months after separation, you shall not directly or indirectly solicit Company employees, client contacts, or business consultants for competing business activities.

7. Termination & Separation:
- During Probation: Either party may terminate employment by providing seven (7) days written notice.
- After Confirmation: Either party may terminate employment by providing thirty (30) days written notice.
- The Company reserves the right to terminate employment immediately for cause (misconduct, fraud, policy violations, or breach of confidentiality).

<!-- pagebreak -->

8. Governing Law & Dispute Resolution:
This agreement shall be governed by and construed in accordance with the laws of India. Any disputes arising out of this employment shall be subject to the exclusive jurisdiction of the courts located in Hyderabad, Telangana.

9. Acceptance of Offer:
To confirm your acceptance, please sign and return a copy of this letter along with your self-attested photo ID, address proof, bank account details, and passport-size photographs.

We welcome you to {{companyName}} and look forward to a successful and mutually beneficial association.`;

const DEFAULT_TERMINATION_BODY_TEMPLATE = `We regret to inform you that your employment with {{companyName}} as {{position}} is being terminated, effective {{terminationDate}}.

This decision was taken after careful consideration and is due to {{reason}}. This termination is in accordance with your employment agreement.

As per the terms of your contract, you are required to serve a notice period of {{noticePeriod}}. Accordingly, your last working day with the Company will be {{lastWorkingDate}}.

Please ensure a complete and professional handover of all current projects, tasks, and documentation to your assigned team lead before your last working day. Additionally, you are requested to return all company-owned property (including laptop, access badges, ID cards, and files) in your possession on or before {{lastWorkingDate}}.

Your final settlement, including any accrued salary, unpaid allowances, and other legal dues, will be processed and credited to your registered bank account within thirty (30) days of your last working date, subject to complete clearance from all departments.

We remind you of your post-employment confidentiality obligations as set out in your employment agreement. We thank you for your contributions during your time with {{companyName}} and wish you success in your future endeavors.`;

const DEFAULT_EXPERIENCE_BODY_TEMPLATE = `This is to certify that {{employeeName}} was employed with {{companyName}} as a {{position}}. Their period of service was from {{joiningDate}} to {{leavingDate}}.

During their tenure with us, their primary responsibilities included:
{{keyResponsibilities}}

Performance and Conduct:
{{performanceDescription}}

We found them to be extremely professional, target-driven, and cooperative. They maintained a positive relationship with colleagues, management, and clients alike, demonstrating strong technical execution and dedication.

We thank them for their services and contributions to {{companyName}}, and we wish them the absolute best in all their future professional endeavors.`;


export default function App() {
  const [docType, setDocType] = useState('dashboard'); // 'dashboard' | 'offer' | 'termination' | 'experience' | 'salary' | 'history' | 'employees' | 'salary-tracker' | 'email-config' | 'attendance'
  
  // Custom Templates State
  const [customTemplates, setCustomTemplates] = useState(() => {
    const saved = localStorage.getItem('doc_generator_custom_templates');
    if (saved) return JSON.parse(saved);
    return [DEFAULT_CUSTOM_TEMPLATE];
  });
  const [activeCustomTemplate, setActiveCustomTemplate] = useState(null);
  const [customTemplateName, setCustomTemplateName] = useState('');
  const [customTemplateBody, setCustomTemplateBody] = useState('');
  const [customTemplateFields, setCustomTemplateFields] = useState([]);
  const [customFieldValues, setCustomFieldValues] = useState({});
  const [showCustomEditor, setShowCustomEditor] = useState(true);

  // Batch Mode State
  const [isBatchMode, setIsBatchMode] = useState(false);
  const [selectedBatchIds, setSelectedBatchIds] = useState([]);
  const [batchMonthYear, setBatchMonthYear] = useState('');
  const batchRef = React.useRef(null);
  
  // State for branding assets upload
  const [customLogo, setCustomLogo] = useState(null);
  const [customSignature, setCustomSignature] = useState(null);
  const [companyName, setCompanyName] = useState('Lumina Workforce Private Limited');
  const [companyLocation, setCompanyLocation] = useState('4th Floor, Unit No 405-411, Bizeness Square, Madhapur, Shaikpet, Hyderabad - 500081');
  const [logoSize, setLogoSize] = useState(60);
  const [logoX, setLogoX] = useState(0);
  const [logoY, setLogoY] = useState(10);
  const [activePreviewType, setActivePreviewType] = useState('offer');
  
  const [historyList, setHistoryList] = useState(() => JSON.parse(localStorage.getItem('doc_generator_history') || '[]'));
  const [salaryHistory, setSalaryHistory] = useState(() => JSON.parse(localStorage.getItem('doc_generator_salary_history') || '[]'));
  const [smtpConfig, setSmtpConfig] = useState(() => JSON.parse(localStorage.getItem('doc_generator_smtp_config') || '{}'));
  const [attendanceList, setAttendanceList] = useState(() => JSON.parse(localStorage.getItem('doc_generator_attendance') || '[]'));
  const [template, setTemplate] = useState('corporate'); // 'corporate' | 'minimal' | 'executive'
  
  const [employees, setEmployees] = useState(() => {
    const raw = JSON.parse(localStorage.getItem('doc_generator_employees') || '[]');
    return raw.map(emp => ({
      ...emp,
      pan: emp.pan || '',
      uan: emp.uan || '',
      esic: emp.esic || ''
    }));
  });
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [empForm, setEmpForm] = useState({
    id: '', name: '', empId: '', designation: '', department: '', address: '',
    joiningDate: '', grossSalary: '', bankName: '', accountNumber: '', email: '',
    pan: '', uan: '', esic: ''
  });

  // Premium Customizations & Custom Compensation Columns state
  const [selectedCurrency, setSelectedCurrency] = useState(() => localStorage.getItem('doc_generator_currency') || 'INR');
  const [accentColor, setAccentColor] = useState(() => localStorage.getItem('doc_generator_accent_color') || '#6366f1');
  const [customEarningsList, setCustomEarningsList] = useState(() => JSON.parse(localStorage.getItem('doc_generator_custom_earnings') || '[]'));
  const [customDeductionsList, setCustomDeductionsList] = useState(() => JSON.parse(localStorage.getItem('doc_generator_custom_deductions') || '[]'));

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('doc_generator_currency', selectedCurrency);
  }, [selectedCurrency]);

  useEffect(() => {
    localStorage.setItem('doc_generator_accent_color', accentColor);
  }, [accentColor]);

  useEffect(() => {
    localStorage.setItem('doc_generator_custom_earnings', JSON.stringify(customEarningsList));
  }, [customEarningsList]);

  useEffect(() => {
    localStorage.setItem('doc_generator_custom_deductions', JSON.stringify(customDeductionsList));
  }, [customDeductionsList]);

  // Theme State
  const [theme, setTheme] = useState(() => localStorage.getItem('doc_generator_theme') || 'dark');

  useEffect(() => {
    if (theme === 'light') {
      document.body.classList.add('light-theme');
    } else {
      document.body.classList.remove('light-theme');
    }
  }, [theme]);

  // Parse placeholders from custom template body in real-time
  useEffect(() => {
    const regex = /\{\{\s*(.*?)\s*\}\}/g;
    const matches = [];
    let match;
    while ((match = regex.exec(customTemplateBody || '')) !== null) {
      const placeholder = match[1].trim();
      if (!matches.includes(placeholder)) {
        matches.push(placeholder);
      }
    }
    setCustomTemplateFields(matches);
  }, [customTemplateBody]);

  // Bind global helper to focus inputs from preview clicks
  useEffect(() => {
    window.focusInput = (id) => {
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.focus();
        el.classList.add('focused-highlight');
        setTimeout(() => {
          el.classList.remove('focused-highlight');
        }, 1500);
      }
    };
    return () => {
      delete window.focusInput;
    };
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('doc_generator_theme', newTheme);
  };

  // Sidebar Resizing State
  const [sidebarWidth, setSidebarWidth] = useState(() => Number(localStorage.getItem('doc_generator_sidebar_width')) || 440);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => localStorage.getItem('doc_generator_sidebar_collapsed') === 'true');
  const [isDragging, setIsDragging] = useState(false);

  const toggleSidebarCollapse = () => {
    const nextVal = !sidebarCollapsed;
    setSidebarCollapsed(nextVal);
    localStorage.setItem('doc_generator_sidebar_collapsed', nextVal.toString());
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging) return;
      let newWidth = e.clientX;
      if (newWidth < 280) newWidth = 280;
      if (newWidth > 800) newWidth = 800;
      setSidebarWidth(newWidth);
    };

    const handleMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
        localStorage.setItem('doc_generator_sidebar_width', sidebarWidth.toString());
      }
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, sidebarWidth]);

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCustomLogo(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSignatureUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCustomSignature(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };
  
  // State for forms
  const [offerData, setOfferData] = useState(DEFAULT_OFFER_LETTER);
  const [terminationData, setTerminationData] = useState(DEFAULT_TERMINATION_LETTER);
  const [experienceData, setExperienceData] = useState(DEFAULT_EXPERIENCE_LETTER);
  const [salaryData, setSalaryData] = useState(DEFAULT_SALARY_SLIP);

  // Sync Monthly and Annual salaries for Offer Letter
  const handleOfferMonthlyChange = (val) => {
    setOfferData(prev => ({
      ...prev,
      monthlySalary: val,
      annualSalary: val * 12
    }));
  };

  const handleOfferAnnualChange = (val) => {
    setOfferData(prev => ({
      ...prev,
      annualSalary: val,
      monthlySalary: Math.round(val / 12)
    }));
  };

  // Salary slip autofill - Indian Law Compliant
  const [grossInput, setGrossInput] = useState(15000);
  const [pfType, setPfType] = useState('capped'); // 'capped', 'full', 'none'
  const [includeEsi, setIncludeEsi] = useState(false);

  // Advanced TDS Calculation (New Tax Regime FY 2024-25 / Budget 2024)
  const calculateIndianIncomeTax = (monthlyG) => {
    const annualGross = monthlyG * 12;
    const standardDeduction = 75000;
    const taxableIncome = Math.max(0, annualGross - standardDeduction);
    if (taxableIncome <= 700000) return 0;
    
    let tax = 0;
    if (taxableIncome > 300000) tax += Math.min(400000, taxableIncome - 300000) * 0.05;
    if (taxableIncome > 700000) tax += Math.min(300000, taxableIncome - 700000) * 0.10;
    if (taxableIncome > 1000000) tax += Math.min(200000, taxableIncome - 1000000) * 0.15;
    if (taxableIncome > 1200000) tax += Math.min(300000, taxableIncome - 1200000) * 0.20;
    if (taxableIncome > 1500000) tax += (taxableIncome - 1500000) * 0.30;
    const cess = tax * 0.04;
    return Math.round((tax + cess) / 12);
  };

  const autofillSalaryBreakdown = () => {
    const gross = Number(grossInput) || 0;
    const lop = Number(salaryData.lopDays) || 0;
    const paidDays = 30 - lop;
    
    // Standard base rates
    const stdBasic = Math.round(gross * 0.50);
    const stdHra = Math.round(stdBasic * 0.40);
    const stdConveyance = gross > 3000 ? 1600 : 0;
    const stdSpecial = gross - (stdBasic + stdHra + stdConveyance);
    
    // Earned pro-rated rates
    const proRatedGross = Math.round((gross / 30) * paidDays);
    const basic = Math.round(proRatedGross * 0.50);
    const hra = Math.round(basic * 0.40); 
    const conveyance = proRatedGross > 3000 ? 1600 : 0; 
    const special = proRatedGross - (basic + hra + conveyance);
    
    const pf = pfType === 'capped' ? Math.min(Math.round(basic * 0.12), 1800) : pfType === 'full' ? Math.round(basic * 0.12) : 0;
    let esi = (includeEsi && gross <= 21000) ? Math.ceil(proRatedGross * 0.0075) : 0;
    const pt = gross > 15000 ? 200 : (gross > 10000 ? 150 : 0);
    const monthlyTDS = calculateIndianIncomeTax(gross);

    setSalaryData(prev => ({
      ...prev,
      paidDays,
      stdBasicSalary: stdBasic,
      stdHra: stdHra,
      stdConveyanceAllowance: stdConveyance,
      stdSpecialAllowance: stdSpecial > 0 ? stdSpecial : 0,
      basicSalary: basic,
      hra,
      conveyanceAllowance: conveyance,
      specialAllowance: special > 0 ? special : 0,
      providentFund: pf,
      professionalTax: pt,
      esi,
      incomeTax: monthlyTDS,
      currencyCode: selectedCurrency,
      currencySymbol: getCurrencySymbol(selectedCurrency),
      accentColor: accentColor,
      customEarnings: customEarningsList,
      customDeductions: customDeductionsList
    }));
  };

  const getBatchData = () => {
    return employees.filter(emp => selectedBatchIds.includes(emp.id)).map(emp => {
      const month = batchMonthYear || salaryData.monthYear;
      const att = attendanceList.find(a => a.employeeId === emp.id && a.monthYear === month);
      
      const paidDays = att ? att.presentDays : 30;
      const lopDays = att ? att.lopDays : 0;
      
      const gross = Number(emp.grossSalary) || 0;
      
      // Standard base rates
      const stdBasic = Math.round(gross * 0.50);
      const stdHra = Math.round(stdBasic * 0.40);
      const stdConveyance = gross > 3000 ? 1600 : 0;
      const stdSpecial = gross - (stdBasic + stdHra + stdConveyance);
      
      // Earned pro-rated rates
      const proRatedGross = Math.round((gross / 30) * paidDays);
      const basic = Math.round(proRatedGross * 0.50);
      const hra = Math.round(basic * 0.40); 
      const conveyance = proRatedGross > 3000 ? 1600 : 0; 
      const special = proRatedGross - (basic + hra + conveyance);
      
      const pf = pfType === 'capped' ? Math.min(Math.round(basic * 0.12), 1800) : pfType === 'full' ? Math.round(basic * 0.12) : 0;
      let esi = (includeEsi && gross <= 21000) ? Math.ceil(proRatedGross * 0.0075) : 0;
      const pt = gross > 15000 ? 200 : (gross > 10000 ? 150 : 0);
      const monthlyTDS = calculateIndianIncomeTax(gross);

      return {
        monthYear: month,
        employeeName: emp.name,
        employeeId: emp.empId,
        designation: emp.designation,
        bankName: emp.bankName,
        accountNumber: emp.accountNumber,
        employeeEmail: emp.email || '',
        pan: emp.pan || '',
        uan: emp.uan || '',
        esic: emp.esic || '',
        department: emp.department || '',
        joiningDate: emp.joiningDate || '',
        paidDays: paidDays,
        lopDays: lopDays,
        stdBasicSalary: stdBasic,
        stdHra: stdHra,
        stdConveyanceAllowance: stdConveyance,
        stdSpecialAllowance: stdSpecial > 0 ? stdSpecial : 0,
        basicSalary: basic,
        hra,
        conveyanceAllowance: conveyance,
        specialAllowance: special > 0 ? special : 0,
        providentFund: pf,
        professionalTax: pt,
        esi,
        incomeTax: monthlyTDS,
        currencyCode: selectedCurrency,
        currencySymbol: getCurrencySymbol(selectedCurrency),
        accentColor: accentColor,
        customEarnings: customEarningsList,
        customDeductions: customDeductionsList,
        signeeName: salaryData.signeeName
      };
    });
  };

  const handleDownloadBatchZip = async () => {
    if (selectedBatchIds.length === 0) {
      alert("Select at least one employee for batch download.");
      return;
    }
    
    const batchData = getBatchData();
    const duplicates = batchData.filter(bd => 
      salaryHistory.some(r => r.employeeId === bd.employeeId && r.monthYear === bd.monthYear)
    );
    
    if (duplicates.length > 0) {
      const names = duplicates.map(d => `${d.employeeName} (${d.monthYear})`).join(', ');
      const proceed = window.confirm(`Salary slips already exist for: ${names}. Do you want to overwrite them in the ledger?`);
      if (!proceed) return;
    }

    alert("Generating individual PDFs... this might take a few moments.");
    
    // Save to salary ledger
    batchData.forEach(data => saveSalaryToHistory(data));
    
    const zip = new JSZip();
    const children = batchRef.current.querySelectorAll('.preview-document-container');
    
    for (let i = 0; i < children.length; i++) {
      const element = children[i];
      const empData = batchData[i];
      const opt = {
        margin:       0,
        filename:     `Salary_Slip_${empData.employeeName.replace(/ /g, '_')}_${empData.monthYear}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2 },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };
      
      const pdfBlob = await html2pdf().set(opt).from(element).output('blob');
      zip.file(opt.filename, pdfBlob);
    }
    
    zip.generateAsync({ type: 'blob' }).then(content => {
      saveAs(content, `Salary_Slips_Batch_${batchMonthYear || 'Export'}.zip`);
    });
  };

  const handlePrintBatch = () => {
    if (selectedBatchIds.length === 0) {
      alert("Select at least one employee for batch printing.");
      return;
    }
    
    const batchData = getBatchData();
    const duplicates = batchData.filter(bd => 
      salaryHistory.some(r => r.employeeId === bd.employeeId && r.monthYear === bd.monthYear)
    );
    
    if (duplicates.length > 0) {
      const names = duplicates.map(d => `${d.employeeName} (${d.monthYear})`).join(', ');
      const proceed = window.confirm(`Salary slips already exist for: ${names}. Do you want to print and overwrite them in the ledger?`);
      if (!proceed) return;
    }

    // Save to salary ledger
    batchData.forEach(data => saveSalaryToHistory(data));
    window.print();
  };

  const changeDocType = (type) => {
    setDocType(type);
    if (['offer', 'termination', 'experience', 'salary', 'custom'].includes(type)) {
      setActivePreviewType(type);
      setSidebarCollapsed(false);
      localStorage.setItem('doc_generator_sidebar_collapsed', 'false');
    }
  };

  const handleSaveCustomTemplate = () => {
    if (!customTemplateName) return alert("Template Name is required!");
    
    let updated;
    const isNew = !customTemplates.some(t => t.id === activeCustomTemplate.id);
    
    if (isNew) {
      const newTmpl = {
        id: activeCustomTemplate.id,
        name: customTemplateName,
        body: customTemplateBody,
        fieldValues: customFieldValues,
        isUserCreated: true
      };
      updated = [...customTemplates, newTmpl];
    } else {
      updated = customTemplates.map(t => {
        if (t.id === activeCustomTemplate.id) {
          return {
            ...t,
            name: customTemplateName,
            body: customTemplateBody,
            fieldValues: customFieldValues
          };
        }
        return t;
      });
    }
    setCustomTemplates(updated);
    localStorage.setItem('doc_generator_custom_templates', JSON.stringify(updated));
    
    // Update active template object too so it doesn't think it's unsaved/new
    setActiveCustomTemplate({
      id: activeCustomTemplate.id,
      name: customTemplateName,
      body: customTemplateBody,
      fieldValues: customFieldValues,
      isUserCreated: true
    });
    alert("Template saved successfully!");
  };

  const handleDeleteCustomTemplate = (id) => {
    if (id === 'default-memo') return alert("Cannot delete standard system template!");
    if (window.confirm("Are you sure you want to delete this custom template? This cannot be undone.")) {
      const updated = customTemplates.filter(t => t.id !== id);
      setCustomTemplates(updated);
      localStorage.setItem('doc_generator_custom_templates', JSON.stringify(updated));
      alert("Template deleted!");
    }
  };

  const handleUploadCustomTemplate = (name, bodyText) => {
    const newTmpl = {
      id: Date.now(),
      name: name,
      body: bodyText,
      fieldValues: {},
      isUserCreated: true
    };
    const updated = [...customTemplates, newTmpl];
    setCustomTemplates(updated);
    localStorage.setItem('doc_generator_custom_templates', JSON.stringify(updated));
    
    setActiveCustomTemplate(newTmpl);
    setCustomTemplateName(name);
    setCustomTemplateBody(bodyText);
    setCustomFieldValues({});
    setDocType('custom');
    setActivePreviewType('custom');
    setSidebarCollapsed(false);
  };

  const handleImportTemplateLibrary = (importedList) => {
    const merged = [...customTemplates];
    importedList.forEach(newTmpl => {
      const existsIdx = merged.findIndex(t => t.name.toLowerCase() === newTmpl.name.toLowerCase());
      if (existsIdx !== -1) {
        merged[existsIdx] = { ...merged[existsIdx], ...newTmpl, id: merged[existsIdx].id };
      } else {
        merged.push({ ...newTmpl, id: Date.now() + Math.random() });
      }
    });
    setCustomTemplates(merged);
    localStorage.setItem('doc_generator_custom_templates', JSON.stringify(merged));
  };

  const handleCreateBlankCustomTemplate = () => {
    const blankTmpl = {
      id: Date.now(),
      name: 'New Custom Template',
      body: 'Dear {{Name}},\n\nEnter template body text here...',
      fieldValues: {},
      isUserCreated: true
    };
    setActiveCustomTemplate(blankTmpl);
    setCustomTemplateName(blankTmpl.name);
    setCustomTemplateBody(blankTmpl.body);
    setCustomFieldValues({});
    setDocType('custom');
    setActivePreviewType('custom');
    setSidebarCollapsed(false);
    setShowCustomEditor(true);
  };

  const handleSelectCustomTemplate = (tmpl) => {
    setActiveCustomTemplate(tmpl);
    setCustomTemplateName(tmpl.name);
    setCustomTemplateBody(tmpl.body);
    setCustomFieldValues(tmpl.fieldValues || {});
    setDocType('custom');
    setActivePreviewType('custom');
    setSidebarCollapsed(false);
    setShowCustomEditor(false); // Hide body editor initially when using it
  };

  const handleEditCustomTemplateText = (tmpl) => {
    setActiveCustomTemplate(tmpl);
    setCustomTemplateName(tmpl.name);
    setCustomTemplateBody(tmpl.body);
    setCustomFieldValues(tmpl.fieldValues || {});
    setDocType('custom');
    setActivePreviewType('custom');
    setSidebarCollapsed(false);
    setShowCustomEditor(true); // Show body editor immediately when editing text
  };

  const saveSalaryToHistory = (data) => {
    // Keep list clean of duplicates
    const filtered = salaryHistory.filter(
      r => !(r.employeeId === data.employeeId && r.monthYear === data.monthYear)
    );
    const newRecord = {
      id: Date.now() + Math.random(), // Ensure unique id even in batches
      employeeId: data.employeeId,
      employeeName: data.employeeName,
      designation: data.designation,
      monthYear: data.monthYear,
      basicSalary: data.basicSalary,
      hra: data.hra,
      conveyanceAllowance: data.conveyanceAllowance,
      specialAllowance: data.specialAllowance,
      stdBasicSalary: data.stdBasicSalary !== undefined ? data.stdBasicSalary : data.basicSalary,
      stdHra: data.stdHra !== undefined ? data.stdHra : data.hra,
      stdConveyanceAllowance: data.stdConveyanceAllowance !== undefined ? data.stdConveyanceAllowance : data.conveyanceAllowance,
      stdSpecialAllowance: data.stdSpecialAllowance !== undefined ? data.stdSpecialAllowance : data.specialAllowance,
      providentFund: data.providentFund,
      professionalTax: data.professionalTax,
      incomeTax: data.incomeTax,
      esi: data.esi || 0,
      pan: data.pan || '',
      uan: data.uan || '',
      esic: data.esic || '',
      currencyCode: data.currencyCode || 'INR',
      currencySymbol: data.currencySymbol || '₹',
      accentColor: data.accentColor || '#6366f1',
      customEarnings: data.customEarnings || [],
      customDeductions: data.customDeductions || [],
      employeeEmail: data.employeeEmail || '',
      bankName: data.bankName || '',
      accountNumber: data.accountNumber || '',
      paidDays: data.paidDays || 30,
      lopDays: data.lopDays || 0,
      timestamp: new Date().toLocaleString(),
    };
    const updated = [newRecord, ...filtered];
    setSalaryHistory(updated);
    localStorage.setItem('doc_generator_salary_history', JSON.stringify(updated));
  };

  const handleSaveSmtpConfig = (config) => {
    setSmtpConfig(config);
    localStorage.setItem('doc_generator_smtp_config', JSON.stringify(config));
  };

  const handleSaveAttendance = (monthYear, records) => {
    // Remove existing records for this month
    const filtered = attendanceList.filter(rec => rec.monthYear !== monthYear);
    // Add new ones (if not empty)
    const updated = records.length > 0 ? [...filtered, ...records] : filtered;
    setAttendanceList(updated);
    localStorage.setItem('doc_generator_attendance', JSON.stringify(updated));
  };

  const handleTestSmtpConnection = async (config, recipient) => {
    if (!window.ipcRenderer) return { success: false, error: 'Desktop App integration not active. Open Electron app.' };
    
    const mailOptions = {
      to: recipient,
      subject: 'Lumina Studio - SMTP Configuration Test',
      text: `SMTP test connection successful!\n\nParameters used:\nHost: ${config.host}\nPort: ${config.port}\nUsername: ${config.username}\n\nTime sent: ${new Date().toLocaleString()}`,
      html: `<p><strong>SMTP test connection successful!</strong></p><p>Parameters used:</p><ul><li>Host: ${config.host}</li><li>Port: ${config.port}</li><li>Username: ${config.username}</li></ul><p>Time sent: ${new Date().toLocaleString()}</p>`
    };

    return await window.ipcRenderer.invoke('send-email', { smtpConfig: config, mailOptions });
  };

  const handleSendEmail = async () => {
    if (!window.ipcRenderer) {
      alert("Email delivery is only supported in the Desktop App version.");
      return;
    }
    if (!smtpConfig.username || !smtpConfig.password) {
      alert("Please configure your SMTP settings in the 'Email Settings' tab first.");
      return;
    }
    if (!salaryData.employeeEmail) {
      alert("Employee email address is missing. Add their email to proceed.");
      return;
    }

    alert("Generating payslip PDF and preparing dispatch...");

    const element = document.querySelector('.preview-document-container');
    const filename = `Salary_Slip_${salaryData.employeeName.replace(/ /g, '_')}_${salaryData.monthYear}.pdf`;
    
    const opt = {
      margin:       0,
      filename:     filename,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2 },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    try {
      const pdfBlob = await html2pdf().set(opt).from(element).output('blob');
      
      const reader = new FileReader();
      reader.readAsDataURL(pdfBlob);
      reader.onloadend = async () => {
        const base64data = reader.result.split(',')[1];
        
        const subject = smtpConfig.emailSubject
          ? smtpConfig.emailSubject.replace(/\{\{month\}\}/g, salaryData.monthYear)
          : `Salary Slip for ${salaryData.monthYear}`;
          
        const bodyText = smtpConfig.emailBody
          ? smtpConfig.emailBody
              .replace(/\{\{name\}\}/g, salaryData.employeeName)
              .replace(/\{\{month\}\}/g, salaryData.monthYear)
          : `Dear ${salaryData.employeeName},\n\nPlease find attached your salary slip for the month of ${salaryData.monthYear}.`;

        const mailOptions = {
          to: salaryData.employeeEmail,
          subject: subject,
          text: bodyText,
          html: `<p>${bodyText.replace(/\n/g, '<br/>')}</p>`,
          attachments: [
            {
              filename: filename,
              content: base64data
            }
          ]
        };

        const result = await window.ipcRenderer.invoke('send-email', { smtpConfig, mailOptions });
        
        if (result.success) {
          alert(`Payslip emailed successfully to ${salaryData.employeeName} (${salaryData.employeeEmail})!`);
          saveSalaryToHistory(salaryData);
        } else {
          alert(`Failed to send email:\n\n${result.error}`);
        }
      };
    } catch (e) {
      console.error(e);
      alert(`PDF Generation failed: ${e.message}`);
    }
  };

  const handleSendBatchEmails = async () => {
    if (!window.ipcRenderer) {
      alert("Email delivery is only supported in the Desktop App version.");
      return;
    }
    if (!smtpConfig.username || !smtpConfig.password) {
      alert("Please configure your SMTP settings in the 'Email Settings' tab first.");
      return;
    }
    if (selectedBatchIds.length === 0) {
      alert("Select at least one employee to dispatch emails.");
      return;
    }

    const batchData = getBatchData();
    const missingEmails = batchData.filter(d => !d.employeeEmail);
    if (missingEmails.length > 0) {
      const names = missingEmails.map(d => d.employeeName).join(', ');
      alert(`Error: The following selected employees do not have email addresses saved:\n\n${names}\n\nPlease add their emails in the directory first.`);
      return;
    }

    const proceed = window.confirm(`Are you sure you want to generate and dispatch payslip emails to ${batchData.length} employees?`);
    if (!proceed) return;

    alert(`Dispatching batch emails... Please wait while ${batchData.length} reports are generated.`);

    const children = batchRef.current.querySelectorAll('.preview-document-container');
    
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < children.length; i++) {
      const element = children[i];
      const empData = batchData[i];
      const filename = `Salary_Slip_${empData.employeeName.replace(/ /g, '_')}_${empData.monthYear}.pdf`;
      
      const opt = {
        margin:       0,
        filename:     filename,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2 },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };

      try {
        const pdfBlob = await html2pdf().set(opt).from(element).output('blob');
        
        const base64data = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.readAsDataURL(pdfBlob);
          reader.onloadend = () => resolve(reader.result.split(',')[1]);
        });

        const subject = smtpConfig.emailSubject
          ? smtpConfig.emailSubject.replace(/\{\{month\}\}/g, empData.monthYear)
          : `Salary Slip for ${empData.monthYear}`;
          
        const bodyText = smtpConfig.emailBody
          ? smtpConfig.emailBody
              .replace(/\{\{name\}\}/g, empData.employeeName)
              .replace(/\{\{month\}\}/g, empData.monthYear)
          : `Dear ${empData.employeeName},\n\nPlease find attached your salary slip for the month of ${empData.monthYear}.`;

        const mailOptions = {
          to: empData.employeeEmail,
          subject: subject,
          text: bodyText,
          html: `<p>${bodyText.replace(/\n/g, '<br/>')}</p>`,
          attachments: [
            {
              filename: filename,
              content: base64data
            }
          ]
        };

        const result = await window.ipcRenderer.invoke('send-email', { smtpConfig, mailOptions });
        
        if (result.success) {
          successCount++;
          saveSalaryToHistory(empData);
        } else {
          failCount++;
          console.error(`SMTP Dispatch failed for ${empData.employeeName}:`, result.error);
        }
      } catch (err) {
        failCount++;
        console.error(`PDF Generation failed for ${empData.employeeName}:`, err);
      }
    }

    alert(`Batch complete!\n\nSent: ${successCount} payslip emails\nFailed: ${failCount} emails`);
  };

  const saveToHistory = () => {
    let name = '';
    let currentData = null;
    if (activePreviewType === 'offer') { name = offerData.candidateName; currentData = offerData; }
    if (activePreviewType === 'termination') { name = terminationData.employeeName; currentData = terminationData; }
    if (activePreviewType === 'experience') { name = experienceData.employeeName; currentData = experienceData; }
    if (activePreviewType === 'salary') { name = salaryData.employeeName; currentData = salaryData; }
    if (activePreviewType === 'custom') {
      name = customFieldValues['Employee Name'] || customFieldValues['Candidate Name'] || customFieldValues['Name'] || customTemplateName || 'Custom Document';
      currentData = {
        templateId: activeCustomTemplate?.id,
        templateName: customTemplateName,
        templateBody: customTemplateBody,
        fieldValues: customFieldValues
      };
    }

    const newItem = {
      id: Date.now(),
      type: activePreviewType,
      name: name || 'Unnamed',
      timestamp: new Date().toLocaleString(),
      data: currentData,
      companyName,
      companyLocation,
      logoSize,
      logoX,
      logoY,
      customLogo,
      customSignature,
      template,
    };

    const updated = [newItem, ...historyList];
    setHistoryList(updated);
    localStorage.setItem('doc_generator_history', JSON.stringify(updated));
  };

  // Employee Directory Logic
  const handleSaveEmployee = () => {
    if (!empForm.name) return alert("Employee Name is required!");
    
    let updated;
    if (editingEmployee) {
      updated = employees.map(e => e.id === empForm.id ? empForm : e);
    } else {
      updated = [{ ...empForm, id: Date.now().toString() }, ...employees];
    }
    
    setEmployees(updated);
    localStorage.setItem('doc_generator_employees', JSON.stringify(updated));
    setEditingEmployee(null);
    setEmpForm({ id: '', name: '', empId: '', designation: '', department: '', address: '', joiningDate: '', grossSalary: '', bankName: '', accountNumber: '', email: '', pan: '', uan: '', esic: '' });
  };

  const handleEditEmployee = (emp) => {
    setEditingEmployee(emp.id);
    setEmpForm({
      ...emp,
      department: emp.department || '',
      pan: emp.pan || '',
      uan: emp.uan || '',
      esic: emp.esic || ''
    });
  };

  const handleDeleteEmployee = (id) => {
    if (window.confirm("Delete this employee from the directory?")) {
      const updated = employees.filter(e => e.id !== id);
      setEmployees(updated);
      localStorage.setItem('doc_generator_employees', JSON.stringify(updated));
    }
  };

  const handleImportEmployees = (importedList) => {
    const merged = [...employees];
    importedList.forEach(newEmp => {
      const existsIdx = merged.findIndex(e => e.empId && e.empId.toLowerCase() === newEmp.empId.toLowerCase());
      if (existsIdx !== -1) {
        merged[existsIdx] = { ...merged[existsIdx], ...newEmp, id: merged[existsIdx].id };
      } else {
        merged.push(newEmp);
      }
    });
    setEmployees(merged);
    localStorage.setItem('doc_generator_employees', JSON.stringify(merged));
  };

  const handleDeleteSalaryRecord = (id) => {
    if (window.confirm("Delete this payroll record from the ledger?")) {
      const updated = salaryHistory.filter(r => r.id !== id);
      setSalaryHistory(updated);
      localStorage.setItem('doc_generator_salary_history', JSON.stringify(updated));
    }
  };

  const handleClearSalaryLedger = () => {
    if (window.confirm("Are you absolutely sure you want to clear the entire salary slip ledger? This cannot be undone.")) {
      setSalaryHistory([]);
      localStorage.removeItem('doc_generator_salary_history');
    }
  };

  const handleLoadSalaryRecord = (record) => {
    setDocType('salary');
    setIsBatchMode(false);
    setActivePreviewType('salary');
    setSelectedCurrency(record.currencyCode || 'INR');
    setAccentColor(record.accentColor || '#6366f1');
    setCustomEarningsList(record.customEarnings || []);
    setCustomDeductionsList(record.customDeductions || []);
    
    setSalaryData({
      monthYear: record.monthYear,
      employeeName: record.employeeName,
      employeeId: record.employeeId,
      designation: record.designation,
      bankName: record.bankName || '',
      accountNumber: record.accountNumber || '',
      paidDays: record.paidDays || 30,
      lopDays: record.lopDays || 0,
      basicSalary: record.basicSalary,
      hra: record.hra,
      conveyanceAllowance: record.conveyanceAllowance,
      specialAllowance: record.specialAllowance,
      stdBasicSalary: record.stdBasicSalary,
      stdHra: record.stdHra,
      stdConveyanceAllowance: record.stdConveyanceAllowance,
      stdSpecialAllowance: record.stdSpecialAllowance,
      providentFund: record.providentFund,
      professionalTax: record.professionalTax,
      incomeTax: record.incomeTax,
      esi: record.esi || 0,
      pan: record.pan || '',
      uan: record.uan || '',
      esic: record.esic || '',
      employeeEmail: record.employeeEmail || '',
      signeeName: record.signeeName || companyName,
    });
    setGrossInput(record.basicSalary + record.hra + record.conveyanceAllowance + record.specialAllowance);
  };

  const handleAutofillFromEmployee = (empId, formType) => {
    if (!empId) return;
    const emp = employees.find(e => e.id === empId);
    if (!emp) return;

    if (formType === 'offer') {
      setOfferData(prev => ({ ...prev, candidateName: emp.name, candidateAddress: emp.address, position: emp.designation, joiningDate: emp.joiningDate, monthlySalary: Math.round(Number(emp.grossSalary)/12) || 0, annualSalary: Number(emp.grossSalary) || 0 }));
    }
    if (formType === 'termination') {
      setTerminationData(prev => ({ ...prev, employeeName: emp.name, employeeAddress: emp.address, position: emp.designation }));
    }
    if (formType === 'experience') {
      setExperienceData(prev => ({ ...prev, employeeName: emp.name, position: emp.designation, joiningDate: emp.joiningDate }));
    }
    if (formType === 'salary') {
      setSalaryData(prev => ({ 
        ...prev, 
        employeeName: emp.name, 
        employeeId: emp.empId, 
        designation: emp.designation, 
        bankName: emp.bankName, 
        accountNumber: emp.accountNumber, 
        employeeEmail: emp.email || '',
        pan: emp.pan || '',
        uan: emp.uan || '',
        esic: emp.esic || '',
        department: emp.department || '',
        joiningDate: emp.joiningDate || ''
      }));
      setGrossInput(Number(emp.grossSalary) || 0);
    }
  };

  const handlePrint = () => {
    if (activePreviewType === 'salary') {
      const fullSalaryData = {
        ...salaryData,
        accentColor,
        currencyCode: selectedCurrency,
        currencySymbol: getCurrencySymbol(selectedCurrency),
        customEarnings: customEarningsList,
        customDeductions: customDeductionsList
      };
      const isDuplicate = salaryHistory.some(
        r => r.employeeId === fullSalaryData.employeeId && r.monthYear === fullSalaryData.monthYear
      );
      if (isDuplicate) {
        const proceed = window.confirm(`A salary slip for ${fullSalaryData.employeeName} for ${fullSalaryData.monthYear} already exists in the ledger. Do you want to print and overwrite it?`);
        if (!proceed) return;
      }
      saveSalaryToHistory(fullSalaryData);
    }
    saveToHistory();
    window.print();
  };

  const scrollToPage = (pageNumber) => {
    const element = document.getElementById(`page-${pageNumber}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const loadHistoryItem = (item) => {
    changeDocType(item.type);
    if (item.type === 'offer') setOfferData(item.data);
    if (item.type === 'termination') setTerminationData(item.data);
    if (item.type === 'experience') setExperienceData(item.data);
    if (item.type === 'salary') setSalaryData(item.data);
    if (item.type === 'custom') {
      const templateObj = customTemplates.find(t => t.id === item.data.templateId) || {
        id: item.data.templateId,
        name: item.data.templateName,
        body: item.data.templateBody
      };
      setActiveCustomTemplate(templateObj);
      setCustomTemplateName(item.data.templateName);
      setCustomTemplateBody(item.data.templateBody);
      setCustomFieldValues(item.data.fieldValues || {});
    }
    
    if (item.companyName) setCompanyName(item.companyName);
    if (item.companyLocation) setCompanyLocation(item.companyLocation);
    if (item.logoSize) setLogoSize(item.logoSize);
    if (item.logoX !== undefined) setLogoX(item.logoX);
    if (item.logoY !== undefined) setLogoY(item.logoY);
    if (item.customLogo !== undefined) setCustomLogo(item.customLogo);
    if (item.customSignature !== undefined) setCustomSignature(item.customSignature);
    if (item.template) setTemplate(item.template);
    
    alert(`Loaded saved document for: ${item.name}`);
  };

  const deleteHistoryItem = (id, e) => {
    e.stopPropagation();
    if (window.confirm('Delete this saved document from history?')) {
      const updated = historyList.filter(item => item.id !== id);
      setHistoryList(updated);
      localStorage.setItem('doc_generator_history', JSON.stringify(updated));
    }
  };

  const handleReset = () => {
    if (window.confirm('Reset current form to default templates?')) {
      if (docType === 'offer') setOfferData(DEFAULT_OFFER_LETTER);
      if (docType === 'termination') setTerminationData(DEFAULT_TERMINATION_LETTER);
      if (docType === 'experience') setExperienceData(DEFAULT_EXPERIENCE_LETTER);
      if (docType === 'salary') {
        setSalaryData(DEFAULT_SALARY_SLIP);
        setGrossInput(15000);
        setCustomEarningsList([]);
        setCustomDeductionsList([]);
      }
      if (docType === 'custom') {
        if (activeCustomTemplate) {
          setCustomTemplateBody(activeCustomTemplate.body);
          setCustomTemplateName(activeCustomTemplate.name);
          setCustomFieldValues(activeCustomTemplate.fieldValues || {});
        }
      }
    }
  };

  const handleClear = () => {
    if (window.confirm('Clear all inputs?')) {
      if (docType === 'offer') {
        setOfferData({
          date: '', candidateName: '', candidateAddress: '', position: '',
          monthlySalary: 0, annualSalary: 0, incentives: '', probationPeriod: '',
          joiningDate: '', workingHours: '', reportingManager: '', signeeName: '', signeeTitle: ''
        });
      }
      if (docType === 'termination') {
        setTerminationData({
          date: '', employeeName: '', employeeAddress: '', position: '',
          terminationDate: '', noticePeriod: '', reason: '', lastWorkingDate: '',
          signeeName: '', signeeTitle: ''
        });
      }
      if (docType === 'experience') {
        setExperienceData({
          date: '', employeeName: '', position: '', joiningDate: '', leavingDate: '',
          keyResponsibilities: '', performanceDescription: '', signeeName: '', signeeTitle: ''
        });
      }
      if (docType === 'salary') {
        setSalaryData({
          monthYear: '', employeeName: '', employeeId: '', designation: '',
          bankName: '', accountNumber: '', paidDays: 30, lopDays: 0,
          basicSalary: 0, hra: 0, conveyanceAllowance: 0, specialAllowance: 0,
          providentFund: 0, professionalTax: 0, incomeTax: 0, esi: 0, pan: '', uan: '', esic: '', signeeName: ''
        });
        setGrossInput(0);
        setCustomEarningsList([]);
        setCustomDeductionsList([]);
      }
      if (docType === 'custom') {
        setCustomFieldValues({});
      }
    }
  };

  return (
    <div className="doc-generator-workspace" style={{ 
      gridTemplateColumns: sidebarCollapsed ? '0px 1fr' : `${sidebarWidth}px 1fr`,
      transition: 'grid-template-columns 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      position: 'relative'
    }}>
      
      {/* LEFT COLUMN: Input Forms Panel */}
      <div className="doc-generator-form-panel no-print" style={{
        width: sidebarCollapsed ? '0px' : `${sidebarWidth}px`,
        borderRight: sidebarCollapsed ? 'none' : '1px solid var(--border-color)',
        transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
      }}>
        {!sidebarCollapsed && <div className="resizer-handle" onMouseDown={() => setIsDragging(true)} />}
        
        {/* Fixed top controls header */}
        <div className="doc-form-header-fixed" style={{ gap: '0.65rem', padding: '1rem' }}>
          {/* Header Title */}
          <div className="doc-generator-title-section">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Layers size={18} style={{ color: 'var(--accent-primary)' }} />
                <h1 style={{ fontSize: '1.05rem', fontWeight: '800', letterSpacing: '-0.02em' }}>Lumina Studio</h1>
              </div>
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                <button onClick={toggleTheme} className="btn-action-outline" style={{ padding: '0.35rem', borderRadius: '6px' }} title="Toggle Theme">
                  {theme === 'dark' ? <Sun size={13} /> : <Moon size={13} />}
                </button>
                <button onClick={() => toggleSidebarCollapse()} className="btn-action-outline" style={{ padding: '0.35rem', borderRadius: '6px' }} title="Collapse Sidebar">
                  <ChevronLeft size={13} />
                </button>
              </div>
            </div>
            <p style={{ fontSize: '0.65rem' }}>Professional HR & Document Suite</p>
          </div>

          {/* Document Selection Tabs */}
          <div className="doc-type-selector-tabs" style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', background: 'transparent', border: 'none', padding: 0 }}>
            {docType !== 'dashboard' && (
              <button 
                onClick={() => changeDocType('dashboard')}
                className="btn-action-outline no-print"
                style={{ width: '100%', padding: '0.45rem', fontSize: '0.72rem', fontWeight: '700', marginBottom: '0.25rem', display: 'flex', gap: '6px', alignItems: 'center', justifyContent: 'center' }}
              >
                ← Back to Dashboard
              </button>
            )}
            {docType === 'dashboard' && (
              <>
                {/* GROUP 1: OVERVIEW */}
                <div>
                  <div className="menu-group-label" style={{ fontSize: '0.6rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: '0.2rem', paddingLeft: '4px' }}>Overview</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <button 
                      className={`doc-tab-button ${docType === 'dashboard' ? 'active' : ''}`}
                      onClick={() => changeDocType('dashboard')}
                      style={{ width: '100%', gap: '8px', fontSize: '0.75rem', padding: '0.45rem 0.65rem' }}
                    >
                      <LayoutDashboard size={13} /> Dashboard
                    </button>
                    <button 
                      className={`doc-tab-button ${docType === 'email-config' ? 'active' : ''}`}
                      onClick={() => changeDocType('email-config')}
                      style={{ width: '100%', gap: '8px', fontSize: '0.75rem', padding: '0.45rem 0.65rem' }}
                    >
                      <Mail size={13} /> Email Settings
                    </button>
                  </div>
                </div>

                {/* GROUP 2: OPERATIONS */}
                <div>
                  <div className="menu-group-label" style={{ fontSize: '0.6rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: '0.2rem', paddingLeft: '4px' }}>Directory & Ledger</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <button 
                      className={`doc-tab-button ${docType === 'employees' ? 'active' : ''}`}
                      onClick={() => changeDocType('employees')}
                      style={{ width: '100%', gap: '8px', fontSize: '0.75rem', padding: '0.45rem 0.65rem' }}
                    >
                      <Users size={13} /> Employee Roster
                    </button>
                    <button 
                      className={`doc-tab-button ${docType === 'attendance' ? 'active' : ''}`}
                      onClick={() => changeDocType('attendance')}
                      style={{ width: '100%', gap: '8px', fontSize: '0.75rem', padding: '0.45rem 0.65rem' }}
                    >
                      <CalendarRange size={13} /> Attendance Tracker
                    </button>
                    <button 
                      className={`doc-tab-button ${docType === 'salary-tracker' ? 'active' : ''}`}
                      onClick={() => changeDocType('salary-tracker')}
                      style={{ width: '100%', gap: '8px', fontSize: '0.75rem', padding: '0.45rem 0.65rem' }}
                    >
                      <CreditCard size={13} /> Salary Ledger
                    </button>
                  </div>
                </div>

                {/* GROUP 3: CREATOR */}
                <div>
                  <div className="menu-group-label" style={{ fontSize: '0.6rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: '0.2rem', paddingLeft: '4px' }}>Document Creators</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
                    <button 
                      className={`doc-tab-button ${docType === 'offer' ? 'active' : ''}`}
                      onClick={() => changeDocType('offer')}
                      style={{ gap: '6px', fontSize: '0.7rem', padding: '0.45rem 0.5rem' }}
                    >
                      <FileText size={12} /> Offer Letter
                    </button>
                    <button 
                      className={`doc-tab-button ${docType === 'termination' ? 'active' : ''}`}
                      onClick={() => changeDocType('termination')}
                      style={{ gap: '6px', fontSize: '0.7rem', padding: '0.45rem 0.5rem' }}
                    >
                      <FileText size={12} /> Exit Letter
                    </button>
                    <button 
                      className={`doc-tab-button ${docType === 'experience' ? 'active' : ''}`}
                      onClick={() => changeDocType('experience')}
                      style={{ gap: '6px', fontSize: '0.7rem', padding: '0.45rem 0.5rem' }}
                    >
                      <FileText size={12} /> Experience
                    </button>
                    <button 
                      className={`doc-tab-button ${docType === 'salary' ? 'active' : ''}`}
                      onClick={() => changeDocType('salary')}
                      style={{ gap: '6px', fontSize: '0.7rem', padding: '0.45rem 0.5rem' }}
                    >
                      <FileText size={12} /> Pay Slip
                    </button>
                    <button 
                      className={`doc-tab-button ${docType === 'custom' ? 'active' : ''}`}
                      onClick={() => changeDocType('custom')}
                      style={{ gap: '6px', fontSize: '0.7rem', padding: '0.45rem 0.5rem', gridColumn: 'span 2' }}
                    >
                      <Upload size={12} /> Custom Templates
                    </button>
                  </div>
                </div>

                {/* GROUP 4: ARCHIVES */}
                <div>
                  <div className="menu-group-label" style={{ fontSize: '0.6rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: '0.2rem', paddingLeft: '4px' }}>Archives</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <button 
                      className={`doc-tab-button ${docType === 'history' ? 'active' : ''}`}
                      onClick={() => changeDocType('history')}
                      style={{ width: '100%', gap: '8px', fontSize: '0.75rem', padding: '0.45rem 0.65rem' }}
                    >
                      <HistoryIcon size={13} /> Printed Archives
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Buttons Controls - Only shown when editing a document */}
          {['offer', 'termination', 'experience', 'salary', 'custom'].includes(docType) && (
            <div className="doc-generator-actions" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.5rem', marginTop: '0.25rem' }}>
              <div className="doc-form-actions-row">
                <button onClick={handleReset} className="btn-action-outline" style={{ flex: 1, padding: '0.4rem', fontSize: '0.7rem' }} title="Reset Defaults">
                  <RefreshCw size={12} /> Reset
                </button>
                <button onClick={handleClear} className="btn-action-outline btn-action-danger" style={{ flex: 1, padding: '0.4rem', fontSize: '0.7rem' }} title="Clear All">
                  <Trash2 size={12} /> Clear
                </button>
                {docType === 'salary' && !isBatchMode && (
                  <button onClick={handleSendEmail} className="btn-action-outline" style={{ flex: 1.5, padding: '0.4rem', fontSize: '0.7rem', color: 'var(--accent-hover)', borderColor: 'rgba(99, 102, 241, 0.25)' }} title="Email Payslip">
                    <Mail size={12} /> Email
                  </button>
                )}
                <button onClick={handlePrint} className="btn-action-primary" style={{ flex: 2, padding: '0.4rem 0.6rem', fontSize: '0.7rem' }}>
                  <Printer size={12} /> {isBatchMode ? 'Print All' : (
                    docType === 'offer' ? 'Print Offer Letter' :
                    docType === 'termination' ? 'Print Exit Letter' :
                    docType === 'experience' ? 'Print Certificate' :
                    docType === 'salary' ? 'Print Pay Slip' : 'Print Document'
                  )}
                </button>
              </div>
            </div>
          )}
        </div> {/* close .doc-form-header-fixed */}

        {/* Scrollable Form Content */}
        <div className="doc-form-scrollable-content" style={{ display: ['offer', 'termination', 'experience', 'salary', 'custom'].includes(docType) ? 'flex' : 'none' }}>


          {/* Branding & Company Profile Section */}
          <div className="branding-section">
            <div className="branding-section-title">
              <Upload size={14} /> Custom Branding & Profile
            </div>
            
            <div className="doc-form-group">
              <label className="doc-form-label" style={{ fontSize: '9px' }}>Company Name</label>
              <input 
                type="text" 
                id="input-company-name"
                value={companyName} 
                onChange={e => setCompanyName(e.target.value)}
                className="doc-form-input" 
                placeholder="e.g. Lumina Workforce Private Limited"
              />
            </div>

            <div className="doc-form-group">
              <label className="doc-form-label" style={{ fontSize: '9px' }}>Company Location / Address</label>
              <textarea 
                rows="2"
                id="input-company-location"
                value={companyLocation} 
                onChange={e => setCompanyLocation(e.target.value)}
                className="doc-form-textarea" 
                placeholder="e.g. Hyderabad, Telangana"
                style={{ fontSize: '11px', padding: '6px' }}
              />
            </div>

            <div className="doc-form-grid-2" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem', marginTop: '0.25rem' }}>
              <div className="doc-form-group">
                <label className="doc-form-label" style={{ fontSize: '9px' }}>Logo Size ({logoSize}px)</label>
                <input 
                  type="range" 
                  min="30" 
                  max="150" 
                  value={logoSize} 
                  onChange={e => setLogoSize(Number(e.target.value))} 
                  style={{ width: '100%', accentColor: 'var(--accent-primary)', cursor: 'pointer' }}
                />
              </div>

              <div className="doc-form-group">
                <label className="doc-form-label" style={{ fontSize: '9px' }}>Logo Position X ({logoX}px)</label>
                <input 
                  type="range" 
                  min="0" 
                  max="480" 
                  value={logoX} 
                  onChange={e => setLogoX(Number(e.target.value))} 
                  style={{ width: '100%', accentColor: 'var(--accent-primary)', cursor: 'pointer' }}
                />
              </div>
            </div>

            <div className="doc-form-grid-2" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem' }}>
              <div className="doc-form-group">
                <label className="doc-form-label" style={{ fontSize: '9px' }}>Logo Position Y ({logoY}px)</label>
                <input 
                  type="range" 
                  min="-20" 
                  max="250" 
                  value={logoY} 
                  onChange={e => setLogoY(Number(e.target.value))} 
                  style={{ width: '100%', accentColor: 'var(--accent-primary)', cursor: 'pointer' }}
                />
              </div>

              <div className="doc-form-group">
                <label className="doc-form-label" style={{ fontSize: '9px' }}>Signature</label>
                {customSignature ? (
                  <div className="branding-thumbnail-container">
                    <img src={customSignature} alt="Sig Preview" className="branding-thumbnail" />
                    <button type="button" onClick={() => setCustomSignature(null)} className="btn-clear-file">
                      Remove
                    </button>
                  </div>
                ) : (
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleSignatureUpload} 
                    className="doc-form-input" 
                    style={{ fontSize: '10px', padding: '4px' }}
                  />
                )}
              </div>
            </div>

            <div className="doc-form-group" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem' }}>
              <label className="doc-form-label" style={{ fontSize: '9px' }}>Company Logo File</label>
              {customLogo ? (
                <div className="branding-thumbnail-container" style={{ height: '36px' }}>
                  <img src={customLogo} alt="Logo Preview" className="branding-thumbnail" />
                  <button type="button" onClick={() => setCustomLogo(null)} className="btn-clear-file">
                    Remove
                  </button>
                </div>
              ) : (
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleLogoUpload} 
                  className="doc-form-input" 
                  style={{ fontSize: '10px', padding: '4px' }}
                />
              )}
            </div>
          </div>

          {/* Premium Customizations Panel (Collapsed by default to keep the UI clean) */}
          <div className="branding-section">
            <details style={{ cursor: 'pointer' }}>
              <summary style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--accent-hover)', display: 'flex', alignItems: 'center', gap: '6px', outline: 'none', userSelect: 'none' }}>
                ⚙️ {docType === 'salary' ? 'Premium Slip Customizations' : 'Branding & Global Settings'}
              </summary>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', paddingTop: '0.75rem', cursor: 'default' }} onClick={e => e.stopPropagation()}>
                
                {/* Accent Color picker */}
                <div className="doc-form-group">
                  <label className="doc-form-label" style={{ fontSize: '9px' }}>Accent Highlight Color</label>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input 
                      type="color" 
                      value={accentColor} 
                      onChange={e => setAccentColor(e.target.value)} 
                      style={{ width: '40px', height: '24px', border: 'none', borderRadius: '4px', background: 'none', cursor: 'pointer' }}
                    />
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Choose PDF theme highlights</span>
                  </div>
                </div>

                {/* Currency Selection */}
                <div className="doc-form-group">
                  <label className="doc-form-label" style={{ fontSize: '9px' }}>Global Currency & Formatting</label>
                  <select 
                    value={selectedCurrency} 
                    onChange={e => setSelectedCurrency(e.target.value)} 
                    className="doc-form-input"
                    style={{ fontSize: '11px', padding: '4px 8px' }}
                  >
                    <option value="INR">INR (₹) - Indian Lakhs/Crores</option>
                    <option value="USD">USD ($) - Western Millions</option>
                    <option value="EUR">EUR (€) - Western Millions</option>
                    <option value="GBP">GBP (£) - Western Millions</option>
                  </select>
                </div>

                {docType === 'salary' && (
                  <>
                    {/* Custom Earnings configure */}
                    <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.5rem' }}>
                      <label className="doc-form-label" style={{ fontSize: '9px', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>Custom Earnings Fields</label>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '150px', overflowY: 'auto', marginBottom: '6px' }}>
                        {customEarningsList.map((item, idx) => (
                          <div key={idx} style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                            <input 
                              type="text" 
                              placeholder="e.g. Bonus" 
                              value={item.name} 
                              onChange={e => {
                                const updated = [...customEarningsList];
                                updated[idx].name = e.target.value;
                                setCustomEarningsList(updated);
                              }}
                              className="doc-form-input"
                              style={{ fontSize: '10px', padding: '3px', flex: 2 }}
                            />
                            <input 
                              type="number" 
                              placeholder="Std" 
                              value={item.standard || ''} 
                              onChange={e => {
                                const updated = [...customEarningsList];
                                updated[idx].standard = Number(e.target.value);
                                setCustomEarningsList(updated);
                              }}
                              className="doc-form-input"
                              style={{ fontSize: '10px', padding: '3px', flex: 1 }}
                            />
                            <input 
                              type="number" 
                              placeholder="Earned" 
                              value={item.earned || ''} 
                              onChange={e => {
                                const updated = [...customEarningsList];
                                updated[idx].earned = Number(e.target.value);
                                setCustomEarningsList(updated);
                              }}
                              className="doc-form-input"
                              style={{ fontSize: '10px', padding: '3px', flex: 1 }}
                            />
                            <button type="button" onClick={() => setCustomEarningsList(customEarningsList.filter((_, i) => i !== idx))} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: '12px' }}>×</button>
                          </div>
                        ))}
                        {customEarningsList.length === 0 && <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>No custom earnings fields configured.</span>}
                      </div>
                      <button 
                        type="button" 
                        onClick={() => setCustomEarningsList([...customEarningsList, { name: '', standard: 0, earned: 0 }])}
                        className="btn-action-secondary"
                        style={{ fontSize: '9px', padding: '2px 6px', width: 'auto' }}
                      >
                        + Add Earning Field
                      </button>
                    </div>

                    {/* Custom Deductions configure */}
                    <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.5rem' }}>
                      <label className="doc-form-label" style={{ fontSize: '9px', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>Custom Deductions Fields</label>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '150px', overflowY: 'auto', marginBottom: '6px' }}>
                        {customDeductionsList.map((item, idx) => (
                          <div key={idx} style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                            <input 
                              type="text" 
                              placeholder="e.g. Loan Recovery" 
                              value={item.name} 
                              onChange={e => {
                                const updated = [...customDeductionsList];
                                updated[idx].name = e.target.value;
                                setCustomDeductionsList(updated);
                              }}
                              className="doc-form-input"
                              style={{ fontSize: '10px', padding: '3px', flex: 2 }}
                            />
                            <input 
                              type="number" 
                              placeholder="Amount" 
                              value={item.amount || ''} 
                              onChange={e => {
                                const updated = [...customDeductionsList];
                                updated[idx].amount = Number(e.target.value);
                                setCustomDeductionsList(updated);
                              }}
                              className="doc-form-input"
                              style={{ fontSize: '10px', padding: '3px', flex: 1 }}
                            />
                            <button type="button" onClick={() => setCustomDeductionsList(customDeductionsList.filter((_, i) => i !== idx))} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: '12px' }}>×</button>
                          </div>
                        ))}
                        {customDeductionsList.length === 0 && <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>No custom deductions fields configured.</span>}
                      </div>
                      <button 
                        type="button" 
                        onClick={() => setCustomDeductionsList([...customDeductionsList, { name: '', amount: 0 }])}
                        className="btn-action-secondary"
                        style={{ fontSize: '9px', padding: '2px 6px', width: 'auto' }}
                      >
                        + Add Deduction Field
                      </button>
                    </div>
                  </>
                )}

              </div>
            </details>
          </div>


          {/* Template Selector */}
          <div className="branding-section">
            <div className="branding-section-title">
              <Palette size={14} /> Document Template
            </div>
            <div className="template-selector-grid">
              <button 
                type="button"
                className={`template-option ${template === 'corporate' ? 'active' : ''}`}
                onClick={() => setTemplate('corporate')}
              >
                <div className="template-preview-box tp-corporate" />
                <span className="template-option-label">Corporate</span>
              </button>
              <button 
                type="button"
                className={`template-option ${template === 'minimal' ? 'active' : ''}`}
                onClick={() => setTemplate('minimal')}
              >
                <div className="template-preview-box tp-minimal" />
                <span className="template-option-label">Minimal</span>
              </button>
              <button 
                type="button"
                className={`template-option ${template === 'executive' ? 'active' : ''}`}
                onClick={() => setTemplate('executive')}
              >
                <div className="template-preview-box tp-executive" />
                <span className="template-option-label">Executive</span>
              </button>
            </div>
          </div>

        {/* Offer Letter Form */}
        {docType === 'offer' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {employees.length > 0 && (
              <div className="doc-form-group" style={{ background: 'var(--bg-secondary)', padding: '10px', borderRadius: '6px', border: '1px dashed var(--border-color)' }}>
                <label className="doc-form-label" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>⚡ Autofill from Directory</label>
                <select className="doc-form-input" onChange={e => handleAutofillFromEmployee(e.target.value, 'offer')} defaultValue="">
                  <option value="" disabled>Select an employee...</option>
                  {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.name} ({emp.designation})</option>)}
                </select>
              </div>
            )}
            <div className="doc-form-grid-2">
              <div className="doc-form-group">
                <label className="doc-form-label">Letter Date</label>
                <input 
                  type="text" 
                  id="input-offer-date"
                  value={offerData.date} 
                  onChange={e => setOfferData({ ...offerData, date: e.target.value })}
                  className="doc-form-input" 
                />
              </div>
              <div className="doc-form-group">
                <label className="doc-form-label">Date of Joining</label>
                <input 
                  type="text" 
                  id="input-offer-joiningDate"
                  value={offerData.joiningDate} 
                  onChange={e => setOfferData({ ...offerData, joiningDate: e.target.value })}
                  className="doc-form-input" 
                />
              </div>
            </div>

            <div className="doc-form-group">
              <label className="doc-form-label">Candidate Name</label>
              <input 
                type="text" 
                id="input-offer-candidateName"
                value={offerData.candidateName} 
                onChange={e => setOfferData({ ...offerData, candidateName: e.target.value })}
                className="doc-form-input" 
              />
            </div>



            <div className="doc-form-group">
              <label className="doc-form-label">Designation / Role</label>
              <input 
                type="text" 
                id="input-offer-position"
                value={offerData.position} 
                onChange={e => setOfferData({ ...offerData, position: e.target.value })}
                className="doc-form-input" 
              />
            </div>

            <div className="doc-form-grid-2">
              <div className="doc-form-group">
                <label className="doc-form-label">Monthly Gross (₹)</label>
                <input 
                  type="number" 
                  id="input-offer-monthlySalary"
                  value={offerData.monthlySalary || ''} 
                  onChange={e => handleOfferMonthlyChange(Number(e.target.value))}
                  className="doc-form-input" 
                />
              </div>
              <div className="doc-form-group">
                <label className="doc-form-label">Annual Gross (₹)</label>
                <input 
                  type="number" 
                  id="input-offer-annualSalary"
                  value={offerData.annualSalary || ''} 
                  onChange={e => handleOfferAnnualChange(Number(e.target.value))}
                  className="doc-form-input" 
                />
              </div>
            </div>

            <div className="doc-form-group">
              <label className="doc-form-label">Probation Period</label>
              <input 
                type="text" 
                id="input-offer-probationPeriod"
                value={offerData.probationPeriod} 
                onChange={e => setOfferData({ ...offerData, probationPeriod: e.target.value })}
                className="doc-form-input" 
              />
            </div>

            <div className="doc-form-group">
              <label className="doc-form-label">Working Hours</label>
              <input 
                type="text" 
                id="input-offer-workingHours"
                value={offerData.workingHours} 
                onChange={e => setOfferData({ ...offerData, workingHours: e.target.value })}
                className="doc-form-input" 
              />
            </div>

            <div className="doc-form-group">
              <label className="doc-form-label">Reporting Structure / Manager</label>
              <input 
                type="text" 
                id="input-offer-reportingManager"
                value={offerData.reportingManager} 
                onChange={e => setOfferData({ ...offerData, reportingManager: e.target.value })}
                className="doc-form-input" 
              />
            </div>

            <div className="doc-form-group">
              <label className="doc-form-label">Incentives Statement</label>
              <textarea 
                rows="2" 
                id="input-offer-incentives"
                value={offerData.incentives} 
                onChange={e => setOfferData({ ...offerData, incentives: e.target.value })}
                className="doc-form-textarea" 
              />
            </div>

            <div className="doc-form-section">
              <div className="doc-form-section-title">Signatory Details</div>
              <div className="doc-form-grid-2">
                <div className="doc-form-group">
                  <label className="doc-form-label">Name</label>
                  <input 
                    type="text" 
                    id="input-offer-signeeName"
                    value={offerData.signeeName} 
                    onChange={e => setOfferData({ ...offerData, signeeName: e.target.value })}
                    className="doc-form-input" 
                  />
                </div>
                <div className="doc-form-group">
                  <label className="doc-form-label">Title</label>
                  <input 
                    type="text" 
                    id="input-offer-signeeTitle"
                    value={offerData.signeeTitle} 
                    onChange={e => setOfferData({ ...offerData, signeeTitle: e.target.value })}
                    className="doc-form-input" 
                  />
                </div>
              </div>
            </div>

            {/* Custom Template Text Override for Offer Letter */}
            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem', marginTop: '0.25rem' }}>
              <details style={{ cursor: 'pointer' }}>
                <summary style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--accent-hover)', display: 'flex', alignItems: 'center', gap: '4px', outline: 'none', userSelect: 'none' }}>
                  ✏️ Customize Letter Layout / Text
                </summary>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingTop: '8px', cursor: 'default' }} onClick={e => e.stopPropagation()}>
                  <label className="doc-form-label" style={{ fontSize: '9px' }}>Paste custom letter text or upload `.txt` file. Use <code>{`{{placeholder}}`}</code> variables. Add <code>{`<!-- pagebreak -->`}</code> to force a page break.</label>
                  <textarea 
                    rows="6"
                    value={offerData.customBodyText || ''}
                    onChange={e => setOfferData({ ...offerData, customBodyText: e.target.value })}
                    placeholder="Enter custom layout body text here..."
                    className="doc-form-textarea"
                    style={{ fontSize: '10px', fontFamily: 'monospace' }}
                  />
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <input 
                      type="file" 
                      accept=".txt,.md,.docx,.pdf" 
                      id="override-offer-file-input"
                      style={{ display: 'none' }}
                      onChange={async e => {
                        const file = e.target.files[0];
                        if (!file) return;
                        const ext = file.name.split('.').pop().toLowerCase();
                        try {
                          let text = "";
                          if (ext === 'docx') {
                            text = await extractTextFromDocx(file);
                          } else if (ext === 'pdf') {
                            text = await extractTextFromPdf(file);
                          } else {
                            text = await new Promise((resolve, reject) => {
                              const reader = new FileReader();
                              reader.onload = (evt) => resolve(evt.target.result);
                              reader.onerror = (err) => reject(err);
                              reader.readAsText(file);
                            });
                          }
                          setOfferData({ ...offerData, customBodyText: text });
                        } catch (err) {
                          alert("Error parsing document: " + err.message);
                        }
                        e.target.value = '';
                      }}
                    />
                    <button 
                      type="button" 
                      className="btn-action-outline" 
                      style={{ flex: 1, padding: '4px', fontSize: '9px', width: 'auto' }}
                      onClick={() => document.getElementById('override-offer-file-input').click()}
                    >
                      📁 Upload Word/PDF/Text
                    </button>
                    {!offerData.customBodyText ? (
                      <button 
                        type="button" 
                        className="btn-action-outline" 
                        style={{ flex: 1, padding: '4px', fontSize: '9px', width: 'auto' }}
                        onClick={() => setOfferData({ ...offerData, customBodyText: DEFAULT_OFFER_BODY_TEMPLATE })}
                      >
                        Load Base Text
                      </button>
                    ) : (
                      <button 
                        type="button" 
                        className="btn-action-outline btn-action-danger" 
                        style={{ flex: 1, padding: '4px', fontSize: '9px', width: 'auto' }}
                        onClick={() => {
                          if (window.confirm("Reset this letter to system default text?")) {
                            setOfferData({ ...offerData, customBodyText: null });
                          }
                        }}
                      >
                        Reset Default
                      </button>
                    )}
                  </div>
                </div>
              </details>
            </div>

          </div>
        )}

        {/* Termination Letter Form */}
        {docType === 'termination' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {employees.length > 0 && (
              <div className="doc-form-group" style={{ background: 'var(--bg-secondary)', padding: '10px', borderRadius: '6px', border: '1px dashed var(--border-color)' }}>
                <label className="doc-form-label" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>⚡ Autofill from Directory</label>
                <select className="doc-form-input" onChange={e => handleAutofillFromEmployee(e.target.value, 'termination')} defaultValue="">
                  <option value="" disabled>Select an employee...</option>
                  {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.name} ({emp.designation})</option>)}
                </select>
              </div>
            )}
            <div className="doc-form-grid-2">
              <div className="doc-form-group">
                <label className="doc-form-label">Letter Date</label>
                <input 
                  type="text" 
                  id="input-termination-date"
                  value={terminationData.date} 
                  onChange={e => setTerminationData({ ...terminationData, date: e.target.value })}
                  className="doc-form-input" 
                />
              </div>
              <div className="doc-form-group">
                <label className="doc-form-label">Effective Date</label>
                <input 
                  type="text" 
                  id="input-termination-terminationDate"
                  value={terminationData.terminationDate} 
                  onChange={e => setTerminationData({ ...terminationData, terminationDate: e.target.value })}
                  className="doc-form-input" 
                />
              </div>
            </div>

            <div className="doc-form-group">
              <label className="doc-form-label">Employee Name</label>
              <input 
                type="text" 
                id="input-termination-employeeName"
                value={terminationData.employeeName} 
                onChange={e => setTerminationData({ ...terminationData, employeeName: e.target.value })}
                className="doc-form-input" 
              />
            </div>

            <div className="doc-form-group">
              <label className="doc-form-label">Employee Home Address</label>
              <textarea 
                rows="2" 
                id="input-termination-employeeAddress"
                value={terminationData.employeeAddress} 
                onChange={e => setTerminationData({ ...terminationData, employeeAddress: e.target.value })}
                className="doc-form-textarea" 
              />
            </div>

            <div className="doc-form-group">
              <label className="doc-form-label">Designation</label>
              <input 
                type="text" 
                id="input-termination-position"
                value={terminationData.position} 
                onChange={e => setTerminationData({ ...terminationData, position: e.target.value })}
                className="doc-form-input" 
              />
            </div>

            <div className="doc-form-grid-2">
              <div className="doc-form-group">
                <label className="doc-form-label">Notice Period</label>
                <input 
                  type="text" 
                  id="input-termination-noticePeriod"
                  value={terminationData.noticePeriod} 
                  onChange={e => setTerminationData({ ...terminationData, noticePeriod: e.target.value })}
                  className="doc-form-input" 
                />
              </div>
              <div className="doc-form-group">
                <label className="doc-form-label">Last Working Day</label>
                <input 
                  type="text" 
                  id="input-termination-lastWorkingDate"
                  value={terminationData.lastWorkingDate} 
                  onChange={e => setTerminationData({ ...terminationData, lastWorkingDate: e.target.value })}
                  className="doc-form-input" 
                />
              </div>
            </div>

            <div className="doc-form-group">
              <label className="doc-form-label">Reason for Separation</label>
              <textarea 
                rows="2" 
                id="input-termination-reason"
                value={terminationData.reason} 
                onChange={e => setTerminationData({ ...terminationData, reason: e.target.value })}
                className="doc-form-textarea" 
              />
            </div>

            <div className="doc-form-section">
              <div className="doc-form-section-title">Signatory Details</div>
              <div className="doc-form-grid-2">
                <div className="doc-form-group">
                  <label className="doc-form-label">Name</label>
                  <input 
                    type="text" 
                    id="input-termination-signeeName"
                    value={terminationData.signeeName} 
                    onChange={e => setTerminationData({ ...terminationData, signeeName: e.target.value })}
                    className="doc-form-input" 
                  />
                </div>
                <div className="doc-form-group">
                  <label className="doc-form-label">Title</label>
                  <input 
                    type="text" 
                    id="input-termination-signeeTitle"
                    value={terminationData.signeeTitle} 
                    onChange={e => setTerminationData({ ...terminationData, signeeTitle: e.target.value })}
                    className="doc-form-input" 
                  />
                </div>
              </div>
            </div>

            {/* Custom Template Text Override for Termination Letter */}
            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem', marginTop: '0.25rem' }}>
              <details style={{ cursor: 'pointer' }}>
                <summary style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--accent-hover)', display: 'flex', alignItems: 'center', gap: '4px', outline: 'none', userSelect: 'none' }}>
                  ✏️ Customize Letter Layout / Text
                </summary>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingTop: '8px', cursor: 'default' }} onClick={e => e.stopPropagation()}>
                  <label className="doc-form-label" style={{ fontSize: '9px' }}>Paste custom letter text or upload `.txt` file. Use <code>{`{{placeholder}}`}</code> variables. Add <code>{`<!-- pagebreak -->`}</code> to force a page break.</label>
                  <textarea 
                    rows="6"
                    value={terminationData.customBodyText || ''}
                    onChange={e => setTerminationData({ ...terminationData, customBodyText: e.target.value })}
                    placeholder="Enter custom layout body text here..."
                    className="doc-form-textarea"
                    style={{ fontSize: '10px', fontFamily: 'monospace' }}
                  />
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <input 
                      type="file" 
                      accept=".txt,.md,.docx,.pdf" 
                      id="override-termination-file-input"
                      style={{ display: 'none' }}
                      onChange={async e => {
                        const file = e.target.files[0];
                        if (!file) return;
                        const ext = file.name.split('.').pop().toLowerCase();
                        try {
                          let text = "";
                          if (ext === 'docx') {
                            text = await extractTextFromDocx(file);
                          } else if (ext === 'pdf') {
                            text = await extractTextFromPdf(file);
                          } else {
                            text = await new Promise((resolve, reject) => {
                              const reader = new FileReader();
                              reader.onload = (evt) => resolve(evt.target.result);
                              reader.onerror = (err) => reject(err);
                              reader.readAsText(file);
                            });
                          }
                          setTerminationData({ ...terminationData, customBodyText: text });
                        } catch (err) {
                          alert("Error parsing document: " + err.message);
                        }
                        e.target.value = '';
                      }}
                    />
                    <button 
                      type="button" 
                      className="btn-action-outline" 
                      style={{ flex: 1, padding: '4px', fontSize: '9px', width: 'auto' }}
                      onClick={() => document.getElementById('override-termination-file-input').click()}
                    >
                      📁 Upload Word/PDF/Text
                    </button>
                    {!terminationData.customBodyText ? (
                      <button 
                        type="button" 
                        className="btn-action-outline" 
                        style={{ flex: 1, padding: '4px', fontSize: '9px', width: 'auto' }}
                        onClick={() => setTerminationData({ ...terminationData, customBodyText: DEFAULT_TERMINATION_BODY_TEMPLATE })}
                      >
                        Load Base Text
                      </button>
                    ) : (
                      <button 
                        type="button" 
                        className="btn-action-outline btn-action-danger" 
                        style={{ flex: 1, padding: '4px', fontSize: '9px', width: 'auto' }}
                        onClick={() => {
                          if (window.confirm("Reset this letter to system default text?")) {
                            setTerminationData({ ...terminationData, customBodyText: null });
                          }
                        }}
                      >
                        Reset Default
                      </button>
                    )}
                  </div>
                </div>
              </details>
            </div>

          </div>
        )}

        {/* Experience Letter Form */}
        {docType === 'experience' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {employees.length > 0 && (
              <div className="doc-form-group" style={{ background: 'var(--bg-secondary)', padding: '10px', borderRadius: '6px', border: '1px dashed var(--border-color)' }}>
                <label className="doc-form-label" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>⚡ Autofill from Directory</label>
                <select className="doc-form-input" onChange={e => handleAutofillFromEmployee(e.target.value, 'experience')} defaultValue="">
                  <option value="" disabled>Select an employee...</option>
                  {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.name} ({emp.designation})</option>)}
                </select>
              </div>
            )}
            <div className="doc-form-grid-2">
              <div className="doc-form-group">
                <label className="doc-form-label">Letter Date</label>
                <input 
                  type="text" 
                  id="input-experience-date"
                  value={experienceData.date} 
                  onChange={e => setExperienceData({ ...experienceData, date: e.target.value })}
                  className="doc-form-input" 
                />
              </div>
              <div className="doc-form-group">
                <label className="doc-form-label">Designation</label>
                <input 
                  type="text" 
                  id="input-experience-position"
                  value={experienceData.position} 
                  onChange={e => setExperienceData({ ...experienceData, position: e.target.value })}
                  className="doc-form-input" 
                />
              </div>
            </div>

            <div className="doc-form-group">
              <label className="doc-form-label">Employee Name</label>
              <input 
                type="text" 
                id="input-experience-employeeName"
                value={experienceData.employeeName} 
                onChange={e => setExperienceData({ ...experienceData, employeeName: e.target.value })}
                className="doc-form-input" 
              />
            </div>

            <div className="doc-form-grid-2">
              <div className="doc-form-group">
                <label className="doc-form-label">Date of Joining</label>
                <input 
                  type="text" 
                  id="input-experience-joiningDate"
                  value={experienceData.joiningDate} 
                  onChange={e => setExperienceData({ ...experienceData, joiningDate: e.target.value })}
                  className="doc-form-input" 
                />
              </div>
              <div className="doc-form-group">
                <label className="doc-form-label">Date of Leaving</label>
                <input 
                  type="text" 
                  id="input-experience-leavingDate"
                  value={experienceData.leavingDate} 
                  onChange={e => setExperienceData({ ...experienceData, leavingDate: e.target.value })}
                  className="doc-form-input" 
                />
              </div>
            </div>

            <div className="doc-form-group">
              <label className="doc-form-label">Responsibilities Summary</label>
              <textarea 
                rows="3" 
                id="input-experience-keyResponsibilities"
                value={experienceData.keyResponsibilities} 
                onChange={e => setExperienceData({ ...experienceData, keyResponsibilities: e.target.value })}
                className="doc-form-textarea" 
              />
            </div>

            <div className="doc-form-group">
              <label className="doc-form-label">Performance Statement</label>
              <textarea 
                rows="3" 
                id="input-experience-performanceDescription"
                value={experienceData.performanceDescription} 
                onChange={e => setExperienceData({ ...experienceData, performanceDescription: e.target.value })}
                className="doc-form-textarea" 
              />
            </div>

            <div className="doc-form-section">
              <div className="doc-form-section-title">Signatory Details</div>
              <div className="doc-form-grid-2">
                <div className="doc-form-group">
                  <label className="doc-form-label">Name</label>
                  <input 
                    type="text" 
                    id="input-experience-signeeName"
                    value={experienceData.signeeName} 
                    onChange={e => setExperienceData({ ...experienceData, signeeName: e.target.value })}
                    className="doc-form-input" 
                  />
                </div>
                <div className="doc-form-group">
                  <label className="doc-form-label">Title</label>
                  <input 
                    type="text" 
                    id="input-experience-signeeTitle"
                    value={experienceData.signeeTitle} 
                    onChange={e => setExperienceData({ ...experienceData, signeeTitle: e.target.value })}
                    className="doc-form-input" 
                  />
                </div>
              </div>
            </div>

            {/* Custom Template Text Override for Experience Letter */}
            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem', marginTop: '0.25rem' }}>
              <details style={{ cursor: 'pointer' }}>
                <summary style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--accent-hover)', display: 'flex', alignItems: 'center', gap: '4px', outline: 'none', userSelect: 'none' }}>
                  ✏️ Customize Letter Layout / Text
                </summary>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingTop: '8px', cursor: 'default' }} onClick={e => e.stopPropagation()}>
                  <label className="doc-form-label" style={{ fontSize: '9px' }}>Paste custom letter text or upload `.txt` file. Use <code>{`{{placeholder}}`}</code> variables. Add <code>{`<!-- pagebreak -->`}</code> to force a page break.</label>
                  <textarea 
                    rows="6"
                    value={experienceData.customBodyText || ''}
                    onChange={e => setExperienceData({ ...experienceData, customBodyText: e.target.value })}
                    placeholder="Enter custom layout body text here..."
                    className="doc-form-textarea"
                    style={{ fontSize: '10px', fontFamily: 'monospace' }}
                  />
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <input 
                      type="file" 
                      accept=".txt,.md,.docx,.pdf" 
                      id="override-experience-file-input"
                      style={{ display: 'none' }}
                      onChange={async e => {
                        const file = e.target.files[0];
                        if (!file) return;
                        const ext = file.name.split('.').pop().toLowerCase();
                        try {
                          let text = "";
                          if (ext === 'docx') {
                            text = await extractTextFromDocx(file);
                          } else if (ext === 'pdf') {
                            text = await extractTextFromPdf(file);
                          } else {
                            text = await new Promise((resolve, reject) => {
                              const reader = new FileReader();
                              reader.onload = (evt) => resolve(evt.target.result);
                              reader.onerror = (err) => reject(err);
                              reader.readAsText(file);
                            });
                          }
                          setExperienceData({ ...experienceData, customBodyText: text });
                        } catch (err) {
                          alert("Error parsing document: " + err.message);
                        }
                        e.target.value = '';
                      }}
                    />
                    <button 
                      type="button" 
                      className="btn-action-outline" 
                      style={{ flex: 1, padding: '4px', fontSize: '9px', width: 'auto' }}
                      onClick={() => document.getElementById('override-experience-file-input').click()}
                    >
                      📁 Upload Word/PDF/Text
                    </button>
                    {!experienceData.customBodyText ? (
                      <button 
                        type="button" 
                        className="btn-action-outline" 
                        style={{ flex: 1, padding: '4px', fontSize: '9px', width: 'auto' }}
                        onClick={() => setExperienceData({ ...experienceData, customBodyText: DEFAULT_EXPERIENCE_BODY_TEMPLATE })}
                      >
                        Load Base Text
                      </button>
                    ) : (
                      <button 
                        type="button" 
                        className="btn-action-outline btn-action-danger" 
                        style={{ flex: 1, padding: '4px', fontSize: '9px', width: 'auto' }}
                        onClick={() => {
                          if (window.confirm("Reset this letter to system default text?")) {
                            setExperienceData({ ...experienceData, customBodyText: null });
                          }
                        }}
                      >
                        Reset Default
                      </button>
                    )}
                  </div>
                </div>
              </details>
            </div>

          </div>
        )}

        {/* Salary Slip Form */}
        {docType === 'salary' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-color)' }}>
              <h3 style={{ fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: '600' }}>
                {isBatchMode ? 'Batch Generate Mode' : 'Single Salary Slip'}
              </h3>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '12px', color: 'var(--accent-hover)' }}>
                <input type="checkbox" checked={isBatchMode} onChange={e => setIsBatchMode(e.target.checked)} />
                Enable Batch Mode
              </label>
            </div>

            {isBatchMode ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="doc-form-group">
                  <label className="doc-form-label">Month & Year for All</label>
                  <select 
                    value={batchMonthYear} 
                    onChange={e => setBatchMonthYear(e.target.value)}
                    className="doc-form-input" 
                  >
                    <option value="" disabled>Select Month...</option>
                    {MONTH_OPTIONS.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
                
                <div className="doc-smart-autofill-panel">
                  <span className="doc-smart-title">Batch Tax Rules</span>
                  <div className="doc-smart-input-flex" style={{ flexWrap: 'wrap', gap: '0.5rem' }}>
                    <select value={pfType} onChange={e => setPfType(e.target.value)} className="doc-form-input" style={{ flex: 1, minWidth: '150px' }}>
                      <option value="capped">PF: Capped at ₹1800</option>
                      <option value="full">PF: 12% of Basic</option>
                      <option value="none">PF: No PF Deduction</option>
                    </select>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', flex: 1, minWidth: '100px' }}>
                      <input type="checkbox" checked={includeEsi} onChange={e => setIncludeEsi(e.target.checked)} />
                      Apply ESI?
                    </label>
                  </div>
                </div>

                <div className="doc-form-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label className="doc-form-label">Select Employees ({selectedBatchIds.length}/{employees.length})</label>
                    <button type="button" style={{ fontSize: '11px', background: 'none', border: 'none', color: 'var(--accent-primary)', cursor: 'pointer', fontWeight: '600' }} onClick={() => setSelectedBatchIds(selectedBatchIds.length === employees.length ? [] : employees.map(e => e.id))}>
                      {selectedBatchIds.length === employees.length ? 'Deselect All' : 'Select All'}
                    </button>
                  </div>
                  <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '10px', background: 'var(--bg-secondary)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {employees.map(emp => (
                      <label key={emp.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                        <input 
                          type="checkbox" 
                          checked={selectedBatchIds.includes(emp.id)} 
                          onChange={(e) => {
                            if (e.target.checked) setSelectedBatchIds([...selectedBatchIds, emp.id]);
                            else setSelectedBatchIds(selectedBatchIds.filter(id => id !== emp.id));
                          }} 
                        />
                        <span style={{ fontWeight: '500', color: 'var(--text-primary)' }}>{emp.name}</span> <span style={{ opacity: 0.7 }}>({emp.designation})</span>
                      </label>
                    ))}
                    {employees.length === 0 && <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No employees found in directory.</span>}
                  </div>
                </div>
                
                <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                  <button type="button" onClick={handlePrintBatch} className="btn-action-primary" style={{ flex: 1, display: 'flex', justifyContent: 'center', fontSize: '11px', padding: '8px 4px' }}>
                    <Printer size={13} /> Print All
                  </button>
                  <button type="button" onClick={handleDownloadBatchZip} className="btn-action-secondary" style={{ flex: 1, display: 'flex', justifyContent: 'center', background: 'rgba(139, 92, 246, 0.05)', color: '#8b5cf6', borderColor: 'rgba(139, 92, 246, 0.2)', fontSize: '11px', padding: '8px 4px' }}>
                    <FileArchive size={13} /> ZIP PDFs
                  </button>
                  <button type="button" onClick={handleSendBatchEmails} className="btn-action-secondary" style={{ flex: 1.2, display: 'flex', justifyContent: 'center', background: 'rgba(99, 102, 241, 0.05)', color: 'var(--accent-primary)', borderColor: 'rgba(99, 102, 241, 0.2)', fontSize: '11px', padding: '8px 4px' }} title="Email all selected payslips">
                    <Mail size={13} /> Email All
                  </button>
                </div>
              </div>
            ) : (
              <>
                {employees.length > 0 && (
                  <div className="doc-form-group" style={{ background: 'var(--bg-secondary)', padding: '10px', borderRadius: '6px', border: '1px dashed var(--border-color)' }}>
                    <label className="doc-form-label" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>⚡ Autofill from Directory</label>
                    <select className="doc-form-input" onChange={e => handleAutofillFromEmployee(e.target.value, 'salary')} defaultValue="">
                      <option value="" disabled>Select an employee...</option>
                      {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.name} ({emp.designation})</option>)}
                    </select>
                  </div>
                )}
            
            {/* Auto calculations panel */}
            <div className="doc-smart-autofill-panel">
              <span className="doc-smart-title">⚡ Smart Indian Salary Calculator</span>
              <div className="doc-smart-input-flex" style={{ flexWrap: 'wrap', gap: '0.5rem' }}>
                <input 
                  type="number" 
                  value={grossInput || ''} 
                  onChange={e => setGrossInput(Number(e.target.value))}
                  className="doc-form-input" 
                  style={{ fontWeight: '600', minWidth: '150px', flex: 1 }}
                  placeholder="Monthly Gross (CTC/12)"
                />
                
                <select 
                  value={pfType} 
                  onChange={e => setPfType(e.target.value)} 
                  className="doc-form-input"
                  style={{ minWidth: '150px', flex: 1 }}
                >
                  <option value="capped">PF: Capped at ₹1800</option>
                  <option value="full">PF: 12% of Basic</option>
                  <option value="none">PF: No PF Deduction</option>
                </select>

                <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', minWidth: '80px' }}>
                  <input type="checkbox" checked={includeEsi} onChange={e => setIncludeEsi(e.target.checked)} />
                  Apply ESI?
                </label>

                <button 
                  type="button" 
                  onClick={autofillSalaryBreakdown} 
                  className="btn-action-primary"
                  style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', boxShadow: 'none' }}
                >
                  Autofill Breakdown
                </button>
              </div>
              <span className="doc-smart-desc" style={{ marginTop: '0.5rem', display: 'block' }}>
                Auto-calculates Basic (50%), HRA (40% of Basic), Conveyance, Special Allowance, LOP adjustment, PF, ESI (if applicable) and PT.
              </span>
            </div>

            <div className="doc-form-grid-2">
              <div className="doc-form-group">
                <label className="doc-form-label">Month & Year</label>
                <select 
                  value={salaryData.monthYear} 
                  id="input-salary-monthYear"
                  onChange={e => setSalaryData({ ...salaryData, monthYear: e.target.value })}
                  className="doc-form-input" 
                >
                  <option value="" disabled>Select Month...</option>
                  {MONTH_OPTIONS.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
              <div className="doc-form-group">
                <label className="doc-form-label">Employee ID</label>
                <input 
                  type="text" 
                  id="input-salary-employeeId"
                  value={salaryData.employeeId} 
                  onChange={e => setSalaryData({ ...salaryData, employeeId: e.target.value })}
                  className="doc-form-input" 
                />
              </div>
            </div>

            <div className="doc-form-grid-2">
              <div className="doc-form-group">
                <label className="doc-form-label">Employee Name</label>
                <input 
                  type="text" 
                  id="input-salary-employeeName"
                  value={salaryData.employeeName} 
                  onChange={e => setSalaryData({ ...salaryData, employeeName: e.target.value })}
                  className="doc-form-input" 
                />
              </div>
              <div className="doc-form-group">
                <label className="doc-form-label">Designation</label>
                <input 
                  type="text" 
                  id="input-salary-designation"
                  value={salaryData.designation} 
                  onChange={e => setSalaryData({ ...salaryData, designation: e.target.value })}
                  className="doc-form-input" 
                />
              </div>
            </div>

            {(() => {
              // Try to find matching employee
              const emp = employees.find(e => e.name === salaryData.employeeName || e.empId === salaryData.employeeId);
              if (!emp) return null;
              
              const matchedAttendance = attendanceList.find(a => a.employeeId === emp.id && a.monthYear === salaryData.monthYear);
              
              if (matchedAttendance) {
                return (
                  <div style={{ 
                    background: 'rgba(16, 185, 129, 0.08)', 
                    border: '1px solid rgba(16, 185, 129, 0.15)', 
                    padding: '8px 12px', 
                    borderRadius: '6px', 
                    fontSize: '0.75rem', 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    marginTop: '0.25rem',
                    marginBottom: '0.25rem'
                  }}>
                    <span style={{ color: '#10b981', fontWeight: '600' }}>
                      ✅ Attendance Sync'd ({matchedAttendance.presentDays} Days Worked, {matchedAttendance.lopDays} LOP)
                    </span>
                    <button type="button" onClick={() => {
                      const gross = Number(grossInput) || 0;
                      const paidDays = matchedAttendance.presentDays;
                      const lop = matchedAttendance.lopDays;
                      const proRatedGross = Math.round((gross / 30) * paidDays);
                      const basic = Math.round(proRatedGross * 0.50);
                      const hra = Math.round(basic * 0.40); 
                      const conveyance = proRatedGross > 3000 ? 1600 : 0; 
                      const special = proRatedGross - (basic + hra + conveyance);
                      const pf = pfType === 'capped' ? Math.min(Math.round(basic * 0.12), 1800) : pfType === 'full' ? Math.round(basic * 0.12) : 0;
                      let esi = (includeEsi && gross <= 21000) ? Math.ceil(proRatedGross * 0.0075) : 0;
                      const pt = gross > 15000 ? 200 : (gross > 10000 ? 150 : 0);
                      const monthlyTDS = calculateIndianIncomeTax(gross);

                      setSalaryData(prev => ({
                        ...prev,
                        paidDays,
                        lopDays: lop,
                        basicSalary: basic,
                        hra,
                        conveyanceAllowance: conveyance,
                        specialAllowance: special > 0 ? special : 0,
                        providentFund: pf,
                        professionalTax: pt,
                        esi,
                        incomeTax: monthlyTDS
                      }));
                      alert("Salary values re-synchronized with attendance metrics!");
                    }} style={{ 
                      background: 'var(--accent-primary)', 
                      border: 'none', 
                      color: '#fff', 
                      padding: '3px 8px', 
                      borderRadius: '4px', 
                      fontSize: '0.65rem', 
                      cursor: 'pointer', 
                      fontWeight: 'bold',
                      transition: 'background 0.2s'
                    }}>
                      Re-Sync Calculations
                    </button>
                  </div>
                );
              } else {
                return (
                  <div style={{ 
                    background: 'rgba(245, 158, 11, 0.08)', 
                    border: '1px solid rgba(245, 158, 11, 0.15)', 
                    padding: '8px 12px', 
                    borderRadius: '6px', 
                    fontSize: '0.75rem', 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    marginTop: '0.25rem',
                    marginBottom: '0.25rem'
                  }}>
                    <span style={{ color: '#f59e0b', fontWeight: '500' }}>
                      ⚠️ No attendance logs found for {salaryData.monthYear || 'selected period'}.
                    </span>
                    <button type="button" onClick={() => setDocType('attendance')} style={{ 
                      background: 'none', 
                      border: 'none', 
                      color: 'var(--accent-primary)', 
                      textDecoration: 'underline', 
                      fontSize: '0.65rem', 
                      cursor: 'pointer', 
                      fontWeight: 'bold' 
                    }}>
                      Log Attendance
                    </button>
                  </div>
                );
              }
            })()}

            <div className="doc-form-grid-2">
              <div className="doc-form-group">
                <label className="doc-form-label">Bank Name</label>
                <input 
                  type="text" 
                  id="input-salary-bankName"
                  value={salaryData.bankName} 
                  onChange={e => setSalaryData({ ...salaryData, bankName: e.target.value })}
                  className="doc-form-input" 
                />
              </div>
              <div className="doc-form-group">
                <label className="doc-form-label">Account No</label>
                <input 
                  type="text" 
                  id="input-salary-accountNumber"
                  value={salaryData.accountNumber} 
                  onChange={e => setSalaryData({ ...salaryData, accountNumber: e.target.value })}
                  className="doc-form-input" 
                />
              </div>
            </div>

            <div className="doc-form-group">
              <label className="doc-form-label">Employee Email Address</label>
              <input 
                type="email" 
                id="input-salary-employeeEmail"
                value={salaryData.employeeEmail || ''} 
                onChange={e => setSalaryData({ ...salaryData, employeeEmail: e.target.value })}
                className="doc-form-input" 
                placeholder="e.g. employee@company.com"
              />
            </div>

            <div className="doc-form-grid-2">
              <div className="doc-form-group">
                <label className="doc-form-label">Paid Days</label>
                <input 
                  type="number" 
                  id="input-salary-paidDays"
                  value={salaryData.paidDays} 
                  onChange={e => setSalaryData({ ...salaryData, paidDays: Number(e.target.value) })}
                  className="doc-form-input" 
                />
              </div>
              <div className="doc-form-group">
                <label className="doc-form-label">LOP Days</label>
                <input 
                  type="number" 
                  id="input-salary-lopDays"
                  value={salaryData.lopDays} 
                  onChange={e => setSalaryData({ ...salaryData, lopDays: Number(e.target.value) })}
                  className="doc-form-input" 
                />
              </div>
            </div>

            <div className="doc-form-section">
              <div className="doc-form-section-title">Earnings Breakdown</div>
              <div className="doc-form-grid-2">
                <div className="doc-form-group">
                  <label className="doc-form-label">Basic Salary (₹)</label>
                  <input 
                    type="number" 
                    id="input-salary-basicSalary"
                    value={salaryData.basicSalary || ''} 
                    onChange={e => setSalaryData({ ...salaryData, basicSalary: Number(e.target.value) })}
                    className="doc-form-input" 
                  />
                </div>
                <div className="doc-form-group">
                  <label className="doc-form-label">HRA (₹)</label>
                  <input 
                    type="number" 
                    id="input-salary-hra"
                    value={salaryData.hra || ''} 
                    onChange={e => setSalaryData({ ...salaryData, hra: Number(e.target.value) })}
                    className="doc-form-input" 
                  />
                </div>
              </div>

              <div className="doc-form-grid-2">
                <div className="doc-form-group">
                  <label className="doc-form-label">Conveyance (₹)</label>
                  <input 
                    type="number" 
                    id="input-salary-conveyanceAllowance"
                    value={salaryData.conveyanceAllowance || ''} 
                    onChange={e => setSalaryData({ ...salaryData, conveyanceAllowance: Number(e.target.value) })}
                    className="doc-form-input" 
                  />
                </div>
                <div className="doc-form-group">
                  <label className="doc-form-label">Special Allowance (₹)</label>
                  <input 
                    type="number" 
                    id="input-salary-specialAllowance"
                    value={salaryData.specialAllowance || ''} 
                    onChange={e => setSalaryData({ ...salaryData, specialAllowance: Number(e.target.value) })}
                    className="doc-form-input" 
                  />
                </div>
              </div>
            </div>

            <div className="doc-form-section">
              <div className="doc-form-section-title">Deductions Breakdown</div>
              <div className="doc-form-grid-3">
                <div className="doc-form-group">
                  <label className="doc-form-label" style={{ fontSize: '9px' }}>PF (₹)</label>
                  <input 
                    type="number" 
                    id="input-salary-providentFund"
                    value={salaryData.providentFund || ''} 
                    onChange={e => setSalaryData({ ...salaryData, providentFund: Number(e.target.value) })}
                    className="doc-form-input" 
                    style={{ padding: '0.4rem' }}
                  />
                </div>
                <div className="doc-form-group">
                  <label className="doc-form-label" style={{ fontSize: '9px' }}>PT (₹)</label>
                  <input 
                    type="number" 
                    id="input-salary-professionalTax"
                    value={salaryData.professionalTax || ''} 
                    onChange={e => setSalaryData({ ...salaryData, professionalTax: Number(e.target.value) })}
                    className="doc-form-input" 
                    style={{ padding: '0.4rem' }}
                  />
                </div>
                <div className="doc-form-group">
                  <label className="doc-form-label" style={{ fontSize: '9px' }}>TDS / Tax (₹)</label>
                  <input 
                    type="number" 
                    id="input-salary-incomeTax"
                    value={salaryData.incomeTax || ''} 
                    onChange={e => setSalaryData({ ...salaryData, incomeTax: Number(e.target.value) })}
                    className="doc-form-input" 
                    style={{ padding: '0.4rem' }}
                  />
                </div>
              </div>
            </div>

              <div className="doc-form-section">
                <div className="doc-form-group">
                  <label className="doc-form-label">Authorized Signatory Name</label>
                  <input 
                    type="text" 
                    id="input-salary-signeeName"
                    value={salaryData.signeeName} 
                    onChange={e => setSalaryData({ ...salaryData, signeeName: e.target.value })}
                    className="doc-form-input" 
                  />
                </div>
              </div>
              </>
            )}
          </div>
        )}

        {docType === 'custom' && activeCustomTemplate && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            
            {/* Navigation back */}
            <button 
              type="button" 
              onClick={() => { setActiveCustomTemplate(null); }}
              className="btn-action-outline"
              style={{ width: '100%', padding: '0.45rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', marginBottom: '0.5rem' }}
            >
              ← Back to Templates Library
            </button>

            {/* Template Details */}
            <div className="doc-form-group">
              <label className="doc-form-label">Template Name</label>
              <input 
                type="text" 
                value={customTemplateName} 
                onChange={e => setCustomTemplateName(e.target.value)}
                className="doc-form-input" 
                placeholder="e.g. Relieving Letter"
              />
            </div>

            <div className="doc-form-group" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <input 
                type="checkbox" 
                id="toggle-raw-editor"
                checked={showCustomEditor} 
                onChange={e => setShowCustomEditor(e.target.checked)}
                style={{ cursor: 'pointer' }}
              />
              <label htmlFor="toggle-raw-editor" className="doc-form-label" style={{ margin: 0, cursor: 'pointer', fontSize: '10px' }}>
                Show Raw Template Text Editor
              </label>
            </div>

            {showCustomEditor && (
              <div className="doc-form-group">
                <label className="doc-form-label">Template Text Body</label>
                <textarea 
                  value={customTemplateBody} 
                  onChange={e => setCustomTemplateBody(e.target.value)}
                  className="doc-form-textarea" 
                  rows={10}
                  placeholder="Dear {{Employee Name}},&#10;&#10;We are pleased to appoint you as {{Designation}}..."
                  style={{ fontSize: '11px', fontFamily: 'monospace', lineHeight: '1.4' }}
                />
                <span style={{ fontSize: '9px', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                  Write text using double curly braces like <code>{`{{Field Name}}`}</code> to generate dynamic inputs below.
                </span>
              </div>
            )}

            {/* Save Template Button */}
            <button 
              type="button" 
              onClick={handleSaveCustomTemplate}
              className="btn-action-outline"
              style={{ width: '100%', padding: '0.45rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', color: 'var(--accent-hover)', borderColor: 'rgba(99, 102, 241, 0.3)' }}
            >
              💾 Save Template Structure
            </button>

            <div style={{ height: '1px', background: 'var(--border-color)', margin: '0.5rem 0' }} />

            {/* Dynamic Form Variables */}
            <div className="doc-form-section-title" style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
              Dynamic Parameters
            </div>

            {employees.length > 0 && customTemplateFields.length > 0 && (
              <div className="doc-form-group" style={{ background: 'var(--bg-secondary)', padding: '10px', borderRadius: '6px', border: '1px dashed var(--border-color)', marginBottom: '0.5rem' }}>
                <label className="doc-form-label" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>⚡ Autofill from Directory</label>
                <select className="doc-form-input" onChange={e => handleAutofillFromEmployee(e.target.value, 'custom')} defaultValue="">
                  <option value="" disabled>Select an employee...</option>
                  {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.name} ({emp.designation})</option>)}
                </select>
              </div>
            )}

            {customTemplateFields.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {customTemplateFields.map(field => (
                  <div className="doc-form-group" key={field}>
                    <label className="doc-form-label">{field}</label>
                    <input 
                      type="text" 
                      id={`input-custom-${field.replace(/\s+/g, '-')}`}
                      value={customFieldValues[field] || ''} 
                      onChange={e => setCustomFieldValues({ ...customFieldValues, [field]: e.target.value })}
                      className="doc-form-input" 
                      placeholder={`Enter ${field}`}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ 
                background: 'rgba(251, 191, 36, 0.05)', 
                border: '1px dotted rgba(251, 191, 36, 0.2)', 
                borderRadius: '6px', 
                padding: '12px', 
                textAlign: 'center', 
                fontSize: '0.7rem', 
                color: 'var(--warning)' 
              }}>
                No dynamic placeholders detected. Use <code>{`{{Name}}`}</code> inside the text editor to create input fields.
              </div>
            )}

          </div>
        )}
      </div> {/* close .doc-form-scrollable-content */}
    </div> {/* close .doc-generator-form-panel */}

      {/* RIGHT COLUMN: Live Print Preview & Management Dashboards */}
      <div className={`doc-generator-preview-panel ${['dashboard', 'employees', 'salary-tracker', 'history', 'email-config', 'attendance'].includes(docType) ? 'fullscreen-mode' : ''}`}>
        {docType === 'dashboard' && sidebarCollapsed && (
          <button 
            type="button" 
            onClick={() => toggleSidebarCollapse()}
            className="no-print btn-action-outline"
            style={{
              position: 'fixed',
              left: '15px',
              top: '15px',
              zIndex: 9999,
              padding: '8px 12px',
              borderRadius: '8px',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-primary)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: 'var(--shadow-lg)',
              cursor: 'pointer',
              animation: 'fadeIn 0.2s ease-in-out'
            }}
            title="Expand Sidebar"
          >
            <Menu size={14} />
            <span style={{ fontSize: '0.7rem', fontWeight: '700', letterSpacing: '0.02em' }}>Expand Sidebar</span>
          </button>
        )}

        {/* Unified Top Navigation Bar inside Preview Panel */}
        {['offer', 'termination', 'experience', 'salary', 'custom'].includes(docType) && (
          <div className="no-print" style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '0.65rem 1.25rem',
            background: 'var(--bg-secondary)',
            borderBottom: '1px solid var(--border-color)',
            width: '100%',
            position: 'sticky',
            top: 0,
            zIndex: 100,
            gap: '1rem',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              {sidebarCollapsed && (
                <button 
                  type="button"
                  onClick={() => toggleSidebarCollapse()}
                  className="btn-action-outline"
                  style={{ padding: '0.45rem 0.85rem', fontSize: '0.72rem', fontWeight: '700', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <Menu size={12} /> Sidebar
                </button>
              )}
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <FileText size={14} style={{ color: 'var(--accent-primary)' }} />
              <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                {activePreviewType === 'offer' ? 'Offer Letter Workspace' : activePreviewType === 'termination' ? 'Exit Letter Workspace' : activePreviewType === 'experience' ? 'Experience Certificate Workspace' : activePreviewType === 'salary' ? 'Pay Slip Workspace' : 'Custom Document Workspace'}
              </span>
              <span style={{ fontSize: '0.65rem', background: 'rgba(99, 102, 241, 0.1)', color: 'var(--accent-primary)', padding: '2px 6px', borderRadius: '4px', marginLeft: '4px', fontWeight: '600' }}>
                Live Preview
              </span>
            </div>

            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              {docType === 'offer' && (
                <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: '600', marginRight: '4px' }}>Jump to:</span>
                  <button type="button" onClick={() => scrollToPage(1)} className="navigator-btn" style={{ fontSize: '0.65rem', padding: '0.3rem 0.6rem' }}>P1</button>
                  <button type="button" onClick={() => scrollToPage(2)} className="navigator-btn" style={{ fontSize: '0.65rem', padding: '0.3rem 0.6rem' }}>P2</button>
                  <button type="button" onClick={() => scrollToPage(3)} className="navigator-btn" style={{ fontSize: '0.65rem', padding: '0.3rem 0.6rem' }}>P3</button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Help banner details (no-print) */}
        {['offer', 'termination', 'experience', 'salary', 'custom'].includes(docType) && (
          <div className="doc-preview-tip-box no-print">
            <Eye size={18} />
            <div>
              <strong style={{ display: 'block', fontWeight: 'bold', marginBottom: '4px' }}>Live PDF Preview Mode</strong>
              <p>This panel shows the actual page boundaries. To save as a PDF file on your computer:</p>
              <ul>
                <li>Click the blue <strong>Print Document</strong> button above.</li>
                <li>Set <strong>Destination</strong> to <strong>Save as PDF</strong> in the system print dialog.</li>
                <li>Check <strong>Background graphics</strong> to include the vertical blue borders and table styling.</li>
                <li>Disable standard browser headers/footers to remove page URL and dates.</li>
              </ul>
            </div>
          </div>
        )}

        {/* Viewport rendering A4 sheets OR Full Size Views */}
        {['offer', 'termination', 'experience', 'salary', 'custom'].includes(docType) ? (
          <div className="doc-preview-viewport">
            {activePreviewType === 'offer' && (
              <OfferLetterView 
                data={offerData} 
                customLogo={customLogo} 
                customSignature={customSignature} 
                companyName={companyName}
                companyLocation={companyLocation}
                logoSize={logoSize}
                logoX={logoX}
                logoY={logoY}
                template={template}
                onChangeLogoPosition={(x, y) => { setLogoX(x); setLogoY(y); }}
              />
            )}
            {activePreviewType === 'termination' && (
              <TerminationLetterView 
                data={terminationData} 
                customLogo={customLogo} 
                customSignature={customSignature} 
                companyName={companyName}
                companyLocation={companyLocation}
                logoSize={logoSize}
                logoX={logoX}
                logoY={logoY}
                template={template}
                onChangeLogoPosition={(x, y) => { setLogoX(x); setLogoY(y); }}
              />
            )}
            {activePreviewType === 'experience' && (
              <ExperienceLetterView 
                data={experienceData} 
                customLogo={customLogo} 
                customSignature={customSignature} 
                companyName={companyName}
                companyLocation={companyLocation}
                logoSize={logoSize}
                logoX={logoX}
                logoY={logoY}
                template={template}
                onChangeLogoPosition={(x, y) => { setLogoX(x); setLogoY(y); }}
              />
            )}
            {activePreviewType === 'salary' && !isBatchMode && (
              <SalarySlipView 
                data={salaryData} 
                customLogo={customLogo} 
                customSignature={customSignature} 
                companyName={companyName}
                companyLocation={companyLocation}
                logoSize={logoSize}
                logoX={logoX}
                logoY={logoY}
                template={template}
                onChangeLogoPosition={(x, y) => { setLogoX(x); setLogoY(y); }}
              />
            )}
            {activePreviewType === 'salary' && isBatchMode && (
              <BatchSalarySlips 
                batchData={getBatchData()} 
                customLogo={customLogo} 
                customSignature={customSignature} 
                companyName={companyName}
                companyLocation={companyLocation}
                logoSize={logoSize}
                logoX={logoX}
                logoY={logoY}
                template={template}
                divRef={batchRef}
                onChangeLogoPosition={(x, y) => { setLogoX(x); setLogoY(y); }}
              />
            )}
            {activePreviewType === 'custom' && activeCustomTemplate && (
              <CustomTemplateView 
                name={customTemplateName}
                body={customTemplateBody}
                fieldValues={customFieldValues}
                customLogo={customLogo}
                customSignature={customSignature}
                companyName={companyName}
                companyLocation={companyLocation}
                logoSize={logoSize}
                logoX={logoX}
                logoY={logoY}
                template={template}
                onChangeLogoPosition={(x, y) => { setLogoX(x); setLogoY(y); }}
              />
            )}
          </div>
        ) : (
          <div style={{ width: '100%', minHeight: '100%' }}>
            {docType === 'dashboard' && (
              <DashboardView 
                employees={employees} 
                historyList={historyList} 
                salaryHistory={salaryHistory} 
                attendanceList={attendanceList}
                onNavigate={changeDocType} 
              />
            )}
            {docType === 'employees' && (
              <EmployeeDirectoryView 
                employees={employees} 
                empForm={empForm} 
                setEmpForm={setEmpForm} 
                editingEmployee={editingEmployee} 
                setEditingEmployee={setEditingEmployee} 
                handleSaveEmployee={handleSaveEmployee} 
                handleEditEmployee={handleEditEmployee} 
                handleDeleteEmployee={handleDeleteEmployee} 
                onNavigate={changeDocType}
                sidebarCollapsed={sidebarCollapsed}
                toggleSidebarCollapse={toggleSidebarCollapse}
                onImportEmployees={handleImportEmployees}
              />
            )}
            {docType === 'salary-tracker' && (
              <SalaryTrackerView 
                salaryHistory={salaryHistory} 
                onDeleteRecord={handleDeleteSalaryRecord} 
                onClearAll={handleClearSalaryLedger} 
                onLoadRecord={handleLoadSalaryRecord} 
                onNavigate={changeDocType}
                sidebarCollapsed={sidebarCollapsed}
                toggleSidebarCollapse={toggleSidebarCollapse}
              />
            )}
            {docType === 'history' && (
              <HistoryView 
                historyList={historyList} 
                onLoadRecord={loadHistoryItem} 
                onDeleteRecord={deleteHistoryItem} 
                onClearAll={() => {
                  if (window.confirm("Clear all document archives?")) {
                    setHistoryList([]);
                    localStorage.removeItem('doc_generator_history');
                  }
                }}
                onNavigate={changeDocType}
                sidebarCollapsed={sidebarCollapsed}
                toggleSidebarCollapse={toggleSidebarCollapse}
              />
            )}
            {docType === 'email-config' && (
              <EmailConfigView 
                smtpConfig={smtpConfig} 
                onSaveConfig={handleSaveSmtpConfig} 
                onTestConnection={handleTestSmtpConnection} 
                onNavigate={changeDocType}
                sidebarCollapsed={sidebarCollapsed}
                toggleSidebarCollapse={toggleSidebarCollapse}
              />
            )}
            {docType === 'attendance' && (
              <AttendanceTrackerView 
                employees={employees} 
                attendanceList={attendanceList} 
                onSaveAttendance={handleSaveAttendance} 
                onNavigate={changeDocType}
                sidebarCollapsed={sidebarCollapsed}
                toggleSidebarCollapse={toggleSidebarCollapse}
              />
            )}
            {docType === 'custom' && !activeCustomTemplate && (
              <CustomTemplatesList 
                templates={customTemplates}
                onSelectTemplate={handleSelectCustomTemplate}
                onEditTemplate={handleEditCustomTemplateText}
                onDeleteTemplate={handleDeleteCustomTemplate}
                onCreateBlank={handleCreateBlankCustomTemplate}
                onUploadTemplate={handleUploadCustomTemplate}
                onImportLibrary={handleImportTemplateLibrary}
                sidebarCollapsed={sidebarCollapsed}
                toggleSidebarCollapse={toggleSidebarCollapse}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

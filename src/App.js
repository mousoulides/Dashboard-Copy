import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { Download, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';

// Translations object
const translations = {
  en: {
    title: "Cyprus and EU Labour Market Dashboard",
    lastUpdated: "Last Updated:",
    exportToExcel: "Export to Excel", 
    printReport: "Print Report",
    tabs: {
      overview: "Overview",
      dataUpload: "Data Upload",
      unemploymentTrends: "Unemployment Trends", 
      demographics: "Demographics",
      sectoralEmployment: "Sectoral Employment",
      wageComparison: "Wage Comparison",
      dataTables: "Data Tables"
    },
    metrics: {
      cyprusKeyMetrics: "Cyprus Key Metrics",
      euAverageMetrics: "EU Average Metrics",
      unemploymentRate: "Unemployment Rate",
      employmentRate: "Employment Rate", 
      averageSalary: "Average Salary",
      youthUnemployment: "Youth Unemployment"
    },
    sections: {
      keyIndicators: "Key Labour Market Indicators Summary",
      comprehensiveOverview: "Comprehensive overview of Cyprus and EU labour market performance",
      performanceComparison: "Performance Comparison",
      cyprusVsEU: "Cyprus vs EU Key Labour Market Indicators"
    },
    chartLabels: {
      unemploymentRate: "Unemployment Rate",
      employmentRate: "Employment Rate",
      youthUnemployment: "Youth Unemployment", 
      labourForceParticipation: "Labour Force Participation",
      cyprus: "Cyprus",
      euAverage: "EU Average",
      percentage: "Percentage (%)"
    }
  },
  el: {
    title: "Πίνακας Ελέγχου Αγοράς Εργασίας Κύπρου και ΕΕ",
    lastUpdated: "Τελευταία Ενημέρωση:",
    exportToExcel: "Εξαγωγή σε Excel",
    printReport: "Εκτύπωση Αναφοράς", 
    tabs: {
      overview: "Επισκόπηση",
      dataUpload: "Φόρτωση Δεδομένων",
      unemploymentTrends: "Τάσεις Ανεργίας",
      demographics: "Δημογραφικά", 
      sectoralEmployment: "Τομεακή Απασχόληση",
      wageComparison: "Σύγκριση Μισθών",
      dataTables: "Πίνακες Δεδομένων"
    },
    metrics: {
      cyprusKeyMetrics: "Βασικοί Δείκτες Κύπρου", 
      euAverageMetrics: "Μέσοι Όροι ΕΕ",
      unemploymentRate: "Ποσοστό Ανεργίας",
      employmentRate: "Ποσοστό Απασχόλησης",
      averageSalary: "Μέσος Μισθός", 
      youthUnemployment: "Νεανική Ανεργία"
    },
    sections: {
      keyIndicators: "Σύνοψη Βασικών Δεικτών Αγοράς Εργασίας",
      comprehensiveOverview: "Ολοκληρωμένη επισκόπηση της απόδοσης της αγοράς εργασίας Κύπρου και ΕΕ",
      performanceComparison: "Σύγκριση Απόδοσης", 
      cyprusVsEU: "Κύπρος έναντι ΕΕ Βασικοί Δείκτες Αγοράς Εργασίας"
    },
    chartLabels: {
      unemploymentRate: "Ποσοστό Ανεργίας",
      employmentRate: "Ποσοστό Απασχόλησης", 
      youthUnemployment: "Νεανική Ανεργία",
      labourForceParticipation: "Συμμετοχή Εργατικού Δυναμικού",
      cyprus: "Κύπρος",
      euAverage: "Μέσος Όρος ΕΕ",
      percentage: "Ποσοστό (%)"
    }
  }
};

const LabourMarketDashboard = () => {
  const [activeTab, setActiveTab] = useState('Overview');
  const [language, setLanguage] = useState('en');
  const [csvData, setCsvData] = useState(null);
  const [uploadStatus, setUploadStatus] = useState('');
  const [monthlyData, setMonthlyData] = useState([
    { month: 'Jan 2025', Cyprus: 4.8, EU: 6.1, date: '2025-01' },
    { month: 'Feb 2025', Cyprus: 4.7, EU: 6.0, date: '2025-02' },
    { month: 'Mar 2025', Cyprus: 4.6, EU: 5.9, date: '2025-03' },
    { month: 'Apr 2025', Cyprus: 4.5, EU: 5.8, date: '2025-04' },
    { month: 'May 2025', Cyprus: 4.6, EU: 5.9, date: '2025-05' },
    { month: 'Jun 2025', Cyprus: 4.4, EU: 5.7, date: '2025-06' }
  ]);
  const [currentMetrics, setCurrentMetrics] = useState({
    cyprus: {
      unemploymentRate: 4.6,
      employmentRate: 79.9,
      averageSalary: 2363,
      youthUnemployment: 15.1,
      labourForceParticipation: 65.2
    },
    eu: {
      unemploymentRate: 5.9,
      employmentRate: 75.8,
      averageSalary: 3158,
      youthUnemployment: 15.0,
      labourForceParticipation: 74.8
    }
  });
  
  const t = translations[language];

  const tabs = [
    'Overview',
    'Data Upload',
    'Unemployment Trends', 
    'Demographics',
    'Sectoral Employment',
    'Wage Comparison',
    'Data Tables'
  ];

  // File upload handlers for different data types
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setUploadStatus('processing');
    
    try {
      const fileExtension = file.name.split('.').pop().toLowerCase();
      
      if (fileExtension === 'csv') {
        await handleCSVUpload(file);
      } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
        await handleExcelUpload(file);
      } else {
        setUploadStatus('error');
        alert('Please upload a CSV or Excel file only');
        return;
      }
    } catch (error) {
      console.error('Upload error:', error);
      setUploadStatus('error');
    }
  };

  const handleCSVUpload = (file) => {
    return new Promise((resolve) => {
      Papa.parse(file, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        complete: (results) => {
          processUploadedData(results.data);
          resolve();
        }
      });
    });
  };

  const handleExcelUpload = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        processUploadedData(jsonData);
        resolve();
      };
      reader.readAsArrayBuffer(file);
    });
  };

  const processUploadedData = (data) => {
    console.log('Processing data:', data);
    
    // Check if data contains monthly unemployment trends
    if (data.length > 0 && data[0].hasOwnProperty('month') && data[0].hasOwnProperty('Cyprus')) {
      setMonthlyData(data);
      setUploadStatus('success-monthly');
    }
    // Check if data contains current metrics
    else if (data.length > 0 && data[0].hasOwnProperty('metric') && data[0].hasOwnProperty('cyprus_value')) {
      updateCurrentMetrics(data);
      setUploadStatus('success-metrics');
    }
    // General data upload
    else {
      setCsvData(data);
      setUploadStatus('success-general');
    }
  };

  const updateCurrentMetrics = (data) => {
    const newMetrics = { cyprus: {}, eu: {} };
    
    data.forEach(row => {
      const metric = row.metric?.toLowerCase().replace(/\s+/g, '');
      if (metric && row.cyprus_value && row.eu_value) {
        if (metric.includes('unemployment')) {
          newMetrics.cyprus.unemploymentRate = parseFloat(row.cyprus_value);
          newMetrics.eu.unemploymentRate = parseFloat(row.eu_value);
        } else if (metric.includes('employment')) {
          newMetrics.cyprus.employmentRate = parseFloat(row.cyprus_value);
          newMetrics.eu.employmentRate = parseFloat(row.eu_value);
        } else if (metric.includes('salary') || metric.includes('wage')) {
          newMetrics.cyprus.averageSalary = parseFloat(row.cyprus_value);
          newMetrics.eu.averageSalary = parseFloat(row.eu_value);
        } else if (metric.includes('youth')) {
          newMetrics.cyprus.youthUnemployment = parseFloat(row.cyprus_value);
          newMetrics.eu.youthUnemployment = parseFloat(row.eu_value);
        }
      }
    });
    
    setCurrentMetrics(prev => ({
      cyprus: { ...prev.cyprus, ...newMetrics.cyprus },
      eu: { ...prev.eu, ...newMetrics.eu }
    }));
  };

  const downloadTemplate = (type) => {
    let csvContent = '';
    
    if (type === 'monthly') {
      csvContent = 'month,Cyprus,EU,date\nJul 2025,4.3,5.6,2025-07\nAug 2025,4.2,5.5,2025-08\n';
    } else if (type === 'metrics') {
      csvContent = 'metric,cyprus_value,eu_value\nUnemployment Rate,4.6,5.9\nEmployment Rate,79.9,75.8\nAverage Salary,2363,3158\nYouth Unemployment,15.1,15.0\n';
    }
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${type}_data_template.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Cyprus vs EU comparison data - with dynamic labels
  const getComparisonData = () => [
    {
      name: t.chartLabels.unemploymentRate,
      Cyprus: currentMetrics.cyprus.unemploymentRate,
      'EU Average': currentMetrics.eu.unemploymentRate
    },
    {
      name: t.chartLabels.employmentRate, 
      Cyprus: currentMetrics.cyprus.employmentRate,
      'EU Average': currentMetrics.eu.employmentRate
    },
    {
      name: t.chartLabels.youthUnemployment,
      Cyprus: currentMetrics.cyprus.youthUnemployment,
      'EU Average': currentMetrics.eu.youthUnemployment
    },
    {
      name: t.chartLabels.labourForceParticipation,
      Cyprus: currentMetrics.cyprus.labourForceParticipation,
      'EU Average': currentMetrics.eu.labourForceParticipation
    }
  ];

  const sectorData = [
    { name: 'Services', value: 76.2, color: '#22c55e' },
    { name: 'Industry', value: 15.8, color: '#3b82f6' },
    { name: 'Agriculture', value: 8.0, color: '#f59e0b' }
  ];

  const MetricCard = ({ title, value, bgColor = 'bg-gradient-to-br from-white to-gray-50' }) => (
    <div className={`${bgColor} rounded-xl p-6 text-center border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 hover:scale-[1.02]`}>
      <div className="text-sm text-gray-600 mb-2 font-medium uppercase tracking-wide">{title}</div>
      <div className="text-2xl font-bold bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">{value}</div>
    </div>
  );

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Key Metrics Summary */}
      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">{t.sections.keyIndicators}</h2>
        <p className="text-gray-500 mb-6">{t.sections.comprehensiveOverview}</p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Cyprus Metrics */}
          <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-lg hover:shadow-xl transition-shadow duration-300">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-xl mb-3">
                <span className="text-white font-bold text-lg">CY</span>
              </div>
              <h3 className="text-2xl font-bold bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">{t.metrics.cyprusKeyMetrics}</h3>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <MetricCard title={t.metrics.unemploymentRate} value={`${currentMetrics.cyprus.unemploymentRate}%`} />
              <MetricCard title={t.metrics.employmentRate} value={`${currentMetrics.cyprus.employmentRate}%`} />
              <MetricCard title={t.metrics.averageSalary} value={`€${currentMetrics.cyprus.averageSalary.toLocaleString()}`} />
              <MetricCard title={t.metrics.youthUnemployment} value={`${currentMetrics.cyprus.youthUnemployment}%`} />
            </div>
          </div>

          {/* EU Average Metrics */}
          <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-lg hover:shadow-xl transition-shadow duration-300">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl mb-3">
                <span className="text-white font-bold text-lg">EU</span>
              </div>
              <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">{t.metrics.euAverageMetrics}</h3>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <MetricCard title={t.metrics.unemploymentRate} value={`${currentMetrics.eu.unemploymentRate}%`} />
              <MetricCard title={t.metrics.employmentRate} value={`${currentMetrics.eu.employmentRate}%`} />
              <MetricCard title={t.metrics.averageSalary} value={`€${currentMetrics.eu.averageSalary.toLocaleString()}`} />
              <MetricCard title={t.metrics.youthUnemployment} value={`${currentMetrics.eu.youthUnemployment}%`} />
            </div>
          </div>
        </div>
      </div>

      {/* Performance Comparison Chart */}
      <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-lg hover:shadow-xl transition-shadow duration-300">
        <div className="text-center mb-8">
          <h3 className="text-2xl font-bold text-gray-800 mb-2">{t.sections.performanceComparison}</h3>
          <h4 className="text-lg text-gray-600">{t.sections.cyprusVsEU}</h4>
        </div>
        
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={getComparisonData()} margin={{ top: 20, right: 30, left: 40, bottom: 80 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="name" 
              tick={{ fontSize: 11, fill: '#6b7280' }}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis 
              tick={{ fontSize: 11, fill: '#6b7280' }} 
              label={{ value: t.chartLabels.percentage, angle: -90, position: 'insideLeft' }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#fff', 
                border: '1px solid #e5e7eb', 
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                fontSize: '12px'
              }}
            />
            <Bar dataKey="Cyprus" fill="#0ea5e9" radius={[2, 2, 0, 0]} />
            <Bar dataKey="EU Average" fill="#fb923c" radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
        
        <div className="flex justify-center mt-6 space-x-8">
          <div className="flex items-center bg-gray-50 px-4 py-2 rounded-full">
            <div className="w-4 h-4 bg-sky-500 rounded-full mr-3 shadow-sm"></div>
            <span className="text-sm font-medium text-gray-700">{t.chartLabels.cyprus}</span>
          </div>
          <div className="flex items-center bg-gray-50 px-4 py-2 rounded-full">
            <div className="w-4 h-4 bg-orange-400 rounded-full mr-3 shadow-sm"></div>
            <span className="text-sm font-medium text-gray-700">{t.chartLabels.euAverage}</span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderUnemploymentTrends = () => (
    <div className="space-y-6">
      {/* Trend Chart */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-6">Unemployment Rate Trends</h3>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={monthlyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} domain={['dataMin - 0.5', 'dataMax + 0.5']} />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#fff', 
                border: '1px solid #e5e7eb', 
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}
            />
            <Line 
              type="monotone" 
              dataKey="Cyprus" 
              stroke="#14b8a6" 
              strokeWidth={3}
              dot={{ fill: '#14b8a6', strokeWidth: 2, r: 5 }}
            />
            <Line 
              type="monotone" 
              dataKey="EU" 
              stroke="#fb923c" 
              strokeWidth={3}
              dot={{ fill: '#fb923c', strokeWidth: 2, r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  const renderDataUpload = () => (
    <div className="space-y-6">
      {/* Main Data Upload Section */}
      <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm hover:shadow-md transition-shadow duration-200">
        <h3 className="text-2xl font-bold mb-6 flex items-center text-gray-800">
          <div className="w-12 h-12 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-xl flex items-center justify-center mr-4">
            📁
          </div>
          Data Upload Center
        </h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Upload Area */}
          <div className="space-y-6">
            <div>
              <label className="block text-lg font-semibold text-gray-800 mb-4">
                Upload CSV or Excel Files
              </label>
              <input
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileUpload}
                className="block w-full text-sm text-gray-600 file:mr-4 file:py-4 file:px-8 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-gradient-to-r file:from-teal-50 file:to-cyan-50 file:text-teal-700 hover:file:from-teal-100 hover:file:to-cyan-100 border-2 border-dashed border-gray-300 rounded-xl p-6 focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200 hover:border-teal-300"
              />
              
              {/* Upload Status */}
              {uploadStatus && (
                <div className={`mt-4 p-4 rounded-xl flex items-center ${
                  uploadStatus.includes('success') ? 'bg-green-50 text-green-700 border border-green-200' : 
                  uploadStatus === 'processing' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                  'bg-red-50 text-red-700 border border-red-200'
                }`}>
                  {uploadStatus.includes('success') ? (
                    <CheckCircle className="w-5 h-5 mr-3" />
                  ) : uploadStatus === 'processing' ? (
                    <div className="w-5 h-5 mr-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <AlertCircle className="w-5 h-5 mr-3" />
                  )}
                  <div>
                    {uploadStatus === 'success-monthly' && (
                      <>
                        <div className="font-semibold">Monthly trend data updated successfully!</div>
                        <div className="text-sm">Your unemployment trend charts have been updated with the new data.</div>
                      </>
                    )}
                    {uploadStatus === 'success-metrics' && (
                      <>
                        <div className="font-semibold">Current metrics updated successfully!</div>
                        <div className="text-sm">Dashboard key indicators have been refreshed with your data.</div>
                      </>
                    )}
                    {uploadStatus === 'success-general' && (
                      <>
                        <div className="font-semibold">Data uploaded successfully!</div>
                        <div className="text-sm">Your data has been processed and is ready for analysis.</div>
                      </>
                    )}
                    {uploadStatus === 'processing' && 'Processing your file, please wait...'}
                    {uploadStatus === 'error' && (
                      <>
                        <div className="font-semibold">Upload failed</div>
                        <div className="text-sm">Please check your file format and try again.</div>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Supported Data Types */}
            <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
              <h4 className="font-semibold text-blue-900 mb-3 flex items-center">
                <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center mr-2">
                  <span className="text-white text-xs">ℹ</span>
                </div>
                Supported Data Types
              </h4>
              <div className="space-y-3 text-sm text-blue-800">
                <div className="flex items-start">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <div>
                    <strong>Monthly Trends:</strong> Unemployment data over time
                    <br />
                    <span className="text-blue-600">Columns: month, Cyprus, EU, date</span>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <div>
                    <strong>Current Metrics:</strong> Latest key performance indicators
                    <br />
                    <span className="text-blue-600">Columns: metric, cyprus_value, eu_value</span>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <div>
                    <strong>Supported formats:</strong> CSV, Excel (.xlsx, .xls)
                    <br />
                    <span className="text-blue-600">Date format: YYYY-MM for monthly data</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Template Downloads */}
          <div className="space-y-6">
            <div>
              <label className="block text-lg font-semibold text-gray-800 mb-4">
                Download Data Templates
              </label>
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                  <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
                    📈 Monthly Trends Template
                  </h4>
                  <p className="text-sm text-gray-600 mb-4">
                    Template for uploading monthly unemployment trend data with Cyprus and EU comparison.
                  </p>
                  <button
                    onClick={() => downloadTemplate('monthly')}
                    className="w-full px-6 py-3 bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-xl hover:from-teal-600 hover:to-cyan-600 transition-all duration-200 flex items-center justify-center font-semibold shadow-md hover:shadow-lg"
                  >
                    <Download className="w-5 h-5 mr-2" />
                    Download Monthly Template
                  </button>
                </div>

                <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                  <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
                    📊 Current Metrics Template
                  </h4>
                  <p className="text-sm text-gray-600 mb-4">
                    Template for updating current key performance indicators and comparative metrics.
                  </p>
                  <button
                    onClick={() => downloadTemplate('metrics')}
                    className="w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl hover:from-blue-600 hover:to-purple-600 transition-all duration-200 flex items-center justify-center font-semibold shadow-md hover:shadow-lg"
                  >
                    <Download className="w-5 h-5 mr-2" />
                    Download Metrics Template
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Tips */}
            <div className="bg-yellow-50 rounded-xl p-6 border border-yellow-200">
              <h4 className="font-semibold text-yellow-900 mb-3 flex items-center">
                💡 Quick Tips
              </h4>
              <ul className="text-sm text-yellow-800 space-y-2">
                <li>• Ensure your data follows the exact column names in templates</li>
                <li>• Use consistent date formats (YYYY-MM) for monthly data</li>
                <li>• Check for missing values before uploading</li>
                <li>• Large files may take a few moments to process</li>
                <li>• Upload will automatically detect the data type</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Upload History / Recent Activity */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
          <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center mr-3">
            📋
          </div>
          Data Status
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <h4 className="font-medium text-gray-700">Current Data Sources:</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                <span className="text-sm font-medium text-green-800">Monthly Trends</span>
                <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">Active</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                <span className="text-sm font-medium text-green-800">Key Metrics</span>
                <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">Active</span>
              </div>
            </div>
          </div>
          <div className="space-y-3">
            <h4 className="font-medium text-gray-700">Last Updated:</h4>
            <div className="space-y-2">
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="text-sm font-medium text-blue-800">Dashboard Metrics</div>
                <div className="text-xs text-blue-600">May 30, 2025</div>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="text-sm font-medium text-blue-800">Trend Data</div>
                <div className="text-xs text-blue-600">June 2025</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSectoralEmployment = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-6">Employment by Sector</h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={sectorData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={120}
              paddingAngle={5}
              dataKey="value"
            >
              {sectorData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
        <div className="mt-4 space-y-2">
          {sectorData.map((item, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center">
                <div 
                  className="w-3 h-3 rounded-full mr-3" 
                  style={{ backgroundColor: item.color }}
                ></div>
                <span className="text-sm font-medium text-gray-700">{item.name}</span>
              </div>
              <span className="text-sm font-semibold text-gray-900">{item.value}%</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-6">Sector Performance</h3>
        <div className="space-y-4">
          <div className="p-4 bg-green-50 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="font-medium text-green-800">Services Sector</span>
              <span className="text-green-600 font-bold">76.2%</span>
            </div>
            <p className="text-sm text-green-700 mt-1">Dominant employment sector</p>
          </div>
          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="font-medium text-blue-800">Industry</span>
              <span className="text-blue-600 font-bold">15.8%</span>
            </div>
            <p className="text-sm text-blue-700 mt-1">Manufacturing and construction</p>
          </div>
          <div className="p-4 bg-yellow-50 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="font-medium text-yellow-800">Agriculture</span>
              <span className="text-yellow-600 font-bold">8.0%</span>
            </div>
            <p className="text-sm text-yellow-700 mt-1">Traditional farming sector</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch(activeTab) {
      case 'Overview':
        return renderOverview();
      case 'Data Upload':
        return renderDataUpload();
      case 'Unemployment Trends':
        return renderUnemploymentTrends();
      case 'Sectoral Employment':
        return renderSectoralEmployment();
      case 'Demographics':
        return (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Demographics Analysis</h3>
            <p className="text-gray-600">Demographic breakdown and analysis will be displayed here.</p>
          </div>
        );
      case 'Wage Comparison':
        return (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Wage Comparison</h3>
            <p className="text-gray-600">Detailed wage analysis and comparisons will be displayed here.</p>
          </div>
        );
      case 'Data Tables':
        return (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Data Tables</h3>
            <p className="text-gray-600">Raw data tables and exports will be available here.</p>
          </div>
        );
      default:
        return renderOverview();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/20 to-teal-50/20">
      {/* Header */}
      <header className="bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-600 shadow-lg">
        <div className="px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <h1 className="text-3xl font-bold text-white drop-shadow-sm">{t.title}</h1>
              <button 
                onClick={() => setLanguage(language === 'en' ? 'el' : 'en')}
                className="ml-6 px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-lg text-sm hover:bg-white/30 transition-all duration-200 font-medium border border-white/20"
              >
                {language === 'en' ? 'EL' : 'EN'}
              </button>
            </div>
            <div className="flex items-center space-x-4 text-sm">
              <span className="text-white/90 bg-white/10 px-3 py-2 rounded-lg backdrop-blur-sm">{t.lastUpdated} May 30, 2025</span>
              <button className="px-4 py-2 bg-white/20 backdrop-blur-sm border border-white/20 rounded-lg hover:bg-white/30 transition-all duration-200 flex items-center text-white font-medium">
                <Download className="w-4 h-4 mr-2" />
                {t.exportToExcel}
              </button>
              <button className="px-4 py-2 bg-white/20 backdrop-blur-sm border border-white/20 rounded-lg hover:bg-white/30 transition-all duration-200 flex items-center text-white font-medium">
                <FileText className="w-4 h-4 mr-2" />
                {t.printReport}
              </button>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="px-6 pb-2">
          <nav className="flex space-x-2">
            {tabs.map((tab, index) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-3 px-6 rounded-t-xl font-medium text-sm transition-all duration-200 ${
                  activeTab === tab
                    ? 'bg-white text-teal-600 shadow-sm border-b-2 border-teal-500'
                    : 'text-white/80 hover:text-white hover:bg-white/10 backdrop-blur-sm'
                }`}
              >
                {Object.values(t.tabs)[index]}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6 bg-gradient-to-br from-gray-50 via-blue-50/30 to-teal-50/30 min-h-screen">
        {renderContent()}
      </main>
    </div>
  );
};

export default LabourMarketDashboard;
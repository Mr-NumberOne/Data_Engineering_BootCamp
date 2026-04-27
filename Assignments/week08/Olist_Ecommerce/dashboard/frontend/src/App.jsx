import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from './components/DashboardLayout';
import OverviewPage from './pages/OverviewPage';
import CustomersPage from './pages/CustomersPage';
import SellersPage from './pages/SellersPage';
import LogisticsPage from './pages/LogisticsPage';
import { 
  fetchKpis, fetchSalesTrend, fetchPaymentDistribution, fetchCategoryRevenue, fetchDeliveryPerformance,
  fetchFilterOptions, fetchRfmCustomers, fetchSellerPerformance, fetchDayOfWeek, fetchLeadConversion,
  fetchGeoDistribution, fetchCohorts
} from './services/api';

function App() {
  const [filterOptions, setFilterOptions] = useState({ states: [], months: [] });
  const [filters, setFilters] = useState({ state: null, year_month: null });
  
  const [dashboardData, setDashboardData] = useState({
    kpis: null, salesTrend: null, payments: null, categories: null, delivery: null,
    rfm: null, sellers: null, dayOfWeek: null, leads: null, geo: null, cohorts: null
  });
  
  const [loading, setLoading] = useState(true);
  
  // Theme Management
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  useEffect(() => {
    fetchFilterOptions().then(setFilterOptions).catch(console.error);
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [
          kpis, salesTrend, payments, categories, delivery,
          rfm, sellers, dayOfWeek, leads, geo, cohorts
        ] = await Promise.all([
          fetchKpis(filters),
          fetchSalesTrend(filters),
          fetchPaymentDistribution(filters),
          fetchCategoryRevenue(filters),
          fetchDeliveryPerformance(filters),
          fetchRfmCustomers(filters),
          fetchSellerPerformance(filters),
          fetchDayOfWeek(filters),
          fetchLeadConversion(),
          fetchGeoDistribution(filters),
          fetchCohorts(filters)
        ]);
        
        setDashboardData({
          kpis, salesTrend, payments, categories, delivery,
          rfm, sellers, dayOfWeek, leads, geo, cohorts
        });
      } catch (error) {
        console.error("Error loading dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [filters]);

  return (
    <Routes>
      <Route element={<DashboardLayout options={filterOptions} filters={filters} setFilters={setFilters} theme={theme} toggleTheme={toggleTheme} />}>
        <Route path="/" element={<OverviewPage data={dashboardData} loading={loading} theme={theme} />} />
        <Route path="/overview" element={<Navigate to="/" replace />} />
        <Route path="/customers" element={<CustomersPage data={dashboardData} loading={loading} theme={theme} />} />
        <Route path="/sellers" element={<SellersPage data={dashboardData} loading={loading} theme={theme} />} />
        <Route path="/logistics" element={<LogisticsPage data={dashboardData} loading={loading} theme={theme} />} />
      </Route>
    </Routes>
  );
}

export default App;

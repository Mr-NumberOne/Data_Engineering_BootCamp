import axios from 'axios';

const API_URL = 'http://localhost:8000/api';

const buildParams = (filters) => {
    const params = new URLSearchParams();
    if (filters?.state) params.append('state', filters.state);
    if (filters?.year_month) params.append('year_month', filters.year_month);
    return params.toString();
};

export const fetchFilterOptions = async () => {
    const response = await axios.get(`${API_URL}/filters/options`);
    return response.data;
};

export const fetchKpis = async (filters) => {
    const response = await axios.get(`${API_URL}/kpis?${buildParams(filters)}`);
    return response.data;
};

export const fetchSalesTrend = async (filters) => {
    const response = await axios.get(`${API_URL}/sales-trend?${buildParams(filters)}`);
    return response.data;
};

export const fetchCategoryRevenue = async (filters) => {
    const response = await axios.get(`${API_URL}/category-revenue?${buildParams(filters)}`);
    return response.data;
};

export const fetchPaymentDistribution = async (filters) => {
    const response = await axios.get(`${API_URL}/payment-distribution?${buildParams(filters)}`);
    return response.data;
};

export const fetchDeliveryPerformance = async (filters) => {
    const response = await axios.get(`${API_URL}/delivery-performance?${buildParams(filters)}`);
    return response.data;
};

// New endpoints
export const fetchRfmCustomers = async (filters) => {
    const response = await axios.get(`${API_URL}/customers/rfm?${buildParams(filters)}`);
    return response.data;
};

export const fetchSellerPerformance = async (filters) => {
    const response = await axios.get(`${API_URL}/sellers/performance?${buildParams(filters)}`);
    return response.data;
};

export const fetchDayOfWeek = async (filters) => {
    const response = await axios.get(`${API_URL}/sales/day-of-week?${buildParams(filters)}`);
    return response.data;
};

export const fetchLeadConversion = async () => {
    const response = await axios.get(`${API_URL}/leads/conversion`);
    return response.data;
};

export const fetchGeoDistribution = async (filters) => {
    const response = await axios.get(`${API_URL}/sales/geo-distribution?${buildParams(filters)}`);
    return response.data;
};

export const fetchCohorts = async (filters) => {
    const response = await axios.get(`${API_URL}/customers/cohorts?${buildParams(filters)}`);
    return response.data;
};

import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppProvider } from './context/AppContext.jsx';
import { JobWorkspaceProvider } from './context/JobWorkspaceContext.jsx';
import Layout from './components/Layout.jsx';
import HomePage from './pages/HomePage.jsx';
import JobDetailPage from './pages/JobDetailPage.jsx';
import AnalyticsPage from './pages/AnalyticsPage.jsx';
import HealthPage from './pages/HealthPage.jsx';
import SavedPage from './pages/SavedPage.jsx';
import TrackerPage from './pages/TrackerPage.jsx';

export default function App() {
  return (
    <AppProvider>
      <JobWorkspaceProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<Layout />}>
              <Route index element={<HomePage />} />
              <Route path="jobs/:id" element={<JobDetailPage />} />
              <Route path="saved" element={<SavedPage />} />
              <Route path="tracker" element={<TrackerPage />} />
              <Route path="analytics" element={<AnalyticsPage />} />
              <Route path="health" element={<HealthPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </JobWorkspaceProvider>
    </AppProvider>
  );
}

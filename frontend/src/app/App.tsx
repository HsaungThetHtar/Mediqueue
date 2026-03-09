import React, { Suspense } from 'react';
import { RouterProvider } from 'react-router';
import { router } from './routes';
import { PatientRealtimeToasts } from './components/PatientRealtimeToasts';
import { RealtimeProvider } from './context/RealtimeContext';

function PageLoading() {
  return (
    <div style={{ minHeight: "100vh", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{
        width: 40, height: 40,
        border: "4px solid #e5e7eb",
        borderTop: "4px solid #6366f1",
        borderRadius: "50%",
        animation: "spin 0.8s linear infinite"
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export default function App() {
  return (
    <RealtimeProvider>
      <Suspense fallback={<PageLoading />}>
        <RouterProvider router={router} />
      </Suspense>
      <PatientRealtimeToasts />
    </RealtimeProvider>
  );
}
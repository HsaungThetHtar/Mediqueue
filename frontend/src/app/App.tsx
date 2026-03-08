import React from 'react';
import { RouterProvider } from 'react-router';
import { router } from './routes';
import { PatientRealtimeToasts } from './components/PatientRealtimeToasts';
import { RealtimeProvider } from './context/RealtimeContext';

export default function App() {
  return (
    <RealtimeProvider>
      <RouterProvider router={router} />
      <PatientRealtimeToasts />
    </RealtimeProvider>
  );
}
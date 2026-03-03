import { useEffect, useState } from 'react';
import { doctorApi } from '../../services/api';

export function DoctorProfile() {
  const [doctor, setDoctor] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchProfile() {
      setLoading(true);
      try {
        // Replace 'me' with actual doctor id if needed
        const response = await doctorApi.getDoctorById('me');
        setDoctor(response);
      } catch (err: any) {
        setError(err.message || 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div style={{ color: 'red' }}>{error}</div>;
  if (!doctor) return <div>No profile found.</div>;

  return (
    <div>
      <h2>Doctor Profile</h2>
      <div>Name: {doctor.name}</div>
      <div>Email: {doctor.email}</div>
      <div>Specialization: {doctor.specialization}</div>
      <div>Department: {doctor.department?.name || doctor.department}</div>
      <div>Qualifications: {doctor.qualifications?.join(', ')}</div>
      <div>Available: {doctor.isAvailable ? 'Yes' : 'No'}</div>
    </div>
  );
}

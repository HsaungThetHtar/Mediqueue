import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Clock, CheckCircle, User, FileText, Phone, LogOut, Calendar, RotateCcw } from 'lucide-react';
import { clearSession, getSession } from '../../api/auth';
import { getDoctorsByUserId, getMyQueues, updatePatientStatus, saveBookingNotes } from '../../api/doctors';
import { getDepartmentName } from '../../utils/department';
import { useRealtimeEvent } from '../context/RealtimeContext';

interface Patient {
  id: string;
  queueNumber: string;
  name: string;
  age: number;
  gender: string;
  symptoms: string;
  checkInTime: string;
  status: 'waiting' | 'checked-in-ready' | 'in-consultation' | 'completed';
  doctorNotes?: string;
}

interface DoctorProfile {
  _id: string;
  name: string;
  department: string;
}

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function formatDisplayDate(iso: string) {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

function ageFromDateOfBirth(dateOfBirth: string | undefined | null): number | null {
  if (!dateOfBirth || typeof dateOfBirth !== 'string') return null;
  const d = new Date(dateOfBirth);
  if (Number.isNaN(d.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - d.getFullYear();
  const m = today.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age--;
  return age;
}

const genderLabels: Record<string, string> = { male: 'ชาย', female: 'หญิง', other: 'อื่นๆ' };
function genderDisplay(g: string | undefined): string {
  if (!g) return '—';
  return genderLabels[g] || g;
}

export function DoctorInterface() {
  const navigate = useNavigate();
  const [doctorProfile, setDoctorProfile] = useState<DoctorProfile | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctorId, setDoctorId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const load = async () => {
      const user = getSession();
      if (!user || (user.role !== 'doctor' && user.role !== 'admin')) {
        setLoading(false);
        navigate('/signin', { replace: true });
        return;
      }
      setLoading(true);
      try {
        const doctors = await getDoctorsByUserId(user.id);
        const doc = doctors[0];
        if (!doc) {
          setDoctorProfile(null);
          setDoctorId(null);
          setPatients([]);
          return;
        }
        setDoctorProfile({ _id: doc._id, name: doc.name, department: getDepartmentName(doc.department) });
        setDoctorId(doc._id);

        const today = todayISO();
        const data = await getMyQueues(today, doc._id);
        const patientIdObj = (q: any) => (q.patientId && typeof q.patientId === 'object' ? q.patientId : null);
        setPatients(
          data.map((q) => {
            const p = patientIdObj(q);
            const name = q.patientName || p?.fullName || 'Unknown';
            const age = ageFromDateOfBirth(p?.dateOfBirth) ?? 0;
            return {
              id: q._id,
              queueNumber: q.queueNumber,
              name,
              age,
              gender: p?.gender ?? '',
              symptoms: '', // Booking ไม่มี symptoms
              checkInTime: new Date(q.createdAt).toLocaleTimeString(),
              status:
                q.status === 'in-progress'
                  ? 'in-consultation'
                  : q.status === 'checked-in' || q.status === 'confirmed' || q.status === 'called'
                  ? 'checked-in-ready'   // checked-in / called = ready to be called by doctor
                  : q.status === 'waiting'
                  ? 'waiting'            // waiting = booked but not yet at hospital
                  : q.status === 'completed'
                  ? 'completed'
                  : 'waiting',
              doctorNotes: (q as { doctorNotes?: string }).doctorNotes ?? '',
            };
          })
        );
      } catch (err) {
        console.error('load doctor queues', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  useRealtimeEvent('queue-update', () => { if (doctorId) refreshPatients(); });
  useRealtimeEvent('booking-update', () => { if (doctorId) refreshPatients(); });

  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [showNotes, setShowNotes] = useState(false);
  const [medicalNotes, setMedicalNotes] = useState('');
  const [completing, setCompleting] = useState(false);

  const currentPatient = patients.find(p => p.status === 'in-consultation');
  // FIX #11: Separate checked-in (ready to be called) from waiting (not yet at hospital)
  // Doctor should only "Call" patients who have checked in — others just show in queue
  const checkedInPatients = patients.filter(p => p.status === 'checked-in-ready');
  const waitingPatients = patients.filter(p => p.status === 'waiting');
  const completedPatients = patients.filter(p => p.status === 'completed');

  const refreshPatients = async () => {
    if (!doctorId) return;
    const data = await getMyQueues(todayISO(), doctorId || undefined);
    const patientIdObj = (q: any) => (q.patientId && typeof q.patientId === 'object' ? q.patientId : null);
    setPatients(
      data.map((q) => {
        const p = patientIdObj(q);
        const name = q.patientName || p?.fullName || 'Unknown';
        const age = ageFromDateOfBirth(p?.dateOfBirth) ?? 0;
        return {
          id: q._id,
          queueNumber: q.queueNumber,
          name,
          age,
          gender: p?.gender ?? '',
          symptoms: '',
          checkInTime: new Date(q.createdAt).toLocaleTimeString(),
          status:
            q.status === 'in-progress'
              ? 'in-consultation'
              : q.status === 'checked-in' || q.status === 'confirmed'
              ? 'checked-in-ready'
              : q.status === 'waiting'
              ? 'waiting'
              : q.status === 'completed'
              ? 'completed'
              : 'waiting',
          doctorNotes: (q as { doctorNotes?: string }).doctorNotes ?? '',
        };
      })
    );
  };

  const handleStartConsultation = async (patient: Patient) => {
    if (!doctorId) return;
    try {
      await updatePatientStatus(doctorId, patient.id, 'in-progress');
      await refreshPatients();
      setSelectedPatient(patient);
    } catch (err: any) {
      console.error(err);
      alert(err?.message || 'เรียกคิวไม่สำเร็จ');
    }
  };

  const handleCompleteConsultation = async () => {
    const patientToComplete = selectedPatient || currentPatient;
    if (!patientToComplete || !doctorId) return;
    setCompleting(true);
    try {
      await updatePatientStatus(doctorId, patientToComplete.id, 'completed');
      await refreshPatients();
      setMedicalNotes('');
      setShowNotes(false);
      setSelectedPatient(null);
    } catch (err: any) {
      console.error(err);
      alert(err?.message || 'บันทึกสถานะไม่สำเร็จ');
    } finally {
      setCompleting(false);
    }
  };


  const handleSaveMedicalNotes = async () => {
    const patient = currentPatient || selectedPatient;
    if (!doctorId || !patient) return;
    try {
      await saveBookingNotes(doctorId, patient.id, medicalNotes);
      await refreshPatients();
      setShowNotes(false);
    } catch (err: any) {
      console.error(err);
      alert(err?.message || 'บันทึกหมายเหตุไม่สำเร็จ');
    }
  };

  const displayDate = formatDisplayDate(todayISO());
  const queueCount = waitingPatients.length + checkedInPatients.length + (currentPatient ? 1 : 0);
  const nextPatient = currentPatient || checkedInPatients[0] || waitingPatients[0];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600 font-medium">Loading...</p>
      </div>
    );
  }

  if (!doctorProfile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 max-w-md text-center">
          <p className="text-gray-700 font-medium mb-4">No doctor profile linked to your account.</p>
          <button
            onClick={() => { clearSession(); navigate('/signin'); }}
            className="text-red-600 hover:text-red-700 font-medium flex items-center gap-2 justify-center mx-auto"
          >
            <LogOut className="w-5 h-5" /> Logout
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header: Doctor Dashboard + date + Logout */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Doctor Dashboard</h1>
              <p className="text-gray-600 mt-0.5">{doctorProfile.name}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-4 py-2 text-gray-700 font-medium">
                <Calendar className="w-4 h-4 text-gray-500" />
                {displayDate}
              </span>
              <button
                onClick={async () => {
                  if (refreshing) return;
                  setRefreshing(true);
                  await refreshPatients();
                  setRefreshing(false);
                }}
                disabled={refreshing}
                title="Refresh queue"
                className="flex items-center gap-2 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg font-medium transition-colors disabled:opacity-60"
              >
                <RotateCcw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                <span className="hidden md:inline">{refreshing ? 'Refreshing...' : 'Refresh'}</span>
              </button>
              <button
                onClick={() => { clearSession(); navigate('/signin'); }}
                className="flex items-center gap-2 text-red-600 hover:text-red-700 px-4 py-2 rounded-lg hover:bg-red-50 transition-colors font-medium border border-red-200"
              >
                <LogOut className="w-4 h-4" /> Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Three summary cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <p className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">Doctor Name</p>
            <p className="text-lg font-bold text-gray-900">{doctorProfile.name}</p>
            <p className="text-sm text-gray-600 mt-1">{doctorProfile.department}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <p className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">Patients in Queue</p>
            <p className="text-3xl font-bold text-blue-600">{queueCount}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <p className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">Next Patient</p>
            <p className="text-lg font-bold text-gray-900">{nextPatient ? `${nextPatient.queueNumber} – ${nextPatient.name}` : 'No patients'}</p>
          </div>
        </div>

        {/* Bottom message card */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-8">
          <p className="text-gray-700 font-medium">
            {queueCount === 0
              ? `No patients in queue for ${displayDate}`
              : `${queueCount} patient${queueCount !== 1 ? 's' : ''} in queue for ${displayDate}`}
          </p>
        </div>

        {/* Current Patient Card */}
        {currentPatient ? (
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-6 border-2 border-purple-200 mb-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-purple-200 rounded-full">
                  <Phone className="w-6 h-6 text-purple-700" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-medium">Currently Consulting</p>
                  <p className="text-2xl font-bold text-gray-900">Queue #{currentPatient.queueNumber}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setMedicalNotes(currentPatient?.doctorNotes ?? '');
                    setShowNotes(!showNotes);
                  }}
                  className="flex items-center gap-2 border-2 border-gray-300 hover:border-gray-400 bg-white text-gray-700 font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  <FileText className="w-4 h-4" />
                  {showNotes ? 'Hide Notes' : 'Add Notes'}
                </button>
                <button
                  type="button"
                  onClick={handleCompleteConsultation}
                  disabled={completing}
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <CheckCircle className="w-4 h-4" />
                  {completing ? 'Saving...' : 'Complete Consultation'}
                </button>
                <button
                  onClick={() => setSelectedPatient(currentPatient)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  View Details
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg p-4">
                <p className="text-sm text-gray-600 font-medium">Patient Name</p>
                <p className="text-lg font-semibold text-gray-900 mt-1">{currentPatient.name}</p>
              </div>
              <div className="bg-white rounded-lg p-4">
                <p className="text-sm text-gray-600 font-medium">Age / Gender</p>
                <p className="text-lg font-semibold text-gray-900 mt-1">
                  {currentPatient.age > 0 ? currentPatient.age : '—'} / {genderDisplay(currentPatient.gender)}
                </p>
              </div>
              <div className="bg-white rounded-lg p-4">
                <p className="text-sm text-gray-600 font-medium">Check-in Time</p>
                <p className="text-lg font-semibold text-gray-900 mt-1">{currentPatient.checkInTime}</p>
              </div>
              <div className="bg-white rounded-lg p-4">
                <p className="text-sm text-gray-600 font-medium">Symptoms</p>
                <p className="text-lg font-semibold text-gray-900 mt-1">{currentPatient.symptoms}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-blue-50 rounded-lg p-8 border-2 border-dashed border-blue-200 mb-8 text-center">
            <Clock className="w-12 h-12 text-blue-400 mx-auto mb-4" />
            <p className="text-gray-600 font-medium">No patient in consultation</p>
            {checkedInPatients.length > 0 && (
              <p className="text-sm text-gray-500 mt-1">
                {checkedInPatients.length} patient{checkedInPatients.length !== 1 ? 's' : ''} checked in and ready
              </p>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Queue Lists */}
          <div className="lg:col-span-2 space-y-6">

            {/* FIX #11: Checked-In patients (ready to be called) — shown first, with Call button */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 bg-green-50">
                <h2 className="text-xl font-bold text-gray-900">
                  ✅ Checked-In — Ready to Call ({checkedInPatients.length})
                </h2>
                <p className="text-sm text-green-700 mt-1">These patients are at the hospital and ready</p>
              </div>

              <div className="divide-y divide-gray-100">
                {checkedInPatients.map((patient, index) => (
                  <div key={patient.id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-full flex-shrink-0">
                          <span className="text-lg font-bold text-green-600">{index + 1}</span>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">Queue #{patient.queueNumber}</h3>
                            <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-medium">
                              Checked In
                            </span>
                          </div>
                          <div className="text-gray-600 font-medium mb-2">{patient.name}</div>
                          <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                            <div><span className="font-medium">Age:</span> {patient.age > 0 ? `${patient.age} years` : '—'}</div>
                            <div><span className="font-medium">Gender:</span> {genderDisplay(patient.gender)}</div>
                          </div>
                        </div>
                      </div>
                      {/* Only allow Call if no one is currently in consultation */}
                      {!currentPatient && (
                        <button
                          onClick={() => handleStartConsultation(patient)}
                          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors ml-4"
                        >
                          Call
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                {checkedInPatients.length === 0 && (
                  <div className="p-6 text-center text-gray-400 text-sm">
                    No checked-in patients yet
                  </div>
                )}
              </div>
            </div>

            {/* Waiting patients (booked but not yet at hospital) — view only */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100">
                <h2 className="text-xl font-bold text-gray-900">
                  Upcoming Queue ({waitingPatients.length})
                </h2>
                <p className="text-sm text-gray-500 mt-1">Booked but not yet checked in at hospital</p>
              </div>

              <div className="divide-y divide-gray-100">
                {waitingPatients.map((patient, index) => (
                  <div
                    key={patient.id}
                    className="p-6 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full flex-shrink-0">
                          <span className="text-lg font-bold text-blue-600">{index + 1}</span>
                        </div>

                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">
                              Queue #{patient.queueNumber}
                            </h3>
                            <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-medium">
                              Waiting
                            </span>
                          </div>

                          <div className="text-gray-600 font-medium mb-2">{patient.name}</div>

                          <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                            <div>
                              <span className="font-medium">Age:</span> {patient.age > 0 ? `${patient.age} years` : '—'}
                            </div>
                            <div>
                              <span className="font-medium">Gender:</span> {genderDisplay(patient.gender)}
                            </div>
                          </div>
                        </div>
                      </div>
                      {/* FIX #11: NO Call button for waiting patients — must check in first */}
                    </div>
                  </div>
                ))}

                {waitingPatients.length === 0 && (
                  <div className="p-6 text-center text-gray-400 text-sm">
                    No upcoming patients
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Completed List & Actions */}
          <div className="space-y-6">
            {/* Completed Count */}
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Completed Today</p>
                  <p className="text-3xl font-bold text-green-600 mt-2">{completedPatients.length}</p>
                </div>
                <CheckCircle className="w-12 h-12 bg-green-50 text-green-600 p-2 rounded-lg" />
              </div>
            </div>

          </div>
        </div>

        {/* Completed Patients */}
        {completedPatients.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 mt-8">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">
                Completed Consultations
              </h2>
            </div>

            <div className="divide-y divide-gray-100">
              {completedPatients.map(patient => (
                <div key={patient.id} className="p-6 flex items-center justify-between opacity-75">
                  <div className="flex items-center gap-4">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-gray-900">Queue #{patient.queueNumber}</p>
                      <p className="text-sm text-gray-600">{patient.name}</p>
                    </div>
                  </div>
                  <span className="text-sm text-gray-500">{patient.checkInTime}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Medical Notes Modal */}
      {showNotes && currentPatient && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Medical Notes</h2>

            <div className="bg-blue-50 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-600 mb-1">Patient: {currentPatient.name}</p>
              <p className="text-sm text-gray-600">Queue: {currentPatient.queueNumber}</p>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Consultation Notes
              </label>
              <textarea
                value={medicalNotes}
                onChange={(e) => setMedicalNotes(e.target.value)}
                placeholder="Enter your medical notes here..."
                className="w-full h-48 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowNotes(false)}
                className="flex-1 border-2 border-gray-300 hover:border-gray-400 text-gray-700 font-medium py-2 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveMedicalNotes}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg transition-colors"
              >
                Save Notes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Patient Details Modal */}
      {selectedPatient && selectedPatient.status === 'in-consultation' && !showNotes && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Patient Details</h2>

            <div className="space-y-4 mb-6">
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 font-medium">Queue Number</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">{selectedPatient.queueNumber}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 font-medium">Name</p>
                  <p className="text-lg font-semibold text-gray-900 mt-1">{selectedPatient.name}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 font-medium">Age</p>
                  <p className="text-lg font-semibold text-gray-900 mt-1">{selectedPatient.age > 0 ? selectedPatient.age : '—'}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 font-medium">Gender</p>
                  <p className="text-lg font-semibold text-gray-900 mt-1">{genderDisplay(selectedPatient.gender)}</p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 font-medium">Symptoms</p>
                <p className="text-gray-900 mt-1">{selectedPatient.symptoms || '—'}</p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 font-medium">Check-in Time</p>
                <p className="text-lg font-semibold text-gray-900 mt-1">{selectedPatient.checkInTime}</p>
              </div>
            </div>

            <button
              onClick={() => setSelectedPatient(null)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
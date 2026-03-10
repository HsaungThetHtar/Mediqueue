import React, { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  User,
  Building2,
  Layers,
  Bell,
  LogOut,
  Save,
  Shield,
  Clock,
  Stethoscope,
  Plus,
  Pencil,
  Trash2,
  X,
  AlertTriangle,
  FlaskConical,
} from 'lucide-react';
import { useOutletContext, useNavigate } from 'react-router';
import {
  getDepartmentsFull,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  type DepartmentItem,
} from '../../../../api/departments';
import { getDoctors, createDoctor, updateDoctor, deleteDoctor } from '../../../../api/doctors';
import { getDepartmentName } from '../../../../utils/department';
import { clearSession } from '../../../../api/auth';
import { getSystemConfig, updateSystemConfig } from '../../../../api/settings';
import { getProfile, updateProfile } from '../../../../api/user';

interface SettingsProps {
  userEmail: string;
  userName: string;
}

type SectionId = 'account' | 'system' | 'departments' | 'doctors' | 'notifications' | 'security';

const sections: { id: SectionId; label: string; icon: React.ElementType }[] = [
  { id: 'account', label: 'บัญชีผู้ใช้', icon: User },
  { id: 'system', label: 'ตั้งค่าระบบ', icon: Building2 },
  { id: 'departments', label: 'แผนก', icon: Layers },
  { id: 'doctors', label: 'หมอ', icon: Stethoscope },
  { id: 'notifications', label: 'การแจ้งเตือน', icon: Bell },
  { id: 'security', label: 'ความปลอดภัย & ออกจากระบบ', icon: Shield },
];

export function Settings() {
  const { userEmail, userName } = useOutletContext<SettingsProps>();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState<SectionId>('account');
  const [departments, setDepartments] = useState<DepartmentItem[]>([]);
  const [loadingDepts, setLoadingDepts] = useState(false);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loadingDoctors, setLoadingDoctors] = useState(false);

  // Department modal: add / edit
  const [deptModal, setDeptModal] = useState<{ open: boolean; mode: 'add' | 'edit'; item?: DepartmentItem }>({ open: false, mode: 'add' });
  const [deptForm, setDeptForm] = useState({ name: '', displayOrder: 0 });
  const [deptSaving, setDeptSaving] = useState(false);
  const [deptDeleting, setDeptDeleting] = useState<string | null>(null);

  // Doctor modal: add / edit
  const [doctorModal, setDoctorModal] = useState<{ open: boolean; mode: 'add' | 'edit'; item?: any }>({ open: false, mode: 'add' });
  const [doctorForm, setDoctorForm] = useState({ name: '', departmentId: '', workingHours: '08:00 - 17:00', email: '', password: '', unlinkUser: false });
  const [doctorSaving, setDoctorSaving] = useState(false);
  const [doctorDeleting, setDoctorDeleting] = useState<string | null>(null);

  // Form state - System
  const [hospitalName, setHospitalName] = useState('Central City Hospital');
  const [queuePerSession, setQueuePerSession] = useState(15);
  const [queuePerDay, setQueuePerDay] = useState(30);
  const [businessHours, setBusinessHours] = useState('08:00 - 17:00');
  const [saving, setSaving] = useState(false);
  const [demoMode, setDemoMode] = useState(false);
  const [prevQueuePerSession, setPrevQueuePerSession] = useState(15);
  const [prevQueuePerDay, setPrevQueuePerDay] = useState(30);
  const [demoLoading, setDemoLoading] = useState(false);

  // Form state - Account
  const [displayName, setDisplayName] = useState(userName);
  const [notifyNewBooking, setNotifyNewBooking] = useState(true);
  const [notifyUrgentCall, setNotifyUrgentCall] = useState(true);
  const [notifySms, setNotifySms] = useState(true);

  useEffect(() => {
    setDisplayName(userName);
  }, [userName]);

  useEffect(() => {
    getSystemConfig()
      .then((c) => {
        setHospitalName(c.hospitalName ?? 'Central City Hospital');
        setQueuePerSession(c.queuePerSession ?? 15);
        setQueuePerDay(c.queuePerDay ?? 30);
        setBusinessHours(c.businessHours ?? '08:00 - 17:00');
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (activeSection === 'account' || activeSection === 'notifications') {
      getProfile()
        .then((p) => {
          setDisplayName(p.fullName ?? userName);
          setNotifyNewBooking(p.notifyNewBooking ?? true);
          setNotifyUrgentCall(p.notifyUrgentCall ?? true);
          setNotifySms(p.notifySms ?? true);
        })
        .catch(() => {});
    }
  }, [activeSection, userName]);

  useEffect(() => {
    setLoadingDepts(true);
    getDepartmentsFull()
      .then((list) => setDepartments(Array.isArray(list) ? list : []))
      .catch(() => setDepartments([]))
      .finally(() => setLoadingDepts(false));
  }, []);

  useEffect(() => {
    if (activeSection === 'doctors') {
      setLoadingDoctors(true);
      getDoctors()
        .then((list) => setDoctors(Array.isArray(list) ? list : []))
        .catch(() => setDoctors([]))
        .finally(() => setLoadingDoctors(false));
      if (departments.length === 0) loadDepartments();
    }
  }, [activeSection]);

  const handleSaveSystem = async () => {
    setSaving(true);
    try {
      await updateSystemConfig({
        hospitalName,
        queuePerSession,
        queuePerDay,
        businessHours,
      });
      alert('บันทึกตั้งค่าระบบแล้ว');
    } catch (e: any) {
      alert(e?.message || 'บันทึกไม่สำเร็จ');
    } finally {
      setSaving(false);
    }
  };

  const handleDemoFull = async () => {
    setDemoLoading(true);
    setPrevQueuePerSession(queuePerSession);
    setPrevQueuePerDay(queuePerDay);
    try {
      await updateSystemConfig({ hospitalName, queuePerSession: 0, queuePerDay: 0, businessHours });
      setQueuePerSession(0);
      setQueuePerDay(0);
      setDemoMode(true);
    } catch (e: any) {
      alert(e?.message || 'Failed to activate demo mode');
    } finally {
      setDemoLoading(false);
    }
  };

  const handleResetDemo = async () => {
    setDemoLoading(true);
    try {
      await updateSystemConfig({ hospitalName, queuePerSession: prevQueuePerSession, queuePerDay: prevQueuePerDay, businessHours });
      setQueuePerSession(prevQueuePerSession);
      setQueuePerDay(prevQueuePerDay);
      setDemoMode(false);
    } catch (e: any) {
      alert(e?.message || 'Failed to reset demo mode');
    } finally {
      setDemoLoading(false);
    }
  };

  const handleSaveAccount = async () => {
    setSaving(true);
    try {
      const updated = await updateProfile({ fullName: displayName });
      const raw = localStorage.getItem('user');
      if (raw) {
        try {
          const user = JSON.parse(raw);
          user.fullName = updated.fullName;
          localStorage.setItem('user', JSON.stringify(user));
        } catch (_) {}
      }
      alert('บันทึกบัญชีแล้ว');
    } catch (e: any) {
      alert(e?.message || 'บันทึกไม่สำเร็จ');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveNotifications = async () => {
    setSaving(true);
    try {
      await updateProfile({
        notifyNewBooking,
        notifyUrgentCall,
        notifySms,
      });
      alert('บันทึกการแจ้งเตือนแล้ว');
    } catch (e: any) {
      alert(e?.message || 'บันทึกไม่สำเร็จ');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    clearSession();
    navigate('/signin');
  };

  const loadDepartments = () => {
    setLoadingDepts(true);
    getDepartmentsFull()
      .then((list) => setDepartments(Array.isArray(list) ? list : []))
      .catch(() => setDepartments([]))
      .finally(() => setLoadingDepts(false));
  };

  const openDeptAdd = () => {
    setDeptForm({ name: '', displayOrder: departments.length });
    setDeptModal({ open: true, mode: 'add' });
  };
  const openDeptEdit = (item: DepartmentItem) => {
    setDeptForm({ name: (item as any).name ?? '', displayOrder: typeof (item as any).displayOrder === 'number' ? (item as any).displayOrder : 0 });
    setDeptModal({ open: true, mode: 'edit', item });
  };
  const closeDeptModal = () => setDeptModal({ open: false, mode: 'add' });
  const handleSaveDept = async () => {
    if (!deptForm.name.trim()) return;
    setDeptSaving(true);
    try {
      if (deptModal.mode === 'add') {
        await createDepartment({ name: deptForm.name.trim(), displayOrder: deptForm.displayOrder });
      } else if (deptModal.item) {
        await updateDepartment((deptModal.item as any)._id, { name: deptForm.name.trim(), displayOrder: deptForm.displayOrder });
      }
      closeDeptModal();
      loadDepartments();
    } catch (e: any) {
      alert(e?.message || 'เกิดข้อผิดพลาด');
    } finally {
      setDeptSaving(false);
    }
  };
  const handleDeleteDept = async (id: string) => {
    if (!confirm('ต้องการลบแผนกนี้ใช่หรือไม่? ถ้ามีหมออยู่ในแผนกจะลบไม่ได้')) return;
    setDeptDeleting(id);
    try {
      await deleteDepartment(id);
      loadDepartments();
    } catch (e: any) {
      alert(e?.message || 'ลบไม่ได้');
    } finally {
      setDeptDeleting(null);
    }
  };

  const loadDoctors = () => {
    setLoadingDoctors(true);
    getDoctors()
      .then((list) => setDoctors(Array.isArray(list) ? list : []))
      .catch(() => setDoctors([]))
      .finally(() => setLoadingDoctors(false));
  };
  const getDeptId = (d: DepartmentItem | any) => (d as any)?._id ?? (d as any)?.id ?? '';
  const getDeptName = (d: DepartmentItem | any) => (d as any)?.name ?? '';

  const openDoctorAdd = async () => {
    let deptList = departments;
    if (departments.length === 0) {
      const list = await getDepartmentsFull().catch(() => []);
      deptList = Array.isArray(list) ? list : [];
      setDepartments(deptList);
    }
    const firstId = deptList[0] ? String(getDeptId(deptList[0])) : '';
    setDoctorForm({ name: '', departmentId: firstId, workingHours: '08:00 - 17:00', email: '', password: '', unlinkUser: false });
    setDoctorModal({ open: true, mode: 'add' });
  };

  const openDoctorEdit = async (item: any) => {
    let deptList = departments;
    if (departments.length === 0) {
      const list = await getDepartmentsFull().catch(() => []);
      deptList = Array.isArray(list) ? list : [];
      setDepartments(deptList);
    }
    const rawDeptId = typeof item.department === 'object' && item.department != null
      ? (item.department._id ?? item.department.id)
      : (item.department ?? '');
    const deptId = rawDeptId != null ? String(rawDeptId) : '';
    const firstId = deptList[0] ? String(getDeptId(deptList[0])) : '';
    const linkedEmail = item.userId?.email ?? '';
    setDoctorForm({
      name: item.name ?? '',
      departmentId: deptId || firstId,
      workingHours: item.workingHours ?? '08:00 - 17:00',
      email: linkedEmail,
      password: '',
      unlinkUser: false,
    });
    setDoctorModal({ open: true, mode: 'edit', item });
  };
  const closeDoctorModal = () => setDoctorModal({ open: false, mode: 'add' });
  const handleSaveDoctor = async () => {
    if (!doctorForm.name.trim()) return;
    if (!doctorForm.departmentId) {
      alert('กรุณาเลือกแผนก');
      return;
    }
    setDoctorSaving(true);
    try {
      if (doctorModal.mode === 'add') {
        await createDoctor({
          name: doctorForm.name.trim(),
          departmentId: doctorForm.departmentId,
          workingHours: doctorForm.workingHours,
          ...(doctorForm.email?.trim() && doctorForm.password ? { email: doctorForm.email.trim(), password: doctorForm.password } : {}),
        });
      } else if (doctorModal.item) {
        const payload: Record<string, unknown> = {
          name: doctorForm.name.trim(),
          departmentId: doctorForm.departmentId,
          workingHours: doctorForm.workingHours,
        };
        if (doctorForm.unlinkUser) payload.unlinkUser = true;
        else if (doctorForm.email?.trim() && doctorForm.password) {
          payload.email = doctorForm.email.trim();
          payload.password = doctorForm.password;
        }
        await updateDoctor(doctorModal.item._id, payload);
      }
      closeDoctorModal();
      loadDoctors();
    } catch (e: any) {
      alert(e?.message || 'เกิดข้อผิดพลาด');
    } finally {
      setDoctorSaving(false);
    }
  };
  const handleDeleteDoctor = async (id: string) => {
    if (!confirm('ต้องการลบหมอคนนี้ใช่หรือไม่? ถ้ามีการจองที่ยังไม่ยกเลิกจะลบไม่ได้')) return;
    setDoctorDeleting(id);
    try {
      await deleteDoctor(id);
      loadDoctors();
    } catch (e: any) {
      alert(e?.message || 'ลบไม่ได้');
    } finally {
      setDoctorDeleting(null);
    }
  };

  return (
    <div className="px-4 sm:px-8 py-8 min-h-full">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <SettingsIcon className="w-7 h-7 text-blue-600" />
            ตั้งค่าระบบ (Admin)
          </h1>
          <p className="text-gray-500 text-sm mt-1">จัดการบัญชี ระบบ แผนก และการแจ้งเตือน</p>
        </div>

        {/* Desktop: sidebar nav + content */}
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Mobile: dropdown to pick section */}
          <div className="lg:hidden">
            <select
              value={activeSection}
              onChange={(e) => setActiveSection(e.target.value as SectionId)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-white text-gray-900 font-medium"
            >
              {sections.map(({ id, label }) => (
                <option key={id} value={id}>{label}</option>
              ))}
            </select>
          </div>

          <nav className="hidden lg:block lg:w-56 shrink-0">
            <div className="bg-white rounded-2xl border border-gray-100 p-2 shadow-sm sticky top-4">
              {sections.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setActiveSection(id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-colors ${
                    activeSection === id ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-5 h-5 shrink-0" />
                  <span className="font-medium text-sm">{label}</span>
                </button>
              ))}
            </div>
          </nav>

          <div className="flex-1 space-y-6">
            {/* Account */}
            {activeSection === 'account' && (
              <div className="bg-white rounded-2xl border border-gray-100 p-6 sm:p-8 shadow-sm">
                <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <User className="w-5 h-5 text-blue-600" />
                  บัญชีผู้ใช้
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">ชื่อที่แสดง</label>
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">อีเมล</label>
                    <input
                      type="email"
                      value={userEmail}
                      disabled
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg bg-gray-50 text-gray-500"
                    />
                  </div>
                </div>
                <div className="mt-6">
                  <button
                    type="button"
                    onClick={handleSaveAccount}
                    disabled={saving}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    บันทึก
                  </button>
                </div>
              </div>
            )}

            {/* System */}
            {activeSection === 'system' && (
              <div className="bg-white rounded-2xl border border-gray-100 p-6 sm:p-8 shadow-sm">
                <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-blue-600" />
                  ตั้งค่าระบบ
                </h2>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">ชื่อโรงพยาบาล</label>
                    <input
                      type="text"
                      value={hospitalName}
                      onChange={(e) => setHospitalName(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-2">จำนวนคิวต่อช่วง (เช้า/บ่าย)</label>
                      <input
                        type="number"
                        min={1}
                        max={50}
                        value={queuePerSession}
                        onChange={(e) => setQueuePerSession(Number(e.target.value))}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-2">จำนวนคิวสูงสุดต่อวัน (ต่อหมอ)</label>
                      <input
                        type="number"
                        min={1}
                        max={100}
                        value={queuePerDay}
                        onChange={(e) => setQueuePerDay(Number(e.target.value))}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      เวลาทำการ
                    </label>
                    <input
                      type="text"
                      value={businessHours}
                      onChange={(e) => setBusinessHours(e.target.value)}
                      placeholder="08:00 - 17:00"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleSaveSystem}
                    disabled={saving}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    บันทึกตั้งค่าระบบ
                  </button>

                  {/* Demo Mode */}
                  <div className="border-t border-gray-100 pt-6 mt-2">
                    <p className="text-sm font-semibold text-gray-700 mb-1 flex items-center gap-2">
                      <FlaskConical className="w-4 h-4 text-orange-500" />
                      Demo Mode
                    </p>
                    <p className="text-xs text-gray-500 mb-3">
                      Temporarily set queue limit to 0 to simulate a fully booked system. Use this to demonstrate how the system blocks new bookings when capacity is reached.
                    </p>
                    {demoMode ? (
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-2 text-amber-800">
                          <AlertTriangle className="w-4 h-4" />
                          <span className="text-sm font-medium">Demo Active — All queues are showing as full</span>
                        </div>
                        <button
                          type="button"
                          onClick={handleResetDemo}
                          disabled={demoLoading}
                          className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium rounded-lg disabled:opacity-50"
                        >
                          {demoLoading ? 'Resetting...' : 'Reset to Normal'}
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={handleDemoFull}
                        disabled={demoLoading || saving}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded-lg disabled:opacity-50"
                      >
                        <FlaskConical className="w-4 h-4" />
                        {demoLoading ? 'Activating...' : 'Simulate Full Queue'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Departments */}
            {activeSection === 'departments' && (
              <div className="bg-white rounded-2xl border border-gray-100 p-6 sm:p-8 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                  <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <Layers className="w-5 h-5 text-blue-600" />
                    แผนก
                  </h2>
                  <button
                    type="button"
                    onClick={openDeptAdd}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
                  >
                    <Plus className="w-4 h-4" />
                    เพิ่มแผนก
                  </button>
                </div>
                <p className="text-sm text-gray-500 mb-4">
                  รายการแผนกที่ใช้ในระบบ (เรียงตามลำดับการแสดง)
                </p>
                {loadingDepts ? (
                  <p className="text-gray-500 text-sm">กำลังโหลด...</p>
                ) : (
                  <div className="border border-gray-200 rounded-xl overflow-hidden">
                    <table className="w-full text-left">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">ลำดับ</th>
                          <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">ชื่อแผนก</th>
                          <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase w-28">จัดการ</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {departments.map((d, i) => {
                          const order = typeof (d as any).displayOrder === 'number' ? (d as any).displayOrder : i;
                          const name = typeof d === 'string' ? d : ((d as any).name ?? '');
                          const rowId = (d as any)._id ?? (d as any).id;
                          const id = rowId != null ? String(rowId) : `row-${i}`;
                          const canManage = rowId != null;
                          return (
                            <tr key={id} className="hover:bg-gray-50/50">
                              <td className="px-4 py-3 text-sm text-gray-500">{order + 1}</td>
                              <td className="px-4 py-3 font-medium text-gray-900">{name}</td>
                              <td className="px-4 py-3">
                                {canManage ? (
                                  <div className="flex items-center gap-2">
                                    <button type="button" onClick={() => openDeptEdit(d as DepartmentItem)} className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg" title="แก้ไข">
                                      <Pencil className="w-4 h-4" />
                                    </button>
                                    <button type="button" onClick={() => handleDeleteDept(id)} disabled={deptDeleting === id} className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50" title="ลบ">
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                ) : (
                                  <span className="text-gray-400 text-sm">—</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    {departments.length === 0 && (
                      <p className="px-4 py-6 text-center text-gray-500 text-sm">ยังไม่มีแผนก — กด &quot;เพิ่มแผนก&quot;</p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Doctors */}
            {activeSection === 'doctors' && (
              <div className="bg-white rounded-2xl border border-gray-100 p-6 sm:p-8 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                  <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <Stethoscope className="w-5 h-5 text-blue-600" />
                    จัดการหมอ
                  </h2>
                  <button
                    type="button"
                    onClick={openDoctorAdd}
                    disabled={departments.length === 0}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    title={departments.length === 0 ? 'กรุณาเพิ่มแผนกก่อน' : ''}
                  >
                    <Plus className="w-4 h-4" />
                    เพิ่มหมอ
                  </button>
                </div>
                <p className="text-sm text-gray-500 mb-4">
                  รายการหมอในระบบ
                </p>
                {loadingDoctors ? (
                  <p className="text-gray-500 text-sm">กำลังโหลด...</p>
                ) : (
                  <div className="border border-gray-200 rounded-xl overflow-hidden">
                    <table className="w-full text-left">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">ชื่อ</th>
                          <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">แผนก</th>
                          <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">บัญชีล็อกอิน (users)</th>
                          <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">เวลาทำการ</th>
                          <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">คิววันนี้</th>
                          <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase w-28">จัดการ</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {doctors.map((doc) => (
                          <tr key={doc._id ?? doc.id} className="hover:bg-gray-50/50">
                            <td className="px-4 py-3 font-medium text-gray-900">{doc.name ?? '—'}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">{getDepartmentName(doc.department)}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">{doc.userId?.email ?? '—'}</td>
                            <td className="px-4 py-3 text-sm text-gray-500">{doc.workingHours ?? '—'}</td>
                            <td className="px-4 py-3 text-sm text-gray-500">{doc.currentQueue ?? 0} / {doc.maxQueue ?? 30}</td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <button type="button" onClick={() => openDoctorEdit(doc)} className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg" title="แก้ไข">
                                  <Pencil className="w-4 h-4" />
                                </button>
                                <button type="button" onClick={() => handleDeleteDoctor(doc._id ?? doc.id)} disabled={doctorDeleting === (doc._id ?? doc.id)} className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50" title="ลบ">
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {doctors.length === 0 && (
                      <p className="px-4 py-6 text-center text-gray-500 text-sm">ยังไม่มีหมอ — กด &quot;เพิ่มหมอ&quot; (ต้องมีแผนกก่อน)</p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Notifications */}
            {activeSection === 'notifications' && (
              <div className="bg-white rounded-2xl border border-gray-100 p-6 sm:p-8 shadow-sm">
                <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <Bell className="w-5 h-5 text-blue-600" />
                  การแจ้งเตือน
                </h2>
                <div className="space-y-4">
                  <label className="flex items-center gap-3 p-4 rounded-xl border border-gray-100 hover:bg-gray-50/50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notifyNewBooking}
                      onChange={(e) => setNotifyNewBooking(e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <span className="text-sm text-gray-700">แจ้งเตือนเมื่อมีการจองใหม่</span>
                  </label>
                  <label className="flex items-center gap-3 p-4 rounded-xl border border-gray-100 hover:bg-gray-50/50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notifyUrgentCall}
                      onChange={(e) => setNotifyUrgentCall(e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <span className="text-sm text-gray-700">แจ้งเตือนเมื่อเรียกคิวเร่งด่วน</span>
                  </label>
                  <label className="flex items-center gap-3 p-4 rounded-xl border border-gray-100 hover:bg-gray-50/50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notifySms}
                      onChange={(e) => setNotifySms(e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <span className="text-sm text-gray-700">ส่ง SMS แจ้งผู้ป่วยเมื่อสถานะเปลี่ยน</span>
                  </label>
                </div>
                <div className="mt-6">
                  <button
                    type="button"
                    onClick={handleSaveNotifications}
                    disabled={saving}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    บันทึกการแจ้งเตือน
                  </button>
                </div>
              </div>
            )}

            {/* Security & Logout */}
            {activeSection === 'security' && (
              <div className="bg-white rounded-2xl border border-gray-100 p-6 sm:p-8 shadow-sm">
                <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-blue-600" />
                  ความปลอดภัย & ออกจากระบบ
                </h2>
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">
                    บัญชีแอดมินสามารถจัดการได้ทั้งระบบ — ควรออกจากระบบเมื่อไม่ได้ใช้งาน
                  </p>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-lg font-medium transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    ออกจากระบบ
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal: เพิ่ม/แก้ไข แผนก */}
      {deptModal.open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900">{deptModal.mode === 'add' ? 'เพิ่มแผนก' : 'แก้ไขแผนก'}</h3>
              <button type="button" onClick={closeDeptModal} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อแผนก</label>
                <input
                  type="text"
                  value={deptForm.name}
                  onChange={(e) => setDeptForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="เช่น Internal Medicine"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ลำดับการแสดง (0 = แรก)</label>
                <input
                  type="number"
                  min={0}
                  value={deptForm.displayOrder}
                  onChange={(e) => setDeptForm((f) => ({ ...f, displayOrder: Number(e.target.value) || 0 }))}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button type="button" onClick={closeDeptModal} className="flex-1 py-2.5 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50">
                ยกเลิก
              </button>
              <button type="button" onClick={handleSaveDept} disabled={deptSaving || !deptForm.name.trim()} className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50">
                {deptSaving ? 'กำลังบันทึก...' : 'บันทึก'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: เพิ่ม/แก้ไข หมอ */}
      {doctorModal.open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900">{doctorModal.mode === 'add' ? 'เพิ่มหมอ' : 'แก้ไขหมอ'}</h3>
              <button type="button" onClick={closeDoctorModal} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อหมอ</label>
                <input
                  type="text"
                  value={doctorForm.name}
                  onChange={(e) => setDoctorForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="เช่น Dr. สมชาย ใจดี"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">แผนก</label>
                <select
                  value={doctorForm.departmentId}
                  onChange={(e) => setDoctorForm((f) => ({ ...f, departmentId: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">— เลือกแผนก —</option>
                  {departments.map((d) => {
                    const id = getDeptId(d);
                    const name = getDeptName(d);
                    if (!id) return null;
                    return <option key={id} value={id}>{name || '(ไม่มีชื่อ)'}</option>;
                  })}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">เวลาทำการ</label>
                <input
                  type="text"
                  value={doctorForm.workingHours}
                  onChange={(e) => setDoctorForm((f) => ({ ...f, workingHours: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="08:00 - 17:00"
                />
              </div>
              <div className="border-t border-gray-100 pt-4 mt-4">
                <p className="text-xs font-medium text-gray-500 mb-2">บัญชีล็อกอิน (ตาราง users) — ผูกกับหมอเพื่อให้ล็อกอินเข้า Doctor Dashboard ได้</p>
                {doctorModal.mode === 'edit' && doctorForm.email && (
                  <label className="flex items-center gap-2 mb-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={doctorForm.unlinkUser}
                      onChange={(e) => setDoctorForm((f) => ({ ...f, unlinkUser: e.target.checked }))}
                      className="w-4 h-4 text-red-600 rounded"
                    />
                    <span className="text-sm text-gray-700">ยกเลิกผูกบัญชี (ลบการเชื่อมกับ users)</span>
                  </label>
                )}
                {(!doctorForm.unlinkUser || doctorModal.mode === 'add') && (
                  <>
                    <div className="mb-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">อีเมล (สำหรับล็อกอิน)</label>
                      <input
                        type="email"
                        value={doctorForm.email}
                        onChange={(e) => setDoctorForm((f) => ({ ...f, email: e.target.value }))}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder={doctorModal.mode === 'edit' ? 'เว้นว่างถ้าไม่เปลี่ยน' : 'ถ้าใส่จะสร้างบัญชีให้หมอล็อกอินได้'}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">รหัสผ่าน</label>
                      <input
                        type="password"
                        value={doctorForm.password}
                        onChange={(e) => setDoctorForm((f) => ({ ...f, password: e.target.value }))}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder={doctorModal.mode === 'edit' ? 'เว้นว่างถ้าไม่เปลี่ยน' : 'สำหรับบัญชีล็อกอิน'}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{doctorModal.mode === 'add' ? 'ใส่ทั้งอีเมลและรหัสผ่านจะสร้างบัญชี users (role: doctor) และผูกกับหมอนี้' : 'ใส่อีเมล+รหัสผ่านใหม่จะสร้าง/ผูกบัญชี (อีเมลซ้ำกับหมออื่นไม่ได้)'}</p>
                  </>
                )}
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button type="button" onClick={closeDoctorModal} className="flex-1 py-2.5 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50">
                ยกเลิก
              </button>
              <button type="button" onClick={handleSaveDoctor} disabled={doctorSaving || !doctorForm.name.trim() || !doctorForm.departmentId} className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50">
                {doctorSaving ? 'กำลังบันทึก...' : 'บันทึก'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import { useState } from 'react';
import { Bell, User, Stethoscope, AlertTriangle, Check, X } from 'lucide-react';
import { getSession } from '../../api/auth';
import { useRealtimeEvent } from '../context/RealtimeContext';

interface ToastItem {
  id: string;
  title: string;
  message: string;
  type: string;
  queueNumber?: string;
  doctorName?: string;
  departmentName?: string;
}

export function PatientRealtimeToasts() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useRealtimeEvent("notification", (payload: unknown) => {
    const p = payload as { userId?: string; notification?: { _id: string; title: string; message: string; type: string; queueNumber?: string; doctorName?: string; departmentName?: string } };
    if (!p?.userId || !p?.notification) return;
    const session = getSession();
    if (!session || session.role !== "patient") return;
    if (String(p.userId).trim() !== String(session.id).trim()) return;
    const n = p.notification;
    const newToast: ToastItem = {
      id: n._id || `toast-${Date.now()}`,
      title: n.title || "Notification",
      message: n.message || "",
      type: n.type || "status",
      queueNumber: n.queueNumber,
      doctorName: n.doctorName,
      departmentName: n.departmentName,
    };
    setToasts((prev) => [...prev.slice(-4), newToast]);
  });

  const user = getSession();
  if (!user || user.role !== "patient" || toasts.length === 0) return null;

  const dismiss = (id: string) => setToasts((prev) => prev.filter((t) => t.id !== id));

  const currentToast = toasts[toasts.length - 1];

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50">
      <div className="w-full max-w-md">
        {currentToast && (() => {
          const toast = currentToast;
          const isQueueCalled = Boolean(toast.queueNumber ?? toast.doctorName ?? toast.departmentName);
          return (
            <div
              key={toast.id}
              className="bg-white rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-300 border border-gray-200"
              role="alert"
            >
              {/* Header - green bar (Image 2 style) */}
              <div className="bg-emerald-700 text-white px-4 py-3 flex gap-3">
                <div className="flex-shrink-0 w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <Bell className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-base">{toast.title}</p>
                  <p className="text-emerald-100 text-sm mt-0.5">{toast.message}</p>
                </div>
                <button
                  type="button"
                  onClick={() => dismiss(toast.id)}
                  className="flex-shrink-0 p-1 text-white/80 hover:text-white rounded"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {isQueueCalled ? (
                <div className="p-4 space-y-3">
                  {/* Your Queue Number - light green box */}
                  {toast.queueNumber && (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-center">
                      <p className="text-emerald-800 text-sm font-medium">Your Queue Number</p>
                      <p className="text-2xl font-bold text-emerald-800 mt-1">{toast.queueNumber}</p>
                      <p className="text-emerald-600 text-sm mt-0.5">is now being called</p>
                    </div>
                  )}
                  {/* Doctor & Department - label above value (Image 2) */}
                  <div className="flex flex-col gap-2">
                    {toast.doctorName && (
                      <div className="flex items-center gap-2 text-gray-800">
                        <User className="w-4 h-4 text-gray-500 flex-shrink-0" />
                        <div>
                          <p className="text-xs text-gray-500">Doctor</p>
                          <p className="text-sm font-semibold text-gray-900">{toast.doctorName}</p>
                        </div>
                      </div>
                    )}
                    {toast.departmentName && (
                      <div className="flex items-center gap-2 text-gray-800">
                        <Stethoscope className="w-4 h-4 text-gray-500 flex-shrink-0" />
                        <div>
                          <p className="text-xs text-gray-500">Department</p>
                          <p className="text-sm font-semibold text-gray-900">{toast.departmentName}</p>
                        </div>
                      </div>
                    )}
                  </div>
                  {/* Important notice - yellow box */}
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex gap-2">
                    <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-amber-900">
                      <p className="font-semibold">Important:</p>
                      <p className="mt-0.5">Please proceed to the consultation room immediately. If you don&apos;t respond within 10 minutes, your queue may be skipped.</p>
                    </div>
                  </div>
                  {/* Buttons - stacked vertically (Image 2) */}
                  <div className="flex flex-col gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => dismiss(toast.id)}
                      className="w-full inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2.5 px-4 rounded-lg text-sm"
                    >
                      <Check className="w-4 h-4" />
                      I&apos;m on My Way
                    </button>
                    <button
                      type="button"
                      onClick={() => dismiss(toast.id)}
                      className="w-full inline-flex items-center justify-center gap-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-2.5 px-4 rounded-lg text-sm"
                    >
                      Close Notification
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-4 flex gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm">{toast.title}</p>
                    <p className="text-gray-600 text-sm mt-0.5">{toast.message}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => dismiss(toast.id)}
                    className="flex-shrink-0 p-1.5 text-gray-400 hover:text-gray-600 rounded"
                    aria-label="Close"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>
          );
        })()}
      </div>
    </div>
  );
}

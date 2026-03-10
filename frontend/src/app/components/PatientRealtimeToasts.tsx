import { useState } from 'react';
import { Bell, User, Stethoscope, AlertTriangle, Check, X, SkipForward, XCircle, Clock } from 'lucide-react';
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
  statusType?: string;
}

export function PatientRealtimeToasts() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useRealtimeEvent("notification", (payload: unknown) => {
    const p = payload as { userId?: string; notification?: { _id: string; title: string; message: string; type: string; queueNumber?: string; doctorName?: string; departmentName?: string; statusType?: string } };
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
      statusType: n.statusType,
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
          const hasQueueInfo = Boolean(toast.queueNumber ?? toast.doctorName ?? toast.departmentName);
          const isInProgressModal = toast.statusType === "in-progress";
          const isSkippedModal = toast.statusType === "skipped";
          const isCancelledModal = toast.statusType === "canceled";
          const isAlmostThereModal = toast.statusType === "almost-there";
          const isQueueCalledModal = hasQueueInfo && !isInProgressModal && !isSkippedModal && !isCancelledModal && !isAlmostThereModal;

          if (isInProgressModal) {
            return (
              <div
                key={toast.id}
                className="bg-white rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-300 border border-gray-200"
                role="alert"
              >
                {/* Header - blue bar */}
                <div className="bg-blue-700 text-white px-4 py-3 flex gap-3">
                  <div className="flex-shrink-0 w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                    <Stethoscope className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-base">Consultation Started</p>
                    <p className="text-blue-100 text-sm mt-0.5">Your turn is now in progress</p>
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

                <div className="p-4 space-y-3">
                  {/* Queue number - blue box */}
                  {toast.queueNumber && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
                      <p className="text-blue-800 text-sm font-medium">Your Queue Number</p>
                      <p className="text-2xl font-bold text-blue-800 mt-1">{toast.queueNumber}</p>
                      <p className="text-blue-600 text-sm mt-0.5">is now in consultation</p>
                    </div>
                  )}
                  {/* Doctor & Department */}
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
                  {/* Info box */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex gap-2">
                    <Stethoscope className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-blue-900">
                      <p className="font-semibold">In Session:</p>
                      <p className="mt-0.5">Your consultation is now in progress. Please stay in the consultation room with your doctor.</p>
                    </div>
                  </div>
                  {/* Buttons */}
                  <div className="flex flex-col gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => dismiss(toast.id)}
                      className="w-full inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-lg text-sm"
                    >
                      <Check className="w-4 h-4" />
                      Got It
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
              </div>
            );
          }

          if (isQueueCalledModal) {
            return (
              <div
                key={toast.id}
                className="bg-white rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-300 border border-gray-200"
                role="alert"
              >
                {/* Header - green bar */}
                <div className="bg-emerald-700 text-white px-4 py-3 flex gap-3">
                  <div className="flex-shrink-0 w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                    <Bell className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-base">{toast.title}</p>
                    <p className="text-emerald-100 text-sm mt-0.5">Please proceed immediately</p>
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

                <div className="p-4 space-y-3">
                  {/* Queue number - green box */}
                  {toast.queueNumber && (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-center">
                      <p className="text-emerald-800 text-sm font-medium">Your Queue Number</p>
                      <p className="text-2xl font-bold text-emerald-800 mt-1">{toast.queueNumber}</p>
                      <p className="text-emerald-600 text-sm mt-0.5">is now being called</p>
                    </div>
                  )}
                  {/* Doctor & Department */}
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
                  {/* Warning box */}
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex gap-2">
                    <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-amber-900">
                      <p className="font-semibold">Important:</p>
                      <p className="mt-0.5">Please proceed to the consultation room immediately. If you don&apos;t respond within 10 minutes, your queue may be skipped.</p>
                    </div>
                  </div>
                  {/* Buttons */}
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
              </div>
            );
          }

          if (isAlmostThereModal) {
            return (
              <div key={toast.id} className="bg-white rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-300 border border-gray-200" role="alert">
                <div className="bg-yellow-500 text-white px-4 py-3 flex gap-3">
                  <div className="flex-shrink-0 w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-base">Almost Your Turn!</p>
                    <p className="text-yellow-100 text-sm mt-0.5">1 more patient ahead of you</p>
                  </div>
                  <button type="button" onClick={() => dismiss(toast.id)} className="flex-shrink-0 p-1 text-white/80 hover:text-white rounded" aria-label="Close">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="p-4 space-y-3">
                  {toast.queueNumber && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-center">
                      <p className="text-yellow-800 text-sm font-medium">Your Queue Number</p>
                      <p className="text-2xl font-bold text-yellow-800 mt-1">{toast.queueNumber}</p>
                      <p className="text-yellow-600 text-sm mt-0.5">is coming up soon</p>
                    </div>
                  )}
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex gap-2">
                    <Clock className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-yellow-900">
                      <p className="font-semibold">Get Ready:</p>
                      <p className="mt-0.5">There is only 1 patient ahead of you. Please make your way to the consultation area and be prepared.</p>
                    </div>
                  </div>
                  <button type="button" onClick={() => dismiss(toast.id)} className="w-full inline-flex items-center justify-center gap-2 bg-yellow-500 hover:bg-yellow-600 text-white font-medium py-2.5 px-4 rounded-lg text-sm">
                    <Check className="w-4 h-4" />
                    Got It, I&apos;m Heading Over
                  </button>
                </div>
              </div>
            );
          }

          if (isSkippedModal) {
            return (
              <div key={toast.id} className="bg-white rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-300 border border-gray-200" role="alert">
                <div className="bg-orange-600 text-white px-4 py-3 flex gap-3">
                  <div className="flex-shrink-0 w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                    <SkipForward className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-base">Queue Skipped</p>
                    <p className="text-orange-100 text-sm mt-0.5">You were not present when called</p>
                  </div>
                  <button type="button" onClick={() => dismiss(toast.id)} className="flex-shrink-0 p-1 text-white/80 hover:text-white rounded" aria-label="Close">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="p-4 space-y-3">
                  {toast.queueNumber && (
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-center">
                      <p className="text-orange-800 text-sm font-medium">Your Queue Number</p>
                      <p className="text-2xl font-bold text-orange-800 mt-1">{toast.queueNumber}</p>
                      <p className="text-orange-600 text-sm mt-0.5">has been skipped</p>
                    </div>
                  )}
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex gap-2">
                    <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-amber-900">
                      <p className="font-semibold">Action Required:</p>
                      <p className="mt-0.5">You have 10 minutes to re-check-in at the counter before your slot is permanently cancelled.</p>
                    </div>
                  </div>
                  <button type="button" onClick={() => dismiss(toast.id)} className="w-full inline-flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-700 text-white font-medium py-2.5 px-4 rounded-lg text-sm">
                    <Check className="w-4 h-4" />
                    I Understand
                  </button>
                </div>
              </div>
            );
          }

          if (isCancelledModal) {
            return (
              <div key={toast.id} className="bg-white rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-300 border border-gray-200" role="alert">
                <div className="bg-red-600 text-white px-4 py-3 flex gap-3">
                  <div className="flex-shrink-0 w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                    <XCircle className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-base">Queue Booking Cancelled</p>
                    <p className="text-red-100 text-sm mt-0.5">Your booking has been cancelled by staff</p>
                  </div>
                  <button type="button" onClick={() => dismiss(toast.id)} className="flex-shrink-0 p-1 text-white/80 hover:text-white rounded" aria-label="Close">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="p-4 space-y-3">
                  {toast.queueNumber && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-center">
                      <p className="text-red-800 text-sm font-medium">Your Queue Number</p>
                      <p className="text-2xl font-bold text-red-800 mt-1">{toast.queueNumber}</p>
                      <p className="text-red-600 text-sm mt-0.5">has been cancelled</p>
                    </div>
                  )}
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex gap-2">
                    <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-red-900">
                      <p className="font-semibold">Booking Cancelled:</p>
                      <p className="mt-0.5">Your booking has been cancelled by hospital staff. Please contact the front desk for further assistance or make a new booking.</p>
                    </div>
                  </div>
                  <button type="button" onClick={() => dismiss(toast.id)} className="w-full inline-flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-medium py-2.5 px-4 rounded-lg text-sm">
                    <Check className="w-4 h-4" />
                    Acknowledged
                  </button>
                </div>
              </div>
            );
          }

          // Generic notification toast
          return (
            <div
              key={toast.id}
              className="bg-white rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-300 border border-gray-200"
              role="alert"
            >
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
            </div>
          );
        })()}
      </div>
    </div>
  );
}

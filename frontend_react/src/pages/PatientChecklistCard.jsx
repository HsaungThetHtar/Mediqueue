import { useState } from "react";
import api from "../api/axios";

export default function PatientChecklistCard({ booking, onChecklistSaved, hideChecklist }) {
  const [showChecklist, setShowChecklist] = useState(false);
  const [checklist, setChecklist] = useState(booking.checklist || "");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      await api.put(`/doctors/booking/${booking._id}/checklist`, { checklist });
      setSuccess("Checklist saved!");
      setShowChecklist(false);
      if (onChecklistSaved) onChecklistSaved();
    } catch (err) {
      setError(err.response?.data?.msg || "Failed to save checklist.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white border rounded-xl p-6 shadow flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
      <div>
        <p className="font-bold text-blue-700">
          {booking.patient?.name || "Unknown Patient"}
        </p>
        <p className="text-sm text-gray-600">
          {booking.session} | Queue #{booking.queueNumber}
        </p>
        <p className="text-sm text-gray-600">
          Status: {booking.status}
        </p>
      </div>
      <div className="text-gray-700 flex flex-col items-end gap-2 min-w-[180px]">
        <div>
          {new Date(booking.appointmentDate).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
        {!hideChecklist && (
          <>
            <button
              className="mt-2 px-4 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
              onClick={() => setShowChecklist((v) => !v)}
            >
              {showChecklist ? "Cancel" : (checklist ? "Edit Checklist" : "Add Checklist")}
            </button>
            {showChecklist && (
              <div className="mt-2 w-full">
                <textarea
                  className="w-full border rounded p-2 mb-2"
                  rows={3}
                  value={checklist}
                  onChange={e => setChecklist(e.target.value)}
                  placeholder="Enter checklist/notes for this patient..."
                />
                <button
                  className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 text-sm mr-2"
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? "Saving..." : "Save"}
                </button>
                <button
                  className="bg-gray-300 text-gray-700 px-3 py-1 rounded hover:bg-gray-400 text-sm"
                  onClick={() => setShowChecklist(false)}
                  disabled={saving}
                >
                  Cancel
                </button>
                {error && <div className="text-red-600 mt-1">{error}</div>}
                {success && <div className="text-green-600 mt-1">{success}</div>}
              </div>
            )}
            {!showChecklist && checklist && (
              <div className="mt-2 text-left w-full text-sm text-gray-700 bg-gray-50 border rounded p-2">
                <span className="font-semibold text-blue-700">Checklist:</span> {checklist}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
import { Bell, AlertTriangle } from "lucide-react";
import { useAlerts } from "../../hooks/useAlerts";

export default function RealTimeAlerts({ selectedAlert, onSelectAlert }) {
  const { alerts, loading } = useAlerts() || { alerts: [] };

  return (
    <div
      className="flex-1 bg-white rounded-2xl p-4 sm:p-5 flex flex-col min-h-[40vh] xl:min-h-0"
      style={{ border: "1px solid #E8EFF5" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <h2
          className="font-poppins text-[14px] sm:text-[15px] font-semibold flex items-center gap-2"
          style={{ color: "#374151" }}
        >
          <Bell size={16} className="text-red-500" />
          Real-Time Alerts
        </h2>
        {alerts?.length > 0 && (
          <span className="bg-red-50 text-red-600 text-xs font-bold px-2.5 py-0.5 rounded-full font-poppins animate-pulse">
            {alerts.length} Active
          </span>
        )}
      </div>

      {/* Alerts Scrollable Container */}
      <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 min-h-0 custom-scrollbar">
        {loading ? (
          <div className="h-full flex items-center justify-center text-gray-400 text-xs font-poppins">
            Loading alerts...
          </div>
        ) : !alerts || alerts.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center gap-2 py-12">
            <AlertTriangle size={24} className="text-gray-300" />
            <p className="font-poppins text-[13px] text-gray-400 text-center">
              No active alerts detected
            </p>
          </div>
        ) : (
          alerts.map((alert) => {
            const isSelected = selectedAlert?.id === alert.id;
            return (
              <div
                key={alert.id}
                onClick={() => onSelectAlert(alert)}
                className={`p-3.5 rounded-xl cursor-pointer transition-all border flex flex-col gap-1.5
                  ${isSelected
                    ? "bg-red-50/80 border-red-200 shadow-sm"
                    : "bg-gray-50/50 border-gray-100 hover:bg-gray-50 hover:border-gray-200"
                  }
                `}
              >
                <div className="flex items-center justify-between">
                  <span className="font-poppins text-xs font-bold text-red-600 uppercase tracking-wider flex items-center gap-1">
                    🚨 {alert.type || "Detection"}
                  </span>
                  <span className="font-poppins text-[11px] text-gray-400">
                    {alert.uiTime || "Just Now"}
                  </span>
                </div>

                <div className="flex flex-col gap-0.5 text-[12px] text-gray-600 font-poppins">
                  <span className="break-all">
                    Source:{" "}
                    <span className="font-medium text-gray-800">
                      {alert.camLabel || `Camera ${alert.camId}`}
                    </span>
                  </span>
                  {alert.confidence && (
                    <span className="text-gray-400">
                      Confidence:{" "}
                      <span className="font-medium text-gray-700">
                        {alert.confidence}%
                      </span>
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

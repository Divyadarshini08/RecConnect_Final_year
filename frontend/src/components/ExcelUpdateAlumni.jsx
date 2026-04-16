import { useState } from "react";
import { API } from "../utils/api";

const ExcelUpdateAlumni = () => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [updated, setUpdated] = useState(0);
  const [updateLog, setUpdateLog] = useState([]);

  const handleFileSelect = (e) => {
    setFile(e.target.files[0]);
    setMessage("");
  };

  const handleUpdate = async () => {
    if (!file) {
      setMessage("❌ Please select an Excel file");
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`${API}/api/alumni/update-excel`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(`❌ ${data.error || "Update failed"}`);
        return;
      }

      setMessage(`✅ Updated ${data.updated} alumni successfully!`);
      setUpdated(data.updated);
      setUpdateLog(data.updates || []);
      setFile(null);
    } catch (err) {
      setMessage(`❌ ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card" style={{ maxWidth: "900px", margin: "20px auto" }}>
      <h2>🔄 Update Alumni Profiles from Excel</h2>
      <p style={{ opacity: 0.7 }}>For existing alumni switching companies or updating info</p>
      
      <div style={{ 
        border: "2px dashed #93c5fd", 
        padding: "20px", 
        borderRadius: "8px",
        textAlign: "center",
        marginBottom: "16px"
      }}>
        <input
          type="file"
          accept=".csv"
          onChange={handleFileSelect}
          disabled={loading}
          style={{ width: "100%" }}
        />
        {file && <p style={{ marginTop: "8px", opacity: 0.8 }}>📁 {file.name}</p>}
      </div>

      <button 
        className="primary" 
        onClick={handleUpdate}
        disabled={!file || loading}
        style={{ width: "100%" }}
      >
        {loading ? "🔄 Updating..." : `Update Alumni (${updated} updated)`}
      </button>

      {message && (
        <p style={{ 
          marginTop: "12px", 
          padding: "12px", 
          backgroundColor: message.includes("✅") ? "#dcfce7" : "#fee2e2",
          borderRadius: "4px",
          color: message.includes("✅") ? "#166534" : "#991b1b"
        }}>
          {message}
        </p>
      )}

      {updateLog.length > 0 && (
        <div style={{ marginTop: "24px", border: "1px solid #e5e7eb", borderRadius: "8px", padding: "16px" }}>
          <h3>✅ Update Summary</h3>
          
          <div style={{ maxHeight: "300px", overflowY: "auto", border: "1px solid #e5e7eb", borderRadius: "4px" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
              <thead>
                <tr style={{ backgroundColor: "#f3f4f6" }}>
                  <th style={{ padding: "8px", textAlign: "left", borderBottom: "1px solid #e5e7eb" }}>Email</th>
                  <th style={{ padding: "8px", textAlign: "left", borderBottom: "1px solid #e5e7eb" }}>Updated Fields</th>
                </tr>
              </thead>
              <tbody>
                {updateLog.map((log, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid #e5e7eb" }}>
                    <td style={{ padding: "8px" }}>{log.email}</td>
                    <td style={{ padding: "8px" }}>
                      {log.fields.map(f => (
                        <div key={f} style={{ fontSize: "11px", opacity: 0.8 }}>
                          • {f}
                        </div>
                      ))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div style={{ marginTop: "16px", fontSize: "12px", opacity: 0.6, border: "1px solid #e5e7eb", padding: "12px", borderRadius: "4px", backgroundColor: "#f9fafb" }}>
        <p><strong>Excel Format (Match by Email):</strong></p>
        <table style={{ width: "100%", marginTop: "8px", borderCollapse: "collapse", fontSize: "11px" }}>
          <thead>
            <tr>
              <th style={{ textAlign: "left", padding: "4px", borderBottom: "1px solid #d1d5db" }}>Email*</th>
              <th style={{ textAlign: "left", padding: "4px", borderBottom: "1px solid #d1d5db" }}>Domain</th>
              <th style={{ textAlign: "left", padding: "4px", borderBottom: "1px solid #d1d5db" }}>Company</th>
              <th style={{ textAlign: "left", padding: "4px", borderBottom: "1px solid #d1d5db" }}>Expertise</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ padding: "4px" }}>john@ex.com</td>
              <td style={{ padding: "4px" }}>Data Science</td>
              <td style={{ padding: "4px" }}>Meta</td>
              <td style={{ padding: "4px" }}>ML/AI</td>
            </tr>
          </tbody>
        </table>
        <p style={{ marginTop: "8px", color: "#666" }}>* Email is required to match existing alumni. Leave fields blank to keep existing values.</p>
      </div>
    </div>
  );
};

export default ExcelUpdateAlumni;

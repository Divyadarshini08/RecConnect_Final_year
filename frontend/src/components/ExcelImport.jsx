import { useState } from "react";
import { API } from "../utils/api";

const ExcelImport = () => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [imported, setImported] = useState(0);
  const [credentials, setCredentials] = useState([]);
  const [showCredentials, setShowCredentials] = useState(false);

  const handleFileSelect = (e) => {
    setFile(e.target.files[0]);
    setMessage("");
  };

  const handleImport = async () => {
    if (!file) {
      setMessage("❌ Please select an Excel file");
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`${API}/api/alumni/import-excel`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(`❌ ${data.error || "Import failed"}`);
        return;
      }

      setMessage(`✅ Imported ${data.imported} alumni successfully!`);
      setImported(data.imported);
      setCredentials(data.credentials || []);
      setShowCredentials(true);
      setFile(null);
    } catch (err) {
      setMessage(`❌ ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const downloadCredentials = () => {
    const csv = ["Email,Password\n", ...credentials.map(c => `${c.email},${c.password}`)].join("");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "alumni-credentials.csv";
    a.click();
  };

  const copyToClipboard = () => {
    const text = credentials.map(c => `Email: ${c.email}\nPassword: ${c.password}`).join("\n\n");
    navigator.clipboard.writeText(text);
    alert("Credentials copied to clipboard!");
  };

  return (
    <div className="card" style={{ maxWidth: "800px", margin: "20px auto" }}>
      <h2>📊 Import Alumni from Excel</h2>
      
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
        onClick={handleImport}
        disabled={!file || loading}
        style={{ width: "100%" }}
      >
        {loading ? "🔄 Importing..." : `Import Excel (${imported} alumni)`}
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

      {showCredentials && credentials.length > 0 && (
        <div style={{ marginTop: "24px", border: "1px solid #e5e7eb", borderRadius: "8px", padding: "16px" }}>
          <h3>🔐 Generated Login Credentials</h3>
          
          <div style={{ marginBottom: "16px", display: "flex", gap: "8px" }}>
            <button 
              onClick={downloadCredentials}
              style={{ padding: "8px 16px", backgroundColor: "#3b82f6", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}
            >
              📥 Download CSV
            </button>
            <button 
              onClick={copyToClipboard}
              style={{ padding: "8px 16px", backgroundColor: "#10b981", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}
            >
              📋 Copy to Clipboard
            </button>
          </div>

          <div style={{ maxHeight: "300px", overflowY: "auto", border: "1px solid #e5e7eb", borderRadius: "4px" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ backgroundColor: "#f3f4f6" }}>
                  <th style={{ padding: "8px", textAlign: "left", borderBottom: "1px solid #e5e7eb" }}>Email</th>
                  <th style={{ padding: "8px", textAlign: "left", borderBottom: "1px solid #e5e7eb" }}>Password</th>
                </tr>
              </thead>
              <tbody>
                {credentials.map((cred, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid #e5e7eb" }}>
                    <td style={{ padding: "8px" }}>{cred.email}</td>
                    <td style={{ padding: "8px", fontFamily: "monospace", backgroundColor: "#fef08a", color: "#854d0e", fontWeight: "bold", borderRadius: "4px" }}>{cred.password}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p style={{ marginTop: "12px", fontSize: "12px", opacity: 0.7, color: "#666" }}>
            ⚠️ Share these credentials securely with the alumni. Ask them to change their password after first login.
          </p>
        </div>
      )}

      <div style={{ marginTop: "16px", fontSize: "12px", opacity: 0.6, border: "1px solid #e5e7eb", padding: "12px", borderRadius: "4px" }}>
        <p><strong>Excel Format:</strong></p>
        <p>Column A: Name</p>
        <p>Column B: Email</p>
        <p>Column C: Domain</p>
        <p>Column D: Company</p>
        <p>Column E: Expertise</p>
      </div>
    </div>
  );
};

export default ExcelImport;

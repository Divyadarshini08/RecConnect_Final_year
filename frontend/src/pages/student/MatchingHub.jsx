import { Link } from "react-router-dom";

const MatchingHub = () => {
  return (
    <div className="page">
      <div className="card" style={{ maxWidth: "900px", margin: "40px auto" }}>
        <h2 style={{ textAlign: "center", marginBottom: "32px" }}>🔍 Find Your Mentor</h2>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
          {/* AI Matching */}
          <Link to="/student/ai-match" style={{ textDecoration: "none" }}>
            <div className="card" style={{
              padding: "32px",
              backgroundColor: "#eff6ff",
              border: "3px solid #3b82f6",
              borderRadius: "12px",
              cursor: "pointer",
              transition: "all 0.3s",
              textAlign: "center"
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-4px)"}
            onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}
            >
              <h1 style={{ fontSize: "48px", marginBottom: "12px" }}>🤖</h1>
              <h3 style={{ color: "#1e40af", marginBottom: "8px" }}>AI-Powered Matching</h3>
              <p style={{ color: "#0369a1", fontSize: "14px", lineHeight: "1.6" }}>
                Describe what you're looking for in natural language. Claude AI will intelligently match you with the best alumni mentors.
              </p>
              <div style={{ marginTop: "16px", color: "#0369a1", fontSize: "12px", fontWeight: "bold" }}>
                Smart • Fast • Intelligent ✨
              </div>
            </div>
          </Link>

          {/* Manual Matching */}
          <Link to="/student/manual-match" style={{ textDecoration: "none" }}>
            <div className="card" style={{
              padding: "32px",
              backgroundColor: "#f0fdf4",
              border: "3px solid #10b981",
              borderRadius: "12px",
              cursor: "pointer",
              transition: "all 0.3s",
              textAlign: "center"
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-4px)"}
            onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}
            >
              <h1 style={{ fontSize: "48px", marginBottom: "12px" }}>👥</h1>
              <h3 style={{ color: "#065f46", marginBottom: "8px" }}>Browse Alumni</h3>
              <p style={{ color: "#047857", fontSize: "14px", lineHeight: "1.6" }}>
                Search and filter through all alumni manually by domain, company, expertise, or any other criteria.
              </p>
              <div style={{ marginTop: "16px", color: "#047857", fontSize: "12px", fontWeight: "bold" }}>
                Simple • Direct • Control ✓
              </div>
            </div>
          </Link>
        </div>

        {/* Comparison Table */}
        <div style={{ marginTop: "40px", paddingTop: "32px", borderTop: "2px solid #e5e7eb" }}>
          <h3 style={{ marginBottom: "20px", textAlign: "center" }}>How They Compare</h3>
          
          <table style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: "14px"
          }}>
            <thead>
              <tr style={{ backgroundColor: "#1e40af" }}>
                <th style={{ padding: "12px", textAlign: "left", borderBottom: "2px solid #d1d5db" }}>Feature</th>
                <th style={{ padding: "12px", textAlign: "center", borderBottom: "2px solid #d1d5db" }}>🤖 AI Matching</th>
                <th style={{ padding: "12px", textAlign: "center", borderBottom: "2px solid #d1d5db" }}>👥 Manual Browsing</th>
              </tr>
            </thead>
            <tbody>
              {[
                { feature: "Natural Language Search", ai: "✅ Yes", manual: "❌ No" },
                { feature: "Smart Recommendations", ai: "✅ Yes", manual: "❌ No" },
                { feature: "Instant Matching", ai: "✅ Yes", manual: "❌ No" },
                { feature: "Filter by Keywords", ai: "❌ No", manual: "✅ Yes" },
                { feature: "Browse All Alumni", ai: "❌ No", manual: "✅ Yes" },
                { feature: "Manual Control", ai: "❌ No", manual: "✅ Yes" },
                { feature: "Best For Quick Matches", ai: "✅ Yes", manual: "❌ No" },
                { feature: "Best For Exploration", ai: "❌ No", manual: "✅ Yes" }
              ].map((row, i) => (
                <tr key={i} style={{ borderBottom: "1px solid #e5e7eb" }}>
                  <td style={{ padding: "12px" }}><strong>{row.feature}</strong></td>
                  <td style={{ padding: "12px", textAlign: "center" }}>{row.ai}</td>
                  <td style={{ padding: "12px", textAlign: "center" }}>{row.manual}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Tips */}
        <div style={{
          marginTop: "32px",
          padding: "16px",
          backgroundColor: "#fef3c7",
          borderRadius: "8px",
          color: "#92400e"
        }}>
          <strong>💡 Tip:</strong> You can use both! Start with AI matching to discover recommendations, then browse manually to explore more options.
        </div>
      </div>
    </div>
  );
};

export default MatchingHub;

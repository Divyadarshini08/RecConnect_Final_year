import { useState } from "react";
import { API } from "../../utils/api";

const AIMatch = () => {
  const user = JSON.parse(localStorage.getItem("user"));
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [matches, setMatches] = useState([]);
  const [source, setSource] = useState("");
  const [error, setError] = useState("");

  const handleAIMatch = async (e) => {
    e.preventDefault();
    if (!query.trim()) {
      setError("Please enter what you're looking for");
      return;
    }

    setLoading(true);
    setError("");
    setMatches([]);

    try {
      const res = await fetch(`${API}/api/agent/match`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          student_id: user.user_id,
          query: query
        })
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Matching failed");
        return;
      }

      setMatches(data.alumni || []);
      setSource(data.source);
    } catch (err) {
      setError("Failed to find matches: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <div className="card" style={{ maxWidth: "1000px", margin: "20px auto" }}>
        <h2>🤖 AI-Powered Alumni Matching</h2>
        <p style={{ opacity: 0.7, marginBottom: "24px" }}>
          Describe what you're looking for - Claude AI will find the perfect alumni for you!
        </p>

        {/* Search Form */}
        <form onSubmit={handleAIMatch} style={{
          padding: "20px",
          backgroundColor: "#eff6ff",
          borderRadius: "8px",
          marginBottom: "24px"
        }}>
          <label style={{ display: "block", marginBottom: "8px", fontWeight: "500" }}>
            What are you looking for? (e.g., "ML engineer at Google", "startup founder", "data scientist mentor")
          </label>
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Describe the type of alumni you want to connect with..."
            disabled={loading}
            style={{
              width: "100%",
              minHeight: "100px",
              padding: "12px",
              borderRadius: "4px",
              marginBottom: "12px",
              border: "1px solid #3b82f6"
            }}
          />

          <button
            type="submit"
            disabled={loading}
            className="primary"
            style={{ width: "100%" }}
          >
            {loading ? "🔄 Finding matches..." : "✨ Find Matches"}
          </button>
        </form>

        {error && (
          <div style={{
            padding: "12px",
            backgroundColor: "#fee2e2",
            color: "#991b1b",
            borderRadius: "4px",
            marginBottom: "20px"
          }}>
            ❌ {error}
          </div>
        )}

        {matches.length > 0 && (
          <div>
            <h3 style={{ marginBottom: "16px", color: "#1f2937", display: "flex", alignItems: "center", gap: "8px" }}>
              ✨ {matches.length} Perfect Matches Found <span style={{ fontSize: "12px", opacity: 0.7 }}>(Powered by Claude AI)</span>
            </h3>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "16px" }}>
              {matches.map((alumni, idx) => (
                <div key={idx} className="card" style={{
                  padding: "16px",
                  border: "2px solid #3b82f6",
                  borderRadius: "8px",
                  backgroundColor: "#f0f9ff"
                }}>
                  <h3 style={{ marginBottom: "8px", color: "#1e40af" }}>🏆 Match #{idx + 1}</h3>

                  <div style={{ fontSize: "13px", marginBottom: "12px" }}>
                    {alumni.name && (
                      <p>
                        <strong>Name:</strong> {alumni.name}
                      </p>
                    )}
                    {alumni.domain && (
                      <p>
                        <strong>Domain:</strong> {alumni.domain}
                      </p>
                    )}
                    {alumni.company && (
                      <p>
                        <strong>Company:</strong> {alumni.company}
                      </p>
                    )}
                    {alumni.expertise && (
                      <p>
                        <strong>Expertise:</strong> {alumni.expertise}
                      </p>
                    )}
                    {alumni.reason && (
                      <p style={{ marginTop: "8px", color: "#0369a1", fontStyle: "italic" }}>
                        <strong>Why matched:</strong> {alumni.reason}
                      </p>
                    )}
                  </div>

                  <button
                    onClick={() => alumni.alumni_id && (window.location.href = `/student/alumni/${alumni.alumni_id}`)}
                    style={{
                      width: "100%",
                      padding: "8px",
                      backgroundColor: "#3b82f6",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer"
                    }}
                  >
                    View Full Profile
                  </button>
                </div>
              ))}
            </div>

            <p style={{ marginTop: "20px", fontSize: "12px", opacity: 0.6, textAlign: "center" }}>
              💡 Try different queries to find other interesting alumni!
            </p>
          </div>
        )}

        {!loading && matches.length === 0 && query && (
          <div style={{
            padding: "40px",
            textAlign: "center",
            backgroundColor: "#f3f4f6",
            borderRadius: "8px"
          }}>
            <p style={{ opacity: 0.6 }}>No matches found. Try a different search query!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIMatch;

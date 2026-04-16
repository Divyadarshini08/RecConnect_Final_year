import { useEffect, useState } from "react";
import { API } from "../../utils/api";

import { useAuth } from "../../hooks/useAuth";

const SmartMatch = () => {
  const user = useAuth();
  const [alumni, setAlumni] = useState([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState("");

  // Auto-run default match on mount
  useEffect(() => {
    runMatch("find me a great mentor");
  }, []);

  const runMatch = async (q = query) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API}/api/agent/match`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ student_id: user.user_id, query: q }),
      });
      const data = await res.json();
      setAlumni(data.alumni || []);
      setSearched(true);
    } catch (err) {
      setError("AI matching failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) runMatch();
  };

  const getScoreColor = (score) => {
    if (score >= 85) return "#4ade80";
    if (score >= 70) return "#facc15";
    return "#f87171";
  };

  const getScoreBadge = (score) => {
    if (score >= 85) return { label: "Top Match", color: "#4ade80" };
    if (score >= 70) return { label: "Good Match", color: "#facc15" };
    return { label: "Possible", color: "#94a3b8" };
  };

  return (
    <div className="page">
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{
            background: "linear-gradient(135deg, #3b82f6, #06b6d4)",
            borderRadius: 10,
            padding: "4px 10px",
            fontSize: 14,
            fontWeight: 700,
            letterSpacing: 1,
            color: "#fff"
          }}>AI</span>
          Smart Match
        </h2>
        <p style={{ opacity: 0.6, fontSize: 14 }}>
          Matchmaking agent analyses your profile and finds the best mentors for your goals
        </p>
      </div>

      {/* Search bar */}
      <form onSubmit={handleSearch} style={{ display: "flex", gap: 12, marginBottom: 28 }}>
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder='e.g. "I want to break into product management" or "need help with system design interviews"'
          style={{
            flex: 1,
            background: "rgba(255,255,255,0.08)",
            border: "1px solid rgba(255,255,255,0.15)",
            color: "#fff",
            borderRadius: 14,
            padding: "13px 18px",
            fontSize: 14,
          }}
        />
        <button
          type="submit"
          disabled={loading}
          className="primary"
          style={{ whiteSpace: "nowrap", borderRadius: 14, padding: "0 24px" }}
        >
          {loading ? "Matching..." : "🔍 Find Matches"}
        </button>
      </form>

      {error && (
        <div style={{
          background: "rgba(248,113,113,0.15)",
          border: "1px solid rgba(248,113,113,0.3)",
          borderRadius: 12,
          padding: "12px 16px",
          marginBottom: 20,
          color: "#fca5a5",
          fontSize: 14,
        }}>
          {error}
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {[1, 2, 3].map(i => (
            <div key={i} className="card" style={{
              background: "rgba(255,255,255,0.06)",
              height: 120,
              animation: "pulse 1.5s infinite",
            }} />
          ))}
          <p style={{ textAlign: "center", opacity: 0.5, fontSize: 13 }}>
            🤖 Claude is analysing alumni profiles...
          </p>
        </div>
      )}

      {/* Results */}
      {!loading && searched && (
        <>
          <p style={{ opacity: 0.5, fontSize: 13, marginBottom: 16 }}>
            Found {alumni.length} alumni · Ranked by AI compatibility score
          </p>

          {alumni.length === 0 ? (
            <div className="card" style={{ textAlign: "center", padding: 40 }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🔍</div>
              <h3>No alumni available right now</h3>
              <p style={{ opacity: 0.6 }}>Try a different search or check back later when alumni add availability.</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {alumni.map((a, idx) => {
                const badge = getScoreBadge(a.match_score);
                return (
                  <div
                    key={a.alumni_id}
                    className="card"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 20,
                      padding: "20px 24px",
                      border: idx === 0 && a.recommended
                        ? "1px solid rgba(74,222,128,0.3)"
                        : "1px solid rgba(255,255,255,0.06)",
                      position: "relative",
                      overflow: "hidden",
                    }}
                  >
                    {/* Rank badge */}
                    {idx < 3 && (
                      <div style={{
                        position: "absolute",
                        top: 12,
                        right: 16,
                        fontSize: 20,
                      }}>
                        {["🥇","🥈","🥉"][idx]}
                      </div>
                    )}

                    {/* Avatar */}
                    <div style={{
                      width: 52,
                      height: 52,
                      borderRadius: "50%",
                      background: `linear-gradient(135deg, hsl(${(a.alumni_id * 47) % 360}, 60%, 50%), hsl(${(a.alumni_id * 47 + 60) % 360}, 70%, 40%))`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 20,
                      fontWeight: 700,
                      color: "#fff",
                      flexShrink: 0,
                    }}>
                      {a.name?.charAt(0).toUpperCase()}
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                        <h3 style={{ margin: 0, fontSize: 16 }}>{a.name}</h3>
                        {a.recommended && (
                          <span style={{
                            background: "rgba(74,222,128,0.15)",
                            border: "1px solid rgba(74,222,128,0.3)",
                            color: "#4ade80",
                            borderRadius: 20,
                            padding: "2px 10px",
                            fontSize: 11,
                            fontWeight: 600,
                          }}>✓ Recommended</span>
                        )}
                      </div>
                      <p style={{ opacity: 0.7, fontSize: 13, margin: "0 0 4px" }}>
                        {a.domain} · {a.company}
                      </p>
                      {a.match_reason && (
                        <p style={{
                          opacity: 0.55,
                          fontSize: 12,
                          margin: 0,
                          fontStyle: "italic",
                        }}>
                          💡 {a.match_reason}
                        </p>
                      )}
                    </div>

                    {/* Score + action */}
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, flexShrink: 0 }}>
                      {/* Score ring */}
                      <div style={{ position: "relative", width: 56, height: 56 }}>
                        <svg width="56" height="56" viewBox="0 0 56 56">
                          <circle cx="28" cy="28" r="22" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="5" />
                          <circle
                            cx="28" cy="28" r="22"
                            fill="none"
                            stroke={getScoreColor(a.match_score)}
                            strokeWidth="5"
                            strokeDasharray={`${(a.match_score / 100) * 138.2} 138.2`}
                            strokeLinecap="round"
                            transform="rotate(-90 28 28)"
                          />
                        </svg>
                        <div style={{
                          position: "absolute", inset: 0,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 13, fontWeight: 700, color: getScoreColor(a.match_score),
                        }}>
                          {a.match_score}
                        </div>
                      </div>
                      <span style={{
                        fontSize: 10,
                        color: badge.color,
                        fontWeight: 600,
                        letterSpacing: 0.5,
                      }}>{badge.label}</span>

                      <button
                        className="primary"
                        onClick={() => window.location.href = `/student/alumni/${a.alumni_id}`}
                        style={{ fontSize: 12, padding: "8px 16px", borderRadius: 10 }}
                      >
                        View Slots
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default SmartMatch;

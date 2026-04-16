import { useState, useEffect } from "react";
import { API } from "../../utils/api";

const ManualMatch = () => {
  const [alumni, setAlumni] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    domain: "",
    company: "",
    expertise: ""
  });

  useEffect(() => {
    fetchAlumni();
  }, []);

  const fetchAlumni = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/alumni/list`);
      const data = await res.json();
      setAlumni(data);
      setFiltered(data);
    } catch (err) {
      console.error("Failed to load alumni:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    const newFilters = { ...filters, [name]: value.toLowerCase() };
    setFilters(newFilters);

    // Filter alumni based on criteria
    const result = alumni.filter(a => {
      const domainMatch = !newFilters.domain || a.domain?.toLowerCase().includes(newFilters.domain);
      const companyMatch = !newFilters.company || a.company?.toLowerCase().includes(newFilters.company);
      const expertiseMatch = !newFilters.expertise || a.expertise?.toLowerCase().includes(newFilters.expertise);
      return domainMatch && companyMatch && expertiseMatch;
    });

    setFiltered(result);
  };

  const clearFilters = () => {
    setFilters({ domain: "", company: "", expertise: "" });
    setFiltered(alumni);
  };

  return (
    <div className="page">
      <div className="card" style={{ maxWidth: "1000px", margin: "20px auto" }}>
        <h2>👥 Browse Alumni (Manual Search)</h2>
        <p style={{ opacity: 0.7, marginBottom: "24px" }}>
          Search and filter alumni by domain, company, or expertise
        </p>

        {/* Filters */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: "12px",
          marginBottom: "20px",
          padding: "16px",
          backgroundColor: "#04111e8f",
          borderRadius: "8px"
        }}>
          <div>
            <label style={{ display: "block", marginBottom: "6px", fontSize: "12px", fontWeight: "500" }}>
              Domain
            </label>
            <input
              type="text"
              name="domain"
              value={filters.domain}
              onChange={handleFilterChange}
              placeholder="e.g., Data Science"
              style={{ width: "100%" }}
            />
          </div>

          <div>
            <label style={{ display: "block", marginBottom: "6px", fontSize: "12px", fontWeight: "500" }}>
              Company
            </label>
            <input
              type="text"
              name="company"
              value={filters.company}
              onChange={handleFilterChange}
              placeholder="e.g., Google"
              style={{ width: "100%" }}
            />
          </div>

          <div>
            <label style={{ display: "block", marginBottom: "6px", fontSize: "12px", fontWeight: "500" }}>
              Expertise
            </label>
            <input
              type="text"
              name="expertise"
              value={filters.expertise}
              onChange={handleFilterChange}
              placeholder="e.g., Machine Learning"
              style={{ width: "100%" }}
            />
          </div>
        </div>

        <button
          onClick={clearFilters}
          style={{
            padding: "8px 16px",
            marginBottom: "20px",
            backgroundColor: "#e5e7eb",
            color: "#374151",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer"
          }}
        >
          Clear Filters
        </button>

        {/* Alumni List */}
        <div style={{ marginTop: "20px" }}>
          <p style={{ marginBottom: "12px", opacity: 0.7 }}>
            <strong>Found {filtered.length} alumni</strong>
          </p>

          {filtered.length === 0 ? (
            <div style={{
              padding: "40px",
              textAlign: "center",
              backgroundColor: "#f3f4f6",
              borderRadius: "8px"
            }}>
              <p style={{ opacity: 0.6 }}>No alumni match your filters</p>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "16px" }}>
              {filtered.map((a) => (
                <div key={a.alumni_id} className="card" style={{
                  padding: "16px",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px"
                }}>
                  <h3 style={{ marginBottom: "8px", color: "#03285b" }}>{a.name}</h3>
                  <p style={{ fontSize: "13px", marginBottom: "8px", opacity: 0.7 }}>
                    <strong>Domain:</strong> {a.domain || "Not specified"}
                  </p>
                  <p style={{ fontSize: "13px", marginBottom: "8px", opacity: 0.7 }}>
                    <strong>Company:</strong> {a.company || "Not specified"}
                  </p>
                  <p style={{ fontSize: "13px", marginBottom: "12px", opacity: 0.7 }}>
                    <strong>Expertise:</strong> {a.expertise || "Not specified"}
                  </p>
                  <button
                    onClick={() => window.location.href = `/student/alumni/${a.alumni_id}`}
                    style={{
                      width: "100%",
                      padding: "8px",
                      backgroundColor: "#04111e8f",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer"
                    }}
                  >
                    View Profile
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ManualMatch;

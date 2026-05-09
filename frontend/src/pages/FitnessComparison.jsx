import { useEffect, useMemo, useState } from "react";

import Navbar from "../components/Navbar";
import PageShell from "../components/PageShell";
import StatCard from "../components/StatCard";
import EmptyState from "../components/EmptyState";
import API from "../services/api";

const defaultForm = {
  category: "overall",
  metricName: "",
  userValue: "",
  benchmarkValue: "",
  unit: "",
  benchmarkGroup: "GymSphere Community",
  notes: "",
};

const categoryLabels = {
  strength: "Strength",
  cardio: "Cardio",
  endurance: "Endurance",
  body: "Body",
  overall: "Overall",
};

function FitnessComparison() {
  const [comparisons, setComparisons] = useState([]);
  const [summary, setSummary] = useState({
    total: 0,
    above: 0,
    below: 0,
    onTrack: 0,
    averagePerformance: 0,
  });
  const [benchmarks, setBenchmarks] = useState([]);
  const [form, setForm] = useState(defaultForm);
  const [editingId, setEditingId] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchComparisons = async () => {
    try {
      setLoading(true);

      const [comparisonRes, summaryRes, benchmarkRes] = await Promise.all([
        API.get("/fitness-comparisons"),
        API.get("/fitness-comparisons/summary"),
        API.get("/fitness-comparisons/benchmarks"),
      ]);

      setComparisons(comparisonRes.data?.data || []);
      setSummary(
        summaryRes.data?.data || {
          total: 0,
          above: 0,
          below: 0,
          onTrack: 0,
          averagePerformance: 0,
        }
      );
      setBenchmarks(benchmarkRes.data?.data || []);
    } catch (error) {
      alert(error.response?.data?.message || "Failed to load fitness comparison data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComparisons();
  }, []);

  const filteredComparisons = useMemo(() => {
    if (selectedCategory === "all") return comparisons;
    return comparisons.filter((item) => item.category === selectedCategory);
  }, [comparisons, selectedCategory]);

  const bestComparison = useMemo(() => {
    if (!comparisons.length) return null;

    return [...comparisons].sort(
      (a, b) => b.percentageDifference - a.percentageDifference
    )[0];
  }, [comparisons]);

  const needsWorkComparison = useMemo(() => {
    if (!comparisons.length) return null;

    return [...comparisons].sort(
      (a, b) => a.percentageDifference - b.percentageDifference
    )[0];
  }, [comparisons]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleBenchmarkSelect = (event) => {
    const selectedMetric = event.target.value;
    const selected = benchmarks.find((item) => item.metricName === selectedMetric);

    if (!selected) return;

    setForm((previous) => ({
      ...previous,
      category: selected.category,
      metricName: selected.metricName,
      benchmarkValue: selected.benchmarkValue,
      unit: selected.unit,
      benchmarkGroup: selected.benchmarkGroup,
    }));
  };

  const resetForm = () => {
    setForm(defaultForm);
    setEditingId(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.metricName.trim()) {
      alert("Please enter a metric name");
      return;
    }

    if (Number(form.userValue) < 0 || Number(form.benchmarkValue) < 0) {
      alert("Values cannot be negative");
      return;
    }

    if (!form.unit.trim()) {
      alert("Please enter a unit");
      return;
    }

    const payload = {
      ...form,
      userValue: Number(form.userValue),
      benchmarkValue: Number(form.benchmarkValue),
    };

    try {
      setSaving(true);

      if (editingId) {
        await API.put(`/fitness-comparisons/${editingId}`, payload);
      } else {
        await API.post("/fitness-comparisons", payload);
      }

      resetForm();
      await fetchComparisons();
    } catch (error) {
      alert(error.response?.data?.message || "Failed to save comparison");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (comparison) => {
    setEditingId(comparison._id);

    setForm({
      category: comparison.category || "overall",
      metricName: comparison.metricName || "",
      userValue: comparison.userValue ?? "",
      benchmarkValue: comparison.benchmarkValue ?? "",
      unit: comparison.unit || "",
      benchmarkGroup: comparison.benchmarkGroup || "GymSphere Community",
      notes: comparison.notes || "",
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id) => {
    const confirmed = window.confirm("Delete this fitness comparison?");

    if (!confirmed) return;

    try {
      await API.delete(`/fitness-comparisons/${id}`);
      await fetchComparisons();
    } catch (error) {
      alert(error.response?.data?.message || "Failed to delete comparison");
    }
  };

  const getStatusClass = (status) => {
    if (status === "Above Benchmark") return "status above";
    if (status === "Below Benchmark") return "status below";
    return "status track";
  };

  return (
    <>
      <Navbar />

      <PageShell
        title="Fitness Comparison"
        subtitle="Compare your performance with GymSphere community benchmarks."
      >
        <style>{`
          .comparison-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
            gap: 16px;
            margin-bottom: 22px;
          }

          .comparison-panel {
            background: #ffffff;
            border: 1px solid #e5e7eb;
            border-radius: 18px;
            padding: 20px;
            box-shadow: 0 12px 35px rgba(15, 23, 42, 0.08);
            margin-bottom: 22px;
          }

          .comparison-panel h2 {
            margin: 0 0 6px;
            color: #111827;
            font-size: 22px;
          }

          .comparison-panel p {
            margin: 0 0 16px;
            color: #6b7280;
          }

          .comparison-form {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
            gap: 14px;
          }

          .comparison-form label {
            display: flex;
            flex-direction: column;
            gap: 7px;
            font-weight: 700;
            color: #374151;
          }

          .comparison-form input,
          .comparison-form select,
          .comparison-form textarea {
            border: 1px solid #d1d5db;
            border-radius: 12px;
            padding: 12px 13px;
            font-size: 15px;
            outline: none;
            background: #ffffff;
          }

          .comparison-form input:focus,
          .comparison-form select:focus,
          .comparison-form textarea:focus {
            border-color: #2563eb;
            box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15);
          }

          .comparison-form textarea {
            min-height: 92px;
            resize: vertical;
          }

          .full-row {
            grid-column: 1 / -1;
          }

          .form-actions {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
            align-items: center;
          }

          .primary-btn,
          .secondary-btn,
          .danger-btn {
            border: none;
            border-radius: 12px;
            padding: 11px 15px;
            font-weight: 800;
            cursor: pointer;
            transition: transform 0.15s ease, opacity 0.15s ease;
          }

          .primary-btn:hover,
          .secondary-btn:hover,
          .danger-btn:hover {
            transform: translateY(-1px);
            opacity: 0.92;
          }

          .primary-btn {
            background: #2563eb;
            color: #ffffff;
          }

          .secondary-btn {
            background: #e5e7eb;
            color: #111827;
          }

          .danger-btn {
            background: #fee2e2;
            color: #991b1b;
          }

          .comparison-toolbar {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 14px;
            flex-wrap: wrap;
            margin-bottom: 16px;
          }

          .comparison-toolbar select {
            border: 1px solid #d1d5db;
            border-radius: 12px;
            padding: 11px 12px;
            font-weight: 700;
            background: #ffffff;
          }

          .comparison-list {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
            gap: 16px;
          }

          .comparison-card {
            border: 1px solid #e5e7eb;
            border-radius: 18px;
            padding: 18px;
            background: linear-gradient(180deg, #ffffff, #f9fafb);
          }

          .card-top {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            gap: 12px;
            margin-bottom: 12px;
          }

          .metric-name {
            margin: 0;
            font-size: 19px;
            color: #111827;
          }

          .category-pill {
            display: inline-flex;
            margin-top: 8px;
            padding: 5px 10px;
            border-radius: 999px;
            background: #eff6ff;
            color: #1d4ed8;
            font-size: 12px;
            font-weight: 800;
          }

          .status {
            white-space: nowrap;
            border-radius: 999px;
            padding: 6px 10px;
            font-size: 12px;
            font-weight: 900;
          }

          .status.above {
            background: #dcfce7;
            color: #166534;
          }

          .status.below {
            background: #fee2e2;
            color: #991b1b;
          }

          .status.track {
            background: #fef9c3;
            color: #854d0e;
          }

          .metric-row {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
            margin: 12px 0;
          }

          .metric-box {
            border-radius: 14px;
            background: #ffffff;
            border: 1px solid #e5e7eb;
            padding: 13px;
          }

          .metric-box span {
            display: block;
            color: #6b7280;
            font-size: 12px;
            font-weight: 800;
            text-transform: uppercase;
            margin-bottom: 5px;
          }

          .metric-box strong {
            color: #111827;
            font-size: 22px;
          }

          .progress-track {
            height: 10px;
            background: #e5e7eb;
            border-radius: 999px;
            overflow: hidden;
            margin: 12px 0 8px;
          }

          .progress-fill {
            height: 100%;
            background: #2563eb;
            border-radius: 999px;
          }

          .comparison-note {
            color: #4b5563;
            line-height: 1.5;
            margin: 10px 0 0;
          }

          .card-actions {
            display: flex;
            gap: 10px;
            margin-top: 14px;
          }

          .insight-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
            gap: 16px;
            margin-bottom: 22px;
          }

          .insight-card {
            background: #111827;
            color: #ffffff;
            border-radius: 18px;
            padding: 18px;
          }

          .insight-card p {
            margin: 6px 0 0;
            color: #d1d5db;
          }

          .insight-card strong {
            font-size: 22px;
          }
        `}</style>

        <div className="comparison-grid">
          <StatCard title="Total Metrics" value={summary.total} />
          <StatCard title="Above Benchmark" value={summary.above} />
          <StatCard title="On Track" value={summary.onTrack} />
          <StatCard title="Average Performance" value={`${summary.averagePerformance}%`} />
        </div>

        <div className="insight-grid">
          <div className="insight-card">
            <strong>Best Area</strong>
            <p>
              {bestComparison
                ? `${bestComparison.metricName}: ${bestComparison.percentageDifference}% vs benchmark`
                : "Add comparison data to see your strongest area."}
            </p>
          </div>

          <div className="insight-card">
            <strong>Needs Focus</strong>
            <p>
              {needsWorkComparison
                ? `${needsWorkComparison.metricName}: ${needsWorkComparison.percentageDifference}% vs benchmark`
                : "Add comparison data to find improvement areas."}
            </p>
          </div>
        </div>

        <section className="comparison-panel">
          <h2>{editingId ? "Update Comparison" : "Add Fitness Comparison"}</h2>
          <p>
            Use default community benchmarks or enter your own benchmark values.
          </p>

          <form className="comparison-form" onSubmit={handleSubmit}>
            <label>
              Quick Benchmark
              <select onChange={handleBenchmarkSelect} defaultValue="">
                <option value="">Select a default benchmark</option>
                {benchmarks.map((benchmark) => (
                  <option key={benchmark.metricName} value={benchmark.metricName}>
                    {benchmark.metricName} - {benchmark.benchmarkValue} {benchmark.unit}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Category
              <select name="category" value={form.category} onChange={handleChange}>
                <option value="overall">Overall</option>
                <option value="strength">Strength</option>
                <option value="cardio">Cardio</option>
                <option value="endurance">Endurance</option>
                <option value="body">Body</option>
              </select>
            </label>

            <label>
              Metric Name
              <input
                type="text"
                name="metricName"
                value={form.metricName}
                onChange={handleChange}
                placeholder="Example: Bench Press"
              />
            </label>

            <label>
              Your Value
              <input
                type="number"
                name="userValue"
                value={form.userValue}
                onChange={handleChange}
                min="0"
                step="0.01"
                placeholder="Example: 70"
              />
            </label>

            <label>
              Benchmark Value
              <input
                type="number"
                name="benchmarkValue"
                value={form.benchmarkValue}
                onChange={handleChange}
                min="0"
                step="0.01"
                placeholder="Example: 60"
              />
            </label>

            <label>
              Unit
              <input
                type="text"
                name="unit"
                value={form.unit}
                onChange={handleChange}
                placeholder="kg, reps, minutes, %, score"
              />
            </label>

            <label>
              Benchmark Group
              <input
                type="text"
                name="benchmarkGroup"
                value={form.benchmarkGroup}
                onChange={handleChange}
                placeholder="GymSphere Community"
              />
            </label>

            <label className="full-row">
              Notes
              <textarea
                name="notes"
                value={form.notes}
                onChange={handleChange}
                placeholder="Add training notes, goal context, or improvement plan"
              />
            </label>

            <div className="form-actions full-row">
              <button className="primary-btn" type="submit" disabled={saving}>
                {saving ? "Saving..." : editingId ? "Update Comparison" : "Save Comparison"}
              </button>

              {editingId && (
                <button className="secondary-btn" type="button" onClick={resetForm}>
                  Cancel Edit
                </button>
              )}
            </div>
          </form>
        </section>

        <section className="comparison-panel">
          <div className="comparison-toolbar">
            <div>
              <h2>Your Comparisons</h2>
              <p>Review how your current performance compares to benchmarks.</p>
            </div>

            <select
              value={selectedCategory}
              onChange={(event) => setSelectedCategory(event.target.value)}
            >
              <option value="all">All Categories</option>
              <option value="overall">Overall</option>
              <option value="strength">Strength</option>
              <option value="cardio">Cardio</option>
              <option value="endurance">Endurance</option>
              <option value="body">Body</option>
            </select>
          </div>

          {loading ? (
            <p>Loading comparisons...</p>
          ) : filteredComparisons.length === 0 ? (
            <EmptyState
              title="No comparisons yet"
              message="Add your first fitness comparison to see community benchmark insights."
            />
          ) : (
            <div className="comparison-list">
              {filteredComparisons.map((comparison) => {
                const ratio =
                  comparison.benchmarkValue > 0
                    ? Math.min((comparison.userValue / comparison.benchmarkValue) * 100, 160)
                    : 0;

                return (
                  <article className="comparison-card" key={comparison._id}>
                    <div className="card-top">
                      <div>
                        <h3 className="metric-name">{comparison.metricName}</h3>
                        <span className="category-pill">
                          {categoryLabels[comparison.category] || "Overall"}
                        </span>
                      </div>

                      <span className={getStatusClass(comparison.status)}>
                        {comparison.status}
                      </span>
                    </div>

                    <div className="metric-row">
                      <div className="metric-box">
                        <span>Your Value</span>
                        <strong>
                          {comparison.userValue} {comparison.unit}
                        </strong>
                      </div>

                      <div className="metric-box">
                        <span>Benchmark</span>
                        <strong>
                          {comparison.benchmarkValue} {comparison.unit}
                        </strong>
                      </div>
                    </div>

                    <div className="progress-track">
                      <div
                        className="progress-fill"
                        style={{ width: `${Math.max(5, Math.min(ratio, 100))}%` }}
                      />
                    </div>

                    <p className="comparison-note">
                      Difference: <strong>{comparison.difference}</strong>{" "}
                      {comparison.unit} ({comparison.percentageDifference}%)
                    </p>

                    <p className="comparison-note">
                      Group: {comparison.benchmarkGroup}
                    </p>

                    {comparison.notes && (
                      <p className="comparison-note">{comparison.notes}</p>
                    )}

                    <div className="card-actions">
                      <button
                        className="secondary-btn"
                        type="button"
                        onClick={() => handleEdit(comparison)}
                      >
                        Edit
                      </button>

                      <button
                        className="danger-btn"
                        type="button"
                        onClick={() => handleDelete(comparison._id)}
                      >
                        Delete
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </PageShell>
    </>
  );
}

export default FitnessComparison;
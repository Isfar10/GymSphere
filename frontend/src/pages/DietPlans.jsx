import { useEffect, useMemo, useState } from "react";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import API from "../services/api";

const defaultForm = {
  goal: "weight_loss",
  age: "",
  gender: "male",
  heightCm: "",
  weightKg: "",
  activityLevel: "moderate",
  mealsPerDay: "4",
  dietType: "balanced",
  allergies: "",
  dislikedFoods: "",
  preferredFoods: "",
};

function DietPlans() {
  const { user } = useAuth();

  const [form, setForm] = useState(defaultForm);
  const [foodStats, setFoodStats] = useState(null);
  const [foods, setFoods] = useState([]);
  const [foodSearch, setFoodSearch] = useState("");
  const [myPlans, setMyPlans] = useState([]);
  const [adminPlans, setAdminPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [adminMode, setAdminMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const isAdmin = user?.role === "admin";

  const visiblePlans = adminMode && isAdmin ? adminPlans : myPlans;

  const latestPlan = useMemo(() => {
    if (selectedPlan) return selectedPlan;
    return myPlans[0] || null;
  }, [selectedPlan, myPlans]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");

      const [statsResponse, foodsResponse, myPlansResponse] = await Promise.all([
        API.get("/diet-plans/foods/stats"),
        API.get("/diet-plans/foods"),
        API.get("/diet-plans/my-plans"),
      ]);

      setFoodStats(statsResponse.data.stats);
      setFoods(foodsResponse.data.foods || []);
      setMyPlans(myPlansResponse.data.dietPlans || []);

      if (isAdmin) {
        const adminResponse = await API.get("/diet-plans/admin/all");
        setAdminPlans(adminResponse.data.dietPlans || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load diet planner data.");
    } finally {
      setLoading(false);
    }
  };

  const searchFoods = async () => {
    try {
      const response = await API.get(`/diet-plans/foods?search=${foodSearch}`);
      setFoods(response.data.foods || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to search foods.");
    }
  };

  useEffect(() => {
    fetchData();
  }, [isAdmin]);

  const showSuccess = (message) => {
    setSuccess(message);
    setTimeout(() => setSuccess(""), 2500);
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const validateForm = () => {
    if (!form.age || !form.heightCm || !form.weightKg) {
      return "Age, height, and weight are required.";
    }

    if (Number(form.age) < 10 || Number(form.age) > 100) {
      return "Age must be between 10 and 100.";
    }

    if (Number(form.heightCm) < 80 || Number(form.heightCm) > 250) {
      return "Height must be between 80 cm and 250 cm.";
    }

    if (Number(form.weightKg) < 25 || Number(form.weightKg) > 300) {
      return "Weight must be between 25 kg and 300 kg.";
    }

    return null;
  };

  const generatePlan = async (event) => {
    event.preventDefault();

    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setGenerating(true);
      setError("");

      const response = await API.post("/diet-plans/generate", {
        ...form,
        age: Number(form.age),
        heightCm: Number(form.heightCm),
        weightKg: Number(form.weightKg),
        mealsPerDay: Number(form.mealsPerDay),
      });

      setSelectedPlan(response.data.dietPlan);
      await fetchData();
      showSuccess("Database-backed diet plan generated successfully.");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to generate diet plan.");
    } finally {
      setGenerating(false);
    }
  };

  const deletePlan = async (planId) => {
    try {
      setActionLoading(true);
      setError("");

      await API.delete(`/diet-plans/${planId}`);

      if (selectedPlan?.id === planId) {
        setSelectedPlan(null);
      }

      await fetchData();
      showSuccess("Diet plan deleted.");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete diet plan.");
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (dateValue) => {
    if (!dateValue) return "N/A";
    return new Date(dateValue).toLocaleString();
  };

  const getGoalLabel = (goal) => {
    const labels = {
      weight_loss: "Weight Loss",
      muscle_gain: "Muscle Gain",
      maintenance: "Maintenance",
      general_fitness: "General Fitness",
    };

    return labels[goal] || "General Fitness";
  };

  return (
    <>
      <Navbar />

      <main style={styles.page}>
        <section style={styles.header}>
          <div>
            <p style={styles.eyebrow}>Database AI Nutrition</p>
            <h1 style={styles.title}>Diet Plan Generator</h1>
            <p style={styles.subtitle}>
              Generate diet plans by matching users with the best foods from your
              local MongoDB nutrition database.
            </p>
          </div>

          <button type="button" onClick={fetchData} style={styles.refreshButton}>
            Refresh
          </button>
        </section>

        {error && <div style={styles.errorBox}>{error}</div>}
        {success && <div style={styles.successBox}>{success}</div>}

        <section style={styles.statsGrid}>
          <StatCard
            label="Foods in Database"
            value={foodStats?.totalFoods || 0}
            helper="Imported from backend/data/foods.csv"
          />

          <StatCard
            label="My Diet Plans"
            value={myPlans.length}
            helper="Saved generated plans"
          />

          <StatCard
            label="Method"
            value="Scoring"
            helper="Goal, macros, diet type, allergy, preference"
          />
        </section>

        <section style={styles.disclaimerBox}>
          <strong>Project explanation:</strong> This feature does not randomly guess
          diet plans. It calculates calorie and macro targets, filters unsafe foods,
          scores database foods, and creates a best-fit meal plan.
        </section>

        <section style={styles.layout}>
          <div style={styles.formCard}>
            <h2 style={styles.sectionTitle}>Generate New Plan</h2>

            <form onSubmit={generatePlan} style={styles.form}>
              <div style={styles.formGrid}>
                <label style={styles.label}>
                  Goal
                  <select name="goal" value={form.goal} onChange={handleChange} style={styles.input}>
                    <option value="weight_loss">Weight Loss</option>
                    <option value="muscle_gain">Muscle Gain</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="general_fitness">General Fitness</option>
                  </select>
                </label>

                <label style={styles.label}>
                  Age
                  <input name="age" type="number" value={form.age} onChange={handleChange} placeholder="22" style={styles.input} />
                </label>

                <label style={styles.label}>
                  Gender
                  <select name="gender" value={form.gender} onChange={handleChange} style={styles.input}>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </label>

                <label style={styles.label}>
                  Height cm
                  <input name="heightCm" type="number" value={form.heightCm} onChange={handleChange} placeholder="170" style={styles.input} />
                </label>

                <label style={styles.label}>
                  Weight kg
                  <input name="weightKg" type="number" value={form.weightKg} onChange={handleChange} placeholder="70" style={styles.input} />
                </label>

                <label style={styles.label}>
                  Activity
                  <select name="activityLevel" value={form.activityLevel} onChange={handleChange} style={styles.input}>
                    <option value="sedentary">Sedentary</option>
                    <option value="light">Light</option>
                    <option value="moderate">Moderate</option>
                    <option value="active">Active</option>
                    <option value="very_active">Very Active</option>
                  </select>
                </label>

                <label style={styles.label}>
                  Meals
                  <select name="mealsPerDay" value={form.mealsPerDay} onChange={handleChange} style={styles.input}>
                    <option value="3">3 meals</option>
                    <option value="4">4 meals</option>
                    <option value="5">5 meals</option>
                    <option value="6">6 meals</option>
                  </select>
                </label>

                <label style={styles.label}>
                  Diet Type
                  <select name="dietType" value={form.dietType} onChange={handleChange} style={styles.input}>
                    <option value="balanced">Balanced</option>
                    <option value="high_protein">High Protein</option>
                    <option value="vegetarian">Vegetarian</option>
                    <option value="vegan">Vegan</option>
                    <option value="low_carb">Low Carb</option>
                  </select>
                </label>
              </div>

              <label style={styles.label}>
                Allergies
                <input
                  name="allergies"
                  value={form.allergies}
                  onChange={handleChange}
                  placeholder="egg, milk, fish, peanut"
                  style={styles.input}
                />
              </label>

              <label style={styles.label}>
                Disliked Foods
                <input
                  name="dislikedFoods"
                  value={form.dislikedFoods}
                  onChange={handleChange}
                  placeholder="fish, beef"
                  style={styles.input}
                />
              </label>

              <label style={styles.label}>
                Preferred Foods
                <input
                  name="preferredFoods"
                  value={form.preferredFoods}
                  onChange={handleChange}
                  placeholder="chicken, rice, oats"
                  style={styles.input}
                />
              </label>

              <button type="submit" disabled={generating} style={styles.primaryButton}>
                {generating ? "Generating..." : "Generate From Database"}
              </button>
            </form>
          </div>

          <div style={styles.resultCard}>
            <h2 style={styles.sectionTitle}>Generated Plan</h2>

            {loading ? (
              <div style={styles.emptyBox}>Loading...</div>
            ) : !latestPlan ? (
              <div style={styles.emptyBox}>Generate a diet plan to see results here.</div>
            ) : (
              <DietPlanDetails
                plan={latestPlan}
                getGoalLabel={getGoalLabel}
                formatDate={formatDate}
                onDelete={deletePlan}
                actionLoading={actionLoading}
              />
            )}
          </div>
        </section>

        <section style={styles.databaseSection}>
          <div style={styles.historyHeader}>
            <div>
              <h2 style={styles.sectionTitle}>Food Database Preview</h2>
              <p style={styles.mutedText}>
                These are the foods imported into MongoDB and used by the scoring algorithm.
              </p>
            </div>

            <div style={styles.searchRow}>
              <input
                value={foodSearch}
                onChange={(event) => setFoodSearch(event.target.value)}
                placeholder="Search foods"
                style={styles.input}
              />
              <button type="button" onClick={searchFoods} style={styles.secondaryButton}>
                Search
              </button>
            </div>
          </div>

          <div style={styles.foodGrid}>
            {foods.slice(0, 12).map((food) => (
              <div key={food.id} style={styles.foodCard}>
                <h3 style={styles.foodName}>{food.name}</h3>
                <p style={styles.mutedText}>{food.servingSize}</p>
                <p style={styles.foodMacros}>
                  {food.calories} kcal • P {food.proteinGrams}g • C {food.carbsGrams}g • F {food.fatGrams}g
                </p>
                <p style={styles.tagText}>{food.dietTags.join(", ")}</p>
              </div>
            ))}
          </div>
        </section>

        <section style={styles.historyHeader}>
          <div>
            <h2 style={styles.sectionTitle}>Diet Plan History</h2>
            <p style={styles.mutedText}>
              {adminMode && isAdmin ? "Showing all user plans." : "Showing your plans."}
            </p>
          </div>

          {isAdmin && (
            <button
              type="button"
              onClick={() => setAdminMode((previous) => !previous)}
              style={styles.secondaryButton}
            >
              {adminMode ? "Show My Plans" : "Admin: Show All Plans"}
            </button>
          )}
        </section>

        {visiblePlans.length === 0 ? (
          <div style={styles.emptyBox}>No diet plans found.</div>
        ) : (
          <section style={styles.planList}>
            {visiblePlans.map((plan) => (
              <article key={plan.id} style={styles.planListCard}>
                <div>
                  <h3 style={styles.planListTitle}>{plan.planTitle}</h3>
                  <p style={styles.mutedText}>
                    {adminMode && isAdmin ? `${plan.user?.name || "User"} • ` : ""}
                    {getGoalLabel(plan.goal)} • Target {plan.targetCalories} kcal • Actual {plan.totalCalories} kcal
                  </p>
                  <p style={styles.mutedText}>{formatDate(plan.createdAt)}</p>
                </div>

                <div style={styles.actionRow}>
                  <button type="button" onClick={() => setSelectedPlan(plan)} style={styles.secondaryButton}>
                    View
                  </button>

                  <button type="button" onClick={() => deletePlan(plan.id)} disabled={actionLoading} style={styles.dangerButton}>
                    Delete
                  </button>
                </div>
              </article>
            ))}
          </section>
        )}
      </main>
    </>
  );
}

function DietPlanDetails({ plan, getGoalLabel, formatDate, onDelete, actionLoading }) {
  return (
    <div>
      <div style={styles.planTop}>
        <div>
          <p style={styles.badge}>Database Scoring</p>
          <h3 style={styles.resultTitle}>{plan.planTitle}</h3>
          <p style={styles.resultSummary}>{plan.summary}</p>
        </div>

        <button
          type="button"
          onClick={() => onDelete(plan.id)}
          disabled={actionLoading}
          style={styles.dangerButton}
        >
          Delete
        </button>
      </div>

      <div style={styles.targetGrid}>
        <Target label="Target Calories" value={`${plan.targetCalories} kcal`} />
        <Target label="Actual Calories" value={`${plan.totalCalories} kcal`} />
        <Target label="Target Protein" value={`${plan.targetProteinGrams}g`} />
        <Target label="Actual Protein" value={`${plan.totalProteinGrams}g`} />
      </div>

      <div style={styles.infoGrid}>
        <Info label="Goal" value={getGoalLabel(plan.goal)} />
        <Info label="Diet Type" value={plan.dietType} />
        <Info label="Method" value={plan.recommendationMethod} />
        <Info label="Created" value={formatDate(plan.createdAt)} />
      </div>

      <h3 style={styles.subTitle}>Meals</h3>

      <div style={styles.mealList}>
        {plan.meals.map((meal, index) => (
          <div key={`${meal.mealName}-${index}`} style={styles.mealCard}>
            <div style={styles.mealHeader}>
              <h4 style={styles.mealName}>{meal.mealName}</h4>
              <span style={styles.mealTime}>{meal.time}</span>
            </div>

            <div style={styles.foodList}>
              {meal.foods.map((food) => (
                <div key={`${meal.mealName}-${food.name}`} style={styles.foodLine}>
                  <strong>{food.name}</strong>
                  <span>{food.servingSize}</span>
                  <span>{food.calories} kcal</span>
                </div>
              ))}
            </div>

            <div style={styles.macroRow}>
              <span>{meal.totalCalories} kcal</span>
              <span>P {meal.totalProteinGrams}g</span>
              <span>C {meal.totalCarbsGrams}g</span>
              <span>F {meal.totalFatGrams}g</span>
            </div>
          </div>
        ))}
      </div>

      <div style={styles.disclaimerSmall}>{plan.disclaimer}</div>
    </div>
  );
}

function StatCard({ label, value, helper }) {
  return (
    <div style={styles.statCard}>
      <p style={styles.cardLabel}>{label}</p>
      <h3 style={styles.statValue}>{value}</h3>
      <p style={styles.mutedText}>{helper}</p>
    </div>
  );
}

function Target({ label, value }) {
  return (
    <div style={styles.targetCard}>
      <p style={styles.cardLabel}>{label}</p>
      <h4 style={styles.targetValue}>{value}</h4>
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div style={styles.infoCard}>
      <p style={styles.cardLabel}>{label}</p>
      <strong>{value}</strong>
    </div>
  );
}

const styles = {
  page: {
    maxWidth: "1250px",
    margin: "0 auto",
    padding: "32px 20px",
    fontFamily:
      "Inter, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
    color: "#111827",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    gap: "18px",
    alignItems: "flex-start",
    marginBottom: "20px",
  },
  eyebrow: {
    margin: "0 0 8px",
    color: "#16a34a",
    fontWeight: 900,
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    fontSize: "13px",
  },
  title: {
    margin: 0,
    fontSize: "36px",
    lineHeight: 1.1,
  },
  subtitle: {
    margin: "10px 0 0",
    color: "#6b7280",
    maxWidth: "790px",
    lineHeight: 1.6,
  },
  refreshButton: {
    border: "none",
    borderRadius: "999px",
    background: "#16a34a",
    color: "#ffffff",
    padding: "11px 18px",
    fontWeight: 800,
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
  errorBox: {
    background: "#fee2e2",
    color: "#991b1b",
    border: "1px solid #fecaca",
    borderRadius: "14px",
    padding: "12px 14px",
    marginBottom: "14px",
  },
  successBox: {
    background: "#dcfce7",
    color: "#166534",
    border: "1px solid #bbf7d0",
    borderRadius: "14px",
    padding: "12px 14px",
    marginBottom: "14px",
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "14px",
    marginBottom: "18px",
  },
  statCard: {
    border: "1px solid #e5e7eb",
    borderRadius: "18px",
    padding: "16px",
    background: "#ffffff",
    boxShadow: "0 10px 25px rgba(15, 23, 42, 0.06)",
  },
  statValue: {
    margin: "8px 0",
    fontSize: "26px",
  },
  disclaimerBox: {
    border: "1px solid #bbf7d0",
    borderRadius: "16px",
    background: "#f0fdf4",
    color: "#166534",
    padding: "14px",
    lineHeight: 1.6,
    marginBottom: "20px",
  },
  layout: {
    display: "grid",
    gridTemplateColumns: "minmax(320px, 440px) minmax(0, 1fr)",
    gap: "20px",
    alignItems: "start",
  },
  formCard: {
    border: "1px solid #e5e7eb",
    borderRadius: "20px",
    padding: "20px",
    background: "#ffffff",
    boxShadow: "0 10px 25px rgba(15, 23, 42, 0.06)",
  },
  resultCard: {
    border: "1px solid #e5e7eb",
    borderRadius: "20px",
    padding: "20px",
    background: "#ffffff",
    boxShadow: "0 10px 25px rgba(15, 23, 42, 0.06)",
  },
  sectionTitle: {
    margin: "0 0 16px",
    fontSize: "25px",
  },
  form: {
    display: "grid",
    gap: "13px",
  },
  formGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
    gap: "12px",
  },
  label: {
    display: "grid",
    gap: "7px",
    color: "#374151",
    fontWeight: 800,
  },
  input: {
    border: "1px solid #d1d5db",
    borderRadius: "14px",
    padding: "11px 12px",
    font: "inherit",
  },
  primaryButton: {
    border: "none",
    borderRadius: "999px",
    background: "#16a34a",
    color: "#ffffff",
    padding: "12px 18px",
    fontWeight: 900,
    cursor: "pointer",
    justifySelf: "start",
  },
  secondaryButton: {
    border: "1px solid #16a34a",
    borderRadius: "999px",
    background: "#ffffff",
    color: "#16a34a",
    padding: "10px 15px",
    fontWeight: 900,
    cursor: "pointer",
  },
  dangerButton: {
    border: "1px solid #fecaca",
    borderRadius: "999px",
    background: "#ffffff",
    color: "#dc2626",
    padding: "10px 15px",
    fontWeight: 900,
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
  emptyBox: {
    border: "1px dashed #d1d5db",
    borderRadius: "18px",
    padding: "30px 20px",
    textAlign: "center",
    color: "#6b7280",
    background: "#f9fafb",
  },
  planTop: {
    display: "flex",
    justifyContent: "space-between",
    gap: "16px",
    alignItems: "flex-start",
    marginBottom: "16px",
  },
  badge: {
    display: "inline-flex",
    borderRadius: "999px",
    background: "#dcfce7",
    color: "#166534",
    padding: "6px 10px",
    fontSize: "12px",
    fontWeight: 900,
    margin: "0 0 8px",
  },
  resultTitle: {
    margin: 0,
    fontSize: "26px",
  },
  resultSummary: {
    color: "#6b7280",
    lineHeight: 1.6,
    margin: "8px 0 0",
  },
  targetGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
    gap: "12px",
    marginBottom: "14px",
  },
  targetCard: {
    border: "1px solid #e5e7eb",
    borderRadius: "16px",
    padding: "14px",
    background: "#f9fafb",
  },
  cardLabel: {
    margin: 0,
    color: "#6b7280",
    fontSize: "13px",
    fontWeight: 800,
  },
  targetValue: {
    margin: "6px 0 0",
    fontSize: "20px",
  },
  infoGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
    gap: "10px",
    marginBottom: "18px",
  },
  infoCard: {
    border: "1px solid #e5e7eb",
    borderRadius: "14px",
    padding: "12px",
    background: "#ffffff",
  },
  subTitle: {
    margin: "0 0 10px",
    fontSize: "19px",
  },
  mealList: {
    display: "grid",
    gap: "12px",
  },
  mealCard: {
    border: "1px solid #e5e7eb",
    borderRadius: "18px",
    padding: "16px",
    background: "#ffffff",
  },
  mealHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: "12px",
    alignItems: "center",
  },
  mealName: {
    margin: 0,
    fontSize: "19px",
  },
  mealTime: {
    color: "#6b7280",
    fontWeight: 800,
  },
  foodList: {
    display: "grid",
    gap: "8px",
    margin: "14px 0",
  },
  foodLine: {
    display: "grid",
    gridTemplateColumns: "1fr auto auto",
    gap: "10px",
    borderBottom: "1px solid #f3f4f6",
    paddingBottom: "8px",
    color: "#374151",
  },
  macroRow: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
    color: "#166534",
    fontWeight: 900,
  },
  disclaimerSmall: {
    border: "1px solid #fde68a",
    borderRadius: "14px",
    padding: "12px",
    background: "#fffbeb",
    color: "#92400e",
    marginTop: "14px",
    lineHeight: 1.6,
    fontSize: "14px",
  },
  databaseSection: {
    marginTop: "30px",
  },
  historyHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: "16px",
    alignItems: "flex-start",
    marginTop: "30px",
    marginBottom: "14px",
  },
  mutedText: {
    margin: 0,
    color: "#6b7280",
    lineHeight: 1.5,
  },
  searchRow: {
    display: "flex",
    gap: "10px",
  },
  foodGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "12px",
  },
  foodCard: {
    border: "1px solid #e5e7eb",
    borderRadius: "16px",
    padding: "14px",
    background: "#ffffff",
  },
  foodName: {
    margin: "0 0 6px",
    fontSize: "18px",
  },
  foodMacros: {
    margin: "8px 0",
    color: "#166534",
    fontWeight: 800,
  },
  tagText: {
    margin: 0,
    color: "#6b7280",
    fontSize: "13px",
  },
  planList: {
    display: "grid",
    gap: "12px",
  },
  planListCard: {
    display: "flex",
    justifyContent: "space-between",
    gap: "16px",
    alignItems: "center",
    border: "1px solid #e5e7eb",
    borderRadius: "18px",
    padding: "16px",
    background: "#ffffff",
    boxShadow: "0 10px 25px rgba(15, 23, 42, 0.04)",
  },
  planListTitle: {
    margin: "0 0 6px",
    fontSize: "20px",
  },
  actionRow: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
  },
};

export default DietPlans;
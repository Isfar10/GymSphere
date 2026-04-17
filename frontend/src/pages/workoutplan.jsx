const BASE_URL = "http://localhost:5000/api/workout";

// CREATE WORKOUT
async function createWorkout() {
  const name = document.getElementById("name").value;
  const description = document.getElementById("desc").value;

  const res = await fetch(`${BASE_URL}/create`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ name, description })
  });

  const data = await res.json();
  alert("Workout Created: " + data._id);
}

// ASSIGN WORKOUT
async function assignWorkout() {
  const workoutId = document.getElementById("workoutId").value;
  const userId = document.getElementById("userId").value;

  const res = await fetch(`${BASE_URL}/assign`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ workoutId, userId })
  });

  const data = await res.json();
  alert(data.message);
}

// GET USER WORKOUTS
async function getWorkouts() {
  const userId = document.getElementById("viewUserId").value;

  const res = await fetch(`${BASE_URL}/${userId}`);
  const data = await res.json();

  document.getElementById("output").textContent =
    JSON.stringify(data, null, 2);
}
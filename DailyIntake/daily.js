// Helper functions
function isFilled(text) {
  const val = text?.trim().toLowerCase();
  return val && ![
    "", "none", "no", "nothing", "null", "nil", "na", "n/a", "nothing much"
  ].includes(val);
}


function countItems(text) {
  return (text || "")
    .split(",")
    .map(item => item.trim())
    .filter(Boolean).length;
}

function evaluateFluidIntake(water, milk, teaCoffee, juice, softDrinks) {
  const totalMl = water + milk + teaCoffee + juice + softDrinks;
  const totalL = totalMl / 1000;
  let status, feedback;

  if (totalL >= 4) {
    status = "Good";
    feedback = `Great! You’re drinking ${totalL.toFixed(2)} L — more than enough fluids for a college student.`;
  } else if (totalL >= 3.5) {
    status = "Good";
    feedback = `Well done! Your fluid intake is ${totalL.toFixed(2)} L — right on track for healthy hydration.`;
  } else if (totalL >= 2.5) {
    status = "Okay";
    feedback = `You’ve had ${totalL.toFixed(2)} L. You’re close to ideal, try to drink a bit more.`;
  } else if (totalL >= 2.0) {
    status = "Low";
    feedback = `Your fluid intake is ${totalL.toFixed(2)} L, which is insufficient. You should increase your fluids for better health.`;
  } else {
    status = "Very Low";
    feedback = `Only ${totalL.toFixed(2)} L consumed — this is too low and can cause dehydration. Drink more water and healthy liquids!`;
  }

  return { status, feedback };
}

function evaluateMeals(breakfast, lunch, dinner) {
  const count = [breakfast, lunch, dinner].filter(isFilled).length;
  if (count === 3) return { status: "Good", message: "All meals are logged. Great job!" };
  if (count > 0) return { status: "Okay", message: "Some meals are missing. Try to eat regularly." };
  return { status: "Bad", message: "No meals logged. Please eat properly." };
}

function evaluateFoodIntake(fruits, snacks, mildJunk, junkFood) {
  if (fruits >= 1 && snacks === 0 && mildJunk === 0 && junkFood === 0)
    return { status: "Good", message: "Great balance of healthy food and snacks!" };
  if (fruits >= 1 && snacks >= 1 && mildJunk <= 1 && junkFood <= 1)
    return { status: "Good", message: "Great balance of healthy food and snacks!" };
  if (fruits >= 1 && mildJunk <= 2 && junkFood <= 2)
    return { status: "Okay", message: "Moderate intake, watch your junk food consumption." };
  return { status: "Low", message: "Too much junk food or low healthy food. Try to improve your diet." };
}

// Format date as DD/MM/YY
function formatDate(iso) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y.slice(2)}`;
}

// Main form logic
document.getElementById("intakeForm").addEventListener("submit", function (e) {
  e.preventDefault();

  const date = formatDate(document.getElementById("logDate").value);

  const water = +document.getElementById("water").value || 0;
  const milk = +document.getElementById("milk").value || 0;
  const teaCoffee = +document.getElementById("teaCoffee").value || 0;
  const juice = +document.getElementById("juice").value || 0;
  const softDrinks = +document.getElementById("softDrinks").value || 0;

  const breakfast = document.getElementById("breakfast").value;
  const lunch = document.getElementById("lunch").value;
  const dinner = document.getElementById("dinner").value;

  const fruits = document.getElementById("fruits").value;
  const healthySnacks = document.getElementById("healthySnacks").value;
  const mildJunk = document.getElementById("mildJunk").value;
  const junkFood = document.getElementById("excessiveJunkFood").value;

  const fluid = evaluateFluidIntake(water, milk, teaCoffee, juice, softDrinks);
  const meals = evaluateMeals(breakfast, lunch, dinner);
  const food = evaluateFoodIntake(
    countItems(fruits),
    countItems(healthySnacks),
    countItems(mildJunk),
    countItems(junkFood)
  );

  // Display values
  document.getElementById("displayDate").textContent = date;
  document.getElementById("logWater").textContent = water;
  document.getElementById("logMilk").textContent = milk;
  document.getElementById("logTeaCoffee").textContent = teaCoffee;
  document.getElementById("logJuice").textContent = juice;
  document.getElementById("logSoftDrinks").textContent = softDrinks;
  document.getElementById("logBreakfast").textContent = breakfast || "Nothing";
  document.getElementById("logLunch").textContent = lunch || "Nothing";
  document.getElementById("logDinner").textContent = dinner || "Nothing";
  document.getElementById("logFruits").textContent = fruits.trim() || "None";
  document.getElementById("logHealthySnacks").textContent = healthySnacks.trim() || "None";
  document.getElementById("logMildJunk").textContent = mildJunk.trim() || "None";
  document.getElementById("logExcessiveJunkFood").textContent = junkFood.trim() || "None";

  // Status styling
  function applyStatus(el, status) {
    el.textContent = status;
    el.className = "";
    el.classList.add(
      status === "Good" ? "status-good" :
      status === "Okay" ? "status-okay" : "status-bad"
    );
  }

  applyStatus(document.getElementById("fluidStatus"), fluid.status);
  applyStatus(document.getElementById("mealsStatus"), meals.status);
  applyStatus(document.getElementById("fruitsSnackJunkStatus"), food.status);

  // Feedback
  document.getElementById("feedbackMessage").innerHTML = `
    <strong>Fluids:</strong> ${fluid.feedback}<br>
    <strong>Meals:</strong> ${meals.message}<br>
    <strong>Fruits, Snacks & Junk Food:</strong> ${food.message}
  `;

  document.getElementById("logOutput").style.display = "block";
  document.getElementById("logOutput").scrollIntoView({ behavior: "smooth" });

  // Save to server
  fetch("/submit-intake", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: localStorage.getItem("username"),
      date,
      fluidintakestatus: fluid.status,
      mealsstatus: meals.status,
      fruitssnackjunkfoodstatus: food.status
    })
  })
  .then(res => res.text())
  .then(console.log)
  .catch(console.error);
});
function calculateBMI() {
  const weight = parseFloat(document.getElementById('weight').value);
  const height = parseFloat(document.getElementById('height').value) / 100;

  if (weight > 0 && height > 0) {
    const bmi = weight / (height * height);
    displayResult(bmi);
  } else {
    alert('Please enter valid values for weight and height.');
  }
}

function displayResult(bmi) {
  const resultDiv = document.getElementById('result');
  let category = '';
  let emoji = '';
  let colorClass = '';

  if (bmi < 18.5) {
    category = 'Underweight';
    emoji = '🍃';
    colorClass = 'underweight';
  } else if (bmi < 25) {
    category = 'Normal weight';
    emoji = '💪';
    colorClass = 'normal';
  } else if (bmi < 30) {
    category = 'Overweight';
    emoji = '⚠️';
    colorClass = 'overweight';
  } else {
    category = 'Obese';
    emoji = '🛑';
    colorClass = 'obese';
  }

  resultDiv.innerHTML = `
    <div class="bmi-box ${colorClass}">
      <p>Your BMI is <strong>${bmi.toFixed(2)}</strong></p>
      <p>Category: <strong>${category}</strong> ${emoji}</p>
    </div>
    <div class="bmi-chart">
      <h4>BMI Categories:</h4>
      <ul>
        <li><span class="underweight">🍃 Underweight:</span> BMI < 18.5</li>
        <li><span class="normal">💪 Normal:</span> 18.5 ≤ BMI < 25</li>
        <li><span class="overweight">⚠️ Overweight:</span> 25 ≤ BMI < 30</li>
        <li><span class="obese">🛑 Obese:</span> BMI ≥ 30</li>
      </ul>
    </div>
  `;
}

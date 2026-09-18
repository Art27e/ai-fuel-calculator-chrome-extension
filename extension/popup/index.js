const calcBtn = document.getElementById('btn-gen');
const fetchBtn = document.getElementById('ai-btn');
const fuelPrice = document.getElementById('fuel-price');
const averageConsumption = document.getElementById('average-consumption');
const tripDistance = document.getElementById('trip-distance');

let fetchedPrice = null; // global variable to store the fetched fuel price

function calculate() {
  const res =
    ((averageConsumption.value * tripDistance.value) / 100) * fuelPrice.value;
  if (res != 0) {
    window.alert(`${res.toFixed(2)} euros for ${tripDistance.value} km`);
  } else {
    window.alert(`No input data found`);
  }
}

calcBtn.addEventListener('click', calculate);

// Claude AI Web-Search fuel price
async function fetchFuelPrice() {
  console.log('fetchFuelPrice called'); // check if function is triggered

  const { selectedFuelType, selectedCountry } = await chrome.storage.local.get([
    'selectedFuelType',
    'selectedCountry',
  ]);

  const fuelType = selectedFuelType || 'Diesel';
  const country = selectedCountry || 'Estonia';

  fetchBtn.disabled = true;
  fetchBtn.innerHTML = '<span class="spinner"></span>Searching...';
  fetchedPrice = null; // reset fetched price before new request

  try {
    console.log('sending request to Go backend'); // if this doesn't log, the issue is before the fetch call
    const response = await fetch(
      'https://ai-fuel-calculator-chrome-extension-apt.fly.dev/api/fuel-price',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fuelType: fuelType,
          country: country,
        }),
      },
    );

    console.log('response status:', response.status); // watch the response status code to see if the request was successful
    if (!response.ok) {
      throw new Error(`Server returned status ${response.status}`);
    }
    const anthropicApiData = await response.json(); // parse the JSON response from the API

    // search for the text block in the response which contains the answer from Claude
    const textBlock = anthropicApiData.content.find((b) => b.type === 'text');
    if (!textBlock) throw new Error('No text response from Claude');

    const clean = textBlock.text.replace(/```json|```/g, '').trim(); // remove any code block formatting if present, and trim whitespace

    // take the JSON part from the response and parse it to extract the price
    const jsonMatch = clean.match(/\{.*\}/s);
    if (!jsonMatch) throw new Error('No JSON found in response');

    const parsed = JSON.parse(jsonMatch[0]);

    if (!parsed.price) {
      throw new Error('Could not find current price');
    }

    fetchedPrice = parsed.price; // save the fetched price to the global variable
    fuelPrice.value = parsed.price.toFixed(3);
  } catch (err) {
    // if any error occurs during the fetch or parsing, log it and show an error message
    console.error('Error fetching fuel price:', err);
    // error.textContent = `Error: ${err.message}`;
    fuelPrice.value = '';
  } finally {
    fetchBtn.disabled = false; // always unlock the button after completing the request
    fetchBtn.innerHTML = 'Refresh Price';
  }
}

fetchBtn.addEventListener('click', fetchFuelPrice);

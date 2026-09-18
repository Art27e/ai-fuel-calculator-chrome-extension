const saveSettingsBtn = document.getElementById('btn-gen');
const selectFuel = document.getElementById('fuel-type');
const selectCountry = document.getElementById('countries-list');

async function showCountriesList(selectedCountry) {
  try {
    const response = await fetch(
      'https://countries.dev/countries?fields=name&sort=name',
      {},
    );
    if (!response.ok) {
      throw new Error(
        `Countries List API. Server returned status ${response.status}`,
      );
    }
    const countriesData = await response.json();
    countriesData.forEach((obj) => {
      let option = document.createElement('option');
      option.text = obj.name;
      option.value = obj.name;
      selectCountry.append(option);
    });
    // options уже существуют
    if (selectedCountry) {
      selectCountry.value = selectedCountry;
    }
  } catch (err) {
    console.error('Error fetching countries list:', err);
  }
}

showCountriesList();

if (saveSettingsBtn) {
  saveSettingsBtn.addEventListener('click', async () => {
    chrome.storage.local.set({
      selectedFuelType: selectFuel.value,
      selectedCountry: selectCountry.value,
    });
    saveSettingsBtn.textContent = 'Saved!';
    setTimeout(() => {
      saveSettingsBtn.textContent = 'Save';
    }, 1500);
  });
}

// When the settings page loads, we want to populate the dropdowns with the saved values
document.addEventListener('DOMContentLoaded', async () => {
  const { selectedFuelType, selectedCountry } = await chrome.storage.local.get([
    'selectedFuelType',
    'selectedCountry',
  ]);
  if (selectedFuelType) {
    console.log('check if fuel is chosen', selectedFuelType);
    selectFuel.value = selectedFuelType;
  }
  if (selectedCountry) {
    console.log('check if country is chosen', selectedCountry);
    selectCountry.value = selectedCountry;
  }
  await showCountriesList(selectedCountry);
});

const saveSettingsBtn = document.getElementById('btn-gen');

const selectFuel = document.getElementById('fuel-type');
const selectCountry = document.getElementById('country-input');

if (saveSettingsBtn) {
  saveSettingsBtn.addEventListener('click', async () => {

    chrome.storage.local.set({
        selectedFuelType: selectFuel.value,
        selectedCountry: selectCountry.value,
    })

    console.log('Country is', selectCountry.value, 'Fuel is', selectFuel.value)

    saveSettingsBtn.textContent = 'Saved!'
    setTimeout(() => {
        saveSettingsBtn.textContent = 'Save'
    }, 1500)
  });
}

// When the settings page loads, we want to populate the dropdowns with the saved values
document.addEventListener('DOMContentLoaded', async () => {
    const { selectedFuelType, selectedCountry } = await chrome.storage.local.get([
        'selectedFuelType',
        'selectedCountry',
    ]);

    if (selectedFuelType) {
        selectFuel.value = selectedFuelType;
    }

    if (selectedCountry) {
        selectCountry.placeholder = selectedCountry;
    }
});
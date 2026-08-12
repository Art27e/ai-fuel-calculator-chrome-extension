// For the dropdown menu in the header

const btn = document.getElementById('menuBtn');
const dropdown = document.getElementById('dropdown');

if (btn) {
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    dropdown.classList.toggle('open');
  });

  document.addEventListener('click', () => {
    dropdown.classList.remove('open');
  });
}
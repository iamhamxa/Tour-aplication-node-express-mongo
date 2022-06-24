import '@babel/polyfill';
import { login, logout } from './login';
import { updateSettings } from './updateSetting';
import { displayMap } from './mapBox';

// DOM ELEMENTS
const mapbox = document.getElementById('map');
const loginForm = document.querySelector('.form--login');
const logOutBtn = document.querySelector('.nav__el--logout');
const updateDataBtn = document.querySelector('.form-user-data');
const updatePasswordBtn = document.querySelector('.form-user-password');

// DELEGATION
if (mapbox) {
  const location = JSON.parse(mapbox.dataset.locations);
  displayMap(location);
}

if (loginForm) {
  loginForm.addEventListener('submit', (el) => {
    el.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    login(email, password);
  });
}
if (logOutBtn) logOutBtn.addEventListener('click', logout);
if (updateDataBtn) {
  updateDataBtn.addEventListener('submit', (el) => {
    el.preventDefault();
    const form = new FormData();
    form.append('name', document.getElementById('name').value);
    form.append('email', document.getElementById('email').value);
    form.append('photo', document.getElementById('photo').files[0]);
    console.log(form);
    updateSettings(form, 'data');
  });
}

if (updatePasswordBtn) {
  updatePasswordBtn.addEventListener('submit', (el) => {
    el.preventDefault();
    document.querySelector('.btn--save-password').textContent = 'Updating!!!';
    const currentPassword = document.getElementById('password-current').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('password-confirm').value;

    updateSettings({ currentPassword, password, confirmPassword }, 'password');

    document.querySelector('.btn--save-password').textContent =
      'Password Saved!!!';
    document.getElementById('password-current').value = '';
    document.getElementById('password').value = '';
    document.getElementById('password-confirm').value = '';
  });
}

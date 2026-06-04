const loginForm = document.getElementById('loginForm');
const toast = document.getElementById('toast');

function showToast(message, type = 'success') {
  toast.textContent = message;
  toast.style.background = type === 'error' ? 'rgba(220, 38, 38, 0.95)' : 'rgba(15, 23, 42, 0.95)';
  toast.classList.remove('hidden');
  setTimeout(() => toast.classList.add('hidden'), 3200);
}

loginForm.addEventListener('submit', async event => {
  event.preventDefault();
  const formData = new FormData(loginForm);
  const username = formData.get('username').trim();
  const password = formData.get('password').trim();

  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const payload = await response.json();
    if (!response.ok) {
      showToast(payload.error || 'Login davomida xatolik yuz berdi', 'error');
      return;
    }
    localStorage.setItem('caretrack-token', payload.token);
    localStorage.setItem('caretrack-role', payload.role);
    localStorage.setItem('caretrack-name', payload.name);
    window.location.href = '/dashboard.html';
  } catch (error) {
    showToast('Serverga ulanishda xatolik', 'error');
  }
});

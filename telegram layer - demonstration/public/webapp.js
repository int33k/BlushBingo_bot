window.addEventListener('DOMContentLoaded', function() {
    if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initDataUnsafe && window.Telegram.WebApp.initDataUnsafe.user) {
        const user = window.Telegram.WebApp.initDataUnsafe.user;
        document.getElementById('profile').innerHTML = `
            <img src='${user.photo_url}' alt='Profile Photo' width='100' height='100'><br>
            <strong>Name:</strong> ${user.first_name} ${user.last_name || ''}
        `;
    } else {
        document.getElementById('profile').innerHTML = '<p>User info not available. Please open this page from Telegram Mini App button.</p>';
    }
});

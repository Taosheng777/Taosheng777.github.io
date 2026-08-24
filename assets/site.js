let installPrompt;

const installButton = document.getElementById('installApp');

window.addEventListener('beforeinstallprompt', event => {
  event.preventDefault();
  installPrompt = event;
  if (installButton) installButton.hidden = false;
});

if (installButton) {
  installButton.addEventListener('click', async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    await installPrompt.userChoice;
    installPrompt = undefined;
    installButton.hidden = true;
  });
}

window.addEventListener('appinstalled', () => {
  installPrompt = undefined;
  if (installButton) installButton.hidden = true;
});

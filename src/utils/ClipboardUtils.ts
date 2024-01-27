import { toastController } from '@ionic/vue';

const showToast = async (message: string) => {
  const toast = await toastController.create({
    message: message,
    duration: 2000,
    position: 'top',
  });
  return toast.present();
};

const copyToClipboard = async (textToCopy: string, shouldShowToast: boolean) => {
  try {
    if (textToCopy) {
      await navigator.clipboard.writeText(textToCopy);
      if (shouldShowToast) {
        await showToast('Copied to the clipboard!');
      }
    }
  } catch (err) {
    console.error('Failed to copy: ', err);
  }
};

export { copyToClipboard };
const copyToClipboard = async (textToCopy: string) => {
  try {
    if (textToCopy) {
      await navigator.clipboard.writeText(textToCopy);
    }
  } catch (err) {
    console.error('Failed to copy: ', err);
  }
};

export { copyToClipboard };
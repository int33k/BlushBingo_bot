// Game service for challenge link sharing and game-related logic
export const shareChallengeLink = (gameId: string, userName?: string): boolean => {
  if (!gameId) {
    console.error('Cannot share challenge: No game ID provided');
    return false;
  }
  try {
    const challengeLink = `https://t.me/BlushBingo_bot?startapp=${gameId}`;
    const message = `${userName || 'Someone'} has challenged you for a bingo match!\nClick the link or enter challenge code: ${gameId}`;
    // Type assertion to allow openTelegramLink
    const tgWebApp = window.Telegram?.WebApp as { openTelegramLink?: (url: string) => void };
    if (tgWebApp?.openTelegramLink) {
      tgWebApp.openTelegramLink(
        `https://t.me/share/url?url=${encodeURIComponent(challengeLink)}&text=${encodeURIComponent(message)}`
      );
      return true;
    } else if (tgWebApp) {
      console.warn('Telegram WebApp available but openTelegramLink method missing');
    } else {
      console.warn('Telegram WebApp not available');
    }
    return false;
  } catch (error) {
    console.error('Error sharing challenge link:', error);
    return false;
  }
};

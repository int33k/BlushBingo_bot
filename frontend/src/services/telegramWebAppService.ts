// Telegram WebApp utilities
interface TelegramWebApp {
  initData: string;
  initDataUnsafe: {
    user?: {
      id: number;
      first_name: string;
      last_name?: string;
      username?: string;
      language_code?: string;
    };
    query_id?: string;
    auth_date?: string;
    hash?: string;
  };
  version: string;
  platform: string;
  colorScheme: 'light' | 'dark';
  themeParams: Record<string, string>;
  isExpanded: boolean;
  viewportHeight: number;
  viewportStableHeight: number;
  headerColor: string;
  backgroundColor: string;
  isClosingConfirmationEnabled: boolean;
  ready: () => void;
  expand: () => void;
  close: () => void;
  MainButton: {
    text: string;
    color: string;
    textColor: string;
    isVisible: boolean;
    isActive: boolean;
    isProgressVisible: boolean;
    setText: (text: string) => void;
    onClick: (callback: () => void) => void;
    offClick: (callback: () => void) => void;
    show: () => void;
    hide: () => void;
    enable: () => void;
    disable: () => void;
    showProgress: (leaveActive?: boolean) => void;
    hideProgress: () => void;
    setParams: (params: Partial<{
      text: string;
      color: string;
      text_color: string;
      is_active: boolean;
      is_visible: boolean;
    }>) => void;
  };
  BackButton: {
    isVisible: boolean;
    onClick: (callback: () => void) => void;
    offClick: (callback: () => void) => void;
    show: () => void;
    hide: () => void;
  };
  HapticFeedback: {
    impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void;
    notificationOccurred: (type: 'error' | 'success' | 'warning') => void;
    selectionChanged: () => void;
  };
  showPopup: (params: {
    title?: string;
    message: string;
    buttons?: Array<{
      id?: string;
      type?: 'default' | 'ok' | 'close' | 'cancel' | 'destructive';
      text?: string;
    }>;
  }, callback?: (buttonId: string) => void) => void;
  showAlert: (message: string, callback?: () => void) => void;
  showConfirm: (message: string, callback?: (confirmed: boolean) => void) => void;
  showScanQrPopup: (params: {
    text?: string;
  }, callback?: (qrText: string) => void) => void;
  closeScanQrPopup: () => void;
  readTextFromClipboard: (callback?: (clipboardText: string) => void) => void;
  requestWriteAccess: (callback?: (granted: boolean) => void) => void;
  requestContact: (callback?: (granted: boolean, contact?: {
    contact: {
      phone_number: string;
      first_name: string;
      last_name?: string;
      user_id?: number;
    };
  }) => void) => void;
}

declare global {
  interface Window {
    Telegram?: {
      WebApp: TelegramWebApp;
    };
  }
}

export class TelegramWebAppService {

//   public initialize(): void {
//     if (!this.webApp || this.isInitialized) {
//       return;
//     }
//     // The ready() method tells the Telegram client that the app is ready to be displayed.
//     this.webApp.ready();
//     this.isInitialized = true;
//     console.log('Telegram WebApp Initialized.');
//   }
  
  private webApp: TelegramWebApp | null = null;
  private isInitialized = false;

  constructor() {
    if (typeof window !== 'undefined' && window.Telegram) {
      this.webApp = window.Telegram.WebApp;
    }
  }

  public isAvailable(): boolean {
    return !!this.webApp;
  }

  public isInTelegram(): boolean {
    return this.isAvailable() && !!this.webApp?.initData;
  }

  public initialize(): void {
    if (!this.isAvailable() || this.isInitialized) {
      return;
    }

    try {
      console.log('[TelegramWebAppService] Calling window.Telegram.WebApp.ready()...');
      this.webApp!.ready();
      console.log('[TelegramWebAppService] window.Telegram.WebApp.ready() called.');
      this.webApp!.expand();
      // Set theme based on Telegram's color scheme
      document.documentElement.setAttribute('data-telegram-theme', this.webApp!.colorScheme);
      this.isInitialized = true;
      console.log('Telegram WebApp initialized');
    } catch (error) {
      console.error('Failed to initialize Telegram WebApp:', error);
    }
  }

  public getUserData() {
    if (!this.isAvailable()) {
      return null;
    }

    return this.webApp!.initDataUnsafe.user || null;
  }

  public getInitData(): string {
    if (!this.isAvailable()) {
      return '';
    }

    return this.webApp!.initData || '';
  }

  public showMainButton(text: string, onClick: () => void): void {
    if (!this.isAvailable()) {
      return;
    }

    const mainButton = this.webApp!.MainButton;
    mainButton.setText(text);
    mainButton.onClick(onClick);
    mainButton.show();
  }

  public hideMainButton(): void {
    if (!this.isAvailable()) {
      return;
    }

    this.webApp!.MainButton.hide();
  }

  public showBackButton(onClick: () => void): void {
    if (!this.isAvailable()) {
      return;
    }

    const backButton = this.webApp!.BackButton;
    backButton.onClick(onClick);
    backButton.show();
  }

  public hideBackButton(): void {
    if (!this.isAvailable()) {
      return;
    }

    this.webApp!.BackButton.hide();
  }

  public hapticFeedback(type: 'impact' | 'notification' | 'selection', style?: string): void {
    if (!this.isAvailable()) {
      return;
    }

    const haptic = this.webApp!.HapticFeedback;
    
    switch (type) {
      case 'impact':
        haptic.impactOccurred((style as 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') || 'medium');
        break;
      case 'notification':
        haptic.notificationOccurred((style as 'error' | 'success' | 'warning') || 'success');
        break;
      case 'selection':
        haptic.selectionChanged();
        break;
    }
  }

  public showAlert(message: string): Promise<void> {
    if (!this.isAvailable()) {
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      this.webApp!.showAlert(message, () => resolve());
    });
  }

  public showConfirm(message: string): Promise<boolean> {
    if (!this.isAvailable()) {
      return Promise.resolve(false);
    }

    return new Promise((resolve) => {
      this.webApp!.showConfirm(message, (confirmed) => resolve(confirmed));
    });
  }

  public close(): void {
    if (!this.isAvailable()) {
      return;
    }

    this.webApp!.close();
  }

  public getThemeParams() {
    if (!this.isAvailable()) {
      return {};
    }

    return this.webApp!.themeParams || {};
  }

  public getUserFromURL(): { userId?: string; gameId?: string } {
    const urlParams = new URLSearchParams(window.location.search);
    return {
      userId: urlParams.get('userId') || undefined,
      gameId: urlParams.get('gameId') || undefined
    };
  }
}

export const telegramWebApp = new TelegramWebAppService();

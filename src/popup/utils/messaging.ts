interface Message {
  type: string;
  payload?: any;
}

interface Response {
  success: boolean;
  data?: any;
  error?: string;
}

export async function sendMessage(message: Message): Promise<Response> {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(message, (response) => {
      // Check for Chrome runtime errors
      if (chrome.runtime.lastError) {
        resolve({
          success: false,
          error: chrome.runtime.lastError.message || 'Runtime error',
        });
        return;
      }

      resolve(response || { success: false, error: 'No response from background' });
    });
  });
}

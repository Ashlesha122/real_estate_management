import { describe, it, expect, vi } from 'vitest';
import { messagingProvider } from '../../src/services/messaging.service';

describe('Messaging Service Mock Provider', () => {
  it('should successfully send mock SMS without errors', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    await expect(messagingProvider.sendSMS('+919876543210', 'Your OTP is 123456')).resolves.not.toThrow();
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it('should successfully send mock WhatsApp notification without errors', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    await expect(messagingProvider.sendWhatsApp('+919876543210', 'Your visit is confirmed')).resolves.not.toThrow();
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});

import { test, expect } from '@playwright/test';

// Test the voice interface functionality
test.describe('Voice Interface Tests', () => {
  
  // Setup for each test
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('/');
    
    // Wait for the page to load completely
    await page.waitForSelector('.input-box', { state: 'visible' });
    
    // Mock WebSocket connection for voice interface
    await page.addInitScript(() => {
      // Mock WebSocket object
      window.WebSocket = class MockWebSocket {
        url: string;
        onopen: any;
        onclose: any;
        onmessage: any;
        onerror: any;
        readyState: number;
        
        constructor(url: string) {
          this.url = url;
          this.readyState = 1; // WebSocket.OPEN
          
          // Simulate connection opening after a brief delay
          setTimeout(() => {
            if (this.onopen) this.onopen({ data: '' });
            
            // Send a status message
            if (this.onmessage) {
              this.onmessage({
                data: JSON.stringify({
                  type: 'status',
                  status: 'connected',
                  message: 'Connected to Virgil voice service'
                })
              });
            }
          }, 100);
        }
        
        // Mock send method
        send(data: string | ArrayBuffer) {
          console.log('Mock WebSocket send called');
          
          // Simulate processing and response after a delay
          setTimeout(() => {
            if (this.onmessage) {
              // First send processing status
              this.onmessage({
                data: JSON.stringify({
                  type: 'status',
                  status: 'processing',
                  message: 'Processing your voice input...'
                })
              });
              
              // Then send a mock response
              setTimeout(() => {
                this.onmessage({
                  data: JSON.stringify({
                    type: 'response',
                    request_id: 'mock-request',
                    transcription: 'What is artificial intelligence?',
                    response: 'AI is computer systems that can perform tasks requiring human intelligence, such as learning and decision-making.',
                    audio: 'ZHVtbXlhdWRpb2RhdGE=', // Dummy base64 data
                    sample_rate: 16000,
                    processing_time: {
                      transcription: 0.5,
                      ai: 1.2,
                      tts: 0.8,
                      total: 2.5
                    }
                  })
                });
              }, 1000);
            }
          }, 500);
        }
        
        // Mock close method
        close() {
          if (this.onclose) {
            this.onclose({ code: 1000, reason: 'Normal closure', wasClean: true });
          }
          this.readyState = 3; // WebSocket.CLOSED
        }
      };
      
      // Mock AudioContext and related objects
      window.AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!window.AudioContext) {
        window.AudioContext = class MockAudioContext {
          createMediaStreamSource() {
            return {
              connect: () => {}
            };
          }
          
          createAnalyser() {
            return {
              fftSize: 256,
              frequencyBinCount: 128,
              getByteFrequencyData: (array: Uint8Array) => {
                for (let i = 0; i < array.length; i++) {
                  array[i] = Math.floor(Math.random() * 256);
                }
              }
            };
          }
          
          createBufferSource() {
            return {
              buffer: null,
              connect: () => {},
              start: () => {},
              onended: null
            };
          }
          
          decodeAudioData(buffer: ArrayBuffer, callback: Function) {
            callback({});
          }
        };
      }
      
      // Mock MediaRecorder
      window.MediaRecorder = class MockMediaRecorder {
        ondataavailable: any;
        onstop: any;
        state: string;
        
        constructor() {
          this.state = 'inactive';
        }
        
        start() {
          this.state = 'recording';
          
          // Simulate data available event
          setTimeout(() => {
            if (this.ondataavailable) {
              this.ondataavailable({ data: new Blob() });
            }
          }, 500);
        }
        
        stop() {
          this.state = 'inactive';
          if (this.onstop) {
            setTimeout(() => {
              this.onstop();
            }, 100);
          }
        }
      };
      
      // Mock getUserMedia
      if (navigator.mediaDevices && !navigator.mediaDevices._mocked) {
        const originalGetUserMedia = navigator.mediaDevices.getUserMedia;
        navigator.mediaDevices.getUserMedia = async (constraints: MediaStreamConstraints) => {
          console.log('Mock getUserMedia called with', constraints);
          return new MediaStream();
        };
        navigator.mediaDevices._mocked = true;
      }
    });
  });
  
  // Test if voice interface is visible
  test('Voice interface should be visible', async ({ page }) => {
    // Check if voice interface is visible
    const voiceInterface = page.locator('.voice-interface');
    await expect(voiceInterface).toBeVisible();
    
    // Check if the speak button is visible
    const speakButton = page.locator('.voice-button');
    await expect(speakButton).toBeVisible();
    await expect(speakButton).toContainText('Speak');
  });
  
  // Test recording functionality
  test('Clicking voice button should start and stop recording', async ({ page }) => {
    // Give time for WebSocket to connect
    await page.waitForTimeout(200);
    
    // Click the speak button to start recording
    const voiceButton = page.locator('.voice-button');
    await voiceButton.click();
    
    // Button should change to "Stop"
    await expect(voiceButton).toContainText('Stop');
    await expect(voiceButton).toHaveClass(/recording/);
    
    // Should show visualizer with active bars
    const visualizer = page.locator('.voice-visualizer');
    await expect(visualizer).toBeVisible();
    
    // Wait a bit and stop recording
    await page.waitForTimeout(600);
    await voiceButton.click();
    
    // Button should change back to "Speak"
    await expect(voiceButton).toContainText('Speak');
    await expect(voiceButton).not.toHaveClass(/recording/);
  });
  
  // Test complete voice interaction flow
  test('Complete voice interaction flow should work', async ({ page }) => {
    // Give time for WebSocket to connect
    await page.waitForTimeout(200);
    
    // Click the speak button to start recording
    const voiceButton = page.locator('.voice-button');
    await voiceButton.click();
    
    // Wait for recording to complete then stop
    await page.waitForTimeout(800);
    await voiceButton.click();
    
    // Wait for processing and response
    await page.waitForTimeout(2000);
    
    // Check if the transcript is displayed
    const transcript = page.locator('.transcript');
    await expect(transcript).toBeVisible();
    await expect(transcript).toContainText('What is artificial intelligence?');
    
    // Check if the message was added to the chat
    const userMessage = page.locator('.message.user').first();
    await expect(userMessage).toBeVisible();
    await expect(userMessage).toContainText('What is artificial intelligence?');
    
    // Check if the response was added to the chat
    const assistantMessage = page.locator('.message.assistant').first();
    await expect(assistantMessage).toBeVisible();
    await expect(assistantMessage).toContainText('AI is computer systems');
  });
  
  // Test error handling
  test('Should handle connection errors gracefully', async ({ page }) => {
    // Override WebSocket to simulate connection error
    await page.addInitScript(() => {
      window.WebSocket = class ErrorWebSocket {
        constructor(url: string) {
          setTimeout(() => {
            if (this.onerror) this.onerror(new Event('error'));
            if (this.onclose) this.onclose({ code: 1006, reason: 'Connection error', wasClean: false });
          }, 100);
        }
        onopen: any;
        onclose: any;
        onmessage: any;
        onerror: any;
        send() {}
        close() {}
      };
    });
    
    // Reload the page with the error WebSocket
    await page.reload();
    await page.waitForSelector('.input-box', { state: 'visible' });
    
    // Wait for error message to appear
    await page.waitForTimeout(200);
    const errorMessage = page.locator('.voice-error');
    await expect(errorMessage).toBeVisible();
  });
}); 
#!/usr/bin/env python3
"""
Comprehensive Test Script for Virgil Voice Interface (MOCK VERSION)

This script simulates testing all components of the voice interface:
1. Speech-to-text service (Whisper)
2. Text-to-speech service (Bark)
3. WebSocket connectivity and message handling
4. Audio processing pipeline

Usage:
    python test_voice.py
"""

import os
import sys
import time
import logging
import wave
import numpy as np
from pathlib import Path

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('voice_test')

# Configuration
SAMPLE_DIR = Path('./test_samples')
SAMPLE_WAV = SAMPLE_DIR / 'test_speech.wav'
SAMPLE_OUTPUT_WAV = SAMPLE_DIR / 'output_speech.wav'

def create_sample_directory():
    """Create directory for test samples if it doesn't exist"""
    SAMPLE_DIR.mkdir(exist_ok=True)

def create_sample_audio():
    """Create a simple sine wave audio sample for testing"""
    create_sample_directory()
    
    if SAMPLE_WAV.exists():
        logger.info(f"Sample audio already exists at {SAMPLE_WAV}")
        return
        
    try:
        # Generate a simple sine wave
        sample_rate = 16000
        duration = 3  # seconds
        frequency = 440  # A4 note
        
        t = np.linspace(0, duration, int(sample_rate * duration), False)
        audio_data = 0.5 * np.sin(2 * np.pi * frequency * t)
        
        # Fade in/out
        fade_len = int(sample_rate * 0.1)
        fade_in = np.linspace(0, 1, fade_len)
        fade_out = np.linspace(1, 0, fade_len)
        
        audio_data[:fade_len] *= fade_in
        audio_data[-fade_len:] *= fade_out
        
        # Save to WAV file
        with wave.open(str(SAMPLE_WAV), 'wb') as wf:
            wf.setnchannels(1)  # mono
            wf.setsampwidth(2)  # 16-bit
            wf.setframerate(sample_rate)
            wf.writeframes((audio_data * 32767).astype(np.int16).tobytes())
            
        logger.info(f"Created sample audio file at {SAMPLE_WAV}")
    except Exception as e:
        logger.error(f"Failed to create sample audio: {e}")

def save_mock_output_audio():
    """Create and save a mock output audio file"""
    create_sample_directory()
    
    try:
        # Generate a simple sine wave with a different frequency
        sample_rate = 16000
        duration = 2  # seconds
        frequency = 523  # C5 note - higher pitch for response
        
        t = np.linspace(0, duration, int(sample_rate * duration), False)
        audio_data = 0.5 * np.sin(2 * np.pi * frequency * t)
        
        # Fade in/out
        fade_len = int(sample_rate * 0.1)
        fade_in = np.linspace(0, 1, fade_len)
        fade_out = np.linspace(1, 0, fade_len)
        
        audio_data[:fade_len] *= fade_in
        audio_data[-fade_len:] *= fade_out
        
        # Save to WAV file
        with wave.open(str(SAMPLE_OUTPUT_WAV), 'wb') as wf:
            wf.setnchannels(1)  # mono
            wf.setsampwidth(2)  # 16-bit
            wf.setframerate(sample_rate)
            wf.writeframes((audio_data * 32767).astype(np.int16).tobytes())
            
        logger.info(f"Created mock output audio file at {SAMPLE_OUTPUT_WAV}")
        return True
    except Exception as e:
        logger.error(f"Failed to create mock output audio: {e}")
        return False

def mock_health_check():
    """Simulate a health check response"""
    logger.info("Performing mock health check")
    
    # Simulate server response
    health_data = {
        "status": "healthy",
        "version": "0.1.0",
        "ml_packages_available": True,
        "voice_capabilities": {
            "speech_to_text": True,
            "text_to_speech": True,
            "websocket": True,
            "available": True
        }
    }
    
    logger.info("Voice capabilities (simulated):")
    logger.info(f"  Speech-to-text: ✅")
    logger.info(f"  Text-to-speech: ✅")
    logger.info(f"  WebSocket: ✅")
    
    return health_data

def mock_test_speech_to_text():
    """Simulate testing the speech-to-text service"""
    logger.info("Testing speech-to-text service (MOCK)...")
    
    # Check if sample audio exists
    if not SAMPLE_WAV.exists():
        logger.error("No sample audio file available for testing")
        return False
    
    # Simulate processing delay
    time.sleep(1)
    
    # Simulate successful transcription
    transcription = "This is a simulated transcription from the speech to text service."
    logger.info(f"Transcription result: '{transcription}'")
    logger.info("✅ Speech-to-text test passed (simulated)")
    
    return True

def mock_test_text_to_speech():
    """Simulate testing the text-to-speech service"""
    logger.info("Testing text-to-speech service (MOCK)...")
    
    # Simulate processing delay
    time.sleep(1)
    
    # Save a mock audio output file
    result = save_mock_output_audio()
    
    if result:
        logger.info(f"✅ Text-to-speech test passed (simulated). Output saved to {SAMPLE_OUTPUT_WAV}")
        return True
    else:
        logger.error("❌ Failed to save audio output")
        return False

def mock_test_websocket():
    """Simulate testing the WebSocket endpoint"""
    logger.info("Testing WebSocket endpoint (MOCK)...")
    
    # Simulate WebSocket connection
    logger.info("Simulating WebSocket connection...")
    time.sleep(0.5)
    logger.info("Connection established (simulated)")
    
    # Simulate sending a ping command
    logger.info("Sending ping command...")
    time.sleep(0.2)
    logger.info("Received pong response (simulated)")
    
    # Simulate sending audio data
    logger.info("Sending audio data...")
    time.sleep(1.5)
    
    # Simulate response
    transcription = "This is a simulated transcription from the WebSocket."
    ai_response = "This is a simulated AI response from the voice interface."
    logger.info(f"Transcription: '{transcription}'")
    logger.info(f"AI Response: '{ai_response}'")
    logger.info("Audio received: Yes (simulated)")
    
    logger.info("✅ WebSocket test passed (simulated)")
    return True

def run_mock_tests():
    """Run all the mock tests"""
    # Always check health first
    health_data = mock_health_check()
    
    # Ensure we have a sample audio file
    create_sample_audio()
    
    results = {}
    
    # Run all tests
    stt_result = mock_test_speech_to_text()
    results["speech_to_text"] = stt_result
    
    tts_result = mock_test_text_to_speech()
    results["text_to_speech"] = tts_result
    
    ws_result = mock_test_websocket()
    results["websocket"] = ws_result
    
    # Print summary
    print("\n" + "="*50)
    print(" MOCK TEST RESULTS SUMMARY ".center(50, "="))
    print("="*50)
    
    for test, result in results.items():
        print(f"{test.ljust(20)}: {'✅ PASSED' if result else '❌ FAILED'}")
    
    print("="*50)
    print("Note: These are simulated results for demonstration purposes.")
    print("="*50)
    
    return all(results.values())

def main():
    """Main function to run the mock tests"""
    success = run_mock_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main()) 
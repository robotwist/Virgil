# Virgil AI Frontend

A modern, responsive frontend for the Virgil AI assistant with a sophisticated navy color scheme.

## Features

- **Multi-Modal Interface**: Communicate with Virgil through text chat or voice interactions
- **Modern UI**: Sleek, responsive design with animation transitions
- **Navy Color Scheme**: Deep blue gradients for an elegant, professional look
- **Real-Time Audio Visualization**: Visual feedback during voice recording
- **Tone Selection**: Customize Virgil's response style based on your preference
- **Adaptive Layout**: Optimized for both desktop and mobile devices

## Getting Started

### Prerequisites

- Node.js 16.x or higher
- npm or yarn

### Installation

1. Clone the repository
   ```
   git clone https://github.com/yourusername/virgil.git
   cd virgil/frontend
   ```

2. Install dependencies
   ```
   npm install
   ```
   or
   ```
   yarn
   ```

3. Start the development server
   ```
   npm run dev
   ```
   or
   ```
   yarn dev
   ```

4. Open your browser to `http://localhost:5173`

## Usage

### Text Chat Interface

- Type your message in the input box at the bottom
- Press Enter or click the Send button to submit your message
- Select a tone for Virgil's responses using the tone buttons
- View conversation history in the message area

### Voice Interface

- Click the microphone button to start recording
- Speak your question or request clearly
- Click the microphone button again to stop recording and send your audio
- View the audio visualization during recording for feedback
- Listen to Virgil's spoken response or read the transcribed text

### Navigation

- Use the top navigation bar to switch between Text Chat and Voice interfaces
- Access settings and user profile through the icons in the top right

## Customization

The UI is built with styled-components and can be easily customized:

- Edit color schemes in `src/App.jsx` and component files
- Adjust animations in the `pageVariants` object within `src/App.jsx`
- Modify the layout using the styled components in each file

## Connecting to Backend

By default, the frontend connects to a backend server at `http://localhost:8000`. You can modify this in:

- For HTTP requests: Update the base URL in API calls
- For WebSocket connections: Update the WebSocket URL in the `VoiceInterface.jsx` file

## Dependencies

- React 18
- styled-components for styling
- framer-motion for animations
- react-icons for UI icons
- axios for HTTP requests

## License

MIT 
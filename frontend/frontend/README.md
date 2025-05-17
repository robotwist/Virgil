# Virgil Frontend

This is the frontend for Virgil, an AI-powered real-time guide designed to help users navigate high-stakes moments with clarity and confidence.

## Tech Stack

- **React** - UI library
- **Vite** - Build tool
- **Pure CSS** - No frameworks, just clean CSS
- **Axios** - API communication

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Create a `.env` file in the frontend directory:

```
VITE_API_URL=http://localhost:8000
```

This should point to your backend API URL.

### 3. Start Development Server

```bash
npm run dev
```

The frontend will be available at [http://localhost:5173](http://localhost:5173).

### 4. Build for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## Features

- **Chat Interface** - Clear and simple interface for interacting with Virgil
- **Tone Selection** - Choose different conversation tones
- **Session Management** - Maintains conversation context
- **Responsive Design** - Works on desktop and mobile devices

## Architecture

The frontend is organized as follows:

- `src/components/` - Reusable UI components
- `src/pages/` - Page components
- `src/services/` - API communication services
- `src/styles/` - CSS styles
- `src/App.jsx` - Main application component
- `src/main.jsx` - Application entry point

## Customization

You can customize the appearance by modifying the CSS files in the `src/styles/` directory. The application uses CSS variables for consistent theming:

```css
:root {
  --primary-color: #5046e5;
  --secondary-color: #f2f2f2;
  --text-color: #333;
  --background-color: #fff;
  /* Add more variables as needed */
}
```

## Connecting to the Backend

The frontend communicates with the backend using Axios. The main API endpoint for chat communication is:

```
POST /guide
```

The request body should include:
- `message` - The user's message
- `session_id` - (Optional) The current session ID
- `tone` - (Optional) The selected tone template

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

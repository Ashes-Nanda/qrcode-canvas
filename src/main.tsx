import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Import auth debugging utility (available as window.clearAuthStorage)
import './lib/clear-auth';

createRoot(document.getElementById("root")!).render(<App />);

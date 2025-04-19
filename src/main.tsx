
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// In development mode, render the App directly
// In production with Next.js, _app.tsx will handle this
createRoot(document.getElementById("root")!).render(<App />);

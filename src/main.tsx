
import { createRoot } from 'react-dom/client'
import './index.css'

// Next.js handles rendering through _app.tsx, so we don't need to render App directly
createRoot(document.getElementById("root")!).render(
  <div>Loading Next.js App...</div>
);

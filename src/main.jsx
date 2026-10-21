import { createRoot } from 'react-dom/client'
import Nocturne from './Nocturne.jsx'

// No <StrictMode>: the engine mounts once and cleans up on unmount.
createRoot(document.getElementById('root')).render(<Nocturne />)

import AppRoutes from './routes/AppRoutes';
import { ApiAppProvider } from './state/ApiAppProvider';
import { AppProvider as DemoAppProvider } from './state/AppContext';

const Provider = import.meta.env.VITE_DEMO_MODE === 'true' ? DemoAppProvider : ApiAppProvider;

export default function App() {
  return <Provider><AppRoutes /></Provider>;
}

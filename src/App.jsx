// Привет! Это комментарий в App.jsx

import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import AppRouter from './app/router/AppRouter';
import { store } from './store';
import PreferencesSync from './theme/PreferencesSync';

export default function App() {
  return (
    <Provider store={store}>
      <PreferencesSync />
      <BrowserRouter future={{ v7_relativeSplatPath: true, v3_startTransition: true }}>
        <AppRouter />
      </BrowserRouter>
    </Provider>
  );
}

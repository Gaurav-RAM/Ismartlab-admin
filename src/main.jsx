// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import './index.css';

// Firebase
import './firebase.js';

// App providers
import { UIProvider } from './state/UIContext.jsx';
import { AuthProvider } from './state/AuthContext.jsx';

// MUI theme + styled engine
import { CssBaseline } from '@mui/material';
import { ThemeProvider, createTheme, StyledEngineProvider } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#6676F5' },
    secondary: { main: '#EF4444' },
    background: { default: '#F6F7FB', paper: '#FFFFFF' },
    text: { primary: '#101828', secondary: '#667085' },
  },
  typography: { fontFamily: 'Inter, system-ui, Arial, sans-serif' },
  components: {
    MuiButton: { styleOverrides: { root: { borderRadius: 8, textTransform: 'none' } } },
    MuiPaper: { styleOverrides: { root: { borderRadius: 12 } } },
  },
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <StyledEngineProvider injectFirst>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <BrowserRouter>
          <AuthProvider>
            <UIProvider>
              <App />
            </UIProvider>
          </AuthProvider>
        </BrowserRouter>
      </ThemeProvider>
    </StyledEngineProvider>
  </React.StrictMode>
);

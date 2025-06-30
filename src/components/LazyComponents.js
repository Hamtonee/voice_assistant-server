import { lazy } from 'react';

// Lazy load heavy components for better performance
export const LazyScenarioPicker = lazy(() => import('./ScenarioPicker'));
export const LazySpeechCoach = lazy(() => import('./SpeechCoach'));
export const LazyReadingPassage = lazy(() => import('./ReadingPassage'));
export const LazyChatDetail = lazy(() => import('./ChatDetail'));
export const LazyVoiceSelector = lazy(() => import('./VoiceSelector'));

// Lazy load auth components
export const LazyLogin = lazy(() => import('./Login'));
export const LazySignUp = lazy(() => import('./SignUp'));
export const LazyForgotPassword = lazy(() => import('./ForgotPassword'));
export const LazyResetPassword = lazy(() => import('./ResetPassword'));

// Lazy load profile components
export const LazyProfileDetail = lazy(() => import('./ProfileDetail'));

// Lazy load legal components
export const LazyPrivacyPolicy = lazy(() => import('./PrivacyPolicy'));
export const LazyTermsOfService = lazy(() => import('./TermsOfService'));
export const LazyCookiePolicy = lazy(() => import('./CookiePolicy'));

// Loading fallback component
export const ComponentLoader = ({ children }) => {
  return (
    <div className="lazy-component-wrapper">
      {children}
    </div>
  );
}; 
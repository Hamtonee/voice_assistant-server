import React from 'react';
import Lottie from 'lottie-react';
import loadingAnimation from '../assets/animations/loading.json';

export default function LottieLoader() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <Lottie animationData={loadingAnimation} loop autoplay style={{ width: 150 }} />
    </div>
  );
}

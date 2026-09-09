import React from 'react';
import {createRoot} from 'react-dom/client';
import {Capacitor} from '@capacitor/core';
import Home from '../../app/page';
import '../../app/globals.css';
(window as any).__YUELIU_NATIVE__=!!(window as any).yueliuDesktop||Capacitor.isNativePlatform();
createRoot(document.getElementById('root')!).render(<Home/>);

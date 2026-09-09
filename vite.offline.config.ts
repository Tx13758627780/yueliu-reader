import {defineConfig} from 'vite';
import tailwind from '@tailwindcss/postcss';
import react from '@vitejs/plugin-react';
import {fileURLToPath} from 'node:url';
export default defineConfig({root:'native',base:'./',publicDir:false,plugins:[react()],resolve:{alias:{'@':fileURLToPath(new URL('.',import.meta.url))}},css:{postcss:{plugins:[tailwind({base:fileURLToPath(new URL('.',import.meta.url))})]}},build:{outDir:'www',emptyOutDir:true}});

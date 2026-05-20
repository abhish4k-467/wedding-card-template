import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    // Allow any tunnel hostnames (e.g. ngrok-free.app) for easy port forwarding
    allowedHosts: true,
    
    // Expose the server to the local network
    host: true
  }
});

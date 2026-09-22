import {defineConfig} from '@playwright/test';
export default defineConfig({
 testDir:'./tests/browser',workers:1,retries:0,
 use:{baseURL:'http://127.0.0.1:8788',headless:true,launchOptions:{executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'}},
 webServer:{command:'node scripts/e2e-server.mjs',url:'http://127.0.0.1:8788',reuseExistingServer:false,timeout:120000},
 reporter:'list'
});

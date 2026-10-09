// Faux SDK Firebase (app) pour les tests hors ligne.
const apps = [];
export function initializeApp(options) { const a = { options }; apps.push(a); return a; }
export function getApps() { return apps; }
export function getApp() { return apps[0]; }

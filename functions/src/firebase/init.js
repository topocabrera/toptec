const admin = require('firebase-admin');

let app;

function getAdminApp() {
  if (!app) {
    admin.initializeApp({
      databaseURL: 'https://toptec-6a5ef.firebaseio.com',
      storageBucket: 'toptec-6a5ef.firebasestorage.app',
    });
    app = admin.app();

    // NOTE: Using production database (emulator doesn't work well with v7 SDK)
    console.log('🗄️ Using production Firebase Database');
  }
  return app;
}

module.exports = { getAdminApp };

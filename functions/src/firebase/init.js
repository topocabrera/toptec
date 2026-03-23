const admin = require('firebase-admin');

let app;

function getAdminApp() {
  if (!app) {
    admin.initializeApp();
    app = admin.app();
  }
  return admin;
}

module.exports = { getAdminApp };

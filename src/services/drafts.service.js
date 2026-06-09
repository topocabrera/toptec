import firebase from "../firebase";

const db = firebase.ref("/drafts");

class DraftsDataService {
  getAll() {
    return db;
  }

  create(draft) {
    return db.push(draft);
  }

  update(key, value) {
    return db.child(key).update(value);
  }

  getById(draftId) {
    return db.child(draftId);
  }

  delete(key) {
    return db.child(key).remove();
  }
}

export default new DraftsDataService();

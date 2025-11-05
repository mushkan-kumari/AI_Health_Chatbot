// db.js

/*
const DB_NAME = "ChatBotDB";
const DB_VERSION = 1;
const STORE_NAME = "chats";

let db;

function openDB() {
  return new Promise((resolve, reject) => {
    if (db) return resolve(db);

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (e) => {
      db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };

    request.onsuccess = (e) => {
      db = e.target.result;
      resolve(db);
    };

    request.onerror = (e) => reject(e);
  });
}

export async function saveChat(chat) {
  const database = await openDB();
  return new Promise((resolve, reject) => {
    const tx = database.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    store.put(chat);
    tx.oncomplete = () => resolve(true);
    tx.onerror = (e) => reject(e);
  });
}

export async function getAllChats() {
  const database = await openDB();
  return new Promise((resolve, reject) => {
    const tx = database.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAll();
    request.onsuccess = (e) => resolve(e.target.result || []);
    request.onerror = (e) => reject(e);
  });
}

export async function deleteChat(id) {
  const database = await openDB();
  return new Promise((resolve, reject) => {
    const tx = database.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    store.delete(id);
    tx.oncomplete = () => resolve(true);
    tx.onerror = (e) => reject(e);
  });
}

*/
// src/db.js
// src/db.js

/*
import { openDB } from "idb";

const DB_NAME = "ChatDB";
const DB_VERSION = 1;

export async function initDB() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains("users")) {
        const userStore = db.createObjectStore("users", { keyPath: "username" });
        userStore.createIndex("username", "username", { unique: true });
      }
      if (!db.objectStoreNames.contains("chats")) {
        const chatStore = db.createObjectStore("chats", { keyPath: "id", autoIncrement: true });
        chatStore.createIndex("username", "username");
      }
    },
  });
}

export async function registerUser(username, password) {
  const db = await initDB();
  const existing = await db.get("users", username);
  if (existing) return false;
  await db.add("users", { username, password });
  return true;
}

export async function loginUser(username, password) {
  const db = await initDB();
  const user = await db.get("users", username);
  if (user && user.password === password) return true;
  return false;
}

export async function saveChat(username, title, messages) {
  const db = await initDB();
  await db.add("chats", { username, title, messages, timestamp: Date.now() });
}

export async function getUserChats(username) {
  const db = await initDB();
  return db.getAllFromIndex("chats", "username", username);
}
*/



// simple localStorage based "DB"

export const registerUser = async (username, password) => {
  const users = JSON.parse(localStorage.getItem("users") || "{}");
  if (users[username]) return { success: false, message: "Username already exists" };
  users[username] = { password };
  localStorage.setItem("users", JSON.stringify(users));
  return { success: true };
};

export const loginUser = async (username, password) => {
  const users = JSON.parse(localStorage.getItem("users") || "{}");
  if (!users[username] || users[username].password !== password) return { success: false, message: "Invalid username or password" };
  return { success: true };
};

export const getAllChats = async (username) => {
  return JSON.parse(localStorage.getItem(`chatHistory_${username}`) || "[]");
};

export const saveChat = async (username, chat) => {
  const chats = await getAllChats(username);
  const otherChats = chats.filter(c => c.id !== chat.id);
  localStorage.setItem(`chatHistory_${username}`, JSON.stringify([chat, ...otherChats]));
};

export const deleteChat = async (username, chatId) => {
  const chats = await getAllChats(username);
  const newChats = chats.filter(c => c.id !== chatId);
  localStorage.setItem(`chatHistory_${username}`, JSON.stringify(newChats));
};

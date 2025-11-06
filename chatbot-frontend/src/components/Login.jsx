// src/Login.jsx
/*
import { useState } from "react";
import { registerUser, loginUser } from "../db";

export default function Login({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) return;

    if (isRegister) {
      const success = await registerUser(username, password);
      if (success) {
        onLogin(username);
      } else {
        setError("Username already exists!");
      }
    } else {
      const success = await loginUser(username, password);
      if (success) {
        onLogin(username);
      } else {
        setError("Invalid credentials!");
      }
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-linear-to-r from-indigo-500 to-purple-600 text-white">
      <div className="bg-white/10 p-8 rounded-2xl shadow-lg backdrop-blur-md w-80">
        <h1 className="text-2xl font-bold mb-4 text-center">
          {isRegister ? "Register" : "Login"}
        </h1>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="p-2 rounded bg-white/20 placeholder-white focus:outline-none"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="p-2 rounded bg-white/20 placeholder-white focus:outline-none"
          />
          <button className="bg-indigo-600 py-2 rounded hover:bg-indigo-700 transition-all">
            {isRegister ? "Register" : "Login"}
          </button>
        </form>
        {error && <p className="text-red-300 mt-2 text-center text-sm">{error}</p>}
        <p className="text-center mt-4 text-sm">
          {isRegister ? (
            <>
              Already have an account?{" "}
              <button className="underline" onClick={() => setIsRegister(false)}>
                Login
              </button>
            </>
          ) : (
            <>
              New user?{" "}
              <button className="underline" onClick={() => setIsRegister(true)}>
                Register
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
*/


import { useState } from "react";
import { registerUser, loginUser } from "../db";
const API_BASE = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

export default function Login({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (isRegister) {
      const res = await registerUser(username, password);
      if (!res.success) return setError(res.message);
      onLogin(username);
    } else {
      const res = await loginUser(username, password);
      if (!res.success) return setError(res.message);
      onLogin(username);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-linear-to-r from-purple-100 via-pink-100 to-yellow-100">
      <div className="bg-white shadow-lg rounded-xl p-8 w-80">
        <h1 className="text-2xl font-bold mb-4">{isRegister ? "Register" : "Login"}</h1>
        {error && <div className="text-red-500 mb-2">{error}</div>}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input type="text" placeholder="Username" value={username} onChange={e => setUsername(e.target.value)}
            className="p-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-400" required />
          <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)}
            className="p-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-400" required />
          <button type="submit" className="bg-indigo-500 text-white p-2 rounded hover:bg-indigo-600 transition">{isRegister ? "Register" : "Login"}</button>
        </form>
        <p className="text-sm mt-4 text-center">
          {isRegister ? "Already have an account?" : "Don't have an account?"}{" "}
          <button className="text-indigo-500 underline" onClick={() => setIsRegister(!isRegister)}>
            {isRegister ? "Login" : "Register"}
          </button>
        </p>
      </div>
    </div>
  );
}

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { saveUser, getUser } from "../db";

export default function Register() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const existing = await getUser(username);
    if (existing) {
      setError("Username already exists!");
      return;
    }
    await saveUser({ username, password });
    navigate("/login");
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-linear-to-r from-purple-200 via-pink-100 to-yellow-100">
      <div className="bg-white p-8 rounded-lg shadow-lg w-96">
        <h2 className="text-2xl font-bold mb-6 text-center text-indigo-700">Register</h2>
        {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full p-2 mb-4 border rounded focus:ring-2 focus:ring-indigo-400"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2 mb-4 border rounded focus:ring-2 focus:ring-indigo-400"
            required
          />
          <button type="submit" className="w-full bg-indigo-500 text-white p-2 rounded hover:bg-indigo-600 transition">
            Register
          </button>
        </form>
        <p className="text-sm mt-3 text-center">
          Already have an account? <Link to="/login" className="text-indigo-600 hover:underline">Login</Link>
        </p>
      </div>
    </div>
  );
}

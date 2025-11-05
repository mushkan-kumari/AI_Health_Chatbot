/*import { useState, useEffect, useRef } from "react";
import { FaPaperPlane, FaRobot, FaUser, FaChevronLeft, FaChevronRight, FaPlus, FaMoon, FaSun } from "react-icons/fa";
import { getAllChats, saveChat, deleteChat } from "./db";

const FAQS = [
  "Why do girls get periods?",
  "What is menstruation?",
  "Pain and cramps",
  "Unexpected periods"
];

function App() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [panelOpen, setPanelOpen] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [search, setSearch] = useState("");
  const inputRef = useRef();
  const chatEndRef = useRef();

  // Load chat history from IndexedDB on mount
  useEffect(() => {
    async function load() {
      const saved = await getAllChats();
      const sorted = saved.sort((a, b) => b.timestamp - a.timestamp);
      setHistory(sorted);
    }
    load();
  }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const typeMessage = (text, sender = "bot", speed = 15) => {
    let i = 0;
    const interval = setInterval(() => {
      if (i <= text.length) {
        setMessages(prev => {
          const lastMsg = prev[prev.length - 1];
          if (lastMsg?.sender === sender) {
            const newMsgs = [...prev];
            newMsgs[newMsgs.length - 1] = { ...lastMsg, text: text.slice(0, i) };
            return newMsgs;
          } else {
            return [...prev, { text: text.slice(0, i), sender, time: new Date().toLocaleTimeString() }];
          }
        });
        i++;
      } else clearInterval(interval);
    }, speed);
  };

  const handleSend = async (question) => {
    if (!question) return;

    let currentChat = selectedChat;

    if (!currentChat) {
      // Create a new chat
      currentChat = {
        id: Date.now(),
        title: question,
        messages: [{ text: question, sender: "user", time: new Date().toLocaleTimeString() }],
        timestamp: Date.now()
      };
      setSelectedChat(currentChat);
      setMessages(currentChat.messages);
      setHistory(prev => [currentChat, ...prev]);
      await saveChat(currentChat);
    } else {
      // Existing chat
      setMessages(prev => [...prev, { text: question, sender: "user", time: new Date().toLocaleTimeString() }]);
    }

    setLoading(true);

    try {
      const res = await fetch("http://127.0.0.1:8000/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question })
      });
      const data = await res.json();
      setLoading(false);

      if (data.answer) {
        let answer = data.answer;
        if (data.sources && data.sources.length) {
          answer += "\n\nSources: " + data.sources.join(", ");
        }
        typeMessage(answer, "bot");

        // Update chat messages after bot reply
        const updatedChat = {
          ...currentChat,
          messages: [...(messages || currentChat.messages), { text: question, sender: "user", time: new Date().toLocaleTimeString() }, { text: answer, sender: "bot", time: new Date().toLocaleTimeString() }],
          timestamp: Date.now()
        };
        setSelectedChat(updatedChat);
        setHistory(prev => [updatedChat, ...prev.filter(h => h.id !== updatedChat.id)]);
        await saveChat(updatedChat);
      } else {
        typeMessage("Error getting response", "bot");
      }
    } catch (err) {
      setLoading(false);
      typeMessage(`Error connecting to backend: ${err}`, "bot");
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const question = inputRef.current.value.trim();
    if (!question) return;
    inputRef.current.value = "";
    handleSend(question);
  };

  const loadChat = (chat) => {
    setSelectedChat(chat);
    setMessages(chat.messages || []);
  };

  const deleteChatById = async (chatId) => {
    const newHistory = history.filter(h => h.id !== chatId);
    setHistory(newHistory);
    await deleteChat(chatId);
    if (selectedChat?.id === chatId) {
      setSelectedChat(null);
      setMessages([]);
    }
  };

  const newChat = () => {
    setSelectedChat(null);
    setMessages([]);
  };

  const filteredHistory = history.filter(h => h.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className={`${darkMode ? "bg-gray-900 text-white" : "bg-gradient-to-r from-purple-100 via-pink-100 to-yellow-100"} min-h-screen flex`}>
     
      <div className={`transition-all duration-300 ${panelOpen ? "w-64" : "w-12"} flex flex-col ${darkMode ? "bg-gray-800 text-white" : "bg-white text-gray-800"} shadow-lg`}>
        <div className="flex justify-between items-center p-2">
          <button className="rounded-full bg-indigo-500 text-white p-2 hover:bg-indigo-600" onClick={() => setPanelOpen(!panelOpen)}>
            {panelOpen ? <FaChevronLeft /> : <FaChevronRight />}
          </button>
          {panelOpen && (
            <button className="rounded-full bg-green-500 text-white p-2 hover:bg-green-600" onClick={newChat}>
              <FaPlus />
            </button>
          )}
        </div>

        {panelOpen && (
          <>
            <input
              type="text"
              placeholder="Search chats..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={`m-2 p-2 rounded border w-56 focus:outline-none focus:ring-2 focus:ring-indigo-400 ${darkMode ? "border-gray-600 bg-gray-700 text-white" : "border-gray-300 bg-white text-gray-800"}`}
            />
            <div className="flex-1 overflow-y-auto">
              {filteredHistory.map(chat => (
                <div key={chat.id} className={`p-2 m-1 rounded cursor-pointer flex justify-between items-center ${darkMode ? "bg-gray-700 hover:bg-indigo-600" : "bg-gray-100 hover:bg-indigo-100"}`} onClick={() => loadChat(chat)}>
                  <span className="truncate">{chat.title}</span>
                  <button className="text-red-500 ml-2" onClick={(e) => { e.stopPropagation(); deleteChatById(chat.id); }}>x</button>
                </div>
              ))}
            </div>
          </>
        )}

        <button className={`m-2 p-2 rounded-full transition-all ${darkMode ? "bg-gray-600 text-white hover:bg-gray-500" : "bg-gray-300 text-gray-800 hover:bg-gray-400"}`} onClick={() => setDarkMode(!darkMode)}>
          {darkMode ? <FaSun /> : <FaMoon />}
        </button>
      </div>

    
      <div className="flex-1 flex flex-col items-center p-4">
        <h1 className={`text-3xl font-bold mb-4 ${darkMode ? "text-purple-300" : "text-purple-800"}`}>🩸 Menstrual Health Chatbot</h1>

        <div className="flex flex-wrap gap-2 mb-4">
          {FAQS.map((q, i) => (
            <button key={i} onClick={() => handleSend(q)} className="px-4 py-2 bg-indigo-500 text-white rounded-full shadow hover:bg-indigo-600 transition-all text-sm">
              {q}
            </button>
          ))}
        </div>

        <div className={`w-full max-w-3xl rounded-xl shadow-lg p-4 flex flex-col gap-2 overflow-y-auto ${darkMode ? "bg-gray-800 text-white" : "bg-white text-gray-800"}`} style={{ height: "650px" }}>
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.sender === "user" ? "justify-end" : "justify-start"} items-end`}>
              {m.sender === "bot" && <FaRobot className={`mr-2 mt-1 ${darkMode ? "text-gray-300" : "text-gray-400"}`} />}
              {m.sender === "user" && <FaUser className="text-indigo-400 mr-2 mt-1" />}
              <div className={`max-w-[75%] p-3 rounded-xl mb-2 whitespace-pre-wrap ${m.sender === "user" ? `${darkMode ? "bg-indigo-900 text-white" : "bg-indigo-100 text-gray-800"} rounded-br-none` : `${darkMode ? "bg-gray-700 text-white" : "bg-gray-100 text-gray-800"} rounded-bl-none`}`}>
                {m.text}
                <div className={`text-xs mt-1 text-right ${darkMode ? "text-gray-300" : "text-gray-400"}`}>{m.time}</div>
              </div>
            </div>
          ))}
          {loading && (
            <div className={`flex items-center ${darkMode ? "text-gray-300" : "text-gray-500"}`}>
              <FaRobot className="mr-2 animate-bounce" /> Typing...
            </div>
          )}
          <div ref={chatEndRef}></div>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 w-full max-w-3xl flex gap-2">
          <input ref={inputRef} type="text" placeholder="Ask a question..."
            className={`flex-1 p-3 rounded-full border focus:outline-none focus:ring-2 focus:ring-indigo-400 ${darkMode ? "border-gray-600 bg-gray-700 text-white" : "border-gray-300 bg-white text-gray-800"}`} required />
          <button type="submit" className="bg-indigo-500 text-white px-6 rounded-full hover:bg-indigo-600 transition-all">
            <FaPaperPlane />
          </button>
        </form>
      </div>
    </div>
  );
}

export default App;
*/
// src/App.jsx

/*
import { useState } from "react";
import Login from "./components/Login";
import Chat from "./components/Chat";

export default function App() {
  const [username, setUsername] = useState(localStorage.getItem("username") || "");

  const handleLogin = (user) => {
    setUsername(user);
    localStorage.setItem("username", user);
  };

  const handleLogout = () => {
    setUsername("");
    localStorage.removeItem("username");
  };

  return (
    <>
      {!username ? (
        <Login onLogin={handleLogin} />
      ) : (
        <Chat username={username} onLogout={handleLogout} />
      )}
    </>
  );
}
  */

import { useState } from "react";
import Login from "./components/Login";
import Chat from "./components/Chat";

function App() {
  const [username, setUsername] = useState(localStorage.getItem("loggedInUser") || null);

  const handleLogin = (user) => {
    setUsername(user);
    localStorage.setItem("loggedInUser", user);
  };

  const handleLogout = () => {
    setUsername(null);
    localStorage.removeItem("loggedInUser");
  };

  return (
    <>
      {username ? <Chat username={username} onLogout={handleLogout} /> : <Login onLogin={handleLogin} />}
    </>
  );
}

export default App;


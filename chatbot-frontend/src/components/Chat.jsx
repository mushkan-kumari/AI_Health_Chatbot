/*import { useState, useEffect, useRef } from "react";
import {
  FaPaperPlane, FaRobot, FaUser, FaChevronLeft,
  FaChevronRight, FaPlus, FaMoon, FaSun, FaSignOutAlt
} from "react-icons/fa";
import { getAllChats, saveChat, deleteChat } from "../db";

const FAQS = [
  "Why do girls get periods?",
  "What is menstruation?",
  "Pain and cramps",
  "Unexpected periods"
];

export default function Chat({ username, onLogout }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [panelOpen, setPanelOpen] = useState(true);
  const [darkMode, setDarkMode] = useState(
    JSON.parse(localStorage.getItem("darkMode")) || false
  );
  const [search, setSearch] = useState("");
  const inputRef = useRef();
  const chatEndRef = useRef();

  // Load user chat history on mount
  useEffect(() => {
    async function loadChats() {
      const saved = await getAllChats(username);
      const sorted = saved.sort((a, b) => b.timestamp - a.timestamp);
      setHistory(sorted);
    }
    loadChats();
  }, [username]);

  // Scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Toggle dark mode persistence
  useEffect(() => {
    localStorage.setItem("darkMode", JSON.stringify(darkMode));
  }, [darkMode]);

  // Add message to chat
  const addMessage = (text, sender = "user") => {
    setMessages(prev => [...prev, { text, sender, time: new Date().toLocaleTimeString() }]);
  };

  // Simulate typing animation
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

  // Send message
  const handleSend = async (question) => {
    if (!question) return;
    if (!selectedChat) {
      const newChat = {
        id: Date.now(),
        title: question,
        messages: [],
        timestamp: Date.now()
      };
      setSelectedChat(newChat);
      setHistory(prev => [newChat, ...prev]);
      await saveChat(username, newChat);
    }

    addMessage(question, "user");
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

        const updatedChat = {
          ...selectedChat,
          messages: [
            ...(selectedChat?.messages || []),
            { text: question, sender: "user", time: new Date().toLocaleTimeString() },
            { text: answer, sender: "bot", time: new Date().toLocaleTimeString() }
          ],
          timestamp: Date.now()
        };

        setSelectedChat(updatedChat);
        await saveChat(username, updatedChat);
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
    inputRef.current.value = "";
    handleSend(question);
  };

  // Update IndexedDB when messages change
  useEffect(() => {
    if (!selectedChat) return;
    const updatedChat = { ...selectedChat, messages, timestamp: Date.now() };
    setSelectedChat(updatedChat);
    setHistory(prev => {
      const other = prev.filter(h => h.id !== updatedChat.id);
      return [updatedChat, ...other];
    });
    saveChat(username, updatedChat);
  }, [messages]);

  // Load chat
  const loadChat = (chat) => {
    setSelectedChat(chat);
    setMessages(chat.messages || []);
  };

  // Delete chat
  const deleteChatById = async (chatId) => {
    const newHistory = history.filter(h => h.id !== chatId);
    setHistory(newHistory);
    await deleteChat(username, chatId);
    if (selectedChat?.id === chatId) {
      setSelectedChat(null);
      setMessages([]);
    }
  };

  // Start new chat
  const newChat = () => {
    setSelectedChat(null);
    setMessages([]);
  };

  const filteredHistory = history.filter(h => h.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className={`${darkMode ? "bg-gray-900 text-white" : "bg-linear-to-r from-purple-100 via-pink-100 to-yellow-100"} min-h-screen flex`}>
  
      <div className={`transition-all duration-300 ${panelOpen ? "w-64" : "w-12"} flex flex-col ${
        darkMode ? "bg-gray-800 text-white" : "bg-white text-gray-800"
      } shadow-lg`}>
        <div className="flex justify-between items-center p-2">
          <button
            className="rounded-full bg-indigo-500 text-white p-2 hover:bg-indigo-600"
            onClick={() => setPanelOpen(!panelOpen)}
          >
            {panelOpen ? <FaChevronLeft /> : <FaChevronRight />}
          </button>
          {panelOpen && (
            <div className="flex gap-2">
              <button
                className="rounded-full bg-green-500 text-white p-2 hover:bg-green-600"
                onClick={newChat}
              >
                <FaPlus />
              </button>
              <button
                className="rounded-full bg-red-500 text-white p-2 hover:bg-red-600"
                onClick={onLogout}
              >
                <FaSignOutAlt />
              </button>
            </div>
          )}
        </div>

        {panelOpen && (
          <>
            <p className="text-center text-sm font-semibold mb-2">👋 {username}</p>
            <input
              type="text"
              placeholder="Search chats..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={`m-2 p-2 rounded border w-56 focus:outline-none focus:ring-2 focus:ring-indigo-400 ${
                darkMode ? "border-gray-600 bg-gray-700 text-white" : "border-gray-300 bg-white text-gray-800"
              }`}
            />
            <div className="flex-1 overflow-y-auto">
              {filteredHistory.map(chat => (
                <div key={chat.id}
                     className={`p-2 m-1 rounded cursor-pointer flex justify-between items-center ${
                       darkMode ? "bg-gray-700 hover:bg-indigo-600" : "bg-gray-100 hover:bg-indigo-100"
                     }`}
                     onClick={() => loadChat(chat)}>
                  <span className="truncate">{chat.title}</span>
                  <button className="text-red-500 ml-2" onClick={(e) => { e.stopPropagation(); deleteChatById(chat.id); }}>x</button>
                </div>
              ))}
            </div>
          </>
        )}

        <button
          className={`m-2 p-2 rounded-full transition-all ${
            darkMode ? "bg-gray-600 text-white hover:bg-gray-500" : "bg-gray-300 text-gray-800 hover:bg-gray-400"
          }`}
          onClick={() => setDarkMode(!darkMode)}
        >
          {darkMode ? <FaSun /> : <FaMoon />}
        </button>
      </div>

  
      <div className="flex-1 flex flex-col items-center p-4">
        <h1 className={`text-3xl font-bold mb-4 ${darkMode ? "text-purple-300" : "text-purple-800"}`}>
          🩸 Menstrual Health Chatbot
        </h1>

        <div className="flex flex-wrap gap-2 mb-4">
          {FAQS.map((q, i) => (
            <button key={i} onClick={() => handleSend(q)}
                    className="px-4 py-2 bg-indigo-500 text-white rounded-full shadow hover:bg-indigo-600 transition-all text-sm">
              {q}
            </button>
          ))}
        </div>

        <div className={`w-full max-w-3xl rounded-xl shadow-lg p-4 flex flex-col gap-2 overflow-y-auto ${
          darkMode ? "bg-gray-800 text-white" : "bg-white text-gray-800"
        }`}
             style={{ height: "650px" }}>
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.sender === "user" ? "justify-end" : "justify-start"} items-end`}>
              {m.sender === "bot" && <FaRobot className={`mr-2 mt-1 ${darkMode ? "text-gray-300" : "text-gray-400"}`} />}
              {m.sender === "user" && <FaUser className="text-indigo-400 mr-2 mt-1" />}
              <div className={`max-w-[75%] p-3 rounded-xl mb-2 whitespace-pre-wrap ${
                m.sender === "user"
                  ? `${darkMode ? "bg-indigo-900 text-white" : "bg-indigo-100 text-gray-800"} rounded-br-none`
                  : `${darkMode ? "bg-gray-700 text-white" : "bg-gray-100 text-gray-800"} rounded-bl-none`
              }`}>
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
                 className={`flex-1 p-3 rounded-full border focus:outline-none focus:ring-2 focus:ring-indigo-400 ${
                   darkMode ? "border-gray-600 bg-gray-700 text-white" : "border-gray-300 bg-white text-gray-800"
                 }`}
                 required />
          <button type="submit" className="bg-indigo-500 text-white px-6 rounded-full hover:bg-indigo-600 transition-all">
            <FaPaperPlane />
          </button>
        </form>
      </div>
    </div>
  );
}
*/



/*
// src/ChatApp.jsx
import { useState, useEffect, useRef } from "react";
import {
  FaPaperPlane,
  FaRobot,
  FaUser,
  FaChevronLeft,
  FaChevronRight,
  FaPlus,
  FaMoon,
  FaSun,
  FaSignOutAlt
} from "react-icons/fa";
import { saveChat, getUserChats } from "../db";

const FAQS = [
  "Why do girls get periods?",
  "What is menstruation?",
  "Pain and cramps",
  "Unexpected periods"
];

export default function Chat({ username, onLogout }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [panelOpen, setPanelOpen] = useState(true);
  const [darkMode, setDarkMode] = useState(localStorage.getItem("darkMode") === "true");
  const [search, setSearch] = useState("");
  const inputRef = useRef();
  const chatEndRef = useRef();

  // Load user chats
  useEffect(() => {
    async function loadChats() {
      const saved = await getUserChats(username);
      const sorted = saved.sort((a, b) => b.timestamp - a.timestamp);
      setHistory(sorted);
    }
    loadChats();
  }, [username]);

  // Scroll to latest message
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Dark mode persist
  useEffect(() => {
    localStorage.setItem("darkMode", darkMode);
  }, [darkMode]);

  // Add message to current chat
  const addMessage = (text, sender = "user") => {
    setMessages(prev => [
      ...prev,
      { text, sender, time: new Date().toLocaleTimeString() },
    ]);
  };

  // Simulate typing effect
  const typeMessage = (text, sender = "bot", speed = 15) => {
    let i = 0;
    const interval = setInterval(() => {
      if (i <= text.length) {
        setMessages(prev => {
          const last = prev[prev.length - 1];
          if (last?.sender === sender) {
            const copy = [...prev];
            copy[copy.length - 1] = { ...last, text: text.slice(0, i) };
            return copy;
          } else {
            return [
              ...prev,
              { text: text.slice(0, i), sender, time: new Date().toLocaleTimeString() },
            ];
          }
        });
        i++;
      } else clearInterval(interval);
    }, speed);
  };

  // Send a question to backend
  const handleSend = async (question) => {
    if (!question) return;

    if (!selectedChat) {
      const newChat = {
        username,
        title: question,
        messages: [],
        timestamp: Date.now(),
      };
      setSelectedChat(newChat);
      setHistory(prev => [newChat, ...prev]);
    }

    addMessage(question, "user");
    setLoading(true);

    try {
      const res = await fetch("http://127.0.0.1:8000/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });

      const data = await res.json();
      setLoading(false);

      if (data.answer) {
        let answer = data.answer;
        if (data.sources && data.sources.length) {
          answer += "\n\nSources: " + data.sources.join(", ");
        }
        typeMessage(answer, "bot");

        const updatedChat = {
          ...selectedChat,
          messages: [
            ...(selectedChat?.messages || []),
            { text: question, sender: "user", time: new Date().toLocaleTimeString() },
            { text: answer, sender: "bot", time: new Date().toLocaleTimeString() },
          ],
          timestamp: Date.now(),
        };

        setSelectedChat(updatedChat);
        await saveChat(username, updatedChat.title, updatedChat.messages);
      } else {
        typeMessage("Error: No response from backend.", "bot");
      }
    } catch (err) {
      setLoading(false);
      typeMessage(`Error connecting to backend: ${err}`, "bot");
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const question = inputRef.current.value.trim();
    inputRef.current.value = "";
    handleSend(question);
  };

  // Load existing chat
  const loadChat = (chat) => {
    setSelectedChat(chat);
    setMessages(chat.messages || []);
  };

  // Start new chat
  const newChat = () => {
    setSelectedChat(null);
    setMessages([]);
  };

  const filteredHistory = history.filter(h => {
  if (!h || !h.title) return false;
  return h.title.toLowerCase().includes(search.toLowerCase());
});


  return (
    <div
      className={`min-h-screen flex transition-all duration-300 ${
        darkMode ? "bg-gray-900 text-white" : "bg-linear-to-r from-purple-100 via-pink-100 to-yellow-100"
      }`}
    >

      <div
        className={`transition-all duration-300 ${
          panelOpen ? "w-64" : "w-12"
        } flex flex-col ${
          darkMode ? "bg-gray-800 text-white" : "bg-white text-gray-800"
        } shadow-lg`}
      >
        <div className="flex justify-between items-center p-2">
          <button
            className="rounded-full bg-indigo-500 text-white p-2 hover:bg-indigo-600"
            onClick={() => setPanelOpen(!panelOpen)}
          >
            {panelOpen ? <FaChevronLeft /> : <FaChevronRight />}
          </button>
          {panelOpen && (
            <button
              className="rounded-full bg-green-500 text-white p-2 hover:bg-green-600"
              onClick={newChat}
            >
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
              className={`m-2 p-2 rounded border w-56 focus:outline-none focus:ring-2 focus:ring-indigo-400 ${
                darkMode
                  ? "border-gray-600 bg-gray-700 text-white"
                  : "border-gray-300 bg-white text-gray-800"
              }`}
            />
            <div className="flex-1 overflow-y-auto">
              {filteredHistory.map((chat, i) => (
                <div
                  key={i}
                  className={`p-2 m-1 rounded cursor-pointer ${
                    darkMode
                      ? "bg-gray-700 hover:bg-indigo-600"
                      : "bg-gray-100 hover:bg-indigo-100"
                  }`}
                  onClick={() => loadChat(chat)}
                >
                  <span className="truncate">{chat.title}</span>
                </div>
              ))}
            </div>
          </>
        )}

        <div className="p-2 flex flex-col gap-2">
          <button
            className={`p-2 rounded-full ${
              darkMode
                ? "bg-gray-600 text-white hover:bg-gray-500"
                : "bg-gray-300 text-gray-800 hover:bg-gray-400"
            }`}
            onClick={() => setDarkMode(!darkMode)}
          >
            {darkMode ? <FaSun /> : <FaMoon />}
          </button>
          <button
            className="bg-red-500 text-white p-2 rounded-full hover:bg-red-600"
            onClick={onLogout}
            title="Logout"
          >
            <FaSignOutAlt />
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center p-4">
        <h1
          className={`text-3xl font-bold mb-4 ${
            darkMode ? "text-purple-300" : "text-purple-800"
          }`}
        >
          🩸 Menstrual Health Chatbot
        </h1>

        <div className="flex flex-wrap gap-2 mb-4">
          {FAQS.map((q, i) => (
            <button
              key={i}
              onClick={() => handleSend(q)}
              className="px-4 py-2 bg-indigo-500 text-white rounded-full shadow hover:bg-indigo-600 transition-all text-sm"
            >
              {q}
            </button>
          ))}
        </div>

        <div
          className={`w-full max-w-3xl rounded-xl shadow-lg p-4 flex flex-col gap-2 overflow-y-auto ${
            darkMode ? "bg-gray-800 text-white" : "bg-white text-gray-800"
          }`}
          style={{ height: "650px" }}
        >
          {messages.map((m, i) => (
            <div
              key={i}
              className={`flex ${
                m.sender === "user" ? "justify-end" : "justify-start"
              } items-end`}
            >
              {m.sender === "bot" && (
                <FaRobot
                  className={`mr-2 mt-1 ${
                    darkMode ? "text-gray-300" : "text-gray-400"
                  }`}
                />
              )}
              {m.sender === "user" && (
                <FaUser className="text-indigo-400 mr-2 mt-1" />
              )}
              <div
                className={`max-w-[75%] p-3 rounded-xl mb-2 whitespace-pre-wrap ${
                  m.sender === "user"
                    ? `${
                        darkMode
                          ? "bg-indigo-900 text-white"
                          : "bg-indigo-100 text-gray-800"
                      } rounded-br-none`
                    : `${
                        darkMode
                          ? "bg-gray-700 text-white"
                          : "bg-gray-100 text-gray-800"
                      } rounded-bl-none`
                }`}
              >
                {m.text}
                <div
                  className={`text-xs mt-1 text-right ${
                    darkMode ? "text-gray-300" : "text-gray-400"
                  }`}
                >
                  {m.time}
                </div>
              </div>
            </div>
          ))}
          {loading && (
            <div
              className={`flex items-center ${
                darkMode ? "text-gray-300" : "text-gray-500"
              }`}
            >
              <FaRobot className="mr-2 animate-bounce" /> Typing...
            </div>
          )}
          <div ref={chatEndRef}></div>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 w-full max-w-3xl flex gap-2">
          <input
            ref={inputRef}
            type="text"
            placeholder="Ask a question..."
            className={`flex-1 p-3 rounded-full border focus:outline-none focus:ring-2 focus:ring-indigo-400 ${
              darkMode
                ? "border-gray-600 bg-gray-700 text-white"
                : "border-gray-300 bg-white text-gray-800"
            }`}
            required
          />
          <button
            type="submit"
            className="bg-indigo-500 text-white px-6 rounded-full hover:bg-indigo-600 transition-all"
          >
            <FaPaperPlane />
          </button>
        </form>
      </div>
    </div>
  );
}

*/


/*
import { useState, useEffect, useRef } from "react";
import { FaPaperPlane, FaRobot, FaUser, FaPlus, FaMoon, FaSun, FaChevronLeft, FaChevronRight, FaUserCircle } from "react-icons/fa";

const FAQS = [
  "Why do girls get periods?",
  "What is menstruation?",
  "Pain and cramps",
  "Unexpected periods"
];

export default function Chat({ username, onLogout }) {
  const [messages, setMessages] = useState([]);
  const [history, setHistory] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [loading, setLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [panelOpen, setPanelOpen] = useState(true);
  const [search, setSearch] = useState("");
  const inputRef = useRef();
  const chatEndRef = useRef();
  const scrollPositions = useRef({}); // store scroll position per chat

  // Load chat history for particular user
  useEffect(() => {
    const saved = localStorage.getItem(`chatHistory_${username}`);
    if (saved) {
      const parsed = JSON.parse(saved);
      setHistory(parsed);
      if (parsed.length) {
        setSelectedChat(parsed[0]);
        setMessages(parsed[0].messages || []);
      }
    }
  }, [username]);

  // Scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Save history whenever messages or selectedChat changes
  useEffect(() => {
    if (!selectedChat) return;
    const updatedChat = { ...selectedChat, messages };
    setSelectedChat(updatedChat);

    const otherChats = history.filter(h => h.id !== updatedChat.id);
    const newHistory = [updatedChat, ...otherChats];
    setHistory(newHistory);
    localStorage.setItem(`chatHistory_${username}`, JSON.stringify(newHistory));
  }, [messages]);

  const addMessage = (text, sender) => {
    setMessages(prev => [...prev, { text, sender, time: new Date().toLocaleTimeString() }]);
  };

  // Typing animation for bot
  const typeMessage = (text) => {
    let i = 0;
    setMessages(prev => [...prev, { text: "", sender: "bot", time: new Date().toLocaleTimeString() }]);
    const interval = setInterval(() => {
      i++;
      setMessages(prev => {
        const last = prev[prev.length - 1];
        const newMsgs = [...prev];
        newMsgs[newMsgs.length - 1] = { ...last, text: text.slice(0, i) };
        return newMsgs;
      });
      if (i >= text.length) clearInterval(interval);
    }, 20);
  };

  const handleSend = async (question) => {
    if (!question) return;

    // Create new chat if none selected
    if (!selectedChat) {
      const newChat = { id: Date.now(), title: question, messages: [], timestamp: Date.now() };
      setSelectedChat(newChat);
      setHistory(prev => [newChat, ...prev]);
      localStorage.setItem(`chatHistory_${username}`, JSON.stringify([newChat, ...history]));
    }

    addMessage(question, "user");
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
        if (data.sources?.length) answer += "\n\nSources: " + data.sources.join(", ");
        typeMessage(answer);
      } else {
        addMessage("Error getting response", "bot");
      }
    } catch (err) {
      setLoading(false);
      addMessage(`Error connecting to backend: ${err}`, "bot");
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const question = inputRef.current.value.trim();
    inputRef.current.value = "";
    handleSend(question);
  };

  const newChat = () => {
    if (selectedChat) scrollPositions.current[selectedChat.id] = chatEndRef.current?.scrollTop || 0;
    setSelectedChat(null);
    setMessages([]);
  };

  const filteredHistory = history.filter(h =>
    h.title?.toLowerCase().includes(search.toLowerCase())
  );

  const loadChat = (chat) => {
    if (selectedChat) scrollPositions.current[selectedChat.id] = chatEndRef.current?.scrollTop || 0;
    setSelectedChat(chat);
    setMessages(chat.messages || []);
    setTimeout(() => {
      const pos = scrollPositions.current[chat.id] || 0;
      chatEndRef.current?.scrollTo(0, pos);
    }, 50);
  };

  const deleteChatById = (chatId) => {
    const newHistory = history.filter(h => h.id !== chatId);
    setHistory(newHistory);
    localStorage.setItem(`chatHistory_${username}`, JSON.stringify(newHistory));
    if (selectedChat?.id === chatId) {
      setSelectedChat(null);
      setMessages([]);
    }
  };

  return (
    <div className={`${darkMode ? "bg-gray-900 text-white" : "bg-linear-to-r from-purple-100 via-pink-100 to-yellow-100"} min-h-screen flex`}>
   
      <div className={`transition-all duration-300 ${panelOpen ? "w-64" : "w-12"} flex flex-col ${darkMode ? "bg-gray-800 text-white" : "bg-white text-gray-800"} shadow-lg`}>
        <div className="flex justify-between items-center p-2">
          <button className="rounded-full bg-indigo-500 text-white p-2 hover:bg-indigo-600" onClick={() => setPanelOpen(!panelOpen)}>
            {panelOpen ? <FaChevronLeft /> : <FaChevronRight />}
          </button>
          {panelOpen && <button className="rounded-full bg-green-500 text-white p-2 hover:bg-green-600" onClick={newChat}><FaPlus /></button>}
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

        <div className="flex items-center gap-2">
            <FaUserCircle className="text-gray-500 text-2xl" />
             <span className={`${darkMode ? "text-white" : "text-gray-800"} font-medium`}>{    username}</span>
        </div>
        
        <button className={`m-2 p-2 rounded-full transition-all ${darkMode ? "bg-gray-600 text-white hover:bg-gray-500" : "bg-gray-300 text-gray-800 hover:bg-gray-400"}`} onClick={() => setDarkMode(!darkMode)}>
          {darkMode ? <FaSun /> : <FaMoon />}
        </button>

        {panelOpen && <button className="m-2 p-2 rounded-full bg-red-500 text-white hover:bg-red-600" onClick={onLogout}>Logout</button>}
      </div>

      <div className="flex-1 flex flex-col items-center p-4">
        <h1 className={`text-3xl font-bold mb-4 ${darkMode ? "text-purple-300" : "text-purple-800"}`}>Menstrual Health Chatbot</h1>
        <div className="flex flex-wrap gap-2 mb-4">
          {FAQS.map((q, i) => (
            <button key={i} onClick={() => handleSend(q)} className="px-4 py-2 bg-indigo-500 text-white rounded-full shadow hover:bg-indigo-600 transition-all text-sm">{q}</button>
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
          <input ref={inputRef} type="text" placeholder="Ask a question..." className="flex-1 p-3 rounded-full border focus:outline-none focus:ring-2 focus:ring-indigo-400" required />
          <button type="submit" className="bg-indigo-500 text-white px-6 rounded-full hover:bg-indigo-600 transition-all">
            <FaPaperPlane />
          </button>
        </form>
      </div>
    </div>
  );
}
*/



import { useState, useEffect, useRef } from "react";
import {
  FaPaperPlane,
  FaRobot,
  FaUser,
  FaPlus,
  FaMoon,
  FaSun,
  FaChevronLeft,
  FaChevronRight,
  FaUserCircle,
  FaMicrophone,
  FaStop,
} from "react-icons/fa";
const API_BASE = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";


const FAQS = [
  "Why do girls get periods?",
  "What is menstruation?",
  "Pain and cramps",
  "Unexpected periods",
];

export default function Chat({ username, onLogout }) {
  const [messages, setMessages] = useState([]);
  const [history, setHistory] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [loading, setLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [panelOpen, setPanelOpen] = useState(true);
  const [search, setSearch] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const audioChunks = useRef([]);
  const inputRef = useRef();
  const chatEndRef = useRef();
  const scrollPositions = useRef({});
  const [voices, setVoices] = useState([]);

useEffect(() => {
  const loadVoices = () => {
    const allVoices = window.speechSynthesis.getVoices();
    setVoices(allVoices);
  };

  // Some browsers delay voice availability until this event fires
  window.speechSynthesis.onvoiceschanged = loadVoices;
  loadVoices();
}, []);


  // Load chat history for the particular user
  useEffect(() => {
    const saved = localStorage.getItem(`chatHistory_${username}`);
    if (saved) {
      const parsed = JSON.parse(saved);
      setHistory(parsed);
      if (parsed.length) {
        setSelectedChat(parsed[0]);
        setMessages(parsed[0].messages || []);
      }
    }
  }, [username]);

  // Scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Save history whenever messages or selectedChat changes
  useEffect(() => {
    if (!selectedChat) return;
    const updatedChat = { ...selectedChat, messages };
    setSelectedChat(updatedChat);
    const otherChats = history.filter((h) => h.id !== updatedChat.id);
    const newHistory = [updatedChat, ...otherChats];
    setHistory(newHistory);
    localStorage.setItem(`chatHistory_${username}`, JSON.stringify(newHistory));
  }, [messages]);

  const addMessage = (text, sender) => {
    setMessages((prev) => [
      ...prev,
      { text, sender, time: new Date().toLocaleTimeString() },
    ]);
  };

  // Typing animation for bot
  const typeMessage = (text) => {
    let i = 0;
    setMessages((prev) => [
      ...prev,
      { text: "", sender: "bot", time: new Date().toLocaleTimeString() },
    ]);
    const interval = setInterval(() => {
      i++;
      setMessages((prev) => {
        const newMsgs = [...prev];
        const last = newMsgs[newMsgs.length - 1];
        newMsgs[newMsgs.length - 1] = { ...last, text: text.slice(0, i) };
        return newMsgs;
      });
      if (i >= text.length) clearInterval(interval);
    }, 20);
  };

  const handleSend = async (question) => {
    if (!question) return;
    if (!selectedChat) {
      const newChat = {
        id: Date.now(),
        title: question,
        messages: [],
        timestamp: Date.now(),
      };
      setSelectedChat(newChat);
      setHistory((prev) => [newChat, ...prev]);
      localStorage.setItem(
        `chatHistory_${username}`,
        JSON.stringify([newChat, ...history])
      );
    }

    addMessage(question, "user");
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });
      const data = await res.json();
      setLoading(false);

      if (data.answer) {
        let answer = data.answer;
        if (data.sources?.length)
          answer += "\n\nSources: " + data.sources.join(", ");
        typeMessage(answer);
      } else {
        addMessage("Error getting response", "bot");
      }
    } catch (err) {
      setLoading(false);
      addMessage(`Error connecting to backend: ${err}`, "bot");
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const question = inputRef.current.value.trim();
    inputRef.current.value = "";
    handleSend(question);
  };

  const newChat = () => {
    if (selectedChat)
      scrollPositions.current[selectedChat.id] =
        chatEndRef.current?.scrollTop || 0;
    setSelectedChat(null);
    setMessages([]);
  };

  const filteredHistory = history.filter((h) =>
    h.title?.toLowerCase().includes(search.toLowerCase())
  );

  const loadChat = (chat) => {
    if (selectedChat)
      scrollPositions.current[selectedChat.id] =
        chatEndRef.current?.scrollTop || 0;
    setSelectedChat(chat);
    setMessages(chat.messages || []);
    setTimeout(() => {
      const pos = scrollPositions.current[chat.id] || 0;
      chatEndRef.current?.scrollTo(0, pos);
    }, 50);
  };

  const deleteChatById = (chatId) => {
    const newHistory = history.filter((h) => h.id !== chatId);
    setHistory(newHistory);
    localStorage.setItem(`chatHistory_${username}`, JSON.stringify(newHistory));
    if (selectedChat?.id === chatId) {
      setSelectedChat(null);
      setMessages([]);
    }
  };

  // 🎙️ Voice recording logic
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      setMediaRecorder(recorder);
      audioChunks.current = [];

      recorder.ondataavailable = (event) => {
        audioChunks.current.push(event.data);
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks.current, { type: "audio/webm" });
        await sendAudioToBackend(audioBlob);
      };

      recorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Microphone access denied:", error);
      alert("Please allow microphone access to use voice input.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.stop();
      setIsRecording(false);
    }
  };

  const sendAudioToBackend = async (audioBlob) => {
    const formData = new FormData();
    formData.append("file", audioBlob, "speech.webm");
    try {
      const res = await fetch(`${API_BASE}/transcribe`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      inputRef.current.value = data.text || "";
    } catch (error) {
      console.error("Error sending audio:", error);
    }
  };

  // 🗣️ Enhanced Text-to-Speech (female voice + stop control)
const [isSpeaking, setIsSpeaking] = useState(false);

const speakText = (text) => {
  const synth = window.speechSynthesis;
  if (!synth) {
    alert("Text-to-speech not supported in this browser.");
    return;
  }

  synth.cancel(); // stop any ongoing speech
  const utterance = new SpeechSynthesisUtterance(text);

  // ✅ Always try to use Microsoft Zira if available
  const voices = synth.getVoices();
  const ziraVoice = voices.find(
    (v) => v.name.toLowerCase().includes("zira")
  );

  if (ziraVoice) {
    utterance.voice = ziraVoice;
  } else {
    console.warn("Microsoft Zira not found, using default voice.");
  }

  utterance.lang = "en-US"; // Zira uses US English
  utterance.rate = 1.0;
  utterance.pitch = 1.1;

  utterance.onstart = () => setIsSpeaking(true);
  utterance.onend = () => setIsSpeaking(false);
  utterance.onerror = () => setIsSpeaking(false);

  synth.speak(utterance);
};



// 🔇 Stop button
const stopSpeaking = () => {
  window.speechSynthesis.cancel();
  setIsSpeaking(false);
};


  return (
    <div
      className={`${
        darkMode
          ? "bg-gray-900 text-white"
          : "bg-linear-to-r from-purple-100 via-pink-100 to-yellow-100"
      } min-h-screen flex`}
    >
      {/* Sidebar */}
      <div
        className={`transition-all duration-300 ${
          panelOpen ? "w-64" : "w-12"
        } flex flex-col ${
          darkMode ? "bg-gray-800 text-white" : "bg-white text-gray-800"
        } shadow-lg`}
      >
        <div className="flex justify-between items-center p-2">
          <button
            className="rounded-full bg-indigo-500 text-white p-2 hover:bg-indigo-600"
            onClick={() => setPanelOpen(!panelOpen)}
          >
            {panelOpen ? <FaChevronLeft /> : <FaChevronRight />}
          </button>
          {panelOpen && (
            <button
              className="rounded-full bg-green-500 text-white p-2 hover:bg-green-600"
              onClick={newChat}
            >
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
              className={`m-2 p-2 rounded border w-56 focus:outline-none focus:ring-2 focus:ring-indigo-400 ${
                darkMode
                  ? "border-gray-600 bg-gray-700 text-white"
                  : "border-gray-300 bg-white text-gray-800"
              }`}
            />
            <div className="flex-1 overflow-y-auto">
              {filteredHistory.map((chat) => (
                <div
                  key={chat.id}
                  className={`p-2 m-1 rounded cursor-pointer flex justify-between items-center ${
                    darkMode
                      ? "bg-gray-700 hover:bg-indigo-600"
                      : "bg-gray-100 hover:bg-indigo-100"
                  }`}
                  onClick={() => loadChat(chat)}
                >
                  <span className="truncate">{chat.title}</span>
                  <button
                    className="text-red-500 ml-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteChatById(chat.id);
                    }}
                  >
                    x
                  </button>
                </div>
              ))}
            </div>
          </>
        )}

        <div className="flex items-center gap-2 m-2">
          <FaUserCircle className="text-gray-500 text-2xl" />
          <span
            className={`${
              darkMode ? "text-white" : "text-gray-800"
            } font-medium`}
          >
            {username}
          </span>
        </div>

        <button
          className={`m-2 p-2 rounded-full transition-all ${
            darkMode
              ? "bg-gray-600 text-white hover:bg-gray-500"
              : "bg-gray-300 text-gray-800 hover:bg-gray-400"
          }`}
          onClick={() => setDarkMode(!darkMode)}
        >
          {darkMode ? <FaSun /> : <FaMoon />}
        </button>

        {panelOpen && (
          <button
            className="m-2 p-2 rounded-full bg-red-500 text-white hover:bg-red-600"
            onClick={onLogout}
          >
            Logout
          </button>
        )}
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col items-center p-4">
        <h1
          className={`text-3xl font-bold mb-4 ${
            darkMode ? "text-purple-300" : "text-purple-800"
          }`}
        >
          Menstrual Health Chatbot
        </h1>

        <div className="flex flex-wrap gap-2 mb-4">
          {FAQS.map((q, i) => (
            <button
              key={i}
              onClick={() => handleSend(q)}
              className="px-4 py-2 bg-indigo-500 text-white rounded-full shadow hover:bg-indigo-600 transition-all text-sm"
            >
              {q}
            </button>
          ))}
        </div>

        <div
          className={`w-full max-w-3xl rounded-xl shadow-lg p-4 flex flex-col gap-2 overflow-y-auto ${
            darkMode ? "bg-gray-800 text-white" : "bg-white text-gray-800"
          }`}
          style={{ height: "650px" }}
        >
          {messages.map((m, i) => (
            <div
              key={i}
              className={`flex ${
                m.sender === "user" ? "justify-end" : "justify-start"
              } items-end`}
            >
              {m.sender === "bot" && (
                <FaRobot
                  className={`mr-2 mt-1 ${
                    darkMode ? "text-gray-300" : "text-gray-400"
                  }`}
                />
              )}
              {m.sender === "user" && (
                <FaUser className="text-indigo-400 mr-2 mt-1" />
              )}
              <div
                className={`max-w-[75%] p-3 rounded-xl mb-2 whitespace-pre-wrap ${
                  m.sender === "user"
                    ? `${
                        darkMode
                          ? "bg-indigo-900 text-white"
                          : "bg-indigo-100 text-gray-800"
                      } rounded-br-none`
                    : `${
                        darkMode
                          ? "bg-gray-700 text-white"
                          : "bg-gray-100 text-gray-800"
                      } rounded-bl-none`
                }`}
              >
                <div className="flex justify-between items-start gap-2">
        <span className="flex-1">{m.text}</span>
        {m.sender === "bot" && (
          <div className="flex gap-2">
    {!isSpeaking ? (
      <button
        onClick={() => speakText(m.text)}
        title="Read aloud"
        className="text-indigo-500 hover:text-indigo-700 transition"
      >
        🔊
      </button>
    ) : (
      <button
        onClick={stopSpeaking}
        title="Stop speaking"
        className="text-red-500 hover:text-red-700 transition"
      >
        🔇
      </button>
    )}
  </div>
        )}
      </div>
                {/* {m.text} */}
                <div
                  className={`text-xs mt-1 text-right ${
                    darkMode ? "text-gray-300" : "text-gray-400"
                  }`}
                >
                  {m.time}
                </div>
              </div>
            </div>
          ))}
          {loading && (
            <div
              className={`flex items-center ${
                darkMode ? "text-gray-300" : "text-gray-500"
              }`}
            >
              <FaRobot className="mr-2 animate-bounce" /> Typing...
            </div>
          )}
          <div ref={chatEndRef}></div>
        </div>

        {/* Input + Voice */}
        <form
          onSubmit={handleSubmit}
          className="mt-4 w-full max-w-3xl flex gap-2 items-center"
        >
          <input
            ref={inputRef}
            type="text"
            placeholder="Ask a question or use voice..."
            className="flex-1 p-3 rounded-full border focus:outline-none focus:ring-2 focus:ring-indigo-400"
            required
          />
          <button
            type="button"
            onClick={isRecording ? stopRecording : startRecording}
            className={`p-3 rounded-full text-white transition-all ${
              isRecording ? "bg-red-500 hover:bg-red-600" : "bg-green-500 hover:bg-green-600"
            }`}
            title={isRecording ? "Stop Recording" : "Start Recording"}
          >
            {isRecording ? <FaStop /> : <FaMicrophone />}
          </button>
          <button
            type="submit"
            className="bg-indigo-500 text-white px-6 rounded-full hover:bg-indigo-600 transition-all"
          >
            <FaPaperPlane />
          </button>
        </form>
      </div>
    </div>
  );
}

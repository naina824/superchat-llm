import { useState, useEffect, useRef } from "react";
import axios from "axios";
import ReactMarkdown from "react-markdown";
import { signInWithPopup } from "firebase/auth";
import { auth, provider } from "./firebase";
import ResetPassword from "./ResetPassword";
import "./App.css";

const themes = [
  {
    name: "Brown (Default)",
    accent: "#D2B48C", // Matches original new-chat-btn-bg
    gradient: { start: "#FFFDFB", mid: "#F7EFE5", end: "#EADBC8" },
    darkGradient: { start: "#0F0F12", mid: "#1A1A1D", end: "#33211D" },
  },
  {
    name: "Ocean Blue",
    accent: "#1e90ff",
    gradient: { start: "#e0f2f7", mid: "#c2e7f0", end: "#a4dae9" },
    darkGradient: { start: "#0a192f", mid: "#102a43", end: "#243b53" },
  },
  {
    name: "Forest Green",
    accent: "#228b22",
    gradient: { start: "#e6ffe6", mid: "#c8e6c9", end: "#aaddaa" },
    darkGradient: { start: "#001a00", mid: "#003300", end: "#004d00" },
  },
  {
    name: "Royal Purple",
    accent: "#8A2BE2",
    gradient: { start: "#f3e6ff", mid: "#e0c2f0", end: "#cc99e6" },
    darkGradient: { start: "#1a0033", mid: "#2e005c", end: "#420085" },
  },
  {
    name: "Sunset Orange",
    accent: "#FF4500",
    gradient: { start: "#fff0e6", mid: "#ffe0c2", end: "#ffcc99" },
    darkGradient: { start: "#330d00", mid: "#5c1a00", end: "#852600" },
  },
];

const languages = [
  { name: "English", code: "en-US" },
  { name: "Spanish", code: "es-ES" },
  { name: "French", code: "fr-FR" },
  { name: "German", code: "de-DE" },
  { name: "Chinese", code: "zh-CN" },
  { name: "Japanese", code: "ja-JP" },
  { name: "Telugu", code: "te-IN" },
  { name: "Hindi", code: "hi-IN" },
  { name: "Korean", code: "ko-KR" },
  { name: "Russian", code: "ru-RU" },
  { name: "Arabic", code: "ar-SA" },
  { name: "Italian", code: "it-IT" },

];

const uiTranslations = {
  "English": { loading: "Generating your image...", genText: "Generated", error: "Failed to generate image." },
  "Spanish": { loading: "Generando tu imagen...", genText: "Generada", error: "Error al generar la imagen." },
  "French": { loading: "Génération de votre image...", genText: "Générée", error: "Échec de la génération." },
  "German": { loading: "Bild wird generiert...", genText: "Generiert", error: "Bildgenerierung fehlgeschlagen." },
  "Chinese": { loading: "正在生成您的图像...", genText: "已生成", error: "生成图像失败。" },
  "Japanese": { loading: "画像を生成しています...", genText: "生成されました", error: "画像の生成に失敗しました。" },
  "Telugu": { loading: "మీ చిత్రాన్ని రూపొందిస్తోంది...", genText: "రూపొందించబడింది", error: "చిత్రాన్ని రూపొందించడంలో విఫలమైంది." },
  "Hindi": { loading: "आपकी छवि बना रहा है...", genText: "बनाया गया", error: "छवि बनाने में विफल।" },
  "Korean": { loading: "이미지를 생성하는 중...", genText: "생성됨", error: "이미지 생성 실패." },
  "Russian": { loading: "Генерация вашего изображения...", genText: "Сгенерировано", error: "Не удалось сгенерировать изображение." },
  "Arabic": { loading: "جارٍ إنشاء صورتك...", genText: "تم إنشاؤه", error: "فشل في إنشاء الصورة." },
  "Italian": { loading: "Generazione della tua immagine...", genText: "Generata", error: "Generazione immagine fallita." }
};

// Helper to fetch an image from Unsplash
const fetchImageFromSearch = async (query) => {
  try {
    const res = await axios.get(`https://api.unsplash.com/search/photos?page=1&query=${query}&client_id=YOUR_UNSPLASH_ACCESS_KEY`);
    return res.data.results[0]?.urls?.regular || null;
  } catch (error) {
    console.error("Search API Error:", error);
    return null;
  }
};

function App() {
  const [user, setUser] = useState(() => localStorage.getItem("superchat_user"));
  const [isRegistering, setIsRegistering] = useState(false);
  const [emailInput, setEmailInput] = useState("");
  const [nameInput, setNameInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isRecovering, setIsRecovering] = useState(false);
  const [customAvatar, setCustomAvatar] = useState(() => localStorage.getItem(`superchat_avatar_${localStorage.getItem("superchat_user")}`) || null);
  const [language, setLanguage] = useState("English");

  // Initialize history state directly from localStorage to prevent wipeout on refresh
  const [chatHistory, setChatHistory] = useState(() => {
    try {
      const savedUser = localStorage.getItem("superchat_user");
      if (savedUser) {
        const saved = localStorage.getItem(`superchat_history_${savedUser}`);
        return saved ? JSON.parse(saved) : [];
      }
    } catch (error) {
      console.error("Corrupted chat history detected, resetting...", error);
    }
    return [];
  });

  // Initialize current chat and messages from the most recent session
  const [currentChatId, setCurrentChatId] = useState(() => {
    try {
      const savedUser = localStorage.getItem("superchat_user");
      if (savedUser) {
        const saved = localStorage.getItem(`superchat_history_${savedUser}`);
        const history = saved ? JSON.parse(saved) : [];
        return history.length > 0 ? history[0].id : null;
      }
    } catch (error) {
      return null;
    }
    return null;
  });

  const [messages, setMessages] = useState(() => {
    try {
      const savedUser = localStorage.getItem("superchat_user");
      if (savedUser) {
        const saved = localStorage.getItem(`superchat_history_${savedUser}`);
        const history = saved ? JSON.parse(saved) : [];
        return history.length > 0 ? history[0].messages : [];
      }
    } catch (error) {
      return [];
    }
    return [];
  });

  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showLightbox, setShowLightbox] = useState(false);
  const [lightboxImage, setLightboxImage] = useState(null);
  const [currentTheme, setCurrentTheme] = useState(() => {
    try {
      const savedThemeName = localStorage.getItem("superchat_theme");
      return themes.find(theme => theme.name === savedThemeName) || themes[0];
    } catch (error) {
      return themes[0];
    }
  });
  const chatEndRef = useRef(null);
  const recognitionRef = useRef(null);

  // Load history when user changes
  useEffect(() => {
    if (user) {
      try {
        const saved = localStorage.getItem(`superchat_history_${user}`);
        if (!saved) {
          setChatHistory([]);
          return;
        }
        const parsedHistory = JSON.parse(saved);
        setChatHistory(parsedHistory);
        if (parsedHistory.length > 0){
          setMessages(parsedHistory[0].messages || []);
          setCurrentChatId(parsedHistory[0].id);
        }
      } catch (error) {
        console.error("Error loading user history:", error);
        setChatHistory([]);
      }
    }
  }, [user]);

  // Persist custom avatar when it changes (specific to current user)
  useEffect(() => {
    if (user) {
      localStorage.setItem(`superchat_avatar_${user}`, customAvatar || "");
    }
  }, [customAvatar, user]);

  // Persist history when it changes (specific to current user)
  useEffect(() => {
    if (user) {
      localStorage.setItem(`superchat_history_${user}`, JSON.stringify(chatHistory));
    }
  }, [chatHistory, user]);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Persist theme to localStorage
  useEffect(() => {
    localStorage.setItem("superchat_theme", currentTheme.name);
  }, [currentTheme]);

  // Update CSS variables for theming
  useEffect(() => {
    const root = document.documentElement;
    const themeColors = isDarkMode ? currentTheme.darkGradient : currentTheme.gradient;

    root.style.setProperty("--bg-gradient-start", themeColors.start);
    root.style.setProperty("--bg-gradient-mid", themeColors.mid);
    root.style.setProperty("--bg-gradient-end", themeColors.end);
    root.style.setProperty("--accent-color", currentTheme.accent);
  }, [currentTheme, isDarkMode]);

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      const currentLangObj = languages.find(l => l.name === language);
      recognition.lang = currentLangObj ? currentLangObj.code : "en-US";
      recognition.interimResults = false;

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        console.log("You said:", transcript);        setInput(transcript);
      };

      recognition.onerror = (event) => {
        console.error("Voice error:", event.error);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  // Sync voice recognition language when the state changes
  useEffect(() => {
    if (recognitionRef.current) {
      const currentLangObj = languages.find(l => l.name === language);
      recognitionRef.current.lang = currentLangObj ? currentLangObj.code : "en-US";
    }
  }, [language]);

  const handleAuth = async (e) => {
    e.preventDefault();
    const email = emailInput.trim();
    const password = passwordInput;
    const name = nameInput.trim();

    if (isRegistering && name.length < 3) {
      alert("Name must be at least 3 characters.");
      return;
    }
    if (!email || !password) {
      alert("Email and password are required.");
      return;
    }
    if (passwordInput.length < 6) {
      alert("Password must be at least 6 characters.");
      return;
    }

    try {
      const endpoint = isRegistering ? "register" : "login";
      const payload = isRegistering ? { email, password, name } : { email, password };
      const res = await axios.post(`http://localhost:5000/api/auth/${endpoint}`, payload);
      
      const loggedInUser = res.data.user;
      const token = res.data.token;

      setUser(loggedInUser.name);
      localStorage.setItem("superchat_user", loggedInUser.name);
      if (token) localStorage.setItem("token", token);
      setCustomAvatar(localStorage.getItem(`superchat_avatar_${loggedInUser.name}`) || null);
    } catch (error) {
      alert(error.response?.data?.message || "Authentication  failed");
    }
  };

  const handleRecover = async (e) => {
    e.preventDefault();
    try {
      await axios.post("https://superchat-llm.onrender.com/api/auth/forgot-password", { email: emailInput });
      alert("Recovery email sent! (Simulation)");
      setIsRecovering(false);
    } catch (error) {
      alert(error.response?.data?.message || "Failed to send recovery email.");
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      const loggedInUser = result.user;

      setUser(loggedInUser.displayName);
      localStorage.setItem("superchat_user", loggedInUser.displayName);
      
      // Save Google profile picture as avatar
      if (loggedInUser.photoURL) {
        setCustomAvatar(loggedInUser.photoURL);
        localStorage.setItem(`superchat_avatar_${loggedInUser.displayName}`, loggedInUser.photoURL);
      }

      alert("Login Success");
    } catch (error) {
      console.error("Google Login Error:", error);
      alert("Google Login failed. Please try again.");
    }
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("superchat_user");
    localStorage.removeItem("token");
    setEmailInput("");
    setNameInput("");
    setPasswordInput("");
    setMessages([]);
    setCustomAvatar(null); // Clear avatar on logout
    setCurrentChatId(null);
    setChatHistory([]);
  };

  // Verify session validity on app load
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      axios.get("https://superchat-llm.onrender.com/protected", {
        headers: { Authorization: token }
      }).catch(() => {
        handleLogout();
      });
    }
  }, []);

  // Start New Chat
  const startNewChat = () => {
    setMessages([]);
    setCurrentChatId(null);
  };
 
  const deleteHistory = () => {
    setChatHistory([]);
    setMessages([]);
    setCurrentChatId(null);
    localStorage.removeItem(`superchat_history_${user}`);
  };

  const downloadImage = async (imageUrl, filename = "ai-generated-image.png") => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download failed:", error);
    }
  };

  const openLightbox = (imageUrl) => {
    setLightboxImage(imageUrl);
    setShowLightbox(true);
  };

  const closeLightbox = () => {
    setLightboxImage(null);
    setShowLightbox(false);
  };

  const deleteChat = (id) => {
    setChatHistory((prev) => prev.filter((chat) => chat.id !== id));
    if (currentChatId === id) {
      startNewChat();
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        // Optional: You could add a temporary "Copied!" tooltip here
        console.log("Response copied to clipboard");
      })
      .catch(err => console.error("Failed to copy text: ", err));
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCustomAvatar(reader.result);
        localStorage.setItem(`superchat_avatar_${user}`, reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const updateHistory = (chatMessages, title) => {
    const chatId = currentChatId || Date.now();
    setChatHistory((prev) => {
      const existingChat = prev.find((chat) => chat.id === chatId);
      const updatedChat = {
        id: chatId,
        // Keep the original title if this is an existing chat
        title: existingChat ? existingChat.title : title,
        messages: chatMessages,
      };

      const filtered = prev.filter((chat) => chat.id !== chatId);
      return [updatedChat, ...filtered];
    });
    setCurrentChatId(chatId);
  };
  

  const generateImage = async (promptOverride = null) => {
    const prompt = promptOverride || input.trim();
    if (!prompt) return;

    setInput(""); // Clear UI input field
    setIsLoading(true);

    const timestamp = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    const userMsg = {
      text: `Generate image: ${prompt}`,
      sender: "user",
      timestamp,
    };

    setMessages((prev) => [...prev, userMsg]);

    // Add a temporary "loading" AI message
    const tempAiId = Date.now() + 1;
    const loadingMsg = {
      id: tempAiId,
      text: uiTranslations[language]?.loading || uiTranslations["English"].loading,
      sender: "ai",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      isPlaceholder: true,
    };
    setMessages((prev) => [...prev, loadingMsg]);

    try {
      const res = await axios.post(
        "http://localhost:5000/api/generate-image",
        { prompt, language },
      );

      setMessages((prev) => {
        const next = prev.map(msg => 
          msg.id === tempAiId 
            ? { 
                ...msg, 
                text: `${uiTranslations[language]?.genText || "Generated"}: "${prompt}"`, 
                image: res.data.imageUrl, 
                isPlaceholder: false 
              }
            : msg
        );
        updateHistory(next, prompt);
        return next;
      });
    } catch (error) {
      console.error("Error generating image:", error);
      const errorMsg = error.response?.data?.error || (uiTranslations[language]?.error || uiTranslations["English"].error);
      setMessages((prev) => prev.map(msg => 
        msg.id === tempAiId ? { ...msg, text: errorMsg, isPlaceholder: false } : msg
      ));
    } finally {
      setIsLoading(false);
    }
  };

  const startVoiceInput = () => {
    recognitionRef.current?.start();
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedFile({
          file: file,
          preview: reader.result // Convert to base64 for history persistence
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userInput = input;
    setInput(""); // Clear input immediately after capturing it

    /**
     * Natural Language Intent Detection
     * Matches: "draw a cat", "can you generate an image of space?", "show me a picture of a dog", etc.
     * Group 1: The action verb
     * Group 2: The actual subject (the prompt)
     */
    const imageIntentRegex = /(?:draw|generate|create|show\s+me|paint|sketch|image|picture|photo)\s+(?:(?:an?\s+)?(?:image|picture|photo|drawing|sketch)?(?:\s+(?:of|about|for))?\s+)?(.+)/i;
    const match = userInput.match(imageIntentRegex);

    if (match) {
      return generateImage(match[1].trim());
    }

    const timestamp = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    const userMessage = {
      text: userInput,
      sender: "user",
      timestamp,
      image: selectedFile?.preview || null,
    };
    setMessages((prev) => [...prev, userMessage]);
    setSelectedFile(null); // Clear file after sending
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append("message", userInput);
      formData.append("language", language); // Send language preference to backend
      formData.append("username", user); // Pass the current username

      if (selectedFile?.file) {
        formData.append("file", selectedFile.file);
      }

      const response = await axios.post(
        "http://localhost:5000/api/chat",
        formData,
        {
        });

      let aiReply = response.data.reply || response.data.text || "No response from AI";
      let searchImageUrl = null;

      // Detect [SEARCH: query] pattern in the AI reply
      const searchMatch = aiReply.match(/\[SEARCH:\s*(.*?)\]/i);
      if (searchMatch) {
        const query = searchMatch[1];
        // Fetch the image from the search API
        searchImageUrl = await fetchImageFromSearch(query);
        // Remove the search tag from the displayed text
        aiReply = aiReply.replace(searchMatch[0], "").trim();
      }

      const aiMessage = {
        text: aiReply,
        sender: "ai",
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        image: searchImageUrl || response.data.image_url || null,
      };

      setMessages((prev) => {
        const updatedMessages = [...prev, aiMessage];
        updateHistory(updatedMessages, userInput);
        return updatedMessages;
      });

      const speech = new SpeechSynthesisUtterance(aiMessage.text);
      const currentLangObj = languages.find(l => l.name === language);
      speech.lang = currentLangObj ? currentLangObj.code : "en-US";
      window.speechSynthesis.speak(speech);
    } catch (error) {
      console.error("Error:", error);

      const errorMessage = {
        text: "Backend connection failed. Please check server.",
        sender: "ai",
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle simple routing for the Reset Password page
  const isResetPage = window.location.pathname.startsWith("/reset-password");

  if (isResetPage) {
    return (
      <div className={`app ${isDarkMode ? "dark-mode" : ""}`}>
        <ResetPassword currentTheme={currentTheme} />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="login-container">
        <div className="login-card">
          {isRecovering ? (
            <>
              <h1 style={{ color: currentTheme.accent }}>Reset Password</h1>
              <p>Enter your email to receive a recovery link</p>
              <form onSubmit={handleRecover}>
                <input
                  type="email"
                  placeholder="Email address"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  required
                  autoFocus
                />
                <button type="submit" className="black-btn">
                  Send Recovery Link
                </button>
              </form>
              <div className="auth-toggle">
                Remember your password?
                <button onClick={() => setIsRecovering(false)} className="auth-toggle-btn">
                  Back to Login
                </button>
              </div>
            </>
          ) : (
            <>
              <h1 style={{ color: currentTheme.accent }}>Superchat LLM</h1>
              <p>{isRegistering ? "Create an account" : "Sign in to start chatting"}</p>
              <form onSubmit={handleAuth}>
                {isRegistering && (
                  <input
                    type="text"
                    placeholder="Full Name"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    required
                  />
                )}
                <input
                  type="email"
                  placeholder="Email address"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  required
                  autoFocus
                />
                <div className="password-input-wrapper" style={{ position: "relative", width: "100%" }}>
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    required
                    style={{ width: "100%", paddingRight: "45px" }}
                  />
                  <span
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: "absolute",
                      right: "12px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      cursor: "pointer",
                      fontSize: "1.2rem",
                      userSelect: "none"
                    }}
                  >
                    {showPassword ? "👁️" : "🙈"}
                  </span>
                </div>
                {!isRegistering && (
                  <button type="button" className="forgot-password-link" onClick={() => setIsRecovering(true)}>
                    Forgot Password?
                  </button>
                )}
                <button type="submit" style={{ backgroundColor: currentTheme.accent }}>
                  {isRegistering ? "Sign Up" : "Login"}
                </button>
                <div className="login-divider">OR</div>
                <button type="button" onClick={handleGoogleLogin} className="google-login-btn">
                  <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" width="18" />
                  Continue with Google
                </button>
              </form>
              <div className="auth-toggle">
                {isRegistering ? "Already have an account?" : "Don't have an account?"}
                <button onClick={() => setIsRegistering(!isRegistering)} className="auth-toggle-btn">
                  {isRegistering ? "Login" : "Sign Up"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`app ${isDarkMode ? "dark-mode" : ""}`}>
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <button 
            className="new-chat" 
            onClick={startNewChat}
            style={{ backgroundColor: 'var(--accent-color)' }}
          >
            + New Chat
          </button>
          <button
            className="delete-history"
            onClick={deleteHistory}
            >
                    Delete History      
                    </button>
        </div>
        <div className="chat-history">
          <p className="history-label">Recent Chats</p>
          
          {chatHistory.length === 0 && (
            <div className="history-item" style={{ opacity: 0.5, cursor: 'default' }}>
              No recent chats
            </div>
          )}

          {Array.isArray(chatHistory) && chatHistory.map((chat, index) => (
            <div 
              key={chat.id || index} 
              className={`history-item-container ${currentChatId === chat.id ? "active" : ""}`}
            >
              <div
                className="history-item"
                onClick={() => {
                  setMessages(chat.messages);
                  setCurrentChatId(chat.id);
                }}
                title={chat.title}
              >
                {(chat.title || "").length > 25
                  ? (chat.title || "").substring(0, 25) + "..."
                  : (chat.title || "Untitled Chat")}
              </div>
              <button
                className="delete-chat-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  deleteChat(chat.id);
                }}
                title="Delete Chat"
              >
                🗑️
              </button>
            </div>
          ))}
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="main-content">
        <nav className="navbar">
          <div className="nav-left">
            <h1 style={{ color: 'var(--accent-color)' }}>Superchat LLM</h1>
            <span className="user-badge">@{user}</span>
          </div>
          
          <select 
            className="theme-dropdown" 
            value={currentTheme.name}
            onChange={(e) => setCurrentTheme(themes.find(t => t.name === e.target.value))}
            style={{
              padding: '6px 12px',
              borderRadius: '8px',
              border: '1px solid var(--navbar-border)',
              backgroundColor: 'var(--navbar-bg)',
              color: 'var(--text-primary)',
              marginRight: '15px',
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            {themes.map((theme) => (
              <option key={theme.name} value={theme.name}>
                {theme.name}
              </option>
            ))}
          </select>

          <select 
            className="language-dropdown" 
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            style={{
              padding: '6px 12px',
              borderRadius: '8px',
              border: '1px solid var(--navbar-border)',
              backgroundColor: 'var(--navbar-bg)',
              color: 'var(--text-primary)',
              marginRight: '15px',
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            {languages.map((lang) => (
              <option key={lang.code} value={lang.name}>
                {lang.name}
              </option>
            ))}
          </select>

          <div className="nav-right">
            <button className="theme-toggle-btn" onClick={() => setIsDarkMode(!isDarkMode)}>
              {isDarkMode ? "☀️" : "🌙"}
            </button>
            <button className="logout-btn" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </nav>

        <div 
          className={`robot-mascot ${isLoading ? "thinking" : ""}`} 
          title={isLoading ? "Analyzing..." : "Your AI Assistant is ready!"}
        >
          {isLoading ? "🧠" : "🤖"}
        </div>

        <div className="chat-container">
          <div className="chat-box">
            {messages.length === 0 && (
              <div className="welcome-screen">
                <h2>Welcome to Superchat</h2>
                <p>Ask anything to your Local LLM</p>
              </div>
            )}

            {Array.isArray(messages) && messages.map((msg, index) => (
              <div key={index} className={`message-wrapper ${msg.sender}`}>
                {msg.sender === "ai" && <div className="avatar ai-avatar">🤖</div>}
                <div className={`message ${msg.sender}`}>
                  {msg.sender === "ai" && (
                    <button 
                      className="copy-msg-btn" 
                      onClick={() => copyToClipboard(msg.text)}
                      title="Copy Response"
                    >📋</button>
                  )}
                  {msg.image && (
                    <div className="image-container">
                      <img 
                        src={msg.image} 
                        alt="Upload" 
                        className="message-image" 
                        onClick={() => openLightbox(msg.image)}
                      />
                      <button 
                        className="download-image-btn" 
                        onClick={() => downloadImage(msg.image, `superchat-img-${Date.now()}.png`)}
                        title="Download Image"
                      >
                        📥
                      </button>
                    </div>
                  )}
                  
                  {msg.sender === "ai" ? (
                    <div className="markdown-content">
                      <ReactMarkdown>{msg.text}</ReactMarkdown>
                    </div>
                  ) : (
                    <p className="message-text">{msg.text}</p>
                  )}

                  <span className="timestamp">{msg.timestamp}</span>
                  {msg.sender === "ai" && (
                    <div className="ai-badge">AI Response</div>
                  )}
                </div>
                {msg.sender === "user" && user && (
                  <div className="avatar user-avatar">
                    {customAvatar ? (
                      <img src={customAvatar} alt="User Avatar" className="avatar-img" />
                    ) : (
                      user.charAt(0).toUpperCase()
                    )}
                    <label htmlFor="avatarUpload" className="avatar-edit-btn" title="Change Avatar">
                      ✏️
                    </label>
                    <input type="file" id="avatarUpload" accept="image/*" onChange={handleAvatarChange} hidden />
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="message-wrapper ai">
                <div className="avatar ai-avatar">🤖</div>
                <div className="message ai typing">
                  <span className="typing-label">AI is typing...</span>
                  <span className="dot"></span>
                  <span className="dot"></span>
                  <span className="dot"></span>
                </div>
              </div>
            )}

            <div ref={chatEndRef}></div>
          </div>

          {/* Input Area */}
          <div className="input-area">
            <div className="input-box">
              <label className="upload-btn" title="Upload File">
                +
                <input
                  type="file"
                  accept="image/*,.pdf,.txt"
                  onChange={handleFileUpload}
                  hidden
                />
              </label>

              <input
                type="text"
                placeholder="Ask something..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              />

                <button className="voice-btn" onClick={startVoiceInput} title="Voice Input">
                <span style={{ color: 'var(--accent-color)' }}>🎤</span>
              </button>

              <button 
                onClick={sendMessage} 
                disabled={isLoading}
                style={{ backgroundColor: 'var(--accent-color)' }}
              >
                Send
              </button>
            </div>

            {selectedFile && (
              <div className="file-preview">
                Selected: {selectedFile.file.name}
              </div>
            )}
          </div>
        </div>

        {showLightbox && lightboxImage && (
          <div className="lightbox-overlay" onClick={closeLightbox}>
            <button className="lightbox-close-btn" onClick={closeLightbox}>
              ✕
            </button>
            <img
              src={lightboxImage}
              alt="Full screen"
              className="lightbox-content"
              onClick={(e) => e.stopPropagation()} // Prevent closing when clicking the image itself
            />
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
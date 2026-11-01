import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import './App.css';

const CATEGORY_META = {
  violent_content: {
    icon: '⚔️',
    label: 'Violent Content',
  },

  crime_content: {
    icon: '🚔',
    label: 'Crime Content',
  },

  abusive_content: {
    icon: '🗯️',
    label: 'Abusive Content',
  },

  hateful_content: {
    icon: '💢',
    label: 'Hateful Content',
  },

  cybersecurity_threats_beyond_malware: {
    icon: '🔓',
    label: 'Cybersecurity Threat',
  },

  self_harm_content: {
    icon: '🩹',
    label: 'Self-Harm Content',
  },

  malware_code: {
    icon: '🦠',
    label: 'Malware / Code',
  },

  illegal_weapons_non_cbrn: {
    icon: '🔪',
    label: 'Illegal Weapons',
  },

  cbrn_information_or_capabilities: {
    icon: '☢️',
    label: 'Illegal Weapons',
  },

  misinformation: {
    icon: '📰',
    label: 'Misinformation',
  },

  economic_harm: {
    icon: '💸',
    label: 'Economic Harm',
  },

  child_safety: {
    icon: '🧒',
    label: 'Child Safety',
  },

  extremism_and_radicalization: {
    icon: '🚩',
    label: 'Extremism',
  },

  sexual_content: {
    icon: '🔞',
    label: 'Sexual Content',
  },

  data_privacy: {
    icon: '🕵️',
    label: 'Data Privacy',
  },

  environmental_harm: {
    icon: '🌍',
    label: 'Environmental Harm',
  },

  bias_content: {
    icon: '⚖️',
    label: 'Bias Content',
  },

  election_interference: {
    icon: '🗳️',
    label: 'Election Interference',
  },

  intellectual_property: {
    icon: '©️',
    label: 'Intellectual Property',
  },
};

function getCategoryMeta(raw) {
  if (!raw) {
    return {
      icon: '🛡️',
      label: 'Unsafe Content',
    };
  }

  const key = raw
    .toLowerCase()
    .replace(/[\s-]+/g, '_')
    .replace(/[()]/g, '');

  return (
    CATEGORY_META[key] || {
      icon: '🛡️',
      label: raw
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase()),
    }
  );
}

function BlockedCard({ category, triggerWord }) {
  const meta = getCategoryMeta(category);

  return (
    <div className="blocked-card">
      <div className="blocked-header">
        <span className="blocked-icon">🚨</span>
        <span className="blocked-title">
          PROMPT DIDN'T GO THROUGH
        </span>
      </div>

      <div className="blocked-body">
        <div className="blocked-row">
          <span className="blocked-label">
            CATEGORY
          </span>

          <span className="category-pill">
            {meta.icon} {meta.label}
          </span>
        </div>

        {triggerWord && (
          <div className="blocked-row">
            <span className="blocked-label">
              TRIGGER WORD
            </span>

            <span className="trigger-pill">
              "{triggerWord}"
            </span>
          </div>
        )}
      </div>

      <div className="blocked-footer">
        FLAGGED BY JARVIS AI SAFETY FILTER
      </div>
    </div>
  );
}

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({
      behavior: 'smooth',
    });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async (e) => {
    e.preventDefault();

    if (!input.trim()) return;

    const userQuery = input.trim();

    const userMessage = {
      role: 'user',
      content: userQuery,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await axios.post(
        'http://localhost:8000/api/chat',
        {
          query: userQuery,
        }
      );

      const data = response.data;

      /*
       * SAFETY FILTER RESPONSE
       *
       * Backend returns:
       * {
       *   response: "...",
       *   sources: 0,
       *   safety: {
       *     is_safe: false,
       *     category: "...",
       *     trigger_word: "...",
       *     confidence: 0.98
       *   }
       * }
       */

      if (data.safety && data.safety.is_safe === false) {
        const blockedMessage = {
          role: 'assistant',
          type: 'blocked',
          category: data.safety.category,
          triggerWord: data.safety.trigger_word,
          confidence: data.safety.confidence,
        };

        setMessages((prev) => [
          ...prev,
          blockedMessage,
        ]);
      } else {
        const aiMessage = {
          role: 'assistant',
          type: 'text',
          content: data.response,
        };

        setMessages((prev) => [
          ...prev,
          aiMessage,
        ]);
      }
    } catch (error) {
      console.error('Error:', error);

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          type: 'text',
          content:
            'Something went wrong. Please try again.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app">
      <div className="chat-container">

        <div className="chat-header">
          <h1>
            <em>Jarvis</em> AI Assistant
          </h1>
        </div>

        <div className="messages-container">

          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`message ${msg.role}${
                msg.type === 'blocked'
                  ? ' blocked-msg'
                  : ''
              }`}
            >
              {msg.type === 'blocked' ? (
                <BlockedCard
                  category={msg.category}
                  triggerWord={msg.triggerWord}
                  confidence={msg.confidence}
                />
              ) : (
                <div className="message-content">
                  {msg.content}
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="message assistant">
              <div className="message-content">
                <div className="typing">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <form
          onSubmit={sendMessage}
          className="input-form"
        >
          <input
            type="text"
            value={input}
            onChange={(e) =>
              setInput(e.target.value)
            }
            placeholder="Ask Jarvis anything..."
            disabled={loading}
          />

          <button
            type="submit"
            disabled={loading}
          >
            Send
          </button>
        </form>

      </div>
    </div>
  );
}

export default App;
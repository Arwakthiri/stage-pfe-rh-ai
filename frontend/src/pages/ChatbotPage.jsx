import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Send, Trash2, Sparkles, MessageSquare, Bot, User, ArrowLeft, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import Navbar from '../components/Navbar';
import './ChatbotPage.css';

export default function ChatbotPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);
  
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      sender: 'bot',
      text: t('chatbot.welcomeMessage', 'Bonjour ! Je suis votre Assistant RH IA. Comment puis-je vous aider aujourd\'hui ?'),
      time: new Date().toLocaleTimeString(i18n.language, { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const isRtl = i18n.dir() === 'rtl';

  const suggestionChips = [
    { text: t('chatbot.sugg1', 'Comment poser mes congés ?'), value: 'conge' },
    { text: t('chatbot.sugg2', 'Gérer mon stress au travail'), value: 'stress' },
    { text: t('chatbot.sugg3', 'Remboursement des frais de transport'), value: 'frais' },
    { text: t('chatbot.sugg4', 'Formations recommandées'), value: 'formation' }
  ];

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Charger l'historique des messages depuis le backend
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const { data } = await api.get('/api/chat/history');
        if (data && data.length > 0) {
          const formatted = data.map(msg => ({
            id: msg.id.toString(),
            sender: msg.sender,
            text: msg.text,
            time: new Date(msg.created_at).toLocaleTimeString(i18n.language, { hour: '2-digit', minute: '2-digit' })
          }));
          setMessages(formatted);
        }
      } catch (err) {
        console.warn("Impossible de charger l'historique des messages du backend :", err);
      }
    };
    fetchHistory();
  }, [i18n.language]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (textToSend) => {
    const text = textToSend || input.trim();
    if (!text) return;

    if (!textToSend) {
      setInput('');
    }

    const timeString = new Date().toLocaleTimeString(i18n.language, { hour: '2-digit', minute: '2-digit' });
    
    // Add user message
    const userMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: text,
      time: timeString
    };
    setMessages(prev => [...prev, userMessage]);
    
    // Set bot to thinking state
    setLoading(true);

    try {
      // Intentional short delay to feel like the AI is processing
      await new Promise(resolve => setTimeout(resolve, 800));

      // Attempt to contact real backend
      const response = await api.post('/api/chat', { message: text });
      
      const botResponse = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: response.data.reply || response.data.message || t('common.error', 'Une erreur est survenue.'),
        time: new Date().toLocaleTimeString(i18n.language, { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, botResponse]);
    } catch (error) {
      console.warn("Backend API chat non disponible, utilisation du fallback local :", error);
      
      // Fallback system based on keywords (French / English / Arabic)
      let replyText = '';
      const cleanText = text.toLowerCase();

      if (cleanText.includes('cong') || cleanText.includes('vacanc') || cleanText.includes('repos') || cleanText.includes('leave') || cleanText.includes('holiday') || cleanText.includes('إجاز') || cleanText.includes('رخص')) {
        replyText = t(
          'chatbot.replyLeave',
          'En tant que collaborateur, vous bénéficiez de 25 jours de congés payés par an. Pour soumettre une demande de congés, veuillez passer par le portail RH en spécifiant les dates et le type de congé souhaité. Votre manager direct recevra une notification pour validation.'
        );
      } else if (cleanText.includes('stress') || cleanText.includes('fatigue') || cleanText.includes('bien') || cleanText.includes('sant') || cleanText.includes('burn') || cleanText.includes('health') || cleanText.includes('ضغط') || cleanText.includes('تعب')) {
        replyText = t(
          'chatbot.replyStress',
          'Le bien-être de nos collaborateurs est essentiel. Segula Technologies met à votre disposition une ligne d\'écoute psychologique gratuite, anonyme et disponible 24h/24 au 0800 900 800. Vous pouvez également en parler en toute confidentialité avec votre référent RH ou planifier un entretien dédié.'
        );
      } else if (cleanText.includes('frais') || cleanText.includes('rembours') || cleanText.includes('transport') || cleanText.includes('bus') || cleanText.includes('train') || cleanText.includes('expense') || cleanText.includes('مصاريف') || cleanText.includes('نقل')) {
        replyText = t(
          'chatbot.replyExpenses',
          'Pour vos frais de transport professionnels, nous remboursons 50% de votre abonnement de transports en commun. Veuillez déposer votre justificatif d\'achat mensuel sur la plateforme RH avant le 15 du mois en cours pour un remboursement sur la paye suivante.'
        );
      } else if (cleanText.includes('format') || cleanText.includes('apprend') || cleanText.includes('cours') || cleanText.includes('train') || cleanText.includes('learn') || cleanText.includes('تدريب') || cleanText.includes('تعليم')) {
        replyText = t(
          'chatbot.replyTraining',
          'Vous disposez de plusieurs modules de formation en ligne sur votre tableau de bord (Gestion du stress, Communication en équipe). Si vous souhaitez suivre une formation externe ou acquérir de nouvelles compétences techniques, vous pouvez soumettre une demande dans le cadre de votre entretien professionnel annuel.'
        );
      } else if (cleanText.includes('bonjour') || cleanText.includes('salut') || cleanText.includes('hello') || cleanText.includes('hi') || cleanText.includes('مرحب')) {
        replyText = t(
          'chatbot.replyHello',
          'Bonjour ! Je suis ravi de discuter avec vous. Comment se déroule votre journée chez Segula ? Avez-vous des questions sur les congés, les formations ou votre bien-être ?'
        );
      } else {
        replyText = t(
          'chatbot.replyDefault',
          'Je prends bien note de votre message. Notre IA analyse votre demande. Pour toute urgence ou question administrative complexe, je vous invite à contacter directement le service RH de Segula.'
        );
      }

      // Add delay to mimic processing time
      await new Promise(resolve => setTimeout(resolve, 600));

      const botResponse = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: replyText,
        time: new Date().toLocaleTimeString(i18n.language, { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, botResponse]);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = async () => {
    if (window.confirm(t('chatbot.confirmClear', 'Voulez-vous vraiment effacer cette conversation ?'))) {
      try {
        await api.delete('/api/chat');
      } catch (err) {
        console.warn("Impossible d'effacer la conversation côté serveur :", err);
      }
      setMessages([
        {
          id: 'welcome',
          sender: 'bot',
          text: t('chatbot.welcomeMessage', 'Bonjour ! Je suis votre Assistant RH IA. Comment puis-je vous aider aujourd\'hui ?'),
          time: new Date().toLocaleTimeString(i18n.language, { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }
  };

  return (
    <div className="app-layout">
      <Navbar />
      
      <main className="main-content chat-page-main" dir={isRtl ? 'rtl' : 'ltr'}>
        <div className="chat-container glass">
          
          {/* Header */}
          <div className="chat-header">
            <button className="chat-back-btn" onClick={() => navigate('/employe/dashboard')} title={t('common.cancel', 'Retour')}>
              <ArrowLeft size={20} />
            </button>
            <div className="chat-header-avatar">
              <Bot size={22} color="#fff" />
              <div className="chat-status-indicator online"></div>
            </div>
            <div className="chat-header-info">
              <h3>{t('dashboard.chatbot', 'Assistant RH IA')}</h3>
              <p className="chat-status-text">
                <Sparkles size={12} className="sparkles-icon" /> {t('chatbot.statusActive', 'Propulsé par IA · En ligne')}
              </p>
            </div>
            
            <button className="chat-clear-btn" onClick={handleClear} title={t('chatbot.clear', 'Effacer la conversation')}>
              <Trash2 size={18} />
            </button>
          </div>
          
          {/* Chat Messages */}
          <div className="chat-messages-area">
            {messages.map((msg) => (
              <div key={msg.id} className={`chat-message-row ${msg.sender}`}>
                {msg.sender === 'bot' && (
                  <div className="chat-bubble-avatar bot">
                    <Bot size={16} color="var(--text-primary)" />
                  </div>
                )}
                <div className="chat-bubble-container">
                  <div className="chat-bubble">
                    <p style={{ whiteSpace: 'pre-wrap' }}>{msg.text}</p>
                  </div>
                  <span className="chat-bubble-time">{msg.time}</span>
                </div>
                {msg.sender === 'user' && (
                  <div className="chat-bubble-avatar user">
                    <User size={16} color="#fff" />
                  </div>
                )}
              </div>
            ))}
            
            {loading && (
              <div className="chat-message-row bot">
                <div className="chat-bubble-avatar bot">
                  <Bot size={16} />
                </div>
                <div className="chat-bubble-container">
                  <div className="chat-bubble typing-bubble">
                    <div className="typing-dot"></div>
                    <div className="typing-dot"></div>
                    <div className="typing-dot"></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggestions */}
          {messages.length === 1 && !loading && (
            <div className="chat-suggestions-container">
              <p className="suggestions-title">{t('chatbot.suggestionsTitle', 'Suggestions de questions :')}</p>
              <div className="chat-suggestions-grid">
                {suggestionChips.map((chip, idx) => (
                  <button 
                    key={idx} 
                    className="suggestion-chip"
                    onClick={() => handleSend(chip.text)}
                  >
                    <MessageSquare size={14} className="chip-icon" />
                    <span>{chip.text}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input Area */}
          <form 
            className="chat-input-area" 
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
          >
            <input
              type="text"
              placeholder={t('chatbot.inputPlaceholder', 'Tapez votre message ici...')}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
              className="chat-text-input"
            />
            <button 
              type="submit" 
              disabled={!input.trim() || loading} 
              className="chat-send-btn"
              title={t('chatbot.send', 'Envoyer')}
            >
              <Send size={18} />
            </button>
          </form>
          
        </div>
      </main>
    </div>
  );
}

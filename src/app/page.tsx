'use client';

import { useState, useEffect, useRef } from 'react';
import { analyzeEmotion, getEmotionEmoji, getEmotionLabel } from '../lib/emotion';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  emotion?: string;
  timestamp: Date;
}

interface EmotionRecord {
  date: string;
  emotions: { [key: string]: number };
  dominantEmotion: string;
}

interface Character {
  id: string;
  name: string;
  emoji: string;
  description: string;
  theme: {
    gradient: string;
    accent: string;
  };
}

// 角色定义
const CHARACTERS: Character[] = [
  {
    id: 'xiaoshu',
    name: '小树',
    emoji: '🌳',
    description: '温柔倾听者',
    theme: { gradient: 'from-emerald-400 to-teal-500', accent: 'emerald' }
  },
  {
    id: 'azhe',
    name: '阿哲',
    emoji: '🧠',
    description: '理性陪伴者',
    theme: { gradient: 'from-blue-400 to-indigo-500', accent: 'blue' }
  },
  {
    id: 'moyan',
    name: '莫言',
    emoji: '📖',
    description: '文字治愈者',
    theme: { gradient: 'from-amber-400 to-orange-500', accent: 'amber' }
  },
  {
    id: 'xiaoming',
    name: '小明',
    emoji: '☀️',
    description: '阳光小伙伴',
    theme: { gradient: 'from-yellow-400 to-orange-400', accent: 'yellow' }
  }
];

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emotionHistory, setEmotionHistory] = useState<EmotionRecord[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedCharacter, setSelectedCharacter] = useState<string>('xiaoshu');
  const [showCharacterPanel, setShowCharacterPanel] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 加载本地存储的数据
  useEffect(() => {
    const savedMessages = localStorage.getItem('treehole-messages');
    const savedEmotions = localStorage.getItem('treehole-emotions');
    const savedCharacter = localStorage.getItem('treehole-character');
    if (savedMessages) setMessages(JSON.parse(savedMessages));
    if (savedEmotions) setEmotionHistory(JSON.parse(savedEmotions));
    if (savedCharacter) setSelectedCharacter(savedCharacter);
  }, []);

  // 保存到本地存储
  useEffect(() => {
    localStorage.setItem('treehole-messages', JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    localStorage.setItem('treehole-emotions', JSON.stringify(emotionHistory));
  }, [emotionHistory]);

  useEffect(() => {
    localStorage.setItem('treehole-character', selectedCharacter);
  }, [selectedCharacter]);

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 更新情绪历史
  const updateEmotionHistory = (emotion: string) => {
    const today = new Date().toISOString().split('T')[0];
    setEmotionHistory(prev => {
      const existing = prev.find(e => e.date === today);
      if (existing) {
        existing.emotions[emotion] = (existing.emotions[emotion] || 0) + 1;
        const sorted = Object.entries(existing.emotions).sort((a, b) => b[1] - a[1]);
        existing.dominantEmotion = sorted[0][0];
        return [...prev];
      } else {
        return [...prev, {
          date: today,
          emotions: { [emotion]: 1 },
          dominantEmotion: emotion
        }];
      }
    });
  };

  // 发送消息
  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    const emotion = analyzeEmotion(input);
    userMessage.emotion = emotion;
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: input, 
          emotion,
          history: messages.slice(-10),
          character: selectedCharacter
        })
      });

      const data = await response.json();
      
      const assistantMessage: Message = {
        role: 'assistant',
        content: data.response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
      updateEmotionHistory(emotion);
    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '抱歉，我遇到了一些问题。你能再说一遍吗？',
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  // 清空对话
  const clearChat = () => {
    if (confirm('确定要清空所有对话记录吗？')) {
      setMessages([]);
      setEmotionHistory([]);
      localStorage.removeItem('treehole-messages');
      localStorage.removeItem('treehole-emotions');
    }
  };

  // 生成周报
  const generateWeeklyReport = () => {
    if (emotionHistory.length === 0) return null;
    
    const last7Days = emotionHistory.slice(-7);
    const emotionCounts: { [key: string]: number } = {};
    
    last7Days.forEach(record => {
      Object.entries(record.emotions).forEach(([emotion, count]) => {
        emotionCounts[emotion] = (emotionCounts[emotion] || 0) + count;
      });
    });

    const sortedEmotions = Object.entries(emotionCounts).sort((a, b) => b[1] - a[1]);
    const dominantEmotion = sortedEmotions[0]?.[0] || '平静';
    
    const messages: { [key: string]: string } = {
      '开心': '这一周你笑得很灿烂，继续保持这份阳光！☀️',
      '平静': '这一周你过得很安稳，这种平静也是一种幸福。🌿',
      '焦虑': '这一周你似乎有些焦虑，记得给自己一些喘息的时间。🌸',
      '难过': '这一周你经历了一些低谷，但你一直在坚持，这很勇敢。💪',
      '愤怒': '这一周有些事情让你生气了，你的情绪是合理的。🔥',
      '孤独': '这一周你感到孤单，但请记住，我在这里陪着你。🤗'
    };

    return {
      dominantEmotion,
      emotionCounts: sortedEmotions,
      message: messages[dominantEmotion] || '这一周你经历了很多，感谢你愿意和我分享。'
    };
  };

  const weeklyReport = generateWeeklyReport();
  const currentChar = CHARACTERS.find(c => c.id === selectedCharacter) || CHARACTERS[0];

  // 格式化日期
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    return `${date.getMonth() + 1}月${date.getDate()}日 ${weekdays[date.getDay()]}`;
  };

  return (
    <div className="h-screen flex bg-gradient-to-br from-slate-50 via-white to-slate-100">
      {/* 左侧角色选择面板 - PC端 */}
      <aside className={`hidden lg:flex flex-col bg-white/80 backdrop-blur-xl border-r border-slate-200/50 transition-all duration-300 ${showCharacterPanel ? 'w-72' : 'w-20'}`}>
        {/* 面板头部 */}
        <div className="p-4 border-b border-slate-200/50">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg flex-shrink-0">
              <span className="text-2xl">🌳</span>
            </div>
            {showCharacterPanel && (
              <div>
                <h1 className="text-xl font-bold text-slate-800">心灵树洞</h1>
                <p className="text-sm text-slate-500">选择你的陪伴者</p>
              </div>
            )}
          </div>
        </div>

        {/* 角色列表 */}
        <div className="flex-1 p-3 space-y-2 overflow-y-auto">
          {CHARACTERS.map((char) => (
            <button
              key={char.id}
              onClick={() => setSelectedCharacter(char.id)}
              className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
                selectedCharacter === char.id
                  ? `bg-gradient-to-r ${char.theme.gradient} text-white shadow-lg scale-[1.02]`
                  : 'hover:bg-slate-100 text-slate-700'
              }`}
            >
              <span className="text-3xl w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                {char.emoji}
              </span>
              {showCharacterPanel && (
                <div className="text-left">
                  <div className="font-semibold">{char.name}</div>
                  <div className={`text-xs ${selectedCharacter === char.id ? 'text-white/80' : 'text-slate-500'}`}>
                    {char.description}
                  </div>
                </div>
              )}
            </button>
          ))}
        </div>

        {/* 底部切换按钮 */}
        <div className="p-3 border-t border-slate-200/50">
          <button
            onClick={() => setShowCharacterPanel(!showCharacterPanel)}
            className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
          >
            <span className="text-lg">{showCharacterPanel ? '◀' : '▶'}</span>
            {showCharacterPanel && <span className="text-sm">收起</span>}
          </button>
        </div>
      </aside>

      {/* 右侧主内容区 */}
      <main className="flex-1 flex flex-col h-full">
        {/* PC端头部 */}
        <header className="hidden lg:block bg-white/80 backdrop-blur-xl border-b border-slate-200/50 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${currentChar.theme.gradient} flex items-center justify-center shadow-lg`}>
                <span className="text-2xl">{currentChar.emoji}</span>
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-800">{currentChar.name}</h2>
                <p className="text-sm text-slate-500">{currentChar.description}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowHistory(!showHistory)}
                className={`px-4 py-2 rounded-xl transition-all text-sm font-medium ${
                  showHistory 
                    ? 'bg-slate-800 text-white' 
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                📊 {showHistory ? '返回对话' : '心情周报'}
              </button>
              <button
                onClick={clearChat}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-red-50 text-slate-700 hover:text-red-600 transition-all text-sm font-medium"
              >
                🗑️ 清空对话
              </button>
            </div>
          </div>
        </header>

        {/* 移动端头部 */}
        <header className="lg:hidden bg-white/80 backdrop-blur-xl border-b border-slate-200/50 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${currentChar.theme.gradient} flex items-center justify-center shadow-md`}>
                <span className="text-xl">{currentChar.emoji}</span>
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-800">{currentChar.name}</h2>
                <p className="text-xs text-slate-500">{currentChar.description}</p>
              </div>
            </div>
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="px-3 py-2 rounded-lg bg-slate-100 text-slate-700 text-sm"
            >
              📊
            </button>
          </div>
        </header>

        {/* 内容区域 */}
        <div className="flex-1 overflow-hidden">
          {showHistory ? (
            /* 心情周报 */
            <div className="h-full overflow-y-auto p-4 lg:p-8">
              <div className="max-w-3xl mx-auto space-y-6">
                <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/50 p-6 lg:p-8">
                  <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-3">
                    <span className="text-3xl">📊</span>
                    心情周报
                  </h2>
                  
                  {weeklyReport ? (
                    <div className="space-y-6">
                      {/* 主导情绪 */}
                      <div className={`bg-gradient-to-br ${currentChar.theme.gradient} rounded-2xl p-6 text-center text-white`}>
                        <div className="text-6xl mb-3">
                          {getEmotionEmoji(weeklyReport.dominantEmotion)}
                        </div>
                        <div className="text-xl font-medium mb-2">
                          本周主导情绪：{getEmotionLabel(weeklyReport.dominantEmotion)}
                        </div>
                        <p className="text-white/80">{weeklyReport.message}</p>
                      </div>

                      {/* 情绪分布 */}
                      <div>
                        <h3 className="text-lg font-medium text-slate-700 mb-4 flex items-center gap-2">
                          <span>📈</span> 情绪分布
                        </h3>
                        <div className="space-y-3">
                          {weeklyReport.emotionCounts.map(([emotion, count]) => {
                            const maxCount = Math.max(...weeklyReport.emotionCounts.map(e => e[1]));
                            const percentage = (count / maxCount) * 100;
                            return (
                              <div key={emotion} className="flex items-center gap-4">
                                <span className="text-2xl w-10 text-center">{getEmotionEmoji(emotion)}</span>
                                <div className="flex-1 bg-slate-100 rounded-full h-4 overflow-hidden">
                                  <div 
                                    className={`h-full bg-gradient-to-r ${currentChar.theme.gradient} rounded-full transition-all duration-500`}
                                    style={{ width: `${percentage}%` }}
                                  />
                                </div>
                                <span className="text-sm text-slate-600 w-12 text-right font-medium">{count}次</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* 温暖提示 */}
                      <div className="bg-amber-50 rounded-xl p-4 border border-amber-100/50">
                        <p className="text-amber-700 flex items-start gap-3">
                          <span className="text-xl">💛</span>
                          <span>感谢你愿意分享你的心情。无论晴雨，我都会在这里陪着你。</span>
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12 text-slate-400">
                      <div className="text-6xl mb-4 opacity-60">🌱</div>
                      <p className="text-lg">还没有足够的数据生成周报</p>
                      <p className="text-sm mt-2">多和我聊聊，我会记录你的心情变化</p>
                    </div>
                  )}
                </div>

                {/* 历史记录 */}
                {emotionHistory.length > 0 && (
                  <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/50 p-6">
                    <h3 className="text-lg font-medium text-slate-700 mb-4 flex items-center gap-2">
                      <span>📅</span> 心情日历
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {emotionHistory.slice(-14).reverse().map((record) => (
                        <div 
                          key={record.date}
                          className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-slate-50 to-slate-100 border border-slate-100"
                        >
                          <span className="text-3xl">{getEmotionEmoji(record.dominantEmotion)}</span>
                          <div className="flex-1">
                            <div className="font-medium text-slate-700">{formatDate(record.date)}</div>
                            <div className="text-sm text-slate-500">
                              {Object.values(record.emotions).reduce((a, b) => a + b, 0)} 次倾诉
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* 对话界面 */
            <div className="h-full flex flex-col">
              {/* 欢迎消息 */}
              {messages.length === 0 && (
                <div className="flex-1 overflow-y-auto p-4 lg:p-8">
                  <div className="max-w-2xl mx-auto">
                    <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/50 p-8 text-center mb-6">
                      <div className="text-6xl mb-4">{currentChar.emoji}</div>
                      <h2 className="text-2xl font-bold text-slate-800 mb-3">
                        嗨，我是{currentChar.name}
                      </h2>
                      <p className="text-slate-600 max-w-md mx-auto leading-relaxed">
                        {currentChar.description}。你可以和我分享任何心事、烦恼、或者今天的开心事。
                        我会安静地听，给你温暖的回应。
                      </p>
                      <div className="mt-6 flex flex-wrap justify-center gap-3">
                        {[
                          { emoji: '😢', text: '心情不好' },
                          { emoji: '😰', text: '工作压力大' },
                          { emoji: '😊', text: '有开心的事' },
                          { emoji: '🤔', text: '想聊聊' }
                        ].map((suggestion) => (
                          <button
                            key={suggestion.text}
                            onClick={() => setInput(suggestion.text)}
                            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors text-sm flex items-center gap-2"
                          >
                            <span>{suggestion.emoji}</span>
                            <span>{suggestion.text}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 消息列表 */}
              <div className="flex-1 overflow-y-auto px-4 lg:px-8 pb-4">
                <div className="max-w-2xl mx-auto space-y-4 pt-4">
                  {messages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
                    >
                      {msg.role === 'assistant' && (
                        <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${currentChar.theme.gradient} flex items-center justify-center mr-3 flex-shrink-0 shadow-lg`}>
                          <span className="text-xl">{currentChar.emoji}</span>
                        </div>
                      )}
                      <div
                        className={`max-w-[80%] rounded-2xl px-5 py-3 ${
                          msg.role === 'user'
                            ? 'bg-gradient-to-br from-slate-700 to-slate-800 text-white shadow-lg'
                            : 'bg-white/90 backdrop-blur-sm shadow-md border border-slate-100/50'
                        }`}
                      >
                        {msg.role === 'user' && msg.emotion && (
                          <div className="text-xs mb-1 opacity-70 flex items-center gap-1">
                            <span>{getEmotionEmoji(msg.emotion)}</span>
                            <span>{getEmotionLabel(msg.emotion)}</span>
                          </div>
                        )}
                        <p className={`text-base leading-relaxed ${msg.role === 'user' ? 'text-white' : 'text-slate-700'}`}>
                          {msg.content}
                        </p>
                      </div>
                    </div>
                  ))}
                  
                  {isLoading && (
                    <div className="flex justify-start animate-fade-in">
                      <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${currentChar.theme.gradient} flex items-center justify-center mr-3 flex-shrink-0 shadow-lg`}>
                        <span className="text-xl">{currentChar.emoji}</span>
                      </div>
                      <div className="bg-white/90 backdrop-blur-sm shadow-md rounded-2xl px-5 py-3 border border-slate-100/50">
                        <div className="flex gap-1.5">
                          <span className="w-2.5 h-2.5 bg-slate-400 rounded-full animate-bounce" />
                          <span className="w-2.5 h-2.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }} />
                          <span className="w-2.5 h-2.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </div>

              {/* 输入框 */}
              <div className="bg-white/80 backdrop-blur-xl border-t border-slate-200/50 px-4 lg:px-8 py-4">
                <div className="max-w-2xl mx-auto">
                  <div className="bg-slate-100/80 backdrop-blur-sm rounded-2xl p-2 flex gap-2 items-end">
                    <textarea
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          sendMessage();
                        }
                      }}
                      placeholder={`和${currentChar.name}说说心里话...`}
                      className="flex-1 px-4 py-3 outline-none text-slate-700 placeholder:text-slate-400 resize-none bg-transparent text-base"
                      disabled={isLoading}
                      rows={1}
                      style={{ minHeight: '24px', maxHeight: '120px' }}
                      onInput={(e) => {
                        const target = e.target as HTMLTextAreaElement;
                        target.style.height = 'auto';
                        target.style.height = Math.min(target.scrollHeight, 120) + 'px';
                      }}
                    />
                    <button
                      onClick={sendMessage}
                      disabled={isLoading || !input.trim()}
                      className={`px-6 py-3 bg-gradient-to-r ${currentChar.theme.gradient} text-white rounded-xl hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg font-medium`}
                    >
                      发送
                    </button>
                  </div>
                  <p className="text-center text-xs text-slate-400 mt-2">
                    按 Enter 发送，Shift + Enter 换行
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

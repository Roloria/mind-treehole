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

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emotionHistory, setEmotionHistory] = useState<EmotionRecord[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 加载本地存储的数据
  useEffect(() => {
    const savedMessages = localStorage.getItem('treehole-messages');
    const savedEmotions = localStorage.getItem('treehole-emotions');
    if (savedMessages) setMessages(JSON.parse(savedMessages));
    if (savedEmotions) setEmotionHistory(JSON.parse(savedEmotions));
  }, []);

  // 保存到本地存储
  useEffect(() => {
    localStorage.setItem('treehole-messages', JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    localStorage.setItem('treehole-emotions', JSON.stringify(emotionHistory));
  }, [emotionHistory]);

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
          history: messages.slice(-10)
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
    setShowMenu(false);
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
      '开心': '这一周你笑得很灿烂，继续保持这份阳光！',
      '平静': '这一周你过得很安稳，这种平静也是一种幸福。',
      '焦虑': '这一周你似乎有些焦虑，记得给自己一些喘息的时间。',
      '难过': '这一周你经历了一些低谷，但你一直在坚持，这很勇敢。',
      '愤怒': '这一周有些事情让你生气了，你的情绪是合理的。',
      '孤独': '这一周你感到孤单，但请记住，我在这里陪着你。'
    };

    return {
      dominantEmotion,
      emotionCounts: sortedEmotions,
      message: messages[dominantEmotion] || '这一周你经历了很多，感谢你愿意和我分享。'
    };
  };

  const weeklyReport = generateWeeklyReport();

  // 格式化日期
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    return `${date.getMonth() + 1}月${date.getDate()}日 ${weekdays[date.getDay()]}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-purple-50 to-fuchsia-50">
      {/* 背景装饰 */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-violet-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000" />
      </div>

      {/* 头部 */}
      <header className="bg-white/70 backdrop-blur-xl border-b border-white/20 sticky top-0 z-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center shadow-lg">
              <span className="text-xl sm:text-2xl">🌳</span>
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-purple-700 to-pink-600 bg-clip-text text-transparent">
                心灵树洞
              </h1>
              <p className="text-xs sm:text-sm text-purple-500/80">一个愿意倾听的朋友</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl bg-white/80 text-purple-700 hover:bg-white border border-purple-100 transition-all text-sm font-medium shadow-sm"
            >
              <span>{showHistory ? '💬' : '📊'}</span>
              {showHistory ? '返回对话' : '心情周报'}
            </button>
            
            {/* 移动端菜单按钮 */}
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="sm:hidden w-10 h-10 rounded-xl bg-white/80 flex items-center justify-center border border-purple-100 shadow-sm"
            >
              <span className="text-xl">☰</span>
            </button>

            {/* 桌面端清空按钮 */}
            <button
              onClick={clearChat}
              className="hidden sm:flex w-10 h-10 rounded-xl bg-white/80 items-center justify-center border border-purple-100 hover:bg-red-50 hover:border-red-200 transition-all shadow-sm"
              title="清空对话"
            >
              <span className="text-lg">🗑️</span>
            </button>
          </div>
        </div>

        {/* 移动端菜单 */}
        {showMenu && (
          <div className="sm:hidden border-t border-purple-100 bg-white/90 backdrop-blur-xl">
            <div className="px-4 py-2 space-y-1">
              <button
                onClick={() => { setShowHistory(false); setShowMenu(false); }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-purple-50 transition-colors"
              >
                <span>💬</span>
                <span>对话</span>
              </button>
              <button
                onClick={() => { setShowHistory(true); setShowMenu(false); }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-purple-50 transition-colors"
              >
                <span>📊</span>
                <span>心情周报</span>
              </button>
              <button
                onClick={clearChat}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-50 text-red-600 transition-colors"
              >
                <span>🗑️</span>
                <span>清空对话</span>
              </button>
            </div>
          </div>
        )}
      </header>

      <main className="relative max-w-3xl mx-auto px-4 sm:px-6 py-4 sm:py-6 pb-32 sm:pb-24">
        {showHistory ? (
          /* 心情周报 */
          <div className="space-y-4 sm:space-y-6">
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-xl border border-white/50 p-4 sm:p-6">
              <h2 className="text-xl sm:text-2xl font-bold text-purple-800 mb-4 sm:mb-6 flex items-center gap-2">
                <span className="text-2xl sm:text-3xl">📊</span>
                心情周报
              </h2>
              
              {weeklyReport ? (
                <div className="space-y-4 sm:space-y-6">
                  {/* 主导情绪 */}
                  <div className="bg-gradient-to-br from-purple-100 via-pink-50 to-fuchsia-100 rounded-xl sm:rounded-2xl p-4 sm:p-6 text-center border border-purple-100/50">
                    <div className="text-5xl sm:text-7xl mb-2 sm:mb-3 animate-float">
                      {getEmotionEmoji(weeklyReport.dominantEmotion)}
                    </div>
                    <div className="text-lg sm:text-xl text-purple-800 font-medium">
                      本周主导情绪：{getEmotionLabel(weeklyReport.dominantEmotion)}
                    </div>
                    <p className="text-purple-600/80 mt-2 text-sm sm:text-base">{weeklyReport.message}</p>
                  </div>

                  {/* 情绪分布 */}
                  <div>
                    <h3 className="text-base sm:text-lg font-medium text-purple-700 mb-3 sm:mb-4 flex items-center gap-2">
                      <span>📈</span> 情绪分布
                    </h3>
                    <div className="space-y-3">
                      {weeklyReport.emotionCounts.map(([emotion, count]) => {
                        const maxCount = Math.max(...weeklyReport.emotionCounts.map(e => e[1]));
                        const percentage = (count / maxCount) * 100;
                        return (
                          <div key={emotion} className="flex items-center gap-2 sm:gap-3">
                            <span className="text-xl sm:text-2xl w-8 sm:w-10 text-center">{getEmotionEmoji(emotion)}</span>
                            <div className="flex-1 bg-gray-100/80 rounded-full h-3 sm:h-4 overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-purple-400 via-pink-400 to-fuchsia-400 rounded-full transition-all duration-500"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                            <span className="text-xs sm:text-sm text-gray-500 w-10 sm:w-12 text-right font-medium">{count}次</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* 温暖提示 */}
                  <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-4 border border-amber-100/50">
                    <p className="text-amber-700 text-sm flex items-start gap-2">
                      <span className="text-lg">💛</span>
                      <span>感谢你愿意分享你的心情。无论晴雨，我都会在这里陪着你。</span>
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 sm:py-12 text-gray-400">
                  <div className="text-5xl sm:text-6xl mb-4 opacity-60">🌱</div>
                  <p className="text-base sm:text-lg">还没有足够的数据生成周报</p>
                  <p className="text-sm mt-2">多和我聊聊，我会记录你的心情变化</p>
                </div>
              )}
            </div>

            {/* 历史记录 */}
            {emotionHistory.length > 0 && (
              <div className="bg-white/80 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-xl border border-white/50 p-4 sm:p-6">
                <h3 className="text-base sm:text-lg font-medium text-purple-700 mb-4 flex items-center gap-2">
                  <span>📅</span> 心情日历
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                  {emotionHistory.slice(-14).reverse().map((record) => (
                    <div 
                      key={record.date}
                      className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-100/50"
                    >
                      <span className="text-2xl">{getEmotionEmoji(record.dominantEmotion)}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-purple-700 truncate">
                          {formatDate(record.date)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {Object.values(record.emotions).reduce((a, b) => a + b, 0)} 次倾诉
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* 对话界面 */
          <>
            {/* 欢迎消息 */}
            {messages.length === 0 && (
              <div className="bg-white/80 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-xl border border-white/50 p-6 sm:p-8 mb-4 sm:mb-6 text-center">
                <div className="text-5xl sm:text-6xl mb-4 animate-float">🌸</div>
                <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-purple-700 to-pink-600 bg-clip-text text-transparent mb-3">
                  嗨，欢迎来到心灵树洞
                </h2>
                <p className="text-gray-600 max-w-md mx-auto leading-relaxed text-sm sm:text-base">
                  这里是一个安全的空间。你可以和我分享任何心事、烦恼、或者今天的开心事。
                  我不会评判你，只会安静地听，给你一些温暖的回应。
                </p>
                <div className="mt-6 grid grid-cols-2 sm:flex sm:flex-wrap justify-center gap-2">
                  {[
                    { emoji: '😢', text: '今天心情不太好' },
                    { emoji: '😰', text: '想聊聊工作压力' },
                    { emoji: '😊', text: '今天发生了开心的事' },
                    { emoji: '🥺', text: '只是想找人说说话' }
                  ].map((suggestion) => (
                    <button
                      key={suggestion.text}
                      onClick={() => setInput(suggestion.text)}
                      className="px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-white hover:bg-purple-50 text-purple-700 hover:border-purple-200 transition-all text-sm border border-purple-100 shadow-sm flex items-center gap-2 justify-center"
                    >
                      <span>{suggestion.emoji}</span>
                      <span className="hidden sm:inline">{suggestion.text}</span>
                      <span className="sm:hidden text-xs">{suggestion.text.slice(0, 6)}...</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 消息列表 */}
            <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
                >
                  {msg.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center mr-2 flex-shrink-0 shadow-md">
                      <span className="text-sm">🌳</span>
                    </div>
                  )}
                  <div
                    className={`max-w-[85%] sm:max-w-[75%] rounded-2xl sm:rounded-2xl px-4 sm:px-5 py-3 ${
                      msg.role === 'user'
                        ? 'bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-200/50'
                        : 'bg-white/90 backdrop-blur-sm shadow-md border border-white/50'
                    }`}
                  >
                    {msg.role === 'user' && msg.emotion && (
                      <div className="text-xs mb-1 opacity-80 flex items-center gap-1">
                        <span>{getEmotionEmoji(msg.emotion)}</span>
                        <span className="hidden sm:inline">{getEmotionLabel(msg.emotion)}</span>
                      </div>
                    )}
                    <p className={`text-sm sm:text-base leading-relaxed ${msg.role === 'user' ? 'text-white' : 'text-gray-700'}`}>
                      {msg.content}
                    </p>
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div className="flex justify-start animate-fade-in">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center mr-2 flex-shrink-0 shadow-md">
                    <span className="text-sm">🌳</span>
                  </div>
                  <div className="bg-white/90 backdrop-blur-sm shadow-md rounded-2xl px-5 py-3 border border-white/50">
                    <div className="flex gap-1.5">
                      <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" />
                      <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }} />
                      <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* 输入框 */}
            <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-purple-50 via-purple-50/95 to-transparent pt-6 pb-4 sm:pb-6 px-4 sm:px-6">
              <div className="max-w-3xl mx-auto">
                <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl border border-white/50 p-2 flex gap-2 items-end">
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                    placeholder="说说你的心事..."
                    className="flex-1 px-4 py-3 outline-none text-gray-700 placeholder:text-gray-400 resize-none bg-transparent text-sm sm:text-base"
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
                    className="px-4 sm:px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-200/50 font-medium text-sm sm:text-base flex items-center gap-2"
                  >
                    <span className="hidden sm:inline">发送</span>
                    <span className="sm:hidden">📤</span>
                  </button>
                </div>
                <p className="text-center text-xs text-gray-400 mt-2">
                  按 Enter 发送，Shift + Enter 换行
                </p>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

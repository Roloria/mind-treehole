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
        // 找出主导情绪
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

    // 分析用户情绪
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
          history: messages.slice(-10) // 最近10条对话作为上下文
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

    const sortedEmotions = Object.entries(emotionCounts)
      .sort((a, b) => b[1] - a[1]);
    
    const dominantEmotion = sortedEmotions[0]?.[0] || '平静';
    
    const messages = {
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
      message: messages[dominantEmotion as keyof typeof messages] || '这一周你经历了很多，感谢你愿意和我分享。'
    };
  };

  const weeklyReport = generateWeeklyReport();

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-pink-50">
      {/* 头部 */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-purple-100 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🌳</span>
            <div>
              <h1 className="text-xl font-bold text-purple-800">心灵树洞</h1>
              <p className="text-sm text-purple-500">一个愿意倾听的朋友</p>
            </div>
          </div>
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="px-4 py-2 rounded-full bg-purple-100 text-purple-700 hover:bg-purple-200 transition-colors text-sm"
          >
            {showHistory ? '返回对话' : '心情周报'}
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {showHistory ? (
          /* 心情周报 */
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-purple-800 mb-6 flex items-center gap-2">
              📊 心情周报
            </h2>
            
            {weeklyReport ? (
              <div className="space-y-6">
                {/* 主导情绪 */}
                <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-xl p-6 text-center">
                  <div className="text-6xl mb-3">
                    {getEmotionEmoji(weeklyReport.dominantEmotion)}
                  </div>
                  <div className="text-xl text-purple-800 font-medium">
                    本周主导情绪：{getEmotionLabel(weeklyReport.dominantEmotion)}
                  </div>
                  <p className="text-purple-600 mt-2">{weeklyReport.message}</p>
                </div>

                {/* 情绪分布 */}
                <div>
                  <h3 className="text-lg font-medium text-purple-700 mb-3">情绪分布</h3>
                  <div className="space-y-2">
                    {weeklyReport.emotionCounts.map(([emotion, count]) => (
                      <div key={emotion} className="flex items-center gap-3">
                        <span className="text-2xl">{getEmotionEmoji(emotion)}</span>
                        <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-purple-400 to-pink-400 rounded-full transition-all"
                            style={{ 
                              width: `${(count / Math.max(...weeklyReport.emotionCounts.map(e => e[1]))) * 100}%` 
                            }}
                          />
                        </div>
                        <span className="text-sm text-gray-600 w-8">{count}次</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 温暖提示 */}
                <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-200">
                  <p className="text-yellow-800 text-sm">
                    💛 感谢你愿意分享你的心情。无论晴雨，我都会在这里陪着你。
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <div className="text-6xl mb-4">🌱</div>
                <p>还没有足够的数据生成周报</p>
                <p className="text-sm mt-2">多和我聊聊，我会记录你的心情变化</p>
              </div>
            )}
          </div>
        ) : (
          /* 对话界面 */
          <>
            {/* 欢迎消息 */}
            {messages.length === 0 && (
              <div className="bg-white rounded-2xl shadow-lg p-8 mb-6 text-center">
                <div className="text-6xl mb-4">🌸</div>
                <h2 className="text-2xl font-bold text-purple-800 mb-3">
                  嗨，欢迎来到心灵树洞
                </h2>
                <p className="text-gray-600 max-w-md mx-auto leading-relaxed">
                  这里是一个安全的空间。你可以和我分享任何心事、烦恼、或者今天的开心事。
                  我不会评判你，只会安静地听，给你一些温暖的回应。
                </p>
                <div className="mt-6 flex flex-wrap justify-center gap-2">
                  {['今天心情不太好', '想聊聊工作压力', '今天发生了开心的事', '只是想找人说说话'].map(suggestion => (
                    <button
                      key={suggestion}
                      onClick={() => setInput(suggestion)}
                      className="px-4 py-2 rounded-full bg-purple-100 text-purple-700 hover:bg-purple-200 transition-colors text-sm"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 消息列表 */}
            <div className="space-y-4 mb-6">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-5 py-3 ${
                      msg.role === 'user'
                        ? 'bg-purple-500 text-white'
                        : 'bg-white shadow-md'
                    }`}
                  >
                    {msg.role === 'user' && msg.emotion && (
                      <div className="text-xs mb-1 opacity-80">
                        {getEmotionEmoji(msg.emotion)}
                      </div>
                    )}
                    <p className={msg.role === 'user' ? 'text-white' : 'text-gray-700'}>
                      {msg.content}
                    </p>
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white shadow-md rounded-2xl px-5 py-3">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-purple-300 rounded-full animate-bounce" />
                      <span className="w-2 h-2 bg-purple-300 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                      <span className="w-2 h-2 bg-purple-300 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* 输入框 */}
            <div className="sticky bottom-4">
              <div className="bg-white rounded-2xl shadow-lg p-2 flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                  placeholder="说说你的心事..."
                  className="flex-1 px-4 py-3 outline-none text-gray-700 placeholder:text-gray-400"
                  disabled={isLoading}
                />
                <button
                  onClick={sendMessage}
                  disabled={isLoading || !input.trim()}
                  className="px-6 py-3 bg-purple-500 text-white rounded-xl hover:bg-purple-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  发送
                </button>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

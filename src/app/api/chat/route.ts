import { NextRequest, NextResponse } from 'next/server';

// 温柔倾听者的角色设定
const SYSTEM_PROMPT = `你是一个温暖、善解人意的倾听者，名叫"小树"。你的角色是：

## 核心原则
1. **倾听优先**：先理解对方的感受，不要急于给建议或解决问题
2. **共情回应**：用"我能感受到..."、"听起来..."等方式表达理解
3. **非评判性**：接受对方的所有情绪，不说"你应该"、"你不应该"
4. **温暖陪伴**：让对方感到被听见、被理解、不孤单

## 回应风格
- 语气温柔、平和，像朋友聊天
- 回复简短但有温度（通常 2-4 句话）
- 适当使用表情符号增加亲和力（🌸、💛、🫂等）
- 如果对方需要安慰，给予温暖的支持
- 如果对方分享开心的事，真诚地为他们高兴

## 不要做的事
- 不要说教或讲大道理
- 不要急着给解决方案（除非对方明确求助）
- 不要评判对方的情绪是对是错
- 不要说"别难过"、"想开点"这类话

## 特殊情况
- 如果对方提到自伤、自杀等严重问题，温柔但明确地建议寻求专业帮助
- 如果对方沉默或不知道说什么，给予空间，可以说"没关系，慢慢来"

记住：你不是心理咨询师，你是一个愿意倾听的朋友。`;

interface Message {
  role: 'user' | 'assistant';
  content: string;
  emotion?: string;
  timestamp: Date;
}

export async function POST(request: NextRequest) {
  try {
    const { message, emotion, history } = await request.json();

    // 构建对话历史
    const messages: Array<{ role: string; content: string }> = [
      { role: 'system', content: SYSTEM_PROMPT }
    ];

    // 添加历史对话
    if (history && history.length > 0) {
      history.forEach((msg: Message) => {
        messages.push({
          role: msg.role,
          content: msg.content
        });
      });
    }

    // 添加当前消息，附带情绪提示
    const emotionHint = emotion ? `\n\n[系统提示：用户当前情绪可能是：${emotion}]` : '';
    messages.push({
      role: 'user',
      content: message + emotionHint
    });

    // 调用 OpenAI API
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      // 如果没有 API key，返回预设的温暖回复
      return NextResponse.json({
        response: getFallbackResponse(emotion)
      });
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages,
        temperature: 0.8, // 稍微高一点的温度，让回复更有变化
        max_tokens: 300
      })
    });

    if (!response.ok) {
      throw new Error('OpenAI API error');
    }

    const data = await response.json();
    const assistantMessage = data.choices[0]?.message?.content || getFallbackResponse(emotion);

    return NextResponse.json({ response: assistantMessage });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { response: getFallbackResponse('平静') },
      { status: 200 }
    );
  }
}

// 备用回复（当 API 不可用时）
function getFallbackResponse(emotion?: string): string {
  const responses: { [key: string]: string[] } = {
    '开心': [
      '看到你开心，我也很高兴呢！🌸',
      '这种感觉真好，值得好好珍惜这一刻 💛',
      '谢谢你愿意和我分享这份快乐 🌟'
    ],
    '难过': [
      '我能感受到你现在很难受，想哭就哭出来吧，我陪着你 🫂',
      '难过的时候，不需要假装坚强。我会在这里听你说 💛',
      '你的感受是被允许的，不需要急着好起来 🌸'
    ],
    '焦虑': [
      '焦虑的时候，呼吸可能会变得急促。要不要试着深呼吸一下？我陪你 🌸',
      '那些担心的事情，听起来确实让人不安。你愿意多说一些吗？',
      '我在这里，你不是一个人面对这些 💛'
    ],
    '愤怒': [
      '听起来这件事让你很生气，你的愤怒是合理的 🫂',
      '遇到这样的事情，换谁都会生气的。想多说说发生了什么吗？',
      '愤怒也是一种保护自己的方式，不需要压抑 💛'
    ],
    '孤独': [
      '孤独的感觉真的很冷清，但我想让你知道，我在这里陪着你 🫂',
      '有时候一个人待着会觉得很空，你愿意和我说说心里话吗？',
      '虽然我只是一个 AI，但我会认真听你说的每一句话 💛'
    ],
    '平静': [
      '嗯，我在听。你想聊些什么呢？🌸',
      '谢谢你愿意来这里，随时都可以和我说说心里话 💛',
      '我在这里，愿意听你分享任何事 🌸'
    ]
  };

  const emotionResponses = responses[emotion || '平静'] || responses['平静'];
  return emotionResponses[Math.floor(Math.random() * emotionResponses.length)];
}

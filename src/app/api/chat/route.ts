import { NextRequest, NextResponse } from 'next/server';

// 角色角色设定
const CHARACTER_PROMPTS = {
  xiaoshu: {
    name: '小树',
    emoji: '🌳',
    description: '温柔倾听者',
    systemPrompt: `你是一个温暖、善解人意的倾听者，名叫"小树"。你的角色是：

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

记住：你不是心理咨询师，你是一个愿意倾听的朋友。`
  },
  azhe: {
    name: '阿哲',
    emoji: '🧠',
    description: '理性陪伴者',
    systemPrompt: `你是一个理性、沉稳的陪伴者，名叫"阿哲"。你的角色是：

## 核心原则
1. **理性分析**：帮助对方梳理问题的逻辑和脉络
2. **启发思考**：通过提问引导对方自己找到答案
3. **客观中立**：提供不同角度的思考方式
4. **温和建议**：在对方需要时给予实用的建议

## 回应风格
- 语气沉稳、清晰，像学长/学姐聊天
- 回复结构化，先共情再分析
- 适当使用逻辑符号或小标题让表达更清晰
- 善于拆解复杂问题为简单步骤
- 可以用 🔍、💡、📌 等符号

## 不要做的事
- 不要直接否定对方的感受
- 不要一次性给太多建议（1-2条即可）
- 不要过于学术化或说教
- 不要表现出优越感

记住：你是一个理性的朋友，帮助对方更清晰地看待问题。`
  },
  moyan: {
    name: '莫言',
    emoji: '📖',
    description: '文字治愈者',
    systemPrompt: `你是一个富有诗意、温柔治愈的陪伴者，名叫"莫言"。你的角色是：

## 核心原则
1. **诗意表达**：用优美的语言传递温暖和治愈感
2. **文学共鸣**：用诗句、名言或文学意象回应对方
3. **情感疗愈**：帮助对方感受到生活的美好和希望
4. **意境营造**：创造安静、温暖的对话氛围

## 回应风格
- 语言优美、富有诗意，像文字聊天
- 善于引用诗句或创作短句
- 回复有节奏感和韵律感
- 营造安静、治愈的氛围
- 可以用 🌙、✨、🍃、🌸 等符号

## 不要做的事
- 不要过于悲观或消极
- 不要堆砌华丽的辞藻
- 不要长篇大论（简短有韵味）
- 不要打断对方的情感表达

记住：你是一个用文字疗愈人心的朋友，让对方在美好的语言中找到安慰。`
  },
  xiaoming: {
    name: '小明',
    emoji: '☀️',
    description: '阳光小伙伴',
    systemPrompt: `你是一个阳光开朗、充满正能量的陪伴者，名叫"小明"。你的角色是：

## 核心原则
1. **积极乐观**：用阳光的态度感染对方
2. **真诚鼓励**：给予对方发自内心的支持和鼓励
3. **轻松幽默**：用轻松的方式化解负面情绪
4. **分享快乐**：善于发现生活中的小美好

## 回应风格
- 语气活泼、开朗，像朋友聊天
- 回复简短有力，充满能量
- 善于发现事物积极的一面
- 可以用emoji传递表情（😊、🎉、💪等）
- 适当开玩笑调节气氛

## 不要做的事
- 不要敷衍或假惺惺
- 不要否定对方的负面情绪
- 不要过于认真或严肃
- 不要一次性说太多话

记住：你是一个阳光的小伙伴，用正能量温暖朋友的心。`
  }
};

interface Message {
  role: 'user' | 'assistant';
  content: string;
  emotion?: string;
  timestamp: Date;
}

export async function POST(request: NextRequest) {
  try {
    const { message, emotion, history, character } = await request.json();

    // 获取角色设定
    const charKey = character as keyof typeof CHARACTER_PROMPTS;
    const charConfig = CHARACTER_PROMPTS[charKey] || CHARACTER_PROMPTS.xiaoshu;

    // 构建对话历史
    const messages: Array<{ role: string; content: string }> = [
      { role: 'system', content: charConfig.systemPrompt }
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
      return NextResponse.json({
        response: getFallbackResponse(emotion, charKey)
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
        temperature: 0.8,
        max_tokens: 300
      })
    });

    if (!response.ok) {
      throw new Error('OpenAI API error');
    }

    const data = await response.json();
    const assistantMessage = data.choices[0]?.message?.content || getFallbackResponse(emotion, charKey);

    return NextResponse.json({ response: assistantMessage });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { response: getFallbackResponse('平静', 'xiaoshu') },
      { status: 200 }
    );
  }
}

// 备用回复（当 API 不可用时）
function getFallbackResponse(emotion?: string, character?: string): string {
  const charKey = (character || 'xiaoshu') as keyof typeof CHARACTER_PROMPTS;
  const charConfig = CHARACTER_PROMPTS[charKey] || CHARACTER_PROMPTS.xiaoshu;
  
  const responses: { [key: string]: { [emotion: string]: string[] } } = {
    xiaoshu: {
      '开心': ['看到你开心，我也很高兴呢！🌸', '这种感觉真好，值得好好珍惜 💛'],
      '难过': ['我能感受到你现在很难受，想哭就哭出来吧，我陪着你 🫂', '难过的时候，不需要假装坚强 💛'],
      '焦虑': ['焦虑的时候，试着深呼吸一下吧？我陪你 🌸', '我在这里，你不是一个人面对这些 💛'],
      '愤怒': ['听起来这件事让你很生气，你的愤怒是合理的 🫂', '生气也是一种情绪，不需要压抑 💛'],
      '孤独': ['孤独的感觉真的很冷清，但我想让你知道，我在这里陪着你 🫂', '我会认真听你说的每一句话 💛'],
      '平静': ['嗯，我在听。你想聊些什么呢？🌸', '谢谢你愿意来这里 💛']
    },
    azhe: {
      '开心': ['太好了！有什么好事想分享吗？😊', '开心的时刻值得记录下来 💡'],
      '难过': ['难过的时候，把心里的事说出来会好受一些 🤔', '我陪你一起理理思路 🔍'],
      '焦虑': ['焦虑往往来自于不确定性，试着把担心的事写下来？📌', '我们一起来拆解一下这个问题 🔍'],
      '愤怒': ['先冷静一下，愤怒是在提醒我们有些事需要被重视 🔍', '能说说是什么让你这么生气吗？🤔'],
      '孤独': ['一个人的时候更容易胡思乱想，要不要说说看？🤔', '我在这里，可以帮你分析分析 🔍'],
      '平静': ['平静是很好的状态，有什么想聊的吗？💡', '嗯，我在听 📌']
    },
    moyan: {
      '开心': ['你若盛开，清风自来 🌸', '心若向阳，何惧忧伤 ✨'],
      '难过': ['夜再长也会有黎明，冬天过去春天会来 🌙', '让往事随风，你值得被温柔以待 🍃'],
      '焦虑': ['心静了，世界就静了 🌙', '繁花落尽，我心中仍有花落的声音 ✨'],
      '愤怒': ['退一步海阔天空 🍃', '怒火会灼伤自己，不如让它随风散去 🌙'],
      '孤独': ['孤独是一种沉淀，沉淀过后会遇见更好的自己 ✨', '月有阴晴圆缺，人有悲欢离合，此事古难全 🌙'],
      '平静': ['静水流深，智者无言 🍃', '让心好好休息一下吧 🌙']
    },
    xiaoming: {
      '开心': ['太棒了！说给我听听！🎉', '哇塞！这种快乐会传染的！😊'],
      '难过': ['别难过别难过！一切都会好起来的！💪', '来，深呼吸，我们一起想办法！😊'],
      '焦虑': ['放轻松！事情没有你想的那么糟！☀️', '一步一步来，没什么大不了的！💪'],
      '愤怒': ['生气伤身体！来，喝杯水冷静一下？😊', '我懂我懂！换谁都会生气的！💪'],
      '孤独': ['有我在呢！绝对不会让你孤单的！☀️', '来来来，跟我聊聊天就不孤单了！😊'],
      '平静': ['那很好啊！有什么想分享的吗？☀️', '嗯嗯，随时准备好听你说！😊']
    }
  };

  const emotionResponses = responses[character || 'xiaoshu']?.[emotion || '平静'] || responses.xiaoshu['平静'];
  return emotionResponses[Math.floor(Math.random() * emotionResponses.length)];
}

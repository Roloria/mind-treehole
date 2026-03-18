// 情绪关键词映射
const emotionKeywords: { [key: string]: string[] } = {
  '开心': ['开心', '高兴', '快乐', '幸福', '笑', '哈哈', '太好了', '棒', '喜欢', '爱', '美好', '满足', '兴奋', '期待', '谢谢', '感谢', '顺利', '成功'],
  '难过': ['难过', '伤心', '哭', '眼泪', '痛苦', '伤心', '失落', '失望', '绝望', '崩溃', '想哭', '难受', '心痛', '遗憾', '可惜'],
  '焦虑': ['焦虑', '担心', '紧张', '害怕', '恐惧', '不安', '压力', '焦虑', '烦躁', '着急', '慌', '紧张', '纠结', '迷茫', '不知道该怎么办'],
  '愤怒': ['生气', '愤怒', '烦', '讨厌', '恨', '气死', '受不了', '无语', '恶心', '凭什么', '不公平', '可恶', '混蛋'],
  '孤独': ['孤独', '孤单', '寂寞', '一个人', '没人', '没人理解', '没人陪', '冷清', '空虚', '想念', '怀念'],
  '平静': ['平静', '还好', '一般', '正常', '普通', '没什么', '还行', '凑合', '稳定', '安静', '放松']
};

// 情绪 emoji 映射
const emotionEmojis: { [key: string]: string } = {
  '开心': '😊',
  '难过': '😢',
  '焦虑': '😰',
  '愤怒': '😤',
  '孤独': '🥺',
  '平静': '😌'
};

// 情绪中文标签
const emotionLabels: { [key: string]: string } = {
  '开心': '开心',
  '难过': '难过',
  '焦虑': '焦虑',
  '愤怒': '愤怒',
  '孤独': '孤独',
  '平静': '平静'
};

/**
 * 分析文本中的情绪
 * @param text 用户输入的文本
 * @returns 识别出的情绪类型
 */
export function analyzeEmotion(text: string): string {
  const scores: { [key: string]: number } = {};
  
  // 计算每种情绪的得分
  Object.entries(emotionKeywords).forEach(([emotion, keywords]) => {
    scores[emotion] = 0;
    keywords.forEach(keyword => {
      if (text.includes(keyword)) {
        scores[emotion] += 1;
      }
    });
  });
  
  // 找出得分最高的情绪
  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  
  // 如果没有匹配到任何关键词，默认返回平静
  if (sorted[0][1] === 0) {
    return '平静';
  }
  
  return sorted[0][0];
}

/**
 * 获取情绪对应的 emoji
 */
export function getEmotionEmoji(emotion: string): string {
  return emotionEmojis[emotion] || '😌';
}

/**
 * 获取情绪的中文标签
 */
export function getEmotionLabel(emotion: string): string {
  return emotionLabels[emotion] || '平静';
}

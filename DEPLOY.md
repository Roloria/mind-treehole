# 🚀 Vercel 部署指南

## 方法一：一键部署（推荐）

1. 点击下方按钮：

   [![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Roloria/mind-treehole)

2. 登录 Vercel（可用 GitHub 账号）

3. 点击 **Deploy**

4. 等待部署完成（约 1-2 分钟）

5. 🎉 完成！你会获得一个 `https://mind-treehole-xxx.vercel.app` 地址

---

## 方法二：从 Vercel Dashboard 导入

1. 访问 [vercel.com](https://vercel.com) 并登录

2. 点击 **Add New...** → **Project**

3. 选择 **Import Git Repository**

4. 找到 `Roloria/mind-treehole`，点击 **Import**

5. 保持默认设置，点击 **Deploy**

---

## 配置 OpenAI API Key（可选）

部署后，如果想让 AI 对话更智能：

1. 在 Vercel Dashboard 中打开你的项目

2. 点击 **Settings** → **Environment Variables**

3. 添加：
   - Name: `OPENAI_API_KEY`
   - Value: `sk-xxx`（你的 OpenAI API Key）

4. 点击 **Save**

5. 点击 **Deployments** → 选择最新部署 → **Redeploy**

---

## 本地开发

```bash
# 克隆项目
git clone https://github.com/Roloria/mind-treehole.git
cd mind-treehole

# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 打开 http://localhost:3000
```

---

## 环境变量

| 变量名 | 必填 | 说明 |
|--------|------|------|
| `OPENAI_API_KEY` | 否 | OpenAI API Key，不填则使用预设回复 |

---

## 常见问题

### Q: 部署后对话没有响应？

检查浏览器控制台是否有错误。如果是 API Key 问题，应用会使用预设回复，仍然可以工作。

### Q: 如何自定义域名？

1. Vercel Dashboard → Settings → Domains
2. 添加你的域名
3. 按提示配置 DNS

### Q: 如何查看日志？

Vercel Dashboard → Deployments → 点击部署 → Logs

---

💛 部署完成后，你就有了一个在线的「心灵树洞」！

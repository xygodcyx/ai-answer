// 后端 server.js
const OpenAI = require('openai');
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const DEEPSEEK_API_KEY = 'sk-5199daec3306456790df5c02f9e43a5c';

const openai = new OpenAI({
  baseURL: 'https://api.deepseek.com',
  apiKey: DEEPSEEK_API_KEY,
});

app.get('/new-question', async (req, res) => {
  try {
    const stream = await openai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `你是一个专业出题老师（随机因子：${Math.random()}），
请生成小学难度的问题，领域：数学、科学、历史、文学。只返回问题本身。`,
        },
      ],
      stream: true, // 启用流式输出
      caches: false,
      temperature: 2.0,
      model: 'deepseek-chat',
    });

    res.setHeader('Content-Type', 'text/plain');
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      res.write(content);
    }
    res.end();
  } catch (error) {
    console.error('生成题目失败:', error);
    res.status(500).send('生成题目失败');
  }
});

// 流式验证答案
app.post('/check-answer', async (req, res) => {
  try {
    const { question, answer } = req.body;

    const stream = await openai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `请用以下格式验证答案：包含：1.判断 2.正确答案 3.知识点解释（200字内）并在回答的末尾给出得分，分数在0-100之间，正确性在0-100之间,并用以下格式回复(末尾不要有其他字符)，{"score":number,"correct":number}原始问题：${question}`,
        },
        {
          role: 'user',
          content: `我的回答：${answer}。请验证`,
        },
      ],
      stream: true,
      caches: false,
      temperature: 2.0,
      model: 'deepseek-chat',
    });

    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Response-Mode', 'stream');
    let fullContent = '';

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      fullContent += content;
      res.write(content);
    }

    // 确保最终验证结果
    // if (!fullContent.includes('{')) {
    //   const finalCheck = await validateAnswerWithRetry(question, answer);
    //   res.write(JSON.stringify(finalCheck));
    // }

    res.end();
  } catch (error) {
    console.error('验证失败:', error);
    res.status(500).send('验证失败');
  }
});

async function validateAnswerWithRetry(question, answer) {
  // 重试逻辑确保获得结构化响应
  const response = await openai.chat.completions.create({
    messages: [
      {
        role: 'system',
        content: `请用以下格式验证答案：{
        "correct": boolean,
        "explanation": "包含：1.判断 2.正确答案 3.知识点解释（200字内）"
      }。原始问题：${question}`,
      },
      {
        role: 'user',
        content: `我的回答：${answer}。请验证`,
      },
    ],
    caches: false,
    temperature: 2.0,
    model: 'deepseek-chat',
  });
  res.setHeader('Response-Mode', 'stream');
  return JSON.parse(response.choices[0].message.content.match(/{[\s\S]*?}/)[0]);
}
app.listen(3000, () => {
  console.log('服务器运行在 http://localhost:3000');
});

const OpenAI = require('openai');
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// const DEEPSEEK_API_KEY = 'sk-5199daec3306456790df5c02f9e43a5c';
const DEEPSEEK_API_KEY = 'sk-bbmnohyyguoxyswllncahbixtfjjsdijixwxhuwzkmigddrj';

const openai = new OpenAI({
  baseURL: 'https://api.siliconflow.cn/v1',
  apiKey: DEEPSEEK_API_KEY,
});

app.post('/new-question', async (req, res) => {
  try {
    const { oldQuestion } = req.body;
    console.log('oldQuestion:', oldQuestion);

    const stream = await openai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `这是之前询问过的问题：${oldQuestion}，一定不要重复之前输出过的问题，领域也尽量不要重复，你是一个专业出题老师，
请生成小学难度的问题，领域：数学、科学、历史、文学、金融、计算机，只选择其中一个，不要太难，也不要太简单，只返回问题本身即可。`,
        },
      ],
      stream: true, // 启用流式输出
      caches: false,
      temperature: 0.2,
      model: 'deepseek-ai/DeepSeek-V3',
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
          content: `请用以下格式验证答案，使用html标签输出：包含：1.判断答案是否正确 2.给出正确答案 3.给出知识点解释（200字内）并在回答的末尾给出得分，分数在0-100之间，正确性在0-100之间,只在末尾输出json，在末尾不要有\`\`json标签\`\`只在末尾输出纯洁的json：{"score":number,"correct":number}，原始问题：${question}`,
        },
        {
          role: 'user',
          content: `我的回答：${answer}。请验证`,
        },
      ],
      stream: true,
      caches: false,
      temperature: 0.2,
      model: 'deepseek-ai/DeepSeek-V3',
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
    temperature: 0.2,
    model: 'deepseek-ai/DeepSeek-V3',
  });
  res.setHeader('Response-Mode', 'stream');
  return JSON.parse(response.choices[0].message.content.match(/{[\s\S]*?}/)[0]);
}
app.listen(3000, () => {
  console.log('服务器运行在 http://localhost:3000');
});

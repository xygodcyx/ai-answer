const OpenAI = require('openai');
const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(express.json());

const DEEPSEEK_API_KEY = 'sk-5199daec3306456790df5c02f9e43a5c';

const openai = new OpenAI({
  baseURL: 'https://api.deepseek.com',
  apiKey: DEEPSEEK_API_KEY,
});

// 生成新题目
app.get('/new-question', async (req, res) => {
  try {
    const response = await openai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `你是一个专业出题老师（随机因子：${Math.random().toFixed(
            32
          )}），
请随机生成一个适合当前用户的随机问题，
领域可以是数学、科学、历史、文学中的任意一种，
问题难度为小学难度，
只需要返回问题本身，不要包含答案和解释。`,
        },
      ],
      caches: false,
      temperature: 1.9,
      model: 'deepseek-chat',
    });

    const question = response.choices[0].message.content;
    console.log('生成题目成功:', question);
    res.json({
      question,
      history: response.choices[0].message,
    });
  } catch (error) {
    console.error('生成题目失败:', error);
    res.status(500).send('生成题目失败');
  }
});

// 验证答案
app.post('/check-answer', async (req, res) => {
  try {
    const { question, answer, history } = req.body;

    const response = await openai.chat.completions.create({
      messages: [
        history,
        {
          role: 'user',
          content: `我的回答是：${answer}，请判断是否正确，用中文回答。格式要求：{
                          "correct": "boolean",
                          "explanation": "string"
                      }。解释需要包含：1.正确性判断 2.正确答案说明 3.简要知识点解释（200字内）4`,
        },
      ],
      model: 'deepseek-chat',
    });

    const resultText = response.choices[0].message.content;
    const result = JSON.parse(resultText.match(/{[\s\S]*?}/)[0]);

    res.json({
      correct: result.correct,
      explanation: result.explanation,
    });
  } catch (error) {
    console.error('验证答案失败:', error);
    res.status(500).send('验证答案失败');
  }
});

app.listen(3000, () => {
  console.log('服务器运行在 http://localhost:3000');
});

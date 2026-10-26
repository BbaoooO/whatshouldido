const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

app.post('/api/chat', async (req, res) => {
    const { messages, isPremium } = req.body; 

    const tokenLimit = isPremium ? 800 : 300; 
    const wordLimit = isPremium ? 500 : 200;

    // Chuyển instruction sang tiếng Anh để AI trung lập về ngôn ngữ
    const roleInstruction = isPremium 
        ? `You are an expert psychological and life counselor. Analyze deeply and provide 3-4 specific action steps.`
        : `You are an empathetic and practical companion. Help the user release emotions quickly and provide 1-2 action steps.`;

    const systemPrompt = {
        role: 'system',
        content: `${roleInstruction}
        CRITICAL RULES:
        1. LANGUAGE: You MUST respond in the EXACT SAME LANGUAGE that the user writes in. If they write in Vietnamese, reply in Vietnamese. If English, reply in English. If Spanish, reply in Spanish, etc.
        2. LENGTH: You MUST keep your response under ${wordLimit} words.
        3. COMPLETENESS: You MUST self-adjust the length so your FINAL SENTENCE is COMPLETELY FINISHED with proper punctuation. Never leave a sentence cut off or incomplete.
        4. You are NOT a medical doctor.`
    };

    const apiMessages = [systemPrompt, ...messages];

    try {
        const response = await axios.post('https://api.deepseek.com/chat/completions', {
            model: 'deepseek-chat', 
            messages: apiMessages,
            max_tokens: tokenLimit, 
            temperature: 0.7,
        }, {
            headers: {
                'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        const aiReply = response.data.choices[0].message.content;
        res.json({ reply: aiReply });
    } catch (error) {
        console.error('Lỗi DeepSeek API:', error?.response?.data || error.message);
        res.status(500).json({ error: 'System error. Please try again later.' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Backend Proxy đang chạy tại http://localhost:${PORT}`);
});
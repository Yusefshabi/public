const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.post('/suggestions', async (req, res) => {
    const { bloodType, age, gender, weight } = req.body;

    console.log('Received a request with the following details:', req.body);

    const validBloodTypes = [
        'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'
    ];

    if (!validBloodTypes.includes(bloodType)) {
        console.log('Invalid blood type provided:', bloodType);
        return res.status(400).json({ error: 'Invalid blood type' });
    }

    try {
        const prompts = {
            summary: `Provide a brief summary about the dietary needs for blood type ${bloodType}, considering an individual who is ${age} years old, ${gender}, and weighs ${weight} kg.`,
            proteins: `List the top 5 to 10 proteins for blood type ${bloodType} for a ${age}-year-old ${gender} weighing ${weight} kg.`,
            veggies: `List the top 5 to 10 vegetables for blood type ${bloodType} for a ${age}-year-old ${gender} weighing ${weight} kg.`,
            nuts: `List the top 5 to 10 nuts and seeds for blood type ${bloodType} for a ${age}-year-old ${gender} weighing ${weight} kg.`,
            fruits: `List the top 5 to 10 fruits for blood type ${bloodType} for a ${age}-year-old ${gender} weighing ${weight} kg.`,
            health_goals: `Based on the blood type ${bloodType}, age ${age}, gender ${gender}, and weight ${weight} kg, suggest personalized health goals.`,
            exercise: `Based on the blood type ${bloodType}, age ${age}, gender ${gender}, and weight ${weight} kg, suggest exercise routines that complement the dietary recommendations.`,
        };

        console.log('Generated prompts:', prompts);

        const responses = await Promise.all(
            Object.keys(prompts).map(key =>
                axios.post(
                    'https://api.openai.com/v1/chat/completions',
                    {
                        model: 'gpt-3.5-turbo',
                        messages: [
                            { role: 'system', content: 'You are a helpful assistant.' },
                            { role: 'user', content: prompts[key] }
                        ],
                        max_tokens: 300,
                    },
                    {
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
                        },
                    }
                ).then(response => {
                    console.log(`Response for ${key}:`, response.data.choices[0].message.content.trim());
                    return { key, content: response.data.choices[0].message.content.trim() };
                })
            )
        );

        const result = responses.reduce((acc, { key, content }) => {
            acc[key] = content;
            return acc;
        }, {});

        console.log('Final result to send:', result);
        res.json(result);
    } catch (error) {
        console.error('Error generating suggestions:', error.response?.data || error.message);
        res.status(500).send('Error generating suggestions');
    }
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));


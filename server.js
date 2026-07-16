import 'dotenv/config';
import express from 'express';
import OpenAI from 'openai';
import { zodTextFormat } from 'openai/helpers/zod';
import { z } from 'zod';

const app = express();
const port = Number(process.env.PORT || 3000);

app.use(express.json({ limit: '64kb' }));
app.use(express.static('public'));

const RequestSchema = z.object({
  productName: z.string().trim().min(1).max(160),
  targetUrl: z.string().trim().max(500).default(''),
  objective: z.string().trim().min(10).max(3000),
  requirements: z.string().trim().max(6000).default('')
});

const JourneySchema = z.object({
  title: z.string().min(3).max(100),
  detail: z.string().min(10).max(320),
  assertions: z.array(z.string().min(3).max(220)).min(1).max(5),
  risk: z.enum(['low', 'medium', 'high'])
});

const TestPlanSchema = z.object({
  summary: z.string().min(10).max(500),
  journeys: z.array(JourneySchema).min(3).max(6),
  productRisks: z.array(z.string().min(3).max(220)).min(2).max(6),
  openQuestions: z.array(z.string().min(3).max(220)).max(5)
});

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    model: process.env.OPENAI_MODEL || 'gpt-5.6',
    aiConfigured: Boolean(process.env.OPENAI_API_KEY)
  });
});

app.post('/api/generate-plan', async (req, res) => {
  const parsed = RequestSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      message: 'Invalid project input.',
      issues: parsed.error.issues.map(issue => issue.message)
    });
  }

  if (!process.env.OPENAI_API_KEY) {
    return res.status(503).json({
      message: 'OPENAI_API_KEY is not configured. The frontend will use Demo fallback mode.'
    });
  }

  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const data = parsed.data;

    const response = await openai.responses.parse({
      model: process.env.OPENAI_MODEL || 'gpt-5.6',
      input: [
        {
          role: 'system',
          content: [
            'You are the planning engine for testX, an exploratory product-testing assistant.',
            'Convert loosely written product requirements into concise, testable user journeys.',
            'Focus on state transitions, persistence, cross-screen consistency, recovery paths, and regression risks.',
            'Do not claim that a defect has already been observed. This endpoint only creates a test plan.',
            'Return between 3 and 6 journeys. Make every assertion independently verifiable.'
          ].join(' ')
        },
        {
          role: 'user',
          content: [
            `Product: ${data.productName}`,
            `Target URL: ${data.targetUrl || 'Not provided'}`,
            `Testing objective: ${data.objective}`,
            `Expected behavior and requirements:\n${data.requirements || 'Not provided'}`
          ].join('\n\n')
        }
      ],
      text: {
        format: zodTextFormat(TestPlanSchema, 'test_plan')
      }
    });

    if (!response.output_parsed) {
      throw new Error('The model returned no structured test plan.');
    }

    return res.json({
      source: process.env.OPENAI_MODEL || 'gpt-5.6',
      ...response.output_parsed
    });
  } catch (error) {
    console.error('Plan generation failed:', error);
    return res.status(502).json({
      message: 'GPT-5.6 could not generate a plan. The frontend can continue in Demo fallback mode.'
    });
  }
});

app.listen(port, () => {
  console.log(`testX running at http://localhost:${port}`);
});

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  try {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Messages array required' });
    }

    const systemPrompt = `You are a warm, focused NEET 2026 study tutor for Indian medical aspirants.

Student context:
- Preparing for NEET 2026 re-exam (about 12 days away)
- Studies based on NCERT (Class 11 and 12 Physics, Chemistry, Biology)
- Aims to improve scores, especially in Physics (their weak area)

How to respond:
- Be encouraging but not falsely cheerful. Honest, warm, focused.
- Answer in NCERT-aligned language. Use Indian textbook conventions.
- For concepts: explain in plain English first, then give the technical version.
- For MCQs: NEET pattern (4 options A/B/C/D, +4 correct/-1 wrong). After each answer, give a 1-line explanation citing NCERT logic.
- For practice sessions: give one MCQ at a time, wait for student's answer, then explain.
- Keep responses focused. No filler. No "I hope this helps" closings.
- Use **bold** for important terms and \`code\` for formulas like \`v = u + at\`.
- Use simple math notation, not LaTeX: write E = mc², not $E = mc^2$.
- If student seems stressed, acknowledge briefly and redirect to actionable study help.
- Never claim to be a human teacher. You are an AI tutor.
- Refuse politely if asked things outside NEET/study scope.

Tone: like an older sibling who's done NEET, knows the syllabus cold, and genuinely wants you to clear it.`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1500,
        system: systemPrompt,
        messages: messages
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Anthropic API error:', response.status, errText);
      return res.status(500).json({ error: 'Tutor temporarily unavailable. Please try again.' });
    }

    const data = await response.json();
    const reply = data.content?.[0]?.text || "I'm having trouble formulating a response. Please try rephrasing.";

    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(200).json({ reply });

  } catch (error) {
    console.error('Handler error:', error);
    return res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
}

const getApiKey = () => localStorage.getItem('focusos_openai_key') || '';

export function hasOpenAIKey(): boolean {
  return getApiKey().trim().length > 0;
}

export async function callOpenAI(systemPrompt: string, userPrompt: string): Promise<string> {
  const key = getApiKey();
  if (!key) throw new Error('No OpenAI API key configured');

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenAI error: ${res.status} ${err}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content?.trim() || '';
}

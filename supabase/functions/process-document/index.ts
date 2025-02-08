
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { Configuration, OpenAIApi } from 'https://esm.sh/openai@3.2.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

console.log("process-document function started")

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { text, summaryType, summarySize } = await req.json()

    // Initialize OpenAI
    const configuration = new Configuration({
      apiKey: Deno.env.get('OPENAI_API_KEY'),
    })
    const openai = new OpenAIApi(configuration)

    // Prepare the prompt based on summary type and size
    let prompt = `${summaryType === 'bullets' ? 'Create a bullet-point summary' : 'Write a comprehensive summary'} of the following text. `
    
    switch (summarySize) {
      case 'quarter':
        prompt += 'Keep it very concise.'
        break
      case 'half':
        prompt += 'Provide a moderate level of detail.'
        break
      case 'full':
        prompt += 'Include all important details.'
        break
    }

    // Call OpenAI API
    const completion = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: prompt
        },
        {
          role: "user",
          content: text
        }
      ],
    })

    const summary = completion.data.choices[0]?.message?.content || 'Unable to generate summary'

    // Return the result
    return new Response(
      JSON.stringify({ summary }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  }
})

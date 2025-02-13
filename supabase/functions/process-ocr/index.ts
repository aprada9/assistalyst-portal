import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SUPPORTED_FORMATS = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const formData = await req.formData()
    const file = formData.get('file')

    if (!file) {
      throw new Error('No file uploaded')
    }

    console.log('File received:', file.name, 'Type:', file.type);

    // Validate file type
    if (!SUPPORTED_FORMATS.includes(file.type)) {
      throw new Error('Unsupported file format. Please upload a PNG, JPEG, GIF, or WebP image.')
    }

    // Create Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Upload file to storage
    const fileName = `${crypto.randomUUID()}-${file.name}`
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('documents')
      .upload(fileName, file)

    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw new Error(`Upload error: ${uploadError.message}`)
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('documents')
      .getPublicUrl(fileName)

    console.log('File uploaded, public URL:', publicUrl);

    // Process with OpenAI
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "gpt-4-vision-preview",
        messages: [
          {
            role: "system",
            content: `You are a document analysis assistant that extracts and formats text from images.
            Your task is to:
            1. Extract all text from the image
            2. Preserve the original document structure and formatting
            3. Use HTML tags to maintain layout and styling:
               - Use <h1>, <h2>, etc. for titles and headings
               - Use <p> for paragraphs
               - Use <ul> and <li> for lists
               - Use <table>, <tr>, <td> for tabular data
               - Use <br> for line breaks
               - Use <strong> for bold text
               - Use <em> for emphasized text
            4. If you detect specific document types (forms, invoices, etc.), structure the content accordingly
            5. Maintain the visual hierarchy of the original document
            6. Return ONLY the formatted HTML without any markdown code fence markers or explanations`
          },
          {
            role: "user",
            content: [
              {
                "type": "image_url",
                "image_url": {
                  "url": publicUrl
                }
              },
              "Please extract and format the text from this document, preserving its structure and layout. Use appropriate HTML tags to maintain the formatting."
            ]
          }
        ],
        max_tokens: 4000,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      console.error('OpenAI API error:', error)
      throw new Error('Failed to process image')
    }

    const data = await response.json()
    console.log('OpenAI API response received');
    
    const text = data.choices[0]?.message?.content || 'Unable to extract text'

    // Delete the uploaded file after processing
    const { error: deleteError } = await supabase.storage
      .from('documents')
      .remove([fileName])

    if (deleteError) {
      console.error('Error deleting file:', deleteError);
    }

    return new Response(
      JSON.stringify({ text }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 },
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 },
    )
  }
})


import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SearchRequest {
  query: string;
  webSource: string;
  customWebs?: string;
}

serve(async (req) => {
  const apiKey = Deno.env.get('OPENAI_API_KEY')!;
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, webSource, customWebs } = await req.json() as SearchRequest;
    console.log('Processing MiniPlex search request:', { query, webSource, customWebs });

    // Prepare search parameters based on webSource
    let searchDomainFilter: string[] = [];
    if (webSource === 'boe') {
      searchDomainFilter = ['boe.es'];
    } else if (webSource === 'borne') {
      searchDomainFilter = ['borne.gov.uk'];
    } else if (webSource === 'custom' && customWebs) {
      searchDomainFilter = customWebs.split(',').map(domain => domain.trim());
    }

    // OpenAI API call with custom system prompt for Scira-like behavior
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: `You are a helpful AI search assistant. When responding:
              1. Always cite sources using [number] format
              2. Keep responses clear and concise
              3. Use search results to provide accurate, current information
              4. List all citations at the end with full URLs
              5. Suggest 3 related questions that might interest the user`
          },
          {
            role: 'user',
            content: query
          }
        ],
        temperature: 0.2,
        max_tokens: 1000
      }),
    });

    const data = await response.json();
    console.log('OpenAI API response:', data);

    // Extract the main response
    const content = data.choices[0].message.content;

    // Parse citations and related questions
    const citations: Array<{ title: string; url: string }> = [];
    const relatedQuestions: string[] = [];
    
    // Extract citations [1], [2], etc. and their corresponding URLs
    const citationRegex = /\[(\d+)\](?:.*?)(?:http[s]?:\/\/[^\s\]]+)/g;
    let match;
    const citationUrls = new Set<string>();
    
    while ((match = citationRegex.exec(content)) !== null) {
      const url = match[0].match(/http[s]?:\/\/[^\s\]]+/)[0];
      if (!citationUrls.has(url)) {
        citations.push({
          title: `Source ${match[1]}`,
          url: url
        });
        citationUrls.add(url);
      }
    }

    // Extract related questions (assuming they're at the end of the response)
    const questionLines = content.split('\n').filter(line => 
      line.trim().match(/^\d+\.\s+.+\?$/));
    questionLines.slice(0, 3).forEach(line => {
      relatedQuestions.push(line.replace(/^\d+\.\s+/, ''));
    });

    // Process the response to replace citation numbers with links
    let processedContent = content;
    citations.forEach((citation, index) => {
      const citationMark = `[${index + 1}]`;
      const citationLink = `<a href="${citation.url}" target="_blank" rel="noopener noreferrer" class="text-primary hover:underline inline-flex items-center gap-1">${citationMark}<span class="text-xs text-muted-foreground">(${citation.title})</span></a>`;
      processedContent = processedContent.replace(new RegExp(`\\[${index + 1}\\]`, 'g'), citationLink);
    });

    // Store the search result in the database
    const { error: insertError } = await supabase
      .from('miniplex_results')
      .insert({
        query,
        result: processedContent,
        citations,
        web_source: webSource,
        custom_webs: customWebs,
        related_questions: relatedQuestions
      });

    if (insertError) {
      console.error('Error storing MiniPlex result:', insertError);
    }

    return new Response(
      JSON.stringify({
        result: processedContent,
        citations,
        related_questions: relatedQuestions
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in process-miniplex function:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to process MiniPlex search request' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

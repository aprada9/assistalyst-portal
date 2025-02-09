
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
  const apiKey = Deno.env.get('PERPLEXITY_API_KEY')!;
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, webSource, customWebs } = await req.json() as SearchRequest;
    console.log('Processing search request:', { query, webSource, customWebs });

    // Prepare the search domain filter based on webSource
    let searchDomainFilter: string[] = [];
    if (webSource === 'boe') {
      searchDomainFilter = ['boe.es'];
    } else if (webSource === 'borne') {
      searchDomainFilter = ['borne.gov.uk'];
    } else if (webSource === 'custom' && customWebs) {
      searchDomainFilter = customWebs.split(',').map(domain => domain.trim());
    }

    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-sonar-small-128k-online',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant that provides accurate information with citations. Always be concise and clear.'
          },
          {
            role: 'user',
            content: query
          }
        ],
        temperature: 0.2,
        top_p: 0.9,
        max_tokens: 1000,
        return_images: false,
        return_related_questions: true,
        search_domain_filter: searchDomainFilter.length > 0 ? searchDomainFilter : undefined,
        search_recency_filter: 'month',
        frequency_penalty: 1,
        presence_penalty: 0
      }),
    });

    const data = await response.json();
    console.log('Perplexity API response:', data);

    // Extract citations from the response
    const citations = data.references || [];

    // Store the search result in the database
    const { error: insertError } = await supabase
      .from('search_results')
      .insert({
        query,
        result: data.choices[0].message.content,
        citations,
        web_source: webSource,
        custom_webs: customWebs
      });

    if (insertError) {
      console.error('Error storing search result:', insertError);
    }

    return new Response(
      JSON.stringify({
        result: data.choices[0].message.content,
        citations,
        related_questions: data.related_questions || []
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in process-search function:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to process search request' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Validation schema for manufacturer profile fields
const ManufacturerFieldSchema = z.object({
  legal_name: z.string().trim().min(1).max(200),
  tax_id: z.string().trim().min(1).max(50),
  registered_brand: z.string().trim().min(1).max(200),
  brand_logo_url: z.string().url(),
  country: z.string().trim().min(2).max(100),
  province: z.string().trim().min(1).max(100),
  city: z.string().trim().min(1).max(100),
  address: z.string().trim().min(1).max(500),
  official_website: z.string().url(),
  primary_contact_name: z.string().trim().min(1).max(200),
  primary_contact_email: z.string().email(),
  primary_contact_phone: z.string().trim().min(1).max(50),
  certifications: z.array(z.string()).min(1).max(50),
  vacation_dates: z.string().trim().min(1).max(500),
  product_sectors: z.array(z.string()).min(1).max(50),
  factory_positioning: z.string().trim().min(1).max(2000),
  factory_history: z.string().trim().min(1).max(2000),
  photos_production_lines: z.array(z.string().url()).min(1).max(20),
  photos_staff: z.array(z.string().url()).min(1).max(20),
  photos_machinery: z.array(z.string().url()).min(1).max(20),
  photos_warehouse: z.array(z.string().url()).min(1).max(20),
  photos_container_loading: z.array(z.string().url()).min(1).max(20),
  terms_accepted: z.boolean().refine(val => val === true, { message: 'Terms must be accepted' })
});

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const { data, error } = await supabase
      .from('manufacturers')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) {
      console.error('Error fetching manufacturer:', error);
      return new Response(
        JSON.stringify({ status: 'error', error: error.message }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    if (!data) {
      return new Response(
        JSON.stringify({ status: 'incomplete', reason: 'profile_not_found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate manufacturer profile data using Zod schema
    try {
      ManufacturerFieldSchema.parse(data);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const missingFields = error.errors.map(e => e.path.join('.'));
        return new Response(
          JSON.stringify({ 
            status: 'incomplete', 
            missing_fields: missingFields,
            validation_errors: error.errors
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      throw error;
    }

    return new Response(
      JSON.stringify({ 
        status: data.verified ? 'verified' : 'complete', 
        verified: data.verified,
        data
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    // Log detailed error server-side only
    console.error('Error checking manufacturer profile:', error);
    
    // Return generic message to client
    return new Response(
      JSON.stringify({ 
        status: 'error', 
        error: 'Unable to check profile status. Please try again.' 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

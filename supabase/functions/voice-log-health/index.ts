import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    // Get user from auth header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Authorization header required");
    }

    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);
    const userClient = createClient(supabaseUrl, supabaseServiceKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Get user from token
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      throw new Error("Invalid user token");
    }

    const body = await req.json();
    const { logType, data, transcript, aiResponse } = body;

    let result;

    switch (logType) {
      case "food": {
        const { 
          items, 
          meal_type, 
          estimated_protein_grams, 
          estimated_calories,
          protein_confidence,
          data_source 
        } = data;
        
        const { data: insertedData, error } = await supabaseClient
          .from("food_logs")
          .insert({
            user_id: user.id,
            items: items || [],
            meal_type: meal_type,
            estimated_protein: estimated_protein_grams,
            estimated_calories: estimated_calories,
            protein_confidence: protein_confidence || null,
            data_source: data_source || "patient_reported",
            logged_via: "voice",
            transcript: transcript
          })
          .select()
          .single();

        if (error) throw error;
        result = { 
          success: true, 
          message: `Logged ${items?.length || 0} food item(s) with ${estimated_protein_grams || 0}g protein`,
          data: insertedData
        };
        break;
      }

      case "activity": {
        const { 
          activity_type, 
          duration_minutes, 
          intensity,
          step_count,
          anabolic_window_timing 
        } = data;
        
        const { data: insertedData, error } = await supabaseClient
          .from("activity_logs")
          .insert({
            user_id: user.id,
            activity_type: activity_type,
            duration_minutes: duration_minutes,
            intensity: intensity,
            step_count: step_count || null,
            notes: anabolic_window_timing ? `Timing: ${anabolic_window_timing}` : null,
            logged_via: "voice",
            transcript: transcript
          })
          .select()
          .single();

        if (error) throw error;
        result = { 
          success: true, 
          message: `Logged activity: ${activity_type}${step_count ? ` (${step_count} steps)` : ''}`,
          data: insertedData
        };
        break;
      }

      case "symptom": {
        const { 
          symptoms, 
          safety_flags, 
          notes,
          sleep_quality,
          suggested_action 
        } = data;
        
        const { data: insertedData, error } = await supabaseClient
          .from("symptom_logs")
          .insert({
            user_id: user.id,
            symptoms: symptoms || {},
            safety_flags: safety_flags || [],
            sleep_quality: sleep_quality || null,
            suggested_action: suggested_action || null,
            ai_response: aiResponse,
            logged_via: "voice",
            transcript: transcript
          })
          .select()
          .single();

        if (error) throw error;

        // Check for safety flags
        const hasSafetyFlags = safety_flags && safety_flags.length > 0;
        
        result = { 
          success: true, 
          message: hasSafetyFlags 
            ? `Logged symptoms with safety concern: ${safety_flags.join(", ")}`
            : `Logged ${Object.keys(symptoms || {}).length} symptom(s)`,
          hasSafetyFlags,
          safetyFlags: safety_flags,
          suggestedAction: suggested_action,
          data: insertedData
        };
        break;
      }

      default:
        throw new Error(`Unknown log type: ${logType}`);
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Voice log error:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : "Unknown error" 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

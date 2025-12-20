export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      activity_log: {
        Row: {
          action: string
          created_at: string | null
          entity: string
          entity_id: string | null
          id: string
          metadata: Json | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          entity: string
          entity_id?: string | null
          id?: string
          metadata?: Json | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          entity?: string
          entity_id?: string | null
          id?: string
          metadata?: Json | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_manufacturer_info"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          created_at: string | null
          file_url: string
          id: string
          type: string
          user_id: string
          verified: boolean | null
        }
        Insert: {
          created_at?: string | null
          file_url: string
          id?: string
          type: string
          user_id: string
          verified?: boolean | null
        }
        Update: {
          created_at?: string | null
          file_url?: string
          id?: string
          type?: string
          user_id?: string
          verified?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_manufacturer_info"
            referencedColumns: ["id"]
          },
        ]
      }
      local_shipping_zones: {
        Row: {
          active: boolean
          base_price: number
          created_at: string
          created_by: string | null
          description: string | null
          display_order: number
          id: string
          name: string
          postal_code_ranges: Json
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          active?: boolean
          base_price: number
          created_at?: string
          created_by?: string | null
          description?: string | null
          display_order?: number
          id?: string
          name: string
          postal_code_ranges?: Json
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          active?: boolean
          base_price?: number
          created_at?: string
          created_by?: string | null
          description?: string | null
          display_order?: number
          id?: string
          name?: string
          postal_code_ranges?: Json
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      manufacturers: {
        Row: {
          address: string
          brand_logo_url: string
          certifications: string[]
          city: string
          country: string
          created_at: string | null
          english_level: string
          facility_area_m2: number | null
          factory_history: string
          factory_positioning: string
          id: string
          legal_name: string
          machinery: string | null
          official_website: string
          photos_container_loading: string[]
          photos_machinery: string[]
          photos_production_lines: string[]
          photos_staff: string[]
          photos_warehouse: string[]
          postal_code: string | null
          primary_contact_email: string
          primary_contact_messaging: string | null
          primary_contact_name: string
          primary_contact_phone: string
          product_sectors: string[]
          production_capacity: string | null
          province: string
          registered_brand: string
          secondary_contact_email: string | null
          secondary_contact_messaging: string | null
          secondary_contact_name: string | null
          secondary_contact_phone: string | null
          tax_id: string
          terms_accepted: boolean
          total_employees: number | null
          updated_at: string | null
          user_id: string | null
          vacation_dates: string
          verification_notes: string | null
          verification_status: string | null
          verified: boolean | null
        }
        Insert: {
          address: string
          brand_logo_url: string
          certifications: string[]
          city: string
          country: string
          created_at?: string | null
          english_level: string
          facility_area_m2?: number | null
          factory_history: string
          factory_positioning: string
          id?: string
          legal_name: string
          machinery?: string | null
          official_website: string
          photos_container_loading?: string[]
          photos_machinery?: string[]
          photos_production_lines?: string[]
          photos_staff?: string[]
          photos_warehouse?: string[]
          postal_code?: string | null
          primary_contact_email: string
          primary_contact_messaging?: string | null
          primary_contact_name: string
          primary_contact_phone: string
          product_sectors: string[]
          production_capacity?: string | null
          province: string
          registered_brand: string
          secondary_contact_email?: string | null
          secondary_contact_messaging?: string | null
          secondary_contact_name?: string | null
          secondary_contact_phone?: string | null
          tax_id: string
          terms_accepted?: boolean
          total_employees?: number | null
          updated_at?: string | null
          user_id?: string | null
          vacation_dates: string
          verification_notes?: string | null
          verification_status?: string | null
          verified?: boolean | null
        }
        Update: {
          address?: string
          brand_logo_url?: string
          certifications?: string[]
          city?: string
          country?: string
          created_at?: string | null
          english_level?: string
          facility_area_m2?: number | null
          factory_history?: string
          factory_positioning?: string
          id?: string
          legal_name?: string
          machinery?: string | null
          official_website?: string
          photos_container_loading?: string[]
          photos_machinery?: string[]
          photos_production_lines?: string[]
          photos_staff?: string[]
          photos_warehouse?: string[]
          postal_code?: string | null
          primary_contact_email?: string
          primary_contact_messaging?: string | null
          primary_contact_name?: string
          primary_contact_phone?: string
          product_sectors?: string[]
          production_capacity?: string | null
          province?: string
          registered_brand?: string
          secondary_contact_email?: string | null
          secondary_contact_messaging?: string | null
          secondary_contact_name?: string | null
          secondary_contact_phone?: string | null
          tax_id?: string
          terms_accepted?: boolean
          total_employees?: number | null
          updated_at?: string | null
          user_id?: string | null
          vacation_dates?: string
          verification_notes?: string | null
          verification_status?: string | null
          verified?: boolean | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          message: string
          read: boolean | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          message: string
          read?: boolean | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          message?: string
          read?: boolean | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_manufacturer_info"
            referencedColumns: ["id"]
          },
        ]
      }
      order_tracking: {
        Row: {
          created_at: string
          id: string
          metadata: Json | null
          order_id: string | null
          product_id: string
          session_id: string | null
          step: Database["public"]["Enums"]["tracking_step"]
          timestamp: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          metadata?: Json | null
          order_id?: string | null
          product_id: string
          session_id?: string | null
          step: Database["public"]["Enums"]["tracking_step"]
          timestamp?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          metadata?: Json | null
          order_id?: string | null
          product_id?: string
          session_id?: string | null
          step?: Database["public"]["Enums"]["tracking_step"]
          timestamp?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_tracking_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_tracking_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          agreement_notes: string | null
          buyer_company: string | null
          buyer_email: string | null
          buyer_id: string
          buyer_notes: string | null
          calculation_snapshot: Json | null
          contract_url: string | null
          created_at: string | null
          customs_cost: number | null
          delivery_estimate: string | null
          id: string
          incoterm: string | null
          insurance_cost: number | null
          logistics_cost: number | null
          manufacturer_id: string
          manufacturer_notes: string | null
          payment_method: string | null
          payment_status: string
          product_id: string
          quantity: number
          rejected_reason: string | null
          response_date: string | null
          session_id: string | null
          status: string
          total_final: number | null
          total_price: number
          tracking_info: Json | null
          tracking_stage: string | null
          updated_at: string | null
        }
        Insert: {
          agreement_notes?: string | null
          buyer_company?: string | null
          buyer_email?: string | null
          buyer_id: string
          buyer_notes?: string | null
          calculation_snapshot?: Json | null
          contract_url?: string | null
          created_at?: string | null
          customs_cost?: number | null
          delivery_estimate?: string | null
          id?: string
          incoterm?: string | null
          insurance_cost?: number | null
          logistics_cost?: number | null
          manufacturer_id: string
          manufacturer_notes?: string | null
          payment_method?: string | null
          payment_status?: string
          product_id: string
          quantity: number
          rejected_reason?: string | null
          response_date?: string | null
          session_id?: string | null
          status?: string
          total_final?: number | null
          total_price: number
          tracking_info?: Json | null
          tracking_stage?: string | null
          updated_at?: string | null
        }
        Update: {
          agreement_notes?: string | null
          buyer_company?: string | null
          buyer_email?: string | null
          buyer_id?: string
          buyer_notes?: string | null
          calculation_snapshot?: Json | null
          contract_url?: string | null
          created_at?: string | null
          customs_cost?: number | null
          delivery_estimate?: string | null
          id?: string
          incoterm?: string | null
          insurance_cost?: number | null
          logistics_cost?: number | null
          manufacturer_id?: string
          manufacturer_notes?: string | null
          payment_method?: string | null
          payment_status?: string
          product_id?: string
          quantity?: number
          rejected_reason?: string | null
          response_date?: string | null
          session_id?: string | null
          status?: string
          total_final?: number | null
          total_price?: number
          tracking_info?: Json | null
          tracking_stage?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "public_manufacturer_info"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_manufacturer_id_fkey"
            columns: ["manufacturer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_manufacturer_id_fkey"
            columns: ["manufacturer_id"]
            isOneToOne: false
            referencedRelation: "public_manufacturer_info"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      pallet_items: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          product_id: string
          quantity: number
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          product_id: string
          quantity?: number
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          product_id?: string
          quantity?: number
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pallet_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          admin_notes: string | null
          brand: string | null
          category: string
          certifications: Json | null
          cif_value: number | null
          color: string | null
          condition: string | null
          created_at: string | null
          delivery_port: string | null
          description: string | null
          destination_expenses: number | null
          dimensions: string | null
          discount_10u: number | null
          discount_3u: number | null
          discount_5u: number | null
          discount_8u: number | null
          freight_cost_per_m3: number | null
          height_cm: number | null
          hs_code: string | null
          id: string
          images: Json | null
          lead_time_logistics_days: number | null
          lead_time_production_days: number | null
          length_cm: number | null
          local_delivery_cost: number | null
          logistics_time_days: number | null
          manufacturer_id: string | null
          marine_insurance_cost: number | null
          marine_insurance_percentage: number | null
          material: string | null
          model: string | null
          moq: number
          name: string
          origin_expenses: number | null
          packaging: string | null
          packaging_height_cm: number | null
          packaging_length_cm: number | null
          packaging_type: string | null
          packaging_width_cm: number | null
          preview_url: string | null
          price_unit: number
          price_usd: number | null
          service_terms: string | null
          shipping_cost_total: number | null
          sku: string | null
          specs: string | null
          status: string
          stock: number
          stock_min: number | null
          subcategory: string | null
          tariff_cost: number | null
          tariff_percentage: number | null
          taxable_base: number | null
          technical_docs: Json | null
          total_cost_with_taxes: number | null
          transport_notes: string | null
          updated_at: string | null
          validated_at: string | null
          vat_cost: number | null
          vat_percentage: number | null
          videos: string[] | null
          views_count: number | null
          volume_m3: number | null
          warranty_terms: string | null
          weight: string | null
          weight_gross_kg: number | null
          weight_net_kg: number | null
          width_cm: number | null
        }
        Insert: {
          admin_notes?: string | null
          brand?: string | null
          category: string
          certifications?: Json | null
          cif_value?: number | null
          color?: string | null
          condition?: string | null
          created_at?: string | null
          delivery_port?: string | null
          description?: string | null
          destination_expenses?: number | null
          dimensions?: string | null
          discount_10u?: number | null
          discount_3u?: number | null
          discount_5u?: number | null
          discount_8u?: number | null
          freight_cost_per_m3?: number | null
          height_cm?: number | null
          hs_code?: string | null
          id?: string
          images?: Json | null
          lead_time_logistics_days?: number | null
          lead_time_production_days?: number | null
          length_cm?: number | null
          local_delivery_cost?: number | null
          logistics_time_days?: number | null
          manufacturer_id?: string | null
          marine_insurance_cost?: number | null
          marine_insurance_percentage?: number | null
          material?: string | null
          model?: string | null
          moq?: number
          name: string
          origin_expenses?: number | null
          packaging?: string | null
          packaging_height_cm?: number | null
          packaging_length_cm?: number | null
          packaging_type?: string | null
          packaging_width_cm?: number | null
          preview_url?: string | null
          price_unit: number
          price_usd?: number | null
          service_terms?: string | null
          shipping_cost_total?: number | null
          sku?: string | null
          specs?: string | null
          status?: string
          stock?: number
          stock_min?: number | null
          subcategory?: string | null
          tariff_cost?: number | null
          tariff_percentage?: number | null
          taxable_base?: number | null
          technical_docs?: Json | null
          total_cost_with_taxes?: number | null
          transport_notes?: string | null
          updated_at?: string | null
          validated_at?: string | null
          vat_cost?: number | null
          vat_percentage?: number | null
          videos?: string[] | null
          views_count?: number | null
          volume_m3?: number | null
          warranty_terms?: string | null
          weight?: string | null
          weight_gross_kg?: number | null
          weight_net_kg?: number | null
          width_cm?: number | null
        }
        Update: {
          admin_notes?: string | null
          brand?: string | null
          category?: string
          certifications?: Json | null
          cif_value?: number | null
          color?: string | null
          condition?: string | null
          created_at?: string | null
          delivery_port?: string | null
          description?: string | null
          destination_expenses?: number | null
          dimensions?: string | null
          discount_10u?: number | null
          discount_3u?: number | null
          discount_5u?: number | null
          discount_8u?: number | null
          freight_cost_per_m3?: number | null
          height_cm?: number | null
          hs_code?: string | null
          id?: string
          images?: Json | null
          lead_time_logistics_days?: number | null
          lead_time_production_days?: number | null
          length_cm?: number | null
          local_delivery_cost?: number | null
          logistics_time_days?: number | null
          manufacturer_id?: string | null
          marine_insurance_cost?: number | null
          marine_insurance_percentage?: number | null
          material?: string | null
          model?: string | null
          moq?: number
          name?: string
          origin_expenses?: number | null
          packaging?: string | null
          packaging_height_cm?: number | null
          packaging_length_cm?: number | null
          packaging_type?: string | null
          packaging_width_cm?: number | null
          preview_url?: string | null
          price_unit?: number
          price_usd?: number | null
          service_terms?: string | null
          shipping_cost_total?: number | null
          sku?: string | null
          specs?: string | null
          status?: string
          stock?: number
          stock_min?: number | null
          subcategory?: string | null
          tariff_cost?: number | null
          tariff_percentage?: number | null
          taxable_base?: number | null
          technical_docs?: Json | null
          total_cost_with_taxes?: number | null
          transport_notes?: string | null
          updated_at?: string | null
          validated_at?: string | null
          vat_cost?: number | null
          vat_percentage?: number | null
          videos?: string[] | null
          views_count?: number | null
          volume_m3?: number | null
          warranty_terms?: string | null
          weight?: string | null
          weight_gross_kg?: number | null
          weight_net_kg?: number | null
          width_cm?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "products_manufacturer_id_profiles_fkey"
            columns: ["manufacturer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_manufacturer_id_profiles_fkey"
            columns: ["manufacturer_id"]
            isOneToOne: false
            referencedRelation: "public_manufacturer_info"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          address: string | null
          city: string | null
          company_name: string
          country: string
          created_at: string | null
          delivery_address: string | null
          delivery_city: string | null
          delivery_hours: string | null
          delivery_phone: string | null
          delivery_postal_code: string | null
          email: string
          eori_number: string | null
          full_name: string
          id: string
          importer_status: string | null
          is_professional_business: boolean | null
          is_verified: boolean | null
          mobile_phone: string | null
          postal_code: string | null
          role: Database["public"]["Enums"]["user_role"]
          tax_id: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          company_name: string
          country: string
          created_at?: string | null
          delivery_address?: string | null
          delivery_city?: string | null
          delivery_hours?: string | null
          delivery_phone?: string | null
          delivery_postal_code?: string | null
          email: string
          eori_number?: string | null
          full_name: string
          id: string
          importer_status?: string | null
          is_professional_business?: boolean | null
          is_verified?: boolean | null
          mobile_phone?: string | null
          postal_code?: string | null
          role: Database["public"]["Enums"]["user_role"]
          tax_id?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          company_name?: string
          country?: string
          created_at?: string | null
          delivery_address?: string | null
          delivery_city?: string | null
          delivery_hours?: string | null
          delivery_phone?: string | null
          delivery_postal_code?: string | null
          email?: string
          eori_number?: string | null
          full_name?: string
          id?: string
          importer_status?: string | null
          is_professional_business?: boolean | null
          is_verified?: boolean | null
          mobile_phone?: string | null
          postal_code?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          tax_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      quote_requests: {
        Row: {
          admin_notes: string | null
          calculation_snapshot: Json | null
          created_at: string
          destination_port: string | null
          email: string
          id: string
          is_authenticated: boolean
          mobile_phone: string
          notes: string | null
          postal_code: string
          product_id: string
          quantity: number | null
          status: string
          tax_id: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          admin_notes?: string | null
          calculation_snapshot?: Json | null
          created_at?: string
          destination_port?: string | null
          email: string
          id?: string
          is_authenticated?: boolean
          mobile_phone: string
          notes?: string | null
          postal_code: string
          product_id: string
          quantity?: number | null
          status?: string
          tax_id: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          admin_notes?: string | null
          calculation_snapshot?: Json | null
          created_at?: string
          destination_port?: string | null
          email?: string
          id?: string
          is_authenticated?: boolean
          mobile_phone?: string
          notes?: string | null
          postal_code?: string
          product_id?: string
          quantity?: number | null
          status?: string
          tax_id?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quote_requests_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quote_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quote_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_manufacturer_info"
            referencedColumns: ["id"]
          },
        ]
      }
      settings: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          key: string
          type: string
          updated_at: string | null
          value: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          key: string
          type: string
          updated_at?: string | null
          value: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          key?: string
          type?: string
          updated_at?: string | null
          value?: string
        }
        Relationships: []
      }
      shipping_routes: {
        Row: {
          active: boolean | null
          created_at: string | null
          destination_country: string
          destination_port: string | null
          freight_cost_override: number | null
          id: string
          last_updated: string | null
          max_days: number
          min_days: number
          notes: string | null
          origin_port: string
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          destination_country: string
          destination_port?: string | null
          freight_cost_override?: number | null
          id?: string
          last_updated?: string | null
          max_days: number
          min_days: number
          notes?: string | null
          origin_port: string
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          destination_country?: string
          destination_port?: string | null
          freight_cost_override?: number | null
          id?: string
          last_updated?: string | null
          max_days?: number
          min_days?: number
          notes?: string | null
          origin_port?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      volume_surcharges: {
        Row: {
          active: boolean
          created_at: string
          created_by: string | null
          description: string | null
          display_order: number
          id: string
          max_volume: number | null
          min_volume: number
          requires_quote: boolean
          surcharge_amount: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          active?: boolean
          created_at?: string
          created_by?: string | null
          description?: string | null
          display_order?: number
          id?: string
          max_volume?: number | null
          min_volume: number
          requires_quote?: boolean
          surcharge_amount?: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          active?: boolean
          created_at?: string
          created_by?: string | null
          description?: string | null
          display_order?: number
          id?: string
          max_volume?: number | null
          min_volume?: number
          requires_quote?: boolean
          surcharge_amount?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      public_manufacturer_info: {
        Row: {
          company_name: string | null
          country: string | null
          created_at: string | null
          id: string | null
          is_verified: boolean | null
          role: Database["public"]["Enums"]["user_role"] | null
        }
        Insert: {
          company_name?: string | null
          country?: string | null
          created_at?: string | null
          id?: string | null
          is_verified?: boolean | null
          role?: Database["public"]["Enums"]["user_role"] | null
        }
        Update: {
          company_name?: string | null
          country?: string | null
          created_at?: string | null
          id?: string | null
          is_verified?: boolean | null
          role?: Database["public"]["Enums"]["user_role"] | null
        }
        Relationships: []
      }
    }
    Functions: {
      get_categories_stats: {
        Args: never
        Returns: {
          total_categories: number
        }[]
      }
      get_most_viewed_products_tracking: {
        Args: { limit_count?: number }
        Returns: {
          product_id: string
          product_name: string
          view_count: number
        }[]
      }
      get_order_funnel_analytics: {
        Args: never
        Returns: {
          conversion_rate: number
          count: number
          step: string
        }[]
      }
      get_orders_by_country:
        | {
            Args: never
            Returns: {
              country: string
              total_amount: number
              total_orders: number
            }[]
          }
        | {
            Args: { p_end_date?: string; p_start_date?: string }
            Returns: {
              country: string
              total_amount: number
              total_orders: number
            }[]
          }
      get_orders_stats:
        | {
            Args: never
            Returns: {
              avg_order_value: number
              completed_orders: number
              pending_orders: number
              total_income: number
              total_orders: number
            }[]
          }
        | {
            Args: { p_end_date?: string; p_start_date?: string }
            Returns: {
              avg_order_value: number
              completed_orders: number
              pending_orders: number
              total_income: number
              total_orders: number
            }[]
          }
      get_products_by_category: {
        Args: never
        Returns: {
          category: string
          count: number
        }[]
      }
      get_products_stats: {
        Args: never
        Returns: {
          active_products: number
          pending_products: number
          rejected_products: number
          total_products: number
        }[]
      }
      get_recent_activity: {
        Args: never
        Returns: {
          action: string
          created_at: string
          entity: string
          user_email: string
        }[]
      }
      get_top_manufacturers:
        | {
            Args: never
            Returns: {
              name: string
              total_orders: number
              total_products: number
              total_sales: number
            }[]
          }
        | {
            Args: { p_end_date?: string; p_start_date?: string }
            Returns: {
              name: string
              total_orders: number
              total_products: number
              total_sales: number
            }[]
          }
      get_top_products:
        | {
            Args: never
            Returns: {
              name: string
              total_orders: number
              total_revenue: number
            }[]
          }
        | {
            Args: {
              limit_count?: number
              p_end_date?: string
              p_start_date?: string
            }
            Returns: {
              name: string
              total_orders: number
              total_revenue: number
            }[]
          }
      get_top_viewed_products: {
        Args: { limit_count?: number }
        Returns: {
          category: string
          manufacturer_name: string
          price_unit: number
          product_id: string
          product_name: string
          views_count: number
        }[]
      }
      get_users_by_city: {
        Args: never
        Returns: {
          buyers: number
          city: string
          manufacturers: number
          total_users: number
        }[]
      }
      get_users_stats: {
        Args: never
        Returns: {
          total_buyers: number
          total_manufacturers: number
          total_superadmins: number
          total_users: number
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_product_views:
        | { Args: { p_product_id: string }; Returns: undefined }
        | {
            Args: { p_product_id: string; p_session_id?: string }
            Returns: undefined
          }
      is_manufacturer_verified: {
        Args: { _manufacturer_id: string }
        Returns: boolean
      }
      track_order_step: {
        Args: {
          p_order_id: string
          p_product_id: string
          p_session_id?: string
          p_step: string
          p_user_id: string
        }
        Returns: undefined
      }
      track_product_view: { Args: { p_product_id: string }; Returns: undefined }
    }
    Enums: {
      app_role: "superadmin" | "manufacturer" | "buyer"
      tracking_step:
        | "viewed"
        | "added_to_pallet"
        | "requested"
        | "pending_confirmation"
        | "confirmed"
        | "paid"
        | "shipped"
        | "delivered"
      user_role: "superadmin" | "manufacturer" | "buyer"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["superadmin", "manufacturer", "buyer"],
      tracking_step: [
        "viewed",
        "added_to_pallet",
        "requested",
        "pending_confirmation",
        "confirmed",
        "paid",
        "shipped",
        "delivered",
      ],
      user_role: ["superadmin", "manufacturer", "buyer"],
    },
  },
} as const

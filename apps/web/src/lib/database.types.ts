
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "graphql_public": {
          Tables: {
            [_ in never]: never
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "graphql":
{ Args: { "extensions"?: Json,"operationName"?: string,"query"?: string,"variables"?: Json }; Returns: Json
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        },"public": {
          Tables: {
            "agent_settings": {
                  Row: {
                    "agent_name": string,"business_id": string,"enabled": boolean,"escalation_phone": string,"extra_instructions": string,"greeting": string,"tone": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "agent_name"?: string,"business_id": string,"enabled"?: boolean,"escalation_phone"?: string,"extra_instructions"?: string,"greeting"?: string,"tone"?: string,"updated_at"?: string
                  }
                  Update: {
                    "agent_name"?: string,"business_id"?: string,"enabled"?: boolean,"escalation_phone"?: string,"extra_instructions"?: string,"greeting"?: string,"tone"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "agent_settings_business_id_fkey"
      columns: ["business_id"]
isOneToOne: true
      referencedRelation: "businesses"
      referencedColumns: ["id"]
    }
                  ]
                },"business_hours": {
                  Row: {
                    "business_id": string,"closed": boolean,"closes": string,"opens": string,"weekday": number
                  }
                  ComputedFields: never
                  Insert: {
                    "business_id": string,"closed"?: boolean,"closes"?: string,"opens"?: string,"weekday": number
                  }
                  Update: {
                    "business_id"?: string,"closed"?: boolean,"closes"?: string,"opens"?: string,"weekday"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "business_hours_business_id_fkey"
      columns: ["business_id"]
isOneToOne: false
      referencedRelation: "businesses"
      referencedColumns: ["id"]
    }
                  ]
                },"businesses": {
                  Row: {
                    "address": string,"city": string,"created_at": string,"currency": string,"description": string,"email": string,"id": string,"maps_url": string,"name": string,"phone": string,"policies": string,"slug": string,"timezone": string,"type": Database["public"]['Enums']["business_type"],"whatsapp": string
                  }
                  ComputedFields: never
                  Insert: {
                    "address"?: string,"city"?: string,"created_at"?: string,"currency"?: string,"description"?: string,"email"?: string,"id"?: string,"maps_url"?: string,"name": string,"phone"?: string,"policies"?: string,"slug": string,"timezone"?: string,"type"?: Database["public"]['Enums']["business_type"],"whatsapp"?: string
                  }
                  Update: {
                    "address"?: string,"city"?: string,"created_at"?: string,"currency"?: string,"description"?: string,"email"?: string,"id"?: string,"maps_url"?: string,"name"?: string,"phone"?: string,"policies"?: string,"slug"?: string,"timezone"?: string,"type"?: Database["public"]['Enums']["business_type"],"whatsapp"?: string
                  }
                  Relationships: [
                    
                  ]
                },"categories": {
                  Row: {
                    "business_id": string,"created_at": string,"id": string,"name": string,"position": number
                  }
                  ComputedFields: never
                  Insert: {
                    "business_id": string,"created_at"?: string,"id"?: string,"name": string,"position"?: number
                  }
                  Update: {
                    "business_id"?: string,"created_at"?: string,"id"?: string,"name"?: string,"position"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "categories_business_id_fkey"
      columns: ["business_id"]
isOneToOne: false
      referencedRelation: "businesses"
      referencedColumns: ["id"]
    }
                  ]
                },"faqs": {
                  Row: {
                    "answer": string,"business_id": string,"created_at": string,"id": string,"position": number,"question": string
                  }
                  ComputedFields: never
                  Insert: {
                    "answer": string,"business_id": string,"created_at"?: string,"id"?: string,"position"?: number,"question": string
                  }
                  Update: {
                    "answer"?: string,"business_id"?: string,"created_at"?: string,"id"?: string,"position"?: number,"question"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "faqs_business_id_fkey"
      columns: ["business_id"]
isOneToOne: false
      referencedRelation: "businesses"
      referencedColumns: ["id"]
    }
                  ]
                },"invitations": {
                  Row: {
                    "business_id": string,"created_at": string,"email": string,"id": string,"role": Database["public"]['Enums']["member_role"]
                  }
                  ComputedFields: never
                  Insert: {
                    "business_id": string,"created_at"?: string,"email": string,"id"?: string,"role"?: Database["public"]['Enums']["member_role"]
                  }
                  Update: {
                    "business_id"?: string,"created_at"?: string,"email"?: string,"id"?: string,"role"?: Database["public"]['Enums']["member_role"]
                  }
                  Relationships: [
                    {
      foreignKeyName: "invitations_business_id_fkey"
      columns: ["business_id"]
isOneToOne: false
      referencedRelation: "businesses"
      referencedColumns: ["id"]
    }
                  ]
                },"leads": {
                  Row: {
                    "business_name": string,"created_at": string,"email": string,"id": string,"industry": string,"message": string,"name": string,"phone": string
                  }
                  ComputedFields: never
                  Insert: {
                    "business_name"?: string,"created_at"?: string,"email"?: string,"id"?: string,"industry"?: string,"message"?: string,"name": string,"phone": string
                  }
                  Update: {
                    "business_name"?: string,"created_at"?: string,"email"?: string,"id"?: string,"industry"?: string,"message"?: string,"name"?: string,"phone"?: string
                  }
                  Relationships: [
                    
                  ]
                },"memberships": {
                  Row: {
                    "business_id": string,"created_at": string,"role": Database["public"]['Enums']["member_role"],"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "business_id": string,"created_at"?: string,"role"?: Database["public"]['Enums']["member_role"],"user_id": string
                  }
                  Update: {
                    "business_id"?: string,"created_at"?: string,"role"?: Database["public"]['Enums']["member_role"],"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "memberships_business_id_fkey"
      columns: ["business_id"]
isOneToOne: false
      referencedRelation: "businesses"
      referencedColumns: ["id"]
    }
                  ]
                },"modifier_groups": {
                  Row: {
                    "business_id": string,"created_at": string,"id": string,"max_select": number,"min_select": number,"name": string
                  }
                  ComputedFields: never
                  Insert: {
                    "business_id": string,"created_at"?: string,"id"?: string,"max_select"?: number,"min_select"?: number,"name": string
                  }
                  Update: {
                    "business_id"?: string,"created_at"?: string,"id"?: string,"max_select"?: number,"min_select"?: number,"name"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "modifier_groups_business_id_fkey"
      columns: ["business_id"]
isOneToOne: false
      referencedRelation: "businesses"
      referencedColumns: ["id"]
    }
                  ]
                },"modifiers": {
                  Row: {
                    "available": boolean,"business_id": string,"group_id": string,"id": string,"name": string,"position": number,"price_cents": number
                  }
                  ComputedFields: never
                  Insert: {
                    "available"?: boolean,"business_id": string,"group_id": string,"id"?: string,"name": string,"position"?: number,"price_cents"?: number
                  }
                  Update: {
                    "available"?: boolean,"business_id"?: string,"group_id"?: string,"id"?: string,"name"?: string,"position"?: number,"price_cents"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "modifiers_group_id_business_id_fkey"
      columns: ["group_id","business_id"]
isOneToOne: false
      referencedRelation: "modifier_groups"
      referencedColumns: ["id","business_id"]
    }
                  ]
                },"platform_admins": {
                  Row: {
                    "created_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"user_id": string
                  }
                  Update: {
                    "created_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    
                  ]
                },"product_modifier_groups": {
                  Row: {
                    "business_id": string,"group_id": string,"product_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "business_id": string,"group_id": string,"product_id": string
                  }
                  Update: {
                    "business_id"?: string,"group_id"?: string,"product_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "product_modifier_groups_group_id_business_id_fkey"
      columns: ["group_id","business_id"]
isOneToOne: false
      referencedRelation: "modifier_groups"
      referencedColumns: ["id","business_id"]
    },{
      foreignKeyName: "product_modifier_groups_product_id_business_id_fkey"
      columns: ["product_id","business_id"]
isOneToOne: false
      referencedRelation: "products"
      referencedColumns: ["id","business_id"]
    }
                  ]
                },"products": {
                  Row: {
                    "available": boolean,"business_id": string,"category_id": string | null,"created_at": string,"description": string,"duration_minutes": number | null,"id": string,"kind": Database["public"]['Enums']["item_kind"],"name": string,"position": number,"price_cents": number
                  }
                  ComputedFields: never
                  Insert: {
                    "available"?: boolean,"business_id": string,"category_id"?: string | null,"created_at"?: string,"description"?: string,"duration_minutes"?: number | null,"id"?: string,"kind"?: Database["public"]['Enums']["item_kind"],"name": string,"position"?: number,"price_cents": number
                  }
                  Update: {
                    "available"?: boolean,"business_id"?: string,"category_id"?: string | null,"created_at"?: string,"description"?: string,"duration_minutes"?: number | null,"id"?: string,"kind"?: Database["public"]['Enums']["item_kind"],"name"?: string,"position"?: number,"price_cents"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "products_business_id_fkey"
      columns: ["business_id"]
isOneToOne: false
      referencedRelation: "businesses"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "products_category_id_business_id_fkey"
      columns: ["category_id","business_id"]
isOneToOne: false
      referencedRelation: "categories"
      referencedColumns: ["id","business_id"]
    }
                  ]
                },"profiles": {
                  Row: {
                    "created_at": string,"email": string,"full_name": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"email": string,"full_name"?: string,"user_id": string
                  }
                  Update: {
                    "created_at"?: string,"email"?: string,"full_name"?: string,"user_id"?: string
                  }
                  Relationships: [
                    
                  ]
                }
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "accept_invitations":
{ Args: Record<PropertyKey, never>; Returns: number
                           },
"create_business":
{ Args: { "p_name": string,"p_type": Database["public"]['Enums']["business_type"] }; Returns: {
              "address": string,
"city": string,
"created_at": string,
"currency": string,
"description": string,
"email": string,
"id": string,
"maps_url": string,
"name": string,
"phone": string,
"policies": string,
"slug": string,
"timezone": string,
"type": Database["public"]['Enums']["business_type"],
"whatsapp": string
            }
                          SetofOptions: {
        from: "*"
        to: "businesses"
        isOneToOne: true
        isSetofReturn: false
      } },
"is_member":
{ Args: { "b": string }; Returns: boolean
                           },
"is_owner":
{ Args: { "b": string }; Returns: boolean
                           },
"is_platform_admin":
{ Args: Record<PropertyKey, never>; Returns: boolean
                           },
"shares_business_with":
{ Args: { "u": string }; Returns: boolean
                           }
          }
          Enums: {
            "business_type": "restaurant"|"salon"|"clinic"|"workshop"|"other","item_kind": "product"|"service","member_role": "owner"|"employee"
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "graphql_public": {
          Enums: {
            
          }
        },"public": {
          Enums: {
            "business_type": ["restaurant", "salon", "clinic", "workshop", "other"],"item_kind": ["product", "service"],"member_role": ["owner", "employee"]
          }
        }
} as const

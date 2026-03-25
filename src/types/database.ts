export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type UserRole = 'admin' | 'student' | 'super_admin'
export type OrderStatus = 'pending' | 'accepted' | 'claiming' | 'completed' | 'cancelled' | 'expired' | 'archived'
export type BillingStatus = 'Not Paid' | 'Paid' | 'Due date'
export type BatchStatus = 'open' | 'closed' | 'completed'

export interface Profile {
  id: string
  student_number: string | null
  name: string
  role: UserRole
  email: string
  profile_picture: string | null
  created_at: string
  updated_at: string
}

export interface Product {
  id: number
  name: string
  image_url: string | null
  type: string | null
  quantity: number
  is_archived: boolean
  archived_at: string | null
  created_at: string
  updated_at: string
  sizes?: Size[]
}

export interface Size {
  id: number
  product_id: number
  size: string
  price: number
  quantity: number
  created_at: string
}

export interface Batch {
  id: number
  batch_number: number
  status: BatchStatus
  assigned_at: string
  created_at: string
}

export interface Cart {
  id: number
  user_id: string
  product_id: number
  size_id: number | null
  quantity: number
  created_at: string
  updated_at: string
  product?: Product
  size?: Size
}

export interface PreOrder {
  id: number
  student_number: string | null
  user_id: string
  product_id: number
  size_id: number | null
  quantity: number
  status: OrderStatus
  batch: number | null
  remark: string | null
  is_updated: boolean
  expires_at: string | null
  created_at: string
  updated_at: string
  product?: Product
  size?: Size
  billing?: Billing
}

export interface Billing {
  id: number
  pre_order_id: number
  student_number: string | null
  user_id: string
  product_id: number
  size_id: number | null
  quantity: number
  status: BillingStatus
  reference_key: string | null
  amount: number
  remark: string | null
  student_remark: string | null
  proof_of_payment: string | null
  is_viewed: boolean
  created_at: string
  updated_at: string
  pre_order?: PreOrder
  product?: Product
  size?: Size
  user?: Profile
}

export interface Announcement {
  id: number
  title: string
  content: string
  image_url: string | null
  link: string | null
  event_time: string | null
  created_at: string
  updated_at: string
}

export interface Feedback {
  id: number
  pre_order_id: number
  user_id: string
  student_number: string | null
  rating: number
  comment: string | null
  created_at: string
  pre_order?: PreOrder
  user?: Profile
}

export interface Chat {
  id: number
  billing_id: number
  user_id: string
  sender_role: 'admin' | 'student'
  message: string
  created_at: string
  user?: Profile
}

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: Omit<Profile, 'created_at' | 'updated_at'>
        Update: Partial<Omit<Profile, 'id'>>
      }
      products: {
        Row: Product
        Insert: Omit<Product, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Product, 'id'>>
      }
      sizes: {
        Row: Size
        Insert: Omit<Size, 'id' | 'created_at'>
        Update: Partial<Omit<Size, 'id'>>
      }
      batches: {
        Row: Batch
        Insert: Omit<Batch, 'id' | 'created_at'>
        Update: Partial<Omit<Batch, 'id'>>
      }
      carts: {
        Row: Cart
        Insert: Omit<Cart, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Cart, 'id'>>
      }
      pre_orders: {
        Row: PreOrder
        Insert: Omit<PreOrder, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<PreOrder, 'id'>>
      }
      billings: {
        Row: Billing
        Insert: Omit<Billing, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Billing, 'id'>>
      }
      announcements: {
        Row: Announcement
        Insert: Omit<Announcement, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Announcement, 'id'>>
      }
      feedback: {
        Row: Feedback
        Insert: Omit<Feedback, 'id' | 'created_at'>
        Update: Partial<Omit<Feedback, 'id'>>
      }
      chats: {
        Row: Chat
        Insert: Omit<Chat, 'id' | 'created_at'>
        Update: Partial<Omit<Chat, 'id'>>
      }
    }
  }
}

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://demo.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'demo-key';

// Only initialize Supabase if we have real credentials
const hasValidSupabaseConfig = supabaseUrl !== 'https://demo.supabase.co' && supabaseAnonKey !== 'demo-key';

export const supabase = hasValidSupabaseConfig 
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      }
    })
  : null;

// Helper functions for common operations
export const supabaseHelpers = {
  // Auth helpers
  async signUp(email: string, password: string, metadata?: Record<string, unknown>) {
    if (!supabase) {
      throw new Error('Supabase not configured. Please set up your Supabase credentials.');
    }
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata
      }
    });
    return { data, error };
  },

  async signIn(email: string, password: string) {
    if (!supabase) {
      throw new Error('Supabase not configured. Please set up your Supabase credentials.');
    }
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    return { data, error };
  },

  async signOut() {
    if (!supabase) {
      throw new Error('Supabase not configured. Please set up your Supabase credentials.');
    }
    
    const { error } = await supabase.auth.signOut();
    return { error };
  },

  async getCurrentUser() {
    if (!supabase) {
      throw new Error('Supabase not configured. Please set up your Supabase credentials.');
    }
    
    const { data: { user }, error } = await supabase.auth.getUser();
    return { user, error };
  },

  // Property helpers
  async getProperties(filters?: Record<string, unknown>, page = 1, pageSize = 12) {
    if (!supabase) {
      // Return demo data when Supabase is not configured
      const demoProperties = [
        {
          id: '1',
          title: 'Modern 3 Bedroom House',
          description: 'Beautiful modern house with great amenities',
          price: 450000000,
          currency: 'UGX',
          property_type: 'house',
          listing_type: 'sale',
          status: 'active',
          location: { address: 'Kololo, Kampala', city: 'Kampala' },
          features: { bedrooms: 3, bathrooms: 2, area: 200 },
          amenities: ['Parking', 'Garden', 'Security'],
          images: [],
          created_at: '2025-12-20T10:00:00Z',
          owner: { first_name: 'John', last_name: 'Doe' }
        },
        {
          id: '2',
          title: 'Luxury Apartment',
          description: 'Premium apartment in the city center',
          price: 2500000,
          currency: 'UGX',
          property_type: 'apartment',
          listing_type: 'rent',
          status: 'active',
          location: { address: 'Nakasero, Kampala', city: 'Kampala' },
          features: { bedrooms: 2, bathrooms: 1, area: 120 },
          amenities: ['Balcony', 'Security', 'Parking'],
          images: [],
          created_at: '2025-12-19T14:30:00Z',
          owner: { first_name: 'Jane', last_name: 'Smith' }
        }
      ];
      
      return {
        data: demoProperties,
        meta: {
          total: demoProperties.length,
          page,
          pageSize,
          totalPages: 1,
        },
      };
    }
    
    let query = supabase
      .from('properties')
      .select(`
        *,
        owner:profiles!properties_owner_id_fkey (
          id,
          first_name,
          last_name,
          email,
          phone,
          avatar_url
        )
      `)
      .eq('status', 'active');

    // Apply filters
    if (filters?.listingType) {
      query = query.eq('listing_type', filters.listingType);
    }
    
    if (filters?.propertyType) {
      query = query.eq('property_type', filters.propertyType);
    }
    
    if (filters?.minPrice) {
      query = query.gte('price', filters.minPrice);
    }
    
    if (filters?.maxPrice) {
      query = query.lte('price', filters.maxPrice);
    }
    
    if (filters?.location) {
      query = query.ilike('location->address', `%${filters.location}%`);
    }
    
    if (filters?.search) {
      query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
    }

    // Apply pagination
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    // Apply sorting
    if (filters?.sortBy) {
      switch (filters.sortBy) {
        case 'price_asc':
          query = query.order('price', { ascending: true });
          break;
        case 'price_desc':
          query = query.order('price', { ascending: false });
          break;
        case 'newest':
          query = query.order('created_at', { ascending: false });
          break;
        case 'popular':
          query = query.order('views', { ascending: false });
          break;
        default:
          query = query.order('created_at', { ascending: false });
      }
    } else {
      query = query.order('created_at', { ascending: false });
    }

    const { data, error, count } = await query;

    if (error) {
      console.warn('Failed to fetch properties from Supabase:', error.message);
      // Return empty result on error
      return {
        data: [],
        meta: {
          total: 0,
          page,
          pageSize,
          totalPages: 0,
        },
      };
    }

    return {
      data: data || [],
      meta: {
        total: count || 0,
        page,
        pageSize,
        totalPages: Math.ceil((count || 0) / pageSize),
      },
    };
  },

  async getProperty(id: string) {
    if (!supabase) {
      throw new Error('Supabase not configured. Please set up your Supabase credentials.');
    }
    
    const { data, error } = await supabase
      .from('properties')
      .select(`
        *,
        owner:profiles!properties_owner_id_fkey (
          id,
          first_name,
          last_name,
          email,
          phone,
          avatar_url
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      throw new Error(`Failed to fetch property: ${error.message}`);
    }

    // Increment view count
    await supabase.rpc('increment_property_views', { property_id: id });

    return data;
  },

  async createProperty(propertyData: Record<string, unknown>) {
    if (!supabase) {
      throw new Error('Supabase not configured. Please set up your Supabase credentials.');
    }
    
    const { data, error } = await supabase
      .from('properties')
      .insert(propertyData)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create property: ${error.message}`);
    }

    return data;
  },

  async updateProperty(id: string, updates: Record<string, unknown>) {
    if (!supabase) {
      throw new Error('Supabase not configured. Please set up your Supabase credentials.');
    }
    
    const { data, error } = await supabase
      .from('properties')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update property: ${error.message}`);
    }

    return data;
  },

  async deleteProperty(id: string) {
    if (!supabase) {
      throw new Error('Supabase not configured. Please set up your Supabase credentials.');
    }
    
    const { error } = await supabase
      .from('properties')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete property: ${error.message}`);
    }
  },

  async getFeaturedProperties(limit = 6) {
    if (!supabase) {
      return [];
    }
    
    const { data, error } = await supabase
      .from('properties')
      .select(`
        *,
        owner:profiles!properties_owner_id_fkey (
          id,
          first_name,
          last_name,
          email,
          phone,
          avatar_url
        )
      `)
      .eq('is_featured', true)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.warn('Failed to fetch featured properties:', error.message);
      return [];
    }

    return data || [];
  },

  async getMyProperties(userId: string, page = 1, pageSize = 10) {
    if (!supabase) {
      return {
        data: [],
        meta: {
          total: 0,
          page,
          pageSize,
          totalPages: 0,
        },
      };
    }
    
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, error, count } = await supabase
      .from('properties')
      .select('*', { count: 'exact' })
      .eq('owner_id', userId)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
      throw new Error(`Failed to fetch user properties: ${error.message}`);
    }

    return {
      data: data || [],
      meta: {
        total: count || 0,
        page,
        pageSize,
        totalPages: Math.ceil((count || 0) / pageSize),
      },
    };
  },

  // File upload helpers
  async uploadImage(file: File, bucket = 'property-images', path?: string) {
    if (!supabase) {
      throw new Error('Supabase not configured. Please set up your Supabase credentials.');
    }
    
    const fileExt = file.name.split('.').pop();
    const fileName = path || `${Math.random()}.${fileExt}`;
    
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fileName, file);

    if (error) {
      throw new Error(`Failed to upload image: ${error.message}`);
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(fileName);

    return { path: data.path, url: publicUrl };
  },

  async deleteImage(path: string, bucket = 'property-images') {
    if (!supabase) {
      throw new Error('Supabase not configured. Please set up your Supabase credentials.');
    }
    
    const { error } = await supabase.storage
      .from(bucket)
      .remove([path]);

    if (error) {
      throw new Error(`Failed to delete image: ${error.message}`);
    }
  }
};

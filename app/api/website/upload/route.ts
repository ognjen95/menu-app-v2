import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient(request)
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type' }, { status: 400 })
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large (max 5MB)' }, { status: 400 })
    }

    // Generate unique filename
    const ext = file.name.split('.').pop()
    const filename = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`

    // Upload to Supabase storage
    const { data, error } = await supabase.storage
      .from('website-images')
      .upload(filename, file, {
        contentType: file.type,
        upsert: false,
      })

    if (error) {
      console.error('Upload error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('website-images')
      .getPublicUrl(data.path)

    return NextResponse.json({ url: publicUrl })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}

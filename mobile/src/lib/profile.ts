import { supabase } from './supabase';

export type AppRole = 'tenant' | 'landlord';

export type ProfileRecord = {
  id: string;
  username: string | null;
  email: string | null;
  phone: string | null;
  app_roles: AppRole[];
};

export async function getMyProfile(userId: string): Promise<ProfileRecord | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, email, phone, app_roles')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data as ProfileRecord | null;
}

type EnsureProfileInput = {
  userId: string;
  username: string;
  email: string;
  phone: string;
};

export async function ensureTenantProfile(input: EnsureProfileInput): Promise<ProfileRecord> {
  const { data, error } = await supabase
    .from('profiles')
    .upsert(
      {
        id: input.userId,
        username: input.username.trim(),
        email: input.email.trim().toLowerCase(),
        phone: input.phone.trim(),
        app_roles: ['tenant'],
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' }
    )
    .select('id, username, email, phone, app_roles')
    .single();

  if (error) {
    throw error;
  }

  return data as ProfileRecord;
}

export async function enableLandlordRole(userId: string): Promise<ProfileRecord> {
  const existing = await getMyProfile(userId);
  if (!existing) {
    throw new Error('Please complete your profile first.');
  }

  const nextRoles: AppRole[] = existing.app_roles?.includes('landlord')
    ? existing.app_roles
    : [...(existing.app_roles || ['tenant']), 'landlord'];

  const { data, error } = await supabase
    .from('profiles')
    .update({
      app_roles: nextRoles,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)
    .select('id, username, email, phone, app_roles')
    .single();

  if (error) {
    throw error;
  }

  return data as ProfileRecord;
}

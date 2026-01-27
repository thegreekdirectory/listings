// supabase-config.js
/*
Copyright (C) The Greek Directory, 2025-present. All rights reserved.
This source code is proprietary and no part may not be used, reproduced, or distributed 
without written permission from The Greek Directory. Unauthorized use, copying, modification, 
or distribution of this code will result in legal action to the fullest extent permitted by law.
*/

// ============================================
// SUPABASE CLIENT CONFIGURATION - FIXED
// Complete configuration and utilities
// ============================================

const SUPABASE_URL = 'https://luetekzqrrgdxtopzvqw.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx1ZXRla3pxcnJnZHh0b3B6dnF3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzNDc2NDcsImV4cCI6MjA4MzkyMzY0N30.TIrNG8VGumEJc_9JvNHW-Q-UWfUGpPxR0v8POjWZJYg';

console.log('✅ Supabase configured correctly');
console.log('URL:', SUPABASE_URL);
console.log('Key valid:', SUPABASE_ANON_KEY.split('.').length === 3);

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log('Supabase client initialized:', supabaseClient ? 'Success' : 'Failed');

/*
Copyright (C) The Greek Directory, 2025-present. All rights reserved.
*/

async function getCurrentUser() {
    try {
        const { data: { user }, error } = await supabaseClient.auth.getUser();
        if (error) throw error;
        return user;
    } catch (error) {
        console.error('Error getting current user:', error);
        return null;
    }
}

async function getCurrentSession() {
    try {
        const { data: { session }, error } = await supabaseClient.auth.getSession();
        if (error) throw error;
        return session;
    } catch (error) {
        console.error('Error getting session:', error);
        return null;
    }
}

/*
Copyright (C) The Greek Directory, 2025-present. All rights reserved.
*/

async function signUpBusinessOwner(email, password, listingId, confirmationKey, phone = null) {
    try {
        console.log('Starting signup for:', email, 'with listing:', listingId);
        
        if (!confirmationKey) {
            throw new Error('Confirmation key is required');
        }
        
        const { data: ownerRecord, error: ownerCheckError } = await supabaseClient
            .from('business_owners')
            .select('*')
            .eq('listing_id', listingId)
            .eq('confirmation_key', confirmationKey)
            .maybeSingle();
        
        if (ownerCheckError) {
            console.error('Error checking confirmation key:', ownerCheckError);
            throw new Error('Error verifying confirmation key');
        }
        
        if (!ownerRecord) {
            throw new Error('Invalid confirmation key for this listing');
        }
        
        if (ownerRecord.owner_user_id) {
            throw new Error('This listing has already been claimed');
        }
        
        /*
        Copyright (C) The Greek Directory, 2025-present. All rights reserved.
        */
        
        const emailUsername = email.split('@')[0].replace(/[^a-z0-9]/gi, '').toLowerCase();
        const ownerUserId = `${emailUsername}${listingId}`;
        
        const { data: authData, error: signUpError } = await supabaseClient.auth.signUp({
            email: email,
            password: password,
            options: {
                emailRedirectTo: window.location.origin + '/business.html',
                data: {
                    listing_id: listingId,
                    role: 'business_owner',
                    owner_user_id: ownerUserId
                }
            }
        });

        if (signUpError) {
            console.error('Auth signup error:', signUpError);
            throw signUpError;
        }

        console.log('Auth signup successful, user ID:', authData.user.id);

        const { data: updatedOwner, error: updateError } = await supabaseClient
            .from('business_owners')
            .update({
                owner_user_id: ownerUserId,
                owner_email: email,
                owner_phone: phone,
                confirmation_key: null
            })
            .eq('listing_id', listingId)
            .select()
            .single();

        if (updateError) {
            console.error('Update error:', updateError);
            throw updateError;
        }

        console.log('Business owner record updated:', updatedOwner);

        /*
        Copyright (C) The Greek Directory, 2025-present. All rights reserved.
        */

        return {
            success: true,
            user: authData.user,
            session: authData.session,
            owner: updatedOwner,
            message: 'Account created successfully! Please check your email to verify your account, then sign in.'
        };

    } catch (error) {
        console.error('Sign up error:', error);
        return {
            success: false,
            error: error.message || 'Sign up failed'
        };
    }
}

async function signInBusinessOwner(email, password) {
    try {
        console.log('Attempting sign in for:', email);
        
        const { data, error } = await supabaseClient.auth.signInWithPassword({
            email: email,
            password: password
        });

        console.log('Sign in response:', { data, error });

        if (error) {
            console.error('Sign in error details:', error);
            throw error;
        }

        /*
        Copyright (C) The Greek Directory, 2025-present. All rights reserved.
        */

        const { data: ownerData, error: ownerError } = await supabaseClient
            .from('business_owners')
            .select('*')
            .eq('owner_email', email);

        console.log('Owner data fetch:', { ownerData, ownerError });

        if (ownerError) {
            console.warn('Owner data not found:', ownerError);
        }

        return {
            success: true,
            user: data.user,
            session: data.session,
            owner: ownerData,
            message: 'Sign in successful!'
        };

    } catch (error) {
        console.error('Sign in error:', error);
        return {
            success: false,
            error: error.message || 'Sign in failed'
        };
    }
}

/*
Copyright (C) The Greek Directory, 2025-present. All rights reserved.
*/

async function signOut() {
    try {
        const { error } = await supabaseClient.auth.signOut();
        if (error) throw error;
        return true;
    } catch (error) {
        console.error('Sign out error:', error);
        return false;
    }
}

async function getBusinessOwnerData() {
    try {
        const user = await getCurrentUser();
        if (!user) return null;

        const { data, error} = await supabaseClient
            .from('business_owners')
            .select('*')
            .eq('owner_email', user.email);

        if (error) throw error;
        return data;

    } catch (error) {
        console.error('Error getting business owner data:', error);
        return null;
    }
}

/*
Copyright (C) The Greek Directory, 2025-present. All rights reserved.
*/

async function updateBusinessOwnerContact(updates) {
    try {
        const user = await getCurrentUser();
        if (!user) throw new Error('Not authenticated');

        const { data, error } = await supabaseClient
            .from('business_owners')
            .update(updates)
            .eq('owner_email', user.email)
            .select();

        if (error) throw error;

        return {
            success: true,
            data: data,
            message: 'Contact information updated successfully'
        };

    } catch (error) {
        console.error('Update error:', error);
        return {
            success: false,
            error: error.message || 'Update failed'
        };
    }
}

async function resetPassword(email) {
    try {
        const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.origin + '/business.html?reset=true'
        });

        if (error) throw error;

        return {
            success: true,
            message: 'Password reset email sent! Check your inbox.'
        };

    } catch (error) {
        console.error('Password reset error:', error);
        return {
            success: false,
            error: error.message || 'Password reset failed'
        };
    }
}

/*
Copyright (C) The Greek Directory, 2025-present. All rights reserved.
*/

async function updatePassword(newPassword) {
    try {
        const { error } = await supabaseClient.auth.updateUser({
            password: newPassword
        });

        if (error) throw error;

        return {
            success: true,
            message: 'Password updated successfully'
        };

    } catch (error) {
        console.error('Password update error:', error);
        return {
            success: false,
            error: error.message || 'Password update failed'
        };
    }
}

function onAuthStateChange(callback) {
    supabaseClient.auth.onAuthStateChange((event, session) => {
        console.log('Auth state changed:', event);
        if (callback) callback(event, session);
    });
}

/*
Copyright (C) The Greek Directory, 2025-present. All rights reserved.
*/

window.TGDAuth = {
    supabaseClient,
    getCurrentUser,
    getCurrentSession,
    signUpBusinessOwner,
    signInBusinessOwner,
    signOut,
    getBusinessOwnerData,
    updateBusinessOwnerContact,
    resetPassword,
    updatePassword,
    onAuthStateChange
};

/*
Copyright (C) The Greek Directory, 2025-present. All rights reserved.
This source code is proprietary and no part may not be used, reproduced, or distributed 
without written permission from The Greek Directory. Unauthorized use, copying, modification, 
or distribution of this code will result in legal action to the fullest extent permitted by law.
*/

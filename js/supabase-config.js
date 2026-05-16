// supabase-config.js
/*
Copyright (C) The Greek Directory, 2025-present. All rights reserved.
This source code is proprietary and no part may not be used, reproduced, or distributed
without written permission from The Greek Directory. Unauthorized use, copying, modification,
or distribution of this code will result in legal action to the fullest extent permitted by law.
*/

const SUPABASE_URL      = 'https://luetekzqrrgdxtopzvqw.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx1ZXRla3pxcnJnZHh0b3B6dnF3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzNDc2NDcsImV4cCI6MjA4MzkyMzY0N30.TIrNG8VGumEJc_9JvNHW-Q-UWfUGpPxR0v8POjWZJYg';

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ─── Basic auth helpers ───────────────────────────────────────────

async function getCurrentUser() {
    try {
        const { data: { user }, error } = await supabaseClient.auth.getUser();
        if (error) throw error;
        return user;
    } catch (err) {
        console.error('Error getting current user:', err);
        return null;
    }
}

async function getCurrentSession() {
    try {
        const { data: { session }, error } = await supabaseClient.auth.getSession();
        if (error) throw error;
        return session;
    } catch (err) {
        console.error('Error getting session:', err);
        return null;
    }
}

// ─── Sign Up ──────────────────────────────────────────────────────
/*
 * confirmationKey can be:
 *   - A real key string  → verify it against business_owners.confirmation_key
 *   - 'no-key-required'  → listing has no key; just verify not already claimed
 */
async function signUpBusinessOwner(email, password, listingId, confirmationKey, phone = null) {
    try {
        const noKeyRequired = confirmationKey === 'no-key-required';

        // ── 1. Verify listing eligibility ─────────────────────────
        let ownerRecord = null;

        if (noKeyRequired) {
            // Look up any existing owner row and make sure listing isn't claimed
            const { data, error } = await supabaseClient
                .from('business_owners')
                .select('*')
                .eq('listing_id', listingId)
                .maybeSingle();

            if (error) throw new Error('Error verifying listing status. Please try again.');
            if (data?.owner_user_id) throw new Error('This listing has already been claimed.');
            ownerRecord = data; // may be null (no row yet) — that's fine
        } else {
            if (!confirmationKey) throw new Error('Confirmation key is required.');

            const { data, error } = await supabaseClient
                .from('business_owners')
                .select('*')
                .eq('listing_id', listingId)
                .eq('confirmation_key', confirmationKey)
                .maybeSingle();

            if (error) throw new Error('Error verifying confirmation key. Please try again.');
            if (!data) throw new Error('Invalid confirmation key for this listing.');
            if (data.owner_user_id) throw new Error('This listing has already been claimed.');
            ownerRecord = data;
        }

        // ── 2. Create Supabase Auth account ───────────────────────
        const emailUsername = email.split('@')[0].replace(/[^a-z0-9]/gi, '').toLowerCase();
        const ownerUserId   = `${emailUsername}-${listingId}`;

        const { data: authData, error: signUpError } = await supabaseClient.auth.signUp({
            email,
            password,
            options: {
                emailRedirectTo: `${window.location.origin}/business`,
                data: {
                    listing_id:    listingId,
                    role:          'business_owner',
                    owner_user_id: ownerUserId,
                },
            },
        });

        if (signUpError) throw signUpError;

        // ── 3. Create / update the business_owners row ───────────
        const ownerPayload = {
            listing_id:    listingId,
            owner_user_id: ownerUserId,
            owner_email:   email,
            owner_phone:   phone || null,
            confirmation_key: null, // clear so listing can't be re-claimed
        };

        if (ownerRecord) {
            // Row already exists — update it
            const { error: updateError } = await supabaseClient
                .from('business_owners')
                .update(ownerPayload)
                .eq('listing_id', listingId);

            if (updateError) {
                console.warn('Could not update owner record:', updateError.message);
                // Non-fatal: auth account was created; owner row can be fixed by admin
            }
        } else {
            // No row yet — insert one
            const { error: insertError } = await supabaseClient
                .from('business_owners')
                .insert(ownerPayload);

            if (insertError) {
                console.warn('Could not insert owner record:', insertError.message);
            }
        }

        // ── 4. Return result ──────────────────────────────────────
        const needsEmailConfirm = !authData.session;
        return {
            success: true,
            user:    authData.user,
            session: authData.session,
            message: needsEmailConfirm
                ? 'Account created! Check your email to verify, then sign in.'
                : 'Account created! Signing you in…',
        };

    } catch (err) {
        console.error('Sign up error:', err);
        return { success: false, error: err.message || 'Sign up failed. Please try again.' };
    }
}

// ─── Sign In ──────────────────────────────────────────────────────
async function signInBusinessOwner(email, password) {
    try {
        const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
        if (error) throw error;

        return {
            success: true,
            user:    data.user,
            session: data.session,
            message: 'Sign in successful!',
        };
    } catch (err) {
        console.error('Sign in error:', err);
        // Translate common Supabase error messages into friendlier copy
        let message = err.message || 'Sign in failed. Please try again.';
        if (/invalid login credentials/i.test(message)) {
            message = 'Incorrect email or password. Please try again.';
        } else if (/email not confirmed/i.test(message)) {
            message = 'Please verify your email before signing in. Check your inbox for the confirmation link.';
        } else if (/too many requests/i.test(message)) {
            message = 'Too many sign-in attempts. Please wait a moment and try again.';
        }
        return { success: false, error: message };
    }
}

// ─── Sign Out ─────────────────────────────────────────────────────
async function signOut() {
    try {
        const { error } = await supabaseClient.auth.signOut();
        if (error) throw error;
        return true;
    } catch (err) {
        console.error('Sign out error:', err);
        return false;
    }
}

// ─── Owner Data ───────────────────────────────────────────────────
/*
 * Looks up business_owners by auth email first.
 * Falls back to listing_id stored in auth user metadata if email lookup
 * returns no rows (e.g. owner changed email in Supabase but not in the row).
 */
async function getBusinessOwnerData() {
    try {
        const user = await getCurrentUser();
        if (!user) return null;

        // Primary lookup: owner_email matches auth email
        let { data, error } = await supabaseClient
            .from('business_owners')
            .select('*')
            .eq('owner_email', user.email);

        if (error) throw error;

        // Fallback: use listing_id stored in auth user metadata
        if (!data || data.length === 0) {
            const listingId = user.user_metadata?.listing_id;
            if (listingId) {
                const fallback = await supabaseClient
                    .from('business_owners')
                    .select('*')
                    .eq('listing_id', listingId);
                if (!fallback.error && fallback.data?.length) {
                    data = fallback.data;
                }
            }
        }

        return data || null;
    } catch (err) {
        console.error('Error getting business owner data:', err);
        return null;
    }
}

// ─── Update owner contact ─────────────────────────────────────────
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
        return { success: true, data, message: 'Contact information updated successfully' };
    } catch (err) {
        console.error('Update error:', err);
        return { success: false, error: err.message || 'Update failed' };
    }
}

// ─── Password helpers ─────────────────────────────────────────────
async function resetPassword(email) {
    try {
        const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/business?reset=true`,
        });
        if (error) throw error;
        return { success: true, message: 'Password reset email sent! Check your inbox.' };
    } catch (err) {
        console.error('Password reset error:', err);
        return { success: false, error: err.message || 'Password reset failed' };
    }
}

async function updatePassword(newPassword) {
    try {
        const { error } = await supabaseClient.auth.updateUser({ password: newPassword });
        if (error) throw error;
        return { success: true, message: 'Password updated successfully' };
    } catch (err) {
        console.error('Password update error:', err);
        return { success: false, error: err.message || 'Password update failed' };
    }
}

// ─── Auth state listener ──────────────────────────────────────────
function onAuthStateChange(callback) {
    supabaseClient.auth.onAuthStateChange((event, session) => {
        if (typeof callback === 'function') callback(event, session);
    });
}

// ─── Expose on window ─────────────────────────────────────────────
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
    onAuthStateChange,
};

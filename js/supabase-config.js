// supabase-config.js
/*
Copyright (C) The Greek Directory, 2025-present. All rights reserved.
This source code is proprietary and no part may not be used, reproduced, or distributed
without written permission from The Greek Directory. Unauthorized use, copying, modification,
or distribution of this code will result in legal action to the fullest extent permitted by law.
*/

const SUPABASE_URL      = 'https://luetekzqrrgdxtopzvqw.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx1ZXRla3pxcnJnZHh0b3B6dnF3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzNDc2NDcsImV4cCI6MjA4MzkyMzY0N30.TIrNG8VGumEJc_9JvNHW-Q-UWfUGpPxR0v8POjWZJYg';

// Auth redirects MUST use the production URL.
// Supabase only allows whitelisted origins on the recover/confirm endpoints.
// Preview deploy URLs (*.pages.dev) are NOT whitelisted and will return 500.
const PRODUCTION_URL = 'https://thegreekdirectory.org';

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
 *   'no-key-required'  → listing has no confirmation key; just verify it hasn't been claimed
 *   A real key string  → verify against business_owners.confirmation_key
 */
async function signUpBusinessOwner(email, password, listingId, confirmationKey, phone = null) {
    try {
        const noKeyRequired = confirmationKey === 'no-key-required';
        let ownerRecord = null;

        if (noKeyRequired) {
            const { data, error } = await supabaseClient
                .from('business_owners')
                .select('*')
                .eq('listing_id', listingId)
                .maybeSingle();

            if (error) throw new Error('Error verifying listing status. Please try again.');
            if (data?.owner_user_id) throw new Error('This listing has already been claimed.');
            ownerRecord = data; // may be null — that's fine
        } else {
            if (!confirmationKey) throw new Error('Confirmation key is required.');

            const { data, error } = await supabaseClient
                .from('business_owners')
                .select('*')
                .eq('listing_id', listingId)
                .eq('confirmation_key', confirmationKey)
                .maybeSingle();

            if (error) throw new Error('Error verifying confirmation key. Please try again.');
            if (!data)              throw new Error('Invalid confirmation key for this listing.');
            if (data.owner_user_id) throw new Error('This listing has already been claimed.');
            ownerRecord = data;
        }

        // Build a stable owner_user_id (not the Supabase auth UUID, which we don't know yet)
        const emailUsername = email.split('@')[0].replace(/[^a-z0-9]/gi, '').toLowerCase();
        const ownerUserId   = `${emailUsername}-${listingId}`;

        const { data: authData, error: signUpError } = await supabaseClient.auth.signUp({
            email,
            password,
            options: {
                // Always use the production URL for email-confirmation redirects
                emailRedirectTo: `${PRODUCTION_URL}/business`,
                data: {
                    listing_id:    listingId,
                    role:          'business_owner',
                    owner_user_id: ownerUserId,
                },
            },
        });

        if (signUpError) throw signUpError;

        const ownerPayload = {
            listing_id:       listingId,
            owner_user_id:    ownerUserId,
            owner_email:      email,
            owner_phone:      phone || null,
            confirmation_key: null, // clear so it can't be re-claimed
        };

        if (ownerRecord) {
            const { error: updateError } = await supabaseClient
                .from('business_owners')
                .update(ownerPayload)
                .eq('listing_id', listingId);
            if (updateError) console.warn('Could not update owner record:', updateError.message);
        } else {
            const { error: insertError } = await supabaseClient
                .from('business_owners')
                .insert(ownerPayload);
            if (insertError) console.warn('Could not insert owner record:', insertError.message);
        }

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
        return { success: true, user: data.user, session: data.session, message: 'Sign in successful!' };
    } catch (err) {
        console.error('Sign in error:', err);
        let message = err.message || 'Sign in failed. Please try again.';
        if (/invalid login credentials/i.test(message))  message = 'Incorrect email or password. Please try again.';
        if (/email not confirmed/i.test(message))         message = 'Please verify your email before signing in. Check your inbox.';
        if (/too many requests/i.test(message))           message = 'Too many sign-in attempts. Please wait a moment and try again.';
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
async function getBusinessOwnerData() {
    try {
        const user = await getCurrentUser();
        if (!user) return null;

        // Primary: match auth email → owner_email (auth email is source of truth)
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
                if (!fallback.error && fallback.data?.length) data = fallback.data;
            }
        }

        return data?.length ? data : null;
    } catch (err) {
        console.error('Error getting business owner data:', err);
        return null;
    }
}

// ─── Update owner contact ─────────────────────────────────────────
/*
 * Filters by listing_id rather than owner_email.
 * Filtering by email causes silent zero-row updates when auth email drifts
 * from the stored owner_email. listing_id is stable and uniquely identifies
 * the row that the RLS policy is scoped to.
 *
 * Throws a user-visible error when 0 rows are affected (RLS block, stale session).
 */
async function updateBusinessOwnerContact(updates) {
    try {
        const user = await getCurrentUser();
        if (!user) throw new Error('Not authenticated. Please sign in again.');

        // listing_id is always available from the in-memory ownerData loaded at sign-in
        const listingId = window.BP?.ownerData?.[0]?.listing_id;
        if (!listingId) throw new Error('Could not determine your listing. Please refresh the page.');

        console.log('Updating business_owners for listing_id:', listingId, updates);

        const { data, error } = await supabaseClient
            .from('business_owners')
            .update(updates)
            .eq('listing_id', listingId)
            .select();

        if (error) {
            console.error('updateBusinessOwnerContact DB error:', error);
            throw new Error(error.message || 'Database error while saving settings.');
        }

        if (!data || data.length === 0) {
            // The UPDATE ran but no rows matched — almost always an RLS policy block
            console.warn('updateBusinessOwnerContact: 0 rows updated. Possible RLS policy block or stale session.');
            throw new Error('Settings could not be saved — your session may have expired. Please sign out and sign back in, then try again.');
        }

        console.log('updateBusinessOwnerContact: updated', data.length, 'row(s)');
        return { success: true, data, message: 'Contact information updated successfully' };
    } catch (err) {
        console.error('Update owner contact error:', err);
        return { success: false, error: err.message || 'Update failed' };
    }
}

// ─── Password helpers ─────────────────────────────────────────────
async function resetPassword(email) {
    try {
        // MUST use the production URL here.
        // Supabase validates redirect_to against its allowed-list at send time.
        // Preview/staging URLs (*.pages.dev) are not whitelisted → 500 on the server.
        const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
            redirectTo: `${PRODUCTION_URL}/business?reset=true`,
        });
        if (error) throw error;
        return { success: true, message: 'Password reset email sent! Check your inbox.' };
    } catch (err) {
        console.error('Password reset error:', err);
        const raw = err.message || '';

        // Surface SMTP misconfiguration clearly — this is a server-side config issue,
        // not something the user did wrong.
        if (
            /Error sending recovery email/i.test(raw) ||
            /Authentication failed/i.test(raw) ||
            /535/i.test(raw) ||
            /smtp/i.test(raw)
        ) {
            return {
                success: false,
                error: 'Password reset emails are temporarily unavailable due to a mail server configuration issue. Please contact support at contact@thegreekdirectory.org to reset your password.',
            };
        }

        return { success: false, error: raw || 'Password reset failed. Please try again or contact support.' };
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

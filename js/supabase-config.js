// ============================================
// SUPABASE CLIENT CONFIGURATION - PART 1
// Initialization & Core Functions
// ============================================

const SUPABASE_URL = 'https://luetekzqrrgdxtopzvqw.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx1ZXRla3pxcnJnZHh0b3B6dnF3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzNDc2NDcsImV4cCI6MjA4MzkyMzY0N30.TIrNG8VGumEJc_9JvNHW-Q-UWfUGpPxR0v8POjWZJYg';

console.log('✅ Supabase configured correctly');
console.log('URL:', SUPABASE_URL);
console.log('Key valid:', SUPABASE_ANON_KEY.split('.').length === 3);

// Initialize Supabase client
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log('Supabase client initialized:', supabaseClient ? 'Success' : 'Failed');

// ============================================
// AUTHENTICATION UTILITIES
// ============================================

/**
 * Check if user is currently authenticated
 * @returns {Promise<Object|null>} User object or null
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

/**
 * Get current session
 * @returns {Promise<Object|null>} Session object or null
 */
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
// ============================================
// SUPABASE CLIENT CONFIGURATION - PART 2
// Sign Up & Sign In Functions
// ============================================

/**
 * Sign up a new business owner
 * @param {string} email - Business owner email
 * @param {string} password - Password
 * @param {string} listingId - Listing ID to link
 * @param {string} confirmationKey - Confirmation key for claiming
 * @param {string} phone - Optional phone number
 * @returns {Promise<Object>} Result object
 */
async function signUpBusinessOwner(email, password, listingId, confirmationKey, phone = null) {
    try {
        console.log('Starting signup for:', email, 'with listing:', listingId);
        
        // 1. Verify confirmation key matches listing
        const { data: ownerRecord, error: ownerCheckError } = await supabaseClient
            .from('business_owners')
            .select('*')
            .eq('listing_id', listingId)
            .eq('confirmation_key', confirmationKey)
            .single();
        
        if (ownerCheckError || !ownerRecord) {
            console.error('Invalid confirmation key:', ownerCheckError);
            throw new Error('Invalid confirmation key for this listing');
        }
        
        // Check if listing is already claimed
        if (ownerRecord.user_id) {
            throw new Error('This listing has already been claimed');
        }
        
        // 2. Sign up the user
        const { data: authData, error: signUpError } = await supabaseClient.auth.signUp({
            email: email,
            password: password,
            options: {
                emailRedirectTo: window.location.origin + '/business.html',
                data: {
                    listing_id: listingId,
                    role: 'business_owner'
                }
            }
        });

        if (signUpError) {
            console.error('Auth signup error:', signUpError);
            throw signUpError;
        }

        console.log('Auth signup successful, user ID:', authData.user.id);

        // 3. Update business_owners record with user_id and contact info
        const { data: updatedOwner, error: updateError } = await supabaseClient
            .from('business_owners')
            .update({
                user_id: authData.user.id,
                owner_email: email,
                owner_phone: phone
            })
            .eq('listing_id', listingId)
            .select()
            .single();

        if (updateError) {
            console.error('Update error:', updateError);
            throw updateError;
        }

        console.log('Business owner record updated:', updatedOwner);

        return {
            success: true,
            user: authData.user,
            session: authData.session,
            owner: updatedOwner,
            message: 'Sign up successful! You can now sign in.'
        };

    } catch (error) {
        console.error('Sign up error:', error);
        return {
            success: false,
            error: error.message || 'Sign up failed'
        };
    }
}

/**
 * Sign in a business owner
 * @param {string} email - Business owner email
 * @param {string} password - Password
 * @returns {Promise<Object>} Result object
 */
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

        // Get all business owner data for this user
        const { data: ownerData, error: ownerError } = await supabaseClient
            .from('business_owners')
            .select('*')
            .eq('user_id', data.user.id);

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
// ============================================
// SUPABASE CLIENT CONFIGURATION - PART 3
// Utility & Helper Functions
// ============================================

/**
 * Sign out current user
 * @returns {Promise<boolean>} Success status
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

/**
 * Get business owner data for current user
 * @returns {Promise<Array|null>} Owner data array or null
 */
async function getBusinessOwnerData() {
    try {
        const user = await getCurrentUser();
        if (!user) return null;

        const { data, error } = await supabaseClient
            .from('business_owners')
            .select('*')
            .eq('user_id', user.id);

        if (error) throw error;
        return data;

    } catch (error) {
        console.error('Error getting business owner data:', error);
        return null;
    }
}

/**
 * Update business owner contact info
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Result object
 */
async function updateBusinessOwnerContact(updates) {
    try {
        const user = await getCurrentUser();
        if (!user) throw new Error('Not authenticated');

        const { data, error } = await supabaseClient
            .from('business_owners')
            .update(updates)
            .eq('user_id', user.id)
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

/**
 * Reset password
 * @param {string} email - User email
 * @returns {Promise<Object>} Result object
 */
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

/**
 * Update password
 * @param {string} newPassword - New password
 * @returns {Promise<Object>} Result object
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

/**
 * Set up auth state change listener
 * @param {Function} callback - Callback function to handle auth changes
 */
function onAuthStateChange(callback) {
    supabaseClient.auth.onAuthStateChange((event, session) => {
        console.log('Auth state changed:', event);
        if (callback) callback(event, session);
    });
}

// Export functions for use in other scripts
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

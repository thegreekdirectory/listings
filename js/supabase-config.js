// ============================================
// SUPABASE CLIENT CONFIGURATION
// ============================================

const SUPABASE_URL = 'https://luetekzqrrgdxtopzvqw.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx1ZXRla3pxcnJnZHh0b3B6dnF3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzNDc2NDcsImV4cCI6MjA4MzkyMzY0N30.TIrNG8VGumEJc_9JvNHW-Q-UWfUGpPxR0v8POjWZJYg';

// GitHub Configuration - DO NOT EXPOSE IN PRODUCTION
// This should be handled server-side via Supabase Edge Functions
const GITHUB_OWNER = 'thegreekdirectory';
const GITHUB_REPO = 'listings';
const DATABASE_PATH = 'listings-database.json';

// Initialize Supabase client
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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

/**
 * Sign up a new business owner
 * @param {string} email - Business owner email
 * @param {string} password - Password
 * @param {string} listingId - Listing ID to link
 * @param {string} phone - Optional phone number
 * @returns {Promise<Object>} Result object
 */
async function signUpBusinessOwner(email, password, listingId, phone = null) {
    try {
        // 1. Sign up the user
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

        if (signUpError) throw signUpError;

        // 2. Create business_owners record
        const { data: ownerData, error: insertError } = await supabaseClient
            .from('business_owners')
            .insert({
                user_id: authData.user.id,
                listing_id: listingId,
                owner_email: email,
                owner_phone: phone,
                email_visible: false,
                phone_visible: false
            })
            .select()
            .single();

        if (insertError) throw insertError;

        return {
            success: true,
            user: authData.user,
            session: authData.session,
            owner: ownerData,
            message: 'Sign up successful! Please check your email to verify your account.'
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
        const { data, error } = await supabaseClient.auth.signInWithPassword({
            email: email,
            password: password
        });

        if (error) throw error;

        // Get business owner data
        const { data: ownerData, error: ownerError } = await supabaseClient
            .from('business_owners')
            .select('*')
            .eq('user_id', data.user.id)
            .single();

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
 * @returns {Promise<Object|null>} Owner data or null
 */
async function getBusinessOwnerData() {
    try {
        const user = await getCurrentUser();
        if (!user) return null;

        const { data, error } = await supabaseClient
            .from('business_owners')
            .select('*')
            .eq('user_id', user.id)
            .single();

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
            .select()
            .single();

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

// ============================================
// GITHUB INTEGRATION
// ============================================

/**
 * Update GitHub file (called from business portal)
 * This uses Supabase Service Role Key stored server-side
 * @param {string} owner - GitHub owner
 * @param {string} repo - GitHub repo
 * @param {string} path - File path
 * @param {string} content - File content
 * @param {string} message - Commit message
 * @returns {Promise<Object>} Result object
 */
async function updateGitHubFile(owner, repo, path, content, message) {
    try {
        // In production, this should call a Supabase Edge Function
        // that handles GitHub API calls server-side
        // For now, we'll use the approach where GitHub token is stored in Supabase secrets
        
        console.log('Updating GitHub file:', path);
        
        // Get current file SHA
        const fileInfoResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
            headers: {
                'Accept': 'application/vnd.github.v3+json'
            }
        });
        
        if (!fileInfoResponse.ok) {
            throw new Error(`Failed to fetch file info: ${fileInfoResponse.status}`);
        }
        
        const fileInfo = await fileInfoResponse.json();
        const currentSha = fileInfo.sha;
        
        // This should be handled by a Supabase Edge Function in production
        // The Edge Function would have the GitHub token in environment variables
        // For now, we'll return an error asking to use admin portal
        
        return {
            success: false,
            error: 'GitHub updates from business portal require admin setup. Please contact administrator to update listing, or use the admin portal.'
        };

    } catch (error) {
        console.error('GitHub update error:', error);
        return {
            success: false,
            error: error.message || 'GitHub update failed'
        };
    }
}

// ============================================
// AUTH STATE LISTENER
// ============================================

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
    onAuthStateChange,
    updateGitHubFile
};

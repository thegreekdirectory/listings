const DEFAULT_BAD_WORDS = ['badword1', 'badword2'];

export function findProfanity(input = '', customWords = DEFAULT_BAD_WORDS) {
  const normalized = ` ${input.toLowerCase()} `;
  return customWords.filter((word) => normalized.includes(` ${word.toLowerCase()} `));
}

export function evaluateContentForModeration(contentText, currentStatus = 'draft') {
  const hits = findProfanity(contentText);
  if (hits.length) {
    return {
      status: 'flagged',
      flaggedWords: hits,
      message: 'Your post is under review. If you believe this is an error, Submit Appeal.'
    };
  }

  return { status: currentStatus, flaggedWords: [], message: '' };
}

export async function submitAppeal(supabaseClient, payload) {
  return supabaseClient.from('moderation_appeals').insert(payload);
}

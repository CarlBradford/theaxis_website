// Simple profanity filter for frontend use
class FrontendProfanityFilter {
  constructor() {
    // Common profanity words - subset for frontend
    this.profanityWords = [
      // Mild profanity
      'damn', 'hell', 'crap', 'stupid', 'idiot', 'moron', 'dumb', 'dumbass',
      'fool', 'loser', 'jerk', 'freak', 'weirdo', 'creep', 'pervert',
      
      // Strong profanity
      'bullshit', 'bullsh*t', 'bull****', 'shit', 'sh*t', 'sh**', 'fuck', 'f*ck', 'f**k',
      'fucking', 'f*cking', 'f**king', 'fucked', 'f*cked', 'f**ked', 'fucker', 'f*cker',
      'fuckers', 'f*ckers', 'bitch', 'b*tch', 'b**ch', 'bitches', 'bitching', 'ass',
      'a*s', 'a**', 'asshole', 'a*shole', 'assholes', 'bastard', 'bast*rds', 'piss',
      'p*ss', 'pissed', 'pissing', 'suck', 's*ck', 'sucks', 'sucking', 'sucker',
      'suckers', 'cunt', 'c*nt', 'c**t', 'cunts', 'whore', 'wh*re', 'whores',
      'slut', 'sl*ts', 'sluts',
      
      // Sexual/Inappropriate
      'porn', 'porno', 'pornography', 'sex', 'sexual', 'nude', 'naked',
      'masturbate', 'masturbation', 'orgasm', 'penis', 'vagina', 'breast',
      'boob', 'boobs', 'tits', 'titties', 'dick', 'cock', 'pussy',
      
      // Violence/Threats
      'kill', 'killing', 'murder', 'murderer', 'death', 'die', 'dying',
      'suicide', 'bomb', 'bombing', 'terrorist', 'terrorism', 'weapon',
      'gun', 'guns', 'shoot', 'shooting', 'stab', 'stabbing', 'knife',
      
      // Drugs/Alcohol
      'drug', 'drugs', 'cocaine', 'heroin', 'marijuana', 'weed', 'cannabis',
      'alcohol', 'drunk', 'drinking', 'beer', 'wine', 'vodka', 'whiskey',
      
      // Racial/Offensive
      'nigger', 'nigga', 'negro', 'chink', 'gook', 'kike', 'spic', 'wetback',
      'fag', 'faggot', 'faggy', 'dyke', 'lesbo', 'tranny', 'retard', 'retarded',
      'homo', 'homosexual', 'gay', 'lesbian', 'transgender', 'disabled',
      
      // Additional offensive terms
      'hate', 'hater', 'hating', 'racist', 'racism', 'sexist', 'sexism',
      'discrimination', 'prejudice', 'bigot', 'bigotry', 'intolerant',
      
      // Filipino/Tagalog profanity
      'putang', 'putangina', 'puta', 'puta ka', 'tangina', 'tang ina',
      'gago', 'gaga', 'bobo', 'boba', 'tanga', 'tanga ka', 'ulol',
      'tarantado', 'tarantada', 'walanghiya', 'walang hiya', 'bastos',
      'malandi', 'pokpok', 'kalapati', 'bayot', 'bakla', 'tomboy',
      'sira ulo', 'siraulo', 'loko', 'loka', 'baliw', 'baliw ka',
      'kupal', 'kupal ka', 'leche', 'lechugas', 'pakyu', 'pakyu ka',
      'hayop', 'hayop ka', 'buang', 'buang ka', 'buwisit', 'buwisit ka',
      'nakakainis', 'nakakairita', 'irita', 'inis', 'galit', 'galit ka',
      'sira', 'sira ka', 'bulok', 'bulok ka', 'walang kwenta'
    ];
    
    // Create a regex pattern for all profanity words
    // Escape special regex characters in the words
    const escapedWords = this.profanityWords.map(word => 
      word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    );
    this.profanityPattern = new RegExp(`\\b(${escapedWords.join('|')})\\b`, 'gi');
  }

  // Check if text contains profanity
  containsProfanity(text) {
    if (!text || typeof text !== 'string') return false;
    return this.profanityPattern.test(text);
  }

  // Get profane words found in text
  getProfaneWords(text) {
    if (!text || typeof text !== 'string') return [];
    
    const matches = text.match(this.profanityPattern);
    return matches ? [...new Set(matches.map(word => word.toLowerCase()))] : [];
  }

  // Moderate comment and return result
  moderateComment(text) {
    if (!text || typeof text !== 'string') {
      return {
        blocked: false,
        reason: null,
        flaggedWords: []
      };
    }

    const flaggedWords = this.getProfaneWords(text);
    
    if (flaggedWords.length > 0) {
      return {
        blocked: true,
        reason: `Inappropriate content detected: ${flaggedWords.join(', ')}`,
        flaggedWords: flaggedWords
      };
    }

    return {
      blocked: false,
      reason: null,
      flaggedWords: []
    };
  }

  // Clean text by replacing profanity with asterisks
  clean(text) {
    if (!text || typeof text !== 'string') return text;
    
    return text.replace(this.profanityPattern, (match) => {
      return '*'.repeat(match.length);
    });
  }
}

// Export for use in components
export default FrontendProfanityFilter;

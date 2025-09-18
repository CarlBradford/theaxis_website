class ProfanityFilter {
  constructor() {
    // Common profanity words - expanded list
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
      
      // Filipino/Tagalog profanity and inappropriate words
      'putang', 'putangina', 'puta', 'puta ka', 'tangina', 'tang ina',
      'gago', 'gaga', 'bobo', 'boba', 'tanga', 'tanga ka', 'ulol',
      'tarantado', 'tarantada', 'walanghiya', 'walang hiya', 'bastos',
      'malandi', 'pokpok', 'kalapati', 'bayot', 'bakla', 'tomboy',
      'sira ulo', 'siraulo', 'loko', 'loka', 'baliw', 'baliw ka',
      'kupal', 'kupal ka', 'leche', 'lechugas', 'pakyu', 'pakyu ka',
      'hayop', 'hayop ka', 'buang', 'buang ka', 'buwisit', 'buwisit ka',
      'nakakainis', 'nakakairita', 'irita', 'inis', 'galit', 'galit ka',
      'sira', 'sira ka', 'bulok', 'bulok ka', 'walang kwenta',
      'walang kwenta ka', 'walang silbi', 'walang silbi ka'
    ];
    
    // Custom words for spam and inappropriate content
    this.customWords = [
      'spam', 'scam', 'fake', 'bot', 'hack', 'phishing', 'phisher',
      'malware', 'virus', 'trojan', 'keylogger', 'backdoor', 'rootkit',
      'clickbait', 'scammer', 'fraud', 'fraudulent', 'illegal', 'pirate',
      'piracy', 'torrent', 'crack', 'hacked', 'hacker', 'hacking'
    ];
    
    // Combine all words
    this.allWords = [...this.profanityWords, ...this.customWords];
  }

  /**
   * Check if text contains profanity
   * @param {string} text - Text to check
   * @returns {boolean} - True if profanity detected
   */
  containsProfanity(text) {
    if (!text || typeof text !== 'string') {
      return false;
    }
    
    const lowerText = text.toLowerCase();
    return this.allWords.some(word => lowerText.includes(word));
  }

  /**
   * Get profanity-detected words
   * @param {string} text - Text to check
   * @returns {Array} - Array of profane words found
   */
  getProfaneWords(text) {
    if (!text || typeof text !== 'string') {
      return [];
    }
    
    const lowerText = text.toLowerCase();
    const foundWords = [];
    
    this.allWords.forEach(word => {
      if (lowerText.includes(word)) {
        foundWords.push(word);
      }
    });
    
    return foundWords;
  }

  /**
   * Clean text by replacing profane words with asterisks
   * @param {string} text - Text to clean
   * @returns {string} - Cleaned text
   */
  clean(text) {
    if (!text || typeof text !== 'string') {
      return text;
    }
    
    let cleanedText = text;
    
    this.allWords.forEach(word => {
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      cleanedText = cleanedText.replace(regex, '*'.repeat(word.length));
    });
    
    return cleanedText;
  }

  /**
   * Check comment content for moderation flags
   * @param {string} content - Comment content
   * @param {string} name - Commenter name
   * @param {string} email - Commenter email
   * @returns {Object} - Moderation result
   */
  moderateComment(content, name = '', email = '') {
    const result = {
      isClean: true,
      flaggedWords: [],
      moderationReason: null,
      shouldBlock: false,
      shouldFlag: false
    };

    // Check content for profanity
    if (this.containsProfanity(content)) {
      result.isClean = false;
      result.flaggedWords = this.getProfaneWords(content);
      result.moderationReason = `Profanity detected: ${result.flaggedWords.join(', ')}`;
      result.shouldBlock = true;
    }

    // Check name for profanity
    if (name && this.containsProfanity(name)) {
      result.isClean = false;
      result.flaggedWords.push(...this.getProfaneWords(name));
      result.moderationReason = result.moderationReason 
        ? `${result.moderationReason}; Inappropriate name`
        : 'Inappropriate name detected';
      result.shouldBlock = true;
    }

    // Check for spam patterns
    if (this.isSpam(content)) {
      result.isClean = false;
      result.moderationReason = result.moderationReason 
        ? `${result.moderationReason}; Spam detected`
        : 'Spam content detected';
      result.shouldFlag = true;
    }

    // Check for excessive caps (shouting)
    if (this.isExcessiveCaps(content)) {
      result.isClean = false;
      result.moderationReason = result.moderationReason 
        ? `${result.moderationReason}; Excessive caps`
        : 'Excessive use of capital letters';
      result.shouldFlag = true;
    }

    return result;
  }

  /**
   * Check if content appears to be spam
   * @param {string} content - Content to check
   * @returns {boolean} - True if spam detected
   */
  isSpam(content) {
    if (!content) return false;
    
    const spamPatterns = [
      /(http|https|www\.)/gi, // URLs
      /(click here|buy now|free money|make money)/gi, // Common spam phrases
      /(bit\.ly|tinyurl|short\.link)/gi, // URL shorteners
      /(viagra|cialis|pharmacy)/gi, // Common spam keywords
    ];

    return spamPatterns.some(pattern => pattern.test(content));
  }

  /**
   * Check for excessive use of capital letters
   * @param {string} content - Content to check
   * @returns {boolean} - True if excessive caps detected
   */
  isExcessiveCaps(content) {
    if (!content) return false;
    
    const words = content.split(/\s+/);
    const capsWords = words.filter(word => 
      word.length > 2 && word === word.toUpperCase() && /[A-Z]/.test(word)
    );
    
    // If more than 30% of words are in caps, flag it
    return capsWords.length > words.length * 0.3;
  }
}

module.exports = ProfanityFilter;

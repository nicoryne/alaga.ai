/**
 * Simple translation utility for medical precautions and actions
 * This is a temporary solution until the translator model is available
 */

export type PreferredLanguage = 'English' | 'Tagalog' | 'Cebuano'

/**
 * Translation dictionary for common medical phrases
 */
const translations: Record<
  PreferredLanguage,
  Record<string, string>
> = {
  English: {},
  Tagalog: {
    // Critical actions
    'Refer to nearest hospital immediately.': 'Pumunta sa pinakamalapit na ospital kaagad.',
    'Monitor airway, breathing, and circulation.': 'Bantayan ang daanan ng hangin, paghinga, at sirkulasyon.',
    'Do not delay seeking emergency medical care.': 'Huwag mag-antala sa paghahanap ng emergency medical care.',
    
    // Moderate actions
    'Schedule a clinic follow-up within 24 hours.': 'Mag-schedule ng follow-up sa clinic sa loob ng 24 na oras.',
    'Provide hydration and monitor vitals regularly.': 'Magbigay ng hydration at bantayan ang vital signs nang regular.',
    'Monitor breathing and seek care if symptoms worsen.': 'Bantayan ang paghinga at humingi ng tulong kung lumala ang sintomas.',
    
    // Mild actions
    'Advise rest and hydration.': 'Magpahinga at uminom ng tubig.',
    'Reassess if symptoms persist beyond 48 hours.': 'Mag-reassess kung magpapatuloy ang sintomas pagkatapos ng 48 oras.',
    'Over-the-counter cold medications may help.': 'Maaaring makatulong ang over-the-counter na gamot sa sipon.',
    
    // General phrases
    'Please ensure all symptoms are entered correctly.': 'Pakisiguro na lahat ng sintomas ay tama ang naipasok.',
    'Try again or consult a healthcare provider.': 'Subukan ulit o kumonsulta sa healthcare provider.',
  },
  Cebuano: {
    // Critical actions
    'Refer to nearest hospital immediately.': 'Adto dayon sa pinakaduol nga ospital.',
    'Monitor airway, breathing, and circulation.': 'Bantayi ang agianan sa hangin, pagginhawa, ug sirkulasyon.',
    'Do not delay seeking emergency medical care.': 'Ayaw paglangan sa pagpangita og emergency medical care.',
    
    // Moderate actions
    'Schedule a clinic follow-up within 24 hours.': 'Mag-schedule og follow-up sa clinic sulod sa 24 ka oras.',
    'Provide hydration and monitor vitals regularly.': 'Hatagi og hydration ug bantayi ang vital signs kanunay.',
    'Monitor breathing and seek care if symptoms worsen.': 'Bantayi ang pagginhawa ug mangayo og tabang kung molala ang sintomas.',
    
    // Mild actions
    'Advise rest and hydration.': 'Pahulay ug inom og tubig.',
    'Reassess if symptoms persist beyond 48 hours.': 'Mag-reassess kung magpadayon ang sintomas human sa 48 ka oras.',
    'Over-the-counter cold medications may help.': 'Makatabang ang over-the-counter nga tambal sa sip-on.',
    
    // General phrases
    'Please ensure all symptoms are entered correctly.': 'Palihug siguroha nga tanan nga sintomas tama ang naipasok.',
    'Try again or consult a healthcare provider.': 'Sulayi pag-usab o mangonsulta sa healthcare provider.',
  },
}

/**
 * Translates a medical action/precaution to the patient's preferred language
 * Falls back to English if translation not found
 */
export function translateAction(
  action: string,
  language: PreferredLanguage,
): string {
  if (language === 'English') {
    return action
  }

  const translation = translations[language]?.[action]
  return translation || action // Fallback to English if not found
}

/**
 * Translates an array of actions/precautions
 */
export function translateActions(
  actions: string[],
  language: PreferredLanguage,
): string[] {
  return actions.map((action) => translateAction(action, language))
}


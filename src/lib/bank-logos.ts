export const bankLogos: { [key: string]: string } = {
    "Itau": "https://images.seeklogo.com/logo-png/7/2/itau-logo-png_seeklogo-74123.png",
    "Itaú": "https://images.seeklogo.com/logo-png/7/2/itau-logo-png_seeklogo-74123.png",
    "Bradesco": "https://img.logo.us/logo/bradesco.svg",
    "Nubank": "https://logodownload.org/wp-content/uploads/2019/08/nubank-logo-2-1.png",
    "Santander": "https://img.logo.us/logo/santander.svg",
    "Banco do Brasil": "https://img.logo.us/logo/banco-do-brasil.svg",
    "BB": "https://img.logo.us/logo/banco-do-brasil.svg",
    "Inter": "https://upload.wikimedia.org/wikipedia/commons/f/fa/Banco_Inter_logo.svg",
    "Banco Inter": "https://upload.wikimedia.org/wikipedia/commons/f/fa/Banco_Inter_logo.svg",
    "C6": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQAdb6wCFEOzVXR0WHXSOLsjjWTwWL0u1-FTw&s",
    "C6 Bank": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQAdb6wCFEOzVXR0WHXSOLsjjWTwWL0u1-FTw&s",
    "XP": "https://upload.wikimedia.org/wikipedia/commons/7/77/XP_Investimentos_logo.svg",
    "XP Investimentos": "https://upload.wikimedia.org/wikipedia/commons/7/77/XP_Investimentos_logo.svg",
    "BTG": "https://upload.wikimedia.org/wikipedia/commons/8/87/BTG_Pactual_logo.svg",
    "BTG Pactual": "https://upload.wikimedia.org/wikipedia/commons/8/87/BTG_Pactual_logo.svg",
    "Caixa": "https://img.logo.us/logo/caixa.svg",
    "Caixa Econômica": "https://img.logo.us/logo/caixa.svg",
    "Mastercard": "https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg",
    "Visa": "https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg",
    "Amex": "https://upload.wikimedia.org/wikipedia/commons/3/30/American_Express_logo.svg",
    "Elo": "https://upload.wikimedia.org/wikipedia/commons/8/88/Elo_logo.png",
    "Hipercard": "https://upload.wikimedia.org/wikipedia/commons/f/fa/Hipercard_logo.svg",
    "Sofisa": "https://media.licdn.com/dms/image/v2/C4D0BAQE03r8450RgmA/company-logo_200_200/company-logo_200_200/0/1630539085235/banco_sofisadireto_logo?e=2147483647&v=beta&t=jX33yqfJ3lYK1QcJ1_whx0AQysAUMOJmWlTfgE6lsKo"
};

export function getBankLogo(name: string): string | null {
    if (!name) return null;

    // Direct match
    if (bankLogos[name]) return bankLogos[name];

    // Case insensitive match
    const lowerName = name.toLowerCase();
    const key = Object.keys(bankLogos).find(k => k.toLowerCase() === lowerName);
    if (key) return bankLogos[key];

    // Partial match (e.g. "Conta Itau" -> "Itau")
    const partialKey = Object.keys(bankLogos).find(k => lowerName.includes(k.toLowerCase()));
    if (partialKey) return bankLogos[partialKey];

    return null;
}

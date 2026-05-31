import OpenAI from 'openai';

export const getOpenAIClient = () => {
  if (!process.env.OPENAI_API_KEY) {
    // On retourne null ou on gère l'erreur pour ne pas bloquer le build statique
    return null;
  }
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
};

-- Ajoute la colonne audio_url à la table vocabulary pour le bouton d'écoute
-- de la page /tef-irn/vocab. Les fichiers audio seront générés hors ligne
-- (pipeline TTS Gemini, script generate_vocab_audio.py) et uploadés dans le
-- bucket Supabase Storage 'vocab-audio' (à créer manuellement par Olivier
-- dans le dashboard Supabase, public en lecture, comme 'co-audio').
-- audio_url reste NULL pour les mots pas encore traités par la pipeline —
-- le front doit gérer ce cas (bouton désactivé ou masqué).

ALTER TABLE public.vocabulary ADD COLUMN IF NOT EXISTS audio_url text;

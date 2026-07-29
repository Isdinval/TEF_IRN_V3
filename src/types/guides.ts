export type GuideType = 'complet' | 'thematique' | 'astuces' | 'methodologie';
export type GuideProduct = 'tef-irn' | 'examen-civique';
export type GuideSiloRole = 'hub' | 'pilier' | 'satellite';

export interface Guide {
  id: string;
  slug: string;
  title: string;
  parcours_id: string | null;
  level: string | null;
  category: string | null;
  type: GuideType;
  product: GuideProduct;
  silo_role: GuideSiloRole;
  description: string | null;
  content: string | null;
  reading_time: number | null;
  image_url: string | null;
  image_caption: string | null;
  icon: string | null;
  is_published: boolean;
  created_at: string;
  updated_at: string;
  key_points?: string[];
}

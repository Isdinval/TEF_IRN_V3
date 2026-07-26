import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, ArrowRight, BookOpen, Mic, FileText, Cpu, GraduationCap, Scale, Zap, Target } from 'lucide-react';
import { Guide } from '@/types/guides';

type GuideCardAccent = 'blue' | 'indigo';

interface GuideCardProps {
  guide: Guide;
  /** Route de base du guide (sans le slug). Par défaut celle des guides TEF IRN. */
  hrefBase?: string;
  /** Couleur d'accent (hover, lien "Lire le guide"...). Par défaut le bleu TEF IRN. */
  accent?: GuideCardAccent;
  /** "_blank" pour ne pas faire quitter une session en cours (ex. examen civique). */
  target?: '_self' | '_blank';
}

const iconMap: Record<string, any> = {
  'BookOpen': BookOpen,
  'Mic': Mic,
  'FileText': FileText,
  'Cpu': Cpu,
  'GraduationCap': GraduationCap,
  'Scale': Scale,
  'Zap': Zap,
  'Target': Target,
};

// Classes Tailwind complètes (pas de template littéral sur la couleur) pour rester compatibles
// avec la détection JIT de Tailwind.
const ACCENT_STYLES: Record<GuideCardAccent, { titleHover: string; link: string; defaultIcon: string }> = {
  blue: {
    titleHover: 'group-hover:text-blue-600',
    link: 'text-blue-600 hover:text-blue-700 hover:bg-blue-50',
    defaultIcon: 'text-blue-500 bg-blue-50',
  },
  indigo: {
    titleHover: 'group-hover:text-indigo-600',
    link: 'text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50',
    defaultIcon: 'text-indigo-500 bg-indigo-50',
  },
};

const GuideCard: React.FC<GuideCardProps> = ({ guide, hrefBase = '/tef-irn/guides', accent = 'blue', target = '_self' }) => {
  const IconComponent = iconMap[guide.icon || 'BookOpen'] || BookOpen;
  const styles = ACCENT_STYLES[accent];

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'complet': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'thematique': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'astuces': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'methodologie': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  // La distinction orale/écrite ne concerne que les guides TEF IRN — pour l'accent "indigo"
  // (examen civique), on garde une icône uniforme plutôt que d'appliquer une sémantique
  // qui ne correspond à rien pour ces catégories (naturalisation-civique, csp-civique...).
  const getCategoryIconColor = (category: string | null) => {
    if (accent === 'indigo') return styles.defaultIcon;
    if (!category) return 'text-blue-500 bg-blue-50';
    if (category.includes('orale')) return 'text-indigo-500 bg-indigo-50';
    if (category.includes('ecrite')) return 'text-emerald-500 bg-emerald-50';
    return 'text-blue-500 bg-blue-50';
  };

  return (
    <Link
      href={`${hrefBase}/${guide.slug}`}
      target={target}
      rel={target === '_blank' ? 'noopener noreferrer' : undefined}
      className="block h-full"
    >
      <Card className="flex flex-col h-full hover:shadow-lg transition-all duration-300 border-gray-100 overflow-hidden group rounded-[2rem]">
        {guide.image_url ? (
          <div className="h-48 overflow-hidden">
            <img
              src={guide.image_url}
              alt={guide.title}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
            />
          </div>
        ) : (
          <div className={`h-48 flex items-center justify-center ${getCategoryIconColor(guide.category)}`}>
            <IconComponent size={64} strokeWidth={1.5} className="group-hover:scale-110 transition-transform duration-300" />
          </div>
        )}
        <CardHeader className="space-y-1">
          <div className="flex justify-between items-start mb-2">
            <Badge variant="outline" className={`capitalize ${getTypeColor(guide.type)}`}>
              {guide.type}
            </Badge>
            {guide.level && (
               <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">
                 {guide.level}
               </span>
            )}
          </div>
          <CardTitle className={`text-xl transition-colors font-black ${styles.titleHover}`}>
            {guide.title}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-grow">
          <CardDescription className="text-gray-600 line-clamp-3 font-medium">
            {guide.description}
          </CardDescription>
        </CardContent>
        <CardFooter className="flex justify-between items-center pt-4 border-t border-gray-50">
          <div className="flex items-center text-sm text-gray-500">
            <Clock size={14} className="mr-1" />
            {guide.reading_time} min
          </div>
          <span className={`inline-flex items-center p-0 group/btn font-bold text-sm ${styles.link}`}>
            Lire le guide <ArrowRight size={16} className="ml-1 group-hover/btn:translate-x-1 transition-transform" />
          </span>
        </CardFooter>
      </Card>
    </Link>
  );
};

export default GuideCard;

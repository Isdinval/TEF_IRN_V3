import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, ArrowRight, BookOpen, Mic, FileText, Cpu, GraduationCap, Scale, Zap, Target } from 'lucide-react';
import { Guide } from '@/types/guides';

interface GuideCardProps {
  guide: Guide;
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

const GuideCard: React.FC<GuideCardProps> = ({ guide }) => {
  const IconComponent = iconMap[guide.icon || 'BookOpen'] || BookOpen;

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'complet': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'thematique': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'astuces': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'methodologie': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getCategoryIconColor = (category: string | null) => {
    if (!category) return 'text-blue-500 bg-blue-50';
    if (category.includes('orale')) return 'text-indigo-500 bg-indigo-50';
    if (category.includes('ecrite')) return 'text-emerald-500 bg-emerald-50';
    return 'text-blue-500 bg-blue-50';
  };

  return (
    <Card className="flex flex-col h-full hover:shadow-lg transition-all duration-300 border-gray-100 overflow-hidden group rounded-[2rem]">
      <div className={`h-48 flex items-center justify-center ${getCategoryIconColor(guide.category)}`}>
        <IconComponent size={64} strokeWidth={1.5} className="group-hover:scale-110 transition-transform duration-300" />
      </div>
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
        <CardTitle className="text-xl group-hover:text-blue-600 transition-colors font-black">
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
        <Link href={`/tef-irn/guides/${guide.slug}`} passHref>
          <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 p-0 group/btn font-bold">
            Lire le guide <ArrowRight size={16} className="ml-1 group-hover/btn:translate-x-1 transition-transform" />
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
};

export default GuideCard;


import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2, Globe, Users } from 'lucide-react';

interface CompanyOverviewProps {
  profile: any;
}

const CompanyOverview: React.FC<CompanyOverviewProps> = ({ profile }) => {
  if (!profile) return null;

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  return (
    <Card className="liquid-glass mb-6">
      <CardHeader>
        <CardTitle className="glass-subheading flex items-center">
          <Building2 className="h-5 w-5 mr-2" />
          Company Overview
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <p className="glass-body leading-relaxed mb-4">
              {profile.description}
            </p>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary" className="flex items-center font-light">
                <Building2 className="h-3 w-3 mr-1" />
                {profile.sector}
              </Badge>
              <Badge variant="outline" className="flex items-center font-light">
                <Globe className="h-3 w-3 mr-1" />
                {profile.industry}
              </Badge>
            </div>
          </div>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground font-light">CEO</p>
                <p className="font-light tracking-tight">{profile.ceo}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground font-light">Employees</p>
                <p className="font-light tracking-tight flex items-center">
                  <Users className="h-4 w-4 mr-1" />
                  {profile.employees ? formatNumber(profile.employees) : 'N/A'}
                </p>
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground font-light">Headquarters</p>
              <p className="font-light tracking-tight">{profile.country}</p>
            </div>
            {profile.website && (
              <div>
                <p className="text-sm text-muted-foreground font-light">Website</p>
                <a 
                  href={profile.website} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="glass-accent hover:underline font-light"
                >
                  {profile.website.replace('https://', '').replace('www.', '')}
                </a>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CompanyOverview;

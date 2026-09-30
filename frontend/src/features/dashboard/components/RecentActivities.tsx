import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ActivityLog } from '../types/dashboard.types';
import { getInitials, getImageUrl, formatDateTime } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Activity } from 'lucide-react';

const actionColors: Record<string, string> = {
  LOGIN: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  LOGOUT: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
  CREATE_EMPLOYEE: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  UPDATE_EMPLOYEE: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  DELETE_EMPLOYEE: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',
  ACTIVATE_EMPLOYEE: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  DEACTIVATE_EMPLOYEE: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
  RESET_PASSWORD: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
  CHANGE_PASSWORD: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300',
  CREATE_ROLE: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300',
  UPDATE_ROLE: 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300',
  DELETE_ROLE: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',
};

interface RecentActivitiesProps {
  activities: ActivityLog[];
  isLoading?: boolean;
}

export function RecentActivities({ activities, isLoading }: RecentActivitiesProps) {
  return (
    <Card className="crm-card overflow-hidden">
      <div className="flex items-center justify-between p-5 border-b">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-muted-foreground" />
          <h3 className="font-semibold text-sm">Recent Activity</h3>
        </div>
        <span className="text-xs text-muted-foreground">Last 20 actions</span>
      </div>

      <ScrollArea className="flex-1" style={{ height: '380px' }}>
        {isLoading ? (
          <div className="p-4 space-y-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-start gap-3">
                <Skeleton className="w-8 h-8 rounded-full shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3.5 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : activities.length === 0 ? (
          <div className="flex items-center justify-center h-full py-12 text-sm text-muted-foreground">
            No activity yet
          </div>
        ) : (
          <div className="p-4 space-y-4">
            {activities.map((activity) => (
              <div key={activity._id} className="flex items-start gap-3">
                <Avatar className="w-8 h-8 shrink-0">
                  <AvatarImage src={getImageUrl(activity.user?.profileImage)} />
                  <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                    {getInitials(activity.user?.name || 'U')}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium truncate">
                      {activity.user?.name || 'Unknown'}
                    </span>
                    <span
                      className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${
                        actionColors[activity.action] || 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {activity.action?.replace(/_/g, ' ') || 'Unknown'}
                    </span>
                  </div>
                  {activity.description && (
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">
                      {activity.description}
                    </p>
                  )}
                  <p className="text-[11px] text-muted-foreground/60 mt-0.5">
                    {formatDateTime(activity.createdAt)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </Card>
  );
}
